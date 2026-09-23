"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DatePickerField from "@/app/components/DatePickerField";
import { formatarDataCurta } from "@/lib/formatters";
import styles from "./Retornos.module.css";

const STATUS = {
  pendente: "Pendente",
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

function dataInput(valor) {
  return valor ? String(valor).slice(0, 10) : "";
}

function dataExibida(valor) {
  return formatarDataCurta(dataInput(valor));
}

export default function PageRetornos() {
  const [retornos, setRetornos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroServico, setFiltroServico] = useState("");
  const [opcoesServico, setOpcoesServico] = useState([]);
  const [origemId, setOrigemId] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState({ status: "pendente", data_recomendada: "", observacoes: "" });
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");

  useEffect(() => {
    let ativo = true;
    async function buscarRetornos() {
      const agendamentoId = new URLSearchParams(window.location.search).get("agendamento_id");
      const params = new URLSearchParams();
      if (agendamentoId) params.set("agendamento_id", agendamentoId);

      try {
        const resposta = await fetch(`/api/retorno?${params.toString()}`);
        if (!resposta.ok) throw new Error("Não foi possível carregar os retornos.");
        const dados = await resposta.json();
        if (ativo) {
          setRetornos(Array.isArray(dados) ? dados : []);
          setOrigemId(agendamentoId);
          setErroLista("");
        }
      } catch (error) {
        if (ativo) setErroLista(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    buscarRetornos();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/servicos")
      .then((resposta) => resposta.ok ? resposta.json() : [])
      .then((dados) => { if (ativo && Array.isArray(dados)) setOpcoesServico(dados); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  function abrirRetorno(retorno) {
    setSelecionado(retorno);
    setForm({
      status: retorno.status,
      data_recomendada: dataInput(retorno.data_recomendada),
      observacoes: retorno.observacoes || "",
    });
    setErroForm("");
  }

  async function salvarRetorno() {
    if (!form.data_recomendada) {
      setErroForm("Informe a data recomendada para o retorno.");
      return;
    }
    setSalvando(true);
    setErroForm("");
    try {
      const resposta = await fetch(`/api/retorno/${selecionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const atualizado = await resposta.json();
      if (!resposta.ok) throw new Error(atualizado.error || "Não foi possível salvar o retorno.");
      setRetornos((atuais) => atuais.map((item) => item.id === atualizado.id ? { ...item, ...atualizado } : item));
      setSelecionado(null);
    } catch (error) {
      setErroForm(error.message);
    } finally {
      setSalvando(false);
    }
  }

  const servicosDisponiveis = opcoesServico.length ? opcoesServico : [...new Map(
    retornos.filter((retorno) => retorno.servico_id && retorno.servico_nome)
      .map((retorno) => [retorno.servico_id, retorno.servico_nome])
  )].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const retornosFiltrados = retornos.filter((item) =>
    (!filtroStatus || item.status === filtroStatus) &&
    (!filtroData || dataInput(item.data_recomendada) === filtroData) &&
    (!buscaCliente.trim() || item.cliente_nome?.toLocaleLowerCase("pt-BR").includes(buscaCliente.trim().toLocaleLowerCase("pt-BR"))) &&
    (!filtroServico || item.servico_id === filtroServico)
  );

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalhoPagina}>
        <div>
          <h1 className={styles.tituloPagina}>Retornos</h1>
          <p>Acompanhe quando entrar em contato e quando a cliente voltar ao studio.</p>
        </div>
        {origemId && <Link href="/admin/retornos" className={styles.linkSimples}>Ver todos os retornos</Link>}
      </header>

      <section className={`${styles.cardFiltros} mb-4 row g-3`}>
        <div className="col-12 col-md-6 col-xl-3">
          <label className={styles.labelFiltro} htmlFor="buscaClienteRetorno">Cliente</label>
          <input id="buscaClienteRetorno" type="search" className={`form-control ${styles.inputFiltro}`} placeholder="Nome da cliente..." value={buscaCliente} onChange={(evento) => setBuscaCliente(evento.target.value)} />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <label className={styles.labelFiltro} htmlFor="filtroServicoRetorno">Serviço</label>
          <select id="filtroServicoRetorno" className={`form-select ${styles.inputFiltro}`} value={filtroServico} onChange={(evento) => setFiltroServico(evento.target.value)}>
            <option value="">Todos os serviços</option>
            {servicosDisponiveis.map((servico) => <option key={servico.id} value={servico.id}>{servico.nome}</option>)}
          </select>
        </div>
        <div className="col-12 col-md-6 col-xl-2">
          <label className={styles.labelFiltro} htmlFor="filtroDataRetorno">Data recomendada</label>
          <DatePickerField id="filtroDataRetorno" className={`form-control ${styles.inputFiltro}`} value={filtroData} onChange={(evento) => setFiltroData(evento.target.value)} />
        </div>
        <div className="col-12 col-md-6 col-xl-2">
          <label className={styles.labelFiltro} htmlFor="filtroStatusRetorno">Status</label>
          <select id="filtroStatusRetorno" className={`form-select ${styles.inputFiltro}`} value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
          </select>
        </div>
        <div className="col-12 col-xl-2 d-flex align-items-end">
          <button type="button" className={`${styles.btnLimpar} w-100`} onClick={() => { setFiltroData(""); setFiltroStatus(""); setBuscaCliente(""); setFiltroServico(""); }}>Limpar</button>
        </div>
      </section>

      {erroLista && <p className={styles.erro} role="alert">{erroLista}</p>}
      {carregando ? <div className={styles.loadingState}>Carregando retornos...</div> : retornosFiltrados.length === 0 ? (
        <div className={styles.estadoVazio}>
          <p>{origemId && !filtroData && !filtroStatus && !buscaCliente && !filtroServico
            ? "Nenhum retorno encontrado para este atendimento. Você pode definir um ao editar o agendamento realizado."
            : "Nenhum retorno encontrado com os filtros atuais."}</p>
          {origemId && <Link href={`/admin/agendamentos?agendamento_id=${origemId}`}>Abrir atendimento</Link>}
        </div>
      ) : (
        <div className={styles.listaRetornos}>
          {retornosFiltrados.map((retorno) => (
            <article key={retorno.id} className={styles.cardMobile}>
              <button type="button" className={styles.abrirRetorno} onClick={() => abrirRetorno(retorno)} aria-label={`Ver retorno de ${retorno.cliente_nome} em ${dataExibida(retorno.data_recomendada)}`}>
                <span className={styles.cardCentro}>
                  <strong className={styles.cardCliente}>{retorno.cliente_nome}</strong>
                  <span className={styles.cardServico}>{retorno.servico_nome || "Serviço não informado"}</span>
                  <span className={styles.cardData}>{dataExibida(retorno.data_recomendada)}</span>
                </span>
                <span className={`${styles.badgeStatus} ${styles[`status${retorno.status?.[0]?.toUpperCase()}${retorno.status?.slice(1)}`] || ""}`}>{STATUS[retorno.status] || retorno.status}</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {selecionado && (
        <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="tituloRetorno" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h2 id="tituloRetorno" className={styles.modalTitulo}>Retorno de {selecionado.cliente_nome}</h2>
                <button type="button" className="btn-close" aria-label="Fechar retorno" onClick={() => setSelecionado(null)} disabled={salvando} />
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <p className={styles.modalResumo}>Serviço: <strong>{selecionado.servico_nome || "Não informado"}</strong></p>
                <div className={styles.linksRetorno}>
                  <Link href={`/admin/clientes?cliente_id=${selecionado.cliente_id}`}>Ver cliente</Link>
                  {selecionado.agendamento_origem_id && <Link href={`/admin/agendamentos?agendamento_id=${selecionado.agendamento_origem_id}`}>Ver atendimento original</Link>}
                  <Link href="/admin/agendamentos">Abrir agenda</Link>
                </div>
                <p className={styles.orientacao}>Ao marcar uma visita na agenda, atualize este acompanhamento para “Agendado”.</p>
                <label className={styles.labelFiltro} htmlFor="dataRecomendada">Data recomendada</label>
                <DatePickerField id="dataRecomendada" className={`form-control ${styles.inputFiltro}`} value={form.data_recomendada} onChange={(evento) => setForm((atual) => ({ ...atual, data_recomendada: evento.target.value }))} />
                <label className={styles.labelFiltro} htmlFor="statusRetorno">Status do acompanhamento</label>
                <select id="statusRetorno" className={`form-select ${styles.inputFiltro}`} value={form.status} onChange={(evento) => setForm((atual) => ({ ...atual, status: evento.target.value }))}>
                  {Object.entries(STATUS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
                </select>
                <label className={styles.labelFiltro} htmlFor="observacoesRetorno">Observações</label>
                <textarea id="observacoesRetorno" rows={3} className={`form-control ${styles.inputFiltro}`} value={form.observacoes} onChange={(evento) => setForm((atual) => ({ ...atual, observacoes: evento.target.value }))} />
                {erroForm && <p className={styles.erro} role="alert">{erroForm}</p>}
              </div>
              <div className="modal-footer border-0">
                <button type="button" className={styles.btnLimpar} onClick={() => setSelecionado(null)} disabled={salvando}>Cancelar</button>
                <button type="button" className={styles.btnSalvar} onClick={salvarRetorno} disabled={salvando}>{salvando ? "Salvando..." : "Salvar retorno"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
