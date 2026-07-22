import Link from "next/link";

interface StorefrontHeaderProps {
  cartCount: number;
}

export function StorefrontHeader({ cartCount }: StorefrontHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white sm:h-9 sm:w-9">
            S
          </span>
          <span className="font-bold text-slate-900">StokSipariş</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/sepet"
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:px-3 sm:py-2"
          >
            🛒 <span className="hidden sm:inline">Sepet</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin"
            className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 sm:px-3 sm:py-2"
          >
            Yönetim
          </Link>
        </nav>
      </div>
    </header>
  );
}
