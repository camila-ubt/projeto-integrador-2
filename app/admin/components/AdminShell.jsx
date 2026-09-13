"use client";

import { useSession } from "next-auth/react";
import Sidebar from "@/app/admin/components/Sidebar";

export default function AdminShell({ children }) {
  const { data: sessao } = useSession();

  const primeiroNome = sessao?.user?.name?.split(" ")[0] ?? "Paola";
  const inicial = primeiroNome.charAt(0).toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--fundo)",
        display: "flex",
      }}
    >
      <Sidebar nome={primeiroNome} inicial={inicial} />

      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
        className="admin-main"
      >
        {children}
      </main>

      <style>{`
        @media (min-width: 992px) {
          .admin-main { margin-left: 220px !important; }
        }
        @media (max-width: 991px) {
          .admin-main { padding-top: 64px; }
        }
      `}</style>
    </div>
  );
}