import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getAllMatchups, getAllSeasons, getLeague, getManagers } from "@/lib/archive";
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
  const rivalries = buildRivalries(getManagers(), league.championships, getAllSeasons(), getAllMatchups());
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Bad blood"
        title="Rivalries"
        lede="Recommended rivalries from championship meetings, playoff knockouts, lopsided series, and the closest career records."
      />
      <div className="grid gap-6">
        {rivalries.map((rivalry) => (
          <article key={rivalry.id} className="border border-rule p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">{rivalry.games} games</p>
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
          </article>
        ))}
      </div>
    </PageShell>
  );
}
