19/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat; `README.md`; `AGENTS.md`; `docs/prompt-estrategista.md`; `docs/prompt-executor.md`; `docs/gestor-estrutural.md`; `docs/roadmap.md`; `docs/base-tecnica.md`; `docs/schema.md`; `docs/lp-planejamento.md`; planos E18.4 e E20.2; Blueprint; prompt de itens estruturados; catálogos de updates; `lib/conversion-content/landing-page/index.ts`; `lib/conversion-content/landing-page/root-schema.ts`; pareceres do Analista, Gestor Estrutural e Gestor de Updates e reavaliação final do Analista de 19/07/2026.

Versão: v2 consolidada com patch final do Analista.

Status: plano-base aprovado humanamente em 19/07/2026 para implementação manual comparativa, fase a fase, das subseções 18.5.3 a 18.5.9 em branch filha própria; PR #585 permanece documental, draft e sem merge durante o experimento.

Path: `docs/lousa-plano-base-e18-5.md`.

Branches:

- v1 e PR #577 congelados em `docs/e18-5-modules-variants`;
- v2 somente em `codex-app/e18-5-v2-processo-atual`;
- não alterar diretamente o PR #577;
- PR #585 compara a v2 manual contra a branch congelada do PR #577;
- aprovação humana deste patch autoriza somente a criação da branch de implementação manual comparativa e o início da fase 18.5.3;
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
- fluxo experimental sem merge, com duas entregas irmãs comparadas a partir do mesmo baseline;
- execução dividida nas fases 18.5.3 a 18.5.9, alinhadas às subseções futuras previstas em `docs/lp-planejamento.md`.

Rejeitado:

- fases fora das subseções 18.5.3 a 18.5.9, variantes adicionais, banco, renderer, tracking, automação e updates de Supabase/Vercel/GitHub;
- conformidade WCAG integral e validação comportamental real;
- aliases aceitos pelo registry ou resolução pública por injeção de objetos de catálogo/raiz.

Pendente sem bloquear:

- planos técnicos futuros de E20, E19.4 e renderer.

Decisão humana de 19/07/2026:

- este patch final está aprovado;
- a implementação manual comparativa pode começar pela fase 18.5.3 em branch filha criada do head atualizado do PR #585;
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

- Todos: lifecycle hypothesis, purpose controlled_test e `rootDelta={}`.
- Suporte real conforme fields; Problem Solution sem alarmismo.
- Social Proof sem fabricação/alteração material.
- FAQ sem duplicidade ou fato sem suporte.
- Hero/Final CTA excluem form.
- Accordion valida contrato declarativo, não comportamento.
- Nenhum contrato armazena destino concreto ou taxon.

## 4. Fases e próxima ação

Regra geral:

- o plano contém todas as fases executáveis necessárias ao recorte aprovado;
- o Executor recebe somente a fase atual, uma por vez, na ordem abaixo;
- cada avanço depende de avaliação do Analista e decisão do Estrategista;
- as sete fases usam os identificadores das futuras subseções do roadmap previstos em `docs/lp-planejamento.md`;
- todas as fases têm `Automação: não`;
- `18.5.10 — Limites do recorte` não é fase executável e será materializada pelas regras de escopo negativo e parada deste plano;
- as fases usam a mesma branch e o mesmo PR draft de implementação manual comparativa, sem merge durante o experimento.

### 4.1. Fase 1 — E18.5.3 — Módulos e funções estruturais

- Automação: não.

Entregas:

- criar a base interna de `contracts.ts`, `schema.ts`, `registry.ts`, `validation-cases.ts` e o script `validate:landing-page-module-catalog`;
- registrar `family=landing_page`, `moduleCatalogVersion=1`, `compatibleRootVersions=[1]` e os nove módulos;
- definir para cada módulo `moduleKey`, `moduleVersion`, função, fronteiras, invariantes, lifecycle inicial e purpose;
- manter o catálogo parcial sem export público para consumidores até a fase 18.5.9.

Critérios:

- nove identidades de módulo exatas e sem colisão com `commercial_activation`;
- nenhum módulo contém taxon, campanha, plano, copy, ativo, ordem ou conteúdo concreto;
- funções, fronteiras e invariantes são imutáveis e fail-closed;
- nenhuma variante, field, map ou profile é antecipado como contrato público.

