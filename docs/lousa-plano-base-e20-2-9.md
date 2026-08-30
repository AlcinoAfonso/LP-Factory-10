27/08/2026 — Plano-base v2 — E20.2.9 — Escopo comercial da LP e reconciliação da identidade

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 replanejado por decisão humana em duas etapas. A Etapa 1 é o bootstrap compatível mantendo v5; a Etapa 2, posterior ao merge da Etapa 1 na `main`, cria, avalia e publica a v6.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte: `E20.2.9 — Escopo comercial da LP e reconciliação da identidade`.
- Path canônico: `docs/lousa-plano-base-e20-2-9.md`.
- Natureza: evolução versionada da E20.2 que precisa reconciliar no mesmo recorte os consumidores E19.5 responsáveis pela continuidade da identidade comercial antes de qualquer nova UX da E19.5.4.
- Plano conceitual: PR #822 / `docs/matriz-debate-e19-5-4.md`, somente como origem das decisões humanas aplicadas neste plano.
- Automação: não.

### 1.2. Fontes usadas

- `README.md` — visão do produto, simplicidade do MVP e menor complexidade suficiente.
- `docs/roadmap.md` — estado vigente de E19.5, E20.2, E20.2.8, E20.5 e E20.6.
- `docs/template-roadmap.md` — regra de numeração e conteúdo dos recortes.
- `docs/prompt-estrategista.md` v35 — processo de plano-base e PR.
- `docs/lousa-plano-base-e19-5.md` — configuração operacional, identidade comercial, revisões e residences vigentes.
- `docs/lousa-plano-base-e19-5-4.md` — UX anterior reprovada e recorte visual que permanece bloqueado até esta reconciliação estrutural.
- `docs/lousa-plano-base-e20-2.md` — contrato declarativo e versões v1–v5.
- `docs/lousa-plano-base-e20-2-8.md` — versão atual explícita, lifecycle, compatibilidade e proteção das dimensões de identidade.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual por taxon e autoridade humana.
- PR #821 / E20.7 — consumidor adjacente futuro de `landing_page_offering_scope`, sem autoridade sobre sua persistência ou identidade.
- `lib/conversion-content/landing-page/input-catalog/contracts.ts`, `schema.ts`, `registry.ts`, `lifecycle.ts` e `resolver.ts` — contrato executável E20.2.
- `lib/lp-builder/onboardingConfiguration.ts` — validação e canonicalização dos valores concretos.
- `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts` — autoridade atual de continuidade da identidade e configuração operacional.
- `app/a/[account]/_components/OnboardingConfigurationJourney.tsx` — controle genérico vigente para os value types E20.2.
- `supabase/migrations/20260822170000_e19_5_3_landing_page_workspace.sql` e `20260824180000_e20_2_8_input_catalog_lifecycle.sql` — residences JSONB e RPC de persistência versionada já existentes.

### 1.3. Problema e resultado esperado

- A versão atual v5 representa o que a LP divulga por `primary_service_or_offer`, um `string` singular e obrigatório, e mantém `primary_service_or_offer_description` também singular.
- O contrato E19.5 vigente ainda trata `primary_conversion_goal` como parte do núcleo de identidade, enquanto a decisão humana superveniente estabeleceu que ele é estratégia obrigatória de conversão e pode variar sem criar nova identidade.
- O lifecycle E20.2.8 protege hoje `funnel_stage`, `transaction_intent`, `primary_conversion_goal` e `primary_service_or_offer` como dimensões de identidade; publicar uma alteração material sem reconciliar E19.5 é corretamente bloqueado.
- O resultado deste recorte é materializar uma nova versão E20.2 em que:
  - `landing_page_offering_scope` substitui a semântica singular de `primary_service_or_offer`;
  - a mesma dimensão representa uma oferta, algumas ofertas ou o portfólio amplo;
  - `primary_conversion_goal` deixa de bloquear continuidade de identidade;
  - a autoridade E19.5 passa a reconhecer `funnel_stage`, `transaction_intent` quando aplicável e `landing_page_offering_scope` como núcleo comercial;
  - várias LPs concretas podem compartilhar a mesma identidade, sem criar entidade, vínculo ou unicidade física de identidade;
  - configurações operacionais antigas são interpretadas e convertidas de forma determinística sem reescrever snapshots históricos;
  - somente depois dessa reconciliação a UX E19.5.4 pode ser retomada.

