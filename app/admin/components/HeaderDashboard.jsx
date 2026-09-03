export default function HeaderDashboard({ nome, inicial, saudacao, aoSair }) {
  return (
    <header
      className="d-flex justify-content-between align-items-center px-3 py-3"
      style={{
        backgroundColor: "var(--superficie)",
        borderBottom: "1px solid var(--borda)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Saudação e nome */}
      <div>
        <p
          style={{
            fontSize: "12px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            margin: 0,
          }}
        >
          {saudacao} 👋
        </p>
        <p
          style={{
            fontSize: "17px",
            fontWeight: 600,
            fontStyle: "italic",
            color: "var(--texto-principal)",
            fontFamily: "var(--fonte-titulo)",
            margin: 0,
          }}
        >
          {nome}
        </p>
      </div>

      {/* Avatar com inicial — clica para sair */}
      <button
        type="button"
        onClick={aoSair}
        title="Sair do painel"
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
        }}
      >
        {inicial}
      </button>
    </header>
  );
}
