# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar nichos e orientar ajustes do projeto até a criação de LPs.

Fontes de referência: `README.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/template-blueprint.md`, `docs/schema.md`, `lib/conversion-content/landing-page/contracts.ts`, `lib/conversion-content/contracts.ts`, Google Ads Help, Google Search Central, web.dev Web Vitals e debate em chat.

## 1. O que estamos definindo

### 1.1. Entrega final esperada

- A entrega final é criar LPs testáveis e publicáveis por nicho ou ultranicho.
- Tipos/intenção de LP: BOFU, MOFU e TOFU.
- BOFU, MOFU e TOFU não são canais; o canal é `landing_page`.
- Origem de tráfego é separada do tipo da LP: Google Ads, Instagram Ads, WhatsApp, QR Code, orgânico ou outra origem.
- BOFU, MOFU e TOFU entram na geração da LP final a partir da intenção informada pelo cliente, sem exigir três composições oficiais por taxon no MVP.
- LP teste por nicho ou ultranicho é validação prática antes da liberação plena.

### 1.2. Critérios de liberação de nicho ou ultranicho

- Critério 1: taxon ativo e corretamente posicionado na taxonomia `segmento → nicho → ultranicho`.
- Critério 2: itens estruturados completos para `end_customer` no taxon específico e `business_buyer` próprio ou herdado do taxon pai com critério.
- Critério 3: composição base própria ou herdável aprovada do taxon pai; composição própria de ultranicho apenas excepcionalmente e por decisão humana quando a composição herdável não atender.
- Critério 4: LP teste ou conjunto de LPs teste validados por plano de liberação do nicho base, com liberação herdável para ultranichos que usam a mesma composição base herdável, incluindo validação técnica, visual, editorial, conversão mínima e performance de carregamento.
- Item 5 opcional: Benchmark Blueprint complementar, sem bloqueio automático de liberação.

### 1.3. Itens estruturados

- `strategic_core`: mensagem, promessa, objeções, provas, vocabulário e CTA.
- `lp_overview`: diretrizes para a composição, incluindo tom visual, densidade, tipografia, prioridade mobile, extensão e estilo de imagem.
- `lp_sections`: seções, ordem provável, função no funil e composição conceitual.
- `seo`: intenção, vocabulário, termos, FAQ e requisitos básicos de busca.
- Os itens estruturados não precisam entregar limites de caracteres, escala tipográfica, tamanho de fonte ou parametrização técnica por campo.
- Quando houver herança de composição do nicho para ultranicho, conteúdo, copy, FAQ, provas, oferta e CTA devem continuar específicos do ultranicho.

### 1.4. Composição base do taxon, herança e variantes

- A estrutura padrão permanece módulo + variante.
- Módulo define a função estrutural.
- Variante define a execução específica daquela função.
- A composição base do taxon não é a LP final; ela é o ponto de partida governado para gerar LPs concretas.
- A composição base pode ser aprovada para segmento ou nicho. Composição própria de ultranicho deve ser excepcional e depender de decisão humana quando a composição herdável não atender.
- A IA propõe a composição base a partir da parametrização raiz, da parametrização de módulos e variantes e dos itens estruturados `lp_overview`, `lp_sections`, `strategic_core` e `seo`.
- A composição registra módulos, variantes, ordem, obrigatoriedade e escolhas permitidas para o conjunto e para cada ocorrência; essas escolhas são resultado da composição, não novas parametrizações.
- A composição base seleciona somente opções permitidas pela resolução `parametrização raiz → especialização do módulo → especialização da variante`.
- A LP final é gerada a partir da composição base aplicável, dos itens estruturados do taxon, dos valores reais fornecidos por meio do catálogo de dados de entrada e da intenção/funil informada; o `paid_search_keyword_map` entra apenas quando houver contexto de busca paga aplicável.
- A geração final não pode alterar o contrato parametrizado ao aplicar dados reais, intenção/funil ou palavras-chave opcionais.
- Composição aprovada no taxon pai é presumida herdável para taxons filhos, salvo marcação contrária.
- O taxon filho só herda composição do taxon pai quando não houver composição própria aprovada.
- Uma LP teste aprovada no nicho base libera o plano para seus ultranichos herdáveis.
- Uma LP teste aprovada em um ultranicho que usa a composição herdável do nicho base também valida a composição para o nicho base e seus ultranichos irmãos herdáveis.
- A liberação herdada não se aplica quando o taxon filho tiver composição própria, módulo/variante específica, restrição regulatória, falha técnica/editorial/visual ou marcação de não herança.
- Criar composição própria do ultranicho apenas quando a composição herdável não atender por estrutura, jornada, regulação, prova, oferta, formulário, qualificação ou resultado da LP teste.
- Variante nova deve começar como candidata ou experimental até aprovação por LP teste ou avaliação humana.
- Variante ativa pode ser usada em novas gerações conforme compatibilidade de módulo, funil, taxon e plano.
- Variante depreciada não deve entrar em novas gerações, mas LPs e artefatos existentes continuam renderizando com a variante e versão usadas.
- Variante antiga só pode ser retirada quando não houver artefato publicado dependente ou quando houver plano de migração aprovado.
- Snapshot da geração deve preservar composição, variante e versão usadas.

