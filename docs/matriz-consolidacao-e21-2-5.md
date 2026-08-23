# Matriz de consolidação — E21.2.5

## 1. Referências imutáveis

- Caso: `E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI`.
- PR de origem: `#806`, mergeado em `main`.
- Branch/head do PR de origem: `codex-app/e21-2-5-catalogo-workloads@a290082ab1ab596431432bf272410af43c6b6be5`.
- Merge commit e base congelada: `587a534a1bb92eee3869c98e0b81e3512e637e3e`.
- Plano-base v1: `docs/lousa-plano-base-e21-2-5.md`, blob `d3226e6f8d99220a9e60ef4baac38a141ff79090`.
- Snapshot de `docs/roadmap.md`: blob `4b30a7bc5a65da59f916a3342792157fc289c13e`.
- Plano conceitual: `N/A`.
- Plano-base v2 inicial: commit `f2dd34dfd0e1610642d3ad84fbba436dc49d904e`, blob `1299e97f917137a2ef23fc00d8a07713ff970db6`.
- Delta da Passagem 1: commit `5cc73c6291bcfaf16e09cdbd822b61387ad8f4ba`, blob v2 vigente `1451f94c4a19c7921dfee67959a2073ed244e93a`.
- Branch/worktree: `codex-app/e21-2-5-orquestracao` em `C:\Dev\GitHub\LP-Factory-10-e21`.

## 2. Decisões e limites

- O catálogo é global; candidata, prova, revisão, ativação e rollback permanecem independentes por `ambiente + workload`.
- O registry continua code-owned para identidades, modalidades, apresentação, vocabulário tipado e Development; Preview/Production usam o catálogo Supabase para elegibilidade de novas candidatas.
- Revisão ativa, revisão pendente já validada, histórico e rollback não dependem da disponibilidade atual do catálogo.
- Texto e imagem da LP permanecem workloads técnicos independentes; o agrupamento é somente visual.
- `Automação: não`; a E21.3 permanece não iniciada.
- As classes usadas são `preservação`, `extensão adjacente necessária e proporcional` e `expansão`.
- Oportunidade estratégica condicional não autoriza implementação neste recorte.

## 3. Parecer estrutural

Parecer integral preservado pelo orquestrador. Conclusão: `requer patch estrutural`.

| ID | Achado e classificação original | Relação com o escopo | Classe de consolidação | Tratamento | Destino/localização | Evidência |
|---|---|---|---|---|---|---|
| `GE-E21.2.5-00` | Objetivo, boundary e escopo negativo aderentes. | Confirma a fronteira da v1. | preservação | Incorporado sem delta material. | Plano §§1.2, 1.4, 1.5 e 4. | Boundary único, lifecycle preservado e E21.3 não iniciada. |
| `GE-E21.2.5-01` | Autoridade incompleta enquanto allowlists estáticas continuassem validando modelos. Patch estrutural. | Necessário para adicionar modelo sem redeploy. | preservação | Incorporado: catálogo operacional substitui modelos hardcoded somente para novas candidatas; registry preserva identidades, modalidade, apresentação, parâmetros tipados e Development. | Plano §§1.4, 2.1, 2.2, 2.4 e 3.1. | Remoção prevista de `allowedConfigurations`, `listOpenAiWorkloadConfigurationOptions` e equivalentes quando perderem função; snapshots históricos não consultam disponibilidade atual. |
| `GE-E21.2.5-02` | Contrato físico e segurança do catálogo estavam abertos. Patch estrutural. | Fecha residência, identidade, RLS, ACL, RPC e DTO. | extensão adjacente necessária e proporcional | Incorporado com duas tabelas normalizadas, unicidades, auditoria, indisponibilidade sem delete, RLS sem policies, grants mínimos e RPCs `SECURITY INVOKER`. | Plano §2.1 e critérios §2.4. | `public.openai_model_catalog_models`, `public.openai_model_catalog_parameters`; DTO público TypeScript não implica grant público. |
| `GE-E21.2.5-03` | Prova e promoção tinham janela TOCTOU. Patch estrutural. | Protege a atomicidade do lifecycle. | extensão adjacente necessária e proporcional | Incorporado com lock da unidade, locks ordenados do catálogo e revalidação transacional na promoção; ativação/rollback histórico ficam fora da disponibilidade corrente. | Plano §2.2 e critérios §2.4. | Teste SQL deve cobrir as duas ordens da corrida sem revisão parcial. |
| `GE-E21.2.5-04` | Crescimento não estava distribuído entre UI, actions, adapters e banco. Patch estrutural. | Evita acoplamento e acesso Supabase na rota. | extensão adjacente necessária e proporcional | Incorporado com adapter próprio do catálogo, lifecycle separado, SSR guardado, actions finas e componentes distintos, movendo sem duplicar detalhe existente. | Plano §3.1. | `modelCatalogAdapter*`, `catalogActions.ts`, `OpenAiModelCatalogManager.tsx`, `OpenAiWorkloadDetail.tsx`; provider não consulta catálogo. |
| `GE-E21.2.5-05` | Metadados de recorte não possuíam matriz completa. Patch estrutural. | Torna nomes e recortes determinísticos sem persistência paralela. | extensão adjacente necessária e proporcional | Incorporado como matriz única code-owned na API pública do registry. | Plano §1.5. | E10.5.6.5, E10.7.3, E19.4 e E20.6.5 mapeados; LP agrupada apenas visualmente. |
| `GE-E21.2.5-06` | Rollout não estava descrito como sequência backward-compatible. Patch estrutural. | Evita dependência runtime de objeto ainda não aplicado. | extensão adjacente necessária e proporcional | Incorporado: antes do apply, catálogo e novas candidatas falham fechados sem atingir execução ativa; depois do apply, snippet e Security Controls antecedem gestão/QA. | Plano §3.1. | Resolver de execução não consulta os novos objetos; documentação não antecipa apply. |
| `GE-E21.2.5-07` | Faltavam artefatos canônicos finais. Patch estrutural. | Evita drift entre implementação e fontes prescritivas. | extensão adjacente necessária e proporcional | Incorporado como migration, teste SQL, snippet e atualizações canônicas obrigatórias de Schema, Base Técnica e Roadmap. | Plano §3.1. | Migrations já aplicadas permanecem imutáveis; estado de apply só muda após evidência hospedada. |

