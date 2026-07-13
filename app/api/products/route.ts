import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import type { Product } from "@/lib/types";

// GET /api/products → Storefront için SADECE stok > 0 olan ürünler.
//   ?all=1 verilirse (admin) tüm ürünleri döner.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";

  try {
    await ensureSchema();
    const result = all
      ? await sql<Product>`SELECT * FROM products ORDER BY id DESC;`
      : await sql<Product>`SELECT * FROM products WHERE stock > 0 ORDER BY id DESC;`;

    return NextResponse.json({ products: result.rows });
  } catch (err) {
    console.error("[products GET]", err);
    return NextResponse.json(
      { error: "Ürünler getirilemedi." },
      { status: 500 }
    );
  }
}
