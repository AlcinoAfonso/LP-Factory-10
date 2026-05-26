# Ferramentas reais do LP Factory Investigator

Este diretorio registra o contrato operacional da Fase 3: o agente deve usar ferramentas reais quando elas estiverem disponiveis na sessao, mas nunca deve inventar evidencia quando uma ferramenta, conector ou credencial estiver ausente.

## Preflight local

Executar:

```bash
node plugins/lp-factory-investigator/scripts/tool-readiness.mjs
```

O script verifica apenas disponibilidade e formato. Ele nao chama APIs remotas, nao imprime secrets e nao altera estado.

## Matriz de ferramentas

| Plataforma | Ferramenta preferida | Fallback permitido | Mutacao padrao |
| --- | --- | --- | --- |
| GitHub | GitHub Connector do Codex | GitHub Web, `gh` autenticado fora do sandbox | Proibida sem autorizacao |
| Vercel | Vercel Connector/API | GitHub Web/Vercel Web, `vercel` autenticado fora do sandbox | Proibida sem autorizacao |
| OpenAI | OpenAI Developers/Platform | probe HTTP nao destrutivo com `OPENAI_API_KEY` | Proibida sem autorizacao |
| Supabase | SQL read-only com `SUPABASE_DB_URL_READONLY` | Supabase Inspect MCP/Actions | Escrita proibida |
| App | Browser controlado ou HTTP GET/HEAD | GitHub/Vercel preview link | Somente smoke nao destrutivo |
| Actions | GitHub Connector/Web | logs de workflow publicados | Disparo so com autorizacao |

## Classificacao obrigatoria

Toda verificacao deve terminar em uma destas classes:

```text
verificado
nao verificavel
bloqueado por ferramenta
bloqueado por credencial
depende autorizacao
```

Secrets e env vars sensiveis devem ser reportados somente por status: `presente`, `ausente`, `valor com formato esperado`, `valor com formato invalido`, `sensitive correto`, `sensitive incorreto`, `acesso negado` ou `nao verificavel`.

## Probes permitidos

- HTTP `GET` ou `HEAD` em preview/producao.
- Listagem read-only de PRs, deployments, logs e checks.
- Consulta SQL `select`/metadata com credencial read-only.
- Probe OpenAI minimo para validar autenticacao/modelo quando o escopo exigir.

## Probes bloqueados por padrao

- Escrita em Supabase.
- Deploy/redeploy.
- Alteracao de env var.
- Rotacao/criacao de API key.
- Comentario em PR, approve, merge ou disparo de workflow com efeito colateral.
