import type { Championship, Manager, Matchup, SeasonArchive } from "./types";
import { recordLine } from "./format";
import { managerById } from "./lookups";

export type Rivalry = {
  id: string;
  left: { id: string; name: string };
  right: { id: string; name: string };
  record: string;
  games: number;
  reasons: string[];
};

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export function buildRivalries(
  managers: Manager[],
  championships: Championship[],
  seasons: SeasonArchive[],
  matchups: Matchup[],
): Rivalry[] {
  const byId = new Map(managers.map((manager) => [manager.id, manager]));
  const titles = new Map<string, { year: number; winner: string; loser: string }[]>();
  for (const champ of championships) {
    if (!champ.ownerId || !champ.runnerUpName) continue;
    const loser = managers.find((manager) => manager.name === champ.runnerUpName);
    if (!loser) continue;
    const key = pairKey(champ.ownerId, loser.id);
    const list = titles.get(key) ?? [];
    list.push({ year: champ.year, winner: champ.ownerName, loser: loser.name });
    titles.set(key, list);
  }

  const knockouts: Record<string, { year: number; winner: string; loser: string }[]> = {};
  const teamOwner = new Map<string, string>();
  for (const season of seasons) {
    for (const team of season.teams) {
      if (team.ownerId) teamOwner.set(`${season.year}-${team.teamId}`, team.ownerId);
    }
  }
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

  const seen = new Set<string>();
  const rivalries: Rivalry[] = [];
  for (const manager of managers) {
    for (const row of manager.headToHead) {
      const key = pairKey(manager.id, row.opponentId);
      if (seen.has(key)) continue;
      seen.add(key);
      const opponent = managerById(managers, row.opponentId);
      if (!opponent) continue;
      const games = row.wins + row.losses + row.ties;
      if (games < 3) continue;
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
      } else if (games >= 4 && Math.abs(row.wins - row.losses) <= 1) {
        score += 10;
        reasons.push(`Closest records in the league: ${recordLine(row.wins, row.losses, row.ties)} over ${games} games.`);
      }
      if (manager.championships && opponent.championships) {
        score += 6;
        reasons.push(`Both have titles (${manager.name} ${manager.championships}, ${opponent.name} ${opponent.championships}).`);
      }
      if (!reasons.length) continue;
      rivalries.push({
        id: key,
        left: { id: manager.id, name: manager.name },
        right: { id: opponent.id, name: opponent.name },
        record: `${manager.name} ${recordLine(row.wins, row.losses, row.ties)} vs ${opponent.name}`,
        games,
        reasons,
      });
    }
  }
  return rivalries.sort((a, b) => b.reasons.length - a.reasons.length || b.games - a.games).slice(0, 12);
}
