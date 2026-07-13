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
let ensurePromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  // Aynı request içinde paralel çağrılar tek sefer çalışsın.
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            unit TEXT NOT NULL DEFAULT '',
            image_url TEXT,
            purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;
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

