import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type {
  CustomerRevenue,
  ProductSales,
  PeriodBreakdown,
  ReportSummary,
  ReportPeriod,
} from "@/lib/types";

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

    // ── 1) Özet (özet kartları için) ────────────────────────────────
    // orders.items JSONB'sini açıp her item için ciro/maliyet/kâr hesapla.
    const summaryRows = await sql`
      SELECT
        COALESCE(SUM(item_qty * item_sell), 0)::float8 AS revenue,
        COALESCE(SUM(item_qty * item_cost), 0)::float8 AS cost,
        COALESCE(SUM(item_qty * (item_sell - item_cost)), 0)::float8 AS profit,
        COUNT(DISTINCT o.id)::int AS order_count
      FROM orders o,
      LATERAL (
        SELECT
          (i->>'quantity')::numeric AS item_qty,
          COALESCE((i->>'unit_price')::numeric, 0) AS item_sell,
          COALESCE(
            NULLIF(i->>'purchase_price','')::numeric,
            (SELECT purchase_price FROM products WHERE id = (i->>'product_id')::int),
            0
          ) AS item_cost
        FROM jsonb_array_elements(o.items) AS i
      ) items
      WHERE o.status = 'confirmed';
    `;

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

    // ── 2) En çok satılan ürünler (top 10) ──────────────────────────
    const topProducts = await sql<ProductSales>`
      SELECT
        NULLIF(i->>'product_id','')::int AS product_id,
        COALESCE(i->>'brand','') AS brand,
        COALESCE(i->>'flavor','') AS flavor,
        SUM((i->>'quantity')::numeric)::float8 AS quantity,
        SUM((i->>'quantity')::numeric * COALESCE((i->>'unit_price')::numeric,0))::float8 AS revenue,
        SUM((i->>'quantity')::numeric * COALESCE(
          NULLIF(i->>'purchase_price','')::numeric,
          (SELECT purchase_price FROM products WHERE id = (i->>'product_id')::int),
          0
        ))::float8 AS cost,
        SUM((i->>'quantity')::numeric *
          (COALESCE((i->>'unit_price')::numeric,0) -
           COALESCE(
             NULLIF(i->>'purchase_price','')::numeric,
             (SELECT purchase_price FROM products WHERE id = (i->>'product_id')::int),
             0
           ))
        )::float8 AS profit
      FROM orders o, jsonb_array_elements(o.items) AS i
      WHERE o.status = 'confirmed'
      GROUP BY COALESCE(i->>'product_id',''), COALESCE(i->>'brand',''), COALESCE(i->>'flavor','')
      ORDER BY quantity DESC
      LIMIT 10;
    `;

    // ── 3) Periyot kırılımı ─────────────────────────────────────────
    // SQL template string dinamik dateTrunc'i doğrudan yerleştiremediğimiz
    // için parameterized query + connect() kullanıyoruz.
    const client = await sql.connect();
    let breakdown: PeriodBreakdown[] = [];
    try {
      const res = await client.query<PeriodBreakdown>(
        `SELECT
           ${dateTrunc} AS period,
           COUNT(*)::int AS order_count,
           COALESCE(SUM(total_amount), 0)::float8 AS revenue,
           0::float8 AS cost,
           0::float8 AS profit
         FROM orders
         WHERE status = 'confirmed'
         GROUP BY ${dateTrunc}
         ORDER BY period DESC;`
      );
      breakdown = res.rows;
    } finally {
      client.release();
    }

    // ── 4) Müşteri bazlı ciro (mevcut, korundu) ─────────────────────
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

    return NextResponse.json({
      summary,
      topProducts: topProducts.rows,
      breakdown,
      customers: customers.rows,
      period,
    });
  } catch (err) {
    console.error("[admin reports GET]", err);
    return NextResponse.json(
      { error: "Rapor getirilemedi." },
      { status: 500 }
    );
  }
}
