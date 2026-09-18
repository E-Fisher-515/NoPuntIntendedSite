/**
 * Focused, framework-free tests for the pure rivalry-pairing functions.
 * No React/Next runtime needed -- these are plain data transforms.
 *
 * Run with: npm run test:rivalries
 * (compiles this file + its lib deps with tsc to CommonJS, then runs with node)
 */
import assert from "node:assert/strict";
import { greedyMaxWeightPairing } from "../rivalries";
import { candidatePairs } from "../rivalryScoring";
import { buildKnockoutMeetings, buildTitleMeetings } from "../rivalryHistory";
import { buildRivalries } from "../rivalries";
import type { Manager } from "../types";

function manager(id: string, name: string, headToHead: Manager["headToHead"] = []): Manager {
  return {
    id,
    name,
    fullName: name,
    seasons: [{ year: 2025, teamId: Number(id), teamName: `${name}'s Team`, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, finish: 0, playoff: false, champion: false, logoUrl: "" }],
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
    headToHead,
  };
}

function testGreedyPairingIsStrictlyOneToOne() {
  // A has the strongest history with both B and C. A naive "best opponent
  // per manager" approach (the old bug) would make A the rival of BOTH B
  // and C. The greedy max-weight matching must instead give A only one
  // partner and leave the other pair (or leftover) to fend for itself.
  const a = manager("a", "Alice");
  const b = manager("b", "Bob");
  const c = manager("c", "Cara");
  const pairs = [
    { a, b, facts: { score: 100, games: 10, reasons: ["a-b"], record: "a-b" } },
    { a, b: c, facts: { score: 90, games: 9, reasons: ["a-c"], record: "a-c" } },
    { a: b, b: c, facts: { score: 5, games: 1, reasons: ["b-c"], record: "b-c" } },
  ];
  const { matched, leftover } = greedyMaxWeightPairing([a, b, c], pairs);

  assert.equal(matched.length, 1, "only one pair can be matched among 3 managers");
  assert.equal(matched[0].a.id, "a");
  assert.equal(matched[0].b.id, "b", "highest-scoring pair (a-b, 100) must win over (a-c, 90)");
  assert.ok(leftover, "one manager must be left over with an odd trio");
  assert.equal(leftover?.id, "c");

  const claimedIds = matched.flatMap((p) => [p.a.id, p.b.id]);
  const uniqueClaims = new Set(claimedIds);
  assert.equal(uniqueClaims.size, claimedIds.length, "no manager may appear in more than one matched pair");
}

function testEvenRosterHasNoLeftover() {
  const managers = ["a", "b", "c", "d"].map((id) => manager(id, id.toUpperCase()));
  const [a, b, c, d] = managers;
  const pairs = [
    { a, b, facts: { score: 50, games: 5, reasons: [], record: "" } },
    { a, b: c, facts: { score: 40, games: 4, reasons: [], record: "" } },
    { a, b: d, facts: { score: 30, games: 3, reasons: [], record: "" } },
    { a: b, b: c, facts: { score: 20, games: 2, reasons: [], record: "" } },
    { a: b, b: d, facts: { score: 60, games: 6, reasons: [], record: "" } },
    { a: c, b: d, facts: { score: 10, games: 1, reasons: [], record: "" } },
  ];
  const { matched, leftover } = greedyMaxWeightPairing(managers, pairs);
  assert.equal(leftover, null, "an even roster must fully pair off with no leftover");
  assert.equal(matched.length, 2, "4 managers pair into exactly 2 rivalries");
  const claimed = new Set(matched.flatMap((p) => [p.a.id, p.b.id]));
  assert.equal(claimed.size, 4, "every manager must be claimed exactly once");
}

function testBuildRivalriesLabelsOddLeftover() {
  const managers = [manager("a", "Alice"), manager("b", "Bob"), manager("c", "Cara")];
  const rivalries = buildRivalries(managers, [], [], [], 2025);
  const unpaired = rivalries.filter((r) => r.unpaired);
  assert.equal(unpaired.length, 1, "exactly one manager should be labeled unpaired for an odd roster");
  // Every non-leftover manager must appear as `left` in exactly one non-mirror... actually mirrored,
  // so check each manager id appears at least once and no manager is claimed by more than one distinct partner.
  const byManager = new Map<string, Set<string>>();
  for (const r of rivalries) {
    if (r.unpaired) continue;
    const set = byManager.get(r.left.id) ?? new Set<string>();
    set.add(r.right.id);
    byManager.set(r.left.id, set);
  }
  for (const [id, partners] of byManager) {
    assert.equal(partners.size, 1, `manager ${id} must have exactly one distinct rival, got ${[...partners]}`);
  }
}

function testEmptyHistoryProducesNoKnockoutsOrTitles() {
  const titles = buildTitleMeetings([], []);
  const knockouts = buildKnockoutMeetings([], [], []);
  assert.equal(titles.size, 0);
  assert.deepEqual(knockouts, {});
}

function testCandidatePairsCoversEveryUnorderedPair() {
  const managers = [manager("a", "A"), manager("b", "B"), manager("c", "C")];
  const pairs = candidatePairs(managers, new Map(), {}, 2025);
  assert.equal(pairs.length, 3, "3 managers should produce C(3,2)=3 candidate pairs");
  const keys = new Set(pairs.map((p) => [p.a.id, p.b.id].sort().join("::")));
  assert.equal(keys.size, 3, "no duplicate unordered pairs");
}

const tests: [string, () => void][] = [
  ["greedy pairing is strictly one-to-one (no manager is everyone's rival)", testGreedyPairingIsStrictlyOneToOne],
  ["even roster fully pairs off with no leftover", testEvenRosterHasNoLeftover],
  ["buildRivalries labels the odd-roster leftover instead of duplicating a pair", testBuildRivalriesLabelsOddLeftover],
  ["empty history produces no title/knockout meetings", testEmptyHistoryProducesNoKnockoutsOrTitles],
  ["candidatePairs covers every unordered pair exactly once", testCandidatePairsCoversEveryUnorderedPair],
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
console.log(`\nAll ${tests.length} rivalry tests passed.`);
