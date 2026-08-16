import { notFound } from "next/navigation";
import { MatchupCard } from "@/components/MatchupCard";
import { PageShell } from "@/components/PageShell";
import { PlayoffBracket } from "@/components/PlayoffBracket";
import { SeasonHeader } from "@/components/SeasonHeader";
import { SeasonSelector } from "@/components/SeasonSelector";
import { SectionHeader } from "@/components/SectionHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { StatCard } from "@/components/StatCard";
import { archiveReady, getLeague, getMatchups, getSeason } from "@/lib/archive";
import { identity } from "@/lib/format";
import { findSeasonTeam, teamIdentity } from "@/lib/lookups";

export function generateStaticParams() {
  if (!archiveReady()) return [];
  return getLeague().seasons.map((year) => ({ year: String(year) }));
}

export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
  if (!archiveReady()) notFound();
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  const league = getLeague();
  if (!league.seasons.includes(year)) notFound();
  const season = getSeason(year);
  const matchups = getMatchups(year);
  const notables = season.notables as {
    highestScoringWeek?: { teamName: string; teamId?: number; points: number; week: number };
    lowestScoringWeek?: { teamName: string; teamId?: number; points: number; week: number };
    biggestBlowout?: { teamName: string; teamId?: number; opponentName: string; margin: number; week: number };
    closestMatchup?: {
      homeTeamName: string;
      awayTeamName: string;
      homeTeamId?: number;
      awayTeamId?: number;
      homeScore: number;
      awayScore: number;
      week: number;
    };
  };
  const weeks = [...new Set(matchups.map((matchup) => matchup.week))].sort((a, b) => a - b);

  return (
    <PageShell>
      <SeasonHeader season={season} />
      <SeasonSelector years={league.seasons} current={year} />
      <section className="mt-10">
        <SectionHeader title="Standings" />
        <StandingsTable teams={season.teams} year={year} />
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <StatCard
          label="Highest scoring team (week)"
          value={notables.highestScoringWeek ? String(notables.highestScoringWeek.points) : "—"}
          detail={
            notables.highestScoringWeek
              ? `${teamIdentity(season.teams, year, notables.highestScoringWeek)} · Week ${notables.highestScoringWeek.week}`
              : undefined
          }
        />
        <StatCard
          label="Lowest scoring team (week)"
          value={notables.lowestScoringWeek ? String(notables.lowestScoringWeek.points) : "—"}
          detail={
            notables.lowestScoringWeek
              ? `${teamIdentity(season.teams, year, notables.lowestScoringWeek)} · Week ${notables.lowestScoringWeek.week}`
              : undefined
          }
        />
        <StatCard
          label="Biggest blowout"
          value={notables.biggestBlowout ? String(notables.biggestBlowout.margin) : "—"}
          detail={
            notables.biggestBlowout
              ? `Week ${notables.biggestBlowout.week}: ${teamIdentity(season.teams, year, notables.biggestBlowout)} over ${
                  findSeasonTeam(season.teams, undefined, notables.biggestBlowout.opponentName)
                    ? identity(
                        findSeasonTeam(season.teams, undefined, notables.biggestBlowout.opponentName)?.ownerName,
                        notables.biggestBlowout.opponentName,
                        year,
                      )
                    : notables.biggestBlowout.opponentName
                }`
              : undefined
          }
        />
        <StatCard
          label="Closest matchup"
          value={
            notables.closestMatchup
              ? `${notables.closestMatchup.homeScore}-${notables.closestMatchup.awayScore}`
              : "—"
          }
          detail={
            notables.closestMatchup
              ? `Week ${notables.closestMatchup.week}: ${identity(
                  findSeasonTeam(season.teams, notables.closestMatchup.homeTeamId, notables.closestMatchup.homeTeamName)?.ownerName,
                  notables.closestMatchup.homeTeamName,
                  year,
                )} vs ${identity(
                  findSeasonTeam(season.teams, notables.closestMatchup.awayTeamId, notables.closestMatchup.awayTeamName)?.ownerName,
                  notables.closestMatchup.awayTeamName,
                  year,
                )}`
              : undefined
          }
        />
      </section>
      <section className="mt-12">
        <SectionHeader title="Playoffs" lede="Bracket inferred from ESPN playoff weeks and final standings." />
        <PlayoffBracket matchups={matchups} teams={season.teams} />
      </section>
      <section className="mt-12">
        <SectionHeader title="Weekly scores" />
        {weeks.map((week) => (
          <div key={week} className="mb-8">
            <h3 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gold-muted">Week {week}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {matchups
                .filter((matchup) => matchup.week === week)
                .map((matchup) => (
                  <MatchupCard key={`${matchup.homeTeamId}-${matchup.awayTeamId}`} matchup={matchup} teams={season.teams} />
                ))}
            </div>
          </div>
        ))}
      </section>
      <p className="mt-8 text-xs text-ink/40">
        Regular season: {season.regularSeasonWeeks} weeks · Playoff teams: {season.playoffTeamCount} ·
        Scoring type: {season.scoringType || "ESPN"}
      </p>
    </PageShell>
  );
}
