14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/template-blueprint.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, `lib/conversion-content/landing-page/`, contratos atuais de templates, compositions e módulos, PRs #559, #563, #564, #566, #567 e #577, avaliações do Analista e decisões humanas de 14 e 15/07/2026.

Versão: v1 em ajuste.

Status: PR vivo para debate e avaliação; decisões conceituais aprovadas incorporadas nesta v1; plano-base v2 ainda não consolidado; definição material da E18.5 bloqueada até a evolução versionada da raiz que garanta o tratamento editorial requerido pelo Hero e até o merge humano da v2 do PR #577.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Pré-requisitos confirmados

- O PR #559 foi mergeado na `main` em 13/07/2026.
- A E18.4 foi concluída, aprovada, documentada e formalmente encerrada.
- A parametrização raiz v1 está implementada em `lib/conversion-content/landing-page/`.
- A raiz v1 possui registry versionado, schema estrito, resolver fail-closed, saída profundamente imutável, papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos, opções comuns de espaçamento, critérios visuais e presets.
- A raiz v1 não garante `body.editorialEmphasis` em todos os presets:
  - o tratamento é opcional no contrato compartilhado;
  - o preset `balanced` o possui;
  - o preset `compact` não o possui.
- A decisão de produto é que o subtítulo do Hero normalmente use maior ênfase, sem fallback automático para texto-base.
- Essa garantia exige evolução versionada da raiz em recorte e PR próprios, preservando integralmente a `rootVersion 1`.
- A precedência obrigatória é:
  - parametrização raiz;
  - módulo;
  - variante.
- `commercial_activation`, E18.2 e E18.3 permanecem integralmente preservados.

### 1.2. Estado processual

- O plano-base v1 e o PR #577 já existem.
- O debate conceitual permanece aberto para fechar o contrato da E18.5.
- As decisões aprovadas neste debate devem ser incorporadas no mesmo PR.
- Não reiniciar o fluxo em novo arquivo ou novo PR.
- A evolução da raiz será planejada e implementada em recorte e PR próprios.
- O PR #577 registra somente a dependência e o contrato esperado; não incorpora tamanhos concretos nem detalhes internos da nova raiz.
- A versão v2 será declarada somente após:
  - conclusão do debate necessário;
  - recebimento dos pareceres aplicáveis;
  - consolidação única dos retornos;
  - decisão humana sobre os pontos pendentes;
  - confirmação da evolução versionada da raiz necessária para o Hero.
- O Executor da E18.5 não pode ser instruído antes do merge humano da evolução da raiz e da v2 do PR #577.

### 1.3. Princípio canônico de herança

- A raiz contém todas as regras comuns da família `landing_page`.
- O módulo não repete valores da raiz.
- O módulo declara:
  - função estrutural;
  - catálogo fechado de campos;
  - associação de cada campo a um papel semântico da raiz;
  - cardinalidade;
  - fontes de copy;
  - política de valor operacional;
  - tratamento tipográfico padrão e alternativas permitidas somente quando disponibilizados pela raiz;
  - somente exceções próprias e justificadas.
- A variante não repete o módulo.
- A variante declara somente deltas fechados e tipados sobre campos já previstos pelo módulo.
- A composição futura pode selecionar, por ocorrência, somente opções previamente autorizadas pelo módulo ou variante.
- O resolver aplica:
  - raiz;
  - módulo;
  - variante;
  - seleção válida por ocorrência quando o contrato futuro da composição a fornecer.
- O consumidor recebe o contrato efetivo completo e profundamente imutável.
- E20, E19, geração, validação e renderer futuros não podem reaplicar a herança por conta própria.
- O renderer executa o tratamento resolvido; não escolhe fallback nem corrige ausência de capability.

### 1.4. Regras de exceção

- Campo sem exceção herda integralmente a raiz.
- Módulo pode restringir ou selecionar capacidades da raiz quando a função estrutural justificar.
- Variante pode restringir o módulo quando sua execução reutilizável justificar.
- Escolha por ocorrência não cria variante quando já estiver autorizada no contrato do módulo.
- Módulo ou variante não pode ampliar limite técnico absoluto da raiz.
- Necessidade acima do limite absoluto deve primeiro avaliar:
  - revisão do texto;
  - divisão do conteúdo;
  - mudança do papel semântico;
  - nova estrutura do módulo.
