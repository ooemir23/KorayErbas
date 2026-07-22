"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatTRY, formatUnit } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, quantity: number) => void;
  onRequest?: (product: Product) => void;
}

// Stok adedini kompakt göster: 5'ten fazla ise "5+", değilse gerçek sayı.
function stockLabel(stock: number): string {
  return stock > 5 ? "5+" : String(stock);
}

export function ProductCard({ product, onAdd, onRequest }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const unit = formatUnit(product.unit_type, product.unit_value);
  const alt = `${product.brand} ${product.flavor}`.trim() || `#${product.id}`;
  const outOfStock = product.stock <= 0;

  return (
    <div
      className={
        "group flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md " +
        (outOfStock
          ? "border-slate-200 opacity-75"
          : "border-slate-200")
      }
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
            📦
          </div>
        )}
        {/* Stok rozeti — sağ üstte */}
        {outOfStock ? (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
            Tükendi
          </span>
        ) : (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur">
            {stockLabel(product.stock)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2">
        {/* Marka — küçük, gri */}
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {product.brand || "—"}
        </p>
        {/* Aroma — belirgin, kalın */}
        <h3 className="mt-0.5 truncate text-sm font-bold text-slate-900">
          {product.flavor || "—"}
        </h3>
        {unit && (
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{unit}</p>
        )}

        {/* Fiyat — belirgin */}
        <p className="mt-1.5 text-sm font-bold text-brand-700">
          {formatTRY(product.retail_price)}
        </p>

        {outOfStock ? (
          <button
            onClick={() => onRequest?.(product)}
            className="mt-1.5 w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            📢 Talepte Bulun
          </button>
        ) : (
          <div className="mt-1.5 flex items-center gap-1.5">
            {/* Adet kontrolü: - / input / + */}
            <div className="flex items-center rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Azalt"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={qty}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v)) return;
                  setQty(Math.min(Math.max(1, Math.floor(v)), product.stock));
                }}
                onBlur={(e) => {
                  // Boş veya geçersizse 1'e sıfırla
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v) || v < 1) setQty(1);
                }}
                className="h-7 w-9 border-x border-slate-200 text-center text-xs font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() =>
                  setQty((q) => Math.min(product.stock, q + 1))
                }
                disabled={qty >= product.stock}
                className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Artır"
              >
                +
              </button>
            </div>
            {/* Sepete Ekle */}
            <button
              onClick={() => {
                onAdd(product, qty);
                setQty(1); // ekle sonrası sıfırla
              }}
              className="flex-1 rounded-md bg-brand-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Sepete Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
