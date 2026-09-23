import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";
import { aniversarioValido } from "@/lib/aniversario";

// GET /api/clientes/:id  -> dados do cliente + histórico de procedimentos + agendamentos
export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const {id} = await params;
  try {
    const { rows } = await query(
      `SELECT id, nome, telefone,
              COALESCE(aniversario_dia_mes, to_char(aniversario, 'DD/MM')) AS aniversario_dia_mes,
              observacoes, criado_em, atualizado_em
         FROM clientes WHERE id = $1`, [id]
    );
    const cliente = rows[0];
    if (!cliente) return jsonError("Cliente não encontrado.", 404);

    const [{ rows: historico }, { rows: agendamentos }] = await Promise.all([
      query(
        `SELECT h.*, s.nome AS servico_nome
          FROM historico_procedimentos h
          LEFT JOIN servicos s ON s.id = h.servico_id
          WHERE h.cliente_id = $1
          ORDER BY h.data_procedimento DESC, h.criado_em DESC`,
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

  const { nome, telefone, aniversario_dia_mes, observacoes } = body ?? {};
  if (!aniversarioValido(aniversario_dia_mes)) {
    return jsonError("Informe um dia e mês de aniversário válidos.", 400);
  }

  try {
    const { rows } = await query(
      `UPDATE clientes SET
         nome = COALESCE($1, nome),
         telefone = COALESCE($2, telefone),
         aniversario_dia_mes = CASE WHEN $3::boolean THEN $4 ELSE aniversario_dia_mes END,
         aniversario = CASE WHEN $3::boolean AND ($4::text IS NULL OR $4::text IS DISTINCT FROM to_char(aniversario, 'DD/MM'))
           THEN NULL ELSE aniversario END,
         observacoes = COALESCE($5, observacoes),
         atualizado_em = now()
       WHERE id = $6
       RETURNING id, nome, telefone,
         COALESCE(aniversario_dia_mes, to_char(aniversario, 'DD/MM')) AS aniversario_dia_mes,
         observacoes, criado_em, atualizado_em`,
      [nome ?? null, telefone ?? null, Object.hasOwn(body ?? {}, "aniversario_dia_mes"), aniversario_dia_mes || null, observacoes ?? null, id]
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
