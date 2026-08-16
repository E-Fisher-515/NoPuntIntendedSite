import { ManagerCard } from "@/components/ManagerCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getLeague, getManagers } from "@/lib/archive";
import { isCurrentManager } from "@/lib/lookups";

export default function ManagersPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Managers" lede="This page will be ready once the season history is loaded." />
      </PageShell>
    );
  }
  const league = getLeague();
  const managers = getManagers();
  const current = managers
    .filter((manager) => isCurrentManager(manager, league.currentSeason))
    .sort((a, b) => a.name.localeCompare(b.name));
  const alumni = managers
    .filter((manager) => !isCurrentManager(manager, league.currentSeason))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageShell>
      <SectionHeader
        eyebrow="The managers"
        title="Directory"
        lede={`${league.currentSeason} members first. Alumni from earlier seasons follow. Career records follow each manager across every year they played.`}
      />
      <h2 className="mb-4 font-serif text-3xl text-forest">{league.currentSeason} league</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {current.map((manager) => (
          <ManagerCard key={manager.id} manager={manager} currentSeason={league.currentSeason} />
        ))}
      </div>
      {alumni.length ? (
        <section className="mt-14">
          <h2 className="mb-2 font-serif text-3xl text-forest">Alumni</h2>
          <p className="mb-4 text-sm text-ink/60">Managers who appear in the archive but are not on a {league.currentSeason} roster.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alumni.map((manager) => (
              <ManagerCard key={manager.id} manager={manager} alumni />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
