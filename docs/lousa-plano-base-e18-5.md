14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/template-blueprint.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase dos itens ativos de `lp_sections`, `lib/conversion-content/landing-page/`, PRs #559, #563, #564, #566, #567 e #577, avaliações do Analista e decisões humanas de 14, 15 e 16/07/2026.

Versão: v1 em ajuste.

Status: PR vivo para debate; grade metodológica comum registrada; módulo `hero` e variante `hero.standard` registrados para avaliação; grade inicial de nove módulos candidatos preservada; nenhuma implementação autorizada.

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
- A raiz atual também não possui capability fechada de visibilidade responsiva por campo.
- A visibilidade responsiva reutilizável por vários módulos deve ser tratada como capability comum da família, em evolução versionada própria da raiz.
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
- A v1 permanecerá aberta até analisar, um a um, os nove módulos candidatos e suas variantes iniciais.
- A existência na grade não equivale a aprovação material do módulo.
- Rejeitar, fundir ou substituir candidato exige:
  - justificativa estrutural;
  - atualização explícita da grade;
  - decisão humana.
- A mesma grade metodológica será usada por todos os módulos aprovados.
- A grade comum é obrigatória, mas seus blocos condicionais são preenchidos apenas quando aplicáveis à função do módulo.
- Para cada módulo aprovado, fechar:
  - identidade transversal;
  - restrições normativas;
  - evidências estruturais;
  - função e fronteiras;
  - campos e cardinalidades;
  - herança e capabilities;
  - política de origem dos valores;
  - fontes de copy;
  - perfis BOFU, MOFU e TOFU;
  - mídia, ações, coleções ou interações quando aplicáveis;
  - comportamento responsivo específico quando aplicável;
  - variante inicial e deltas;
  - versões e compatibilidades;
  - lifecycle e propósitos permitidos;
  - fronteiras com E20, E19 e renderer;
  - casos executáveis e critérios de fechamento.
- O Hero é o módulo-piloto; os demais seguem a ordem da grade inicial após o fechamento completo do Hero.
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
- A E18.5 declara tratamento padrão, alternativas autorizadas e capability exigida.
- A E20 seleciona, por ocorrência concreta, somente alternativa autorizada e registra a justificativa aplicável.
- A E19 gera o conteúdo concreto sem alterar o contrato parametrizado.
- O renderer executa o contrato já resolvido; não escolhe alternativa, não corrige ausência de capability e não aplica fallback.

### 1.4. Regras de exceção

- Campo sem exceção herda a raiz.
- Módulo pode restringir ou selecionar capacidades da raiz quando sua função justificar.
- Variante pode restringir o módulo quando houver mudança reutilizável de execução ou comportamento.
- Escolha por ocorrência já autorizada não cria variante.
- Tipo de mídia, ativo concreto ou visibilidade responsiva autorizada não criam variante por si só.
- Módulo ou variante não pode ampliar limite técnico absoluto.
- Necessidade acima do limite deve avaliar antes revisão de texto, divisão de conteúdo, mudança semântica ou nova estrutura.
- Diferença apenas de taxon, conteúdo, campanha, conta, tráfego, funil ou composição não cria módulo nem variante.

### 1.5. Decisões técnicas incorporadas

- Cardinalidade substitui propriedade `required` separada.
- A obrigatoriedade pode ser verificada como pergunta analítica, mas não será duplicada no contrato.
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
- Os `item_key` de `lp_sections` são referências de evidência, não identidade permanente do módulo.
- Nomes diferentes de seção podem representar a mesma função estrutural transversal.
- Cada candidato só será aprovado após confirmar função reutilizável e diferença real em relação aos demais.
- `formato_curto`, `formato_medio` e `formato_longo` orientam composição e extensão; não são módulos nem variantes.
- A grade inicial fica limitada aos nove candidatos; ampliação exige decisão posterior.
- Para `hero.subtitle`:
  - `semanticRole = paragraph`;
  - padrão: `body.editorialEmphasis`;
  - alternativa autorizada: `body.base`;
  - ausência da capability falha fechado;
  - E20 poderá selecionar a alternativa por ocorrência.
- `hero.media_split` não está aprovada.
- `hero.standard` é a única variante inicial aprovada do Hero e poderá possuir delta vazio como execução-base versionada.

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

- Avaliação e ajustes da grade registrada do Hero.
- Confirmação individual dos oito candidatos restantes.
- Contratos específicos por `fieldKind` ainda não exemplificados pelo Hero.
- Variante inicial e deltas dos demais módulos.
- Critério mínimo para nova variante e exceção estrutural.
- Lifecycle inicial e promoção para `validated`.
- Evolução da raiz para `body.editorialEmphasis` e visibilidade responsiva.
- Divisão final em fases executáveis.

## 2. Contrato do caso

### 2.1. Problema

