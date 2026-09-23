export const CATEGORIA_RECEITA_AUTOMATICA = "atendimento_automatico";

export async function sincronizarReceitaAtendimento(client, agendamento) {
  const { rows: lancamentos } = await client.query(
    `SELECT id, categoria, valor
       FROM movimentacoes_financeiras
      WHERE agendamento_id = $1 AND tipo = 'receita'
      FOR UPDATE`,
    [agendamento.id]
  );
  const automaticos = lancamentos.filter(
    (item) => item.categoria === CATEGORIA_RECEITA_AUTOMATICA
  );

  if (agendamento.status !== "realizado") {
    if (automaticos.length) {
      await client.query(
        `DELETE FROM movimentacoes_financeiras
          WHERE agendamento_id = $1 AND categoria = $2 AND tipo = 'receita'`,
        [agendamento.id, CATEGORIA_RECEITA_AUTOMATICA]
      );
    }
    return;
  }

  const { rows } = await client.query(
    `SELECT c.nome AS cliente_nome, COUNT(ags.id)::int AS quantidade_servicos,
            COALESCE(SUM(ags.valor), 0) AS total_servicos
       FROM agendamentos a
       JOIN clientes c ON c.id = a.cliente_id
       LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
      WHERE a.id = $1
      GROUP BY c.nome`,
    [agendamento.id]
  );
  const atendimento = rows[0];
  const total = Number(atendimento?.total_servicos ?? 0);
  if (!atendimento?.quantidade_servicos || !Number.isFinite(total) || total <= 0) {
    throw Object.assign(
      new Error("Informe serviços com valor positivo antes de concluir o atendimento."),
      { code: "APP_VALIDATION" }
    );
  }

  const recebidoManualmente = lancamentos
    .filter((item) => item.categoria !== CATEGORIA_RECEITA_AUTOMATICA)
    .reduce((soma, item) => soma + Number(item.valor), 0);
  const valorAutomatico = Math.round((total - recebidoManualmente) * 100) / 100;

  if (valorAutomatico <= 0) {
    if (automaticos.length) {
      await client.query(
        `DELETE FROM movimentacoes_financeiras
          WHERE agendamento_id = $1 AND categoria = $2 AND tipo = 'receita'`,
        [agendamento.id, CATEGORIA_RECEITA_AUTOMATICA]
      );
    }
    return;
  }

  const descricao = `Atendimento de ${atendimento.cliente_nome}`;
  if (automaticos.length) {
    await client.query(
      `UPDATE movimentacoes_financeiras
          SET valor = $1, descricao = $2
        WHERE id = $3`,
      [valorAutomatico, descricao, automaticos[0].id]
    );
    if (automaticos.length > 1) {
      await client.query(
        `DELETE FROM movimentacoes_financeiras WHERE id = ANY($1::uuid[])`,
        [automaticos.slice(1).map((item) => item.id)]
      );
    }
    return;
  }

  await client.query(
    `INSERT INTO movimentacoes_financeiras
       (agendamento_id, tipo, descricao, categoria, valor, data_movimentacao)
     VALUES ($1, 'receita', $2, $3, $4, (now() AT TIME ZONE 'America/Sao_Paulo')::date)`,
    [agendamento.id, descricao, CATEGORIA_RECEITA_AUTOMATICA, valorAutomatico]
  );
}