- Nova `rootVersion` só deve ser avaliada quando a necessidade comum e comprovada não puder ser atendida pelas alternativas anteriores.
- Ultrapassar faixa recomendada, permanecendo dentro do limite absoluto, não torna o conteúdo inválido e não cria variante automaticamente.
- Diferença apenas de taxon, conteúdo, campanha, entrada da conta, origem de tráfego, funil ou composição não cria módulo nem variante.

### 1.5. Decisões técnicas incorporadas

- Valores já existentes na raiz não serão copiados para módulos ou variantes.
- Especializações numéricas gerais observadas apenas no primeiro Blueprint não entram automaticamente no contrato.
- Obrigatoriedade e quantidade serão representadas somente por cardinalidade:
  - `{ min: 1, max: 1 }` para campo único obrigatório;
  - `{ min: 0, max: 1 }` para campo único opcional;
  - `{ min, max }` para coleções.
- Não haverá propriedade `required` separada.
- Não haverá objeto livre `structuralRules`.
- Não haverá `addedFields` livre em variantes.
- Campo realmente novo exige nova versão do contrato do módulo.
- `structuralBehavior`, caso necessário, deverá ser união fechada, aprovada e validável.
- Deltas de variante são internos ao registry e ao resolver.
- O contrato público resolvido não expõe operações de delta para o consumidor aplicar.
- A E18.5 não cria mapeamento tipográfico geral como `paragraph → body.base` para toda a família.
- A E18.5 pode selecionar tratamento tipográfico disponibilizado e garantido pela raiz para um campo específico do módulo.
- O Hero define para `subtitle`:
  - `semanticRole = paragraph`;
  - tratamento padrão `body.editorialEmphasis`;
  - tratamentos permitidos `body.editorialEmphasis` e `body.base`.
- `body.base` é alternativa explícita autorizada, nunca fallback automático.
- A E20 poderá selecionar `body.base` por ocorrência concreta do Hero quando houver justificativa.
- A E18.5 dependerá explicitamente da versão da raiz que garanta `body.editorialEmphasis` em todos os presets compatíveis.
- A forma concreta de preservar contratos da versão 1 e garantir a capability na versão seguinte pertence ao plano e ao PR próprios da evolução da raiz.
- O futuro renderer deverá consumir o contrato resolvido, sem hardcode independente e sem escolher tratamento.
- `hero.media_split` não está aprovada.
- Mídia obrigatória, isoladamente, não comprova uma variante.
- O catálogo inicial pode ter apenas uma variante para determinado módulo.

### 1.6. Estado técnico confirmado

- Boundary raiz atual:
  - `lib/conversion-content/landing-page/`.
- Namespace público atual:
  - `landingPageRoot`.
- Não existem atualmente para `landing_page`:
  - catálogo de módulos;
  - variantes;
  - schemas finais de conteúdo;
  - composição;
  - renderer;
  - render model.
- O banco possui estruturas transversais de templates e compositions, mas elas não autorizam registros de `landing_page` nesta fase.
- A E18.5 será repo-only.
- Composição concreta e registros por taxon pertencem à E20.
- Seleção por ocorrência entre tratamentos previamente autorizados pertence à E20.
- Geração, snapshot, persistência e ciclo das LPs por conta pertencem à E19.
- `account_landing_pages` não será alterada neste recorte.

### 1.7. Pontos ainda em debate

- Conjunto inicial exato de módulos.
- Ordem de definição dos módulos.
- Uso do Hero como módulo-piloto antes de ampliar o catálogo.
- Critério mínimo de evidência para:
  - criar módulo;
  - criar variante;
  - criar exceção estrutural.
