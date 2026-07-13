import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// POST /api/admin/products  (yeni ürün)
export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
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
  if (!name) {
    return NextResponse.json({ error: "Ürün adı zorunludur." }, { status: 400 });
  }

  const unit = (body.unit || "").trim();
  const image_url = body.image_url ?? null;
  const purchase_price = Number(body.purchase_price) || 0;
  const retail_price = Number(body.retail_price) || 0;
  const stock = Math.max(0, Math.floor(Number(body.stock) || 0));

  try {
    const result = await sql`
      INSERT INTO products (name, unit, image_url, purchase_price, retail_price, stock)
      VALUES (${name}, ${unit}, ${image_url}, ${purchase_price}, ${retail_price}, ${stock})
      RETURNING *;
    `;
    return NextResponse.json({ product: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[products POST]", err);
    return NextResponse.json({ error: "Ürün eklenemedi." }, { status: 500 });
  }
}
