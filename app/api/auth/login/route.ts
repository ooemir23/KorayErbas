import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSession, verifyPassword, getSessionCookieName } from "@/lib/auth";

// POST /api/auth/login  { password }
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const password = (body.password || "").trim();
  if (!password) {
    return NextResponse.json({ error: "Parola gerekli." }, { status: 400 });
  }

  const ok = await verifyPassword(password);
  if (!ok) {
    return NextResponse.json({ error: "Parola hatalı." }, { status: 401 });
  }

  const token = await signSession();
  const cookieName = getSessionCookieName();
  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
  });

  return NextResponse.json({ ok: true });
}
