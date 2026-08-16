export function recordLine(wins: number, losses: number, ties = 0): string {
  return ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function points(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function playoffResult(finish: number, playoff: boolean, champion: boolean): string {
  if (champion) return "Champion";
  if (!playoff) return "Missed playoffs";
  if (finish === 2) return "Runner-up";
  if (finish === 3) return "Third place";
  return `Playoffs · ${ordinal(finish)}`;
}

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function identity(ownerName: string | null | undefined, teamName: string | null | undefined, year?: number | string | null): string {
  const parts = [ownerName, teamName, year != null && year !== "" ? String(year) : null].filter(Boolean);
  return parts.join(" · ") || "—";
}

