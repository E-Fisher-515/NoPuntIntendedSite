import type { SeasonArchive } from "@/lib/types";
import { identity, points, recordLine } from "@/lib/format";

export function SeasonHeader({ season }: { season: SeasonArchive }) {
  const headline = season.complete ? season.champion : season.currentLeader;
  return (
    <section className="border border-rule bg-forest px-6 py-8 text-cream">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">{season.year} season</p>
      <h1 className="mt-2 font-serif text-5xl">{season.complete ? "Champion" : "League leader"}</h1>
      <p className="mt-3 font-serif text-3xl text-gold">
        {headline ? identity(headline.ownerName, headline.teamName) : "TBD"}
      </p>
      {headline ? (
        <dl className="mt-6 flex flex-wrap gap-8 text-sm">
          <div>
            <dt className="uppercase tracking-widest text-gold/80">Record</dt>
            <dd className="font-serif text-2xl">{recordLine(headline.wins, headline.losses, headline.ties)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-gold/80">Points</dt>
            <dd className="font-serif text-2xl">{points(headline.pointsFor)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-gold/80">Finish</dt>
            <dd className="font-serif text-2xl">{headline.finalStanding || "—"}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
