12/09/2026 — Matriz de consolidação — E21.4.6 — Transição para histórico legado

## 1. Referências imutáveis

- V1 aprovada: commit `0e7b381f0cf33f878a00c98caa989e3b0385b5c5`, blob `3bce1144f52cec9e90079d319b3cd478e470a6a7`, path `docs/lousa-plano-base-e21-4-6.md`.
- V2 avaliada na Passagem 1: commit `e5b79bc15aae9eeedfd66c45605fc1e40f537d80`, blob `b6fdbbbbf7bfecb7962873bae9f76e8463d9fad2`, mesmo path.
- V2 corrigida para a Passagem 2: commit `dcd57e36e191833237a16641ae7189687beb4535`, blob `aa976e55b87b9526d593c3e2165f333dfaa108a6`, mesmo path.
- Roadmap-base: commit `391c2e1ad0aa696ba36f63ef9e4793e2e07e2dd7`, blob `ab91b6be785b0ca4babd5a55dd739c1775546e8d`.
- Dependência: conclusão de E21.5 confirmada pelo supervisor após os PRs `#921` e `#922`, validações pós-merge, QA autenticado positivo/negativo e leitura final do ledger sem `INVALID_RESPONSE`.
- Plano conceitual: N/A.
- Automação: N/A — avaliação formal dispensada na V1.

## 2. Classificação item a item do contrato E21.4

Esta seção cumpre a matriz funcional de transição. Cada comportamento comprovado das seções 1.2–1.8 e 2.1 de `docs/lousa-plano-base-e21-4.md` recebe um único destino final. `Substituir` altera somente a autoridade ativa; os fatos históricos já gravados continuam preservados.

