import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { Order } from "@/lib/types";

// GET /api/admin/orders?status=pending|confirmed|cancelled|all
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const valid = ["all", "pending", "confirmed", "cancelled"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Geçersiz status." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result =
      status === "all"
        ? await sql<Order>`SELECT * FROM orders ORDER BY created_at DESC;`
        : await sql<Order>`
            SELECT * FROM orders WHERE status = ${status}
            ORDER BY created_at DESC;`;

    return NextResponse.json({ orders: result.rows });
  } catch (err) {
    console.error("[admin orders GET]", err);
    return NextResponse.json(
      { error: "Siparişler getirilemedi." },
      { status: 500 }
    );
  }
}
