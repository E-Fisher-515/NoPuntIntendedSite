import type { Matchup } from "@/lib/types";
import { points } from "@/lib/format";

export function MatchupCard({ matchup }: { matchup: Matchup }) {
  const homeWon = matchup.winner === "home";
  const awayWon = matchup.winner === "away";
  return (
    <article className="border border-rule px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">
        Week {matchup.week}
        {matchup.isPlayoff ? " · Playoff" : ""}
      </p>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 text-sm">
        <span className={homeWon ? "font-semibold text-forest" : ""}>{matchup.homeTeamName}</span>
        <span className={homeWon ? "font-semibold" : "text-ink/60"}>{points(matchup.homeScore)}</span>
        <span className={awayWon ? "font-semibold text-forest" : ""}>{matchup.awayTeamName}</span>
        <span className={awayWon ? "font-semibold" : "text-ink/60"}>{points(matchup.awayScore)}</span>
      </div>
    </article>
  );
}
