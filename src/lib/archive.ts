import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { emptyEditorial, normalizeEditorial } from "./editorial";
import type {
  Award,
  Editorial,
  HofInductee,
  LeagueArchive,
  Manager,
  Matchup,
  Predictions,
  SeasonArchive,
  TimelineEvent,
} from "./types";

const archiveDir = join(process.cwd(), "data", "archive");
const contentDir = join(process.cwd(), "content");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function archiveReady(): boolean {
  return existsSync(join(archiveDir, "league.json"));
}

export function getLeague(): LeagueArchive {
  return readJson(join(archiveDir, "league.json"));
}

export function getSeason(year: number): SeasonArchive {
  return readJson(join(archiveDir, "seasons", `${year}.json`));
}

export function getMatchups(year: number): Matchup[] {
  return readJson(join(archiveDir, "matchups", `${year}.json`));
}

export function getManagers(): Manager[] {
  return readJson(join(archiveDir, "managers.json"));
}

export function getManager(id: string): Manager | undefined {
  return getManagers().find((manager) => manager.id === id);
}

export function getRecords(): Record<string, Record<string, unknown[] | Record<string, unknown>>> {
  return readJson(join(archiveDir, "records.json"));
}

export function getEditorialFile(): Editorial {
  const path = join(process.cwd(), "public", "editorial.json");
  if (!existsSync(path)) return emptyEditorial();
  return normalizeEditorial(readJson(path));
}

export function getEspnAwards(): Award[] {
  return existsSync(join(archiveDir, "awards.json")) ? readJson(join(archiveDir, "awards.json")) : [];
}

export function getAwards(): Award[] {
  const generated = getEspnAwards();
  const customPath = join(contentDir, "awards.json");
  const custom: Award[] = existsSync(customPath) ? readJson(customPath) : [];
  return [...generated, ...getEditorialFile().customAwards, ...custom].sort(
    (a, b) => b.year - a.year || a.name.localeCompare(b.name),
  );
}

export function getPredictions(): Predictions {
  return readJson(join(archiveDir, "predictions.json"));
}

export function getHallOfFame(): HofInductee[] {
  const fromEditorial = getEditorialFile().hallOfFame;
  if (fromEditorial.length) return fromEditorial;
  const path = join(contentDir, "hall-of-fame.json");
  return existsSync(path) ? readJson(path) : [];
}

export function getEditorialTimeline(): TimelineEvent[] {
  const fromEditorial = getEditorialFile().timeline;
  if (fromEditorial.length) return fromEditorial;
  const path = join(contentDir, "timeline.json");
  return existsSync(path) ? readJson(path) : [];
}

export function getConstitution(): string {
  const fromEditorial = getEditorialFile().constitution;
  if (fromEditorial && fromEditorial !== emptyEditorial().constitution) return fromEditorial;
  const path = join(contentDir, "constitution.md");
  return existsSync(path) ? readFileSync(path, "utf-8") : fromEditorial;
}

export function getEspnTimeline(): TimelineEvent[] {
  const league = getLeague();
  return [
    {
      year: Math.min(...league.seasons),
      title: "League founded",
      body: `${league.name} begins.`,
      source: "espn",
    },
    ...league.championships.map((champ) => ({
      year: champ.year,
      title: `${champ.ownerName} wins the championship`,
      body: `${champ.ownerName} · ${champ.teamName} · ${champ.year} finishes ${champ.record}${
        champ.runnerUpName ? `, defeating ${champ.runnerUpName}` : ""
      }.`,
      source: "espn" as const,
    })),
  ];
}

export function getTimeline(): TimelineEvent[] {
  return [...getEspnTimeline(), ...getEditorialTimeline()].sort((a, b) => a.year - b.year);
}