- Necessidade real de múltiplas variantes no primeiro catálogo.
- Contratos fechados de comportamento estrutural que forem efetivamente necessários.
- Mapa de fontes de copy de cada módulo.
- Adaptação dos perfis BOFU, MOFU e TOFU por módulo.
- Lifecycle inicial de cada módulo e variante.
- Validação necessária para promoção de `experimental` para `validated`.

## 2. Contrato do caso

### 2.1. Problema

- A raiz já define as regras comuns, mas ainda não existe contrato aprovado para:
  - funções estruturais dos módulos;
  - campos e cardinalidades;
  - variantes reutilizáveis;
  - exceções justificadas;
  - `copy_source_map`;
  - `funnel_copy_profile`;
  - tratamentos por BOFU, MOFU e TOFU;
  - lifecycle e compatibilidade histórica.
- A raiz v1 não garante o tratamento editorial definido como padrão do subtítulo do Hero em todos os presets.
- Repetir parâmetros da raiz nos módulos criaria múltiplas fontes da verdade.
- Permitir variantes abertas criaria especializações por taxon, campanha ou conteúdo.
- Entregar deltas aos consumidores faria cada camada reimplementar a precedência.
- Usar `body.base` como fallback ocultaria a ausência da capability e transformaria exceção deliberada em degradação silenciosa.

### 2.2. Resultado esperado

- Criar fonte repo-only versionada para módulos e variantes.
- Definir catálogo inicial pequeno e sustentado por evidência.
- Fazer módulos herdarem a raiz sem repetição.
- Fazer variantes registrarem apenas deltas.
- Fazer o resolver retornar contrato efetivo completo e imutável.
- Fazer a E18.5 depender somente de raiz compatível com as capabilities tipográficas que selecionar.
- Definir no Hero a ênfase como padrão do subtítulo e `body.base` como alternativa explícita.
- Deixar a escolha por ocorrência para a composição futura, dentro das opções autorizadas.
- Definir fontes de copy usando apenas `item_key` oficiais.
- Separar valores factuais operacionais de orientação de pesquisa.
- Definir BOFU, MOFU e TOFU como perfis de transformação, não como variantes.
- Preservar versões antigas para leitura histórica.
- Entregar validação executável sem banco, composição, geração ou renderer.

### 2.3. Fonte e critério para parametrização

A decisão sobre módulo, variante ou exceção deve seguir esta ordem de evidência:

1. Parametrização raiz:
   - contrato comum obrigatório;
   - fonte dos papéis, limites, treatments e opções permitidas.
2. `docs/lp-planejamento.md`:
   - fronteiras entre raiz, módulo, variante, composição, conteúdo e entradas.
3. Itens estruturados oficiais:
   - `strategic_core`;
   - `lp_overview`;
   - `lp_sections`;
   - `seo`.
4. Blueprints e referências reais:
   - evidência para funções, estruturas, campos e riscos;
   - recomendação sem sustentação suficiente permanece hipótese.
5. Decisão interna de produto:
   - pode definir padrão funcional próprio do LP Factory 10;
   - não deve ser apresentada como regra universal da web.
6. LP real validada:
   - evidência posterior para promover, restringir, substituir ou depreciar contratos.

Critérios:

- Criar módulo somente quando existir função estrutural reutilizável não coberta.
- Criar variante somente quando existir mudança reutilizável de estrutura, execução ou comportamento dentro da mesma função.
- Não criar variante quando a diferença puder ser atendida por:
  - conteúdo;
  - parâmetro herdado;
  - escolha de ocorrência autorizada;
  - composição;
  - fonte de copy;
  - perfil de funil;
  - valor operacional.
- Não generalizar para toda a família um valor observado apenas em um nicho.
- Não usar fallback para mascarar ausência de capability requerida pelo módulo.

### 2.4. Identidade e versionamento previstos

- Identidade inicial prevista:
  - `family = landing_page`;
  - `rootVersion = versão que garanta body.editorialEmphasis em todos os presets compatíveis`, prevista como evolução da versão 1 em recorte próprio;
  - `moduleCatalogVersion = 1`.
- O registry deve ser explícito:
  - `moduleCatalogVersion → catálogo imutável`.
