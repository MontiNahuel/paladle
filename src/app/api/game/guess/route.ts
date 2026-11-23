import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { friends } from "@/db/schema";
import {
  computeDailyStats,
  ensureDailyChallenge,
  getVisibleGameParameters,
  recordDailySolve,
  resolveFriendAttributes,
} from "@/db/queries";
import { compareFriendGuess } from "@/engine/compare";
import { getArgentinaDateKey } from "@/engine/daily";
import { guessPayloadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = guessPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
        { status: 400 }
      );
    }

    const { guessId, attemptNumber } = parsed.data;
    const dateKey = getArgentinaDateKey();
    const db = getDb();

    const [daily, guessedRows, visibleColumns] = await Promise.all([
      ensureDailyChallenge(dateKey, "classic"),
      db
        .select()
        .from(friends)
        .where(eq(friends.id, guessId))
        .limit(1),
      getVisibleGameParameters(),
    ]);

    if (!daily) {
      return NextResponse.json(
        { error: "Todavía no hay amigos activos cargados para jugar." },
        { status: 409 }
      );
    }

    const guessedFriend = guessedRows[0];
    if (!guessedFriend || !guessedFriend.isActiveInPool) {
      return NextResponse.json(
        { error: "El amigo seleccionado no está disponible." },
        { status: 404 }
      );
    }

    const comparison = compareFriendGuess(
      {
        id: guessedFriend.id,
        name: guessedFriend.name,
        avatarUrl: guessedFriend.avatarUrl,
        attributes: resolveFriendAttributes(guessedFriend),
      },
      {
        id: daily.target.id,
        name: daily.target.name,
        avatarUrl: daily.target.avatarUrl,
        attributes: resolveFriendAttributes(daily.target),
      },
      visibleColumns
    );
    const dailyStats = comparison.isCorrect
      ? await recordDailySolve(dateKey, "classic", attemptNumber)
      : computeDailyStats(daily.challenge);

    return NextResponse.json({
      dateKey,
      guess: comparison,
      dailyStats,
    });
  } catch (error) {
    console.error("Error in POST /api/game/guess:", error);
    return NextResponse.json(
      { error: "Error procesando tu intento." },
      { status: 500 }
    );
  }
}
