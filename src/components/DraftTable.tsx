import type { DraftPick } from "@/lib/types";

export function DraftTable({ picks }: { picks: DraftPick[] }) {
  if (!picks.length) {
    return (
      <p className="border border-dashed border-rule px-4 py-6 text-sm text-ink/60">
        No draft was archived for this season.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto border border-rule">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-forest text-cream">
          <tr className="text-[11px] uppercase tracking-[0.14em]">
            <th className="px-3 py-2 font-normal">Rd</th>
            <th className="px-3 py-2 font-normal">Pick</th>
            <th className="px-3 py-2 font-normal">Overall</th>
            <th className="px-3 py-2 font-normal">Manager</th>
            <th className="px-3 py-2 font-normal">Player</th>
            <th className="px-3 py-2 font-normal">Pos</th>
            <th className="px-3 py-2 font-normal">NFL</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((pick) => (
            <tr key={`${pick.year}-${pick.overall}`} className="border-t border-rule odd:bg-cream even:bg-cream-dark/30">
              <td className="px-3 py-2">{pick.round || "—"}</td>
              <td className="px-3 py-2">{pick.roundPick || "—"}</td>
              <td className="px-3 py-2 text-ink/50">{pick.overall}</td>
              <td className="px-3 py-2">{pick.ownerName}</td>
              <td className="px-3 py-2">
                {pick.playerName || "Unknown player"}
                {pick.keeper ? <span className="ml-2 text-[10px] uppercase tracking-widest text-gold">Keeper</span> : null}
              </td>
              <td className="px-3 py-2">{pick.position || "—"}</td>
              <td className="px-3 py-2">{pick.nflTeam || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
