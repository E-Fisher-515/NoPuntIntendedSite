import { AwardCard } from "@/components/AwardCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getAwards } from "@/lib/archive";

export default function AwardsPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Awards" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const awards = getAwards();
  const years = [...new Set(awards.map((award) => award.year))].sort((a, b) => b - a);
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Honors"
        title="Awards"
        lede="Stat-backed awards are computed from ESPN. Custom league awards can be added in content/awards.json. Waiver and collapse awards are not invented — ESPN does not keep a full transaction history here."
      />
      {years.map((year) => (
        <section key={year} className="mb-10">
          <h2 className="mb-4 font-serif text-3xl text-forest">{year}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {awards
              .filter((award) => award.year === year)
              .map((award) => (
                <AwardCard key={award.id} award={award} />
              ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
