import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { getActiveAdminSession } from "@/lib/auth-helpers";
import AdminShell from "@/app/admin/components/AdminShell";

export const metadata = {
  title: "Admin | Paola Galvão Studio",
  description: "Painel Administrativo do Paola Galvão Studio",
};

export default async function AdminLayout({ children }) {
  const session = await getActiveAdminSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
