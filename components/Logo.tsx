"use client";

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        S
      </span>
      <span className="text-slate-900">StokSipariş</span>
    </Link>
  );
}
