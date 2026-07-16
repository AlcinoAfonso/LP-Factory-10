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
- `moduleCatalogVersion` possui versão e compatibilidade; lifecycle próprio do catálogo não está aprovado.

### 1.6. Estado técnico confirmado

- Boundary: `lib/conversion-content/landing-page/`; namespace atual: `landingPageRoot`.
- Ainda não existem catálogo de módulos, composição, renderer ou render model.
- E18.5 é repo-only e não altera banco.
- O catálogo operacional já define `primary_conversion_channel` e destinos condicionais.
- E20 seleciona composição; E19 vincula valores, gera e preserva snapshot.

### 1.7. Pontos ainda em debate

- Destinação do campo candidato `secondaryCta` na v1.
- Contrato exato de acessibilidade para vídeo.
- Confirmação dos oito candidatos restantes.
- Evolução da raiz e divisão final em fases.

## 2. Contrato do caso

### 2.1. Problema

- Faltam contratos aprovados para todos os módulos e variantes.
- O catálogo deve generalizar funções sem carregar identidade imobiliária.
- CTA não pode duplicar canal ou destino da E20.2.
- Campos híbridos precisam representar declarativamente quando suporte operacional é exigido.
- Mídia deve separar contrato estrutural e acessibilidade do schema concreto da E19.
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
7. suporte operacional, responsividade e acessibilidade quando aplicáveis;
8. variante, versões, lifecycle e compatibilidades;
9. fronteiras E20/E19/renderer;
10. casos E18.5, invariantes E19 e critérios de fechamento.

Blocos condicionais: CTA, mídia, coleção, valor operacional, referência técnica, interação, acessibilidade, visibilidade responsiva e variante adicional.

O Hero é referência metodológica, não molde rígido de conteúdo.

### 2.4. Identidade, evidência e versionamento previstos

- `family = landing_page`.
- `moduleCatalogVersion = 1` no primeiro catálogo.
- Módulo declara `moduleKey`, `moduleVersion`, lifecycle, função, evidências e campos.
- Evidência de pesquisa registra:
  - taxon e `taxonId`;
  - público e bloco;
  - `researchId` e `itemId`;
  - versão e status da pesquisa;
  - `itemKey` e estado ativo do item;
  - função observada;
  - função transversal;
  - justificativa da equivalência.
- Variante declara identidade, versão, módulo compatível, lifecycle e deltas fechados.
- Catálogo declara versão e compatibilidade explícita com `rootVersion`, sem lifecycle próprio presumido.

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
- ação possui label textual e dependência operacional declarativa, sem canal ou destino concreto no registry;
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
- `hybrid`: orientação editorial combinada com suporte operacional conforme exigência declarada pelo campo.
- `technical_reference`: mídia, link, identificador ou vínculo técnico.
- `not_copy`: objeto estrutural ou técnico.

E18.5 declara; E19 aplica na instância concreta.

#### 2.5.2. Exigência declarativa de suporte operacional

Campos que geram ou exibem texto podem declarar `operationalSupportRequirement` como união fechada:

- `none`:
  - o campo não exige entrada operacional para existir;
  - continua proibido inventar alegação factual.
- `when_factual`:
  - suporte operacional é obrigatório somente quando o texto contiver fato, condição, capacidade, credencial, métrica ou ação concreta.
- `when_present`:
  - o campo só pode estar presente quando existir suporte operacional resolvido aplicável.

Regras:

- policy `hybrid` exige `operationalSupportRequirement` explícito.
- policy `operational_required` equivale materialmente a `when_present`.
- `technical_reference` e `not_copy` não usam essa propriedade.
- E18.5 valida a declaração abstrata; E19 valida o suporte concreto.

#### 2.5.3. Matriz de compatibilidade das policies

- `research_generated_non_factual` e `research_guided` admitem `copySourceMap` em texto.
- `hybrid` admite `copySourceMap`, mas deve declarar `operationalSupportRequirement`.
- `operational_required` não pode ser preenchida somente por pesquisa.
- `technical_reference` e `not_copy` não admitem `copySourceMap`.
- Falham:
  - policy incompatível com `fieldKind`;
  - mídia com policy textual;
  - `not_copy` com fontes;
  - `hybrid` sem exigência de suporte;
  - suporte exigido sem vínculo operacional aplicável;
  - valor operacional gerado apenas da pesquisa.

#### 2.5.4. Dependência operacional de ações

Ação pode declarar `operationalBindingRequirement`:

- referencia somente `fieldKey` estável do catálogo operacional;
- não armazena valor, canal, URL, telefone, e-mail ou destino;
- declara se o vínculo é obrigatório quando a ação estiver presente;
- E19 resolve o campo e valida seus condicionais e destinos aplicáveis.

Nova chave operacional não pode ser criada implicitamente pela E18.5.

### 2.6. Contrato de variante

