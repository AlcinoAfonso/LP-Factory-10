14/08/2026 — Rascunho vivo — E19.3 — Pacote autorizado para geração no Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo da reformulação da E19.3 para o Cenário E; ainda não executável nem implementado.
- Recorte: `E19.3 — Pacote autorizado para geração no Cenário E`.
- Path canônico: `docs/lousa-plano-base-e19-3.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- A implementação vigente da E19.3.3 foi mergeada pelo PR #729 em 12/08/2026 e permanece como base técnica real até a execução desta reformulação.
- O PR #729 substituiu `partA + partB` por `identities + modelContext + serverContext`, removeu E18.5 e E20.3 do caminho da compilação e deixou a E19.3 sem composição narrativa prévia.
- Decisão humana de 14/08/2026: o Cenário E é a única direção ativa para a primeira LP real; o Cenário D deixa de ser direção de implementação.
- A arquitetura lógica `identities + modelContext + serverContext` é preservada.
- A mudança central deste recorte é retirar a pesquisa estruturada da E10.8 do caminho de geração e transportar a pesquisa integral `end_customer` aprovada e selecionada para o taxon.
- Nenhuma alteração de runtime, banco ou migration decorrente desta reformulação foi iniciada neste documento.

### 1.2. Objetivo e resultado esperado

- Manter a E19.3 como o menor boundary determinístico entre as fontes autorizadas do projeto e a E19.4.
- Receber uma `landing_page` legítima, configurada pelo fluxo oficial, e entregar à E19.4 um único pacote autorizado com pesquisa integral, fatos concretos, limites editoriais e contexto operacional.
- Não resumir, atomizar, ranquear, selecionar semanticamente ou reinterpretar a pesquisa integral antes da E19.4.
- Não escolher módulos, variantes, ordem, função narrativa, seção, layout, intensidade comercial ou copy.
- Preservar a separação entre valores semanticamente visíveis ao modelo e valores operacionais mantidos server-side.
- Entregar exatamente os três blocos lógicos `identities + modelContext + serverContext`, profundamente imutáveis e sem DTO de domínio intermediário.
- A E19.3 não chama OpenAI, não gera copy, não materializa conteúdo e não renderiza a landing page.

### 1.3. Fontes obrigatórias

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-4.md` como fonte das decisões do Cenário E e da preparação mínima do taxon.
- `docs/prompt-nicho-arquivamento-pesquisa.md` para identidade e versionamento das pesquisas integrais.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` como primeiro caso real do novo contrato, sem tornar seu slug regra permanente de identidade.
- `lib/conversion-content/landing-page/input-catalog/`.
- `lib/conversion-content/landing-page/` para a API pública da E18.4.
- `lib/lp-builder/contracts.ts`.
- `lib/lp-builder/generationContext.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- `lib/lp-builder/adapters/generationContextAdapter.ts`.
- `lib/lp-builder/adapters/generationContextAdapterCore.ts`.
- `lib/admin/readRepoDoc.ts` como precedente real de leitura server-side de Markdown com `node:fs/promises`.
- `next.config.js` como precedente real de `outputFileTracingIncludes` para arquivos Markdown necessários no deploy.
- E10.8 e sua implementação somente para identificar o acoplamento atual que deve sair do caminho da geração, sem apagar nem prejudicar consumidores independentes que ainda existam.

### 1.4. Responsabilidades preservadas

