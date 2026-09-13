# Plano-base E20.6 — V2 técnica executável do Debate 12

- Estado: V2 técnica candidata; execução suspensa até aprovação pelo Analista e reconciliação do roadmap.
- Plano: E20.6 — Liberação e revisão factual de taxons.
- Fonte funcional: seções 4.1–4.10 do Google Doc `Debate 12 — Evolução da revisão factual e UX administrativa da E20 — LP Factory 10`.
- Documento fonte: `1XxMtfz_W0pTEWKiwQ00JIzrjQMC64fIAT40bIJpGZ5w`.
- Revisão fonte: `ANLCKQl7xrJb-Wnad68kW00rg7fezszGop5fqv1nZRlzYfvt62xkp8mWMJkldGi3-KuPHUi4Ukdo_D0vNyg8J1H1Y2c788pikhljBOrjHhw`.
- Base: `origin/main` em `71bd3041a8c59a0922fc5aa1c5344de8cf1a66dc`.
- V1 imutável: commit `ed5d43654772bf7abd3cc5681db25cfd332fce1d`, blob `76d5ae3fff5b4361989552bf0257c51bacfd2996`.
- Roadmap da base: blob `2284269cd4c7c281deb57c3db9d0e7930bb360d6`.
- Plano conceitual: N/A.

## 4.1 V1 funcional consolidada — E20.6 Liberação e revisão factual de taxons

- Estado: V1 funcional consolidada; execução técnica suspensa até a emissão do novo Plano Base.
- Classificação: Complexa apenas pelo alcance sobre contratos existentes; a solução funcional deve permanecer mínima e não autoriza nova infraestrutura.
- Plano único do Debate 12; não cria E20.8 ou E20.9.

## 4.2 Problema e resultado funcional

- Problema: a E20 acumulou coordenação de planos, versões por taxon e consumidores em torno de um catálogo que deveria apenas definir fields.
- O produto precisa de um catálogo factual único e simples: definir fields por camada, publicar nova versão e usar esses fields nos novos usos.
- Resultado: todo novo uso consulta a versão publicada corrente; fields adicionados, editados, inativados ou reativados passam a valer dali em diante, sem efeitos retroativos.
- Novo taxon continua exigindo decisão humana simples sobre a cobertura herdada; IA permanece opcional para sugerir lacunas.
- Usuários: `platform_admin` responsável pela liberação e revisão e consumidores autorizados da E20.2; nenhum novo papel.

## 4.3 Comportamento esperado

- Novo taxon: criar inativo → mostrar herança corrente → humano libera ou pede avaliação → se aceitar mudança, concluir nova versão E20.2 → ativar.
- Avaliação com IA: usar E20.5 válida quando houver; sem ela, Web Search controlada.
- Taxon ativo: continua ativo; revisão posterior é voluntária e não é disparada automaticamente por nova versão do catálogo.
- Catálogo: adicionar, editar, inativar ou reativar field → validar → publicar nova versão; não há revisão individual obrigatória de todos os taxons afetados.
- Consumidor: em cada novo uso, ler a versão corrente aplicável, coletar e validar seus valores e preservar seu próprio resultado; a E20 não atualiza usos anteriores.

## 4.4 Limites, riscos e escopo negativo

- Não criar, publicar ou inativar field por decisão exclusiva da IA.
- Não criar armazenamento, snapshot, sessão, migração ou sincronização para consumidores neste recorte.
- Não implementar consumidor greenfield nem reativar a E20.7.
- Não duplicar configuração, telemetria ou custos da E21.
- Não apagar versões, dados, decisões ou pesquisas históricas.
- Não tornar Web Search obrigatória para a liberação humana do taxon.
- Não usar plano comercial, versão corrente por taxon, fork de catálogo ou classificação de transição por taxon como condição para publicar a E20.2. Os cinco `value_scope` permanecem fechados em `account`, `business`, `offer`, `campaign` e `landing_page`; `Integrations` não entra como sexta categoria.
- Riscos restantes: alterar field ancestral com alcance excessivo, mudar significado sem nova decisão e tratar recomendação da IA como decisão.

