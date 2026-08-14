14/08/2026 — Rascunho vivo — E19.3 — Pacote autorizado para geração no Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo da reformulação da E19.3 para o Cenário E; ainda não é briefing executável nem implementação autorizada.
- Recorte: `E19.3 — Pacote autorizado para geração no Cenário E`.
- Path canônico: `docs/lousa-plano-base-e19-3.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- A implementação vigente da E19.3.3 foi mergeada pelo PR #729 em 12/08/2026 e permanece como base técnica real até a execução desta reformulação.
- O PR #729 substituiu `partA + partB` por `identities + modelContext + serverContext`, removeu E18.5 e E20.3 do caminho da compilação e deixou a E19.3 sem composição narrativa prévia.
- Decisão humana de 14/08/2026: o Cenário E é a única direção ativa para a primeira LP real; o Cenário D deixa de ser direção de implementação.
- A arquitetura lógica `identities + modelContext + serverContext` é preservada.
- A mudança central deste recorte é retirar a pesquisa estruturada da E10.8 do caminho de geração e transportar a pesquisa integral `end_customer` autorizada pelo taxon.
- A preparação do taxon é precondição externa da E19.3 e pertence aos dois recortes próprios delegados a outro Estrategista; a E19.3 apenas consome e valida seu resultado.
- Nenhuma alteração de runtime decorrente desta reformulação foi iniciada neste documento.

### 1.2. Objetivo e resultado esperado

- Manter a E19.3 como o menor boundary determinístico entre as fontes autorizadas do projeto e a E19.4.
- Receber uma `landing_page` legítima, configurada pelo fluxo oficial e vinculada a taxon previamente preparado, e entregar à E19.4 um único pacote autorizado com pesquisa integral, fatos concretos, limites editoriais e contexto operacional.
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
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-4.md` somente para o contrato esperado pelo consumidor E19.4.
- `docs/prompt-nicho-arquivamento-pesquisa.md` e `docs/prompt-nicho-pesquisa.md` para identidade, versionamento e conteúdo da pesquisa integral.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` como primeiro caso real, sem tornar seu slug regra de domínio.
- `lib/conversion-content/landing-page/input-catalog/registry.ts` para as versões executáveis E20.2.
- `lib/conversion-content/landing-page/` para a API pública da E18.4.
- `lib/lp-builder/contracts.ts`.
- `lib/lp-builder/generationContext.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- `lib/lp-builder/adapters/generationContextAdapter.ts`.
- `lib/lp-builder/adapters/generationContextAdapterCore.ts`.
- `lib/admin/readRepoDoc.ts` como precedente real de leitura server-side de Markdown com `node:fs/promises`.
- `next.config.js` somente como precedente de empacotamento explícito de Markdown quando houver consumer hospedado que o exija.
- E10.8 e sua implementação somente para retirar o acoplamento do caminho de geração sem prejudicar consumidores independentes.

### 1.4. Responsabilidades preservadas

- Os recortes próprios de Preparação do taxon são responsáveis por entregar taxon ativo, pesquisa integral `end_customer` aprovada/selecionada e avaliação E20.2 concluída contra a versão executável aplicável; sua persistência, aprovação e lifecycle não pertencem à E19.3.
- E19.2 permanece responsável pelos valores concretos configurados, sua aplicabilidade, origem, completude e vínculo ao `draft`.
- E20.2 permanece responsável pelo catálogo declarativo de entradas, tipos, escopos, condições, validações e proveniência das definições; a E19.3 não transforma o catálogo em fonte de valores concretos.
- E18.4 permanece responsável pela parametrização raiz; a E19.3 projeta somente o subconjunto editorial útil à geração.
- E9 e os boundaries vigentes permanecem responsáveis por entitlement, autorização, tenant, membership e vínculo da LP.
- E18.5 e E20.3 permanecem fora da E19.3.
- E10.8 deixa de ser dependência da geração E19.3 → E19.4; seus demais consumidores permanecem independentes.
- A E19.3 permanece no boundary `lib/lp-builder/`; não criar novo domínio, rota, API HTTP, serviço, engine, agente ou infraestrutura para carregar a pesquisa.
- GitHub permanece fonte versionada dos arquivos; o runtime lê o Markdown incluído no próprio deploy, sem API GitHub.

