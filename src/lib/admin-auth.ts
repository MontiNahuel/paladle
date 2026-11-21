import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "paladle_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function isAdminPanelEnabled(): boolean {
  return process.env.ENABLE_ADMIN_PANEL === "true";
}

function getSigningSecret(): string | null {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit && explicit.length >= 8) {
    return explicit;
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return null;
  }
  return crypto
    .createHash("sha256")
    .update(`paladle-session:${password}`)
    .digest("hex");
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createAdminSessionToken(): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("ADMIN_PASSWORD no está configurada.");
  }
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  const sig = signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const expected = signPayload(payload, secret);
  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export function verifyAdminPassword(input: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || !input) return false;

  const inputHash = crypto.createHash("sha256").update(input).digest();
  const expectedHash = crypto.createHash("sha256").update(configured).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isAdminPanelEnabled()) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export function getAdminCookieOptions() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
