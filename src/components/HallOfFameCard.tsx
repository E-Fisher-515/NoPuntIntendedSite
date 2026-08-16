import type { HofInductee } from "@/lib/types";

export function HallOfFameCard({ inductee }: { inductee: HofInductee }) {
  return (
    <article className="border border-gold/40 bg-cream px-6 py-8">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold-muted">Class of {inductee.inductionYear}</p>
      <h2 className="mt-2 font-serif text-4xl text-forest">{inductee.name}</h2>
      <p className="mt-2 text-sm uppercase tracking-widest text-ink/60">
        {inductee.championships} championships · {inductee.careerRecord}
      </p>
      <p className="mt-4 max-w-2xl text-ink/80">{inductee.description}</p>
      <ul className="mt-4 list-disc pl-5 text-sm text-ink/70">
        {inductee.accomplishments.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {inductee.moments.length ? (
        <div className="mt-4 border-t border-rule pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold-muted">Historical moments</p>
          <ul className="mt-2 space-y-1 text-sm">
            {inductee.moments.map((moment) => (
              <li key={moment}>{moment}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
