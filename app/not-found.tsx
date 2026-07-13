import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Sayfa bulunamadı</h1>
      <p className="mt-1 text-sm text-slate-500">
        Aradığınız sayfa mevcut değil.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
