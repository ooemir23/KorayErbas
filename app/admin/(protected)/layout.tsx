import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, getSessionCookieName } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

// Yalnızca (protected) grubu içindeki sayfaları korur.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get(getSessionCookieName())?.value;
  const session = await verifySession(token);
  if (!session) redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
