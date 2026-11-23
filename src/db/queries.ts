import crypto from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dailyChallenges,
  friends,
  gameSettings,
  type DailyChallengeRow,
  type FriendRow,
  type GameSettingsRow,
} from "@/db/schema";
import {
  getArgentinaDateKey,
  getPreviousDateKey,
  pickDailyFriendId,
} from "@/engine/daily";
import { DEFAULT_GAME_SETTINGS } from "@/lib/theme";
import type {
  DailyStatsSummary,
  FriendCandidate,
  FriendRecord,
  GameBootstrapResponse,
  GameMode,
  GameSettingsData,
  RetroFont,
  ThemePreset,
} from "@/types/game";

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

export async function getGameBootstrap(
  mode: GameMode = "classic"
): Promise<GameBootstrapResponse> {
  const db = getDb();
  const dateKey = getArgentinaDateKey();

  const [settings, daily, yesterdayFriend, candidateRows] = await Promise.all([
    getOrInitGameSettings(),
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
