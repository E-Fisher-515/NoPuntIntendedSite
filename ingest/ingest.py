#!/usr/bin/env python3
"""Pull No Punt Intended history from ESPN and write public archive JSON."""

from __future__ import annotations

import json
import os
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from espn_api.football import League

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

ARCHIVE = ROOT / "data" / "archive"
SEASONS_DIR = ARCHIVE / "seasons"
MATCHUPS_DIR = ARCHIVE / "matchups"


def env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def round2(value: float | int | None) -> float:
    return round(float(value or 0), 2)


def owner_record(owners: list) -> dict | None:
    if not owners:
        return None
    owner = owners[0]
    raw_id = str(owner.get("id", "")).strip("{}")
    first = (owner.get("firstName") or "").strip()
    last = (owner.get("lastName") or "").strip()
    display = (owner.get("displayName") or "").strip()
    name = first or display or "Unknown"
    full_name = " ".join(part for part in (first, last) if part) or display or name
    return {
        "id": raw_id.lower(),
        "espnId": raw_id,
        "name": name,
        "fullName": full_name,
        "displayName": display or full_name,
    }


def standing_of(team) -> int:
    final = getattr(team, "final_standing", 0) or 0
    if final:
        return int(final)
    return int(getattr(team, "standing", 0) or 0)


def season_complete(teams: list) -> bool:
    return any((getattr(team, "final_standing", 0) or 0) > 0 for team in teams)


def team_payload(team, owner: dict | None) -> dict:
    return {
        "teamId": team.team_id,
        "teamName": team.team_name,
        "abbrev": getattr(team, "team_abbrev", ""),
        "logoUrl": getattr(team, "logo_url", "") or "",
        "ownerId": owner["id"] if owner else None,
        "ownerName": owner["name"] if owner else "Unknown",
        "wins": int(team.wins),
        "losses": int(team.losses),
        "ties": int(team.ties),
        "pointsFor": round2(team.points_for),
        "pointsAgainst": round2(team.points_against),
        "standing": int(getattr(team, "standing", 0) or 0),
        "finalStanding": standing_of(team),
        "playoffPct": round2(getattr(team, "playoff_pct", 0) or 0),
        "trades": int(getattr(team, "trades", 0) or 0),
        "acquisitions": int(getattr(team, "acquisitions", 0) or 0),
        "drops": int(getattr(team, "drops", 0) or 0),
        "division": getattr(team, "division_name", "") or "",
    }


def matchups_from_teams(teams: list, year: int, reg_season_count: int) -> list[dict]:
    """Build unique weekly matchups from each team's schedule/scores."""
    seen: set[tuple[int, int, int]] = set()
    matchups: list[dict] = []
    by_id = {team.team_id: team for team in teams}

    for team in teams:
        scores = list(getattr(team, "scores", []) or [])
        schedule = list(getattr(team, "schedule", []) or [])
        outcomes = list(getattr(team, "outcomes", []) or [])
        weeks = min(len(scores), len(schedule))
        for index in range(weeks):
            opponent = schedule[index]
            opponent_id = opponent.team_id if hasattr(opponent, "team_id") else opponent
            if opponent_id in (None, team.team_id, -1):
                continue
            home_id, away_id = sorted((team.team_id, int(opponent_id)))
            key = (index + 1, home_id, away_id)
            if key in seen:
                continue
            seen.add(key)
            opp = by_id.get(int(opponent_id))
            if opp is None:
                continue
            home = team if team.team_id == home_id else opp
            away = opp if team.team_id == home_id else team
            home_index = index
            away_index = index
            home_score = round2(home.scores[home_index] if home_index < len(home.scores) else 0)
            away_score = round2(away.scores[away_index] if away_index < len(away.scores) else 0)
            if home_score == 0 and away_score == 0:
                home_outcome = outcomes[index] if index < len(outcomes) else "U"
                if home_outcome == "U":
                    continue
            week = index + 1
            winner = None
            if home_score > away_score:
                winner = "home"
            elif away_score > home_score:
                winner = "away"
            elif home_score or away_score:
                winner = "tie"
            matchups.append(
                {
                    "year": year,
                    "week": week,
                    "isPlayoff": week > reg_season_count,
                    "matchupType": "PLAYOFF" if week > reg_season_count else "NONE",
                    "homeTeamId": home.team_id,
                    "awayTeamId": away.team_id,
                    "homeTeamName": home.team_name,
                    "awayTeamName": away.team_name,
                    "homeScore": home_score,
                    "awayScore": away_score,
                    "combined": round2(home_score + away_score),
                    "margin": round2(abs(home_score - away_score)),
                    "winner": winner,
                }
            )
    matchups.sort(key=lambda item: (item["week"], item["homeTeamId"]))
    return matchups


