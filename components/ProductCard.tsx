"use client";

import type { Product } from "@/lib/types";
import { formatTRY, formatUnit } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const unit = formatUnit(product.unit_type, product.unit_value);
  const alt = `${product.brand} ${product.flavor}`.trim() || `#${product.id}`;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">
            📦
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Marka üstte, aroma altta */}
        <h3 className="truncate font-semibold text-slate-900">
          {product.brand || "—"}
        </h3>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {product.flavor || "—"}
        </p>
        {unit && <p className="mt-0.5 text-xs text-slate-400">{unit}</p>}

        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-brand-700">
              {formatTRY(product.retail_price)}
            </span>
            {unit && (
              <span className="ml-1 text-xs text-slate-400">/ {unit}</span>
            )}
          </div>
          <span className="text-xs text-slate-400">Stok: {product.stock}</span>
        </div>

        <button
          onClick={() => onAdd(product)}
          className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}
