# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar nichos e orientar ajustes do projeto até a criação de LPs.

Fontes de referência: `README.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/template-blueprint.md`, `docs/schema.md`, `lib/conversion-content/landing-page/contracts.ts`, `lib/conversion-content/contracts.ts`, Google Ads Help, Google Search Central, web.dev Web Vitals e debate em chat.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- A entrega final é criar LPs testáveis e publicáveis por nicho ou ultranicho.
- Tipos/intenção de LP: BOFU, MOFU e TOFU.
- BOFU, MOFU e TOFU não são canais; o canal é `landing_page`.
- Origem de tráfego é separada do tipo da LP: Google Ads, Instagram Ads, WhatsApp, QR Code, orgânico ou outra origem.
- BOFU, MOFU e TOFU entram na geração da LP final a partir da intenção informada pelo cliente, sem exigir três composições oficiais por taxon no MVP.
- LP teste por nicho ou ultranicho é validação prática antes da liberação plena.

### 1.2. Preparar o taxon e os itens estruturados

- O taxon deve estar ativo e corretamente posicionado na taxonomia `segmento → nicho → ultranicho`.
- A comunicação do projeto deve seguir essa taxonomia, sem adotar a nomenclatura paralela `setor → segmento → nicho`.
- Exemplo: `imobiliário` como segmento, `corretor de imóveis` como nicho e `corretor de imóveis de médio padrão` como ultranicho.
- Os itens estruturados devem estar completos para `end_customer` no taxon específico e para `business_buyer` próprio ou herdado do taxon pai com critério.
- `strategic_core`: mensagem, promessa, objeções, provas, vocabulário e CTA.
- `lp_overview`: diretrizes para a composição, incluindo tom visual, densidade, tipografia, prioridade mobile, extensão e estilo de imagem.
- `lp_sections`: seções, ordem provável, função no funil e composição conceitual.
- `seo`: intenção, vocabulário, termos, FAQ e requisitos básicos de busca.
- Os itens estruturados não precisam entregar limites de caracteres, escala tipográfica, tamanho de fonte ou parametrização técnica por campo.
- Quando houver herança de composição, conteúdo, copy, FAQ, provas, oferta e CTA devem continuar específicos do taxon atendido.

### 1.3. Definir a parametrização raiz da LP

- A parametrização raiz é a fonte da verdade inicial para papéis semânticos, regras, faixas editoriais recomendadas, limites técnicos absolutos, critérios visuais e responsivos e opções permitidas para toda a família `landing_page`.
- Parâmetro por campo significa regra para H1, H2, H3, parágrafo, CTA, eyebrow, nota de privacidade, FAQ, cards, benefícios e passos.
- A parametrização raiz versionada deve alimentar ou originar os limites usados pela geração, validação e renderização, evitando fontes independentes e valores hardcoded divergentes.
- A fonte da verdade no repositório não exige configuração dinâmica em runtime; schemas, geração e renderer podem continuar estáticos quando derivarem do mesmo contrato versionado.
- Preset de LP é uma configuração ampla do conjunto da página e não se confunde com escolhas limitadas por ocorrência de seção.
- Os nomes e valores exatos dos presets ficam para o plano-base técnico.
- A parametrização raiz deve resolver as necessidades comuns da maioria dos nichos e ultranichos.
- Necessidade fora da raiz não implica automaticamente nova variante; deve ser classificada conforme módulo, composição, entradas, conteúdo ou mudança estrutural.
- Os valores exatos dos parâmetros permanecem hipóteses até validação pela primeira LP real.

### 1.4. Definir a parametrização de módulos e variantes