- A raiz existe, mas ainda faltam contratos aprovados para todos os módulos, variantes, campos, fontes, perfis de funil e lifecycle.
- Os nove itens estruturais do primeiro recorte não podem virar módulos automaticamente.
- O catálogo precisa generalizar funções reais sem transportar identidade imobiliária.
- A raiz v1 não garante o tratamento editorial exigido pelo Hero.
- A raiz v1 não oferece escolha fechada de visibilidade responsiva por campo.
- Um contrato único de campo com `semanticRole` obrigatório não atende mídia, ação, coleção ou referência técnica.
- A política de origem precisa impedir que pesquisa seja tratada como fonte de preço, endereço, credencial, métrica, depoimento, registro, garantia ou disponibilidade.
- Repetição de valores da raiz ou deltas aplicados por consumidores criaria múltiplas fontes da verdade.
- Fallback para `body.base` esconderia capability ausente.

### 2.2. Resultado esperado

- Criar catálogo repo-only versionado a partir dos nove módulos candidatos, incluindo apenas os contratos individualmente aprovados.
- Usar grade metodológica única para todos os módulos, com blocos condicionais por função.
- Usar `Corretor Imóveis`, `end_customer`, `lp_sections` v1 ativa como evidência estrutural principal.
- Confirmar cada módulo e variante inicial individualmente.
- Resolver `raiz → módulo → variante` em contrato final imutável.
- Definir referências estruturais sem transformar `lp_sections.itemKey` em identidade canônica.
- Definir fontes de copy somente com `item_key` oficiais dos blocos aplicáveis.
- Separar pesquisa orientadora de valores factuais operacionais.
- Tratar BOFU, MOFU e TOFU como perfis, não variantes.
- Preservar versões históricas.
- Não criar banco, composição, geração ou renderer.

### 2.3. Hierarquia para parametrização

#### 2.3.1. Restrições normativas

- parametrização raiz vigente;
- `docs/lp-planejamento.md`;
- contratos oficiais dos itens estruturados;
- fronteiras da E18.5, E20 e E19;
- decisões humanas já aprovadas e registradas;
- compatibilidade histórica e versionamento imutável.

#### 2.3.2. Evidências

- itens estruturados do taxon;
- Blueprints;
- referências reais;
- LPs analisadas;
- contrastes entre taxons e ultranichos;
- evidência executável existente.

#### 2.3.3. Decisão humana de produto

- resolve hipóteses e ambiguidades;
- pode rejeitar recomendação empírica insuficiente;
- pode aprovar padrão funcional próprio do LP Factory 10;
- não pode violar contrato vigente sem evolução versionada explícita;
- deve decidir rejeição, fusão ou substituição de candidato da grade.

#### 2.3.4. Validação posterior

- LP real em conta de teste;
- casos executáveis;
- revisão humana;
- evidência de uso reutilizável;
- decisão de promoção, restrição, depreciação ou substituição.

#### 2.3.5. Regras específicas

- A grade inicial usa `Corretor Imóveis`, `end_customer`, `lp_sections` v1 ativa.
- O ultranicho de médio padrão não restringe o catálogo transversal.
- Item de `lp_sections` não cria módulo automaticamente.
- Módulo exige função estrutural reutilizável ainda não coberta.
- Variante exige mudança reutilizável de estrutura, execução ou comportamento.
- Conteúdo, parâmetro herdado, escolha de ocorrência, composição, fonte, funil ou valor operacional não criam variante.
- Identidade do módulo não pode carregar taxon, profissão ou campanha.
- Itens de extensão de página não pertencem ao catálogo.

#### 2.3.6. Grade metodológica comum

Todos os módulos serão analisados pelos mesmos blocos obrigatórios:

1. identidade transversal;
2. função estrutural;
3. evidências e equivalência semântica;
4. fronteiras positivas e negativas;
5. catálogo de campos;
6. `fieldKind` e contrato condicionado pelo tipo;
7. cardinalidades sem `required`;
8. herança, capabilities e exceções;
9. política fechada de origem do valor;
10. `copySourceMap` quando aplicável;
11. perfis BOFU, MOFU e TOFU quando houver copy;
12. comportamento responsivo específico quando necessário;
13. variante inicial e deltas;
14. versões e compatibilidades;
15. lifecycle e propósitos;
16. fronteiras com E20, E19 e renderer;
17. casos positivos e negativos;
18. critérios de fechamento.

Blocos condicionais serão preenchidos somente quando a função exigir:

- ação ou CTA;
- mídia;
- coleção;
- valor operacional;
- referência técnica;
- acessibilidade específica;
- comportamento interativo;
- visibilidade responsiva específica;
- variante estrutural adicional.

Regras da grade:

- O Hero é o primeiro preenchimento, não um molde rígido de conteúdo.
- Outros módulos podem possuir campos, coleções, interações e responsividade diferentes.
- Nenhum módulo é obrigado a possuir CTA, mídia, copy ou segunda variante.
- Nenhuma variante adicional será criada apenas para manter simetria entre módulos.
- O contrato específico deve ser o mínimo suficiente para representar a função reutilizável.