| ID | Item do contrato E21.4 | Classe de transição | Tratamento em E21.4.6 | Localização e evidência |
| --- | --- | --- | --- | --- |
| TR-E214-01 | Costs API como autoridade do gasto oficial total; cobertura interna não limita o total | preservar | Manter provider oficial, total completo em USD e reconciliação na mesma superfície | `lib/openai-costs/providers/openAiCostsProvider.ts`; `contracts.ts`; `validation-cases.ts` |
| TR-E214-02 | Cálculo LP-específico por usage, modelo, tier, contexto, cache, imagem e preço versionado | substituir | Manter valores históricos gravados; cálculo ativo passa exclusivamente ao pricing e às operações E21.5 | `lib/openai-costs/pricing.ts`; `recorder.ts`; `active-contracts.ts`; migrations E21.5 |
| TR-E214-03 | Tentativa sem unidade/preço suportado não publica custo parcial nem bloqueia workload | substituir | Preservar o histórico; autoridade ativa usa estado calculável/indisponível da E21.5 | `lib/openai-costs/pricing.ts`; `active-cost-validation-cases.ts` |
| TR-E214-04 | Valores de conta/LP/workload identificados como calculados, nunca oficiais individualizados | preservar | Manter rótulo histórico e separar subtotal ativo do total oficial | `lib/openai-costs/dashboard.ts`; `OpenAiCostsDashboard.tsx` |
| TR-E214-05 | Reconciliação sem clamp e anomalia negativa visível | reutilizar | Compor `oficial - ativo calculável - histórico legado`, sem redistribuição | `lib/openai-costs/dashboard.ts`; validação do dashboard |
| TR-E214-06 | Ausência de agrupamento não comprovado por `api_key_id` | preservar | Não introduzir dimensão ou heurística ausente | provider e contratos sanitizados em `lib/openai-costs/` |
| TR-E214-07 | `OPENAI_ADMIN_KEY` separada, server-only e exclusiva da Costs API | preservar | Manter secret e boundary sem alteração | `docs/platform-config.md`; `openAiCostsProvider.ts` |
| TR-E214-08 | Endpoint, timeout, paginação, moeda e falhas fail-closed da leitura oficial | reutilizar | Manter provider e seus testes sem alteração | `openAiCostsProviderCore.ts`; `validation-cases.ts` |
| TR-E214-09 | Falha oficial sem fallback local/cache/chave de runtime | preservar | Manter indisponibilidade explícita | provider, contratos e Server Action de custos |
| TR-E214-10 | Distinção entre falha de medição, crédito real do provider e crédito comercial | preservar | Não atribuir autoridade de bloqueio à E21.4/E21.5 | `provider-error-metadata.ts`; plano E21.4; E9.7 fora do recorte |
| TR-E214-11 | OpenAI Usage/Billing como residência global; LP Factory limitada à reconciliação e atribuição de negócio | preservar | Manter atalhos e total oficial; controle transversal ativo reside na E21.5 | `OpenAiCostsDashboard.tsx`; `docs/platform-config.md`; E21.5 |
| TR-E214-12 | Relação histórica `conta → Landing Page → workload` | preservar | Manter dados, FKs, read RPC e detalhamento histórico | `openai_lp_cost_events`; `read_openai_lp_cost_events_v1`; adapter legado |
| TR-E214-13 | Atribuição ativa limitada a `accountId`/`landingPageId`, dois workloads e Production | substituir | Encerrar o produtor LP; E21.5 usa universo/conta explícitos para workloads governados, sem heurística | migrations/contratos E21.5; ausência de produtor E21.4 no runtime |
| TR-E214-14 | `attempt_id`, início/terminal idempotentes e retries sem duplicação | substituir | Preservar eventos antigos; execução/operação/retry ativos passam ao ledger E21.5 | `openai_cost_executions`; `openai_cost_operations`; recorder E21.5 |
| TR-E214-15 | Metadados seguros; ausência de prompt, resposta, payload, PII e secrets | reutilizar | Manter DTOs sanitizados no legado e no controle ativo | `contracts.ts`; `active-contracts.ts`; adapters/read models |
| TR-E214-16 | Falhas de tracking não bloqueiam geração e eventos incompletos degradam cobertura | substituir | Preservar estado histórico; recorder E21.5 é fail-open e mantém custo indisponível explícito | `lib/openai-costs/recorder.ts`; `active-validation-cases.ts` |
| TR-E214-17 | Residência `openai_lp_*`, correlação, constraints, índices, triggers, RLS e zero policies | preservar | Manter integralmente objetos, linhas e invariantes físicos | migration E21.4.4; `docs/schema.md` 1.36/1.37/3.10 |
| TR-E214-18 | Grants de INSERT e EXECUTE das RPCs de escrita/corte ao `service_role` | retirar | Revogar por migration incremental forward-only; manter SELECT e read RPC | migration E21.4.6; teste/snippet E21.4.6 |
| TR-E214-19 | Gate `OPENAI_LP_COST_TRACKING_ENABLED` e produtor prospectivo | retirar | Produtor já ausente; impedir reintrodução no runtime; variável hospedada fica inerte | regressão em `validation-cases.ts`; `docs/platform-config.md` |
| TR-E214-20 | Migration E21.4.4, rollout, smoke e corte de Production | preservar | Não reescrever migration nem histórico; manter corte `2026-08-29 21:55:36.827207+00` | migration E21.4.4; `docs/lousa-plano-base-e21-4.md`; `docs/schema.md` |
| TR-E214-21 | Período atual/personalizado, UTC, limite, USD, atualização sob demanda e rótulos temporais | reutilizar | Manter contratos e UI vigentes | `dashboard.ts`; page/Server Action/componentes; validações do dashboard |
| TR-E214-22 | Domínio `lib/openai-costs/`, provider, adapters, contratos e API pública | reutilizar | Manter boundary; separar adapter histórico read-only dos adapters ativos | `lib/openai-costs/` |
| TR-E214-23 | `/admin/custos-openai`, `requirePlatformAdmin`, DTO sanitizado e superfície única | reutilizar | Manter rota, guard repetido, três leituras paralelas e UI única | `app/admin/(protected)/custos-openai/` |
| TR-E214-24 | Hierarquia antiga oficial/LP calculado/outros e atalhos OpenAI | substituir | Manter atalhos e oficial; apresentar ativo + histórico + reconciliação pela composição E21.5 | `dashboard.ts`; `OpenAiCostsDashboard.tsx` |
| TR-E214-25 | E21.4 não governa entitlement, capacidade ou crédito comercial | preservar | Manter escopo negativo e nenhuma integração E9.7 | plano E21.4; ausência de diff comercial |
| TR-E214-26 | Gatilho e entrada administrativos do fluxo canônico | reutilizar | `platform_admin` continua solicitando período validado na mesma rota | page, actions e guard de `/admin/custos-openai` |
| TR-E214-27 | Processamento e consumo LP-específicos do fluxo canônico | substituir | Usar total oficial, subtotal ativo E21.5, histórico E21.4 e reconciliação global | `action-core.ts`; `dashboard.ts`; active/legacy read models |
| TR-E214-28 | Persistência ativa de início/terminal E21.4 | retirar | Não existe produtor; revogar execução residual das RPCs | ausência no runtime; migration E21.4.6 |
| TR-E214-29 | Fallback: falha oficial indisponível; evento incompleto/custo indisponível não inventado | reutilizar | Manter sem redistribuição para histórico e ativo | provider, dashboard e contratos E21.5 |