### 1.5. Parametrizações e catálogo de dados da LP

- O planejamento separa duas parametrizações e um catálogo de dados: parametrização raiz da LP, parametrização de módulos e variantes e catálogo de dados de entrada do cliente.
- A resolução das regras segue `parametrização raiz → especialização do módulo → especialização da variante`.
- A composição base apenas seleciona opções permitidas por essa resolução; a geração final aplica valores reais e intenção/funil sem alterar o contrato parametrizado.
- As fontes canônicas da parametrização raiz, das especializações de módulos e variantes e do catálogo de dados devem ser versionadas no repositório.
- Zod executa validações estruturais e limites técnicos compatíveis com schema; não decide estratégia, composição, qualidade editorial, critérios visuais ou adequação comercial.

#### 1.5.1. Parametrização raiz da LP

- A parametrização raiz é a fonte da verdade inicial para papéis semânticos, regras, faixas editoriais recomendadas, limites técnicos absolutos, critérios visuais e responsivos e opções permitidas para toda a família `landing_page`.
- Parâmetro por campo significa regra para H1, H2, H3, parágrafo, CTA, eyebrow, nota de privacidade, FAQ, cards, benefícios e passos.
- A parametrização raiz versionada deve alimentar ou originar os limites usados pela geração, validação e renderização, evitando fontes independentes e valores hardcoded divergentes.
- A fonte da verdade no repositório não exige configuração dinâmica em runtime; schemas, geração e renderer podem continuar estáticos quando derivarem do mesmo contrato versionado.
- Preset de LP é uma configuração ampla do conjunto da página e não se confunde com escolhas limitadas por ocorrência de seção.
- Os nomes e valores exatos dos presets ficam para o plano-base técnico.
- A parametrização raiz deve resolver as necessidades comuns da maioria dos nichos e ultranichos.
- Necessidade fora da raiz não implica automaticamente nova variante; deve ser classificada conforme módulo, composição, dados, conteúdo ou mudança estrutural.
- Os valores exatos dos parâmetros permanecem hipóteses até validação pela primeira LP real.

#### 1.5.2. Parametrização de módulos e variantes

