import type { Matchup, TeamSeason } from "@/lib/types";
import { identity, points } from "@/lib/format";
import { teamById } from "@/lib/lookups";
import { isFutureMatchup } from "@/lib/schedule";

export function MatchupCard({
  matchup,
  teams,
  homeOwner,
  awayOwner,
  showYear = true,
}: {
  matchup: Matchup;
  teams?: TeamSeason[];
  homeOwner?: string;
  awayOwner?: string;
  showYear?: boolean;
}) {
  const homeWon = matchup.winner === "home";
  const awayWon = matchup.winner === "away";
  const scheduled = isFutureMatchup(matchup);
  const homeName = homeOwner || (teams ? teamById(teams, matchup.homeTeamId)?.ownerName : "") || "";
  const awayName = awayOwner || (teams ? teamById(teams, matchup.awayTeamId)?.ownerName : "") || "";
  const year = showYear ? matchup.year : undefined;
  return (
    <article className="border border-rule px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">
        {showYear ? `${matchup.year} · ` : ""}
        Week {matchup.week}
        {matchup.isPlayoff ? " · Playoff" : ""}
        {scheduled ? " · Scheduled" : ""}
      </p>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 text-sm">
        <span className={homeWon ? "font-semibold text-forest" : ""}>
          {identity(homeName, matchup.homeTeamName, year)}
        </span>
        <span className={homeWon ? "font-semibold" : "text-ink/60"}>{scheduled ? "TBD" : points(matchup.homeScore)}</span>
        <span className={awayWon ? "font-semibold text-forest" : ""}>
          {identity(awayName, matchup.awayTeamName, year)}
        </span>
        <span className={awayWon ? "font-semibold" : "text-ink/60"}>{scheduled ? "TBD" : points(matchup.awayScore)}</span>
      </div>
    </article>
  );
}
