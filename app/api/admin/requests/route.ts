import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { ProductRequest, RequestStatus } from "@/lib/types";

// GET /api/admin/requests?status=pending|contacted|closed|all
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const valid = ["all", "pending", "contacted", "closed"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Geçersiz status." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result =
      status === "all"
        ? await sql<ProductRequest>`SELECT * FROM requests ORDER BY created_at DESC;`
        : await sql<ProductRequest>`
            SELECT * FROM requests WHERE status = ${status}
            ORDER BY created_at DESC;`;

    return NextResponse.json({ requests: result.rows });
  } catch (err) {
    console.error("[admin requests GET]", err);
    return NextResponse.json(
      { error: "Talepler getirilemedi." },
      { status: 500 }
    );
  }
}
