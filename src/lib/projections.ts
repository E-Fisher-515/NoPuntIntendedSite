import type { Manager, SeasonArchive, TeamSeason } from "./types";
import { recordLine } from "./format";

export type TeamProjection = {
  ownerId: string | null;
  ownerName: string;
  teamName: string;
  record: string;
  pointsFor: number;
  pointsAgainst: number;
  projectedFinish: number;
  championPct: number;
  playoffPct: number;
  strengths: string[];
  weaknesses: string[];
  roast: string;
  projection: string;
  score: number;
};

type TeamMetrics = {
  team: TeamSeason;
  manager: Manager | undefined;
  games: number;
  ppg: number;
  papg: number;
  margin: number;
  winRate: number;
};

function metrics(team: TeamSeason, managers: Manager[]): TeamMetrics {
  const games = team.wins + team.losses + team.ties;
  return {
    team,
    manager: managers.find((manager) => manager.id === team.ownerId),
    games,
    ppg: games ? team.pointsFor / games : 0,
    papg: games ? team.pointsAgainst / games : 0,
    margin: team.pointsFor - team.pointsAgainst,
    winRate: games ? (team.wins + team.ties * 0.5) / games : 0.5,
  };
}

function percentile(value: number, values: number[], highIsGood = true): number {
  if (values.length < 2) return 0.5;
  const below = values.filter((item) => (highIsGood ? item < value : item > value)).length;
  return 0.25 + 0.75 * (below / (values.length - 1));
}

function projectionText(item: TeamMetrics, playoffTeams: number): string {
  const { team, manager, margin } = item;
  if (team.wins >= 3 && margin > 0) {
    return `${team.ownerName} has the record and scoring profile of a playoff team. The question is whether the margin holds when the schedule gets meaner.`;
  }
  if (margin > 0) {
    return `${team.ownerName} is scoring well enough to stay dangerous, but the record still needs to catch up with the underlying numbers.`;
  }
  if (team.wins >= 3) {
    return `${team.ownerName} is winning, but the positive results are doing more work than the scoring profile. Regression is lurking.`;
  }
  if (manager?.championships) {
    return `${team.ownerName} has ${manager.championships} career title${manager.championships === 1 ? "" : "s"} and enough history to make this uncomfortable for everyone ahead of them.`;
  }
  return `${team.ownerName} is currently outside the top ${playoffTeams}; the path back is simple: score more, allow less, or preferably both.`;
}

function roastText(item: TeamMetrics, rank: number, total: number): string {
  const { team, papg, ppg, margin, manager } = item;
  if (team.wins === 0) return `${team.ownerName} is currently treating the win column like a museum: lots of looking, no touching.`;
  if (margin < -80) return `${team.ownerName} is not losing the point differential; they are donating it to the league.`;
  if (papg > ppg + 15) return `${team.ownerName} has built a team that scores like a contender and defends like the lineup was submitted by carrier pigeon.`;
  if (rank === 1) return `${team.ownerName} is on top, which means the league has already started planning the collapse narrative.`;
  if (rank === total) return `${team.ownerName} is bringing up the rear with the confidence of someone who still thinks this is part of the plan.`;
  if (manager?.championships) return `${team.ownerName} has a title history doing a lot of unpaid labor for this current roster.`;
  return `${team.ownerName} is hovering in the standings' least comfortable middle seat: not safe, not doomed, and absolutely not relaxed.`;
}

export function buildTeamProjections(season: SeasonArchive, managers: Manager[]): TeamProjection[] {
  const items = season.teams.map((team) => metrics(team, managers));
  const ppgValues = items.map((item) => item.ppg);
  const marginValues = items.map((item) => item.margin);
  const winValues = items.map((item) => item.winRate);
  const playoffTeams = season.playoffTeamCount || Math.ceil(items.length / 2);

  const scored = items.map((item) => {
    const score =
      percentile(item.winRate, winValues) * 0.4 +
      percentile(item.ppg, ppgValues) * 0.35 +
      percentile(item.margin, marginValues) * 0.25;
    return { item, score };
  });
  const ordered = scored.slice().sort((a, b) => b.score - a.score || b.item.team.pointsFor - a.item.team.pointsFor);
  const maxScore = Math.max(...ordered.map((entry) => entry.score), 1);

  return ordered.map(({ item, score }, index) => {
    const { team, manager, ppg, papg, margin } = item;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const rank = index + 1;

    if (percentile(ppg, ppgValues) >= 0.75) strengths.push(`Top-quarter scoring at ${ppg.toFixed(1)} points per game`);
    else if (ppg >= 110) strengths.push(`A credible ${ppg.toFixed(1)} points per game`);
    if (margin > 0) strengths.push(`Positive scoring margin of ${margin.toFixed(1)} points`);
    if (team.wins >= team.losses + 2) strengths.push(`A record with real breathing room at ${recordLine(team.wins, team.losses, team.ties)}`);
    if (manager?.championships) strengths.push(`${manager.championships} career championship${manager.championships === 1 ? "" : "s"} in the back pocket`);
    if (!strengths.length) strengths.push("Still within striking distance of a meaningful run");

    if (percentile(papg, items.map((entry) => entry.papg), false) < 0.35) weaknesses.push(`Allowing ${papg.toFixed(1)} points per game`);
    if (margin < -40) weaknesses.push(`A worrying ${margin.toFixed(1)} point scoring margin`);
    if (team.wins < team.losses) weaknesses.push(`A losing record that needs a turnaround`);
    if (team.pointsFor < 100 * Math.max(item.games, 1)) weaknesses.push("Scoring has been too inconsistent to trust weekly");
    if (!weaknesses.length) weaknesses.push("The margin for error is thinner than the record suggests");

    return {
      ownerId: team.ownerId,
      ownerName: team.ownerName,
      teamName: team.teamName,
      record: recordLine(team.wins, team.losses, team.ties),
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
      projectedFinish: rank,
      championPct: Number((100 * (score / (maxScore * (index + 1)))).toFixed(1)),
      playoffPct: Number((100 * Math.max(0.05, 1 - index / Math.max(items.length, 1))).toFixed(1)),
      strengths,
      weaknesses,
      roast: roastText(item, rank, items.length),
      projection: projectionText(item, playoffTeams),
      score,
    };
  });
}
