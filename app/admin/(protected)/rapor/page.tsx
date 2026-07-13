"use client";

import { useEffect, useState } from "react";
import type { CustomerRevenue, MonthlyRevenue } from "@/lib/types";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatTRY, formatMonth } from "@/lib/format";

let toastSeq = 0;

interface ReportData {
  customers: CustomerRevenue[];
  monthly: MonthlyRevenue[];
  totalRevenue: number;
}

export default function AdminReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string, type: Toast["type"] = "success") => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const dismissToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => pushToast("Rapor yüklenemedi.", "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Raporlar</h2>
        <p className="text-sm text-slate-500">
          Onaylı siparişlere göre ciro istatistikleri.
        </p>
      </div>

      {/* Toplam ciro kartı */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Toplam Ciro"
          value={data ? formatTRY(data.totalRevenue) : "—"}
          icon="💰"
        />
        <StatCard
          label="Toplam Müşteri"
          value={data ? String(data.customers.length) : "—"}
          icon="👥"
        />
        <StatCard
          label="Bu Ay"
          value={
            data?.monthly[0] ? formatTRY(data.monthly[0].total) : "—"
          }
          icon="📅"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Müşteri bazlı ciro */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">
                Müşteri Bazlı Ciro
              </h3>
            </div>
            {data?.customers.length === 0 ? (
              <EmptyRow text="Onaylı sipariş yok." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Müşteri</th>
                    <th className="px-5 py-2 font-medium">Sipariş</th>
                    <th className="px-5 py-2 text-right font-medium">Ciro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.customers.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {c.customer}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {c.order_count}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-brand-700">
                        {formatTRY(c.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Aylık gelir */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3">
              <h3 className="font-semibold text-slate-900">Aylık Gelir</h3>
            </div>
            {data?.monthly.length === 0 ? (
              <EmptyRow text="Veri yok." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Ay</th>
                    <th className="px-5 py-2 text-right font-medium">Gelir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.monthly.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatMonth(m.month)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-brand-700">
                        {formatTRY(m.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-400">{text}</div>
  );
}
