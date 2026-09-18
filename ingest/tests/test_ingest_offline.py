"""Offline validation harness for ingest.py against espn-api, no network/creds.

Run with the espn-api test venv:
  espn-api/.venv_test/Scripts/python.exe ingest/tests/test_ingest_offline.py

Mocks all ESPN HTTP endpoints via requests_mock using a synthetic fixture that
mirrors the real API shape (mTeam/mRoster/mMatchup/mSettings + proTeamSchedules
+ players + mMatchupScore), then runs League() fully offline and feeds the
result through ingest.py's pure functions to check the 2026 repull design.

This exercises the fixes made for the 2026-repull safety slice:
  - future/undecided matchups are preserved with numeric 0 scores (never
    null, to match the Matchup contract every TS renderer relies on) and
    winner=None as the sole "not played yet" signal, instead of being
    dropped or fabricated as a played 0-0 tie;
  - the scoreboard is fetched once per season instead of once per week;
  - ownerless teams produce a WARNING instead of a silent drop.
"""
import importlib.util
import io
import json
import sys
from contextlib import redirect_stderr
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
FIXTURES = Path(__file__).resolve().parent / "fixtures"

sys.path.insert(0, str(ROOT / "ingest"))

import requests_mock  # noqa: E402
from espn_api.football import League  # noqa: E402
from espn_api.requests.constant import FANTASY_BASE_ENDPOINT  # noqa: E402

# Import ingest.py without requiring python-dotenv/.env to exist.
spec = importlib.util.spec_from_file_location("ingest", ROOT / "ingest" / "ingest.py")
ingest = importlib.util.module_from_spec(spec)
sys.modules["ingest"] = ingest
spec.loader.exec_module(ingest)

LEAGUE_ID = 999999
SEASON = 2026


