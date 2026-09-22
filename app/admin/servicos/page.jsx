"use client";

import { useState, useEffect } from "react";
import { formatarDuracao } from "@/lib/formatters";
import { IcoEditar, IcoLixeira } from "@/app/components/icons";
import styles from "./Servicos.module.css";

// ─── Formulário inicial vazio ──────────────────────────────────────
const FORM_VAZIO = {
  id: null,
  nome: "",
  descricao: "",
  duracao_minutos: "",
  preco_padrao: "",
  necessita_avaliacao: false,
  retorno_dias: "",
  ativo: true,
};

export default function PageServicos() {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  // Modal de confirmação de exclusão
  const [modalDeletar, setModalDeletar] = useState({
    aberto: false,
    servico: null,
  });
  const [deletando, setDeletando] = useState(false);

  // ── Busca de serviços ──────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      setCarregando(true);
      try {
        const url = mostrarInativos
          ? "/api/admin/servicos"
          : "/api/servicos";
        const res = await fetch(url);
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      } catch {
        setServicos([]);
      } finally {
        setCarregando(false);
      }
    };
    buscar();
  }, [mostrarInativos]);

  function exibirFeedback(tipo, msg) {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ── Modal criar/editar ─────────────────────────────────────────
  function abrirModal(servico = null) {
    setErroForm(null);
    setForm(
      servico
        ? {
            id: servico.id,
            nome: servico.nome ?? "",
            descricao: servico.descricao ?? "",
            duracao_minutos: servico.duracao_minutos ?? "",
            preco_padrao: servico.preco_padrao ?? "",
            necessita_avaliacao: servico.necessita_avaliacao ?? false,
            retorno_dias: servico.retorno_dias ?? "",
            ativo: servico.ativo ?? true,
          }
        : FORM_VAZIO,
    );
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  async function salvarServico() {
    setErroForm(null);

    if (!form.nome.trim()) {
      return setErroForm("O nome do serviço é obrigatório.");
    }

    setSalvando(true);
    try {
      const url = form.id ? `/api/servicos/${form.id}` : "/api/servicos";
      const metodo = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          duracao_minutos: form.duracao_minutos
            ? Number(form.duracao_minutos)
            : null,
          preco_padrao: form.preco_padrao ? Number(form.preco_padrao) : null,
          necessita_avaliacao: form.necessita_avaliacao,
          retorno_dias: form.retorno_dias ? Number(form.retorno_dias) : null,
          ativo: form.ativo,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar serviço.");
      }

      const msg = form.id
        ? "Serviço atualizado com sucesso."
        : "Serviço criado com sucesso.";
      const urlBusca = mostrarInativos
        ? "/api/admin/servicos"
        : "/api/servicos";
      const resBusca = await fetch(urlBusca);
      const dados = await resBusca.json();
      setServicos(Array.isArray(dados) ? dados : []);
      exibirFeedback("sucesso", msg);

      fecharModal();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  // ── Exclusão / desativação ────────────────────────────────────
  async function confirmarDeletar() {
    setDeletando(true);
    try {
      const res = await fetch(`/api/servicos/${modalDeletar.servico.id}`, {
        method: "DELETE",
      });

      if (res.status === 409) {
        // Serviço tem agendamentos — desativa em vez de excluir
        const resDes = await fetch(`/api/servicos/${modalDeletar.servico.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: false }),
        });
        if (!resDes.ok) throw new Error("Erro ao desativar serviço.");
        setServicos((prev) =>
          prev.map((s) =>
            s.id === modalDeletar.servico.id ? { ...s, ativo: false } : s,
          ),
        );
        exibirFeedback(
          "sucesso",
          "Serviço desativado — possui agendamentos vinculados.",
        );
      } else if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao excluir serviço.");
      } else {
        setServicos((prev) =>
          prev.filter((s) => s.id !== modalDeletar.servico.id),
        );
        exibirFeedback("sucesso", "Serviço excluído com sucesso.");
      }
    } catch (err) {
      exibirFeedback("erro", err.message);
    } finally {
      setDeletando(false);
      setModalDeletar({ aberto: false, servico: null });
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* ── Cabeçalho ─────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className={styles.tituloPagina}>Serviços</h1>

        {/* Mobile: só ícone */}
        <button
          className={`btn-primario d-flex d-md-none align-items-center justify-content-center ${styles.btnNovoIcone}`}
          aria-label="Novo serviço"
          title="Novo serviço"
          onClick={() => abrirModal()}
        >
          +
        </button>

        {/* Desktop: com texto */}
        <button
          className="btn-primario d-none d-md-flex align-items-center gap-2"
          onClick={() => abrirModal()}
        >
          + Novo Serviço
        </button>
      </div>

      {/* ── Filtro de inativos ────────────────────────────────── */}
      <div className={`${styles.cardFiltros} mb-4`}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={mostrarInativos}
            onChange={(e) => setMostrarInativos(e.target.checked)}
            className="me-2"
          />
          Mostrar serviços inativos
        </label>
      </div>

      {/* ── Feedback ──────────────────────────────────────────── */}
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
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────── */}
      {carregando ? (
        <div className={styles.loadingState}>
          <div
            className="spinner-border spinner-border-sm text-secondary me-2"
            role="status"
          />
          Carregando serviços...
        </div>
      ) : servicos.length === 0 ? (
        <div className={styles.estadoVazio}>
          <p className="mb-1 fw-medium">Nenhum serviço cadastrado.</p>
          <button className={styles.btnLimpar} onClick={() => abrirModal()}>
            Cadastrar primeiro serviço
          </button>
        </div>
      ) : (
        <>
          {/* ══ DESKTOP — Tabela ══════════════════════════════════ */}
          <div className={`${styles.cardTabela} d-none d-md-block`}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className="px-4 py-3 border-0">Serviço</th>
                    <th className="py-3 border-0">Duração</th>
                    <th className="py-3 border-0">Valor</th>
                    <th className="py-3 border-0">Avaliação</th>
                    <th className="py-3 border-0">Retorno</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="text-end px-4 py-3 border-0">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {servicos.map((s) => (
                    <tr key={s.id} style={{ opacity: s.ativo ? 1 : 0.5 }}>
                      <td className="px-4">
                        <strong className={styles.tdData}>{s.nome}</strong>
                        {s.descricao && (
                          <div className={styles.tdHora}>{s.descricao}</div>
                        )}
                      </td>
                      <td className={styles.tdServico}>
                        {s.duracao_minutos
                          ? formatarDuracao(s.duracao_minutos)
                          : "—"}
                      </td>
                      <td className={styles.tdServico}>
                        {s.preco_padrao
                          ? `R$ ${Number(s.preco_padrao).toFixed(2).replace(".", ",")}`
                          : "—"}
                      </td>
                      <td className={styles.tdServico}>
                        {s.necessita_avaliacao ? (
                          <span className={styles.badgeAvaliacao}>Sim</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={styles.tdServico}>
                        {s.retorno_dias ? `${s.retorno_dias} dias` : "—"}
                      </td>
                      <td>
                        <span
                          className={
                            s.ativo ? styles.badgeAtivo : styles.badgeInativo
                          }
                        >
                          {s.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            className={styles.btnIcone}
                            title="Editar serviço"
                            aria-label="Editar serviço"
                            onClick={() => abrirModal(s)}
                          >
                            <IcoEditar />
                          </button>
                          <button
                            className={styles.btnIconePerigo}
                            title={
                              s.ativo ? "Excluir serviço" : "Serviço inativo"
                            }
                            aria-label="Excluir serviço"
                            onClick={() =>
                              setModalDeletar({ aberto: true, servico: s })
                            }
                          >
                            <IcoLixeira />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ MOBILE — Cards ════════════════════════════════════ */}
          <div className="d-md-none">
            {servicos.map((s) => (
              <div
                key={s.id}
                className={styles.cardMobile}
                style={{ opacity: s.ativo ? 1 : 0.55 }}
              >
                {/* Esquerda: nome + descrição */}
                <div className={styles.cardCentro}>
                  <p className={styles.cardCliente}>{s.nome}</p>
                  {s.descricao && (
                    <p className={styles.cardServico}>{s.descricao}</p>
                  )}
                  <div className={styles.cardMeta}>
                    {s.duracao_minutos && (
                      <span>{formatarDuracao(s.duracao_minutos)}</span>
                    )}
                    {s.preco_padrao && (
                      <span>
                        R$ {Number(s.preco_padrao).toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    {s.necessita_avaliacao && (
                      <span className={styles.badgeAvaliacao}>Avaliação</span>
                    )}
                  </div>
                </div>

                {/* Direita: status + ações */}
                <div className={styles.cardDireita}>
                  <span
                    className={
                      s.ativo ? styles.badgeAtivo : styles.badgeInativo
                    }
                  >
                    {s.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <div className={styles.cardAcoes}>
                    <button
                      className={styles.btnIcone}
                      title="Editar serviço"
                      aria-label="Editar serviço"
                      onClick={() => abrirModal(s)}
                    >
                      <IcoEditar />
                    </button>
                    <button
                      className={styles.btnIconePerigo}
                      title="Excluir serviço"
                      aria-label="Excluir serviço"
                      onClick={() =>
                        setModalDeletar({ aberto: true, servico: s })
                      }
                    >
                      <IcoLixeira />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal criar/editar ────────────────────────────────── */}
      {modalAberto && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalServicoTitulo"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h5 className={styles.modalTitulo} id="modalServicoTitulo">
                  {form.id ? "Editar serviço" : "Novo serviço"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  disabled={salvando}
                  onClick={fecharModal}
                />
              </div>

              <div
                className="modal-body d-flex flex-column gap-3"
                style={{ overflowY: "auto" }}
              >
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

                {/* Nome */}
                <div>
                  <label className={styles.labelFiltro} htmlFor="svcNome">
                    Nome <span style={{ color: "var(--erro-texto)" }}>*</span>
                  </label>
                  <input
                    id="svcNome"
                    type="text"
                    className={`form-control ${styles.inputFiltro}`}
                    placeholder="Ex: Corte feminino"
                    value={form.nome}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nome: e.target.value }))
                    }
                    autoFocus
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className={styles.labelFiltro} htmlFor="svcDescricao">
                    Descrição <span style={{ opacity: 0.6 }}>(opcional)</span>
                  </label>
                  <textarea
                    id="svcDescricao"
                    className={`form-control ${styles.inputFiltro}`}
                    rows={2}
                    placeholder="Descreva o serviço brevemente..."
                    value={form.descricao}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, descricao: e.target.value }))
                    }
                  />
                </div>

                {/* Duração + Valor — lado a lado */}
                <div className="row g-3">
                  <div className="col-6">
                    <label className={styles.labelFiltro} htmlFor="svcDuracao">
                      Duração (min)
                    </label>
                    <input
                      id="svcDuracao"
                      type="number"
                      min="0"
                      className={`form-control ${styles.inputFiltro}`}
                      placeholder="Ex: 60"
                      value={form.duracao_minutos}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          duracao_minutos: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label className={styles.labelFiltro} htmlFor="svcPreco">
                      Valor (R$)
                    </label>
                    <input
                      id="svcPreco"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-control ${styles.inputFiltro}`}
                      placeholder="Ex: 90.00"
                      value={form.preco_padrao}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, preco_padrao: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Retorno em dias */}
                <div>
                  <label className={styles.labelFiltro} htmlFor="svcRetorno">
                    Retorno recomendado (dias)
                    <span style={{ opacity: 0.6, marginLeft: 4 }}>
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="svcRetorno"
                    type="number"
                    min="0"
                    className={`form-control ${styles.inputFiltro}`}
                    placeholder="Ex: 30"
                    value={form.retorno_dias}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, retorno_dias: e.target.value }))
                    }
                  />
                </div>

                {/* Checkboxes */}
                <div className="d-flex flex-column gap-2">
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.necessita_avaliacao}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          necessita_avaliacao: e.target.checked,
                        }))
                      }
                      className="me-2"
                    />
                    Necessita avaliação prévia
                  </label>

                  {form.id && (
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.ativo}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, ativo: e.target.checked }))
                        }
                        className="me-2"
                      />
                      Serviço ativo
                    </label>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 gap-2">
                <button
                  className={styles.btnLimpar}
                  disabled={salvando}
                  onClick={fecharModal}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primario"
                  disabled={salvando}
                  style={{ opacity: salvando ? 0.6 : 1 }}
                  onClick={salvarServico}
                >
                  {salvando
                    ? "Salvando..."
                    : form.id
                      ? "Salvar alterações"
                      : "Criar serviço"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmação de exclusão ─────────────────── */}
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
                  Excluir serviço
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fechar"
                  disabled={deletando}
                  onClick={() =>
                    setModalDeletar({ aberto: false, servico: null })
                  }
                />
              </div>
              <div className="modal-body">
                <p className={styles.modalTexto}>
                  Tem certeza que deseja excluir o serviço{" "}
                  <strong>{modalDeletar.servico?.nome}</strong>?
                </p>
                <p
                  className={styles.modalTexto}
                  style={{ fontSize: "0.82rem", opacity: 0.7 }}
                >
                  Se este serviço já foi usado em agendamentos, ele será
                  desativado em vez de excluído.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0 gap-2">
                <button
                  className={styles.btnLimpar}
                  disabled={deletando}
                  onClick={() =>
                    setModalDeletar({ aberto: false, servico: null })
                  }
                >
                  Voltar
                </button>
                <button
                  className={styles.btnIconePerigo}
                  disabled={deletando}
                  onClick={confirmarDeletar}
                  style={{
                    width: "auto",
                    height: "auto",
                    padding: "0.4rem 1rem",
                    borderRadius: "var(--radius-medium)",
                    opacity: deletando ? 0.6 : 1,
                  }}
                >
                  {deletando ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
