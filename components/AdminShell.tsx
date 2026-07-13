"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Siparişler", icon: "📦" },
  { href: "/admin/urunler", label: "Ürünler", icon: "🏷️" },
  { href: "/admin/stok", label: "Stok Takip", icon: "📉" },
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
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              S
            </span>
            <span className="font-bold text-slate-900">Yönetim</span>
          </div>
          <nav className="space-y-1 p-3">
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
          <div className="absolute inset-x-0 bottom-0 p-3">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
            >
              🚪 Çıkış Yap
            </button>
            <Link
              href="/"
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
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
        <div className="flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Menü"
            >
              ☰
            </button>
            <h1 className="font-semibold text-slate-800">Admin Paneli</h1>
            <div className="w-8" />
          </header>
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