- Módulo:
  - `moduleKey`;
  - `moduleVersion`;
  - `lifecycle`;
  - `structuralFunction`;
  - `fieldCatalog`.
- Variante:
  - `variantKey`;
  - `variantVersion`;
  - `moduleKey`;
  - `lifecycle`;
  - deltas fechados.
- Regras:
  - `rootVersion` e `moduleCatalogVersion` obrigatórios;
  - compatibilidade explícita entre catálogo e raiz;
  - a E18.5 não aceita raiz sem a capability requerida pelo Hero;
  - sem catálogo padrão implícito;
  - sem fallback silencioso;
  - versões publicadas imutáveis;
  - mudança incompatível cria nova versão aplicável;
  - a forma tipada de preservar a versão 1 e exigir a capability na nova versão será definida no recorte próprio da raiz.

### 2.5. Contrato-base de campo

Cada campo do módulo deve declarar:

- `fieldKey`;
- `semanticRole`;
- `cardinality`;
- `copySourceMap`;
- `operationalValuePolicy`.

Quando o módulo selecionar tratamento tipográfico garantido pela raiz, o campo também pode declarar:

- `defaultTypographyTreatment`;
- `allowedTypographyTreatments`.

Regras:

- `semanticRole` referencia papel existente na raiz.
- `cardinality` contém apenas `min` e `max`.
- `min` deve ser maior ou igual a zero.
- `max` deve ser maior ou igual a `min`.
- Campo único usa `max = 1`.
- Coleção usa `max > 1`.
- Nenhum limite ou tamanho da raiz é copiado.
- Exceção opcional só entra com justificativa:
  - `recommendedRangeOverride`;
  - `absoluteMaxRestriction`.
- `recommendedRangeOverride` deve respeitar o limite absoluto efetivo.
- `absoluteMaxRestriction` só pode reduzir o teto herdado.
- `defaultTypographyTreatment` deve referenciar capability garantida pela raiz compatível.
- `defaultTypographyTreatment` deve pertencer a `allowedTypographyTreatments`.
- `allowedTypographyTreatments` deve ser lista fechada de referências válidas da raiz.
- A ausência da capability requerida falha fechado; não aciona fallback.
- Esse contrato não cria um mapeamento tipográfico geral para todos os papéis semânticos.
- Campo factual deve declarar política operacional e não pode ser preenchido como fato por pesquisa.

### 2.6. Contrato de variante

A variante referencia apenas campos existentes no `fieldCatalog` do módulo.

Deltas permitidos, quando aprovados:

- mudança de cardinalidade;
- remoção de campo opcional;
- ativação obrigatória de campo já previsto;
- restrição de faixa recomendada;
- restrição de limite absoluto;
- restrição de tratamentos tipográficos já autorizados pelo módulo;
- comportamento estrutural enumerado e fechado.

Deltas proibidos:

- campo livre novo;
- papel semântico inexistente;
- tratamento tipográfico inexistente ou não autorizado pelo módulo;
- ampliação do limite absoluto;
- regra arbitrária;
- taxon;
- campanha;
- conteúdo concreto;
- valor de conta;
- composição;
- ordem global da LP;
- URL ou destino real;
- classe, token ou componente visual concreto.

O resolver deve validar o delta e retornar apenas o contrato efetivo final.

### 2.7. Módulo-piloto `hero`

#### 2.7.1. Função estrutural

- Apresentar o recorte da LP, a proposta de valor e a principal ação esperada.
- Não representar:
  - taxon;
  - campanha;
  - origem de tráfego;
  - BOFU, MOFU ou TOFU;
  - composição.

#### 2.7.2. Catálogo fechado de campos proposto

- `eyebrow`:
  - papel: `eyebrow`;
  - cardinalidade: `{ min: 0, max: 1 }`.
- `title`:
  - papel: `h1`;
  - cardinalidade: `{ min: 1, max: 1 }`.
- `subtitle`:
  - papel: `paragraph`;
  - cardinalidade: `{ min: 1, max: 1 }`;
  - `defaultTypographyTreatment: body.editorialEmphasis`;
  - `allowedTypographyTreatments`:
    - `body.editorialEmphasis`;
    - `body.base`.
