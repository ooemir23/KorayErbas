import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import type { CartItem } from "@/lib/types";

// POST /api/orders  → Storefront'tan yeni sipariş oluşturur.
// Sipariş "pending" olarak kaydedilir; stok, admin onayı sonrası düşülür.
export async function POST(request: Request) {
  let body: {
    first_name?: string;
    last_name?: string;
    address?: string;
    phone?: string;
    note?: string;
    items?: CartItem[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // ---- Doğrulama ----
  const first_name = (body.first_name || "").trim();
  const last_name = (body.last_name || "").trim();
  const address = (body.address || "").trim();
  const phone = (body.phone || "").trim();
  const note = (body.note || "").trim() || null;
  const items = Array.isArray(body.items) ? body.items : [];

  const errors: string[] = [];
  if (!first_name) errors.push("İsim gerekli.");
  if (!last_name) errors.push("Soyisim gerekli.");
  if (!address) errors.push("Adres gerekli.");
  if (!phone) errors.push("Telefon gerekli.");
  if (items.length === 0) errors.push("Sepet boş.");

  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // Toplam tutarı DB'den gelen güncel fiyatla yeniden hesapla (güvenlik).
  const ids = items.map((i) => i.product_id);
  await ensureSchema();
  const client = await sql.connect();
  let productMap: Map<number, any>;
  try {
    const productRows = await client.query(
      `SELECT id, name, unit, retail_price, stock
       FROM products WHERE id = ANY($1::int[]);`,
      [ids]
    );
    productMap = new Map(productRows.rows.map((p: any) => [p.id, p]));
  } finally {
    client.release();
  }

  let total = 0;
  const orderItems = items.map((ci) => {
    const p = productMap.get(ci.product_id);
    if (!p) throw new Error("Geçersiz ürün.");
    const unit_price = Number(p.retail_price);
    total += unit_price * ci.quantity;
    return {
      product_id: p.id,
      product_name: p.name,
      unit: p.unit,
      quantity: ci.quantity,
      unit_price,
    };
  });

  const txClient = await sql.connect();
  try {
    await txClient.query("BEGIN");
    const res = await txClient.query(
      `INSERT INTO orders
        (first_name, last_name, address, phone, note, items, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id;`,
      [
        first_name,
        last_name,
        address,
        phone,
        note,
        JSON.stringify(orderItems),
        total,
      ]
    );
    await txClient.query("COMMIT");
    return NextResponse.json(
      { id: res.rows[0].id, total_amount: total, items: orderItems },
      { status: 201 }
    );
  } catch (err) {
    await txClient.query("ROLLBACK");
    console.error("[orders POST]", err);
    return NextResponse.json(
      { error: "Sipariş oluşturulamadı." },
      { status: 500 }
    );
  } finally {
    txClient.release();
  }
}
