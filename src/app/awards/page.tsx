import { AwardsClient } from "@/components/AwardsClient";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getEditorialFile, getEspnAwards, getManagers } from "@/lib/archive";

export default function AwardsPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Awards" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  return (
    <AwardsClient espnAwards={getEspnAwards()} managers={getManagers()} initial={getEditorialFile()} />
  );
}
