"use client";

import { ChampionshipRoster } from "@/components/ChampionshipRoster";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import type { Championship, ChampionshipRosters, Editorial, TimelineEvent } from "@/lib/types";
import { useEditorial } from "@/lib/useEditorial";

type Item = {
  year: number;
  title: string;
  body: string;
  championship?: Championship & { rosters: ChampionshipRosters | null };
};

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
  const founding = espnEvents.filter((event) => event.title === "League founded");
  const items: Item[] = [
    ...founding.map((event) => ({ year: event.year, title: event.title, body: event.body })),
    ...championships.map((champ) => ({
      year: champ.year,
      title: `${champ.ownerName} wins the championship`,
      body: `${champ.ownerName} · ${champ.teamName}${
        champ.runnerUpName ? `, defeating ${champ.runnerUpName}${champ.runnerUpTeam ? ` · ${champ.runnerUpTeam}` : ""}` : ""
      }${champ.championshipScore ? ` · ${champ.championshipScore}` : ""}`,
      championship: champ,
    })),
    ...editorial.timeline.map((event) => ({ year: event.year, title: event.title, body: event.body })),
  ].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

  return (
    <PageShell>
      <SectionHeader
        eyebrow="History"
        title="The timeline"
        lede="From the founding year through every championship. Open a title game to see the rosters that won and lost. To add a timeline event, contact the commissioner."
      />
      <ol className="border-l border-gold/50 pl-6">
        {items.map((item, index) => (
          <li key={`${item.year}-${item.title}-${index}`} className="relative mb-10">
            <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gold" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-muted">{item.year}</p>
            <h3 className="mt-1 font-serif text-2xl text-forest">{item.title}</h3>
            <p className="mt-1 text-ink/70">{item.body}</p>
            {item.championship ? <ChampionshipRoster championship={item.championship} /> : null}
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
