import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import type { Product } from "@/lib/types";

// GET /api/products → Storefront için SADECE stok > 0 olan ürünler.
//   ?all=1 verilirse (admin) tüm ürünleri döner.
//   ?q=... verilirse marka/aroma/birim'de arama yapar.
//   ?brand=... verilirse sadece belirli markayı döner.
//   ?brands=1 verilirse ürünleri değil, DISTINCT marka listesi döner
//      (admin formundaki datalist/otomatik tamamlama için).
//
// Arama büyük-küçük harf duyarsızdır, ILIKE ile yapılır.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const q = searchParams.get("q")?.trim() || "";
  const brand = searchParams.get("brand")?.trim() || "";
  const onlyBrands = searchParams.get("brands") === "1";

  try {
    await ensureSchema();

    // Sadece benzersiz marka listesi (admin formu için).
    // Stok 0 olan ürünlerin markaları da dahil edilir (admin ?all=1 gibi).
    if (onlyBrands) {
      const res = await sql<{ brand: string }>`
        SELECT DISTINCT brand FROM products
        WHERE brand <> ''
        ORDER BY brand ASC;
      `;
      const brands = res.rows.map((r) => r.brand);
      return NextResponse.json({ brands });
    }

    // Arama/filtre yoksa basit sorgu.
    // Storefront (all yok) artık TÜM ürünleri döner (stok 0 dahil) —
    // out-of-stock ürünler kartta "Talepte Bulun" ile görünür.
    // Sıralama: önce stokta olanlar, sonra tükenenler.
    if (!q && !brand) {
      const result = all
        ? await sql<Product>`SELECT * FROM products ORDER BY brand, flavor, id DESC;`
        : await sql<Product>`SELECT * FROM products ORDER BY (stock > 0) DESC, brand, flavor, id DESC;`;
      return NextResponse.json({ products: result.rows });
    }

    // Arama veya marka filtresi varsa dinamik sorgu.
    // Storefront (all yok) TÜM ürünleri döner (stok 0 dahil).
    const conditions: string[] = [];
    const values: unknown[] = [];

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
