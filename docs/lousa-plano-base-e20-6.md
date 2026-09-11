# Plano-base V2 — E20.6 Auditoria, liberação e revisão factual de taxons

## 1. Estado, fonte e referências imutáveis

- Estado: V2 técnica candidata; aguarda o gate do Analista antes do checkpoint `plan-v2-approved` e da implementação.
- Classificação de execução: Complexa.
- Supervisão: Autônomo.
- Caso macro: `E20`.
- Recorte: `E20.6 — Auditoria, liberação e revisão factual de taxons`.
- Plano único do Debate 12; não cria E20.8 ou E20.9.
- Fonte funcional: `Debate 12 — Evolução da revisão factual e UX administrativa da E20 — LP Factory 10`, seção 4.1–4.10.
- Documento de origem: `https://docs.google.com/document/d/1XxMtfz_W0pTEWKiwQ00JIzrjQMC64fIAT40bIJpGZ5w`.
- Revisão lida na materialização: `ANLCKQn806i6D9Y2sv4h5iOwxGil0qnsfOi7-Wc0ppTG_tZS2cRSdUBaRE_6qLEk_CNnBgwwKufBKoZXO8votdu5ZTCE4PI3aP240qJVvl0`.
- V1 congelada: commit `ffe9585f60f3b41272a1c4a14a9e8ddc756078cd`, blob `9dc5c2a613bae9a6e94f6446c8f23c60ced790e6`, neste mesmo path.
- Base do PR e snapshot do roadmap: `origin/main@bd32c5759ec1c7c8d5d3f5bbdd35e2f524a8d2f1`, blob `5f919c8d1b11c07089d00b13f1675d786400596f` de `docs/roadmap.md`.
- PR único: `#923`, draft, base `main`, head `codex-app/e20-6-debate-12`.
- Plano conceitual: N/A; a fonte funcional aprovada é o Debate 12.

## 2. Contrato funcional preservado

### 2.1 Problema e resultado

- O contrato vigente acopla pesquisa, revisão factual e preparação, embora a pesquisa E20.5 tenha se tornado opcional.
- Todo novo taxon deve ser comparado à cobertura herdada e permanecer indisponível até decisão humana explícita.
- O `platform_admin` pode liberar a cobertura herdada sem IA, solicitar avaliação controlada, pesquisar uma dúvida focal, decidir candidatos e revisar posteriormente um taxon ativo.
- Mudança de field completa o lifecycle versionado da E20.2 antes da ativação ou atualização da versão factual válida.
- Taxon ativo mantém atividade e última versão válida durante revisão voluntária.

### 2.2 Comportamento

- Novo taxon: criar indisponível → abrir sessão de liberação → resolver herança → liberar sem IA ou avaliar → decidir candidatos → fechar sem mudança ou aguardar publicação E20.2 → ativar somente quando autorizado.
- Avaliação completa: usar E20.5 válida sem Web Search; na ausência legítima, usar Web Search controlada.
- Pesquisa focal: usar Web Search sob pedido humano explícito e tratar E20.5 válida apenas como contexto complementar.
- Taxon ativo: abrir sessão de revisão → preservar estado vigente → incluir candidato manual, avaliar ou pesquisar → fechar sem mudança ou aguardar nova versão publicada.
- Catálogo: adicionar, alterar ou inativar fields → mostrar impacto → obter decisão humana → publicar versão imutável → reconciliar a identidade implantada.

## 3. Limites e escopo negativo

- Não criar, alterar, publicar ou inativar field por decisão exclusiva da IA.
- Não integrar automaticamente Base de Comunicação, Oferta concreta ou tarefa real.
- Não implementar consumidor greenfield nem reativar a E20.7.
- Não duplicar configuração, lifecycle, telemetria, pricing ou custos da E21.
- Não apagar versões, dados, decisões ou pesquisas históricas.
- Não tornar Web Search, E20.5, IA ou justificativa textual obrigatórias para a liberação humana sem mudança.
- Não criar nova rota, novo papel, workload, service, job, fila, agente, engine, RAG, crawler, memória conversacional ou infraestrutura independente.
- Não adotar AI Gateway, Agents SDK, background, conversation, `previous_response_id`, retry automático, provider alternativo ou nova credencial.
- E20.7 permanece sem consumidor; E19, conta, entitlement e geração não participam do predicado desta entrega.

