"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { buscarResumoDashboard } from "@/services/resumoDashboard";

import HeaderDashboard from "@/app/admin/components/HeaderDashboard";
import CardsResumo from "@/app/admin/components/CardsResumo";
import ListaAgendamentos from "@/app/admin/components/ListaAgendamentos";
import ListaRetornos from "@/app/admin/components/ListaRetornos";

// Funções globais que ficam no page pois são usadas para montar os dados passados como props
function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function formatarDataHoje() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PaginaDashboard() {
  const roteador = useRouter();
  const { data: sessao, status: statusSessao } = useSession();

  // Estados — o page.jsx é o único que conhece os dados
  const [agendamentos, setAgendamentos] = useState([]);
  const [retornos, setRetornos] = useState([]);
  const [faturamento, setFaturamento] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [saudacaoTexto, setSaudacaoTexto] = useState("");
  const [dataHoje, setDataHoje] = useState("");

  // Redireciona se não autenticado
  useEffect(() => {
    if (statusSessao === "unauthenticated") {
      roteador.push("/login");
    }
  }, [statusSessao, roteador]);

  //Preenche a saudação e a data de hoje
  useEffect(() => {
    setSaudacaoTexto(saudacao());
    setDataHoje(formatarDataHoje());
  }, []);

  // Busca os dados via serviço ao carregar
  useEffect(() => {
    async function buscarDados() {
      try {
        setCarregando(true);
        const dados = await buscarResumoDashboard();
        setAgendamentos(dados.agendamentosHoje);
        setRetornos(dados.retornosPendentes);
        setFaturamento(dados.faturamentoDia);
      } catch (e) {
        setErro("Não foi possível carregar os dados. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }

    if (statusSessao === "authenticated") {
      buscarDados();
    }
  }, [statusSessao]);

  // Logout
  async function aoSair() {
    await signOut({ callbackUrl: "/login" });
  }

  // Tela de carregando
  if (carregando || statusSessao === "loading") {
    return (
      <div
        className="d-flex align-items-center justify-content-center vh-100"
        style={{ backgroundColor: "var(--fundo)" }}
      >
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{ color: "var(--primaria)", width: "2rem", height: "2rem" }}
          >
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p
            style={{
              color: "var(--texto-secundario)",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "13px",
            }}
          >
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Dados da sessão para o header
  const primeiroNome = sessao?.user?.name?.split(" ")[0] ?? "Paola";
  const inicialNome = primeiroNome.charAt(0).toUpperCase();

  // Renderização — apenas monta os componentes e passa os dados
  return (
    <div
      style={{
        backgroundColor: "var(--fundo)",
        minHeight: "100vh",
        paddingBottom: "32px",
      }}
    >
      <HeaderDashboard
        nome={primeiroNome}
        inicial={inicialNome}
        saudacao={saudacaoTexto}
        aoSair={aoSair}
      />

      <div className="px-3">
        {/* Data de hoje */}
        <p
          className="text-capitalize"
          style={{
            fontSize: "11px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: "16px",
            marginBottom: "12px",
          }}
        >
          {dataHoje}
        </p>

        {/* Mensagem de erro global */}
        {erro && (
          <div
            className="rounded-3 py-2 px-3 mb-3 small"
            role="alert"
            style={{
              backgroundColor: "var(--erro-fundo)",
              color: "var(--erro-texto)",
              border: "1px solid var(--erro-borda)",
              fontFamily: "var(--fonte-corpo)",
            }}
          >
            {erro}
          </div>
        )}

        {/* Componentes filhos recebem os dados via props */}
        <CardsResumo
          totalAgendamentos={agendamentos.length}
          totalRetornos={retornos.length}
          faturamento={faturamento}
        />

        <ListaAgendamentos agendamentos={agendamentos} />

        <ListaRetornos retornos={retornos} />
      </div>
    </div>
  );
}
