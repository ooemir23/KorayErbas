import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { CustomerRevenue, MonthlyRevenue } from "@/lib/types";

// GET /api/admin/reports
// Müşteri bazlı ciro (sadece confirmed) + aylık gelir.
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    // Müşteri bazlı ciro (yalnızca onaylı siparişler)
    const customers = await sql<CustomerRevenue>`
      SELECT
        (first_name || ' ' || last_name) AS customer,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(total_amount), 0)::float8 AS total
      FROM orders
      WHERE status = 'confirmed'
      GROUP BY (first_name || ' ' || last_name)
      ORDER BY total DESC;
    `;

    // Aylık gelir (yalnızca onaylı)
    const monthly = await sql<MonthlyRevenue>`
      SELECT
        to_char(created_at, 'YYYY-MM') AS month,
        COALESCE(SUM(total_amount), 0)::float8 AS total
      FROM orders
      WHERE status = 'confirmed'
      GROUP BY to_char(created_at, 'YYYY-MM')
      ORDER BY month DESC;
    `;

    const totalRevenue = customers.rows.reduce((s, c) => s + c.total, 0);

    return NextResponse.json({
      customers: customers.rows,
      monthly: monthly.rows,
      totalRevenue,
    });
  } catch (err) {
    console.error("[admin reports GET]", err);
    return NextResponse.json(
      { error: "Rapor getirilemedi." },
      { status: 500 }
    );
  }
}
