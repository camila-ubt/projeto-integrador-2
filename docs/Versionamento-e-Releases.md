# Versionamento e Releases

O sistema permanece em desenvolvimento e utiliza versões Beta para acompanhar as entregas durante os testes e a validação com a cliente.

## Identificação da versão

O padrão atual é `v0.1.0-beta.<sha>`, com os sete primeiros caracteres do commit. Por exemplo, `v0.1.0-beta.bd834f3` identifica o código do commit `bd834f3`.

O componente `AppVersion`, incluído no layout principal, apresenta a versão no rodapé:

| Ambiente identificado no build | Formato |
| --- | --- |
| Produção na Vercel, com SHA disponível | `v0.1.0-beta.<sha>` |
| Outros ambientes com SHA disponível | `v0.1.0-preview.<sha>` |
| Sem SHA disponível | `v0.1.0-dev` |

A versão base do rodapé vem de `package.json`; o SHA e o ambiente vêm de `VERCEL_GIT_COMMIT_SHA` e `VERCEL_ENV`.

## Releases automáticas

O workflow `release-beta.yml` é acionado a cada push na `main`. Ele monta a identificação Beta, cria a tag no commit correspondente e publica uma pré-release no GitHub com notas geradas automaticamente. Atualmente, a base `v0.1.0` está definida no próprio workflow.

## Release e deploy

A Vercel publica a aplicação a partir do código do repositório. A release identifica o commit no GitHub, enquanto o rodapé identifica o commit usado no build publicado. Quando ambos usam o mesmo commit em produção, as identificações coincidem.

A criação da release e as verificações de qualidade são workflows separados, acionados pelo mesmo push. A confirmação de uma publicação considera também o resultado do deploy da Vercel.
