import { query, withTransaction } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// Lista agendamentos no período, já com o nome do cliente e os serviços agregados.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");
    const status = searchParams.get("status");
    const clienteId = searchParams.get("cliente_id");

    const condicoes = [];
    const valores = [];

    if (inicio) {
      valores.push(inicio);
      condicoes.push(`a.inicio >= $${valores.length}`);
    }
    if (fim) {
      valores.push(fim);
      condicoes.push(`a.inicio <= $${valores.length}`);
    }
    if (status) {
      valores.push(status);
      condicoes.push(`a.status = $${valores.length}`);
    }
    if (clienteId) {
      valores.push(clienteId);
      condicoes.push(`a.cliente_id = $${valores.length}`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT
          a.*,
          c.nome AS cliente_nome,
          c.telefone AS cliente_telefone,
          COALESCE(
            json_agg(
              json_build_object(
                'servico_id', s.id,
                'nome', s.nome,
                'valor', ags.valor
              )
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) AS servicos
        FROM agendamentos a
        JOIN clientes c ON c.id = a.cliente_id
        LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
        LEFT JOIN servicos s ON s.id = ags.servico_id
        ${where}
        GROUP BY a.id, c.nome, c.telefone
        ORDER BY a.inicio ASC`,
      valores
    );

    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}

// POST /api/agendamentos -> cria agendamento + serviços vinculados (transação)
// body: {
//   cliente_id, inicio, fim, observacoes?,
//   servicos: [{ servico_id, valor }]   // valor opcional -> usa preco_padrao do serviço
// }
export async function POST(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { cliente_id, inicio, fim, observacoes, servicos } = body ?? {};

  if (!cliente_id || !inicio || !fim) {
    return jsonError("Os campos 'cliente_id', 'inicio' e 'fim' são obrigatórios.", 400);
  }
  if (!Array.isArray(servicos) || servicos.length === 0) {
    return jsonError("Informe ao menos um serviço em 'servicos' (array).", 400);
  }

  try {
    const agendamento = await withTransaction(async (client) => {
      const { rows: agendamentoRows } = await client.query(
        `INSERT INTO agendamentos (cliente_id, inicio, fim, observacoes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [cliente_id, inicio, fim, observacoes ?? null]
      );
      const novoAgendamento = agendamentoRows[0];

      for (const item of servicos) {
        if (!item?.servico_id) {
          throw Object.assign(new Error("Cada serviço precisa de 'servico_id'."), {
            code: "APP_VALIDATION",
          });
        }

        let valor = item.valor;
        if (valor === undefined || valor === null) {
          const { rows: servicoRows } = await client.query(
            "SELECT preco_padrao FROM servicos WHERE id = $1",
            [item.servico_id]
          );
          if (servicoRows.length === 0) {
            throw Object.assign(new Error("Serviço informado não existe."), { code: "23503" });
          }
          valor = servicoRows[0].preco_padrao;
        }

        await client.query(
          `INSERT INTO agendamento_servicos (agendamento_id, servico_id, valor)
           VALUES ($1, $2, $3)`,
          [novoAgendamento.id, item.servico_id, valor]
        );
      }

      return novoAgendamento;
    });

    return jsonOk(agendamento, 201);
  } catch (error) {
    if (error.code === "APP_VALIDATION") return jsonError(error.message, 400);
    if (error.constraint === "impedir_conflito_horarios") {
      return jsonError("Já existe um agendamento nesse mesmo horário.", 409);
    }
    return handleDbError(error);
  }
}
