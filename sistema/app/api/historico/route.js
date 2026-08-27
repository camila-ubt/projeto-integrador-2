import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/historico?cliente_id=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("cliente_id");

    const condicoes = [];
    const valores = [];
    if (clienteId) {
      valores.push(clienteId);
      condicoes.push(`h.cliente_id = $${valores.length}`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT h.*, c.nome AS cliente_nome, s.nome AS servico_nome
         FROM historico_procedimentos h
         JOIN clientes c ON c.id = h.cliente_id
         LEFT JOIN servicos s ON s.id = h.servico_id
         ${where}
        ORDER BY h.data_procedimento DESC`,
      valores
    );
    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}

// POST /api/historico -> registra um procedimento realizado
// body: { cliente_id, agendamento_id?, servico_id?, produto_utilizado?, cor?, tecnica?, observacoes?, data_procedimento? }
export async function POST(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const {
    cliente_id,
    agendamento_id,
    servico_id,
    produto_utilizado,
    cor,
    tecnica,
    observacoes,
    data_procedimento,
  } = body ?? {};

  if (!cliente_id) return jsonError("O campo 'cliente_id' é obrigatório.", 400);

  try {
    const { rows } = await query(
      `INSERT INTO historico_procedimentos
         (cliente_id, agendamento_id, servico_id, produto_utilizado, cor, tecnica, observacoes, data_procedimento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE))
       RETURNING *`,
      [
        cliente_id,
        agendamento_id ?? null,
        servico_id ?? null,
        produto_utilizado ?? null,
        cor ?? null,
        tecnica ?? null,
        observacoes ?? null,
        data_procedimento ?? null,
      ]
    );
    return jsonOk(rows[0], 201);
  } catch (error) {
    return handleDbError(error);
  }
}
