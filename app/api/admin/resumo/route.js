import { query } from "@/lib/db";
import { jsonOk, handleDbError } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  try {
    const [agendamentosResult, retornosResult, faturamentoResult] =
      await Promise.all([
        query(
          `SELECT
              a.id,
              a.inicio,
              a.fim,
              a.status,
              c.nome AS cliente_nome,
              COALESCE(
                json_agg(
                  json_build_object(
                    'servico_id', s.id,
                    'nome', s.nome,
                    'valor', ags.valor
                  )
                  ORDER BY s.nome
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'::json
              ) AS servicos
            FROM agendamentos a
            JOIN clientes c ON c.id = a.cliente_id
            LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
            LEFT JOIN servicos s ON s.id = ags.servico_id
           WHERE a.inicio::date = CURRENT_DATE
           GROUP BY a.id, c.nome
           ORDER BY a.inicio ASC`
        ),
        query(
          `SELECT
              r.id,
              c.nome AS cliente_nome,
              s.nome AS servico_nome,
              r.data_recomendada
            FROM retornos r
            JOIN clientes c ON c.id = r.cliente_id
            LEFT JOIN servicos s ON s.id = r.servico_id
           WHERE r.status = 'pendente'
           ORDER BY r.data_recomendada ASC, c.nome ASC`
        ),
        query(
          `SELECT COALESCE(SUM(valor), 0) AS total
             FROM movimentacoes_financeiras
            WHERE tipo = 'receita'
              AND data_movimentacao = CURRENT_DATE`
        ),
      ]);

    return jsonOk({
      agendamentosHoje: agendamentosResult.rows,
      retornosPendentes: retornosResult.rows,
      faturamentoDia: Number(faturamentoResult.rows[0].total),
    });
  } catch (error) {
    return handleDbError(error);
  }
}
