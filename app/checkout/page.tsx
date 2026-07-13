"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StorefrontHeader } from "@/components/StorefrontHeader";
import { ToastContainer, type Toast } from "@/components/Toast";
import { useCart } from "@/lib/useCart";
import { formatTRY, buildWhatsAppLink, productLabel } from "@/lib/format";
import { buildOrderMessage } from "@/lib/whatsapp";

let toastSeq = 0;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  function pushToast(message: string, type: Toast["type"] = "success") {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
  }
  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ---- Form doğrulama: tüm zorunlu alanlar dolmadan buton disabled ----
  const formValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    address.trim() !== "" &&
    phone.trim() !== "";

  async function handleSubmit() {
    if (!formValid) return;
    if (cart.items.length === 0) {
      pushToast("Sepetiniz boş.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          address,
          phone,
          note,
          items: cart.items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sipariş oluşturulamadı.");

      setOrderId(data.id);

      // WhatsApp linkini hazırla
      const message = buildOrderMessage({
        first_name: firstName,
        last_name: lastName,
        address,
        phone,
        note: note.trim() || null,
        items: cart.items,
        total: cart.subtotal,
      });
      setWaLink(buildWhatsAppLink(phone, message));

      pushToast("Siparişiniz alındı! WhatsApp ile iletebilirsiniz.");
      cart.clear();
    } catch (e: any) {
      pushToast(e.message || "Bir hata oluştu.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Hydrasyon tamamlanana dek bekle
  if (!cart.hydrated) {
    return (
      <div className="min-h-screen">
        <StorefrontHeader cartCount={0} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StorefrontHeader cartCount={cart.count} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          Sipariş Tamamla
        </h1>

        {orderId ? (
          // ---- Başarı ekranı ----
          <div className="mx-auto max-w-lg rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-3xl">
              ✅
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Siparişiniz Alındı!
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sipariş No: <span className="font-medium">#{orderId}</span>
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Siparişinizi WhatsApp üzerinden bize iletin, en kısa sürede
              onaylayalım.
            </p>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white hover:bg-[#1da851]"
              >
                <WhatsAppIcon /> WhatsApp ile Paylaş
              </a>
            )}

            <Link
              href="/"
              className="mt-3 inline-block w-full rounded-lg border border-slate-200 px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50"
            >
              Alışverişe Devam Et
            </Link>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">🛒</p>
            <p className="mt-2 font-medium text-slate-700">Sepetiniz boş.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ürünlere Dön
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-900">
                  Teslimat Bilgileri
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="İsim *"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="Adınız"
                  />
                  <Field
                    label="Soyisim *"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Soyadınız"
                  />
                </div>
                <div className="mt-4">
                  <Field
                    label="Adres *"
                    value={address}
                    onChange={setAddress}
                    placeholder="Mahalle, sokak, no, ilçe, il"
                    textarea
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Telefon *"
                    value={phone}
                    onChange={setPhone}
                    placeholder="05XX XXX XX XX"
                    type="tel"
                  />
                </div>
                <div className="mt-4">
                  <Field
                    label="Sipariş Notu (opsiyonel)"
                    value={note}
                    onChange={setNote}
                    placeholder="Eklemek istediğiniz not (varsa)"
                    textarea
                  />
                </div>
              </div>
            </div>

            {/* Özet + buton */}
            <aside>
              <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-900">Sipariş Özeti</h2>
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto scroll-thin text-sm">
                  {cart.items.map((it) => (
                    <div
                      key={it.product_id}
                      className="flex justify-between text-slate-600"
                    >
                      <span className="pr-2">
                        {productLabel(it) || `#${it.product_id}`}{" "}
                        <span className="text-slate-400">×{it.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium">
                        {formatTRY(it.unit_price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                  <span>Toplam</span>
                  <span>{formatTRY(cart.subtotal)}</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!formValid || submitting}
                  className={`mt-4 w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
                    formValid && !submitting
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "cursor-not-allowed bg-slate-200 text-slate-400"
                  }`}
                >
                  {submitting ? "Gönderiliyor…" : "Siparişi Onayla"}
                </button>
                {!formValid && (
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Devam etmek için işaretli (*) alanları doldurun.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea,
}: {
  label: string;
  validation?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  const cls =
    "mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
