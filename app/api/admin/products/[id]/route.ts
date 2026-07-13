import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// PUT /api/admin/products/:id  → ürün güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Geçersiz id." }, { status: 400 });
  }

  let body: {
    name?: string;
    unit?: string;
    image_url?: string | null;
    purchase_price?: number;
    retail_price?: number;
    stock?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const unit = (body.unit ?? "").trim();
  const image_url = body.image_url ?? null;
  const purchase_price = body.purchase_price ?? null;
  const retail_price = body.retail_price ?? null;
  const stock = body.stock ?? null;

  try {
    await ensureSchema();
    const result = await sql`
      UPDATE products SET
        name = COALESCE(${name || null}, name),
        unit = COALESCE(${unit || null}, unit),
        image_url = ${image_url},
        purchase_price = COALESCE(${purchase_price}, purchase_price),
        retail_price = COALESCE(${retail_price}, retail_price),
        stock = COALESCE(${stock}, stock)
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ product: result.rows[0] });
  } catch (err) {
    console.error("[products PUT]", err);
    return NextResponse.json({ error: "Ürün güncellenemedi." }, { status: 500 });
  }
}

// DELETE /api/admin/products/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Geçersiz id." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result = await sql`DELETE FROM products WHERE id = ${id};`;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[products DELETE]", err);
    return NextResponse.json({ error: "Ürün silinemedi." }, { status: 500 });
  }
}