## 3. Achados técnicos consolidados

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| GE-E21.4.6-01 | invariante técnico | derivação técnica da V1 | Adicionar migration forward-only que retire escrita E21.4 e preserve leitura | migration E21.4.4, grants finais; V2 9.2 | N/A | N/A |
| GE-E21.4.6-02 | invariante técnico | derivação técnica da V1 | Substituir teste/snippet que exigem escrita por provas do estado congelado | artefatos E21.4.4 atuais; V2 9.3 | N/A | N/A |
| GE-E21.4.6-03 | invariante técnico | derivação técnica da V1 | Preservar separação atual e adicionar regressão contra novo produtor | busca runtime; adapter legado único; V2 9.4 | N/A | N/A |
| GE-E21.4.6-04 | V1 | derivação técnica da V1 | Preservar composição oficial - ativo - legado, sem clamp | `dashboard.ts`; V2 9.1 | N/A | N/A |
| GE-E21.4.6-05 | V1 | derivação técnica da V1 | Criar esta matriz e reconciliar Schema, plataforma e roadmap por ABC | docs canônicos; V2 9.5/9.6 | N/A | N/A |
| UPD-supa-40 | update | derivação técnica da V1 | Tornar o snippet substituto versionado, hospedável, read-only e identificável por check | V2 9.3/10.2; ganho: prova reproduzível sem falso drift | aplicar agora no snippet E21.4.6 | N/A — impacto estrutural baixo |
| UPD-supa-2 | invariante técnico | derivação técnica da V1 | Usar Security Controls como defesa pós-apply sem mutação de configuração | V2 10.2/12.3; ganho: verificação independente de drift | referência, validação e trava pós-merge | N/A — impacto estrutural baixo |
| UPD-github-14 | invariante técnico | derivação técnica da V1 | Registrar recibos sanitizados duráveis, sem exportar logs | V2 8/10.2/12.3; ganho: auditabilidade após expiração de runs | referência e trava de evidência | N/A — impacto estrutural baixo |
| UPD-vercel-1 | update | ampliação de escopo | Não implementar AI Gateway, budgets, fallback ou migração de credenciais | não necessário ao resultado; oportunidade somente condicional | preservar fora do recorte | N/A — rejeitado no recorte |
| UPD-supa-35 | update | ampliação de escopo | Não criar índices sem lentidão comprovada em série congelada | oito eventos históricos sem crescimento | não aplicar | N/A — rejeitado |
| UPD-supa-46 | update | ampliação de escopo | Não criar Logs/Audit Log Drain | não prova grants, EXECUTE ou integridade histórica | não aplicar | N/A — rejeitado |
| UPD-supa-63 | update | ampliação de escopo | Não introduzir `rlsautotest`/pgtap para mudança focal de ACL | zero policies; garantia principal são grants e EXECUTE | não aplicar | N/A — rejeitado |
| UPD-supa-64 | update | ampliação de escopo | Não criar CDC/warehouse para série sem novos writes | série congelada e sem produtor | não aplicar | N/A — rejeitado |
| UPD-supa-70 | update | ampliação de escopo | Não criar monitor agente ou automação recorrente | V1 registra transição única e automação N/A | não aplicar | N/A — rejeitado |

## 4. Correções objetivas da Passagem 1

| ID | Origem | Classe | Tratamento incorporado | Localização/evidência |
| --- | --- | --- | --- | --- |
| AN-P1-E2146-01 | invariante técnico | derivação técnica da V1 | Reconciliar o estado E21.5 também em `docs/platform-config.md`, preservando a variável LP inerte | V2 9.6 |
| AN-P1-E2146-02 | invariante técnico | derivação técnica da V1 | Separar plano/matriz/roadmap planejado do delta implementável e das atualizações pós-evidência | V2 11.3–11.5 |
| AN-P1-E2146-03 | invariante técnico | derivação técnica da V1 | Manter plano e matriz imutáveis depois de `plan-v2-approved` | V2 11.3/11.5 |
| AN-P1-E2146-04 | invariante técnico | derivação técnica da V1 | Incluir `services/` na varredura quando o path existir | V2 9.4 |
| AN-P1-E2146-05 | V1 | derivação técnica da V1 | Fixar baseline pré/pós-apply em oito eventos, uma cobertura e corte canônico | V2 11.2/12.3 |
| AN-P1-E2146-06 | invariante técnico | derivação técnica da V1 | Dar classificação única aos três tratamentos de update, com comparação e ganho | V2 10.2 |
| AN-P1-E2146-07 | invariante técnico | derivação técnica da V1 | Esclarecer que `aprovado para avançar` cria somente checkpoint; o supervisor decide merge e não há gate final do Analista após a entrega | contrato vigente do Executor; V2 11.2/14 |

## 5. Ampliações recusadas e travas

- Nenhum backfill, reprecificação, reclassificação retroativa, exclusão de linha, alteração de corte ou novo produtor.
- Nenhuma nova UI, rota, provider, adapter, ledger, tabela, policy, papel, índice, automação ou infraestrutura.
- Nenhuma mudança na migration E21.4.4 aplicada.
- Nenhum SQL mutável remoto antes do merge humano.
- `docs/lousa-plano-base-e21-4.md` permanece histórico e não é reescrito.
- A matriz permanece versionada até o supervisor declarar o recorte definitivamente concluído.
