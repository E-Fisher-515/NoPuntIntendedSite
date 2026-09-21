import type { TeamProjection } from "@/lib/projections";

export function TeamProjectionCard({ projection }: { projection: TeamProjection }) {
  return (
    <article className="border border-rule p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">
            Projected {projection.projectedFinish} · {projection.record}
          </p>
          <h3 className="mt-1 font-serif text-2xl text-forest">{projection.ownerName}</h3>
          <p className="text-sm text-ink/65">{projection.teamName}</p>
        </div>
        <div className="text-right text-xs text-ink/60">
          <p>{projection.pointsFor.toFixed(1)} PF</p>
          <p>{projection.pointsAgainst.toFixed(1)} PA</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-ink/80">{projection.projection}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold-muted">Strengths</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink/75">
            {projection.strengths.map((strength) => <li key={strength}>{strength}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold-muted">Weaknesses</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink/75">
            {projection.weaknesses.map((weakness) => <li key={weakness}>{weakness}</li>)}
          </ul>
        </div>
      </div>
      <p className="mt-4 border-t border-rule pt-3 text-sm italic text-forest">Roast: {projection.roast}</p>
    </article>
  );
}
