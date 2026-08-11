# Matriz de consolidação — E19.4

- Plano v1 congelado: blob `c4f062286e8d2f91d88f4540c89e31f5937c6f37`, incorporado à `main` por `f3cce5f85295ab5db7d36a64bd50eed632fdb441`.
- Plano v2: checkpoint `63943a7f65376d84f341840f6111257a80e699b2`, corrigido até `e8a316322b850aeeafbf4ab5071df9a4bd4b4d72` antes desta auditoria.
- Passagem 1 independente: aprovada para merge do plano-base v2 em 11/08/2026.
- Esta matriz foi criada somente após a aprovação da Passagem 1 e deve permanecer no PR até a entrega completa.

## Parecer estrutural

| Origem | Achado | Classificação original | Relação com o escopo | Tratamento | Destino | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor Estrutural | GE-E19.4-01 — fluxo adere à API E19.3, gates e preview privado | aprovado | preservação do escopo | incorporado literalmente | N/A | 1.2–1.5; 2.1 | API pública E19.3 e Base Técnica |
| Gestor Estrutural | GE-E19.4-02 — persistência E19.4 inexiste | condicionante | preservação do escopo | incorporado literalmente | N/A | 2.3; 3.2 | migration e agregado 1:1 definidos |
| Gestor Estrutural | GE-E19.4-03 — `content_artifacts` é residência incompatível | rejeição de reuso | preservação do escopo | incorporado literalmente | N/A | 2.3; 4.1 | lifecycle/ACL incompatíveis; reuso excluído |
| Gestor Estrutural | GE-E19.4-04 — agregado 1:1 separado é a residência mínima | condicionante | preservação do escopo | incorporado literalmente | N/A | 2.1; 2.3; 3.2 | residência, FKs e grants fixados |
| Gestor Estrutural | GE-E19.4-05 — boundaries de geração, provider, renderer e UI | condicionante | preservação do escopo | incorporado literalmente | N/A | 2.1 | residências e dependências normativas explícitas |
| Gestor Estrutural | GE-E19.4-06 — workload novo sem capability inventada | condicionante | extensão adjacente necessária e proporcional | incorporado literalmente | N/A | 1.3–1.4; 3.1 | registry OpenAI estendido; comercial preservado |
| Gestor Estrutural | GE-E19.4-07 — runtime precisa falhar fechado antes do apply | condicionante | extensão adjacente necessária e proporcional | incorporado com ajuste objetivo | N/A | 3.2–3.4 | expand seguro aprovado na Passagem 1 |

### Crosswalk C-01–C-07

| Origem | Condicionante | Relação com o escopo | Tratamento | Localização na v2 | Evidência |
|---|---|---|---|---|---|
| Gestor Estrutural | C-01 — agregado 1:1 e insert atômico | preservação do escopo | incorporado literalmente | 2.3; 3.2 | PK, FKs, JSON e write-once definidos |
| Gestor Estrutural | C-02 — RLS, revokes, grants e ausência de view/RPC | preservação do escopo | incorporado literalmente | 2.3; 3.2 | sem policies; somente `SELECT, INSERT` service_role |
| Gestor Estrutural | C-03 — sequenciamento pós-apply | extensão adjacente necessária e proporcional | incorporado com ajuste objetivo | 3.2–3.4 | probe autovalidante substitui habilitação por verificador não observável; SQL segue gate pós-apply |
| Gestor Estrutural | C-04 — boundaries do LP Builder, provider, renderer e UI | preservação do escopo | incorporado literalmente | 2.1 | action/UI sem acesso direto a Supabase/OpenAI; adapters e renderer em seus domínios |
| Gestor Estrutural | C-05 — acesso SSR, compilação E19.3 e denies antes do provider | preservação do escopo | incorporado literalmente | 1.3; 2.1; 3.1 | `accountId` tenant-aware, compilador canônico e falha antes da chamada |
| Gestor Estrutural | C-06 — workload específico e boundary comum puro | extensão adjacente necessária e proporcional | incorporado literalmente | 1.4; 2.1; 3.1 | transporte no LP Builder e config pela API pública comum |
| Gestor Estrutural | C-07 — ausência prévia, conflito, snapshot e casos negativos | preservação do escopo | incorporado literalmente | 1.4; 2.3; 3.1–3.2 | sem overwrite, sem retry automático e testes enumerados |

## Parecer de Updates

