-- ════════════════════════════════════════════════════════════════
-- Stok & Sipariş Yönetimi - Veritabanı Şeması
-- Çalıştırma: npm run db:setup
-- ════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',              -- "500g", "1L", "adet" vb.
  image_url TEXT,                             -- Vercel Blob URL
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- Alış (maliyet)
  retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- Perakende satış
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  address    TEXT NOT NULL,
  phone      TEXT NOT NULL,
  note       TEXT,
  items      JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{ product_id, product_name, unit, quantity, unit_price }]
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending'         -- pending | confirmed | cancelled
            CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raporlama ve admin listeleme için indeksler
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(first_name, last_name);

COMMENT ON TABLE products IS 'Ürün katalog & stok';
COMMENT ON TABLE orders  IS 'Perakende siparişler';
