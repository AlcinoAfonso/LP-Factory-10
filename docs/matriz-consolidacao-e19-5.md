# Matriz de consolidação — E19.5 — Workspace operacional e lifecycle de LPs

- Plano v1 congelado: PR #726, merge `5d36f2bb4528d4ccb1d34018ae1e3940d2219d28`, blob `ddf5595854023c54a15d38851f0f6d22a146f0a0`.
- Roadmap congelado na retomada: `main` `b5391033faa2ddb1b6199b53c9ac42d63d6420e0`, blob `611164cf95cdbec9ed44efc8e282b26d7acd36c6`.
- Plano v2 aprovado na Passagem 1: commit `a899b2d63434cfa918aa7e4dab08a78e1d8f3b3e`, blob `a173046421279c1f15ba7ba77096c705d0d49e71`.
- Passagem 1 independente: concluída em 21/08/2026, após uma `revisao_delta`, com veredito `aprovado para merge do plano-base v2`.
- Plano conceitual: `N/A`, confirmado na v1 e na Passagem 1.
- Classificações de relação: `preservação do escopo`, `extensão adjacente necessária e proporcional` ou `expansão de escopo`.

## Decisões humanas

| ID | Achado/decisão | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| DH-E19.5-01 | Precursor exclusivo de expand backward-compatible antes da retomada | extensão adjacente necessária e proporcional | incorporado e concluído | v2 1.1, 2.1.5, 2.7 e 3.1 | PR #794, merge `b5391033…`, migration `20260820214422`, snippet 3/3 `ok`, Vercel verde e regressões aprovadas |
| DH-E19.5-02 | Precursor não executa backfill `draft → active`, não muda default, não retira `draft` e não expõe E19.5 | preservação do escopo | incorporado | v2 1.1, 2.1.5, 3.1 e 4.2 | Migration aplicada sem mutação de linhas; default `draft` e compatibilidade preservados |
| DH-E19.5-03 | Contract definitivo somente após runtime funcional implantado e validado | preservação do escopo | incorporado como recorte posterior proibido no PR funcional | v2 1.1, 2.7, 3.2–3.4 e 4.2 | Backfill de status, default `active` e retirada de `draft` permanecem fora da E19.5.3 |
| DH-E19.5-04 | Não criar revisão 4 apenas para regressão | preservação do escopo | incorporado | v2 1.8–1.9, 2.7 e 4.1 | Revisões 1–3 permanecem baseline; regressões pós-merge foram read-only |

## Parecer do Gestor Estrutural

Veredito original: `requer patch estrutural`. Os patches foram consolidados na v2; a limpeza órfã foi retirada após a Passagem 1 por constituir expansão.

| ID | Achado fiel/patch | Relação e natureza original | Tratamento | Destino/localização | Evidência/justificativa |
|---|---|---|---|---|---|
| GE-E19.5-01 | Identidade estável, revisões existentes e escopo negativo estão aderentes | preservação do escopo; não bloqueante | já coberto | v2 1.8–1.11, 3.2 e 4 | Uma LP por identidade; revisão append-only; publicação, editor, A/B e automação fora |
| GE-E19.5-02 / PE19.5-01,07 | Faltavam shape, autoridade, segurança, readiness e ordem para configuração/aprovação | preservação do escopo; bloqueante e determinável | incorporado com rollout backward-compatible | v2 1.5–1.6, 2.1.5, 2.7–2.8 e 3.2 | Duas residências disjuntas, handoff, RPCs, RLS/grants, readiness e contract posterior separado |
| GE-E19.5-03 / PE19.5-02 | Catálogo v5 dependia de aceitação E20.6 explícita | preservação do escopo; bloqueante e determinável | incorporado | v2 1.7, 2.1.2–2.1.4, 2.7 e 3.2 | `landing_page_objective`, evidence própria, v1–v4 deep-equal e geração fail-closed até v5 revisada |
| GE-E19.5-04 / PE19.5-03 | Lifecycle exigia contratos/snapshots versionados sem regravar histórico | extensão adjacente necessária e proporcional; bloqueante e determinável | incorporado | v2 1.9, 2.1.3–2.1.6, 2.7 e 3.2 | Contexto v4/snapshot v2 novos; v3/v1 históricos continuam read-only |
| GE-E19.5-05 / PE19.5-04 | Histórico e aprovação devem reutilizar preview e revisão existentes | preservação do escopo; bloqueante e determinável | incorporado | v2 1.8, 2.4.4–2.5 e 3.2 | Preview atual/histórico no mesmo renderer; ponteiro tenant-safe e aprovação idempotente |
| GE-E19.5-06 / PE19.5-05 | Decomposição deveria preservar providers/guards e boundary LP Builder | preservação do escopo; bloqueante e determinável | incorporado | v2 2.2–2.6, 2.8 e 3.2 | UI route-local, actions finas, `AccessProvider`/guard existentes e adapters no boundary |
| GE-E19.5-07 / PE19.5-06 | Remover action órfã para evitar caminho aparente paralelo | expansão de escopo; originalmente bloqueante | não incorporado — justificado pela Passagem 1 | N/A; recorte próprio futuro se necessário | Action sem consumidor delega ao mesmo boundary e não impede E19.5; limpeza não indispensável foi excluída |

## Parecer do Gestor de Updates

Veredito original: `updates aplicáveis com patches autossuficientes`.