- E19.2 permanece responsável pelos valores concretos configurados, sua aplicabilidade, origem, completude e vínculo ao `draft`.
- E20.2 permanece responsável pelo catálogo declarativo de entradas, tipos, escopos, condições, validações e proveniência das definições; a E19.3 não transforma o catálogo em fonte de valores concretos.
- A preparação do taxon deve estar concluída antes da geração: taxon ativo, pesquisa integral `end_customer` aprovada/selecionada e avaliação E20.2 concluída contra a versão executável aplicável.
- E18.4 permanece responsável pela parametrização raiz; a E19.3 projeta somente o subconjunto editorial útil à geração.
- E9 e os boundaries vigentes permanecem responsáveis por entitlement, autorização, tenant, membership e vínculo da LP.
- E18.5 permanece fora da E19.3; a estrutura permitida da candidata pertence ao contrato da E19.4.
- E20.3 permanece fora da E19.3; ausência de perfil não bloqueia o Cenário E.
- E10.8 deixa de ser dependência da geração E19.3 → E19.4; sua existência e seus demais consumidores não são alterados por esta decisão.
- A E19.3 permanece no boundary `lib/lp-builder/`; não criar novo domínio, rota, API HTTP, serviço, engine, agente ou infraestrutura para carregar a pesquisa.
- GitHub continua sendo a fonte versionada dos arquivos, mas o runtime não consulta a API do GitHub: o servidor lê o Markdown incluído no próprio deploy.

### 1.5. Decisões consolidadas dos Gates

- Gate 1 — taxon e pesquisa autorizados:
  - `business_taxons.is_active = true`;
  - `selected_end_customer_research_version` identifica explicitamente a versão integral aprovada;
  - `reviewed_input_catalog_version` identifica a versão executável E20.2 avaliada e considerada suficiente para o taxon;
  - `business_buyer` não é requisito da geração da LP `end_customer`;
  - ausência ou inconsistência de qualquer um desses sinais falha fechado.
- Gate 2 — fatos concretos e projeção por `valueType`:
  - valores semanticamente visíveis: `string`, `enum`, `string_list`, `boolean`, `number_range`, `keyword_map`;
  - valores brutos server-side: `phone`, `email`, `url`, `asset_reference`, `color_palette`;
  - `fieldKey`, `purpose`, `valueType`, `source` e proveniência permanecem preservados conforme o contrato vigente;
  - não criar allowlist nominal `fieldKey → IA/server` nem registry paralelo.
- Gate 3 — interface lógica mínima:
  - `identities`;
  - `modelContext`;
  - `serverContext`;
  - nenhum quarto bloco;
  - nenhum segundo DTO de domínio entre E19.3 e E19.4.
- Gate 4 — pesquisa integral no runtime:
  - o path atual é derivado de `taxon.slug + audience_scope + selected_version` somente como mecanismo físico da primeira prova;
  - o runtime lê o arquivo do próprio deploy com `node:fs/promises`, sem requisição HTTP à API do GitHub;
  - o conteúdo carregado deve validar `taxon_slug`, `audience_scope` e `research_version` contra a seleção autorizada;
  - o path não integra o contrato entregue à E19.4;
  - eventual migração futura do diretório para identidade por UUID/código do taxon pode ser avaliada após a primeira LP real, sem bloquear esta prova.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho:
  - invocação server-side explícita para obter o pacote autorizado de uma LP legítima já configurada.
- Entrada:
  - LP em `draft`;
  - configuração concluída e vinculada pela E19.2;
  - plano e taxon efetivos;
  - taxon preparado conforme a seção 1.5;
  - parametrização raiz E18.4.
- Processamento:
  - validar LP, configuração, autorização e entitlement pelos boundaries vigentes;
  - identificar o taxon servido a partir da configuração autoritativa;
  - ler em `business_taxons` o estado mínimo necessário à preparação do taxon;
  - exigir `selected_end_customer_research_version` inteira positiva;
  - exigir `reviewed_input_catalog_version` compatível com a versão executável E20.2 consumida pela configuração;
  - derivar o path físico da pesquisa integral `end_customer` selecionada;
  - ler o Markdown do filesystem do deploy;
  - validar identidade mínima e versão declaradas no próprio arquivo;
  - projetar o conteúdo integral da pesquisa sem resumo, atomização ou seleção semântica;
  - projetar fields concretos `applicable = true`, `source != missing` e já validados;
  - separar o valor bruto por `valueType` entre contexto semântico e server-side;
  - projetar os limites editoriais mínimos da E18.4;
  - montar `identities + modelContext + serverContext`;
  - validar a saída e devolvê-la profundamente imutável.
