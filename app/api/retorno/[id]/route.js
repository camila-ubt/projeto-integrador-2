import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rows } = await query("SELECT * FROM retornos WHERE id = $1", [id]);
    if (rows.length === 0) return jsonError("Retorno não encontrado.", 404);
    return jsonOk(rows[0]);
  } catch (error) {
    return handleDbError(error);
  }
}

// PUT /api/retornos/:id -> normalmente usado para mudar o status
// (pendente -> agendado -> realizado, ou cancelado)
export async function PUT(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { status, data_recomendada, observacoes } = body ?? {};
  const statusValidos = ["pendente", "agendado", "realizado", "cancelado"];
  if (status && !statusValidos.includes(status)) {
    return jsonError(`status inválido. Use um de: ${statusValidos.join(", ")}.`, 400);
  }
  if (data_recomendada !== undefined) {
    const data = /^\d{4}-\d{2}-\d{2}$/.test(data_recomendada ?? "")
      ? new Date(`${data_recomendada}T12:00:00Z`) : null;
    if (!data || Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== data_recomendada) {
      return jsonError("Informe uma data recomendada válida.", 400);
    }
  }

  try {
    const { rows } = await query(
      `UPDATE retornos SET
         status = COALESCE($1, status),
         data_recomendada = COALESCE($2, data_recomendada),
         observacoes = COALESCE($3, observacoes)
       WHERE id = $4
       RETURNING *`,
      [status ?? null, data_recomendada ?? null, observacoes ?? null, id]
    );
    if (rows.length === 0) return jsonError("Retorno não encontrado.", 404);
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
    const { rowCount } = await query("DELETE FROM retornos WHERE id = $1", [id]);
    if (rowCount === 0) return jsonError("Retorno não encontrado.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleDbError(error);
  }
}