### 1.4. Modelo mental e identidade comercial aplicados

- Landing page concreta e identidade comercial são conceitos distintos.
- Uma conta pode possuir duas ou mais LPs concretas com a mesma identidade comercial.
- O núcleo mínimo de identidade passa a ser:
  - `funnel_stage`;
  - `transaction_intent`, somente quando aplicável ao taxon;
  - `landing_page_offering_scope`.
- `primary_conversion_goal` permanece universal, obrigatório e próprio da estratégia de conversão, mas não integra o núcleo de identidade.
- Alterar `primary_conversion_goal` pode produzir nova versão da mesma LP sem exigir nova LP.
- `business_offerings_summary` permanece contexto compartilhado, livre, opcional e não exaustivo; não é whitelist e não define sozinho o escopo da LP.
- Grupo de LPs, identidade como agrupador, grupo livre criado pelo cliente, A/B e visualização `Por grupos` permanecem fora deste recorte.

### 1.5. Contrato funcional de `landing_page_offering_scope`

- Nome técnico aprovado: `landing_page_offering_scope`.
- Rótulo de produto: `O que esta landing page vai divulgar?`.
- O field é universal, obrigatório, específico da LP e fornecido no contexto da própria LP.
- Na nova versão, `landing_page_offering_scope` e `landing_page_offering_scope_description` são fields universais, obrigatórios, disponíveis nos quatro planos, com `valueScope = "landing_page"`, `expectedValueOrigin = "landing_page_provided"`, `landingPageSubstitutionPolicy = "not_applicable"` e `createdInVersion` igual à nova versão. Os dois fields singulares permanecem fisicamente nas definições herdadas, com `retiredInVersion` igual à nova versão, mas são omitidos da resolução corrente.
- O contrato usa um value type composto próprio da E20.2, `offering_scope`, seguindo o precedente já existente de value types estruturados como `keyword_map`, `number_range`, `asset_reference` e `color_palette`; não cria engine, tabela ou infraestrutura nova.
- Forma canônica do valor:
  - uma oferta: `{ mode: "single", offerings: ["Implante dentário"] }`;
  - algumas ofertas: `{ mode: "multiple", offerings: ["Implante dentário", "Clareamento"] }`;
  - portfólio amplo: `{ mode: "portfolio", offerings: ["Implante dentário", "Clareamento", "Ortodontia"] }`.
- Regras determinísticas:
  - `mode` admite somente `single | multiple | portfolio`;
  - `offerings` é entrada humana livre, representada como lista não vazia de strings não vazias; seu conteúdo factual não é validado, restringido ou derivado de `business_offerings_summary`, taxon, pesquisa ou qualquer catálogo/whitelist;
  - após `trim`, itens iguais em comparação case-insensitive são duplicidade inválida;
  - `business_offerings_summary` permanece contexto opcional, não exaustivo e sem autoridade sobre os itens informados em `offerings`;
  - `single` exige exatamente uma oferta distinta;
  - `multiple` exige pelo menos duas ofertas distintas;
  - `portfolio` exige pelo menos uma oferta distinta e representa a declaração humana de que a lista corresponde ao portfólio abrangido pela LP naquele momento;
  - não fixar máximo arbitrário de itens sem evidência de produto.
- O valor factual da lista pode evoluir sem criar automaticamente nova identidade. Mudança material do escopo continua sendo decisão semântica humana conforme a seção 2.2.

### 1.6. Descrição factual do escopo