- A parametrização de módulos e variantes define campos, estruturas, limites, regras de copy e especializações permitidas sobre a raiz.
- Módulos herdam a raiz e registram apenas especializações justificadas para sua função estrutural.
- Variantes herdam o módulo e registram apenas especializações reutilizáveis de execução ou comportamento dentro da mesma função estrutural.
- Nova variante só deve ser criada quando houver mudança reutilizável de comportamento ou execução; mudança da função estrutural deve ser avaliada como novo módulo.
- Diferença de taxon, conteúdo, dado do cliente, escolha de composição ou ajuste já permitido não justifica isoladamente nova variante.
- `spacing` é escolha limitada por ocorrência de seção, não preset de LP; o contrato atual da E18.4 aceita somente `compact`, `default` ou `spacious`.
- A parametrização de módulos e variantes deve separar `copy_source_map` e `funnel_copy_profile`.
- O `copy_source_map` define quais `item_key` cada campo de copy consulta.
- O `funnel_copy_profile` define como os insumos podem ser transformados em copy conforme BOFU, MOFU ou TOFU, incluindo tratamentos permitidos, restritos e proibidos.
- A família `landing_page` define o `funnel_copy_profile` padrão para BOFU, MOFU e TOFU em recorte técnico posterior à parametrização raiz.
- Módulos adaptam o `funnel_copy_profile` ao papel da seção.
- Variantes herdam o `funnel_copy_profile` do módulo e só podem restringir ou sobrescrever tratamentos quando houver mudança de comportamento comercial.
- A parametrização de módulos deve definir um `copy_source_map` padrão para mapear campos de copy aos insumos estruturados permitidos.
- O `copy_source_map` pode variar por intenção/funil da LP gerada: BOFU, MOFU e TOFU.
- Cada campo de copy deve consultar no máximo 2 `item_key` principais e 1 `item_key` auxiliar, salvo decisão registrada no plano-base técnico.
- Variante herda o `copy_source_map` do módulo e só pode sobrescrever quando houver mudança de comportamento comercial dentro da mesma função estrutural.
- Escassez, garantia, prova, comparação, preço, promessa, credencial, autoridade, urgência e oferta só podem ser usados quando houver insumo real que sustente esse tratamento.
- A composição base usa as parametrizações aprovadas para escolher módulos, variantes, ordem, obrigatoriedade e ajustes permitidos, sem duplicar o mapa completo de insumos de copy nem regras de copy por funil.

#### 1.5.3. Catálogo de dados de entrada do cliente

- O catálogo não é uma parametrização de comportamento da LP; ele define quais campos poderão ser apresentados e utilizados na geração.
- A camada geral reúne campos aplicáveis a clientes de todos os segmentos.
- A camada específica reúne campos próprios de um segmento ou nicho, conforme o nível adequado de reutilização.
- A camada de ultranicho só deve existir excepcionalmente e por decisão humana quando segmento e nicho não forem suficientes.
- O `lp_generation_input_catalog` define campos disponíveis, obrigatórios, opcionais e condicionantes, com herança `universal → segmento → nicho → ultranicho`.
- O catálogo informa as entradas disponíveis para a geração da LP final, mas não determina automaticamente a estrutura da composição base do taxon.
- A fonte canônica inicial do `lp_generation_input_catalog` deve ser versionada no repositório.
- Os valores reais preenchidos pela conta, cliente ou LP são dados operacionais e devem ser persistidos no BD, mas o local e o formato dependem de plano-base técnico.
- A LP gerada deve registrar snapshot dos valores usados na geração, sem substituir as seções, textos e campos editáveis da LP.
- O snapshot serve para rastreabilidade, segurança editorial e consistência histórica da geração.

### 1.6. Taxonomia de comunicação

- A comunicação do projeto deve seguir a taxonomia técnica existente: `segmento → nicho → ultranicho`.
- Não adotar nomenclatura paralela `setor → segmento → nicho`, para evitar retrabalho e conflito entre sistema, documentação, Admin e comunicação.
- Exemplo: `imobiliário` como segmento, `corretor de imóveis` como nicho e `corretor de imóveis de médio padrão` como ultranicho.

### 1.7. Critério 3 fechado

- O Critério 3 fica fechado em planejamento com as regras deste documento.
- A implementação técnica depende de plano-base próprio antes de qualquer alteração em banco, contratos, renderer, Admin, schema ou validações.

### 1.8. Critério 4 — LP teste por plano de liberação

- A validação deve ocorrer por plano de liberação: `starter`, `lite`, `pro` e `ultra`.
- O Critério 4 não exige LP teste para cada ultranicho quando eles usam a mesma composição base herdável do nicho base.
- `starter` exige pelo menos 1 LP teste validada, com intenção/funil definido e conteúdo específico do taxon testado.
- `lite`, `pro` e `ultra` devem ter critérios proporcionais ao escopo real de cada plano, sem antecipar testes complexos sem fonte comercial ou plano-base próprio.
- Performance de carregamento em ambiente de teste é requisito obrigatório da LP teste.
- Performance real de campanha, tráfego real, conversão real e Core Web Vitals de campo não são requisitos do Critério 4.
- A validação de performance deve prevenir regressões antes da liberação, com atenção a LCP, estabilidade visual, bloqueio de interação, peso de imagens, embeds, JavaScript excessivo, layout shift e fallback lento.