- A parametrização de módulos e variantes define campos, estruturas, limites, regras de copy e especializações permitidas sobre a raiz.
- A resolução das regras segue `parametrização raiz → especialização do módulo → especialização da variante`.
- Módulos herdam a raiz e registram apenas especializações justificadas para sua função estrutural.
- Variantes herdam o módulo e registram apenas especializações reutilizáveis de execução ou comportamento dentro da mesma função estrutural.
- Nova variante só deve ser criada quando houver mudança reutilizável de comportamento ou execução; mudança da função estrutural deve ser avaliada como novo módulo.
- Diferença de taxon, conteúdo, entrada da conta ou campanha, escolha de composição ou ajuste já permitido não justifica isoladamente nova variante.
- `spacing` é escolha limitada por ocorrência de seção, não preset de LP; o contrato atual da E18.4 aceita somente `compact`, `default` ou `spacious`.
- A parametrização deve separar `copy_source_map` e `funnel_copy_profile`.
- O `copy_source_map` define quais `item_key` cada campo de copy consulta.
- O `funnel_copy_profile` define como os insumos podem ser transformados em copy conforme BOFU, MOFU ou TOFU, incluindo tratamentos permitidos, restritos e proibidos.
- A família `landing_page` define o `funnel_copy_profile` padrão em recorte técnico posterior à parametrização raiz.
- Módulos adaptam o `funnel_copy_profile` ao papel da seção.
- Variantes só podem restringir ou sobrescrever o perfil e o mapa quando houver mudança de comportamento comercial.
- Cada campo de copy deve consultar no máximo 2 `item_key` principais e 1 `item_key` auxiliar, salvo decisão registrada no plano-base técnico.
- Escassez, garantia, prova, comparação, preço, promessa, credencial, autoridade, urgência e oferta só podem ser usados quando houver insumo real que sustente esse tratamento.
- Variante nova deve começar como candidata ou experimental até aprovação por LP teste ou avaliação humana.
- Variante depreciada não deve entrar em novas gerações, mas LPs existentes continuam renderizando com a variante e versão usadas.
- Variante antiga só pode ser retirada quando não houver artefato publicado dependente ou quando houver plano de migração aprovado.

### 1.5. Definir o catálogo de entradas para geração da LP

- O catálogo não parametriza o comportamento da LP; ele define quais entradas da conta, negócio atendido, oferta, campanha ou LP podem ser apresentadas e utilizadas na geração.
- A camada geral reúne entradas aplicáveis a todos os segmentos.
- A camada específica reúne campos próprios de um segmento ou nicho, conforme o nível adequado de reutilização.
- A camada de ultranicho só deve existir excepcionalmente e por decisão humana quando segmento e nicho não forem suficientes.
- O `lp_generation_input_catalog` define campos disponíveis, obrigatórios, opcionais e condicionantes, com herança `universal → segmento → nicho → ultranicho`.
- O catálogo informa as entradas disponíveis para a geração da LP final, mas não determina automaticamente a estrutura da composição base do taxon.
- O `paid_search_keyword_map` é uma entrada opcional para alinhar busca paga, anúncio e LP quando aplicável; não substitui os itens estruturados nem autoriza alteração dos contratos parametrizados.
- A fonte canônica inicial do catálogo deve ser versionada no repositório.
- Os valores reais informados pela conta, negócio atendido, oferta, campanha ou LP são dados operacionais e devem ser persistidos no BD, mas o local e o formato dependem de plano-base técnico.

### 1.6. Criar e aprovar a composição base do taxon

- A estrutura padrão permanece módulo + variante.
- A composição base do taxon não é a LP final; ela é o ponto de partida governado para gerar LPs concretas.
- A composição pode ser aprovada para segmento ou nicho. Composição própria de ultranicho deve ser excepcional e depender de decisão humana quando a composição herdável não atender.
- A IA propõe a composição a partir das duas parametrizações e dos itens estruturados `lp_overview`, `lp_sections`, `strategic_core` e `seo`.
- A composição registra módulos, variantes, ordem, obrigatoriedade e escolhas permitidas para o conjunto e para cada ocorrência.
- Essas escolhas são resultado da composição, não novas parametrizações.
- A composição seleciona somente opções permitidas pela resolução `parametrização raiz → módulo → variante`.
- O catálogo de entradas e as entradas particulares da conta, negócio atendido, oferta, campanha ou LP não determinam automaticamente sua estrutura.
- Composição aprovada no taxon pai é presumida herdável para taxons filhos, salvo marcação contrária.
- O taxon filho só herda a composição do taxon pai quando não houver composição própria aprovada.
- A herança não se aplica quando houver composição própria, módulo ou variante específica, restrição regulatória, falha técnica, editorial ou visual, ou marcação de não herança.
- Composição própria de ultranicho só deve ser criada quando a composição herdável não atender por estrutura, jornada, regulação, prova, oferta, formulário, qualificação ou resultado da LP teste.
- Gap essencial de módulo ou variante impede a aprovação plena até sua criação e parametrização.
- Com essas regras, o Critério 3 fica fechado em planejamento; a implementação depende de plano-base próprio.

