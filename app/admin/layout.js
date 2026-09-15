// Layout compartilhado de todas as páginas do painel admin.

import { SessionProvider } from "next-auth/react";
import AdminShell from "@/app/admin/components/AdminShell";

export const metadata = {
  title: "Admin | Paola Galvão Studio",
  description: "Painel Administrativo do Paola Galvão Studio",
};

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