### 1.9. Item 5 opcional — Benchmark Blueprint

- O Item 5 é complementar e opcional; não é critério de liberação.
- Após a LP teste passar no Critério 4, o projeto pode gerar uma LP alternativa ou avaliação comparativa orientada por Blueprint.
- O objetivo é comparar a LP teste do processo normal com uma proposta ou avaliação Blueprint.
- A comparação deve avaliar clareza, estrutura, copy, adequação ao nicho ou ultranicho, visual, CTA, prova, conversão esperada, lacunas e riscos.
- O Benchmark Blueprint não bloqueia liberação de nicho, ultranicho ou plano, salvo decisão humana explícita.
- Se o Blueprint apresentar ganho relevante, a melhoria deve ser registrada como insumo para evolução da parametrização raiz, composição, variantes, parametrização editorial ou critérios de UX/CRO.
- O Blueprint não altera automaticamente banco, composição, renderer, schema, módulo, variante ou artefato final.

## 2. O que precisa ser ajustado ou implementado no projeto

### 2.1. Critério 1 — Taxon

- Confirmar regra operacional de taxon liberável usando a taxonomia `segmento → nicho → ultranicho`.
- Garantir leitura clara de taxon pai e filho para herança quando aplicável.
- Evitar nomenclatura paralela entre sistema, documentação, Admin e comunicação.

### 2.2. Critério 2 — Itens estruturados

- Adequar a regra para aceitar `end_customer` no taxon específico e `business_buyer` próprio ou herdado do taxon pai.
- Registrar critério de segurança para herança de `business_buyer`.
- Bloquear liberação quando faltar bloco obrigatório.

### 2.3. Critério 3 — Composição base do taxon

- Avaliar em plano-base posterior se o Admin apoiará sugestão, validação e aprovação da composição base; o Admin não é requisito deste recorte conceitual.
- Permitir composição base aprovada para segmento ou nicho; composição própria de ultranicho somente de forma excepcional e por decisão humana.
- Permitir que a IA proponha a composição base com base na parametrização raiz, na parametrização de módulos e variantes e nos itens estruturados `lp_overview`, `lp_sections`, `strategic_core` e `seo`.
- Não usar o catálogo de dados ou valores particulares do cliente como decisão estrutural automática da composição base do taxon.
- Permitir que a IA decida módulos, variantes, ordem, obrigatoriedade e ajustes permitidos por ocorrência dentro das opções resolvidas por `raiz → módulo → variante`.
- Resolver no plano-base técnico onde a composição base e suas escolhas serão persistidas.
- Manter `content_template_composition_items` como relação 1:N de módulos/variantes.
- Registrar gaps de catálogo quando módulo ou variante essencial não existir.
- Impedir liberação plena até gap essencial ser criado e parametrizado.
- Gerar a LP final com a composição base aplicável, os itens estruturados do taxon, os valores reais fornecidos por meio do catálogo de dados e a intenção/funil informada.
- Permitir que a LP final adapte copy, CTA, prova, FAQ, formulário, densidade e ordem permitida conforme a intenção do cliente.
- Impedir que a intenção/funil altere livremente schema, renderer, módulo ou variante fora do catálogo aprovado.
- Permitir que taxon filho use composição base aprovada e herdável do taxon pai quando não houver composição própria aprovada.
- Bloquear liberação se não houver composição própria aprovada nem composição herdável aprovada do taxon pai.

### 2.4. Parametrizações e catálogo de dados