## 4.5 Posição planejada no roadmap

- Caso macro 20: revisar título, objetivo e status para representar catálogo factual, conhecimento opcional e auditoria por taxon.
- 20.2: preservar autoridade, herança, versionamento e escopos factuais; retirar política comercial e coordenação de versão por taxon.
- 20.5: reposicionar como pesquisa opcional por taxon, inclusive seleção dormente antes da liberação.
- 20.6: substituir o contrato vigente por `Liberação e revisão factual de taxons`, sem funcionar como gate de versão para taxons já ativos.
- 20.7: preservar capacidade sem consumidor e ajustar somente o estado documental necessário.
- 12.5 e 12.6: reorganizar as superfícies administrativas com foco em UX humana.

## 4.6 Fases da E20.6 — para o novo Plano Base

- 20.6.3 — Liberação de novo taxon: taxon nasce inativo, mostra a herança corrente e pode ser liberado por decisão humana sem IA.
- 20.6.4 — Apoio opcional: IA pode sugerir lacunas; candidato aceito segue o lifecycle E20.2 e só então o novo taxon pode ser ativado.
- 20.6.5 — Provider e fontes: workload preservado, fonte E20.5 preferencial, Web Search fallback ou focal e output estruturado.
- 20.6.6 — Revisão voluntária de taxon ativo: investigar ou sugerir mudanças sem invalidar o taxon e sem criar gate por versão.
- 20.6.7 — Experiência administrativa: página única no Admin Dashboard, simples, responsiva e acessível, com visão por Universal → Segmento → Nicho → Ultranicho quando aplicável, fields herdados/próprios claramente identificados e detalhes técnicos progressivos.

## 4.7 Decisão de automação

- Automação com IA em fluxo controlado no Runtime do LP Factory por Responses API.
- Preservar `taxon_input_catalog_sufficiency_evaluation`.
- A fonte E20.5 válida é preferencial; Web Search é fallback ou pesquisa focal humana.
- Limites: duas chamadas no fallback, uma na pesquisa focal, contexto `medium`, timeout de 45 segundos, `store:false` e zero retry automático.
- Structured Output estrito e fontes externas preservadas.
- IA consultiva; decisões permanecem humanas e gates permanecem determinísticos.
- Sem Agents SDK ou nova infraestrutura.

## 4.8 Critérios funcionais de aceite

- Nenhum novo taxon entra em uso sem decisão humana explícita.
- A cobertura herdada corrente pode ser aprovada sem chamada OpenAI, pesquisa, justificativa textual ou divisão por plano comercial.
- Todo novo uso recebe a versão publicada corrente e os fields aplicáveis ao taxon; não existe fork de versão por taxon.
- Publicar nova versão não invalida, altera ou reabre automaticamente taxons, contas, formulários ou landing pages existentes.
- A E20.5 permanece opcional; quando a IA for solicitada, fonte válida é preferencial e Web Search controlada pode ser usada como fallback.
- A IA permanece consultiva; seus resultados são transitórios e não criam estado próprio da E20.6.
- A interface separa claramente recomendação da IA e decisão humana.
- O humano pode aceitar nenhum, alguns ou todos os candidatos e incluir candidato próprio; candidato aceito segue o mesmo lifecycle E20.2, sem publicação automática.
- Candidato autorizado não é tratado como field publicado antes de completar o lifecycle E20.2.
- Novo taxon com mudança de field só pode ser ativado depois de a nova versão E20.2 estar publicada.
- Taxon ativo permanece ativo durante revisão voluntária e não é reaberto automaticamente quando o catálogo muda.
- Fields de qualquer camada podem ser incluídos, alterados, inativados ou reativados pelo mesmo lifecycle E20.2, com histórico preservado. Todo field deve usar um dos cinco escopos factuais fechados: `account`, `business`, `offer`, `campaign` ou `landing_page`; nova categoria não é criada por conveniência.
- Falha da automação não bloqueia o caminho humano sem IA nem altera estado válido.
- A interface principal é uma única página no Admin Dashboard e mostra taxon, hierarquia e cobertura na ordem Universal → Segmento → Nicho → Ultranicho quando aplicável; cada camada distingue fields herdados e próprios, apresenta ações humanas pertinentes e mantém detalhes técnicos em segundo nível, sem planos comerciais, fingerprints, IDs diagnósticos ou seletor manual de versão.