### 1.5. Decisões consolidadas dos Gates

- Gate 1 — precondição de taxon preparado:
  - a E19.3 recebe o taxon já preparado pelos recortes responsáveis;
  - consome `selected_end_customer_research_version` e `reviewed_input_catalog_version` somente como sinais autorizados já existentes;
  - `reviewed_input_catalog_version` deve corresponder à versão E20.2 efetivamente consumida pela configuração/compilador; a existência de versão maior no registry não promove nem invalida automaticamente o fluxo;
  - `business_buyer` não é requisito da geração da LP `end_customer`;
  - ausência ou inconsistência desses sinais falha fechado.
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
- Gate 4 — pesquisa integral no runtime:
  - o path da primeira prova deriva de `taxon.slug + end_customer + selected_version` no padrão vigente `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`;
  - o servidor lê o arquivo do próprio deploy com `node:fs/promises`;
  - o conteúdo deve validar `taxon_slug`, `audience_scope` e `research_version` contra a seleção autorizada;
  - o path é detalhe físico e não integra o contrato entregue à E19.4;
  - `outputFileTracingIncludes` só será ajustado quando um consumer hospedado concreto exigir o empacotamento da pesquisa.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho:
  - invocação server-side explícita para obter o pacote autorizado de uma LP legítima já configurada.
- Precondição:
  - taxon preparado pelos recortes responsáveis e sinais correspondentes já existentes no ambiente alvo.
- Entrada:
  - LP em `draft`;
  - configuração concluída e vinculada pela E19.2;
  - plano e taxon efetivos;
  - parametrização raiz E18.4.
- Processamento:
  - validar LP, configuração, autorização e entitlement pelos boundaries vigentes;
  - identificar o taxon servido a partir da configuração autoritativa;
  - ler e validar os sinais do taxon preparado;
  - exigir `reviewed_input_catalog_version` compatível com a versão E20.2 efetivamente consumida;
  - derivar e ler a pesquisa integral `end_customer` selecionada no filesystem do deploy;
  - validar identidade e versão declaradas no arquivo;
  - projetar o conteúdo integral sem resumo, atomização ou seleção semântica;
  - projetar fields concretos aplicáveis, presentes e já validados;
  - separar o valor bruto por `valueType` entre contexto semântico e server-side;
  - projetar os limites editoriais mínimos da E18.4;
  - montar e validar `identities + modelContext + serverContext`;
  - devolver a saída profundamente imutável.
- Validação:
  - falhar fechado para LP/configuração inválida, taxon não preparado, versão de pesquisa inválida, arquivo inexistente, metadata incompatível, avaliação E20.2 incompatível, fato obrigatório ausente ou outra inconsistência comprovável;
  - resolver e validar entitlement exclusivamente pelo boundary interno vigente da E9.
- Persistência:
  - nenhuma nova na E19.3.
- Consumo:
  - a saída de sucesso é a única entrada de domínio da E19.4;
  - a E19.4 não relê diretamente E10.8, E18.4, E20.2, E18.5 ou E20.3 para reconstruir o contexto.
- Fallback:
  - nenhum fallback silencioso para outra versão de pesquisa, arquivo mais recente, E10.8 ou ancestor;
  - ausência ou inconsistência falha fechado.
- Observabilidade:
  - preservar logging seguro já autorizado, sem conteúdo da pesquisa, valores concretos, PII, secrets, payloads ou prompts.

### 2.2. Pesquisa autorizada

- A matéria-prima enviada à E19.4 é a pesquisa integral `end_customer` explicitamente selecionada no taxon preparado.
- Preservar identidade mínima: taxon servido, `taxon_slug`, `audience_scope = end_customer` e `research_version`.
- O conteúdo enviado é o Markdown integral da versão selecionada, com fontes, evidências, inferências, condições, exceções, limitações e contexto presentes no arquivo.
- A E19.3 não recria blocos, itens, prioridades, rankings ou qualquer representação intermediária da antiga pesquisa estruturada.
- Não existe filtragem por módulo, funil, CTA, seção, pertinência ou julgamento semântico da E19.3.
- `business_buyer` não é carregado para a geração da LP `end_customer`.
- O path físico não entra no `modelContext` nem vira fonte de decisão da E19.4.

