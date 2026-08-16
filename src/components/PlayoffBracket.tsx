import type { Matchup, TeamSeason } from "@/lib/types";
import { MatchupCard } from "./MatchupCard";

export function PlayoffBracket({
  matchups,
  teams,
}: {
  matchups: Matchup[];
  teams: TeamSeason[];
}) {
  const playoff = matchups.filter((matchup) => matchup.isPlayoff);
  if (!playoff.length) {
    return (
      <p className="border border-dashed border-rule px-4 py-6 text-sm text-ink/60">
        ESPN does not expose a full bracket object. Playoff games will appear here when weekly scores are archived.
      </p>
    );
  }
  const byWeek = new Map<number, Matchup[]>();
  for (const matchup of playoff) {
    const list = byWeek.get(matchup.week) ?? [];
    list.push(matchup);
    byWeek.set(matchup.week, list);
  }
  const finishers = [...teams].sort((a, b) => (a.finalStanding || 99) - (b.finalStanding || 99)).slice(0, 3);
  return (
    <div>
      {finishers.length ? (
        <p className="mb-4 text-sm text-ink/70">
          Finals inferred from ESPN finish: {finishers.map((team) => `${team.finalStanding}. ${team.ownerName}`).join(" · ")}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {[...byWeek.entries()].map(([week, games]) => (
          <section key={week}>
            <h3 className="mb-2 text-[11px] uppercase tracking-[0.18em] text-gold-muted">Playoff week {week}</h3>
            <div className="grid gap-2">
              {games.map((game) => (
                <MatchupCard key={`${game.week}-${game.homeTeamId}-${game.awayTeamId}`} matchup={game} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
