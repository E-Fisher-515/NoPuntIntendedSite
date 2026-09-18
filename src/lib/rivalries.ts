import type { Championship, Manager, Matchup, SeasonArchive } from "./types";
import { activeRosterYear, isCurrentManager } from "./lookups";
import { buildKnockoutMeetings, buildTitleMeetings } from "./rivalryHistory";
import { candidatePairs, type PairFacts } from "./rivalryScoring";

export type Rivalry = {
  id: string;
  left: { id: string; name: string };
  right: { id: string; name: string };
  record: string;
  games: number;
  reasons: string[];
  /** True when this manager could not be paired 1:1 (odd roster leftover). */
  unpaired?: boolean;
};

/**
 * Strict maximum-weight one-to-one pairing via greedy matching: sort all
 * candidate pairs by score descending and take a pair only if neither side
 * has already been claimed. This guarantees every manager appears in at
 * most one rivalry (no manager can be "everyone's rival") and, being
 * greedy-by-score, approximates the heaviest available matching without a
 * full assignment-problem solver, which is unnecessary at league scale.
 *
 * With an odd number of managers, exactly one manager is left unmatched
 * once every pair is claimed; callers must label that leftover explicitly
 * rather than forcing a fake trio or duplicate pairing.
 */
export function greedyMaxWeightPairing<M extends { id: string; name: string }>(
  managers: M[],
  pairs: { a: M; b: M; facts: PairFacts }[],
): { matched: { a: M; b: M; facts: PairFacts }[]; leftover: M | null } {
  const claimed = new Set<string>();
  const sorted = pairs.slice().sort((x, y) => y.facts.score - x.facts.score);
  const matched: { a: M; b: M; facts: PairFacts }[] = [];

  for (const pair of sorted) {
    if (claimed.has(pair.a.id) || claimed.has(pair.b.id)) continue;
    matched.push(pair);
    claimed.add(pair.a.id);
    claimed.add(pair.b.id);
  }

  const leftover = managers.find((manager) => !claimed.has(manager.id)) ?? null;
  return { matched, leftover };
}

function pairToRivalries(pair: { a: Manager; b: Manager; facts: PairFacts }): Rivalry[] {
  const shared = { record: pair.facts.record, games: pair.facts.games, reasons: pair.facts.reasons };
  return [
    { id: `${pair.a.id}::${pair.b.id}`, left: { id: pair.a.id, name: pair.a.name }, right: { id: pair.b.id, name: pair.b.name }, ...shared },
    // Mirror row so lookups by either manager id resolve to their rivalry.
    { id: `${pair.b.id}::${pair.a.id}`, left: { id: pair.b.id, name: pair.b.name }, right: { id: pair.a.id, name: pair.a.name }, ...shared },
  ];
}

function leftoverRivalry(manager: Manager, rosterYear: number): Rivalry {
  return {
    id: manager.id,
    left: { id: manager.id, name: manager.name },
    right: { id: manager.id, name: manager.name },
    record: "—",
    games: 0,
    reasons: [
      `Odd number of ${rosterYear} managers — ${manager.name} has no rival slot left after every other manager was paired.`,
    ],
    unpaired: true,
  };
}

export function buildRivalries(
  managers: Manager[],
  championships: Championship[],
  seasons: SeasonArchive[],
  matchups: Matchup[],
  currentSeason: number,
): Rivalry[] {
  const rosterYear = activeRosterYear(managers, currentSeason);
  const current = managers
    .filter((manager) => isCurrentManager(manager, rosterYear))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  if (current.length < 2) {
    return current.map((manager) => ({
      id: manager.id,
      left: { id: manager.id, name: manager.name },
      right: { id: manager.id, name: manager.name },
      record: "—",
      games: 0,
      reasons: [`No other ${rosterYear} manager is on record yet.`],
      unpaired: true,
    }));
  }

  const titles = buildTitleMeetings(championships, managers);
  const knockouts = buildKnockoutMeetings(seasons, matchups, managers);
  const pairs = candidatePairs(current, titles, knockouts, rosterYear);
  const { matched, leftover } = greedyMaxWeightPairing(current, pairs);

  const rivalries = matched.flatMap(pairToRivalries);
  if (leftover) rivalries.push(leftoverRivalry(leftover, rosterYear));
  return rivalries;
}

export function rivalryFor(rivalries: Rivalry[], managerId: string): Rivalry | undefined {
  return rivalries.find((rivalry) => rivalry.left.id === managerId);
}
