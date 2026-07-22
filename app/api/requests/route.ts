import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import type { Product, ProductRequest } from "@/lib/types";

// POST /api/requests  (public — auth gerekmez)
// Müşteri, stokta olmayan bir ürün için talep oluşturur.
export async function POST(request: Request) {
  let body: {
    product_id?: number;
    customer_name?: string;
    customer_phone?: string;
    quantity?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const customer_name = (body.customer_name || "").trim();
  const customer_phone = (body.customer_phone || "").trim();
  const product_id = body.product_id ? Number(body.product_id) : null;
  const quantity = Math.max(1, Math.floor(Number(body.quantity) || 1));
  const note = (body.note || "").trim() || null;

  const errors: string[] = [];
  if (!customer_name) errors.push("İsim gerekli.");
  if (!customer_phone) errors.push("Telefon gerekli.");
  if (!product_id) errors.push("Ürün gerekli.");
  if (errors.length) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  try {
    await ensureSchema();

    // Ürünü çek (marka/aroma/birim bilgisi talebe kopyalanır; ürün silinirse
    // bile talep geçmişi korunur).
    const productRows = await sql<Product>`
      SELECT brand, flavor, unit_type, unit_value FROM products WHERE id = ${product_id};
    `;
    if (productRows.rowCount === 0) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }
    const p = productRows.rows[0];

    const result = await sql`
      INSERT INTO requests
        (product_id, brand, flavor, unit_type, unit_value, customer_name, customer_phone, quantity, note)
      VALUES
        (${product_id}, ${p.brand}, ${p.flavor}, ${p.unit_type}, ${p.unit_value}, ${customer_name}, ${customer_phone}, ${quantity}, ${note})
      RETURNING *;
    `;
    return NextResponse.json(
      { request: result.rows[0] as ProductRequest },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[requests POST]", err);
    const msg = err?.message || "Talep oluşturulamadı.";
    return NextResponse.json(
      { error: `Talep oluşturulamadı: ${msg}` },
      { status: 500 }
    );
  }
}