## 4. Arquitetura e autoridades

### 4.1 Boundaries

- `lib/conversion-content/landing-page/taxon-preparation/` permanece o domínio puro da cobertura, sessão factual, seleção de estratégia, output e transições.
- Criar `factual-review.ts` para a máquina de estados pura e ampliar `contracts.ts` com cobertura herdada, sessão, fonte E20.5, estratégia `e20_5 | web_search_fallback | web_search_focal`, candidatos, decisão de camada, output v2 e fontes autenticadas.
- Reutilizar `resolveLandingPageInputCatalogFromRegistry`, a cadeia canônica e `classifyLandingPageInputCatalogTransitionForTaxon`; não duplicar herança, equivalência, materialidade ou versão atual.
- `lib/admin/adapters/adminTaxonFactualReviewAdapter.ts` será a única residência server-only das leituras e mutações do lifecycle factual; usar Core injetável apenas quando necessário aos casos executáveis.
- `lib/conversion-content/adapters/inputCatalogEvaluationSourceAdapter.ts` classificará fonte administrativa válida, ausência legítima, seleção inválida, falha de banco e falha de artefato, reutilizando `taxonChainAdapter.ts`.
- `selectedEndCustomerResearchAdapter.ts` continuará limitado à preparação operacional que realmente exige pesquisa ativa; não absorverá auditoria administrativa.
- `inputCatalogEvaluationContextAdapter.ts` reconstruirá a identidade canônica pela estratégia autorizada e aceitará pesquisa ausente apenas no fallback Web Search.
- `inputCatalogEvaluationOpenAiAdapter.ts` continuará responsável pelo mesmo workload e incorporará política Web Search, validação de fontes e output v2; `openAiResponsesAdapter.ts` permanecerá transporte compartilhado neutro.
- `adminInputCatalogLifecycleAdapter.ts` continuará proprietário do draft/publicação E20.2 e consumirá apenas decisões autenticadas vinculadas a sessão, versão, revisão e fingerprints.

### 4.2 Autoridades

- `business_taxons.is_active` é o marcador operacional do taxon.
- `business_taxons.reviewed_input_catalog_version` é a última versão factual válida; estado candidato nunca o substitui.
- O registry E20.2 implantado e `CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION` permanecem autoridade das versões publicadas e da versão atual.
- `landing_page_input_catalog_drafts` permanece o singleton mutável, administrativo e não operacional do próximo draft.
- `business_taxon_factual_reviews` é a autoridade do estado do lifecycle factual e `business_taxon_factual_review_events` é a autoridade append-only das avaliações e decisões humanas. `landing_page_input_catalog_drafts.taxon_review_evidence` deixa de aceitar escrita independente e passa a ser somente projeção derivada dessas decisões para o draft exato; não existe segunda autoridade factual.
- As novas sessões/eventos não substituem o registry nem tornam candidato um field.
- Identidade, cadeia, versão, fonte, validade, impacto, autorização, persistência, publicação e ativação são determinísticos.
- A IA é consultiva e limitada a significado, cobertura, refinamento e possíveis gaps.

## 5. Persistência, transações e segurança de banco

### 5.1 Alteração de `business_taxons`

- Migration forward-only altera o default de `is_active` para `false`.
- A criação administrativa sempre envia `is_active=false`; UI e action deixam de aceitar criação ativa.
- O editor genérico não pode executar `false → true`; a inativação explícita de taxon ativo permanece disponível.
- Seleção E20.5 pode ser salva de forma dormente em taxon inativo e continua sem liberá-lo.

### 5.2 `business_taxon_factual_reviews`

