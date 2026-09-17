
//Calcula prazo de retorno em relação data atual
function calcularPrazo(dataRecomendada) {
  const hoje = new Date();
  //zera o relogio, pega as datas mas ignora minutos/segundos
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataRecomendada);
  data.setHours(0, 0, 0, 0);
  //transforma em dias inteiros (1000 ms × 60 seg × 60 min × 24 horas = 1 dia)
  const diff = Math.round((data - hoje) / (1000 * 60 * 60 * 24));

  if (diff < 0)
    return { texto: `Vencido há ${Math.abs(diff)}d`, vencido: true };
  if (diff === 0) return { texto: "Hoje", vencido: false };
  if (diff === 1) return { texto: "Amanhã", vencido: false };
  return { texto: `Em ${diff} dias`, vencido: false };
}

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
          const prazo = calcularPrazo(item.data_recomendada)
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
