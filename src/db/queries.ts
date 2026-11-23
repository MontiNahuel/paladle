import crypto from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dailyChallenges,
  friends,
  gameParameters,
  gameSettings,
  type DailyChallengeRow,
  type FriendRow,
  type GameParameterRow,
  type GameSettingsRow,
} from "@/db/schema";
import { PALADLE_COLUMNS } from "@/engine/columns";
import {
  getArgentinaDateKey,
  getPreviousDateKey,
  pickDailyFriendId,
} from "@/engine/daily";
import { DEFAULT_GAME_SETTINGS } from "@/lib/theme";
import {
  ACTIVITY_STATUS_OPTIONS,
  LOL_PLAYER_OPTIONS,
  TRI_STATE_OPTIONS,
  WORK_STATUS_OPTIONS,
  type ActivityStatus,
  type DailyStatsSummary,
  type DynamicAttributesMap,
  type FriendCandidate,
  type FriendRecord,
  type GameBootstrapResponse,
  type GameMode,
  type GameParameter,
  type GameSettingsData,
  type LolPlayerStatus,
  type ParameterType,
  type RetroFont,
  type ThemePreset,
  type TriStateStatus,
  type WorkStatus,
} from "@/types/game";

function pickValidEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function resolveFriendAttributes(row: FriendRow): DynamicAttributesMap {
  return {
    entryYear: row.entryYear,
    activityStatus: row.activityStatus,
    workStatus: row.workStatus,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    neighborhood: row.neighborhood,
    debtorStatus: row.debtorStatus,
    badFriendStatus: row.badFriendStatus,
    lolPlayerStatus: row.lolPlayerStatus,
    isKuka: row.isKuka,
    gameKnowledge: row.gameKnowledge,
    canDrive: row.canDrive,
    ...(row.attributes ?? {}),
  };
}

export function buildLegacyColumnsFromAttributes(
  attrs: DynamicAttributesMap,
  fallback?: Partial<FriendRow>
) {
  return {
    entryYear:
      typeof attrs.entryYear === "number"
        ? Math.round(attrs.entryYear)
        : (fallback?.entryYear ?? 2020),
    activityStatus: pickValidEnum<ActivityStatus>(
      attrs.activityStatus,
      ACTIVITY_STATUS_OPTIONS,
      fallback?.activityStatus ?? "Activo"
    ),
    workStatus: pickValidEnum<WorkStatus>(
      attrs.workStatus,
      WORK_STATUS_OPTIONS,
      fallback?.workStatus ?? "Con Laburo"
    ),
    weightKg:
      typeof attrs.weightKg === "number"
        ? Math.round(attrs.weightKg)
        : (fallback?.weightKg ?? 75),
    heightCm:
      typeof attrs.heightCm === "number"
        ? Math.round(attrs.heightCm)
        : (fallback?.heightCm ?? 175),
    neighborhood:
      typeof attrs.neighborhood === "string" && attrs.neighborhood.trim()
        ? attrs.neighborhood.trim()
        : (fallback?.neighborhood ?? "Sin definir"),
    debtorStatus: pickValidEnum<TriStateStatus>(
      attrs.debtorStatus,
      TRI_STATE_OPTIONS,
      fallback?.debtorStatus ?? "No"
    ),
    badFriendStatus: pickValidEnum<TriStateStatus>(
      attrs.badFriendStatus,
      TRI_STATE_OPTIONS,
      fallback?.badFriendStatus ?? "No"
    ),
    lolPlayerStatus: pickValidEnum<LolPlayerStatus>(
      attrs.lolPlayerStatus,
      LOL_PLAYER_OPTIONS,
      fallback?.lolPlayerStatus ?? "No"
    ),
    isKuka:
      typeof attrs.isKuka === "boolean"
        ? attrs.isKuka
        : (fallback?.isKuka ?? false),
    gameKnowledge: pickValidEnum<TriStateStatus>(
      attrs.gameKnowledge,
      TRI_STATE_OPTIONS,
      fallback?.gameKnowledge ?? "Si"
    ),
    canDrive:
      typeof attrs.canDrive === "boolean"
        ? attrs.canDrive
        : (fallback?.canDrive ?? true),
  };
}

export function toGameParameter(row: GameParameterRow): GameParameter {
  return {
    id: row.id,
    key: row.key,
    shortLabel: row.shortLabel,
    fullLabel: row.fullLabel,
    type: row.type as ParameterType,
    unit: row.unit ?? null,
    options: row.options ?? null,
    minValue: row.minValue ?? null,
    maxValue: row.maxValue ?? null,
    isVisible: row.isVisible,
    sortOrder: row.sortOrder,
    isSystem: row.isSystem,
  };
}

