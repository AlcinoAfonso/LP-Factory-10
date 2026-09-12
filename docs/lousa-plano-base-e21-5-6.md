12/09/2026 — Plano-base v2 — E21.5.6 — Visão econômica hierárquica de custos por evento

## 1. Estado e referências imutáveis

- Estado: V2 técnica candidata, derivada da V1 funcional aprovada; aguarda os gates do Analista antes do checkpoint `plan-v2-approved` e da implementação.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.5.6 — Visão econômica hierárquica de custos por evento`.
- Plano: `PB 3 — E21.5.6 Visão econômica hierárquica de custos por evento`.
- Classificação de execução: Complexa, com delta estritamente corretivo e preservação funcional dos PBs concluídos.
- Supervisão: Autônomo.
- Plano conceitual: N/A.
- Fonte canônica: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.3. PB 3 — E21.5.6 Visão econômica hierárquica de custos por evento — V1 aprovada`.
- Documento de origem: `https://docs.google.com/document/d/1CsT5NJ8E0JrXBiG_gumH91BxcGHpHi7kBQtimylrClg`.
- Revisão lida na materialização: `ANLCKQketXjusGrBwA5ymqMCE8oTP-nRqz6tC8AREyQwYkJ8rcmayCT8ZmkqqpmPrFdA2rZN1RyMDpzsplSyxRQ_BWSMhuaHBNz6WZJ0QLw`.
- V1 congelada: commit `7ac2d27869d8f0d7af4a44ef7690ec8cc4865ffe`, blob `51bbac0e9d7ba3a576973b41881a1356f08d12b3`, neste mesmo path.
- Base do PR e snapshot do roadmap: `origin/main@aad19713271bfd7280aa87b47734ef1192addc81`, blob `bc98ac18695e1337120b84836dad4aab6d9c7405` de `docs/roadmap.md`.
- PR único: `#929`, draft, base `main`, head `codex-app/e21-5-6-visao-economica-eventos`.

## 2. Contrato funcional preservado

### 2.1. Problema

- A E21.5 mede corretamente custo por workload, execução e operação, mas a visão administrativa não consegue responder de forma humana e econômica quanto custou uma LP específica, uma ocorrência de resolução de nicho ou outro evento interno da LP Factory.

### 2.2. Resultado funcional

- Permitir que o administrador parta do custo total do período e faça drill-down até o custo unitário do evento de negócio, preservando a decomposição já existente por workload, execução e operação.

### 2.3. Arquitetura da informação

- Universo → responsável econômico (LP Factory ou conta de cliente) → evento de negócio → workload → execução/operação.
- Cada nível apresenta seu subtotal e o nível superior apresenta o total agregado correspondente.

### 2.4. Comportamento esperado

- A visão inicial apresenta gasto oficial OpenAI, total de Clientes, total da LP Factory e reconciliação.
- Ao abrir Clientes, apresenta contas por nome e custo.
- Ao abrir uma conta, apresenta eventos e respectivos custos.
- Ao abrir uma LP, apresenta os workloads e custos que compõem aquela LP.
- Ao abrir um workload, reutiliza o detalhamento técnico existente.
- LP Factory segue o mesmo drill-down a partir de seus eventos internos identificáveis.

### 2.5. Unidade econômica e decisões de produto

- Para Landing Page, a LP específica é o evento econômico.
- Para resolução de nicho, cada ocorrência de resolução por IA é um evento econômico unitário.
- Outros casos usam a identidade funcional existente do evento quando houver vínculo comprovável.
- Correlação com evento é explícita e autorizada, nunca heurística.
- Nomes humanos e identidades de negócio têm precedência na UI sobre UUIDs.
- Execução sem evento comprovável continua visível como sem correlação de evento.
- Totais derivados não inventam valores ausentes.

### 2.6. Atores e automação

- `platform_admin` como usuário da visão econômica.
- Workloads E21 como produtores das execuções já custeadas.
- Entidades de negócio existentes apenas como referência quando forem a origem comprovada do evento.
- Automação: não aplicável; correlação determinística e consulta administrativa sob demanda.
- Gestor de Automações: `N/A — avaliação formal dispensada na V1`.

