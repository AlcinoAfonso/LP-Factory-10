19/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat; `README.md`; `AGENTS.md`; `docs/prompt-estrategista.md`; `docs/prompt-executor.md`; `docs/gestor-estrutural.md`; `docs/roadmap.md`; `docs/base-tecnica.md`; `docs/schema.md`; `docs/lp-planejamento.md`; planos E18.4 e E20.2; Blueprint; prompt de itens estruturados; catálogos de updates; `lib/conversion-content/landing-page/index.ts`; `lib/conversion-content/landing-page/root-schema.ts`; pareceres do Analista, Gestor Estrutural e Gestor de Updates e reavaliação final do Analista de 19/07/2026.

Versão: v2 consolidada com patch final do Analista.

Status: plano-base aprovado humanamente em 19/07/2026 para implementação manual comparativa da fase 3.1 em branch filha própria; PR #585 permanece documental, draft e sem merge durante o experimento.

Path: `docs/lousa-plano-base-e18-5.md`.

Branches:

- v1 e PR #577 congelados em `docs/e18-5-modules-variants`;
- v2 somente em `codex-app/e18-5-v2-processo-atual`;
- não alterar diretamente o PR #577;
- PR #585 compara a v2 manual contra a branch congelada do PR #577;
- aprovação humana deste patch autoriza somente a criação da branch de implementação manual comparativa;
- nenhum PR experimental deve ser mergeado antes da comparação com o workflow automatizado.

## 1. Estado e decisões fixas

### 1.1. Objetivo e escopo

- Implementar catálogo repo-only versionado, reutilizando a raiz v1 pela API pública.
- Entregar contrato estrito e imutável para futuros E20, E19 e renderer.
- Incluir identidade, lifecycle, fields, cardinalidades, policies, suporte, capabilities, copy, funil, schemas, registry, resolver, payload validator e testes.
- Excluir banco, rota, UI, composição, geração, persistência, snapshot, renderer, tracking, automação, HTML/ARIA concreto, nova variante, formulário e especialização numérica da raiz.

### 1.2. Estado confirmado

- Raiz `landing_page@1` implementada; precedência `raiz → módulo → variante`.
- Raiz usa `hypothesis` e baseline WCAG 2.2 sem conformidade integral.
- Catálogo de entradas conhece `form`; variantes v1 não o aceitam.
- `commercial_activation`, pesquisa e catálogo de entradas permanecem inalterados.
- Contratos próprios de E20, E19.4 e renderer ainda não existem; a E18.5 não define decisões internas desses consumidores.

### 1.3. Grade fechada

- `hero@v1` → `hero.standard@v1`.
- `trust_bar@v1` → `trust_bar.standard@v1`.
- `problem_solution@v1` → `problem_solution.standard@v1`.
- `offer@v1` → `offer.standard@v1`.
- `process@v1` → `process.standard@v1`.
- `technical_assurance@v1` → `technical_assurance.standard@v1`.
- `social_proof@v1` → `social_proof.standard@v1`.
- `faq@v1` → `faq.standard@v1`, `faq.accordion@v1`.
- `final_cta@v1` → `final_cta.standard@v1`.

Regras:

- identidade escopada por `family = landing_page`, sem colisão com `commercial_activation`;
- taxon, funil, campanha, plano, copy, ativo, ordem ou quantidade não criam variante;
- não há parametrização aprovada pendente.

### 1.4. Consolidação dos pareceres

Aceito:

- topologia, namespace, API, script, erros e responsabilidades exatas;
- consumo obrigatório de `resolveLandingPageRootParameters`;
- gramática, maps, profiles, capabilities e lifecycle fechados;
- ausência de especializações v1, incompatibilidade com `form` e FAQ validada primeiro;
- `prod#17` apenas como referência declarativa;
- eliminação de aliases em policies, treatments, `ctaMode` e contratos de fields;
- aplicação obrigatória do `absoluteMax` da raiz com os helpers canônicos de normalização e contagem;
- assinatura pública inequívoca do resolver e exposição dos três lifecycles mais o lifecycle efetivo;
- paths literais em `copySourceMap` e teste de compatibilidade dos canais com o catálogo de entradas;
- fluxo experimental sem merge, com duas entregas irmãs comparadas a partir do mesmo baseline.