### 1.7. Gerar a primeira LP do taxon

- A primeira LP usa a composição base aplicável, os itens estruturados do taxon, as entradas definidas para o teste e a intenção/funil informada.
- A geração pode adaptar copy, CTA, prova, FAQ, formulário, densidade e ordem permitida, sem alterar schema, renderer, módulos, variantes ou opções fora dos contratos aprovados.
- A geração não pode alterar o contrato parametrizado ao aplicar entradas, intenção/funil ou palavras-chave opcionais.
- O snapshot deve preservar os valores usados, a composição, as variantes e as versões da geração.
- A primeira LP gerada segue para validação como LP teste do taxon e do plano aplicável.

### 1.8. Validar e liberar a LP teste

- A validação ocorre por plano de liberação: `starter`, `lite`, `pro` e `ultra`.
- `starter` exige pelo menos 1 LP teste validada, com intenção/funil definido e conteúdo específico do taxon testado.
- A validação inclui critérios técnicos, visuais, editoriais, de conversão mínima e de performance de carregamento.
- Performance real de campanha, tráfego real, conversão real e Core Web Vitals de campo não são requisitos desta etapa.
- A validação de carregamento deve prevenir regressões em LCP, estabilidade visual, bloqueio de interação, peso de imagens, embeds, JavaScript excessivo, layout shift e fallback lento.
- Uma LP teste aprovada no taxon proprietário da composição base pode liberar o plano para os taxons descendentes que usem a mesma composição herdável.
- Uma LP teste aprovada em taxon descendente que use composição herdada também pode validar essa composição para o taxon proprietário e para os demais descendentes que usem a mesma versão.
- `lite`, `pro` e `ultra` só devem receber critérios próprios quando houver escopo real desses planos.

### 1.9. Gerar, revisar e publicar as LPs dos clientes

- Depois da liberação, a LP do cliente usa a composição aprovada, os itens estruturados do taxon, os valores reais fornecidos nas entradas previstas pelo catálogo e a intenção/funil informada.
- A geração mantém os mesmos limites de schema, renderer, módulos, variantes e tratamentos comerciais sustentados por dados reais.
- Cada LP deve preservar snapshot dos valores, composição, variantes e versões usados.
- O fluxo de revisão, edição e publicação das LPs dos clientes depende de plano-base próprio e não autoriza antecipação de Admin, editor visual ou nova infraestrutura neste documento.

### 1.10. Evoluir a base com as LPs validadas

- LPs testadas e LPs reais podem revelar ajustes necessários na parametrização raiz, módulos, variantes, catálogo de entradas, composição ou critérios editoriais.
- Mudanças devem ser reutilizáveis e passar por plano-base próprio; ajustes soltos por taxon devem ser evitados.
- O Benchmark Blueprint é complementar e opcional após a LP teste, sem bloquear a liberação.
- A comparação pode avaliar clareza, estrutura, copy, adequação ao taxon, visual, CTA, prova, conversão esperada, lacunas e riscos.
- O Blueprint não altera automaticamente banco, composição, renderer, schema, módulo, variante ou artefato final.

## 2. O que precisa ser ajustado ou implementado no projeto

### 2.1. Preparação do taxon e dos itens estruturados

- Confirmar regra operacional de taxon liberável usando `segmento → nicho → ultranicho`.
- Garantir leitura clara de taxon pai e filho para herança.
- Adequar a regra para aceitar `end_customer` no taxon específico e `business_buyer` próprio ou herdado do taxon pai.
- Registrar critério de segurança para herança de `business_buyer`.
- Bloquear liberação quando faltar bloco obrigatório.

### 2.2. Parametrização raiz da LP

- Definir primeiro a fonte versionada da família `landing_page`, incluindo papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos e critérios visuais e responsivos.
- Fazer a raiz alimentar ou originar os limites usados por schemas, geração e renderer, sem exigir configuração dinâmica em runtime.
- Aplicar a parametrização raiz aos schemas, à fixture e ao renderer existentes da E18.4, validando limites técnicos e comportamento visual e responsivo sem criar novos módulos ou uma LP final.
- Definir valores exatos, presets, relação com o design system, contrato de leitura e casos de validação em plano-base próprio.

### 2.3. Parametrização de módulos e variantes

