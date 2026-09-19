"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PaginaServicos() {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    async function carregarServicos() {
      try {
        const resposta = await fetch("/api/servicos");

        if (!resposta.ok) {
          throw new Error();
        }

        const dados = await resposta.json();
        setServicos(Array.isArray(dados) ? dados : []);
      } catch {
        setErro("Não foi possível carregar os serviços.");
      } finally {
        setCarregando(false);
      }
    }

    carregarServicos();
  }, []);

  function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "70px 24px",
      }}
    >
      <header
        style={{
          textAlign: "center",
          marginBottom: "55px",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "3px",
            fontSize: "12px",
            color: "var(--texto-secundario)",
            marginBottom: "10px",
          }}
        >
          Paola Galvão Studio
        </p>

        <h1
          style={{
            fontSize: "38px",
            fontWeight: "500",
            marginBottom: "12px",
          }}
        >
          Serviços
        </h1>

        <p
          style={{
            color: "var(--texto-secundario)",
          }}
        >
          Conheça nossos procedimentos
        </p>
      </header>

      {carregando && (
        <p style={{ textAlign: "center" }}>Carregando serviços...</p>
      )}

      {erro && (
        <p style={{ textAlign: "center" }}>
          {erro}
        </p>
      )}

      <section>
        {servicos.map((servico) => {
          const estaAberto = aberto === servico.id;

          return (
            <article
              key={servico.id}
              onMouseEnter={() => setAberto(servico.id)}
              onMouseLeave={() => setAberto(null)}
              style={{
                borderBottom: "1px solid var(--borda)",
                transition: "all 0.3s ease",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setAberto(estaAberto ? null : servico.id)
                }
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  padding: "24px 4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    fontSize: "19px",
                    fontWeight: "500",
                  }}
                >
                  {servico.nome}
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexShrink: 0,
                  }}
                >
                  {servico.preco_padrao != null && (
                    <span
                      style={{
                        fontSize: "15px",
                        color: "var(--texto-secundario)",
                      }}
                    >
                      {formatarPreco(servico.preco_padrao)}
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: "22px",
                      transition: "transform 0.3s ease",
                      transform: estaAberto
                        ? "rotate(45deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    +
                  </span>
                </div>
              </button>

              <div
                style={{
                  maxHeight: estaAberto ? "350px" : "0",
                  opacity: estaAberto ? 1 : 0,
                  overflow: "hidden",
                  transform: estaAberto
                    ? "translateY(0)"
                    : "translateY(-8px)",
                  transition:
                    "max-height 0.35s ease, opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                <div
                  style={{
                    padding: "0 4px 28px",
                    maxWidth: "650px",
                  }}
                >
                  {servico.descricao && (
                    <p
                      style={{
                        lineHeight: "1.7",
                        color: "var(--texto-secundario)",
                        marginBottom: "18px",
                      }}
                    >
                      {servico.descricao}
                    </p>
                  )}

                  {servico.duracao_minutos && (
                    <p
                      style={{
                        fontSize: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      Duração: {servico.duracao_minutos} minutos
                    </p>
                  )}

                  {servico.necessita_avaliacao && (
                    <p
                      style={{
                        fontSize: "14px",
                        marginBottom: "18px",
                      }}
                    >
                      Necessita de avaliação prévia.
                    </p>
                  )}

                  <Link
                    href="/agendar"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-block",
                      marginTop: "12px",
                      padding: "11px 24px",
                      background: "var(--primaria)",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "var(--radius-medium)",
                      fontSize: "14px",
                    }}
                  >
                    Agendar
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}