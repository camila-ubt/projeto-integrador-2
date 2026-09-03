// Helpers para padronizar respostas das rotas em app/api/**.
import { NextResponse } from "next/server";

export function jsonOk(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message, status = 400, details) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

/**
 * Converte erros do Postgres (códigos SQLSTATE) em respostas HTTP com
 * mensagens claras, em vez de vazar detalhes internos do banco.
 */
export function handleDbError(error) {
  console.error(error);

  switch (error.code) {
    case "23505": // unique_violation
      return jsonError("Já existe um registro com esse valor único (ex: e-mail duplicado).", 409);
    case "23503": // foreign_key_violation
      return jsonError("Referência inválida: o registro relacionado não existe ou está em uso.", 409);
    case "23514": // check_violation
      return jsonError("Um dos valores enviados não passou nas regras de validação do banco.", 422);
    case "22P02": // invalid_text_representation (ex: uuid malformado)
      return jsonError("Formato de dado inválido (ex.: ID em formato incorreto).", 400);
    case "23502": // not_null_violation
      return jsonError(`Campo obrigatório não informado: ${error.column ?? "desconhecido"}.`, 400);
    case "EXCLUSION": // não é um código real, fallback abaixo cobre a exclusion constraint
    default:
      if (error.constraint === "impedir_conflito_horarios") {
        return jsonError("Já existe um agendamento nesse mesmo horário.", 409);
      }
      return jsonError("Erro interno no servidor.", 500);
  }
}

/** Lê e valida o corpo JSON da requisição, retornando erro se estiver malformado. */
export async function readJson(request) {
  try {
    return { data: await request.json(), error: null };
  } catch {
    return { data: null, error: jsonError("Corpo da requisição precisa ser um JSON válido.", 400) };
  }
}
