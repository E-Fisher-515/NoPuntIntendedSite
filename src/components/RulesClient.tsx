"use client";

import { ConstitutionBody } from "@/components/ConstitutionBody";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import type { Editorial } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

export function RulesClient({ initial }: { initial: Editorial }) {
  const editorial = useEditorial(initial);
  return (
    <PageShell>
      <SectionHeader
        eyebrow="League"
        title="Constitution"
        lede="House rules for No Punt Intended, including the 2026 draft, scoring, roster, and lottery changes. To propose a change, contact the commissioner."
      />
      <ConstitutionBody text={editorial.constitution} />
    </PageShell>
  );
}
