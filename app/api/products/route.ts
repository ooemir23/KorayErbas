import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import type { Product } from "@/lib/types";

// GET /api/products → Storefront için SADECE stok > 0 olan ürünler.
//   ?all=1 verilirse (admin) tüm ürünleri döner.
//   ?q=... verilirse marka/aroma/birim'de arama yapar.
//   ?brand=... verilirse sadece belirli markayı döner.
//
// Arama büyük-küçük harf duyarsızdır, ILIKE ile yapılır.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const q = searchParams.get("q")?.trim() || "";
  const brand = searchParams.get("brand")?.trim() || "";

  try {
    await ensureSchema();

    // Arama/filtre yoksa basit sorgu.
    if (!q && !brand) {
      const result = all
        ? await sql<Product>`SELECT * FROM products ORDER BY brand, flavor, id DESC;`
        : await sql<Product>`SELECT * FROM products WHERE stock > 0 ORDER BY brand, flavor, id DESC;`;
      return NextResponse.json({ products: result.rows });
    }

    // Arama veya marka filtresi varsa dinamik sorgu.
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (!all) {
      conditions.push(`stock > 0`);
    }
    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      conditions.push(
        `(brand ILIKE $${idx} OR flavor ILIKE $${idx} OR unit_type ILIKE $${idx})`
      );
    }
    if (brand) {
      values.push(brand);
      const idx = values.length;
      conditions.push(`brand = $${idx}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const client = await sql.connect();
    try {
      const res = await client.query<Product>(
        `SELECT * FROM products ${where} ORDER BY brand, flavor, id DESC;`,
        values
      );
      return NextResponse.json({ products: res.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[products GET]", err);
    return NextResponse.json(
      { error: "Ürünler getirilemedi." },
      { status: 500 }
    );
  }
}
