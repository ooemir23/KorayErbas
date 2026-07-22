"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Cart, CartStatus, CartItem } from "@/lib/types";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatTRY, formatDate, formatUnit, productLabel } from "@/lib/format";

let toastSeq = 0;

type Filter = "all" | CartStatus;

const STATUS_META: Record<
  CartStatus,
  { label: string; badge: string }
> = {
  active: {
    label: "Aktif",
    badge: "bg-blue-50 text-blue-700",
  },
  abandoned: {
    label: "Terk Edilen",
    badge: "bg-amber-50 text-amber-700",
  },
  converted: {
    label: "Sipariş Oldu",
    badge: "bg-green-50 text-green-700",
  },
};

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<Filter>("abandoned");
  const [selected, setSelected] = useState<Cart | null>(null);

  const pushToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = ++toastSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );
  const dismissToast = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/carts?status=${filter}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setCarts(data.carts || []);
    } catch {
      pushToast("Sepetler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm("Bu sepeti silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/carts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi.");
      pushToast("Sepet silindi.", "info");
      setSelected(null);
      load();
    } catch {
      pushToast("Silme başarısız.", "error");
    }
  }

  const stats = useMemo(() => {
    return {
      total: carts.length,
      active: carts.filter((c) => c.status === "active").length,
      abandoned: carts.filter((c) => c.status === "abandoned").length,
      converted: carts.filter((c) => c.status === "converted").length,
    };
  }, [carts]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Terk Sepetler</h2>
        <p className="text-sm text-slate-500">
          Checkout&apos;a ulaşan ama 10 saatte siparişe dönüşmeyen sepetler.
        </p>
      </div>

      {/* Filtre sekmeleri */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "abandoned", label: `Terk Edilen (${stats.abandoned})` },
          { id: "active", label: `Aktif (${stats.active})` },
          { id: "converted", label: `Sipariş Oldu (${stats.converted})` },
          { id: "all", label: `Tümü (${stats.total})` },
        ] as { id: Filter; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={
              "rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (filter === t.id
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : carts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">🛒</p>
          <p className="mt-2 font-medium text-slate-700">
            Bu filtrede sepet yok.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {carts.map((c) => {
            const meta = STATUS_META[c.status];
            const itemCount = Array.isArray(c.items)
              ? c.items.reduce((s, i) => s + i.quantity, 0)
              : 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {c.customer_name || "Anonim Müşteri"}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                    <span>📦 {itemCount} ürün</span>
                    <span className="font-medium text-slate-700">
                      {formatTRY(Number(c.total_amount))}
                    </span>
                    {c.customer_phone && (
                      <span>📞 {c.customer_phone}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatDate(c.updated_at)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-brand-700">
                  Detay →
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <CartDetailModal
          cart={selected}
          onClose={() => setSelected(null)}
          onDelete={remove}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function CartDetailModal({
  cart,
  onClose,
  onDelete,
}: {
  cart: Cart;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  const meta = STATUS_META[cart.status];
  const items: CartItem[] = Array.isArray(cart.items) ? cart.items : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-thin rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Sepet Detayı</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Durum + müşteri */}
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
              >
                {meta.label}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-slate-700">
                <span className="text-slate-400">Müşteri:</span>{" "}
                {cart.customer_name || "Anonim"}
              </p>
              {cart.customer_phone && (
                <p className="text-slate-700">
                  <span className="text-slate-400">Telefon:</span>{" "}
                  <a
                    href={`tel:${cart.customer_phone}`}
                    className="text-brand-700 hover:underline"
                  >
                    {cart.customer_phone}
                  </a>
                </p>
              )}
              <p className="text-xs text-slate-400">
                Güncelleme: {formatDate(cart.updated_at)}
              </p>
            </div>
          </div>

          {/* Ürünler */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
              Sepetteki Ürünler
            </h4>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-slate-400">Sepet boş.</p>
              ) : (
                items.map((it, i) => {
                  const label = productLabel(it) || `#${it.product_id}`;
                  const unit = formatUnit(it.unit_type, it.unit_value);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {label}
                        </p>
                        {unit && (
                          <p className="text-xs text-slate-400">{unit}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-slate-600">
                          {it.quantity} × {formatTRY(it.unit_price)}
                        </p>
                        <p className="font-medium text-slate-900">
                          {formatTRY(it.unit_price * it.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Toplam */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="font-semibold text-slate-900">Toplam</span>
            <span className="text-lg font-bold text-brand-700">
              {formatTRY(Number(cart.total_amount))}
            </span>
          </div>

          {/* Aksiyonlar */}
          <div className="flex gap-2 border-t border-slate-200 pt-4">
            {cart.customer_phone && (
              <a
                href={`tel:${cart.customer_phone}`}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                📞 Müşteriyi Ara
              </a>
            )}
            <button
              onClick={() => onDelete(cart.id)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Sil
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
