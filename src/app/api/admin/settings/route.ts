import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { gameSettings } from "@/db/schema";
import { getOrInitGameSettings, toGameSettingsData } from "@/db/queries";
import { requireAdminApi } from "@/lib/admin-route-guard";
import { settingsInputSchema } from "@/lib/validation";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const settings = await getOrInitGameSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Configuración inválida" },
      { status: 400 }
    );
  }

  await getOrInitGameSettings();
  const db = getDb();
  const updated = await db
    .update(gameSettings)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(gameSettings.id, 1))
    .returning();

  return NextResponse.json({ settings: toGameSettingsData(updated[0]) });
}
