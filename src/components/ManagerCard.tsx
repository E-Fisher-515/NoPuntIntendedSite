import Link from "next/link";
import type { Manager } from "@/lib/types";
import { pct, recordLine } from "@/lib/format";
import { currentTeamName, seasonSpan } from "@/lib/lookups";
import type { Rivalry } from "@/lib/rivalries";

export function ManagerCard({
  manager,
  currentSeason,
  alumni = false,
  rival,
}: {
  manager: Manager;
  currentSeason?: number;
  alumni?: boolean;
  rival?: Rivalry;
}) {
  const team =
    currentSeason != null ? currentTeamName(manager, currentSeason) : manager.seasons.at(-1)?.teamName;
  return (
    <Link
      href={`/managers/${manager.id}`}
      className="block border border-rule bg-cream p-5 transition-colors hover:border-gold hover:bg-cream-dark/40"
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold-muted">
        {alumni ? "Alumni" : currentSeason ? `${currentSeason} roster` : "Manager"}
      </p>
      <p className="mt-1 font-serif text-2xl text-forest">{manager.name}</p>
      <p className="mt-1 text-sm text-ink/70">{team}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold-muted">
        {manager.championships} titles · {seasonSpan(manager)} · {manager.seasonsPlayed} seasons
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Career</dt>
          <dd>{recordLine(manager.wins, manager.losses, manager.ties)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Win %</dt>
          <dd>{pct(manager.winPct)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Playoffs</dt>
          <dd>{manager.playoffAppearances}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-ink/50">Avg finish</dt>
          <dd>{manager.averageFinish ?? "—"}</dd>
        </div>
      </dl>
      {rival ? (
        <p className="mt-4 text-sm text-ink/70">
          Suggested rival: <span className="text-forest">{rival.right.name}</span>
        </p>
      ) : null}
    </Link>
  );
}