- Validação:
  - falhar fechado para LP/configuração inválida, taxon não preparado, versão de pesquisa ausente/inválida, arquivo inexistente, metadata incompatível, catálogo E20.2 não avaliado/obsoleto, fato obrigatório ausente ou outra inconsistência comprovável.
  - resolver e validar o entitlement exclusivamente pelo boundary interno vigente da E9.
- Persistência:
  - nenhuma nova na E19.3.
- Consumo:
  - a saída de sucesso é a única entrada de domínio da E19.4;
  - a E19.4 não relê diretamente E10.8, E18.4, E20.2, E18.5 ou E20.3 para reconstruir o contexto.
- Fallback:
  - nenhum fallback silencioso para outra versão de pesquisa, arquivo mais recente, pesquisa estruturada da E10.8 ou ancestor;
  - ausência/inconsistência falha fechado.
- Observabilidade:
  - preservar logging seguro já autorizado no boundary;
  - não registrar conteúdo da pesquisa, valores concretos, PII, secrets, payloads ou prompts.

### 2.2. Pesquisa autorizada

- A matéria-prima de pesquisa enviada à E19.4 é a pesquisa integral `end_customer` explicitamente selecionada no taxon.
- A identidade mínima preservada é:
  - taxon servido;
  - `taxon_slug`;
  - `audience_scope = end_customer`;
  - `research_version`.
- O conteúdo enviado é o Markdown integral da versão selecionada, preservando fontes, evidências, inferências, condições, exceções, limitações e contexto presentes no arquivo.
- A E19.3 não cria `strategic_core`, `lp_overview`, `lp_sections`, `seo`, `itemKey`, `priority`, `sortOrder` ou representação equivalente para consumir essa pesquisa.
- Não existe filtragem por módulo, funil, CTA, seção, pertinência ou julgamento semântico da E19.3.
- `business_buyer` não é carregado para a geração da LP `end_customer`.
- O path físico não entra no `modelContext`, não vira fonte de decisão da E19.4 e pode mudar futuramente sem alterar o contrato semântico da pesquisa.
- Para a primeira prova, mantém-se o padrão existente `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`; eventual adoção de UUID/código no diretório fica fora do caminho crítico atual.

### 2.3. Fatos e regra de projeção

- Somente field concreto com `applicable = true`, `source != missing` e valor já validado pela jornada vigente pode integrar o pacote.
- O `valueType` determina a projeção do valor bruto.
- Valores brutos em `modelContext`:
  - `string`;
  - `enum`;
  - `string_list`;
  - `boolean`;
  - `number_range`;
  - `keyword_map`.
- Valores brutos em `serverContext`:
  - `phone`;
  - `email`;
  - `url`;
  - `asset_reference`;
  - `color_palette`.
- Os metadados canônicos permanecem preservados:
  - `fieldKey`;
  - `purpose`;
  - `valueType`;
  - `source`;
  - proveniência existente.
- `missing` não integra o pacote como fato.
- `primary_conversion_channel` permanece semanticamente visível; o destino correspondente permanece somente em `serverContext`.
- `brand_logo_asset` e `brand_color_palette` permanecem com valores brutos em `serverContext`.
- Se um futuro field não puder ser classificado corretamente pelos tipos vigentes, a evolução ocorre no contrato E20.2; não criar exceção nominal na E19.3.

### 2.4. Projeção mínima da E18.4

- `modelContext` recebe somente o necessário à produção textual:
  - papéis semânticos aplicáveis;
  - faixa recomendada de texto por papel;
  - `absoluteMax`;
  - hierarquia semântica geral relevante à composição textual.
