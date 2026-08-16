type Props = {
  eyebrow?: string;
  title: string;
  lede?: string;
};

export function SectionHeader({ eyebrow, title, lede }: Props) {
  return (
    <header className="mb-8 border-b border-rule pb-4">
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold-muted">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 font-serif text-4xl text-forest md:text-5xl">{title}</h1>
      {lede ? <p className="mt-3 max-w-2xl text-ink/70">{lede}</p> : null}
    </header>
  );
}
