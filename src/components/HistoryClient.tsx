"use client";

import { ChampionshipRoster } from "@/components/ChampionshipRoster";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { Timeline } from "@/components/Timeline";
import type { Championship, ChampionshipRosters, Editorial, TimelineEvent } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

export function HistoryClient({
  espnEvents,
  championships,
  initial,
}: {
  espnEvents: TimelineEvent[];
  championships: Array<Championship & { rosters: ChampionshipRosters | null }>;
  initial: Editorial;
}) {
  const editorial = useEditorial(initial);
  const extra = editorial.timeline;
  const founding = espnEvents.filter((event) => event.title === "League founded");
  const byYear = new Map(championships.map((champ) => [champ.year, champ]));
  return (
    <PageShell>
      <SectionHeader
        eyebrow="League history"
        title="The timeline"
        lede="Championships and the founding year come from the league record. Open a title game to see the rosters that won and lost. To add a timeline event, contact the commissioner."
      />
      <Timeline events={[...founding, ...extra].sort((a, b) => a.year - b.year)} />
      <h2 className="mb-6 mt-14 font-serif text-3xl text-forest">Championships</h2>
      <ol className="space-y-8">
        {[...championships].sort((a, b) => a.year - b.year).map((champ) => (
          <li key={champ.year} className="border-b border-rule pb-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-muted">{champ.year}</p>
            <h3 className="mt-1 font-serif text-2xl text-forest">{champ.ownerName} wins the championship</h3>
            <p className="mt-1 text-ink/70">
              {champ.ownerName} · {champ.teamName}
              {champ.runnerUpName ? `, defeating ${champ.runnerUpName}${champ.runnerUpTeam ? ` · ${champ.runnerUpTeam}` : ""}` : ""}
              {champ.championshipScore ? ` · ${champ.championshipScore}` : ""}
            </p>
            <ChampionshipRoster championship={byYear.get(champ.year) ?? champ} />
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