Rejeitado:

- novas fases/variantes, banco, renderer, tracking, automação e updates de Supabase/Vercel/GitHub;
- conformidade WCAG integral e validação comportamental real;
- aliases aceitos pelo registry ou resolução pública por injeção de objetos de catálogo/raiz.

Pendente sem bloquear:

- planos técnicos futuros de E20, E19.4 e renderer.

Decisão humana de 19/07/2026:

- este patch final está aprovado;
- a implementação manual comparativa da fase 3.1 pode começar em branch filha criada do head atualizado do PR #585;
- a aprovação não autoriza merge do PR #585, do PR #577 ou de qualquer entrega experimental;
- a integração na `main` será decidida somente após a comparação manual versus automatizada.

## 2. Contrato compartilhado

### 2.1. Registry, versões e raiz

Catálogo v1:

- `family = landing_page`;
- `moduleCatalogVersion = 1`;
- `compatibleRootVersions = [1]`;
- nove módulos e dez variantes;
- catálogo sem lifecycle.

Shape:

- catálogo: `family`, `moduleCatalogVersion`, `compatibleRootVersions`, `modules`;
- módulo: `moduleKey`, `moduleVersion`, `lifecycleStatus`, `purpose`, `function`, `boundaries`, `invariants`, `rootDelta`, `variants`;
- variante: `variantKey`, `variantVersion`, `lifecycleStatus`, `purpose`, `compatibleModuleVersion`, `fields`, `copySourceMap`, `funnelProfileDelta`, `capabilities`, `rootDelta`;
- chave externa e identidade interna devem coincidir.

Versão:

- toda entrada é imutável e sem fallback;
- mudança no conjunto/gramática/maps/profiles/capabilities/compatibilidade/resolução exige nova `moduleCatalogVersion`;
- mudança de função/fronteira/invariante comum exige nova `moduleVersion`;
- mudança de fields/cardinalidade/behavior/capability/copy/validação exige nova `variantVersion`;
- mudança comum da família ou ampliação absoluta pertence à raiz.

Reuso:

- resolver chama `resolveLandingPageRootParameters` pelo boundary;
- proibido importar `root-registry.ts` ou duplicar roles, ranges, limits, spacing, presets e visual criteria;
- erro raiz vira causa de `ROOT_RESOLUTION_FAILED`;
- todos herdam integralmente a raiz v1;
- `rootDelta = {}` em todos; qualquer chave é inválida.

### 2.2. Gramática de fields

`fieldKind`:

- `text`, `collection`, `action`, `image`, `reference`.

Cardinalidade:

- `{ min, max }`, inteiros válidos;
- notação `0..1` é abreviação;
- coleção tem item fechado; coleção aninhada é inválida.

Policies:

- `research_guided`: texto somente pelos item keys do map;
- `hybrid`: pesquisa e suporte quando factual;
- `operational_required`: evidência real, sem geração/alteração material;
- `technical_reference`: ativo/evidência/vínculo não gerado;
- `not_copy`: container estrutural.

Suporte:

- `none`, `when_factual`, `when_present`.

Combinações:

- `text` aceita somente `research_guided`, `hybrid` ou `operational_required`;
- `collection` e `action` usam somente `not_copy`;
- `image` e `reference` usam somente `technical_reference`;
- `operational_required` exige `when_present`;
- todo texto visível exige `semanticRole` existente na raiz resolvida;
- aliases, valores desconhecidos ou combinação inválida falham fechado.

Limites de texto herdados:

- `validateLandingPageVariantPayload` calcula uma forma normalizada de cada valor textual com `normalizeLandingPageRootText`, somente para validação;
- o validator conta caracteres com `countLandingPageRootTextCharacters` e consulta `rootParameters.semanticRoles[semanticRole].textRange.absoluteMax`;
- texto vazio após normalização ou acima de `absoluteMax` produz `INVALID_VARIANT_PAYLOAD`;
- o validator não reescreve nem persiste o payload original;
- `recommended.min` e `recommended.max` permanecem orientação editorial e não causam rejeição automática;
- a normalização e a contagem não podem ser duplicadas no catálogo de módulos;
- `landing-page/index.ts` deve reexportar de forma aditiva `normalizeLandingPageRootText` e `countLandingPageRootTextCharacters`, já implementadas em `root-schema.ts`;
- nenhuma faixa ou algoritmo da E18.4 é alterado por esta fase.

### 2.3. Shapes e capabilities

Ação:

- payload somente `label`, role `cta_label`;
- sem canal ou destino concreto.

Imagem:

- `assetRef`, `mode`, `altText`;
- mode `informative|decorative`;
- informative exige alt; decorative exige alt vazio;
- visibility `all_viewports`.

Referência:

- `referenceKind = operational_evidence`;
- `evidenceRef` interno e rastreável.

Capabilities:

- `primary_action`:
  - consumidores: Hero e Final CTA;
  - `bindingFieldKey=primary_conversion_channel`;
  - `allowedValues=[whatsapp, phone, email, external_url]`;
  - `form` é incompatível.
- `image_asset`:
  - consumidor: Hero;
  - `modes=[informative, decorative]`;
  - `visibility=all_viewports`;
  - `informative` exige `altText` não vazio e `decorative` exige `altText` vazio.
- `accordion_interaction`:
  - consumidor: FAQ Accordion;
  - `initialState=all_closed`;
  - `expansionMode=single`;
  - `toggleMode=own_control`;
  - `keyboardRequired=true`;
  - `stateExposed=true`;
  - `controlContentAssociationRequired=true`;
  - `focusPreserved=true`;
  - foco visível e baseline WCAG 2.2 são herdados da raiz;
  - a E18.5 valida somente esse contrato declarativo.

Nenhuma outra capability ou valor de payload integra a v1.

### 2.4. `copySourceMap`

Shape:

- pesquisa: `sourceMode=research`, 1–2 `primaryItemKeys`, 0–1 `auxiliaryItemKey`;
- operacional: `sourceMode=operational_evidence`, sem item key;
- as chaves do map são paths literais de fields da variante;
- path, item key, source mode desconhecido ou excesso falha fechado.

Mappings:

- Hero:
  - `eyebrow`: `[positioning_opportunity]` + `search_intent`;
  - `title`: `[positioning_opportunity, desire]` + `commercial_keywords`;
  - `subtitle`: `[pain, desire]` + `belief`;
  - `primaryCta.label`: `[trigger]` + `search_intent`;
  - `proofShort`: `[proof_type]` + `objection`.
- Trust Bar:
  - `items[].text`: `[proof_type, belief]` + `objection`.
- Problem Solution:
  - `title`: `[pain, desire]` + `positioning_opportunity`;
  - `items[].problem`: `[pain, fear]` + `objection`;
  - `items[].solution`: `[positioning_opportunity, desire]` + `belief`.
- Offer:
  - `title`: `[desire, trigger]` + `positioning_opportunity`;
  - `items[].itemTitle`: `[trigger, desire]`;
  - `items[].description`: `[positioning_opportunity, belief]` + `objection`.
- Process:
  - `title`: `[belief, desire]` + `positioning_opportunity`;
  - `steps[].stepTitle`: `[trigger, positioning_opportunity]` + `desire`;
  - `steps[].stepBody`: `[belief, desire]` + `objection`.
- Technical Assurance:
  - `title`: `[proof_type, belief]` + `objection`;
  - `items[].assuranceTitle`: `[proof_type]` + `belief`;
  - `items[].assuranceBody`: `[proof_type, positioning_opportunity]` + `objection`.
- Social Proof:
  - `title`: `[proof_type, belief]` + `objection`;
  - `items[].quote` e `items[].attribution`: `sourceMode=operational_evidence`.
