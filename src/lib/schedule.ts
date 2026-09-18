import type { Manager, Matchup } from "./types";
import { lookupOwnerTeam } from "./lookups";

export type ScheduleMatchup = {
  year: number;
  week: number;
  isPlayoff: boolean;
  opponentId: string | null;
  opponentName: string;
  opponentTeamName: string;
};

/**
 * A matchup counts as "valid scheduled data" only when ingest marked it as
 * genuinely undecided (no winner yet) — i.e. a real future game, not a
 * played 0-0 tie. Ingest is responsible for only emitting rows like this
 * for real future weeks; this guard just keeps the UI honest if an older
 * archive ever mixes in a placeholder row.
 */
export function isFutureMatchup(matchup: Matchup): boolean {
  return matchup.winner === null;
}

function opponentTeamId(matchup: Matchup, teamId: number): number | null {
  if (matchup.homeTeamId === teamId) return matchup.awayTeamId;
  if (matchup.awayTeamId === teamId) return matchup.homeTeamId;
  return null;
}

function opponentTeamName(matchup: Matchup, teamId: number): string | undefined {
  if (matchup.homeTeamId === teamId) return matchup.awayTeamName;
  if (matchup.awayTeamId === teamId) return matchup.homeTeamName;
  return undefined;
}

function toScheduleMatchup(matchup: Matchup, teamId: number, managers: Manager[]): ScheduleMatchup | null {
  const oppId = opponentTeamId(matchup, teamId);
  if (oppId == null) return null;
  const identity = lookupOwnerTeam(managers, matchup.year, oppId, opponentTeamName(matchup, teamId));
  const ownerManager = managers.find((manager) => manager.name === identity.ownerName);
  return {
    year: matchup.year,
    week: matchup.week,
    isPlayoff: matchup.isPlayoff,
    opponentId: ownerManager?.id ?? null,
    opponentName: identity.ownerName,
    opponentTeamName: identity.teamName,
  };
}

/**
 * Finds the manager's current and next matchup for a season, using only
 * real scheduled data. Returns null for either side when no such matchup
 * exists so callers can skip rendering rather than guess.
 *
 * "Current" means the actual current week's matchup when the league
 * exposes one (`currentWeekNumber`, from ESPN's `currentWeek`), whether or
 * not it has been played yet -- e.g. mid-week during the current matchup
 * period. When no matchup exists for that exact week (bye week, season
 * not started, or `currentWeekNumber` omitted), this falls back to the
 * most recently decided matchup so the page still has something to show.
 * "Next" is always the earliest undecided matchup after the current one.
 */
export function currentAndNextMatchup(
  matchups: Matchup[],
  teamId: number,
  managers: Manager[],
  currentWeekNumber?: number,
): { current: ScheduleMatchup | null; next: ScheduleMatchup | null } {
  const forTeam = matchups
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => a.week - b.week);

  const decided = forTeam.filter((m) => !isFutureMatchup(m));

  const thisWeekMatchup =
    currentWeekNumber != null ? forTeam.find((m) => m.week === currentWeekNumber) ?? null : null;
  const currentMatchup = thisWeekMatchup ?? decided.at(-1) ?? null;

  const upcoming = forTeam.filter(
    (m) => isFutureMatchup(m) && (currentMatchup ? m.week > currentMatchup.week : true),
  );
  const nextMatchup = upcoming[0] ?? null;

  return {
    current: currentMatchup ? toScheduleMatchup(currentMatchup, teamId, managers) : null,
    next: nextMatchup ? toScheduleMatchup(nextMatchup, teamId, managers) : null,
  };
}
