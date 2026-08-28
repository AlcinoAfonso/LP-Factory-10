# 28/08/2026 — Plano-base v1 — E20.7 — Liberação taxonômica para geração de Landing Pages

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: **plano-base v1 consolidado** após debate humano e conclusão dos Gates 1–7; ainda não constitui autorização de implementação nem de merge.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte: `E20.7 — Liberação taxonômica para geração de Landing Pages`.
- Objetivo: permitir que a geração use a fonte de conhecimento de mercado mais específica e segura para o escopo comercial da LP, sem transformar oferta em nova autoridade taxonômica, sem enfraquecer a autoridade factual E20.2 e sem introduzir infraestrutura desnecessária.
- Plano conceitual: N/A.
- Decisão funcional: **Opção A — Deep Research preferencial por nicho ou especialização relevante, com complemento dinâmico controlado quando não existir Deep Research especializada elegível**.
- O taxon primário da conta permanece a identidade taxonômica estável do negócio; a fonte de conhecimento usada por uma revisão é decisão derivada, não segunda taxonomia da LP.
- O escopo comercial da LP é fornecido por `landing_page_offering_scope`, cuja autoridade pertence à E20.2.9/E19.5; a E20.7 apenas o consome para resolver conhecimento.
- O PR #830/E20.2.9.2 permanece pré-publicação no momento desta v1: `CURRENT=5`; portanto a implementação operacional da E20.7 depende da publicação e integração da E20.2 v6.
- A E21.4 permanece autoridade do gasto oficial OpenAI e do custo prospectivo dos workloads de texto/imagem de LP cobertos por seu MVP reduzido; o novo workload de pesquisa dinâmica segue a governança/observabilidade técnica E21.2 e, financeiramente, permanece dentro do gasto oficial em `Outros gastos / reconciliação`, sem criar medição paralela na E20.7.

### 1.2. Evidência que sustenta a decisão

- Gate 1: contrato da nova Deep Research definido como inteligência reutilizável de mercado e comportamento, não blueprint de LP.
- Gate 2: `docs/prompt-nicho-pesquisa-mercado-experimental.md` consolidado para produzir pesquisa sem wireframe, copy, CTA ou SEO prescritivo.
- Gate 3: `corretor-imoveis/end_customer/v2` aprovado e arquivado pelo PR #827, preservando a v1.
- Gate 4: revisão 6 gerada com pesquisa v2 contra revisão 5 com v1, mantendo E20.2 v5, contexto factual, prompt textual e contratos de geração comparáveis.
- Gate 5: resultado positivo parcial; a v2 melhorou materialmente objetivo comercial, adequação ao momento do público, progressão narrativa, unidade de mensagem, conversão coerente e especificidade, sem regressão factual observada.
- Gate 5: entrada textual passou de `9.150` para `18.306` tokens; latência textual caiu de `51.381 ms` para `42.758 ms`; custo permaneceu indisponível no snapshot e uma geração por variante não comprova estabilidade universal.
- Gate 6: complemento dinâmico definido como etapa síncrona separada, anterior à copy, com Responses API + Web Search hospedado, até duas execuções de busca e falha fechada quando o complemento necessário não puder ser comprovado.
- Gate 7: confirmado que o MVP não precisa de nova tabela/coluna de negócio, seleção persistida de pesquisa por LP, Storage, RAG, agente ou segunda residência para a Deep Research.
- Limitações do prompt persuasivo e do renderer foram identificadas experimentalmente, mas ficam fora do escopo executável da E20.7.

### 1.3. Fontes do projeto