def enrich_matchups_from_scoreboard(league: League, matchups: list[dict]) -> None:
    weeks = {item["week"] for item in matchups}
    by_key = {(item["week"], item["homeTeamId"], item["awayTeamId"]): item for item in matchups}
    by_key_rev = {(item["week"], item["awayTeamId"], item["homeTeamId"]): item for item in matchups}
    for week in sorted(weeks):
        try:
            board = league.scoreboard(week)
        except Exception:
            continue
        for game in board:
            home = getattr(game, "home_team", None)
            away = getattr(game, "away_team", None)
            if not home or not away or not hasattr(home, "team_id"):
                continue
            item = by_key.get((week, home.team_id, away.team_id)) or by_key_rev.get(
                (week, home.team_id, away.team_id)
            )
            if not item:
                continue
            item["isPlayoff"] = bool(getattr(game, "is_playoff", item["isPlayoff"]))
            item["matchupType"] = getattr(game, "matchup_type", item["matchupType"]) or item["matchupType"]


def notables_from_matchups(matchups: list[dict], teams: list[dict]) -> dict:
    played = [m for m in matchups if m.get("winner")]
    if not played:
        return {}
    highest = max(played, key=lambda m: max(m["homeScore"], m["awayScore"]))
    lowest = min(played, key=lambda m: min(m["homeScore"], m["awayScore"]))
    blowout = max(played, key=lambda m: m["margin"])
    closest = min(played, key=lambda m: m["margin"])
    combined_high = max(played, key=lambda m: m["combined"])
    combined_low = min(played, key=lambda m: m["combined"])

    def owner_for(team_id: int) -> str:
        for team in teams:
            if team.get("teamId") == team_id:
                return team.get("ownerName") or ""
        return ""

    def side(matchup: dict, which: str) -> dict:
        high_home = matchup["homeScore"] >= matchup["awayScore"]
        if which == "high":
            use_home = high_home
        else:
            use_home = not high_home if matchup["homeScore"] != matchup["awayScore"] else True
        team_id = matchup["homeTeamId"] if use_home else matchup["awayTeamId"]
        opp_id = matchup["awayTeamId"] if use_home else matchup["homeTeamId"]
        return {
            "teamName": matchup["homeTeamName"] if use_home else matchup["awayTeamName"],
            "teamId": team_id,
            "ownerName": owner_for(team_id),
            "points": matchup["homeScore"] if use_home else matchup["awayScore"],
            "opponentName": matchup["awayTeamName"] if use_home else matchup["homeTeamName"],
            "opponentOwner": owner_for(opp_id),
            "opponentPoints": matchup["awayScore"] if use_home else matchup["homeScore"],
            "week": matchup["week"],
        }

    pf_leader = max(teams, key=lambda t: t["pointsFor"])
    record_leader = max(teams, key=lambda t: (t["wins"], t["pointsFor"]))
    return {
        "highestScoringWeek": side(highest, "high"),
        "lowestScoringWeek": side(lowest, "low"),
        "biggestBlowout": {
            **side(blowout, "high"),
            "margin": blowout["margin"],
        },
        "closestMatchup": {
            "week": closest["week"],
            "homeTeamName": closest["homeTeamName"],
            "awayTeamName": closest["awayTeamName"],
            "homeTeamId": closest["homeTeamId"],
            "awayTeamId": closest["awayTeamId"],
            "homeOwnerName": owner_for(closest["homeTeamId"]),
            "awayOwnerName": owner_for(closest["awayTeamId"]),
            "homeScore": closest["homeScore"],
            "awayScore": closest["awayScore"],
            "margin": closest["margin"],
        },
        "highestCombined": combined_high,
        "lowestCombined": combined_low,
        "pointsLeader": {
            "teamName": pf_leader["teamName"],
            "ownerName": pf_leader["ownerName"],
            "ownerId": pf_leader["ownerId"],
            "pointsFor": pf_leader["pointsFor"],
        },
        "bestRecord": {
            "teamName": record_leader["teamName"],
            "ownerName": record_leader["ownerName"],
            "ownerId": record_leader["ownerId"],
            "record": f"{record_leader['wins']}-{record_leader['losses']}-{record_leader['ties']}",
        },
    }