- Criar tabela service-only com `id uuid`, `taxon_id uuid`, `kind release | revision`, `status open | awaiting_catalog_publication | closed_without_change | closed_published`, `baseline_is_active`, `baseline_reviewed_input_catalog_version`, `target_input_catalog_version`, `draft_revision`, `draft_content_fingerprint`, `draft_context_fingerprint`, `context_fingerprint`, `revision bigint`, `opened_operation_id uuid`, `opened_by`, `closed_by`, `opened_at`, `closed_at`, `created_at` e `updated_at`.
- `kind` e `status` usam checks fechados; versões, revisão e `draft_revision` são positivas quando presentes; fingerprints são SHA-256 hexadecimais; `baseline_is_active`, versão baseline, status e pares de fechamento são coerentes. A referência completa ao draft é toda nula em `open | closed_without_change` e toda presente em `awaiting_catalog_publication | closed_published`.
- FK de taxon usa `ON UPDATE CASCADE ON DELETE RESTRICT`; atores referenciam `auth.users` com `ON UPDATE CASCADE ON DELETE RESTRICT`.
- `opened_operation_id` é único e torna a abertura idempotente: repetição semanticamente idêntica retorna a sessão existente; reutilização com outro taxon/kind/contexto falha fechada.
- Índice único parcial garante no máximo uma sessão não encerrada por taxon.

### 5.3 `business_taxon_factual_review_events`

- Criar tabela append-only com `id uuid`, `review_id uuid`, `operation_id uuid`, sequência monotônica por sessão, `event_kind`, `source_strategy`, `decision_kind`, `payload_json`, `context_fingerprint`, `content_fingerprint`, `actor_user_id` e `created_at`.
- `event_kind` aceita somente `opened | evaluation_requested | evaluation_completed | evaluation_inconclusive | decision_recorded | draft_linked | publication_authorized | draft_invalidated | closed_without_change | reconciled_published`; `source_strategy` aceita somente `e20_5 | web_search_fallback | web_search_focal`; `decision_kind` aceita somente `no_change | catalog_change`.
- `source_strategy` é obrigatório apenas em eventos de avaliação; `decision_kind` é obrigatório apenas em `decision_recorded | publication_authorized`; fingerprints SHA-256 são exigidos nos eventos que registram output, decisão, vínculo ou reconciliação e proibidos onde não há conteúdo associado. `payload_json` é `jsonb not null default '{}'::jsonb` e sempre objeto.
- `review_id` referencia a sessão com `ON UPDATE CASCADE ON DELETE RESTRICT`; `actor_user_id` referencia `auth.users` com `ON UPDATE CASCADE ON DELETE RESTRICT`; `sequence_number` é positivo e `created_at` é não nulo com default `now()`.
- `payload_json` aceita somente objeto e preserva output estruturado validado, referências Web necessárias, candidatos aceitos/rejeitados, candidato próprio, camada e metadados de decisão; não armazena prompt, pesquisa integral, conteúdo web, secret, Base, Oferta, tarefa, conta ou PII.
- Trigger dedicado rejeita `UPDATE` e `DELETE`; unicidade `(review_id, sequence_number)` preserva ordenação, e `(review_id, operation_id)` torna cada comando idempotente. Retry com o mesmo `operation_id` e mesmo fingerprint retorna o evento; divergência falha fechada.
- As duas tabelas não participam do Trigger Hub: a residência de eventos já é a trilha factual competente, e triggers dedicados mantêm `updated_at` da sessão e a imutabilidade dos eventos sem duplicar payload no hub genérico.

### 5.4 RPCs e atomicidade

