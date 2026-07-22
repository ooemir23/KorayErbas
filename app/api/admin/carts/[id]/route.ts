import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// DELETE /api/admin/carts/:id
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
    const result = await sql`DELETE FROM carts WHERE id = ${id};`;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Sepet bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin carts DELETE]", err);
    return NextResponse.json({ error: "Sepet silinemedi." }, { status: 500 });
  }
}