### 2.3. Fatos e regra de projeção

- Somente field concreto com `applicable = true`, `source != missing` e valor já validado pode integrar o pacote.
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

### 2.5. Proveniência, fatos declarados e evidências

- A pesquisa preserva identidade operacional suficiente para demonstrar qual material foi exposto, sem proveniência por trecho, item ou claim criada pela E19.3.
- Fato concreto reutiliza `fieldKey`, valor autorizado, `source` da E19.2, versão executável do catálogo consumida e proveniência existente.
- A evidência documental da E20.2 justifica a existência do field; não comprova a veracidade do valor concreto fornecido pela conta.
- Fato declarado não se torna prova verificada.
- Evidência concreta só acompanha o pacote quando fonte canônica já fornecer referência real e autorizada; ausência permanece ausência.
- Não criar `fact_id`, `verified`, `evidence_id` ou marcação artificial para preencher desconhecimento.

### 2.6. Interface lógica de saída

- A estrutura permanece exatamente `identities + modelContext + serverContext`.
- Como o shape da pesquisa muda de forma incompatível em relação ao contrato do PR #729, o Cenário E usa `contractVersion: 3`, sem alias ou fallback para v2.
- `identities` preserva versões e identidades necessárias para auditar o pacote: contrato, conta, LP, plano, taxon, catálogo E20.2 consumido/revisado, configuração E19.2, raiz E18.4 e pesquisa integral usada.
- `identities` não carrega path da pesquisa nem metadados da antiga atomização, composição, módulos, variantes, ordem ou perfil.
- `modelContext` preserva pesquisa integral, fatos semânticos, sua proveniência autorizada e projeção editorial mínima da E18.4.
- `serverContext` preserva fatos operacionais brutos e metadados necessários ao uso determinístico desses valores.
- A E19.3 expõe um único resultado TypeScript discriminado entre sucesso completo e falha explícita; a saída é profundamente imutável.
- A E19.4 consome essa saída diretamente; serialização específica do provider pertence à E19.4.

### 2.7. Simplificação obrigatória

- Implementação esperada:
  - ler configuração e taxon canônicos;
  - validar a precondição externa de taxon preparado;
  - ler e validar a pesquisa integral do filesystem;
  - projetar pesquisa, fatos e limites;
  - montar, validar e devolver o pacote tipado.
- Reutilizar:
  - `generationContextAdapter.ts` e `generationContextAdapterCore.ts` como boundary existentes;
  - `node:fs/promises` para leitura server-side;
  - proteção de path equivalente à já usada em `lib/admin/readRepoDoc.ts`.
- Adiar:
  - ajuste exato de `outputFileTracingIncludes` até consumer hospedado real exigir o arquivo no deploy.
- Não criar:
  - API GitHub em runtime;
  - rota, serviço, tabela ou persistência adicional;
  - RAG, chunking, embedding, ranking ou seleção semântica;
  - registry/DSL/engine de fatos, contexto ou claims;
  - path persistido no banco;
  - allowlist nominal de fields;
  - camada intermediária entre E19.3 e E19.4.
- Crescimento motivado por extensibilidade sem consumidor atual é critério de simplificação.

## 3. Fases e próxima ação

### 3.1. E19.3.3 — Pacote autorizado para geração no Cenário E

- Status: rascunho; execução condicionada à conclusão prévia dos recortes de Preparação do taxon.
- Automação: não.
- Objetivo:
  - ajustar a implementação E19.3.3 já mergeada para substituir a pesquisa estruturada da E10.8 pela pesquisa integral selecionada, preservando o boundary, a projeção de fatos e a interface de três blocos.
- Dependências anteriores à execução:
  - taxon piloto preparado pelos recortes responsáveis;
  - `selected_end_customer_research_version` e `reviewed_input_catalog_version` já existentes e válidos no ambiente alvo;
  - configuração E19.2 completa e compatível com a versão E20.2 efetivamente consumida.
