"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatUnit, productLabel } from "@/lib/format";
import { buildRequestMessage } from "@/lib/whatsapp";

interface RequestModalProps {
  product: Product;
  onClose: () => void;
  /** Mağaza sahibinin WhatsApp numarası (wa.me formatı için). */
  storePhone: string;
}

export function RequestModal({ product, onClose, storePhone }: RequestModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  const unit = formatUnit(product.unit_type, product.unit_value);
  const label = productLabel(product) || `#${product.id}`;

  async function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Lütfen adınızı girin.");
      return;
    }
    if (!phone.trim()) {
      setError("Lütfen telefon numaranızı girin.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          quantity,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Talep gönderilemedi.");
      // WhatsApp linkini hazırla (müşteri kendi telefonundan gönderir).
      const msg = buildRequestMessage({
        brand: product.brand,
        flavor: product.flavor,
        unit_type: product.unit_type,
        unit_value: Number(product.unit_value),
        quantity,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        note: note.trim() || null,
      });
      setWaLink(
        `https://wa.me/${storePhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`
      );
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Talep gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto scroll-thin rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">📢 Ürün Talebi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        {done ? (
          /* Başarı ekranı */
          <div className="p-5">
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-3xl">✅</p>
              <p className="mt-2 font-semibold text-green-800">
                Talebiniz alındı!
              </p>
              <p className="mt-1 text-sm text-green-700">
                Talebinizi satıcıya iletmek için WhatsApp üzerinden de
                bildirebilirsiniz.
              </p>
            </div>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full rounded-lg bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#1da851]"
              >
                📱 WhatsApp ile Bildir
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-2 block w-full rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            {/* Ürün bilgisi (salt okunur) */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg text-slate-300">
                    📦
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {label}
                </p>
                {unit && (
                  <p className="text-xs text-slate-500">{unit}</p>
                )}
                <span className="mt-0.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  Stokta Yok
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Adınız Soyadınız *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız"
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Telefon Numaranız *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                type="tel"
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                İstenen Adet
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Not (opsiyonel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Eklemek istediğiniz not"
                rows={2}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Gönderiliyor…" : "Talebi Gönder"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