- Criar RPCs versionadas para abrir sessão, anexar evento/decisão, fechar sem mudança, autorizar publicação e reconciliar publicação implantada.
- Todas usam `SECURITY INVOKER`, `SET search_path = public, pg_catalog`, nomes schema-qualified, locks das linhas participantes, ator/estado esperados e token de revisão otimista.
- Fechamento sem mudança de uma liberação grava a versão atual revisada e ativa o taxon na mesma transação; fechamento de revisão preserva atividade e atualiza o marcador apenas quando a decisão autorizar a versão atual.
- Autorização com mudança vincula sessão, `target_version`, revisão do draft, fingerprint do conteúdo e fingerprint do contexto; não ativa nem altera o marcador.
- Registrar decisão com mudança anexa primeiro o evento autoritativo e atualiza, na mesma transação, `taxon_review_evidence` como mapa derivado por `taxon_id`, contendo `review_id`, `decision_event_id`, `draft_revision`, `content_fingerprint` e `context_fingerprint`. Nenhum adapter pode gravar essa projeção fora da RPC.
- Qualquer edição do draft trava o singleton e todas as sessões vinculadas em ordem estável, limpa a projeção inteira, registra `draft_invalidated` e retorna todas as sessões afetadas para `open`; nova autorização exige decisões válidas para a nova revisão e os novos fingerprints.
- A preparação da publicação só passa quando a projeção e os eventos autoritativos cobrem todos os taxons afetados pelo draft exato; ausência, duplicidade ou decisão stale impede handoff parcial.
- Reconciliação pós-deploy trava o singleton e todas as sessões cobertas em ordem estável, comprova registry/versão/revisão/fingerprints, atualiza todos os marcadores e ativa somente sessões `release` autorizadas, encerra todas as sessões e exclui o singleton na mesma transação. Não existe reconciliação parcial por taxon.
- Staleness, conflito, publicação ausente ou qualquer falha produzem rollback integral e preservam estado anterior.

### 5.5 ACL e inspeção

- Habilitar RLS nas duas tabelas, manter zero policies públicas e revogar todos os grants de `public`, `anon`, `authenticated` e `ai_readonly` quando existir.
- `service_role` recebe somente privilégios necessários; eventos não recebem `UPDATE`, `DELETE` ou `TRUNCATE`.
- Revogar `EXECUTE` público das RPCs e conceder somente a `service_role`.
- Criar teste SQL transacional e snippet read-only cobrindo objetos, constraints, índices, RLS, policies, ACL, triggers, RPCs, append-only, stale token, rollback e impossibilidade de ativação antecipada.
- Os testes cobrem ainda vocabulários fechados, nulabilidade, FKs, idempotência, projeção derivada, múltiplos taxons no mesmo draft, invalidação global e reconciliação atômica sem publicação/ativação parcial.
- Após apply, inspecionar Security Controls apenas para objetos novos/alterados. INFO de RLS sem policy é aceitável quando consistente com a residência service-only; alerta incompatível bloqueia encerramento.
- Não criar view. Se evidência durante implementação provar necessidade indispensável, voltar ao planejamento; qualquer view autorizada exigiria `security_invoker=true` e residência no Schema.

## 6. Execução por subseção

### 6.1 `20.6.3 — Liberação determinística e estado de revisão`

- Implementar criação sempre inativa e retirar ativação direta da UI, action e adapter genéricos.
- Resolver a cobertura herdada do novo taxon nos quatro planos operacionais da versão E20.2 atual.
- Abrir sessão `release` para taxon inativo ou `revision` para taxon ativo, preservando baseline e contexto.
- Todo taxon novo nasce indisponível. A aplicação resolve deterministicamente a cobertura herdada e mantém um caminho de liberação humana sem OpenAI e sem justificativa textual obrigatória. Abrir revisão de taxon ativo não altera sua disponibilidade nem sua última versão válida; ausência, falha ou abandono da revisão preserva integralmente o estado anterior.
- A confirmação humana de cobertura herdada fecha a sessão sem mudança e, em liberação, grava versão revisada e atividade atomicamente.
- A revisão ativa não limpa `reviewed_input_catalog_version`; o caminho antigo de `reopen` destrutivo é removido.
- Critérios: criação/ativação genéricas impossíveis; zero chamada OpenAI no caminho sem IA; sessões concorrentes rejeitadas; falha preserva estado; taxon ativo continua consumível na última versão válida.

### 6.2 `20.6.4 — Decisão humana e lifecycle E20.2`