### 2.4. Identidade, evidência e versionamento previstos

- `family = landing_page`.
- `rootVersion` será a versão que garanta as capabilities requeridas.
- `moduleCatalogVersion = 1` para o primeiro catálogo publicado.
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
- Módulo:
  - `moduleKey`;
  - `moduleVersion`;
  - `lifecycle`;
  - `structuralFunction`;
  - `structuralEvidenceRefs`;
  - `fieldCatalog`.
- Cada `structuralEvidenceRef` deve registrar:
  - taxon de origem;
  - `audienceScope`;
  - `researchVersion`;
  - `itemKey` observado;
  - função estrutural descrita pela fonte;
  - função transversal inferida;
  - justificativa da equivalência semântica.
- `itemKey` observado não determina `moduleKey`.
- Não haverá campo livre de força de evidência na v1; necessidade futura exige enum fechado e uso comprovado.
- Variante:
  - `variantKey`;
  - `variantVersion`;
  - `moduleKey`;
  - `compatibleModuleVersion`;
  - `lifecycle`;
  - deltas fechados.
- O catálogo declara compatibilidade explícita com `rootVersion`.
- Não haverá versão ou catálogo implícito nem fallback silencioso.

### 2.5. Contrato-base de campo

Todo campo declara:

- `fieldKey`;
- `fieldKind`;
- `cardinality`;
- `operationalValuePolicy`.

A união fechada prevista de `fieldKind` é:

- `text`;
- `action`;
- `media`;
- `collection`;
- `operational_value`;
- `technical_reference`.

Contratos condicionais por tipo:

- `text`:
  - exige `semanticRole` existente na raiz;
  - pode declarar `copySourceMap`;
  - pode selecionar tratamentos tipográficos autorizados.
- `action`:
  - representa objeto estrutural de ação;
  - seu `label` é campo textual separado com `semanticRole = cta_label`;
  - destino real é referência operacional futura;
  - não haverá `actionRole` enquanto não existir contrato fechado e fonte aprovada.
- `media`:
  - usa contrato abstrato de referência;
  - deve declarar tipo de mídia permitido;
  - deve prever política de texto alternativo e uso decorativo;
  - não recebe `semanticRole` visual por padrão.
- `collection`:
  - declara cardinalidade da coleção;
  - declara contrato fechado do item;
  - não recebe `semanticRole` na coleção como um todo.
- `operational_value`:
  - declara tipo do valor;
  - exige fonte operacional aplicável;
  - não pode ser inferido como fato pela pesquisa.
- `technical_reference`:
  - representa referência técnica, identificador ou vínculo abstrato;
  - não é copy.

Regras gerais:

- `cardinality` contém somente `min` e `max`.
- `{ min: 1, max: 1 }` representa campo único obrigatório.
- `{ min: 0, max: 1 }` representa campo único opcional.
- Coleção usa `max > 1` quando houver teto fechado.
- Não haverá `required` ou propriedade equivalente.
- Nenhum valor concreto da raiz é copiado.
- Exceção de faixa ou limite deve ser justificada e só pode restringir o teto herdado.
- Tratamento padrão deve pertencer à lista permitida.
- Capability ausente falha fechado.

#### 2.5.1. Política fechada de origem do valor

`operationalValuePolicy` será união fechada com:

- `research_generated_non_factual`:
  - texto pode ser produzido a partir da pesquisa;
  - não pode criar alegação operacional ou factual não sustentada.
- `research_guided`:
  - pesquisa orienta tema, enquadramento e vocabulário;
  - não fornece por si só o valor final completo.
- `operational_required`:
  - valor deve vir da conta, negócio, oferta, campanha, LP ou fonte operacional autorizada.
- `hybrid`:
  - pesquisa orienta a copy;
  - qualquer afirmação factual exige sustentação operacional.
- `technical_reference`:
  - mídia, link, identificador, evidência ou referência técnica.
- `not_copy`:
  - campo estrutural ou técnico sem geração de copy.

A E18.5 declara a política. A E19 aplica a política durante a geração concreta.

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

Regras adicionais:

- O resolver valida o delta e retorna somente o contrato final.
- Variante `standard` pode representar a execução-base versionada do módulo e possuir delta vazio quando `variantKey` for obrigatório.
- Delta vazio não autoriza criar variantes redundantes.
- Não se inventa delta para justificar a existência da variante-base.
- Nova variante exige diferença reutilizável demonstrável dentro da mesma função estrutural.
- Tipo de mídia, ativo concreto ou opção responsiva já autorizada não criam variante.

### 2.7. Módulo-piloto `hero`

#### 2.7.1. Identidade e função estrutural

- `moduleKey = hero`.
- `moduleVersion = 1` proposto.
- Função estrutural:
  - apresentar o recorte da LP;
  - comunicar a proposta de valor principal;
  - indicar a ação prioritária esperada do visitante.
- Não representa taxon, campanha, tráfego, funil ou composição.
- A função deve permanecer transversal à família `landing_page`.

