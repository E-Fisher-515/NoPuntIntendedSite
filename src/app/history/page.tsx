import { HistoryClient } from "@/components/HistoryClient";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getEditorialFile, getEspnTimeline } from "@/lib/archive";

export default function HistoryPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="History" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  return <HistoryClient espnEvents={getEspnTimeline()} initial={getEditorialFile()} />;
}
