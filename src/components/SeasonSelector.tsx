import Link from "next/link";

export function SeasonSelector({
  years,
  current,
}: {
  years: number[];
  current: number;
}) {
  const index = years.indexOf(current);
  const prev = index > 0 ? years[index - 1] : null;
  const next = index >= 0 && index < years.length - 1 ? years[index + 1] : null;
  return (
    <div className="my-6 flex items-center justify-between border border-rule px-4 py-3 text-sm">
      {prev ? (
        <Link href={`/seasons/${prev}`} className="uppercase tracking-widest text-forest">
          ← {prev}
        </Link>
      ) : (
        <span className="text-ink/30">←</span>
      )}
      <p className="font-serif text-xl text-forest">{current}</p>
      {next ? (
        <Link href={`/seasons/${next}`} className="uppercase tracking-widest text-forest">
          {next} →
        </Link>
      ) : (
        <span className="text-ink/30">→</span>
      )}
    </div>
  );
}
