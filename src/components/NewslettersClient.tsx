"use client";

import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import type { Editorial, NewsletterIssue } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

function weekLabel(week: NewsletterIssue["week"]) {
  return week === "eoy" ? "Year in review" : `Week ${week}`;
}

export function NewslettersClient({ seeded, initial }: { seeded: NewsletterIssue[]; initial: Editorial }) {
  const editorial = useEditorial(initial);
  const issues = [...editorial.newsletters, ...seeded.filter((item) => !editorial.newsletters.some((row) => row.id === item.id))].sort(
    (a, b) => b.year - a.year || Number(b.week === "eoy" ? 99 : b.week) - Number(a.week === "eoy" ? 99 : a.week),
  );
  return (
    <PageShell>
      <SectionHeader
        eyebrow="League"
        title="Newsletters"
        lede="Weekly recaps for the league. The commissioner can publish a new issue from Admin."
      />
      {!issues.length ? (
        <p className="border border-dashed border-rule px-4 py-8 text-ink/70">No newsletters published yet.</p>
      ) : (
        <div className="grid gap-3">
          {issues.map((issue) => (
            <a
              key={issue.id}
              href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${issue.path}`}
              className="block border border-rule px-5 py-4 hover:border-gold"
              target="_blank"
              rel="noreferrer"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">
                {issue.year} · {weekLabel(issue.week)}
              </p>
              <p className="mt-1 font-serif text-2xl text-forest">{issue.title}</p>
            </a>
          ))}
        </div>
      )}
    </PageShell>
  );
}
