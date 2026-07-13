# Stok Takip & Perakende Sipariş Yönetimi

Maliyeti sıfır olan, **Next.js + Vercel Postgres + Vercel Blob** stack'i ile geliştirilmiş
küçük ölçekli (10–15 aktif kullanıcı) stok ve perakende sipariş yönetim uygulaması.

## ✨ Özellikler

- 🛍️ **Storefront (Müşteri):** Stokta olmayan ürünler gizlenir, sepet yönetimi, sipariş formu,
  WhatsApp ile sipariş paylaşımı.
- 🧑‍💼 **Admin Paneli:** Ürün yönetimi, sipariş takibi, sipariş düzenleme, onayda otomatik stok düşüşü.
- 📊 **Raporlama:** Müşteri bazlı ciro + aylık gelir istatistikleri.
- 🖼️ **Görsel Sıkıştırma:** Görsel, tarayıcıda (800×800 / WebP) sıkıştırılıp Vercel Blob'a yüklenir.

## 🧱 Teknoloji

| Katman | Teknoloji |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Stil | Tailwind CSS |
| Veritabanı | Vercel Postgres |
| Görsel Depolama | Vercel Blob |
| Görsel Sıkıştırma | `browser-image-compression` (client-side) |
| Auth | `jose` (JWT, çerez tabanlı) |

## 📁 Klasör Mimarisi

```
.
├── app/
│   ├── (storefront)/        # Müşteri sayfaları (/, sepet, checkout)
│   ├── admin/               # Yönetici paneli (login, ürünler, siparişler, rapor)
│   ├── api/                 # API rotaları (upload, products, orders)
│   │   ├── upload/          # Vercel Blob yükleme (sunucu tarafı)
│   │   ├── products/        # Ürün CRUD
│   │   ├── orders/          # Sipariş oluşturma & yönetimi
│   │   └── auth/            # Admin giriş/çıkış
│   ├── layout.tsx
│   └── globals.css
├── components/              # Yeniden kullanılabilir UI bileşenleri
├── lib/                     # DB, auth, tip tanımları, yardımcılar
├── scripts/                 # DB şema kurulumu
├── .env.local.example
└── ...
```

## 🚀 Kurulum

### 1. Bağımlılıklar
```bash
npm install
```

### 2. Ortam değişkenleri
`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve Vercel dashboard'dan
aldığınız değerleri girin:

```bash
cp .env.local.example .env.local
```

Gerekli Vercel kaynakları (dashboard > Storage sekmesi):
- **Postgres database** oluştur → otomatik env'ler doldurulur.
- **Blob store** oluştur → `BLOB_READ_WRITE_TOKEN`'ı kopyala.

### 3. Veritabanı şeması
```bash
npm run db:setup
```

### 4. Geliştirme
```bash
npm run dev
```

Uygulama: http://localhost:3000
Admin giriş: http://localhost:3000/admin/login (şifre: `.env.local` → `ADMIN_PASSWORD`)

## 🔒 Güvenlik Notları

- Blob token ve DB kimlik bilgileri yalnızca sunucuda (API rotaları / Server Actions) kullanılır.
- Admin paneli, JWT çerezi ile korunur. **Üretime almadan önce `ADMIN_PASSWORD` ve `AUTH_SECRET`'ı güçlü değerlerle değiştirin.**
- Bu proje tek-admin modelini varsayar. Çok kullanıcılı admin gerekiyorsa `users` tablosu eklenmelidir.

## 📦 Deploy (Vercel)

1. Repo'yu GitHub'a push'layın.
2. Vercel'de "New Project" ile import edin.
3. Vercel dashboard'da Storage > Postgres ve Blob oluşturup projeye bağlayın (env'ler otomatik enjekte edilir).
4. Deploy sonrası **Vercel'in sağladığı "Run Command"** yerine terminalde `db:setup`'ı Vercel Postgres'e bağlanıp bir kez çalıştırın (veya bir geçici sayfa ekleyip çağırın).
```
npm run db:setup
```

> Hobby plan limitleri: Postgres 256 MB veri + 60 compute-saat/ay; Blob 1 GB storage +
> 10 GB bandwidth/ay; Bandwidth bol. 10–15 kullanıcı için rahat yeter.