- A cobertura factual atualmente fornecida por `primary_service_or_offer_description` não deve ser perdida.
- A nova versão introduz `landing_page_offering_scope_description` como `string` obrigatória e específica da LP para descrever factual e brevemente o escopo selecionado como um todo.
- `landing_page_offering_scope_description` não integra o núcleo de identidade; atualizar detalhes factuais da mesma oferta, conjunto ou portfólio permanece possível na mesma LP e só afeta conteúdo futuro por nova versão.
- `primary_service_or_offer` e `primary_service_or_offer_description` ficam retirados somente na nova versão executável; v1–v5 permanecem imutáveis e resolvíveis.
- Referências funcionais da nova versão, inclusive o propósito de `business_offerings_summary`, labels, mensagens, guard e confirmação, passam a nomear somente `landing_page_offering_scope`. Referências antigas permanecem somente em v1–v5, readers de snapshot, adapters de compatibilidade operacional, bootstraps legados enquanto a residence ainda não tiver sido canonicalizada e testes correspondentes; nunca funcionam como autoridade corrente da nova versão. O contrato existente `sameCommercialWorkConfirmed` é reutilizado, com renomeação apenas de sua apresentação e associação de erro; não há segundo fluxo de confirmação.

### 1.7. Compatibilidade histórica e transição operacional

- Não reescrever materializações, generation context snapshots, revisões ou versões E20.2 v1–v5.
- A Etapa 1 mantém `CURRENT=5`, o registry publicado exclusivamente em v1–v5 e toda operação do cliente em v5. Ela não cria nem publica a entrada v6.
- Para que o gate pré-publicação E20.2.8 consiga validar uma futura candidata v6 contra configurações operacionais v5, a Etapa 1 adiciona compatibilidade read-only no resolver já usado por `countInvalidInputCatalogOperationalConfigurations`.
- Somente quando o registry explicitamente fornecido ao resolver representa uma candidata que retira os fields legados, uma configuração v5 que ainda possua `primary_service_or_offer` recebe projeção determinística em memória:
  - `primary_service_or_offer = X` → `landing_page_offering_scope = { mode: "single", offerings: [X] }`;
  - `primary_service_or_offer_description = Y` → `landing_page_offering_scope_description = Y`.
- A projeção canonicaliza trim e shape, não consulta `business_offerings_summary`, não persiste, não altera a versão da configuração e falha fechada quando qualquer field legado necessário estiver malformado.
- O reconhecimento administrativo mínimo da Etapa 1 limita-se ao novo value type e aos rótulos necessários para visualizar e avaliar um draft; não cria UI operacional do cliente.
- A Etapa 2 cria e valida o draft v6 após o suporte da Etapa 1 estar na `main`, executa E20.6 pré-publicação e só então materializa a versão no registry, torna `CURRENT=6` e reconcilia as configurações conforme o lifecycle vigente.
- A compatibilidade histórica da identidade E19.5, o primeiro save canônico v6 e os consumidores de geração/snapshot pertencem à Etapa 2; nenhuma dessas autoridades é antecipada no bootstrap.
- Nenhuma etapa altera schema ou cria migration, DDL, ACL, nova residência ou autoridade de catálogo no banco. Se evidência operacional contradisser o contrato versionado atual, parar o caso e registrar a divergência.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - decisão humana aprovada para substituir a semântica singular de oferta e corrigir o núcleo de identidade antes da nova UX E19.5.4.
- Entrada:
  - registry E20.2 v5 e lifecycle E20.2.8 vigentes;
  - configurações E19.2 ainda pré-handoff em `account_landing_page_onboarding_configurations`;
  - configurações compartilhadas e específicas das LPs já existentes;
  - snapshots históricos imutáveis;
  - cadeia taxonômica, plano e versão efetiva `C` fornecidos pelos boundaries vigentes.
- Processamento:
  - Etapa 1: materializar a semântica estrutural de `offering_scope` uma única vez no boundary público `lib/conversion-content/landing-page/input-catalog/`, com modos `single | multiple | portfolio`, trim/canonicalização e conteúdo livre de `offerings`;
  - Etapa 1: fazer `validateLandingPageInputValue` e `onboardingConfiguration` reutilizarem essa autoridade, habilitando a projeção read-only exclusivamente quando um registry candidato retira os fields legados;
  - Etapa 1: adicionar somente o reconhecimento administrativo mínimo do value type para visualizar/avaliar o draft, sem UI operacional, save v6, geração ou snapshot;
  - Etapa 2: materializar o draft v6, executar gates E20.2.8/E20.6, reconciliar a identidade E19.5 e somente depois publicar registry v6 e `CURRENT=6`.
