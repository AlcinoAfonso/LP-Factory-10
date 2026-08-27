27/08/2026 — Plano-base v2 — E20.2.9 — Escopo comercial da LP e reconciliação da identidade

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 consolidado a partir da v1 do PR #825 e dos pareceres especializados; implementação ainda não iniciada.
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
  - algumas ofertas: `{ mode: "selected", offerings: ["Implante dentário", "Clareamento"] }`;
  - portfólio amplo: `{ mode: "portfolio", offerings: ["Implante dentário", "Clareamento", "Ortodontia"] }`.
- Regras determinísticas:
  - `mode` admite somente `single | selected | portfolio`;
  - `offerings` é sempre lista não vazia de strings não vazias;
  - itens repetidos de forma case-insensitive são inválidos;
  - `single` exige exatamente um item;
  - `selected` exige pelo menos dois itens;
  - `portfolio` exige pelo menos um item e representa a declaração humana de que a lista corresponde ao portfólio abrangido pela LP naquele momento;
  - não fixar máximo arbitrário de itens sem evidência de produto.
- O valor factual da lista pode evoluir sem criar automaticamente nova identidade. Mudança material do escopo continua sendo decisão semântica humana conforme a seção 2.2.

### 1.6. Descrição factual do escopo

- A cobertura factual atualmente fornecida por `primary_service_or_offer_description` não deve ser perdida.
- A nova versão introduz `landing_page_offering_scope_description` como `string` obrigatória e específica da LP para descrever factual e brevemente o escopo selecionado como um todo.
- `landing_page_offering_scope_description` não integra o núcleo de identidade; atualizar detalhes factuais da mesma oferta, conjunto ou portfólio permanece possível na mesma LP e só afeta conteúdo futuro por nova versão.
- `primary_service_or_offer` e `primary_service_or_offer_description` ficam retirados somente na nova versão executável; v1–v5 permanecem imutáveis e resolvíveis.
- Referências funcionais da nova versão, inclusive o propósito de `business_offerings_summary`, labels, mensagens, guard e confirmação, passam a nomear somente `landing_page_offering_scope`. Referências antigas permanecem somente em v1–v5, readers de snapshot e testes históricos. O contrato existente `sameCommercialWorkConfirmed` é reutilizado, com renomeação apenas de sua apresentação e associação de erro; não há segundo fluxo de confirmação.

### 1.7. Compatibilidade histórica e transição operacional

- Não reescrever materializações, generation context snapshots, revisões ou versões E20.2 v1–v5.
- A nova versão é forward-only e somente se torna atual pelo lifecycle E20.2.8.
- Configuração operacional v5 que ainda possua `primary_service_or_offer` e não possua `landing_page_offering_scope` recebe adaptação determinística limitada ao boundary operacional:
  - `primary_service_or_offer = X` → `landing_page_offering_scope = { mode: "single", offerings: [X] }`;
  - `primary_service_or_offer_description = Y` → `landing_page_offering_scope_description = Y`.
- Essa adaptação existe somente para residences operacionais/bootstraps legados e não altera snapshots históricos.
- A compatibilidade histórica da identidade não altera nem regrava snapshots. Para o guard E19.5, a primeira revisão válida que já contenha `landing_page_offering_scope` fornece o baseline desse field. Quando o baseline aplicável for anterior à nova versão e contiver somente `primary_service_or_offer = X` válido, o adapter projeta exclusivamente em memória `{ mode: "single", offerings: [X] }`. Baseline legado malformado falha fechado e não autoriza inferência. A confirmação de mudança compara o próximo valor com a configuração operacional canônica corrente e, na ausência dela, com essa projeção do baseline. A igualdade material considera `mode` e o conjunto de ofertas após trim, comparação case-insensitive e desconsideração de ordem; nenhuma projeção é persistida no snapshot.
- A resolução canonicalizada da nova versão omite os fields retirados; no primeiro save válido sob a nova versão, a residence é persistida somente com os novos fields e o mecanismo legado deixa de ser necessário para aquela configuração.
- Este caso não altera schema e não cria migration. Reutilizar `account_landing_page_shared_configurations`, `account_landing_page_configurations` e `save_account_landing_page_configuration_v1`, já aplicados pela E20.2.8 e aptos a receber a versão efetiva positiva. Não editar migrations aplicadas nem alterar RLS, policies, grants ou exposição pela Data API. O adapter envia ao RPC apenas os valores canonicalizados novos e a versão efetiva `C`. Se evidência operacional contradisser o contrato versionado atual, parar o caso e registrar a divergência; não acrescentar migration ao recorte por inferência.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - decisão humana aprovada para substituir a semântica singular de oferta e corrigir o núcleo de identidade antes da nova UX E19.5.4.
- Entrada:
  - registry E20.2 v5 e lifecycle E20.2.8 vigentes;
  - configurações compartilhadas e específicas das LPs já existentes;
  - snapshots históricos imutáveis;
  - cadeia taxonômica, plano e versão efetiva `C` fornecidos pelos boundaries vigentes.