- Confirmar o conjunto inicial de módulos e variantes antes de definir suas especializações.
- Definir `copy_source_map` por módulo, campo de copy e intenção/funil.
- Definir `funnel_copy_profile` padrão para BOFU, MOFU e TOFU e como módulos e variantes o adaptam.
- Definir tratamentos permitidos, restritos e proibidos por funil.
- Definir quando a necessidade é especialização do módulo, nova variante reutilizável ou novo módulo.
- Definir ciclo de vida das variantes e compatibilidade com LPs existentes.
- Impedir nova geração com variante depreciada e impedir sua retirada enquanto houver artefato publicado dependente, salvo migração aprovada.

### 2.4. Catálogo de entradas para geração da LP

- Definir o `lp_generation_input_catalog` com campos universais e nichados, obrigatórios, opcionais e condicionais.
- Separar catálogo declarativo, valores reais persistidos no BD e snapshot da geração.
- Definir onde e como os valores reais serão persistidos, sem autorizar nova tabela, campo ou payload antes do plano-base técnico.
- Definir `paid_search_keyword_map` opcional, origem de seus dados e regras de message match e uso natural, sem keyword stuffing.

### 2.5. Composição base do taxon

- Permitir composição aprovada para segmento ou nicho e composição própria de ultranicho somente de forma excepcional e por decisão humana.
- Permitir que a IA proponha módulos, variantes, ordem, obrigatoriedade e ajustes por ocorrência dentro das opções parametrizadas.
- Não usar o catálogo de entradas nem entradas particulares da conta, negócio atendido, oferta, campanha ou LP como decisão estrutural automática.
- Resolver onde a composição e suas escolhas serão persistidas.
- Manter `content_template_composition_items` como relação 1:N de módulos e variantes.
- Registrar gaps essenciais e bloquear aprovação plena até sua resolução.
- Permitir herança da composição aprovada do taxon pai quando não houver composição própria.

### 2.6. Geração, validação e liberação da primeira LP teste

- Gerar a LP com composição aplicável, itens estruturados, entradas de teste e intenção/funil.
- Permitir adaptações somente dentro das opções parametrizadas e da composição aprovada.
- Registrar snapshot dos valores, composição, variantes e versões usados.
- Impedir alteração livre de schema, renderer, módulo ou variante durante a geração.
- Definir checklist técnico, visual, editorial, responsivo, de conversão mínima e de carregamento.
- Definir ferramenta ou combinação de ferramentas para medição em ambiente de teste.
- Definir bloqueios para imagem pesada, embed pesado, JavaScript excessivo, layout shift e fallback lento.
- Registrar a liberação herdável do plano e da composição quando aplicável.

### 2.7. LPs dos clientes

- Definir em plano-base próprio o fluxo de geração, revisão, edição e publicação com dados reais.
- Preservar composição, contratos parametrizados, rastreabilidade e snapshot de cada geração.
- Não antecipar editor visual, Admin ou nova infraestrutura sem decisão e plano-base próprios.

### 2.8. Evolução controlada

- Definir como aprendizados de LPs validadas e do Benchmark Blueprint alimentam planos-base posteriores.
- Garantir que o Benchmark Blueprint permaneça opcional e sem alterações automáticas.
- Não criar catálogo universal multicanal sem evidência prática de duplicação e ROI.
- E10.7 e E19 permanecem separados; aprendizados podem ser reaproveitados, mas não autorizam converter páginas comerciais em LPs do Builder sem plano-base próprio.

## 3. Ordem dos planos-base técnicos

- 1º — parametrização raiz da família `landing_page`.
- 2º — parametrização de módulos e variantes, incluindo `copy_source_map` e `funnel_copy_profile`.
- 3º — catálogo de entradas para geração da LP.
- 4º — composição base do taxon e herança.
- 5º — geração, validação e liberação da primeira LP teste `starter`.
- 6º — geração, revisão e publicação das LPs dos clientes.
- O primeiro plano-base cobre somente contrato versionado da raiz, papéis semânticos, faixas editoriais, limites técnicos, critérios visuais e responsivos, relação com o design system, aplicação aos schemas, fixture e renderer existentes, contrato de leitura e casos de validação.
- Permanecem fora do primeiro plano todos os recortes posteriores listados acima, além de Admin e persistências ainda não decididas.
- A E18.4 permanece concluída e não deve ser reaberta.
- O primeiro plano pertence a `18.5 — Parametrização raiz da família landing_page`, com path previsto `docs/lousa-plano-base-e18-5.md`.
- O segundo plano pertence a `18.6 — Parametrização de módulos e variantes landing_page`, com path previsto `docs/lousa-plano-base-e18-6.md`.
- Os planos terceiro, quarto e quinto não pertencem automaticamente à E18 e serão distribuídos nos próximos blocos desta seção.
- Cada plano-base deve decidir somente a persistência, versões, snapshots, medições e superfícies necessárias ao próprio recorte.

