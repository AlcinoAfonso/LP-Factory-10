14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/template-blueprint.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase dos itens ativos de `lp_sections`, `lib/conversion-content/landing-page/`, PRs #559, #563, #564, #566, #567 e #577, avaliações do Analista e decisões humanas de 14 e 15/07/2026.

Versão: v1 em ajuste.

Status: PR vivo para debate; grade inicial de nove módulos definida a partir de `Corretor Imóveis`, `audience_scope = end_customer`, `lp_sections` v1 ativa; os contratos serão fechados um a um antes da avaliação única dos especialistas; nenhuma implementação autorizada.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Pré-requisitos confirmados

- A E18.4 está concluída e a parametrização raiz v1 existe em `lib/conversion-content/landing-page/`.
- A raiz possui registry versionado, schema estrito, resolver fail-closed, saída imutável, papéis semânticos, limites, critérios visuais e presets.
- A raiz v1 não garante `body.editorialEmphasis` em todos os presets:
  - `balanced` possui o tratamento;
  - `compact` não possui;
  - o contrato compartilhado o mantém opcional.
- O subtítulo do Hero deve usar maior ênfase por padrão, sem fallback automático para `body.base`.
- A garantia exige evolução versionada da raiz em recorte e PR próprios, preservando a `rootVersion 1`.
- A consulta ao banco confirmou como fonte estrutural principal:
  - taxon: `Corretor Imóveis`;
  - nível: `niche`;
  - público: `end_customer`;
  - bloco: `lp_sections`;
  - versão 1 ativa.
- O ultranicho `Corretor de imóveis de médio padrão` será somente fonte complementar posterior.
- Os módulos serão transversais e reutilizáveis dentro da família `landing_page`; não representarão nicho, profissão, campanha ou conteúdo concreto.
- A precedência permanece `raiz → módulo → variante`.
- `commercial_activation`, E18.2 e E18.3 permanecem preservados.

### 1.2. Estado processual

- O plano-base v1 e o PR #577 já existem.
- As decisões do debate são incorporadas no mesmo PR; não criar arquivo paralelo.
- A v1 permanecerá aberta até definir, um a um, os nove módulos e suas variantes iniciais.
- Para cada módulo, fechar:
  - função estrutural;
  - campos e cardinalidades;
  - herança e exceções;
  - variante inicial e deltas;
  - fontes de copy;
  - perfis BOFU, MOFU e TOFU;
  - lifecycle e limites.
- O Hero é o módulo-piloto; os demais seguem a ordem da grade inicial.
- Depois da grade completa, o plano será dividido em fases executáveis específicas.
- A avaliação única do Analista, Gestor Estrutural e Gestor de Updates ocorrerá somente com a v1 estável.
- A v2 será consolidada no mesmo PR após os pareceres.
- O Executor só poderá ser instruído após o merge humano da evolução da raiz e da v2 do PR #577.

### 1.3. Princípio canônico de herança

- A raiz contém regras comuns da família.
- O módulo declara apenas função estrutural, campos, cardinalidades, fontes, políticas e exceções justificadas.
- O módulo não repete valores concretos da raiz.
- A variante registra somente deltas fechados sobre campos já previstos.
- A composição futura pode selecionar por ocorrência apenas opções previamente autorizadas.
- O resolver aplica a precedência e entrega contrato efetivo completo e imutável.
- E20, E19, geração e renderer não podem reaplicar a herança.
- O renderer executa o contrato resolvido; não escolhe fallback.

### 1.4. Regras de exceção

- Campo sem exceção herda a raiz.
- Módulo pode restringir ou selecionar capacidades da raiz quando sua função justificar.
- Variante pode restringir o módulo quando houver mudança reutilizável de execução ou comportamento.
- Escolha por ocorrência já autorizada não cria variante.
- Módulo ou variante não pode ampliar limite técnico absoluto.
- Necessidade acima do limite deve avaliar antes revisão de texto, divisão de conteúdo, mudança semântica ou nova estrutura.
- Diferença apenas de taxon, conteúdo, campanha, conta, tráfego, funil ou composição não cria módulo nem variante.

### 1.5. Decisões técnicas incorporadas

