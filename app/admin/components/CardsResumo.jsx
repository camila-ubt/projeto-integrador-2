

// Formata número para moeda brasileira: 480 → "R$ 480,00"
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor)
}

export default function CardsResumo({ totalAgendamentos, totalRetornos, faturamento }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginBottom: "24px",
      }}
    >
      {/* Card: agendamentos hoje */}
      <div
        className="rounded-3 p-3"
        style={{
          backgroundColor: "var(--superficie)",
          border: "1px solid var(--borda)",
        }}
      >
        <p
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--primaria)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {totalAgendamentos}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "4px 0 0",
          }}
        >
          Hoje
        </p>
      </div>

      {/* Card: retornos pendentes */}
      <div
        className="rounded-3 p-3"
        style={{
          backgroundColor: "var(--superficie)",
          border: "1px solid var(--borda)",
        }}
      >
        <p
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--acento-dourado)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {totalRetornos}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "4px 0 0",
          }}
        >
          Retornos
        </p>
      </div>

      {/* Card: faturamento — ocupa as 2 colunas */}
      <div
        className="rounded-3 p-3 d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "var(--primaria)",
          gridColumn: "span 2",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--superficie)",
              margin: 0,
            }}
          >
            {formatarMoeda(faturamento)}
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--fonte-corpo)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "4px 0 0",
            }}
          >
            Faturamento do dia
          </p>
        </div>
        <span style={{ fontSize: "26px", opacity: 0.5 }}>💰</span>
      </div>
    </div>
  )
}
