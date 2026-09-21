"use client";

import { useState, useEffect } from "react";
import styles from "./Retornos.module.css";
import { formatarDataCurta } from "@/lib/formatters";

export default function PageRetornos() {
  const [retornos, setRetornos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // ── Busca de Retornos ──
  useEffect(() => {
    async function buscarRetornos() {
      setCarregando(true);
      try {
        // A API só aceita "status" e "cliente_id" como filtro.
        // O filtro de data é aplicado no navegador (ver abaixo).
        let url = `/api/retorno?`;
        if (filtroStatus) url += `status=${filtroStatus}`;

        const res = await fetch(url);
        const data = await res.json();
        setRetornos(Array.isArray(data) ? data : []);
      } catch {
        setRetornos([]);
      } finally {
        setCarregando(false);
      }
    }
    buscarRetornos();
  }, [filtroStatus]);

  async function alterarStatus(id, novoStatus) {
    try {
      // A API expõe PUT, não PATCH, para atualizar o status.
      const res = await fetch(`/api/retorno/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) {
        alert("Não foi possível atualizar o status do retorno.");
        return;
      }
      setRetornos(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r));
    } catch {
      alert("Erro ao atualizar o status do retorno.");
    }
  }

  // ── Função auxiliar para as cores do Badge ──
  const getBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "agendado": return styles.statusAgendado;
      case "realizado": return styles.statusRealizado;
      case "cancelado": return styles.statusCancelado;
      case "faltou": return styles.statusFaltou;
      default: return "";
    }
  };

  // Filtro de data aplicado no navegador, já que a API não suporta esse parâmetro.
  const retornosFiltrados = filtroData
    ? retornos.filter((r) => r.data_recomendada?.slice(0, 10) === filtroData)
    : retornos;

  return (
    <div style={{ padding: "1rem" }}>
      <header className="mb-4">
        <h1 className={styles.tituloPagina}>Retornos Agendados</h1>
      </header>

      {/* ── Filtros ── */}
      <section className={`${styles.cardFiltros} mb-4 row g-3`}>
        <div className="col-12 col-sm-5">
          <label className={styles.labelFiltro}>Data</label>
          <input
            type="date"
            className={`form-control ${styles.inputFiltro}`}
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
        </div>
        <div className="col-12 col-sm-5">
          <label className={styles.labelFiltro}>Status</label>
          <select
            className={`form-control ${styles.inputFiltro}`}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="realizado">Realizado</option>
            <option value="faltou">Faltou</option>
          </select>
        </div>
        <div className="col-12 col-sm-2 d-flex align-items-end">
          <button className={`${styles.btnLimpar} w-100`} onClick={() => { setFiltroData(""); setFiltroStatus(""); }}>
            Limpar
          </button>
        </div>
      </section>

      {/* ── Lista de Retornos ── */}
      {carregando ? (
        <div className={styles.loadingState}>Carregando retornos...</div>
      ) : retornosFiltrados.length === 0 ? (
        <div className={styles.estadoVazio}>
          <p>Nenhum retorno encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {retornosFiltrados.map((retorno) => (
            <div key={retorno.id} className={styles.cardMobile}>
              <div className={styles.cardCentro}>
                <p className={styles.cardCliente}>{retorno.cliente_nome}</p>
                <p className={styles.cardServico}>{retorno.servico_nome}</p>
                <p className={styles.cardData}>{formatarDataCurta(retorno.data_recomendada)}</p>
              </div>
              <div className={styles.cardDireita}>
                <span className={`${styles.badgeStatus} ${getBadgeClass(retorno.status)}`}>
                  {retorno.status || "Agendado"}
                </span>

                {retorno.status === "agendado" && (
                  <div className={styles.cardAcoes}>
                    <button className={styles.btnIcone} title="Marcar como Realizado" onClick={() => alterarStatus(retorno.id, "realizado")}>✓</button>
                    <button className={styles.btnIconePerigo} title="Marcar Falta" onClick={() => alterarStatus(retorno.id, "faltou")}>✕</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
