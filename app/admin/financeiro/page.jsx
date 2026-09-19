"use client";

import { useState, useEffect } from "react";
import styles from "./Financeiro.module.css";
import { formatarDataCurta } from "@/lib/formatters";

export default function PageFinanceiro() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0 });
  const [carregando, setCarregando] = useState(true);

  // Filtros padrão para o mês atual
  const dataAtual = new Date();
  const [filtroMes, setFiltroMes] = useState(String(dataAtual.getMonth() + 1).padStart(2, '0'));
  const [filtroAno, setFiltroAno] = useState(String(dataAtual.getFullYear()));

  // ── Estados do Modal ──
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);
  const [form, setForm] = useState({ descricao: "", valor: "", tipo: "receita", data: "" });

  // ── Busca de Dados na API ──
  useEffect(() => {
    carregarFinanceiro();
  }, [filtroMes, filtroAno]);

  // Calcula o primeiro e o último dia do mês/ano selecionados,
  // pois a API espera "inicio" e "fim", e não "mes"/"ano".
  function calcularPeriodo(mes, ano) {
    const mesNum = Number(mes);
    const anoNum = Number(ano);
    const inicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(anoNum, mesNum, 0).getDate(); // dia 0 do próximo mês = último dia do mês atual
    const fim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
    return { inicio, fim };
  }

  async function carregarFinanceiro() {
    setCarregando(true);
    try {
      const { inicio, fim } = calcularPeriodo(filtroMes, filtroAno);
      const res = await fetch(`/api/financeiro?inicio=${inicio}&fim=${fim}`);
      const data = await res.json();

      // A API retorna uma lista (array) de movimentações, não { movimentacoes, resumo }.
      const lista = Array.isArray(data) ? data : [];

      const receitas = lista
        .filter((m) => m.tipo === "receita")
        .reduce((acc, m) => acc + Number(m.valor || 0), 0);
      const despesas = lista
        .filter((m) => m.tipo === "despesa")
        .reduce((acc, m) => acc + Number(m.valor || 0), 0);

      setMovimentacoes(lista);
      setResumo({ receitas, despesas, saldo: receitas - despesas });
    } catch (err) {
      setMovimentacoes([]);
      setResumo({ receitas: 0, despesas: 0, saldo: 0 });
    } finally {
      setCarregando(false);
    }
  }

  // ── Ações do Modal ──
  function abrirModal() {
    setErroForm(null);
    setForm({ descricao: "", valor: "", tipo: "receita", data: "" });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  async function salvarMovimentacao(e) {
    e.preventDefault();
    setErroForm(null);

    if (!form.descricao.trim() || !form.valor || !form.data) {
      return setErroForm("Preencha todos os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: form.descricao,
          valor: parseFloat(form.valor.replace(',', '.')),
          tipo: form.tipo,
          // A API espera "data_movimentacao", não "data".
          data_movimentacao: form.data,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar movimentação.");
      }

      fecharModal();
      carregarFinanceiro(); // Atualiza a lista e o resumo
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMovimentacao(id) {
    if (!window.confirm("Tem certeza que deseja excluir este registro? O saldo será recalculado.")) return;

    try {
      await fetch(`/api/financeiro/${id}`, { method: "DELETE" });
      carregarFinanceiro(); // Recarrega para atualizar o resumo corretamente
    } catch (err) {
      alert("Erro ao excluir registro.");
    }
  }

  // ── Funções de Formatação ──
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className={styles.tituloPagina}>Financeiro</h1>
        <button className={styles.btnIcone} style={{ backgroundColor: "var(--primaria)", color: "white" }} onClick={abrirModal}>
          +
        </button>
      </header>

      {/* ── Cards de Resumo Financeiro ── */}
      <section className={`${styles.resumoContainer} mb-4`}>
        <div className={styles.resumoCard}>
          <span className={styles.labelFiltro}>Receitas</span>
          <strong className={styles.valorPositivo}>{formatarMoeda(resumo.receitas)}</strong>
        </div>
        <div className={styles.resumoCard}>
          <span className={styles.labelFiltro}>Despesas</span>
          <strong className={styles.valorNegativo}>{formatarMoeda(resumo.despesas)}</strong>
        </div>
        <div className={styles.resumoCard} style={{ backgroundColor: "var(--primaria-clara)" }}>
          <span className={styles.labelFiltro}>Saldo Total</span>
          <strong className={resumo.saldo >= 0 ? styles.valorPositivo : styles.valorNegativo}>
            {formatarMoeda(resumo.saldo)}
          </strong>
        </div>
      </section>

      {/* ── Filtros de Período ── */}
      <section className={`${styles.cardFiltros} mb-4 d-flex gap-3 align-items-end`}>
        <div style={{ flex: 1 }}>
          <label className={styles.labelFiltro}>Mês</label>
          <select className={`form-control ${styles.inputFiltro}`} value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className={styles.labelFiltro}>Ano</label>
          <select className={`form-control ${styles.inputFiltro}`} value={filtroAno} onChange={(e) => setFiltroAno(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </section>

      {/* ── Lista de Movimentações ── */}
      {carregando ? (
        <div className={styles.loadingState}>Carregando financeiro...</div>
      ) : movimentacoes.length === 0 ? (
        <div className={styles.estadoVazio}>
          <p>Nenhuma movimentação registrada neste período.</p>
        </div>
      ) : (
        <>
          {/* Tabela Desktop */}
          <div className={`${styles.cardTabela} d-none d-md-block`}>
            <table className="table mb-0">
              <thead className={styles.tableHeader}>
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3 text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((m) => (
                  <tr key={m.id}>
                    <td className={`p-3 ${styles.tdHora}`}>{formatarDataCurta(m.data_movimentacao)}</td>
                    <td className={`p-3 ${styles.tdData}`}>{m.descricao}</td>
                    <td className="p-3">
                      <span className={`${styles.badgeStatus} ${m.tipo === 'receita' ? styles.statusRealizado : styles.statusCancelado}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className={`p-3 ${m.tipo === 'receita' ? styles.valorPositivo : styles.valorNegativo}`} style={{ fontWeight: 500 }}>
                      {formatarMoeda(m.valor)}
                    </td>
                    <td className="p-3 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className={styles.btnIconePerigo} onClick={() => excluirMovimentacao(m.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards Mobile */}
          <div className="d-md-none">
            {movimentacoes.map((m) => (
              <div key={m.id} className={styles.cardMobile}>
                <div className={styles.cardCentro}>
                  <p className={styles.cardCliente}>{m.descricao}</p>
                  <p className={styles.cardServico}>{formatarDataCurta(m.data_movimentacao)}</p>
                </div>
                <div className={styles.cardDireita}>
                  <strong className={m.tipo === 'receita' ? styles.valorPositivo : styles.valorNegativo}>
                    {formatarMoeda(m.valor)}
                  </strong>
                  <div className={styles.cardAcoes}>
                    <button className={styles.btnIconePerigo} onClick={() => excluirMovimentacao(m.id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal Nova Movimentação ── */}
      {modalAberto && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h5 className={styles.modalTitulo}>Nova Movimentação</h5>
                <button type="button" className="btn-close" disabled={salvando} onClick={fecharModal} />
              </div>

              <div className="modal-body d-flex flex-column gap-3">
                {erroForm && (
                  <div className="rounded-3 py-2 px-3 small" style={{ backgroundColor: "var(--erro-fundo)", color: "var(--erro-texto)", border: "1px solid var(--erro-borda)" }}>
                    {erroForm}
                  </div>
                )}

                <div>
                  <label className={styles.labelFiltro}>Tipo</label>
                  <select className={`form-control ${styles.inputFiltro}`} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="receita">Receita (Entrada)</option>
                    <option value="despesa">Despesa (Saída)</option>
                  </select>
                </div>
                <div>
                  <label className={styles.labelFiltro}>Descrição</label>
                  <input type="text" className={`form-control ${styles.inputFiltro}`} placeholder="Ex: Pagamento serviço X" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className={styles.labelFiltro}>Valor (R$)</label>
                  <input type="number" step="0.01" className={`form-control ${styles.inputFiltro}`} placeholder="0.00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div>
                  <label className={styles.labelFiltro}>Data</label>
                  <input type="date" className={`form-control ${styles.inputFiltro}`} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 gap-2">
                <button className={styles.btnLimpar} disabled={salvando} onClick={fecharModal}>Cancelar</button>
                <button className="btn-primario" disabled={salvando} onClick={salvarMovimentacao} style={{ opacity: salvando ? 0.6 : 1, backgroundColor: "var(--primaria)", color: "white", border: "none", padding: "0.45rem 0.75rem", borderRadius: "var(--radius-medium)" }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