## 3. Posição e fase executável

- Posição planejada no roadmap: `E21.5.6 — Visão econômica hierárquica de custos por evento`.
- Fase única e indivisível: `E21.5.6 — Visão econômica hierárquica de custos por evento`.
- Objetivo executável: completar correlação econômica, read model e arquitetura da informação da superfície administrativa existente.
- A fase inclui banco, contrato TypeScript, produtores autorizados, composição pura, UI, testes, apply, QA e reconciliação documental necessários ao mesmo resultado; não cria fases intermediárias, PRs empilhados ou outro dashboard.

## 4. Critérios de aceite e evidências

- Em um período selecionado, o administrador vê gasto oficial, subtotal de Clientes, subtotal da LP Factory e reconciliação.
- O administrador abre uma conta por nome e vê seus eventos com custo.
- O administrador abre uma LP específica e vê seu custo total e a decomposição por workload.
- O administrador abre uma ocorrência de resolução de nicho e vê seu custo unitário.
- O administrador faz o mesmo drill-down para eventos da LP Factory.
- Os subtotais fecham aritmeticamente com as execuções calculáveis.
- Custos indisponíveis permanecem indisponíveis; não viram zero nem subtotal parcial apresentado como total.
- Execuções sem correlação comprovada permanecem no subtotal do responsável ou universo e aparecem em coleção explícita separada, nunca como evento sintético.
- Nenhum vínculo é inferido por `request_id`, `trace_id`, `traceparent`, `tracestate`, `baggage`, horário, proximidade, nome, volume ou outra heurística.
- A mesma superfície apresenta caso de cliente com LP real, resolução de nicho, evento interno LP Factory e execução sem correlação.
- A evidência preserva segurança e não expõe payload de negócio, prompt, resposta integral, PII ou secrets.

## 5. Limites e escopo negativo

- Preservar integralmente pricing, ledger, reconciliação oficial, coverage, segurança, histórico E21.4 e contratos funcionais entregues por PB 1 e PB 2.
- Não reabrir PB 1 nem PB 2.
- Não criar tabela analítica, novo engine de custos, novo provider, novo dashboard financeiro nem nova residência analítica.
- Não criar cobrança comercial, backfill, reprecificação, reclassificação retroativa ou governança de Baseline de IA.
- Não alterar objetos `openai_lp_*`, o provider da Costs API, pricing ou a fórmula global `oficial - ativo calculável - histórico legado calculável`.
- Não resolver identidade econômica em adapter, read model ou banco; o produtor autorizado informa a identidade no início da execução.
- Não usar identificador técnico ou dado sensível como identidade ou rótulo humano do evento.
- Não instalar tracing, OpenTelemetry, AI Gateway, CDC, warehouse, réplica, Speed Insights, `rlsautotest`, dependência ou índice especulativo.
- Permanecer em `/admin/custos-openai`; não criar página financeira paralela.

## 6. Invariantes técnicos

### 6.1. Residência e boundaries

- `lib/openai-costs/` permanece a residência financeira transversal; `lib/openai-workloads/` continua responsável apenas por identidade, configuração e telemetria técnica dos workloads.
- `openai_cost_executions`, `openai_cost_operations` e `openai_cost_coverage` permanecem o ledger ativo; a E21.4 permanece histórico congelado somente leitura.
- `activeCostTrackingAdapter` continua responsável pela persistência financeira e apenas recebe os novos argumentos da RPC de início.
- `activeCostReadModelAdapter` continua responsável por paginação, validação e normalização do ledger.
- `lpCostReadModelAdapter` e `openAiCostsProvider` permanecem inalterados.
- A composição entre ativo e legado será pura em `lib/openai-costs/economic-hierarchy.ts`; não acessará Supabase nem provider.
- A árvore visual será route-local em `app/admin/(protected)/custos-openai/_components/OpenAiEconomicHierarchy.tsx`; não será promovida a componente compartilhado sem consumidor adicional.

