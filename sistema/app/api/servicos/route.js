import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/servicos?todos=true -> lista serviços (por padrão só os ativos)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const todos = searchParams.get("todos") === "true";

    const { rows } = await query(
      `SELECT * FROM servicos
        ${todos ? "" : "WHERE ativo = true"}
        ORDER BY nome ASC`
    );
    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}

// POST /api/servicos -> cria serviço
// body: { nome, descricao?, duracao_minutos?, preco_padrao?, necessita_avaliacao?, retorno_dias? }
export async function POST(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const {
    nome,
    descricao,
    duracao_minutos,
    preco_padrao,
    necessita_avaliacao,
    retorno_dias,
  } = body ?? {};

  if (!nome) return jsonError("O campo 'nome' é obrigatório.", 400);

  try {
    const { rows } = await query(
      `INSERT INTO servicos
         (nome, descricao, duracao_minutos, preco_padrao, necessita_avaliacao, retorno_dias)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        nome,
        descricao ?? null,
        duracao_minutos ?? null,
        preco_padrao ?? null,
        necessita_avaliacao ?? false,
        retorno_dias ?? null,
      ]
    );
    return jsonOk(rows[0], 201);
  } catch (error) {
    return handleDbError(error);
  }
}
