"use client";

import type { Product } from "@/lib/types";
import { formatTRY, formatUnit } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

// Stok adedini kompakt göster: 5'ten fazla ise "5+", değilse gerçek sayı.
function stockLabel(stock: number): string {
  return stock > 5 ? "5+" : String(stock);
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const unit = formatUnit(product.unit_type, product.unit_value);
  const alt = `${product.brand} ${product.flavor}`.trim() || `#${product.id}`;
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
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
        {/* Stok rozeti — sağ üstte, kompakt */}
        <span className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur">
          {stockLabel(product.stock)}
        </span>
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

        <button
          onClick={() => onAdd(product)}
          className="mt-1.5 w-full rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  );
}
