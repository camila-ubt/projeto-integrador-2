import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const { rows } = await query("SELECT * FROM servicos WHERE id = $1", [id]);
    if (rows.length === 0) return jsonError("Serviço não encontrado.", 404);
    return jsonOk(rows[0]);
  } catch (error) {
    return handleDbError(error);
  }
}

// PUT /api/servicos/:id -> atualização parcial (inclusive ativar/desativar)
export async function PUT(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const {
    nome,
    descricao,
    duracao_minutos,
    preco_padrao,
    necessita_avaliacao,
    retorno_dias,
    ativo,
  } = body ?? {};

  try {
    const { rows } = await query(
      `UPDATE servicos SET
         nome = COALESCE($1, nome),
         descricao = COALESCE($2, descricao),
         duracao_minutos = COALESCE($3, duracao_minutos),
         preco_padrao = COALESCE($4, preco_padrao),
         necessita_avaliacao = COALESCE($5, necessita_avaliacao),
         retorno_dias = COALESCE($6, retorno_dias),
         ativo = COALESCE($7, ativo)
       WHERE id = $8
       RETURNING *`,
      [
        nome ?? null,
        descricao ?? null,
        duracao_minutos ?? null,
        preco_padrao ?? null,
        necessita_avaliacao ?? null,
        retorno_dias ?? null,
        ativo ?? null,
        id,
      ]
    );
    if (rows.length === 0) return jsonError("Serviço não encontrado.", 404);
    return jsonOk(rows[0]);
  } catch (error) {
    return handleDbError(error);
  }
}

// DELETE /api/servicos/:id
// Se o serviço já foi usado em algum agendamento/histórico, o banco bloqueia a
// exclusão (FK). Nesse caso, o ideal é desativar (PUT { ativo: false }).
export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rowCount } = await query("DELETE FROM servicos WHERE id = $1", [id]);
    if (rowCount === 0) return jsonError("Serviço não encontrado.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    if (error.code === "23503") {
      return jsonError(
        "Este serviço já foi usado em agendamentos e não pode ser excluído. Desative-o em vez disso (ativo: false).",
        409
      );
    }
    return handleDbError(error);
  }
}
