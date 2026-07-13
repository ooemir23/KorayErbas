"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Product } from "@/lib/types";
import { ImageUploader } from "@/components/ImageUploader";
import { ToastContainer, type Toast } from "@/components/Toast";
import { formatTRY, formatUnit, UNIT_TYPES } from "@/lib/format";

let toastSeq = 0;

const EMPTY = {
  brand: "",
  flavor: "",
  unit_type: "gram" as string,
  unit_value: 0,
  image_url: null as string | null,
  purchase_price: 0,
  retail_price: 0,
  stock: 0,
  critical_threshold: 5,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [query, setQuery] = useState("");

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

  async function remove(id: number) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silinemedi.");
      pushToast("Ürün silindi.", "info");
      load();
    } catch {
      pushToast("Ürün silinemedi.", "error");
    }
  }

  // Tüm alanlarda arama (marka, aroma, birim tipi).
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

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ürünler</h2>
          <p className="text-sm text-slate-500">Katalog ve stok yönetimi.</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Yeni Ürün
        </button>
      </div>

      {/* Arama */}
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Marka, aroma veya birim ara…"
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl">🏷️</p>
          <p className="mt-2 font-medium text-slate-700">
            {query ? "Aramanızla eşleşen ürün yok." : "Henüz ürün yok."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const unit = formatUnit(p.unit_type, p.unit_value);
            const isCritical = p.stock > 0 && p.stock <= p.critical_threshold;
            return (
              <div
                key={p.id}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={`${p.brand} ${p.flavor}`.trim()}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl text-slate-300">
                      📦
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {/* Marka üstte, aroma altta */}
                  <p className="truncate font-medium text-slate-900">
                    {p.brand || "—"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {p.flavor || "—"}
                  </p>
                  {unit && <p className="text-xs text-slate-400">{unit}</p>}
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                    <span>Satış: {formatTRY(p.retail_price)}</span>
                    <span>Maliyet: {formatTRY(p.purchase_price)}</span>
                  </div>
                  <p className="mt-0.5 text-xs">
                    Stok:{" "}
                    <span
                      className={
                        p.stock <= 0
                          ? "font-semibold text-red-600"
                          : isCritical
                          ? "font-semibold text-amber-600"
                          : "text-slate-700"
                      }
                    >
                      {p.stock}
                      {isCritical && " ⚠"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ProductFormModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          pushToast={pushToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function ProductFormModal({
  product,
  onClose,
  onSaved,
  pushToast,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
  pushToast: (m: string, t?: Toast["type"]) => void;
}) {
  const [form, setForm] = useState({
    brand: product?.brand ?? EMPTY.brand,
    flavor: product?.flavor ?? EMPTY.flavor,
    unit_type: (product?.unit_type as string) ?? EMPTY.unit_type,
    unit_value: Number(product?.unit_value ?? EMPTY.unit_value),
    image_url: (product?.image_url ?? null) as string | null,
    purchase_price: Number(product?.purchase_price ?? EMPTY.purchase_price),
    retail_price: Number(product?.retail_price ?? EMPTY.retail_price),
    stock: product?.stock ?? EMPTY.stock,
    critical_threshold: product?.critical_threshold ?? EMPTY.critical_threshold,
  });
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandQuery, setBrandQuery] = useState("");

  // Mevcut markaları yükle (datalist için).
  useEffect(() => {
    fetch("/api/products?brands=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d.brands) ? d.brands : []))
      .catch(() => {});
  }, []);

  // Marka alanı için filtrelenmiş öneriler (yazdıkça daralır).
  const brandSuggestions = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.toLowerCase().includes(q));
  }, [brands, brandQuery]);

  async function save() {
    if (!form.brand.trim()) {
      pushToast("Marka zorunludur.", "error");
      return;
    }
    if (!UNIT_TYPES.includes(form.unit_type as any)) {
      pushToast("Geçerli bir birim tipi seçin.", "error");
      return;
    }
    setSaving(true);
    try {
      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = product ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız.");
      pushToast(product ? "Ürün güncellendi." : "Ürün eklendi.");
      onSaved();
    } catch (e: any) {
      pushToast(e.message || "Kayıt başarısız.", "error");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-thin rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">
            {product ? "Ürünü Düzenle" : "Yeni Ürün"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Görsel */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Ürün Görseli
            </label>
            <p className="mb-2 text-xs text-slate-400">
              Görsel otomatik 800×800 / WebP&apos;ye sıkıştırılır.
            </p>
            <ImageUploader
              initialUrl={form.image_url}
              onUploaded={(url) => setForm((f) => ({ ...f, image_url: url }))}
            />
          </div>

          {/* Marka + Aroma */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Marka *
              </label>
              <input
                list="brand-options"
                value={form.brand}
                onChange={(e) => {
                  setForm({ ...form, brand: e.target.value });
                  setBrandQuery(e.target.value);
                }}
                placeholder="Çaykur, Nescafé… (yazınca önerir)"
                autoComplete="off"
                className={inputCls}
              />
              <datalist id="brand-options">
                {brandSuggestions.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {brands.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  {brands.length} kayıtlı marka mevcut
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Aroma / Ürün Adı
              </label>
              <input
                value={form.flavor}
                onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                placeholder="Rize, Gold…"
                className={inputCls}
              />
            </div>
          </div>

          {/* Birim tipi + Miktar */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Birim Tipi *
              </label>
              <select
                value={form.unit_type}
                onChange={(e) =>
                  setForm({ ...form, unit_type: e.target.value })
                }
                className={inputCls}
              >
                {UNIT_TYPES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Miktar
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.unit_value}
                onChange={(e) =>
                  setForm({ ...form, unit_value: Number(e.target.value) })
                }
                placeholder="örn. 500 → 500 gram"
                className={inputCls}
              />
            </div>
          </div>

          {/* Stok + Kritik eşik */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Stok</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value) })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Kritik Stok Eşiği
              </label>
              <input
                type="number"
                min={0}
                value={form.critical_threshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    critical_threshold: Number(e.target.value),
                  })
                }
                className={inputCls}
              />
              <p className="mt-1 text-xs text-slate-400">
                Stok bu değerin altına düşerse uyarı verilir.
              </p>
            </div>
          </div>

          {/* Fiyatlar */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Alış Fiyatı (₺)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.purchase_price}
                onChange={(e) =>
                  setForm({ ...form, purchase_price: Number(e.target.value) })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Perakende Satış (₺)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.retail_price}
                onChange={(e) =>
                  setForm({ ...form, retail_price: Number(e.target.value) })
                }
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            İptal
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
