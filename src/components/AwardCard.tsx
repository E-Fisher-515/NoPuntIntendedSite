import type { Award } from "@/lib/types";

export function AwardCard({ award }: { award: Award }) {
  return (
    <article className="border border-rule px-4 py-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold-muted">
        {award.year} · {award.source === "espn" ? "From the record" : "League honor"}
      </p>
      <h3 className="mt-2 font-serif text-2xl text-forest">{award.name}</h3>
      <p className="mt-1 text-sm">{award.winnerName}</p>
      <p className="text-sm text-ink/60">{award.detail}</p>
    </article>
  );
}
