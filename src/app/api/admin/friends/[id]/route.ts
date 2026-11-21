import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { dailyChallenges, friends } from "@/db/schema";
import { toFriendRecord } from "@/db/queries";
import { requireAdminApi } from "@/lib/admin-route-guard";
import { friendInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = friendInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getDb();
  const updated = await db
    .update(friends)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(friends.id, id))
    .returning();

  if (!updated[0]) {
    return NextResponse.json(
      { error: "Amigo no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ friend: toFriendRecord(updated[0]) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const db = getDb();

  const referenced = await db
    .select({ id: dailyChallenges.id })
    .from(dailyChallenges)
    .where(eq(dailyChallenges.friendId, id))
    .limit(1);

  if (referenced[0]) {
    return NextResponse.json(
      {
        error:
          "Este amigo ya salió en un desafío diario. Desactivalo del pool en vez de eliminarlo para preservar el historial.",
      },
      { status: 409 }
    );
  }

  const deleted = await db
    .delete(friends)
    .where(eq(friends.id, id))
    .returning({ id: friends.id });

  if (!deleted[0]) {
    return NextResponse.json(
      { error: "Amigo no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
