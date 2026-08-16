import { PageShell } from "@/components/PageShell";
import { RecordTable } from "@/components/RecordTable";
import { SectionHeader } from "@/components/SectionHeader";
import { archiveReady, getManagers, getRecords } from "@/lib/archive";
import { careerIdentity, matchupSideIdentity } from "@/lib/lookups";
import type { Manager } from "@/lib/types";

function rowsOf(value: unknown): Record<string, string | number | null>[] {
  return Array.isArray(value) ? (value as Record<string, string | number | null>[]) : [];
}

function withSeasonIdentity(rows: Record<string, string | number | null>[]) {
  return rows.map((row) => ({
    ...row,
    ownerName: row.ownerName ?? "—",
    teamName: row.teamName ?? "—",
    year: row.year ?? "—",
  }));
}

function withCareerIdentity(rows: Record<string, string | number | null>[], managers: Manager[]) {
  return rows.map((row) => {
    const career = careerIdentity(managers, row.ownerId as string | undefined, row.ownerName as string | undefined);
    return {
      ...row,
      ownerName: career.ownerName,
      teamName: career.teamName,
      year: career.year,
    };
  });
}

function withMatchupIdentity(rows: Record<string, string | number | null>[], managers: Manager[]) {
  return rows.map((row) => {
    const year = Number(row.year);
    return {
      ...row,
      home: matchupSideIdentity(managers, year, Number(row.homeTeamId), String(row.homeTeamName ?? "")),
      away: matchupSideIdentity(managers, year, Number(row.awayTeamId), String(row.awayTeamName ?? "")),
    };
  });
}

export default function RecordsPage() {
  if (!archiveReady()) {
    return (
      <PageShell>
        <SectionHeader title="Record book" lede="This page will be ready once the season history is loaded." />
      </PageShell>
    );
  }
  const records = getRecords();
  const managers = getManagers();
  const scoring = records.scoring ?? {};
  const rec = records.records ?? {};
  const matchups = records.matchups ?? {};
  const playoffs = records.playoffs ?? {};
  const who = [
    { key: "ownerName", label: "Manager" },
    { key: "teamName", label: "Team" },
    { key: "year", label: "Seasons" },
  ];
  const seasonWho = [
    { key: "year", label: "Year" },
    { key: "ownerName", label: "Manager" },
    { key: "teamName", label: "Team" },
  ];

  return (
    <PageShell>
      <SectionHeader
        eyebrow="All-time"
        title="Record book"
        lede="The league's all-time marks. Career lines use each manager's latest team name and the years they played."
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Scoring</h2>
      <RecordTable
        title="Most points in a season"
        columns={[...seasonWho, { key: "pointsFor", label: "PF" }]}
        rows={withSeasonIdentity(rowsOf(scoring.mostPointsSeason))}
      />
      <RecordTable
        title="Most points in a week"
        columns={[
          ...seasonWho,
          { key: "week", label: "Week" },
          { key: "points", label: "Pts" },
          { key: "opponentName", label: "Opponent" },
        ]}
        rows={withSeasonIdentity(rowsOf(scoring.mostPointsWeek))}
      />
      <RecordTable
        title="Lowest scoring week"
        columns={[...seasonWho, { key: "week", label: "Week" }, { key: "points", label: "Pts" }]}
        rows={withSeasonIdentity(rowsOf(scoring.lowestPointsWeek))}
      />
      <RecordTable
        title="Most career points"
        columns={[...who, { key: "pointsFor", label: "PF" }]}
        rows={withCareerIdentity(rowsOf(scoring.mostCareerPoints), managers)}
      />
      <RecordTable
        title="Highest average points / season"
        columns={[...who, { key: "avg", label: "Avg PF" }]}
        rows={withCareerIdentity(rowsOf(scoring.highestAveragePoints), managers)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Records</h2>
      <RecordTable
        title="Most wins"
        columns={[...who, { key: "wins", label: "W" }, { key: "losses", label: "L" }]}
        rows={withCareerIdentity(rowsOf(rec.mostWins), managers)}
      />
      <RecordTable
        title="Most losses"
        columns={[...who, { key: "losses", label: "L" }, { key: "wins", label: "W" }]}
        rows={withCareerIdentity(rowsOf(rec.mostLosses), managers)}
      />
      <RecordTable
        title="Best regular season"
        columns={[...seasonWho, { key: "wins", label: "W" }, { key: "losses", label: "L" }, { key: "pointsFor", label: "PF" }]}
        rows={withSeasonIdentity(rowsOf(rec.bestRegularSeason))}
      />
      <RecordTable
        title="Worst regular season"
        columns={[...seasonWho, { key: "wins", label: "W" }, { key: "losses", label: "L" }]}
        rows={withSeasonIdentity(rowsOf(rec.worstRegularSeason))}
      />
      <RecordTable
        title="Longest win streak (single season)"
        columns={[...who, { key: "streak", label: "Streak" }]}
        rows={withCareerIdentity(rowsOf(rec.longestWinStreak), managers)}
      />
      <RecordTable
        title="Longest losing streak (single season)"
        columns={[...who, { key: "streak", label: "Streak" }]}
        rows={withCareerIdentity(rowsOf(rec.longestLosingStreak), managers)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Matchups</h2>
      <RecordTable
        title="Biggest blowout"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "home", label: "Home" },
          { key: "away", label: "Away" },
          { key: "margin", label: "Margin" },
        ]}
        rows={withMatchupIdentity(rowsOf(matchups.biggestBlowout), managers)}
      />
      <RecordTable
        title="Closest matchup"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "home", label: "Home" },
          { key: "away", label: "Away" },
          { key: "margin", label: "Margin" },
        ]}
        rows={withMatchupIdentity(rowsOf(matchups.closestMatchup), managers)}
      />
      <RecordTable
        title="Highest combined score"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "home", label: "Home" },
          { key: "away", label: "Away" },
          { key: "combined", label: "Combined" },
        ]}
        rows={withMatchupIdentity(rowsOf(matchups.highestCombined), managers)}
      />
      <RecordTable
        title="Lowest combined score"
        columns={[
          { key: "year", label: "Year" },
          { key: "week", label: "Week" },
          { key: "home", label: "Home" },
          { key: "away", label: "Away" },
          { key: "combined", label: "Combined" },
        ]}
        rows={withMatchupIdentity(rowsOf(matchups.lowestCombined), managers)}
      />
      <h2 className="mb-6 font-serif text-3xl text-forest">Playoffs</h2>
      <RecordTable
        title="Most championships"
        columns={[...who, { key: "championships", label: "Titles" }]}
        rows={withCareerIdentity(rowsOf(playoffs.mostChampionships), managers)}
      />
      <RecordTable
        title="Most playoff wins"
        columns={[...who, { key: "wins", label: "Wins" }, { key: "games", label: "Games" }]}
        rows={withCareerIdentity(rowsOf(playoffs.mostPlayoffWins), managers)}
      />
      <RecordTable
        title="Most playoff appearances"
        columns={[...who, { key: "appearances", label: "Appearances" }]}
        rows={withCareerIdentity(rowsOf(playoffs.mostPlayoffAppearances), managers)}
      />
      <RecordTable
        title="Best playoff win % (min. 3 games)"
        columns={[...who, { key: "winPct", label: "Win %" }, { key: "wins", label: "W" }, { key: "games", label: "G" }]}
        rows={withCareerIdentity(rowsOf(playoffs.bestPlayoffWinPct), managers)}
      />
    </PageShell>
  );
}
