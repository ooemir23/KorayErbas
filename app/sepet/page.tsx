"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StorefrontHeader } from "@/components/StorefrontHeader";
import { ToastContainer, type Toast } from "@/components/Toast";
import { useCart } from "@/lib/useCart";
import { formatTRY, formatUnit, productLabel } from "@/lib/format";

let toastSeq = 0;

export default function CartPage() {
  const cart = useCart();
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(message: string, type: Toast["type"] = "success") {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Hydrasyon tamamlanana dek boş göster (flicker önlemek için).
  if (!cart.hydrated) {
    return (
      <div className="min-h-screen">
        <StorefrontHeader cartCount={0} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StorefrontHeader cartCount={cart.count} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Sepetim</h1>

        {cart.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">🛒</p>
            <p className="mt-2 font-medium text-slate-700">
              Sepetiniz boş.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ürünlere Dön
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ürün listesi */}
            <div className="space-y-3 lg:col-span-2">
              {cart.items.map((item) => {
                const label = productLabel(item) || `#${item.product_id}`;
                const unit = formatUnit(item.unit_type, item.unit_value);
                return (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl text-slate-300">
                          📦
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {label}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatTRY(item.unit_price)} {unit && `/ ${unit}`}
                      </p>
                    </div>

                    {/* Adet kontrol */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            cart.setQuantity(item.product_id, item.quantity - 1)
                          }
                          className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          aria-label="Azalt"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            cart.setQuantity(item.product_id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Artır"
                          title={
                            item.quantity >= item.stock
                              ? `Maksimum stok (${item.stock})`
                              : "Artır"
                          }
                        >
                          +
                        </button>
                      </div>
                      {item.quantity >= item.stock && (
                        <span className="text-[10px] text-amber-600">
                          Maks. stok
                        </span>
                      )}
                    </div>

                    <div className="w-24 text-right font-semibold text-slate-900">
                      {formatTRY(item.unit_price * item.quantity)}
                    </div>

                    <button
                      onClick={() => {
                        cart.removeItem(item.product_id);
                        pushToast(`${label} sepetten çıkarıldı.`, "info");
                      }}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Kaldır"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Özet */}
            <aside className="lg:col-span-1">
              <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-900">Sipariş Özeti</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Ürün adedi</span>
                    <span>{cart.count}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                    <span>Toplam</span>
                    <span>{formatTRY(cart.subtotal)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-4 block w-full rounded-lg bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Siparişi Tamamla →
                </Link>
                <button
                  onClick={() => {
                    cart.clear();
                    pushToast("Sepet temizlendi.", "info");
                  }}
                  className="mt-2 block w-full rounded-lg px-4 py-2 text-center text-sm text-slate-500 hover:text-slate-800"
                >
                  Sepeti Temizle
                </button>
                <Link
                  href="/"
                  className="mt-2 block w-full rounded-lg px-4 py-2 text-center text-sm text-slate-500 hover:text-slate-800"
                >
                  Alışverişe Devam Et
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
