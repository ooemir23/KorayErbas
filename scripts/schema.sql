-- ════════════════════════════════════════════════════════════════
-- Stok & Sipariş Yönetimi - Veritabanı Şeması
-- Çalıştırma: npm run db:setup
-- ════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL DEFAULT '',                      -- Marka, örn. "Çaykur"
  flavor TEXT NOT NULL DEFAULT '',                     -- Aroma/ürün adı, örn. "Rize"
  unit_type TEXT NOT NULL DEFAULT 'adet',              -- gram | kilo | paket | kutu
  unit_value NUMERIC(12, 2) NOT NULL DEFAULT 0,        -- Miktar, örn. 500 → "500 gram"
  image_url TEXT,                                      -- Vercel Blob URL
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,    -- Alış (maliyet)
  retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,      -- Perakende satış
  stock INTEGER NOT NULL DEFAULT 0,
  critical_threshold INTEGER NOT NULL DEFAULT 0,       -- Kritik stok eşiği
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aynı marka + aroma + birim kombinasyonu tekrar edemesin.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_products_brand_flavor_unit
  ON products (brand, flavor, unit_type, unit_value);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  address    TEXT NOT NULL,
  phone      TEXT NOT NULL,
  note       TEXT,
  items      JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{ product_id, brand, flavor, unit_type, unit_value, quantity, unit_price }]
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending'         -- pending | confirmed | cancelled
            CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raporlama ve admin listeleme için indeksler
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(first_name, last_name);

COMMENT ON TABLE products IS 'Ürün katalog & stok (marka + aroma + birim)';
COMMENT ON TABLE orders  IS 'Perakende siparişler';
