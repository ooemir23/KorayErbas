"use client";

import type { Product } from "@/lib/types";
import { formatTRY, formatUnit, productLabel } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const label = productLabel(product) || `#${product.id}`;
  const unit = formatUnit(product.unit_type, product.unit_value);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={label}
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
        <h3 className="font-semibold text-slate-900">{label}</h3>
        {unit && <p className="mt-0.5 text-sm text-slate-500">{unit}</p>}

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
