# Matriz de consolidação — E19.4 — Cenário E

- Plano v1 congelado: blob `bfa5adb2677fd4597cda463a1988b3a23b0e70bf`, mergeado pelo PR #759 no commit `747a09f4c081f7f18181202308345ff035b4814e`.
- Regra humana de autoridade: a seção `1.7. Matriz final da v1` está integralmente excluída do contrato operacional e não foi transportada, interpretada nem usada como evidência nesta matriz.
- Roadmap congelado na base: blob `9aa54d526d6004f97dc41aade44085d9b09cac49`.
- Plano v2 aprovado na Passagem 1: commit `b036a6fd3704afd8211bb0cf932c2e3ac6cd959a`, blob `e8447d62b495f1cc70664bc8ab35835176b193c7`.
- Passagem 1 independente: concluída em 17/08/2026, após duas `revisao_delta`, com veredito `aprovado para merge do plano-base v2`.
- Esta matriz substitui integralmente o artefato anterior do Cenário D e foi criada somente após a aprovação da Passagem 1.
- Classificações de relação: `preservação do escopo`, `extensão adjacente necessária e proporcional` ou `expansão de escopo`.

## Decisões humanas

| ID | Decisão/achado | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| DH-01 / 1A | Evoluir `account_landing_page_materializations` para 1:N, sem entidade concorrente | preservação do escopo | incorporado literalmente | v2 1.2, 3.1, 5.2 | PK em `id`, `revision_number`, corrente por maior número, append transacional e backfill histórico |
| DH-02 / 2A | Supabase Storage privado; identidade por `bucket + path`; signed URL só no consumo | preservação do escopo | incorporado literalmente | v2 1.2, 3.2, 4.1 | Bucket privado, path tenant-scoped, URL temporária server-side e nenhuma URL assinada persistida |
| DH-03 / 3A | Workload separado `landing_page_draft_image_generation` | extensão adjacente necessária e proporcional | incorporado com fechamento técnico | v2 1.2, 2.4, 3.3, 5.1 | União E21.1 `responses_text | image_generation`; parâmetros e telemetria próprios |
| DH-04 / 4A | Reutilizar/adaptar a rota histórica de Preview e separar workspace/renderer | preservação do escopo | incorporado com sequenciamento hospedado | v2 1.2, 4.1, 5.1–5.4, 7.3 | PR A implanta shell/gatilho; PR B acrescenta read model e renderer |

## Parecer do Gestor Estrutural

Veredito original: bloqueado pelas quatro decisões humanas acima. Todas foram fornecidas sem reabrir escopo; não restou bloqueio estrutural.

| ID | Achado/patch | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| GE19.4-001 | Escopo e dependências do Cenário E são coerentes | preservação do escopo | já coberto | v2 1.1–1.4 e 2.1 | E19.3 v3, E18.4 e plano conceitual preservados |
| GE19.4-002 | Contrato físico 1:N e revisão corrente estavam em aberto | preservação do escopo | incorporado por DH-01 | v2 3.1 | Tabela existente evoluída, corrente por maior `revision_number` |
| GE19.4-003 | Mecanismo e visibilidade da mídia estavam em aberto | extensão adjacente necessária e proporcional | incorporado por DH-02 | v2 3.2 | Storage privado, referência estável, cleanup e signed URL server-side |
| GE19.4-004 | Residência exata do Preview estava em aberto | preservação do escopo | incorporado por DH-04 | v2 4.1 e 5.4 | Rota histórica confirmada, workspace e renderer separados |
| GE19.4-005 | Risco de criar estrutura paralela/reintroduzir E18.5 | expansão de escopo | rejeitado | v2 1.5, 2.1, 6 e 7.1 | Autoridade E19.4 deriva da API E18.4; `module-catalog` fica fora |
| GE19.4-006 | Residência das camadas não estava suficientemente explícita | preservação do escopo | incorporado | v2 2.1 e 4.1 | UI route-local; guard/casos/adapters server-only; renderer puro; workloads só config/obs |
| GE19.4-007 | Governança de banco precisava fechar migration, RLS, grants e Data API | extensão adjacente necessária e proporcional | incorporado | v2 3.1 e 3.4 | Migration nova, função de append, revokes, RLS, snippet e readiness |
| GE19.4-008 | Testes/snippets antigos cristalizam 1:1 | preservação do escopo | incorporado | v2 5.2 | Substituir controles negativos no mesmo recorte; migration antiga permanece histórica |
| P-SE-01 | Usar raiz + E18.5/module catalog | expansão de escopo | rejeitado por conflito com fonte competente | v2 1.5, 2.1 e 7.1 | `docs/lp-planejamento.md` retira E18.5 do caminho do Cenário E |
| P-SE-02 | Fixar boundaries de UI, autorização, caso de uso, provider, DB e renderer | preservação do escopo | incorporado | v2 2.1, 4.1 e 5.1–5.3 | Nenhum renderer/UI conhece `DBRow`, SDK OpenAI ou Supabase |
| P-SE-03 | Evolução incremental e segurança explícita do schema | extensão adjacente necessária e proporcional | incorporado | v2 3.1, 3.4 e 7.3 | Migration aplicada não é editada; runtime bloqueado até readiness |
| P-SE-04 | Reescrever provas negativas e contrato 1:1 no recorte | preservação do escopo | incorporado | v2 5.2 | Fixtures, testes e SQL atualizados com 1:N |
| P-SE-05 | Tentativa inválida/interrompida não deixa asset tenant-visible/reutilizável | preservação do escopo | incorporado | v2 3.2 e 7.2 | Bucket privado, path não enumerável, sem referência persistida e cleanup best-effort |

