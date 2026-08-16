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
        title="Rules"
        lede="This year's draft, scoring, roster, and lottery rules."
      />
      <ConstitutionBody text={editorial.constitution} />
    </PageShell>
  );
}