#### 2.7.2. Evidência estrutural inicial

- taxon: `Corretor Imóveis`;
- `audienceScope = end_customer`;
- `researchVersion = 1`;
- `itemKey = hero_segmentado`;
- função observada: abertura segmentada da LP com promessa e CTA;
- função transversal inferida: apresentar recorte, proposta de valor e ação principal;
- o nome da seção imobiliária não determina o `moduleKey`.

#### 2.7.3. Fronteiras

Pertence ao Hero:

- enquadramento inicial;
- título principal;
- explicação curta;
- CTA principal;
- CTA secundário opcional;
- prova curta opcional;
- uma mídia principal opcional.

Não pertence ao Hero:

- barra completa de confiança;
- lista de serviços;
- catálogo de ofertas;
- processo detalhado;
- prova técnica extensa;
- conjunto de depoimentos;
- FAQ;
- formulário completo;
- galeria, carrossel ou tour;
- CTA final da página;
- navegação;
- composição ou ordem global.

#### 2.7.4. Catálogo de campos proposto

- `eyebrow`:
  - `fieldKind = text`;
  - `semanticRole = eyebrow`;
  - `cardinality = { min: 0, max: 1 }`;
  - `operationalValuePolicy = research_guided`;
  - contextualiza categoria, intenção ou recorte sem repetir integralmente o título.
- `title`:
  - `fieldKind = text`;
  - `semanticRole = h1`;
  - `cardinality = { min: 1, max: 1 }`;
  - `operationalValuePolicy = hybrid`;
  - apresenta a principal proposta de valor;
  - fatos concretos exigem entrada operacional.
- `subtitle`:
  - `fieldKind = text`;
  - `semanticRole = paragraph`;
  - `cardinality = { min: 1, max: 1 }`;
  - `operationalValuePolicy = hybrid`;
  - desenvolve promessa, benefício, contexto ou objeção principal;
  - `defaultTypographyTreatment = body.editorialEmphasis`;
  - `allowedTypographyTreatments = [body.editorialEmphasis, body.base]`.
- `primaryCta`:
  - `fieldKind = action`;
  - `cardinality = { min: 1, max: 1 }`;
  - `operationalValuePolicy = not_copy`;
  - `label`:
    - `fieldKind = text`;
    - `semanticRole = cta_label`;
    - `cardinality = { min: 1, max: 1 }`;
    - `operationalValuePolicy = research_generated_non_factual`;
  - `destinationRef`:
    - `fieldKind = technical_reference`;
    - `cardinality = { min: 1, max: 1 }`;
    - `operationalValuePolicy = technical_reference`;
    - não contém URL concreta no catálogo.
- `secondaryCta`:
  - `fieldKind = action`;
  - `cardinality = { min: 0, max: 1 }`;
  - `operationalValuePolicy = not_copy`;
  - quando presente, exige `label` e `destinationRef` equivalentes ao contrato do CTA principal;
  - representa ação complementar e não deve competir com a ação principal.
- `proofShort`:
  - `fieldKind = text`;
  - `semanticRole = paragraph`;
  - `cardinality = { min: 0, max: 1 }`;
  - `operationalValuePolicy = operational_required`;
  - pode apresentar credencial, prova ou redução curta de risco;
  - a pesquisa pode indicar o tipo de prova, mas não fornecer prova concreta;
  - sem entrada operacional válida, o campo é omitido.
- `media`:
  - `fieldKind = media`;
  - `cardinality = { min: 0, max: 1 }`;
  - `operationalValuePolicy = technical_reference`;
  - `mediaKind` permitido:
    - `image`;
    - `video`;
  - `assetRef` obrigatório quando o campo estiver presente;
  - `accessibilityMode` obrigatório:
    - `informative`;
    - `decorative`;
  - mídia informativa exige texto alternativo ou alternativa acessível aplicável;
  - mídia decorativa não transporta informação essencial.

#### 2.7.5. Herança e exceção tipográfica

- Campos textuais herdam faixas, limites e valores da raiz.
- Não há tamanho, limite ou spacing próprio aprovado.
- `subtitle` permanece `paragraph` e usa tratamento da raiz.
- A E18.5 define `body.editorialEmphasis` como padrão e `body.base` como alternativa autorizada.
- A E20 pode selecionar `body.base` em ocorrência concreta com justificativa.
- O renderer apenas executa o tratamento resolvido.
- Ausência de `body.editorialEmphasis` é incompatibilidade, não fallback.
- Mídia opcional não comprova variante.

#### 2.7.6. Mídia e comportamento responsivo

- Imagem ou vídeo no mesmo slot estrutural usam `hero.standard`.
- A escolha de `mediaKind` pertence à ocorrência concreta e não cria variante.
- Galeria, carrossel, tour ou coleção de mídia representam função distinta e não entram no campo `media` do Hero.
- Política responsiva proposta para o campo `media`:
  - padrão: `all_viewports`;
  - alternativa autorizada: `desktop_only`.