- Validação:
  - Etapa 1: validar schema/parser, os três modos, conteúdo livre sem relação com `business_offerings_summary`, canonicalização, unicidade case-insensitive após `trim`, rejeição de `selected` e falha fechada para shape inválido;
  - Etapa 1: provar que `CURRENT=5`, versões publicadas v1–v5 e resolução operacional do cliente v5 permanecem inalterados;
  - Etapa 1: provar no gate operacional E20.2.8 que uma candidata sintética v6 aceita configuração v5 válida pela projeção read-only e rejeita legado malformado, sem write;
  - Etapa 2: validar registry/resolver v6, save/reload canônico, handoff E19.5, identidade, geração, snapshots e publicação.
- Persistência:
  - Etapa 1: nenhuma escrita, migração ou mudança de residence; a projeção existe apenas no valor resolvido em memória durante a validação da candidata;
  - Etapa 2: reutilizar as residences e saves vigentes para a representação canônica nova, sem DDL, migration, ACL ou nova residência.
- Consumo:
  - Etapa 1: somente input catalog, resolver operacional usado pelo gate E20.2.8 e visualização administrativa de draft reconhecem o value type; clientes continuam em v5;
  - Etapa 2: E19.5, UI operacional, geração, snapshots e consumidores posteriores passam a usar v6 após publicação.
- Fallback:
  - valor legado malformado, novo valor inválido, ausência de descrição obrigatória ou incompatibilidade de versão falha fechado;
  - não inferir oferta a partir de nome da LP, `business_offerings_summary`, taxon ou pesquisa;
  - não voltar silenciosamente à v5 depois que a nova versão for atual.

### 2.2. Continuidade da identidade

- Depois de existir revisão válida com baseline aplicável:
  - mudança de `funnel_stage` em relação ao baseline continua exigindo nova LP;
  - mudança de `transaction_intent`, quando aplicável, continua exigindo nova LP;
  - mudança de `primary_conversion_goal` não exige nova LP;
  - mudança de `landing_page_offering_scope` exige confirmação humana explícita equivalente a `continua sendo a mesma identidade comercial?` quando o valor factual mudar materialmente.
- Para `landing_page_offering_scope`:
  - mesma lista apenas reordenada ou com diferenças de caixa/espaçamento não constitui mudança material;
  - alteração de modo, inclusão/remoção/substituição de ofertas ou outra mudança factual aciona a confirmação humana;
  - confirmação positiva preserva a mesma LP e a mudança só entra no conteúdo por nova versão;
  - ausência de confirmação bloqueia o save e orienta a criação de outra LP quando o trabalho comercial for diferente;
  - o sistema não cria nova LP automaticamente.
- A compatibilidade histórica do baseline usa somente a projeção read-only `primary_service_or_offer = X` → `{ mode: "single", offerings: [X] }` quando ainda não existir revisão com o novo field. A comparação usa a configuração operacional canônica corrente e, na ausência dela, essa projeção; baseline legado malformado falha fechado e nenhum snapshot é regravado.
- Não criar constraint, chave, tabela ou fingerprint persistido para impedir duas LPs com identidade igual.

### 2.3. Relação com E20.2.8 e E20.6

- O bootstrap da Etapa 1 precisa ser mergeado na `main` mantendo v5 antes da criação do draft v6, porque o lifecycle E20.2.8 sempre cria `CURRENT + 1` e valida configurações operacionais pelo resolver contra o registry candidato.
- Após esse merge, a Etapa 2 parte da `main` ainda em v5, cria exatamente o draft v6, executa a avaliação E20.6 pré-publicação e somente publica/reconcilia depois dos gates humanos e determinísticos vigentes.
- A transição da v5 para a nova versão é material e não deve ser classificada artificialmente como carry-forward compatível apenas para evitar revisão.
- `landingPageCommercialIdentityFieldKeys` deve passar a refletir somente `funnel_stage`, `transaction_intent` e `landing_page_offering_scope`; `primary_conversion_goal` e `primary_service_or_offer` deixam de ser autoridades vigentes de continuidade.
- O gate E20.2.8 deve provar que o fluxo E19.2 pré-handoff, os consumidores E19.5 e suas coleções operacionais completas suportam a nova versão antes da publicação.
- Taxons preparados materialmente afetados devem seguir a E20.6 vigente para decisão humana de suficiência da nova versão; não copiar `reviewed_input_catalog_version` por conveniência.
- O mesmo número efetivo `C` deve chegar a configuração, workspace e geração conforme a autoridade canônica já implantada pela E20.2.8.