- Deltas permitidos: cardinalidade, remoção ou ativação de campo previsto, restrição de faixa ou tratamento e comportamento enumerado.
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
- `itemId = ee178af8-294c-403c-8c53-d0baef42ee8c`;
- versão 1, pesquisa ativa;
- `itemKey = hero_segmentado`, item ativo, ordem 1;
- função observada: apresentar valor central e segmentar por intenção;
- interpretação v1:
  - a intenção já está resolvida para a LP concreta;
  - a segmentação ocorre na mensagem e no recorte editorial;
  - não existe seletor, coleção de intenções ou escolha interativa dentro de `hero.standard`;
- função transversal: apresentar recorte, proposta e ação principal.

Escolha interativa entre intenções exigiria análise estrutural futura e não é autorizada por esta evidência.

#### 2.7.3. Fronteiras

Pertencem: enquadramento, título, explicação curta, CTA principal, candidato a CTA secundário, microprova opcional e uma mídia opcional.

Não pertencem: trust bar completa, oferta, processo, prova extensa, depoimentos, FAQ, formulário completo, seletor interativo de intenção, galeria, carrossel, tour, CTA final, navegação e ordem global.

#### 2.7.4. Catálogo de campos proposto

- `eyebrow`:
  - texto/`eyebrow`, `0..1`, `research_guided`;
  - `operationalSupportRequirement = none`.
- `title`:
  - texto/`h1`, `1..1`, `hybrid`;
  - `operationalSupportRequirement = when_factual`.
- `subtitle`:
  - texto/`paragraph`, `1..1`, `hybrid`;
  - `operationalSupportRequirement = when_factual`;
  - padrão `body.editorialEmphasis`, alternativa `body.base`.
- `primaryCta`:
  - ação `1..1`, `not_copy`;
  - label `cta_label`, `1..1`, `hybrid`;
  - label usa `operationalSupportRequirement = when_present`;
  - `operationalBindingRequirement.catalogFieldKey = primary_conversion_channel`;
  - vínculo obrigatório quando a ação estiver presente;
  - canal e destino concretos ficam fora do registry;
  - E19 resolve o canal e os destinos condicionais aplicáveis.
- `secondaryCta`:
  - candidato a ação `0..1`, ainda não aprovado para publicação;
  - não existe `secondary_conversion_channel` ou vínculo operacional equivalente aprovado;
  - E18.5 não criará nova entrada operacional;
  - deve ser removido da v1 ou receber decisão explícita sobre reutilização de fonte existente ou navegação interna.
- `proofShort`:
  - texto/`paragraph`, `0..1`, `hybrid`;
  - `operationalSupportRequirement = when_present`;
  - microprova, credencial ou sinal curto de confiança;
  - não recebe genericamente preço, prazo, disponibilidade ou condição comercial.
- `media`:
  - mídia `0..1`, `technical_reference`;
  - `mediaKind = image | video`;
  - referência do ativo pertence à instância futura;
  - `accessibilityMode = informative | decorative`;
  - acessibilidade usa contrato próprio de mídia, não `operationalValuePolicy` textual;
  - imagem informativa exige alternativa acessível não vazia;
  - imagem decorativa exige ausência de descrição semântica, normalizada pelo contrato final;
  - conteúdo da alternativa acessível deriva do ativo, função e contexto reais;
  - legenda não integra o contrato inicial e não se confunde com alternativa acessível;
  - vídeo exige alternativa acessível própria; contrato exato ainda pendente;
  - mídia decorativa não transporta informação essencial.

O conjunto candidato contém sete campos, mas `secondaryCta` não entra no `fieldCatalog` publicável enquanto seu contrato não for decidido.

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
- labels: `trigger`; auxiliar `search_intent`; ação concreta exige vínculo operacional.
- `proofShort`: `proof_type`; auxiliar `objection`; suporte operacional obrigatório quando presente.
- Alternativa acessível de mídia não usa `copySourceMap` nem `operationalValuePolicy`; E19 a produz a partir do ativo e contexto sob o contrato de acessibilidade.
- Ativo, tipo de mídia, modo de acessibilidade, visibilidade, canal e destino não recebem `copySourceMap`.

#### 2.7.9. Perfis de funil do Hero

- BOFU: direto, decisório e de alta intenção, sem alegação não sustentada.
- MOFU: diferenciação e explicação, com pressão menor.
- TOFU: contexto educativo e baixa fricção, sem pressão artificial.
- Perfil altera copy, não campos, estrutura ou variante.

#### 2.7.10. Variante `hero.standard`

- `variantVersion = 1`, compatível com `moduleVersion = 1`.
- Execução-base com delta vazio.
- Mídia permanece opcional.
- O estado do CTA secundário depende da decisão final do campo candidato.
- Imagem, vídeo, funil, visibilidade e troca para `body.base` não criam variante.
- `hero.media_split` permanece rejeitada.