### 6.2. Identidade econômica explícita

- `OpenAiCostEconomicContext` passa a conter `event` opcional e discriminado:
  - `landing_page`: `eventId` e `landingPageId` iguais, conta explícita e universo `client`;
  - `niche_resolution`: UUID próprio criado uma vez por ocorrência, conta explícita e universo `client`;
  - `lp_factory_internal`: UUID próprio por ocorrência funcional, universo `lp_factory` e `taxonId` opcional somente quando o produtor já o possuir de forma comprovada;
  - `null`: ausência de vínculo comprovado.
- O UUID econômico é dedicado e distinto dos IDs de execução, operação e request.
- A correlação nasce antes da chamada OpenAI e integra a identidade imutável da execução.
- Nenhuma operação posterior completa, corrige ou reclassifica evento por `UPDATE`.

## 7. Contrato de banco

### 7.1. Extensão forward-only do ledger

- Criar migration canônica por `supabase migration new e21_5_6_openai_cost_event_correlation`.
- Acrescentar ao fim de `public.openai_cost_executions`, todos nulos para linhas anteriores: `economic_event_kind text null`, `economic_event_id uuid null`, `landing_page_id uuid null` e `taxon_id uuid null`.
- A constraint aceita somente o conjunto integralmente nulo ou uma correlação válida:
  - `landing_page`: `universe = 'client'`, `attribution_status = 'attributed'`, conta presente, `economic_event_id = landing_page_id` e `taxon_id is null`;
  - `niche_resolution`: `universe = 'client'`, `attribution_status = 'attributed'`, conta presente, `economic_event_id` presente e `landing_page_id/taxon_id is null`;
  - `lp_factory_internal`: `universe = 'lp_factory'`, `attribution_status = 'attributed'`, conta nula, `economic_event_id` presente, `landing_page_id is null` e `taxon_id` opcional.
- Criar FK composta `(landing_page_id, account_id)` para `public.account_landing_pages(id, account_id)` e FK `taxon_id` para `public.business_taxons(id)`, ambas `ON UPDATE RESTRICT ON DELETE RESTRICT`.
- Criar índice parcial `(economic_event_kind, economic_event_id, started_at, id)` somente nas linhas com evento.
- Não criar tabela, view, policy, backfill ou `UPDATE` classificatório.

### 7.2. Imutabilidade e RPCs versionadas

- Atualizar `guard_openai_cost_execution_mutation_v1()` para considerar os quatro campos econômicos parte da identidade imutável.
- Criar `public.start_openai_cost_execution_v2(...)`, incluindo os quatro campos no insert e na comparação idempotente de replay.
- Criar `public.read_openai_active_cost_rows_v2(...)`, preservando período UTC `[start,end)`, keyset por `started_at + execution_id + operation_sequence`, execução sem operação e decimais financeiros serializados como texto.
- A leitura v2 acrescenta `economic_event_kind`, `economic_event_id`, `landing_page_id`, `taxon_id`, `account_name`, `landing_page_name` e `taxon_name`, obtidos por joins autorizados e sem payload de negócio.
- RPCs v2 permanecem `SECURITY INVOKER`, `search_path = pg_catalog`, referências schema-qualified, `REVOKE ALL` de `PUBLIC`, `anon`, `authenticated` e `ai_readonly`, com `EXECUTE` somente para `service_role`.
- As tabelas permanecem com RLS habilitado, zero policies diretas e grants mínimos explícitos; não expor leitura client-side.
- RPCs de término, operação, pricing, coverage e todos os objetos `openai_lp_*` permanecem inalterados.

### 7.3. Rollout compatível com deploy e apply independentes

