import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const { rows } = await query("SELECT * FROM historico_procedimentos WHERE id = $1", [id]);
    if (rows.length === 0) return jsonError("Registro não encontrado.", 404);
    return jsonOk(rows[0]);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { produto_utilizado, cor, tecnica, observacoes, data_procedimento } = body ?? {};

  try {
    const { rows } = await query(
      `UPDATE historico_procedimentos SET
         produto_utilizado = COALESCE($1, produto_utilizado),
         cor = COALESCE($2, cor),
         tecnica = COALESCE($3, tecnica),
         observacoes = COALESCE($4, observacoes),
         data_procedimento = COALESCE($5, data_procedimento)
       WHERE id = $6
       RETURNING *`,
      [
        produto_utilizado ?? null,
        cor ?? null,
        tecnica ?? null,
        observacoes ?? null,
        data_procedimento ?? null,
        id,
      ]
    );
    if (rows.length === 0) return jsonError("Registro não encontrado.", 404);
    return jsonOk(rows[0]);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rowCount } = await query("DELETE FROM historico_procedimentos WHERE id = $1", [id]);
    if (rowCount === 0) return jsonError("Registro não encontrado.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleDbError(error);
  }
}
