"use client";

import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { Timeline } from "@/components/Timeline";
import type { Editorial, TimelineEvent } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

export function HistoryClient({ espnEvents, initial }: { espnEvents: TimelineEvent[]; initial: Editorial }) {
  const editorial = useEditorial(initial);
  const events = [...espnEvents, ...editorial.timeline].sort((a, b) => a.year - b.year);
  return (
    <PageShell>
      <SectionHeader
        eyebrow="League history"
        title="The timeline"
        lede="Championships and founding dates come from ESPN. Editorial events are added from the commissioner portal."
      />
      <Timeline events={events} />
    </PageShell>
  );
}