- O PR preserva as RPCs v1 como ponte de compatibilidade porque o deploy Vercel e o apply de migrations disparam independentemente após o mesmo merge.
- **C2 — Rollout não atômico com ponte v1 estrita.** Como o deploy Vercel e o apply canônico de migrations podem ocorrer em qualquer ordem após o mesmo merge, o runtime deve chamar primeiro a RPC v2 e pode recorrer à RPC v1 exclusivamente quando o erro retornar `code = 'PGRST202'` e sua mensagem identificar exatamente a RPC v2 esperada no schema `public`. Qualquer outro código, mensagem referente a outra função ou erro de autenticação, autorização, rede, schema ou dado deve seguir o tratamento financeiro fail-open vigente sem fallback para v1. O adapter de leitura deve propagar `economicDimensionStatus = 'v2_active' | 'v1_fallback'` até DTO, composição e UI; em `v1_fallback`, os totais vigentes permanecem disponíveis, a dimensão por evento é declarada indisponível e as linhas não são classificadas como execuções v2 sem correlação. A v1 permanece somente como ponte temporária, sem receber funcionalidade nova; sua retirada ocorre em recorte posterior, após comprovação de que migration, snippet e deployments acessíveis operam em `v2_active`. Registros anteriores ou persistidos durante `v1_fallback` permanecem sem correlação e sem backfill.
- Critério normativo de C2: cobrir deploy anterior ao apply com fallback v1 e estado `v1_fallback`; apply anterior ao deploy preservando consumidores v1; estado posterior a ambos usando v2 e `v2_active`; negativas para código diferente, mensagem de outra RPC e demais falhas; ausência de backfill; e não apresentação das linhas v1 como eventos não correlacionados da leitura v2.
- Não remover RPC v1 no mesmo lote do apply que cria v2; isso violaria a ordem segura de rollout e poderia quebrar o runtime anterior.

## 8. Contrato TypeScript e adapters

- Atualizar `OPENAI_ACTIVE_COST_CONTRACT_VERSION` para `e21.5.6-v2` sem reescrever coverage anterior.
- Adicionar tipos discriminados de evento econômico a `active-contracts.ts` e validar coerência entre evento, universo, atribuição e conta.
- `clientOpenAiCostContext(accountId, event?)` e o contexto LP Factory passam evento explícito apenas quando fornecido pelo produtor; ausência permanece `null`.
- `executionStartRpc` projeta os quatro argumentos econômicos da v2.
- `activeCostTrackingAdapter.startExecution` invoca v2 e usa uma função pura compartilhada para reconhecer somente `PGRST202` referente a `public.start_openai_cost_execution_v2`; os testes negativos cobrem demais códigos e mensagens.
- `activeCostReadModelAdapter` pagina v2, usa o mesmo classificador estrito para `public.read_openai_active_cost_rows_v2` e preserva fallback v1 somente durante rollout.
- `activeCostReadModelAdapterCore` valida os novos campos e nomes humanos, rejeita combinações impossíveis e mantém paginação completa, cursor monotônico e decimais lossless.
- DTOs preservam `source = active | legacy`, `economicDimensionStatus`, evento, nomes humanos e detalhe técnico; nenhum nome ausente é inventado a partir de UUID.
- Atualizar exports de `lib/openai-costs/index.ts` apenas para os novos contratos e composição usados por consumidores reais.

## 9. Produtores autorizados

### 9.1. Resolução de nicho de cliente

- Em `app/a/[account]/actions.ts`, criar `economicEventId` por `crypto.randomUUID()` imediatamente antes de cada chamada elegível a `resolveNicheWithOpenAi`.
- Passar `event: { kind: 'niche_resolution', eventId: economicEventId }` junto da conta já autorizada.
- A ocorrência existe mesmo quando a chamada falha; não derivar evento do resultado, request ou timestamp.

### 9.2. Eventos internos LP Factory

- Em `app/admin/(protected)/taxonomia/actions.ts`, criar um ID por avaliação real do catálogo e passá-lo ao `inputCatalogEvaluationOpenAiAdapter` com o `taxonId` já carregado e autorizado.
- Em `lib/conversion-content/commercial-activation/draft-generation.ts`, criar um ID por geração real e passá-lo ao `commercialActivationOpenAiAdapter` com o taxon já carregado.
- Os adapters de workload apenas encaminham o contexto explícito para o adapter compartilhado de Responses; não consultam banco para resolver identidade.