## Parecer do Gestor de Updates

Veredito original: updates aplicáveis com patches autossuficientes.

| Update | Achado | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| `supa#5` | Logs estruturados correlacionáveis por `request_id`; Unified Logs opcional | extensão adjacente necessária e proporcional | incorporado sem infraestrutura externa | v2 1.5, 2.4 e 2.5 | Eventos seguros dos dois workloads e tentativa; drain externo não é requisito |
| `supa#40` | Verificador SQL read-only versionado | extensão adjacente necessária e proporcional | incorporado | v2 3.4 e 5.2 | Inspeciona 1:N, FKs, RLS, grants, bucket, corrente e no-overwrite |
| `supa#47` | Avaliar Storage com bucket, policies, tenant, visibilidade e falhas explícitos | extensão adjacente necessária e proporcional | incorporado por DH-02 | v2 3.2 | Bucket privado, path, MIME/tamanho, service role e cleanup |
| `vercel#15` | Toolbar pode apoiar QA do Preview | preservação do escopo | opcional, não é gate | v2 4.3 | QA real não depende da Toolbar |
| `prod#6` | Copy original, útil, específica e apoiada nas fontes | preservação do escopo | incorporado | v2 1.5, 2.3 e 4.3 | Validator factual separado de julgamento editorial humano |
| `prod#14` | Humano reconhece público, oferta, CTA e próximo passo | preservação do escopo | incorporado | v2 4.3 | Critério explícito da primeira prova |
| `prod#16` | QA autenticado desktop/mobile do fluxo completo | preservação do escopo | incorporado | v2 4.2, 4.3 e 5.3 | 320 suportado; provas 360/768/1280, mídia, CTA, erros e console |
| `prod#17` | Baseline limitada de WCAG 2.2 | preservação do escopo | incorporado sem alegação integral | v2 4.2 | Teclado, foco, labels, contraste, toque e ausência de hover-only |
| `supa#8` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `supa#33` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `supa#63` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `vercel#1` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `vercel#21` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `prod#3` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `prod#12` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `prod#15` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |
| `prod#23` | Oportunidade condicional; não implementar neste recorte | expansão de escopo | não incorporado — justificado | preservar como oportunidade estratégica condicional | matriz/futuro |

## Parecer do Gestor de Automações

Veredito original: requer investigação factual. A arquitetura foi fechada na v2; três verificações factuais permanecem gates executáveis, sem nova decisão conceitual.

| ID | Achado/patch | Relação | Tratamento | Destino/localização | Evidência/estado |
|---|---|---|---|---|---|
| P-AUTO-01 | IA controlada server-side, sem agentic/tools/browsing/PTC/reasoning persistido/jobs | preservação do escopo | incorporado | v2 1.5, 2.5 e 7.1 | Categoria 2.1.3; gatilho humano explícito |
| P-AUTO-02 | Workload textual, Luna/max, Responses, strict, `store:false`, contexto atual, `tools:[]`, sem retry/fallback | extensão adjacente necessária e proporcional | incorporado | v2 2.3 e 5.1 | Uma chamada textual e timeout 120 s |
| P-AUTO-03 | Structured Output: fields required, nullable, `additionalProperties:false`, enums autoritativos e falha integral | preservação do escopo | incorporado | v2 2.2 e 2.3 | Shape não substitui factualidade; refusal/incomplete/parse/validator falham |
| P-AUTO-04 | Workload de imagem separado `gpt-image-2`, n=1, medium, WebP, sem tools/fallback | extensão adjacente necessária e proporcional | incorporado por DH-03 | v2 2.4 | União discriminada impede parâmetros textuais na API de imagem |
| P-AUTO-05 | Revalidar auth/conta/membership/entitlement/E19.3 antes do provider e da persistência; não enviar `serverContext` bruto | preservação do escopo | incorporado | v2 2.3 e 2.5 | Contexto seguro e dois gates de autorização |
| P-AUTO-06 | Telemetria E21.1 por chamada e tentativa, com versões, validade, tokens aplicáveis, latência, custo e notas | extensão adjacente necessária e proporcional | incorporado | v2 2.4, 2.5, 3.3 e 4.3 | Telemetria por chamada em 2.4; tentativa/gatilho em 2.5; metadata/snapshot em 3.3; notas humanas no PR em 4.3 |
| P-AUTO-07 | Timeouts 120 s texto, 120 s imagem, total 270 s e Function >=300 s | extensão adjacente necessária e proporcional | incorporado | v2 2.5 e 5.1 | Sem retry; duração real precisa de prova no plano Vercel |
| P-AUTO-08 | Gatilho humano; candidata válida pode persistir; aprovação humana ocorre na prova final; sem publish | preservação do escopo | incorporado | v2 2.5 e 4.3 | Shell autenticada no PR A; rubrica no PR B |
| P-AUTO-09 | Atualizar docs canônicos de automação, plataforma, base, snapshot e roadmap; sem `services` | extensão adjacente necessária e proporcional | incorporado como ABC | v2 6 | `docs/services.md` continua N/A |
| INV-A | Verificar `maxDuration >= 300` no ambiente Vercel alvo | extensão adjacente necessária e proporcional | incorporado como gate; pendente de execução, sem fallback | v2 5.1 | Se menor, evidência volta ao Analista |
| INV-B | Canário Preview `gpt-5.6-luna + max + store:false + strict` sem persistência | extensão adjacente necessária e proporcional | incorporado como gate; pendente de execução | v2 5.1 | Indisponibilidade volta ao Analista; não troca modelo/effort |
| INV-C | Canário `gpt-image-2` com configuração mínima e sem persistência | extensão adjacente necessária e proporcional | incorporado como gate; pendente de execução | v2 5.1 | Indisponibilidade volta ao Analista; não usa fallback externo |