def championship_from_teams(teams: list[dict], matchups: list[dict], complete: bool) -> dict:
    ordered = sorted(teams, key=lambda t: t["finalStanding"] or 99)
    champ = ordered[0] if ordered else None
    runner = ordered[1] if len(ordered) > 1 else None
    third = ordered[2] if len(ordered) > 2 else None
    title_score = None
    if champ and runner:
        playoff = [
            m
            for m in matchups
            if m["isPlayoff"]
            and {m["homeTeamId"], m["awayTeamId"]} == {champ["teamId"], runner["teamId"]}
        ]
        if playoff:
            title_score = max(playoff, key=lambda m: m["week"])
    return {
        "complete": complete,
        "champion": champ if complete else None,
        "currentLeader": None if complete else champ,
        "runnerUp": runner if complete else None,
        "thirdPlace": third if complete else None,
        "championshipMatchup": title_score,
    }


def lineup_players(players) -> list[dict]:
    rows = []
    for player in players or []:
        rows.append(
            {
                "name": getattr(player, "name", "Unknown"),
                "slot": getattr(player, "slot_position", "") or "",
                "position": getattr(player, "position", "") or "",
                "points": round2(getattr(player, "points", 0)),
            }
        )
    rows.sort(key=lambda row: (row["slot"] in {"BE", "IR", "Bench"}, -row["points"]))
    return rows


def championship_rosters(league: League, placement: dict, teams: list[dict]) -> dict | None:
    matchup = placement.get("championshipMatchup")
    if not matchup:
        return None
    try:
        boxes = league.box_scores(int(matchup["week"]))
    except Exception as exc:
        print(f"  championship roster skipped: {exc}")
        return None
    target = {matchup["homeTeamId"], matchup["awayTeamId"]}
    for box in boxes:
        home = getattr(box, "home_team", None)
        away = getattr(box, "away_team", None)
        if not home or not away or {home.team_id, away.team_id} != target:
            continue
        by_id = {
            home.team_id: {
                "teamId": home.team_id,
                "teamName": matchup["homeTeamName"] if home.team_id == matchup["homeTeamId"] else matchup["awayTeamName"],
                "ownerName": next((t.get("ownerName") for t in teams if t["teamId"] == home.team_id), ""),
                "score": matchup["homeScore"] if home.team_id == matchup["homeTeamId"] else matchup["awayScore"],
                "players": lineup_players(getattr(box, "home_lineup", [])),
            },
            away.team_id: {
                "teamId": away.team_id,
                "teamName": matchup["awayTeamName"] if away.team_id == matchup["awayTeamId"] else matchup["homeTeamName"],
                "ownerName": next((t.get("ownerName") for t in teams if t["teamId"] == away.team_id), ""),
                "score": matchup["awayScore"] if away.team_id == matchup["awayTeamId"] else matchup["homeScore"],
                "players": lineup_players(getattr(box, "away_lineup", [])),
            },
        }
        winner_id = matchup["homeTeamId"] if matchup.get("winner") == "home" else matchup["awayTeamId"]
        loser_id = matchup["awayTeamId"] if matchup.get("winner") == "home" else matchup["homeTeamId"]
        if winner_id not in by_id or loser_id not in by_id:
            continue
        return {
            "week": matchup["week"],
            "winner": by_id[winner_id],
            "loser": by_id[loser_id],
        }
    return None


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def ingest_year(league_id: int, year: int, espn_s2: str, swid: str) -> dict:
    print(f"Fetching {year}...")
    league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid, fetch_league=True)
    settings = league.settings
    reg_season_count = int(getattr(settings, "reg_season_count", 14) or 14)
    complete = season_complete(league.teams)
    teams = []
    for team in league.teams:
        owner = owner_record(getattr(team, "owners", []) or [])
        teams.append(team_payload(team, owner))
    teams.sort(key=lambda t: t["finalStanding"] or 99)
    matchups = matchups_from_teams(league.teams, year, reg_season_count)
    enrich_matchups_from_scoreboard(league, matchups)
    notables = notables_from_matchups(matchups, teams)
    placement = championship_from_teams(teams, matchups, complete)
    weekly = defaultdict(list)
    for matchup in matchups:
        weekly[matchup["week"]].append(matchup)
    season = {
        "year": year,
        "name": getattr(settings, "name", "No Punt Intended"),
        "complete": complete,
        "teamCount": int(getattr(settings, "team_count", len(teams)) or len(teams)),
        "regularSeasonWeeks": reg_season_count,
        "playoffTeamCount": int(getattr(settings, "playoff_team_count", 0) or 0),
        "keeperCount": int(getattr(settings, "keeper_count", 0) or 0),
        "faab": bool(getattr(settings, "faab", False)),
        "acquisitionBudget": int(getattr(settings, "acquisition_budget", 0) or 0),
        "scoringType": getattr(settings, "scoring_type", "") or "",
        "currentWeek": int(getattr(league, "current_week", 0) or 0),
        "teams": teams,
        "notables": notables,
        **placement,
        "championshipRosters": championship_rosters(league, placement, teams),
        "weeklyMatchupCount": {str(week): len(games) for week, games in weekly.items()},
    }
    write_json(SEASONS_DIR / f"{year}.json", season)
    write_json(MATCHUPS_DIR / f"{year}.json", matchups)
    print(f"  {year}: {len(teams)} teams, {len(matchups)} matchups")
    return {
        "year": year,
        "season": season,
        "matchups": matchups,
        "previousSeasons": list(getattr(league, "previousSeasons", []) or []),
    }