| Update | Achado fiel | Relação | Tratamento | Destino do update/localização | Evidência/justificativa |
|---|---|---|---|---|---|
| `supa#35` | Índice somente com consulta real e evidência de plano | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava — v2 3.2 critérios | Projeções, filtros tenant-safe, ordem determinística e proibição de autoaplicação |
| `supa#40` | Migration, teste SQL e snippet read-only para objetos afetados | extensão adjacente necessária e proporcional | incorporado | aplicar agora — v2 2.1.5 e 3.2 critérios | Apply canônico pós-merge e prova separada de schema/segurança |
| `supa#47` | Preservar bucket privado e assets imutáveis | preservação do escopo | incorporado | usar como referência, validação ou trava — v2 2.7 e 3.2 critérios | Lifecycle, aprovação e histórico não alteram bucket, path, policy ou objeto |
| `supa#63` | Ampliar regressão RLS com ferramenta comunitária quando a matriz crescer | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | Sem `pgtap`, ferramenta ou workflow novo neste recorte |
| `supa#68` | Realtime se concorrência operacional real justificar | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | Sem Realtime, publicação de tabela ou upgrade neste recorte |
| `supa#69` | Tracing Supabase se incidentes não forem resolvidos por logs/request ID | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | Sem OpenTelemetry, Log Drain ou upgrade neste recorte |
| `vercel#15` | Toolbar como apoio opcional de QA | extensão adjacente necessária e proporcional | incorporado como apoio não bloqueante | usar como referência, validação ou trava — v2 2.6 | Não substitui casos executáveis, matriz hospedada ou validação humana |
| `vercel#20` | Flags gerenciadas para rollout/A-B futuro | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | E19.5 não cria flag, targeting, split ou experimento |
| `vercel#21` | Vercel Blob substituiria Storage vigente | expansão de escopo | não incorporado — justificado | não aplicável ao recorte | Criaria segundo provider/residência sem requisito não atendido |
| `vercel#29` | Upgrade Next.js 16.3 como recorte técnico independente | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | Preservar Next.js 16.2.11 na E19.5 |
| `github#11` | Run retido exige revisão humana de ator, evento, workflow, permissões e secrets | extensão adjacente necessária e proporcional | não incorporado no plano — já governado | usar como referência, validação ou trava — `AGENTS.md`/fluxo GitHub | Gate operacional transversal; não altera produto, plano ou workflow |
| `prod#3` | Medir performance percebida após tráfego real | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | Sem Speed Insights ou score automático na primeira E19.5 |
| `prod#6` | Qualidade/SEO do conteúdo gerado não pertence ao workspace | expansão de escopo | não incorporado — justificado | não aplicável ao recorte | Geração E19.4 é reutilizada sem mudar prompt, modelo ou copy |
| `prod#12` | Manter conta e LP reconhecíveis em detalhe/configuração/histórico/preview | preservação do escopo | incorporado | aplicar agora — v2 2.2 | Contexto visível e retorno previsível, sem Partner Dashboard |
| `prod#14` | Estado, versão aprovada/recente e próximo passo devem ser reconhecíveis | preservação do escopo | incorporado | aplicar agora — v2 2.6 | Feedback e foco após ações; estados derivados não técnicos |
| `prod#15` | Microeventos/follow-up de visitantes não integram workspace privado | expansão de escopo | não incorporado — justificado | não aplicável ao recorte | Sem tracking, segmentação, integração ou automação |
| `prod#16` | QA autenticado completo nos papéis, estados, ações e viewports | extensão adjacente necessária e proporcional | incorporado | aplicar agora — v2 2.6 e 3.2 critérios | Owner/admin, negativos, 1280/768/360, overflow e console |
| `prod#17` | Baseline WCAG 2.2 aplicável sem alegação integral | extensão adjacente necessária e proporcional | incorporado | aplicar agora — v2 2.6 | Semântica, labels, erros, teclado, foco, contraste e toque |
| `prod#23` | Comparar Meta Business Agent somente com requisito futuro | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | CTA/binding atual preservado; sem app, webhook, job ou agente |

## Parecer do Gestor de Automações

`N/A — a v1 registra Automação: não; a E19.5 reutiliza a ação humana e os workloads vigentes da E19.4, sem nova automação, agente, job, fila, cron, webhook, prompt, modelo ou workload.`

## Passagem 1 e revisão delta

| ID | Achado | Relação | Tratamento | Destino/localização | Estado |
|---|---|---|---|---|---|
| P1-E19.5-01 | Estado vigente ainda dizia aceitar somente `draft` após o expand | preservação do escopo | corrigido | v2 1.2 | Registra `draft | active | archived`, default `draft` e lifecycle ainda não exposto |
| P1-E19.5-02 | `landing_page_objective` não fechava `createdInVersion` e evidence | preservação do escopo | corrigido | v2 1.7 e 3.2 critérios | `createdInVersion: 5`, `decision:e19-5-human-v1` e v1–v4 deep-equal |
| P1-E19.5-03 | Backfill/handoff não explicitava validação de scope e autoridade | preservação do escopo | corrigido | v2 2.1.5 e 3.2 critérios | Drift ou field autoritativo persistido aborta integralmente; não há cópia indevida |
| P1-E19.5-04 | Remoção de action órfã não era indispensável | expansão de escopo | não incorporado — justificado | removido da v2 | Limpeza adiável não interfere no workspace nem no boundary público |

Veredito final da Passagem 1: `aprovado para merge do plano-base v2`, sem correção residual e sem autorização para iniciar o contract.
