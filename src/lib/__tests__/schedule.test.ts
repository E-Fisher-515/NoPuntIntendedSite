/**
 * Focused, framework-free tests for schedule.ts: the future-matchup data
 * contract and current/next matchup selection.
 *
 * Run with: npm run test:rivalries
 * (compiles this file + its lib deps with tsc to CommonJS, then runs with node)
 */
import assert from "node:assert/strict";
import { currentAndNextMatchup, isFutureMatchup } from "../schedule";
import type { Manager, Matchup } from "../types";

function baseMatchup(overrides: Partial<Matchup>): Matchup {
  return {
    year: 2026,
    week: 1,
    isPlayoff: false,
    matchupType: "NONE",
    homeTeamId: 1,
    awayTeamId: 2,
    homeTeamName: "Home Team",
    awayTeamName: "Away Team",
    homeScore: 0,
    awayScore: 0,
    combined: 0,
    margin: 0,
    winner: null,
    ...overrides,
  };
}

function manager(id: string, name: string): Manager {
  return {
    id,
    name,
    fullName: name,
    seasons: [],
    championships: 0,
    runnerUp: 0,
    playoffAppearances: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    bestFinish: null,
    worstFinish: null,
    highestWeek: null,
    lowestWeek: null,
    winStreak: 0,
    loseStreak: 0,
    winPct: 0,
    seasonsPlayed: 1,
    averageFinish: null,
    headToHead: [],
  };
}

/**
 * Ingest emits numeric 0 (never null) for homeScore/awayScore/combined/
 * margin on future matchups -- see ingest.py's matchups_from_teams. Any
 * caller that reads these fields off a future Matchup (e.g. MatchupCard's
 * points(matchup.homeScore)) must be able to treat them as plain numbers
 * without a null check. winner === null is the only future-game signal.
 */
function testFutureMatchupKeepsNumericScoreContract() {
  const future = baseMatchup({ week: 5, winner: null, homeScore: 0, awayScore: 0, combined: 0, margin: 0 });
  assert.equal(isFutureMatchup(future), true, "winner === null must be treated as a future matchup");
  assert.equal(typeof future.homeScore, "number", "homeScore must stay numeric, never null, for future matchups");
  assert.equal(typeof future.awayScore, "number", "awayScore must stay numeric, never null, for future matchups");
  // The actual value that a renderer like MatchupCard would format via
  // points(matchup.homeScore) must not throw or format as anything odd.
  assert.doesNotThrow(() => future.homeScore.toLocaleString());
}

function testDecidedMatchupIsNotFuture() {
  const decided = baseMatchup({ week: 1, winner: "home", homeScore: 100, awayScore: 90, combined: 190, margin: 10 });
  assert.equal(isFutureMatchup(decided), false);
  const tie = baseMatchup({ week: 2, winner: "tie", homeScore: 50, awayScore: 50, combined: 100, margin: 0 });
  assert.equal(isFutureMatchup(tie), false, "a real played tie (winner='tie') is not a future matchup");
}

/**
 * currentAndNextMatchup must resolve "current" to the actual current week
 * when the caller supplies one (from SeasonArchive.currentWeek), even when
 * that week's game has not been decided yet -- not just the last decided
 * matchup, which would lag a week behind during the live matchup period.
 */
function testCurrentWeekPrefersActualCurrentWeekOverLastDecided() {
  const managers = [manager("a", "Alice"), manager("b", "Bob")];
  const matchups: Matchup[] = [
    baseMatchup({ week: 1, homeTeamId: 1, awayTeamId: 2, winner: "home", homeScore: 100, awayScore: 90, combined: 190, margin: 10 }),
    baseMatchup({ week: 2, homeTeamId: 1, awayTeamId: 2, winner: "away", homeScore: 80, awayScore: 95, combined: 175, margin: 15 }),
    // Week 3 is the actual current week (mid-matchup, not yet decided).
    baseMatchup({ week: 3, homeTeamId: 1, awayTeamId: 2, winner: null, homeScore: 0, awayScore: 0, combined: 0, margin: 0 }),
    baseMatchup({ week: 4, homeTeamId: 1, awayTeamId: 2, winner: null, homeScore: 0, awayScore: 0, combined: 0, margin: 0 }),
  ];

  const withCurrentWeek = currentAndNextMatchup(matchups, 1, managers, 3);
  assert.equal(withCurrentWeek.current?.week, 3, "current must be the actual current week (3), not the last decided week (2)");
  assert.equal(withCurrentWeek.next?.week, 4, "next must be the earliest undecided matchup after the current week");

  // Without a currentWeekNumber hint, behavior falls back to the previous
  // "most recently decided" heuristic so callers that don't have a
  // SeasonArchive on hand still get a reasonable answer.
  const withoutHint = currentAndNextMatchup(matchups, 1, managers);
  assert.equal(withoutHint.current?.week, 2, "without a current-week hint, falls back to the last decided matchup");
  assert.equal(withoutHint.next?.week, 3, "next after the fallback current must still be the earliest undecided matchup");
}

function testCurrentWeekFallsBackWhenNoMatchupExistsForThatWeek() {
  const managers = [manager("a", "Alice"), manager("b", "Bob")];
  const matchups: Matchup[] = [
    baseMatchup({ week: 1, homeTeamId: 1, awayTeamId: 2, winner: "home", homeScore: 100, awayScore: 90, combined: 190, margin: 10 }),
  ];
  // currentWeekNumber points past any scheduled matchup (e.g. season just
  // ended, or a bye week) -- must fall back to the last decided matchup
  // instead of returning null.
  const result = currentAndNextMatchup(matchups, 1, managers, 99);
  assert.equal(result.current?.week, 1, "falls back to the last decided matchup when the current week has no scheduled game");
  assert.equal(result.next, null);
}

function testNoScheduleDataReturnsNulls() {
  const managers = [manager("a", "Alice")];
  const result = currentAndNextMatchup([], 1, managers, 3);
  assert.equal(result.current, null);
  assert.equal(result.next, null);
}

const tests: [string, () => void][] = [
  ["future matchups keep a numeric (never null) score contract", testFutureMatchupKeepsNumericScoreContract],
  ["a decided matchup (including a real played tie) is not a future matchup", testDecidedMatchupIsNotFuture],
  ["current-week hint takes priority over the last-decided heuristic", testCurrentWeekPrefersActualCurrentWeekOverLastDecided],
  ["current-week hint falls back to last decided when no matchup exists for that week", testCurrentWeekFallsBackWhenNoMatchupExistsForThatWeek],
  ["no schedule data returns nulls for both current and next", testNoScheduleDataReturnsNulls],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(err);
  }
}
if (failed) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${tests.length} schedule tests passed.`);
