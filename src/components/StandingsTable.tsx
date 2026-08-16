import Link from "next/link";
import type { TeamSeason } from "@/lib/types";
import { points, recordLine } from "@/lib/format";

type Props = {
  teams: TeamSeason[];
  year?: number;
};

export function StandingsTable({ teams, year }: Props) {
  const rows = [...teams].sort((a, b) => (a.finalStanding || 99) - (b.finalStanding || 99));
  return (
    <div>
      {year ? (
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-gold-muted">{year} standings</p>
      ) : null}
      <div className="overflow-x-auto border border-rule">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-forest text-cream">
            <tr className="text-[11px] uppercase tracking-[0.16em]">
              <th className="px-3 py-2 font-normal">#</th>
              <th className="px-3 py-2 font-normal">Manager</th>
              <th className="px-3 py-2 font-normal">Team</th>
              <th className="px-3 py-2 font-normal">Record</th>
              <th className="px-3 py-2 font-normal">PF</th>
              <th className="px-3 py-2 font-normal">PA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team, index) => (
              <tr key={`${team.teamId}-${team.ownerId}`} className="border-t border-rule odd:bg-cream even:bg-cream-dark/30">
                <td className="px-3 py-2 text-gold-muted">{team.finalStanding || index + 1}</td>
                <td className="px-3 py-2">
                  {team.ownerId ? (
                    <Link href={`/managers/${team.ownerId}`} className="hover:text-forest">
                      {team.ownerName}
                    </Link>
                  ) : (
                    team.ownerName
                  )}
                </td>
                <td className="px-3 py-2 text-ink/70">
                  {team.teamName}
                  {year ? ` · ${year}` : ""}
                </td>
                <td className="px-3 py-2">{recordLine(team.wins, team.losses, team.ties)}</td>
                <td className="px-3 py-2">{points(team.pointsFor)}</td>
                <td className="px-3 py-2">{points(team.pointsAgainst)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