- `desktop_only` significa que a mídia aparece no desktop e é omitida no mobile, sem alterar a função estrutural do Hero.
- A seleção de `desktop_only` pertence à E20.
- O renderer apenas executa a opção resolvida.
- `desktop_only` só é válido quando a mídia for decorativa, complementar ou redundante em relação ao conteúdo textual.
- Não é permitido ocultar no mobile mídia que contenha informação essencial, prova necessária, instrução, condição, preço, oferta ou conteúdo sem alternativa textual equivalente.
- A capability comum de visibilidade responsiva ainda não existe na raiz v1 e deve ser adicionada em evolução versionada própria antes da implementação material.
- Ativo alternativo específico para mobile não entra no contrato inicial; poderá ser avaliado em nova versão se houver evidência real.

#### 2.7.7. Fronteira com formulário

- CTA que leva, abre ou aciona formulário continua dentro de `hero.standard` por meio de `destinationRef`.
- Formulário completo incorporado visualmente ao Hero não pertence ao contrato inicial de `hero.standard`.
- A decisão padrão futura é representar captação ou qualificação como módulo próprio composto com o Hero pela E20.
- Nenhum `moduleKey` novo para formulário é definido neste recorte.
- Uma variante de Hero com formulário só poderá ser proposta se evidência posterior demonstrar que:
  - a função principal continua sendo a do Hero;
  - o formulário é subordinado e inseparável da abertura;
  - a execução é reutilizável entre taxons;
  - composição com módulo próprio é insuficiente;
  - privacidade, validação, responsividade e campos possuem contrato fechado.
- Nenhuma variante com formulário está aprovada na v1.

#### 2.7.8. `copySourceMap` do Hero

- `eyebrow`:
  - primária: `end_customer.strategic_core.positioning_opportunity`;
  - auxiliar: `end_customer.seo.search_intent`.
- `title`:
  - primárias: `end_customer.strategic_core.positioning_opportunity`, `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.seo.commercial_keywords`.
- `subtitle`:
  - primárias: `end_customer.strategic_core.pain`, `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.strategic_core.belief`.
- labels de CTA:
  - primária: `end_customer.strategic_core.trigger`;
  - auxiliar: `end_customer.seo.search_intent`.
- `proofShort`:
  - orientadora primária: `end_customer.strategic_core.proof_type`;
  - auxiliar: `end_customer.strategic_core.objection`;
  - valor factual obrigatoriamente operacional.
- Não recebem `copySourceMap`:
  - `destinationRef`;
  - `assetRef`;
  - `mediaKind`;
  - `accessibilityMode`;
  - política de visibilidade responsiva.

#### 2.7.9. Perfis de funil do Hero

- BOFU:
  - título direto e específico;
  - subtítulo orientado à decisão;
  - objeção principal tratada com clareza;
  - CTA de alta intenção;
  - prova curta quando houver fonte operacional real;
  - sem promessa, urgência ou condição não sustentada.
- MOFU:
  - título orientado à diferenciação;
  - subtítulo explicativo;
  - CTA proporcional;
  - prova contextual quando disponível;
  - menor pressão comercial que BOFU.
- TOFU:
  - título orientado a contexto, problema ou desejo;
  - subtítulo educativo;
  - CTA de baixa fricção;
  - sem urgência, escassez ou pressão artificial;
  - prova curta apenas quando contribuir para confiança.
- Os perfis usam o mesmo catálogo de campos e cardinalidades.
- Perfil altera transformação da copy, não estrutura, identidade ou variante.

#### 2.7.10. Variante `hero.standard`

- `variantKey = hero.standard`.
- `variantVersion = 1` proposta.
- `compatibleModuleVersion = 1` proposta.
- Representa a execução-base versionada do Hero.
- Delta vazio é permitido.
- Não altera campos, cardinalidades ou limites.
- Mídia permanece opcional.
- CTA secundário permanece opcional.
- `mediaKind = image | video` não cria variante.
- `responsiveVisibility = all_viewports | desktop_only` não cria variante.
- `hero.media_split` permanece rejeitada.
- Troca isolada para `body.base` não cria variante.
- Variante específica de nicho, campanha, tráfego ou funil é proibida.

#### 2.7.11. Lifecycle e compatibilidade do Hero

- `moduleCatalogVersion = 1` proposta para o primeiro catálogo publicado.
- `moduleVersion = 1` proposta.
- `variantVersion = 1` proposta.
- `rootVersion` permanece pendente da evolução que garanta:
  - `body.editorialEmphasis`;
  - capability de visibilidade responsiva, caso `desktop_only` permaneça no contrato aprovado.
- Lifecycle inicial proposto do módulo:
  - `experimental`.
- Lifecycle inicial proposto da variante:
  - `experimental`.
- Propósito permitido inicialmente:
  - `controlled_test`.