#### 2.7.11. Lifecycle e compatibilidade do Hero

- `moduleCatalogVersion`, `moduleVersion` e `variantVersion` iniciais: 1 propostos.
- `moduleCatalogVersion` não possui lifecycle próprio aprovado; declara apenas versão e compatibilidade com a raiz.
- `rootVersion` depende das capabilities tipográfica e responsiva.
- Raiz `hypothesis`: somente `controlled_test`; `validated`: conforme demais camadas; `deprecated`: somente `historical_read`.
- Módulo e variante começam `experimental`; propósito inicial `controlled_test`.
- Elegibilidade cruza:
  - lifecycle da raiz;
  - compatibilidade raiz–catálogo;
  - lifecycle do módulo;
  - lifecycle da variante;
  - propósito solicitado.
- Promoção exige LP real, revisão e decisão humanas.

#### 2.7.12. Casos executáveis da E18.5 para o Hero

- Validar identidade, evidência, proveniência e interpretação editorial de `hero_segmentado`.
- Rejeitar publicação enquanto campo candidato não possuir contrato fechado.
- Rejeitar campo, cardinalidade, policy, fonte, tratamento ou variante inválidos.
- Validar `operationalSupportRequirement` e sua compatibilidade com policy e campo.
- Validar vínculo abstrato do CTA principal com `primary_conversion_channel`.
- Garantir que CTA não armazene canal ou destino concreto.
- Validar contrato abstrato de mídia, acessibilidade e responsividade.
- Falhar sem capabilities exigidas e sem fallback.
- Incluir raiz na elegibilidade sem exigir lifecycle do catálogo.
- Retornar resultado imutável.

#### 2.7.13. Invariantes futuras de conteúdo para E19

Não criam agora schema ou validador de conteúdo na E18.5:

- título, subtítulo e CTA principal concretos conforme cardinalidade;
- label compatível com canal, ação e destino resolvidos;
- suporte operacional exigido disponível;
- prova concreta sustentada;
- ativo de mídia válido;
- imagem informativa com alternativa acessível e decorativa sem descrição semântica;
- vídeo com alternativa acessível;
- `desktop_only` sem ocultar informação essencial;
- ausência de formulário completo, seletor interativo, galeria, carrossel ou tour dentro de `hero.standard`.

#### 2.7.14. Critérios de fechamento do Hero

Fechar após aprovação de:

- identidade, evidência, interpretação da segmentação e fronteiras;
- campos publicáveis e cardinalidades;
- matriz de policies e `operationalSupportRequirement`;
- vínculo do CTA principal e decisão sobre `secondaryCta`;
- mídia e acessibilidade, inclusive vídeo;
- visibilidade responsiva e nova raiz;
- variante, versões, lifecycle e compatibilidades;
- casos E18.5 e invariantes E19.

Estado:

- `hero_segmentado` comprovado com `researchId` e `itemId`;
- segmentação v1 definida como editorial, não interativa;
- labels e `proofShort` usam `hybrid` com suporte declarativo;
- CTA principal referencia somente a chave operacional aprovada;
- destino concreto permanece fora do registry;
- alternativa acessível saiu de `operationalValuePolicy`;
- lifecycle próprio do catálogo foi retirado;
- `secondaryCta` e acessibilidade de vídeo ainda pendentes;
- Hero ainda não fechado e implementação bloqueada.

### 2.8. `copy_source_map`

- Até duas fontes primárias e uma auxiliar por campo.
- `end_customer` é fonte primária; `business_buyer` só auxilia autoridade, processo, posicionamento ou prova institucional.
- `lp_sections` comprova função, não vira fonte fixa de copy.
- Policies e exigência de suporte controlam quando `copySourceMap` é permitido.

### 2.9. `funnel_copy_profile`

- Perfis `bofu`, `mofu`, `tofu`.
- Perfil altera transformação, nunca schema, cardinalidade, módulo ou variante.

### 2.10. Tratamentos comerciais

- Prova, credencial, preço, oferta, garantia, urgência, resultado, depoimento e métrica exigem fonte real.
- Pesquisa não cria fato operacional.
- Label que nomeia canal ou ação concreta exige capacidade operacional correspondente.

### 2.11. Lifecycle e compatibilidade

- Raiz: `hypothesis | validated | deprecated`.
- Módulo e variante: `candidate | experimental | validated | deprecated`.
- `moduleCatalogVersion` possui versão e compatibilidade, sem lifecycle próprio na v1.
- Propósitos: `controlled_test | new_use | historical_read`.
- Elegibilidade é interseção de lifecycle da raiz, compatibilidade raiz–catálogo, lifecycle do módulo, lifecycle da variante e propósito.
- `candidate` bloqueia uso; `experimental` permite teste; `deprecated` só permite histórico.

