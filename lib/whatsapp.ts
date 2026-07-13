import type { CartItem } from "@/lib/types";
import { formatTRY, formatUnit, productLabel } from "@/lib/format";

export interface OrderSummary {
  first_name: string;
  last_name: string;
  address: string;
  phone: string;
  note: string | null;
  items: CartItem[];
  total: number;
}

/**
 * Sipariş özetini düzgün bir WhatsApp metin şablonuna dönüştürür.
 */
export function buildOrderMessage(s: OrderSummary): string {
  const lines: string[] = [];
  lines.push("🛍️ *YENİ SİPARİŞ*");
  lines.push("━━━━━━━━━━━━━━━");
  lines.push("");
  lines.push("*Ürünler:*");
  s.items.forEach((it, i) => {
    const label = productLabel(it) || `#${it.product_id}`;
    const unit = formatUnit(it.unit_type, it.unit_value);
    lines.push(
      `${i + 1}. ${label}${unit ? ` (${unit})` : ""}`
    );
    lines.push(
      `   ${it.quantity} x ${formatTRY(it.unit_price)} = ${formatTRY(
        it.unit_price * it.quantity
      )}`
    );
  });
  lines.push("");
  lines.push(`*Toplam: ${formatTRY(s.total)}*`);
  lines.push("");
  lines.push("*Müşteri Bilgileri:*");
  lines.push(`👤 ${s.first_name} ${s.last_name}`);
  lines.push(`📞 ${s.phone}`);
  lines.push(`📍 ${s.address}`);
  if (s.note) {
    lines.push("");
    lines.push("*Sipariş Notu:*");
    lines.push(s.note);
  }
  return lines.join("\n");
}
