import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminSessionToken,
  getAdminCookieOptions,
  isAdminAuthenticated,
  isAdminPanelEnabled,
  verifyAdminPassword,
} from "@/lib/admin-auth";

const loginSchema = z.object({
  password: z.string().min(1, "Ingresá la contraseña"),
});

export async function GET() {
  if (!isAdminPanelEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}

export async function POST(request: Request) {
  if (!isAdminPanelEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no está configurada en el servidor." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Contraseña requerida." },
      { status: 400 }
    );
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

  const token = createAdminSessionToken();
  const cookieOpts = getAdminCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieOpts.name, token, cookieOpts);
  return response;
}

export async function DELETE() {
  if (!isAdminPanelEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const cookieOpts = getAdminCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieOpts.name, "", { ...cookieOpts, maxAge: 0 });
  return response;
}
