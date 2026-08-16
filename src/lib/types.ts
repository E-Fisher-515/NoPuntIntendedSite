export type TeamSeason = {
  teamId: number;
  teamName: string;
  abbrev: string;
  logoUrl: string;
  ownerId: string | null;
  ownerName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  standing: number;
  finalStanding: number;
  playoffPct: number;
  trades: number;
  acquisitions: number;
  drops: number;
  division: string;
};

export type Matchup = {
  year: number;
  week: number;
  isPlayoff: boolean;
  matchupType: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  combined: number;
  margin: number;
  winner: "home" | "away" | "tie" | null;
};

export type Championship = {
  year: number;
  ownerId: string | null;
  ownerName: string;
  teamName: string;
  record: string;
  pointsFor: number;
  runnerUpName?: string;
  runnerUpTeam?: string;
  thirdPlaceName?: string;
  championshipScore?: string | null;
};

export type LeagueArchive = {
  id: number;
  name: string;
  currentSeason: number;
  seasons: number[];
  seasonCount: number;
  managerCount: number;
  gamesPlayed: number;
  teamCount: number;
  currentChampion: Championship | null;
  currentLeader: TeamSeason | null;
  generatedAt: string;
  championships: Championship[];
};

export type SeasonArchive = {
  year: number;
  name: string;
  complete: boolean;
  teamCount: number;
  regularSeasonWeeks: number;
  playoffTeamCount: number;
  keeperCount: number;
  faab: boolean;
  acquisitionBudget: number;
  scoringType: string;
  currentWeek: number;
  teams: TeamSeason[];
  notables: Record<string, unknown>;
  champion: TeamSeason | null;
  currentLeader: TeamSeason | null;
  runnerUp: TeamSeason | null;
  thirdPlace: TeamSeason | null;
  championshipMatchup: Matchup | null;
};

export type ManagerSeason = {
  year: number;
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  finish: number;
  playoff: boolean;
  champion: boolean;
  logoUrl: string;
};

export type HeadToHead = {
  opponentId: string;
  wins: number;
  losses: number;
  ties: number;
};

export type Manager = {
  id: string;
  name: string;
  fullName: string;
  seasons: ManagerSeason[];
  championships: number;
  runnerUp: number;
  playoffAppearances: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  bestFinish: number | null;
  worstFinish: number | null;
  highestWeek: {
    year: number;
    week: number;
    teamName: string;
    points: number;
    opponentName: string;
  } | null;
  lowestWeek: {
    year: number;
    week: number;
    teamName: string;
    points: number;
    opponentName: string;
  } | null;
  winStreak: number;
  loseStreak: number;
  winPct: number;
  seasonsPlayed: number;
  averageFinish: number | null;
  headToHead: HeadToHead[];
};

export type Award = {
  id: string;
  year: number;
  name: string;
  category: string;
  source: string;
  winnerName: string;
  winnerId: string | null;
  detail: string;
};

export type PredictionRow = {
  ownerId: string | null;
  ownerName: string;
  teamName: string;
  pct?: number;
  wins?: number;
  losses?: number;
  pointsFor?: number;
  projectedSeed?: number;
  inPlayoffPicture?: boolean;
};

export type Predictions = {
  season: number;
  complete: boolean;
  note: string;
  champion: PredictionRow[];
  playoff: PredictionRow[];
  standings: PredictionRow[];
};

export type TimelineEvent = {
  year: number;
  title: string;
  body: string;
  source: "espn" | "editorial";
};

export type HofInductee = {
  id: string;
  managerId?: string;
  name: string;
  inductionYear: number;
  championships: number;
  careerRecord: string;
  accomplishments: string[];
  description: string;
  moments: string[];
};

export type BannerSettings = {
  enabled: boolean;
  label: string;
  target: string;
  message: string;
};

export type Editorial = {
  banner: BannerSettings;
  constitution: string;
  hallOfFame: HofInductee[];
  rejectedHofIds: string[];
  timeline: TimelineEvent[];
  customAwards: Award[];
};

export type HofSuggestion = {
  managerId: string;
  name: string;
  championships: number;
  seasonsPlayed: number;
  winPct: number;
  careerRecord: string;
  reasons: string[];
};

