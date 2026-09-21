# Funcionalidades

## Área pública

A página inicial apresenta o estúdio e os contatos. O catálogo mostra os serviços ativos, com descrição, duração, preço e indicação de avaliação prévia, em cartões com detalhes expansíveis.

O agendamento online passa pela escolha do serviço, data e horário, dados da cliente e confirmação. A interface considera a duração do procedimento e consulta os intervalos ocupados. Ao confirmar, a API localiza a cliente pelo telefone ou cria seu cadastro e grava o agendamento com o serviço escolhido.

Para serviços que exigem avaliação prévia, o sistema oferece a continuidade pelo WhatsApp com uma mensagem preparada sobre o procedimento.

## Área administrativa

| Área | Recursos disponíveis |
| --- | --- |
| Dashboard | Agendamentos do dia, retornos pendentes e faturamento diário calculado pelas receitas registradas no caixa. |
| Agendamentos | Cadastro, consulta, edição de data, horário e status, exclusão e filtros por cliente, status e período. |
| Clientes | Cadastro, pesquisa por nome ou telefone, edição e exclusão quando os vínculos permitem. |
| Histórico | Consulta dos agendamentos, com cliente, serviços, valores, status, filtros e paginação. |
| Retornos | Consulta por data e status, identificação da cliente e do serviço e marcação como realizado para retornos agendados. |
| Serviços | Cadastro e edição de descrição, duração, preço, avaliação prévia, prazo de retorno e situação ativa; consulta de inativos e exclusão ou desativação. |
| Caixa | Registro e exclusão de receitas e despesas, consulta por mês e ano e totais de receitas, despesas e saldo. |

Os retornos recomendados são gerados pelo banco ao concluir atendimentos com prazo de retorno configurado. A regra está detalhada em [Banco de Dados](Banco-de-Dados).

A tela de Histórico apresenta os dados dos agendamentos. Os registros detalhados de produto, cor e técnica ficam disponíveis na [API de histórico de procedimentos](API).

## Acesso e uso em diferentes telas

O painel utiliza login com e-mail e senha, sessão autenticada e opção de sair. A interface adapta menus e a apresentação dos registros para computador e celular, incluindo tabelas e cartões conforme a tela.

Os pontos que ainda precisam de ajustes na Beta estão no [Roadmap](Roadmap).
