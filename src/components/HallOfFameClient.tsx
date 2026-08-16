"use client";

import { HallOfFameCard } from "@/components/HallOfFameCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import type { Editorial } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

export function HallOfFameClient({ initial }: { initial: Editorial }) {
  const editorial = useEditorial(initial);
  const inductees = editorial.hallOfFame;
  return (
    <PageShell>
      <SectionHeader
        eyebrow="The hall"
        title="Hall of Fame"
        lede="Induction is editorial, not automatic. The commissioner reviews archive suggestions and approves a class from the admin portal."
      />
      {inductees.length ? (
        <div className="grid gap-6">
          {inductees.map((inductee) => (
            <HallOfFameCard key={inductee.id} inductee={inductee} />
          ))}
        </div>
      ) : (
        <p className="border border-gold/40 bg-cream-dark/40 px-6 py-16 text-center font-serif text-2xl text-forest">
          The hall awaits its first class.
        </p>
      )}
    </PageShell>
  );
}
