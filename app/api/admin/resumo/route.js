import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

const STATUS_VALIDOS = ["agendado", "realizado", "cancelado", "faltou"];
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function dataAnterior(data, dias) {
  const valor = new Date(`${data}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() - dias);
  return valor.toISOString().slice(0, 10);
}

function diferencaEmDias(inicio, fim) {
  return Math.round(
    (new Date(`${fim}T12:00:00Z`) - new Date(`${inicio}T12:00:00Z`)) / 86400000
  ) + 1;
}

function numero(valor) {
  return Number(valor ?? 0);
}

function percentual(atual, anterior) {
  if (!anterior) return atual ? null : 0;
  return ((atual - anterior) / anterior) * 100;
}

function dataValida(valor) {
  if (!DATA_RE.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export async function GET(request) {
  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const inicioPadrao = `${hoje.slice(0, 8)}01`;
  const inicio = searchParams.get("inicio") || inicioPadrao;
  const fim = searchParams.get("fim") || hoje;
  const status = searchParams.get("status") || null;
  const clienteId = searchParams.get("cliente_id") || null;
  const servicoId = searchParams.get("servico_id") || null;

  if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) {
    return jsonError("Informe um período válido.", 400);
  }
  if (status && !STATUS_VALIDOS.includes(status)) {
    return jsonError("Status inválido.", 400);
  }
  if ((clienteId && !UUID_RE.test(clienteId)) || (servicoId && !UUID_RE.test(servicoId))) {
    return jsonError("Cliente ou serviço inválido.", 400);
  }

  const dias = diferencaEmDias(inicio, fim);
  if (dias > 1096) return jsonError("O período máximo é de 3 anos.", 400);

  const fimAnterior = dataAnterior(inicio, 1);
  const inicioAnterior = dataAnterior(inicio, dias);
  const valores = [inicio, fim, status, clienteId, servicoId];
  const valoresComparacao = [inicioAnterior, fimAnterior, status, clienteId, servicoId];
  const filtroAgenda = `
    (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN $1::date AND $2::date
    AND ($3::text IS NULL OR a.status = $3)
    AND ($4::uuid IS NULL OR a.cliente_id = $4)
    AND ($5::uuid IS NULL OR EXISTS (
      SELECT 1 FROM agendamento_servicos filtro_ags
      WHERE filtro_ags.agendamento_id = a.id AND filtro_ags.servico_id = $5
    ))`;
  const consultaCaixa = `SELECT
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) AS receitas,
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa'), 0) AS despesas
    FROM movimentacoes_financeiras
    WHERE data_movimentacao BETWEEN $1::date AND $2::date`;
  const consultaRecorrencia = `WITH realizados AS (
      SELECT a.id, a.cliente_id,
        (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date AS data,
        LAG((a.inicio AT TIME ZONE 'America/Sao_Paulo')::date)
          OVER (PARTITION BY a.cliente_id ORDER BY a.inicio, a.id) AS anterior
      FROM agendamentos a
      WHERE a.status = 'realizado'
        AND (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date
    ), periodo AS (
      SELECT r.* FROM realizados r
      JOIN agendamentos a ON a.id = r.id
      WHERE r.data BETWEEN $1::date AND $2::date
        AND ($3::text IS NULL OR $3 = 'realizado')
        AND ($4::uuid IS NULL OR a.cliente_id = $4)
        AND ($5::uuid IS NULL OR EXISTS (
          SELECT 1 FROM agendamento_servicos filtro_ags
          WHERE filtro_ags.agendamento_id = a.id AND filtro_ags.servico_id = $5
        ))
    ), clientes_periodo AS (
      SELECT cliente_id,
        COALESCE(BOOL_OR(anterior < $1::date), false) AS tinha_atendimento_anterior
      FROM periodo GROUP BY cliente_id
    ), visitas_retorno AS (
      SELECT cliente_id, data - anterior AS intervalo
      FROM periodo WHERE anterior < data
    )
    SELECT
      COUNT(*) FILTER (WHERE NOT tinha_atendimento_anterior)::int AS novos,
      COUNT(*) FILTER (WHERE tinha_atendimento_anterior)::int AS recorrentes,
      (SELECT AVG(intervalo)::numeric(10,1) FROM visitas_retorno) AS intervalo_medio,
      (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY intervalo)
        FROM visitas_retorno)::numeric(10,1) AS intervalo_mediano,
      (SELECT COUNT(DISTINCT cliente_id)::int FROM visitas_retorno) AS clientes_que_voltaram,
      (SELECT COUNT(*)::int FROM visitas_retorno) AS visitas_retorno,
      (SELECT COUNT(*)::int FROM visitas_retorno WHERE intervalo BETWEEN 1 AND 30) AS ate_30_dias,
      (SELECT COUNT(*)::int FROM visitas_retorno WHERE intervalo BETWEEN 31 AND 60) AS de_31_a_60_dias,
      (SELECT COUNT(*)::int FROM visitas_retorno WHERE intervalo > 60) AS mais_de_60_dias
    FROM clientes_periodo`;

  try {
    const consultas = await Promise.all([
      query(`SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE a.status = 'realizado')::int AS realizados,
          COUNT(*) FILTER (WHERE a.status = 'agendado')::int AS agendados,
          COUNT(*) FILTER (WHERE a.status = 'cancelado')::int AS cancelados,
          COUNT(*) FILTER (WHERE a.status = 'faltou')::int AS faltas,
          COUNT(DISTINCT a.cliente_id) FILTER (WHERE a.status = 'realizado')::int AS clientes,
          COALESCE(AVG(EXTRACT(EPOCH FROM (a.fim - a.inicio)) / 60)
            FILTER (WHERE a.status = 'realizado'), 0)::numeric(10,1) AS duracao_media
        FROM agendamentos a WHERE ${filtroAgenda}`, valores),
      query(`SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE a.status = 'realizado')::int AS realizados,
          COUNT(*) FILTER (WHERE a.status = 'cancelado')::int AS cancelados,
          COUNT(*) FILTER (WHERE a.status = 'faltou')::int AS faltas,
          COUNT(DISTINCT a.cliente_id) FILTER (WHERE a.status = 'realizado')::int AS clientes
        FROM agendamentos a WHERE ${filtroAgenda}`, valoresComparacao),
      query(consultaCaixa, [inicio, fim]),
      query(`SELECT COALESCE(SUM(ags.valor), 0) AS total
        FROM agendamentos a
        JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
        WHERE ${filtroAgenda} AND a.status = 'realizado'
          AND ($5::uuid IS NULL OR ags.servico_id = $5)`, valoresComparacao),
      query(`WITH datas AS (
          SELECT generate_series($1::date, $2::date, interval '1 day')::date AS data
        ), agenda AS (
          SELECT (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date AS data,
            COUNT(*) FILTER (WHERE a.status = 'realizado')::int AS atendimentos
          FROM agendamentos a WHERE ${filtroAgenda} GROUP BY 1
        ), servicos_realizados AS (
          SELECT (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date AS data,
            COALESCE(SUM(ags.valor), 0) AS faturamento
          FROM agendamentos a
          JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
          WHERE ${filtroAgenda} AND a.status = 'realizado'
            AND ($5::uuid IS NULL OR ags.servico_id = $5)
          GROUP BY 1
        )
        SELECT d.data, COALESCE(sr.faturamento, 0) AS faturamento,
          COALESCE(ag.atendimentos, 0)::int AS atendimentos
        FROM datas d LEFT JOIN servicos_realizados sr USING (data)
          LEFT JOIN agenda ag USING (data)
        ORDER BY d.data`, valores),
      query(`SELECT s.id, s.nome, COUNT(*)::int AS quantidade,
          SUM(COUNT(*)) OVER ()::int AS total_servicos,
          COALESCE(SUM(ags.valor), 0) AS faturamento
        FROM agendamentos a
        JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
        JOIN servicos s ON s.id = ags.servico_id
        WHERE ${filtroAgenda} AND a.status = 'realizado'
          AND ($5::uuid IS NULL OR ags.servico_id = $5)
        GROUP BY s.id, s.nome ORDER BY quantidade DESC, s.nome LIMIT 8`, valores),
      query(`SELECT EXTRACT(ISODOW FROM a.inicio AT TIME ZONE 'America/Sao_Paulo')::int AS dia,
          COUNT(*)::int AS quantidade
        FROM agendamentos a WHERE ${filtroAgenda}
        GROUP BY 1 ORDER BY 1`, valores),
      query(`SELECT EXTRACT(HOUR FROM a.inicio AT TIME ZONE 'America/Sao_Paulo')::int AS hora,
          COUNT(*)::int AS quantidade
        FROM agendamentos a WHERE ${filtroAgenda}
        GROUP BY 1 ORDER BY 1`, valores),
      query(consultaRecorrencia, valores),
      query(`WITH realizados AS (
          SELECT a.id, a.cliente_id,
            (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date AS data,
            LAG((a.inicio AT TIME ZONE 'America/Sao_Paulo')::date)
              OVER (PARTITION BY a.cliente_id ORDER BY a.inicio, a.id) AS data_anterior
          FROM agendamentos a
          WHERE a.status = 'realizado'
            AND (a.inicio AT TIME ZONE 'America/Sao_Paulo')::date <= $2::date
        )
        SELECT c.id, c.nome,
          COUNT(*)::int AS atendimentos,
          COUNT(*) FILTER (WHERE r.data_anterior < r.data)::int AS retornos
        FROM realizados r
        JOIN agendamentos a ON a.id = r.id
        JOIN clientes c ON c.id = r.cliente_id
        WHERE r.data BETWEEN $1::date AND $2::date
          AND ($3::text IS NULL OR $3 = 'realizado')
          AND ($4::uuid IS NULL OR a.cliente_id = $4)
          AND ($5::uuid IS NULL OR EXISTS (
            SELECT 1 FROM agendamento_servicos filtro_ags
            WHERE filtro_ags.agendamento_id = a.id AND filtro_ags.servico_id = $5
          ))
        GROUP BY c.id, c.nome
        HAVING COUNT(*) FILTER (WHERE r.data_anterior < r.data) > 0
        ORDER BY retornos DESC, atendimentos DESC, c.nome LIMIT 5`, valores),
      query(`SELECT a.id, a.inicio, a.fim, c.nome AS cliente_nome,
          COALESCE(string_agg(s.nome, ', ' ORDER BY s.nome), '') AS servicos
        FROM agendamentos a JOIN clientes c ON c.id = a.cliente_id
        LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
        LEFT JOIN servicos s ON s.id = ags.servico_id
        WHERE a.status = 'agendado' AND a.inicio >= NOW()
          AND ($1::uuid IS NULL OR a.cliente_id = $1)
          AND ($2::uuid IS NULL OR EXISTS (
            SELECT 1 FROM agendamento_servicos filtro_ags
            WHERE filtro_ags.agendamento_id = a.id AND filtro_ags.servico_id = $2
          ))
        GROUP BY a.id, c.nome ORDER BY a.inicio LIMIT 6`, [clienteId, servicoId]),
      query(`SELECT
          (SELECT COALESCE(json_agg(json_build_object('id', id, 'nome', nome) ORDER BY nome), '[]') FROM servicos WHERE ativo = true) AS servicos,
          (SELECT COALESCE(json_agg(json_build_object('id', id, 'nome', nome) ORDER BY nome), '[]') FROM clientes) AS clientes`),
      query(`SELECT COALESCE(SUM(ags.valor), 0) AS total
        FROM agendamentos a
        JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
        WHERE ${filtroAgenda} AND a.status = 'realizado'
          AND ($5::uuid IS NULL OR ags.servico_id = $5)`, valores),
      query(`WITH datas AS (
          SELECT id, nome,
            COALESCE(aniversario_dia_mes, to_char(aniversario, 'DD/MM')) AS dia_mes
          FROM clientes
        )
        SELECT id, nome, substring(dia_mes from 1 for 2)::int AS dia
        FROM datas
        WHERE substring(dia_mes from 4 for 2)::int = $1::int
        ORDER BY dia, nome`, [Number(inicio.slice(5, 7))]),
      query(consultaRecorrencia, valoresComparacao),
      query(consultaCaixa, [inicioAnterior, fimAnterior]),
      query(`SELECT COALESCE(NULLIF(BTRIM(categoria), ''), 'Sem categoria') AS categoria,
          SUM(valor) AS total
        FROM movimentacoes_financeiras
        WHERE tipo = 'despesa' AND data_movimentacao BETWEEN $1::date AND $2::date
        GROUP BY 1 ORDER BY total DESC, categoria`, [inicio, fim]),
    ]);

    const atual = consultas[0].rows[0];
    const anterior = consultas[1].rows[0];
    const caixa = consultas[2].rows[0];
    const caixaAnterior = consultas[15].rows[0];
    const servicosAnteriores = consultas[3].rows[0];
    const realizados = numero(atual.realizados);
    const realizadosAnterior = numero(anterior.realizados);
    const receitas = numero(consultas[12].rows[0].total);
    const receitasAnterior = numero(servicosAnteriores.total);
    const taxaAusencias = atual.total
      ? ((numero(atual.cancelados) + numero(atual.faltas)) / numero(atual.total)) * 100
      : 0;
    const taxaAusenciasAnterior = anterior.total
      ? ((numero(anterior.cancelados) + numero(anterior.faltas)) / numero(anterior.total)) * 100
      : 0;

    return jsonOk({
      periodo: { inicio, fim, inicioAnterior, fimAnterior },
      kpis: {
        faturamento: receitas,
        receitasCaixa: numero(caixa.receitas),
        despesas: numero(caixa.despesas),
        saldo: numero(caixa.receitas) - numero(caixa.despesas),
        atendimentos: numero(atual.total),
        realizados,
        agendados: numero(atual.agendados),
        cancelados: numero(atual.cancelados),
        faltas: numero(atual.faltas),
        ticketMedio: realizados ? receitas / realizados : 0,
        clientes: numero(atual.clientes),
        taxaAusencias,
        duracaoMedia: numero(atual.duracao_media),
        comparacao: {
          faturamento: percentual(receitas, receitasAnterior),
          atendimentos: percentual(numero(atual.total), numero(anterior.total)),
          realizados: percentual(realizados, realizadosAnterior),
          ticketMedio: percentual(
            realizados ? receitas / realizados : 0,
            realizadosAnterior ? receitasAnterior / realizadosAnterior : 0
          ),
          clientes: percentual(numero(atual.clientes), numero(anterior.clientes)),
          taxaAusencias: taxaAusencias - taxaAusenciasAnterior,
        },
      },
      evolucao: consultas[4].rows.map((item) => ({
        data: item.data, faturamento: numero(item.faturamento), atendimentos: numero(item.atendimentos),
      })),
      servicos: consultas[5].rows.map((item) => ({
        ...item,
        quantidade: numero(item.quantidade),
        totalServicos: numero(item.total_servicos),
        faturamento: numero(item.faturamento),
      })),
      diasSemana: consultas[6].rows.map((item) => ({ dia: numero(item.dia), quantidade: numero(item.quantidade) })),
      horarios: consultas[7].rows.map((item) => ({ hora: numero(item.hora), quantidade: numero(item.quantidade) })),
      financeiro: {
        comparacaoDespesas: percentual(numero(caixa.despesas), numero(caixaAnterior.despesas)),
        categorias: consultas[16].rows.map((item) => ({
          categoria: item.categoria,
          total: numero(item.total),
        })),
      },
      clientes: {
        novos: numero(consultas[8].rows[0].novos),
        recorrentes: numero(consultas[8].rows[0].recorrentes),
        intervaloMedio: consultas[8].rows[0].intervalo_medio === null
          ? null : numero(consultas[8].rows[0].intervalo_medio),
        retorno: {
          clientes: numero(consultas[8].rows[0].clientes_que_voltaram),
          visitas: numero(consultas[8].rows[0].visitas_retorno),
          totalClientes: numero(atual.clientes),
          totalClientesAnterior: numero(anterior.clientes),
          clientesAnterior: numero(consultas[14].rows[0].clientes_que_voltaram),
          medianaDias: consultas[8].rows[0].intervalo_mediano === null
            ? null : numero(consultas[8].rows[0].intervalo_mediano),
          faixas: [
            { rotulo: "Até 30 dias", quantidade: numero(consultas[8].rows[0].ate_30_dias) },
            { rotulo: "31 a 60 dias", quantidade: numero(consultas[8].rows[0].de_31_a_60_dias) },
            { rotulo: "Mais de 60 dias", quantidade: numero(consultas[8].rows[0].mais_de_60_dias) },
          ],
        },
        ranking: consultas[9].rows.map((item) => ({
          ...item, atendimentos: numero(item.atendimentos), retornos: numero(item.retornos),
        })),
      },
      proximosAtendimentos: consultas[10].rows,
      aniversariantes: {
        mes: inicio.slice(0, 7),
        clientes: consultas[13].rows,
      },
      opcoes: consultas[11].rows[0],
      observacoes: {
        faturamentoServicos: "Calculado pelos valores registrados nos serviços de atendimentos realizados.",
        ocupacao: "A taxa de ocupação depende da definição dos horários disponíveis do studio.",
      },
    });
  } catch (error) {
    return handleDbError(error);
  }
}