Validações:

- `npm ci`;
- `npm run validate:landing-page-module-catalog` com os casos desta fase;
- `npm run check`;
- `git diff --check`.

Estado da fase:

- definições estruturais do registry revisadas e ratificadas pelo Estrategista como contrato da v1;
- ajuste solicitado e implementado para proteger os valores exatos de `function`, `boundaries` e `invariants` da v1;
- fase `18.5.3` concluída e aprovada.

### 4.2. Fase 2 — E18.5.4 — Campos, estruturas e cardinalidades

- Automação: não.

Entregas:

- implementar a gramática fechada de `fieldKind`, policies, supports e cardinalidades;
- implementar os shapes de `text`, `collection`, `action`, `image` e `reference`;
- definir os paths e contratos de fields previstos para os nove módulos, ainda sem publicar variantes;
- criar a base do `payload-validator.ts` para keys, tipos, cardinalidades e shapes.

Critérios:

- somente literais aprovados são aceitos;
- coleção aninhada, path desconhecido, combinação inválida ou field adicional falha fechado;
- ação não armazena destino concreto;
- imagem informativa/decorativa e `evidenceRef` seguem os shapes fechados;
- o catálogo continua sem API pública consumível.

Validações:

- casos positivos e negativos de todos os `fieldKind`;
- cardinalidades mínimas e máximas;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

Estado da fase:

- fase `18.5.4` concluída e aprovada;
- fase `18.5.5` concluída e aprovada;
- fase `18.5.6` concluída e aprovada;
- fase `18.5.7` em execução;
- PR experimental permanece draft e sem merge.

### 4.3. Fase 3 — E18.5.5 — Variantes e critérios de criação

- Automação: não.

Entregas:

- registrar as nove variantes `standard@v1` e `faq.accordion@v1`;
- vincular os fields definidos na fase anterior às dez variantes;
- implementar `primary_action`, `image_asset` e `accordion_interaction`;
- usar FAQ Standard e Accordion como prova inicial de duas variantes do mesmo módulo.

Critérios:

- cada variante pertence a um único módulo e versão compatível;
- FAQ Accordion possui contrato próprio, sem herança semântica da FAQ Standard;
- diferenças de taxon, copy, plano, campanha, ativo, ordem ou quantidade não criam variante;
- `form` permanece incompatível com Hero e Final CTA;
- capability desconhecida falha fechado.

Validações:

- resolução interna das dez identidades;
- independência das duas FAQs;
- contrato declarativo WCAG 2.2 do Accordion;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

### 4.4. Fase 4 — E18.5.6 — Especializações sobre a parametrização raiz

- Automação: não.

Entregas:

- integrar internamente `resolveLandingPageRootParameters` pelo boundary público;
- reexportar de forma aditiva `normalizeLandingPageRootText` e `countLandingPageRootTextCharacters` no namespace da raiz;
- manter `rootDelta={}` em todos os módulos e variantes da v1;
- aplicar no payload validator o `absoluteMax` do `semanticRole` resolvido.

Critérios:

- nenhuma importação direta de `root-registry.ts`;
- nenhuma duplicação de roles, ranges, limits, spacing, presets ou algoritmos de texto;
- texto vazio após normalização ou acima de `absoluteMax` falha fechado;
- faixas recomendadas não causam rejeição automática;
- qualquer chave em `rootDelta` é inválida na v1.

Validações:

- valor exatamente em `absoluteMax` aceito;
- valor acima de `absoluteMax` rejeitado;
- intervalos recomendados não bloqueiam;
- erro da raiz convertido em `ROOT_RESOLUTION_FAILED`;
- `npm run validate:landing-page-module-catalog`;
- validação existente da raiz;
- `npm run check`;
- `git diff --check`.

### 4.5. Fase 5 — E18.5.7 — Mapa de fontes de copy

- Automação: não.

Entregas:

- implementar os `copySourceMap` literais da seção 2.4;
- usar paths exatos de fields, 1–2 `primaryItemKeys` e até 1 `auxiliaryItemKey`;
- separar `sourceMode=research` de `sourceMode=operational_evidence`.