def longest_streak(outcomes: list[str], want: str) -> int:
    best = current = 0
    for outcome in outcomes:
        if outcome == want:
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best


def build_managers(year_payloads: list[dict]) -> list[dict]:
    managers: dict[str, dict] = {}
    h2h: dict[str, dict[str, dict]] = defaultdict(lambda: defaultdict(lambda: {"wins": 0, "losses": 0, "ties": 0}))

    for payload in year_payloads:
        year = payload["year"]
        season = payload["season"]
        team_by_id = {team["teamId"]: team for team in season["teams"]}
        for team in season["teams"]:
            owner_id = team.get("ownerId")
            if not owner_id:
                continue
            manager = managers.setdefault(
                owner_id,
                {
                    "id": owner_id,
                    "name": team["ownerName"],
                    "fullName": team["ownerName"],
                    "seasons": [],
                    "championships": 0,
                    "runnerUp": 0,
                    "playoffAppearances": 0,
                    "wins": 0,
                    "losses": 0,
                    "ties": 0,
                    "pointsFor": 0.0,
                    "pointsAgainst": 0.0,
                    "bestFinish": None,
                    "worstFinish": None,
                    "highestWeek": None,
                    "lowestWeek": None,
                    "winStreak": 0,
                    "loseStreak": 0,
                },
            )
            finish = team["finalStanding"]
            playoff = bool(season["playoffTeamCount"] and finish and finish <= season["playoffTeamCount"])
            champ = bool(season["complete"] and finish == 1)
            season_row = {
                "year": year,
                "teamId": team["teamId"],
                "teamName": team["teamName"],
                "wins": team["wins"],
                "losses": team["losses"],
                "ties": team["ties"],
                "pointsFor": team["pointsFor"],
                "pointsAgainst": team["pointsAgainst"],
                "finish": finish,
                "playoff": playoff,
                "champion": champ,
                "logoUrl": team.get("logoUrl") or "",
            }
            manager["seasons"].append(season_row)
            manager["name"] = team["ownerName"]
            manager["wins"] += team["wins"]
            manager["losses"] += team["losses"]
            manager["ties"] += team["ties"]
            manager["pointsFor"] = round2(manager["pointsFor"] + team["pointsFor"])
            manager["pointsAgainst"] = round2(manager["pointsAgainst"] + team["pointsAgainst"])
            if champ:
                manager["championships"] += 1
            if season["complete"] and finish == 2:
                manager["runnerUp"] += 1
            if playoff:
                manager["playoffAppearances"] += 1
            if finish:
                manager["bestFinish"] = finish if manager["bestFinish"] is None else min(manager["bestFinish"], finish)
                manager["worstFinish"] = finish if manager["worstFinish"] is None else max(manager["worstFinish"], finish)

        for matchup in payload["matchups"]:
            if not matchup.get("winner"):
                continue
            home = team_by_id.get(matchup["homeTeamId"])
            away = team_by_id.get(matchup["awayTeamId"])
            if not home or not away or not home.get("ownerId") or not away.get("ownerId"):
                continue
            hid, aid = home["ownerId"], away["ownerId"]
            if matchup["winner"] == "home":
                h2h[hid][aid]["wins"] += 1
                h2h[aid][hid]["losses"] += 1
            elif matchup["winner"] == "away":
                h2h[aid][hid]["wins"] += 1
                h2h[hid][aid]["losses"] += 1
            else:
                h2h[hid][aid]["ties"] += 1
                h2h[aid][hid]["ties"] += 1
            for team, points in ((home, matchup["homeScore"]), (away, matchup["awayScore"])):
                manager = managers.get(team["ownerId"])
                if not manager:
                    continue
                week_row = {
                    "year": year,
                    "week": matchup["week"],
                    "teamName": team["teamName"],
                    "points": points,
                    "opponentName": away["teamName"] if team is home else home["teamName"],
                }
                if manager["highestWeek"] is None or points > manager["highestWeek"]["points"]:
                    manager["highestWeek"] = week_row
                if manager["lowestWeek"] is None or points < manager["lowestWeek"]["points"]:
                    manager["lowestWeek"] = week_row

        for team in league_teams_outcomes(payload):
            owner_id = team["ownerId"]
            if owner_id in managers:
                managers[owner_id]["winStreak"] = max(
                    managers[owner_id]["winStreak"], longest_streak(team["outcomes"], "W")
                )
                managers[owner_id]["loseStreak"] = max(
                    managers[owner_id]["loseStreak"], longest_streak(team["outcomes"], "L")
                )

    for manager in managers.values():
        games = manager["wins"] + manager["losses"] + manager["ties"]
        manager["winPct"] = round(manager["wins"] / games, 3) if games else 0.0
        manager["seasonsPlayed"] = len(manager["seasons"])
        finishes = [row["finish"] for row in manager["seasons"] if row["finish"]]
        manager["averageFinish"] = round(statistics.mean(finishes), 2) if finishes else None
        manager["headToHead"] = [
            {"opponentId": opp_id, **record} for opp_id, record in sorted(h2h[manager["id"]].items())
        ]
        manager["seasons"].sort(key=lambda row: row["year"])
    return sorted(managers.values(), key=lambda m: (-m["championships"], -m["winPct"], m["name"]))