### 2.4. Configuração mínima antes da nova UX

- A Etapa 1 altera somente o reconhecimento administrativo necessário para visualizar e avaliar o novo value type no draft; não cria controles operacionais do cliente.
- Os controles abaixo pertencem à Etapa 2, depois da publicação segura da v6.
- Decisão humana superveniente de 30/08/2026: substitui a escolha manual por rádio `Uma oferta / Algumas ofertas / Todo o portfólio` prevista originalmente nesta seção; não altera o contrato da seção 1.5.
- Na mesma seção `O que esta landing page vai divulgar?`, `Ofertas incluídas` é a autoridade factual da lista, com uma oferta por linha e descrição curta do escopo preservada.
- A UI deriva `single` para uma oferta válida e `multiple` para duas ou mais, sem seleção manual desses modos. Adicionar/remover itens recalcula o modo.
- Somente a abrangência de portfólio exige declaração humana: `Esta lista representa todo o portfólio que quero divulgar nesta landing page`, com apoio `Marque somente se a lista acima representar todo o portfólio abrangido por esta página.`. Marcada, produz `portfolio` com uma ou mais ofertas válidas e preserva edição livre; desmarcada, volta à derivação pela quantidade.
- O shape `{ mode, offerings }`, cardinalidades, trim, rejeição de strings vazias/duplicidade case-insensitive, igualdade material, projeção legada e parser server-side permanecem intactos. A UI preserva o texto em edição e não deduplica nem aceita silenciosamente entradas inválidas.
- Mudança material continua sob a identidade E19.5 e `sameCommercialWorkConfirmed`; concorrência otimista, snapshots, histórico, reidratação/foco de erros corrigíveis do #838 e processamento único de sucessos idempotentes do #841 não mudam. E20.7 continua consumindo os mesmos três modos sem alteração.
- O gate deste ajuste exige regressões determinísticas e QA real em Preview, antes de merge: desktop/mobile/teclado, `single → multiple → single`, marcar/editar/desmarcar portfólio, duplicidade sem perda dos demais valores e save/reload canônico. Não cria v7, field, modo, residência, rota, boundary ou infraestrutura.
- A lista é entrada livre; a interface não deve sugerir que `business_offerings_summary` seja catálogo completo, whitelist ou fonte da lista.
- Os controles de modo, lista de ofertas e descrição possuem nome acessível, labels, instruções e erros programaticamente associados; são operáveis por teclado, preservam foco visível e estado selecionado perceptível, não dependem exclusivamente de hover e mantêm alvos de ação adequados à superfície responsiva.
- A experiência pode reutilizar os componentes e o formulário existentes; não redesenhar home, detalhe, histórico ou preview do workspace nesta fase.
- A UX completa da E19.5.4 só começa depois que a nova versão E20.2 estiver operacional e os gates estruturais estiverem aprovados.
- Fica preservada, sem implementação neste recorte, a oportunidade condicional `prod#12`: breadcrumbs ou switcher contextual enxuto só serão reconsiderados após a reconciliação estrutural e a retomada aprovada da E19.5.4, se usuários reais operando múltiplas contas ou LPs apresentarem erro de contexto reproduzível ou perda mensurável de tempo. O custo esperado é médio e este caso não cria breadcrumb, switcher global, favoritos, recentes, grupo, entidade de identidade nem mudança na navegação do workspace.

## 3. Fases e próxima ação

### 3.1. E20.2.9.1 — Bootstrap de `offering_scope` mantendo v5

- Automação: não.
- Objetivo:
  - permitir que o lifecycle E20.2.8 visualize e valide com segurança uma futura candidata v6 sobre configurações v5, sem antecipar publicação ou operação v6.
