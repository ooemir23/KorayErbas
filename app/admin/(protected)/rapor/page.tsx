"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  ReportData,
  ReportPeriod,
  ProductSales,
} from "@/lib/types";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatTRY, formatDate, formatMonth } from "@/lib/format";

let toastSeq = 0;

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: "daily", label: "Günlük" },
  { id: "monthly", label: "Aylık" },
  { id: "yearly", label: "Yıllık" },
];

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
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

  const load = useCallback(
    async (p: ReportPeriod) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/reports?period=${p}`, {
          cache: "no-store",
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Rapor yüklenemedi.");
        setData(d);
      } catch (e: any) {
        pushToast(e.message || "Rapor yüklenemedi.", "error");
      } finally {
        setLoading(false);
      }
    },
    [pushToast]
  );

  useEffect(() => {
    load(period);
  }, [period, load]);

  const s = data?.summary;
  const hasData = (s?.orderCount ?? 0) > 0;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Raporlar</h2>
        <p className="text-sm text-slate-500">
          Onaylı siparişlere göre ciro, maliyet ve kâr analizi.
        </p>
      </div>

      {/* Periyot seçici */}
      <div className="mb-5 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition " +
              (period === p.id
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">📊</p>
          <p className="mt-2 font-medium text-slate-700">
            Henüz onaylı sipariş yok.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Sipariş onayladıkça raporlar burada görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Özet kartları */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Toplam Ciro"
              value={formatTRY(s!.totalRevenue)}
              icon="💰"
              tone="brand"
            />
            <StatCard
              label="Toplam Maliyet"
              value={formatTRY(s!.totalCost)}
              icon="📤"
              tone="slate"
            />
            <StatCard
              label="Toplam Kâr"
              value={formatTRY(s!.totalProfit)}
              sub={`%${s!.profitMargin.toFixed(1)} marj`}
              icon="📈"
              tone="green"
            />
            <StatCard
              label="Sipariş Sayısı"
              value={String(s!.orderCount)}
              sub={`Ort: ${formatTRY(s!.avgOrder)}`}
              icon="📦"
              tone="slate"
            />
          </div>

          {/* En çok satılan ürünler */}
          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              🔥 En Çok Satan Ürünler
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ürün</th>
                    <th className="px-4 py-3 text-right font-medium">Adet</th>
                    <th className="px-4 py-3 text-right font-medium">Ciro</th>
                    <th className="px-4 py-3 text-right font-medium">Kâr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Veri yok.
                      </td>
                    </tr>
                  ) : (
                    data.topProducts.map((p, i) => (
                      <ProductRow key={i} p={p} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Periyot kırılımı */}
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                📅 {periodLabel(period)} Kırılım
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Periyot</th>
                      <th className="px-4 py-3 text-right font-medium">Sipariş</th>
                      <th className="px-4 py-3 text-right font-medium">Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.breakdown.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                          Veri yok.
                        </td>
                      </tr>
                    ) : (
                      data.breakdown.map((b) => (
                        <tr key={b.period} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {periodValueLabel(b.period, period)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {b.order_count}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-brand-700">
                            {formatTRY(b.revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Müşteri bazlı ciro */}
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-900">
                👥 Müşteri Bazlı Ciro
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Müşteri</th>
                      <th className="px-4 py-3 text-right font-medium">Sipariş</th>
                      <th className="px-4 py-3 text-right font-medium">Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.customers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                          Veri yok.
                        </td>
                      </tr>
                    ) : (
                      data.customers.map((c) => (
                        <tr key={c.customer} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {c.customer}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {c.order_count}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-brand-700">
                            {formatTRY(c.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  tone: "brand" | "green" | "slate";
}) {
  const tones: Record<"brand" | "green" | "slate", string> = {
    brand: "bg-brand-50",
    green: "bg-green-50",
    slate: "bg-slate-100",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${tones[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function ProductRow({ p }: { p: ProductSales }) {
  const label = `${p.brand} ${p.flavor}`.trim() || `#${p.product_id}`;
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-medium text-slate-900">{label}</td>
      <td className="px-4 py-3 text-right text-slate-600">
        {Number(p.quantity)}
      </td>
      <td className="px-4 py-3 text-right font-medium text-slate-900">
        {formatTRY(Number(p.revenue))}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-green-600">
        {formatTRY(Number(p.profit))}
      </td>
    </tr>
  );
}

function periodLabel(p: ReportPeriod): string {
  return p === "daily" ? "Günlük" : p === "yearly" ? "Yıllık" : "Aylık";
}

// Periyot değerini okunabilir formata çevir.
function periodValueLabel(value: string, p: ReportPeriod): string {
  try {
    if (p === "daily") {
      // "2026-07-13" → formatDate (gün kısmı)
      return formatDate(value).split(",")[0];
    }
    if (p === "monthly") {
      return formatMonth(value);
    }
    return value; // yearly: "2026"
  } catch {
    return value;
  }
}
