"use client";

import { useState } from "react";
import styles from "./meus-agendamentos.module.css";

export default function ResultadosConsulta({
  estado,
  agendamentos = [],
  mensagemErro = "Não foi possível consultar seus horários. Tente novamente.",
}) {
  if (estado === "carregando") {
    return (
      <div className={styles.resultado} role="status">
        Consultando agendamentos...
      </div>
    );
  }

  if (estado === "erro") {
    return (
      <div className={styles.resultadoErro} role="alert">
        {mensagemErro}
      </div>
    );
  }

  if (estado === "vazio") {
    return (
      <div className={styles.resultado} role="status">
        Nenhum agendamento futuro encontrado.
      </div>
    );
  }

  if (estado !== "sucesso") return null;

  return (
    <div className={styles.lista} aria-label="Próximos agendamentos">
      {agendamentos.map((agendamento) => (
        <article className={styles.card} key={agendamento.id}>
          <div className={styles.cardTopo}>
            <h3>{agendamento.servico}</h3>
            <span className={styles.status}>{agendamento.status}</span>
          </div>
          <p>
            <strong>Data:</strong> {agendamento.data}
          </p>
          <p>
            <strong>Horário:</strong> {agendamento.horario}
          </p>
        </article>
      ))}
    </div>
  );
}

export function PreviaResultados() {
  const [estado, setEstado] = useState("sucesso");

  const exemplo = [
    {
      id: "exemplo-1",
      servico: "Serviço de exemplo",
      data: "15/10/2026",
      horario: "14h00",
      status: "Confirmado",
    },
  ];

  return (
    <section className={styles.previa} aria-labelledby="previa-titulo">
      <h2 id="previa-titulo">Prévia para desenvolvimento</h2>
      <p>Dados fictícios para testar a aparência dos resultados.</p>

      <div className={styles.opcoesPrevia} aria-label="Testar estados da consulta">
        {["sucesso", "carregando", "vazio", "erro"].map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setEstado(opcao)}
            aria-pressed={estado === opcao}
          >
            {opcao}
          </button>
        ))}
      </div>

      <ResultadosConsulta
        estado={estado}
        agendamentos={exemplo}
        mensagemErro="Exemplo de mensagem de erro na consulta."
      />
    </section>
  );
}