### 9.3. Produtores sem evento comprovado

- Provas administrativas, pesquisa dinâmica sem LP comprovada e `supabase_inspect` continuam com `event: null`.
- O ingresso assinado do `supabase_inspect` mantém schema exato sem evento e não transforma SQL batch, trace ou request em evento econômico.
- Landing Pages históricas continuam representadas pelo read model E21.4, usando `landingPageId` e nomes já persistidos; não copiar nem reclassificar história para o ledger ativo.

## 10. Composição econômica pura

- Criar `buildOpenAiEconomicHierarchy(active, legacy)` em `economic-hierarchy.ts`.
- Usar exclusivamente a aritmética decimal de `decimal.ts`; não converter custo para `number`.
- `Clientes = ativo calculável do universo client + histórico legado calculável`; `LP Factory = ativo calculável do universo lp_factory`.
- Conta agrega seus eventos; evento agrega workloads; workload agrega execuções; execução preserva operações.
- LP histórica é evento `landing_page`, preserva fonte `legacy` e agrega seus dois workloads históricos.
- Evento ativo preserva kind, ID, nome humano quando disponível, fonte `active`, contagens pendentes/indisponíveis e suas execuções.
- Execuções sem evento permanecem em `uncorrelatedExecutions` dentro do responsável ou universo correspondente e continuam compondo o subtotal superior.
- Em `v1_fallback`, a composição preserva os totais vigentes e marca a dimensão econômica como indisponível; não mistura essas linhas com a coleção de eventos realmente não correlacionados de uma leitura `v2_active`.
- Eventos com operação pendente ou custo indisponível preservam estado textual; subtotal calculável não é rotulado como custo completo.
- O rótulo primário de `landing_page` usa o nome persistido da LP. `niche_resolution` usa `Resolução de nicho — <started_at UTC>` e `lp_factory_internal` sem taxon usa `<nome humano do workload> — <started_at UTC>`; quando há taxon, usa seu nome. O timestamp vem da própria execução e o UUID aparece apenas no detalhe técnico e como desempate, nunca como identidade visual ou correlação heurística.
- Ordenar contas e eventos por rótulo humano, início e ID como desempates determinísticos; workloads por identificador canônico; execuções por início e ID.
- `dashboard.ts` incorpora a hierarquia construída sobre o ativo global e o legado, sem mudar período, total oficial, pricing, coverage, filtros ou reconciliação.
- A projeção filtrada vigente continua secundária e altera somente subtotal/detalhe ativo; não altera a hierarquia global, total oficial ou reconciliação.

## 11. Superfície administrativa

- Evoluir somente `/admin/custos-openai`.
- Resumo inicial: gasto oficial, Clientes, LP Factory e reconciliação global, com timestamps e estados existentes preservados.
- `OpenAiEconomicHierarchy.tsx` apresenta disclosures nativos ou controles semanticamente equivalentes: Clientes → contas por nome → eventos → workloads → execuções/operações; LP Factory → eventos internos → workloads → execuções/operações; e coleção explícita `Sem correlação de evento`.
- Quando `economicDimensionStatus = 'v1_fallback'`, a árvore informa em texto que a dimensão por evento ainda não está ativa e não apresenta ausência de evento como correlação concluída.
- Reutilizar o detalhe técnico vigente; não duplicar telemetria ou esconder retries, modelo, effort, baseline, indisponibilidade e origem.
- UUIDs aparecem somente como detalhe técnico quando necessário; o rótulo primário usa conta, LP ou taxon por nome e, nos eventos sem entidade nomeável, usa literalmente `Resolução de nicho — <started_at UTC>` ou `<nome humano do workload> — <started_at UTC>` conforme a regra determinística da seção 10.
- Cada nível expansível funciona por teclado, expõe nome acessível e estado aberto/fechado, preserva foco visível e ordem lógica e não depende somente de hover ou cor.
- Subtotal, indisponibilidade, anomalia e fonte são comunicados também em texto; alvos de toque e layout permanecem legíveis em desktop e mobile.
- Não declarar conformidade WCAG 2.2 integral.