- `primaryCta.label`:
  - papel: `cta_label`;
  - cardinalidade: `{ min: 1, max: 1 }`.
- `secondaryCta.label`:
  - papel: `cta_label`;
  - cardinalidade: `{ min: 0, max: 1 }`.
- `proofShort`:
  - papel: `paragraph`;
  - cardinalidade: `{ min: 0, max: 1 }`.
- `media`:
  - referência abstrata de mídia;
  - cardinalidade: `{ min: 0, max: 1 }`.

#### 2.7.3. Herança e exceções

- Todos os campos textuais herdam faixas, limites e valores concretos da raiz.
- Não há na proposta atual:
  - faixa numérica própria;
  - limite absoluto próprio;
  - tamanho de fonte próprio;
  - spacing próprio.
- `subtitle` permanece semanticamente `paragraph`.
- `subtitle` seleciona `body.editorialEmphasis` como tratamento padrão disponibilizado pela raiz compatível.
- `body.base` é alternativa permitida para seleção explícita por ocorrência futura.
- A ausência de `body.editorialEmphasis` no preset é incompatibilidade, não autorização para fallback.
- A existência de mídia não define sozinha nova variante.

#### 2.7.4. Variante inicial em debate

- `hero.standard`:
  - usa o contrato-base do Hero;
  - herda `body.editorialEmphasis` como padrão do subtítulo;
  - não possui delta numérico;
  - mídia permanece opcional.
- `hero.media_split`:
  - rejeitada como variante aprovada no estado atual;
  - pode voltar ao debate somente com mudança estrutural reutilizável e contratualmente fechada.
- Variante criada apenas para trocar `body.editorialEmphasis` por `body.base`:
  - proibida;
  - a escolha pertence à ocorrência futura da composição, dentro das opções do módulo.
- Variante específica de nicho:
  - proibida.

### 2.8. `copy_source_map`

Cada referência deve declarar:

- `audienceScope`;
- `researchBlock`;
- `itemKey`;
- `sourceRole`.

Regras:

- `sourceRole`:
  - `primary`;
  - `auxiliary`.
- Até 2 fontes primárias e 1 auxiliar por campo.
- Copy para visitante usa `end_customer` como fonte primária.
- `business_buyer` só pode auxiliar quando o campo tratar:
  - autoridade do fornecedor;
  - processo real;
  - posicionamento do negócio;
  - prova institucional.
- `business_buyer` não substitui dor, desejo, objeção, intenção de busca ou vocabulário do visitante.
- Blocos factuais de copy:
  - `strategic_core`;
  - `seo`.
- `lp_overview` pode orientar contexto de transformação, sem fornecer fato.
- `lp_sections` orienta composição futura, sem virar fonte fixa de campo.
- Chave desconhecida falha fechado.
- Valor operacional não pode ser inferido como fato a partir da pesquisa.

Mapa inicial do Hero para debate:

- `title`:
  - primárias:
    - `end_customer.strategic_core.positioning_opportunity`;
    - `end_customer.strategic_core.desire`;
  - auxiliar:
    - `end_customer.seo.commercial_keywords`.
- `subtitle`:
  - primárias:
    - `end_customer.strategic_core.pain`;
    - `end_customer.strategic_core.desire`;
  - auxiliar:
    - `end_customer.strategic_core.belief`.
- CTAs:
  - primária:
    - `end_customer.strategic_core.trigger`;
  - auxiliar:
    - `end_customer.seo.search_intent`.
- `proofShort`:
  - primária:
    - `end_customer.strategic_core.proof_type`;
  - auxiliar:
    - `end_customer.strategic_core.objection`.

### 2.9. `funnel_copy_profile`

Perfis previstos:

- `bofu`;
- `mofu`;
- `tofu`.

Regras:

- Perfil não é canal, módulo, variante, taxon ou composição.
- O perfil orienta transformação da copy.
- O perfil não altera:
  - schema;
  - cardinalidade;
  - limite absoluto;
  - estrutura aprovada.
