import { ChampionshipBanner } from "@/components/ChampionshipBanner";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { StandingsTable } from "@/components/StandingsTable";
import { StatCard } from "@/components/StatCard";
import { archiveReady, getLeague, getSeason } from "@/lib/archive";
import { identity, points, recordLine } from "@/lib/format";
import { teamIdentity } from "@/lib/lookups";

export default function HomePage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader
          title="Season history is on the way"
          lede="Check back once the league record has been loaded."
        />
      </PageShell>
    );
  }

  const league = getLeague();
  const current = getSeason(league.currentSeason);
  const year = league.currentSeason;
  const leader = current.complete ? current.champion : current.currentLeader;
  const pfLeader = current.teams.reduce((best, team) => (team.pointsFor > best.pointsFor ? team : best));
  const bestRecord = [...current.teams].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)[0];
  const notables = current.notables as {
    highestScoringWeek?: { teamName: string; teamId?: number; points: number; week: number };
  };

  return (
    <div>
      <ChampionshipBanner championships={league.championships} />
      <PageShell>
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold-muted">Established league archive</p>
        <h1 className="mt-3 font-serif text-5xl text-forest md:text-7xl">{league.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/70">
          A long-running fantasy football league with champions, records, rivalries, and lore.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Current season" value={String(year)} />
          <StatCard
            label={current.complete ? "Current champion" : "Current leader"}
            value={leader?.ownerName ?? "TBD"}
            detail={leader ? identity(leader.ownerName, leader.teamName, year) : undefined}
          />
          <StatCard label="Seasons" value={String(league.seasonCount)} />
          <StatCard label="Managers" value={String(league.managerCount)} />
          <StatCard label="Games played" value={league.gamesPlayed.toLocaleString()} />
          <StatCard label="League size" value={`${league.teamCount} teams`} />
        </div>
        <section className="mt-14">
          <SectionHeader eyebrow={`${year} season`} title="League at a glance" />
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <StatCard
              label="Points leader"
              value={pfLeader.ownerName}
              detail={`${identity(pfLeader.ownerName, pfLeader.teamName, year)} · ${points(pfLeader.pointsFor)} PF`}
            />
            <StatCard
              label="Best record"
              value={bestRecord.ownerName}
              detail={`${identity(bestRecord.ownerName, bestRecord.teamName, year)} · ${recordLine(bestRecord.wins, bestRecord.losses, bestRecord.ties)}`}
            />
            <StatCard
              label="Highest week"
              value={notables.highestScoringWeek ? String(notables.highestScoringWeek.points) : "—"}
              detail={
                notables.highestScoringWeek
                  ? `${teamIdentity(current.teams, year, notables.highestScoringWeek)} · Week ${notables.highestScoringWeek.week}`
                  : "Not yet archived"
              }
            />
          </div>
          <StandingsTable teams={current.teams} year={year} />
        </section>
      </PageShell>
    </div>
  );
}
