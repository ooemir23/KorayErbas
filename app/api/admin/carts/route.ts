import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { Cart } from "@/lib/types";

// GET /api/admin/carts?status=active|abandoned|converted|all
// Listeleme anında 10 saatten eski active sepetleri otomatik 'abandoned' yapar.
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const valid = ["all", "active", "abandoned", "converted"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Geçersiz status." }, { status: 400 });
  }

  try {
    await ensureSchema();

    // Otomatik abandoned işaretleme: 10 saatten eski active'leri güncelle.
    await sql`
      UPDATE carts SET status = 'abandoned'
      WHERE status = 'active'
        AND updated_at < NOW() - INTERVAL '10 hours';
    `;

    const result =
      status === "all"
        ? await sql<Cart>`
            SELECT * FROM carts
            ORDER BY updated_at DESC;
          `
        : await sql<Cart>`
            SELECT * FROM carts WHERE status = ${status}
            ORDER BY updated_at DESC;
          `;

    return NextResponse.json({ carts: result.rows });
  } catch (err) {
    console.error("[admin carts GET]", err);
    return NextResponse.json(
      { error: "Sepetler getirilemedi." },
      { status: 500 }
    );
  }
}