- Entregas:
  - manter residência em `lib/lp-builder/`;
  - preservar `identities + modelContext + serverContext` e evoluir para `contractVersion: 3`;
  - retirar `LandingPageResearchResolutionResult`, `resolveLandingPageResearchForTaxon` e demais dependências da E10.8 do caminho da compilação;
  - ler e validar os sinais do taxon preparado e a pesquisa integral selecionada;
  - comparar `reviewed_input_catalog_version` com a versão efetivamente consumida, sem escolher automaticamente maior versão do registry;
  - preservar configuração E19.2, projeção por `valueType`, limites E18.4 e logging seguro;
  - atualizar contratos TypeScript e casos executáveis focais;
  - não implementar preparação do taxon nem E19.4 neste recorte.
- Validação mínima:
  - taxon preparado + LP/configuração válida produz pacote de sucesso;
  - sinais de preparação ausentes/incompatíveis falham fechado;
  - versão E20.2 maior no registry não altera automaticamente a versão consumida;
  - arquivo inexistente ou metadata incompatível falha fechado;
  - pesquisa integral chega completa ao `modelContext` sem atomização;
  - E10.8 e `business_buyer` não participam do caminho de geração;
  - fatos continuam separados por `valueType` e `missing` não vira fato;
  - valores operacionais brutos não aparecem em `modelContext`;
  - `identities` preserva versões necessárias e o pacote usa exclusivamente `contractVersion: 3`;
  - nenhum path da pesquisa aparece no contrato entregue à E19.4;
  - sucesso é profundamente imutável e falhas não produzem pacote parcial.
- Regressões obrigatórias:
  - E18.4;
  - E20.2;
  - E19.2;
  - boundaries de autorização e vínculo já consumidos pela E19.3;
  - E10.8 somente para comprovar que consumidores independentes permanecem íntegros.
- Critério de primeira prova:
  - executar a compilação sobre o draft real da primeira LP e demonstrar, sem OpenAI, pesquisa integral `end_customer` selecionada + fatos concretos válidos corretamente separados entre `modelContext` e `serverContext`.

### 3.2. Próxima ação

- Aguardar/concluir os dois recortes próprios de Preparação do taxon; a E19.3 não implementa nem fabrica seus sinais de aprovação.
- Com o taxon piloto preparado, consolidar este rascunho como plano executável e executar E19.3.3 na ordem `validar precondição → compilador v3 → prova read-only`.
- Após a prova E19.3 aprovada, retornar à E19.4.
- Não antecipar `outputFileTracingIncludes` sem consumer hospedado real.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- implementação, migration, seleção ou aprovação dos sinais de Preparação do taxon;
- chamada OpenAI, geração de copy, prompt, modelo ou Structured Output da E19.4;
- módulos, variantes, layouts, seções, composição, validação pós-IA, materialização, snapshot ou renderer;
- E18.5, E20.3 ou pesquisa estruturada E10.8 como dependência da geração;
- alteração ou remoção dos consumidores legítimos da E10.8;
- `business_buyer` como requisito da LP `end_customer`;
- alteração de E18.4, E20.2 ou E19.2 sem gap real demonstrado;
- nova tabela, persistência da pesquisa em banco, API GitHub, rota, serviço, Provider, agente, automação, job, fila, cron, webhook, RAG ou infraestrutura nova para carregar a pesquisa;
- tracking, analytics, CRM, domínio, publicação, A/B test, Ads ou integrações futuras;
- regra específica da conta piloto ou de um nicho na lógica E19.3;
- contrato estrutural da candidata, que pertence à E19.4.

### 4.2. Critérios de parada

- Parar se o taxon não estiver preparado pelos recortes responsáveis ou se faltar fonte canônica indispensável.
- Parar se a leitura da pesquisa exigir serviço externo/API GitHub sem evidência de necessidade.
- Parar se a projeção exigir mapa nominal crescente, resumo, ranking, chunking, seleção semântica ou filtro editorial.
- Parar se for necessário inventar evidência, prova, claim verificado ou semântica não sustentada.
- Parar se surgir seleção de módulo, variante, ordem, narrativa ou layout dentro da E19.3.
- Parar se surgir necessidade de tabela, rota, job, agente, automação, engine ou infraestrutura não sustentada por fonte real.
- Parar e simplificar se o crescimento vier principalmente de generalizações para consumidores futuros inexistentes.
- Toda ampliação material de escopo volta ao humano.