"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Product } from "@/lib/types";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatUnit, productLabel } from "@/lib/format";

let toastSeq = 0;

type Filter = "all" | "critical" | "out";

export default function AdminStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState(""); // Ürün arama (marka/aroma/birim)

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
      const res = await fetch("/api/products?all=1", { cache: "no-store" });
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      pushToast("Ürünler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Ürün sınıflandırması: tükenmiş, kritik, normal.
  const stats = useMemo(() => {
    let out = 0;
    let critical = 0;
    let ok = 0;
    for (const p of products) {
      if (p.stock <= 0) out++;
      else if (p.critical_threshold > 0 && p.stock <= p.critical_threshold)
        critical++;
      else ok++;
    }
    return { total: products.length, out, critical, ok };
  }, [products]);

  // Sıralama: önce tükenen, sonra kritik (kritiklik azalan), sonra normal.
  // Filtre uygulanmış liste.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ranked = products.map((p) => {
      const out = p.stock <= 0;
      const critical =
        !out && p.critical_threshold > 0 && p.stock <= p.critical_threshold;
      return {
        p,
        out,
        critical,
        rank: out ? 0 : critical ? 1 : 2,
      };
    });
    const filtered = ranked.filter((r) => {
      // Status filtresi.
      if (filter === "out" && !r.out) return false;
      if (filter === "critical" && !r.critical) return false;
      // Ürün arama filtresi (marka/aroma/birim).
      if (q) {
        const p = r.p;
        const matches =
          p.brand?.toLowerCase().includes(q) ||
          p.flavor?.toLowerCase().includes(q) ||
          p.unit_type?.toLowerCase().includes(q) ||
          String(p.unit_value).includes(q);
        if (!matches) return false;
      }
      return true;
    });
    filtered.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.p.brand.localeCompare(b.p.brand);
    });
    return filtered;
  }, [products, filter, query]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Stok Takip</h2>
        <p className="text-sm text-slate-500">
          Kritik stok seviyesi ve tükenen ürünlerin takibi.
        </p>
      </div>

      {/* Stat kartları */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Toplam Ürün"
          value={String(stats.total)}
          icon="📦"
          tone="brand"
        />
        <StatCard
          label="Yeterli Stok"
          value={String(stats.ok)}
          icon="✅"
          tone="green"
        />
        <StatCard
          label="Kritik Stokta"
          value={String(stats.critical)}
          icon="⚠️"
          tone="amber"
        />
        <StatCard
          label="Tükenen"
          value={String(stats.out)}
          icon="⛔"
          tone="red"
        />
      </div>

      {/* Ürün arama kutusu */}
      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Ürün ara (marka, aroma veya birim)…"
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Filtre sekmeleri */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { id: "all", label: `Tümü (${stats.total})` },
          { id: "critical", label: `Kritik (${stats.critical})` },
          { id: "out", label: `Tükenen (${stats.out})` },
        ] as { id: Filter; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition " +
              (filter === t.id
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-2 font-medium text-slate-700">
            {query
              ? "Aramanızla eşleşen ürün yok."
              : filter === "out"
              ? "Tükenen ürün yok. 🎉"
              : filter === "critical"
              ? "Kritik stokta ürün yok."
              : "Henüz ürün yok."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Ürün</th>
                <th className="px-4 py-3 text-left font-medium">Birim</th>
                <th className="px-4 py-3 text-right font-medium">Stok</th>
                <th className="px-4 py-3 text-right font-medium">
                  Kritik Eşik
                </th>
                <th className="px-4 py-3 text-right font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ p, out, critical }) => {
                const label = productLabel(p) || `#${p.id}`;
                const unit = formatUnit(p.unit_type, p.unit_value);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {label}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {p.critical_threshold}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {out ? (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Tükendi
                        </span>
                      ) : critical ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Kritik
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Yeterli
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: string;
  tone: "brand" | "green" | "amber" | "red";
}) {
  const tones: Record<"brand" | "green" | "amber" | "red", string> = {
    brand: "bg-brand-50",
    green: "bg-green-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${tones[tone]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
