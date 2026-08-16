import { PageShell } from "@/components/PageShell";
import { RecordTable } from "@/components/RecordTable";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getRecords } from "@/lib/archive";

function rowsOf(value: unknown): Record<string, string | number | null>[] {
  return Array.isArray(value) ? (value as Record<string, string | number | null>[]) : [];
}

export default function RecordsPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Record book" lede="Archive data has not been generated yet." />
      </PageShell>
    );
  }
  const records = getRecords();
  const scoring = records.scoring ?? {};
  const rec = records.records ?? {};
  const matchups = records.matchups ?? {};
  const playoffs = records.playoffs ?? {};
  const draft = records.draft ?? {};

  return (
    <PageShell>
      <SectionHeader
        eyebrow="All-time"
        title="Record book"
        lede="Computed from archived ESPN matchups and standings. Draft steal/bust math is deferred until player season points are stored."
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Scoring</h2>
      <RecordTable
        title="Most points in a season"
        columns={[
          { key: "year", label: "Year" },
          { key: "ownerName", label: "Manager" },
          { key: "teamName", label: "Team" },
          { key: "pointsFor", label: "PF" },
        ]}
        rows={rowsOf(scoring.mostPointsSeason)}
      />
      <RecordTable
        title="Most points in a week"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "ownerName", label: "Manager" },
          { key: "points", label: "Pts" },
          { key: "opponentName", label: "Opponent" },
        ]}
        rows={rowsOf(scoring.mostPointsWeek)}
      />
      <RecordTable
        title="Lowest scoring week"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "ownerName", label: "Manager" },
          { key: "points", label: "Pts" },
        ]}
        rows={rowsOf(scoring.lowestPointsWeek)}
      />
      <RecordTable
        title="Most career points"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "pointsFor", label: "PF" },
        ]}
        rows={rowsOf(scoring.mostCareerPoints)}
      />
      <RecordTable
        title="Highest average points / season"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "avg", label: "Avg PF" },
        ]}
        rows={rowsOf(scoring.highestAveragePoints)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Records</h2>
      <RecordTable
        title="Most wins"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "wins", label: "W" },
          { key: "losses", label: "L" },
        ]}
        rows={rowsOf(rec.mostWins)}
      />
      <RecordTable
        title="Most losses"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "losses", label: "L" },
          { key: "wins", label: "W" },
        ]}
        rows={rowsOf(rec.mostLosses)}
      />
      <RecordTable
        title="Best regular season"
        columns={[
          { key: "year", label: "Year" },
          { key: "ownerName", label: "Manager" },
          { key: "wins", label: "W" },
          { key: "losses", label: "L" },
          { key: "pointsFor", label: "PF" },
        ]}
        rows={rowsOf(rec.bestRegularSeason)}
      />
      <RecordTable
        title="Worst regular season"
        columns={[
          { key: "year", label: "Year" },
          { key: "ownerName", label: "Manager" },
          { key: "wins", label: "W" },
          { key: "losses", label: "L" },
        ]}
        rows={rowsOf(rec.worstRegularSeason)}
      />
      <RecordTable
        title="Longest win streak (single season)"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "streak", label: "Streak" },
        ]}
        rows={rowsOf(rec.longestWinStreak)}
      />
      <RecordTable
        title="Longest losing streak (single season)"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "streak", label: "Streak" },
        ]}
        rows={rowsOf(rec.longestLosingStreak)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Matchups</h2>
      <RecordTable
        title="Biggest blowout"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "homeTeamName", label: "Home" },
          { key: "awayTeamName", label: "Away" },
          { key: "homeScore", label: "H" },
          { key: "awayScore", label: "A" },
          { key: "margin", label: "Margin" },
        ]}
        rows={rowsOf(matchups.biggestBlowout)}
      />
      <RecordTable
        title="Closest matchup"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "homeTeamName", label: "Home" },
          { key: "awayTeamName", label: "Away" },
          { key: "margin", label: "Margin" },
        ]}
        rows={rowsOf(matchups.closestMatchup)}
      />
      <RecordTable
        title="Highest combined score"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "homeTeamName", label: "Home" },
          { key: "awayTeamName", label: "Away" },
          { key: "combined", label: "Combined" },
        ]}
        rows={rowsOf(matchups.highestCombined)}
      />
      <RecordTable
        title="Lowest combined score"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "homeTeamName", label: "Home" },
          { key: "awayTeamName", label: "Away" },
          { key: "combined", label: "Combined" },
        ]}
        rows={rowsOf(matchups.lowestCombined)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Playoffs</h2>
      <RecordTable
        title="Most championships"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "championships", label: "Titles" },
        ]}
        rows={rowsOf(playoffs.mostChampionships)}
      />
      <RecordTable
        title="Most playoff wins"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "wins", label: "Wins" },
          { key: "games", label: "Games" },
        ]}
        rows={rowsOf(playoffs.mostPlayoffWins)}
      />
      <RecordTable
        title="Most playoff appearances"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "appearances", label: "Appearances" },
        ]}
        rows={rowsOf(playoffs.mostPlayoffAppearances)}
      />
      <RecordTable
        title="Best playoff win % (min. 3 games)"
        columns={[
          { key: "ownerName", label: "Manager" },
          { key: "winPct", label: "Win %" },
          { key: "wins", label: "W" },
          { key: "games", label: "G" },
        ]}
        rows={rowsOf(playoffs.bestPlayoffWinPct)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Draft</h2>
      <p className="border border-dashed border-rule px-4 py-6 text-sm text-ink/70">
        {(draft as { note?: string }).note ||
          "Best/worst draft, steal, and bust require player season points and are not computed yet."}
      </p>
    </PageShell>
  );
}