- Módulo adapta o perfil à sua função.
- Variante pode apenas restringir ou especializar comportamento permitido.
- Tratamento proibido não pode ser promovido por variante.

Direção do Hero:

- BOFU:
  - recorte específico;
  - benefício concreto sustentado;
  - objeção direta;
  - CTA de maior intenção.
- MOFU:
  - diferenciação;
  - explicação;
  - prova contextual;
  - CTA proporcional.
- TOFU:
  - contexto;
  - dor e desejo;
  - baixa pressão;
  - CTA de baixa fricção.

### 2.10. Tratamentos comerciais

Tratamento comercial só pode ser usado com fonte real aplicável.

Tratamentos a governar:

- promessa;
- prova;
- autoridade;
- credencial;
- comparação;
- preço;
- oferta;
- desconto;
- garantia;
- urgência;
- escassez;
- resultado;
- depoimento;
- métrica.

Regras gerais:

- Pesquisa pode orientar tema, objeção, desejo, posicionamento e tipo de prova.
- Pesquisa não fornece como fato:
  - preço;
  - condição;
  - prazo;
  - disponibilidade;
  - garantia;
  - credencial;
  - depoimento;
  - métrica;
  - registro;
  - contato;
  - endereço;
  - URL;
  - informação legal específica.
- Valor factual exige entrada operacional ou fonte própria futura.
- BOFU admite maior intensidade apenas quando sustentada.
- MOFU restringe pressão e prioriza comparação e explicação.
- TOFU proíbe urgência, escassez e pressão artificial.

### 2.11. Lifecycle e compatibilidade

Lifecycle previsto:

- `candidate`;
- `experimental`;
- `validated`;
- `deprecated`.

Significado:

- `candidate`:
  - em avaliação;
  - não pode entrar em composição ou geração.
- `experimental`:
  - uso apenas em teste controlado.
- `validated`:
  - aprovado por LP real e decisão humana.
- `deprecated`:
  - não entra em novo uso;
  - permanece resolvível para histórico.

Propósitos previstos:

- `controlled_test`;
- `new_use`;
- `historical_read`.

Regras:

- `controlled_test` aceita `experimental` e `validated`.
- `new_use` aceita somente `validated`.
- `historical_read` aceita versão exata `experimental`, `validated` ou `deprecated`.
- `candidate` não é resolvível para uso.
- LP futura deve preservar snapshot das versões efetivas.
- Renderer futuro deve resolver o contrato exato do snapshot.
- Remoção física exige ausência de dependência publicada ou plano de migração aprovado.

### 2.12. Contrato de resolução previsto

Resolver público previsto:

- `resolveLandingPageModuleVariant(...)`.

Entrada mínima:

- `rootVersion`;
- `moduleCatalogVersion`;
- `moduleKey`;
- `variantKey`;
- `purpose`.

Processamento:

1. resolver raiz;
2. validar compatibilidade e capabilities do catálogo;
3. resolver módulo;
4. validar referências tipográficas do módulo;
5. validar delta da variante;
6. aplicar precedência;
7. aplicar seleção por ocorrência quando fornecida por contrato futuro compatível;
8. calcular contrato efetivo;
9. validar lifecycle e propósito;
10. retornar resultado profundamente imutável.

Saída pública:

- identidades e versões;
- lifecycle;
- função estrutural;
- campos finais;
- cardinalidades finais;
- papéis semânticos;
- fontes finais;
- políticas operacionais;
- tratamentos tipográficos finais;
- limites efetivos quando houver exceção;
- comportamento estrutural efetivo quando aprovado.

A saída não contém operações de delta nem fallback para o consumidor executar.

### 2.13. Artefatos previstos

Criar somente após a evolução da raiz e a v2 deste plano serem mergeadas:

- `lib/conversion-content/landing-page/module-catalog/contracts.ts`;
- `lib/conversion-content/landing-page/module-catalog/registry.ts`;
- `lib/conversion-content/landing-page/module-catalog/schema.ts`;
- `lib/conversion-content/landing-page/module-catalog/resolver.ts`;
- `lib/conversion-content/landing-page/module-catalog/validation-cases.ts`;
- `lib/conversion-content/landing-page/module-catalog/index.ts`.

