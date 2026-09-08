"use client";

import Link from "next/link";
import type { CartItem } from "@/lib/types";
import { formatTRY, formatUnit, productLabel } from "@/lib/format";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
}

// Ekranın sağından kayarak açılan sepet çekmecesi.
// Ürün sepete eklendiğinde otomatik açılır; header'daki sepete de bağlanabilir.
export function CartDrawer({
  open,
  onClose,
  items,
  subtotal,
  setQuantity,
  removeItem,
}: CartDrawerProps) {
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className={
        "fixed inset-0 z-50 " + (open ? "" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      {/* Karartma — sadece mobilde (masaüstünde sepet sabit panel olarak kalır) */}
      <div
        onClick={onClose}
        className={
          "absolute inset-0 bg-black/40 transition-opacity duration-200 lg:hidden " +
          (open ? "opacity-100" : "opacity-0")
        }
      />

      {/* Çekmece */}
      <aside
        className={
          "absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        role="dialog"
        aria-label="Sepetim"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-bold text-slate-900">
            🛒 Sepetim
            {count > 0 && (
              <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            aria-label="Sepeti kapat"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Ürün listesi */}
        <div className="flex-1 overflow-y-auto p-4 scroll-thin">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-4xl">🛒</p>
              <p className="mt-2 font-medium text-slate-600">Sepetiniz boş</p>
              <p className="mt-1 text-sm text-slate-400">
                Ürün eklediğinizde burada görünecek.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const unit = formatUnit(item.unit_type, item.unit_value);
                return (
                  <li
                    key={item.product_id}
                    className="flex gap-3 rounded-xl border border-slate-200 p-2"
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={productLabel(item) || `#${item.product_id}`}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-300">
                        📦
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {productLabel(item) || `#${item.product_id}`}
                      </p>
                      {unit && (
                        <p className="text-xs text-slate-400">{unit}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        {formatTRY(item.unit_price)} x {item.quantity} ={" "}
                        <span className="font-semibold text-slate-800">
                          {formatTRY(item.unit_price * item.quantity)}
                        </span>
                      </p>

                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-md border border-slate-200">
                          <button
                            onClick={() =>
                              setQuantity(item.product_id, item.quantity - 1)
                            }
                            aria-label="Adet azalt"
                            className="px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-medium tabular-nums text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              setQuantity(item.product_id, item.quantity + 1)
                            }
                            aria-label="Adet artır"
                            className="px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Kaldır
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Alt bar: toplam + sepete git */}
        {items.length > 0 && (
          <div className="space-y-2 border-t border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Ara Toplam</span>
              <span className="text-lg font-bold text-slate-900">
                {formatTRY(subtotal)}
              </span>
            </div>
            <Link
              href="/sepet"
              onClick={onClose}
              className="block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Sepete Git ve Siparişi Tamamla →
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
