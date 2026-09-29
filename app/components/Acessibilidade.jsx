"use client";

import { useEffect, useSyncExternalStore } from "react";
import "./Acessibilidade.css";

const CHAVE_CONTRASTE = "acessibilidade-contraste";
const CHAVE_TAMANHO = "acessibilidade-texto";
const EVENTO_PREFERENCIAS = "preferencias-acessibilidade-alteradas";

function assinarPreferencias(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO_PREFERENCIAS, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO_PREFERENCIAS, callback);
  };
}

function lerContraste() {
  return localStorage.getItem(CHAVE_CONTRASTE) === "true";
}

function lerTamanho() {
  const valor = Number(localStorage.getItem(CHAVE_TAMANHO));
  return [100, 120, 140].includes(valor) ? valor : 100;
}

function salvarPreferencia(chave, valor) {
  localStorage.setItem(chave, String(valor));
  window.dispatchEvent(new Event(EVENTO_PREFERENCIAS));
}

export default function Acessibilidade() {
  const contraste = useSyncExternalStore(
    assinarPreferencias,
    lerContraste,
    () => false
  );

  const tamanho = useSyncExternalStore(
    assinarPreferencias,
    lerTamanho,
    () => 100
  );

  useEffect(() => {
    const pagina = document.documentElement;

    pagina.setAttribute("data-acessibilidade-texto", String(tamanho));
    pagina.setAttribute("data-acessibilidade-contraste", String(contraste));
  }, [contraste, tamanho]);

  function restaurarPadrao() {
    localStorage.setItem(CHAVE_CONTRASTE, "false");
    localStorage.setItem(CHAVE_TAMANHO, "100");
    window.dispatchEvent(new Event(EVENTO_PREFERENCIAS));
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
          onClick={() => salvarPreferencia(CHAVE_CONTRASTE, !contraste)}
        >
          Alto contraste: {contraste ? "ativado" : "desativado"}
        </button>

        <p aria-live="polite">Tamanho do texto: {tamanho}%</p>

        <div className="acessibilidade-tamanho">
          <button
            type="button"
            aria-label="Diminuir tamanho do texto"
            disabled={tamanho === 100}
            onClick={() => salvarPreferencia(CHAVE_TAMANHO, tamanho - 20)}
          >
            A−
          </button>

          <button
            type="button"
            aria-label="Aumentar tamanho do texto"
            disabled={tamanho === 140}
            onClick={() => salvarPreferencia(CHAVE_TAMANHO, tamanho + 20)}
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
