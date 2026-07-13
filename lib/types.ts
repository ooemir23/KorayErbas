// Uygulama genelinde kullanılan tip tanımları.

export interface Product {
  id: number;
  name: string;
  unit: string; // Gramaj/Hacim, örn. "500g", "1L", "adet"
  image_url: string | null;
  purchase_price: number; // Alış fiyatı (maliyet)
  retail_price: number; // Perakende satış fiyatı
  stock: number; // Stok adedi
  created_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface OrderItem {
  product_id: number;
  product_name: string;
  unit: string;
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
  name: string;
  unit: string;
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
