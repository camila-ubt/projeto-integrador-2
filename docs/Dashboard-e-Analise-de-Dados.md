# Dashboard e Análise de Dados

O dashboard reúne dados de agendamentos, serviços, clientes e movimentações financeiras para apoiar a gestão do estúdio. A análise permite acompanhar os resultados do período, identificar padrões de atendimento e consultar o histórico de retorno das clientes.

A tela fica na área administrativa e exige sessão autenticada. Os dados são consultados pela rota protegida `/api/admin/resumo`.

## Período e filtros

Ao abrir a tela, a consulta considera o início do mês até o dia atual. É possível selecionar outro mês, usar os atalhos Hoje e Mês atual ou definir as datas inicial e final em Mais opções. Nesse mesmo espaço ficam os filtros por serviço, status do agendamento e cliente.

Os indicadores com comparação utilizam o intervalo imediatamente anterior, com a mesma quantidade de dias e os mesmos filtros de atendimento. As datas dos agendamentos são consideradas no fuso de São Paulo. A consulta aceita períodos de até 1.096 dias.

## Indicadores principais

O valor dos atendimentos corresponde à soma dos valores registrados nos serviços de agendamentos com status realizado. O ticket médio divide esse valor pela quantidade de atendimentos realizados. Ao filtrar um serviço, os valores consideram apenas esse serviço nos atendimentos selecionados.

A quantidade de atendimentos considera os agendamentos que correspondem aos filtros, com destaque para realizados e agendados. O total de clientes atendidos conta cada cliente uma única vez entre os atendimentos realizados. A taxa de cancelamentos e faltas representa a participação desses dois status no total de agendamentos selecionados.

Os cartões apresentam a variação em relação ao período anterior. A diferença da taxa de cancelamentos e faltas é expressa em pontos percentuais. Quando um valor cresce a partir de uma base anterior igual a zero, a comparação informa Sem base anterior.

## Evolução e serviços

O gráfico de evolução apresenta o valor dos serviços e a quantidade de atendimentos realizados ao longo do período. A visualização agrupa os dados por dia, semana ou mês conforme a extensão do intervalo consultado.

A análise de serviços mostra até oito serviços, selecionados pela quantidade de realizações, com sua participação no total. Esses mesmos serviços também são apresentados em ordem de valor acumulado nos atendimentos concluídos.

## Movimento e duração

As visualizações por dia da semana e horário de início mostram a quantidade de agendamentos que corresponde aos filtros aplicados. A duração média agendada considera a diferença entre início e fim dos atendimentos realizados; não corresponde a uma medição do tempo efetivamente gasto no procedimento.

## Clientes e retornos

A classificação de clientes novos e recorrentes utiliza o histórico de atendimentos realizados. Uma cliente é recorrente quando possui atendimento realizado antes do início do período. As demais clientes atendidas no intervalo são classificadas como novas.

A análise de retorno considera novas visitas em dias diferentes, com status realizado. Apresenta o percentual de clientes que voltaram entre as atendidas no período, a comparação em pontos percentuais com o intervalo anterior e o intervalo típico de retorno, calculado pela mediana. O intervalo médio também aparece na seção de clientes novos e recorrentes.

As visitas de retorno são distribuídas nas faixas de até 30 dias, de 31 a 60 dias e mais de 60 dias. A tela também apresenta até cinco clientes com mais visitas de retorno no período, com acesso ao cadastro.

A visita anterior pode estar fora do período selecionado. Quando há filtro de serviço, ele se aplica à visita atual; a anterior pode ter sido de outro serviço. O percentual é observado no histórico e não representa uma previsão. Essa análise é diferente dos retornos recomendados gerados pelo banco, descritos em [Banco de Dados](Banco-de-Dados).

## Despesas e saldo do caixa

A seção financeira apresenta receitas lançadas, despesas registradas e saldo do período, além da comparação das despesas com o intervalo anterior. As despesas são agrupadas por categoria e relacionadas ao total de receitas, quando há receitas lançadas.

Os valores financeiros vêm dos lançamentos do Caixa e seguem apenas as datas selecionadas, sem os filtros de cliente, serviço ou status. O saldo corresponde às receitas menos as despesas registradas e não representa lucro. O valor dos atendimentos e as receitas do caixa têm origens diferentes e podem não coincidir.

A seção oferece acesso à tela de Caixa para consultar os lançamentos.

## Apoio à rotina

Quando há aniversariantes cadastradas, o dashboard apresenta as clientes do mês da data inicial selecionada, com acesso ao cadastro. Essa consulta não depende dos filtros de atendimento.

A seção Próximos atendimentos mostra até seis agendamentos futuros com status agendado, ordenados por data e horário, com acesso ao registro e à agenda completa. Ela considera os filtros de cliente e serviço, independentemente do período e do status escolhidos para a análise.

## Limites da análise

Os resultados dependem dos dados cadastrados e da atualização dos status e lançamentos. A taxa de ocupação ainda não é calculada, pois depende da definição dos horários disponíveis do estúdio.

Os demais recursos do painel estão em [Funcionalidades](Funcionalidades), e os ajustes previstos para a Beta estão no [Roadmap](Roadmap).
