import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";

// POST /api/upload  (multipart/form-data: file)
// Görsel client'ta zaten sıkıştırılmış olarak gelir; burada Blob'a koyarız.
export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Dosya bulunamadı (field adı: 'file')." },
      { status: 400 }
    );
  }

  // Kaba doğrulama: tip + boyut
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Yalnızca görsel dosya yüklenebilir." },
      { status: 400 }
    );
  }
  // 8 MB üstü (sıkıştırma atlandıysa) koruması
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Görsel çok büyük (maks. 8 MB)." },
      { status: 400 }
    );
  }

  try {
    const blob = await put(
      `products/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`,
      file,
      {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      }
    );
    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error("[upload] blob hatası:", err);
    // Gerçek hatayı client'a ilet ki teşhis edilebilsin
    // (token eksik/scope yanlış/read-only/store bağlı değil vb.)
    const msg =
      err?.message ||
      (typeof err === "string" ? err : "Görsel yüklenemedi.");
    return NextResponse.json(
      { error: `Görsel yüklenemedi: ${msg}` },
      { status: 500 }
    );
  }
}
