"use client";

import { useEffect, useState, useCallback } from "react";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatTRY, formatDate, formatUnit, productLabel } from "@/lib/format";

let toastSeq = 0;

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "Beklemede", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Onaylandı", cls: "bg-brand-100 text-brand-700" },
  cancelled: { label: "İptal", cls: "bg-red-100 text-red-700" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

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
      const res = await fetch(`/api/admin/orders?status=${filter}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      pushToast("Siparişler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateOrder(
    id: number,
    body: { action: "confirm" | "cancel" | "edit"; items?: OrderItem[]; total_amount?: number }
  ) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız.");
      pushToast(
        body.action === "confirm"
          ? "Sipariş onaylandı, stok düşüldü."
          : body.action === "cancel"
          ? "Sipariş iptal edildi."
          : "Sipariş güncellendi."
      );
      setSelected(null);
      load();
    } catch (e: any) {
      pushToast(e.message || "İşlem başarısız.", "error");
    }
  }

  // Siparişi DB'den tamamen siler (hard delete). Modal'daki onay akışından
  // sonra çağrılır. Stok iade YAPMAZ — kalıcı silme.
  async function deleteOrder(id: number) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi.");
      pushToast(`Sipariş #${id} kalıcı olarak silindi.`, "info");
      setSelected(null);
      load();
    } catch (e: any) {
      pushToast(e.message || "Silme başarısız.", "error");
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Siparişler</h2>
          <p className="text-sm text-slate-500">
            Gelen siparişleri inceleyin, düzenleyin ve onaylayın.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === s
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "Tümü" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-2 font-medium text-slate-700">Sipariş yok.</p>
        </div>
      ) : (
        <>
          {/* Masaüstü: tablo */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">#{o.id}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {o.first_name} {o.last_name}
                      <div className="text-xs text-slate-400">{o.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatTRY(o.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[o.status].cls}`}
                      >
                        {STATUS_META[o.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(o)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Detay / Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil: kart listesi */}
          <div className="space-y-2 sm:hidden">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left active:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">#{o.id}</span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[o.status].cls}`}
                  >
                    {STATUS_META[o.status].label}
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  {o.first_name} {o.last_name}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatTRY(o.total_amount)}</span>
                  <span>{formatDate(o.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateOrder}
          onDelete={deleteOrder}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sipariş detay / düzenleme modalı
function OrderDetailModal({
  order,
  onClose,
  onUpdate,
  onDelete,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: (
    id: number,
    body: {
      action: "confirm" | "cancel" | "edit";
      items?: OrderItem[];
      total_amount?: number;
    }
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [items, setItems] = useState<OrderItem[]>(
    order.items.map((it) => ({ ...it }))
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const total = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);

  function setQty(i: number, q: number) {
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === i ? { ...it, quantity: Math.max(1, q) } : it
      )
    );
  }
  function setPrice(i: number, p: number) {
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === i ? { ...it, unit_price: Math.max(0, p) } : it
      )
    );
  }

  async function act(action: "confirm" | "cancel" | "edit") {
    setSaving(true);
    await onUpdate(order.id, { action, items, total_amount: total });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto scroll-thin rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sipariş #{order.id}</h3>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[order.status].cls}`}
            >
              {STATUS_META[order.status].label}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Müşteri bilgileri */}
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-500">Müşteri:</span>{" "}
              <span className="font-medium text-slate-900">
                {order.first_name} {order.last_name}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Telefon:</span>{" "}
              <span className="font-medium text-slate-900">{order.phone}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">Adres:</span>{" "}
              <span className="font-medium text-slate-900">{order.address}</span>
            </div>
            {order.note && (
              <div className="sm:col-span-2">
                <span className="text-slate-500">Not:</span>{" "}
                <span className="text-slate-900">{order.note}</span>
              </div>
            )}
          </div>

          {/* Düzenlenebilir ürün listesi */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
              Ürünler (düzenlenebilir)
            </h4>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm"
                >
                  <div className="col-span-5">
                    <p className="font-medium text-slate-900">
                      {productLabel(it) || `#${it.product_id}`}
                    </p>
                    {(() => {
                      const u = formatUnit(it.unit_type, it.unit_value);
                      return u ? (
                        <p className="text-xs text-slate-400">{u}</p>
                      ) : null;
                    })()}
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-slate-400">Adet</label>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => setQty(i, Number(e.target.value))}
                      className="w-full rounded border border-slate-200 px-2 py-1"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs text-slate-400">
                      Birim Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unit_price}
                      onChange={(e) => setPrice(i, Number(e.target.value))}
                      className="w-full rounded border border-slate-200 px-2 py-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toplam */}
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
            <span className="font-medium text-brand-700">Toplam Tutar</span>
            <span className="text-lg font-bold text-brand-700">
              {formatTRY(total)}
            </span>
          </div>

          {/* Aksiyon butonları */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => act("edit")}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Değişiklikleri Kaydet
            </button>
            {order.status === "pending" && (
              <button
                onClick={() => act("confirm")}
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                ✓ Siparişi Onayla (Stok Düş)
              </button>
            )}
            {order.status !== "cancelled" && (
              <button
                onClick={() => act("cancel")}
                disabled={saving}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                İptal Et
              </button>
            )}
          </div>

          {/* Tehlikeli bölge — kalıcı silme */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
            <p className="mb-2 text-xs text-red-700">
              ⚠️ Kalıcı Silme: Siparişi veritabanından tamamen kaldırır
              (geri alınamaz). Stok iade edilmez. Önce &quot;İptal Et&quot;
              yaparak stok iadesi önerilir.
            </p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                🗑 Siparişi Komple Sil
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-red-700">
                  Emin misiniz?
                </span>
                <button
                  onClick={async () => {
                    setSaving(true);
                    await onDelete(order.id);
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Siliniyor…" : "Evet, Kalıcı Olarak Sil"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>
              </div>
            )}
          </div>
          {order.status !== "pending" && (
            <p className="text-xs text-slate-400">
              * Sadece beklemedeki siparişler onaylanabilir. Düzenleme (adet/fiyat)
              her zaman kaydedilebilir.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
