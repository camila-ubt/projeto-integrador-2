# API

As rotas ficam em `app/api` e usam Route Handlers do Next.js. A interface faz requisições HTTP; as rotas validam os dados, consultam o PostgreSQL por `lib/db.js` e devolvem respostas JSON. Operações com gravações relacionadas usam transações.

## Rotas públicas

| Rota | Métodos | Objetivo |
| --- | --- | --- |
| `/api/servicos` | GET | Listar serviços ativos; `todos=true` inclui inativos. |
| `/api/servicos/[id]` | GET | Consultar um serviço. |
| `/api/agendamentos/publico` | GET | Consultar intervalos ocupados com `inicio` e `fim`, em período de até 62 dias. Retorna os horários de registros não cancelados. |
| `/api/agendamentos/publico` | POST | Criar agendamento com dados da cliente e serviços ativos que permitem marcação direta. |
| `/api/auth/[...nextauth]` | GET, POST | Processar as operações de autenticação e sessão do NextAuth. |

O agendamento público recebe `cliente` com nome e telefone, `servicos` com os identificadores, `inicio`, `fim` e observações opcionais. O valor de cada serviço vem do cadastro. Conflitos de horário retornam HTTP 409; serviços com avaliação prévia retornam 422. Há um limite de tentativas por IP mantido na memória de cada instância.

## Rotas protegidas

Estas operações exigem sessão autenticada. `[id]` representa o identificador do registro.

| Grupo | Métodos e rotas | Objetivo |
| --- | --- | --- |
| Dashboard | GET `/api/admin/resumo` | Reunir agendamentos do dia, retornos pendentes e receitas do dia. |
| Agendamentos | GET, POST `/api/agendamentos`; GET, PUT, DELETE `/api/agendamentos/[id]` | Consultar e manter horários, status e serviços vinculados. |
| Clientes | GET, POST `/api/clientes`; GET, PUT, DELETE `/api/clientes/[id]` | Pesquisar e manter cadastros de clientes. |
| Histórico de procedimentos | GET, POST `/api/historico`; GET, PUT, DELETE `/api/historico/[id]` | Manter registros de procedimentos, incluindo produto, cor, técnica e observações. |
| Retornos | GET, POST `/api/retorno`; GET, PUT, DELETE `/api/retorno/[id]` | Consultar, cadastrar e atualizar recomendações de retorno. |
| Financeiro | GET, POST `/api/financeiro`; GET, PUT, DELETE `/api/financeiro/[id]` | Manter receitas e despesas, com filtros por tipo, categoria e período. |
| Serviços | POST `/api/servicos`; PUT, DELETE `/api/servicos/[id]` | Cadastrar, editar, ativar, desativar e excluir serviços. |

As consultas oferecem filtros conforme o grupo: cliente, status e período nos agendamentos; busca nos clientes; cliente no histórico; cliente e status nos retornos.

As respostas distinguem falhas de autenticação, dados inválidos, registros ausentes e conflitos. As regras de integridade e os retornos automáticos são descritos em [Banco de Dados](Banco-de-Dados).
