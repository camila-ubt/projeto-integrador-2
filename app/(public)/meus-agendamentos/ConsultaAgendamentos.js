"use client";

import { useState } from "react";
import styles from "./meus-agendamentos.module.css";
import ResultadosConsulta from "./ResultadosConsulta";

function formatarTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export default function ConsultaAgendamentos() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estado, setEstado] = useState("inicial");
  const [agendamentos, setAgendamentos] = useState([]);
  const [mensagemErro, setMensagemErro] = useState("");

  async function consultar(evento) {
    evento.preventDefault();
    setEstado("carregando");
    setAgendamentos([]);
    setMensagemErro("");

    try {
      const resposta = await fetch("/api/agendamentos/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error || "Não foi possível consultar seus horários."
        );
      }

      if (!Array.isArray(dados) || dados.length === 0) {
        setEstado("vazio");
        return;
      }

      setAgendamentos(dados);
      setEstado("sucesso");
    } catch (erro) {
      setMensagemErro(
        erro instanceof Error
          ? erro.message
          : "Não foi possível consultar seus horários."
      );
      setEstado("erro");
    }
  }

  const carregando = estado === "carregando";

  return (
    <>
      <form className={styles.formulario} onSubmit={consultar}>
        <div className={styles.campo}>
          <label htmlFor="nome-cliente">Nome usado no agendamento</label>
          <input
            id="nome-cliente"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
            minLength={2}
            maxLength={120}
            disabled={carregando}
          />
        </div>

        <div className={styles.campo}>
          <label htmlFor="telefone-cliente">
            Telefone usado no agendamento
          </label>
          <input
            id="telefone-cliente"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(evento) =>
              setTelefone(formatarTelefone(evento.target.value))
            }
            required
            minLength={8}
            maxLength={15}
            disabled={carregando}
          />
        </div>

        <button type="submit" className={styles.botao} disabled={carregando}>
          {carregando ? "Consultando..." : "Consultar meus agendamentos"}
        </button>
      </form>

      <div className={styles.consultaResultado}>
        <ResultadosConsulta
          estado={estado}
          agendamentos={agendamentos}
          mensagemErro={mensagemErro}
        />
      </div>
    </>
  );
}
