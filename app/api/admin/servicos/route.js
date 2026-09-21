import { query } from "@/lib/db";
import { jsonOk, handleDbError } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/admin/servicos -> lista autenticada de serviços ativos e inativos.
export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const { rows } = await query(
      `SELECT
          id,
          nome,
          descricao,
          duracao_minutos,
          preco_padrao,
          necessita_avaliacao,
          retorno_dias,
          ativo
         FROM servicos
         ORDER BY nome ASC`
    );

    return jsonOk(rows);
  } catch (error) {
    return handleDbError(error);
  }
}
