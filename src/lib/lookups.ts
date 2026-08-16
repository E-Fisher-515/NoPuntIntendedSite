import type { Manager, TeamSeason } from "./types";
import { identity } from "./format";

export function isCurrentManager(manager: Manager, currentSeason: number): boolean {
  return manager.seasons.some((season) => season.year === currentSeason);
}

export function currentTeamName(manager: Manager, currentSeason: number): string {
  return (
    manager.seasons.find((season) => season.year === currentSeason)?.teamName ??
    manager.seasons.at(-1)?.teamName ??
    ""
  );
}

export function teamById(teams: TeamSeason[], teamId: number): TeamSeason | undefined {
  return teams.find((team) => team.teamId === teamId);
}

export function findSeasonTeam(teams: TeamSeason[], teamId?: number | null, teamName?: string | null): TeamSeason | undefined {
  if (teamId != null && teamId >= 0) {
    const byId = teamById(teams, teamId);
    if (byId) return byId;
  }
  if (teamName) {
    return teams.find((team) => team.teamName.trim() === teamName.trim());
  }
  return undefined;
}

export function managerById(managers: Manager[], id?: string | null): Manager | undefined {
  if (!id) return undefined;
  return managers.find((manager) => manager.id === id);
}

export function seasonSpan(manager?: Manager | null): string {
  if (!manager?.seasons.length) return "career";
  const years = manager.seasons.map((season) => season.year);
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

export function latestTeamName(manager?: Manager | null): string {
  return manager?.seasons.at(-1)?.teamName || "career";
}

export function lookupOwnerTeam(
  managers: Manager[],
  year: number,
  teamId?: number | null,
  fallbackTeamName?: string,
): { ownerName: string; teamName: string } {
  if (teamId != null && !Number.isNaN(teamId)) {
    for (const manager of managers) {
      const season = manager.seasons.find((row) => row.year === year && row.teamId === teamId);
      if (season) return { ownerName: manager.name, teamName: season.teamName };
    }
  }
  if (fallbackTeamName) {
    for (const manager of managers) {
      const season = manager.seasons.find((row) => row.year === year && row.teamName.trim() === fallbackTeamName.trim());
      if (season) return { ownerName: manager.name, teamName: season.teamName };
    }
  }
  return { ownerName: "", teamName: fallbackTeamName || "" };
}

export function teamIdentity(
  teams: TeamSeason[],
  year: number,
  notable?: { teamName?: string; teamId?: number; ownerName?: string } | null,
  includeYear = true,
): string {
  if (!notable) return "—";
  const team =
    notable.teamId != null
      ? teams.find((row) => row.teamId === notable.teamId)
      : teams.find((row) => row.teamName === notable.teamName);
  return identity(notable.ownerName || team?.ownerName, notable.teamName || team?.teamName, includeYear ? year : undefined);
}

export function matchupSideIdentity(
  managers: Manager[],
  year: number,
  teamId?: number | null,
  teamName?: string | null,
  ownerName?: string | null,
): string {
  const lookedUp = lookupOwnerTeam(managers, year, teamId, teamName ?? undefined);
  return identity(ownerName || lookedUp.ownerName, lookedUp.teamName || teamName, year);
}

export function careerIdentity(managers: Manager[], ownerId?: string | null, ownerName?: string | null): {
  ownerName: string;
  teamName: string;
  year: string;
} {
  const manager = managerById(managers, ownerId);
  return {
    ownerName: ownerName || manager?.name || "",
    teamName: latestTeamName(manager),
    year: seasonSpan(manager),
  };
}
