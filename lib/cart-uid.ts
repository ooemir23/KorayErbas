"use client";

const COOKIE_NAME = "cart_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 yıl

// Cookie'den anonim sepet kimliğini okur; yoksa oluşturup yazar.
// Tarayıcıyı (müşteriyi) takip etmek için — login gerekmez.
export function getCartUid(): string {
  if (typeof document === "undefined") return "";

  // Mevcut cookie'yi ara.
  const existing = parseCookie(COOKIE_NAME);
  if (existing) return existing;

  // Yeni UUID oluştur (crypto.randomUUID destekleniyorsa, değilse fallback).
  const uid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : fallbackUuid();

  document.cookie = `${COOKIE_NAME}=${uid}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  return uid;
}

function parseCookie(name: string): string | null {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

// Eski tarayıcılar için UUID v4 fallback.
function fallbackUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
