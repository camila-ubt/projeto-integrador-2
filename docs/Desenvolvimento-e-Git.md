# Desenvolvimento e Git

O trabalho é organizado em branches de funcionalidade ou correção, com integração à `main` por Pull Requests. A revisão reúne a análise das alterações, a discussão entre as integrantes e as verificações automáticas.

## Revisão e integração

A `main` possui proteção ativa. As regras exigem uma aprovação, resolução das conversas de revisão e os checks **Análise de segurança JavaScript** e **Lint, build e auditoria**. Também restringem atualizações diretas, exclusão e reescrita do histórico, com exceção administrativa configurada no repositório.

O fluxo adotado pela equipe usa squash merge para reunir as alterações de um PR em um commit na `main`. A configuração aceita os métodos merge e squash.

## Verificações automáticas

O GitHub Actions executa dois workflows em Pull Requests direcionados à `main` e em pushes nessa branch:

| Workflow | Verificações |
| --- | --- |
| Segurança e qualidade | Node.js 24, instalação de dependências, `npm audit --audit-level=high`, `npm run lint` e `npm run build`. |
| CodeQL | Análise de JavaScript/TypeScript com consultas de segurança e qualidade; também há execução semanal. |

O lint está configurado com `continue-on-error: true`, portanto suas falhas são registradas sem interromper o job. Auditoria e build seguem como etapas que podem fazê-lo falhar.

A criação de releases após alterações na `main` está descrita em [Versionamento e Releases](Versionamento-e-Releases).
