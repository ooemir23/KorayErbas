import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { OrderItem } from "@/lib/types";

// PUT /api/admin/orders/:id
// Body seçenekleri:
//   { action: "edit", items, total_amount }      → siparişi düzenle
//   { action: "confirm", items?, total_amount? } → onayla + stok düş
//   { action: "cancel" }                          → iptal et (onaylıysa stok iade)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Geçersiz id." }, { status: 400 });
  }

  let body: {
    action?: "confirm" | "cancel" | "edit";
    items?: OrderItem[];
    total_amount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const client = await sql.connect();
  try {
    await ensureSchema();
    await client.query("BEGIN");

    // Siparişi kilitle (FOR UPDATE) — eşzamanlı onayı engeller.
    const orderRes = await client.query(
      `SELECT status, items FROM orders WHERE id = $1 FOR UPDATE;`,
      [id]
    );
    if (orderRes.rowCount === 0) {
      throw new HttpError(404, "Sipariş bulunamadı.");
    }
    const currentStatus: string = orderRes.rows[0].status;
    const currentItems: OrderItem[] = orderRes.rows[0].items;

    // ── Düzenle (items / total) ──────────────────────────────────────
    if (body.action === "edit" || (body.items && body.action !== "confirm")) {
      if (!Array.isArray(body.items) || body.total_amount == null) {
        throw new HttpError(400, "items ve total_amount gerekli.");
      }
      await client.query(
        `UPDATE orders SET items = $1, total_amount = $2 WHERE id = $3;`,
        [JSON.stringify(body.items), body.total_amount, id]
      );
    }

    // ── Onayla + stok düş ────────────────────────────────────────────
    if (body.action === "confirm") {
      if (currentStatus !== "pending") {
        throw new HttpError(
          400,
          "Yalnızca beklemedeki siparişler onaylanabilir."
        );
      }
      const itemsToConfirm = body.items ?? currentItems;

      for (const it of itemsToConfirm) {
        const r = await client.query(
          `UPDATE products
             SET stock = stock - $1
           WHERE id = $2 AND stock >= $1
           RETURNING stock;`,
          [it.quantity, it.product_id]
        );
        if (r.rowCount === 0) {
          throw new HttpError(
            400,
            `Yetersiz stok: ${it.product_name} (istenilen ${it.quantity}).`
          );
        }
      }

      const total =
        body.total_amount != null
          ? body.total_amount
          : sumTotal(itemsToConfirm);
      await client.query(
        `UPDATE orders
           SET status = 'confirmed',
               items = $1,
               total_amount = $2
         WHERE id = $3;`,
        [JSON.stringify(itemsToConfirm), total, id]
      );
    }

    // ── İptal et ─────────────────────────────────────────────────────
    if (body.action === "cancel") {
      if (currentStatus === "cancelled") {
        throw new HttpError(400, "Sipariş zaten iptal edilmiş.");
      }
      if (currentStatus === "confirmed") {
        for (const it of currentItems) {
          await client.query(
            `UPDATE products SET stock = stock + $1 WHERE id = $2;`,
            [it.quantity, it.product_id]
          );
        }
      }
      await client.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1;`, [
        id,
      ]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin orders PUT]", err);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  } finally {
    client.release();
  }
}

function sumTotal(items: OrderItem[]): number {
  return items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
