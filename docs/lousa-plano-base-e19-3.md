16/08/2026 — Plano-base v1 — E19.3 — Pacote autorizado para geração no Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado para o Cenário E; implementação desta reformulação ainda não iniciada.
- Recorte: `E19.3 — Pacote autorizado para geração no Cenário E`.
- Path canônico: `docs/lousa-plano-base-e19-3.md`.
- Processo: `docs/prompt-estrategista.md` v31.
- Plano conceitual: `docs/lp-planejamento.md`.
- A implementação vigente da E19.3.3 foi mergeada pelo PR #729 em 12/08/2026 e permanece como base técnica real até a execução desta reformulação.
- O PR #729 substituiu `partA + partB` por `identities + modelContext + serverContext`, removeu E18.5 e E20.3 do caminho da compilação e deixou a E19.3 sem composição narrativa prévia.
- Decisão humana de 14/08/2026: o Cenário E é a única direção ativa para a primeira LP real; o Cenário D deixa de ser direção de implementação.
- A arquitetura lógica `identities + modelContext + serverContext` é preservada.
- A mudança central deste recorte é retirar a pesquisa estruturada da E10.8 do caminho de geração e transportar a pesquisa integral `end_customer` autorizada pelo taxon.
- A E20.5 e a E20.6 estão concluídas e materializaram a precondição externa de Preparação do taxon; `corretor-imoveis` foi comprovado como `prepared: true`, com pesquisa integral `end_customer` v1 e `reviewed_input_catalog_version = 4`.
- O primeiro Gate desta reformulação está fechado: a E19.3 deve operar genericamente sobre versões futuras da E20.2 e sobre a cadeia taxonômica completa, sem hardcode de versão, slug ou nível.

### 1.2. Objetivo e resultado esperado

