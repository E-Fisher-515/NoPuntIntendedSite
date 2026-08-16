import type { PredictionRow } from "@/lib/types";

export function PredictionTable({
  title,
  rows,
}: {
  title: string;
  rows: PredictionRow[];
}) {
  const max = Math.max(...rows.map((row) => row.pct || 0), 1);
  return (
    <section className="mb-10">
      <h3 className="mb-4 font-serif text-2xl text-forest">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={`${row.ownerId}-${row.teamName}`}>
            <div className="mb-1 flex justify-between text-sm">
              <span>
                {row.ownerName} <span className="text-ink/50">{row.teamName}</span>
              </span>
              <span className="tabular-nums text-forest">{row.pct?.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-cream-dark">
              <div
                className="h-2 bg-forest"
                style={{ width: `${((row.pct || 0) / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
