import { SessionProvider } from "next-auth/react";
// Layout exclusivo de todas as páginas dentro de ADM.

export const metadata = {
  title: "Admin | Paola Galvão Studio",
  description: "Painel Administrativo do Paola Galvão Studio",
};

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      {/* // Container principal */}
      <div
        className="min-vh-100 d-flex flex-column"
        style={{ backgroundColor: "var(--fundo)" }}
      >
        {/* // Conteúdo da página atual (login/dashboard etc) */}
        <main className="flex-grow-1">{children}</main>
      </div>
    </SessionProvider>
  );
}