- Processamento:
  - materializar a semântica de `offering_scope` uma única vez no boundary `lib/conversion-content/landing-page/input-catalog/`, em abstração pública própria exportada pelo `index.ts`, responsável por tipo, validação, canonicalização e igualdade material;
  - `validateLandingPageInputValue`, `onboardingConfiguration`, o guard de identidade e a validação dos facts de snapshot reutilizam essa autoridade; UI, Server Action, adapter e snapshot não reimplementam cardinalidade, unicidade, modos ou equivalência;
  - a UI apenas constrói o valor e coleta a confirmação; o Server Action reautoriza o ator; o adapter lê residences/baselines e aplica a decisão; o banco continua validando somente shape e scopes genéricos;
  - materializar a nova versão do registry retirando somente na nova versão os dois fields singulares e adicionando `landing_page_offering_scope` + `landing_page_offering_scope_description`;
  - canonicalizar valores estruturados e adaptar deterministicamente residences legadas;
  - atualizar a autoridade E19.5 de continuidade da identidade;
  - atualizar a allowlist/proteção E20.2.8 para refletir a nova autoridade;
  - atualizar somente a configuração mínima necessária para editar os novos fields;
  - validar a transição completa antes de tornar a nova versão atual.
- Validação:
  - validar schema/registry/resolver da nova versão;
  - validar cardinalidade, unicidade, canonicalização e igualdade material do `offering_scope` pela autoridade única do input catalog;
  - validar configurações legadas, incompletas e novas;
  - validar continuidade da identidade e mudanças permitidas;
  - validar transição E20.2.8 e revisão E20.6 quando exigida;
  - validar que `generationContext.ts` classifica `offering_scope` como fact semântico do modelo e que `landingPageRevision.ts` reconhece o novo value type sem alterar ou reinterpretar contratos históricos.
- Persistência:
  - reutilizar exclusivamente `account_landing_page_shared_configurations`, `account_landing_page_configurations` e `save_account_landing_page_configuration_v1`, sem DDL, migration, alteração de ACL ou nova residência;
  - o primeiro save sob a nova versão persiste a representação canônica nova e a versão efetiva `C` pelo RPC vigente.
- Consumo:
  - E19.5 usa o novo escopo como dimensão da identidade;
  - geração recebe o valor factual novo no mesmo fluxo de facts/contexto vigente;
  - E20.7 poderá consumi-lo futuramente para seleção de conhecimento, sem alterar este contrato.
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

- A transição da v5 para a nova versão é material e não deve ser classificada artificialmente como carry-forward compatível apenas para evitar revisão.
- `landingPageCommercialIdentityFieldKeys` deve passar a refletir somente `funnel_stage`, `transaction_intent` e `landing_page_offering_scope`; `primary_conversion_goal` e `primary_service_or_offer` deixam de ser autoridades vigentes de continuidade.
- O gate E20.2.8 deve provar que consumidores E19.5 e configurações correntes suportam a nova versão antes da publicação.
- Taxons preparados materialmente afetados devem seguir a E20.6 vigente para decisão humana de suficiência da nova versão; não copiar `reviewed_input_catalog_version` por conveniência.
- O mesmo número efetivo `C` deve chegar a configuração, workspace e geração conforme a autoridade canônica já implantada pela E20.2.8.

### 2.4. Configuração mínima antes da nova UX

- Este recorte altera somente a superfície de configuração necessária para preencher e revisar os novos fields.
- `landing_page_offering_scope` deve permitir escolher claramente:
  - uma oferta;
  - algumas ofertas;
  - todo o portfólio.
