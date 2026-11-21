export const ACTIVITY_STATUS_OPTIONS = ["Activo", "Inactivo", "Muerto"] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUS_OPTIONS)[number];

export const WORK_STATUS_OPTIONS = [
  "Con Laburo",
  "Sin Laburo",
  "Laburo Parcial",
] as const;
export type WorkStatus = (typeof WORK_STATUS_OPTIONS)[number];

export const TRI_STATE_OPTIONS = ["Si", "No", "Parcial"] as const;
export type TriStateStatus = (typeof TRI_STATE_OPTIONS)[number];

export const LOL_PLAYER_OPTIONS = ["Si", "No", "Retirado"] as const;
export type LolPlayerStatus = (typeof LOL_PLAYER_OPTIONS)[number];

export const THEME_PRESET_OPTIONS = [
  "pokedle",
  "dark",
  "retro",
  "custom",
] as const;
export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number];

export const GAME_MODES = ["classic"] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface FriendAttributes {
  entryYear: number;
  activityStatus: ActivityStatus;
  workStatus: WorkStatus;
  weightKg: number;
  heightCm: number;
  neighborhood: string;
  debtorStatus: TriStateStatus;
  badFriendStatus: TriStateStatus;
  lolPlayerStatus: LolPlayerStatus;
  isKuka: boolean;
  gameKnowledge: TriStateStatus;
  canDrive: boolean;
}

export type FriendAttributeKey = keyof FriendAttributes;

export interface FriendRecord extends FriendAttributes {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string;
  isActiveInPool: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FriendCandidate {
  id: string;
  name: string;
  avatarUrl: string;
}

export type CellMatchStatus = "correct" | "wrong";
export type NumericDirection = "up" | "down" | "none";

export interface CellComparison {
  key: FriendAttributeKey;
  label: string;
  displayValue: string;
  status: CellMatchStatus;
  direction: NumericDirection;
}

export interface GuessEntry {
  guessId: string;
  name: string;
  avatarUrl: string;
  isCorrect: boolean;
  cells: CellComparison[];
}

export interface GameSettingsData {
  title: string;
  subtitle: string;
  themePreset: ThemePreset;
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  backgroundImageUrl: string | null;
  logoImageUrl: string | null;
  maxAttempts: number | null;
}

export interface DailyStatsSummary {
  totalSolves: number;
  avgAttempts: number;
}

export interface GameBootstrapResponse {
  dateKey: string;
  mode: GameMode;
  settings: GameSettingsData;
  candidates: FriendCandidate[];
  yesterdayFriend: FriendCandidate | null;
  dailyStats: DailyStatsSummary;
  poolEmpty?: boolean;
}

export interface GuessResponse {
  dateKey: string;
  guess: GuessEntry;
  dailyStats: DailyStatsSummary;
}
