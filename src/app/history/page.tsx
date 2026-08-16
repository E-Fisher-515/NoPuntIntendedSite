import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { Timeline } from "@/components/Timeline";
import { archiveReady, getTimeline } from "@/lib/archive";

export default function HistoryPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="History" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const events = getTimeline();
  return (
    <PageShell>
      <SectionHeader
        eyebrow="League history"
        title="The timeline"
        lede="Championships and founding dates come from ESPN. Editorial events can be added in content/timeline.json."
      />
      <Timeline events={events} />
    </PageShell>
  );
}
