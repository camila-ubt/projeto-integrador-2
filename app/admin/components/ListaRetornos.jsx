import { calcularPrazoRetorno } from "@/lib/formatters"

export default function ListaRetornos({ retornos }) {
  return (
  <div style={{ marginTop: "24px" }}>

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
          Retornos pendentes
        </p>
        <a
          href="/admin/retornos"
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
      {retornos.length === 0 ? (
        <p
          style={{
            fontSize: "13px",
            color: "var(--texto-secundario)",
            fontFamily: "var(--fonte-corpo)",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          Nenhum retorno pendente.
        </p>
      ) : (
        retornos.map((item) => {
          const prazo = calcularPrazoRetorno(item.data_recomendada)
          return (
            <div
              key={item.id}
              className="d-flex align-items-center gap-3 rounded-3 px-3 py-3 mb-2"
              style={{
                backgroundColor: "var(--superficie)",
                border: "1px solid var(--borda)",
                borderLeftWidth: "3px",
                borderLeftColor: "var(--acento-dourado)",
              }}
            >
              {/* Ícone: ⏰ se vencido, 📅 se futuro */}
              <span style={{ fontSize: "18px" }}>
                {prazo.vencido ? "⏰" : "📅"}
              </span>

              {/* Nome e serviço */}
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
                  {item.servico_nome}
                 
                </p>
              </div>

              {/* Prazo: vermelho se vencido, marrom se futuro */}
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  fontFamily: "var(--fonte-corpo)",
                  margin: 0,
                  color: prazo.vencido
                    ? "var(--erro-texto)"
                    : "var(--primaria-escura)",
                }}
              >
                {prazo.texto}
              </p>
            </div>
          )
        })
      )}
    </div>
  )
}
