import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getLeague } from "@/lib/archive";

export default function SeasonsIndexPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Seasons" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const league = getLeague();
  const byYear = new Map(league.championships.map((champ) => [champ.year, champ]));
  return (
    <PageShell>
      <SectionHeader
        eyebrow="The record"
        title="Seasons"
        lede="Every archived year, with the champion when ESPN has a final standing."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...league.seasons].sort((a, b) => b - a).map((year) => {
          const champ = byYear.get(year);
          return (
            <Link key={year} href={`/seasons/${year}`} className="border border-rule p-5 hover:border-gold">
              <p className="font-serif text-3xl text-forest">{year}</p>
              <p className="mt-2 text-sm text-ink/70">
                {champ
                  ? `Champion · ${champ.ownerName}`
                  : year === league.currentSeason
                    ? "In progress"
                    : "See season page"}
              </p>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
