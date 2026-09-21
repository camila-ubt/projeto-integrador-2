# Roadmap

A evolução da Beta acompanha os testes da equipe e a validação com a cliente. As prioridades serão ajustadas conforme o uso, sem prazos fixados nesta documentação.

## Base funcional

A primeira versão reúne a área pública, agendamento online, contato pelo WhatsApp para avaliação prévia e painel administrativo. O banco já mantém os relacionamentos, bloqueia conflitos entre horários agendados e gera recomendações de retorno. Os recursos de cada tela estão em [Funcionalidades](Funcionalidades).

## Pontos para ajuste e validação

| Frente | Próxima evolução |
| --- | --- |
| Login | Alinhar o redirecionamento do painel e a configuração do NextAuth, que apontam para `/admin/login`, com a página existente em `/login`. |
| Retornos | Alinhar os status entre tela, API e schema: a opção `faltou` aparece na interface e na API, enquanto o banco aceita `pendente`, `agendado`, `realizado` e `cancelado`. Revisar também a continuidade dos retornos pendentes na tela. |
| Agendamento | Validar horários, duração dos serviços, cancelamentos e mensagens de conflito com os cenários reais do estúdio. |
| Histórico | Avaliar com a cliente como incorporar à interface os detalhes de procedimentos já previstos no banco e na API. |
| Caixa e dashboard | Conferir lançamentos e totais durante os testes de uso. |
| Responsividade | Revisar navegação, formulários e leitura dos registros em diferentes tamanhos de tela. |
| Qualidade | Tratar os apontamentos do lint e acompanhar as análises de segurança e dependências. |

A consolidação da versão final depende das correções e do retorno da cliente sobre os fluxos testados.