export function toFriendRecord(row: FriendRow): FriendRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    avatarUrl: row.avatarUrl,
    isActiveInPool: row.isActiveInPool,
    entryYear: row.entryYear,
    activityStatus: row.activityStatus,
    workStatus: row.workStatus,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    neighborhood: row.neighborhood,
    debtorStatus: row.debtorStatus,
    badFriendStatus: row.badFriendStatus,
    lolPlayerStatus: row.lolPlayerStatus,
    isKuka: row.isKuka,
    gameKnowledge: row.gameKnowledge,
    canDrive: row.canDrive,
    attributes: resolveFriendAttributes(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toGameSettingsData(row?: GameSettingsRow | null): GameSettingsData {
  if (!row) return DEFAULT_GAME_SETTINGS;
  return {
    title: row.title,
    subtitle: row.subtitle,
    themePreset: row.themePreset as ThemePreset,
    retroFont: (row.retroFont as RetroFont) ?? "pixelify",
    primaryColor: row.primaryColor,
    backgroundColor: row.backgroundColor,
    surfaceColor: row.surfaceColor,
    accentColor: row.accentColor,
    backgroundImageUrl: row.backgroundImageUrl ?? null,
    logoImageUrl: row.logoImageUrl ?? null,
    maxAttempts: row.maxAttempts ?? null,
  };
}

export function computeDailyStats(row?: DailyChallengeRow | null): DailyStatsSummary {
  if (!row || row.totalSolves === 0) {
    return { totalSolves: 0, avgAttempts: 0 };
  }
  return {
    totalSolves: row.totalSolves,
    avgAttempts: Number((row.totalAttemptsOnSolve / row.totalSolves).toFixed(1)),
  };
}

export function slugifyFriendName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "amigo";
}

export async function getOrInitGameSettings(): Promise<GameSettingsData> {
  const db = getDb();
  const existing = await db
    .select()
    .from(gameSettings)
    .where(eq(gameSettings.id, 1))
    .limit(1);

  if (existing[0]) {
    return toGameSettingsData(existing[0]);
  }

  await db
    .insert(gameSettings)
    .values({
      id: 1,
      title: DEFAULT_GAME_SETTINGS.title,
      subtitle: DEFAULT_GAME_SETTINGS.subtitle,
      themePreset: DEFAULT_GAME_SETTINGS.themePreset,
      primaryColor: DEFAULT_GAME_SETTINGS.primaryColor,
      backgroundColor: DEFAULT_GAME_SETTINGS.backgroundColor,
      surfaceColor: DEFAULT_GAME_SETTINGS.surfaceColor,
      accentColor: DEFAULT_GAME_SETTINGS.accentColor,
      backgroundImageUrl: DEFAULT_GAME_SETTINGS.backgroundImageUrl,
      logoImageUrl: DEFAULT_GAME_SETTINGS.logoImageUrl,
      maxAttempts: DEFAULT_GAME_SETTINGS.maxAttempts,
    })
    .onConflictDoNothing();

  const created = await db
    .select()
    .from(gameSettings)
    .where(eq(gameSettings.id, 1))
    .limit(1);

  return toGameSettingsData(created[0]);
}

