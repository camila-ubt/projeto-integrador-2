// Client Component que envolve todas as páginas do painel admin.

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import Sidebar from "./Sidebar";
import HeaderDashboard from "./HeaderDashboard";

// ── Mapa de rotas → títulos do header ─────────────────────────────
// Adicione uma linha aqui a cada nova tela criada em /admin/*
const TITULOS_POR_ROTA = {
  "/admin/dashboard":    "Dashboard",
  "/admin/agendamentos": "Agendamentos",
  "/admin/retornos":     "Retornos",
  "/admin/historico":    "Histórico",
  "/admin/clientes":     "Clientes",
  "/admin/servicos":     "Serviços",
  "/admin/caixa":        "Caixa",
  "/admin/financeiro":   "Financeiro",
};

// Deve coincidir com o width fixo da sidebar em Sidebar.jsx
const SIDEBAR_LARGURA = "220px";

function saudacaoAtual() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AdminShell({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { data: sessao, status } = useSession();

  const [saudacao, setSaudacao] = useState("");

  // Evita divergência servidor/cliente na saudação
  useEffect(() => {
    setSaudacao(saudacaoAtual());
  }, []);

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  async function aoSair() {
    await signOut({ callbackUrl: "/login" });
  }

  // ── Loading de sessão ──────────────────────────────────────────
  if (status === "loading") {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh", backgroundColor: "var(--fundo)" }}
      >
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{ color: "var(--primaria)", width: "2rem", height: "2rem" }}
          >
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p style={{
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "13px",
          }}>
            Verificando sessão...
          </p>
        </div>
      </div>
    );
  }

  // Não renderiza nada enquanto redireciona para login
  if (status === "unauthenticated") return null;

  const primeiroNome = sessao?.user?.name?.split(" ")[0] ?? "Admin";
  const inicialNome  = primeiroNome.charAt(0).toUpperCase();
  const tituloPagina = TITULOS_POR_ROTA[pathname] ?? "";

  return (
    <>
     
      <div style={{ minHeight: "100vh", backgroundColor: "var(--fundo)" }}>

      
        <Sidebar nome={primeiroNome} inicial={inicialNome} />

        {/* ── Área de conteúdo ── */}
        <div className="admin-conteudo">

          {/* ── Header do dashboard ──────────────────────────────── */}
          <HeaderDashboard
            nome={primeiroNome}
            inicial={inicialNome}
            saudacao={saudacao}
            tituloPagina={tituloPagina}
            aoSair={aoSair}
          />

          {/* Conteúdo da página atual */}
          <main style={{ paddingBottom: "2rem" }}>
            {children}
          </main>

        </div>
      </div>

      {/* ── Estilos globais do shell ─────────────────── */}
      <style>{`

        /* Desktop: empurra o conteúdo para a direita da sidebar */
        @media (min-width: 992px) {
          .admin-conteudo {
            margin-left: ${SIDEBAR_LARGURA};
          }
        }

        /* Mobile: largura total, sem margem */
        @media (max-width: 991px) {
          .admin-conteudo {
            margin-left: 0;
          }
        }

        /* ── Padding do header por breakpoint ──────────────────────
           Desktop : padding simétrico normal.
           Mobile  : padding-left extra para não cobrir o botão
                     hambúrguer (40px botão + 16px margem + 8px folga).
        ──────────────────────────────────────────────────────────── */
        @media (min-width: 992px) {
          .admin-header {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }

        @media (max-width: 991px) {
          .admin-header {
            padding-left: 64px !important;
            padding-right: 16px !important;
          }
        }

      `}</style>
    </>
  );
}
