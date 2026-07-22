"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Siparişler", icon: "📦" },
  { href: "/admin/urunler", label: "Ürünler", icon: "🏷️" },
  { href: "/admin/stok", label: "Stok Takip", icon: "📉" },
  { href: "/admin/talepler", label: "Talepler", icon: "📢" },
  { href: "/admin/rapor", label: "Raporlar", icon: "📊" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobil üst bar — hamburger menü */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Menü"
        >
          ☰
        </button>
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
            S
          </span>
          <span className="text-sm font-bold text-slate-900">Yönetim</span>
        </span>
        <Link
          href="/"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
          aria-label="Mağazaya dön"
        >
          ←
        </Link>
      </header>

      <div className="mx-auto flex">
        {/* Sidebar — mobilde overlay, masaüstünde sabit */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo başlığı */}
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 px-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              S
            </span>
            <span className="font-bold text-slate-900">Yönetim</span>
          </div>
          {/* Nav — esneyerek boşluğu doldurur */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {/* Alt aksiyonlar — her zaman en altta, çakışmasız */}
          <div className="shrink-0 space-y-1 border-t border-slate-200 p-3">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
            >
              🚪 Çıkış Yap
            </button>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
            >
              ← Mağazaya Dön
            </Link>
          </div>
        </aside>

        {/* Mobil overlay */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* İçerik */}
        <div className="min-w-0 flex-1">
          {/* Masaüstü header */}
          <header className="sticky top-0 z-20 hidden h-16 items-center border-b border-slate-200 bg-white px-6 lg:flex">
            <h1 className="font-semibold text-slate-800">Admin Paneli</h1>
          </header>
          <main className="p-3 sm:p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