def league_teams_outcomes(payload: dict) -> list[dict]:
    """Approximate weekly W/L sequences from matchups for streak calculation."""
    by_team: dict[int, dict] = {}
    season_teams = {team["teamId"]: team for team in payload["season"]["teams"]}
    for matchup in sorted(payload["matchups"], key=lambda m: m["week"]):
        if not matchup.get("winner"):
            continue
        for team_id, is_home in (
            (matchup["homeTeamId"], True),
            (matchup["awayTeamId"], False),
        ):
            team = season_teams.get(team_id)
            if not team or not team.get("ownerId"):
                continue
            row = by_team.setdefault(team_id, {"ownerId": team["ownerId"], "outcomes": []})
            if matchup["winner"] == "tie":
                row["outcomes"].append("T")
            elif (is_home and matchup["winner"] == "home") or ((not is_home) and matchup["winner"] == "away"):
                row["outcomes"].append("W")
            else:
                row["outcomes"].append("L")
    return list(by_team.values())


def record_entry(label: str, value, context: dict) -> dict:
    return {"label": label, "value": value, **context}


def build_records(year_payloads: list[dict], managers: list[dict]) -> dict:
    week_scores = []
    season_rows = []
    matchup_rows = []
    for payload in year_payloads:
        for team in payload["season"]["teams"]:
            season_rows.append({"year": payload["year"], **team})
        for matchup in payload["matchups"]:
            if not matchup.get("winner"):
                continue
            matchup_rows.append(matchup)
            for side, opp in (
                ("home", "away"),
                ("away", "home"),
            ):
                week_scores.append(
                    {
                        "year": payload["year"],
                        "week": matchup["week"],
                        "teamName": matchup[f"{side}TeamName"],
                        "ownerName": next(
                            (
                                t["ownerName"]
                                for t in payload["season"]["teams"]
                                if t["teamId"] == matchup[f"{side}TeamId"]
                            ),
                            "",
                        ),
                        "ownerId": next(
                            (
                                t["ownerId"]
                                for t in payload["season"]["teams"]
                                if t["teamId"] == matchup[f"{side}TeamId"]
                            ),
                            None,
                        ),
                        "points": matchup[f"{side}Score"],
                        "opponentName": matchup[f"{opp}TeamName"],
                        "opponentPoints": matchup[f"{opp}Score"],
                    }
                )

    def top(rows, key, n=5, reverse=True):
        return sorted(rows, key=lambda r: r[key], reverse=reverse)[:n]

    playoff_matchups = [m for m in matchup_rows if m.get("isPlayoff")]
    playoff_wins = defaultdict(int)
    playoff_games = defaultdict(int)
    for matchup in playoff_matchups:
        for side in ("home", "away"):
            owner = next(
                (
                    t["ownerId"]
                    for payload in year_payloads
                    for t in payload["season"]["teams"]
                    if payload["year"] == matchup["year"] and t["teamId"] == matchup[f"{side}TeamId"]
                ),
                None,
            )
            if not owner:
                continue
            playoff_games[owner] += 1
            won = (side == "home" and matchup["winner"] == "home") or (
                side == "away" and matchup["winner"] == "away"
            )
            if won:
                playoff_wins[owner] += 1

    manager_by_id = {m["id"]: m for m in managers}
    playoff_rows = []
    for owner_id, games in playoff_games.items():
        manager = manager_by_id.get(owner_id)
        if not manager:
            continue
        wins = playoff_wins[owner_id]
        playoff_rows.append(
            {
                "ownerId": owner_id,
                "ownerName": manager["name"],
                "wins": wins,
                "games": games,
                "winPct": round(wins / games, 3) if games else 0,
                "championships": manager["championships"],
                "appearances": manager["playoffAppearances"],
            }
        )

    return {
        "scoring": {
            "mostPointsSeason": top(season_rows, "pointsFor"),
            "mostPointsWeek": top(week_scores, "points"),
            "lowestPointsWeek": top(week_scores, "points", reverse=False),
            "mostCareerPoints": [
                {"ownerId": m["id"], "ownerName": m["name"], "pointsFor": m["pointsFor"]}
                for m in sorted(managers, key=lambda m: m["pointsFor"], reverse=True)[:5]
            ],
            "highestAveragePoints": top(
                [
                    {
                        "ownerId": m["id"],
                        "ownerName": m["name"],
                        "avg": round(m["pointsFor"] / m["seasonsPlayed"], 2) if m["seasonsPlayed"] else 0,
                    }
                    for m in managers
                    if m["seasonsPlayed"]
                ],
                "avg",
            ),
        },
        "records": {
            "mostWins": [
                {"ownerId": m["id"], "ownerName": m["name"], "wins": m["wins"], "losses": m["losses"]}
                for m in sorted(managers, key=lambda m: m["wins"], reverse=True)[:5]
            ],
            "mostLosses": [
                {"ownerId": m["id"], "ownerName": m["name"], "losses": m["losses"], "wins": m["wins"]}
                for m in sorted(managers, key=lambda m: m["losses"], reverse=True)[:5]
            ],
            "bestRegularSeason": top(season_rows, "wins"),
            "worstRegularSeason": sorted(season_rows, key=lambda r: (r["wins"], -r["losses"]))[:5],
            "longestWinStreak": [
                {"ownerId": m["id"], "ownerName": m["name"], "streak": m["winStreak"]}
                for m in sorted(managers, key=lambda m: m["winStreak"], reverse=True)[:5]
            ],
            "longestLosingStreak": [
                {"ownerId": m["id"], "ownerName": m["name"], "streak": m["loseStreak"]}
                for m in sorted(managers, key=lambda m: m["loseStreak"], reverse=True)[:5]
            ],
        },
        "matchups": {
            "biggestBlowout": top(matchup_rows, "margin"),
            "closestMatchup": top(matchup_rows, "margin", reverse=False),
            "highestCombined": top(matchup_rows, "combined"),
            "lowestCombined": top(matchup_rows, "combined", reverse=False),
        },
        "playoffs": {
            "mostChampionships": [
                {"ownerId": m["id"], "ownerName": m["name"], "championships": m["championships"]}
                for m in sorted(managers, key=lambda m: m["championships"], reverse=True)
                if m["championships"]
            ][:5],
            "mostPlayoffWins": top(playoff_rows, "wins"),
            "mostPlayoffAppearances": [
                {"ownerId": m["id"], "ownerName": m["name"], "appearances": m["playoffAppearances"]}
                for m in sorted(managers, key=lambda m: m["playoffAppearances"], reverse=True)[:5]
            ],
            "bestPlayoffWinPct": top([row for row in playoff_rows if row["games"] >= 3], "winPct"),
        },
    }


