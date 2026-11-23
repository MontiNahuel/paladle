import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { friends } from "@/db/schema";
import {
  buildLegacyColumnsFromAttributes,
  slugifyFriendName,
  toFriendRecord,
} from "@/db/queries";
import { requireAdminApi } from "@/lib/admin-route-guard";
import { dynamicFriendInputSchema } from "@/lib/validation";

async function resolveUniqueSlug(baseName: string): Promise<string> {
  const db = getDb();
  const baseSlug = slugifyFriendName(baseName);
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db
      .select({ id: friends.id })
      .from(friends)
      .where(eq(friends.slug, candidate))
      .limit(1);
    if (!existing[0]) {
      return candidate;
    }
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const db = getDb();
  const rows = await db.select().from(friends).orderBy(asc(friends.name));
  return NextResponse.json({ friends: rows.map(toFriendRecord) });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = dynamicFriendInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getDb();
  const slug = await resolveUniqueSlug(parsed.data.name);
  const legacy = buildLegacyColumnsFromAttributes(parsed.data.attributes);

  const inserted = await db
    .insert(friends)
    .values({
      slug,
      name: parsed.data.name,
      avatarUrl: parsed.data.avatarUrl,
      isActiveInPool: parsed.data.isActiveInPool,
      ...legacy,
      attributes: parsed.data.attributes,
    })
    .returning();

  return NextResponse.json(
    { friend: toFriendRecord(inserted[0]) },
    { status: 201 }
  );
}
