19/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat; `README.md`; `AGENTS.md`; `docs/prompt-estrategista.md`; `docs/prompt-executor.md`; `docs/gestor-estrutural.md`; `docs/roadmap.md`; `docs/base-tecnica.md`; `docs/schema.md`; `docs/lp-planejamento.md`; planos E18.4 e E20.2; Blueprint; prompt de itens estruturados; catálogos de updates; boundary `landing_page`; pareceres do Analista, Gestor Estrutural e Gestor de Updates de 19/07/2026.

Versão: v2 consolidada.

Status: nove módulos, nove `standard@v1`, `faq.accordion@v1`, contrato compartilhado e fase executável fechados; implementação não autorizada.

Path: `docs/lousa-plano-base-e18-5.md`.

Branches:

- v1 e PR #577 congelados em `docs/e18-5-modules-variants`;
- v2 somente em `codex-app/e18-5-v2-processo-atual`;
- não alterar diretamente o PR #577;
- merge e execução exigem decisão humana.

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
- `prod#17` apenas como referência declarativa.

Rejeitado:

- novas fases/variantes, banco, renderer, tracking, automação e updates de Supabase/Vercel/GitHub;
- conformidade WCAG integral e validação comportamental real.

Pendente sem bloquear:

- planos técnicos futuros de E20, E19.4 e renderer.

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

- text aceita research/hybrid/operational;
- collection/action usam `not_copy`;
- image/reference usam `technical_reference`;
- operational exige `when_present`;
- texto visível exige semantic role da raiz;
- desconhecido ou combinação inválida falha fechado.

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
  - Hero e Final CTA;
  - binding `primary_conversion_channel`;
  - allowed `whatsapp|phone|email|external_url`;
  - `form` incompatível.
- `image_asset`:
  - somente Hero;
  - modes/alt conforme imagem.
- `accordion_interaction`:
  - somente FAQ Accordion;
  - all closed, single expansion, toggle próprio, teclado, estado exposto, associação e foco preservado;
  - foco visível e baseline herdados da raiz;
  - validação somente declarativa.

Nenhuma outra capability integra v1.

### 2.4. `copySourceMap`

Shape:

- pesquisa: `sourceMode=research`, 1–2 `primaryItemKeys`, 0–1 `auxiliaryItemKey`;
- operacional: `sourceMode=operational_evidence`, sem item key;
- desconhecido ou excesso falha fechado.

Mappings:

- Hero:
  - eyebrow `[positioning_opportunity]` + `search_intent`;
  - title `[positioning_opportunity, desire]` + `commercial_keywords`;
  - subtitle `[pain, desire]` + `belief`;
  - CTA label `[trigger]` + `search_intent`;
  - proofShort `[proof_type]` + `objection`.
- Trust Bar:
  - item text `[proof_type, belief]` + `objection`.
- Problem Solution:
  - title `[pain, desire]` + `positioning_opportunity`;
  - problem `[pain, fear]` + `objection`;
  - solution `[positioning_opportunity, desire]` + `belief`.
- Offer:
  - title `[desire, trigger]` + `positioning_opportunity`;
  - itemTitle `[trigger, desire]`;
  - description `[positioning_opportunity, belief]` + `objection`.
- Process:
  - title `[belief, desire]` + `positioning_opportunity`;
  - stepTitle `[trigger, positioning_opportunity]` + `desire`;
  - stepBody `[belief, desire]` + `objection`.
- Technical Assurance:
  - title `[proof_type, belief]` + `objection`;
  - assuranceTitle `[proof_type]` + `belief`;
  - assuranceBody `[proof_type, positioning_opportunity]` + `objection`.
- Social Proof:
  - title `[proof_type, belief]` + `objection`;
  - quote/attribution operacionais.
- FAQ Standard/Accordion:
  - title `[objection, awareness_level]` + `search_intent`;
  - question `[objection, fear]` + `faq_questions`;
  - answer `[belief, positioning_opportunity]` + `desire`.
- Final CTA:
  - title `[trigger, desire]` + `positioning_opportunity`;
  - body `[desire, objection]` + `belief`;
  - CTA label `[trigger]` + `search_intent`.

### 2.5. `funnelCopyProfile`

Stages:

- `bofu`, `mofu`, `tofu`.

Treatments:

- actions: `direct_action`, `qualified_action`, `low_friction_action`;
- content: `educational_context`, `problem_emphasis`, `offer_specificity`;
- factual: `proof`, `comparison`, `price`, `promise`, `credential`, `authority`, `urgency`, `scarcity`, `guarantee`.

Regras:

- profile contém allowed/restricted/prohibited e `ctaMode`;
- prohibited vence restricted; restricted vence allowed;
- restricted exige field compatível e suporte;
- módulo só restringe ou enfatiza algo permitido;
- treatment desconhecido falha fechado.

Padrão:

- BOFU:
  - allowed actions, context, problem, offer;
  - factual restricted;
  - `ctaMode=direct`.
- MOFU:
  - allowed qualified/low-friction, context, problem, offer;
  - direct e factual restricted;
  - `ctaMode=qualified`.
- TOFU:
  - allowed low-friction, context, problem;
  - qualified/offer/proof/credential/authority restricted;
  - direct/comparison/price/promise/urgency/scarcity/guarantee prohibited;
  - `ctaMode=low_friction`.

Deltas:

- Hero: CTA do stage; proof só em `proofShort`; preço/comparação/garantia/urgência/escassez proibidos.
- Trust Bar: somente proof/credential/authority com suporte; ação e demais tratamentos comerciais proibidos.
- Problem Solution: problem/context; sem ação, prova comercial, preço, urgência, escassez, garantia ou alarmismo.
- Offer: oferta real; sem ação, preço, comparação, promessa, urgência, escassez ou garantia.
- Process: context; sem ação, prova, preço, comparação, promessa, urgência, escassez ou garantia.
- Technical Assurance: context; proof/credential/authority restritos a suporte; demais tratamentos comerciais proibidos.
- Social Proof: somente prova operacional; quote/attribution gerada ou alterada é inválida.
- FAQ: context/objection; sem ação, oferta, preço, comparação, promessa, urgência, escassez ou garantia; Accordion usa o mesmo delta.
- Final CTA: somente ação do stage; treatments factuais e de oferta proibidos.

### 2.6. Lifecycle, compatibilidade, API e erros

Lifecycle:

- `hypothesis`, `validated`, `deprecated`;
- módulo/variante começam hypothesis, `purpose=controlled_test`;
- não avançam além da raiz;
- validated exige raiz validada, LP real, revisão e decisão humanas;
- deprecated bloqueia nova composição e preserva histórico;
- raiz depreciada torna cadeia inelegível sem mutar filhos.

Referência completa:

- `family`, `moduleCatalogVersion`, `rootVersion`, `moduleKey`, `moduleVersion`, `variantKey`, `variantVersion`;
- incompatibilidade falha fechado.

Resolver:

- `resolveLandingPageModuleVariant`;
- input: catálogo, raiz, preset opcional e referência completa;
- resolve raiz, valida catálogo/compatibilidade e seleciona sem fallback;
- output: identidade, root parameters, módulo, variante, fields, capabilities, map, profile, lifecycle e purpose;
- profundamente imutável.

Payload validator:

- `validateLandingPageVariantPayload`;
- referência mais `payload: unknown`;
- valida keys, tipos, cardinalidade, collection, action, image e reference;
- não valida qualidade, verdade factual, destino, renderer, composição, persistência ou snapshot.

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

- `lib/conversion-content/index.ts`:
  - adicionar namespace `landingPageModuleCatalog`;
  - preservar namespaces existentes.
- `package.json`:
  - script `validate:landing-page-module-catalog`.
- este plano:
  - somente estado/evidências/decisão da fase.

Preservados:

- `landing-page/index.ts` e arquivos root;
- `research-resolution/*`, `input-catalog/*`, `commercial-activation/*`.

API:

- `landingPageRoot` continua somente raiz;
- novo `landingPageModuleCatalog`;
- exporta types, registry, schemas necessários, resolver e validator;
- “público” é boundary TypeScript, não client/rota/API HTTP.

### 2.8. Update e fronteiras

- Aplicar `prod#17` somente como referência declarativa WCAG 2.2 no Accordion.
- Rejeitar todos os updates de Supabase, Vercel, GitHub e demais de Produto.
- E18.5 define estrutura; E20 futura escolhe composição; E19 futura produz copy/valores e snapshot; renderer futuro executa payload e acessibilidade concreta.

## 3. Contratos fechados

### 3.1. Fields por variante

