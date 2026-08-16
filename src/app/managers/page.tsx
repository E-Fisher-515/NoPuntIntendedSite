import { ManagerCard } from "@/components/ManagerCard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getManagers } from "@/lib/archive";

export default function ManagersPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Managers" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const managers = getManagers();
  return (
    <PageShell>
      <SectionHeader
        eyebrow="The managers"
        title="Directory"
        lede="Career records are rolled up by ESPN owner ID across every archived season."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {managers.map((manager) => (
          <ManagerCard key={manager.id} manager={manager} />
        ))}
      </div>
    </PageShell>
  );
}