- Definir primeiro a parametrização raiz versionada da família `landing_page`, incluindo papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos e critérios visuais e responsivos.
- Fazer a parametrização raiz alimentar ou originar os limites usados por schemas, geração e renderer, evitando fontes independentes e valores hardcoded divergentes sem exigir configuração dinâmica em runtime.
- Definir posteriormente a parametrização de módulos e variantes, com herança da raiz e apenas especializações justificadas.
- Definir separadamente o catálogo de dados de entrada do cliente em camada geral, camada específica de segmento ou nicho e camada excepcional de ultranicho.
- Definir o `lp_generation_input_catalog` com campos universais e nichados, obrigatórios, opcionais e condicionais.
- Avaliar nos planos-base aplicáveis se o banco terá espelho, referência de versão ou payload operacional das fontes versionadas para Admin e IA.
- Definir `copy_source_map` padrão por módulo, por campo de copy e por intenção/funil da LP gerada.
- Definir quais `item_key` podem alimentar cada campo de copy, respeitando o limite de 2 principais e 1 auxiliar.
- Definir `funnel_copy_profile` padrão da família `landing_page` para BOFU, MOFU e TOFU.
- Definir tratamentos permitidos, restritos e proibidos por funil, incluindo escassez, garantia, prova, comparação, preço, promessa, credencial, autoridade, urgência e oferta.
- Definir como módulos adaptam o `funnel_copy_profile` ao seu papel na LP.
- Definir quando uma variante pode herdar, restringir ou sobrescrever o `copy_source_map` e o `funnel_copy_profile` do módulo.
- Definir separação entre catálogo declarativo de dados, valores reais persistidos no BD e snapshot da geração.
- Definir onde e como os valores reais serão persistidos no BD, sem autorizar nova tabela, campo ou payload antes do plano-base técnico.
- Definir como a LP gerada registrará snapshot dos valores usados na geração, sem substituir as seções, textos e campos editáveis da LP.
- Definir `paid_search_keyword_map` opcional para LPs destinadas a Google Ads ou outra mídia de busca paga, aceitando palavra-chave principal quando disponível ou tema/intenção de busca.
- Definir regra de message match entre busca, anúncio e LP, incluindo promessa, oferta, CTA, contexto geográfico e expectativa criada antes do clique.
- Definir origem dos dados do `paid_search_keyword_map`: itens estruturados de `seo`, configuração informada da campanha e termos reais observados posteriormente, quando disponíveis.
- Definir regra de uso natural de palavras-chave, temas e variações por seção, sem keyword stuffing, repetição artificial, bloco de termos ou lista de localidades fora de contexto.
- Definir como o `paid_search_keyword_map` respeita intenção/funil, módulos, variantes, insumos comerciais reais e trava editorial.
- Definir critério para distinguir mudança de comportamento comercial dentro do mesmo módulo de mudança estrutural que exige novo módulo.
- Definir adaptações permitidas por intenção/funil da LP gerada: BOFU, MOFU e TOFU.
- Definir quando uma exceção exige nova variante reutilizável.

### 2.5. Variantes

- Após a definição da parametrização raiz, confirmar o catálogo inicial de módulos e variantes de LP antes do plano técnico de suas especializações.
- Não criar variante apenas porque uma necessidade não está na raiz.
- Avaliar primeiro se a necessidade é especialização do módulo, escolha da composição, dado do cliente, conteúdo do taxon ou ajuste já permitido.
- Criar variante somente para mudança reutilizável de comportamento ou execução dentro da mesma função estrutural; mudança de função exige avaliação de novo módulo.
- Garantir que variantes sejam reutilizáveis em outros nichos sempre que possível.
- Definir hierarquia de variante universal, variante por intenção de LP e variante por nicho quando necessário.
- Definir ciclo de vida das variantes: candidata ou experimental, ativa, depreciada e retirada ou arquivada.
- Definir critério de aprovação para variante candidata ou experimental por LP teste ou avaliação humana.
- Impedir que variante depreciada entre em novas gerações.
- Garantir que LPs e artefatos existentes continuem renderizando com a variante e versão usadas.
- Bloquear retirada de variante antiga enquanto houver artefato publicado dependente, salvo plano de migração aprovado.
- Garantir que o snapshot preserve composição, variante e versão usadas.
- Evitar ajuste solto por nicho ou ultranicho; primeiro avaliar módulo e variante existentes, depois nova variante reutilizável e só por último exceção específica de baixo reaproveitamento.

### 2.6. Critério 4 — LP teste por plano

