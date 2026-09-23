"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatarDataCurta, formatarHora } from "@/lib/formatters";
import DatePickerField from "@/app/components/DatePickerField";
import {
  IcoAgendamentos,
  IcoEditar,
  
  IcoLixeira
} from "@/app/components/icons";
import { HORARIOS_ATENDIMENTO } from "@/lib/constantes";
import styles from "./Agendamentos.module.css";
import ModalNovoAgendamento from "./ModalNovoAgendamento";

function dataNoFusoDoSalao(valor) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(valor)).map(({ type, value }) => [type, value])
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
}

function camposDoAgendamento(agenda) {
  const inicioDate = new Date(agenda.inicio);
  return {
    status: agenda.status ?? "",
    observacoes: agenda.observacoes ?? "",
    data: inicioDate.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }),
    hora: inicioDate.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  };
}

function dataSugeridaRetorno(agenda, servico, dataAtendimento) {
  const existente = agenda.retornos?.find((retorno) => retorno.servico_id === servico?.servico_id);
  if (existente) return String(existente.data_recomendada).slice(0, 10);
  if (servico?.retorno_dias == null || !dataAtendimento) return "";

  const data = new Date(`${dataAtendimento}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + Number(servico.retorno_dias));
  return data.toISOString().slice(0, 10);
}

function dadosIniciaisRetorno(agenda) {
  const servico = agenda.servicos?.find((item) => item.retorno_dias != null) || agenda.servicos?.[0];
  return {
    servico_id: servico?.servico_id || "",
    data_recomendada: dataSugeridaRetorno(agenda, servico, camposDoAgendamento(agenda).data),
    observacoes: "",
  };
}

export default function Agendamentos() {
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);
  const [carregandoHorarios, setcarregandoHorarios] = useState(false);
  const [agendamentos, setAgendamentos] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroServico, setFiltroServico] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [mesInicial, setMesInicial] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [dataHojeAplicada, setDataHojeAplicada] = useState("");
  const [maisFiltrosAbertos, setMaisFiltrosAbertos] = useState(false);
  const [ordemAsc, setOrdemAsc] = useState(false);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Modal de confirmação de cancelamento e edição
  const [modalDeletar, setModalDeletar] = useState({
    aberto: false,
    agenda: null,
  });
  const [modalEditar, setModalEditar] = useState({
    aberto: false,
    agenda: null,
  });
  const [modalDetalhe, setModalDetalhe] = useState({ aberto: false, agenda: null });
  const [editando, setEditando] = useState(false);
  const [atualizandoStatusRapido, setAtualizandoStatusRapido] = useState(false);
  const [erroStatusRapido, setErroStatusRapido] = useState("");
  const [sucessoStatusRapido, setSucessoStatusRapido] = useState("");
  const [retornoPlanejado, setRetornoPlanejado] = useState(false);
  const [dadosRetorno, setDadosRetorno] = useState({ servico_id: "", data_recomendada: "", observacoes: "" });
  const [retornoDataManual, setRetornoDataManual] = useState(false);
  const [erroRetorno, setErroRetorno] = useState("");
  const [camposEdicao, setCamposEdicao] = useState({
    status: "",
    observacoes: "",
  });

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const res = await fetch("/api/agendamentos");
        if (!res.ok) throw new Error("Erro ao buscar agendamentos");
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        const mesAtual = dataNoFusoDoSalao(Date.now()).slice(0, 7);
        setMesInicial(mesAtual);
        setAgendamentos(lista);
        const idDoLink = new URLSearchParams(window.location.search).get("agendamento_id");
        const agendaDoLink = lista.find((item) => item.id === idDoLink);
        setMesSelecionado(agendaDoLink ? dataNoFusoDoSalao(agendaDoLink.inicio).slice(0, 7) : mesAtual);
        if (idDoLink) {
          const agenda = agendaDoLink;
          if (agenda) {
            setFeedback(null);
            setErroStatusRapido("");
            setSucessoStatusRapido("");
            setModalDetalhe({ aberto: true, agenda });
          } else {
            setErro("O agendamento selecionado não foi encontrado.");
          }
        }
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
        setErro("Não foi possível carregar os agendamentos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgendamentos();
  }, []);

  useEffect(() => {
    if (!camposEdicao.data) return;

    const buscarHorarios = async () => {
      setcarregandoHorarios(true);
      try {
        const inicioDoDia = `${camposEdicao.data}T00:00:00.000Z`;
        const fimDoDia = `${camposEdicao.data}T23:59:59.999Z`;
        const res = await fetch(
          `/api/agendamentos?inicio=${inicioDoDia}&fim=${fimDoDia}`,
        );
        const data = await res.json();
        // Exclui o próprio agendamento sendo editado da lista de ocupados
        setAgendamentosDoDia(
          Array.isArray(data)
            ? data.filter((a) => a.id !== modalEditar.agenda?.id)
            : [],
        );
      } catch {
        setAgendamentosDoDia([]);
      } finally {
        setcarregandoHorarios(false);
      }
    };

    buscarHorarios();
  }, [camposEdicao.data, modalEditar.agenda?.id]);

  const exibirServicos = (agenda) => {
    if (!agenda.servicos) return "—";
    if (Array.isArray(agenda.servicos))
      return agenda.servicos.map((s) => s.nome).join(", ");
    return agenda.servicos;
  };

  const getBadgeClass = (status) => {
    const map = {
      agendado: styles.statusAgendado,
      realizado: styles.statusRealizado,
      cancelado: styles.statusCancelado,
      faltou: styles.statusFaltou,
    };
    return `${styles.badgeStatus} ${map[status?.toLowerCase()] || ""}`;
  };

  const getLabelStatus = (status) => {
    const labels = {
      agendado: "Agendado",
      realizado: "Realizado",
      cancelado: "Cancelado",
      faltou: "Faltou",
    };
    return labels[status?.toLowerCase()] || status;
  };

  const servicosDisponiveis = [...new Map(
    agendamentos.flatMap((agenda) => agenda.servicos ?? [])
      .filter((servico) => servico.servico_id && servico.nome)
      .map((servico) => [servico.servico_id, servico.nome])
  )].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const filtroHojeAtivo = Boolean(dataHojeAplicada) && filtroDataInicio === dataHojeAplicada && filtroDataFim === dataHojeAplicada && !filtroCliente && !filtroServico && !filtroStatus;
  const filtrosExtrasAtivos = Boolean(filtroCliente || filtroServico || filtroStatus || ((filtroDataInicio || filtroDataFim) && !filtroHojeAtivo));

  // Filtragem
  const agendamentosFiltrados = agendamentos.filter((agenda) => {
    const matchCliente = agenda.cliente_nome
      ?.toLowerCase()
      .includes(filtroCliente.toLowerCase());
    const matchStatus = filtroStatus === "" || agenda.status === filtroStatus;
    const matchServico = !filtroServico || agenda.servicos?.some((servico) => servico.servico_id === filtroServico);

    let matchData = true;
    if (mesSelecionado || filtroDataInicio || filtroDataFim) {
      const dataAgenda = dataNoFusoDoSalao(agenda.inicio);
      if (mesSelecionado && dataAgenda.slice(0, 7) !== mesSelecionado) matchData = false;
      if (filtroDataInicio && dataAgenda < filtroDataInicio) matchData = false;
      if (filtroDataFim && dataAgenda > filtroDataFim) matchData = false;
    }

    return matchCliente && matchServico && matchStatus && matchData;
  });

  const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) =>
    ordemAsc
      ? new Date(a.inicio) - new Date(b.inicio)
      : new Date(b.inicio) - new Date(a.inicio),
  );

  // Paginação
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const itensAtuais = agendamentosOrdenados.slice(
    indicePrimeiroItem,
    indiceUltimoItem,
  );
  const totalPaginas = Math.ceil(agendamentosOrdenados.length / itensPorPagina);

  const temFiltroAtivo =
    filtroCliente || filtroServico || filtroStatus || filtroDataInicio || filtroDataFim || mesSelecionado !== mesInicial;
  const servicoRetornoSelecionado = modalEditar.agenda?.servicos?.find(
    (item) => item.servico_id === dadosRetorno.servico_id
  );

  const limparFiltros = () => {
    setFiltroCliente("");
    setFiltroServico("");
    setFiltroStatus("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setMesSelecionado(dataNoFusoDoSalao(Date.now()).slice(0, 7));
    setDataHojeAplicada("");
    setMaisFiltrosAbertos(false);
    setPaginaAtual(1);
  };

  const [deletando, setDeletando] = useState(false);

  const handleDeletar = (agenda) => {
    setModalDeletar({ aberto: true, agenda });
  };

  const confirmarDeletar = async () => {
    setDeletando(true);
    try {
      const res = await fetch(`/api/agendamentos/${modalDeletar.agenda.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao excluir agendamento.");
      }

      // Remove da lista local sem precisar recarregar a página
      setAgendamentos((prev) =>
        prev.filter((a) => a.id !== modalDeletar.agenda.id),
      );
      setFeedback({
        tipo: "sucesso",
        msg: "Agendamento excluído com sucesso.",
      });
    } catch (err) {
      setFeedback({ tipo: "erro", msg: err.message });
    } finally {
      setDeletando(false);
      setModalDeletar({ aberto: false, agenda: null });
      // Limpa o feedback após 4 segundos
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleEditar = (agenda) => {
    setFeedback(null);
    setCamposEdicao(camposDoAgendamento(agenda));
    setRetornoPlanejado(false);
    setErroRetorno("");
    setDadosRetorno(dadosIniciaisRetorno(agenda));
    setRetornoDataManual(false);
    setModalEditar({ aberto: true, agenda });
  };

  const fecharDetalhe = () => {
    setModalDetalhe({ aberto: false, agenda: null });
    const params = new URLSearchParams(window.location.search);
    params.delete("agendamento_id");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };

  const atualizarStatusRapido = async (status) => {
    const agenda = modalDetalhe.agenda;
    if (!agenda || agenda.status === status || atualizandoStatusRapido) return;
    setAtualizandoStatusRapido(true);
    setErroStatusRapido("");
    setSucessoStatusRapido("");
    try {
      const resposta = await fetch(`/api/agendamentos/${agenda.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json();
        throw new Error(dados.error || "Não foi possível atualizar o status.");
      }
      const atualizado = await resposta.json();
      const agendaAtualizada = { ...agenda, status: atualizado.status ?? status };
      setAgendamentos((atuais) => atuais.map((item) => item.id === agenda.id ? { ...item, status } : item));
      setModalDetalhe((atual) => ({ ...atual, agenda: agendaAtualizada }));
      setSucessoStatusRapido(status === "realizado"
        ? "Atendimento concluído; o Caixa foi atualizado automaticamente."
        : "Status atualizado.");
    } catch (error) {
      setErroStatusRapido(error.message || "Não foi possível atualizar o status.");
    } finally {
      setAtualizandoStatusRapido(false);
    }
  };

  const editarDoDetalhe = () => {
    const agenda = modalDetalhe.agenda;
    fecharDetalhe();
    if (agenda) handleEditar(agenda);
  };

  const confirmarEdicao = async () => {
    if (retornoPlanejado && (!dadosRetorno.servico_id || !dadosRetorno.data_recomendada)) {
      setErroRetorno("Escolha o serviço e a data do retorno.");
      return;
    }
    setErroRetorno("");
    setEditando(true);
    const [ano, mes, dia] = camposEdicao.data.split("-").map(Number);
    const [hH, hM] = camposEdicao.hora.split(":").map(Number);
    const inicioDate = new Date(ano, mes - 1, dia, hH, hM);

    try {
      const res = await fetch(`/api/agendamentos/${modalEditar.agenda.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inicio: inicioDate.toISOString(),
          status: camposEdicao.status || undefined,
          observacoes: camposEdicao.observacoes || undefined,
          retorno: retornoPlanejado ? dadosRetorno : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao atualizar agendamento.");
      }

      const atualizado = await res.json();

      try {
        const res = await fetch("/api/agendamentos");
        const data = await res.json();
        setAgendamentos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Lista não atualizada após editar agendamento:", err);
      }

      setFeedback({
        tipo: "sucesso",
        msg: camposEdicao.status === "realizado"
          ? atualizado.retornos?.length
            ? `Atendimento realizado. ${atualizado.retornos.length} retorno(s) para acompanhar.`
            : "Atendimento realizado. Nenhum retorno automático foi criado; você pode planejar um ao editar o atendimento."
          : "Agendamento atualizado com sucesso.",
        agendamentoId: camposEdicao.status === "realizado" ? modalEditar.agenda.id : null,
      });
      setModalEditar({ aberto: false, agenda: null });
    } catch (err) {
      setFeedback({ tipo: "erro", msg: err.message });
    } finally {
      setEditando(false);
      setTimeout(() => setFeedback(null), camposEdicao.status === "realizado" ? 12000 : 4000);
    }
  };

  const aoSalvarNovo = async () => {
    try {
      const res = await fetch("/api/agendamentos");
      const data = await res.json();
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch {}
    setFeedback({ tipo: "sucesso", msg: "Agendamento criado com sucesso." });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* ── Cabeçalho ──────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className={styles.tituloPagina}>Agendamentos</h1>

        {/* Mobile: só ícone  */}
        <button
          className={`btn-primario d-flex d-md-none align-items-center justify-content-center ${styles.btnNovoIcone}`}
          aria-label="Novo agendamento"
          title="Novo agendamento"
          onClick={() => setModalNovo(true)}
        >
          <IcoAgendamentos size={18} />
        </button>

        {/* Desktop: botão com texto completo */}
        <button
          className="btn-primario d-none d-md-flex align-items-center gap-2"
          aria-label="Novo agendamento"
          title="Novo agendamento"
          onClick={() => setModalNovo(true)}
        >
          <IcoAgendamentos size={18} />
          Novo Agendamento
        </button>
      </div>
      {/* ── Filtros ─────── */}
      <div className={`${styles.cardFiltros} mb-4`}>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <label className={styles.labelFiltro} htmlFor="filtroMesAgendamento">Mês</label>
            <DatePickerField
              id="filtroMesAgendamento"
              type="month"
              className={`form-control ${styles.inputFiltro}`}
              value={mesSelecionado}
              onChange={(e) => {
                setMesSelecionado(e.target.value);
                setFiltroDataInicio("");
                setFiltroDataFim("");
                setDataHojeAplicada("");
                setMaisFiltrosAbertos(false);
                setPaginaAtual(1);
              }}
            />
          </div>

          <div className="col-6 col-md-2">
            <button
              type="button"
              className={`${styles.btnLimpar} ${filtroHojeAtivo ? styles.btnHojeAtivo : ""} w-100`}
              aria-pressed={filtroHojeAtivo}
              onClick={() => {
                const dataHoje = dataNoFusoDoSalao(Date.now());
                setFiltroCliente("");
                setFiltroServico("");
                setFiltroStatus("");
                setMesSelecionado(dataHoje.slice(0, 7));
                setFiltroDataInicio(dataHoje);
                setFiltroDataFim(dataHoje);
                setDataHojeAplicada(dataHoje);
                setMaisFiltrosAbertos(false);
                setPaginaAtual(1);
              }}
            >
              Hoje
            </button>
          </div>

          <div className="col-6 col-md-3">
            <button
              type="button"
              className={`${styles.btnLimpar} w-100`}
              onClick={() => setOrdemAsc((prev) => !prev)}
              aria-label={ordemAsc ? "Ordenação: mais antigo primeiro" : "Ordenação: mais recente primeiro"}
            >
              {ordemAsc ? "↑ Antigos primeiro" : "↓ Recentes primeiro"}
            </button>
          </div>

          <div className="col-12 col-md-2">
            <button
              type="button"
              className={`${styles.btnLimpar} w-100`}
              aria-expanded={maisFiltrosAbertos}
              aria-controls="filtrosAvancadosAgendamento"
              aria-label={filtrosExtrasAtivos && !maisFiltrosAbertos ? "Mais opções, filtros ativos" : undefined}
              onClick={() => setMaisFiltrosAbertos((aberto) => !aberto)}
            >
              {maisFiltrosAbertos ? "Menos opções" : filtrosExtrasAtivos ? "Mais opções •" : "Mais opções"}
            </button>
          </div>
        </div>

        {!maisFiltrosAbertos && !mesSelecionado && !filtroHojeAtivo && (filtroDataInicio || filtroDataFim) && (
          <p className={styles.resumoPeriodo}>Período: {formatarDataCurta(filtroDataInicio) || "início livre"} até {formatarDataCurta(filtroDataFim) || "fim livre"}</p>
        )}

        <div id="filtrosAvancadosAgendamento" className={maisFiltrosAbertos ? "row g-2 mt-2" : "d-none"}>
          <div className="col-12 col-md-4">
            <label className={styles.labelFiltro} htmlFor="filtroClienteAgendamento">Cliente</label>
            <input
              id="filtroClienteAgendamento"
              type="search"
              className={`form-control ${styles.inputFiltro}`}
              placeholder="Nome da cliente..."
              value={filtroCliente}
              onChange={(e) => {
                setFiltroCliente(e.target.value);
                setPaginaAtual(1);
              }}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className={styles.labelFiltro} htmlFor="filtroServicoAgendamento">Serviço</label>
            <select id="filtroServicoAgendamento" className={`form-select ${styles.inputFiltro}`} value={filtroServico} onChange={(e) => { setFiltroServico(e.target.value); setPaginaAtual(1); }}>
              <option value="">Todos os serviços</option>
              {servicosDisponiveis.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className={styles.labelFiltro} htmlFor="filtroStatusAgendamento">Status</label>
            <select id="filtroStatusAgendamento" className={`form-select ${styles.inputFiltro}`} value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value); setPaginaAtual(1); }}>
              <option value="">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
              <option value="faltou">Faltou</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className={styles.labelFiltro} htmlFor="filtroDataInicioAgendamento">De</label>
            <DatePickerField id="filtroDataInicioAgendamento" className={`form-control ${styles.inputFiltro}`} value={filtroDataInicio} onChange={(e) => { setMesSelecionado(""); setFiltroDataInicio(e.target.value); setDataHojeAplicada(""); setPaginaAtual(1); }} />
          </div>

          <div className="col-6 col-md-3">
            <label className={styles.labelFiltro} htmlFor="filtroDataFimAgendamento">Até</label>
            <DatePickerField id="filtroDataFimAgendamento" className={`form-control ${styles.inputFiltro}`} value={filtroDataFim} onChange={(e) => { setMesSelecionado(""); setFiltroDataFim(e.target.value); setDataHojeAplicada(""); setPaginaAtual(1); }} />
          </div>

          <div className="col-12 col-md-2 d-flex align-items-end">
            <button type="button" className={`${styles.btnLimpar} w-100`} onClick={limparFiltros} disabled={!temFiltroAtivo}>Limpar filtros</button>
          </div>
        </div>
      </div>

      {/* ── Erro de carregamento ─────── */}
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
      {feedback && (
        <div
          className="rounded-3 py-2 px-3 mb-4 small"
          role="alert"
          style={{
            backgroundColor:
              feedback.tipo === "sucesso"
                ? "var(--sucesso-fundo)"
                : "var(--erro-fundo)",
            color:
              feedback.tipo === "sucesso"
                ? "var(--sucesso-texto)"
                : "var(--erro-texto)",
            border: `1px solid ${feedback.tipo === "sucesso" ? "var(--sucesso-texto)" : "var(--erro-borda)"}`,
            fontFamily: "var(--fonte-corpo)",
          }}
        >
          {feedback.msg}
          {feedback.agendamentoId && <Link className="ms-2" href={`/admin/retornos?agendamento_id=${feedback.agendamentoId}`}>Ver retornos</Link>}
        </div>
      )}
      {/* ── Loading ───────── */}
      {loading ? (
        <div className={styles.loadingState}>
          <div
            className="spinner-border spinner-border-sm text-secondary me-2"
            role="status"
          />
          Carregando agendamentos...
        </div>
      ) : agendamentosFiltrados.length === 0 ? (
        /* ── Estado vazio ───────── */
        <div className={styles.estadoVazio}>
          <IcoAgendamentos size={40} />
          <p className="mb-1 fw-medium">Nenhum agendamento encontrado</p>
          {temFiltroAtivo && (
            <button className={styles.btnLimpar} onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="d-md-none">
            {itensAtuais.map((agenda) => (
              <div key={agenda.id} className={styles.cardMobile}>
                <span className={styles.cardHoraDestaque}>
                  {formatarHora(agenda.inicio)}
                </span>

                <div className={styles.cardCentro}>
                  <p className={styles.cardCliente}>
                    <Link className={styles.linkCliente} href={`/admin/clientes?cliente_id=${agenda.cliente_id}`} aria-label={`Ver dados de ${agenda.cliente_nome}`}>
                      {agenda.cliente_nome}
                    </Link>
                  </p>
                  <p className={styles.cardServico}>{exibirServicos(agenda)}</p>
                  <p className={styles.cardData}>
                    {formatarDataCurta(agenda.inicio)}
                  </p>
                </div>

                <div className={styles.cardDireita}>
                  <span className={getBadgeClass(agenda.status)}>
                    {getLabelStatus(agenda.status)}
                  </span>
                  <div className={styles.cardAcoes}>
                    <button
                      className={styles.btnIcone}
                      title="Editar agendamento"
                      aria-label="Editar agendamento"
                      onClick={() => handleEditar(agenda)}
                    >
                      <IcoEditar />
                    </button>
                    {agenda.status !== "cancelado" && (
                      <button
                        className={styles.btnIconePerigo}
                        onClick={() => handleDeletar(agenda)}
                        title="Deletar agendamento"
                        aria-label="Deletar agendamento"
                      >
                        <IcoLixeira />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.cardTabela} d-none d-md-block`}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className="px-4 py-3 border-0">Data/Hora</th>
                    <th className="py-3 border-0">Cliente</th>
                    <th className="py-3 border-0">Serviço</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="text-end px-4 py-3 border-0">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensAtuais.map((agenda) => (
                    <tr key={agenda.id}>
                      <td className="px-4">
                        <strong className={styles.tdData}>
                          {formatarDataCurta(agenda.inicio)}
                        </strong>
                        <br />
                        <span className={styles.tdHora}>
                          {formatarHora(agenda.inicio)}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--fonte-corpo)" }}>
                        <Link className={styles.linkCliente} href={`/admin/clientes?cliente_id=${agenda.cliente_id}`} aria-label={`Ver dados de ${agenda.cliente_nome}`}>
                          {agenda.cliente_nome}
                        </Link>
                      </td>
                      <td className={styles.tdServico}>
                        {exibirServicos(agenda)}
                      </td>
                      <td>
                        <span className={getBadgeClass(agenda.status)}>
                          {getLabelStatus(agenda.status)}
                        </span>
                      </td>
                      {/* Ações: botões ícone na tabela também */}
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className={styles.btnIcone}
                            title="Editar agendamento"
                            aria-label="Editar agendamento"
                            onClick={() => handleEditar(agenda)}
                          >
                            <IcoEditar />
                          </button>
                          {agenda.status !== "cancelado" && (
                            <button
                              className={styles.btnIconePerigo}
                              onClick={() => handleDeletar(agenda)}
                              title="Deletar agendamento"
                              aria-label="Deletar agendamento"
                            >
                              <IcoLixeira />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="card-footer bg-white border-top-0 py-3 d-flex justify-content-center">
                <nav aria-label="Paginação de agendamentos">
                  <ul className="pagination mb-0">
                    <li
                      className={`page-item ${paginaAtual === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaAtual(paginaAtual - 1)}
                        aria-label="Página anterior"
                      >
                        ‹
                      </button>
                    </li>
                    {[...Array(totalPaginas)].map((_, index) => (
                      <li
                        key={index + 1}
                        className={`page-item ${paginaAtual === index + 1 ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPaginaAtual(index + 1)}
                          style={
                            paginaAtual === index + 1
                              ? {
                                  backgroundColor: "var(--primaria)",
                                  borderColor: "var(--primaria)",
                                  color: "var(--superficie)",
                                }
                              : { color: "var(--primaria)" }
                          }
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li
                      className={`page-item ${paginaAtual === totalPaginas ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaAtual(paginaAtual + 1)}
                        aria-label="Próxima página"
                      >
                        ›
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>

          {/* Paginação mobile  */}
          {totalPaginas > 1 && (
            <div className="d-flex d-md-none justify-content-center mt-3">
              <nav aria-label="Paginação">
                <ul className="pagination pagination-sm mb-0">
                  <li
                    className={`page-item ${paginaAtual === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPaginaAtual(paginaAtual - 1)}
                    >
                      ‹
                    </button>
                  </li>
                  {[...Array(totalPaginas)].map((_, index) => (
                    <li
                      key={index + 1}
                      className={`page-item ${paginaAtual === index + 1 ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaAtual(index + 1)}
                        style={
                          paginaAtual === index + 1
                            ? {
                                backgroundColor: "var(--primaria)",
                                borderColor: "var(--primaria)",
                                color: "var(--superficie)",
                              }
                            : { color: "var(--primaria)" }
                        }
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${paginaAtual === totalPaginas ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPaginaAtual(paginaAtual + 1)}
                    >
                      ›
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
      {modalDetalhe.aberto && modalDetalhe.agenda && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalDetalheTitulo"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h2 className={styles.modalTitulo} id="modalDetalheTitulo">Resumo do agendamento</h2>
                <button type="button" className="btn-close" aria-label="Fechar resumo" onClick={fecharDetalhe} />
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <div className={styles.detalheAgendamento}>
                  <strong>
                    <Link className={styles.linkCliente} href={`/admin/clientes?cliente_id=${modalDetalhe.agenda.cliente_id}`}>
                      {modalDetalhe.agenda.cliente_nome}
                    </Link>
                  </strong>
                  <span>{formatarDataCurta(modalDetalhe.agenda.inicio)} às {formatarHora(modalDetalhe.agenda.inicio)}</span>
                  <span>{exibirServicos(modalDetalhe.agenda)}</span>
                  {modalDetalhe.agenda.observacoes && <small>{modalDetalhe.agenda.observacoes}</small>}
                  <span className={getBadgeClass(modalDetalhe.agenda.status)}>{getLabelStatus(modalDetalhe.agenda.status)}</span>
                </div>
                <div>
                  <p className={styles.labelFiltro}>Atualizar status</p>
                  <div className={styles.acoesStatusRapido}>
                    {[
                      { valor: "agendado", rotulo: "Agendado" },
                      { valor: "realizado", rotulo: "Realizado" },
                      { valor: "cancelado", rotulo: "Cancelado" },
                      { valor: "faltou", rotulo: "Faltou" },
                    ].map((opcao) => (
                      <button
                        key={opcao.valor}
                        type="button"
                        className={`${styles.botaoStatusRapido} ${modalDetalhe.agenda.status === opcao.valor ? styles.statusRapidoAtivo : ""}`}
                        aria-pressed={modalDetalhe.agenda.status === opcao.valor}
                        disabled={atualizandoStatusRapido || modalDetalhe.agenda.status === opcao.valor}
                        onClick={() => atualizarStatusRapido(opcao.valor)}
                      >
                        {opcao.rotulo}
                      </button>
                    ))}
                  </div>
                  {atualizandoStatusRapido && <p className={styles.feedbackStatusRapido} role="status">Salvando status…</p>}
                  {erroStatusRapido && <p className={styles.erroStatusRapido} role="alert">{erroStatusRapido}</p>}
                  {sucessoStatusRapido && <p className={styles.feedbackStatusRapido} role="status">{sucessoStatusRapido}</p>}
                  <p className={styles.dicaStatusRapido}>Ao marcar como realizado, o Caixa é atualizado automaticamente.</p>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 gap-2">
                <button type="button" className={styles.btnLimpar} onClick={fecharDetalhe}>Fechar</button>
                <button type="button" className="btn-primario" onClick={editarDoDetalhe}>Editar agendamento</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal de confirmação de cancelamento ─────────────────── */}
      {modalDeletar.aberto && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalDeletarTitulo"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h5 className={styles.modalTitulo} id="modalDeletarTitulo">
                  Deletar agendamento
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  onClick={() =>
                    setModalDeletar({ aberto: false, agenda: null })
                  }
                />
              </div>
              <div className="modal-body">
                <p className={styles.modalTexto}>
                  Tem certeza que deseja deletar o agendamento de{" "}
                  <strong>{modalDeletar.agenda?.cliente_nome}</strong> em{" "}
                  {formatarDataCurta(modalDeletar.agenda?.inicio)} às{" "}
                  {formatarHora(modalDeletar.agenda?.inicio)}?
                </p>
              </div>
              <div className="modal-footer border-0 pt-0 gap-2">
                <button
                  className={styles.btnLimpar}
                  onClick={() =>
                    setModalDeletar({ aberto: false, agenda: null })
                  }
                >
                  Voltar
                </button>
                <button
                  className={styles.btnIconePerigo}
                  style={{
                    width: "auto",
                    height: "auto",
                    padding: "0.4rem 1rem",
                    borderRadius: "var(--radius-medium)",
                    opacity: deletando ? 0.6 : 1,
                  }}
                  disabled={deletando}
                  onClick={confirmarDeletar}
                >
                  {deletando ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal de edição ─────────────────── */}
      {modalEditar.aberto && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalEditarTitulo"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h5 className={styles.modalTitulo} id="modalEditarTitulo">
                  Editar agendamento
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  disabled={editando}
                  onClick={() =>
                    setModalEditar({ aberto: false, agenda: null })
                  }
                />
              </div>

              <div className="modal-body d-flex flex-column gap-3" style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>
                {feedback?.tipo === "erro" && <p role="alert" style={{ color: "var(--erro-texto)", margin: 0 }}>{feedback.msg}</p>}
                {/* Identificação do agendamento — somente leitura */}
                <p className={styles.modalTexto} style={{ margin: 0 }}>
                  <strong><Link className={styles.linkCliente} href={`/admin/clientes?cliente_id=${modalEditar.agenda?.cliente_id}`} aria-label={`Ver dados de ${modalEditar.agenda?.cliente_nome}`}>
                    {modalEditar.agenda?.cliente_nome}
                  </Link></strong> —{" "}
                  {formatarDataCurta(modalEditar.agenda?.inicio)} às{" "}
                  {formatarHora(modalEditar.agenda?.inicio)}
                </p>

                {/* Data */}
                <div>
                  <label className={styles.labelFiltro} htmlFor="editData">
                    Data
                  </label>
                  <DatePickerField
                    id="editData"
                    type="date"
                    className={`form-control ${styles.inputFiltro}`}
                    value={camposEdicao.data ?? ""}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      const novaData = e.target.value;
                      setCamposEdicao((prev) => ({
                        ...prev,
                        data: novaData,
                        hora: "", // limpa hora ao trocar data
                      }));
                      if (!retornoDataManual) {
                        const servico = modalEditar.agenda.servicos?.find((item) => item.servico_id === dadosRetorno.servico_id);
                        setDadosRetorno((atual) => ({ ...atual, data_recomendada: dataSugeridaRetorno(modalEditar.agenda, servico, novaData) }));
                      }
                    }}
                  />
                </div>

                {/* Grade de horários */}
                {camposEdicao.data && (
                  <div>
                    <label className={styles.labelFiltro}>Horário</label>
                    {carregandoHorarios ? (
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
                          const [ano, mes, dia] = camposEdicao.data
                            .split("-")
                            .map(Number);
                          const inicioDesejado = new Date(
                            ano,
                            mes - 1,
                            dia,
                            hH,
                            hM,
                          );

                          const agora = new Date();
                          const jaPassou = inicioDesejado < agora;

                          const ocupado =
                            jaPassou ||
                            agendamentosDoDia.some((ag) => {
                              const inicioAg = new Date(ag.inicio);
                              const fimAg = new Date(ag.fim);
                              return (
                                inicioDesejado < fimAg &&
                                inicioDesejado >= inicioAg
                              );
                            });

                          const selecionado = camposEdicao.hora === h;

                          return (
                            <button
                              key={h}
                              type="button"
                              disabled={ocupado}
                              onClick={() =>
                                setCamposEdicao((prev) => ({
                                  ...prev,
                                  hora: h,
                                }))
                              }
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
                                textDecoration: ocupado
                                  ? "line-through"
                                  : "none",
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

                {/* Status */}
                <div>
                  <label className={styles.labelFiltro} htmlFor="editStatus">
                    Status
                  </label>
                  <select
                    id="editStatus"
                    className={`form-select ${styles.inputFiltro}`}
                    value={camposEdicao.status}
                    onChange={(e) =>
                      setCamposEdicao((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="agendado">Agendado</option>
                    <option value="realizado">Realizado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="faltou">Faltou</option>
                  </select>
                </div>

                {/* Observações */}
                {camposEdicao.status === "realizado" && modalEditar.agenda?.servicos?.length > 0 && (
                  <div className={styles.retornoPlanejado}>
                    <label className="d-flex align-items-center gap-2" htmlFor="planejarRetorno">
                      <input id="planejarRetorno" type="checkbox" checked={retornoPlanejado} onChange={(e) => setRetornoPlanejado(e.target.checked)} />
                      Definir retorno para este atendimento
                    </label>
                    <p>Serviços com prazo configurado já geram um retorno ao concluir. Aqui você pode definir uma data ou incluir um retorno para outro serviço.</p>
                    {retornoPlanejado && (
                      <div className="d-flex flex-column gap-2">
                        {erroRetorno && <p role="alert" style={{ color: "var(--erro-texto)" }}>{erroRetorno}</p>}
                        <label className={styles.labelFiltro} htmlFor="servicoRetorno">Serviço</label>
                        <select id="servicoRetorno" className={`form-select ${styles.inputFiltro}`} value={dadosRetorno.servico_id} onChange={(e) => {
                          const servico = modalEditar.agenda.servicos.find((item) => item.servico_id === e.target.value);
                          setDadosRetorno((atual) => ({ ...atual, servico_id: e.target.value, data_recomendada: dataSugeridaRetorno(modalEditar.agenda, servico, camposEdicao.data) }));
                          setRetornoDataManual(false);
                        }}>
                          {modalEditar.agenda.servicos.map((servico) => <option key={servico.servico_id} value={servico.servico_id}>{servico.nome}</option>)}
                        </select>
                        <label className={styles.labelFiltro} htmlFor="dataRetorno">Data recomendada</label>
                        <DatePickerField id="dataRetorno" className={`form-control ${styles.inputFiltro}`} value={dadosRetorno.data_recomendada} onChange={(e) => { setDadosRetorno((atual) => ({ ...atual, data_recomendada: e.target.value })); setRetornoDataManual(true); }} />
                        <p>{servicoRetornoSelecionado?.retorno_dias == null
                          ? "Este serviço não tem um prazo de retorno cadastrado. Escolha a data com a cliente."
                          : `Sugestão: ${servicoRetornoSelecionado.retorno_dias} dias após o atendimento. Você pode ajustar a data.`}</p>
                        <label className={styles.labelFiltro} htmlFor="observacoesRetorno">Observações do retorno (opcional)</label>
                        <textarea id="observacoesRetorno" className={`form-control ${styles.inputFiltro}`} rows={2} value={dadosRetorno.observacoes} onChange={(e) => setDadosRetorno((atual) => ({ ...atual, observacoes: e.target.value }))} />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label
                    className={styles.labelFiltro}
                    htmlFor="editObservacoes"
                  >
                    Observações
                  </label>
                  <textarea
                    id="editObservacoes"
                    className={`form-control ${styles.inputFiltro}`}
                    rows={3}
                    placeholder="Observações sobre o atendimento..."
                    value={camposEdicao.observacoes}
                    onChange={(e) =>
                      setCamposEdicao((prev) => ({
                        ...prev,
                        observacoes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 gap-2">
                <button
                  className={styles.btnLimpar}
                  disabled={editando}
                  onClick={() =>
                    setModalEditar({ aberto: false, agenda: null })
                  }
                >
                  Cancelar
                </button>
                <button
                  className="btn-primario"
                  disabled={editando}
                  style={{ opacity: editando ? 0.6 : 1 }}
                  onClick={confirmarEdicao}
                >
                  {editando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalNovo && (
        <ModalNovoAgendamento
          aoFechar={() => setModalNovo(false)}
          aoSalvar={aoSalvarNovo}
        />
      )}
    </div>
  );
}
