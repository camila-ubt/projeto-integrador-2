import { query, withTransaction } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";
import { sincronizarReceitaAtendimento } from "@/lib/receita-atendimento";

// GET /api/agendamentos/:id
// Expõe dados da cliente (nome, telefone, observações) -> precisa de login,
// assim como todas as outras rotas [id] do projeto (clientes, financeiro, etc).
export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rows } = await query(
      `SELECT a.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone
         FROM agendamentos a
         JOIN clientes c ON c.id = a.cliente_id
        WHERE a.id = $1`,
      [id]
    );
    const agendamento = rows[0];
    if (!agendamento) return jsonError("Agendamento não encontrado.", 404);

    const { rows: servicos } = await query(
      `SELECT ags.servico_id, s.nome, ags.valor
         FROM agendamento_servicos ags
         JOIN servicos s ON s.id = ags.servico_id
        WHERE ags.agendamento_id = $1`,
      [id]
    );

    return jsonOk({ ...agendamento, servicos });
  } catch (error) {
    return handleDbError(error);
  }
}

// Concluir o atendimento cria o retorno e registra os serviços no Caixa.
export async function PUT(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { inicio, fim, status, observacoes, servicos, retorno } = body ?? {};

  const statusValidos = ["agendado", "realizado", "cancelado", "faltou"];
  if (status && !statusValidos.includes(status)) {
    return jsonError(`status inválido. Use um de: ${statusValidos.join(", ")}.`, 400);
  }
  if (retorno) {
    const data = retorno.data_recomendada;
    const servicoValido = typeof retorno.servico_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(retorno.servico_id);
    const dataConvertida = /^\d{4}-\d{2}-\d{2}$/.test(data ?? "")
      ? new Date(`${data}T12:00:00Z`) : null;
    if (!servicoValido || !dataConvertida || Number.isNaN(dataConvertida.getTime()) || dataConvertida.toISOString().slice(0, 10) !== data) {
      return jsonError("Informe o serviço e uma data válida para o retorno.", 400);
    }
  }

  try {
    const agendamentoAtualizado = await withTransaction(async (client) => {
      const { rows: existentes } = await client.query(
        "SELECT id FROM agendamentos WHERE id = $1 FOR UPDATE",
        [id]
      );
      if (existentes.length === 0) {
        throw Object.assign(new Error("Agendamento não encontrado."), { code: "APP_NOT_FOUND" });
      }

      // O trigger de retorno precisa encontrar os serviços finais do atendimento.
      if (Array.isArray(servicos)) {
        await client.query("DELETE FROM agendamento_servicos WHERE agendamento_id = $1", [id]);
        for (const item of servicos) {
          if (!item?.servico_id) {
            throw Object.assign(new Error("Cada serviço precisa de 'servico_id'."), {
              code: "APP_VALIDATION",
            });
          }
          let valor = item.valor;
          if (valor === undefined || valor === null) {
            const { rows: servicoRows } = await client.query(
              "SELECT preco_padrao FROM servicos WHERE id = $1",
              [item.servico_id]
            );
            if (servicoRows.length === 0) {
              throw Object.assign(new Error("Serviço informado não existe."), { code: "23503" });
            }
            valor = servicoRows[0].preco_padrao;
          }
          await client.query(
            `INSERT INTO agendamento_servicos (agendamento_id, servico_id, valor)
             VALUES ($1, $2, $3)`,
            [id, item.servico_id, valor]
          );
        }
      }

      const { rows } = await client.query(
        `UPDATE agendamentos SET
           inicio = COALESCE($1, inicio),
           fim = COALESCE($2, fim),
           status = COALESCE($3, status),
           observacoes = COALESCE($4, observacoes)
         WHERE id = $5
         RETURNING *`,
        [inicio ?? null, fim ?? null, status ?? null, observacoes ?? null, id]
      );
      if (retorno) {
        if (rows[0].status !== "realizado") {
          throw Object.assign(new Error("Conclua o atendimento antes de planejar um retorno."), { code: "APP_VALIDATION" });
        }
        const { rowCount } = await client.query(
          `SELECT 1 FROM agendamento_servicos WHERE agendamento_id = $1 AND servico_id = $2`,
          [id, retorno.servico_id]
        );
        if (!rowCount) {
          throw Object.assign(new Error("O serviço do retorno precisa fazer parte deste atendimento."), { code: "APP_VALIDATION" });
        }
        const { rowCount: atualizados } = await client.query(
          `UPDATE retornos SET data_recomendada = $3,
             observacoes = COALESCE($4, observacoes)
           WHERE agendamento_origem_id = $1 AND servico_id = $2`,
          [id, retorno.servico_id, retorno.data_recomendada, typeof retorno.observacoes === "string" ? retorno.observacoes.trim() || null : null]
        );
        if (!atualizados) {
          await client.query(
            `INSERT INTO retornos (cliente_id, servico_id, agendamento_origem_id, data_recomendada, observacoes)
             VALUES ($1, $2, $3, $4, $5)`,
            [rows[0].cliente_id, retorno.servico_id, id, retorno.data_recomendada, typeof retorno.observacoes === "string" ? retorno.observacoes.trim() || null : null]
          );
        }
      }
      await sincronizarReceitaAtendimento(client, rows[0]);
      const { rows: retornos } = await client.query(
        `SELECT id FROM retornos WHERE agendamento_origem_id = $1 ORDER BY data_recomendada`,
        [id]
      );
      return { ...rows[0], retornos };
    });

    return jsonOk(agendamentoAtualizado);
  } catch (error) {
    if (error.code === "APP_NOT_FOUND") return jsonError(error.message, 404);
    if (error.code === "APP_VALIDATION") return jsonError(error.message, 400);
    if (error.constraint === "impedir_conflito_horarios") {
      return jsonError("Já existe um agendamento nesse mesmo horário.", 409);
    }
    return handleDbError(error);
  }
}

// DELETE /api/agendamentos/:id
// Remove o agendamento (os registros em agendamento_servicos são removidos em cascata).
export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const { rows: lancamentos } = await query(
      "SELECT 1 FROM movimentacoes_financeiras WHERE agendamento_id = $1 LIMIT 1",
      [id]
    );
    if (lancamentos.length) {
      return jsonError("Este atendimento tem lançamento no Caixa e não pode ser excluído.", 409);
    }
    const { rowCount } = await query("DELETE FROM agendamentos WHERE id = $1", [id]);
    if (rowCount === 0) return jsonError("Agendamento não encontrado.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleDbError(error);
  }
}
