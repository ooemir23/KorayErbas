import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { UNIT_TYPES, type UnitType } from "@/lib/format";

// PUT /api/admin/products/:id  → ürün güncelle
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
    brand?: string;
    flavor?: string;
    unit_type?: string;
    unit_value?: number;
    image_url?: string | null;
    purchase_price?: number;
    retail_price?: number;
    stock?: number;
    critical_threshold?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const brand = body.brand != null ? body.brand.trim() : undefined;
  const flavor = body.flavor != null ? body.flavor.trim() : undefined;
  let unit_type: string | undefined = undefined;
  if (body.unit_type != null) {
    const t = body.unit_type.trim();
    unit_type = UNIT_TYPES.includes(t as UnitType) ? t : "";
    if (unit_type === "") {
      return NextResponse.json(
        { error: "Geçersiz birim tipi." },
        { status: 400 }
      );
    }
  }
  const unit_value =
    body.unit_value != null ? Math.max(0, Number(body.unit_value) || 0) : undefined;
  const image_url = body.image_url; // null olabilir (görseli kaldır)
  const purchase_price =
    body.purchase_price != null ? Number(body.purchase_price) || 0 : undefined;
  const retail_price =
    body.retail_price != null ? Number(body.retail_price) || 0 : undefined;
  const stock =
    body.stock != null ? Math.max(0, Math.floor(Number(body.stock) || 0)) : undefined;
  const critical_threshold =
    body.critical_threshold != null
      ? Math.max(0, Math.floor(Number(body.critical_threshold) || 0))
      : undefined;

  try {
    await ensureSchema();

    // Eğer marka/aroma/birim değişiyorsa benzersizlik kontrolü yap.
    const identityChanging =
      brand !== undefined || flavor !== undefined || unit_type !== undefined || unit_value !== undefined;
    if (identityChanging) {
      const cur = await sql`SELECT brand, flavor, unit_type, unit_value FROM products WHERE id = ${id};`;
      if (cur.rowCount === 0) {
        return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
      }
      const c = cur.rows[0] as {
        brand: string;
        flavor: string;
        unit_type: string;
        unit_value: string;
      };
      const newBrand = brand ?? c.brand;
      const newFlavor = flavor ?? c.flavor;
      const newUnitType = unit_type ?? c.unit_type;
      const newUnitValue = unit_value ?? Number(c.unit_value);

      const dup = await sql`
        SELECT 1 FROM products
        WHERE brand = ${newBrand}
          AND flavor = ${newFlavor}
          AND unit_type = ${newUnitType}
          AND unit_value = ${newUnitValue}
          AND id <> ${id}
        LIMIT 1;
      `;
      if (dup.rowCount && dup.rowCount > 0) {
        return NextResponse.json(
          {
            error: `Bu kombinasyon zaten mevcut: ${newBrand} ${newFlavor} (${newUnitValue} ${newUnitType}).`,
          },
          { status: 409 }
        );
      }
    }

    // image_url: form her zaman bir değer gönderir (null dahil).
    // COALESCE kullanmıyoruz çünkü null "görseli kaldır" anlamında olabilir.
    const result = await sql`
      UPDATE products SET
        brand = COALESCE(${brand ?? null}, brand),
        flavor = COALESCE(${flavor ?? null}, flavor),
        unit_type = COALESCE(${unit_type ?? null}, unit_type),
        unit_value = COALESCE(${unit_value ?? null}, unit_value),
        image_url = ${image_url ?? null},
        purchase_price = COALESCE(${purchase_price ?? null}, purchase_price),
        retail_price = COALESCE(${retail_price ?? null}, retail_price),
        stock = COALESCE(${stock ?? null}, stock),
        critical_threshold = COALESCE(${critical_threshold ?? null}, critical_threshold)
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ product: result.rows[0] });
  } catch (err) {
    console.error("[products PUT]", err);
    return NextResponse.json({ error: "Ürün güncellenemedi." }, { status: 500 });
  }
}

// DELETE /api/admin/products/:id
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
    const result = await sql`DELETE FROM products WHERE id = ${id};`;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[products DELETE]", err);
    return NextResponse.json({ error: "Ürün silinemedi." }, { status: 500 });
  }
}
