"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatarMoeda,
  formatarDataCurta,
  formatarHora,
  formatarDuracao,
  calcularDuracao,
  agruparPorMes,
  somarServicos,
} from "@/lib/formatters";
import { IcoHistorico, IcoCalendario, IcoRelogio, IcoClientes } from "@/app/components/icons";
import { STATUS_LABELS, STATUS_OPCOES } from "@/lib/constantes";
import styles from "./Historico.module.css";

// ─── Subcomponentes ───────────────────────────────────────────────────────────
//Ao invés do spinner, mostra a forma do conteudo enquanto os dados vem da API
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonLine} style={{ width: "55%", height: 15 }} />
      <div className={styles.skeletonLine} style={{ width: "35%", height: 12, marginTop: 6 }} />
      <div className={styles.skeletonLine} style={{ width: "25%", height: 12, marginTop: 14 }} />
    </div>
  );
}

function BadgeStatus({ status }) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function CardAtendimento({ atendimento }) {
  const servicos  = atendimento.servicos ?? [];
  const total     = somarServicos(servicos);
  const duracao   = calcularDuracao(atendimento.inicio, atendimento.fim);
  const cancelado = atendimento.status === "cancelado";
  const nomesServicos = servicos.length > 0
    ? servicos.map((s) => s.nome).join(", ")
    : "Serviço não informado";

  return (
    <article
      className={styles.card}
      aria-label={`Atendimento de ${atendimento.cliente_nome} em ${formatarDataCurta(atendimento.inicio)}`}
    >
      {/* Cabeçalho: serviço + badge */}
      <div className={styles.cardHeader}>
        <div className={styles.cardInfo}>
          <p className={styles.cardServico}>{nomesServicos}</p>
          <p className={styles.cardCliente}>
            <IcoClientes size={13} aria-hidden="true" />
            {atendimento.cliente_nome}
          </p>
          <p className={styles.cardData}>
            <IcoCalendario size={13} aria-hidden="true" />
            {formatarDataCurta(atendimento.inicio)} às {formatarHora(atendimento.inicio)}
          </p>
        </div>
        <BadgeStatus status={atendimento.status} />
      </div>

      {/* Rodapé: valor + duração */}
      <div className={styles.cardFooter}>
        <span className={cancelado ? styles.precoRiscado : styles.preco}>
          {formatarMoeda(total)}
        </span>
        {duracao && (
          <span className={styles.duracao}>
            <IcoRelogio size={13} aria-hidden="true" />
            {formatarDuracao(duracao)}
          </span>
        )}
      </div>

      {atendimento.observacoes && (
        <p className={styles.observacoes}>{atendimento.observacoes}</p>
      )}
    </article>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [atendimentos,    setAtendimentos]    = useState([]);
  const [filtroStatus,    setFiltroStatus]    = useState("");
  const [buscaCliente,    setBuscaCliente]    = useState("");
  const [carregando,      setCarregando]      = useState(true);
  const [erro,            setErro]            = useState(null);

  // ── Busca na API ──────────────────────────────────────────────────────────
  const buscarHistorico = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const params = new URLSearchParams();
      if (filtroStatus) params.set("status", filtroStatus);
      // Traz do mais antigo para o mais recente; agrupamos por mês no cliente
      const res = await fetch(`/api/agendamentos?${params.toString()}`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const dados = await res.json();
      setAtendimentos(dados);
    } catch (e) {
      console.error("[Histórico] Erro ao buscar:", e);
      setErro("Não foi possível carregar o histórico. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    buscarHistorico();
  }, [buscarHistorico]);

  // ── Filtro de busca por cliente (client-side, sem nova chamada) ───────────
  const atendimentosFiltrados = buscaCliente.trim()
    ? atendimentos.filter((a) =>
        a.cliente_nome?.toLowerCase().includes(buscaCliente.toLowerCase())
      )
    : atendimentos;

  const grupos = agruparPorMes(atendimentosFiltrados);
  const temFiltroAtivo = filtroStatus || buscaCliente.trim();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>

      {/* Filtros */}
      <div className={styles.barraFiltros}>

        {/* Busca por cliente */}
        <div className={styles.buscaWrap}>
          <label htmlFor="busca-cliente" className={styles.srOnly}>
            Buscar por cliente
          </label>
          <input
            id="busca-cliente"
            type="search"
            className={styles.inputBusca}
            placeholder="Buscar por cliente…"
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
          />
        </div>

        {/* Chips de status */}
        <nav className={styles.filtros} aria-label="Filtrar por status">
          {STATUS_OPCOES.map((op) => (
            <button
              key={op.valor}
              className={`${styles.chip} ${filtroStatus === op.valor ? styles.chipAtivo : ""}`}
              onClick={() => setFiltroStatus(op.valor)}
              aria-pressed={filtroStatus === op.valor}
            >
              {op.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Estado: carregando ──────────────────────────────────────────────── */}
      {carregando && (
        <section
          className={styles.listaWrap}
          aria-busy="true"
          aria-label="Carregando histórico"
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      )}

      {/* ── Estado: erro ────────────────────────────────────────────────────── */}
      {!carregando && erro && (
        <div className={styles.estadoErro} role="alert">
          <p>{erro}</p>
          <button className={styles.btnRetry} onClick={buscarHistorico}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Estado: vazio ───────────────────────────────────────────────────── */}
      {!carregando && !erro && atendimentosFiltrados.length === 0 && (
        <div className={styles.estadoVazio} role="status">
          <IcoHistorico size={40} aria-hidden="true" />
          <p className={styles.estadoVazioTitulo}>Nenhum atendimento encontrado</p>
          <p className={styles.estadoVazioDesc}>
            {temFiltroAtivo
              ? "Tente ajustar os filtros."
              : "Os atendimentos realizados aparecerão aqui."}
          </p>
        </div>
      )}

      {/* ── Lista agrupada por mês ──────────────────────────────────────────── */}
      {!carregando && !erro && grupos.length > 0 && (
        <section aria-label="Atendimentos agrupados por mês">
          {grupos.map(([chave, grupo]) => (
            <div key={chave}>
              <h2 className={styles.mesLabel}>{grupo.label}</h2>
              <ul className={styles.lista} role="list">
                {grupo.itens.map((atendimento) => (
                  <li key={atendimento.id} role="listitem">
                    <CardAtendimento atendimento={atendimento} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