- Hero:
  - eyebrow text/eyebrow `0..1`, research, none;
  - title text/h1 `1..1`, hybrid, when_factual;
  - subtitle text/paragraph `1..1`, hybrid, when_factual;
  - CTA action `1..1`, not_copy, primary_action; label text/cta_label `1..1`, hybrid, when_present;
  - proofShort text/paragraph `0..1`, hybrid, when_present;
  - media image `0..1`, technical_reference, image_asset.
- Trust Bar:
  - items collection `2..4`, not_copy;
  - text text/benefit_item `1..1`, hybrid, when_present.
- Problem Solution:
  - title text/h2 `1..1`, research, none;
  - items collection `2..4`, not_copy;
  - problem text/card_title `1..1`, research, none;
  - solution text/card_body `1..1`, hybrid, when_present.
- Offer:
  - title text/h2 `1..1`, research, none;
  - items collection `1..4`, not_copy;
  - itemTitle text/card_title `1..1`, hybrid, when_present;
  - description text/card_body `1..1`, hybrid, when_present.
- Process:
  - title text/h2 `1..1`, research, none;
  - steps ordered collection `2..6`, not_copy;
  - stepTitle text/step_title `1..1`, hybrid, when_present;
  - stepBody text/step_body `1..1`, hybrid, when_present.
- Technical Assurance:
  - title text/h2 `1..1`, research, none;
  - items collection `1..4`, not_copy;
  - assuranceTitle text/card_title `1..1`, hybrid, when_present;
  - assuranceBody text/card_body `1..1`, hybrid, when_present.
- Social Proof:
  - title text/h2 `1..1`, research, none;
  - items collection `1..3`, not_copy;
  - quote text/card_body `1..1`, operational, when_present;
  - attribution text/card_title `1..1`, operational, when_present;
  - evidenceRef reference `1..1`, technical_reference, operational_evidence.
- FAQ Standard:
  - title text/h2 `1..1`, research, none;
  - items collection `2..6`, not_copy;
  - question text/faq_question `1..1`, research, none;
  - answer text/faq_answer `1..1`, hybrid, when_factual.
- FAQ Accordion:
  - definição própria com os mesmos fields;
  - accordion_interaction;
  - sem herança semântica ou campo novo.
- Final CTA:
  - title text/h2 `1..1`, hybrid, when_factual;
  - body text/paragraph `1..1`, hybrid, when_factual;
  - CTA action `1..1`, not_copy, primary_action; label text/cta_label `1..1`, hybrid, when_present.

### 3.2. Regras comuns

- Todos: lifecycle hypothesis, purpose controlled_test e `rootDelta={}`.
- Suporte real conforme fields; Problem Solution sem alarmismo.
- Social Proof sem fabricação/alteração material.
- FAQ sem duplicidade ou fato sem suporte.
- Hero/Final CTA excluem form.
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

- `landingPageRoot` somente raiz; resolver usa API raiz;
- versões, identidades, grammar, maps, profiles, capabilities, lifecycle e compatibility estritos;
- rootDelta vazio, form rejeitado, FAQs independentes;
- Accordion somente declarativo WCAG 2.2;
- payload cobre todos field kinds; desconhecidos rejeitados;
- erros sem copy, pesquisa, PII, credenciais ou secrets;
- output profundamente imutável;
- nenhum consumidor/família preservada alterado.

Validações:

- `npm ci`;
- validações existentes de root, pesquisa, input catalog e commercial activation;
- `npm run validate:landing-page-module-catalog`;
- `npm run check`;
- `git diff --check`.

Matriz mínima:

- resolve dez variantes;
- rejeita versões, identidades, roles, fields, policies, supports, capabilities, maps, treatments, deltas e payloads inválidos;
- rejeita form;
- valida alt text e cardinalidade;
- comprova imutabilidade, independência das FAQs, ausência de colisão e preservação dos exports.

Parada:

- arquivo/export/dependency/regra não listado retorna ao Estrategista;
- banco, rota, renderer, composição, persistência, tracking ou mudança destrutiva bloqueia;
- sem merge ou fase futura automática.

### 4.2. Próxima ação

- Revisar esta v2 na branch filha.
- Não alterar o PR #577.
- Não implementar antes da aprovação humana e do ingresso da v2 na `main`.
- Após confirmação do merge aplicável, orientar somente a fase 3.1.

## 5. Validação e encerramento

### 5.1. Validação documental

- três pareceres consolidados;
- única fase, `Automação: não`;
- topologia, API, copy, funil, lifecycle, erros e testes definidos;
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