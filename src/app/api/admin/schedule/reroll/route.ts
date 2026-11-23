import { NextResponse } from "next/server";
import { rerollDailyChallenge } from "@/db/queries";
import { getArgentinaDateKey } from "@/engine/daily";
import { requireAdminApi } from "@/lib/admin-route-guard";

export async function POST() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const todayKey = getArgentinaDateKey();
    const chosen = await rerollDailyChallenge(todayKey, "classic");
    return NextResponse.json({
      ok: true,
      dateKey: todayKey,
      friend: chosen,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo regenerar el amigo del día.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
