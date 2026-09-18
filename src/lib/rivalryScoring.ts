import type { Manager } from "./types";
import { recordLine } from "./format";
import { pairKey, type KnockoutMeeting, type TitleMeeting } from "./rivalryHistory";

export type PairFacts = {
  score: number;
  games: number;
  reasons: string[];
  record: string;
};

/** Scores and explains one candidate rivalry pairing. Preserves the original scoring math. */
export function scorePair(
  manager: Manager,
  opponent: Manager,
  row: { wins: number; losses: number; ties: number },
  titles: Map<string, TitleMeeting[]>,
  knockouts: Record<string, KnockoutMeeting[]>,
  currentSeason: number,
): PairFacts {
  const games = row.wins + row.losses + row.ties;
  const key = pairKey(manager.id, opponent.id);
  const reasons: string[] = [];
  let score = games;

  const titleMeetings = titles.get(key) ?? [];
  if (titleMeetings.length) {
    score += 20 * titleMeetings.length;
    reasons.push(
      `Met in the championship ${titleMeetings.length === 1 ? "once" : `${titleMeetings.length} times`}: ${titleMeetings
        .map((item) => `${item.year} (${item.winner} over ${item.loser})`)
        .join("; ")}`,
    );
  }

  const playoffMeetings = knockouts[key] ?? [];
  if (playoffMeetings.length) {
    score += 8 * playoffMeetings.length;
    const latest = playoffMeetings[playoffMeetings.length - 1];
    reasons.push(
      `Playoff history: ${playoffMeetings.length} winners-bracket meetings. Latest: ${latest.year}, ${latest.winner} sent ${latest.loser} home.`,
    );
  }

  const winShare = games ? row.wins / games : 0.5;
  if (games >= 4 && winShare >= 0.75) {
    score += 12;
    reasons.push(
      `${manager.name} owns the series ${recordLine(row.wins, row.losses, row.ties)} — ${opponent.name} is due for a win.`,
    );
  } else if (games >= 4 && winShare <= 0.25) {
    score += 12;
    reasons.push(
      `${opponent.name} owns the series ${recordLine(row.losses, row.wins, row.ties)} — ${manager.name} is due for a win.`,
    );
  } else if (games >= 2 && Math.abs(row.wins - row.losses) <= 1) {
    score += 10;
    reasons.push(`Close series: ${recordLine(row.wins, row.losses, row.ties)} over ${games} game${games === 1 ? "" : "s"}.`);
  }

  if (manager.championships && opponent.championships) {
    score += 6;
    reasons.push(`Both have titles (${manager.name} ${manager.championships}, ${opponent.name} ${opponent.championships}).`);
  }

  if (!reasons.length) {
    if (games) {
      reasons.push(
        `Most history among the ${currentSeason} managers: ${games} game${games === 1 ? "" : "s"}, ${recordLine(row.wins, row.losses, row.ties)}.`,
      );
    } else {
      reasons.push(`Both are on the ${currentSeason} roster. A series is still waiting to be written.`);
    }
  }

  return {
    score,
    games,
    reasons,
    record: `${manager.name} ${recordLine(row.wins, row.losses, row.ties)} vs ${opponent.name}`,
  };
}

/** All candidate pair scores for a roster, one row per unordered pair. */
export function candidatePairs(
  current: Manager[],
  titles: Map<string, TitleMeeting[]>,
  knockouts: Record<string, KnockoutMeeting[]>,
  rosterYear: number,
): { a: Manager; b: Manager; facts: PairFacts }[] {
  const pairs: { a: Manager; b: Manager; facts: PairFacts }[] = [];
  for (let i = 0; i < current.length; i += 1) {
    for (let j = i + 1; j < current.length; j += 1) {
      const a = current[i];
      const b = current[j];
      const row = a.headToHead.find((entry) => entry.opponentId === b.id) ?? {
        wins: 0,
        losses: 0,
        ties: 0,
        opponentId: b.id,
      };
      const facts = scorePair(a, b, row, titles, knockouts, rosterYear);
      pairs.push({ a, b, facts });
    }
  }
  return pairs;
}
