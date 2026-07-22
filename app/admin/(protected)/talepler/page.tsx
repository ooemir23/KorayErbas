"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { ProductRequest, RequestStatus } from "@/lib/types";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatUnit, productLabel } from "@/lib/format";
import { formatDate } from "@/lib/format";

let toastSeq = 0;

type Filter = "all" | RequestStatus;

const STATUS_META: Record<
  RequestStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: "Bekliyor",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  contacted: {
    label: "İletişime Geçildi",
    badge: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  closed: {
    label: "Kapatıldı",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

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
      const res = await fetch("/api/admin/requests", { cache: "no-store" });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      pushToast("Talepler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: number, status: RequestStatus) {
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Güncellenemedi.");
      pushToast("Talep durumu güncellendi.");
      load();
    } catch {
      pushToast("Güncelleme başarısız.", "error");
    }
  }

  async function remove(id: number) {
    if (!confirm("Bu talebi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silinemedi.");
      pushToast("Talep silindi.", "info");
      load();
    } catch {
      pushToast("Silme başarısız.", "error");
    }
  }

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      contacted: requests.filter((r) => r.status === "contacted").length,
      closed: requests.filter((r) => r.status === "closed").length,
    };
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Talepler</h2>
        <p className="text-sm text-slate-500">
          Stokta olmayan ürünler için müşteri talepleri.
        </p>
      </div>

      {/* Filtre sekmeleri */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "all", label: `Tümü (${stats.total})` },
          { id: "pending", label: `Bekleyen (${stats.pending})` },
          { id: "contacted", label: `İletişime Geçilen (${stats.contacted})` },
          { id: "closed", label: `Kapanan (${stats.closed})` },
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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">📢</p>
          <p className="mt-2 font-medium text-slate-700">
            {filter === "all"
              ? "Henüz talep yok."
              : "Bu filtrede talep yok."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const label = productLabel(r) || `#${r.product_id ?? "?"}`;
            const unit = formatUnit(r.unit_type, r.unit_value ? Number(r.unit_value) : null);
            const meta = STATUS_META[r.status];
            return (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Sol: ürün + müşteri */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        {label}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    {unit && (
                      <p className="text-xs text-slate-400">{unit}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>
                        👤 {r.customer_name}
                      </span>
                      <span>
                        📞{" "}
                        <a
                          href={`tel:${r.customer_phone}`}
                          className="text-brand-700 hover:underline"
                        >
                          {r.customer_phone}
                        </a>
                      </span>
                      <span>📦 {r.quantity} adet</span>
                    </div>
                    {r.note && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        💬 {r.note}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDate(r.created_at)}
                    </p>
                  </div>

                  {/* Sağ: aksiyonlar */}
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {r.status !== "contacted" && (
                      <button
                        onClick={() => updateStatus(r.id, "contacted")}
                        className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                      >
                        İletişime Geçildi
                      </button>
                    )}
                    {r.status !== "closed" && (
                      <button
                        onClick={() => updateStatus(r.id, "closed")}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Kapat
                      </button>
                    )}
                    {r.status !== "pending" && (
                      <button
                        onClick={() => updateStatus(r.id, "pending")}
                        className="rounded-md border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Bekleyene Al
                      </button>
                    )}
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