- Cardinalidade substitui propriedade `required` separada.
- Não haverá `structuralRules` aberto nem `addedFields` livre.
- Campo novo exige nova versão do contrato do módulo.
- Comportamento estrutural, quando necessário, será união fechada.
- O consumidor não recebe operações de delta para aplicar.
- A grade inicial v1 possui nove módulos candidatos:
  - `hero`, derivado de `hero_segmentado`;
  - `trust_bar`, derivado de `barra_de_confianca`;
  - `problem_solution`, derivado de `dores_e_solucoes`;
  - `offer`, derivado de `servicos_por_intencao`;
  - `process`, derivado de `processo_de_atendimento`;
  - `technical_assurance`, derivado de `prova_tecnica_documental`;
  - `social_proof`, derivado de `prova_social`;
  - `faq`, derivado de `faq_objeções`;
  - `final_cta`, derivado de `cta_final_qualificado`.
- Os `item_key` de `lp_sections` são evidência da função, não identidade permanente do módulo.
- Cada candidato só será aprovado após confirmar função reutilizável e diferença real em relação aos demais.
- `formato_curto`, `formato_medio` e `formato_longo` orientam composição e extensão; não são módulos nem variantes.
- O catálogo inicial fica limitado a nove módulos; ampliação exige decisão posterior.
- Para `hero.subtitle`:
  - `semanticRole = paragraph`;
  - padrão: `body.editorialEmphasis`;
  - alternativa autorizada: `body.base`;
  - ausência da capability falha fechado;
  - E20 poderá selecionar a alternativa por ocorrência.
- `hero.media_split` não está aprovada.
- `hero.standard` é a única variante inicial aprovada do Hero.

### 1.6. Estado técnico confirmado

- Boundary atual: `lib/conversion-content/landing-page/`.
- Namespace público: `landingPageRoot`.
- Ainda não existem catálogo de módulos, variantes, composição, renderer ou render model de `landing_page`.
- A E18.5 será repo-only.
- A leitura dos itens estruturados serve como evidência; este recorte não altera banco.
- Composição e seleção por ocorrência pertencem à E20.
- Geração, snapshot e persistência por conta pertencem à E19.
- `account_landing_pages` não será alterada.

### 1.7. Pontos ainda em debate

- Confirmação individual dos oito módulos restantes.
- Campos, cardinalidades e papéis semânticos de cada módulo.
- Variante inicial e deltas de cada módulo.
- Critério mínimo para nova variante e exceção estrutural.
- Mapas de fontes de copy.
- Perfis BOFU, MOFU e TOFU.
- Lifecycle inicial.
- Critério de promoção de `experimental` para `validated`.
- Divisão final em fases executáveis.

## 2. Contrato do caso

### 2.1. Problema

- A raiz existe, mas ainda faltam contratos aprovados para módulos, variantes, campos, fontes, perfis de funil e lifecycle.
- Os nove itens estruturais do primeiro recorte não podem virar módulos automaticamente.
- O catálogo precisa generalizar funções reais sem transportar identidade imobiliária.
- A raiz v1 não garante o tratamento editorial exigido pelo Hero.
- Repetição de valores da raiz ou deltas aplicados por consumidores criaria múltiplas fontes da verdade.
- Fallback para `body.base` esconderia capability ausente.

### 2.2. Resultado esperado

- Criar catálogo repo-only versionado com nove módulos transversais.
- Usar `Corretor Imóveis`, `end_customer`, `lp_sections` v1 ativa como evidência estrutural principal.
- Confirmar cada módulo e variante inicial individualmente.
- Resolver `raiz → módulo → variante` em contrato final imutável.
- Definir fontes somente com `item_key` oficiais.
- Separar pesquisa orientadora de valores factuais operacionais.
- Tratar BOFU, MOFU e TOFU como perfis, não variantes.
- Preservar versões históricas.
- Não criar banco, composição, geração ou renderer.

### 2.3. Fonte e critério para parametrização

Ordem de evidência:

1. parametrização raiz;
2. `docs/lp-planejamento.md`;
3. itens estruturados oficiais;
4. Blueprints e referências reais;
5. decisão interna de produto;
6. LP real validada.

Regras específicas:

- A grade inicial usa `Corretor Imóveis`, `end_customer`, `lp_sections` v1 ativa.
- O ultranicho de médio padrão não restringe o catálogo transversal.
- Item de `lp_sections` não cria módulo automaticamente.
- Módulo exige função estrutural reutilizável ainda não coberta.
- Variante exige mudança reutilizável de estrutura, execução ou comportamento.
- Conteúdo, parâmetro herdado, escolha de ocorrência, composição, fonte, funil ou valor operacional não criam variante.
- Identidade do módulo não pode carregar taxon, profissão ou campanha.
- Itens de extensão de página não pertencem ao catálogo.

### 2.4. Identidade e versionamento previstos

- `family = landing_page`.
- `rootVersion` será a versão que garanta as capabilities requeridas.
- `moduleCatalogVersion = 1`.
- Grade candidata de `moduleKey`:
  - `hero`;
  - `trust_bar`;
  - `problem_solution`;
  - `offer`;
  - `process`;
  - `technical_assurance`;
  - `social_proof`;
  - `faq`;
  - `final_cta`.
- O registry será explícito e imutável por versão.
- Módulo: chave, versão, lifecycle, função e catálogo de campos.
- Variante: chave, versão, módulo, lifecycle e deltas fechados.
- Não haverá versão ou catálogo implícito nem fallback silencioso.

### 2.5. Contrato-base de campo

Cada campo declara:

- `fieldKey`;
- `semanticRole`;
- `cardinality`;
- `copySourceMap`;
- `operationalValuePolicy`.

Quando aplicável:

- `defaultTypographyTreatment`;
- `allowedTypographyTreatments`.

Regras:

- papéis e tratamentos devem existir na raiz;
- cardinalidade contém somente `min` e `max`;
- nenhum valor concreto da raiz é copiado;
- exceção de faixa ou limite deve ser justificada e só pode restringir o teto herdado;
- tratamento padrão deve pertencer à lista permitida;
- capability ausente falha fechado;
- fato operacional não pode ser preenchido como fato por pesquisa.

### 2.6. Contrato de variante

Deltas permitidos quando aprovados:

- cardinalidade;
- remoção de campo opcional;
- ativação de campo previsto;
- restrição de faixa ou limite;
- restrição de tratamentos permitidos;
- comportamento estrutural enumerado.

Deltas proibidos:

- campo livre;
- papel ou tratamento desconhecido;
- ampliação de limite;
- regra arbitrária;
- taxon, campanha ou conteúdo;
- valor de conta ou composição;
- URL, classe ou componente visual concreto.

O resolver valida o delta e retorna somente o contrato final.

### 2.7. Módulo-piloto `hero`

#### 2.7.1. Função estrutural

- Apresentar o recorte da LP, a proposta de valor e a principal ação.
- A evidência inicial é `hero_segmentado`, sem transportar para o contrato as intenções ou a profissão do recorte.
- Não representa taxon, campanha, tráfego, funil ou composição.

#### 2.7.2. Catálogo fechado de campos proposto

- `eyebrow`: `eyebrow`, `{ min: 0, max: 1 }`.
- `title`: `h1`, `{ min: 1, max: 1 }`.
- `subtitle`: `paragraph`, `{ min: 1, max: 1 }`, padrão `body.editorialEmphasis`, permitidos `body.editorialEmphasis` e `body.base`.
- `primaryCta.label`: `cta_label`, `{ min: 1, max: 1 }`.
- `secondaryCta.label`: `cta_label`, `{ min: 0, max: 1 }`.
- `proofShort`: `paragraph`, `{ min: 0, max: 1 }`.
- `media`: referência abstrata, `{ min: 0, max: 1 }`.

#### 2.7.3. Herança e exceções

- Campos textuais herdam faixas, limites e valores da raiz.
- Não há tamanho, limite ou spacing próprio.
- `subtitle` permanece `paragraph` e usa tratamento da raiz.
- `body.base` é alternativa explícita, não fallback.
- Mídia opcional não comprova variante.

#### 2.7.4. Variante inicial definida

- `hero.standard` usa o contrato-base, mantém mídia opcional e não possui delta numérico.
- É a única variante inicial aprovada do Hero.
- `hero.media_split` permanece rejeitada.
- Troca isolada para `body.base` não cria variante.
- Variante específica de nicho é proibida.

### 2.8. `copy_source_map`

