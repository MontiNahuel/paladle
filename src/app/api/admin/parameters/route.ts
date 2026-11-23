import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { gameParameters } from "@/db/schema";
import { ensureGameParameters, toGameParameter } from "@/db/queries";
import { requireAdminApi } from "@/lib/admin-route-guard";
import { parameterInputSchema } from "@/lib/validation";

function toCamelKey(label: string): string {
  const clean = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "param";
  return parts
    .map((p, i) =>
      i === 0
        ? p.toLowerCase()
        : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )
    .join("");
}

async function resolveUniqueKey(shortLabel: string): Promise<string> {
  const db = getDb();
  const base = toCamelKey(shortLabel);
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await db
      .select({ id: gameParameters.id })
      .from(gameParameters)
      .where(eq(gameParameters.key, candidate))
      .limit(1);
    if (!existing[0]) return candidate;
    candidate = `${base}${counter}`;
    counter += 1;
  }
}

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const parameters = await ensureGameParameters();
  return NextResponse.json({ parameters });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = parameterInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  if (parsed.data.type === "enum" && (!parsed.data.options || parsed.data.options.length === 0)) {
    return NextResponse.json(
      { error: "Un parámetro tipo Selector necesita al menos una opción." },
      { status: 400 }
    );
  }

  const existing = await ensureGameParameters();
  const nextOrder =
    existing.length > 0
      ? Math.max(...existing.map((p) => p.sortOrder)) + 1
      : 0;
  const key = await resolveUniqueKey(parsed.data.shortLabel);

  const db = getDb();
  const inserted = await db
    .insert(gameParameters)
    .values({
      key,
      shortLabel: parsed.data.shortLabel,
      fullLabel: parsed.data.fullLabel,
      type: parsed.data.type,
      unit: parsed.data.type === "number" ? parsed.data.unit : null,
      options: parsed.data.type === "enum" ? parsed.data.options : null,
      minValue: parsed.data.type === "number" ? parsed.data.minValue : null,
      maxValue: parsed.data.type === "number" ? parsed.data.maxValue : null,
      isVisible: parsed.data.isVisible,
      sortOrder: nextOrder,
      isSystem: false,
    })
    .returning();

  return NextResponse.json(
    { parameter: toGameParameter(inserted[0]) },
    { status: 201 }
  );
}
