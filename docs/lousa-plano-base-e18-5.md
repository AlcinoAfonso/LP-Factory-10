14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/input-catalog/registry.ts`, PRs #559, #563, #564, #566, #567 e #577, avaliações do Analista e decisões humanas de 14, 15 e 16/07/2026.

Versão: v1 em ajuste.

Status: PR vivo para debate; grade metodológica comum registrada; `hero` e `hero.standard` permanecem como proposta consolidada com pendências; nove módulos candidatos preservados; nenhuma implementação autorizada.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Pré-requisitos confirmados

- A E18.4 está concluída e a raiz versionada existe em `lib/conversion-content/landing-page/`.
- A raiz v1 não garante `body.editorialEmphasis` em todos os presets nem possui capability fechada de visibilidade responsiva por campo.
- Ambas as necessidades exigem evolução versionada própria, preservando `rootVersion 1`.
- Fonte estrutural principal confirmada:
  - taxon `Corretor Imóveis`;
  - `taxonId = c7952d16-678c-4615-9483-a003e57d94aa`;
  - nível `niche`;
  - público `end_customer`;
  - bloco `lp_sections`;
  - versão 1 ativa.
- O ultranicho de médio padrão permanece evidência complementar.
- Módulos serão transversais; precedência: `raiz → módulo → variante`.
- `commercial_activation`, E18.2 e E18.3 permanecem preservados.

### 1.2. Estado processual

- O debate permanece no PR #577; não criar arquivo paralelo.
- Cada candidato será analisado individualmente; existência na grade não equivale a aprovação.
- Rejeição, fusão ou substituição exige justificativa e decisão humana.
- A grade comum é obrigatória, com blocos condicionais conforme a função.
- Cada módulo deve fechar identidade, evidência, fronteiras, campos, cardinalidades, policies, fontes, funil, responsividade aplicável, variante, versões, lifecycle, compatibilidades, casos da E18.5 e invariantes futuras da E19.
- O Hero é o piloto; `trust_bar` só começa após seu fechamento.
- Implementação somente após evolução da raiz, v2 estável, pareceres e merge humano.

### 1.3. Princípio canônico de herança

- A raiz contém regras comuns; módulo e variante registram apenas especializações justificadas.
- E18.5 autoriza opções; E20 seleciona por ocorrência; E19 gera e vincula valores; renderer apenas executa.
- Escolha excepcional na E20 exige decisão humana documentada, sem pressupor campo, coluna ou persistência nova.
- O resolver entrega contrato efetivo, completo, imutável e sem fallback.

### 1.4. Regras de exceção

- Escolha já autorizada por ocorrência não cria variante.
- Tipo de mídia, ativo, taxon, campanha, funil, conteúdo ou visibilidade responsiva autorizada não criam variante isoladamente.
- Módulo e variante não ampliam limite absoluto da raiz.
- Campo novo exige nova versão do módulo.

### 1.5. Decisões técnicas incorporadas

- Cardinalidade substitui `required`.
- Não haverá regras abertas nem delta livre.
- Grade candidata:
  - `hero` ← `hero_segmentado`;
  - `trust_bar` ← `barra_de_confianca`;
  - `problem_solution` ← `dores_e_solucoes`;
  - `offer` ← `servicos_por_intencao`;
  - `process` ← `processo_de_atendimento`;
  - `technical_assurance` ← `prova_tecnica_documental`;
  - `social_proof` ← `prova_social`;
  - `faq` ← `faq_objeções`;
  - `final_cta` ← `cta_final_qualificado`.
- `item_key` é evidência, não identidade canônica.
- Formatos curto, médio e longo pertencem à composição/extensão.
- `hero.subtitle`: `paragraph`, padrão `body.editorialEmphasis`, alternativa `body.base`, sem fallback.
- `hero.standard` é a única variante inicial e pode ter delta vazio.
- Canal e destino concretos de CTA permanecem fora do registry do módulo.
- Nenhum `actionRole` está aprovado sem contrato fechado.

### 1.6. Estado técnico confirmado

- Boundary: `lib/conversion-content/landing-page/`; namespace atual: `landingPageRoot`.
- Ainda não existem catálogo de módulos, composição, renderer ou render model.
- E18.5 é repo-only e não altera banco.
- O catálogo operacional já define `primary_conversion_channel` e destinos condicionais.
- E20 seleciona composição; E19 vincula valores, gera e preserva snapshot.

### 1.7. Pontos ainda em debate

- Contrato da ação secundária e eventual necessidade de `actionRole`.
- Acessibilidade de vídeo no campo `media`.
- Confirmação dos oito candidatos restantes.
- Evolução da raiz e divisão final em fases.

## 2. Contrato do caso

### 2.1. Problema

- Faltam contratos aprovados para todos os módulos e variantes.
- O catálogo deve generalizar funções sem carregar identidade imobiliária.
- CTA não pode duplicar canal/destino da E20.2.
- Mídia deve separar contrato estrutural de schema concreto da E19.
- Policies devem impedir invenção de fatos e fallback deve permanecer proibido.

### 2.2. Resultado esperado

- Catálogo repo-only, versionado e imutável.
- Grade única, com módulos aprovados individualmente.
- Separação entre pesquisa, contrato estrutural, entrada operacional, composição e conteúdo.
- BOFU, MOFU e TOFU como perfis, não variantes.
- Sem banco, composição, geração ou renderer neste recorte.

### 2.3. Hierarquia para parametrização

#### 2.3.1. Restrições normativas

- raiz vigente;
- `docs/lp-planejamento.md`;
- contratos de pesquisas e catálogo operacional;
- fronteiras E18.5/E20/E19;
- decisões humanas e versionamento histórico.

#### 2.3.2. Evidências

- pesquisas estruturadas;
- Blueprints e LPs reais;
- contrastes entre taxons;
- evidência executável existente.

#### 2.3.3. Decisão humana de produto

- resolve hipóteses e ambiguidades;
- pode rejeitar evidência insuficiente;
- não viola contrato vigente sem evolução versionada.

#### 2.3.4. Validação posterior

- casos executáveis da parametrização;
- LP real em conta de teste;
- invariantes de conteúdo na E19;
- revisão e promoção humanas.

#### 2.3.5. Regras específicas

- Item de `lp_sections` não cria módulo automaticamente.
- Módulo exige função reutilizável nova; variante exige execução reutilizável diferente.
- Taxon, entrada, copy, funil e composição não criam variante.

#### 2.3.6. Grade metodológica comum

Todos os módulos devem analisar:

1. identidade e função;
2. evidências e equivalência;
3. fronteiras;
4. campos, `fieldKind` e cardinalidades;
5. herança, capabilities e policies;
6. fontes e funil quando aplicáveis;
7. responsividade e acessibilidade quando aplicáveis;
8. variante, versões, lifecycle e compatibilidades;
9. fronteiras E20/E19/renderer;
10. casos E18.5, invariantes E19 e critérios de fechamento.

Blocos condicionais: CTA, mídia, coleção, valor operacional, referência técnica, interação, acessibilidade, visibilidade responsiva e variante adicional.

O Hero é referência metodológica, não molde rígido de conteúdo.

### 2.4. Identidade, evidência e versionamento previstos

- `family = landing_page`.
- `moduleCatalogVersion = 1` no primeiro catálogo.
- Módulo declara `moduleKey`, `moduleVersion`, lifecycle, função, evidências e campos.
- Evidência de pesquisa registra taxon, `taxonId`, público, bloco, `researchId`, versão, status, `itemKey`, estado ativo, função observada, função transversal e equivalência.
- Variante declara identidade, versão, módulo compatível, lifecycle e deltas fechados.
- Catálogo declara compatibilidade explícita com `rootVersion`.

### 2.5. Contrato-base de campo

Todo campo declara `fieldKey`, `fieldKind`, cardinalidade e policy.

`fieldKind` fechado:

- `text`;
- `action`;
- `media`;
- `collection`;
- `operational_value`;
- `technical_reference`.

Regras:

- texto visível exige `semanticRole` da raiz;
- ação possui label textual e vínculo operacional futuro, sem canal/destino no registry;
- mídia declara tipos e requisitos abstratos de ativo e acessibilidade;
- coleção declara contrato fechado do item;
- valor operacional não pode ser inferido como fato;
- referência técnica não é copy;
- somente cardinalidade representa obrigatoriedade;
- capability ausente falha fechado.

#### 2.5.1. Política fechada de origem do valor

- `research_generated_non_factual`: copy não factual gerada da pesquisa.
- `research_guided`: pesquisa orienta, mas não fornece o valor final completo.
- `operational_required`: valor deve vir de fonte operacional autorizada.
- `hybrid`: orientação editorial com suporte operacional obrigatório para fato ou ação concreta.
- `technical_reference`: mídia, link, identificador ou vínculo técnico.
- `not_copy`: objeto estrutural ou técnico.

E18.5 declara; E19 aplica na instância concreta.

#### 2.5.2. Matriz de compatibilidade das policies

- `research_generated_non_factual` e `research_guided` admitem `copySourceMap` em texto.
- `hybrid` pode admitir `copySourceMap`, mas fato, canal, ação ou prova exigem suporte operacional.
- `operational_required` não pode ser preenchida somente por pesquisa.
- `technical_reference` e `not_copy` não admitem `copySourceMap`.
- Falham: policy incompatível com `fieldKind`, mídia com policy textual, `not_copy` com fontes, `hybrid` factual sem suporte e valor operacional gerado apenas da pesquisa.

### 2.6. Contrato de variante

- Deltas permitidos: cardinalidade, remoção/ativação de campo previsto, restrição de faixa/tratamento e comportamento enumerado.
- Deltas proibidos: campo livre, papel desconhecido, ampliação de limite, taxon, conteúdo, valor operacional, URL, classe ou componente concreto.
- `standard` pode ter delta vazio; outra variante vazia e redundante falha.

### 2.7. Módulo-piloto `hero`

#### 2.7.1. Identidade e função estrutural

- `moduleKey = hero`; `moduleVersion = 1` proposto.
- Função: apresentar recorte, proposta principal e ação prioritária.
- Não representa taxon, tráfego, funil ou composição.

#### 2.7.2. Evidência estrutural inicial

- taxon `Corretor Imóveis`;
- `taxonId = c7952d16-678c-4615-9483-a003e57d94aa`;
- público `end_customer`;
- bloco `lp_sections`;
- `researchId = 31e4c229-1582-4d2c-8e4a-7b74e6e07681`;
- versão 1, pesquisa ativa;
- `itemKey = hero_segmentado`, item ativo, ordem 1;
- função observada: apresentar valor central e segmentar por intenção;
- função transversal: apresentar recorte, proposta e ação principal.

#### 2.7.3. Fronteiras

Pertencem: enquadramento, título, explicação curta, CTA principal, CTA secundário opcional, microprova opcional e uma mídia opcional.

Não pertencem: trust bar completa, oferta, processo, prova extensa, depoimentos, FAQ, formulário completo, galeria, carrossel, tour, CTA final, navegação e ordem global.

#### 2.7.4. Catálogo de campos proposto

- `eyebrow`: texto/`eyebrow`, `0..1`, `research_guided`.
- `title`: texto/`h1`, `1..1`, `hybrid`.
- `subtitle`: texto/`paragraph`, `1..1`, `hybrid`; padrão `body.editorialEmphasis`, alternativa `body.base`.
- `primaryCta`: ação `1..1`, `not_copy`:
  - label `cta_label`, `1..1`, `hybrid`;
  - compatível com `primary_conversion_channel`;
  - canal e destino concretos fora do registry;
  - E19 realiza o vínculo operacional.
- `secondaryCta`: ação `0..1`, `not_copy`:
  - label `cta_label`, `hybrid`;
  - ação complementar;
  - contrato estrutural permitido ainda pendente;
  - canal e destino fora do registry.
- `proofShort`: texto/`paragraph`, `0..1`, `hybrid`:
  - microprova, credencial ou sinal curto de confiança;
  - suporte factual operacional obrigatório quando presente;
  - não recebe genericamente preço, prazo, disponibilidade ou condição comercial.
- `media`: mídia `0..1`, `technical_reference`:
  - `mediaKind = image | video`;
  - referência do ativo pertence à instância futura;
  - `accessibilityMode = informative | decorative`;
  - imagem informativa exige `altText` não vazio;
  - imagem decorativa normaliza `altText = ""`;
  - `altText` é `hybrid` e depende do ativo/contexto real;
  - legenda é separada de `altText`;
  - vídeo exige alternativa acessível própria; contrato exato ainda pendente;
  - mídia decorativa não transporta informação essencial.

#### 2.7.5. Herança e exceção tipográfica

- Campos textuais herdam raiz; não há tamanho ou spacing próprio aprovado.
- E18.5 autoriza `body.editorialEmphasis` e `body.base`; E20 seleciona.
- Exceção exige decisão humana documentada, sem presumir persistência nova.
- Renderer não escolhe nem aplica fallback.

#### 2.7.6. Mídia e comportamento responsivo

- Imagem e vídeo no mesmo slot usam `hero.standard`.
- Galeria, carrossel e tour ficam fora.
- `responsiveVisibility = all_viewports | desktop_only`.
- `desktop_only` é escolha da E20, não variante.
- Contrato só autoriza ocultação para mídia decorativa, complementar ou redundante; E19 valida a mídia concreta.
- Capability responsiva depende de nova raiz.

#### 2.7.7. Fronteira com formulário

- CTA pode acionar formulário quando a operação resolvida permitir.
- O Hero não armazena `destinationRef`, URL ou destino.
- Formulário completo fica fora de `hero.standard` e tende a módulo próprio composto pela E20.
- Variante com formulário não está aprovada.

#### 2.7.8. `copySourceMap` do Hero

- `eyebrow`: `positioning_opportunity`; auxiliar `search_intent`.
- `title`: `positioning_opportunity` e `desire`; auxiliar `commercial_keywords`.
- `subtitle`: `pain` e `desire`; auxiliar `belief`.
- labels: `trigger`; auxiliar `search_intent`; ação concreta exige entrada operacional.
- `proofShort`: `proof_type`; auxiliar `objection`; fato sempre operacional.
- `altText` depende do ativo/contexto real, não da pesquisa isolada.
- Ativo, tipo de mídia, modo de acessibilidade, visibilidade, canal e destino não recebem `copySourceMap`.

#### 2.7.9. Perfis de funil do Hero

- BOFU: direto, decisório e de alta intenção, sem alegação não sustentada.
- MOFU: diferenciação e explicação, com pressão menor.
- TOFU: contexto educativo e baixa fricção, sem pressão artificial.
- Perfil altera copy, não campos, estrutura ou variante.

#### 2.7.10. Variante `hero.standard`

- `variantVersion = 1`, compatível com `moduleVersion = 1`.
- Execução-base com delta vazio.
- Mídia e CTA secundário permanecem opcionais.
- Imagem, vídeo, funil, visibilidade e troca para `body.base` não criam variante.
- `hero.media_split` permanece rejeitada.

#### 2.7.11. Lifecycle e compatibilidade do Hero

- `moduleCatalogVersion`, `moduleVersion` e `variantVersion` iniciais: 1 propostos.
- `rootVersion` depende das capabilities tipográfica e responsiva.
- Raiz `hypothesis`: somente `controlled_test`; `validated`: conforme demais camadas; `deprecated`: somente `historical_read`.
- Módulo e variante começam `experimental`; propósito inicial `controlled_test`.
- Elegibilidade cruza raiz, compatibilidade raiz–catálogo, catálogo, módulo, variante e propósito.
- Promoção exige LP real, revisão e decisão humanas.

#### 2.7.12. Casos executáveis da E18.5 para o Hero

- Aceitar exatamente os sete campos e `hero.standard` com delta vazio.
- Rejeitar campo, cardinalidade, policy, fonte, tratamento ou variante inválidos.
- Falhar sem capabilities exigidas e sem fallback.
- Garantir que CTA não armazene canal/destino.
- Garantir labels e `proofShort` como `hybrid`.
- Validar contrato abstrato de mídia, acessibilidade e responsividade.
- Incluir raiz na elegibilidade e retornar resultado imutável.

#### 2.7.13. Invariantes futuras de conteúdo para E19

Não criam agora schema ou validador de conteúdo na E18.5:

- título, subtítulo e CTA principal concretos conforme cardinalidade;
- label compatível com canal, ação e destino resolvidos;
- prova concreta sustentada;
- ativo de mídia válido;
- imagem informativa com `altText` e decorativa com `altText = ""`;
- vídeo com alternativa acessível;
- `desktop_only` sem ocultar informação essencial;
- ausência de formulário completo, galeria, carrossel ou tour dentro de `hero.standard`.

#### 2.7.14. Critérios de fechamento do Hero

Fechar após aprovação de:

- identidade, evidência, fronteiras, sete campos e cardinalidades;
- matriz de policies e fontes;
- CTA sem destino concreto e contrato da ação secundária;
- mídia e acessibilidade, inclusive vídeo;
- visibilidade responsiva e nova raiz;
- variante, versões, lifecycle e compatibilidades;
- casos E18.5 e invariantes E19.

Estado:

- `hero_segmentado` comprovado e rastreável;
- labels e `proofShort` corrigidos para `hybrid`;
- destino removido do registry;
- acessibilidade de imagem registrada;
- ação secundária e acessibilidade de vídeo ainda pendentes;
- Hero ainda não fechado e implementação bloqueada.

### 2.8. `copy_source_map`

- Até duas fontes primárias e uma auxiliar por campo.
- `end_customer` é fonte primária; `business_buyer` só auxilia autoridade, processo, posicionamento ou prova institucional.
- `lp_sections` comprova função, não vira fonte fixa de copy.
- Policies controlam quando `copySourceMap` é permitido.

### 2.9. `funnel_copy_profile`

- Perfis `bofu`, `mofu`, `tofu`.
- Perfil altera transformação, nunca schema, cardinalidade, módulo ou variante.

### 2.10. Tratamentos comerciais

- Prova, credencial, preço, oferta, garantia, urgência, resultado, depoimento e métrica exigem fonte real.
- Pesquisa não cria fato operacional.
- Label que nomeia canal ou ação concreta exige capacidade operacional correspondente.

### 2.11. Lifecycle e compatibilidade

- Raiz: `hypothesis | validated | deprecated`.
- Catálogo, módulo e variante: `candidate | experimental | validated | deprecated`.
- Propósitos: `controlled_test | new_use | historical_read`.
- Elegibilidade é interseção de raiz, compatibilidade, catálogo, módulo, variante e propósito.
- `candidate` bloqueia uso; `experimental` permite teste; `deprecated` só permite histórico.

### 2.12. Contrato de resolução previsto

Entrada: `rootVersion`, `moduleCatalogVersion`, `moduleKey`, `variantKey`, `purpose`.

Processamento:

1. resolver raiz, lifecycle e propósito;
2. validar compatibilidade do catálogo;
3. resolver módulo;
4. validar evidências, campos, policies e matriz;
5. resolver variante e compatibilidade;
6. aplicar delta válido;
7. calcular contrato e elegibilidade;
8. retornar resultado imutável.

A saída não contém deltas, canal, destino concreto ou fallback.

### 2.13. Artefatos previstos

Após raiz e v2:

- `module-catalog/contracts.ts`;
- `registry.ts`;
- `schema.ts`;
- `resolver.ts`;
- `validation-cases.ts`;
- `index.ts`.

Interface: `landingPageModules`. Script: `validate:landing-page-modules`.

#### 2.13.1. Evolução futura do catálogo

- Extensão comum ocorre por registry, casos e nova versão aplicável.
- Campo novo exige nova `moduleVersion`; capability comum exige nova `rootVersion`.
- Contrato, schema e resolver só mudam quando a necessidade não couber no contrato fechado.
- Sem cadastro dinâmico, mutação runtime ou criação automática no MVP.

### 2.14. Validações mínimas previstas

Validações E18.5:

- versões, evidências, compatibilidades e lifecycle válidos;
- campos, cardinalidades, policies, fontes e tratamentos válidos;
- matriz de policy respeitada;
- nenhum destino concreto de CTA no registry;
- capabilities exigidas sem fallback;
- delta vazio somente na base autorizada;
- contrato abstrato de mídia e acessibilidade válido;
- formulário completo não adicionado ao Hero;
- resultado imutável, versões históricas preservadas e sem imports fora do boundary.

#### 2.14.1. Invariantes futuras para E19

- presença e consistência do conteúdo concreto;
- CTA vinculado à operação real;
- prova sustentada;
- ativo e acessibilidade válidos;
- ocultação responsiva sem perda de informação;
- ausência de estrutura não autorizada no Hero.

### 2.15. Fluxo operacional

- Gatilho: raiz e plano v2 mergeados, fase instruída.
- Entrada: raiz compatível, catálogo aprovado, itens oficiais e decisões humanas.
- Processamento: contratos, registry, resolver, policies, mapas, lifecycle e casos E18.5.
- Validação: `npm ci`, validações da raiz/módulos/commercial activation, `npm run check`, `git diff --check` e checks do PR.
- Persistência: repositório; consumo futuro: E20 e E19; fallback: falha fechada.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Catálogo versionado de módulos e variantes v1

- Status pendente e bloqueado até grade fechada, raiz evoluída e v2 consolidada.
- Automação: não. Risco: médio controlado.
- Aceite: módulos aprovados, sem duplicação da raiz/E20.2, compatibilidade validada, Hero conforme contrato, resolver fail-closed e separação E18.5/E19.
- Próxima ação:
  - fechar ação secundária;
  - fechar acessibilidade de vídeo;
  - reavaliar Hero;
  - depois iniciar `trust_bar` e seguir a grade;
  - concluir raiz, pareceres, v2 e merge humano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Implementação da raiz no PR #577.
- Banco, composição, geração, renderer, Admin, Builder, tracking, automação ou nova infraestrutura.
- Módulo de formulário, galeria, carrossel ou tour neste recorte.
- Persistência nova para justificativa da composição.

### 4.2. Critérios de parada

Parar se:

- raiz/capability/lifecycle não estiverem resolvidos;
- surgir fallback, dependência de taxon ou ampliação de limite;
- faltar evidência oficial;
- destino concreto entrar no registry;
- formulário ou mídia essencial forem tratados incorretamente;
- validação de conteúdo for antecipada na E18.5;
- houver conflito de fronteiras ou perda histórica.

### 4.3. Decisão atual

- PR #577 permanece em v1 e sem implementação autorizada.
- `hero_segmentado` está comprovado e rastreável.
- Grade comum e nove candidatos permanecem.
- Hero conserva sete campos e `hero.standard` com delta vazio.
- Labels e `proofShort` usam `hybrid`; canal/destino ficam fora do registry.
- Imagem/vídeo e visibilidade responsiva não criam variante.
- Formulário completo fica fora do Hero.
- Elegibilidade inclui a raiz; E18.5 e E19 estão separadas.
- Hero ainda não está fechado por ação secundária e acessibilidade de vídeo.
- Próxima decisão humana: fechar esses pontos e reavaliar antes de `trust_bar`.
