import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { UNIT_TYPES, type UnitType } from "@/lib/format";

// POST /api/admin/products  (yeni ürün)
export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  let body: {
    brand?: string;
    flavor?: string;
    unit_type?: string;
    unit_value?: number;
    image_url?: string | null;
    purchase_price?: number;
    retail_price?: number;
    stock?: number;
    critical_threshold?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const brand = (body.brand || "").trim();
  const flavor = (body.flavor || "").trim();
  if (!brand) {
    return NextResponse.json(
      { error: "Marka zorunludur." },
      { status: 400 }
    );
  }

  const unit_type_raw = (body.unit_type || "").trim();
  // Bilinmeyen birim tipi varsayılan 'adet' değil, reddet.
  const unit_type = UNIT_TYPES.includes(unit_type_raw as UnitType)
    ? unit_type_raw
    : "";
  if (!unit_type) {
    return NextResponse.json(
      { error: "Geçersiz birim tipi." },
      { status: 400 }
    );
  }

  const unit_value = Math.max(0, Number(body.unit_value) || 0);
  const image_url = body.image_url ?? null;
  const purchase_price = Number(body.purchase_price) || 0;
  const retail_price = Number(body.retail_price) || 0;
  const stock = Math.max(0, Math.floor(Number(body.stock) || 0));
  const critical_threshold = Math.max(
    0,
    Math.floor(Number(body.critical_threshold) || 0)
  );

  try {
    await ensureSchema();

    // Benzersizlik kontrolü: marka + aroma + birim tipi + miktar
    const existing = await sql`
      SELECT 1 FROM products
      WHERE brand = ${brand}
        AND flavor = ${flavor}
        AND unit_type = ${unit_type}
        AND unit_value = ${unit_value}
      LIMIT 1;
    `;
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        {
          error: `Bu ürün zaten mevcut: ${brand} ${flavor} (${unit_value} ${unit_type}). Aynı marka/aroma/birim kombinasyonuyla tekrar eklenemez.`,
        },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO products (brand, flavor, unit_type, unit_value, image_url, purchase_price, retail_price, stock, critical_threshold)
      VALUES (${brand}, ${flavor}, ${unit_type}, ${unit_value}, ${image_url}, ${purchase_price}, ${retail_price}, ${stock}, ${critical_threshold})
      RETURNING *;
    `;
    return NextResponse.json({ product: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[products POST]", err);
    return NextResponse.json({ error: "Ürün eklenemedi." }, { status: 500 });
  }
}