Critérios:

- todos os paths existem na variante correspondente;
- todos os `item_key` pertencem aos conjuntos estruturados permitidos;
- Social Proof preserva quote e attribution como evidência operacional;
- path, source mode, item key ou quantidade desconhecida falha fechado.

Validações:

- casos de todos os paths mapeados;
- excesso de fontes, item key inválido e map órfão rejeitados;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

### 4.6. Fase 6 — E18.5.8 — Perfis de copy por intenção e funil

- Automação: não.

Entregas:

- implementar os profiles BOFU, MOFU e TOFU com treatments e `ctaMode` literais;
- implementar os deltas aprovados por módulo e o mesmo delta para as duas FAQs;
- impedir categorias ou aliases como valores de registry.

Critérios:

- cada treatment aparece exatamente uma vez entre `allowed`, `restricted` e `prohibited`;
- `ctaMode` corresponde ao action treatment definido;
- deltas somente restringem, proíbem ou enfatizam tratamentos conhecidos;
- suporte factual continua obrigatório quando aplicável;
- alias, treatment ou `ctaMode` desconhecido falha fechado.

Validações:

- profiles completos dos três estágios;
- deltas dos nove módulos e dez variantes;
- conflitos e treatments ausentes/duplicados rejeitados;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

### 4.7. Fase 7 — E18.5.9 — Ciclo de vida, compatibilidade e validação

- Automação: não.

Entregas:

- finalizar `resolver.ts`, `payload-validator.ts` e `index.ts`;
- implementar as assinaturas públicas da seção 2.6;
- retornar os lifecycles de raiz, módulo, variante e o lifecycle efetivo;
- adicionar o namespace público `landingPageModuleCatalog` em `lib/conversion-content/index.ts`;
- fechar compatibilidade, erros, imutabilidade e matriz integrada de não regressão.

Critérios:

- resolver usa registries canônicos internamente, sem injeção pública e sem fallback;
- versões, identidades, root compatibility e lifecycles inválidos falham fechado;
- resultado e registry são profundamente imutáveis;
- `primary_action.allowedValues` é subconjunto do enum público `primary_conversion_channel` em teste;
- nenhum consumidor ou família preservada é alterado além dos exports aditivos aprovados;
- o namespace público somente é liberado nesta fase, após o catálogo completo ser válido.

Validações:

- resolução pública das dez variantes;
- matriz completa de erros, payloads, lifecycles, compatibilidade, imutabilidade e canais;
- validações existentes de root, pesquisa, input catalog e commercial activation;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

Parada comum a todas as fases:

- arquivo, export, dependência ou regra não listado retorna ao Estrategista;
- banco, rota, renderer, composição, persistência, tracking ou mudança destrutiva bloqueia;
- o Executor não inicia a fase seguinte sem avaliação do Analista e decisão do Estrategista;
- sem merge ou avanço automático durante a comparação.

### 4.8. Próxima ação

- Plano v2 permanece aprovado humanamente, agora com a execução corrigida para sete fases.
- Criar branch de implementação manual comparativa a partir do head atualizado de `codex-app/e18-5-v2-processo-atual`.
- Abrir PR draft dessa branch com base `codex-app/e18-5-v2-processo-atual`.
- Orientar o Executor somente para a fase 18.5.3.
- Após a entrega, submeter a fase ao Analista e decidir entre avançar para 18.5.4, ajustar ou bloquear.
- Repetir o fluxo, uma fase por vez, até 18.5.9.
- Manter PR #577, PR #585 e o PR de implementação sem merge durante a comparação com o workflow automatizado.
- Após as duas entregas completas, comparar aderência, qualidade, escopo, testes, retrabalho e decisões implícitas antes de escolher ou reconciliar a solução final.

## 5. Validação e encerramento

### 5.1. Validação documental

- três pareceres iniciais e reavaliação final do Analista consolidados;
- sete fases executáveis, todas com `Automação: não`;
- fases 18.5.3 a 18.5.9, topologia, API, copy, funil, limites, lifecycle efetivo, erros, testes e fluxo experimental definidos;
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
