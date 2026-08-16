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
    highestScoringWeek?: { teamName: string; points: number; week: number };
    lowestScoringWeek?: { teamName: string; points: number; week: number };
    biggestBlowout?: { teamName: string; opponentName: string; margin: number; week: number };
    closestMatchup?: { homeTeamName: string; awayTeamName: string; homeScore: number; awayScore: number; week: number };
  };
  const weeks = [...new Set(matchups.map((matchup) => matchup.week))].sort((a, b) => a - b);

  return (
    <PageShell>
      <SeasonHeader season={season} />
      <SeasonSelector years={league.seasons} current={year} />
      <section className="mt-10">
        <SectionHeader title="Standings" />
        <StandingsTable teams={season.teams} />
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <StatCard
          label="Highest scoring team (week)"
          value={notables.highestScoringWeek ? String(notables.highestScoringWeek.points) : "—"}
          detail={notables.highestScoringWeek ? `${notables.highestScoringWeek.teamName} · Week ${notables.highestScoringWeek.week}` : undefined}
        />
        <StatCard
          label="Lowest scoring team (week)"
          value={notables.lowestScoringWeek ? String(notables.lowestScoringWeek.points) : "—"}
          detail={notables.lowestScoringWeek ? `${notables.lowestScoringWeek.teamName} · Week ${notables.lowestScoringWeek.week}` : undefined}
        />
        <StatCard
          label="Biggest blowout"
          value={notables.biggestBlowout ? String(notables.biggestBlowout.margin) : "—"}
          detail={
            notables.biggestBlowout
              ? `Week ${notables.biggestBlowout.week}: ${notables.biggestBlowout.teamName} over ${notables.biggestBlowout.opponentName}`
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
              ? `Week ${notables.closestMatchup.week}: ${notables.closestMatchup.homeTeamName} vs ${notables.closestMatchup.awayTeamName}`
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
                  <MatchupCard key={`${matchup.homeTeamId}-${matchup.awayTeamId}`} matchup={matchup} />
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
