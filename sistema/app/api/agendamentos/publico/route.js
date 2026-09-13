import { withTransaction } from "@/lib/db";
import { jsonOk, jsonError, handleDbError, readJson } from "@/lib/api-helpers";

// Rate limit simples em memória: no máximo 5 tentativas por IP a cada 10 minutos.
// OBS: em ambiente serverless (várias instâncias), isso é uma primeira barreira
// contra spam, não uma garantia absoluta — cada instância guarda seu próprio contador.
const tentativasPorIp = new Map();
const LIMITE_TENTATIVAS = 5;
const JANELA_MS = 10 * 60 * 1000; // 10 minutos

function podeTentar(ip) {
  const agora = Date.now();
  const registro = tentativasPorIp.get(ip);

  if (!registro || agora - registro.desde > JANELA_MS) {
    tentativasPorIp.set(ip, { tentativas: 1, desde: agora });
    return true;
  }

  if (registro.tentativas >= LIMITE_TENTATIVAS) return false;

  registro.tentativas++;
  return true;
}

// POST /api/agendamentos/publico
//
// Endpoint PÚBLICO (sem login/senha) para a cliente final solicitar um
// agendamento diretamente pela página do estúdio.
//
// Só é permitido para serviços com necessita_avaliacao = false. Serviços que
// precisam de avaliação prévia continuam exigindo o fluxo já existente
// (agendamento feito pelo estúdio via POST /api/agendamentos, autenticado).
//
// body: {
//   cliente: { nome, telefone },        // usados para localizar ou cadastrar a cliente
//   servicos: [servico_id, ...],        // ids dos serviços desejados (nenhum pode exigir avaliação)
//   inicio, fim,                        // ISO 8601
//   observacoes?
// }

export async function POST(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido";

  if (!podeTentar(ip)) {
    return jsonError(
      "Muitas tentativas de agendamento em pouco tempo. Aguarde alguns minutos e tente novamente.",
      429
    );
  }

  const { data: body, error: parseError } = await readJson(request);
  if (parseError) return parseError;

  const { cliente, servicos, inicio, fim, observacoes } = body ?? {};

  // ---- validação dos dados da cliente -------------
  const nome = cliente?.nome?.toString().trim();
  const telefone = cliente?.telefone?.toString().trim();

  if (!nome || !telefone) {
    return jsonError(
      "Informe 'cliente.nome' e 'cliente.telefone' para identificar a cliente.",
      400
    );
  }

  const telefoneDigitos = telefone.replace(/\D/g, "");
  if (telefoneDigitos.length < 8) {
    return jsonError("Informe um telefone válido para contato.", 400);
  }

  // ---- validação dos serviços ---------------------
  if (!Array.isArray(servicos) || servicos.length === 0) {
    return jsonError("Informe ao menos um serviço em 'servicos' (array de IDs).", 400);
  }
  const servicoIds = [...new Set(servicos)];

  // ---- validação de data/horário ---------------------
  if (!inicio || !fim) {
    return jsonError("Os campos 'inicio' e 'fim' são obrigatórios.", 400);
  }

  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
    return jsonError(
      "'inicio'/'fim' inválidos. Envie data e hora em formato reconhecível (ISO 8601).",
      400
    );
  }
  if (dataFim <= dataInicio) {
    return jsonError("O horário de término deve ser depois do horário de início.", 400);
  }
  if (dataInicio.getTime() < Date.now()) {
    return jsonError("Não é possível agendar em uma data/horário que já passou.", 400);
  }

  try {
    const agendamento = await withTransaction(async (client) => {
      // Busca os serviços informados e já confere existência/disponibilidade.
      const { rows: servicosEncontrados } = await client.query(
        `SELECT id, nome, preco_padrao, necessita_avaliacao, ativo
           FROM servicos
          WHERE id = ANY($1::uuid[])`,
        [servicoIds]
      );

      if (servicosEncontrados.length !== servicoIds.length) {
        throw Object.assign(new Error("Um ou mais serviços informados não existem."), {
          code: "APP_VALIDATION",
        });
      }

      const indisponivel = servicosEncontrados.find((s) => !s.ativo);
      if (indisponivel) {
        throw Object.assign(
          new Error(`O serviço "${indisponivel.nome}" não está mais disponível.`),
          { code: "APP_VALIDATION" }
        );
      }

      // Regra principal: serviço que precisa de avaliação não pode ser
      // agendado direto por aqui — precisa seguir o fluxo existente.
      const precisaAvaliacao = servicosEncontrados.find((s) => s.necessita_avaliacao);
      if (precisaAvaliacao) {
        throw Object.assign(
          new Error(
            `O serviço "${precisaAvaliacao.nome}" exige avaliação prévia e não pode ser agendado diretamente pela página pública. Entre em contato com o estúdio para agendar sua avaliação.`
          ),
          { code: "APP_NECESSITA_AVALIACAO" }
        );
      }

      // Localiza cliente existente pelo telefone (compara só os dígitos, para
      // não depender de formatação exata) ou cadastra uma nova, sem senha/login.
      const { rows: clienteExistente } = await client.query(
        `SELECT id FROM clientes
          WHERE regexp_replace(telefone, '\\D', '', 'g') = $1
          LIMIT 1`,
        [telefoneDigitos]
      );

      let clienteId = clienteExistente[0]?.id;
      if (!clienteId) {
        const { rows: novoCliente } = await client.query(
          `INSERT INTO clientes (nome, telefone) VALUES ($1, $2) RETURNING id`,
          [nome, telefone]
        );
        clienteId = novoCliente[0].id;
      }

      // Cria o agendamento e vincula os serviços, sempre pelo preco_padrao
      // (a cliente pública não define valor).
      const { rows: agendamentoRows } = await client.query(
        `INSERT INTO agendamentos (cliente_id, inicio, fim, observacoes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [clienteId, inicio, fim, observacoes ?? null]
      );
      const novoAgendamento = agendamentoRows[0];

      for (const servico of servicosEncontrados) {
        await client.query(
          `INSERT INTO agendamento_servicos (agendamento_id, servico_id, valor)
           VALUES ($1, $2, $3)`,
          [novoAgendamento.id, servico.id, servico.preco_padrao]
        );
      }

      return {
        ...novoAgendamento,
        cliente_nome: nome,
        servicos: servicosEncontrados.map((s) => ({
          servico_id: s.id,
          nome: s.nome,
          valor: s.preco_padrao,
        })),
      };
    });

    return jsonOk(agendamento, 201);
  } catch (error) {
    if (error.code === "APP_VALIDATION") return jsonError(error.message, 400);
    if (error.code === "APP_NECESSITA_AVALIACAO") return jsonError(error.message, 422);
    if (error.constraint === "impedir_conflito_horarios") {
      return jsonError("Esse horário acabou de ficar indisponível. Escolha outro horário.", 409);
    }
    return handleDbError(error);
  }
}
