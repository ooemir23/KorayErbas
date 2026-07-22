import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { ReportSummary, ReportPeriod } from "@/lib/types";

// GET /api/admin/reports?period=daily|monthly|yearly
// Sadece 'confirmed' siparişleri sayar. Kâr hesabı için her item'daki
// unit_price (satış) ve purchase_price (maliyet) kullanılır; item'da
// purchase_price yoksa (eski siparişler) products tablosuna LEFT JOIN
// ile ürünün güncel alış fiyatı fallback olarak alınır.
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodRaw = searchParams.get("period") || "monthly";
  const period: ReportPeriod = ["daily", "monthly", "yearly"].includes(
    periodRaw
  )
    ? (periodRaw as ReportPeriod)
    : "monthly";

  // Periyota göre SQL tarih formatı.
  const dateTrunc =
    period === "daily"
      ? "to_char(created_at, 'YYYY-MM-DD')"
      : period === "yearly"
      ? "to_char(created_at, 'YYYY')"
      : "to_char(created_at, 'YYYY-MM')";

  try {
    await ensureSchema();

    // @vercel/postgres template literal parser jsonb_array_elements ile
    // karıştığı için tüm sorguları parameterized client.query() ile yapıyoruz.

    // ── 1) Özet (özet kartları için) ────────────────────────────────
    // orders.items JSONB'sini açıp her item için ciro/maliyet/kâr hesapla.
    const client = await sql.connect();
    let summaryRows;
    let topRows;
    let breakdown;
    let customerRows;
    try {
      summaryRows = await client.query(`
        WITH item_lines AS (
          SELECT
            o.id AS order_id,
            (elem->>'quantity')::numeric AS qty,
            COALESCE((elem->>'unit_price')::numeric, 0) AS sell,
            COALESCE(
              NULLIF(elem->>'purchase_price','')::numeric,
              p.purchase_price,
              0
            ) AS cost
          FROM orders o
          LEFT JOIN LATERAL jsonb_array_elements(o.items) AS elem ON true
          LEFT JOIN products p ON p.id = (elem->>'product_id')::int
          WHERE o.status = 'confirmed'
        )
        SELECT
          COALESCE(SUM(qty * sell), 0)::float8 AS revenue,
          COALESCE(SUM(qty * cost), 0)::float8 AS cost,
          COALESCE(SUM(qty * (sell - cost)), 0)::float8 AS profit,
          COUNT(DISTINCT order_id)::int AS order_count
        FROM item_lines;
      `);

      // ── 2) En çok satılan ürünler (top 10) ─────────────────────────
      topRows = await client.query(`
        SELECT
          NULLIF(elem->>'product_id','')::int AS product_id,
          COALESCE(elem->>'brand','') AS brand,
          COALESCE(elem->>'flavor','') AS flavor,
          SUM((elem->>'quantity')::numeric)::float8 AS quantity,
          SUM((elem->>'quantity')::numeric * COALESCE((elem->>'unit_price')::numeric,0))::float8 AS revenue,
          SUM((elem->>'quantity')::numeric * COALESCE(
            NULLIF(elem->>'purchase_price','')::numeric,
            p.purchase_price,
            0
          ))::float8 AS cost,
          SUM((elem->>'quantity')::numeric *
            (COALESCE((elem->>'unit_price')::numeric,0) -
             COALESCE(
               NULLIF(elem->>'purchase_price','')::numeric,
               p.purchase_price,
               0
             ))
          )::float8 AS profit
        FROM orders o
        CROSS JOIN LATERAL jsonb_array_elements(o.items) AS elem
        LEFT JOIN products p ON p.id = (elem->>'product_id')::int
        WHERE o.status = 'confirmed'
        GROUP BY p.id, COALESCE(elem->>'product_id',''), COALESCE(elem->>'brand',''), COALESCE(elem->>'flavor','')
        ORDER BY quantity DESC
        LIMIT 10;
      `);

      // ── 3) Periyot kırılımı ────────────────────────────────────────
      const dateTrunc =
        period === "daily"
          ? "to_char(created_at, 'YYYY-MM-DD')"
          : period === "yearly"
          ? "to_char(created_at, 'YYYY')"
          : "to_char(created_at, 'YYYY-MM')";
      breakdown = await client.query(`
        SELECT
          ${dateTrunc} AS period,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total_amount), 0)::float8 AS revenue,
          0::float8 AS cost,
          0::float8 AS profit
        FROM orders
        WHERE status = 'confirmed'
        GROUP BY ${dateTrunc}
        ORDER BY period DESC;
      `);

      // ── 4) Müşteri bazlı ciro ─────────────────────────────────────
      customerRows = await client.query(`
        SELECT
          (first_name || ' ' || last_name) AS customer,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total_amount), 0)::float8 AS total
        FROM orders
        WHERE status = 'confirmed'
        GROUP BY (first_name || ' ' || last_name)
        ORDER BY total DESC;
      `);
    } finally {
      client.release();
    }

    const sRow = summaryRows.rows[0] || {};
    const revenue = Number(sRow.revenue) || 0;
    const cost = Number(sRow.cost) || 0;
    const profit = Number(sRow.profit) || 0;
    const orderCount = Number(sRow.order_count) || 0;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

    const summary: ReportSummary = {
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      profitMargin,
      orderCount,
      avgOrder,
    };

    return NextResponse.json({
      summary,
      topProducts: topRows.rows,
      breakdown: breakdown.rows,
      customers: customerRows.rows,
      period,
    });
  } catch (err: any) {
    console.error("[admin reports GET]", err);
    const msg =
      err?.message || (typeof err === "string" ? err : "Rapor getirilemedi.");
    return NextResponse.json(
      { error: `Rapor getirilemedi: ${msg}` },
      { status: 500 }
    );
  }
}
