import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { gameParameters } from "@/db/schema";
import { bumpTodayChallengeVersion } from "@/db/queries";
import { requireAdminApi } from "@/lib/admin-route-guard";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export async function PUT(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Lista de IDs inválida." },
      { status: 400 }
    );
  }

  const db = getDb();
  await Promise.all(
    parsed.data.orderedIds.map((id, idx) =>
      db
        .update(gameParameters)
        .set({ sortOrder: idx, updatedAt: new Date() })
        .where(eq(gameParameters.id, id))
    )
  );

  await bumpTodayChallengeVersion("classic");

  return NextResponse.json({ ok: true });
}