- `new_use` permanece proibido até promoção.
- Promoção para `validated` exige:
  - LP real em conta de teste;
  - revisão humana;
  - validação visual, responsiva e editorial;
  - ausência de falha estrutural;
  - decisão humana registrada.

#### 2.7.12. Casos positivos do Hero

- Hero mínimo válido:
  - `title`;
  - `subtitle`;
  - `primaryCta`;
  - sem eyebrow, CTA secundário, prova curta ou mídia.
- Hero completo válido:
  - eyebrow;
  - title;
  - subtitle;
  - CTA principal;
  - CTA secundário;
  - prova curta sustentada operacionalmente;
  - mídia com acessibilidade válida.
- Hero com imagem:
  - `hero.standard`;
  - `mediaKind = image`;
  - `all_viewports` ou `desktop_only` autorizado.
- Hero com vídeo:
  - `hero.standard`;
  - `mediaKind = video`;
  - mesmo slot estrutural.
- Exceção tipográfica válida:
  - E20 seleciona `body.base`;
  - opção autorizada;
  - justificativa registrada;
  - renderer recebe tratamento resolvido.
- CTA para formulário válido:
  - CTA usa `destinationRef` operacional;
  - formulário permanece fora do contrato do Hero.

#### 2.7.13. Casos negativos do Hero

- Estrutura inválida:
  - ausência de `title`, `subtitle` ou `primaryCta`;
  - mais de um título, mídia ou CTA secundário.
- Origem inválida:
  - prova concreta criada apenas a partir de `proof_type`;
  - credencial, métrica ou condição inventada;
  - destino do CTA inventado pela pesquisa;
  - mídia sem referência operacional.
- Tipografia inválida:
  - raiz sem `body.editorialEmphasis`;
  - tratamento não autorizado;
  - fallback automático;
  - renderer escolhendo tratamento.
- Mídia inválida:
  - `mediaKind` desconhecido;
  - mídia informativa sem alternativa acessível;
  - `desktop_only` ocultando informação essencial;
  - galeria, carrossel ou tour tratados como mídia única do Hero.
- Variante inválida:
  - variante específica de corretor de imóveis;
  - variante criada apenas por funil, imagem, vídeo ou visibilidade responsiva;
  - variante com campo não previsto;
  - variante redundante com delta vazio sem função de base autorizada.
- Formulário inválido:
  - formulário completo adicionado silenciosamente a `hero.standard`;
  - variante de formulário criada sem análise estrutural própria.

#### 2.7.14. Critérios de fechamento do Hero

O Hero estará fechado para avaliação final quando forem aprovados:

- identidade e função;
- fronteiras;
- sete campos e seus contratos internos;
- cardinalidades;
- políticas de origem;
- `copySourceMap`;
- perfis de funil;
- contrato de mídia e acessibilidade;
- decisão sobre `desktop_only` e sua capability de raiz;
- fronteira com formulário;
- `hero.standard` com delta vazio;
- versões e compatibilidades;
- lifecycle experimental;
- casos positivos e negativos.

Estado atual:

- módulo e variante registrados como proposta consolidada para avaliação e ajustes;
- nenhuma implementação autorizada;
- próxima decisão humana: aprovar ou ajustar a grade do Hero antes de iniciar `trust_bar`.

### 2.8. `copy_source_map`

- Cada referência declara público, bloco, `itemKey` e papel primário ou auxiliar.
- Cada campo usa até duas fontes primárias e uma auxiliar.
- Copy para visitante usa `end_customer` como fonte primária.
- `business_buyer` pode auxiliar somente autoridade, processo, posicionamento ou prova institucional.
- `strategic_core` e `seo` fornecem insumos aplicáveis de pesquisa.
- `lp_overview` orienta transformação.
- `lp_sections` comprova funções estruturais, mas não vira fonte fixa de copy.
- Chave desconhecida e fato operacional inferido falham fechado.

### 2.9. `funnel_copy_profile`

- Perfis: `bofu`, `mofu`, `tofu`.
- Perfil orienta transformação, sem alterar schema, cardinalidade, limite, identidade do módulo ou estrutura aprovada.
- Módulo adapta o perfil à função.
- Variante apenas restringe ou especializa tratamento permitido quando houver mudança comportamental comprovada.

### 2.10. Tratamentos comerciais

- Promessa, prova, autoridade, credencial, comparação, preço, oferta, desconto, garantia, urgência, escassez, resultado, depoimento e métrica exigem fonte real aplicável.
- Pesquisa não fornece como fato preço, condição, prazo, disponibilidade, garantia, credencial, depoimento, métrica, contato, endereço, URL ou informação legal específica.
- Valor factual exige entrada operacional futura.
- BOFU não autoriza alegação não sustentada.
- TOFU não admite pressão artificial.

### 2.11. Lifecycle e compatibilidade

