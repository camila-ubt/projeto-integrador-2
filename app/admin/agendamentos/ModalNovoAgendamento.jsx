"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Agendamentos.module.css";
import {
  formatarTelefone,
  formatarDuracao,
  formatarDataCurta,
} from "@/lib/formatters";
import { HORARIOS_ATENDIMENTO } from "@/lib/constantes"
import { IcoFechar } from "@/app/components/icons";
import { aniversarioValido, formatarDiaMesDigitado } from "@/lib/aniversario";
import DatePickerField from "@/app/components/DatePickerField";


// Componente Modal
export default function ModalNovoAgendamento({ aoFechar, aoSalvar }) {
  // ── Clientes ──
  const [buscaCliente, setBuscaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // Criação inline de cliente novo
  const [novoCliente, setNovoCliente] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [telefoneNovo, setTelefoneNovo] = useState("");
  const [aniversarioNovo, setAniversarioNovo] = useState("");

  // ── Serviços ───
  const [servicos, setServicos] = useState([]);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);

  // ── Agendamento ────
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // ── UI ─────
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);

  const buscaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Duração total somada dos serviços selecionados
  const duracaoTotal = servicosSelecionados.reduce((acc, id) => {
    const s = servicos.find((s) => s.id === id);
    return acc + (s?.duracao_minutos ?? 0);
  }, 0);

  // ── Busca de clientes com debounce ────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (buscaCliente.length < 2) {
        setResultadosCliente([]);
        setMostrarDropdown(false);
        return;
      }

      setBuscando(true);
      try {
        const res = await fetch(
          `/api/clientes?busca=${encodeURIComponent(buscaCliente)}`,
        );
        const data = await res.json();
        setResultadosCliente(Array.isArray(data) ? data : []);
        setMostrarDropdown(true);
      } catch {
        setResultadosCliente([]);
      } finally {
        setBuscando(false);
      }
    }, 350); // debounce de 350ms

    return () => clearTimeout(timer);
  }, [buscaCliente]);

  useEffect(() => {
    if (!dataSelecionada) return;

    const buscarSlots = async () => {
      setCarregandoSlots(true);
      setHoraSelecionada(""); // limpa hora ao trocar data
      try {
        const inicioDoDia = `${dataSelecionada}T00:00:00.000Z`;
        const fimDoDia = `${dataSelecionada}T23:59:59.999Z`;
        const res = await fetch(
          `/api/agendamentos?inicio=${inicioDoDia}&fim=${fimDoDia}`,
        );
        const data = await res.json();
        setAgendamentosDoDia(Array.isArray(data) ? data : []);
      } catch {
        setAgendamentosDoDia([]);
      } finally {
        setCarregandoSlots(false);
      }
    };

    buscarSlots();
  }, [dataSelecionada]);

  // ── Carrega serviços ativos uma vez ─────
  useEffect(() => {
    const fetchServicos = async () => {
      try {
        const res = await fetch("/api/servicos");
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      } catch {
        setServicos([]);
      }
    };
    fetchServicos();
  }, []);

  // ── Fecha dropdown ao clicar fora ────
  useEffect(() => {
    function handleClickFora(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buscaRef.current &&
        !buscaRef.current.contains(e.target)
      ) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // ── Selecionar cliente do dropdown ──
  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
    setMostrarDropdown(false);
    setNovoCliente(false);
  }

  // ── Ativar modo "novo cliente" ─────
  function ativarNovoCliente() {
    setNomeNovo(buscaCliente); // pré-preenche com o que foi digitado
    setTelefoneNovo("");
    setAniversarioNovo("");
    setNovoCliente(true);
    setClienteSelecionado(null);
    setMostrarDropdown(false);
  }

  // ── Limpar cliente selecionado ──
  function limparCliente() {
    setClienteSelecionado(null);
    setNovoCliente(false);
    setBuscaCliente("");
    setNomeNovo("");
    setTelefoneNovo("");
    setAniversarioNovo("");
    setTimeout(() => buscaRef.current?.focus(), 50);
  }

  // ── Toggle de serviço ────
  function toggleServico(id) {
    setServicosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  // ── Submissão ─────────
  async function handleSubmit() {
    setErroForm(null);

    // Validações
    if (!clienteSelecionado && !novoCliente) {
      return setErroForm("Selecione ou cadastre um cliente.");
    }
    if (novoCliente && (!nomeNovo.trim() || !telefoneNovo.trim())) {
      return setErroForm("Preencha nome e telefone do novo cliente.");
    }
    if (novoCliente && !aniversarioValido(aniversarioNovo)) {
      return setErroForm("Informe um dia e mês de aniversário válidos.");
    }
    if (servicosSelecionados.length === 0) {
      return setErroForm("Selecione ao menos um serviço.");
    }
    if (!dataSelecionada || !horaSelecionada) {
      return setErroForm("Selecione a data e o horário.");
    }

    setSalvando(true);
    try {
      let clienteId = clienteSelecionado?.id;

      // Cria cliente se for novo
      if (novoCliente) {
        const resCliente = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nomeNovo.trim(),
            telefone: telefoneNovo.trim(),
            aniversario_dia_mes: aniversarioNovo || null,
          }),
        });
        if (!resCliente.ok) {
          const d = await resCliente.json();
          throw new Error(d.error ?? "Erro ao cadastrar cliente.");
        }
        const novoClienteCriado = await resCliente.json();
        clienteId = novoClienteCriado.id;
      }

      // Monta lista de serviços para a API
      const servicosPayload = servicosSelecionados.map((id) => ({
        servico_id: id,
      }));

      // Cria agendamento
      const [ano, mes, dia] = dataSelecionada.split("-").map(Number);
      const [hH, hM] = horaSelecionada.split(":").map(Number);
      const inicioDate = new Date(ano, mes - 1, dia, hH, hM);
      const fimDate = new Date(inicioDate.getTime() + duracaoTotal * 60 * 1000);

      const resAgenda = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          inicio: inicioDate.toISOString(),
          fim: fimDate.toISOString(),
          observacoes: observacoes.trim() || undefined,
          servicos: servicosPayload,
        }),
      });

      if (!resAgenda.ok) {
        const d = await resAgenda.json();
        throw new Error(d.error ?? "Erro ao criar agendamento.");
      }

      const novoAgendamento = await resAgenda.json();
      aoSalvar(novoAgendamento); // avisa o componente pai para atualizar a lista
      aoFechar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  // ── Render ───────────────────
  return (
    <div
      className="modal fade show d-block"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalNovoTitulo"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className={`modal-content ${styles.modalContent}`}>
          {/* ── Cabeçalho ───*/}
          <div className="modal-header border-0 pb-0">
            <h5 className={styles.modalTitulo} id="modalNovoTitulo">
              Novo agendamento
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              disabled={salvando}
              onClick={aoFechar}
            />
          </div>

          {/* ── Corpo ── */}
          <div className="modal-body d-flex flex-column gap-4"
          style={{ overflowY: "auto" }}
          >
            {/* Erro geral */}
            {erroForm && (
              <div
                className="rounded-3 py-2 px-3 small"
                role="alert"
                style={{
                  backgroundColor: "var(--erro-fundo)",
                  color: "var(--erro-texto)",
                  border: "1px solid var(--erro-borda)",
                  fontFamily: "var(--fonte-corpo)",
                }}
              >
                {erroForm}
              </div>
            )}

            {/* ── 1. Cliente ────── */}
            <div>
              <label className={styles.labelFiltro} htmlFor="buscaCliente">
                Cliente
              </label>

              {/* Cliente já selecionado — chip */}
              {clienteSelecionado ? (
                <div className={styles.clienteChip}>
                  <span>
                    <strong>{clienteSelecionado.nome}</strong>
                    {" — "}
                    {formatarTelefone(clienteSelecionado.telefone)}
                  </span>
                  <button
                    type="button"
                    className={styles.btnChipRemover}
                    onClick={limparCliente}
                    aria-label="Remover cliente"
                  >
                    <IcoFechar />
                  </button>
                </div>
              ) : novoCliente ? (
                /* Formulário inline de novo cliente */
                <div
                  className={`${styles.novoClienteBox} d-flex flex-column gap-2`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={styles.labelFiltro} style={{ margin: 0 }}>
                      Novo cliente
                    </span>
                    <button
                      type="button"
                      className={styles.btnChipRemover}
                      onClick={limparCliente}
                    >
                      <IcoFechar /> Cancelar
                    </button>
                  </div>
                  <input
                    type="text"
                    className={`form-control ${styles.inputFiltro}`}
                    placeholder="Nome completo"
                    value={nomeNovo}
                    onChange={(e) => setNomeNovo(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="tel"
                    className={`form-control ${styles.inputFiltro}`}
                    placeholder="Telefone (WhatsApp)"
                    value={telefoneNovo}
                    onChange={(e) =>
                      setTelefoneNovo(formatarTelefone(e.target.value))
                    }
                  />
                  <label className={styles.labelFiltro} htmlFor="aniversarioNovo">Aniversário (dia e mês, opcional)</label>
                  <input
                    id="aniversarioNovo"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="DD/MM"
                    className={`form-control ${styles.inputFiltro}`}
                    value={aniversarioNovo}
                    onChange={(e) => setAniversarioNovo(formatarDiaMesDigitado(e.target.value))}
                  />
                </div>
              ) : (
                /* Campo de busca com dropdown */
                <div style={{ position: "relative" }}>
                  <input
                    ref={buscaRef}
                    id="buscaCliente"
                    type="text"
                    className={`form-control ${styles.inputFiltro}`}
                    placeholder="Digite o nome ou telefone..."
                    value={buscaCliente}
                    onChange={(e) => {
                      setBuscaCliente(e.target.value);
                      setClienteSelecionado(null);
                    }}
                    onFocus={() =>
                      buscaCliente.length >= 2 && setMostrarDropdown(true)
                    }
                    autoComplete="off"
                  />

                  {/* Dropdown de resultados */}
                  {mostrarDropdown && (
                    <div ref={dropdownRef} className={styles.dropdownCliente}>
                      {buscando ? (
                        <div
                          className={styles.dropdownItem}
                          style={{ color: "var(--texto-secundario)" }}
                        >
                          Buscando...
                        </div>
                      ) : resultadosCliente.length > 0 ? (
                        <>
                          {resultadosCliente.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={styles.dropdownItem}
                              onClick={() => selecionarCliente(c)}
                            >
                              <span style={{ fontWeight: 500 }}>{c.nome}</span>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--texto-secundario)",
                                }}
                              >
                                {c.telefone}
                              </span>
                            </button>
                          ))}
                          {/* Sempre mostra opção de cadastrar novo mesmo com resultados */}
                          <button
                            type="button"
                            className={`${styles.dropdownItem} ${styles.dropdownItemNovo}`}
                            onClick={ativarNovoCliente}
                          >
                            + Cadastrar novo cliente
                          </button>
                        </>
                      ) : (
                        <div className={styles.dropdownVazio}>
                          <p>Nenhum cliente encontrado.</p>
                          <button
                            type="button"
                            className={styles.btnNovoClienteInline}
                            onClick={ativarNovoCliente}
                          >
                            + Cadastrar &quot;{buscaCliente}&quot;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 2. Serviços ────────────── */}
            <div>
              <label className={styles.labelFiltro}>
                Serviço(s)
                {duracaoTotal > 0 && (
                  <span
                    style={{
                      marginLeft: "8px",
                      color: "var(--primaria)",
                      fontWeight: 500,
                    }}
                  >
                    — {formatarDuracao(duracaoTotal)} no total
                  </span>
                )}
              </label>

              {servicos.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--texto-secundario)",
                    fontFamily: "var(--fonte-corpo)",
                  }}
                >
                  Carregando serviços...
                </p>
              ) : (
                <div className={styles.listaServicos}>
                  {servicos.map((s) => {
                    const selecionado = servicosSelecionados.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`${styles.cardServico} ${selecionado ? styles.cardServicoAtivo : ""}`}
                        onClick={() => toggleServico(s.id)}
                        aria-pressed={selecionado}
                      >
                        <span className={styles.cardServicoNome}>{s.nome}</span>
                        <div className={styles.cardServicoInfo}>
                          {s.duracao_minutos && (
                            <span>{formatarDuracao(s.duracao_minutos)}</span>
                          )}
                          {s.preco_padrao && (
                            <span>
                              R${" "}
                              {Number(s.preco_padrao)
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>
                          )}
                        </div>
                        {selecionado && (
                          <span className={styles.cardServicoCheck}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 3. Data e Hora ──────── */}
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <label className={styles.labelFiltro} htmlFor="dataSelecionada">
                  Data
                </label>
                <DatePickerField
                  id="dataSelecionada"
                  type="date"
                  className={`form-control ${styles.inputFiltro}`}
                  value={dataSelecionada}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                />
              </div>

              {/* Grade de slots — aparece só após escolher data */}
              {dataSelecionada && (
                <div>
                  <label className={styles.labelFiltro}>
                    Horário disponível
                    {duracaoTotal > 0 && (
                      <span
                        style={{
                          marginLeft: "6px",
                          color: "var(--texto-secundario)",
                          fontWeight: 400,
                        }}
                      >
                        (blocos de {formatarDuracao(duracaoTotal)})
                      </span>
                    )}
                  </label>

                  {carregandoSlots ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--texto-secundario)",
                        fontFamily: "var(--fonte-corpo)",
                      }}
                    >
                      Verificando disponibilidade...
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "8px",
                      }}
                    >
                      {HORARIOS_ATENDIMENTO.map((h) => {
                        const [hH, hM] = h.split(":").map(Number);
                        const [ano, mes, dia] = dataSelecionada
                          .split("-")
                          .map(Number);
                        const inicioDesejado = new Date(
                          ano,
                          mes - 1,
                          dia,
                          hH,
                          hM,
                        );
                        const fimDesejado = new Date(
                          inicioDesejado.getTime() + duracaoTotal * 60 * 1000,
                        );
                        const agora = new Date();
                        const jaPassou = inicioDesejado < agora;

                        const ocupado =
                          jaPassou ||
                          agendamentosDoDia.some((ag) => {
                            const inicioAg = new Date(ag.inicio);
                            const fimAg = new Date(ag.fim);
                            return (
                              inicioDesejado < fimAg && fimDesejado > inicioAg
                            );
                          });

                        const selecionado = horaSelecionada === h;

                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={ocupado}
                            onClick={() => setHoraSelecionada(h)}
                            className={styles.slotHorario}
                            style={{
                              borderColor: ocupado
                                ? "var(--borda-escura)"
                                : selecionado
                                  ? "var(--primaria)"
                                  : "var(--borda)",
                              backgroundColor: ocupado
                                ? "transparent"
                                : selecionado
                                  ? "var(--primaria-clara)"
                                  : "var(--superficie)",
                              color: ocupado
                                ? "var(--texto-secundario)"
                                : selecionado
                                  ? "var(--primaria)"
                                  : "var(--texto-principal)",
                              fontWeight: selecionado ? 600 : 400,
                              cursor: ocupado ? "not-allowed" : "pointer",
                              textDecoration: ocupado ? "line-through" : "none",
                              opacity: ocupado ? 0.4 : 1,
                            }}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 4. Observações ────────── */}
            <div>
              <label className={styles.labelFiltro} htmlFor="observacoesInput">
                Observações <span style={{ opacity: 0.6 }}>(opcional)</span>
              </label>
              <textarea
                id="observacoesInput"
                className={`form-control ${styles.inputFiltro}`}
                rows={2}
                placeholder="Alguma observação sobre este atendimento..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            {/* ── Resumo ───────────── */}
            {(clienteSelecionado || (novoCliente && nomeNovo)) &&
              servicosSelecionados.length > 0 &&
              dataSelecionada &&
              horaSelecionada && (
                <div className={styles.resumoAgendamento}>
                  <p className={styles.resumoTitulo}>Resumo</p>
                  <p className={styles.resumoLinha}>
                    <span>Cliente</span>
                    <strong>{clienteSelecionado?.nome ?? nomeNovo}</strong>
                  </p>
                  <p className={styles.resumoLinha}>
                    <span>Serviço(s)</span>
                    <strong>
                      {servicosSelecionados
                        .map((id) => servicos.find((s) => s.id === id)?.nome)
                        .join(", ")}
                    </strong>
                  </p>
                  <p className={styles.resumoLinha}>
                    <span>Início</span>
                    <strong>
                      {formatarDataCurta(dataSelecionada)} às {horaSelecionada}
                    </strong>
                  </p>
                  <p className={styles.resumoLinha}>
                    <span>Duração</span>
                    <strong>{formatarDuracao(duracaoTotal)}</strong>
                  </p>
                </div>
              )}
          </div>

          {/* ── Rodapé ────────── */}
          <div className="modal-footer border-0 pt-0 gap-2">
            <button
              className={styles.btnLimpar}
              disabled={salvando}
              onClick={aoFechar}
            >
              Cancelar
            </button>
            <button
              className="btn-primario"
              disabled={salvando}
              style={{ opacity: salvando ? 0.6 : 1 }}
              onClick={handleSubmit}
            >
              {salvando ? "Salvando..." : "Criar agendamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