- Definir checklist da LP teste por plano.
- Definir validação técnica da LP teste.
- Definir validação visual, editorial e de conversão mínima.
- Definir métrica mínima de carregamento em ambiente de teste.
- Definir se a medição será por Lighthouse, PageSpeed, Playwright, ferramenta interna ou combinação.
- Definir bloqueios para imagem pesada, embed pesado, JavaScript excessivo, layout shift e fallback lento.
- Definir como registrar que a liberação de um plano no nicho base foi herdada pelos ultranichos.
- Definir como registrar que uma LP teste aprovada em ultranicho herdado validou o nicho base e ultranichos irmãos que usam a mesma composição base.
- Definir critérios específicos para `lite`, `pro` e `ultra` somente quando houver escopo real desses planos.

### 2.7. Item 5 — Benchmark Blueprint opcional

- Definir formato de comparação entre LP teste validada e proposta ou avaliação Blueprint.
- Definir como registrar ganhos, lacunas e riscos encontrados pelo Benchmark Blueprint.
- Definir como transformar ganhos relevantes em insumo para plano-base, parametrização raiz, composição, variantes ou critérios editoriais.
- Garantir que o Item 5 não bloqueie liberação sem decisão humana explícita.
- Garantir que o Item 5 não altere automaticamente banco, composição, renderer, schema, módulo, variante ou artefato final.

### 2.8. Limites técnicos gerais

- Avaliar contratos, banco, renderer e Admin contra este plano.
- Ajustar o projeto somente após decisão registrada neste documento e plano-base próprio quando houver impacto técnico.
- Não criar nova tabela, campo, rota, job, automação, agente ou nova infraestrutura sem plano-base ou briefing próprio.
- Não criar catálogo universal multicanal neste recorte; o reuso entre canais só deve avançar com evidência prática de duplicação e ROI.
- E10.7 e E19 permanecem separados; aprendizados podem ser reaproveitados, mas não autorizam converter páginas comerciais em LPs do Builder sem plano-base próprio.

## 3. Pendências e ordem dos planos-base técnicos

- O primeiro plano-base técnico deve tratar somente da parametrização raiz da família `landing_page`.
- Esse primeiro recorte deve cobrir contrato versionado da raiz, papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos, critérios visuais e responsivos, relação com o design system, integração com os schemas atuais, contrato de leitura para futura geração e casos de validação.
- Permanecem fora do primeiro plano: composição por taxon, persistência e catálogo de dados do cliente, `lp_generation_input_catalog`, `copy_source_map`, `funnel_copy_profile`, `paid_search_keyword_map`, geração da LP, LP teste e Admin.
- Depois da raiz, os recortes devem avançar em planos-base próprios para: parametrização de módulos e variantes; `copy_source_map` e `funnel_copy_profile`; catálogo de dados de entrada; composição base e herança; geração da primeira LP; LP teste Starter.
- A parametrização raiz pertence a um novo recorte da E18; a E18.4 permanece concluída e não deve ser reaberta.
- O identificador exato `E18.x`, as subseções previstas e o path do plano-base devem ser definidos no debate do caso conforme `docs/prompt-estrategista.md`; não reutilizar automaticamente `E18.5`.
- Detalhar em planos posteriores a persistência da composição base do taxon, suas escolhas, sua herança e a intenção/funil da LP gerada.
- Definir nos planos aplicáveis os valores exatos da parametrização raiz, das especializações de módulos e variantes, do catálogo de dados, do `copy_source_map`, do `funnel_copy_profile`, do `lp_generation_input_catalog`, do `paid_search_keyword_map` e dos presets.
- Definir a modelagem exata dos valores reais persistidos no BD e do snapshot dos valores usados na geração, incluindo composição, variante e versão.
- Definir ciclo de vida técnico de variantes e bloqueios para depreciação, retirada e compatibilidade com artefatos publicados.
- Definir se haverá espelho, referência de versão ou payload operacional das fontes versionadas no banco.
- Detalhar nos planos aplicáveis as medições, registros, ferramentas e bloqueios do Critério 4.
- Definir o formato de registro do Benchmark Blueprint opcional quando ele for usado como insumo de evolução.