- Cada referência declara público, bloco, `itemKey` e papel primário ou auxiliar.
- Cada campo usa até duas fontes primárias e uma auxiliar.
- Copy para visitante usa `end_customer` como fonte primária.
- `business_buyer` pode auxiliar somente autoridade, processo, posicionamento ou prova institucional.
- `strategic_core` e `seo` fornecem insumos factuais de pesquisa.
- `lp_overview` orienta transformação.
- `lp_sections` comprova funções estruturais, mas não vira fonte fixa de copy.
- Chave desconhecida e fato operacional inferido falham fechado.

Mapa inicial do Hero:

- `title`: `positioning_opportunity`, `desire`; auxiliar `commercial_keywords`.
- `subtitle`: `pain`, `desire`; auxiliar `belief`.
- CTAs: `trigger`; auxiliar `search_intent`.
- `proofShort`: `proof_type`; auxiliar `objection`.

### 2.9. `funnel_copy_profile`

- Perfis: `bofu`, `mofu`, `tofu`.
- Perfil orienta transformação, sem alterar schema, cardinalidade, limite ou estrutura.
- Módulo adapta o perfil à função.
- Variante apenas restringe ou especializa tratamento permitido.
- Hero:
  - BOFU: recorte específico, benefício sustentado, objeção direta e CTA de maior intenção;
  - MOFU: diferenciação, explicação, prova contextual e CTA proporcional;
  - TOFU: contexto, dor e desejo, baixa pressão e CTA de baixa fricção.

### 2.10. Tratamentos comerciais

- Promessa, prova, autoridade, credencial, comparação, preço, oferta, desconto, garantia, urgência, escassez, resultado, depoimento e métrica exigem fonte real aplicável.
- Pesquisa não fornece como fato preço, condição, prazo, disponibilidade, garantia, credencial, depoimento, métrica, contato, endereço, URL ou informação legal específica.
- Valor factual exige entrada operacional futura.
- TOFU não admite pressão artificial.

### 2.11. Lifecycle e compatibilidade

- Lifecycle: `candidate`, `experimental`, `validated`, `deprecated`.
- `candidate` não entra em composição ou geração.
- `experimental` serve a teste controlado.
- `validated` exige LP real e decisão humana.
- `deprecated` não entra em novo uso, mas permanece resolvível.
- Propósitos: `controlled_test`, `new_use`, `historical_read`.
- Versões efetivas serão preservadas em snapshot futuro.

### 2.12. Contrato de resolução previsto

Resolver previsto: `resolveLandingPageModuleVariant(...)`.

Entrada:

- `rootVersion`;
- `moduleCatalogVersion`;
- `moduleKey`;
- `variantKey`;
- `purpose`.

Processamento:

1. resolver raiz;
2. validar compatibilidade;
3. resolver módulo;
4. validar referências;
5. validar variante;
6. aplicar precedência;
7. calcular contrato final;
8. validar lifecycle;
9. retornar resultado imutável.

A saída contém identidades, versões, lifecycle, função, campos, cardinalidades, papéis, fontes, políticas, tratamentos e limites efetivos; não contém deltas ou fallback para o consumidor.

### 2.13. Artefatos previstos

Após a evolução da raiz e o merge da v2:

- `lib/conversion-content/landing-page/module-catalog/contracts.ts`;
- `registry.ts`;
- `schema.ts`;
- `resolver.ts`;
- `validation-cases.ts`;
- `index.ts`.

Ajustar somente `lib/conversion-content/index.ts`, `package.json` e o estado deste plano.

Preservar `landingPageRoot`, versões históricas e `commercial_activation`.

Interface prevista: `landingPageModules`.

Script previsto: `validate:landing-page-modules`.

### 2.14. Validações mínimas previstas

- Catálogo e versões válidos.
- Exatamente nove módulos aprovados.
- Nenhum módulo carrega identidade de taxon.
- Compatibilidade e capabilities da raiz validadas.
- Referência, tratamento, módulo, variante ou campo desconhecido falha.
- Tratamento padrão deve estar na lista permitida.
- Ausência de `body.editorialEmphasis` e fallback automático falham.
- Cardinalidade, faixa, limite e comportamento inválidos falham.
- Valor da raiz não é duplicado.
- Fontes excedentes ou `itemKey` desconhecido falham.
- `business_buyer` indevido e fato operacional inferido falham.
- Lifecycle incompatível falha.
- Resultado é profundamente imutável.
- Versão antiga permanece resolvível.
- Sem imports de banco, Supabase, env, API, renderer, rota ou Admin.

