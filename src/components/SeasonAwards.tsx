"use client";

import { AwardCard } from "@/components/AwardCard";
import { SectionHeader } from "@/components/SectionHeader";
import { mergeAwards } from "@/lib/editorial";
import type { Award, Editorial, Manager } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

export function SeasonAwards({
  year,
  espnAwards,
  managers,
  initial,
}: {
  year: number;
  espnAwards: Award[];
  managers: Manager[];
  initial: Editorial;
}) {
  const editorial = useEditorial(initial);
  const awards = mergeAwards(espnAwards, editorial).filter((award) => award.year === year);
  return (
    <section id="awards" className="mt-12">
      <SectionHeader
        title="Awards"
        lede="Honors from this season. To add a league award, contact the commissioner."
      />
      {awards.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {awards.map((award) => (
            <AwardCard key={award.id} award={award} managers={managers} />
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-rule px-4 py-6 text-sm text-ink/60">
          No awards recorded for this season yet. To add one, contact the commissioner.
        </p>
      )}
    </section>
  );
}
