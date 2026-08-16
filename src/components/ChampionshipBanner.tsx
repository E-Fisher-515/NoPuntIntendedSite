import Link from "next/link";
import type { Championship } from "@/lib/types";

type Props = {
  championships: Championship[];
};

export function ChampionshipBanner({ championships }: Props) {
  if (!championships.length) {
    return (
      <div className="border-b border-rule bg-forest-deep text-cream">
        <p className="px-4 py-3 text-center text-xs uppercase tracking-[0.2em] text-gold">
          Championship history will appear after the first completed season is archived
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-gold/30 bg-forest-deep">
      <div className="flex gap-0 overflow-x-auto">
        {championships.map((champ) => (
          <Link
            key={champ.year}
            href={`/seasons/${champ.year}`}
            className="min-w-[160px] shrink-0 border-r border-gold/20 px-5 py-4 text-cream transition-colors hover:bg-forest"
          >
            <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-gold">{champ.year}</p>
            <p className="mt-2 font-serif text-lg leading-tight">Champion</p>
            <p className="mt-1 text-sm text-cream/90">{champ.ownerName}</p>
            <p className="text-xs text-cream/60">{champ.teamName}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-gold/80">{champ.record}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