### 2.12. Contrato de resolução previsto

Entrada: `rootVersion`, `moduleCatalogVersion`, `moduleKey`, `variantKey`, `purpose`.

Processamento:

1. resolver raiz, lifecycle e propósito;
2. validar compatibilidade do catálogo com a raiz;
3. resolver módulo e lifecycle;
4. validar evidências, campos, policies, suporte e vínculos abstratos;
5. resolver variante, lifecycle e compatibilidade;
6. aplicar delta válido;
7. calcular contrato e elegibilidade;
8. retornar resultado imutável.

A saída não contém deltas, canal, destino concreto, lifecycle de catálogo ou fallback.

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

- versões, evidências, compatibilidades e lifecycle de raiz, módulo e variante válidos;
- ausência de lifecycle próprio não aprovado no catálogo;
- campos, cardinalidades, policies, fontes e tratamentos válidos;
- matriz de policy e suporte operacional respeitada;
- vínculo de ação referencia apenas `fieldKey` aprovado do catálogo operacional;
- nenhum destino concreto de CTA no registry;
- capabilities exigidas sem fallback;
- delta vazio somente na base autorizada;
- contrato abstrato de mídia e acessibilidade válido;
- formulário ou seletor interativo não adicionados ao Hero;
- resultado imutável, versões históricas preservadas e sem imports fora do boundary.

#### 2.14.1. Invariantes futuras para E19

- presença e consistência do conteúdo concreto;
- CTA vinculado à operação real;
- suporte operacional exigido resolvido;
- prova sustentada;
- ativo e acessibilidade válidos;
- ocultação responsiva sem perda de informação;
- ausência de estrutura não autorizada no Hero.

### 2.15. Fluxo operacional

- Gatilho: raiz e plano v2 mergeados, fase instruída.
- Entrada: raiz compatível, catálogo aprovado, itens oficiais e decisões humanas.
- Processamento: contratos, registry, resolver, policies, suporte, mapas, lifecycle e casos E18.5.
- Validação: `npm ci`, validações da raiz, módulos e commercial activation, `npm run check`, `git diff --check` e checks do PR.
- Persistência: repositório; consumo futuro: E20 e E19; fallback: falha fechada.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Catálogo versionado de módulos e variantes v1

- Status pendente e bloqueado até grade fechada, raiz evoluída e v2 consolidada.
- Automação: não. Risco: médio controlado.
- Aceite: módulos aprovados, sem duplicação da raiz ou E20.2, compatibilidade validada, Hero conforme contrato, resolver fail-closed e separação E18.5/E19.
- Próxima ação:
  - decidir `secondaryCta`;
  - fechar acessibilidade de vídeo;
  - reavaliar Hero;
  - depois iniciar `trust_bar` e seguir a grade;
  - concluir raiz, pareceres, v2 e merge humano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Implementação da raiz no PR #577.
- Banco, composição, geração, renderer, Admin, Builder, tracking, automação ou nova infraestrutura.
- Nova entrada operacional para sustentar `secondaryCta`.
- Módulo de formulário, seletor interativo, galeria, carrossel ou tour neste recorte.
- Persistência nova para justificativa da composição.

### 4.2. Critérios de parada

Parar se:

- raiz, capability ou lifecycle aplicável não estiverem resolvidos;
- surgir lifecycle próprio de catálogo sem decisão explícita;
- surgir fallback, dependência de taxon ou ampliação de limite;
- faltar evidência oficial;
- destino concreto entrar no registry;
- campo híbrido depender de regra hardcoded por `fieldKey`;
- formulário, seletor interativo ou mídia essencial forem tratados incorretamente;
- validação de conteúdo for antecipada na E18.5;
- houver conflito de fronteiras ou perda histórica.

### 4.3. Decisão atual

- PR #577 permanece em v1 e sem implementação autorizada.
- `hero_segmentado` está comprovado com `itemId` e interpretado editorialmente na v1.
- Grade comum e nove candidatos permanecem.
- Hero mantém seis campos com contrato interno fechado e `secondaryCta` como candidato pendente.
- `hero.standard` permanece a única variante inicial, com delta vazio.
- Labels e `proofShort` usam `hybrid` com exigência declarativa de suporte.
- CTA principal referencia `primary_conversion_channel`, sem canal ou destino concreto no registry.
- Alternativa acessível da mídia usa contrato próprio, não policy textual.
- Imagem, vídeo e visibilidade responsiva não criam variante.
- Formulário completo e seletor interativo ficam fora do Hero.
- Elegibilidade inclui a raiz e não presume lifecycle do catálogo.
- E18.5 e E19 permanecem separadas.
- Hero ainda não está fechado por `secondaryCta`, acessibilidade de vídeo e evolução da raiz.
- Próxima decisão humana: fechar esses pontos e reavaliar antes de `trust_bar`.