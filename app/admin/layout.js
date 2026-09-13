import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/app/admin/components/AdminShell";

export const metadata = {
  title: "Admin | Paola Galvão Studio",
  description: "Painel Administrativo do Paola Galvão Studio",
};

export default async function AdminLayout({ children }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}