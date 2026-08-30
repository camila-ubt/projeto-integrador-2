import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rows } = await query("SELECT * FROM movimentacoes_financeiras WHERE id = $1", [id]);
    if (rows.length === 0) return jsonError("Movimentação não encontrada.", 404);
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

  const { tipo, descricao, categoria, valor, forma_pagamento, data_movimentacao } = body ?? {};
  if (tipo && !["receita", "despesa"].includes(tipo)) {
    return jsonError("O campo 'tipo' deve ser 'receita' ou 'despesa'.", 400);
  }

  try {
    const { rows } = await query(
      `UPDATE movimentacoes_financeiras SET
         tipo = COALESCE($1, tipo),
         descricao = COALESCE($2, descricao),
         categoria = COALESCE($3, categoria),
         valor = COALESCE($4, valor),
         forma_pagamento = COALESCE($5, forma_pagamento),
         data_movimentacao = COALESCE($6, data_movimentacao)
       WHERE id = $7
       RETURNING *`,
      [
        tipo ?? null,
        descricao ?? null,
        categoria ?? null,
        valor ?? null,
        forma_pagamento ?? null,
        data_movimentacao ?? null,
        id,
      ]
    );
    if (rows.length === 0) return jsonError("Movimentação não encontrada.", 404);
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
    const { rowCount } = await query("DELETE FROM movimentacoes_financeiras WHERE id = $1", [id]);
    if (rowCount === 0) return jsonError("Movimentação não encontrada.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleDbError(error);
  }
}
