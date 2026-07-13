// Tüm /admin/* için passthrough layout.
// Korumalı alan (auth + AdminShell) route group'ta (protected) uygulanır,
// böylece /admin/login login ekranı korumaya takılmaz.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