- Permanecem determinísticos e fora da matéria-prima textual:
  - `minViewportPx`;
  - viewports de evidência;
  - alvo interativo mínimo;
  - requisitos de foco;
  - contraste;
  - no-horizontal-scroll;
  - tipografia CSS concreta;
  - `maxPageWidth`;
  - `maxReadingWidth`;
  - tamanhos em `rem`;
  - detalhes de acessibilidade do renderer;
  - `density`, spacing e preset como escolha de apresentação.
- A E19.3 não cria uma segunda parametrização raiz nem duplica regras da E18.4.

### 2.5. Proveniência, fatos declarados e evidências

- A pesquisa integral preserva identidade operacional suficiente para demonstrar qual material foi exposto:
  - `taxonId` servido;
  - `taxonSlug`;
  - `audienceScope`;
  - `researchVersion`.
- O conteúdo completo da pesquisa já contém suas fontes, limitações e distinções internas; a E19.3 não cria proveniência por trecho, item ou claim.
- Fato concreto reutiliza:
  - `fieldKey`;
  - valor autorizado;
  - `source` da E19.2;
  - versão executável do catálogo;
  - proveniência existente.
- Não criar `fact_id`.
- A evidência documental da E20.2 justifica a existência do field no catálogo; ela não comprova a veracidade do valor concreto fornecido pela conta.
- Um valor declarado pode integrar `modelContext` sem se tornar prova verificada.
- Evidência concreta somente acompanha o pacote quando uma fonte canônica já fornecer uma referência real e autorizada.
- Ausência de evidência permanece ausência; não criar `verified`, `evidence_id` ou marcação artificial para preencher desconhecimento.
- Testemunho, credencial verificada, resultado, garantia, escassez ou outra prova concreta não pode ser tratada como disponível sem suporte real correspondente.

### 2.6. Interface lógica de saída

- A estrutura lógica permanece exatamente `identities + modelContext + serverContext`.
- Como o shape de pesquisa muda de forma incompatível em relação ao contrato implementado pelo PR #729, a implementação do Cenário E deve usar `contractVersion: 3`, sem alias ou fallback para o contrato v2.
- `identities` preserva:
  - versão do contrato E19.3;
  - identidade da conta;
  - identidade da LP;
  - plano efetivo;
  - taxon servido;
  - `catalogVersion` da configuração;
  - `reviewedInputCatalogVersion` do taxon;
  - `configurationRevision` da E19.2;
  - `rootVersion` efetivamente resolvida da E18.4;
  - versão efetivamente usada pela pesquisa integral `end_customer`.
- `identities` não preserva:
  - path da pesquisa;
  - IDs de itens estruturados;
  - `researchBlock`;
  - `itemKey`;
  - `moduleCatalogVersion`;
  - `generationProfileId`;
  - `generationProfileVersion`;
  - variantes;
  - composição;
  - ordem;
  - recommendation IDs.
- `modelContext` preserva:
  - pesquisa integral `end_customer` com identidade mínima e conteúdo completo;
  - fatos projetados pelos tipos semânticos;
  - metadados e proveniência desses fatos;
  - evidências concretas realmente disponíveis, quando existirem;
  - projeção editorial mínima da E18.4.
- `serverContext` preserva:
  - valores brutos de destinos operacionais;
  - `privacy_policy_url` quando aplicável;
  - `brand_logo_asset` quando existente;
  - `brand_color_palette` quando existente;
  - metadados canônicos necessários ao uso determinístico desses valores.
- `serverContext` significa que o valor bruto não é matéria-prima textual para a IA.
- A E19.3 expõe um único resultado TypeScript discriminado entre sucesso completo e falha explícita.
- A saída é profundamente imutável.
- A E19.4 consome essa saída diretamente; serialização específica para o provider pertence à E19.4 e não constitui novo contrato de domínio.

### 2.7. Simplificação obrigatória