## 4. Onde cada ajuste entra no roadmap

- Esta seção distribui tudo o que precisa ser ajustado ou implementado pelas seções e subseções correspondentes de `docs/roadmap.md`.
- Devem ser priorizadas subseções já existentes; novas seções ou subseções só devem ser propostas quando não houver proprietário adequado no roadmap atual.
- A distribuição registrada aqui orienta os planos-base, mas não altera automaticamente o roadmap.

### 4.1. E10 — Taxons e itens estruturados

- Tipo de intervenção: ajustar subseções existentes; não criar nova subseção na E10 para esta jornada.
- Subseções afetadas: `10.5.5.3` e `10.5.5.4`.
- Ajustar `10.5.5.3`, renomeando-a de `Recorte aprovado para consumo pela E10.7` para `Recortes aprovados para consumo`.
- Preservar em `10.5.5.3` o contrato já executado da E10.7, que exige pesquisas próprias `business_buyer` e `end_customer`, `active version 1`, com os quatro blocos fixos.
- Acrescentar em `10.5.5.3` o recorte distinto de `landing_page`: `end_customer` ativo no taxon específico e `business_buyer` ativo próprio ou herdado do taxon pai conforme critério de elegibilidade.
- Exigir nos insumos efetivamente resolvidos para `landing_page` os blocos `strategic_core`, `lp_overview`, `lp_sections` e `seo`, preservando a origem do taxon e da versão usados.
- Ajustar `10.5.5.4` para remover a pendência já superada de uso futuro dos dados pela E10.7.
- Registrar em `10.5.5.4` como pendência apenas a definição operacional da elegibilidade para `landing_page`, incluindo resolução e rastreabilidade do `business_buyer` herdado, no plano-base aplicável.
- Não ajustar `10.5.6` nem a E10.7, pois resolução do nicho da conta e página `commercial_activation` permanecem contratos separados.
- Esses ajustes não alteram schema, hierarquia dos taxons ou o histórico das implementações concluídas.

### 4.2. E12 — Operação administrativa das landing pages

- Tipo de intervenção: ajustar o contrato geral da E12 e criar um novo recorte funcional dentro da área existente de Templates.
- Subseções afetadas: `12.1.3`, `12.1.5` e nova `12.4`; não ampliar `12.3`, que permanece exclusiva da operação administrativa da E10.7.
- Ajustar `12.1.3` para manter as mutações administrativas gerais fora do escopo, exceto as operações mínimas aprovadas para a E10.7 e, quando implementadas, as operações específicas de landing pages definidas em `12.4`.
- Ajustar `12.1.5` para registrar que curadoria e aprovação de composição, LP teste e liberação do plano e da composição para consumo posterior não pertencem à base geral nem à E10.7, mas poderão ser implementadas somente pelo novo recorte `12.4`.
- Preservar `12.2` como base administrativa e leitura operacional read-only e preservar integralmente `12.3` como registro da operação de `commercial_activation`.
- Criar `12.4 — Operação administrativa de landing pages por taxon`, sem criar nova área na navegação, usando a área de Templates já prevista em `12.1.4`.
- O novo recorte deve permitir ao humano, conforme os contratos e persistências definidos nos planos-base aplicáveis:
  - verificar a elegibilidade do taxon e a origem dos itens estruturados resolvidos;
  - revisar, aprovar ou rejeitar a composição base e sua regra de herança;
  - gerar ou regenerar a primeira LP teste `starter`;
  - visualizar a LP teste com o renderer aplicável;
  - registrar a validação e a decisão de liberação vinculadas ao taxon, ao plano, à versão da composição e à versão ou identificação da LP teste avaliadas, incluindo responsável e momento da decisão.
