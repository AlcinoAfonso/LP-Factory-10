# automations/validador-final

Primeiro subprojeto canônico da nova raiz `automations/`.

## Objetivo

Estabelecer o runtime isolado inicial do **Validador Final** sem alterar funcionalmente o Core do SaaS.

> Neste PR, o executor `run.mjs` é um placeholder operacional explícito (bootstrap estrutural), não a implementação final da automação.

## Como rodar localmente

```bash
npm ci
npm run check
npm run start
```

## Convenção estrutural

- Novas automações relevantes devem nascer em `automations/<nome>/` como subprojetos isolados.
- `.github/workflows/` continua sendo a camada de entrada e orquestração.
- `pipelines/` permanece como estrutura legada em revisão/migração.
