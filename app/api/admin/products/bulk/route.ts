import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { UNIT_TYPES, type UnitType } from "@/lib/format";

// POST /api/admin/products/bulk
// Tek marka + çoklu aroma toplu ürün ekleme.
// Body:
// {
//   brand, unit_type, unit_value, image_url,
//   purchase_price, retail_price, critical_threshold,
//   apply_image_to_brand?: boolean, // mevcut aynı-marka ürünlere görseli uygula
//   items: [{ flavor, stock, purchase_price?, retail_price? }]
// }
export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  let body: {
    brand?: string;
    unit_type?: string;
    unit_value?: number;
    image_url?: string | null;
    purchase_price?: number;
    retail_price?: number;
    critical_threshold?: number;
    apply_image_to_brand?: boolean;
    items?: { flavor?: string; stock?: number; purchase_price?: number; retail_price?: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const brand = (body.brand || "").trim();
  if (!brand) {
    return NextResponse.json({ error: "Marka zorunludur." }, { status: 400 });
  }

  const unit_type_raw = (body.unit_type || "").trim();
  const unit_type = UNIT_TYPES.includes(unit_type_raw as UnitType)
    ? unit_type_raw
    : "";
  if (!unit_type) {
    return NextResponse.json(
      { error: "Geçersiz birim tipi." },
      { status: 400 }
    );
  }

  const items = Array.isArray(body.items) ? body.items : [];
  // Boş aroma satırlarını at, tekrar eden aromaları da ele.
  const seen = new Set<string>();
  const rows = items
    .map((it) => ({
      flavor: (it.flavor || "").trim(),
      stock: Math.max(0, Math.floor(Number(it.stock) || 0)),
      purchase_price: it.purchase_price != null && Number(it.purchase_price) > 0
        ? Number(it.purchase_price)
        : Number(body.purchase_price) || 0,
      retail_price: it.retail_price != null && Number(it.retail_price) > 0
        ? Number(it.retail_price)
        : Number(body.retail_price) || 0,
    }))
    .filter((r) => {
      if (!r.flavor || seen.has(r.flavor.toLowerCase())) return false;
      seen.add(r.flavor.toLowerCase());
      return true;
    });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "En az bir aroma adı girin." },
      { status: 400 }
    );
  }

  const unit_value = Math.max(0, Number(body.unit_value) || 0);
  const image_url = body.image_url ?? null;
  const critical_threshold = Math.max(
    0,
    Math.floor(Number(body.critical_threshold) || 0)
  );

  try {
    await ensureSchema();
    const client = await sql.connect();
    try {
      const created: any[] = [];
      const skipped: string[] = [];

      for (const row of rows) {
        // Benzersizlik: marka + aroma + birim
        const existing = await client.query(
          `SELECT 1 FROM products
           WHERE brand = $1 AND flavor = $2 AND unit_type = $3 AND unit_value = $4
           LIMIT 1;`,
          [brand, row.flavor, unit_type, unit_value]
        );
        if (existing.rowCount && existing.rowCount > 0) {
          skipped.push(`${brand} ${row.flavor}`);
          continue;
        }
        const result = await client.query(
          `INSERT INTO products (brand, flavor, unit_type, unit_value, image_url, purchase_price, retail_price, stock, critical_threshold)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;`,
          [
            brand,
            row.flavor,
            unit_type,
            unit_value,
            image_url,
            row.purchase_price,
            row.retail_price,
            row.stock,
            critical_threshold,
          ]
        );
        created.push(result.rows[0]);
      }

      // İstenirse markanın mevcut tüm ürünlerine görseli uygula.
      if (body.apply_image_to_brand && image_url) {
        const upd = await client.query(
          `UPDATE products SET image_url = $1 WHERE brand = $2 AND (image_url IS NULL OR image_url <> $1);`,
          [image_url, brand]
        );
        return NextResponse.json({
          created,
          skipped,
          brandImageUpdated: upd.rowCount ?? 0,
        });
      }

      return NextResponse.json({ created, skipped, brandImageUpdated: 0 });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[products bulk POST]", err);
    const msg =
      err?.message || (typeof err === "string" ? err : "Toplu ekleme başarısız.");
    return NextResponse.json(
      { error: `Toplu ekleme başarısız: ${msg}` },
      { status: 500 }
    );
  }
}
