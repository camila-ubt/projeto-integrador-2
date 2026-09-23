"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HORARIOS_ATENDIMENTO, ETAPAS, WHATSAPP_ESTUDIO} from "@/lib/constantes";
import {
  formatarMoeda,
  formatarData,
  dataMinimaAgendamento,
  formatarTelefone,
} from "@/lib/formatters";
import { aniversarioValido, formatarDiaMesDigitado } from "@/lib/aniversario";
import DatePickerField from "@/app/components/DatePickerField";
import {
  IcoCalendario,
  IcoCheck,
  IcoRelogio,
  IcoAvaliacao, 
  IcoWhatsApp,  
} from "@/app/components/icons";


// ─── Modal: serviço requer avaliação prévia ───────────────────────────────────
function ModalAvaliacaoWhatsApp({ servico, aoFechar }) {
  
  if (!servico) return null;

  function abrirWhatsApp() {
    const mensagem = encodeURIComponent(
      `Olá! Tenho interesse no serviço *${servico.nome}* e gostaria de agendar uma avaliação prévia. Poderia me informar a disponibilidade? `
    );
    window.open(
      `https://wa.me/${WHATSAPP_ESTUDIO}?text=${mensagem}`,
      "_blank",
      "noopener,noreferrer"
    );
    aoFechar();
  }

  return (
    // Backdrop — clique fora fecha o modal
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-avaliacao-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
    >
      {/* Painel do modal */}
      <div
        style={{
          backgroundColor: "var(--superficie)",
          borderRadius: "var(--radius-large)",
          padding: "28px 24px 24px",
          maxWidth: "380px",
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Ícone de aviso */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "var(--alerta-fundo)",
            }}
          >
            <IcoAvaliacao
              size={26}
              style={{ color: "var(--alerta-texto)" }}
            />
          </div>
        </div>

        {/* Título */}
        <h2
          id="modal-avaliacao-titulo"
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: "20px",
            fontWeight: 600,
            fontStyle: "italic",
            color: "var(--texto-principal)",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          Avaliação prévia necessária
        </h2>

        {/* Corpo */}
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            color: "var(--texto-secundario)",
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: "8px",
          }}
        >
          O serviço{" "}
          <strong style={{ color: "var(--texto-principal)" }}>
            {servico.nome}
          </strong>{" "}
          exige uma avaliação prévia antes do agendamento.
        </p>
        <p
          style={{
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            color: "var(--texto-secundario)",
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Vamos te direcionar ao WhatsApp do estúdio para combinar sua
          avaliação. Deseja continuar?
        </p>

        {/* Ações */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Botão principal — verde WhatsApp */}
          <button
            type="button"
            onClick={abrirWhatsApp}
            style={{
              width: "100%",
              padding: "13px",
              backgroundColor: "#25D366",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-medium)",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "opacity 0.15s ease",
            }}
          >
            <IcoWhatsApp size={18} style={{ color: "white" }} />
            Continuar para WhatsApp
          </button>

          {/* Botão secundário — voltar */}
          <button
            type="button"
            onClick={aoFechar}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "transparent",
              color: "var(--texto-secundario)",
              border: "1px solid var(--borda-escura)",
              borderRadius: "var(--radius-medium)",
              fontFamily: "var(--fonte-corpo)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Voltar para os serviços
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Barra de progresso ───────────────────────────────────────────────────────
function BarraProgresso({ etapaAtual }) {
  return (
    <div style={{ padding: "0 24px", marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {/* Linha de fundo */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            right: "14px",
            height: "2px",
            backgroundColor: "var(--borda)",
            zIndex: 0,
          }}
        />
        {/* Linha de progresso */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            height: "2px",
            backgroundColor: "var(--primaria)",
            width: `${(etapaAtual / (ETAPAS.length - 1)) * (100 - (28 / 300) * 100)}%`,
            transition: "width 0.4s ease",
            zIndex: 1,
          }}
        />
        {ETAPAS.map((nome, i) => {
          const concluida = i < etapaAtual;
          const ativa = i === etapaAtual;
          return (
            <div
              key={nome}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                zIndex: 2,
                minWidth: "56px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor:
                    concluida || ativa ? "var(--primaria)" : "var(--superficie)",
                  border: `2px solid ${
                    concluida || ativa ? "var(--primaria)" : "var(--borda-escura)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
              >
                {concluida ? (
                  <IcoCheck size={12} style={{ color: "white" }} />
                ) : (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      fontFamily: "var(--fonte-corpo)",
                      color: ativa ? "white" : "var(--texto-secundario)",
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--fonte-corpo)",
                  color:
                    concluida || ativa
                      ? "var(--primaria)"
                      : "var(--texto-secundario)",
                  fontWeight: ativa ? 600 : 400,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {nome}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card de serviço ──────────────────────────────────────────────────────────
// Recebe aoAbrirAvaliacao: quando o serviço requer avaliação, dispara o modal
// em vez de selecionar o serviço diretamente.
function CardServico({ servico, selecionado, aoSelecionar, aoAbrirAvaliacao }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (servico.necessita_avaliacao) {
          aoAbrirAvaliacao(servico); // abre modal — não avança no fluxo
          return;
        }
        aoSelecionar(servico);
      }}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px",
        borderRadius: "var(--radius-medium)",
        border: `2px solid ${selecionado ? "var(--primaria)" : "var(--borda)"}`,
        backgroundColor: selecionado
          ? "rgba(183,110,121,0.06)"
          : "var(--superficie)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: "var(--fonte-titulo)",
            fontSize: "17px",
            fontWeight: 600,
            fontStyle: "italic",
            color: "var(--texto-principal)",
            margin: 0,
            marginBottom: "4px",
          }}
        >
          {servico.nome}
        </p>
        {servico.descricao && (
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "12px",
              color: "var(--texto-secundario)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {servico.descricao}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
            flexWrap: "wrap",
          }}
        >
          {servico.duracao_minutos && (
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--fonte-corpo)",
                color: "var(--texto-secundario)",
              }}
            >
              <IcoRelogio size={12} /> {servico.duracao_minutos} min
            </span>
          )}
          {servico.necessita_avaliacao && (
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--fonte-corpo)",
                color: "var(--alerta-texto)",
                backgroundColor: "var(--alerta-fundo)",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              Requer avaliação
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {servico.preco_padrao && (
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "15px",
              fontWeight: 600,
              color: selecionado ? "var(--primaria)" : "var(--texto-principal)",
              margin: 0,
            }}
          >
            {formatarMoeda(servico.preco_padrao)}
          </p>
        )}
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: `2px solid ${
              selecionado ? "var(--primaria)" : "var(--borda-escura)"
            }`,
            backgroundColor: selecionado ? "var(--primaria)" : "transparent",
            marginTop: "6px",
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {selecionado && (
            <span style={{ color: "white", fontSize: "10px", fontWeight: 700 }}>
              ✓
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Etapa 1 — Escolha do serviço ────────────────────────────────────────────
function EtapaServico({ servicoSelecionado, aoAvancar }) {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [selecionado, setSelecionado] = useState(servicoSelecionado);

  // Controla qual serviço disparou o modal de avaliação (null = fechado)
  const [modalAvaliacao, setModalAvaliacao] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/servicos");
        if (!res.ok) throw new Error();
        const dados = await res.json();
        setServicos(dados);
      } catch {
        setErro("Não foi possível carregar os serviços. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  return (
    <div>
      {/* Modal de avaliação */}
      <ModalAvaliacaoWhatsApp
        servico={modalAvaliacao}
        aoFechar={() => setModalAvaliacao(null)}
      />

      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "22px",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--texto-principal)",
          marginBottom: "6px",
        }}
      >
        Qual serviço você deseja?
      </h2>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "13px",
          color: "var(--texto-secundario)",
          marginBottom: "20px",
        }}
      >
        Selecione um serviço para continuar.
      </p>

      {carregando && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div
            className="spinner-border"
            role="status"
            style={{
              color: "var(--primaria)",
              width: "1.75rem",
              height: "1.75rem",
            }}
          >
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      )}

      {erro && (
        <div
          style={{
            backgroundColor: "var(--erro-fundo)",
            color: "var(--erro-texto)",
            border: "1px solid var(--erro-borda)",
            borderRadius: "var(--radius-medium)",
            padding: "12px 16px",
            fontSize: "13px",
            fontFamily: "var(--fonte-corpo)",
            marginBottom: "16px",
          }}
        >
          {erro}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        {servicos.map((s) => (
          <CardServico
            key={s.id}
            servico={s}
            selecionado={selecionado?.id === s.id}
            aoSelecionar={setSelecionado}
            aoAbrirAvaliacao={setModalAvaliacao}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => aoAvancar(selecionado)}
        disabled={!selecionado}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: selecionado ? "var(--primaria)" : "var(--borda)",
          color: selecionado ? "white" : "var(--texto-secundario)",
          border: "none",
          borderRadius: "var(--radius-medium)",
          fontFamily: "var(--fonte-corpo)",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: selecionado ? "pointer" : "not-allowed",
          transition: "background-color 0.2s ease",
        }}
      >
        Continuar
      </button>
    </div>
  );
}

// ─── Etapa 2 — Data e horário ─────────────────────────────────────────────────
function EtapaData({ servico, dataHoraSelecionada, aoAvancar, aoVoltar }) {
  const [data, setData] = useState(dataHoraSelecionada?.data || "");
  const [hora, setHora] = useState(dataHoraSelecionada?.hora || "");
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  useEffect(() => {
    if (!data) return;

    async function buscarHorariosLivres() {
      setCarregandoHorarios(true);
      setHora("");
      try {
        const inicioDoDia = `${data}T00:00:00.000Z`;
        const fimDoDia = `${data}T23:59:59.999Z`;
        const res = await fetch(
          `/api/agendamentos/publico?inicio=${inicioDoDia}&fim=${fimDoDia}`
        );
        const dadosOcupados = await res.json();
        setAgendamentosDoDia(dadosOcupados);
      } catch (erro) {
        console.error("Erro ao buscar horários", erro);
      } finally {
        setCarregandoHorarios(false);
      }
    }

    buscarHorariosLivres();
  }, [data]);

  const podeContinuar = data && hora;

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "22px",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--texto-principal)",
          marginBottom: "6px",
        }}
      >
        Quando você quer vir?
      </h2>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "13px",
          color: "var(--texto-secundario)",
          marginBottom: "24px",
        }}
      >
        Escolha a data e o horário de preferência.
      </p>

      {/* Seletor de data */}
      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="data-agendamento"
          style={{
            display: "block",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--texto-secundario)",
            marginBottom: "8px",
            letterSpacing: "0.04em",
          }}
        >
          <IcoCalendario size={13} /> Data
        </label>
        <DatePickerField
          id="data-agendamento"
          type="date"
          value={data}
          min={dataMinimaAgendamento()}
          onChange={(e) => setData(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "var(--radius-medium)",
            border: "1px solid var(--borda-escura)",
            backgroundColor: "var(--superficie)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            color: "var(--texto-principal)",
            outline: "none",
          }}
        />
      </div>

      {/* Grade de horários */}
      {data && (
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--texto-secundario)",
              marginBottom: "12px",
              letterSpacing: "0.04em",
            }}
          >
            Horário disponível para {formatarData(data)}
          </p>

          {carregandoHorarios ? (
            <p
              style={{
                fontFamily: "var(--fonte-corpo)",
                fontSize: "13px",
                color: "var(--texto-secundario)",
              }}
            >
              Buscando horários da agenda... 🕵️‍♀️
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
                const [horaH, horaM] = h.split(":").map(Number);
                const [ano, mes, dia] = data.split("-").map(Number);
                const duracao = servico?.duracao_minutos || 60;

                const inicioDesejado = new Date(ano, mes - 1, dia, horaH, horaM);
                const fimDesejado = new Date(
                  inicioDesejado.getTime() + duracao * 60 * 1000
                );

                const ocupado = agendamentosDoDia.some((agendamento) => {
                  const inicioAgendado = new Date(agendamento.inicio);
                  const fimAgendado = new Date(agendamento.fim);
                  return (
                    inicioDesejado < fimAgendado && fimDesejado > inicioAgendado
                  );
                });

                const selecionado = hora === h;

                return (
                  <button
                    key={h}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setHora(h)}
                    style={{
                      padding: "10px 4px",
                      borderRadius: "var(--radius-medium)",
                      border: `2px solid ${
                        ocupado
                          ? "var(--borda-escura)"
                          : selecionado
                          ? "var(--primaria)"
                          : "var(--borda)"
                      }`,
                      backgroundColor: ocupado
                        ? "transparent"
                        : selecionado
                        ? "rgba(183,110,121,0.08)"
                        : "var(--superficie)",
                      color: ocupado
                        ? "var(--texto-secundario)"
                        : selecionado
                        ? "var(--primaria)"
                        : "var(--texto-principal)",
                      fontFamily: "var(--fonte-corpo)",
                      fontSize: "13px",
                      fontWeight: selecionado ? 600 : 400,
                      cursor: ocupado ? "not-allowed" : "pointer",
                      textDecoration: ocupado ? "line-through" : "none",
                      opacity: ocupado ? 0.4 : 1,
                      transition: "all 0.15s ease",
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

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={aoVoltar}
          style={{
            flex: 1,
            padding: "14px",
            backgroundColor: "transparent",
            color: "var(--texto-secundario)",
            border: "1px solid var(--borda-escura)",
            borderRadius: "var(--radius-medium)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => aoAvancar({ data, hora })}
          disabled={!podeContinuar}
          style={{
            flex: 2,
            padding: "14px",
            backgroundColor: podeContinuar ? "var(--primaria)" : "var(--borda)",
            color: podeContinuar ? "white" : "var(--texto-secundario)",
            border: "none",
            borderRadius: "var(--radius-medium)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: podeContinuar ? "pointer" : "not-allowed",
            transition: "background-color 0.2s ease",
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─── Etapa 3 — Dados da cliente ───────────────────────────────────────────────
function EtapaDados({ dadosSalvos, aoAvancar, aoVoltar }) {
  const [nome, setNome] = useState(dadosSalvos?.nome || "");
  const [telefone, setTelefone] = useState(dadosSalvos?.telefone || "");
  const [aniversario, setAniversario] = useState(dadosSalvos?.aniversario_dia_mes || "");
  const [observacoes, setObservacoes] = useState(dadosSalvos?.observacoes || "");
  const [erros, setErros] = useState({});

  function validar() {
    const novosErros = {};
    if (!nome.trim()) novosErros.nome = "Informe seu nome completo.";
    const apenasNumeros = telefone.replace(/\D/g, "");
    if (!telefone.trim()) {
      novosErros.telefone = "Informe seu telefone ou WhatsApp.";
    } else if (apenasNumeros.length < 10) {
      novosErros.telefone =
        "Telefone incompleto. Digite o DDD e o número (ex: 11987654321).";
    }
    if (!aniversarioValido(aniversario)) {
      novosErros.aniversario = "Informe um dia e mês de aniversário válidos.";
    }
    return novosErros;
  }

  function aoSubmeter() {
    const novosErros = validar();
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }
    aoAvancar({
      nome: nome.trim(),
      telefone: telefone.trim(),
      aniversario_dia_mes: aniversario,
      observacoes: observacoes.trim(),
    });
  }

  const estiloLabel = {
    display: "block",
    fontFamily: "var(--fonte-corpo)",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--texto-secundario)",
    marginBottom: "8px",
    letterSpacing: "0.04em",
  };

  const estiloInput = (comErro) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: "var(--radius-medium)",
    border: `1px solid ${comErro ? "var(--erro-texto)" : "var(--borda-escura)"}`,
    backgroundColor: "var(--superficie)",
    fontFamily: "var(--fonte-corpo)",
    fontSize: "14px",
    color: "var(--texto-principal)",
    outline: "none",
  });

  const estiloErro = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "11px",
    color: "var(--erro-texto)",
    marginTop: "4px",
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "22px",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--texto-principal)",
          marginBottom: "6px",
        }}
      >
        Seus dados
      </h2>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "13px",
          color: "var(--texto-secundario)",
          marginBottom: "24px",
        }}
      >
        Para confirmar o agendamento, precisamos de algumas informações.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="nome" style={estiloLabel}>
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          placeholder="Maria Silva"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setErros((p) => ({ ...p, nome: "" }));
          }}
          style={estiloInput(erros.nome)}
          autoComplete="name"
        />
        {erros.nome && <p style={estiloErro}>{erros.nome}</p>}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="telefone" style={estiloLabel}>
          Telefone / WhatsApp
        </label>
        <input
          id="telefone"
          type="tel"
          placeholder="(11) 99999-0000"
          value={telefone}
          maxLength={15}
          onChange={(e) => {
            const valorFormatado = formatarTelefone(e.target.value);
            setTelefone(valorFormatado);
            setErros((p) => ({ ...p, telefone: "" }));
          }}
          style={estiloInput(erros.telefone)}
          autoComplete="tel"
        />
        {erros.telefone && <p style={estiloErro}>{erros.telefone}</p>}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label htmlFor="aniversario" style={estiloLabel}>
          Aniversário: dia e mês <span style={{ fontWeight: 400 }}>(opcional)</span>
        </label>
        <input
          id="aniversario"
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="DD/MM"
          value={aniversario}
          onChange={(e) => {
            setAniversario(formatarDiaMesDigitado(e.target.value));
            setErros((p) => ({ ...p, aniversario: "" }));
          }}
          style={estiloInput(erros.aniversario)}
        />
        {erros.aniversario && <p style={estiloErro}>{erros.aniversario}</p>}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label htmlFor="obs" style={estiloLabel}>
          Observações{" "}
          <span style={{ fontWeight: 400, color: "var(--borda-escura)" }}>
            (opcional)
          </span>
        </label>
        <textarea
          id="obs"
          placeholder="Alguma preferência, alergia ou recado para a Paola..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          style={{
            ...estiloInput(false),
            resize: "vertical",
            lineHeight: 1.5,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={aoVoltar}
          style={{
            flex: 1,
            padding: "14px",
            backgroundColor: "transparent",
            color: "var(--texto-secundario)",
            border: "1px solid var(--borda-escura)",
            borderRadius: "var(--radius-medium)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={aoSubmeter}
          style={{
            flex: 2,
            padding: "14px",
            backgroundColor: "var(--primaria)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-medium)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
        >
          Revisar agendamento
        </button>
      </div>
    </div>
  );
}

// ─── Etapa 4 — Confirmação ────────────────────────────────────────────────────
function EtapaConfirmacao({
  servico,
  dataHora,
  dados,
  aoVoltar,
  aoConfirmar,
  enviando,
  erro,
}) {
  const linhaResumo = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid var(--borda)",
  };

  const estiloChave = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "12px",
    color: "var(--texto-secundario)",
    flexShrink: 0,
  };

  const estiloValor = {
    fontFamily: "var(--fonte-corpo)",
    fontSize: "14px",
    color: "var(--texto-principal)",
    fontWeight: 500,
    textAlign: "right",
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "22px",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--texto-principal)",
          marginBottom: "6px",
        }}
      >
        Tudo certo?
      </h2>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "13px",
          color: "var(--texto-secundario)",
          marginBottom: "20px",
        }}
      >
        Confira as informações antes de confirmar.
      </p>

      {/* Card de resumo */}
      <div
        style={{
          backgroundColor: "var(--superficie)",
          border: "1px solid var(--borda)",
          borderRadius: "var(--radius-medium)",
          padding: "4px 16px",
          marginBottom: "24px",
        }}
      >
        <div style={linhaResumo}>
          <span style={estiloChave}>Serviço</span>
          <span
            style={{
              ...estiloValor,
              fontStyle: "italic",
              fontFamily: "var(--fonte-titulo)",
              fontSize: "16px",
            }}
          >
            {servico.nome}
          </span>
        </div>
        <div style={linhaResumo}>
          <span style={estiloChave}>Data</span>
          <span style={{ ...estiloValor, textTransform: "capitalize" }}>
            {formatarData(dataHora.data)}
          </span>
        </div>
        <div style={linhaResumo}>
          <span style={estiloChave}>Horário</span>
          <span style={estiloValor}>{dataHora.hora}</span>
        </div>
        <div style={linhaResumo}>
          <span style={estiloChave}>Nome</span>
          <span style={estiloValor}>{dados.nome}</span>
        </div>
        <div style={{ ...linhaResumo, borderBottom: "none" }}>
          <span style={estiloChave}>Telefone</span>
          <span style={estiloValor}>{dados.telefone}</span>
        </div>
        {dados.observacoes && (
          <div style={{ ...linhaResumo, borderBottom: "none", paddingTop: 0 }}>
            <span style={estiloChave}>Obs.</span>
            <span style={{ ...estiloValor, fontWeight: 400, fontSize: "13px" }}>
              {dados.observacoes}
            </span>
          </div>
        )}
      </div>

      {/* Valor */}
      {servico.preco_padrao && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(183,110,121,0.06)",
            border: "1px solid rgba(183,110,121,0.18)",
            borderRadius: "var(--radius-medium)",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "13px",
              color: "var(--texto-secundario)",
            }}
          >
            Valor estimado
          </span>
          <span
            style={{
              fontFamily: "var(--fonte-corpo)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--primaria)",
            }}
          >
            {formatarMoeda(servico.preco_padrao)}
          </span>
        </div>
      )}

      {erro && (
        <div
          style={{
            backgroundColor: "var(--erro-fundo)",
            color: "var(--erro-texto)",
            border: "1px solid var(--erro-borda)",
            borderRadius: "var(--radius-medium)",
            padding: "12px 16px",
            fontSize: "13px",
            fontFamily: "var(--fonte-corpo)",
            marginBottom: "16px",
          }}
        >
          {erro}
        </div>
      )}

      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "11px",
          color: "var(--texto-secundario)",
          marginBottom: "16px",
          lineHeight: 1.6,
        }}
      >
        Ao confirmar, a Paola receberá seu agendamento e entrará em contato pelo
        WhatsApp para finalizar.
      </p>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={aoVoltar}
          disabled={enviando}
          style={{
            flex: 1,
            padding: "14px",
            backgroundColor: "transparent",
            color: "var(--texto-secundario)",
            border: "1px solid var(--borda-escura)",
            borderRadius: "var(--radius-medium)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            cursor: enviando ? "not-allowed" : "pointer",
            opacity: enviando ? 0.5 : 1,
          }}
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={aoConfirmar}
          disabled={enviando}
          style={{
            flex: 2,
            padding: "14px",
            backgroundColor: enviando ? "var(--borda)" : "var(--primaria)",
            color: enviando ? "var(--texto-secundario)" : "white",
            border: "none",
            borderRadius: "var(--radius-medium)",
            fontFamily: "var(--fonte-corpo)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: enviando ? "not-allowed" : "pointer",
            transition: "background-color 0.2s ease",
          }}
        >
          {enviando ? "Confirmando..." : "Confirmar agendamento"}
        </button>
      </div>
    </div>
  );
}

// ─── Tela de sucesso ──────────────────────────────────────────────────────────
function Sucesso({ servico, dataHora, dados }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0 32px" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "var(--sucesso-fundo)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <IcoCheck size={30} style={{ color: "var(--sucesso-texto)" }} />
      </div>

      <h2
        style={{
          fontFamily: "var(--fonte-titulo)",
          fontSize: "24px",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--texto-principal)",
          marginBottom: "8px",
        }}
      >
        Agendamento confirmado!
      </h2>
      <p
        style={{
          fontFamily: "var(--fonte-corpo)",
          fontSize: "14px",
          color: "var(--texto-secundario)",
          lineHeight: 1.6,
          marginBottom: "24px",
        }}
      >
        Olá, {dados.nome.split(" ")[0]}! Seu agendamento para{" "}
        <strong>{servico.nome}</strong> em{" "}
        <strong style={{ textTransform: "capitalize" }}>
          {formatarData(dataHora.data)}
        </strong>{" "}
        às <strong>{dataHora.hora}</strong> foi recebido. A Paola vai entrar em
        contato pelo WhatsApp para confirmar.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          backgroundColor: "var(--primaria)",
          color: "white",
          borderRadius: "var(--radius-medium)",
          fontFamily: "var(--fonte-corpo)",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PaginaAgendamento() {
  const [etapa, setEtapa] = useState(0);
  const [servico, setServico] = useState(null);
  const [dataHora, setDataHora] = useState(null);
  const [dados, setDados] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [concluido, setConcluido] = useState(false);

  // Scroll ao topo em cada troca de etapa
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [etapa]);

  async function confirmar() {
    setEnviando(true);
    setErroEnvio("");

    try {
      const [ano, mes, dia] = dataHora.data.split("-").map(Number);
      const [horaH, horaM] = dataHora.hora.split(":").map(Number);
      const duracao = servico.duracao_minutos || 60;
      const inicio = new Date(ano, mes - 1, dia, horaH, horaM);
      const fim = new Date(inicio.getTime() + duracao * 60 * 1000);

      const criarAgendamento = await fetch("/api/agendamentos/publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: {
            nome: dados.nome,
            telefone: dados.telefone,
            aniversario_dia_mes: dados.aniversario_dia_mes || null,
          },
          servicos: [servico.id],
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          observacoes: dados.observacoes || null,
        }),
      });

      if (!criarAgendamento.ok) {
        const body = await criarAgendamento.json();
        if (criarAgendamento.status === 409) {
          throw new Error("Esse horário já está ocupado. Escolha outro.");
        }
        throw new Error(
          body?.error || "Não foi possível confirmar. Tente novamente."
        );
      }

      setConcluido(true);
    } catch (e) {
      setErroEnvio(e.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--fundo)",
        paddingTop: "var(--navbar-altura)",
      }}
    >
      <main
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "32px 16px 48px",
        }}
      >
        {concluido ? (
          <Sucesso servico={servico} dataHora={dataHora} dados={dados} />
        ) : (
          <>
            <BarraProgresso etapaAtual={etapa} />

            {etapa === 0 && (
              <EtapaServico
                servicoSelecionado={servico}
                aoAvancar={(s) => {
                  setServico(s);
                  setEtapa(1);
                }}
              />
            )}

            {etapa === 1 && (
              <EtapaData
                servico={servico}
                dataHoraSelecionada={dataHora}
                aoAvancar={(dh) => {
                  setDataHora(dh);
                  setEtapa(2);
                }}
                aoVoltar={() => setEtapa(0)}
              />
            )}

            {etapa === 2 && (
              <EtapaDados
                dadosSalvos={dados}
                aoAvancar={(d) => {
                  setDados(d);
                  setEtapa(3);
                }}
                aoVoltar={() => setEtapa(1)}
              />
            )}

            {etapa === 3 && (
              <EtapaConfirmacao
                servico={servico}
                dataHora={dataHora}
                dados={dados}
                aoVoltar={() => setEtapa(2)}
                aoConfirmar={confirmar}
                enviando={enviando}
                erro={erroEnvio}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
