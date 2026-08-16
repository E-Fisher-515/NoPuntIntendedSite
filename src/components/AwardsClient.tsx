"use client";

import { AwardCard } from "@/components/AwardCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { mergeAwards } from "@/lib/editorial";
import type { Award, Editorial, Manager } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

export function AwardsClient({
  espnAwards,
  managers,
  initial,
}: {
  espnAwards: Award[];
  managers: Manager[];
  initial: Editorial;
}) {
  const editorial = useEditorial(initial);
  const awards = mergeAwards(espnAwards, editorial);
  const years = [...new Set(awards.map((award) => award.year))].sort((a, b) => b - a);
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Honors"
        title="Awards"
        lede="Stat-backed awards are computed from ESPN. Custom league awards are added from the commissioner portal."
      />
      {years.map((year) => (
        <section key={year} className="mb-10">
          <h2 className="mb-4 font-serif text-3xl text-forest">{year}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {awards
              .filter((award) => award.year === year)
              .map((award) => (
                <AwardCard key={award.id} award={award} managers={managers} />
              ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