- Implementação esperada:
  - ler configuração e taxon canônicos;
  - validar preparação do taxon;
  - ler a pesquisa integral do filesystem do deploy;
  - validar metadata e versão;
  - projetar pesquisa, fatos e limites;
  - separar valor semântico de valor operacional;
  - montar saída tipada;
  - validar e devolver.
- Reutilizar:
  - `generationContextAdapter.ts` e `generationContextAdapterCore.ts` como boundary existentes;
  - `node:fs/promises` para leitura server-side;
  - proteção de path equivalente à já usada em `lib/admin/readRepoDoc.ts`;
  - `outputFileTracingIncludes` somente no consumer real necessário para garantir os arquivos no deploy.
- Não criar:
  - chamada à API GitHub em runtime;
  - nova rota;
  - novo serviço;
  - nova tabela de pesquisa;
  - RAG, chunking ou embedding;
  - `factIdentity`;
  - registry de fatos;
  - taxonomia geral de contexto;
  - `contextRole`;
  - path persistido no banco;
  - allowlist nominal de fields;
  - DSL;
  - engine;
  - framework de claims;
  - mapa E18.5 ↔ E20.2;
  - camada intermediária entre E19.3 e E19.4.
- Não alterar o padrão físico dos diretórios de pesquisa antes da primeira LP apenas para substituir slug por UUID/código; essa robustez pode ser avaliada depois com evidência real.
- Crescimento motivado principalmente por extensibilidade sem consumidor atual é critério de parada e simplificação.

## 3. Fases e próxima ação

### 3.1. E19.3.3 — Pacote autorizado para geração no Cenário E

- Status: reformulação aprovada conceitualmente neste rascunho; implementação ainda não iniciada.
- Automação: não.
- Objetivo:
  - ajustar a implementação E19.3.3 já mergeada para substituir a pesquisa estruturada da E10.8 pela pesquisa integral selecionada, preservando o boundary, a separação de fatos e a interface lógica de três blocos.
- Entregas:
  - manter a residência em `lib/lp-builder/`;
  - preservar `identities + modelContext + serverContext`;
  - evoluir o contrato para `contractVersion: 3` pela mudança incompatível do shape de pesquisa;
  - retirar `LandingPageResearchResolutionResult`, `resolveLandingPageResearchForTaxon` e demais dependências da E10.8 do caminho da compilação E19.3;
  - adicionar leitura server-side mínima do taxon preparado e da pesquisa integral selecionada;
  - validar `selected_end_customer_research_version` e `reviewed_input_catalog_version`;
  - ler e validar o Markdown integral sem API GitHub;
  - preservar a configuração resolvida E19.2 e a regra de projeção por `valueType`;
  - preservar a projeção mínima da E18.4;
  - preservar logging seguro sem conteúdo da pesquisa ou valores sensíveis;
  - ajustar `next.config.js` somente na medida necessária para incluir os arquivos de pesquisa no bundle/deploy do consumer real;
  - atualizar casos executáveis e contratos TypeScript focais;
  - não implementar E19.4 neste recorte.
- Validação mínima:
  - taxon preparado + LP/configuração válida produz pacote de sucesso;
  - taxon sem pesquisa selecionada falha fechado;
  - taxon sem avaliação E20.2 vigente falha fechado;
  - arquivo inexistente falha fechado;
  - `taxon_slug`, `audience_scope` ou `research_version` incompatíveis falham fechado;
  - pesquisa integral chega completa ao `modelContext` sem atomização;
  - nenhuma dependência da E10.8 participa do caminho de geração;
  - `business_buyer` não entra no pacote;
  - fatos semanticamente visíveis e server-side continuam separados por `valueType`;
  - `missing` não vira fato;
  - valores operacionais brutos não aparecem em `modelContext`;
  - ausência de evidência concreta não produz referência artificial;
  - `identities` preserva versão de pesquisa, catálogo E20.2 avaliado, configuração e raiz;
  - o pacote usa exclusivamente `contractVersion: 3`;
  - nenhum path da pesquisa aparece no contrato entregue à E19.4;
  - resultado de sucesso é profundamente imutável;
  - falhas das autoridades canônicas resultam em falha explícita, sem pacote parcial.
