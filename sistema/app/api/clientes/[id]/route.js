import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/clientes/:id  -> dados do cliente + histórico de procedimentos + agendamentos
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const { rows } = await query("SELECT * FROM clientes WHERE id = $1", [id]);
    const cliente = rows[0];
    if (!cliente) return jsonError("Cliente não encontrado.", 404);

    const [{ rows: historico }, { rows: agendamentos }] = await Promise.all([
      query(
        `SELECT * FROM historico_procedimentos
          WHERE cliente_id = $1
          ORDER BY data_procedimento DESC`,
        [id]
      ),
      query(
        `SELECT * FROM agendamentos
          WHERE cliente_id = $1
          ORDER BY inicio DESC
          LIMIT 20`,
        [id]
      ),
    ]);

    return jsonOk({ ...cliente, historico, agendamentos });
  } catch (error) {
    return handleDbError(error);
  }
}

// PUT /api/clientes/:id -> atualiza campos do cliente (parcial)
export async function PUT(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { nome, telefone, aniversario, observacoes } = body ?? {};

  try {
    const { rows } = await query(
      `UPDATE clientes SET
         nome = COALESCE($1, nome),
         telefone = COALESCE($2, telefone),
         aniversario = COALESCE($3, aniversario),
         observacoes = COALESCE($4, observacoes),
         atualizado_em = now()
       WHERE id = $5
       RETURNING *`,
      [nome ?? null, telefone ?? null, aniversario ?? null, observacoes ?? null, id]
    );
    if (rows.length === 0) return jsonError("Cliente não encontrado.", 404);
    return jsonOk(rows[0]);
  } catch (error) {
    return handleDbError(error);
  }
}

// DELETE /api/clientes/:id
export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rowCount } = await query("DELETE FROM clientes WHERE id = $1", [id]);
    if (rowCount === 0) return jsonError("Cliente não encontrado.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    // Cliente com agendamentos/histórico vinculados não pode ser excluído (FK).
    return handleDbError(error);
  }
}
