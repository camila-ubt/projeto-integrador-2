export default function HeaderDashboard({ nome, inicial, saudacao, tituloPagina, aoSair }) {
  return (
    <header
     
      className="admin-header d-flex align-items-center py-3"
      style={{
        backgroundColor: "var(--superficie)",
        borderBottom: "1px solid var(--borda)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        gap: "1rem",
      }}
    >
      {/* ── Saudação e nome ──────────────────────────────────────── */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: "12px",
          color: "var(--texto-secundario)",
          fontFamily: "var(--fonte-corpo)",
          margin: 0,
          whiteSpace: "nowrap",
        }}>
          {saudacao} 👋
        </p>
        <p style={{
          fontSize: "17px",
          fontWeight: 600,
          fontStyle: "italic",
          color: "var(--texto-principal)",
          fontFamily: "var(--fonte-titulo)",
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {nome}
        </p>
      </div>

      
      {tituloPagina && (
        <p
          style={{
            flexGrow: 1,
            textAlign: "center",
            fontSize: "11px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {tituloPagina}
        </p>
      )}

      {/* ── Espaçador quando não há título (mantém avatar à direita) */}
      {!tituloPagina && <div style={{ flexGrow: 1 }} />}

      {/* ── Avatar — clica para sair ─────────────────────────────── */}
      <button
        type="button"
        onClick={aoSair}
        title="Sair do painel"
        aria-label="Sair do painel administrativo"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          backgroundColor: "var(--primaria)",
          color: "var(--superficie)",
          border: "none",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--fonte-corpo)",
          flexShrink: 0,
        }}
      >
        {inicial}
      </button>
    </header>
  );
}