## 4.9 Evidências esperadas

- Casos automatizados para novo taxon sobre catálogo factual plan-neutral, liberação sem IA e uso da versão publicada corrente.
- Casos automatizados para IA opcional, E20.5 válida, fallback Web Search e falha sem alteração de estado válido.
- Casos de regressão comprovando que nova versão do catálogo não reabre taxon ativo nem altera usos anteriores.
- Casos de evolução E20.2 para adicionar, editar, inativar e reativar fields, com identidade e histórico preservados.
- QA hospedado em desktop e mobile deve validar a página única, a leitura clara das camadas Universal → Segmento → Nicho → Ultranicho quando aplicável, a distinção entre fields herdados e próprios, a ausência de overflow e a separação entre recomendação da IA e decisão humana.
- Observabilidade, configuração e custos do workload permanecem sob a E21; este Debate não cria evidência paralela.

## 4.10 Supervisão

- Supervisão: Autônomo.
- Execução: Complexa.
- O novo ciclo será iniciado por um novo Estrategista Autônomo, porque a instância anterior acumulou contexto excessivo; isso não altera o modo de supervisão nem a autoridade da V1.
- O PR #923 foi fechado como histórico `SUPERSEDED` e pode ser consultado somente para entender tentativas, bugs e mecanismos anteriores; não é baseline, fonte de autoridade nem branch de continuidade.
- O PR #933 permanece mergeado e integra o estado real da `main`; a nova execução parte da `main` vigente e não faz revert amplo por conveniência.
- A execução deverá derivar nova V2 sobre esta V1, em nova branch e novo PR. Alterações locais da tentativa suspensa só podem ser reaproveitadas se forem novamente justificadas pela nova V2.
- Exceção específica ao handoff curto: por troca de instância Autônoma, o handoff pode citar o PR #923 fechado como referência histórica consultável e o PR #933 como implementação já incorporada à `main`, sem transportar briefing técnico adicional.

## 5. V2 técnica executável

### 5.1 Resultado técnico e classificação dos deltas

- Resultado: substituir o caminho operacional corrente da E20.6 por um catálogo factual plan-neutral, liberação humana simples de taxon novo, revisão voluntária de taxon ativo e apoio opcional por IA, sem criar estado, lifecycle ou infraestrutura paralelos.
- `Derivação técnica da V1`: projeção corrente plan-neutral da E20.2; publicação sem coordenação por taxon; liberação por compare-and-set de `is_active`; avaliação e handoff transitórios; página administrativa única; preservação da capacidade dormente E20.7.
- `Modernização técnica justificada — supa#40`: sem o update, a prova hospedada do default, constraints e ACLs dependeria de consulta avulsa; com ele, snippet read-only e teste transacional tornam a evidência reexecutável, detectam drift e não acrescentam runtime ou infraestrutura.
- `Modernização técnica justificada — prod#17`: sem o update, acessibilidade ficaria parcialmente implícita; com ele, critérios WCAG 2.2 proporcionais combinam inspeção automatizada e roteiro manual, sem biblioteca nova nem alegação de conformidade integral.
- `Ampliação de escopo`: nenhuma. Filas, vetores, RAG, AI Gateway, cache, agentes, novos services, nova telemetria e auditoria global de acessibilidade permanecem fora do recorte.

