import type { RosterPlayer } from "./types";

const SLOT_RANK: Record<string, number> = {
  QB: 0,
  RB: 1,
  WR: 2,
  TE: 4,
  FLX: 4,
  FLEX: 4,
  "RB/WR/TE": 4,
  "WR/TE": 4,
  "RB/WR": 4,
  "RB/WR/TE/QB": 4,
  OP: 4,
  K: 5,
  "D/ST": 6,
  DST: 6,
  DEF: 6,
  BE: 7,
  BENCH: 7,
  IR: 8,
};

export function slotRank(slot: string): number {
  return SLOT_RANK[slot.trim().toUpperCase()] ?? SLOT_RANK[slot.trim()] ?? 50;
}

export function displaySlot(slot: string): string {
  const value = slot.trim().toUpperCase();
  if (value === "TE" || value === "RB/WR/TE" || value === "FLEX" || value === "WR/TE" || value === "RB/WR" || value === "RB/WR/TE/QB" || value === "OP") {
    return "FLX";
  }
  if (value === "D/ST" || value === "DEF") return "DST";
  if (value === "BENCH") return "BE";
  return slot || "BE";
}

export function sortRoster(players: RosterPlayer[]): RosterPlayer[] {
  return [...players].sort((a, b) => {
    const rank = slotRank(a.slot) - slotRank(b.slot);
    if (rank) return rank;
    return b.points - a.points;
  });
}