## 12. Arquivos previstos

- Banco: `supabase/migrations/<timestamp>_e21_5_6_openai_cost_event_correlation.sql`, `supabase/tests/e21_5_6_openai_cost_event_hierarchy.test.sql` e `supabase/snippets/e21_5_6_openai_economic_events_verify.sql`.
- Contratos/adapters: `lib/openai-costs/active-contracts.ts`, `adapters/activeCostTrackingAdapterCore.ts`, `adapters/activeCostTrackingAdapter.ts`, `adapters/activeCostReadModelAdapterCore.ts`, `adapters/activeCostReadModelAdapter.ts`, `economic-hierarchy.ts`, `dashboard.ts` e `index.ts`.
- Produtores: `app/a/[account]/actions.ts`, `app/admin/(protected)/taxonomia/actions.ts`, `inputCatalogEvaluationOpenAiAdapter.ts`, `commercial-activation/draft-generation.ts` e `commercialActivationOpenAiAdapter.ts`.
- UI: `OpenAiEconomicHierarchy.tsx`, `OpenAiCostsDashboard.tsx` e validadores focais existentes atualizados somente onde o contrato novo exigir.
- Docs: `docs/schema.md` e `docs/roadmap.md`; `base-tecnica.md`, `platform-config.md`, `design-system.md` e `automations.md` somente se o ABC emitir operação literal.

## 13. Execução e validações da fase E21.5.6

- Criar a migration pelo CLI; implementar extensão de schema, imutabilidade, RPCs v2 e segurança.
- Evoluir contratos, adapters e produtores com evento explícito apenas nas origens autorizadas.
- Implementar composição pura ativo + legado e a árvore route-local na superfície existente.
- Executar `npm ci` uma vez no lote contínuo.
- Executar validadores TypeScript focais para contratos/RPC payload, `v2_active` versus `v1_fallback`, classificador `PGRST202` limitado à RPC exata, LP, nicho, evento interno, ausência de correlação, rótulos determinísticos, aritmética por nível, decimais lossless, custo indisponível e negativas de heurística.
- Executar teste SQL transacional para colunas, constraint, FKs, índice, imutabilidade, replay, keyset, execução sem operação, RLS, zero policies, grants, negativas Data API, segurança das RPCs e ausência de backfill.
- Executar validação focal da UI para teclado, foco, nomes acessíveis, estado aberto/fechado, responsividade e conteúdo seguro.
- Executar `npm run check`, `git diff --check` e revisar `main..HEAD` e `main...HEAD`.
- Antes do merge, validar Preview gate-off: superfície vigente não quebra quando v2 ainda não está aplicada e não publica hierarquia incompleta como concluída.
- Após merge/apply canônico, executar o snippet read-only; Security Controls complementa e não substitui teste/snippet.
- Gerar prospectivamente nicho real e evento interno real; reutilizar a LP histórica; manter execução real sem correlação.
- Executar QA autenticado positivo como `platform_admin` e negativo como papel comum, desktop e mobile, na mesma rota.
- Nenhum gate hospedado aplica migration, corrige dado ou cria correlação por `UPDATE` fora do workflow canônico.

## 14. Reconciliação documental e gates

- Antes do gate da implementação, preparar relatório factual e executar `$lp-factory-abc` em `ETAPA: consolidação final` para cada documento canônico potencialmente afetado.
- Aplicar somente operações literais emitidas; `SEM ALTERAÇÕES NECESSÁRIAS` preserva o documento.
- O delta de planejamento do roadmap registra E21.5.6 como planejada antes da implementação e não afirma código, apply ou QA ainda inexistentes.
- `docs/schema.md` corrige o drift objetivo de E21.5.3/E21.5.4/lossless a partir de evidência competente e registra E21.5.6 somente conforme estado efetivamente aplicado.
- A fase só recebe checkpoint `LP-Factory-Phase: E21.5.6 — Visão econômica hierárquica de custos por evento` após validações, ABC e conclusão `aprovado para avançar` do Analista.

