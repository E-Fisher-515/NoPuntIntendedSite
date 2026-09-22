import { PageShell } from "@/components/PageShell";
import { PredictionTable } from "@/components/PredictionTable";
import { SectionHeader } from "@/components/SectionHeader";
import { TeamProjectionCard } from "@/components/TeamProjectionCard";
import { archiveReady, getManagers, getPredictionContext, getPredictions, getSeason } from "@/lib/archive";
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
  const context = getPredictionContext();
  const projections = buildTeamProjections(season, getManagers(), context);
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
        lede={`A Week ${season.currentWeek} forecast recalculated from current record, scoring margin, roster strength, and injury/news adjustments. It is intentionally readable enough to argue about.`}
      />
      <p className="border border-rule px-4 py-5 text-sm leading-6 text-ink/70">{predictions.note} Roster and news inputs are a dated snapshot, not a promise from the football gods.</p>
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
