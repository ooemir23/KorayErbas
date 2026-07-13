// @vercel/postgres SDK'sı:
//  - `sql` : global pool, tekil sorgu (template literal). process.env'den bağlanır.
//            Aynı zamanda VercelPool olduğu için .connect() ve .query() destekler.
//  - `db`  : sql ile aynı (alias).
// Transaction için `sql.connect()` ile client alıp BEGIN/COMMIT yönetiriz.
import { sql } from "@vercel/postgres";
export { sql };

// ─────────────────────────────────────────────────────────────────────
// Otomatik şema kurulumu (auto-bootstrap).
// İlk deploy'da `db:setup` çalıştırma zahmetini ortadan kaldırır: tablolar
// yoksa ilk istekte kendiliğinden oluşturulur. Şema `scripts/schema.sql`
// ile birebir aynıdır (CREATE TABLE IF NOT EXISTS → idempotent).
//
// MIGRASYON: Tablo zaten eski şemada oluşturulmuşsa (name/unit kolonları),
// yeni kolonları ALTER TABLE ... ADD COLUMN IF NOT EXISTS ile ekler ve
// eski veriyi yeni modele taşır. Tüm adımlar idempotent'tir.
let ensurePromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  // Aynı request içinde paralel çağrılar tek sefer çalışsın.
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        // 1) products tablosu (yeni şema ile)
        await sql`
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            brand TEXT NOT NULL DEFAULT '',
            flavor TEXT NOT NULL DEFAULT '',
            unit_type TEXT NOT NULL DEFAULT 'adet',
            unit_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
            image_url TEXT,
            purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            critical_threshold INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;

        // 2) Eski şemadan migrasyon (kolon yoksa ekle).
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT '';`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS flavor TEXT NOT NULL DEFAULT '';`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type TEXT NOT NULL DEFAULT 'adet';`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_value NUMERIC(12, 2) NOT NULL DEFAULT 0;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS critical_threshold INTEGER NOT NULL DEFAULT 0;`;

        // 3) Eski 'name' verisini yeni kolonlara taşı (bir kerelik, marka boşsa).
        await sql`
          UPDATE products
          SET brand = COALESCE(NULLIF(brand, ''), name)
          WHERE brand = '' AND name IS NOT NULL;
        `;
        // Eski 'unit' (serbest text, örn. "500g") → unit_value numeric değil,
        // olduğu gibi bırakılamaz; unit_value 0 kalır, admin düzenleyebilir.

        // 4) Benzersizlik: marka + aroma + birim kombinasyonu tek olsun.
        await sql`
          CREATE UNIQUE INDEX IF NOT EXISTS uniq_products_brand_flavor_unit
          ON products (brand, flavor, unit_type, unit_value);
        `;

        // 5) orders tablosu
        await sql`
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name  TEXT NOT NULL,
            address    TEXT NOT NULL,
            phone      TEXT NOT NULL,
            note       TEXT,
            items      JSONB NOT NULL DEFAULT '[]'::jsonb,
            total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
            status     TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','cancelled')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(first_name, last_name);`;
      } catch (err) {
        // Başarısız olursa bir sonraki istekte tekrar denesin diye temizle.
        ensurePromise = null;
        throw err;
      }
    })();
  }
  return ensurePromise;
}

