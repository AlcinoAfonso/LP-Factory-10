# Presets do Investigator

Presets sao contratos reutilizaveis para investigacoes recorrentes. Eles nao executam a investigacao sozinhos; orientam o agente sobre alvo, plataformas, evidencias esperadas, probes permitidos e criterios de pronto.

Uso recomendado:

```text
@Investigator
Use o preset readiness-pr para investigar o PR #263.
```

Listar presets locais:

```bash
node plugins/agent-investigator/scripts/list-presets.mjs
```

## Presets disponiveis

| Preset | Quando usar |
| --- | --- |
| `readiness-pr` | Validar PR, branch, commits, checks, mergeabilidade e preview associado. |
| `readiness-preview-vercel` | Validar preview/deploy Vercel, env vars, logs e necessidade de redeploy. |
| `audit-env-vars` | Auditar variaveis e secrets por presenca, ambiente, sensibilidade e formato, sem revelar valores. |
| `openai-key-model` | Validar key/projeto/modelo OpenAI e compatibilidade API quando verificavel. |
| `supabase-schema-rpc` | Validar schema, colunas, RPCs e dados minimos via leitura/read-only. |
| `pre-smoke-funcional` | Preparar readiness antes de smoke funcional nao destrutivo. |
| `pre-merge-operacional` | Consolidar riscos operacionais antes de merge humano. |

## Contrato

Cada preset deve declarar:

- `id`
- `title`
- `goal`
- `platforms`
- `requiredInputs`
- `checks`
- `allowedProbes`
- `blockedActions`
- `readyCriteria`
- `reportSections`

Secrets devem ser reportados apenas por status, nunca por valor.
