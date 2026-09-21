# Arquitetura do Sistema

A aplicação reúne interface, APIs próprias e acesso ao banco em um projeto Next.js, com React e JavaScript. As páginas e os layouts seguem o App Router. Bootstrap, CSS global e CSS Modules compõem a apresentação das telas.

## Organização

| Local | Responsabilidade |
| --- | --- |
| `app/(public)/` | Página inicial, serviços, agendamento e login. O grupo `(public)` organiza os arquivos sem fazer parte da URL. |
| `app/admin/` | Páginas administrativas, com layout compartilhado, menu lateral e acompanhamento da sessão pelo `AdminShell`. |
| `app/api/` | Route Handlers: funções que recebem as requisições HTTP e executam consultas, validações e alterações. |
| `app/components/` | Componentes compartilhados, incluindo navegação e versão no rodapé. |
| `lib/` | Conexão com o banco, autenticação das rotas, respostas da API, constantes e formatação. |
| `services/` | Consulta ao resumo usado pelo dashboard. |
| `database/` | Schema PostgreSQL e dados de teste. |

## Banco e autenticação

O PostgreSQL fica hospedado no Neon. O arquivo `lib/db.js` centraliza o acesso pelo pacote `pg`, com pool de conexões e transações para operações relacionadas, como a gravação de um agendamento e seus serviços.

O NextAuth valida e-mail e senha na tabela `usuarios`, compara o hash com bcrypt e mantém a sessão com JWT. O login exige usuário ativo. As rotas administrativas verificam a sessão antes de acessar os dados. Há também um controle de tentativas de login mantido na memória de cada instância.

## Integração com WhatsApp

Quando um serviço exige avaliação prévia, a página de agendamento prepara uma mensagem com o nome do procedimento. Ao escolher continuar pelo WhatsApp, a cliente abre a conversa com o estúdio para combinar a avaliação.

Esse contato faz parte do fluxo da área pública. As APIs próprias cuidam dos cadastros, agendamentos e demais operações descritas em [API](API).

## Publicação e automações

A aplicação é publicada na Vercel. O GitHub Actions executa verificações de qualidade e segurança e cria as releases Beta. O fluxo de colaboração está em [Desenvolvimento e Git](Desenvolvimento-e-Git), e a identificação das versões em [Versionamento e Releases](Versionamento-e-Releases).
