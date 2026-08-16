type Props = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: Props) {
  return (
    <article className="border border-rule bg-cream-dark/40 px-4 py-5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-forest">{value}</p>
      {detail ? <p className="mt-1 text-sm text-ink/60">{detail}</p> : null}
    </article>
  );
}
