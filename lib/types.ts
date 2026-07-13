// Uygulama genelinde kullanılan tip tanımları.

// Birim tipleri — gram/kilo/paket/kutu.
// (lib/format.ts'teki UNIT_TYPES ile uyumlu olmalı; ayrı tutmak yerine
// buradan re-export edebiliriz ama döngüsel import riski olmaması için
// bu dosyada tanımlı kalır.)
export type UnitType = "gram" | "kilo" | "paket" | "kutu";

export interface Product {
  id: number;
  brand: string; // Marka, örn. "Çaykur"
  flavor: string; // Aroma/ürün adı, örn. "Rize"
  unit_type: UnitType | string; // gram | kilo | paket | kutu
  unit_value: number; // Miktar, örn. 500 → "500 gram"
  image_url: string | null;
  purchase_price: number; // Alış fiyatı (maliyet)
  retail_price: number; // Perakende satış fiyatı
  stock: number; // Stok adedi
  critical_threshold: number; // Kritik stok eşiği (altına düşerse uyarı)
  created_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface OrderItem {
  product_id: number;
  brand: string;
  flavor: string;
  unit_type: string;
  unit_value: number;
  quantity: number;
  unit_price: number; // Onay anındaki fiyatın kaydı
}

export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  address: string;
  phone: string;
  note: string | null;
  items: OrderItem[]; // JSONB kolonu
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

// Sepet (client-side) için hafif tip
export interface CartItem {
  product_id: number;
  brand: string;
  flavor: string;
  unit_type: string;
  unit_value: number;
  unit_price: number;
  image_url: string | null;
  quantity: number;
}

export interface CustomerRevenue {
  customer: string; // "Ad Soyad"
  order_count: number;
  total: number;
}

export interface MonthlyRevenue {
  month: string; // "2026-07"
  total: number;
}
