"use client";

import { useEffect, useState } from "react";
import "./Acessibilidade.css";

const CHAVE_CONTRASTE = "acessibilidade-contraste";
const CHAVE_TAMANHO = "acessibilidade-texto";

export default function Acessibilidade() {
  const [contraste, setContraste] = useState(false);
  const [tamanho, setTamanho] = useState(100);
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);

  useEffect(() => {
    const contrasteSalvo = localStorage.getItem(CHAVE_CONTRASTE);
    const tamanhoSalvo = Number(localStorage.getItem(CHAVE_TAMANHO));

    const contrasteInicial = contrasteSalvo === "true";
    const tamanhoInicial = [100, 120, 140].includes(tamanhoSalvo)
      ? tamanhoSalvo
      : 100;

    setContraste(contrasteInicial);
    setTamanho(tamanhoInicial);

    const pagina = document.documentElement;
    pagina.setAttribute(
      "data-acessibilidade-contraste",
      String(contrasteInicial)
    );
    pagina.setAttribute(
      "data-acessibilidade-texto",
      String(tamanhoInicial)
    );

    setPreferenciasCarregadas(true);
  }, []);

  useEffect(() => {
    if (!preferenciasCarregadas) return;

    const pagina = document.documentElement;

    pagina.setAttribute("data-acessibilidade-texto", String(tamanho));
    pagina.setAttribute("data-acessibilidade-contraste", String(contraste));

    localStorage.setItem(CHAVE_TAMANHO, String(tamanho));
    localStorage.setItem(CHAVE_CONTRASTE, String(contraste));
  }, [contraste, tamanho, preferenciasCarregadas]);

  function restaurarPadrao() {
    setContraste(false);
    setTamanho(100);
  }

  function fecharComEscape(evento) {
    if (evento.key === "Escape") {
      evento.currentTarget.open = false;
      evento.currentTarget.querySelector("summary").focus();
    }
  }

  return (
    <details className="acessibilidade" onKeyDown={fecharComEscape}>
      <summary aria-label="Acessibilidade" title="Acessibilidade">
        <svg
          className="acessibilidade-icone"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="4" r="2" />
          <path d="M4 8l8 2 8-2M12 10v5M12 15l-4 6M12 15l4 6" />
        </svg>
        <span className="acessibilidade-texto">Acessibilidade</span>
      </summary>

      <div className="acessibilidade-painel">
        <strong>Opções de acessibilidade</strong>

        <button
          type="button"
          aria-pressed={contraste}
          onClick={() => setContraste((valorAtual) => !valorAtual)}
        >
          Alto contraste: {contraste ? "ativado" : "desativado"}
        </button>

        <p aria-live="polite">Tamanho do texto: {tamanho}%</p>

        <div className="acessibilidade-tamanho">
          <button
            type="button"
            aria-label="Diminuir tamanho do texto"
            disabled={tamanho === 100}
            onClick={() => setTamanho((valorAtual) => valorAtual - 20)}
          >
            A−
          </button>

          <button
            type="button"
            aria-label="Aumentar tamanho do texto"
            disabled={tamanho === 140}
            onClick={() => setTamanho((valorAtual) => valorAtual + 20)}
          >
            A+
          </button>
        </div>

        <button type="button" onClick={restaurarPadrao}>
          Restaurar padrão
        </button>
      </div>
    </details>
  );
}
