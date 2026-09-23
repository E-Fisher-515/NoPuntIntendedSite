import assert from "node:assert/strict";
import { buildTeamProjections } from "../projections";
import type { Manager, SeasonArchive } from "../types";

const team = (overrides: Partial<SeasonArchive["teams"][number]> = {}) => ({
  teamId: 1,
  teamName: "Top Team",
  abbrev: "TOP",
  logoUrl: "",
  ownerId: "owner-1",
  ownerName: "Erik",
  wins: 2,
  losses: 0,
  ties: 0,
  pointsFor: 300,
  pointsAgainst: 200,
  standing: 1,
  finalStanding: 1,
  playoffPct: 76.33,
  trades: 0,
  acquisitions: 0,
  drops: 0,
  division: "",
  ...overrides,
});

const season: SeasonArchive = {
  year: 2026,
  name: "No Punt Intended",
  complete: false,
  teamCount: 2,
  regularSeasonWeeks: 14,
  playoffTeamCount: 1,
  keeperCount: 1,
  faab: true,
  acquisitionBudget: 200,
  scoringType: "H2H_POINTS",
  currentWeek: 3,
  teams: [team(), team({ teamId: 2, teamName: "Second Team", ownerId: "owner-2", ownerName: "Other", wins: 0, losses: 2, pointsFor: 200, pointsAgainst: 300, standing: 2, playoffPct: 31.5 })],
  notables: {},
  champion: null,
  currentLeader: null,
  runnerUp: null,
  thirdPlace: null,
  championshipMatchup: null,
};

const managers: Manager[] = [];
const projections = buildTeamProjections(season, managers);
const top = projections.find((projection) => projection.ownerName === "Erik");
assert(top, "top team projection should exist");
assert.equal(top.playoffPct, 76.3, "non-clinched teams should use ESPN playoff odds, not rank-based certainty");
assert.notEqual(top.playoffPct, 100, "non-clinched teams must never display 100% playoff odds");
console.log("OK: non-clinched playoff odds use ESPN probability instead of rank certainty");