- Regressões obrigatórias:
  - E18.4;
  - E20.2;
  - E19.2;
  - boundaries de autorização e vínculo já consumidos pela E19.3;
  - E10.8 somente para comprovar que seus consumidores independentes permanecem íntegros, sem recolocá-la no caminho da geração.
- Critério de primeira prova:
  - executar a compilação sobre o draft real da primeira LP e demonstrar, sem OpenAI, que o pacote contém a pesquisa integral `end_customer` selecionada, fatos concretos válidos e separados corretamente entre `modelContext` e `serverContext`.
- Fechamento documental:
  - atualizar somente os documentos canônicos materialmente afetados após a implementação;
  - não atualizar o roadmap como concluído antes da validação real do novo contrato.

### 3.2. Próxima ação

- Consolidar esta reformulação como briefing executável da E19.3.3 do Cenário E.
- Implementar primeiro somente o ajuste E19.3 descrito na seção 3.1.
- Executar prova read-only no draft real antes de qualquer chamada OpenAI.
- Após a E19.3 produzir o pacote integral válido, retornar à E19.4 e implementar o primeiro workload de geração do Cenário E.
- Não abrir debate sobre renomear diretórios por UUID/código do taxon antes dessa primeira prova, salvo bloqueio real do path atual.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- chamada OpenAI ou geração de copy;
- modelo, reasoning effort, prompt ou Structured Output da E19.4;
- módulos, variantes, layouts, seções ou composição da candidata;
- validação pós-IA;
- materialização, snapshot durável ou renderer;
- E18.5 como dependência da E19.3;
- E20.3 como dependência da E19.3;
- pesquisa estruturada E10.8 como dependência da geração;
- alteração ou remoção dos demais consumidores legítimos da E10.8;
- business_buyer como requisito de geração da LP end_customer;
- alteração de E18.4, E20.2 ou E19.2 sem gap real demonstrado;
- nova tabela de pesquisa, view, RPC, trigger, RLS, policy ou persistência de conteúdo integral;
- API GitHub, rota, serviço, Provider, agente, automação, job, fila, cron, webhook, RAG ou infraestrutura nova para carregar a pesquisa;
- tracking, Analytics, CRM, domínio, publicação, A/B test, Ads ou integrações futuras;
- regra específica da conta piloto ou de um nicho dentro da E19.3;
- novo contrato estrutural da candidata, que pertence à E19.4;
- migração imediata do path das pesquisas de slug para UUID/código do taxon sem bloqueio demonstrado pela primeira LP.

### 4.2. Critérios de parada

- Parar se a leitura da pesquisa exigir serviço externo, API GitHub ou infraestrutura nova sem evidência de necessidade; reavaliar primeiro o padrão server-side local já existente.
- Parar se a regra de projeção IA/server exigir mapa nominal crescente dentro da E19.3.
- Parar se surgir resumo, ranking, chunking, seleção semântica ou outra transformação intermediária da pesquisa integral.
- Parar se for necessário inventar evidência, prova, claim verificado ou semântica não sustentada pelas fontes.
- Parar se surgir filtro editorial de pesquisa, seleção de módulo, variante, ordem, narrativa ou layout.
- Parar se faltar fonte canônica indispensável para validar um fato, pesquisa, limite ou binding.
- Parar se surgir necessidade de banco, rota, job, agente, automação, engine ou infraestrutura nova não autorizada por fonte real do projeto.
- Parar e simplificar se a maior parte do crescimento técnico vier de generalizações para consumidores futuros inexistentes.
- Toda ampliação material de escopo volta ao humano; não é autorizada implicitamente por este rascunho.