"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { buscarResumoDashboard } from "@/services/resumoDashboard";

import CardsResumo       from "@/app/admin/components/CardsResumo";
import ListaAgendamentos from "@/app/admin/components/ListaAgendamentos";
import ListaRetornos     from "@/app/admin/components/ListaRetornos";

function formatarDataHoje() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });
}

export default function PaginaDashboard() {
  const { status: statusSessao } = useSession();

  const [agendamentos, setAgendamentos] = useState([]);
  const [retornos,     setRetornos]     = useState([]);
  const [faturamento,  setFaturamento]  = useState(0);
  const [carregando,   setCarregando]   = useState(true);
  const [erro,         setErro]         = useState("");
  const [dataHoje] = useState(() => formatarDataHoje());

  useEffect(() => {
    async function buscarDados() {
      try {
        setCarregando(true);
        const dados = await buscarResumoDashboard();
        setAgendamentos(dados.agendamentosHoje);
        setRetornos(dados.retornosPendentes);
        setFaturamento(dados.faturamentoDia);
      } catch {
        setErro("Não foi possível carregar os dados. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }

    if (statusSessao === "authenticated") buscarDados();
  }, [statusSessao]);

  if (carregando) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" role="status" style={{ color: "var(--primaria)" }}>
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3" style={{ paddingTop: "16px" }}>

      {/* Data de hoje — contexto visual discreto */}
      {dataHoje && (
        <p
          className="text-capitalize"
          style={{
            fontSize:      "11px",
            color:         "var(--texto-secundario)",
            fontFamily:    "var(--fonte-corpo)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom:  "12px",
          }}
        >
          {dataHoje}
        </p>
      )}

      {/* Erro global */}
      {erro && (
        <div
          className="rounded-3 py-2 px-3 mb-3 small"
          role="alert"
          style={{
            backgroundColor: "var(--erro-fundo)",
            color:           "var(--erro-texto)",
            border:          "1px solid var(--erro-borda)",
            fontFamily:      "var(--fonte-corpo)",
          }}
        >
          {erro}
        </div>
      )}

      <CardsResumo
        totalAgendamentos={agendamentos.length}
        totalRetornos={retornos.length}
        faturamento={faturamento}
      />

      <ListaAgendamentos agendamentos={agendamentos} />

      <ListaRetornos retornos={retornos} />
    </div>
  );
}