## 4. Parecer de updates

Parecer integral preservado pelo orquestrador. Veredito: `updates aplicáveis com patches autossuficientes`.

| ID | Classificação original | Relação com o escopo | Classe de consolidação | Tratamento | Destino do update | Localização e evidência |
|---|---|---|---|---|---|---|
| `supa#2` | complementar; atual | Segurança pós-apply dos novos objetos. | extensão adjacente necessária e proporcional | Incorporado como gate do Security Controls após apply, sem métricas ou superfície nova. | usar como referência, validação ou trava | Plano §2.4 e rollout §3.1; evidência identifica ambiente e objetos. |
| `supa#40` | complementar; atual | Verificador repetível do schema e ACLs hospedados. | extensão adjacente necessária e proporcional | Incorporado como snippet read-only versionado com cobertura mínima explícita. | aplicar agora | Plano §2.4 e artefatos §3.1; nenhuma mutação no snippet. |
| `supa#63` | complementar; condicional | Tooling beta poderia ampliar regressão RLS. | expansão | Não incorporado; oportunidade preservada com gatilho, sem `pgtap`, workflow ou ferramenta beta agora. | preservar como oportunidade estratégica condicional | Gatilho: policies diretas para múltiplos papéis/tabelas ou falha concreta não coberta pelos testes determinísticos. |
| `supa#69` | complementar; condicional | Tracing poderia correlacionar app e Supabase, mas exige upgrade e governança. | expansão | Não incorporado; oportunidade preservada, sem upgrade, OpenTelemetry ou Log Drain. | preservar como oportunidade estratégica condicional | Gatilho: incidente real, tracer aprovado e benefício mensurável sobre logs atuais. |
| `vercel#1` | sobreposto; futuro | AI Gateway poderia centralizar custo/fallback, mas mudaria transporte e residência operacional. | expansão | Não incorporado; oportunidade preservada sem Gateway ou fallback. | preservar como oportunidade estratégica condicional | Gatilho: lacuna operacional/econômica comprovada e comparação futura; E21.3 não é iniciada. |
| `vercel#15` | complementar; condicional | Toolbar pode apoiar a coleta de evidências de QA. | expansão | Não incorporado como dependência; oportunidade opcional preservada, sem substituir inspeção manual. | preservar como oportunidade estratégica condicional | Plano §§2.4 e 3.1; adoção depende de custo de coordenação e disponibilidade. |
| `vercel#20` | sobreposto; futuro | Flags não representam autoridade modelo+parâmetro nem lifecycle histórico. | expansão | Não incorporado; rejeitado neste recorte. | não aplicável ao recorte | Escopo negativo proíbe Vercel Flags e segunda residência. |
| `prod#16` | complementar; atual | A nova superfície exige QA hospedado rastreável. | extensão adjacente necessária e proporcional | Incorporado como evidência com deployment/ambiente, papel, viewport, fluxo/estado e resultado; automação é apoio. | usar como referência, validação ou trava | Plano §2.4; papéis positivo/negativo, desktop/mobile e sucesso/erro. |
| `prod#17` | complementar; atual | WCAG 2.2 proporcional precisa de checklist manual explícito. | extensão adjacente necessária e proporcional | Incorporado com teclado, foco, labels, feedback, hover, contraste e touch targets, sem alegação integral. | usar como referência, validação ou trava | Plano §2.4; N/A deve ser justificado e auditoria automática não substitui inspeção manual. |

