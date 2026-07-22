import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import type { CartItem } from "@/lib/types";

// POST /api/carts  (public — auth gerekmez)
// Checkout sayfasından çağrılır. Aynı cart_uid ile 'active' kayıt varsa
// günceller (upsert), yoksa yeni oluşturur. status 'converted' gönderilirse
// (sipariş başarılı) mevcut active kaydı converted'a çeker.
export async function POST(request: Request) {
  let body: {
    cart_uid?: string;
    items?: CartItem[];
    customer_name?: string;
    customer_phone?: string;
    total?: number;
    status?: "active" | "converted";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const cart_uid = (body.cart_uid || "").trim();
  if (!cart_uid) {
    return NextResponse.json({ error: "cart_uid gerekli." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const customer_name = (body.customer_name || "").trim() || null;
  const customer_phone = (body.customer_phone || "").trim() || null;
  const total_amount = Number(body.total) || 0;
  const newStatus = body.status === "converted" ? "converted" : "active";

  try {
    await ensureSchema();

    // Aynı cart_uid ile active kaydı var mı?
    const existing = await sql`
      SELECT id FROM carts WHERE cart_uid = ${cart_uid} AND status = 'active'
      ORDER BY updated_at DESC LIMIT 1;
    `;

    if (existing.rowCount && existing.rowCount > 0) {
      const id = existing.rows[0].id;
      // converted ise status değiştir; değilse active kalıp güncelle.
      await sql`
        UPDATE carts SET
          items = ${JSON.stringify(items)}::jsonb,
          customer_name = COALESCE(${customer_name}, customer_name),
          customer_phone = COALESCE(${customer_phone}, customer_phone),
          total_amount = ${total_amount},
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${id};
      `;
      return NextResponse.json({ ok: true, id });
    }

    // Yeni kayıt (converted ise bile yeni satır açma — sadece active ise).
    if (newStatus === "converted") {
      // active kayıt yoksa converted yazma (sipariş olmadan sepet kaydı yok).
      return NextResponse.json({ ok: true, skipped: true });
    }

    const result = await sql`
      INSERT INTO carts (cart_uid, items, customer_name, customer_phone, total_amount, status)
      VALUES (${cart_uid}, ${JSON.stringify(items)}::jsonb, ${customer_name}, ${customer_phone}, ${total_amount}, 'active')
      RETURNING id;
    `;
    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (err: any) {
    console.error("[carts POST]", err);
    const msg = err?.message || "Sepet kaydedilemedi.";
    return NextResponse.json(
      { error: `Sepet kaydedilemedi: ${msg}` },
      { status: 500 }
    );
  }
}
