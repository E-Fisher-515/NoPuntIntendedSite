import type { Championship, Manager, Matchup, SeasonArchive } from "./types";

export type TitleMeeting = { year: number; winner: string; loser: string };
export type KnockoutMeeting = { year: number; winner: string; loser: string };

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

/** Championship-game meetings between managers, keyed by unordered pair. */
export function buildTitleMeetings(
  championships: Championship[],
  managers: Manager[],
): Map<string, TitleMeeting[]> {
  const titles = new Map<string, TitleMeeting[]>();
  for (const champ of championships) {
    if (!champ.ownerId || !champ.runnerUpName) continue;
    const loser = managers.find((manager) => manager.name === champ.runnerUpName);
    if (!loser) continue;
    const key = pairKey(champ.ownerId, loser.id);
    const list = titles.get(key) ?? [];
    list.push({ year: champ.year, winner: champ.ownerName, loser: loser.name });
    titles.set(key, list);
  }
  return titles;
}

/** Winners-bracket playoff meetings between managers, keyed by unordered pair. */
export function buildKnockoutMeetings(
  seasons: SeasonArchive[],
  matchups: Matchup[],
  managers: Manager[],
): Record<string, KnockoutMeeting[]> {
  const knockouts: Record<string, KnockoutMeeting[]> = {};
  const teamOwner = new Map<string, string>();
  for (const season of seasons) {
    for (const team of season.teams) {
      if (team.ownerId) teamOwner.set(`${season.year}-${team.teamId}`, team.ownerId);
    }
  }
  const byId = new Map(managers.map((manager) => [manager.id, manager]));
  for (const game of matchups) {
    if (!game.isPlayoff || game.matchupType !== "WINNERS_BRACKET" || !game.winner) continue;
    const homeId = teamOwner.get(`${game.year}-${game.homeTeamId}`);
    const awayId = teamOwner.get(`${game.year}-${game.awayTeamId}`);
    if (!homeId || !awayId) continue;
    const winnerId = game.winner === "home" ? homeId : awayId;
    const loserId = game.winner === "home" ? awayId : homeId;
    const key = pairKey(winnerId, loserId);
    const list = knockouts[key] ?? [];
    list.push({
      year: game.year,
      winner: byId.get(winnerId)?.name ?? "Unknown",
      loser: byId.get(loserId)?.name ?? "Unknown",
    });
    knockouts[key] = list;
  }
  return knockouts;
}
