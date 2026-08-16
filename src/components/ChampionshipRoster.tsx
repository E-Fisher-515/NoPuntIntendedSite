"use client";

import { useState } from "react";
import type { Championship, ChampionshipRosters } from "@/lib/types";
import { identity, points } from "@/lib/format";
import { displaySlot, sortRoster } from "@/lib/roster";

function SideRoster({
  label,
  ownerName,
  side,
}: {
  label: string;
  ownerName?: string;
  side: ChampionshipRosters["winner"];
}) {
  const players = sortRoster(side.players);
  return (
    <div className="border border-rule p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl text-forest">{identity(ownerName || side.ownerName, side.teamName)}</p>
      <p className="text-sm text-ink/60">{points(side.score)} points</p>
      <ul className="mt-3 space-y-1 text-sm">
        {players.map((player, index) => (
          <li key={`${player.slot}-${player.name}-${index}`} className="flex justify-between gap-3">
            <span>
              <span className="inline-block w-8 text-[11px] uppercase tracking-wider text-ink/40">{displaySlot(player.slot)}</span>{" "}
              {player.name}
            </span>
            <span className="tabular-nums">{points(player.points)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChampionshipRoster({
  championship,
}: {
  championship: Championship & { rosters: ChampionshipRosters | null };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button type="button" className="border border-rule px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-forest hover:border-gold" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide rosters" : "View championship rosters"}
      </button>
      {open ? (
        championship.rosters?.winner && championship.rosters.loser ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SideRoster label="Champion" ownerName={championship.ownerName} side={championship.rosters.winner} />
            <SideRoster label="Runner-up" ownerName={championship.runnerUpName} side={championship.rosters.loser} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink/60">The championship score is on record, but the lineup for that game is not available yet.</p>
        )
      ) : null}
    </div>
  );
}