## Passagem 1 e revisões delta

| ID | Achado | Relação | Tratamento | Destino/localização | Estado |
|---|---|---|---|---|---|
| P1-01 | Mesmo PR era incompatível com apply somente pós-merge e ausência de staging | extensão adjacente necessária e proporcional | corrigido com PR precursor A + PR B | v2 1.1, 5.4 e 7.3 | resolvido |
| P1-02 | Contrato E21.1 atual exige reasoning e não comportava imagem sem parâmetro indevido | extensão adjacente necessária e proporcional | união `responses_text | image_generation` | v2 2.4, 3.3 e 5.1 | resolvido |
| P1-03 | `brand_logo_asset` podia ser interpretado como mídia principal | preservação do escopo | exclusividade de logo e imagem principal gerada | v2 2.2 e 2.5 | resolvido |
| P1-04 | Canal `form` não possui contrato próprio no Cenário E | preservação do escopo | matriz de bindings e `UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL` antes do provider | v2 2.5, 4.2 e 5.1 | resolvido |
| P1-05 | Viewports divergiam da autoridade E18.4 | preservação do escopo | suporte 320; provas 360/768/1280; 1440 adicional | v2 4.2 e 5.3 | resolvido |
| P1-06 | Snippet read-only não pode produzir dois appends | preservação do escopo | mutação pelo caso server-side; inspeção pelo snippet | v2 3.4 e 5.2 | resolvido |
| P1-07 | Transformação assinada era otimização adiável | expansão de escopo | rejeitada e removida da entrega | v2 3.2 e 7.1 | resolvido |
| P1-R01 | Custo precisa de fonte/data ou indisponibilidade explícita | extensão adjacente necessária e proporcional | `estimatedCost=null`, `costStatus=unavailable` | v2 3.3 | resolvido |
| P1-R02 | Fixar residência e contrato do gatilho | preservação do escopo | Server Action dedicada, input mínimo e output discriminado | v2 2.5 e 5.1 | resolvido |
| D1-01 | PR A não tinha entrypoint alcançável para os dois appends pós-apply | extensão adjacente necessária e proporcional | shell autenticada/gatilho no PR A, renderer no PR B | v2 1.1, 2.5, 5.1–5.4 e 7.3 | resolvido em `b036a6f` |

Veredito final da Passagem 1: `aprovado para merge do plano-base v2`, sem delta residual e sem reabrir 1A–4A.

## Resumo de transporte para a Passagem 2

| Classe | Conteúdo transportado |
|---|---|
| Preservação do escopo | E19.3 v3, uma chamada textual, Structured Output, factualidade separada, identidade estável, append-only, preview privado, rubrica humana e gates binários |
| Extensão adjacente necessária e proporcional | E21.1 discriminado, Storage privado, migration 1:N, função de append, readiness, logs, canários, verificador SQL e sequenciamento PR A/PR B |
| Expansão de escopo | E18.5/module catalog, entidade concorrente, transformação assinada, formulário, publicação, editor, DAM, analytics, agentes, filas e infraestrutura sem caso real; todos rejeitados ou não incorporados |
| Gates pendentes de execução | Duração Vercel, canários dos dois modelos, apply oficial, dois appends hospedados, verificador read-only e primeira prova real |
