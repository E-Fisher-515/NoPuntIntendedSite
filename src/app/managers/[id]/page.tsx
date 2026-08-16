import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { archiveReady, getManager, getManagers } from "@/lib/archive";
import { pct, playoffResult, points, recordLine } from "@/lib/format";

export function generateStaticParams() {
  if (!archiveReady()) return [];
  return getManagers().map((manager) => ({ id: manager.id }));
}

export default async function ManagerPage({ params }: { params: Promise<{ id: string }> }) {
  if (!archiveReady()) notFound();
  const { id } = await params;
  const manager = getManager(id);
  const all = getManagers();
  if (!manager) notFound();
  const byId = new Map(all.map((item) => [item.id, item]));

  return (
    <PageShell>
      <SectionHeader eyebrow="Manager profile" title={manager.name} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Career record" value={recordLine(manager.wins, manager.losses, manager.ties)} />
        <StatCard label="Championships" value={String(manager.championships)} />
        <StatCard label="Playoff appearances" value={String(manager.playoffAppearances)} />
        <StatCard label="Average finish" value={manager.averageFinish?.toFixed(1) ?? "—"} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard label="Win %" value={pct(manager.winPct)} />
        <StatCard label="Career points" value={points(manager.pointsFor)} />
        <StatCard label="Seasons" value={String(manager.seasonsPlayed)} />
      </div>
      <section className="mt-12">
        <h2 className="mb-4 font-serif text-3xl text-forest">Career</h2>
        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-forest text-cream">
              <tr className="text-[11px] uppercase tracking-[0.14em]">
                <th className="px-3 py-2 font-normal">Season</th>
                <th className="px-3 py-2 font-normal">Team</th>
                <th className="px-3 py-2 font-normal">Record</th>
                <th className="px-3 py-2 font-normal">Points</th>
                <th className="px-3 py-2 font-normal">Finish</th>
                <th className="px-3 py-2 font-normal">Playoff result</th>
              </tr>
            </thead>
            <tbody>
              {manager.seasons.map((season) => (
                <tr key={season.year} className="border-t border-rule odd:bg-cream even:bg-cream-dark/30">
                  <td className="px-3 py-2">
                    <Link href={`/seasons/${season.year}`} className="hover:text-forest">
                      {season.year}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{season.teamName}</td>
                  <td className="px-3 py-2">{recordLine(season.wins, season.losses, season.ties)}</td>
                  <td className="px-3 py-2">{points(season.pointsFor)}</td>
                  <td className="px-3 py-2">{season.finish || "—"}</td>
                  <td className="px-3 py-2">{playoffResult(season.finish, season.playoff, season.champion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-12">
        <h2 className="mb-4 font-serif text-3xl text-forest">Manager records</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            label="Highest scoring week"
            value={manager.highestWeek ? String(manager.highestWeek.points) : "—"}
            detail={
              manager.highestWeek
                ? `${manager.highestWeek.year} Week ${manager.highestWeek.week} vs ${manager.highestWeek.opponentName}`
                : undefined
            }
          />
          <StatCard
            label="Lowest scoring week"
            value={manager.lowestWeek ? String(manager.lowestWeek.points) : "—"}
            detail={
              manager.lowestWeek
                ? `${manager.lowestWeek.year} Week ${manager.lowestWeek.week} vs ${manager.lowestWeek.opponentName}`
                : undefined
            }
          />
          <StatCard label="Best finish" value={manager.bestFinish ? String(manager.bestFinish) : "—"} />
          <StatCard label="Worst finish" value={manager.worstFinish ? String(manager.worstFinish) : "—"} />
        </div>
      </section>
      <section className="mt-12">
        <h2 className="mb-4 font-serif text-3xl text-forest">Head-to-head</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manager.headToHead.map((row) => {
            const opponent = byId.get(row.opponentId);
            const games = row.wins + row.losses + row.ties;
            const share = games ? row.wins / games : 0;
            return (
              <div key={row.opponentId} className="border border-rule p-4">
                <p className="font-serif text-xl text-forest">{opponent?.name ?? row.opponentId}</p>
                <p className="text-sm text-ink/60">{recordLine(row.wins, row.losses, row.ties)}</p>
                <div className="mt-3 h-2 bg-cream-dark">
                  <div className="h-2 bg-forest" style={{ width: `${share * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
