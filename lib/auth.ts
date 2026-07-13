import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "crypto";

const SESSION_COOKIE = "admin_session";
// Runtime'da env'i oku (next build sırasında .env'i yakalar).
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET tanımlı değil veya çok kısa (>= 32 karakter olmalı)."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  role: "admin";
}

// Çerez adı
export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function signSession(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token?: string): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return { role: "admin" };
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Sabit zamanlı karşılaştırma (timing-safe).
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Admin korumalı API rotaları için yardımcı: request'ten çerezi okur.
export async function isAuthenticated(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = parseCookie(cookieHeader, SESSION_COOKIE);
  const session = await verifySession(token);
  return session !== null;
}

function parseCookie(header: string, name: string): string | undefined {
  return header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}