## 15. Classificação dos acréscimos técnicos

| Acréscimo | Classe | Origem e tratamento |
| --- | --- | --- |
| Evento econômico explícito no contexto e ledger existente | derivação técnica da V1 | incorporar sem heurística nem backfill |
| Colunas, constraints, FKs, índice e RPCs v2 | derivação técnica da V1 | incorporar no schema existente com RLS/grants mínimos |
| Compatibilidade v1 durante apply/deploy independentes | derivação técnica da V1 | ponte de rollout; v2 é canônico após apply |
| Correlação em nicho e eventos internos com ID na origem | derivação técnica da V1 | incorporar somente nos produtores autorizados |
| LP histórica como evento no read model E21.4 | derivação técnica da V1 | compor sem alterar história |
| `economic-hierarchy.ts` puro e componente route-local | derivação técnica da V1 | separar responsabilidade sem nova residência |
| Snippet read-only versionado | modernização técnica justificada | `UP-supa-40`, aplicar agora após comparação explícita de ganho e custo |
| Acessibilidade focal da árvore | derivação técnica da V1 | aplicar invariantes vigentes do design system; `UP-prod-17` apenas confirma o gate, sem parcela extra nem alegação integral |
| Security Controls pós-apply | derivação técnica da V1 | `UP-supa-02`, validação complementar |
| QA hospedado desktop/mobile e papéis | derivação técnica da V1 | `UP-prod-16`, validação proporcional |
| Identificadores técnicos como trava negativa | derivação técnica da V1 | `UP-supa-69`, sem implementar tracing |
| AI Gateway, CDC, réplica, RUM, rlsautotest e índice especulativo | ampliação de escopo | não implementar; oportunidades condicionais fora do recorte |

### 15.1. Comparação explícita do `UP-supa-40`

- Sem o update: as provas pós-apply ficam dispersas entre testes e consultas manuais, com repetição e maior risco de variar a verificação entre ambientes.
- Com o update: um único snippet SQL read-only, versionado e sem mutação comprova schema, segurança, disponibilidade das RPCs v2 e amostras prospectivas.
- Ganho: repetibilidade, auditabilidade e menor risco de consulta ad hoc inconsistente; custo: um arquivo SQL focal para manter junto ao contrato.
- Impacto funcional: nenhum. O ganho líquido justifica o update, sem criar objeto de banco, dado ou superfície nova.

## 16. Riscos e critérios de parada

- Ordem não atômica entre apply e deploy: v2 aditiva, fallback apenas por função inexistente e v1 preservada como ponte.
- Associação incorreta: evento imutável na origem, constraints e negativas de identificadores técnicos.
- Subtotal enganoso: decimal lossless e indisponibilidade preservada em todos os níveis.
- Mistura ativo/legado: fonte explícita nos DTOs e nenhuma alteração em E21.4.
- Volume: paginação keyset e índice parcial; novos índices exigem `EXPLAIN` e problema mensurado.
- Parar se a implementação exigir alterar `openai_lp_*`, pricing, Costs API, coverage ou fórmula de reconciliação.
- Parar se algum produtor não possuir identidade econômica explícita; manter `event: null` em vez de inferir.
- Parar se for necessário backfill, UPDATE classificatório, nova tabela analítica, nova página ou decisão de produto.
- Parar antes de declarar a fase pronta sem migration, snippet, Security Controls, quatro casos prospectivos ou QA obrigatório.

## 17. Próxima ação

- Criar checkpoint `LP-Factory-Stage: plan-v2` contendo somente este plano.
- Executar Passagem 1 do Analista sem pareceres, confrontos ou matriz.
- Depois da Passagem 1, versionar a matriz, executar Passagem 2 no mesmo Analista e tratar somente o delta objetivo exigido.
- Após `aprovado para merge do plano-base v2`, reconciliar `docs/roadmap.md`, obter nova aprovação do mesmo Analista e criar `LP-Factory-Stage: plan-v2-approved`.
