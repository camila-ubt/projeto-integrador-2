import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";
import { aniversarioValido } from "@/lib/aniversario";

// GET /api/clientes?busca=texto -> lista clientes (busca por nome ou telefone)
export async function GET(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca")?.trim();

    const params = [];
    let where = "";
    if (busca) {
      params.push(`%${busca}%`);
      where = `WHERE nome ILIKE $1 OR telefone ILIKE $1`;
    }

    const { rows } = await query(
      `SELECT id, nome, telefone,
              COALESCE(aniversario_dia_mes, to_char(aniversario, 'DD/MM')) AS aniversario_dia_mes,
              observacoes, criado_em, atualizado_em
         FROM clientes
         ${where}
        ORDER BY nome ASC`,
      params
    );

    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}

// POST /api/clientes -> cria cliente
// body: { nome, telefone, aniversario_dia_mes?, observacoes? }
export async function POST(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { nome, telefone, aniversario_dia_mes, observacoes } = body ?? {};
  if (!nome || !telefone) {
    return jsonError("Os campos 'nome' e 'telefone' são obrigatórios.", 400);
  }
  if (!aniversarioValido(aniversario_dia_mes)) {
    return jsonError("Informe um dia e mês de aniversário válidos.", 400);
  }

  try {
    const { rows } = await query(
      `INSERT INTO clientes (nome, telefone, aniversario_dia_mes, observacoes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nome, telefone, aniversario_dia_mes || null, observacoes ?? null]
    );
    return jsonOk(rows[0], 201);
  } catch (error) {
    return handleDbError(error);
  }
}
