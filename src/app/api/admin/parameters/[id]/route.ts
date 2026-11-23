import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { gameParameters } from "@/db/schema";
import { toGameParameter } from "@/db/queries";
import { requireAdminApi } from "@/lib/admin-route-guard";
import { parameterInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = parameterInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getDb();
  const existingRows = await db
    .select()
    .from(gameParameters)
    .where(eq(gameParameters.id, id))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json(
      { error: "Parámetro no encontrado." },
      { status: 404 }
    );
  }

  const nextType = parsed.data.type ?? existing.type;
  const nextOptions =
    parsed.data.options !== undefined ? parsed.data.options : existing.options;

  if (nextType === "enum" && (!nextOptions || nextOptions.length === 0)) {
    return NextResponse.json(
      { error: "Un parámetro tipo Selector necesita al menos una opción." },
      { status: 400 }
    );
  }

  const updated = await db
    .update(gameParameters)
    .set({
      ...(parsed.data.shortLabel !== undefined
        ? { shortLabel: parsed.data.shortLabel }
        : {}),
      ...(parsed.data.fullLabel !== undefined
        ? { fullLabel: parsed.data.fullLabel }
        : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.unit !== undefined ? { unit: parsed.data.unit } : {}),
      ...(parsed.data.options !== undefined
        ? { options: parsed.data.options }
        : {}),
      ...(parsed.data.minValue !== undefined
        ? { minValue: parsed.data.minValue }
        : {}),
      ...(parsed.data.maxValue !== undefined
        ? { maxValue: parsed.data.maxValue }
        : {}),
      ...(parsed.data.isVisible !== undefined
        ? { isVisible: parsed.data.isVisible }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(gameParameters.id, id))
    .returning();

  return NextResponse.json({ parameter: toGameParameter(updated[0]) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const db = getDb();

  const existingRows = await db
    .select()
    .from(gameParameters)
    .where(eq(gameParameters.id, id))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json(
      { error: "Parámetro no encontrado." },
      { status: 404 }
    );
  }

  if (existing.isSystem) {
    return NextResponse.json(
      {
        error:
          "Los parámetros base no se eliminan para no perder datos previos; podés ocultarlo con el botón Ocultar.",
      },
      { status: 409 }
    );
  }

  await db.delete(gameParameters).where(eq(gameParameters.id, id));
  return NextResponse.json({ ok: true });
}
