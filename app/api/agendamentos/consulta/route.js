import { query } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";
import { consumirLimite } from "@/lib/rate-limit";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export async function POST(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido";

  try {
    const { permitido } = await consumirLimite({
      escopo: "consulta-agendamentos-publica",
      identificador: ip,
      limite: 10,
      janelaMinutos: 10,
    });

    if (!permitido) {
      return jsonError(
        "Muitas consultas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        429
      );
    }

    const { data: body, error: parseError } = await readJson(request);
    if (parseError) return parseError;

    const nome =
      typeof body?.nome === "string"
        ? body.nome.trim().replace(/\s+/g, " ")
        : "";
    const telefone =
      typeof body?.telefone === "string"
        ? body.telefone.replace(/\D/g, "")
        : "";

    if (nome.length < 2 || nome.length > 120) {
      return jsonError("Informe o nome usado no agendamento.", 400);
    }

    if (telefone.length < 8 || telefone.length > 15) {
      return jsonError("Informe um telefone válido.", 400);
    }

    const { rows } = await query(
      `SELECT
         a.id,
         a.inicio,
         a.status,
         COALESCE(
           string_agg(DISTINCT s.nome, ', ' ORDER BY s.nome),
           'Atendimento'
         ) AS servico
       FROM clientes c
       JOIN agendamentos a
         ON a.cliente_id = c.id
       LEFT JOIN agendamento_servicos ags
         ON ags.agendamento_id = a.id
       LEFT JOIN servicos s
         ON s.id = ags.servico_id
       WHERE regexp_replace(c.telefone, '\\D', '', 'g') = $1
         AND lower(regexp_replace(trim(c.nome), '\\s+', ' ', 'g')) = lower($2)
         AND a.fim >= NOW()
         AND a.status = 'agendado'
       GROUP BY a.id, a.inicio, a.status
       ORDER BY a.inicio ASC
       LIMIT 10`,
      [telefone, nome]
    );

    const agendamentos = rows.map((agendamento) => {
      const inicio = new Date(agendamento.inicio);

      return {
        id: agendamento.id,
        servico: agendamento.servico,
        data: formatadorData.format(inicio),
        horario: formatadorHora.format(inicio),
        status: "Agendado",
      };
    });

    return jsonOk(agendamentos);
  } catch (error) {
    return handleDbError(error);
  }
}
