# Banco de Dados

O PostgreSQL/Neon concentra os dados do estúdio. A estrutura documentada corresponde ao arquivo `database/schema.sql` da versão revisada.

## Tabelas

As tabelas principais do sistema utilizam UUID como identificador. A tabela técnica `rate_limits` usa uma chave textual gerada a partir de hash para controlar tentativas de acesso. Os principais campos são:

| Tabela | Dados armazenados |
| --- | --- |
| `clientes` | Nome, telefone, aniversário, observações e `atualizado_em`. |
| `servicos` | Nome, descrição, `duracao_minutos`, `preco_padrao`, `necessita_avaliacao`, `retorno_dias` e indicador `ativo`. |
| `agendamentos` | Cliente, início, fim, status, observações e campo opcional `google_event_id`. |
| `agendamento_servicos` | Agendamento, serviço e valor registrado para aquele atendimento. |
| `historico_procedimentos` | Cliente, agendamento e serviço opcionais, produto utilizado, cor, técnica, observações e data do procedimento. |
| `retornos` | Cliente, serviço e agendamento de origem opcionais, data recomendada, status e observações. |
| `movimentacoes_financeiras` | Agendamento opcional, tipo, descrição, categoria, valor, forma de pagamento e data da movimentação. |
| `rate_limits` | Chave de controle, quantidade de tentativas e início da janela usada no limite de requisições. |
| `usuarios` | Nome, e-mail único, `senha_hash`, perfil `admin`, indicador `ativo` e `atualizado_em`. |

## Relacionamentos

Uma cliente pode ter vários agendamentos, registros de procedimentos e retornos. Cada agendamento reúne seus serviços em `agendamento_servicos`, preservando o valor de cada item naquele atendimento.

Históricos e retornos podem estar vinculados a um serviço e ao agendamento de origem. As movimentações financeiras também podem ser associadas a um agendamento. Esses vínculos são mantidos por chaves estrangeiras.

A exclusão de um agendamento remove seus itens de `agendamento_servicos` em cascata. Outros vínculos existentes podem impedir exclusões e preservar os registros relacionados.

## Regras do schema

- Agendamentos aceitam `agendado`, `realizado`, `cancelado` e `faltou`, com término posterior ao início.
- Retornos aceitam `pendente`, `agendado`, `realizado` e `cancelado`; o status inicial é `pendente`.
- Movimentações são `receita` ou `despesa`, com valor maior que zero. A forma de pagamento é opcional e aceita `dinheiro`, `pix`, `debito` ou `credito`.
- Usuários possuem e-mail único e perfil `admin`.

## Conflito de horários

A restrição `impedir_conflito_horarios` impede a sobreposição de intervalos entre registros com status `agendado`. Ela usa GiST e `tstzrange(inicio, fim, '[)')`: um atendimento pode começar exatamente quando outro termina. O schema também inclui a extensão `btree_gist`.

## Retornos automáticos

Ao mudar um agendamento para `realizado`, o trigger `gerar_retorno_ao_realizar` executa a função `criar_retorno_automatico`. Para cada serviço vinculado com `retorno_dias` preenchido, a função cria um retorno com a data de início do atendimento acrescida desse prazo.

A função verifica se já existe um retorno para o mesmo agendamento e serviço antes de inserir o registro.
