"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  IcoDashboard,
  IcoAgendamentos,
  IcoRetornos,
  IcoHistorico,
  IcoClientes,
  IcoServicos,
  IcoCaixa,
  IcoSair,
  IcoFechar,
  IcoMenu,
} from "@/app/components/icons";

const GRUPOS = [
  {
    grupo: "Visão geral",
    itens: [
      { label: "Dashboard", href: "/admin/dashboard", icone: <IcoDashboard /> },
    ],
  },
  {
    grupo: "Atendimento",
    itens: [
      {
        label: "Agendamentos",
        href: "/admin/agendamentos",
        icone: <IcoAgendamentos />,
      },
      { label: "Retornos", href: "/admin/retornos", icone: <IcoRetornos /> },
      { label: "Histórico", href: "/admin/historico", icone: <IcoHistorico /> },
    ],
  },
  {
    grupo: "Cadastros",
    itens: [
      { label: "Clientes", href: "/admin/clientes", icone: <IcoClientes /> },
      { label: "Serviços", href: "/admin/servicos", icone: <IcoServicos /> },
    ],
  },
  {
    grupo: "Financeiro",
    itens: [{ label: "Caixa", href: "/admin/caixa", icone: <IcoCaixa /> }],
  },
];

//Item de navegação da sidebar, com destaque se for a página atual
function ItemNav({ item, ativo, aoClicar }) {
  return (
    <Link
      href={item.href}
      onClick={aoClicar}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "var(--radius-medium)",
        textDecoration: "none",
        backgroundColor: ativo ? "rgba(183,110,121,0.10)" : "transparent",
        color: ativo ? "var(--primaria)" : "var(--texto-claro)",
        fontFamily: "var(--fonte-corpo)",
        fontSize: "14px",
        fontWeight: ativo ? 600 : 400,
        transition: "background-color 0.15s ease, color 0.15s ease",
        borderLeft: ativo
          ? "3px solid var(--primaria)"
          : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!ativo) {
          e.currentTarget.style.backgroundColor = "rgba(183,110,121,0.05)";
          e.currentTarget.style.color = "var(--texto-principal)";
        }
      }}
      onMouseLeave={(e) => {
        if (!ativo) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--texto-claro)";
        }
      }}
    >
      <span style={{ opacity: ativo ? 1 : 0.65, flexShrink: 0 }}>
        {item.icone}
      </span>
      {item.label}
    </Link>
  );
}

//Conteúdo interno da sidebar, com os grupos de navegação e o botão de logout
function ConteudoMenu({ pathname, aoClicar, nome, inicial }) {
  async function sair() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px 12px",
      }}
    >
      {/* Logo / título */}
      <div
        style={{
          padding: "0 4px 20px",
          borderBottom: "1px solid var(--borda)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: "18px",
            fontStyle: "italic",
            fontWeight: 600,
            color: "var(--texto-principal)",
            margin: 0,
            marginBottom: "2px",
          }}
        >
          Paola Galvão
        </p>
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "11px",
            color: "var(--texto-secundario)",
            margin: 0,
            letterSpacing: "0.06em",
          }}
        >
          Painel administrativo
        </p>
      </div>

      {/* Grupos de navegação */}
      <nav style={{ flex: 1, overflowY: "auto", paddingTop: "12px" }}>
        {GRUPOS.map((grupo) => (
          <div key={grupo.grupo} style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--texto-secundario)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: "4px",
              }}
            >
              {grupo.grupo}
            </p>
            {grupo.itens.map((item) => (
              <ItemNav
                key={item.href}
                item={item}
                ativo={pathname === item.href}
                aoClicar={aoClicar}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé: perfil + sair */}
      <div style={{ borderTop: "1px solid var(--borda)", paddingTop: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--primaria)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--fonte-corpo)",
              flexShrink: 0,
            }}
          >
            {inicial}
          </div>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--texto-principal)",
              margin: 0,
            }}
          >
            {nome}
          </p>
        </div>

        <button
          type="button"
          onClick={sair}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "var(--radius-medium)",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background-color 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--erro-fundo)";
            e.currentTarget.style.color = "var(--erro-texto)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--texto-secundario)";
          }}
        >
          <IcoSair />
          Sair
        </button>
      </div>
    </div>
  );
}

//Componente principal da sidebar, que alterna entre o menu lateral e o bottom sheet no mobile
export default function Sidebar({ nome, inicial }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu ao redimensionar para desktop
  useEffect(() => {
    function aoRedimensionar() {
      if (window.innerWidth >= 992) setAberto(false);
    }
    window.addEventListener("resize", aoRedimensionar, { passive: true });
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  // Trava o scroll do body quando o menu mobile estiver aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  // Fecha ao navegar
  function fechar() {
    setAberto(false);
  }

  return (
    <>
      {/* DESKTOP: sidebar fixa à esquerda */}
      <aside
        className="d-none d-lg-flex"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "220px",
          height: "100vh",
          backgroundColor: "var(--superficie)",
          borderRight: "1px solid var(--borda)",
          flexDirection: "column",
          zIndex: 100,
        }}
      >
        <ConteudoMenu
          pathname={pathname}
          aoClicar={fechar}
          nome={nome}
          inicial={inicial}
        />
      </aside>

      {/* MOBILE: botão flutuante + bottom sheet */}

      {/* Botão hambúrguer fixo no canto superior esquerdo */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="d-lg-none"
        aria-label="Abrir menu"
        style={{
          position: "fixed",
          top: "12px",
          left: "16px",
          zIndex: 200,
          width: "40px",
          height: "40px",
          borderRadius: "var(--radius-medium)",
          backgroundColor: "var(--superficie)",
          border: "1px solid var(--borda-escura)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(45,26,20,0.08)",
        }}
      >
        <IcoMenu />
      </button>

      {/* Overlay escurecido */}
      {aberto && (
        <div
          onClick={fechar}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(45,26,20,0.45)",
            zIndex: 300,
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* Bottom sheet — sobe de baixo no mobile */}
      <div
        className="d-lg-none"
        aria-hidden={!aberto}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "88dvh",
          backgroundColor: "var(--fundo)",
          borderRadius: "20px 20px 0 0",
          zIndex: 400,
          transform: aberto ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -4px 32px rgba(45,26,20,0.14)",
          overflowY: "auto",
        }}
      >
        {/* Alça de fechar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px 0",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--borda-escura)",
              margin: "0 auto",
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
          <div />
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--texto-secundario)",
              padding: "4px",
              marginTop: "4px",
            }}
          >
            <IcoFechar />
          </button>
        </div>

        <ConteudoMenu
          pathname={pathname}
          aoClicar={fechar}
          nome={nome}
          inicial={inicial}
        />
      </div>

      {/* Keyframe para o overlay */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