### 2.15. Fluxo operacional

- Gatilho:
  - evolução da raiz mergeada;
  - plano v2 mergeado;
  - fase instruída.
- Entrada:
  - raiz compatível;
  - plano E18.5;
  - nove módulos aprovados;
  - `item_key` oficiais.
- Processamento:
  - contratos, registry, schema, resolver, deltas, mapas, perfis, lifecycle e casos executáveis.
- Validação:
  - `npm ci`;
  - `npm run validate:landing-page-root`;
  - `npm run validate:landing-page-modules`;
  - `npm run validate:commercial-activation`;
  - `npm run check`;
  - `git diff --check`;
  - checks do PR.
- Persistência: repositório, sem banco.
- Consumo: E20 e E19 futuramente.
- Fallback: falha fechada.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Catálogo versionado de módulos e variantes v1

- Status:
  - pendente;
  - bloqueada até fechar a grade, mergear a evolução da raiz e consolidar a v2.
- Automação: não.
- Risco: médio controlado.
- Objetivo: implementar o contrato repo-only dos nove módulos e variantes iniciais.
- Critérios de aceite:
  - nove módulos transversais;
  - nenhuma duplicação da raiz;
  - compatibilidade e capability validadas;
  - `hero.subtitle` com ênfase padrão e alternativa explícita;
  - catálogo imutável e resolver fail-closed;
  - nenhum taxon, composição, banco, renderer ou geração.
- Próxima ação:
  - debater `trust_bar` e sua variante inicial;
  - seguir módulo por módulo na ordem da grade;
  - dividir depois em fases executáveis;
  - concluir a evolução da raiz;
  - realizar avaliação única dos especialistas;
  - consolidar v2 e solicitar merge humano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Implementação da evolução da raiz no PR #577.
- Valores concretos da nova raiz.
- Módulos identificados por corretor, imóveis, médio padrão ou outro taxon.
- Implementação específica dos taxons usados como evidência.
- Catálogo de entradas, valores reais, taxonomia ou resolução de pesquisas.
- Composição, ordem global, prontidão de taxon ou conta de teste.
- Geração, IA, prompt, schema final, renderer, render model ou publicação.
- Tracking, analytics, teste A/B, Admin, Builder ou editor visual.
- Banco, migration, RPC, policy, grant, trigger, storage ou upload.
- CRM, webhook, job, agente, automação, workflow ou nova infraestrutura.
- Nova dependência, bundler ou alteração em `commercial_activation`.

### 4.2. Critérios de parada

Parar se:

- a raiz compatível não estiver mergeada ou não garantir a capability;
- surgir fallback automático;
- módulo ou variante depender do taxon usado como evidência;
- surgir necessidade de banco, composição, geração ou renderer;
- faltar `item_key` oficial;
- diferença puder ser atendida por conteúdo, parâmetro ou composição;
- houver ampliação de limite absoluto;
- houver conflito com E18.4, E20, E19 ou `commercial_activation`;
- surgir nova dependência ou artefato fora do escopo;
- preservação histórica não puder ser garantida.

### 4.3. Decisão atual

- PR #577 preservado e plano-base mantido em v1.
- Fonte principal: `Corretor Imóveis`, `end_customer`, `lp_sections` v1 ativa.
- Fonte complementar: `Corretor de imóveis de médio padrão`.
- Grade inicial limitada a:
  - `hero`;
  - `trust_bar`;
  - `problem_solution`;
  - `offer`;
  - `process`;
  - `technical_assurance`;
  - `social_proof`;
  - `faq`;
  - `final_cta`.
- Os módulos serão transversais e reutilizáveis na família `landing_page`.
- `formato_curto`, `formato_medio` e `formato_longo` não são módulos.
- Hero e `hero.standard` estão fechados para a v1.
- `body.editorialEmphasis` é padrão; `body.base` é alternativa explícita; fallback é proibido.
- A implementação permanece bloqueada.
- Próxima decisão humana: contrato e variante inicial de `trust_bar`.
