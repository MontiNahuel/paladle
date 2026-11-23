import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { dailyChallenges, friends } from "@/db/schema";
import { computeDailyStats, ensureDailyChallenge } from "@/db/queries";
import { getArgentinaDateKey } from "@/engine/daily";
import { requireAdminApi } from "@/lib/admin-route-guard";
import { scheduleOverrideSchema } from "@/lib/validation";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const todayKey = getArgentinaDateKey();
  await ensureDailyChallenge(todayKey, "classic");

  const db = getDb();
  const rows = await db
    .select({
      id: dailyChallenges.id,
      dateKey: dailyChallenges.dateKey,
      mode: dailyChallenges.mode,
      friendId: dailyChallenges.friendId,
      friendName: friends.name,
      friendAvatarUrl: friends.avatarUrl,
      totalSolves: dailyChallenges.totalSolves,
      totalAttemptsOnSolve: dailyChallenges.totalAttemptsOnSolve,
    })
    .from(dailyChallenges)
    .innerJoin(friends, eq(dailyChallenges.friendId, friends.id))
    .orderBy(desc(dailyChallenges.dateKey))
    .limit(30);

  return NextResponse.json({
    todayKey,
    schedule: rows.map((row) => ({
      id: row.id,
      dateKey: row.dateKey,
      mode: row.mode,
      friendId: row.friendId,
      friendName: row.friendName,
      friendAvatarUrl: row.friendAvatarUrl,
      stats: computeDailyStats({
        id: row.id,
        dateKey: row.dateKey,
        mode: row.mode,
        friendId: row.friendId,
        totalSolves: row.totalSolves,
        totalAttemptsOnSolve: row.totalAttemptsOnSolve,
        version: 1,
        createdAt: new Date(),
      }),
    })),
  });
}

export async function PUT(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = scheduleOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getDb();
  const targetFriend = await db
    .select({ id: friends.id })
    .from(friends)
    .where(eq(friends.id, parsed.data.friendId))
    .limit(1);

  if (!targetFriend[0]) {
    return NextResponse.json(
      { error: "Amigo no encontrado." },
      { status: 404 }
    );
  }

  await db
    .insert(dailyChallenges)
    .values({
      dateKey: parsed.data.dateKey,
      mode: "classic",
      friendId: parsed.data.friendId,
    })
    .onConflictDoUpdate({
      target: [dailyChallenges.dateKey, dailyChallenges.mode],
      set: {
        friendId: parsed.data.friendId,
        totalSolves: 0,
        totalAttemptsOnSolve: 0,
        version: sql`${dailyChallenges.version} + 1`,
      },
    });

  return NextResponse.json({ ok: true });
}
