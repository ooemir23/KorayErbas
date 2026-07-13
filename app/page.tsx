"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { StorefrontHeader } from "@/components/StorefrontHeader";
import { ProductCard } from "@/components/ProductCard";
import { ToastContainer, type Toast } from "@/components/Toast";
import { useCart } from "@/lib/useCart";

let toastSeq = 0;

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [query, setQuery] = useState("");

  const cart = useCart();

  function pushToast(message: string, type: Toast["type"] = "success") {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => pushToast("Ürünler yüklenemedi.", "error"))
      .finally(() => setLoading(false));
  }, []);

  // Arama filtresi (marka/aroma/birim'de, client-side).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.brand?.toLowerCase().includes(q) ||
        p.flavor?.toLowerCase().includes(q) ||
        p.unit_type?.toLowerCase().includes(q) ||
        String(p.unit_value).includes(q)
      );
    });
  }, [products, query]);

  // Markaya göre grupla (sıralı), her markanın ürünleri ile.
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      const key = p.brand?.trim() || "Diğer";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    // Marka adına göre alfabetik, "Diğer" en sona.
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "Diğer") return 1;
      if (b[0] === "Diğer") return -1;
      return a[0].localeCompare(b[0], "tr");
    });
  }, [filtered]);

  const brands = grouped.map(([brand]) => brand);

  return (
    <div className="min-h-screen">
      <StorefrontHeader cartCount={cart.count} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Başlık */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Ürünler</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sadece stokta bulunan ürünler gösterilir.
          </p>
        </div>

        {/* Arama kutusu */}
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Marka, aroma veya birim ara…"
            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Marka hızlı geçiş sekmeleri */}
        {brands.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <a
                key={brand}
                href={`#brand-${encodeURIComponent(brand)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {brand}
              </a>
            ))}
          </div>
        )}

        {/* İçerik */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-2 font-medium text-slate-700">
              {query
                ? "Aramanızla eşleşen ürün bulunamadı."
                : "Henüz satışa açık ürün yok."}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([brand, items]) => (
              <section key={brand} id={`brand-${encodeURIComponent(brand)}`}>
                <h2 className="mb-3 text-lg font-bold text-slate-900">
                  {brand}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    {items.length} ürün
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAdd={(prod) => {
                        cart.addItem(prod);
                        pushToast(
                          `${prod.brand} ${prod.flavor}`.trim() +
                            " sepete eklendi."
                        );
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
