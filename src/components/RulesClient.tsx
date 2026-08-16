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
        eyebrow="League law"
        title="Constitution"
        lede="House rules belong here. ESPN settings are ingested per season; this document is edited from the commissioner portal."
      />
      <ConstitutionBody text={editorial.constitution} />
    </PageShell>
  );
}