- Separar recomendação, decisão, autorização, publicação e ativação em estados e ações diferentes.
- O humano pode rejeitar todos, aceitar alguns ou todos os candidatos e incluir candidato próprio; cada candidato aceito exige camada explícita `universal | segment | niche | ultra_niche` e vínculo ao contexto autenticado.
- Recomendação de IA nunca cria, altera, publica ou inativa field. O `platform_admin` pode rejeitar todos, aceitar alguns ou todos os candidatos e incluir candidato próprio, sempre escolhendo explicitamente a camada. A mutação publica primeiro uma versão imutável E20.2, valida as transições e somente depois revalida autorização, taxon, pesquisa, versão, fingerprints e decisão autenticada para ativar. Qualquer falha preserva a versão e a disponibilidade anteriores.
- Decisão sem mudança fecha a sessão; decisão com mudança cria ou vincula o draft E20.2 e move a sessão para `awaiting_catalog_publication`.
- A decisão autenticada persiste candidatos aceitos/rejeitados, candidato próprio e camada, mas não produz definição executável de field.
- Critérios: seleção zero/parcial/total, candidato próprio, camada, autorização única, conflito/stale, publicação antes de ativação e rollback integral.

### 6.3 `20.6.5 — Provider e fontes`

#### Seleção de fonte

- A seleção de fonte é determinística e distingue: (a) cobertura herdada liberada sem IA: nenhuma chamada; (b) E20.5 selecionada e integralmente válida: uma requisição Responses sem Web Search; (c) ausência legítima de E20.5: uma requisição Responses com Web Search fallback obrigatório e no máximo duas tool calls; (d) pesquisa focal solicitada pelo humano: uma requisição Responses com Web Search obrigatório e no máximo uma tool call, usando E20.5 válida apenas como contexto complementar; (e) pesquisa E20.5 inválida, stale ou com falha de leitura: falha tipada ou resultado inconclusivo, sem converter defeito técnico em ausência legítima.
- A falha de qualquer modo nunca confirma cobertura, não altera nem fecha sessão e não bloqueia o caminho humano sem IA.
- A leitura administrativa usa entrada própria em `inputCatalogEvaluationSourceAdapter.ts`: carrega o taxon e sua cadeia no boundary server-only sem filtrar `is_active`, então reutiliza apenas a resolução pura de cadeia e valida slug, versão, path, metadata e conteúdo. `selectedEndCustomerResearchAdapter.ts`, a leitura operacional de `taxonChainAdapter.ts` e todos os consumidores E20.5/E20.6/E20.7 permanecem inalterados e continuam retornando `TAXON_INACTIVE` para taxon inativo.

#### Contrato do provider

- Preservar `taxon_input_catalog_sufficiency_evaluation` e resolver `model + reasoning.effort` exclusivamente por E21.1/E21.2, sem configuração paralela.
- Cada execução humana produz no máximo uma requisição foreground à Responses API, com deadline total de 45 segundos, `store:false`, sem conversation, `previous_response_id`, background ou retry automático.
- Com Web Search, usar somente `web_search` com `external_web_access:true`, `search_context_size:"medium"`, `tool_choice:"required"`, `include:["web_search_call.action.sources"]` e `max_tool_calls` igual a 2 no fallback ou 1 na pesquisa focal. Não enviar `return_token_budget`, ausente do schema atual de `WebSearchTool`; o orçamento de retorno permanece o default do provider.
- O modo sem Web Search envia `tools:[]`.
- A saída usa Structured Outputs com JSON Schema estrito, `max_output_tokens:6000` e contrato versionado v2.
- O preflight reserva busca, reasoning e saída, respeita o limite efetivo de 128k dos modos Web Search e falha antes do transporte quando o orçamento não couber; truncamento silencioso é proibido.

#### Output, fontes e guardrails

