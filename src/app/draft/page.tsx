import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getLeague } from "@/lib/archive";

export default function DraftIndexPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Draft" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const league = getLeague();
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Draft archive"
        title="Select a season"
        lede="Every ESPN draft on record. Steal/bust analytics are not computed yet."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...league.seasons].sort((a, b) => b - a).map((year) => (
          <Link key={year} href={`/draft/${year}`} className="border border-rule p-5 hover:border-gold">
            <p className="font-serif text-3xl text-forest">{year}</p>
            <p className="mt-1 text-sm text-ink/60">View draft board</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