Ajustar:

- `lib/conversion-content/index.ts`;
- `package.json`;
- `docs/lousa-plano-base-e18-5.md`, somente para estado e evidências da fase.

Preservar:

- `landingPageRoot` e versões históricas da raiz;
- `commercial_activation`.

Interface pública agregada prevista:

- `landingPageModules`.

Script previsto:

- `validate:landing-page-modules`.

Não adicionar dependência npm.

### 2.14. Validações mínimas previstas

- Catálogo e versões válidos.
- Compatibilidade explícita com a raiz.
- Capability tipográfica requerida pelo módulo presente na raiz compatível.
- Referência tipográfica desconhecida falha.
- Tratamento padrão fora da lista permitida falha.
- Ausência de `body.editorialEmphasis` em preset compatível falha.
- Fallback automático para `body.base` falha.
- Seleção por ocorrência fora da lista autorizada falha.
- Módulo desconhecido falha fechado.
- Variante desconhecida falha fechado.
- Variante vinculada ao módulo errado falha fechado.
- Campo da variante fora do catálogo do módulo falha.
- Cardinalidade inválida falha.
- Papel semântico desconhecido falha.
- Valor da raiz não é duplicado no módulo.
- Exceção acima do limite absoluto falha.
- Ampliação de restrição pelo nível filho falha.
- Regra estrutural não enumerada falha.
- `copy_source_map` excedendo fontes permitidas falha.
- `itemKey` desconhecido falha.
- Fonte de `business_buyer` usada indevidamente falha.
- Fato operacional originado da pesquisa falha.
- Perfil de funil desconhecido falha.
- Tratamento proibido promovido por variante falha.
- Lifecycle incompatível com propósito falha.
- Resultado resolvido é profundamente imutável.
- Chamadas não compartilham referências mutáveis.
- Versão antiga permanece resolvível.
- Ausência de imports de banco, Supabase, env, API, renderer, rota ou Admin.

### 2.15. Fluxo operacional

- Gatilho:
  - evolução versionada da raiz mergeada;
  - plano-base v2 consolidado e mergeado;
  - fase instruída pelo Estrategista.
- Entrada:
  - raiz versionada compatível com a capability requerida;
  - plano-base E18.5;
  - catálogo aprovado;
  - `item_key` oficiais;
  - evidências aprovadas.
- Processamento:
  - contratos;
  - registry;
  - schema;
  - resolver;
  - validação de deltas;
  - tratamentos tipográficos autorizados;
  - mapas;
  - perfis;
  - lifecycle;
  - casos executáveis.
- Validação:
  - `npm ci`;
  - `npm run validate:landing-page-root`;
  - `npm run validate:landing-page-modules`;
  - `npm run validate:commercial-activation`;
  - `npm run check`;
  - `git diff --check`;
  - checks do PR.
- Persistência:
  - repositório;
  - sem banco.
- Consumo:
  - E20 e E19 em fases futuras.
- Fallback:
  - falha fechada;
  - sem versão, capability, módulo, variante ou tratamento implícito;
  - conflito retorna ao Estrategista.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Catálogo versionado de módulos e variantes v1

- Status:
  - pendente;
  - bloqueada até o merge da evolução versionada da raiz, consolidação v2 e merge humano do plano-base.
- Automação:
  - não.
- Risco:
  - médio controlado.
- Objetivo:
  - implementar atomicamente o contrato repo-only aprovado para módulos e variantes.
- Escopo material previsto:
  - identidade e versões;
  - compatibilidade com capabilities da raiz;
  - módulos aprovados;
  - variantes aprovadas;
  - campos e cardinalidades;
  - tratamentos tipográficos autorizados;
  - deltas fechados;
  - resolução efetiva;
  - `copy_source_map`;
  - `funnel_copy_profile`;
  - tratamentos comerciais;
  - lifecycle;
  - compatibilidade histórica;
  - validações.