### 5.2 Boundaries e invariantes compartilhados

- `lib/conversion-content/landing-page/input-catalog/` permanece autoridade repo-only das versões publicadas, da versão corrente, da identidade dos fields e da resolução factual.
- O contrato operacional corrente seleciona internamente `CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION`, recebe somente a cadeia taxonômica, resolve Universal → Segmento → Nicho → Ultranicho e devolve um único catálogo com proveniência por camada. Argumento público de versão é rejeitado nesse caminho.
- A API corrente e os novos consumidores não recebem nem devolvem plano comercial ou `allowedPlans`. Se a representação histórica interna produzir projeções materialmente diferentes entre Starter, Lite, Pro e Ultra, a projeção plan-neutral falha fechado.
- O resolver histórico mantém entrada de versão explícita e pode permanecer somente para leitura de versões históricas e para capacidades dormentes já existentes; não alimenta a E20.6, a UI corrente nem novos consumidores.
- `business_taxons.is_active` é o único estado de liberação. `reviewed_input_catalog_version` e evidências históricas são preservados, mas ficam inertes no fluxo corrente e não recebem novos writes pela E20.6 ou pela publicação E20.2.
- Nenhuma ação de IA publica, adiciona, edita, inativa ou reativa field; ativa ou desativa taxon; ou cria estado persistente da avaliação.
- Autorizações e mutações permanecem server-side e reexecutam `requirePlatformAdmin()`; componentes client recebem somente DTO mínimo e nunca acessam OpenAI, secret, configuração operacional ou banco privilegiado.

### 5.3 Fase 20.6.3 — Liberação de novo taxon

- `createAdminTaxon` grava `is_active=false` explicitamente, independentemente do payload do cliente.
- Uma migration forward-only altera somente o default físico de `public.business_taxons.is_active` para `false`; não atualiza linhas existentes, não cria objeto e não altera RLS, policies, grants ou exposição Data API.
- A leitura administrativa resolve a cadeia completa e admite somente o taxon servido inativo; todos os ancestrais aplicados continuam obrigatoriamente ativos.
- A página mostra a cobertura corrente plan-neutral e a proveniência de cada field antes da decisão.
- A liberação relê taxon, cadeia e versão corrente, revalida identidade e cobertura, executa compare-and-set de `is_active=false` para `true` e confirma a leitura final.
- A mutação altera somente `is_active`. Pesquisa E20.5, OpenAI, justificativa textual e `reviewed_input_catalog_version` não são pré-condições nem writes.
- O CRUD administrativo genérico não pode realizar a transição inativo → ativo; a Server Action focal de liberação é o único caminho da aplicação.
- Conflito, drift ou concorrência falham com mensagem segura e exigem reload; não se cria lock, RPC, receipt, sessão ou ledger.

### 5.4 Fase 20.6.4 — Apoio opcional e decisão humana

- A liberação simples é determinística e não chama OpenAI.
- Somente ação explícita de `platform_admin` solicita o workload `taxon_input_catalog_sufficiency_evaluation`.
- A saída é consultiva e transitória. O humano pode rejeitar todos, aceitar alguns ou todos os candidatos e incluir candidato próprio.
- Aceitar nenhum candidato não executa write E20.6 e não impede a liberação.
- Candidatos aceitos e a sugestão própria são normalizados, vinculados ao contexto revalidado e formam somente um handoff transitório para o lifecycle E20.2.
- O handoff não publica nem altera field. Depois de eventual publicação E20.2, a página passa a mostrar a nova versão corrente e o humano decide separadamente se libera o taxon.
- Falha, recusa, incompletude, timeout, indisponibilidade ou output inválido da IA não alteram o taxon nem removem o caminho humano sem IA.

### 5.5 Fase 20.6.5 — Provider, fontes e output