- Nos três casos, a pessoa informa a lista factual correspondente e a descrição curta do escopo.
- A escolha do modo deve priorizar reconhecimento: `Uma oferta`, `Algumas ofertas` e `Todo o portfólio` permanecem identificáveis por rótulo humano e estado selecionado, sem exigir que a pessoa memorize os valores técnicos `single | selected | portfolio` nem deduza o modo apenas pela quantidade de itens.
- Os controles de modo, lista de ofertas e descrição possuem nome acessível, labels, instruções e erros programaticamente associados; são operáveis por teclado, preservam foco visível e estado selecionado perceptível, não dependem exclusivamente de hover e mantêm alvos de ação adequados à superfície responsiva.
- A experiência pode reutilizar os componentes e o formulário existentes; não redesenhar home, detalhe, histórico ou preview do workspace nesta fase.
- A UX completa da E19.5.4 só começa depois que a nova versão E20.2 estiver operacional e os gates estruturais estiverem aprovados.
- Fica preservada, sem implementação neste recorte, a oportunidade condicional `prod#12`: breadcrumbs ou switcher contextual enxuto só serão reconsiderados após a reconciliação estrutural e a retomada aprovada da E19.5.4, se usuários reais operando múltiplas contas ou LPs apresentarem erro de contexto reproduzível ou perda mensurável de tempo. O custo esperado é médio e este caso não cria breadcrumb, switcher global, favoritos, recentes, grupo, entidade de identidade nem mudança na navegação do workspace.

## 3. Fases e próxima ação

### 3.1. E20.2.9 — Escopo comercial da LP e reconciliação da identidade

- Automação: não.
- Objetivo:
  - entregar a nova representação de escopo comercial da LP, corrigir a autoridade de identidade E19.5 e publicar a nova versão E20.2 somente após transição operacional segura.
- Entrega executável:
  - novo value type `offering_scope` no contrato E20.2;
  - nova versão executável do registry, preservando v1–v5;
  - `landing_page_offering_scope` e `landing_page_offering_scope_description`;
  - retirada forward-only de `primary_service_or_offer` e `primary_service_or_offer_description` na nova versão;
  - metadados dos novos fields fixados como `landing_page`/`landing_page_provided`/`not_applicable`, disponíveis nos quatro planos, sem autoridade operacional corrente baseada nos fields singulares ou em `primary_conversion_goal`;
  - canonicalização e adaptação determinística de configurações v5 legadas;
  - atualização da continuidade de identidade E19.5 e da proteção E20.2.8;
  - controle mínimo de configuração para os novos fields;
  - validações determinísticas e regressões do input catalog, onboarding/configuração, workspace, geração e snapshots;
  - gates existentes E20.6 e E20.2.8 antes da ativação da nova versão;
  - atualização documental/roadmap somente pelo fluxo ABC quando o estado final estiver comprovado.
- Critérios de aceite:
  - v1–v5 permanecem imutáveis e resolvíveis;
  - nova versão não vira atual antes dos gates E20.2.8/E20.6 aplicáveis;
  - configurações v5 válidas continuam consumíveis por adaptação determinística e são canonicalizadas no primeiro save sob a nova versão;
  - `primary_conversion_goal` pode mudar na mesma LP sem erro de identidade;
  - `landing_page_offering_scope` suporta os três modos e aplica confirmação humana somente a mudança material;
  - duas LPs concretas podem compartilhar a mesma identidade sem bloqueio;
  - geração recebe os novos facts sem alteração de algoritmo, prompt ou renderer;
  - snapshots históricos permanecem inalterados;
  - o diff não contém DDL, migration, alteração de ACL ou nova residência; o primeiro save da residence v5 produz a nova versão e somente as chaves novas pelo RPC vigente, preservando a ausência de acesso para `public`, `anon`, `authenticated` e `ai_readonly`;
  - no gate hospedado da transição, executar os verificadores read-only já versionados `supabase/snippets/e19_5_3_landing_page_workspace_verify.sql` e `supabase/snippets/e20_2_8_input_catalog_lifecycle_verify.sql` para confirmar as residências e o lifecycle existentes; o sucesso desses verificadores não substitui as validações semânticas de `offering_scope`, e nenhum novo snippet, SQL ou migration deve ser criado se o contrato de banco permanecer inalterado;
  - a superfície mínima de configuração deve ser validada em Preview autenticado, em desktop e mobile, cobrindo os papéis e autorizações vigentes, os três modos de `landing_page_offering_scope`, erros de cardinalidade e duplicidade, save e reload da representação canônica, sem regressão visual, funcional ou erro visível nas superfícies tocadas;
  - inspeção automática de apoio e validação manual comprovam teclado, foco, associação de labels/erros, estado selecionado, ausência de interação exclusiva por hover e operação móvel, sem declarar conformidade WCAG integral;
  - `npm ci`, `npm run check` e validações focais aplicáveis passam antes do gate de merge da implementação.
- Próxima ação:
  - concluir o gate do Analista e, após a aprovação deste plano-base v2, executar a implementação na mesma branch e no mesmo PR antes de retomar a UX E19.5.4.

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
- Parar se a implementação exigir catálogo estruturado de portfólio, nova residência ou infraestrutura não autorizada neste plano.
- Parar se a solução exigir decidir o modelo de grupos ou redesenhar a UX principal antes de concluir este recorte.