- Lifecycle: `candidate`, `experimental`, `validated`, `deprecated`.
- Propósitos: `controlled_test`, `new_use`, `historical_read`.
- `candidate` não entra em composição ou geração.
- `experimental` serve a teste controlado.
- `validated` permite novo uso quando todas as camadas aplicáveis também permitirem.
- `deprecated` não entra em novo uso, mas permanece resolvível historicamente.
- O catálogo declara compatibilidade entre `moduleCatalogVersion` e `rootVersion`.
- A variante declara compatibilidade com `moduleVersion`.
- A elegibilidade efetiva é a interseção das permissões de catálogo, módulo, variante e propósito; não será calculada por ordenação textual simples dos estados.
- Exemplos:
  - módulo `experimental` e variante `validated` permitem `controlled_test`, mas não `new_use`;
  - módulo `deprecated` e variante `validated` permitem `historical_read`, mas não `new_use`;
  - módulo `candidate` bloqueia qualquer resolução para uso.
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
2. validar compatibilidade do catálogo com a raiz;
3. resolver módulo e sua versão pelo catálogo imutável;
4. validar referências, campos e policies;
5. resolver variante e validar compatibilidade com `moduleVersion`;
6. validar e aplicar delta, inclusive delta vazio autorizado da variante-base;
7. aplicar precedência;
8. calcular contrato final;
9. calcular elegibilidade pela interseção de permissões;
10. retornar resultado imutável.

A saída contém identidades, versões, lifecycle, elegibilidade efetiva, função, campos, cardinalidades, papéis, fontes, policies, tratamentos e limites efetivos; não contém deltas ou fallback para o consumidor.

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

#### 2.13.1. Evolução futura do catálogo

- A operação comum de criação de módulo ou variante será declarativa e versionada no repositório.
- Novo módulo compatível exigirá normalmente:
  - registrar módulo, versão, evidências e variante inicial em `registry.ts`;
  - adicionar casos positivos e negativos em `validation-cases.ts`;
  - publicar nova `moduleCatalogVersion` preservando catálogos anteriores.
- Nova variante compatível exigirá normalmente:
  - registrar variante e versão em `registry.ts`;
  - vinculá-la ao módulo e à versão compatíveis;
  - adicionar casos em `validation-cases.ts`;
  - publicar nova `moduleCatalogVersion`.
- `contracts.ts`, `schema.ts` e `resolver.ts` não mudam quando a necessidade couber no contrato fechado existente.
- Campo novo em módulo publicado exige nova `moduleVersion`.
- Novo `fieldKind`, policy, delta, comportamento ou forma de resolução exige evolução explícita de contrato, schema, resolver, registry e validações.
- Capability comum ausente exige evolução da raiz e nova `rootVersion`.
- Uso por taxon, ordem, obrigatoriedade e escolhas por ocorrência pertencem à E20.
- Toda evolução ocorre por branch, PR, revisão e validações executáveis.
- No MVP não haverá cadastro dinâmico no banco, Admin de contratos, mutação em runtime ou criação automática por taxon ou pesquisa.
- Alteração de infraestrutura será exceção; extensão rotineira ficará no registry, validações e versionamento.

### 2.14. Validações mínimas previstas

- Catálogo e versões válidos.
- Cada módulo publicado foi individualmente aprovado a partir da grade candidata.
- Rejeição ou fusão de candidato possui decisão humana registrada.
- Nenhum módulo carrega identidade de taxon.
- `structuralEvidenceRefs` válidas e `itemKey` não usado como identidade automática.
- Compatibilidade entre `moduleCatalogVersion` e `rootVersion` validada.
- Compatibilidade entre variante e `moduleVersion` validada.
- `fieldKind` conhecido e contrato condicional correto.
- Campo textual sem `semanticRole` falha.
- Campo não textual obrigado a ter `semanticRole` falha.
- Cardinalidade inválida ou propriedade `required` falha.
- `operationalValuePolicy` desconhecida falha.
- Fato operacional originado apenas da pesquisa falha.
- Referência, tratamento, módulo, variante ou campo desconhecido falha.
- Tratamento padrão fora da lista permitida falha.
- Ausência de capability exigida e fallback automático falham.
- Delta vazio é aceito somente para variante-base autorizada.
- Variante redundante sem diferença nem função de base autorizada falha.
- Tipo de mídia desconhecido falha.
- Política responsiva desconhecida falha.
- `desktop_only` com conteúdo essencial falha.
- Formulário completo em `hero.standard` falha.
- Faixa, limite e comportamento inválidos falham.
- Valor da raiz não é duplicado.
- Fontes excedentes ou `itemKey` desconhecido falham.
- `business_buyer` indevido falha.
- Elegibilidade incompatível com o propósito falha.
- Módulo `candidate` não resolve para uso.
- Módulo ou variante `deprecated` não resolve para `new_use`.
- Resultado é profundamente imutável.
- Versão antiga permanece resolvível.
- Versão publicada de catálogo, módulo ou variante não pode ser sobrescrita.
- Extensão declarativa compatível não exige alteração do contrato, schema ou resolver.
- Mudança de contrato sem nova versão aplicável falha.
- Sem imports de banco, Supabase, env, API, renderer, rota ou Admin.

