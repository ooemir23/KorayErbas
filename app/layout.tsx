import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StokSipariş — Stok Takip & Perakende Sipariş",
  description: "Stok takibi ve perakende sipariş yönetimi uygulaması.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
