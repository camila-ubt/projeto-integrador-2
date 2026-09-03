import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/financeiro?tipo=receita&categoria=produto&inicio=2026-08-01&fim=2026-08-31
export async function GET(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // 'receita' | 'despesa'
    const categoria = searchParams.get("categoria");
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    const condicoes = [];
    const valores = [];
    if (tipo) {
      valores.push(tipo);
      condicoes.push(`tipo = $${valores.length}`);
    }
    if (categoria) {
      valores.push(categoria);
      condicoes.push(`categoria = $${valores.length}`);
    }
    if (inicio) {
      valores.push(inicio);
      condicoes.push(`data_movimentacao >= $${valores.length}`);
    }
    if (fim) {
      valores.push(fim);
      condicoes.push(`data_movimentacao <= $${valores.length}`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const { rows } = await query(
      `SELECT * FROM movimentacoes_financeiras
        ${where}
        ORDER BY data_movimentacao DESC, criado_em DESC`,
      valores
    );
    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}

// POST /api/financeiro -> cria movimentação (receita ou despesa)
// body: { tipo, descricao, valor, categoria?, forma_pagamento?, data_movimentacao?, agendamento_id? }
export async function POST(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const {
    tipo,
    descricao,
    valor,
    categoria,
    forma_pagamento,
    data_movimentacao,
    agendamento_id,
  } = body ?? {};

  if (!tipo || !descricao || valor === undefined || valor === null) {
    return jsonError("Os campos 'tipo', 'descricao' e 'valor' são obrigatórios.", 400);
  }
  if (!["receita", "despesa"].includes(tipo)) {
    return jsonError("O campo 'tipo' deve ser 'receita' ou 'despesa'.", 400);
  }

  try {
    const { rows } = await query(
      `INSERT INTO movimentacoes_financeiras
         (agendamento_id, tipo, descricao, categoria, valor, forma_pagamento, data_movimentacao)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_DATE))
       RETURNING *`,
      [
        agendamento_id ?? null,
        tipo,
        descricao,
        categoria ?? null,
        valor,
        forma_pagamento ?? null,
        data_movimentacao ?? null,
      ]
    );
    return jsonOk(rows[0], 201);
  } catch (error) {
    return handleDbError(error);
  }
}
