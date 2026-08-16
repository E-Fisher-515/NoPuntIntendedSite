import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftTable } from "@/components/DraftTable";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getDraft, getLeague } from "@/lib/archive";

export function generateStaticParams() {
  if (!archiveReady()) return [];
  return getLeague().seasons.map((year) => ({ year: String(year) }));
}

export default async function DraftYearPage({ params }: { params: Promise<{ year: string }> }) {
  if (!archiveReady()) notFound();
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  const league = getLeague();
  if (!league.seasons.includes(year)) notFound();
  const picks = getDraft(year);

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Draft archive"
        title={`${year} Draft`}
        lede="Pick list from ESPN. Steal/bust analytics are not computed yet because they need full player season points."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {league.seasons.map((season) => (
          <Link
            key={season}
            href={`/draft/${season}`}
            className={`border px-3 py-1 text-sm ${
              season === year ? "border-gold bg-forest text-cream" : "border-rule hover:border-gold"
            }`}
          >
            {season}
          </Link>
        ))}
      </div>
      <DraftTable picks={picks} />
    </PageShell>
  );
}
