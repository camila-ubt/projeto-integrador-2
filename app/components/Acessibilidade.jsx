"use client";

import { useEffect, useState } from "react";
import "./Acessibilidade.css";

export default function Acessibilidade() {
  const [contraste, setContraste] = useState(false);
  const [tamanho, setTamanho] = useState(100);

  useEffect(() => {
    const pagina = document.documentElement;

    pagina.setAttribute("data-acessibilidade-texto", String(tamanho));
    pagina.setAttribute("data-acessibilidade-contraste", String(contraste));

    return () => {
      pagina.removeAttribute("data-acessibilidade-texto");
      pagina.removeAttribute("data-acessibilidade-contraste");
    };
  }, [contraste, tamanho]);

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
      <summary>Acessibilidade</summary>

      <div className="acessibilidade-painel">
        <strong>Opções de acessibilidade</strong>

        <button
          type="button"
          aria-pressed={contraste}
          onClick={() => setContraste(!contraste)}
        >
          Alto contraste: {contraste ? "ativado" : "desativado"}
        </button>

        <p aria-live="polite">Tamanho do texto: {tamanho}%</p>

        <div className="acessibilidade-tamanho">
          <button
            type="button"
            aria-label="Diminuir tamanho do texto"
            disabled={tamanho === 100}
            onClick={() => setTamanho(tamanho - 20)}
          >
            A−
          </button>

          <button
            type="button"
            aria-label="Aumentar tamanho do texto"
            disabled={tamanho === 140}
            onClick={() => setTamanho(tamanho + 20)}
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