import { PageShell } from "@/components/PageShell";
import { PredictionTable } from "@/components/PredictionTable";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getPredictions } from "@/lib/archive";
import { identity } from "@/lib/format";

export default function PredictionsPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Predictions" lede="This page will be ready once the season history is loaded." />
      </PageShell>
    );
  }
  const predictions = getPredictions();
  return (
    <PageShell>
      <SectionHeader eyebrow={`${predictions.season} outlook`} title="Predictions" lede={predictions.note} />
      {predictions.complete ? (
        <p className="border border-rule px-4 py-8 text-ink/70">{predictions.note}</p>
      ) : (
        <>
          <PredictionTable title="Projected champion" rows={predictions.champion.slice(0, 8)} year={predictions.season} />
          <PredictionTable title="Playoff odds" rows={predictions.playoff} year={predictions.season} />
          <section>
            <h3 className="mb-4 font-serif text-2xl text-forest">Projected standings</h3>
            <ol className="border border-rule">
              {predictions.standings.map((row) => (
                <li
                  key={row.ownerId ?? row.teamName}
                  className="flex justify-between border-t border-rule px-4 py-2 first:border-t-0"
                >
                  <span>
                    {row.projectedSeed}. {identity(row.ownerName, row.teamName, predictions.season)}
                  </span>
                  <span className="text-sm text-ink/60">
                    {row.inPlayoffPicture ? "In the picture" : "Outside looking in"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </PageShell>
  );
}