def build_awards(year_payloads: list[dict]) -> list[dict]:
    awards = []
    for payload in year_payloads:
        season = payload["season"]
        year = payload["year"]
        notables = season.get("notables") or {}
        if season.get("champion"):
            awards.append(
                {
                    "id": f"champion-{year}",
                    "year": year,
                    "name": "Champion",
                    "category": "season",
                    "source": "espn",
                    "winnerName": season["champion"]["ownerName"],
                    "winnerId": season["champion"]["ownerId"],
                    "detail": season["champion"]["teamName"],
                }
            )
        if notables.get("pointsLeader"):
            awards.append(
                {
                    "id": f"mvp-{year}",
                    "year": year,
                    "name": "Highest Scoring Team",
                    "category": "scoring",
                    "source": "espn",
                    "winnerName": notables["pointsLeader"]["ownerName"],
                    "winnerId": notables["pointsLeader"]["ownerId"],
                    "detail": f"{notables['pointsLeader']['pointsFor']} points",
                }
            )
        if notables.get("bestRecord"):
            awards.append(
                {
                    "id": f"best-record-{year}",
                    "year": year,
                    "name": "Best Regular Season",
                    "category": "record",
                    "source": "espn",
                    "winnerName": notables["bestRecord"]["ownerName"],
                    "winnerId": notables["bestRecord"]["ownerId"],
                    "detail": notables["bestRecord"]["record"],
                }
            )
        if notables.get("biggestBlowout"):
            blow = notables["biggestBlowout"]
            awards.append(
                {
                    "id": f"blowout-{year}",
                    "year": year,
                    "name": "Biggest Blowout",
                    "category": "matchup",
                    "source": "espn",
                    "winnerName": blow.get("ownerName") or blow["teamName"],
                    "winnerId": next((t.get("ownerId") for t in season.get("teams", []) if t.get("teamId") == blow.get("teamId")), None),
                    "detail": f"{blow.get('ownerName') or ''} · {blow['teamName']} · {year} Week {blow['week']}: {blow['points']}-{blow['opponentPoints']} (margin {blow['margin']})".strip(" ·"),
                }
            )
        if notables.get("closestMatchup"):
            close = notables["closestMatchup"]
            awards.append(
                {
                    "id": f"closest-{year}",
                    "year": year,
                    "name": "Closest Game",
                    "category": "matchup",
                    "source": "espn",
                    "winnerName": f"{close.get('homeOwnerName') or close['homeTeamName']} vs {close.get('awayOwnerName') or close['awayTeamName']}",
                    "winnerId": None,
                    "detail": f"{close['homeTeamName']} vs {close['awayTeamName']} · {year} Week {close['week']}: {close['homeScore']}-{close['awayScore']}",
                }
            )
    return awards