export async function ensureDailyChallenge(
  dateKey: string,
  mode: GameMode = "classic"
): Promise<{ challenge: DailyChallengeRow; target: FriendRow } | null> {
  const db = getDb();

  const findExisting = async () => {
    const rows = await db
      .select({
        challenge: dailyChallenges,
        target: friends,
      })
      .from(dailyChallenges)
      .innerJoin(friends, eq(dailyChallenges.friendId, friends.id))
      .where(
        and(
          eq(dailyChallenges.dateKey, dateKey),
          eq(dailyChallenges.mode, mode)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  };

  const existing = await findExisting();
  if (existing) {
    return existing;
  }

  const activeFriends = await db
    .select({ id: friends.id })
    .from(friends)
    .where(eq(friends.isActiveInPool, true));

  if (activeFriends.length === 0) {
    return null;
  }

  // Avoid repeating friends from the last 10 days.
  const recentRows = await db
    .select({ friendId: dailyChallenges.friendId })
    .from(dailyChallenges)
    .where(eq(dailyChallenges.mode, mode))
    .orderBy(desc(dailyChallenges.dateKey))
    .limit(10);

  const chosenId = pickDailyFriendId(
    activeFriends.map((f) => f.id),
    recentRows.map((r) => r.friendId),
    dateKey
  );

  await db
    .insert(dailyChallenges)
    .values({
      dateKey,
      mode,
      friendId: chosenId,
    })
    .onConflictDoNothing({
      target: [dailyChallenges.dateKey, dailyChallenges.mode],
    });

  return findExisting();
}

export async function getYesterdayCandidate(
  todayDateKey: string,
  mode: GameMode = "classic"
): Promise<FriendCandidate | null> {
  const db = getDb();
  const yesterdayKey = getPreviousDateKey(todayDateKey);
  const rows = await db
    .select({
      id: friends.id,
      name: friends.name,
      avatarUrl: friends.avatarUrl,
    })
    .from(dailyChallenges)
    .innerJoin(friends, eq(dailyChallenges.friendId, friends.id))
    .where(
      and(
        eq(dailyChallenges.dateKey, yesterdayKey),
        eq(dailyChallenges.mode, mode)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function ensureGameParameters(): Promise<GameParameter[]> {
  const db = getDb();
  const existing = await db
    .select()
    .from(gameParameters)
    .orderBy(asc(gameParameters.sortOrder), asc(gameParameters.createdAt));

  if (existing.length > 0) {
    return existing.map(toGameParameter);
  }

  await db
    .insert(gameParameters)
    .values(
      PALADLE_COLUMNS.map((col, idx) => ({
        key: col.key,
        shortLabel: col.shortLabel,
        fullLabel: col.fullLabel,
        type: col.type,
        unit: col.unit ?? null,
        options: col.options ? [...col.options] : null,
        minValue: col.min ?? null,
        maxValue: col.max ?? null,
        isVisible: true,
        sortOrder: idx,
        isSystem: true,
      }))
    )
    .onConflictDoNothing({ target: gameParameters.key });

  const created = await db
    .select()
    .from(gameParameters)
    .orderBy(asc(gameParameters.sortOrder), asc(gameParameters.createdAt));

  return created.map(toGameParameter);
}

export async function getVisibleGameParameters(): Promise<GameParameter[]> {
  const all = await ensureGameParameters();
  return all.filter((p) => p.isVisible);
}

export async function getGameBootstrap(
  mode: GameMode = "classic"
): Promise<GameBootstrapResponse> {
  const db = getDb();
  const dateKey = getArgentinaDateKey();

  const [settings, columns, daily, yesterdayFriend, candidateRows] =
    await Promise.all([
      getOrInitGameSettings(),
      getVisibleGameParameters(),
      ensureDailyChallenge(dateKey, mode),
      getYesterdayCandidate(dateKey, mode),
      db
        .select({
          id: friends.id,
          name: friends.name,
          avatarUrl: friends.avatarUrl,
        })
        .from(friends)
        .where(eq(friends.isActiveInPool, true))
        .orderBy(friends.name),
    ]);

  return {
    dateKey,
    challengeVersion: daily?.challenge.version ?? 1,
    mode,
    settings,
    columns,
    candidates: candidateRows,
    yesterdayFriend,
    dailyStats: computeDailyStats(daily?.challenge),
    poolEmpty: !daily || candidateRows.length === 0,
  };
}

export async function rerollDailyChallenge(
  dateKey: string,
  mode: GameMode = "classic"
): Promise<{ friendId: string; friendName: string; friendAvatarUrl: string }> {
  const db = getDb();
  const current = await ensureDailyChallenge(dateKey, mode);

  const activeFriends = await db
    .select({
      id: friends.id,
      name: friends.name,
      avatarUrl: friends.avatarUrl,
    })
    .from(friends)
    .where(eq(friends.isActiveInPool, true));

  if (activeFriends.length === 0) {
    throw new Error("No hay amigos activos en el pool para sortear.");
  }

  const pool =
    current && activeFriends.length > 1
      ? activeFriends.filter((f) => f.id !== current.target.id)
      : activeFriends;

  const chosen = pool[crypto.randomInt(pool.length)];

  if (current) {
    await db
      .update(dailyChallenges)
      .set({
        friendId: chosen.id,
        totalSolves: 0,
        totalAttemptsOnSolve: 0,
        version: sql`${dailyChallenges.version} + 1`,
      })
      .where(eq(dailyChallenges.id, current.challenge.id));
  } else {
    await db.insert(dailyChallenges).values({
      dateKey,
      mode,
      friendId: chosen.id,
      version: 1,
    });
  }

  return {
    friendId: chosen.id,
    friendName: chosen.name,
    friendAvatarUrl: chosen.avatarUrl,
  };
}

export async function recordDailySolve(
  dateKey: string,
  mode: GameMode,
  attemptNumber: number
): Promise<DailyStatsSummary> {
  const db = getDb();
  const safeAttempts = Math.max(1, Math.min(attemptNumber, 200));

  const updated = await db
    .update(dailyChallenges)
    .set({
      totalSolves: sql`${dailyChallenges.totalSolves} + 1`,
      totalAttemptsOnSolve: sql`${dailyChallenges.totalAttemptsOnSolve} + ${safeAttempts}`,
    })
    .where(
      and(
        eq(dailyChallenges.dateKey, dateKey),
        eq(dailyChallenges.mode, mode)
      )
    )
    .returning();

  return computeDailyStats(updated[0]);
}