- Reutilizar o workload E21 `taxon_input_catalog_sufficiency_evaluation`, o runtime, a resolução de configuração por ambiente, a credencial compartilhada, os custos e a observabilidade existentes; não criar variável, modelo, secret, workload ou telemetria paralelos.
- Development usa o baseline repo-side. Preview e Production exigem configuração ativa `supabase_operational` conforme E21.2. Preservar `gpt-5.6-terra + low` como baseline/configuração vigente e provar o novo prompt/schema antes do rollout; eventual troca exige avaliação própria.
- A avaliação usa o taxon selecionado, sua cadeia, a versão factual E20.2 corrente e a E20.5 válida quando existir. Não inclui planos, forks, versão corrente por taxon ou `reviewed_input_catalog_version` como autoridade.
- Taxon novo inativo pode ser avaliado no modo administrativo; taxon ativo pode ser revisto voluntariamente.
- Com E20.5 válida, a avaliação sistemática usa essa fonte sem Web Search. Sem E20.5 válida, o fallback exige Web Search com `search_context_size="medium"` e no máximo duas chamadas. Pesquisa focal humana exige exatamente uma busca, inclusive quando complementar à E20.5.
- Executar uma única Responses API foreground com `store:false`, timeout aplicativo de 45 segundos, zero retry automático, sem conversation, background ou Agents SDK.
- Quando houver busca, `web_search` é a única tool permitida, `tool_choice="required"`, `max_tool_calls` corresponde ao modo e `web_search_call.action.sources` é incluído.
- Structured Output estrito, schema limitado e parser semântico determinístico aceitam somente cobertura suficiente, gaps candidatos ou inconclusivo.
- Fonte web precisa ser HTTPS, ter sido devolvida pelo provider e sustentar explicitamente o candidato correspondente. URL inventada, fonte ausente, recusa, resposta incompleta, schema inválido ou contradição semântica falham tecnicamente e sem mutação.
- Pesquisa, web, feedback e output anterior são dados não confiáveis. Prompt e resposta integral, pesquisa, payload de negócio, URLs, PII, secrets e raciocínio privado não entram na telemetria comum.
- Cada tentativa registra, quando disponível, somente workload, ambiente, configuração/revisão, origem, resultado, falha sanitizada, latência, usage e contagens de buscas/fontes. Custos são best-effort e não alteram o resultado funcional. `store:false` não é apresentado como garantia de Zero Data Retention.
- Gate específico desligado apenas indisponibiliza a assistência por IA; não aciona fallback Codex e não bloqueia a liberação humana.
- `E20_6_INPUT_CATALOG_REVIEW_ENABLED` deixa de ter consumidor no caminho corrente e é documentado como gate legado inerte, preservado até recorte próprio de limpeza; nenhum código novo o consulta.
- `E20_5_SELECTED_RESEARCH_ENABLED` governa somente seleção e leitura da fonte E20.5. `not_selected` e `feature_disabled` permanecem resultados tipados e permitem fallback Web Search na avaliação sistemática; `invalid_selection`, `database_failure` e `file_failure` permanecem falhas técnicas, não são colapsadas em ausência e encerram somente a avaliação dependente.
- `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` governa somente o botão e a execução opcional do provider. `false` ou ausência retorna assistência indisponível sem fallback Codex, sem mutação e sem bloquear cobertura ou liberação humanas.

### 5.6 Fase 20.6.6 — Revisão voluntária de taxon ativo

- A revisão é iniciada exclusivamente por `platform_admin` e reutiliza o mesmo workload, contexto plan-neutral, fonte, prompt/schema, parser e guardrails da 20.6.5.
- Publicar nova versão E20.2 não dispara avaliação, não reabre o taxon, não altera `is_active`, não grava marcador e não reprocessa usos anteriores.
- Durante avaliação, evolução e publicação, o taxon permanece ativo. Falha do provider ou resultado inconclusivo preserva todo estado válido.
- Candidatos aceitos seguem apenas para o lifecycle E20.2; encerramento sem mudança não grava estado E20.6.