def build_predictions(current: dict) -> dict:
    teams = current["season"]["teams"]
    if current["season"]["complete"]:
        return {
            "season": current["year"],
            "complete": True,
            "note": "This season is complete. Predictions will return when the next season begins.",
            "champion": [],
            "playoff": [],
            "standings": [],
        }
    # ESPN playoffPct when present; otherwise remaining-schedule heuristic from PF rank.
    raw = []
    total_pct = sum(t.get("playoffPct") or 0 for t in teams)
    if total_pct > 0:
        for team in teams:
            raw.append((team, team.get("playoffPct") or 0))
    else:
        ranked = sorted(teams, key=lambda t: (t["wins"], t["pointsFor"]), reverse=True)
        weights = list(range(len(ranked), 0, -1))
        weight_sum = sum(weights)
        for team, weight in zip(ranked, weights):
            raw.append((team, 100 * weight / weight_sum))
    champ_weights = []
    for team, playoff in raw:
        champ_weights.append((team, playoff * (team["pointsFor"] + 1)))
    champ_sum = sum(w for _, w in champ_weights) or 1
    playoff_sorted = sorted(raw, key=lambda item: item[1], reverse=True)
    champ_sorted = sorted(champ_weights, key=lambda item: item[1], reverse=True)
    playoff_count = current["season"]["playoffTeamCount"] or max(1, len(teams) // 2)
    return {
        "season": current["year"],
        "complete": False,
        "note": "Simple probabilities from ESPN playoff odds and points scored. Not a scientific forecast.",
        "champion": [
            {
                "ownerId": team["ownerId"],
                "ownerName": team["ownerName"],
                "teamName": team["teamName"],
                "pct": round(100 * weight / champ_sum, 1),
            }
            for team, weight in champ_sorted
        ],
        "playoff": [
            {
                "ownerId": team["ownerId"],
                "ownerName": team["ownerName"],
                "teamName": team["teamName"],
                "pct": round(pct, 1),
            }
            for team, pct in playoff_sorted
        ],
        "standings": [
            {
                "ownerId": team["ownerId"],
                "ownerName": team["ownerName"],
                "teamName": team["teamName"],
                "wins": team["wins"],
                "losses": team["losses"],
                "pointsFor": team["pointsFor"],
                "projectedSeed": index + 1,
                "inPlayoffPicture": index < playoff_count,
            }
            for index, team in enumerate(
                sorted(teams, key=lambda t: (t["wins"], t["pointsFor"]), reverse=True)
            )
        ],
    }


def main() -> None:
    league_id = int(env("ESPN_LEAGUE_ID"))
    season = int(env("ESPN_SEASON"))
    espn_s2 = env("ESPN_S2")
    swid = env("ESPN_SWID")
    league_name = os.getenv("LEAGUE_NAME", "No Punt Intended")

    current = ingest_year(league_id, season, espn_s2, swid)
    years = sorted(set(int(y) for y in current["previousSeasons"] + [season]))
    payloads = []
    for year in years:
        if year == season:
            payloads.append(current)
        else:
            try:
                payloads.append(ingest_year(league_id, year, espn_s2, swid))
            except Exception as exc:
                print(f"  skipped {year}: {exc}")

    payloads.sort(key=lambda p: p["year"])
    managers = build_managers(payloads)
    records = build_records(payloads, managers)
    awards = build_awards(payloads)
    predictions = build_predictions(payloads[-1])
    championships = []
    for payload in payloads:
        champ = payload["season"].get("champion")
        if champ:
            matchup = payload["season"].get("championshipMatchup")
            championships.append(
                {
                    "year": payload["year"],
                    "ownerId": champ["ownerId"],
                    "ownerName": champ["ownerName"],
                    "teamName": champ["teamName"],
                    "record": f"{champ['wins']}-{champ['losses']}-{champ['ties']}",
                    "pointsFor": champ["pointsFor"],
                    "runnerUpName": (payload["season"].get("runnerUp") or {}).get("ownerName"),
                    "runnerUpTeam": (payload["season"].get("runnerUp") or {}).get("teamName"),
                    "thirdPlaceName": (payload["season"].get("thirdPlace") or {}).get("ownerName"),
                    "championshipScore": (
                        f"{matchup['homeScore']}-{matchup['awayScore']}" if matchup else None
                    ),
                }
            )

    latest = payloads[-1]["season"]
    games = sum(len(p["matchups"]) for p in payloads)
    league = {
        "id": league_id,
        "name": league_name,
        "currentSeason": season,
        "seasons": [p["year"] for p in payloads],
        "seasonCount": len(payloads),
        "managerCount": len(managers),
        "gamesPlayed": games,
        "teamCount": latest["teamCount"],
        "currentChampion": championships[-1] if championships else None,
        "currentLeader": latest.get("currentLeader") or latest.get("champion"),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "championships": championships,
    }
    write_json(ARCHIVE / "league.json", league)
    write_json(ARCHIVE / "managers.json", managers)
    write_json(ARCHIVE / "records.json", records)
    write_json(ARCHIVE / "awards.json", awards)
    write_json(ARCHIVE / "predictions.json", predictions)
    print(f"Wrote archive for {len(payloads)} seasons, {len(managers)} managers, {games} games.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
