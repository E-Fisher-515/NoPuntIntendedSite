import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getLeague } from "@/lib/archive";

export default function DraftIndexPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Draft" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const league = getLeague();
  const latest = league.seasons[league.seasons.length - 1];
  if (latest) redirect(`/draft/${latest}`);
  return (
    <PageShell>
      <SectionHeader title="Draft archive" />
      <ul>
        {league.seasons.map((year) => (
          <li key={year}>
            <Link href={`/draft/${year}`}>{year}</Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