## 5. Automação

| ID | Achado | Classificação original | Relação com o escopo | Tratamento | Localização | Evidência |
|---|---|---|---|---|---|---|
| `AUTO-N/A` | Nenhuma fase contém `Automação: sim`. | N/A | Não há agente, job, workflow, cron ou rotina recorrente nova. | Gestor de Automações não acionado conforme regra condicional. | Plano v1 e v2. | Ocorrência literal `Automação: não`; avaliação formal: `N/A — nenhuma fase com Automação: sim`. |

## 6. Passagens do Analista e revisões delta

Na Passagem 1, o Analista recebeu v1, v2, plano conceitual `N/A`, decisões e fontes do caso. A conclusão foi `aprovado com correções obrigatórias` por uma lacuna objetiva de completude nas leituras administrativas.

| ID | Correção obrigatória | Classe | Tratamento na v2 | Evidência do gate |
|---|---|---|---|---|
| `P1-E21.2.5-01` | Exigir paginação completa e ordenada para catálogo, revisões e ativações; tratar `416/PGRST103`, falhar fechado para resposta parcial e testar acima de uma página sem afetar resolução ativa/ativação/rollback. | extensão adjacente necessária e proporcional | Aplicado no commit `5cc73c6291bcfaf16e09cdbd822b61387ad8f4ba`. | Revisão delta do mesmo Analista: `aprovado para merge do plano-base v2`; autorizada `auditoria_consolidacao`. |

Na Passagem 2, o mesmo Analista confirmou a cobertura nominal integral e exigiu quatro correções objetivas, sem nova rodada especializada ou decisão humana:

| ID | Correção obrigatória da Passagem 2 | Classe | Tratamento neste delta |
|---|---|---|---|
| `P2-E21.2.5-01` | Incluir prova entre as operações que consultam elegibilidade e revalidar fail-closed antes da chamada externa, sem lock durante o transporte. | preservação | Plano §§1.4 e 2.2 corrigido; promoção mantém revalidação transacional própria. |
| `P2-E21.2.5-02` | Identificar ambiente e objetos novos na evidência do Security Controls. | extensão adjacente necessária e proporcional | Plano §2.4 corrigido. |
| `P2-E21.2.5-03` | Justificar explicitamente cada critério WCAG registrado como N/A. | extensão adjacente necessária e proporcional | Plano §2.4 corrigido. |
| `P2-E21.2.5-04` | Reservar “ABC” ao fluxo documental aplicável e usar “atualizações canônicas” na linha estrutural. | preservação | Linha `GE-E21.2.5-07` corrigida sem alterar o gate próprio do roadmap. |

## 7. Travas preservadas

- Não implementar E21.3, benchmark, ranking, recomendação ou ativação automática.
- Não criar segunda rota, segunda residência, cache, Realtime, AI Gateway, Vercel Flags, tracing, cron, workflow ou agente.
- Não aceitar parâmetro fora do vocabulário tipado do boundary.
- Não transformar indisponibilidade em kill switch de runtime nem invalidar histórico.
- Não unir tecnicamente os workloads de texto e imagem da LP.
- Não editar migrations E21.2 já aplicadas nem declarar apply antes de evidência hospedada.
- Security Controls e snippet são gates pós-apply; QA automática não substitui inspeção manual nem autoriza alegação WCAG integral.

## 8. Próximo gate

Submeter somente este delta objetivo ao mesmo Analista em `revisao_delta`, preservando as duas passagens. Avançar ao ABC do roadmap somente com conclusão `aprovado para merge do plano-base v2`.