### 2.15. Fluxo operacional

- Gatilho:
  - evolução da raiz mergeada;
  - plano v2 mergeado;
  - fase instruída.
- Entrada:
  - raiz compatível;
  - plano E18.5;
  - catálogo aprovado derivado da grade candidata;
  - `item_key` oficiais;
  - decisões humanas registradas.
- Processamento:
  - contratos, registry, schema, resolver, evidências, fields, policies, deltas, mapas, perfis, lifecycle e casos executáveis.
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
- Objetivo: implementar o contrato repo-only dos módulos e variantes iniciais individualmente aprovados.
- Critérios de aceite:
  - grade metodológica comum aplicada;
  - módulos transversais individualmente aprovados;
  - nenhuma duplicação da raiz;
  - compatibilidade e capabilities validadas;
  - Hero e `hero.standard` conforme contrato aprovado;
  - catálogo imutável e resolver fail-closed;
  - extensão futura comum pelo registry e casos de validação;
  - evolução de infraestrutura somente quando o contrato fechado não atender;
  - nenhum taxon, composição, banco, renderer ou geração.
- Próxima ação:
  - avaliar e ajustar a grade consolidada do Hero;
  - fechar o Hero por decisão humana;
  - somente depois iniciar `trust_bar`;
  - seguir módulo por módulo na ordem da grade;
  - dividir depois em fases executáveis;
  - concluir as evoluções necessárias da raiz;
  - realizar avaliação única dos especialistas;
  - consolidar v2 e solicitar merge humano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Implementação da evolução da raiz no PR #577.
- Valores concretos da nova raiz.
- Módulos identificados por corretor, imóveis, médio padrão ou outro taxon.
- Implementação específica dos taxons usados como evidência.
- Cadastro dinâmico de módulos ou variantes no banco ou Admin.
- Catálogo de entradas, valores reais, taxonomia ou resolução de pesquisas.
- Composição, ordem global, prontidão de taxon ou conta de teste.
- Geração, IA, prompt, schema final, renderer, render model ou publicação.
- Tracking, analytics, teste A/B, Admin, Builder ou editor visual.
- Banco, migration, RPC, policy, grant, trigger, storage ou upload.
- CRM, webhook, job, agente, automação, workflow ou nova infraestrutura.
- Nova dependência, bundler ou alteração em `commercial_activation`.
- Criação de módulo de formulário neste recorte.
- Aprovação de galeria, carrossel ou tour como campo do Hero.

### 4.2. Critérios de parada

Parar se:

- a raiz compatível não estiver mergeada ou não garantir a capability;
- surgir fallback automático;
- módulo ou variante depender do taxon usado como evidência;
- surgir necessidade de banco, composição, geração ou renderer;
- faltar `item_key` oficial;
- diferença puder ser atendida por conteúdo, parâmetro ou composição;
- houver ampliação de limite absoluto;
- houver tentativa de sobrescrever catálogo, módulo ou variante já publicado;
- uma necessidade nova exigir alteração de contrato sem versionamento próprio;
- formulário completo for incorporado silenciosamente ao Hero;
- mídia essencial for ocultada no mobile;
- houver conflito com E18.4, E20, E19 ou `commercial_activation`;
- surgir nova dependência ou artefato fora do escopo;
- preservação histórica não puder ser garantida.

### 4.3. Decisão atual

- PR #577 preservado e plano-base mantido em v1.
- Fonte principal: `Corretor Imóveis`, `end_customer`, `lp_sections` v1 ativa.
- Fonte complementar: `Corretor de imóveis de médio padrão`.
- Grade metodológica comum registrada para todos os módulos.
- A grade comum possui núcleo obrigatório e blocos condicionais.
- Grade inicial limitada aos candidatos:
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
- Hero registrado com sete campos, mídia opcional e fronteira explícita com formulário.
- `mediaKind = image | video` não cria variante.
- `all_viewports | desktop_only` é escolha responsiva por ocorrência, dependente de capability futura da raiz, e não cria variante.
- Formulário completo não pertence a `hero.standard`.
- `hero.standard` é a única variante inicial e possui delta vazio autorizado.
- `body.editorialEmphasis` é padrão; `body.base` é alternativa explícita; fallback é proibido.
- Lifecycle inicial proposto do Hero e da variante: `experimental`.
- A criação futura comum de módulos e variantes será declarativa em `registry.ts`, acompanhada de casos em `validation-cases.ts` e nova versão aplicável.
- `contracts.ts`, `schema.ts` e `resolver.ts` só serão alterados quando a necessidade não couber no contrato fechado existente.
- Versões publicadas são imutáveis; campo novo exige nova `moduleVersion` e capability comum exige nova `rootVersion`.
- Uso por taxon pertence à composição da E20.
- A implementação permanece bloqueada.
- Próxima decisão humana: avaliar e ajustar o Hero antes de iniciar `trust_bar`.
