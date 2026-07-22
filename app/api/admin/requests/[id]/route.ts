import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import type { RequestStatus } from "@/lib/types";

// PUT /api/admin/requests/:id  { status }
// Status: pending → contacted → closed (geriye de dönüşebilir).
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

  let body: { status?: RequestStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const status = body.status;
  const valid: RequestStatus[] = ["pending", "contacted", "closed"];
  if (!status || !valid.includes(status)) {
    return NextResponse.json(
      { error: "Geçersiz status. pending/contacted/closed olmalı." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    const result = await sql`
      UPDATE requests SET status = ${status}
      WHERE id = ${id}
      RETURNING *;
    `;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ request: result.rows[0] });
  } catch (err) {
    console.error("[admin requests PUT]", err);
    return NextResponse.json(
      { error: "Talep güncellenemedi." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/requests/:id
export async function DELETE(
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

  try {
    await ensureSchema();
    const result = await sql`DELETE FROM requests WHERE id = ${id};`;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin requests DELETE]", err);
    return NextResponse.json({ error: "Talep silinemedi." }, { status: 500 });
  }
}