- A E12 não será a fonte dos contratos de parametrização, módulos, variantes, catálogo de entradas ou composição; será a superfície responsável pelas operações humanas autorizadas sobre esses contratos.
- Estrutura prevista para o novo recorte no roadmap:
  - `12.4.1 — Objetivo e status`;
  - `12.4.2 — Registros do recorte`, somente quando houver implementação material;
  - `12.4.3 — Elegibilidade e fontes resolvidas`;
  - `12.4.4 — Revisão da composição e da herança`;
  - `12.4.5 — Geração e visualização da LP teste`;
  - `12.4.6 — Validação e decisão de liberação`.
- Enquanto `12.4` permanecer apenas conceitual, `12.4.2` pode ser omitida, sem reutilizar esse identificador para outro conteúdo.
- Permanecem fora de `12.4`: gestão das LPs dos clientes, LP Builder, editor visual, aprovação automática, publicação automática e infraestrutura nova não decidida pelos planos-base.
- Rota exata, actions, persistência, permissões, auditoria e evidências devem ser definidas somente nos planos-base que materializarem cada operação.
- A criação de `12.4` no roadmap não exige sua implementação junto ao primeiro plano-base; a superfície administrativa entra apenas quando composição, geração, validação ou liberação precisarem de operação humana.

### 4.3. E18 — Parametrização técnica da família `landing_page`

- Tipo de intervenção: ajustar o contrato transversal existente e criar dois novos recortes técnicos, um para cada plano-base de parametrização.
- Seções e subseções afetadas: objetivo e status da E18, `18.1.5`, nova `18.5` e nova `18.6`.
- Ajustar o objetivo e o status da E18 para registrar que a família `landing_page` deixa de ser apenas visão de consumidor futuro e passa a evoluir de forma controlada pelos recortes `18.5` e `18.6`.
- Ajustar `18.1.5` para reconhecer o catálogo mínimo próprio de `landing_page` já concluído em `18.4` e separar catálogo técnico de módulos e variantes das parametrizações que governam seus campos, limites e comportamentos.
- Preservar integralmente `18.2` e `18.3`, que permanecem vinculadas a `commercial_activation`, e preservar `18.4` como base técnica repo-only concluída.
- Criar `18.5 — Parametrização raiz da família landing_page`, responsável pela fonte versionada da verdade para papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos, critérios visuais e responsivos, presets, relação com o design system, contrato de leitura e aplicação aos schemas, fixture e renderer existentes.
- Estrutura prevista para `18.5`:
  - `18.5.1 — Objetivo e status`;
  - `18.5.2 — Registros do recorte`, somente quando houver implementação material;
  - `18.5.3 — Fonte versionada e resolução da parametrização raiz`;
  - `18.5.4 — Papéis semânticos e faixas editoriais`;
  - `18.5.5 — Limites técnicos, visuais e responsivos`;
  - `18.5.6 — Aplicação aos schemas, fixture e renderer`;
  - `18.5.7 — Validação e limites do recorte`.
- O plano-base de `18.5` terá path previsto `docs/lousa-plano-base-e18-5.md`.
- Criar `18.6 — Parametrização de módulos e variantes landing_page`, responsável pelas especializações permitidas sobre a raiz, incluindo campos, estruturas, limites, `copy_source_map`, `funnel_copy_profile`, tratamentos comerciais por intenção/funil e ciclo de vida das variantes.
- Estrutura prevista para `18.6`:
  - `18.6.1 — Objetivo e status`;
  - `18.6.2 — Registros do recorte`, somente quando houver implementação material;
  - `18.6.3 — Parametrização dos módulos`;
  - `18.6.4 — Parametrização das variantes`;
  - `18.6.5 — Mapa de fontes de copy`;
  - `18.6.6 — Perfis de copy por intenção e funil`;
  - `18.6.7 — Ciclo de vida, compatibilidade e validação`.
- O plano-base de `18.6` terá path previsto `docs/lousa-plano-base-e18-6.md`.
- Permanecem fora de `18.5` e `18.6`: elegibilidade do taxon, catálogo de entradas da geração, composição base por taxon, aprovação humana, geração da LP teste, liberação e ciclo das LPs vinculadas às contas.
- Os novos recortes não exigem parametrização dinâmica em banco ou runtime; qualquer persistência só poderá ser decidida no plano-base correspondente se houver necessidade real.