- O output v2 identifica modo, estratégia/estado da fonte, cobertura, refinamento, gaps candidatos e inconclusão.
- Toda afirmação web material referencia fonte retornada pelo provider. URLs são HTTPS, normalizadas, deduplicadas e derivadas exclusivamente de `web_search_call.action.sources`; URL inventada no JSON ou texto invalida o resultado.
- Recusa, resposta incompleta, schema/semântica inválidos, busca obrigatória ausente, excesso de chamadas ou fonte material não mapeada produzem falha tipada/inconclusão.
- Pesquisa, catálogo, hipótese, feedback e conteúdo web são dados não confiáveis e não alteram instruções, autorização, lifecycle ou ferramentas permitidas.
- Critérios: matriz completa de fontes, serialização exata da request sem propriedade desconhecida, preservação do `TAXON_INACTIVE` operacional com leitura administrativa do mesmo taxon inativo, budget pré-transporte, overcall, fontes ausentes/inventadas, injection, refusal, incomplete, JSON inválido, timeout e nenhuma segunda request.

### 6.4 `20.6.6 — Evolução e transições`

- Criar `lib/conversion-content/landing-page/input-catalog/draft-operations.ts` com operações puras tipadas `add | change | retire` sobre o draft singleton.
- Reutilizar schema, continuidade, `createdInVersion`, `retiredInVersion`, resolução dos quatro planos e cálculo de impacto vigentes.
- Inclusão, alteração e inativação de field exigem contrato completo do field, camada explícita, impacto e autorização humana; candidato é somente insumo.
- A UI não manipula regras do registry nem grava candidato como field.
- Fluxo: editar draft → validar conteúdo/impacto → vincular decisões humanas necessárias → preparar handoff → materializar registry no mesmo PR → review/merge/deploy futuros → reconciliar identidade exata.
- Field publicado só muda por nova versão imutável; inativação usa `retiredInVersion` e preserva histórico.
- Critérios: add/change/retire em todas as camadas, impacto por taxon/plano, compatibilidade, revisão necessária, histórico e nenhuma alteração operacional pré-deploy.

### 6.5 `20.6.7 — Experiência administrativa`

- Não criar rota nova. `/admin/taxonomia` mostra separadamente estado operacional e estado da sessão factual.
- `/admin/taxonomia/[taxonId]` concentra cobertura herdada, abertura/fechamento, pesquisa opcional, avaliação/pesquisa focal, candidatos, camada e decisão.
- Substituir `AdminTaxonInputCatalogReview.tsx` pelo lifecycle factual e evoluir `AdminTaxonInputCatalogEvaluation.tsx` para a matriz de fonte/output v2.
- `AdminTaxonResearchSelectionForm.tsx` aceita seleção dormente em taxon inativo; `AdminTaxonCreateForm.tsx` remove “Criar como ativo”; `AdminTaxonManageForm.tsx` remove ativação direta e preserva inativação.
- `/admin/estrutura-lp?view=entradas` continua proprietário do draft/publicação e recebe editor estruturado das operações de field e impacto por taxon/camada.
- Remover `recordInputCatalogReviewAction`, `reopenInputCatalogReviewAction`, respectivos adapters, `executeLegacyInputCatalogReviewRecordCore`, `buildInputCatalogReviewHandoff`, exports/testes sem consumidor e o fallback `ROLLOUT_GATE_OFF → handoff Codex`.
- Gate-off ou falha da IA exibe indisponibilidade sem bloquear o caminho humano determinístico.
- Em cada estado, apresentar em linguagem de produto: estado atual, próximo passo humano permitido, consequência da ação e motivo de indisponibilidade quando bloqueada. Recomendação da IA, decisão humana, publicação e ativação permanecem visual e semanticamente distintas.
- Aplicar WCAG 2.2 proporcional: labels/instruções associados, erros vinculados ao controle, mensagens anunciáveis, ordem e foco previsíveis, contraste, alvos de toque adequados e nenhuma ação exclusiva por hover. Reutilizar `FormField`, `FeedbackMessage`, controles nativos e tokens canônicos; não declarar conformidade integral sem auditoria própria.
- Critérios: reconhecimento do próximo passo em todos os estados, desktop/mobile, teclado, leitor de tela, foco, toque, mensagens, contraste e ausência de overflow.