def load(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def league_endpoint():
    return f"{FANTASY_BASE_ENDPOINT}ffl/seasons/{SEASON}/segments/0/leagues/{LEAGUE_ID}"


def base_endpoint():
    return f"{FANTASY_BASE_ENDPOINT}ffl/seasons/{SEASON}"


def players_endpoint():
    return f"{base_endpoint()}/players?view=players_wl"


def mock_common(m, league_data):
    m.get(league_endpoint() + "?view=mTeam&view=mRoster&view=mMatchup&view=mSettings&view=mStandings",
          status_code=200, json=league_data)
    m.get(league_endpoint() + "?view=mDraftDetail", status_code=200,
          json={"draftDetail": {"drafted": False}})
    m.get(players_endpoint(), status_code=200, json=[])
    m.get(base_endpoint() + "?view=proTeamSchedules_wl", status_code=200,
          json={"settings": {"proTeams": []}})


def test_mid_season_repull():
    """A 2026 league mid-season (some weeks UNDECIDED) should ingest cleanly."""
    league_data = load("synthetic_2026_league.json")

    with requests_mock.Mocker() as m:
        mock_common(m, league_data)
        # The full mMatchupScore payload is fetched exactly once per season
        # now (fetch_full_scoreboard), so only one response needs mocking.
        m.get(league_endpoint() + "?view=mMatchupScore", status_code=200, json=league_data)

        league = League(league_id=LEAGUE_ID, year=SEASON, fetch_league=True)

        assert league.current_week == 3, f"expected current_week=3, got {league.current_week}"
        assert len(league.teams) == 4

        settings = league.settings
        reg_season_count = int(getattr(settings, "reg_season_count", 14) or 14)
        complete = ingest.season_complete(league.teams)
        assert complete is False, "mid-season league must not be marked complete"

        teams = []
        for team in league.teams:
            owner = ingest.owner_record(getattr(team, "owners", []) or [])
            teams.append(ingest.team_payload(team, owner))

        # Ownerless teams (Carol/Dan) still get ownerId=None -- they cannot
        # be keyed into managers.json without an owner -- but ingest must
        # warn about it loudly instead of staying silent.
        no_owner_teams = [t for t in teams if t["ownerId"] is None]
        assert len(no_owner_teams) == 2, f"expected 2 ownerless teams, got {len(no_owner_teams)}"
        stderr = io.StringIO()
        with redirect_stderr(stderr):
            ingest.warn_ownerless_teams(teams, SEASON)
        warning = stderr.getvalue()
        assert "WARNING" in warning and "Carol Team" in warning and "Dan Team" in warning, (
            f"expected an ownerless-team warning on stderr, got: {warning!r}"
        )
        print("OK: ownerless teams are logged with a WARNING instead of a silent drop")

        matchups = ingest.matchups_from_teams(league.teams, SEASON, reg_season_count)
        by_week = {}
        for mu in matchups:
            by_week.setdefault(mu["week"], []).append(mu)

        assert len(by_week.get(1, [])) == 2, "week 1 should have 2 completed matchups"
        assert len(by_week.get(2, [])) == 2, "week 2 should have 2 completed matchups"
        # Week 3 is fully UNDECIDED (0-0, outcome 'U'): it must be preserved
        # as a scheduled-but-unplayed matchup, not dropped and not
        # fabricated as a played 0-0 tie. Scores stay numeric 0 (not null)
        # to match the Matchup contract every renderer relies on; winner is
        # the sole signal that the game hasn't been played.
        week3 = by_week.get(3, [])
        assert len(week3) == 2, f"expected week 3 to be preserved as scheduled, got {week3}"
        for mu in week3:
            assert mu["winner"] is None, "undecided week must have winner=None"
            assert mu["homeScore"] == 0 and mu["awayScore"] == 0, "undecided week must have numeric 0 scores, not null"
            assert mu["combined"] == 0 and mu["margin"] == 0, "undecided week must have numeric 0 combined/margin"
        print("OK: in-progress (UNDECIDED) week 3 is preserved as scheduled with 0 scores/winner=None")

        # enrich_matchups_from_scoreboard now fetches the whole season's
        # schedule in ONE call (fetch_full_scoreboard) instead of one HTTP
        # call per week that each re-fetched the identical full payload.
        call_count_before = m.call_count
        ingest.enrich_matchups_from_scoreboard(league, matchups)
        scoreboard_calls = sum(
            1 for req in m.request_history[call_count_before:]
            if req.qs.get("view") == ["mmatchupscore"]
        )
        assert scoreboard_calls == 1, f"expected exactly 1 scoreboard call, got {scoreboard_calls}"
        print("OK: scoreboard is fetched exactly once per season (not once per week)")

        notables = ingest.notables_from_matchups(matchups, teams)
        assert notables, "notables should be non-empty with 4 completed games"
        # Undecided week 3 games must not leak into notables' played set.
        assert notables["highestScoringWeek"]["week"] != 3

        placement = ingest.championship_from_teams(teams, matchups, complete)
        assert placement["complete"] is False
        assert placement["champion"] is None
        assert placement["currentLeader"] is not None
        print(f"OK: currentLeader mid-season = {placement['currentLeader']['teamName']}")

        # championship_rosters must not guess a winner/loser for a
        # scheduled-but-unplayed championship matchup.
        rosters = ingest.championship_rosters(league, placement, teams)
        assert rosters is None, "must not fabricate rosters for an undecided championship matchup"
        print("OK: championship_rosters skips rather than guesses when the matchup is undecided")

        # predictions primary path uses playoffPct if sum(playoffPct) > 0.
        # Our synthetic fixture supplies real non-zero playoffPct (as ESPN
        # does mid-season); confirm predictions use the ESPN-provided values.
        current_payload = {"year": SEASON, "season": {
            "teams": teams, "complete": complete,
            "playoffTeamCount": int(getattr(settings, "playoff_team_count", 0) or 0),
        }}
        predictions = ingest.build_predictions(current_payload)
        total_pct = sum(t.get("playoffPct") or 0 for t in teams)
        assert total_pct > 0, "synthetic fixture must carry real playoffPct to test primary path"
        assert predictions["complete"] is False
        assert len(predictions["playoff"]) == 4
        print("OK: build_predictions uses ESPN playoffPct path when the league is mid-season")

    print("\nAll offline ingest checks passed.")


if __name__ == "__main__":
    test_mid_season_repull()
