"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatarMoeda,
  formatarDataCurta,
  formatarHora,
  somarServicos,
} from "@/lib/formatters";
import { IcoHistorico, IcoLixeira } from "@/app/components/icons";
import DatePickerField from "@/app/components/DatePickerField";
import { dataHojeSalao, limitesDoMes } from "@/lib/periodo-filtros";
import {
  STATUS_LABELS,
  STATUS_OPCOES,
  ITENS_POR_PAGINA,
} from "@/lib/constantes";

import styles from "./Historico.module.css";

// ─── Helpers ───
function exibirServicos(atendimento) {
  const servicos = atendimento.servicos ?? [];
  return servicos.length > 0 ? servicos.map((s) => s.nome).join(", ") : "—";
}

function getBadgeClass(status, styles) {
  const map = {
    realizado: styles.statusRealizado,
    agendado: styles.statusAgendado,
    cancelado: styles.statusCancelado,
    faltou: styles.statusFaltou,
  };
  return `${styles.badgeStatus} ${map[status?.toLowerCase()] ?? ""}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
//Ao buscar os dados da API, ao invez de um sppiner, carrega o corpo do compoenente
function SkeletonCard() {
  return (
    <div className={styles.cardMobile} aria-hidden="true">
      <div className={styles.cardCentro}>
        <div
          className={styles.skeletonLine}
          style={{ width: "50%", height: 14 }}
        />
        <div
          className={styles.skeletonLine}
          style={{ width: "35%", height: 12, marginTop: 5 }}
        />
        <div
          className={styles.skeletonLine}
          style={{ width: "25%", height: 11, marginTop: 4 }}
        />
      </div>
      <div
        className={styles.skeletonLine}
        style={{ width: 60, height: 22, borderRadius: 20 }}
      />
    </div>
  );
}

// ─── Card mobile ──────────────────────────────────────────────────────────────

function CardMobile({ atendimento, onSelecionarCliente }) {
  const servicos = atendimento.servicos ?? [];
  const total = somarServicos(servicos);
  const cancelado = atendimento.status === "cancelado";

  return (
    <div className={styles.cardMobile}>
      <div className={styles.cardCentro}>
        <p className={styles.cardCliente}><button className={styles.linkCliente} type="button" onClick={() => onSelecionarCliente(atendimento)} aria-label={`Ver histórico de ${atendimento.cliente_nome}`}>{atendimento.cliente_nome}</button></p>
        <p className={styles.cardServico}>{exibirServicos(atendimento)}</p>
        <p className={styles.cardData}>
          {formatarDataCurta(atendimento.inicio)} ·{" "}
          {formatarHora(atendimento.inicio)}
          {" · "}
          <span
            className={cancelado ? styles.precoRiscado : styles.precoInline}
          >
            {formatarMoeda(total)}
          </span>
        </p>
      </div>
      <div className={styles.cardDireita}>
        <span className={getBadgeClass(atendimento.status, styles)}>
          {STATUS_LABELS[atendimento.status] ?? atendimento.status}
        </span>
      </div>
    </div>
  );
}

// ─── Paginação ────────────────────────────────────────────────────────────────

function Paginacao({ paginaAtual, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null;
  return (
    <nav className="d-flex justify-content-center mt-4" aria-label="Paginação">
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${paginaAtual === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => onChange(paginaAtual - 1)}
            aria-label="Anterior"
          >
            ‹
          </button>
        </li>
        {[...Array(totalPaginas)].map((_, i) => (
          <li
            key={i + 1}
            className={`page-item ${paginaAtual === i + 1 ? "active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => onChange(i + 1)}
              style={
                paginaAtual === i + 1
                  ? {
                      backgroundColor: "var(--primaria)",
                      borderColor: "var(--primaria)",
                      color: "var(--superficie)",
                    }
                  : { color: "var(--primaria)" }
              }
            >
              {i + 1}
            </button>
          </li>
        ))}
        <li
          className={`page-item ${paginaAtual === totalPaginas ? "disabled" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => onChange(paginaAtual + 1)}
            aria-label="Próxima"
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionada, setClienteSelecionada] = useState(null);
  const [filtroServico, setFiltroServico] = useState("");
  const [opcoesServico, setOpcoesServico] = useState([]);
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(() => dataHojeSalao().slice(0, 7));
  const [maisFiltrosAbertos, setMaisFiltrosAbertos] = useState(false);
  const [ordemAsc, setOrdemAsc] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // ── Busca na API ──────────────────────────────────────────────────────────
  const buscarHistorico = useCallback((signal) => {
    const params = new URLSearchParams();
    if (filtroStatus) params.set("status", filtroStatus);
    if (clienteSelecionada) params.set("cliente_id", clienteSelecionada.id);

    const periodoMes = limitesDoMes(mesSelecionado);
    const dataInicio = filtroDataInicio || periodoMes.inicio;
    const dataFim = filtroDataFim || periodoMes.fim;
    if (dataInicio) params.set("inicio", `${dataInicio}T00:00:00.000-03:00`);
    if (dataFim) params.set("fim", `${dataFim}T23:59:59.999-03:00`);

    return fetch(`/api/agendamentos?${params.toString()}`, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAtendimentos(data);
        setPaginaAtual(1);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        console.error("[Histórico]", e);
        setErro("Não foi possível carregar o histórico. Tente novamente.");
      })
      .finally(() => {
        if (!signal.aborted) setCarregando(false);
      });
  }, [filtroStatus, filtroDataInicio, filtroDataFim, mesSelecionado, clienteSelecionada]);

  useEffect(() => {
    const controlador = new AbortController();
    buscarHistorico(controlador.signal);
    return () => controlador.abort();
  }, [buscarHistorico]);

  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/servicos")
      .then((resposta) => resposta.ok ? resposta.json() : [])
      .then((dados) => { if (ativo && Array.isArray(dados)) setOpcoesServico(dados); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  // ── Filtro client-side + ordenação ────────────────────────────────────────
  const servicosDisponiveis = opcoesServico.length ? opcoesServico : [...new Map(
    atendimentos.flatMap((atendimento) => atendimento.servicos ?? [])
      .filter((servico) => servico.servico_id && servico.nome)
      .map((servico) => [servico.servico_id, servico.nome])
  )].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const filtrados = atendimentos
    .filter((a) =>
      (!buscaCliente.trim() || a.cliente_nome?.toLocaleLowerCase("pt-BR").includes(buscaCliente.trim().toLocaleLowerCase("pt-BR"))) &&
      (!filtroServico || a.servicos?.some((servico) => servico.servico_id === filtroServico))
    )
    .sort((a, b) =>
      ordemAsc
        ? new Date(a.inicio) - new Date(b.inicio)
        : new Date(b.inicio) - new Date(a.inicio),
    );

  // ── Paginação ─────────────────────────────────────────────────────────────
  const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensPagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  const temFiltroAtivo =
    clienteSelecionada || filtroStatus || buscaCliente.trim() || filtroServico || filtroDataInicio || filtroDataFim || mesSelecionado !== dataHojeSalao().slice(0, 7);

  function selecionarCliente(atendimento) {
    setCarregando(true);
    setErro(null);
    setClienteSelecionada({ id: atendimento.cliente_id, nome: atendimento.cliente_nome });
    setBuscaCliente("");
    setFiltroServico("");
    setFiltroStatus("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setMesSelecionado("");
    setPaginaAtual(1);
  }

  function limparFiltros() {
    if (clienteSelecionada || filtroStatus || filtroDataInicio || filtroDataFim || mesSelecionado !== dataHojeSalao().slice(0, 7)) {
      setCarregando(true);
      setErro(null);
    }
    setBuscaCliente("");
    setClienteSelecionada(null);
    setFiltroServico("");
    setFiltroStatus("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setMesSelecionado(dataHojeSalao().slice(0, 7));
    setPaginaAtual(1);
  }

  const filtroHojeAtivo = filtroDataInicio === dataHojeSalao() && filtroDataFim === dataHojeSalao();
  const filtrosExtrasAtivos = Boolean(clienteSelecionada || filtroStatus || buscaCliente || filtroServico || ((filtroDataInicio || filtroDataFim) && !filtroHojeAtivo));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className={styles.tituloPagina}>{clienteSelecionada ? `Histórico de ${clienteSelecionada.nome}` : "Histórico"}</h1>
      </div>

      {clienteSelecionada && <button type="button" className={`${styles.btnLimpar} mb-3`} onClick={limparFiltros}>← Voltar ao histórico geral</button>}

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className={`${styles.cardFiltros} mb-4`}>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <label className={styles.labelFiltro} htmlFor="filtro-mes-historico">Mês</label>
            <DatePickerField id="filtro-mes-historico" type="month" className={`form-control ${styles.inputFiltro}`} value={mesSelecionado} onChange={(e) => { setCarregando(true); setErro(null); setMesSelecionado(e.target.value); setFiltroDataInicio(""); setFiltroDataFim(""); setPaginaAtual(1); }} />
          </div>
          <div className="col-6 col-md-2"><button type="button" className={`${styles.btnLimpar} ${filtroHojeAtivo ? styles.btnHojeAtivo : ""} w-100`} aria-pressed={filtroHojeAtivo} onClick={() => { const hoje = dataHojeSalao(); setCarregando(true); setErro(null); setMesSelecionado(hoje.slice(0, 7)); setFiltroDataInicio(hoje); setFiltroDataFim(hoje); setBuscaCliente(""); setClienteSelecionada(null); setFiltroServico(""); setFiltroStatus(""); setPaginaAtual(1); setMaisFiltrosAbertos(false); }}>Hoje</button></div>
          <div className="col-6 col-md-3"><button type="button" className={`${styles.btnLimpar} w-100`} onClick={() => { setOrdemAsc((p) => !p); setPaginaAtual(1); }}>{ordemAsc ? "↑ Antigos primeiro" : "↓ Recentes primeiro"}</button></div>
          <div className="col-12 col-md-2"><button type="button" className={`${styles.btnLimpar} w-100`} aria-expanded={maisFiltrosAbertos} aria-controls="filtrosAvancadosHistorico" onClick={() => setMaisFiltrosAbertos((valor) => !valor)}>{maisFiltrosAbertos ? "Menos opções" : filtrosExtrasAtivos ? "Mais opções •" : "Mais opções"}</button></div>
        </div>
        <div id="filtrosAvancadosHistorico" className={maisFiltrosAbertos ? "row g-2 mt-2" : "d-none"}>
          <div className="col-12 col-md-4">
            <label className={styles.labelFiltro} htmlFor="busca-cliente">
              Cliente
            </label>
            <input
              id="busca-cliente"
              type="search"
              className={`form-control ${styles.inputFiltro}`}
              placeholder="Nome do cliente..."
              disabled={Boolean(clienteSelecionada)}
              value={buscaCliente}
              onChange={(e) => {
                setBuscaCliente(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className={styles.labelFiltro} htmlFor="filtro-servico">Serviço</label>
            <select
              id="filtro-servico"
              className={`form-select ${styles.inputFiltro}`}
              value={filtroServico}
              onChange={(e) => {
                setFiltroServico(e.target.value);
                setPaginaAtual(1);
              }}
            >
              <option value="">Todos os serviços</option>
              {servicosDisponiveis.map((servico) => <option key={servico.id} value={servico.id}>{servico.nome}</option>)}
            </select>
          </div>

          <div className="col-8 col-md-3">
            <label className={styles.labelFiltro} htmlFor="filtro-status">
              Status
            </label>
            <select
              id="filtro-status"
              className={`form-select ${styles.inputFiltro}`}
              value={filtroStatus}
              onChange={(e) => {
                setCarregando(true);
                setErro(null);
                setFiltroStatus(e.target.value);
                setPaginaAtual(1);
              }}
            >
              {STATUS_OPCOES.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-4 col-md-1 d-flex align-items-end">
            <button
              className={`${styles.btnLimpar} w-100`}
              onClick={limparFiltros}
              disabled={!temFiltroAtivo}
              title="Limpar filtros"
            >
              <span className="d-md-none">
                <IcoLixeira />
              </span>
              <span className="d-none d-md-inline">Limpar</span>
            </button>
          </div>

          <div className="col-6 col-md-2">
            <label className={styles.labelFiltro} htmlFor="filtro-de">
              De
            </label>
            <DatePickerField
              id="filtro-de"
              type="date"
              className={`form-control ${styles.inputFiltro}`}
              value={filtroDataInicio}
              onChange={(e) => {
                setCarregando(true);
                setErro(null);
                setMesSelecionado("");
                setFiltroDataInicio(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className={styles.labelFiltro} htmlFor="filtro-ate">
              Até
            </label>
            <DatePickerField
              id="filtro-ate"
              type="date"
              className={`form-control ${styles.inputFiltro}`}
              value={filtroDataFim}
              onChange={(e) => {
                setCarregando(true);
                setErro(null);
                setMesSelecionado("");
                setFiltroDataFim(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

        </div>
      </div>

      {/* ── Erro ──────────────────────────────────────────────────────────── */}
      {erro && (
        <div
          className="rounded-3 py-2 px-3 mb-4 small"
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

      {/* ── Carregando ────────────────────────────────────────────────────── */}
      {carregando && (
        <div aria-busy="true" aria-label="Carregando histórico">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── Vazio ─────────────────────────────────────────────────────────── */}
      {!carregando && !erro && filtrados.length === 0 && (
        <div className={styles.estadoVazio} role="status">
          <IcoHistorico size={40} aria-hidden="true" />
          <p className="mb-1 fw-medium">Nenhum atendimento encontrado</p>
          {temFiltroAtivo && (
            <button className={styles.btnLimpar} onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Conteúdo ──────────────────────────────────────────────────────── */}
      {!carregando && !erro && itensPagina.length > 0 && (
        <>
          {/* MOBILE: cards */}
          <div className="d-md-none">
            {itensPagina.map((a) => (
              <CardMobile key={a.id} atendimento={a} onSelecionarCliente={selecionarCliente} />
            ))}
          </div>

          {/* DESKTOP: tabela */}
          <div className={`${styles.cardTabela} d-none d-md-block`}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className="px-4 py-3 border-0">
                      <button
                        onClick={() => {
                          setOrdemAsc((p) => !p);
                          setPaginaAtual(1);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--fonte-corpo)",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          color: "var(--texto-secundario)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: 0,
                        }}
                        title={
                          ordemAsc
                            ? "Ordenar: mais recente primeiro"
                            : "Ordenar: mais antigo primeiro"
                        }
                      >
                        Data/Hora
                        <span style={{ fontSize: 12 }}>
                          {ordemAsc ? "↑" : "↓"}
                        </span>
                      </button>
                    </th>
                    <th className="py-3 border-0">Cliente</th>
                    <th className="py-3 border-0">Serviço</th>
                    <th className="py-3 border-0">Valor</th>
                    <th className="py-3 border-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((a) => {
                    const servicos = a.servicos ?? [];
                    const total = somarServicos(servicos);
                    const cancelado = a.status === "cancelado";
                    return (
                      <tr key={a.id}>
                        <td className="px-4">
                          <strong className={styles.tdData}>
                            {formatarDataCurta(a.inicio)}
                          </strong>
                          <br />
                          <span className={styles.tdHora}>
                            {formatarHora(a.inicio)}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--fonte-corpo)" }}>
                          <button className={styles.linkCliente} type="button" onClick={() => selecionarCliente(a)} aria-label={`Ver histórico de ${a.cliente_nome}`}>{a.cliente_nome}</button>
                        </td>
                        <td className={styles.tdServico}>
                          {exibirServicos(a)}
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--fonte-corpo)",
                            fontSize: "0.88rem",
                          }}
                        >
                          <span
                            style={
                              cancelado
                                ? {
                                    textDecoration: "line-through",
                                    color: "var(--texto-secundario)",
                                  }
                                : {}
                            }
                          >
                            {formatarMoeda(total)}
                          </span>
                        </td>
                        <td>
                          <span className={getBadgeClass(a.status, styles)}>
                            {STATUS_LABELS[a.status] ?? a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          <Paginacao
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            onChange={setPaginaAtual}
          />

          {/* Contador */}
          <p className={styles.contador}>
            {filtrados.length} atendimento{filtrados.length !== 1 ? "s" : ""}{" "}
            encontrado{filtrados.length !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