### 5.7 Fase 20.6.7 — Experiência administrativa

- `/admin/taxonomia/[taxonId]` é a página única principal da E20.6; lista e criação continuam em suas rotas atuais.
- A página apresenta, nesta ordem: identidade e estado do taxon; hierarquia Universal → Segmento → Nicho → Ultranicho; cobertura por camada; distinção entre fields próprios e herdados; ações humanas; assistência opcional por IA; detalhes técnicos progressivos.
- Field é `próprio` quando sua origem é o taxon servido e `herdado` quando vem de ancestral aplicado.
- Taxon inativo recebe ação de liberação sem IA; taxon ativo recebe revisão voluntária. Recomendação da IA e decisão humana são separadas visual e semanticamente.
- Planos comerciais, fingerprints, IDs diagnósticos e seletor manual de versão não aparecem no nível principal.
- Estados `idle`, `pending`, `completed`, `inconclusive`, `refusal`, `timeout`, `error` e `success` preservam conteúdo, não disparam decisão pela renderização e não removem ações humanas válidas.
- Aplicar WCAG 2.2 somente aos critérios pertinentes da superfície alterada: fluxo integral por teclado, foco visível e previsível, nomes/labels/descrições programáticos, anúncio de erro e feedback dinâmico, contraste e alvos de toque adequados, ausência de ação exclusiva por hover e preservação segura dos estados.
- A validação combina inspeção automatizada e roteiro manual; o recorte não declara conformidade WCAG integral sem auditoria própria.

### 5.8 Lifecycle E20.2 e evolução de fields

- Preservar registry, draft singleton, validação, materialização repo-only, prova do artefato implantado, merge, deploy, reconciliação e remoção final do draft.
- O draft corrente aceita somente cobertura factual comum e plan-neutral; `allowedPlans` especializado ou subset comercial falha na validação.
- Adição exige novo `fieldKey` e `createdInVersion` igual à versão-alvo.
- Edição preserva `fieldKey`, residência taxonômica e `createdInVersion`.
- A edição calcula diff versionado e apresenta alcance ancestral antes da confirmação humana. `valueScope` ou residência taxonômica diferentes exigem novo `fieldKey`; alteração de tipo, obrigatoriedade, condições ou validação só permanece sob a mesma identidade quando o humano confirma que representa o mesmo fato.
- Mudança de significado factual exige novo `fieldKey`; refinamento de label ou descrição sob a mesma identidade exige confirmação humana explícita no lifecycle. Validators cobrem os atributos determinísticos e a UI não transforma equivalência semântica em decisão automática.
- Inativação define `retiredInVersion` igual à versão-alvo.
- Reativação remove `retiredInVersion` somente em versão posterior, preservando identidade, residência e `createdInVersion`.
- Versões publicadas anteriores permanecem imutáveis e resolvíveis.
- Validar ou publicar versão E20.2 não depende de evidência, compatibilidade, marcador ou revisão individual por taxon.
- A reconciliação confirma o registry implantado e encerra o draft sem gravar `reviewed_input_catalog_version` e sem alterar `business_taxons.is_active`.
- A UI de `/admin/estrutura-lp?view=entradas` remove blockers, contagens e decisões por taxon; pode mostrar impacto factual por field, sem plano e sem gate E20.6.

### 5.9 Preservação de compatibilidade e escopo negativo

- Preservar a coluna `reviewed_input_catalog_version`, evidências, migrations, registros e versões históricas; não remover nem limpar dados para simplificar o modelo.
- Preservar `taxonChainAdapter`, adapters da pesquisa E20.5, runtime/provider OpenAI e infraestrutura E21, alterando apenas os contratos necessários ao contexto e à decisão plan-neutral.
- Preservar `preparation.ts` e dependências estritamente necessárias à capacidade dormente E20.7, sem reconectá-la ao fluxo corrente nem declarar compatibilidade nova.
- Não implementar consumidor greenfield, E19, Base/Oferta/tarefa, valores concretos, sincronização, snapshot, formulário, landing page, E20.7, E21, novo papel ou infraestrutura.

