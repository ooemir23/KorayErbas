// Para biyatlama yardımcısı.
export function formatTRY(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(Number.isFinite(n) ? n : 0);
}

// Tarihi "13 Tem 2026, 15:35" gibi gösterir.
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// "2026-07" → "Tem 2026"
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    year: "numeric",
  }).format(d);
}

// Telefon için wa.me bağlantısı: boşluk, parantez, tire vs. temizler.
export function toWaPhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

// WhatsApp mesaj metnini URL encode eder.
export function buildWhatsAppLink(phone: string, text: string): string {
  const clean = toWaPhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

// Birim tipi etiketleri (UI select ve gösterimde kullanılır).
export const UNIT_TYPES = ["gram", "kilo", "paket", "kutu"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

// Birim tipi → tekil etiket.
const UNIT_LABELS_SINGULAR: Record<UnitType, string> = {
  gram: "gram",
  kilo: "kilo",
  paket: "paket",
  kutu: "kutu",
};

// Birim tipi + miktar → "500 gram", "2 kilo", "1 paket".
// Miktar 1 ise ve birim sayılabilen birimse yine de sayıyı gösteririz
// ("1 paket"), ama 0 veya boşsa sadece birim adı döner.
export function formatUnit(
  unitType?: string | null,
  unitValue?: number | null
): string {
  const t = (unitType as UnitType) || "";
  const label = UNIT_LABELS_SINGULAR[t] || t || "";
  if (!label) return "";
  const v = Number(unitValue);
  if (!Number.isFinite(v) || v <= 0) return label;
  return `${v} ${label}`;
}

// Marka + aroma → "Çaykur Rize" (tek satırda ürün etiketi).
export function productLabel(p: {
  brand?: string | null;
  flavor?: string | null;
}): string {
  const parts = [p.brand?.trim(), p.flavor?.trim()].filter(Boolean);
  return parts.join(" ");
}