- Critérios de aceite:
  - nenhum valor comum da raiz duplicado;
  - versões históricas da raiz preservadas;
  - capability requerida validada;
  - `body.editorialEmphasis` padrão no subtítulo do Hero;
  - `body.base` somente como alternativa explícita autorizada;
  - nenhum fallback silencioso;
  - catálogo imutável;
  - resolver fail-closed;
  - consumidor recebe contrato efetivo;
  - variante não cria campo livre;
  - módulo e variante não representam taxon, campanha, conteúdo ou composição;
  - fatos operacionais não são inferidos da pesquisa;
  - nenhuma mudança de banco;
  - nenhum renderer, geração ou schema final de LP;
  - validações concluídas.
- Próxima ação:
  - abrir e concluir o recorte próprio da evolução da raiz;
  - continuar o debate do catálogo inicial;
  - consolidar os pareceres aplicáveis;
  - produzir v2 no mesmo PR;
  - solicitar merge humano;
  - somente depois instruir o Executor.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Implementação da evolução da raiz no PR #577.
- Valores tipográficos concretos da nova raiz.
- Forma interna de discriminar contratos das versões da raiz.
- Catálogo de entradas.
- Valores reais das entradas.
- Resolução de pesquisas.
- Nova regra de herança de `business_buyer`.
- Taxonomia.
- Composição base.
- Composição por taxon.
- Escolha concreta de tratamento por ocorrência.
- Ordem ou obrigatoriedade global das seções.
- Herança concreta de composição.
- Prontidão do taxon.
- Autorização de conta de teste.
- Entitlement.
- Geração de LP.
- IA de geração.
- Prompt de geração.
- Structured Output de conteúdo final.
- Schema final de conteúdo da LP.
- Renderer.
- Render model.
- Rota pública.
- Publicação.
- Tracking.
- Analytics.
- Teste A/B.
- Admin.
- LP Builder.
- Editor visual.
- Banco.
- Migration.
- RPC.
- Policy.
- Grant.
- Trigger.
- Nova tabela ou coluna.
- Storage.
- Upload.
- CRM.
- Webhook.
- Job.
- Agente.
- Automação.
- Workflow.
- Nova infraestrutura.
- Nova dependência.
- Configuração de bundler.
- Alteração em `commercial_activation`.

### 4.2. Critérios de parada

Parar e devolver ao Estrategista se:

- a evolução versionada da raiz não estiver mergeada;
- a raiz compatível não garantir a capability requerida;
- a implementação tentar aplicar fallback automático para `body.base`;
- a implementação exigir banco;
- surgir necessidade de registrar composição;
- surgir necessidade de escolher concretamente tratamento por ocorrência;
- surgir necessidade de gerar ou renderizar conteúdo;
- faltar `item_key` oficial necessário;
- uma variante depender de taxon, campanha ou entrada específica;
- uma diferença puder ser atendida por parâmetro, conteúdo ou composição;
- houver necessidade de ampliar limite absoluto da raiz;
- houver conflito com E18.4, E20 ou E19;
- a implementação exigir mudança de `commercial_activation`;
- a implementação exigir nova dependência;
- a implementação exigir URL, rota, formulário funcional ou integração;
- a preservação histórica não puder ser garantida;
- o diff ultrapassar os artefatos autorizados sem decisão humana.

### 4.3. Decisão atual

- PR #577 preservado.
- Plano-base permanece v1 em ajuste.
- Parecer do Analista aprovado.
- A evolução da raiz será tratada em recorte e PR próprios.
- A definição material da E18.5 fica bloqueada até essa evolução ser mergeada.
- O padrão de `hero.subtitle` será `body.editorialEmphasis`.
- `body.base` será alternativa explícita autorizada para futura escolha por ocorrência na E20.
- Fallback automático fica proibido.
- `hero.media_split` não aprovada.
- `hero.standard` permanece exemplo inicial em debate.
- Próxima decisão humana:
  - abrir o recorte próprio da evolução da raiz;
  - fechar a estrutura mínima do Hero;
  - decidir se o catálogo inicial será construído módulo a módulo;
  - definir o próximo módulo a debater.