- FAQ Standard e Accordion:
  - `title`: `[objection, awareness_level]` + `search_intent`;
  - `items[].question`: `[objection, fear]` + `faq_questions`;
  - `items[].answer`: `[belief, positioning_opportunity]` + `desire`.
- Final CTA:
  - `title`: `[trigger, desire]` + `positioning_opportunity`;
  - `body`: `[desire, objection]` + `belief`;
  - `primaryCta.label`: `[trigger]` + `search_intent`.

### 2.5. `funnelCopyProfile`

Stages:

- `bofu`, `mofu`, `tofu`.

Treatments fechados:

- `direct_action`;
- `qualified_action`;
- `low_friction_action`;
- `educational_context`;
- `problem_emphasis`;
- `offer_specificity`;
- `proof`;
- `comparison`;
- `price`;
- `promise`;
- `credential`;
- `authority`;
- `urgency`;
- `scarcity`;
- `guarantee`.

`ctaMode` fechado:

- `direct`;
- `qualified`;
- `low_friction`.

Mapeamento obrigatório:

- `direct` → `direct_action`;
- `qualified` → `qualified_action`;
- `low_friction` → `low_friction_action`.

Regras:

- cada profile contém arrays de treatment literals em `allowed`, `restricted` e `prohibited`, além de `ctaMode`;
- cada treatment aparece exatamente uma vez entre `allowed`, `restricted` e `prohibited`;
- `prohibited` prevalece sobre `restricted`, e `restricted` sobre `allowed`;
- `restricted` exige field compatível e suporte;
- módulo ou variante somente restringe, proíbe ou enfatiza treatment já conhecido;
- categorias auxiliares podem existir como constantes internas, mas nunca são valores aceitos no registry;
- alias, treatment ou `ctaMode` desconhecido falha fechado.

Padrão da família:

- BOFU:
  - `allowed`: `direct_action`, `qualified_action`, `low_friction_action`, `educational_context`, `problem_emphasis`, `offer_specificity`;
  - `restricted`: `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity`, `guarantee`;
  - `prohibited`: vazio;
  - `ctaMode=direct`.
- MOFU:
  - `allowed`: `qualified_action`, `low_friction_action`, `educational_context`, `problem_emphasis`, `offer_specificity`;
  - `restricted`: `direct_action`, `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity`, `guarantee`;
  - `prohibited`: vazio;
  - `ctaMode=qualified`.
- TOFU:
  - `allowed`: `low_friction_action`, `educational_context`, `problem_emphasis`;
  - `restricted`: `qualified_action`, `offer_specificity`, `proof`, `credential`, `authority`;
  - `prohibited`: `direct_action`, `comparison`, `price`, `promise`, `urgency`, `scarcity`, `guarantee`;
  - `ctaMode=low_friction`.

Deltas por módulo:

- Hero:
  - a ação permitida é somente `direct_action`, `qualified_action` ou `low_friction_action`, conforme o mapeamento literal do `ctaMode` efetivo;
  - `proof` permanece restrito e só pode aparecer em `proofShort`;
  - `comparison`, `price`, `guarantee`, `urgency` e `scarcity` são proibidos.
- Trust Bar:
  - `proof`, `credential` e `authority` permanecem restritos a suporte real;
  - `direct_action`, `qualified_action`, `low_friction_action`, `educational_context`, `problem_emphasis`, `offer_specificity`, `comparison`, `price`, `promise`, `urgency`, `scarcity` e `guarantee` são proibidos.
- Problem Solution:
  - `educational_context` e `problem_emphasis` são permitidos;
  - `direct_action`, `qualified_action`, `low_friction_action`, `offer_specificity`, `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity` e `guarantee` são proibidos.
- Offer:
  - `offer_specificity` é permitido somente com capacidade operacional real;
  - `direct_action`, `qualified_action`, `low_friction_action`, `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity` e `guarantee` são proibidos.
- Process:
  - `educational_context` é permitido;
  - `direct_action`, `qualified_action`, `low_friction_action`, `problem_emphasis`, `offer_specificity`, `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity` e `guarantee` são proibidos.