### 5.10 Residências técnicas prováveis

- Contrato plan-neutral e lifecycle: `lib/conversion-content/landing-page/input-catalog/` e seus validators.
- Avaliação e handoff transitórios: `lib/conversion-content/landing-page/taxon-preparation/` e adapters `inputCatalogEvaluation*`.
- Leitura e liberação E20.6: extrair focalmente do adapter amplo de taxonomia para um adapter dedicado; não refatorar responsabilidades adjacentes por conveniência.
- Actions e UI: `app/admin/(protected)/taxonomia/actions.ts`, página do taxon e componentes E20.6; substituir o componente antigo de confirmação por cobertura/liberação, sem manter dois caminhos concorrentes.
- Lifecycle E20.2 no Admin: `lib/admin/adapters/adminInputCatalogLifecycle*`, `adminLandingPageStructureAdapter` e componentes/validators de `/admin/estrutura-lp`.
- Banco: uma migration focal e um snippet read-only em `supabase/`; refletir somente o default alterado em `docs/schema.md`.
- Documentação durável afetada: `docs/base-tecnica.md`, `docs/schema.md`, `docs/automations.md`, `docs/platform-config.md` obrigatoriamente para a nova semântica e composição dos gates mesmo sem mudança de valor hospedado, e `docs/roadmap.md` pela reconciliação governada.

### 5.11 Checkpoints e validações

1. `20.6.3`: contrato plan-neutral, criação inativa, migration do default, cobertura e liberação CAS sem IA.
2. `20.6.4`: apoio opcional, decisão transitória e lifecycle add/edit/inactivate/reactivate da E20.2 sem evidência ou marcador por taxon.
3. `20.6.5`: provider, fontes, output estruturado e falhas sem mutação.
4. `20.6.6`: revisão voluntária de taxon ativo sem mutação automática.
5. `20.6.7`: página única, acessibilidade, regressões integradas, documentação e Preview/QA de fechamento.

- Cada checkpoint executa os validators focais aplicáveis e o gate do Analista de implementação antes do próximo.
- Validators comprovam que a API corrente não aceita versão histórica, seleciona `CURRENT` internamente e que somente o resolver histórico/dormente aceita versão explícita.
- Casos de gate cobrem `E20_6_INPUT_CATALOG_REVIEW_ENABLED` inerte, E20.5 válida/ausente/desabilitada/inválida/falha de banco/falha de arquivo e provider habilitado/desabilitado, sempre preservando a liberação humana.
- Casos do lifecycle cobrem edição sem redefinição semântica, exigência de nova identidade, impacto de field ancestral e reativação forward-only.
- Gate local acumulado: `npm ci`, `npm run check`, `npm run validate:landing-page-input-catalog`, `npm run validate:taxon-preparation`, `npm run validate:admin-landing-page-structure` e `git diff --check`.
- Teste SQL transacional prova que linhas existentes mantêm seus valores e novo insert sem `is_active` nasce inativo; o snippet read-only pós-apply confirma `column_default=false`, nulabilidade, constraints, RLS, policies e grants sem drift.
- Security Controls é evidência suplementar read-only e não substitui migration, teste ou `docs/schema.md`.
- QA hospedado autenticado cobre desktop e mobile, hierarquia, próprios/herdados, overflow, teclado, foco, labels, toque, contraste, feedback, separação IA/decisão, liberação sem E20.5 e comportamento com provider indisponível.
- Checks, logs e Preview são evidências suplementares e expiráveis; PR, commits e documentos canônicos preservam a prova durável.
- Nenhum merge ocorre antes da liberação explícita do Estrategista Autônomo.
