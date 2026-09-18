import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getAllMatchups, getAllSeasons, getLeague, getManagers } from "@/lib/archive";
import { activeRosterYear } from "@/lib/lookups";
import { buildRivalries } from "@/lib/rivalries";

export default function RivalriesPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Rivalries" lede="This page will be ready once the season history is loaded." />
      </PageShell>
    );
  }
  const league = getLeague();
  const managers = getManagers();
  const rosterYear = activeRosterYear(managers, league.currentSeason);
  const rivalries = buildRivalries(
    managers,
    league.championships,
    getAllSeasons(),
    getAllMatchups(),
    league.currentSeason,
  );
  // buildRivalries emits a mirrored row per pair (one per manager id) plus a
  // labeled row for any odd-roster leftover; de-dupe pairs by their
  // unordered id so each rivalry renders once, while keeping leftover rows.
  const seenPairs = new Set<string>();
  const display = rivalries.filter((rivalry) => {
    if (rivalry.unpaired) return true;
    const pairId = [rivalry.left.id, rivalry.right.id].sort().join("::");
    if (seenPairs.has(pairId)) return false;
    seenPairs.add(pairId);
    return true;
  });
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Managers"
        title="Rivalries"
        lede={`Each ${rosterYear} manager is paired with exactly one rival, chosen by strongest shared history. Alumni from earlier seasons are not listed.`}
      />
      <div className="grid gap-6">
        {display.map((rivalry) => (
          <article key={rivalry.id} className="border border-rule p-6">
            {rivalry.unpaired ? (
              <>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">Unpaired</p>
                <h2 className="mt-1 font-serif text-3xl text-forest">
                  <Link href={`/managers/${rivalry.left.id}`} className="hover:text-gold-muted">
                    {rivalry.left.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-ink/60">{rivalry.reasons[0]}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">Rivalry · {rivalry.games} games</p>
                <h2 className="mt-1 font-serif text-3xl text-forest">
                  <Link href={`/managers/${rivalry.left.id}`} className="hover:text-gold-muted">
                    {rivalry.left.name}
                  </Link>
                  <span className="mx-2 text-gold-muted">vs</span>
                  <Link href={`/managers/${rivalry.right.id}`} className="hover:text-gold-muted">
                    {rivalry.right.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-ink/60">{rivalry.record}</p>
                <ul className="mt-4 list-disc pl-5 text-sm text-ink/80">
                  {rivalry.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </>
            )}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
