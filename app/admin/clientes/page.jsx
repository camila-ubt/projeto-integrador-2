"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./Clientes.module.css"; 
import { formatarTelefone } from "@/lib/formatters"; 

function linkWhatsapp(telefone) {
  const numero = telefone?.replace(/\D/g, "") ?? "";
  if (numero.length < 10) return null;
  const completo = telefone.trim().startsWith("+") || (numero.length >= 12 && numero.startsWith("55"))
    ? numero : `55${numero}`;
  return `https://wa.me/${completo}`;
}

export default function PageClientes() {
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [carregando, setCarregando] = useState(true);

  // ── Estados do Modal ──
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState(null);
  const [form, setForm] = useState({ id: null, nome: "", telefone: "" });
  const [clienteDetalhe, setClienteDetalhe] = useState(null);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const linkProcessado = useRef(false);

  const abrirDetalhes = useCallback(async (id) => {
    setDetalheAberto(true);
    setCarregandoDetalhe(true);
    setClienteDetalhe(null);
    setErroDetalhe("");
    try {
      const resposta = await fetch(`/api/clientes/${encodeURIComponent(id)}`);
      if (!resposta.ok) throw new Error("Não foi possível carregar essa cliente.");
      setClienteDetalhe(await resposta.json());
    } catch (error) {
      setErroDetalhe(error.message);
    } finally {
      setCarregandoDetalhe(false);
    }
  }, []);

  // ── Busca de Clientes  ──
  useEffect(() => {
    const timer = setTimeout(async () => {
      setCarregando(true);
      try {
        const res = await fetch(`/api/clientes?busca=${encodeURIComponent(buscaCliente)}`);
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      } catch {
        setClientes([]);
      } finally {
        setCarregando(false);
        if (!linkProcessado.current) {
          linkProcessado.current = true;
          const id = new URLSearchParams(window.location.search).get("cliente_id");
          if (id) abrirDetalhes(id);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [buscaCliente, abrirDetalhes]);

  // ── Ações do Modal ──
  function abrirModal(cliente = null) {
    setErroForm(null);
    if (cliente) {
      setForm({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone });
    } else {
      setForm({ id: null, nome: "", telefone: "" });
    }
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  async function salvarCliente(e) {
    e.preventDefault();
    setErroForm(null);

    if (!form.nome.trim() || !form.telefone.trim()) {
      return setErroForm("Preencha todos os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const url = form.id ? `/api/clientes/${form.id}` : "/api/clientes";
      const metodo = form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar cliente.");
      }

      setBuscaCliente(" "); 
      setTimeout(() => setBuscaCliente(""), 50);
      fecharModal();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCliente(id) {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) return;
    
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Não foi possível excluir o cliente.");
        return;
      }
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Erro ao excluir cliente.");
    }
  }

  // ── UI ──
  return (
    <div style={{ padding: "1rem" }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className={styles.tituloPagina}>Clientes</h1>
        <button className={styles.btnIcone} style={{ backgroundColor: "var(--primaria)", color: "white" }} onClick={() => abrirModal()}>
          +
        </button>
      </header>

      {/* ── Filtros ── */}
      <section className={`${styles.cardFiltros} mb-4 d-flex gap-3 align-items-end`}>
        <div style={{ flex: 1 }}>
          <label className={styles.labelFiltro} htmlFor="busca">Buscar Cliente (Nome ou Telefone)</label>
          <input
            id="busca"
            type="text"
            className={`form-control ${styles.inputFiltro}`}
            placeholder="Digite para buscar..."
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
          />
        </div>
        <button className={styles.btnLimpar} onClick={() => setBuscaCliente("")}>Limpar</button>
      </section>

      {/* ── Lista de Clientes ── */}
      {carregando ? (
        <div className={styles.loadingState}>Carregando clientes...</div>
      ) : clientes.length === 0 ? (
        <div className={styles.estadoVazio}>
          <p>Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <>
          <div className={`${styles.cardTabela} d-none d-md-block`}>
            <table className="table mb-0">
              <thead className={styles.tableHeader}>
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3 text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td className={`p-3 ${styles.tdData}`}><button className={styles.linkCliente} type="button" onClick={() => abrirDetalhes(c.id)}>{c.nome}</button></td>
                    <td className={`p-3 ${styles.tdHora}`}>{formatarTelefone(c.telefone)}</td>
                    <td className="p-3 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className={styles.btnIcone} onClick={() => abrirModal(c)}>✎</button>
                        <button className={styles.btnIconePerigo} onClick={() => excluirCliente(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-md-none">
            {clientes.map((c) => (
              <div key={c.id} className={styles.cardMobile}>
                <div className={styles.cardCentro}>
                  <p className={styles.cardCliente}><button className={styles.linkCliente} type="button" onClick={() => abrirDetalhes(c.id)}>{c.nome}</button></p>
                  <p className={styles.cardServico}>{formatarTelefone(c.telefone)}</p>
                </div>
                <div className={styles.cardDireita}>
                  <div className={styles.cardAcoes}>
                    <button className={styles.btnIcone} onClick={() => abrirModal(c)}>✎</button>
                    <button className={styles.btnIconePerigo} onClick={() => excluirCliente(c.id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {detalheAberto && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} role="dialog" aria-modal="true" aria-labelledby="tituloDetalheCliente">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h2 className={styles.modalTitulo} id="tituloDetalheCliente">{clienteDetalhe?.nome ?? "Dados da cliente"}</h2>
                <button type="button" className="btn-close" aria-label="Fechar dados da cliente" onClick={() => setDetalheAberto(false)} />
              </div>
              <div className="modal-body">
                {carregandoDetalhe && <p>Carregando dados da cliente...</p>}
                {erroDetalhe && <p role="alert">{erroDetalhe}</p>}
                {clienteDetalhe && (
                  <div className={styles.dadosCliente}>
                    <p><span>Telefone</span><strong>{formatarTelefone(clienteDetalhe.telefone)}</strong></p>
                    {clienteDetalhe.aniversario && <p><span>Aniversário</span><strong>{String(clienteDetalhe.aniversario).slice(0, 10).split("-").reverse().join("/")}</strong></p>}
                    {clienteDetalhe.observacoes && <p><span>Observações</span><strong>{clienteDetalhe.observacoes}</strong></p>}
                    {linkWhatsapp(clienteDetalhe.telefone) && <a className={styles.linkWhatsapp} href={linkWhatsapp(clienteDetalhe.telefone)} target="_blank" rel="noopener noreferrer">Abrir conversa no WhatsApp</a>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Novo/Editar Cliente ── */}
      {modalAberto && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header border-0 pb-0">
                <h5 className={styles.modalTitulo}>{form.id ? "Editar Cliente" : "Novo Cliente"}</h5>
                <button type="button" className="btn-close" disabled={salvando} onClick={fecharModal} />
              </div>
              
              <div className="modal-body d-flex flex-column gap-3">
                {erroForm && (
                  <div className="rounded-3 py-2 px-3 small" style={{ backgroundColor: "var(--erro-fundo)", color: "var(--erro-texto)", border: "1px solid var(--erro-borda)" }}>
                    {erroForm}
                  </div>
                )}
                
                <div>
                  <label className={styles.labelFiltro}>Nome Completo</label>
                  <input type="text" className={`form-control ${styles.inputFiltro}`} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className={styles.labelFiltro}>Telefone</label>
                  <input type="tel" className={`form-control ${styles.inputFiltro}`} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })} />
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 gap-2">
                <button className={styles.btnLimpar} disabled={salvando} onClick={fecharModal}>Cancelar</button>
                <button className="btn-primario" disabled={salvando} onClick={salvarCliente} style={{ opacity: salvando ? 0.6 : 1, backgroundColor: "var(--primaria)", color: "white", border: "none", padding: "0.45rem 0.75rem", borderRadius: "var(--radius-medium)" }}>
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