## 7. Segurança, observabilidade, custo e manutenção

- Toda ação reautoriza `platform_admin`, deriva ator no servidor, usa DTO mínimo e revalida taxon, cadeia, fonte, versão, estado, revisão e fingerprints antes da mutação.
- O provider é server-only, reutiliza somente `OPENAI_API_KEY` e envia `safety_identifier` pseudônimo válido.
- Payload OpenAI exclui Base, Oferta concreta, tarefa, conta e PII.
- A telemetria E21 registra workload, ambiente, origem/revisão de configuração, modelo, effort, versão de prompt/schema, estratégia de fonte, resultado/categoria segura de falha, latência, usage, contagem Web Search e quantidade de fontes.
- Prompt, resposta integral, pesquisa, fatos, conteúdo/URLs de fontes, PII e secrets permanecem fora dos eventos comuns e logs.
- O custo usa o ledger compartilhado E21; não duplicar pricing nem tracking. O custo máximo de ferramenta resulta do teto de uma ou duas chamadas, mas não constitui orçamento independente nem garantia de fonte útil.
- Timeout, indisponibilidade, recusa ou resultado inválido preservam todo estado válido.
- Preservar `next` e `eslint-config-next` em `16.3.3`; nenhuma dependência precisa mudar neste plano.
- Preservar `OPENAI_API_KEY` como Secret e gates não sensíveis como Config; não criar chave específica, copiar valores ou expô-los em evidência.
- Checks/runs/statuses não são prova durável única; commits, PR e documentos canônicos preservam o fechamento.

## 8. Rollout e validação operacional

- Implementar migration e código sem aplicação remota pré-merge; usar `supabase migration list --linked` e `supabase db push --linked --dry-run` quando o gate pedir confirmação remota.
- O merge futuro na `main` dispara o apply canônico. A reconciliação factual e qualquer ativação pós-publicação dependem de migration/registry realmente implantados.
- Não alterar modelo/effort ou ativar configuração por este plano; a combinação vigente `gpt-5.6-terra + low` permanece sob E21 e deve ser provada com casos representativos antes do rollout hospedado.
- Preview usa o projeto hospedado vigente conforme `docs/platform-config.md`; nenhuma ausência de arquivo local ignorado prova indisponibilidade.
- Executar `npm ci` uma vez no lote contínuo e `npm run check` antes de cada gate de implementação, além dos validators focais.
- Executar testes SQL transacionais local/isolado quando disponível; pós-apply, rodar snippet read-only e Security Controls.
- QA hospedado cobre criação inativa, liberação sem IA, E20.5 válida, fallback Web Search, pesquisa focal, falhas de fonte/provider, contexto stale, seleção de candidatos, candidato próprio, camada, publicação antes da ativação e revisão de taxon ativo preservando a última versão.
- QA visual cobre desktop e mobile, teclado, leitor de tela, foco após erro/transição, labels, mensagens, toque, contraste, ausência de hover exclusivo e ausência de overflow; combinar inspeção automática e manual.
- Nenhuma prova depende de E19, E20.7, conta, entitlement ou consumidor greenfield.

## 9. Critérios de aceite rastreáveis

- Nenhum novo taxon entra em uso sem decisão humana explícita; criação e edição genérica não o ativam.
- Cobertura herdada pode ser aprovada sem OpenAI, Web Search, E20.5 ou justificativa textual.
- Avaliação examina taxon inativo sem torná-lo operacional; seleção E20.5 pode permanecer dormente.
- Fonte distingue E20.5 válida, ausência legítima, seleção inválida, falha de banco/arquivo, fallback e pesquisa focal.
- Output validado distingue cobertura, refinamento, gaps e inconclusão; recomendação permanece separada da decisão.
- Humano aceita zero/alguns/todos, inclui candidato próprio e escolhe camada; candidato não vira field antes do lifecycle E20.2.
- Ativação com mudança só ocorre depois de publicação implantada e reconciliação exata.
- Taxon ativo conserva atividade e última versão válida durante revisão e falhas.
- Fields de qualquer camada evoluem por nova versão imutável, impacto proporcional e histórico preservado.
- Falha de automação não confirma cobertura, não apaga estado válido e não impede o caminho humano sem IA.
- A experiência é compreensível e operável nos estados previstos e nos modos de interação exigidos.