| Origem | Update | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor de Updates | `supa#5` | complementar/condicional | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: incidente que exija correlação além dos logs; proibido drain ou dados sensíveis |
| Gestor de Updates | `supa#40` | complementar/atual | extensão adjacente necessária e proporcional | incorporado literalmente | usar como validação ou trava | 3.2 | verificador SQL read-only pós-apply |
| Gestor de Updates | `supa#63` | complementar/condicional | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: policies/matriz multi-identidade complexas; sem pgtap em produção |
| Gestor de Updates | `vercel#1` | sobreposto/futuro | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: fallback multi-provider ou lacuna mensurável; Responses API permanece padrão |
| Gestor de Updates | `vercel#3` | complementar/condicional | expansão de escopo | não aplicável | não aplicável ao recorte | N/A | rota privada sem caso de cache; cache compartilhado rejeitado |
| Gestor de Updates | `vercel#11` | complementar/futuro | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: tracking público aprovado e pergunta de negócio |
| Gestor de Updates | `vercel#15` | complementar/atual | preservação do escopo | incorporado literalmente | usar como validação ou trava | 2.4; 3.3 | ferramenta apenas opcional e já disponível ao revisor |
| Gestor de Updates | `vercel#26` | complementar/condicional | expansão de escopo | não aplicável | não aplicável ao recorte | N/A | nenhuma resposta cacheável ou incidente CDN |
| Gestor de Updates | `github#8` | sobreposto/condicional | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: adoção real no VS Code e incidente visual recorrente |
| Gestor de Updates | `prod#3` | complementar/futuro | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: LP pública com tráfego e hipótese mensurável |
| Gestor de Updates | `prod#6` | complementar/atual | preservação do escopo | incorporado literalmente | usar como validação ou trava | 2.4 | referência editorial separada do validator |
| Gestor de Updates | `prod#12` | complementar/futuro | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: operação multi-contas com evidência de erro |
| Gestor de Updates | `prod#14` | complementar/atual | preservação do escopo | incorporado literalmente | usar como validação ou trava | 3.3 | reconhecimento de draft, não publicação e próximo passo |
| Gestor de Updates | `prod#15` | complementar/futuro | expansão de escopo | não aplicado | oportunidade estratégica condicional | N/A — preservada na matriz | Gatilho: pergunta, ação, consentimento, retenção, integração e responsável definidos |
| Gestor de Updates | `prod#16` | complementar/atual | preservação do escopo | incorporado literalmente | usar como validação ou trava | 3.3 | viewports e interações do Preview |
| Gestor de Updates | `prod#17` | complementar/atual | preservação do escopo | incorporado literalmente | usar como validação ou trava | 2.4; 3.3 | baseline WCAG 2.2 sem alegação integral |

## Parecer de Automações

| Origem | Decisão | Classificação original | Relação com o escopo | Tratamento | Destino | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor de Automações | AUTO-E19.4.3-01 — IA controlada, sem agentic | aplicável | preservação do escopo | incorporado com ajuste objetivo | automação E19.4.3 | 1.4; 3.1 | ação foi normalizada para invocação aceita devido a concorrência/replay reconhecidos |
| Gestor de Automações | AUTO-E19.4.3-02 — workload `landing_page_draft_generation`, `gpt-5.4-mini`, `none` | aplicável | extensão adjacente necessária e proporcional | incorporado literalmente | OpenAI workloads/config | 1.4; 3.1 | registry e modelo oficial |
| Gestor de Automações | AUTO-E19.4.3-03 — Structured Output estrito derivado da E19.3 | aplicável | preservação do escopo | incorporado literalmente | adapter/validator | 2.1–2.2; 3.1 | contratos E18.5/E19.3 |
| Gestor de Automações | AUTO-E19.4.3-04 — falha integral, retry humano e telemetria segura | aplicável | preservação do escopo | incorporado literalmente | automação/observabilidade | 1.4; 3.1 | Responses API e boundary comum |
| Gestor de Automações | AUTO-E19.4.3-05 — capability E9.7 somente quando admitida | aplicável condicional | preservação do escopo | incorporado literalmente | consumidor E19.4 | 1.3; 2.1; 3.1 | registry comercial vazio e sem capability local |

### Crosswalk AUTO-E19.4.3-P01–P05

| Origem | Patch | Relação com o escopo | Tratamento | Localização na v2 | Evidência |
|---|---|---|---|---|---|
| Gestor de Automações | P01 — chamada controlada e ausência de agentic/async/retry | preservação do escopo | incorporado com ajuste objetivo | 1.4; 3.1 | limite demonstrável é uma chamada por invocação aceita, não custo exactly-once |
| Gestor de Automações | P02 — schema estrito e reconstrução determinística | preservação do escopo | incorporado literalmente | 2.1–2.2; 3.1 | módulos/fields exatos e testes negativos |
| Gestor de Automações | P03 — workload, modelo, esforço, store e budget | extensão adjacente necessária e proporcional | incorporado literalmente | 1.4; 3.1 | config canônica sem env nova |
| Gestor de Automações | P04 — gates, falhas e observabilidade | preservação do escopo | incorporado literalmente | 2.1; 3.1 | falha integral e telemetria sanitizada |
| Gestor de Automações | P05 — destinos documentais | preservação do escopo | incorporado literalmente | 3.4 | `docs/services.md` permanece N/A |

## Passagem 1 e revisões delta

| Origem | Achado | Classificação | Tratamento | Localização/evidência | Estado |
|---|---|---|---|---|---|
| Analista — Passagem 1 | P1-01 — shapes persistidos não estavam fechados | material | corrigido | 2.3; commit `3a4cb29` | resolvido |
| Analista — Passagem 1 | P1-02 — rollout não possuía readiness causal executável | material | corrigido | 3.2–3.4; commits `3a4cb29` e `e8a3163` | resolvido |
| Analista — Passagem 1 | P1-03 — garantia de custo exactly-once era mais forte que o mecanismo | material localizado | corrigido | 1.4; 3.1; commit `3a4cb29` | resolvido |

Veredito final da Passagem 1: `aprovado para merge do plano-base v2`.
