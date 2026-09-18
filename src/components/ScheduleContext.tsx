import Link from "next/link";
import type { ScheduleMatchup } from "@/lib/schedule";

function ScheduleRow({ label, matchup }: { label: string; matchup: ScheduleMatchup }) {
  const opponent = matchup.opponentId ? (
    <Link href={`/managers/${matchup.opponentId}`} className="text-forest hover:text-gold-muted">
      {matchup.opponentName}
    </Link>
  ) : (
    <span>{matchup.opponentName || matchup.opponentTeamName || "TBD"}</span>
  );
  return (
    <div className="border border-rule p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">
        {label} · {matchup.year} Week {matchup.week}
        {matchup.isPlayoff ? " · Playoff" : ""}
      </p>
      <p className="mt-1 text-sm text-ink/80">vs {opponent}</p>
    </div>
  );
}

/**
 * Shows current/next matchup only when real scheduled data exists for
 * either side. Renders nothing if there is neither, so pages never show a
 * fabricated or guessed matchup.
 */
export function ScheduleContext({
  current,
  next,
}: {
  current: ScheduleMatchup | null;
  next: ScheduleMatchup | null;
}) {
  if (!current && !next) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-serif text-3xl text-forest">Schedule</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {current ? <ScheduleRow label="Current matchup" matchup={current} /> : null}
        {next ? <ScheduleRow label="Next matchup" matchup={next} /> : null}
      </div>
    </section>
  );
}
