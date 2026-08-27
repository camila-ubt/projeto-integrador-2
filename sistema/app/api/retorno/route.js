import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/retornos?status=pendente&cliente_id=...
// A maioria dos retornos é criada automaticamente pelo trigger do banco quando
// um agendamento muda para status 'realizado'. Esta rota também permite criar
// um retorno manual (ex.: contato avulso).
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clienteId = searchParams.get("cliente_id");

    const condicoes = [];
    const valores = [];
    if (status) {
      valores.push(status);
      condicoes.push(`r.status = $${valores.length}`);
    }
    if (clienteId) {
      valores.push(clienteId);
      condicoes.push(`r.cliente_id = $${valores.length}`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT r.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone, s.nome AS servico_nome
         FROM retornos r
         JOIN clientes c ON c.id = r.cliente_id
         LEFT JOIN servicos s ON s.id = r.servico_id
         ${where}
        ORDER BY r.data_recomendada ASC`,
      valores
    );
    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}

// POST /api/retornos -> cria retorno manual
// body: { cliente_id, servico_id?, data_recomendada, observacoes? }
export async function POST(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { cliente_id, servico_id, data_recomendada, observacoes } = body ?? {};
  if (!cliente_id || !data_recomendada) {
    return jsonError("Os campos 'cliente_id' e 'data_recomendada' são obrigatórios.", 400);
  }

  try {
    const { rows } = await query(
      `INSERT INTO retornos (cliente_id, servico_id, data_recomendada, observacoes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cliente_id, servico_id ?? null, data_recomendada, observacoes ?? null]
    );
    return jsonOk(rows[0], 201);
  } catch (error) {
    return handleDbError(error);
  }
}