- Entrega executável:
  - novo value type `offering_scope` no contrato E20.2;
  - parser/canonicalizador com `single | multiple | portfolio`, `offerings` livre sem catálogo ou derivação e unicidade case-insensitive após `trim`;
  - projeção read-only dos dois fields v5 para os dois fields futuros quando o resolver recebe registry candidato compatível;
  - falha fechada para legado malformado e regressão no gate operacional E20.2.8;
  - reconhecimento administrativo mínimo do value type;
  - plano, matriz, roadmap e PR reconciliados com a estratégia de duas etapas.
- Critérios de aceite:
  - `CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION === 5`, lista publicada `[1,2,3,4,5]` e resolução operacional v5 preservadas;
  - nenhum arquivo de registry, lifecycle, geração, snapshot, UI operacional, migration ou SQL é alterado;
  - candidata sintética v6 passa com configuração v5 válida por projeção somente em memória e falha fechada para legado malformado;
  - `selected` é rejeitado; `multiple` é aceito; o conteúdo livre não é confrontado com `business_offerings_summary`, mas duplicidades após `trim` e comparação case-insensitive são rejeitadas;
  - o diff não contém write, DDL, migration, ACL, nova residence, identidade E19.5 ou publicação v6;
  - `npm ci`, `npm run check` e validações focais aplicáveis passam antes do gate de merge da implementação.
- Próxima ação:
  - submeter o delta da Etapa 1 ao Analista e ao humano; o merge permanece humano.

### 3.2. E20.2.9.2 — Draft, revisão e publicação da v6

- Automação: não.
- Pré-condição:
  - Etapa 1 mergeada na `main`, ainda com `CURRENT=5` e registry publicado v1–v5.
- Entrega futura:
  - criar e congelar o draft v6 pelo lifecycle E20.2.8;
  - validar as configurações operacionais completas usando a compatibilidade read-only já implantada;
  - executar E20.6 pré-publicação e decisões humanas aplicáveis;
  - reconciliar autoridade de identidade E19.5, UI operacional, save/reload, geração e snapshots v6;
  - materializar v6 no registry, alterar `CURRENT=6`, validar o deploy e reconciliar o draft publicado antes de removê-lo.
- Limites:
  - sem migration, DDL, ACL, nova residence ou banco como autoridade do catálogo publicado;
  - nenhum efeito operacional v6 antes dos gates e da publicação repo-only.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- redesenho da home `Todas as LPs`, detalhe ou preview da E19.5.4;
- decisão ou implementação de `Grupo`, identidade como grupo ou grupo livre;
- A/B, tracking, publicação, archive/restore, editor ou comparação de versões;
- implementação da estratégia de Deep Research/fallback dinâmico do PR #821/E20.7;
- catálogo estruturado compartilhado de ofertas do negócio, tabela de portfólio ou whitelist global;
- nova entidade/tabela de identidade comercial;
- constraint de unicidade de identidade entre LPs;
- criação automática de nova LP diante de mudança de identidade;
- nova rota de primeiro nível, job, fila, agente, engine, workflow ou automação;
- reescrita de snapshots/materializações históricas;
- mudança de prompt, algoritmo de geração, renderer ou arquitetura OpenAI;
- inferência de ofertas a partir de taxon, nome da LP, pesquisa ou `business_offerings_summary`.

### 4.2. Critérios de parada

- Parar se o value type composto não puder ser integrado ao contrato E20.2 sem criar segunda autoridade de validação.
- Parar se a transição operacional exigir reescrever snapshots históricos.
- Parar se a adaptação lazy das configurações legadas não permitir validar todas as configurações operacionais exigidas pelo gate E20.2.8 ou se evidência operacional contradisser o contrato versionado atual; registrar a divergência sem propor ou acrescentar migration, DDL ou alteração de ACL por inferência.
- Parar se a nova versão exigir que E20.6 ou E20.2.8 sejam contornadas para ativação.
- Parar a Etapa 1 se `CURRENT`, `registry.ts`, UI operacional, geração, snapshots, identidade E19.5 ou qualquer persistência precisar mudar antes de o bootstrap chegar à `main`.
- Parar se a implementação exigir catálogo estruturado de portfólio, nova residência ou infraestrutura não autorizada neste plano.
- Parar se a solução exigir decidir o modelo de grupos ou redesenhar a UX principal antes de concluir este recorte.