## 10. Evidências e arquivos prováveis

- Migration, teste e snippet novos para o lifecycle factual e o default inativo.
- `docs/schema.md`: novas tabelas/RPCs/default/ACLs e estado de apply quando verdadeiro.
- `lib/conversion-content/landing-page/taxon-preparation/`: contratos, máquina de estados, fonte/output e testes.
- `lib/conversion-content/landing-page/input-catalog/`: operações tipadas de draft e testes.
- `lib/conversion-content/adapters/`: source/context/OpenAI/admin-action focalizados.
- `lib/admin/adapters/`: adapter factual novo e ajustes mínimos nos adapters de taxonomia/lifecycle.
- `app/admin/(protected)/taxonomia/`, `components/admin/AdminTaxon*` e `app/admin/(protected)/estrutura-lp/`: actions, componentes e validators.
- `lib/openai-workloads/registry.ts` e validações: somente política Web Search do workload, preservando E21.
- `docs/base-tecnica.md`, `docs/platform-config.md`, `docs/automations.md`, `docs/roadmap.md`; `docs/services.md` deve permanecer sem nova entrada.
- Validações: `npm ci`, `npm run check`, `validate:landing-page-input-catalog`, `validate:taxon-preparation`, `validate:admin-landing-page-structure`, validators Admin Taxonomia, testes SQL, snippet, Preview e QA hospedado.

## 11. Destino documental e reconciliação

- `docs/automations.md` substitui a descrição histórica baseada em Codex App pelo runtime controlado quando o novo estado estiver implementado.
- `docs/base-tecnica.md` registra lifecycle, boundaries, guardrails e transações estáveis.
- `docs/platform-config.md` registra somente gates, variáveis por nome, configuração efetiva e estado real do rollout.
- `docs/schema.md` registra contrato de banco e estado real de apply.
- `docs/roadmap.md` reconcilia in-place E20, E20.2, E20.5, E20.6, E20.7, E12.5 e E12.6, preservando E20.7 sem consumidor.
- `docs/services.md` não muda porque não há service implantável independente.
- Cada documento canônico será atualizado somente pelo `$lp-factory-abc` na etapa competente; `SEM ALTERAÇÕES NECESSÁRIAS` não autoriza edição direta.

## 12. Classificação dos acréscimos técnicos

- Derivação técnica da V1: lifecycle persistido, default inativo, atomicidade, optimistic concurrency, boundaries, matriz de fonte, output v2, Web Search controlada, decisões/candidatos, integração com draft, retirada do legado, validações, QA e documentação canônica.
- Derivações técnicas de validação e UX: Security Controls pós-apply (`supa#2`) fecha os invariantes de banco já exigidos; reconhecimento de estados/próximo passo (`prod#14`) e baseline WCAG 2.2 proporcional (`prod#17`) fecham diretamente a compreensão e a acessibilidade requeridas pela V1. Nenhum dos três é modernização independente.
- Referências/travas: migration/teste/snippet (`supa#40`), QA hospedado (`prod#16`), Next.js 16.3.3 (`vercel#31`), classificação Config/Secret (`vercel#32`) e evidência durável (`github#14`).
- Oportunidades fora do recorte: Unified Logs (`supa#5`), Audit Log Drains (`supa#46`), Queues (`supa#53`), W3C Trace Context (`supa#69`) e AI Gateway (`vercel#1`). Seus gatilhos futuros não autorizam implementação agora.
- Ampliação de escopo: qualquer nova rota, view, workload, provider, agente, fila, job, service, consumidor E19/E20.7, integração greenfield, dado de conta/Oferta/tarefa ou mudança de modelo/effort; não incorporada.