- `README.md` — visão do produto e princípio de menor complexidade suficiente.
- `docs/prompt-estrategista.md` v35 — processo de consolidação da v1 e escolha posterior do processo.
- `docs/template-roadmap.md` — hierarquia e numeração das fases executáveis.
- `docs/gestor-automations.md` — classificação da automação com IA em fluxo controlado.
- `docs/lousa-plano-base-e20-2.md` e `docs/lousa-plano-base-e20-2-8.md` — catálogo factual, lifecycle e versão efetiva.
- `docs/lousa-plano-base-e20-2-9.md`, PR #826 e PR #830 — `landing_page_offering_scope`, compatibilidade v5→v6 e estado de publicação.
- `docs/lousa-plano-base-e20-5.md` — seleção humana e leitura integral da Deep Research por taxon.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual e predicado derivado de taxon preparado.
- `docs/lousa-plano-base-e19-3.md` e `lib/lp-builder/generationContext.ts` — contexto autorizado e invariável atual entre taxon servido e pesquisa.
- `docs/lousa-plano-base-e19-4.md`, `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`, `lib/lp-builder/landingPageRevisionWorkflow.ts` e `lib/lp-builder/landingPageRevision.ts` — geração, budgets, falha fechada, snapshot e materialização.
- `docs/lousa-plano-base-e19-5.md` — configuração compartilhada/específica da LP e autoridade operacional pós-handoff.
- `lib/openai-workloads/registry.ts` — governança dos workloads OpenAI de produto.
- `docs/lousa-plano-base-e21-4.md`, PR #824 e PR #831 — autoridade financeira e redução atual do MVP da E21.4 aos workloads de texto/imagem de LP, mantendo demais consumos em `Outros gastos / reconciliação`.
- `lib/conversion-content/landing-page/taxon-preparation/research.ts` e `next.config.js` — loader repo-only e tracing atual da biblioteca.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` e `v2.md` — baseline e piloto comparável.

### 1.4. Contrato da Deep Research

- Deep Research é conhecimento consultivo de mercado e comportamento do público, produzido fora do caminho interativo de geração e reutilizável entre LPs compatíveis.
- Deve cobrir, conforme aplicável: mercado/categoria, públicos e situações, jobs-to-be-done, dores, desejos, medos e riscos, objeções, critérios e trade-offs, alternativas, jornada, confiança/prova, linguagem/perguntas, padrões de mensagem, dimensões factuais variáveis, contexto regulatório/geográfico, sinais temporais, lacunas e fontes.
- Afirmações materiais distinguem evidência, inferência e hipótese; conhecimento temporal distingue estrutural, semiestável e volátil quando relevante.
- Pesquisa especializada deve ser autossuficiente no próprio escopo; quando usada, não existe obrigação de enviar também a pesquisa ancestral.
- Ficam fora da Deep Research: wireframe, ordem/quantidade de seções, módulos, layout, headline, copy, CTA pronto, on-page SEO prescritivo, fatos concretos do cliente, criação de fields E20.2 e decisões de infraestrutura.
- A biblioteca permanece no MVP em `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`, com seleção humana E20.5 e conteúdo integral.
- A residência repo-only será reavaliada somente diante de impacto medido em bundle/build/deploy ou operação de versionamento; não criar threshold arbitrário nem migrar preventivamente.

### 1.5. Autoridade factual e equivalência entre taxons

- `modelContext.facts` permanece derivado exclusivamente da cadeia factual do taxon servido e das configurações E20.2/E19.5.
- Deep Research especializada ou complemento dinâmico nunca autoriza preço, disponibilidade, localização concreta, credencial, prova social, condição comercial ou outro fato objetivo do cliente.
- Antes de reutilizar Deep Research de taxon descendente, taxon servido e taxon fonte precisam estar preparados para a mesma versão E20.2 efetiva.
- Seus contratos factuais resolvidos devem ser funcionalmente equivalentes de forma conservadora nos planos suportados, ignorando somente identidade/proveniência taxonômica que naturalmente diferem.
- Diferença material em field, finalidade, tipo, scope, obrigação, condição ou validação bloqueia a especialização no modelo atual.
- Essa comparação é determinística e própria do resolver E20.7/E20.2; não reutiliza `compatible_evolution` da E20.2.8 e não amplia a IA da E20.6.
- Um gap factual não pode ser contornado por Web Search; retorna ao fluxo E20.6 → E20.2 ou a planejamento estrutural competente.

### 1.6. Automação aprovada

- A resolução taxonômica/factual da fonte é determinística e não usa IA.
- O complemento dinâmico, quando acionado, é **Automação: sim**.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal: `2.2.1 — Runtime do LP Factory`.
- Plataforma dependente: OpenAI Platform / Responses API com Web Search hospedado.
- Objetivo: obter somente o delta de conhecimento material ausente na Deep Research-base para o escopo comercial daquela LP.
- Limites: até duas execuções de Web Search, `store:false`, sub-timeout máximo de 45 s, fontes preservadas, sem retry automático, fallback de modelo/tool, agente, Agents SDK, job, fila, crawler, RAG ou cache global.
- Participação humana: o usuário aciona a geração da revisão; não existe intervenção humana no meio da execução; aprovação da revisão continua separada e explícita conforme E19.5.
- Avaliação formal de Automação na v2: **necessária**.

### 1.7. Dependências de execução

- E20.2 v6 precisa estar publicada, atual e consumível pelo workspace/generation context; o plano não assume conclusão antecipada do PR #830.
- O taxon servido precisa possuir E20.5 válida e E20.6 compatível com a versão E20.2 efetiva requerida.
- Taxon descendente candidato a fonte especializada precisa estar ativo, possuir E20.5/E20.6 válidas para a mesma versão efetiva e passar pela equivalência factual da seção 1.5.
- O lifecycle E21.2 precisa admitir o novo workload de pesquisa dinâmica antes de sua ativação e fornecer sua governança/observabilidade técnica normal.
- A E21.4 reduzida não bloqueia a ativação do novo workload: o custo financeiro da pesquisa dinâmica não é atribuído por LP nesse MVP e permanece contabilizado no gasto oficial em `Outros gastos / reconciliação`.

## 2. Contrato do caso

### 2.1. Gatilho e entrada

- Gatilho: owner/admin elegível solicita explicitamente nova revisão de uma LP operacionalmente configurada.
- Entrada autoritativa: conta/LP autorizadas, taxon servido e cadeia, versão E20.2 efetiva, fatos resolvidos, `landing_page_offering_scope`, descrição do escopo, `funnel_stage`, `transaction_intent` quando aplicável, objetivo/canal de conversão e preparação E20.5/E20.6.
- `business_offerings_summary`, nome da LP e texto livre não são autoridade taxonômica nem whitelist de ofertas.
- Secrets, destinos privados, IDs desnecessários e `serverContext` bruto não são enviados à pesquisa dinâmica.

### 2.2. Resolução da fonte de conhecimento

- O resolver opera server-side em cada nova geração e não persiste uma seleção de pesquisa na LP.
- `mode = single`:
  - procurar apenas um match canônico exato e único entre a oferta informada e o **nome canônico** de um taxon descendente ativo (`business_taxons.name`);
  - comparar oferta e nome do taxon após `trim` e de forma case-insensitive, sem sinônimos, stemming, embeddings ou roteamento semântico; o `slug` identifica o taxon somente depois de encontrado o match e não participa da aproximação textual;
  - se houver match único, exigir preparação e equivalência factual da seção 1.5;
  - se passar, usar a Deep Research descendente como fonte `specialized_deep`;
  - se não existir match único/elegível, usar a Deep Research do taxon servido como base e acionar o complemento dinâmico, produzindo `base_plus_dynamic` quando houver delta material.
- `mode = multiple`:
  - usar a Deep Research do taxon servido como base;
  - executar **um único complemento dinâmico sobre o conjunto inteiro de ofertas**, sem classificador ou etapa prévia para decidir se há necessidade material;
  - a própria pesquisa dinâmica retorna `material_delta` quando houver diferença sustentada ou `no_material_delta` quando a Deep Research-base já for suficiente;
  - nunca selecionar uma Deep Research ou disparar pesquisa separada por item.
- `mode = portfolio`:
  - usar a Deep Research do taxon servido;
  - não pesquisar individualmente cada item do portfólio.
- O match textual localiza somente uma fonte candidata de conhecimento; não reclassifica a conta, não altera `servedTaxon` e não cria nova autoridade taxonômica.

### 2.3. Complemento dinâmico

- Quando necessário, ocorre antes da geração textual e em workload próprio.
- Entrada mínima: Deep Research-base autorizada, escopo/descrição das ofertas, taxon servido e, quando materialmente aplicáveis, `funnel_stage`, `transaction_intent` e geografia factual autorizada.
- Pesquisa somente o delta que pode alterar a interpretação do público: situações/jobs, dores/riscos, objeções, critérios/trade-offs, alternativas, confiança/prova, linguagem/perguntas e aspectos atuais/voláteis relevantes.
- O Web Search deve efetivamente ser usado; resposta de memória não substitui a pesquisa quando o fallback foi acionado.
- Limite inicial: até duas execuções do recurso Web Search; cada execução pode consultar múltiplas fontes.
- Resultado tipado mínimo: `material_delta | no_material_delta | insufficient_evidence`.
- `material_delta`: encaminhar Deep Research-base + suplemento como proveniências consultivas distintas.
- `no_material_delta`: prosseguir apenas com a Deep Research-base e registrar que a busca foi executada sem diferença material sustentada.
- `insufficient_evidence`, timeout, refusal, erro de provider, resposta inválida ou ausência de fontes utilizáveis: falhar a tentativa sem criar revisão.
- O suplemento não vira automaticamente ativo E20.5; repetição recorrente pode apenas gerar evidência para futura decisão humana de criar Deep Research especializada.

### 2.4. Contexto entregue à geração

- A próxima versão do generation context separa explicitamente:
  - taxon servido e cadeia factual;
  - Deep Research efetivamente usada, com taxon fonte, versão, audience scope e conteúdo integral;
  - modo de resolução `specialized_deep | base_only | base_plus_dynamic`;
  - suplemento dinâmico opcional, com alvo, status, conteúdo quando material, fontes e data.
- A nova versão remove apenas para o futuro a invariável atual `research.taxonSlug === servedTaxon.slug`; versões e snapshots históricos permanecem legíveis e imutáveis.
- Facts continuam separados das pesquisas e são a única autoridade para claims objetivos.
- O workload textual de LP continua sem tools e recebe o conhecimento já resolvido/validado.
- O ajuste de prompt desta E20.7 limita-se a reconhecer Deep Research e suplemento como contexto consultivo sem autoridade factual; o redesign persuasivo identificado no Gate 5 pertence a outro recorte.

### 2.5. Validação e persistência

- Resolver, preparação e equivalência falham fechado diante de inconsistência de taxon, versão, pesquisa, catálogo ou configuração.
- A tentativa só cria revisão depois de concluídos complemento dinâmico aplicável, texto, imagem, validações, upload e revalidação de autoridade vigentes.
- Não criar `research_taxon_id`, `research_version` por LP, tabela de seleção, cache global ou nova coluna de negócio para a E20.7.
- Revisão válida congela no próximo snapshot:
  - modo de resolução;
  - taxon fonte e versão/conteúdo da Deep Research;
  - suplemento, quando executado;
  - status `material_delta | no_material_delta`;
  - alvo, data e fontes;
  - workload/revisão, response ID, usage, latência e quantidade de Web Search runs.
- Revisões históricas nunca são reinterpretadas quando nova Deep Research é arquivada/selecionada depois.
- Tentativa que falha antes da materialização não possui snapshot de revisão; sua correlação, usage e latência seguem a observabilidade técnica do workload quando disponíveis, enquanto o impacto financeiro permanece no gasto oficial da E21.4 em `Outros gastos / reconciliação`, sem atribuição por LP.

### 2.6. Consumo e fallback

- `specialized_deep`: geração usa somente a Deep Research especializada autossuficiente.
- `base_only`: geração usa somente a Deep Research do taxon servido.
- `base_plus_dynamic`: geração usa base + suplemento validado.
- Ausência da própria Deep Research-base selecionada continua sendo falha de preparação E20.5; pesquisa dinâmica não substitui E20.5.
- Falha de especialização por equivalência factual não autoriza pesquisa dinâmica a inventar ou suprir fatos do descendente.
- Nenhuma falha altera automaticamente seleção E20.5, revisão E20.6, taxon da conta, escopo comercial ou configuração da LP.

### 2.7. Experiência do usuário

- A UX não expõe taxon, ultranicho, E20.2, E20.5, E20.6, seleção de pesquisa ou Web Search como decisão que o cliente precise operar.
- O cliente continua informando `O que esta landing page vai divulgar?` no contrato E20.2.9 e acionando `Gerar nova revisão` no workspace.
- O tempo adicional do complemento integra a tentativa de geração e respeita o budget total; não criar job assíncrono apenas por esse motivo.
- Falhas permanecem seguras e não deixam revisão parcial; a mensagem pública não expõe payloads, fontes internas, secrets ou detalhes do provider.

## 3. Fases e próxima ação

### 3.1. E20.7.3 — Resolver de conhecimento e próxima versão do contexto

- Automação: não.
- Objetivo: implementar a resolução determinística `single | multiple | portfolio`, a elegibilidade da Deep Research especializada, a equivalência factual E20.2 e a próxima versão do generation context que separa taxon servido de fonte de conhecimento.
- Dependência de início: E20.2 v6 publicada e operacionalmente autorizada; não implementar sobre `CURRENT=5` como contrato definitivo.
- Processamento:
  - reutilizar E20.5/E20.6 e o resolver E20.2 existentes;
  - localizar candidato descendente somente por igualdade exata, após `trim` e case-insensitive, entre a oferta `single` e `business_taxons.name`; usar o `slug` somente como identidade do match encontrado;
  - aplicar preparação + equivalência conservadora;
  - produzir decisão tipada `specialized_deep | base_only | dynamic_required` sem persistência própria;
  - em `multiple`, marcar `dynamic_required` uma única vez para o conjunto inteiro, sem classificador prévio e sem pesquisa por item;
  - versionar o generation context sem reescrever contratos históricos.
- Critérios de aceite:
  - base-only preserva comportamento factual vigente;
  - descendente equivalente pode fornecer pesquisa sem alterar facts/servedTaxon;
  - descendente com diferença material é bloqueado;
  - ausência/ambiguidade de match não escolhe taxon por heurística;
  - `single` não compara contra slug, alias ou similaridade semântica;
  - `multiple` dispara no máximo um complemento para o conjunto e `portfolio` não dispara pesquisa por item;
  - nenhuma nova tabela, coluna ou residência é criada.

### 3.2. E20.7.4 — Complemento dinâmico controlado e integração E21

- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Objetivo: implementar o workload de pesquisa dinâmica e sua observabilidade, sem alterar a responsabilidade do workload de copy.
- Limites: Responses API + Web Search hospedado, até duas execuções de busca, `store:false`, sub-timeout máximo de 45 s, fontes obrigatórias, sem retry/fallback silencioso, agente, Agents SDK, job, fila, crawler, RAG ou cache global.
- Avaliação formal de Automação na v2: necessária.
- Dependências:
  - lifecycle E21.2 capaz de governar o novo workload `product_runtime` e sua observabilidade técnica normal.
- Processamento:
  - criar prompt de runtime focado apenas no delta consultivo;
  - produzir resultado tipado `material_delta | no_material_delta | insufficient_evidence`;
  - emitir correlação, usage, latência e quantidade de Web Search runs conforme a observabilidade técnica vigente, inclusive quando disponíveis em falha antes da materialização;
  - não criar cálculo financeiro próprio: o novo workload permanece em `Outros gastos / reconciliação` no MVP reduzido da E21.4.
- Critérios de aceite:
  - pesquisa necessária usa Web Search de fato e preserva fontes;
  - `material_delta` produz suplemento consultivo utilizável;
  - `no_material_delta` permite base-only com proveniência explícita;
  - erro/timeout/refusal/evidência insuficiente falha sem revisão;
  - nenhuma persistência financeira paralela é criada e a E21.4 não é ampliada por consequência da E20.7.

### 3.3. E20.7.5 — Integração da geração, snapshot e prova end-to-end

- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Objetivo: integrar resolver + complemento opcional ao workflow E19.4, versionar o snapshot e comprovar os caminhos funcionais sem redesenhar copy ou renderer.
- Limites: workload textual permanece `tools: []`; renderer e contrato visual permanecem vigentes; a única mudança de prompt é a separação das fontes consultivas.
- Processamento:
  - inserir pesquisa dinâmica opcional antes do texto dentro do budget total;
  - entregar Deep Research/suplemento validados ao workload textual;
  - materializar próxima versão de snapshot com proveniência integral do conhecimento;
  - preservar append-only, revalidação e cleanup do workflow atual.
- Critérios de aceite:
  - caso base-only gera revisão válida;
  - caso specialized-deep gera revisão válida preservando facts do taxon servido;
  - caso base+dynamic/material_delta gera revisão válida e snapshot reproduzível;
  - caso no_material_delta gera com base e registra a busca;
  - falha do complemento necessário não cria revisão nem asset órfão;
  - inequivalência E20.2 bloqueia especialização antes do provider;
  - revisões históricas continuam reproduzíveis;
  - observabilidade técnica cobre sucesso e falha do novo workload na profundidade suportada pelo boundary vigente;
  - smokes hospedados comprovam que a geração continua fail-closed e que nenhuma nova superfície de usuário foi criada por consequência.

### 3.4. Próxima ação após a v1

- O Gate 8 encerra o debate pré-v1 e não inicia implementação.
- Conforme `docs/prompt-estrategista.md` v35, a atualização de planejamento do `docs/roadmap.md` pertence ao Executor/orquestrador no processo posterior, não é antecipada por esta consolidação.
- O humano deve escolher explicitamente:
  - **Opção 1 — Processo atual:** avaliação única da v1 por Analista, Gestor Estrutural, Gestor de Updates e Gestor de Automação; depois consolidação v2 e execução por fases.
  - **Opção 2 — Processo automatizado:** após autorização explícita de merge da v1, marcar o PR ready, mergear remotamente e entregar `Use $lp-factory-orquestrar-plano no PR #821.`

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não criar segunda taxonomia, `taxon de geração`, taxon por oferta, seleção de pesquisa persistida por LP ou nova entidade de identidade comercial.
- Não alterar a autoridade E20.2 sobre fatos nem permitir que pesquisa preencha facts do cliente.
- Não criar nova tabela/coluna de negócio, Storage, RAG, embeddings, vector database, crawler, cache global, service de busca, fila, cron ou job.
- Não adotar Agents SDK, agente, multiagente, handoff agentic ou persisted reasoning para resolver o fallback.
- Não pesquisar item por item em `multiple` ou `portfolio`.
- Não usar IA, sinônimos ou similaridade semântica para escolher taxon fonte no MVP.
- Não tornar suplemento dinâmico uma nova Deep Research E20.5 automaticamente.
- Não reescrever pesquisa, configuração, materialização ou snapshot histórico.
- Não redesenhar o prompt persuasivo, renderer, contrato visual, editor, publicação, analytics ou testes A/B nesta E20.7.
- Não criar cálculo ou persistência de custo concorrente com E21.4 nem ampliar o escopo financeiro reduzido da E21.4 para incluir o novo workload.

### 4.2. Critérios de parada

- Parar a implementação se E20.2 v6 não estiver publicada/operacional ou se sua forma final divergir materialmente do `landing_page_offering_scope` assumido nesta v1.
- Parar a especialização se taxon servido e fonte não puderem ser preparados para a mesma versão E20.2 efetiva ou se a equivalência factual conservadora falhar.
- Parar e replanejar se o match exato único por `business_taxons.name` no `single` se mostrar insuficiente para um caso real relevante; não introduzir roteamento semântico por conveniência.
- Parar o complemento quando Web Search não for efetivamente executado, não produzir fontes utilizáveis ou exceder os limites aprovados; não degradar silenciosamente.
- Parar e reavaliar a residência repo-only somente quando existir evidência medida de impacto operacional material em bundle/build/deploy ou versionamento; não migrar por antecipação.
- Parar diante de necessidade de nova tabela, rota, service, job, agente, engine ou infraestrutura não prevista; devolver o conflito ao Estrategista/humano antes de ampliar o escopo.