// Formata timestamp para "09:00"
// Fica aqui pois só esse componente usa essa função
function formatarHora(valor) {
  const data = new Date(valor)
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ListaAgendamentos({ agendamentos }) {
  return (
    <div>

      {/* Cabeçalho da seção */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--texto-principal)",
            fontFamily: "var(--fonte-corpo)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Agenda de hoje
        </p>
        <a
          href="/admin/agendamentos"
          style={{
            fontSize: "11px",
            color: "var(--primaria)",
            textDecoration: "none",
            fontFamily: "var(--fonte-corpo)",
          }}
        >
          Ver tudo →
        </a>
      </div>

      {/* Lista ou mensagem vazia */}
      {agendamentos.length === 0 ? (
        <p
          style={{
            fontSize: "13px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          Nenhum agendamento para hoje.
        </p>
      ) : (
        agendamentos.map((item) => (
          <div
            key={item.id}
            className="d-flex align-items-center gap-3 rounded-3 px-3 py-3 mb-2"
            style={{
              backgroundColor: "var(--superficie)",
              border: "1px solid var(--borda)",
            }}
          >
            {/* Hora */}
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--primaria)",
                fontFamily: "var(--fonte-corpo)",
                minWidth: "44px",
                margin: 0,
              }}
            >
              {formatarHora(item.inicio)}
            </p>

            {/* Nome e serviços */}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--texto-principal)",
                  fontFamily: "var(--fonte-corpo)",
                  margin: 0,
                }}
              >
                {item.cliente_nome}
                
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--texto-secundario)",
                  fontFamily: "var(--fonte-corpo)",
                  margin: "2px 0 0",
                }}
              >
                {Array.isArray(item.servicos)
                  ? item.servicos.map((s) => s.nome).join(", ")
                  : item.servicos}
                
              </p>
            </div>

            {/* Badge de status */}
            <span
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "20px",
                fontWeight: 500,
                fontFamily: "var(--fonte-corpo)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                backgroundColor:
                  item.status === "realizado" ? "var(--info-fundo)" :
                  item.status === "faltou"    ? "var(--erro-fundo)" :
                  item.status === "cancelado" ? "var(--alerta-fundo)"  :
                  "var(--sucesso-fundo)",
                color:
                  item.status === "realizado" ? "var(--info-texto)" :
                  item.status === "faltou"    ? "var(--erro-texto)" :
                  item.status === "cancelado" ? "var(--alerta-texto)"  :
                  "var(--sucesso-texto)",
              }}
            >
              {item.status}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