- Technical Assurance:
  - `educational_context` é permitido;
  - `proof`, `credential` e `authority` permanecem restritos a suporte rastreável;
  - `direct_action`, `qualified_action`, `low_friction_action`, `problem_emphasis`, `offer_specificity`, `comparison`, `price`, `promise`, `urgency`, `scarcity` e `guarantee` são proibidos.
- Social Proof:
  - somente `proof` é admitido e exige `operational_required`;
  - `direct_action`, `qualified_action`, `low_friction_action`, `educational_context`, `problem_emphasis`, `offer_specificity`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity` e `guarantee` são proibidos.
- FAQ Standard e Accordion:
  - `educational_context` e `problem_emphasis` são permitidos;
  - `direct_action`, `qualified_action`, `low_friction_action`, `offer_specificity`, `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity` e `guarantee` são proibidos;
  - as duas variantes usam o mesmo delta.
- Final CTA:
  - somente `direct_action`, `qualified_action` ou `low_friction_action` é permitido, conforme o mapeamento literal do `ctaMode` efetivo;
  - `educational_context`, `problem_emphasis`, `offer_specificity`, `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity` e `guarantee` são proibidos.

### 2.6. Lifecycle, compatibilidade, API e erros

Lifecycle:

- valores: `hypothesis`, `validated`, `deprecated`;
- módulo e variante começam `hypothesis`, com `purpose=controlled_test`;
- promoção para `validated` exige raiz validada, LP real, revisão e decisão humanas;
- `deprecated` bloqueia nova composição e preserva histórico;
- raiz depreciada torna a cadeia inelegível sem mutar módulo ou variante.

Lifecycle efetivo:

- o resultado retorna `rootLifecycleStatus`, `moduleLifecycleStatus`, `variantLifecycleStatus` e `effectiveLifecycleStatus`;
- `effectiveLifecycleStatus=deprecated` quando qualquer um dos três estados for `deprecated`;
- sem `deprecated`, `effectiveLifecycleStatus=hypothesis` quando qualquer um dos três estados for `hypothesis`;
- `effectiveLifecycleStatus=validated` somente quando raiz, módulo e variante forem `validated`.

Referência completa:

- `family`, `moduleCatalogVersion`, `rootVersion`, `moduleKey`, `moduleVersion`, `variantKey`, `variantVersion`;
- incompatibilidade falha fechado.

Resolver público:

```ts
resolveLandingPageModuleVariant(
  reference: LandingPageModuleVariantReference,
  options?: Readonly<{ presetKey?: string }>,
): ResolveLandingPageModuleVariantResult
```

- o consumidor não fornece objetos de catálogo, raiz ou registry;
- o resolver usa internamente o registry canônico do catálogo e chama `resolveLandingPageRootParameters({ rootVersion, presetKey })` pelo boundary público;
- valida catálogo, versões, identidade, compatibilidade e seleciona módulo/variante sem fallback;
- sucesso retorna referência, `rootParameters`, módulo, variante, fields, capabilities, `copySourceMap`, `funnelCopyProfile`, `rootLifecycleStatus`, `moduleLifecycleStatus`, `variantLifecycleStatus`, `effectiveLifecycleStatus`, `modulePurpose` e `variantPurpose`;
- erro retorna somente código e mensagem segura;
- resultado é profundamente imutável.

Payload validator público:

```ts
validateLandingPageVariantPayload(
  reference: LandingPageModuleVariantReference,
  payload: unknown,
  options?: Readonly<{ presetKey?: string }>,
): ValidateLandingPageVariantPayloadResult
```

- chama o resolver público e valida keys, tipos, cardinalidade, collection, action, image, reference e limites textuais da raiz;
- não valida qualidade editorial, verdade factual, destino concreto, renderer, composição, persistência ou snapshot.

Erros:

- `UNKNOWN_MODULE_CATALOG_VERSION`;
- `INVALID_MODULE_CATALOG_CONTRACT`;
- `ROOT_RESOLUTION_FAILED`;
- `INCOMPATIBLE_ROOT_VERSION`;
- `UNKNOWN_MODULE`;
- `UNKNOWN_MODULE_VERSION`;
- `UNKNOWN_VARIANT`;
- `UNKNOWN_VARIANT_VERSION`;
- `INCOMPATIBLE_REFERENCE`;
- `INVALID_VARIANT_PAYLOAD`.

### 2.7. Topologia e API pública

Novos em `lib/conversion-content/landing-page/module-catalog/`:

- `contracts.ts`;
- `schema.ts`;
- `registry.ts`;
- `resolver.ts`;
- `payload-validator.ts`;
- `validation-cases.ts`;
- `index.ts`.

Ajustados:

- `lib/conversion-content/landing-page/index.ts`:
  - reexportar `normalizeLandingPageRootText` e `countLandingPageRootTextCharacters` de `root-schema.ts`;
  - preservar todos os exports atuais e o significado do namespace `landingPageRoot`.
- `lib/conversion-content/index.ts`:
  - adicionar namespace `landingPageModuleCatalog`;
  - preservar namespaces existentes.
- `package.json`:
  - adicionar script `validate:landing-page-module-catalog`.
- este plano:
  - registrar somente estado, evidências e decisão da fase.

Preservados:

- contratos, registry, resolver, schema e valores da raiz E18.4, exceto o reexport aditivo dos dois helpers já existentes;
- `research-resolution/*`, `input-catalog/*`, `commercial-activation/*`.

API:

- `landingPageRoot` continua exclusivamente relacionado à raiz e passa a expor também seus helpers canônicos de texto;
- novo namespace `landingPageModuleCatalog` exporta types, registry, schemas necessários, resolver e validator;
- “público” significa boundary TypeScript, não client, rota ou API HTTP;
- o resolver não expõe API pública de injeção de registry.

### 2.8. Update e fronteiras

- Aplicar `prod#17` somente como referência declarativa WCAG 2.2 no Accordion.
- Rejeitar todos os updates de Supabase, Vercel, GitHub e demais de Produto.
- E18.5 define estrutura; E20 futura escolhe composição; E19 futura produz copy/valores e snapshot; renderer futuro executa payload e acessibilidade concreta.
- A matriz de validação deve confirmar, em teste apenas, que `primary_action.allowedValues` é subconjunto do enum público de `primary_conversion_channel` do catálogo de entradas v1.
- Essa verificação usa o boundary público do catálogo de entradas e não cria dependência runtime no resolver.

### 2.9. Estratégia experimental de branches e merge

Durante a comparação:

- baseline comum e imutável: commit `83d0048678c3139b82075380c4e1bcbb1dac0043` da branch `docs/e18-5-modules-variants`;
- PR #585 permanece draft, com base nessa branch e head `codex-app/e18-5-v2-processo-atual`;
- a implementação manual usa nova branch filha criada do head aprovado do PR #585 e novo PR draft com base `codex-app/e18-5-v2-processo-atual`;
- o workflow automatizado deve usar pilha irmã originada do mesmo baseline;
- nenhum PR documental ou de implementação é mergeado durante a comparação.

Depois da comparação:

- escolher a melhor entrega ou criar branch de reconciliação a partir do head selecionado;
- a branch final deve conter v1, v2 escolhida e implementação validada;
- abrir ou retargetar somente o PR final de integração contra `main`;
- fechar PR #577, PR #585 e PRs experimentais substituídos sem merge, quando aplicável;
- merge na `main` continua dependente de decisão humana explícita após a comparação.

## 3. Contratos fechados

### 3.1. Fields por variante

- Hero:
  - `eyebrow`: `fieldKind=text`, `semanticRole=eyebrow`, `cardinality=0..1`, `policy=research_guided`, `support=none`;
  - `title`: `fieldKind=text`, `semanticRole=h1`, `cardinality=1..1`, `policy=hybrid`, `support=when_factual`;
  - `subtitle`: `fieldKind=text`, `semanticRole=paragraph`, `cardinality=1..1`, `policy=hybrid`, `support=when_factual`;
  - `primaryCta`: `fieldKind=action`, `cardinality=1..1`, `policy=not_copy`, `capability=primary_action`;
  - `primaryCta.label`: `fieldKind=text`, `semanticRole=cta_label`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`;
  - `proofShort`: `fieldKind=text`, `semanticRole=paragraph`, `cardinality=0..1`, `policy=hybrid`, `support=when_present`;
  - `media`: `fieldKind=image`, `cardinality=0..1`, `policy=technical_reference`, `capability=image_asset`.
- Trust Bar:
  - `items`: `fieldKind=collection`, `cardinality=2..4`, `policy=not_copy`;
  - `items[].text`: `fieldKind=text`, `semanticRole=benefit_item`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`.
- Problem Solution:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items`: `fieldKind=collection`, `cardinality=2..4`, `policy=not_copy`;
  - `items[].problem`: `fieldKind=text`, `semanticRole=card_title`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items[].solution`: `fieldKind=text`, `semanticRole=card_body`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`.
- Offer:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items`: `fieldKind=collection`, `cardinality=1..4`, `policy=not_copy`;
  - `items[].itemTitle`: `fieldKind=text`, `semanticRole=card_title`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`;
  - `items[].description`: `fieldKind=text`, `semanticRole=card_body`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`.
- Process:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `steps`: `fieldKind=collection`, `ordered=true`, `cardinality=2..6`, `policy=not_copy`;
  - `steps[].stepTitle`: `fieldKind=text`, `semanticRole=step_title`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`;
  - `steps[].stepBody`: `fieldKind=text`, `semanticRole=step_body`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`.
- Technical Assurance:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items`: `fieldKind=collection`, `cardinality=1..4`, `policy=not_copy`;
  - `items[].assuranceTitle`: `fieldKind=text`, `semanticRole=card_title`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`;
  - `items[].assuranceBody`: `fieldKind=text`, `semanticRole=card_body`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`.
- Social Proof:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items`: `fieldKind=collection`, `cardinality=1..3`, `policy=not_copy`;
  - `items[].quote`: `fieldKind=text`, `semanticRole=card_body`, `cardinality=1..1`, `policy=operational_required`, `support=when_present`;
  - `items[].attribution`: `fieldKind=text`, `semanticRole=card_title`, `cardinality=1..1`, `policy=operational_required`, `support=when_present`;
  - `items[].evidenceRef`: `fieldKind=reference`, `cardinality=1..1`, `policy=technical_reference`, `referenceKind=operational_evidence`.
- FAQ Standard:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items`: `fieldKind=collection`, `cardinality=2..6`, `policy=not_copy`;
  - `items[].question`: `fieldKind=text`, `semanticRole=faq_question`, `cardinality=1..1`, `policy=research_guided`, `support=none`;
  - `items[].answer`: `fieldKind=text`, `semanticRole=faq_answer`, `cardinality=1..1`, `policy=hybrid`, `support=when_factual`.
- FAQ Accordion:
  - possui definição própria com os mesmos paths e valores literais de fields da FAQ Standard;
  - adiciona somente `capability=accordion_interaction`;
  - não herda semanticamente da variante irmã e não adiciona field.
- Final CTA:
  - `title`: `fieldKind=text`, `semanticRole=h2`, `cardinality=1..1`, `policy=hybrid`, `support=when_factual`;
  - `body`: `fieldKind=text`, `semanticRole=paragraph`, `cardinality=1..1`, `policy=hybrid`, `support=when_factual`;
  - `primaryCta`: `fieldKind=action`, `cardinality=1..1`, `policy=not_copy`, `capability=primary_action`;
  - `primaryCta.label`: `fieldKind=text`, `semanticRole=cta_label`, `cardinality=1..1`, `policy=hybrid`, `support=when_present`.

### 3.2. Regras comuns

- Todos: `lifecycleStatus=hypothesis`, `purpose=controlled_test` e `rootDelta={}`.
- Suporte real conforme fields; Problem Solution sem alarmismo.
- Social Proof sem fabricação/alteração material.
- FAQ sem duplicidade ou fato sem suporte.
- Hero e Final CTA excluem `form`.
- Accordion valida contrato declarativo, não comportamento.
- Nenhum contrato armazena destino concreto ou taxon.

## 4. Fase e próxima ação

### 4.1. Fase 3.1 — E18.5.3–E18.5.9 — Catálogo repo-only

- Automação: não.

Sequência:

1. contracts, schemas, registry, API e raiz;
2. FAQ Standard/Accordion;
3. prova das duas variantes;
4. demais módulos;
5. integração e não regressão.

Entregas:

- somente arquivos da seção 2.7;
- registry imutável, resolver/validator fail-closed, namespace e script;
- sem banco, rede ou renderer.

Critérios:

- `landingPageRoot` preserva o contrato da raiz e reexporta somente os dois helpers canônicos de texto; resolver usa exclusivamente a API pública da raiz;
- versões, identidades, fields, policies, supports, maps, treatments, `ctaMode`, capabilities, lifecycle e compatibilidade usam somente valores literais fechados;
- rootDelta vazio, form rejeitado, FAQs independentes;
- Accordion somente declarativo WCAG 2.2;
- payload cobre todos os `fieldKind`, aplica normalização e `absoluteMax` da raiz e rejeita aliases, desconhecidos e combinações inválidas;
- erros sem copy, pesquisa, PII, credenciais ou secrets;
- output profundamente imutável;
- nenhum consumidor ou família preservada é alterado, salvo o reexport aditivo dos helpers da raiz e a verificação test-only contra o catálogo de entradas.

Validações:

- `npm ci`;
- validações existentes de root, pesquisa, input catalog e commercial activation;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

Matriz mínima:

- resolve dez variantes;
- rejeita versões, identidades, roles, fields, policies, supports, capabilities, maps, treatments, `ctaMode`, aliases, deltas e payloads inválidos;
- rejeita form;
- valida alt text, cardinalidade, texto vazio após normalização, valor exatamente em `absoluteMax`, valor acima de `absoluteMax` e ausência de bloqueio pelos intervalos recomendados;
- comprova imutabilidade, independência das FAQs, cálculo dos quatro estados de lifecycle, ausência de colisão, preservação dos exports e subconjunto de canais frente a `primary_conversion_channel`.

Parada:

- arquivo/export/dependency/regra não listado retorna ao Estrategista;
- banco, rota, renderer, composição, persistência, tracking ou mudança destrutiva bloqueia;
- sem merge ou fase futura automática.

### 4.2. Próxima ação

- Plano v2 aprovado humanamente neste patch final.
- Criar branch de implementação manual comparativa a partir do head atualizado de `codex-app/e18-5-v2-processo-atual`.
- Abrir PR draft dessa branch com base `codex-app/e18-5-v2-processo-atual`.
- Orientar o Executor a executar exclusivamente a fase 3.1 nessa nova branch.
- Manter PR #577, PR #585 e o novo PR sem merge durante a comparação com o workflow automatizado.
- Após as duas entregas, comparar aderência, qualidade, escopo, testes, retrabalho e decisões implícitas antes de escolher ou reconciliar a solução final.

## 5. Validação e encerramento

### 5.1. Validação documental

- três pareceres iniciais e reavaliação final do Analista consolidados;
- única fase, `Automação: não`;
- topologia, API, copy, funil, limites, lifecycle efetivo, erros, testes e fluxo experimental definidos;
- sem fase administrativa.

Nesta consolidação:

- `npm ci`: N/A;
- `npm run check`: N/A;
- `git diff --check`: obrigatório no ambiente local antes da entrega final.

### 5.2. Regras de parada

- encerrar E18.5 após implementação aprovada;
- não criar variante, field, treatment, policy, capability ou delta sem consumidor;
- não antecipar renderer, composição, geração, persistência ou tracking;
- implementação técnica não equivale a validação comercial;
- `prod#17` é referência, não certificação;
- parar se alteração sair dos arquivos, branch ou fase ou houver merge sem decisão humana.