- Manter a E19.3 como o menor boundary determinístico entre as fontes autorizadas do projeto e a E19.4.
- Receber uma `landing_page` legítima, configurada pelo fluxo oficial e vinculada a taxon preparado, e entregar à E19.4 um único pacote autorizado com pesquisa integral, fatos concretos revalidados, limites editoriais e contexto operacional.
- Não resumir, atomizar, ranquear, selecionar semanticamente ou reinterpretar a pesquisa integral antes da E19.4.
- Não escolher módulos, variantes, ordem, função narrativa, seção, layout, intensidade comercial ou copy.
- Preservar a separação entre valores semanticamente visíveis ao modelo e valores operacionais mantidos server-side.
- Entregar exatamente `identities + modelContext + serverContext`, profundamente imutáveis e sem DTO de domínio intermediário.
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
- `docs/lousa-plano-base-e20-5.md`.
- `docs/lousa-plano-base-e20-6.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-4.md` somente para o contrato esperado pelo consumidor E19.4.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` como primeiro caso real, sem tornar seu slug regra de domínio.
- `lib/conversion-content/landing-page/input-catalog/registry.ts`.
- `lib/conversion-content/landing-page/input-catalog/resolver.ts`.
- `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts`.
- `lib/conversion-content/landing-page/taxon-preparation/`.
- `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`.
- `lib/conversion-content/adapters/selectedEndCustomerResearchAdapterCore.ts`.
- `lib/conversion-content/landing-page/` para a API pública da E18.4.
- `lib/lp-builder/contracts.ts`.
- `lib/lp-builder/onboardingConfiguration.ts`.
- `lib/lp-builder/generationContext.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`.
- `lib/lp-builder/adapters/generationContextAdapter.ts`.
- `lib/lp-builder/adapters/generationContextAdapterCore.ts`.
- E10.8 e sua implementação somente para retirar o acoplamento do caminho de geração sem prejudicar consumidores independentes.

### 1.4. Responsabilidades preservadas

- E20.5 permanece responsável pela seleção humana, leitura repo-only, identidade, versionamento e integridade da pesquisa integral `end_customer`.
- E20.6 permanece responsável por registrar a versão E20.2 avaliada e derivar deterministicamente a Preparação do taxon, sem persistir um estado adicional de prontidão.
- E19.2 permanece responsável pelos valores concretos configurados, sua origem, persistência, vínculo ao `draft` e correção/coleta quando uma revalidação futura revelar gap factual.
- A configuração persistida da E19.2 preserva essencialmente `catalog_version`, valores, vínculo e revisão; plano efetivo e cadeia taxonômica são reconstruídos das autoridades atuais no runtime.
- E20.2 permanece responsável pelo catálogo declarativo versionado, tipos, escopos, condições, validações, proveniência, composição cumulativa `universal → segment → niche → ultra_niche` e especializações permitidas; a E19.3 nunca recria sua herança nem escolhe camadas manualmente.
- E18.4 permanece responsável pela parametrização raiz; a E19.3 projeta somente o subconjunto editorial útil à geração.
- E9 e os boundaries vigentes permanecem responsáveis por entitlement, autorização, tenant, membership e vínculo da LP.
- E18.5 e E20.3 permanecem fora da E19.3.
- E10.8 deixa de ser dependência da geração E19.3 → E19.4; seus demais consumidores permanecem independentes.
- A E19.3 permanece no boundary `lib/lp-builder/`; não criar novo domínio, rota, API HTTP, serviço, engine, agente ou infraestrutura neste recorte.

### 1.5. Decisões consolidadas dos Gates

- Gate 1 — Preparação dinâmica, resolução E20.2 e revalidação E19.2:
  - a E19.3 recebe um taxon preparado pelo boundary canônico E20.5/E20.6; ausência, gate desabilitado ou inconsistência falha fechado;
  - `reviewed_input_catalog_version` é a versão E20.2 explicitamente aprovada para aquele taxon e passa a ser a versão efetiva de revalidação para geração; não usar constante fixa, maior versão do registry, `latest` ou fallback;
  - a versão histórica `catalog_version` da configuração E19.2 permanece preservada e distinguível da versão E20.2 efetivamente usada para revalidação e geração;
  - a E19.3 usa o plano efetivo atual e a cadeia taxonômica autoritativa completa para chamar o resolver canônico E20.2 na versão revisada;
  - o resolver E20.2 permanece a única autoridade para compor `universal → segment → niche → ultra_niche`, ignorar camadas inexistentes, aplicar especializações válidas, respeitar autorização de ultranicho, filtrar por plano e devolver `servedTaxon`, `appliedLayers` e os `fields` efetivos;
  - os valores concretos já coletados pela E19.2 são revalidados read-only contra esse catálogo efetivo; a E19.3 não regrava nem promove artificialmente a configuração histórica para a nova versão;
  - novo field obrigatório aplicável, valor ausente ou incompatível é gap factual e retorna à E19.2 para coleta/correção;
  - defeito ou incompatibilidade do catálogo, cadeia ou resolver retorna à E20.2;
  - a prova `E19.2 v2 → E20.2 v4` de `corretor-imoveis` é o primeiro caso real do mecanismo genérico temporal e taxonômico, não exceção codificada;
  - `business_buyer` não é requisito da geração da LP `end_customer`.
- Gate 2 — fatos concretos e projeção por `valueType`:
  - valores semanticamente visíveis: `string`, `enum`, `string_list`, `boolean`, `number_range`, `keyword_map`;
  - valores brutos server-side: `phone`, `email`, `url`, `asset_reference`, `color_palette`;
  - `fieldKey`, `purpose`, `valueType`, `source` e proveniência permanecem preservados;
  - não criar allowlist nominal `fieldKey → IA/server` nem registry paralelo.
- Gate 3 — interface lógica mínima:
  - `identities`;
  - `modelContext`;
  - `serverContext`;
  - nenhum quarto bloco;
  - nenhum segundo DTO de domínio entre E19.3 e E19.4.
- Gate 4 — pesquisa integral autorizada:
  - a E19.3 consome a pesquisa integral já lida e validada pelo boundary canônico E20.5/E20.6; não relê arquivo diretamente nem duplica validação de path, metadata ou filesystem;
  - o conteúdo integral selecionado chega ao `modelContext` sem resumo, atomização, ranking, seleção semântica ou filtragem editorial;
  - identidade mínima preservada: taxon servido, `taxon_slug`, `audience_scope = end_customer` e `research_version`;
  - `relativePath` e demais detalhes físicos não entram no contrato entregue à E19.4;
  - a E19.3 não usa API GitHub, RAG, chunking, embedding ou fallback para outra versão de pesquisa.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho:
  - invocação server-side explícita para obter o pacote autorizado de uma LP legítima já configurada.
- Precondição:
  - taxon preparado pelo boundary E20.5/E20.6 no ambiente alvo;
  - pesquisa integral `end_customer` selecionada e válida;
  - versão E20.2 revisada registrada e executável.
- Entrada:
  - LP em `draft`;
  - configuração concluída e vinculada pela E19.2;
  - plano efetivo atual;
  - cadeia taxonômica autoritativa atual;
  - parametrização raiz E18.4.
- Processamento:
  - validar LP, configuração, autorização e entitlement pelos boundaries vigentes;
  - preservar a versão histórica e os valores persistidos da configuração E19.2;
  - consumir a Preparação do taxon pelo boundary canônico E20.5/E20.6 e obter pesquisa integral selecionada + `reviewed_input_catalog_version`;
  - exigir que a versão revisada seja executável, sem escolher automaticamente outra versão;
  - resolver a E20.2 nessa versão usando plano efetivo + cadeia taxonômica completa pelo resolver canônico;
  - revalidar read-only os valores concretos da E19.2 contra os `fields` efetivos resultantes e exigir completude factual;
  - projetar somente fields concretos aplicáveis, presentes e válidos;
  - separar o valor bruto por `valueType` entre contexto semântico e server-side;
  - transportar a pesquisa integral já validada sem reinterpretação;
  - projetar os limites editoriais mínimos da E18.4;
  - montar e validar `identities + modelContext + serverContext`;
  - devolver a saída profundamente imutável.
- Validação:
  - falhar fechado para LP/configuração inválida, taxon não preparado, pesquisa inválida, versão E20.2 não executável, cadeia ou camada inválida, revalidação factual incompleta, fato obrigatório ausente ou outra inconsistência comprovável;
  - classificar gap de dado concreto para E19.2 e defeito/incompatibilidade de catálogo/resolver para E20.2, sem correção silenciosa;
  - resolver e validar entitlement exclusivamente pelo boundary interno vigente da E9.
- Persistência:
  - nenhuma nova na E19.3;
  - nenhuma regravação da configuração E19.2 apenas por mudança de versão E20.2.
- Consumo:
  - a saída de sucesso é a única entrada de domínio da E19.4;
  - a E19.4 não relê diretamente E10.8, E18.4, E20.2, E20.5, E20.6, E18.5 ou E20.3 para reconstruir o contexto.
- Fallback:
  - nenhum fallback silencioso para outra versão E20.2, outra versão de pesquisa, E10.8, ancestor ou `latest`;
  - ausência ou inconsistência falha fechado.
- Observabilidade:
  - preservar logging seguro já autorizado, sem conteúdo da pesquisa, valores concretos, PII, secrets, payloads ou prompts.

### 2.2. Pesquisa autorizada

- A matéria-prima enviada à E19.4 é a pesquisa integral `end_customer` explicitamente selecionada e validada pela E20.5 e incorporada ao resultado de Preparação da E20.6.
- Preservar identidade mínima: taxon servido, `taxon_slug`, `audience_scope = end_customer` e `research_version`.
- O conteúdo enviado é o Markdown integral da versão selecionada, com fontes, evidências, inferências, condições, exceções, limitações e contexto presentes no arquivo.
- A E19.3 não recria blocos, itens, prioridades, rankings ou qualquer representação intermediária da antiga pesquisa estruturada.
- Não existe filtragem por módulo, funil, CTA, seção, pertinência ou julgamento semântico da E19.3.
- `business_buyer` não é carregado para a geração da LP `end_customer`.
- O path físico/`relativePath` não entra no `modelContext` nem vira fonte de decisão da E19.4.

### 2.3. Fatos e regra de projeção

- Somente field do catálogo efetivo revalidado com `applicable = true`, `source != missing` e valor válido pode integrar o pacote.
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
- Metadados canônicos necessários permanecem preservados: `fieldKey`, `purpose`, `valueType`, `source` e proveniência.
- `missing` não integra o pacote como fato.
- `primary_conversion_channel` permanece semanticamente visível; destinos operacionais, logo e paleta permanecem com valores brutos em `serverContext`.
- Futuro `valueType` não classificável deve evoluir no contrato responsável, sem exceção nominal na E19.3.

### 2.4. Projeção mínima da E18.4

- `modelContext` recebe somente papéis semânticos, faixas textuais, `absoluteMax` e hierarquia necessários à produção textual.
- Os demais critérios visuais, responsivos, técnicos e de acessibilidade permanecem sob autoridade determinística da E18.4 e do renderer.
- A E19.3 não cria segunda parametrização raiz nem duplica regras da E18.4.

### 2.5. Proveniência, versões, fatos declarados e evidências

- A pesquisa preserva identidade operacional suficiente para demonstrar qual material foi exposto, sem proveniência por trecho, item ou claim criada pela E19.3.
- A versão histórica da configuração E19.2 e a versão E20.2 efetiva de revalidação permanecem distintas e auditáveis.
- Fato concreto reutiliza `fieldKey`, valor autorizado, `source` da E19.2, versão E20.2 efetiva e proveniência resultante do resolver canônico.
- `servedTaxon` e `appliedLayers` vêm do resolver E20.2 e podem compor a identidade auditável do pacote; a E19.3 não os reconstrói.
- A evidência documental da E20.2 justifica a existência do field; não comprova a veracidade do valor concreto fornecido pela conta.
- Fato declarado não se torna prova verificada.
- Evidência concreta só acompanha o pacote quando fonte canônica já fornecer referência real e autorizada; ausência permanece ausência.
- Não criar `fact_id`, `verified`, `evidence_id` ou marcação artificial para preencher desconhecimento.

### 2.6. Interface lógica de saída

- A estrutura permanece exatamente `identities + modelContext + serverContext`.
- Como o shape da pesquisa muda de forma incompatível em relação ao contrato do PR #729, o Cenário E usa `contractVersion: 3`, sem alias ou fallback para v2.
- `identities` preserva versões e identidades necessárias para auditar o pacote: contrato, conta, LP, plano efetivo, taxon servido, cadeia/camadas aplicadas quando úteis, versão histórica da configuração E19.2, versão E20.2 efetiva revisada, raiz E18.4 e pesquisa integral usada.
- `identities` não carrega path da pesquisa nem metadados da antiga atomização, composição, módulos, variantes, ordem ou perfil.
- `modelContext` preserva pesquisa integral, fatos semânticos revalidados, sua proveniência autorizada e projeção editorial mínima da E18.4.
- `serverContext` preserva fatos operacionais brutos e metadados necessários ao uso determinístico desses valores.
- A E19.3 expõe um único resultado TypeScript discriminado entre sucesso completo e falha explícita; a saída é profundamente imutável.
- A E19.4 consome essa saída diretamente; serialização específica do provider pertence à E19.4.

### 2.7. Simplificação obrigatória

- Implementação esperada:
  - ler a configuração E19.2 e autoridades atuais já usadas pelo boundary existente;
  - consumir a Preparação do taxon pelo boundary canônico E20.5/E20.6;
  - resolver E20.2 dinamicamente pela versão revisada + plano + cadeia completa;
  - revalidar read-only os valores existentes;
  - projetar pesquisa, fatos e limites;
  - montar, validar e devolver o pacote tipado.
- Reutilizar:
  - `generationContextAdapter.ts` e `generationContextAdapterCore.ts` como boundary existentes;
  - `resolveAccountLandingPageOnboardingConfiguration` para a semântica de revalidação factual quando aplicável;
  - `resolveLandingPageInputCatalog` como única composição taxonômica E20.2;
  - o boundary `taxon-preparation` e seus adapters para seleção, pesquisa integral e revisão E20.2.
- Ajuste técnico permitido na v2:
  - se a assinatura atual do adapter E20.6 exigir versão fornecida pelo caller, refiná-la minimamente dentro do boundary existente para que a E19.3 consuma a `reviewed_input_catalog_version` persistida como autoridade explícita, sem duplicar leitura de `business_taxons`, sem hardcode e sem `latest`.
- Não criar:
  - leitura direta do filesystem na E19.3;
  - API GitHub em runtime;
  - rota, serviço, tabela ou persistência adicional;
  - RAG, chunking, embedding, ranking ou seleção semântica;
  - registry/DSL/engine paralelo de fatos, contexto, claims ou herança taxonômica;
  - path persistido no banco;
  - allowlist nominal de fields;
  - camada intermediária entre E19.3 e E19.4.
- Crescimento motivado por extensibilidade sem consumidor atual é critério de simplificação.

## 3. Fases e próxima ação

### 3.1. E19.3.3 — Pacote autorizado para geração no Cenário E

- Status: planejada em plano-base v1; implementação não iniciada.
- Automação: não.
- Objetivo:
  - ajustar a implementação E19.3.3 já mergeada para consumir a Preparação do taxon E20.5/E20.6, revalidar dinamicamente a configuração E19.2 contra a versão E20.2 revisada e substituir a pesquisa estruturada da E10.8 pela pesquisa integral selecionada, preservando o boundary, a projeção por `valueType` e a interface de três blocos.
- Dependências anteriores à execução:
  - E20.5 concluída e ativa no ambiente alvo;
  - E20.6 concluída e ativa no ambiente alvo;
  - taxon piloto `corretor-imoveis` comprovado como `prepared: true` para pesquisa v1 e E20.2 v4;
  - configuração E19.2 vinculada ao draft real e disponível para revalidação read-only.
- Entregas:
  - manter residência em `lib/lp-builder/`;
  - preservar `identities + modelContext + serverContext` e evoluir para `contractVersion: 3`;
  - retirar `LandingPageResearchResolutionResult`, `resolveLandingPageResearchForTaxon` e demais dependências da E10.8 do caminho da compilação;
  - consumir a pesquisa integral e a revisão E20.2 pelo boundary de Preparação do taxon, sem leitura filesystem duplicada;
  - eliminar a autoridade fixa de `LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION = 2` para a revalidação de geração e usar a versão E20.2 revisada do taxon;
  - preservar separadamente a versão histórica da configuração E19.2;
  - resolver plano + cadeia completa pelo resolver canônico e revalidar os valores existentes read-only;
  - preservar projeção por `valueType`, limites E18.4 e logging seguro;
  - atualizar contratos TypeScript e casos executáveis focais;
  - não implementar E19.4 neste recorte.
- Validação mínima:
  - taxon preparado + LP/configuração válida produz pacote de sucesso;
  - sinais de preparação ausentes/incompatíveis falham fechado;
  - versão revisada é explicitamente executável e nenhuma versão maior no registry é escolhida automaticamente;
  - configuração histórica e versão efetiva de geração permanecem distintas no contrato auditável;
  - resolução usa a cadeia taxonômica completa e o plano efetivo, sem hardcode de nível, slug ou layer;
  - novo obrigatório aplicável/valor ausente ou incompatível falha como gap factual da E19.2;
  - defeito de catálogo/resolver falha como gap da E20.2;
  - pesquisa integral chega completa ao `modelContext` sem atomização;
  - E10.8 e `business_buyer` não participam do caminho de geração;
  - fatos continuam separados por `valueType` e `missing` não vira fato;
  - valores operacionais brutos não aparecem em `modelContext`;
  - `identities` preserva as versões necessárias e o pacote usa exclusivamente `contractVersion: 3`;
  - nenhum path da pesquisa aparece no contrato entregue à E19.4;
  - sucesso é profundamente imutável e falhas não produzem pacote parcial.
- Regressões obrigatórias:
  - E18.4;
  - E20.2;
  - E20.5/E20.6;
  - E19.2;
  - boundaries de autorização e vínculo já consumidos pela E19.3;
  - E10.8 somente para comprovar que consumidores independentes permanecem íntegros.
- Critério de primeira prova:
  - executar a compilação sobre o draft real da primeira LP e demonstrar, sem OpenAI, `E19.2 catalogVersion = 2` revalidada contra E20.2 v4 por plano + cadeia taxonômica completa, pesquisa integral `end_customer` v1 selecionada e fatos concretos corretamente separados entre `modelContext` e `serverContext`;
  - a prova v2 → v4 demonstra o mecanismo genérico, sem branch, exceção ou regra específica para `corretor-imoveis`.

### 3.2. Próxima ação

- Submeter este plano-base v1 ao processo escolhido pelo humano conforme `docs/prompt-estrategista.md` v31.
- Após aprovação e implementação da E19.3.3, executar a prova read-only real antes de qualquer retomada de E19.4.
- Após a prova E19.3 aprovada, retornar à E19.4.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- implementação, migration, seleção ou aprovação dos sinais já pertencentes à E20.5/E20.6;
- chamada OpenAI, geração de copy, prompt, modelo ou Structured Output da E19.4;
- módulos, variantes, layouts, seções, composição, validação pós-IA, materialização, snapshot ou renderer;
- E18.5, E20.3 ou pesquisa estruturada E10.8 como dependência da geração;
- alteração ou remoção dos consumidores legítimos da E10.8;
- `business_buyer` como requisito da LP `end_customer`;
- alteração de E18.4, E20.2, E20.5, E20.6 ou E19.2 sem gap real demonstrado pelo recorte;
- migration ou regravação da configuração E19.2 apenas para igualar sua versão histórica à versão E20.2 revisada;
- nova tabela, persistência da pesquisa em banco, API GitHub, rota, serviço, Provider, agente, automação, job, fila, cron, webhook, RAG ou infraestrutura nova;
- duplicação da herança E20.2 ou leitura direta de `business_taxons`/filesystem quando o boundary canônico já entregar a informação necessária;
- tracking, analytics, CRM, domínio, publicação, A/B test, Ads ou integrações futuras;
- regra específica da conta piloto, versão v4 ou slug `corretor-imoveis` na lógica genérica E19.3;
- contrato estrutural da candidata, que pertence à E19.4.

### 4.2. Critérios de parada

- Parar se o taxon não estiver preparado pelo boundary E20.5/E20.6 ou se faltar fonte canônica indispensável.
- Parar e devolver à E19.2 se a revalidação revelar novo field obrigatório aplicável, valor ausente ou valor concreto incompatível.
- Parar e devolver à E20.2 se a inconsistência estiver no catálogo, composição taxonômica, especialização ou resolver.
- Parar se a projeção exigir mapa nominal crescente, resumo, ranking, chunking, seleção semântica ou filtro editorial.
- Parar se for necessário inventar evidência, prova, claim verificado ou semântica não sustentada.
- Parar se surgir seleção de módulo, variante, ordem, narrativa ou layout dentro da E19.3.
- Parar se surgir necessidade de tabela, rota, job, agente, automação, engine ou infraestrutura não sustentada por fonte real.
- Parar e simplificar se o crescimento vier principalmente de generalizações para consumidores futuros inexistentes.
- Toda ampliação material de escopo volta ao humano.