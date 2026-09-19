import { PageShell } from "@/components/PageShell";
import { PredictionTable } from "@/components/PredictionTable";
import { SectionHeader } from "@/components/SectionHeader";
import { TeamProjectionCard } from "@/components/TeamProjectionCard";
import { archiveReady, getManagers, getPredictions, getSeason } from "@/lib/archive";
import { buildTeamProjections } from "@/lib/projections";

export default function PredictionsPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Predictions" lede="This page will be ready once the season history is loaded." />
      </PageShell>
    );
  }
  const predictions = getPredictions();
  const season = getSeason(predictions.season);
  const projections = buildTeamProjections(season, getManagers());
  const championRows = projections.map((projection) => ({
    ownerId: projection.ownerId,
    ownerName: projection.ownerName,
    teamName: projection.teamName,
    pct: projection.championPct,
  }));
  const playoffRows = projections.map((projection) => ({
    ownerId: projection.ownerId,
    ownerName: projection.ownerName,
    teamName: projection.teamName,
    pct: projection.playoffPct,
  }));

  return (
    <PageShell>
      <SectionHeader
        eyebrow={`${predictions.season} outlook`}
        title="Predictions"
        lede="A numbers-first forecast with enough honesty to be entertaining. These projections update whenever the ESPN archive is refreshed."
      />
      {predictions.complete ? (
        <p className="border border-rule px-4 py-8 text-ink/70">{predictions.note}</p>
      ) : (
        <>
          <PredictionTable title="Projected champion" rows={championRows} year={predictions.season} />
          <PredictionTable title="Playoff odds" rows={playoffRows} year={predictions.season} />
          <section>
            <h2 className="mb-4 font-serif text-3xl text-forest">Projected final order</h2>
            <ol className="border border-rule">
              {projections.map((projection) => (
                <li key={projection.ownerId ?? projection.teamName} className="flex items-center justify-between gap-4 border-t border-rule px-4 py-3 first:border-t-0">
                  <span><strong>{projection.projectedFinish}.</strong> {projection.ownerName} · {projection.teamName}</span>
                  <span className="text-sm text-ink/60">{projection.record}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-12">
            <h2 className="mb-4 font-serif text-3xl text-forest">Team-by-team outlook</h2>
            <div className="grid gap-6">
              {projections.map((projection) => <TeamProjectionCard key={projection.ownerId ?? projection.teamName} projection={projection} />)}
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
