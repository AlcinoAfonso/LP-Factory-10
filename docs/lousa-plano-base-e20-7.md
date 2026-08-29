# 29/08/2026 — Plano-base v2 — E20.7 — Liberação taxonômica para geração de Landing Pages

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: **plano-base v2 consolidado** após os pareceres Estrutural, de Updates e de Automações; depende da aprovação formal do Analista e não constitui autorização de merge.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte: `E20.7 — Liberação taxonômica para geração de Landing Pages`.
- Objetivo: resolver a fonte de conhecimento de mercado mais específica e segura para o escopo comercial de uma LP, sem transformar oferta em nova autoridade taxonômica, sem enfraquecer a autoridade factual E20.2, sem tornar a E20 uma segunda orquestradora da geração e sem bloquear o cliente por ausência de correspondência taxonômica perfeita.
- Plano conceitual: N/A.
- Decisão funcional: **Opção A — Deep Research preferencial por nicho ou especialização relevante, com complemento dinâmico controlado quando não existir Deep Research especializada elegível**.
- O taxon primário da conta permanece a identidade taxonômica estável do negócio.
- A fonte de conhecimento resolvida pela E20.7 é um resultado derivado e consultivo; não é segunda taxonomia, identidade da LP, field E20.2 ou seleção persistida por LP.
- O escopo comercial da LP é fornecido por `landing_page_offering_scope`, cuja autoridade pertence à E20.2.9/E19.5; a E20.7 apenas o consome para resolver conhecimento.
- O PR #830/E20.2.9.2 foi incorporado à `main` pelo merge commit `b89ecaaaa0116b9d9c82bb0af65fcd3744ac2787`; o registry repo-only contém v1–v6 e `CURRENT=6`. A implementação da E20.7 preserva como gate fail-closed a confirmação de que a v6 foi reconciliada e está operacionalmente consumível pelos boundaries vigentes antes de qualquer prova hospedada ou ativação.
- Ausência, ambiguidade ou falha de correspondência entre oferta e taxon **não invalida a oferta do cliente** e não autoriza recusa semântica neste recorte.

### 1.2. Fronteira arquitetural obrigatória

- **E20.5** seleciona, versiona e disponibiliza a Deep Research autorizada por taxon.
- **E20.6** avalia suficiência factual da E20.2 e deriva a preparação do taxon.
- **E20.7** resolve qual conhecimento autorizado usar e, quando necessário, produz um complemento dinâmico consultivo.
- **E19.3** permanece o boundary responsável por compor o pacote autorizado `identities + modelContext + serverContext` consumido pela geração.
- **E19.4** permanece responsável por geração textual, imagem, validações, revisão, snapshot, materialização e preview.
- A E20.7 termina em uma **saída tipada de conhecimento resolvido**, suficiente para consumo futuro pela E19.3.
- Alterar `generationContext`, workflow E19.4, snapshot, materialização, renderer ou prompt persuasivo não pertence à implementação da E20.7.
- A integração downstream com E19 deve ser planejada em recorte próprio depois de a saída E20.7 estar definida e aprovada; não executar essa integração silenciosamente dentro da E20.7.
- A implementação da E20.7 reside em `lib/conversion-content/landing-page/knowledge-resolution/`. Esse boundary possui contratos imutáveis, resolver puro, equivalência factual, prompt/schema funcional e composição da saída tipada. Acesso a Supabase e transporte OpenAI permanecem em adapters server-only de `lib/conversion-content/adapters/`.
- A API da E20.7 é exportada pelo `index.ts` do próprio boundary e pela API pública de `lib/conversion-content/index.ts`. Consumidores não importam registry, schema ou arquivo interno de E20.2, E20.5, E20.6 ou `lib/openai-workloads`; a E20.7 não cria arquivo em `app/`, `lib/lp-builder/`, renderer, workflow ou materialização.

### 1.3. Evidência que sustenta a decisão

- Gate 1: contrato da nova Deep Research definido como inteligência reutilizável de mercado e comportamento, não blueprint de LP.
- Gate 2: `docs/prompt-nicho-pesquisa-mercado-experimental.md` consolidado para produzir pesquisa sem wireframe, copy, CTA ou SEO prescritivo.
- Gate 3: `corretor-imoveis/end_customer/v2` aprovado e arquivado pelo PR #827, preservando a v1.
- Gate 4: revisão 6 gerada com pesquisa v2 contra revisão 5 com v1, mantendo E20.2 v5, contexto factual, prompt textual e contratos de geração comparáveis.
- Gate 5: resultado positivo parcial; a v2 melhorou materialmente objetivo comercial, adequação ao momento do público, progressão narrativa, unidade de mensagem, conversão coerente e especificidade, sem regressão factual observada.
- Gate 5: entrada textual passou de `9.150` para `18.306` tokens; latência textual caiu de `51.381 ms` para `42.758 ms`; custo permaneceu indisponível no snapshot e uma geração por variante não comprova estabilidade universal.
- Gate 6: complemento dinâmico definido como etapa separada da copy, com Responses API + Web Search hospedado, até duas execuções de busca e falha fechada quando o complemento necessário não puder ser comprovado.
- Gate 7: confirmado que o MVP não precisa de nova tabela/coluna de negócio, seleção persistida de pesquisa por LP, Storage, RAG, agente ou segunda residência para a Deep Research.
- Revisão arquitetural de 28/08/2026: geração e materialização permanecem sob E19; a E20.7 foi reduzida à preparação e resolução de conhecimento.
- Revisão de churn de 28/08/2026: o matcher determinístico já existente trabalha com nome e aliases; não reproduzir uma regra mais estreita baseada apenas em `business_taxons.name`.

### 1.4. Fontes do projeto

- `README.md` — visão do produto, simplicidade proporcional e menor complexidade capaz de cumprir os gates.
- `docs/prompt-estrategista.md` v35 — processo de consolidação da v1 e escolha posterior do processo.
- `docs/template-roadmap.md` — hierarquia e numeração das fases executáveis.
- `docs/gestor-automations.md` — classificação da automação com IA em fluxo controlado.
- `docs/lousa-plano-base-e20-2.md` e `docs/lousa-plano-base-e20-2-8.md` — catálogo factual, lifecycle e versão efetiva.
- `docs/lousa-plano-base-e20-2-9.md`, PR #826 e PR #830 — `landing_page_offering_scope`, compatibilidade v5→v6 e estado de publicação.
- `docs/lousa-plano-base-e20-5.md` — seleção humana e leitura integral da Deep Research por taxon.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual e predicado derivado de taxon preparado.
- `docs/lousa-plano-base-e19-3.md` e `lib/lp-builder/generationContext.ts` — autoridade da E19.3 sobre o pacote autorizado para geração.
- `docs/lousa-plano-base-e19-4.md` — autoridade da E19.4 sobre geração, revisão, snapshot, materialização e preview.
- `docs/lousa-plano-base-e19-5.md` — configuração compartilhada/específica da LP e autoridade operacional pós-handoff.
- `lib/onboarding/niche-resolution/adapters/taxonMatchAdapter.ts` e a RPC existente `match_business_taxons_deterministic` — autoridade determinística atual de matching por nome e aliases, com `matchedAliases` e `matchSource`.
- `lib/openai-workloads/registry.ts` — governança dos workloads OpenAI de produto.
- `docs/lousa-plano-base-e21-4.md`, PR #824 e PR #831 — autoridade financeira e MVP reduzido de custos OpenAI.
- `lib/conversion-content/landing-page/taxon-preparation/research.ts` e `next.config.js` — loader repo-only e tracing atual da biblioteca.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` e `v2.md` — baseline e piloto comparável.

### 1.5. Contrato da Deep Research

- Deep Research é conhecimento consultivo de mercado e comportamento do público, produzido fora do caminho interativo de geração e reutilizável entre LPs compatíveis.
- Deve cobrir, conforme aplicável: mercado/categoria, públicos e situações, jobs-to-be-done, dores, desejos, medos e riscos, objeções, critérios e trade-offs, alternativas, jornada, confiança/prova, linguagem/perguntas, padrões de mensagem, dimensões factuais variáveis, contexto regulatório/geográfico, sinais temporais, lacunas e fontes.
- Afirmações materiais distinguem evidência, inferência e hipótese; conhecimento temporal distingue estrutural, semiestável e volátil quando relevante.
- Pesquisa especializada deve ser autossuficiente no próprio escopo; quando usada, não existe obrigação de enviar também a pesquisa ancestral.
- Ficam fora da Deep Research: wireframe, ordem/quantidade de seções, módulos, layout, headline, copy, CTA pronto, on-page SEO prescritivo, fatos concretos do cliente, criação de fields E20.2 e decisões de infraestrutura.
- A biblioteca permanece no MVP em `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`, com seleção humana E20.5 e conteúdo integral.
- A residência repo-only será reavaliada somente diante de impacto medido em bundle/build/deploy ou operação de versionamento; não migrar preventivamente.

### 1.6. Autoridade factual, matching e equivalência entre taxons

- Fatos concretos da conta/LP permanecem exclusivamente sob E20.2/E19.5 e seus consumidores autorizados.
- Deep Research especializada ou complemento dinâmico nunca autoriza preço, disponibilidade, localização concreta, credencial, prova social, condição comercial ou outro fato objetivo do cliente.
- A correspondência determinística da oferta reaproveita a autoridade já existente de **nome canônico + aliases**, com normalização vigente e filtro posterior para descendentes ativos do taxon servido.
- Não criar segundo registry, segundo conjunto de aliases ou matcher paralelo dentro da E20.7.
- A E20.7 consome exclusivamente a API pública de `lib/onboarding/niche-resolution/`. A consulta canônica distingue tipadamente sucesso com candidatos de falha operacional; erro de RPC, resposta inválida ou exceção falha tecnicamente a resolução e nunca é convertido em ausência legítima de match ou `dynamic_required`.
- A elegibilidade reutiliza a política canônica de confiança do boundary: aceita apenas a decisão determinística de alta confiança já autorizada ou a classificação canônica de alias exato/normalizado de alta confiança, sempre depois do filtro de descendente ativo e unicidade. Qualquer outra confiança ou fonte não seleciona pesquisa especializada. A classificação de alias hoje local à action deve ser movida para o boundary e seu consumidor vigente deve usar a mesma operação, sem thresholds ou chamada RPC paralelos.
- A aplicação de `supa#51` neste recorte limita-se a validar e preservar o matching existente: a E20.7 reutiliza o adapter/RPC canônicos e não cria nem altera `pg_trgm`, FTS, índices, scores ou thresholds de matching. Se o boundary existente não puder ser reutilizado, aplica-se o critério de parada da seção 4.2 antes de qualquer lógica paralela.
- A aplicação de `supa#52` neste recorte limita-se a preservar a normalização derivada já canônica: a E20.7 não cria nem altera generated column, função de normalização, slug ou chave auxiliar derivada, nem normalizador TypeScript próprio para a oferta; toda correspondência usa a normalização encapsulada pelo matcher vigente.
- Ausência ou ambiguidade de match por nome/alias significa apenas que nenhuma Deep Research descendente foi localizada de forma determinística; não significa oferta inválida.
- Antes de reutilizar Deep Research de taxon descendente, taxon servido e taxon fonte precisam estar preparados para a mesma versão E20.2 efetiva.
- Seus contratos factuais resolvidos devem ser funcionalmente equivalentes de forma conservadora nos planos suportados, ignorando somente identidade/proveniência taxonômica que naturalmente diferem.
- Diferença material em field, finalidade, tipo, scope, obrigação, condição ou validação bloqueia **somente o uso da Deep Research descendente**; não invalida a oferta nem bloqueia a LP por si só.
- Quando a especialização for bloqueada por inequivalência factual, o resolver retorna à Deep Research-base e requer complemento dinâmico consultivo; esse complemento não pode inventar os facts faltantes.
- Necessidade factual concreta continua sendo decidida pelos contratos E20.2/E19 competentes; a E20.7 não antecipa bloqueio abstrato apenas porque dois catálogos diferem.
- Essa comparação é determinística e própria do resolver E20.7/E20.2; não reutiliza `compatible_evolution` da E20.2.8 e não amplia a IA da E20.6.

### 1.7. Automação aprovada

- A resolução taxonômica/factual da fonte é determinística e não usa IA.
- O complemento dinâmico, quando acionado, é **Automação: sim**.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal: `2.2.1 — Runtime do LP Factory`.
- Plataforma dependente: OpenAI Platform / Responses API com Web Search hospedado.
- Objetivo: obter somente o delta de conhecimento material ausente na Deep Research-base para o escopo comercial daquela LP.
- Limites: até duas execuções de Web Search, `store:false`, sub-timeout máximo de 45 s, fontes preservadas, sem retry automático, fallback de modelo/tool, agente, Agents SDK, job, fila, crawler, RAG ou cache global.
- Participação humana: nenhuma intervenção durante a resolução; o gatilho e a aprovação da revisão continuam sob os fluxos E19 competentes.
- Avaliação formal de Automação na v2: **parecer produzido, incorporado e auditado; revisão delta do Analista pendente**.
- A E20.7.4 é uma automação com IA em fluxo controlado, executada server-side no Runtime do LP Factory. Todo matching, elegibilidade, equivalência factual, gating, validação, contagem de tools e fallback permanecem determinísticos. A única função da IA é pesquisar e estruturar o delta consultivo.
- O fluxo usa uma única requisição foreground à Responses API com somente `web_search`; agente, Agents SDK, multiagente, Programmatic Tool Calling, persisted reasoning, modo Pro, job, fila, crawler, RAG, cache global, retry e fallback automático são proibidos.
- A configuração inicial não é herdada de outro workload. A v2 autoriza uma comparação focal representativa de `gpt-5.4-mini + low`, `gpt-5.6-luna + low|medium` e `gpt-5.6-terra + low|medium`, cada qual com `search_context_size = low|medium`, para selecionar antes da ativação a menor configuração que cumpra qualidade, grounding, latência de até 45 s e custo proporcional. A comparação e a decisão resultante devem ser reconciliadas em `docs/openai-model-snapshot.md` pela ABC competente. Sol, modo Pro, modelos Deep Research e comportamento agentic ficam fora sem nova evidência e novo recorte.
- Depois da comparação, `search_context_size` torna-se propriedade tipada, imutável e code-owned da definição específica desse workload no registry E21.1. O lifecycle E21.2 continua governando dinamicamente somente `modelo + reasoning_effort`; não criar coluna, variável ou configuração paralela para search context. O resolver compõe explicitamente a configuração operacional E21.2 com a propriedade E21.1.

### 1.8. Validação semântica futura

- A IA não decide neste recorte se uma oferta sem match determinístico pertence ou não ao nicho da conta.
- A validação semântica de compatibilidade entre taxon e oferta fica para recorte posterior próprio.
- Nesse recorte futuro, a regra de produto deverá ser conservadora:
  - oferta relacionada ou plausível → aceitar;
  - resultado ambíguo → não bloquear;
  - incompatibilidade clara, como `Odontologia` + `Pintura automotiva` → recusar com orientação ao cliente.
- Até essa evolução existir, a E20.7 não recusa oferta apenas por falta de alias, plural, variação linguística ou ausência de taxon correspondente.
- O registro desta evolução não autoriza agora novo workload, prompt, tabela, rota, UX ou regra de recusa.

### 1.9. Relação com E21

- O novo workload de pesquisa dinâmica segue lifecycle, configuração e observabilidade técnica da E21.2.
- Registrar o workload `landing_page_dynamic_market_research`, classificação `product_runtime`, consumidor `E20.7.4`, fallback `falhar a resolução técnica sem invalidar a oferta` e apresentação administrativa própria no boundary público E21.1.
- Development usa baseline explícita do registry. Preview e Production exigem revisão operacional provada, promovida e humanamente ativada no lifecycle E21.2, sem fallback para `repo_catalog`, variável de modelo ou configuração paralela. Reutilizar `OPENAI_API_KEY`; não criar secret específico.
- A E21.4 reduzida não é pré-requisito para ativar esse workload.
- A atribuição financeira permanece causal e exclusiva da E21.4: execução de LP real correlacionada a conta contratada pode ser `Cliente/conta`; Preview, QA ou prova de produto é `LP Factory`; correlação insuficiente é `Não atribuído/reconciliação`. A E20.7 preserva somente correlação técnica segura e não calcula nem persiste custo ou categoria financeira.

### 1.10. Dependências de execução

- E20.2 v6 está materializada no registry repo-only e marcada como `CURRENT=6`; sua reconciliação e consumibilidade operacional pelos boundaries vigentes precisam ser comprovadas antes de prova hospedada ou ativação da E20.7.
- O taxon servido precisa possuir E20.5 válida e E20.6 compatível com a versão E20.2 efetiva requerida.
- Taxon descendente candidato a fonte especializada precisa estar ativo, possuir E20.5/E20.6 válidas para a mesma versão efetiva e passar pela equivalência factual da seção 1.6.
- O lifecycle E21.2 precisa admitir o novo workload de pesquisa dinâmica antes de sua ativação.
- A admissão do workload em Preview e Production exige migration forward-only, sem nova tabela ou coluna, que amplie as allowlists e constraints das três tabelas E21.2, ajuste as validações das RPCs `save_openai_workload_configuration_candidate_v1` e `promote_openai_workload_configuration_candidate_v1` e crie idempotentemente revisão bootstrap, configuração ativa e evento bootstrap para os dois ambientes, preservando assinaturas e grants.
- A transição do read model administrativo aceita o conjunto aplicado anterior de dez unidades e o conjunto novo de doze unidades, nunca cardinalidade parcial. O runtime falha fechado enquanto não existir exatamente uma configuração e revisão ativa válidas para o novo workload.
- A migration preserva RLS habilitado e ausência de policies nas três tabelas; `public`, `anon`, `authenticated` e `ai_readonly` permanecem sem grants; `service_role` mantém apenas os grants já necessários; RPCs permanecem `SECURITY INVOKER`, com `search_path` fixado e execução exclusiva por `service_role`. `docs/schema.md`, testes SQL, snippet read-only e casos focais de `lib/openai-workloads/` integram o mesmo recorte.

## 2. Contrato do caso

### 2.1. Gatilho e entrada

- Gatilho: solicitação server-side explícita de resolução de conhecimento para uma LP autorizada, originada por consumidor E19 competente.
- Entrada autoritativa:
  - taxon servido e cadeia canônica;
  - versão E20.2 efetiva;
  - preparação E20.5/E20.6;
  - `landing_page_offering_scope` e descrição do escopo;
  - `funnel_stage`, `transaction_intent` e geografia factual somente quando materialmente úteis à pesquisa dinâmica.
- `business_offerings_summary`, nome da LP e texto livre não são autoridade taxonômica nem whitelist de ofertas.
- Secrets, destinos privados, IDs desnecessários e contexto operacional bruto não são enviados à pesquisa dinâmica.

### 2.2. Resolução determinística da fonte

- O resolver opera server-side e não persiste uma seleção de pesquisa na LP.
- A cadeia taxonômica completa é lida por uma única operação server-only compartilhada em `lib/conversion-content/adapters/`, com paginação integral, ordenação determinística, validação tipada de todas as identidades e construção pela função canônica de cadeia. Essa operação substitui as leituras privadas equivalentes de `selectedEndCustomerResearchAdapter.ts` e `inputCatalogEvaluationContextAdapter.ts` e é reutilizada pela E20.7; não criar terceira paginação de `business_taxons`.
- `mode = single`:
  - validar somente o shape factual de `offering_scope`; conteúdo livre não é rejeitado por falta de correspondência taxonômica;
  - reaproveitar o matcher determinístico existente, incluindo nome canônico e aliases, sem criar lógica paralela;
  - limitar os candidatos retornados aos descendentes ativos do taxon servido;
  - aceitar especialização somente quando houver um único candidato descendente determinístico e elegível;
  - preservar `matchSource` e `matchedAliases` como proveniência da resolução;
  - exigir preparação e equivalência factual antes de usar a Deep Research descendente;
  - se passar, usar a Deep Research descendente como `specialized_deep`;
  - se não houver candidato único/elegível, se o match for ambíguo ou se a equivalência factual falhar, usar a Deep Research do taxon servido como base e requerer complemento dinâmico;
  - nenhuma dessas situações invalida a oferta ou produz recusa semântica neste recorte.
- `mode = multiple`:
  - usar a Deep Research do taxon servido como base;
  - executar um único complemento dinâmico sobre o conjunto inteiro de ofertas;
  - não usar classificador prévio para decidir se a pesquisa será necessária;
  - nunca selecionar Deep Research ou disparar pesquisa separada por item.
- `mode = portfolio`:
  - usar somente a Deep Research do taxon servido;
  - não pesquisar individualmente cada item do portfólio.
- O match determinístico localiza uma fonte candidata de conhecimento; não reclassifica a conta, não altera o taxon servido e não cria autoridade taxonômica nova.

### 2.3. Complemento dinâmico

- Quando requerido, ocorre em workload próprio e separado da geração de copy.
- Quando `dynamic_required`, executar exatamente uma requisição foreground à Responses API com `store:false`, sem `conversation`, `previous_response_id` ou background; declarar somente `tools:[{type:"web_search", external_web_access:true, search_context_size:<valor code-owned aprovado para o workload>}]`, `tool_choice:"required"`, `max_tool_calls:2`, `include:["web_search_call.action.sources"]`, `max_output_tokens` explícito, `safety_identifier` estável e sem PII e Structured Output com JSON Schema estrito. Modelo e reasoning effort vêm da configuração operacional E21.2; search context size vem da definição imutável E21.1.
- O adapter funcional reutiliza `requestOpenAiResponses` como único transporte Responses API, com configuração resolvida pela API pública de `lib/openai-workloads/`, timeout máximo de 45 s e sinal de cancelamento. Não criar segundo fetch para `/v1/responses`, cliente OpenAI paralelo, retry ou fallback.
- Entrada mínima: Deep Research-base autorizada, escopo/descrição das ofertas, taxon servido e os contextos factuais estritamente necessários.
- Pesquisa somente o delta que pode alterar a interpretação do público: situações/jobs, dores/riscos, objeções, critérios/trade-offs, alternativas, confiança/prova, linguagem/perguntas e aspectos atuais/voláteis relevantes.
- Não produzir wireframe, seções, CTA, copy, layout, fato concreto do cliente ou contrato E20.2.
- Não classificar neste recorte a oferta como compatível ou incompatível com o nicho para finalidade de recusa.
- O Web Search deve efetivamente ser usado; resposta de memória não substitui a pesquisa quando o complemento foi requerido.
- Limite inicial: até duas execuções do recurso Web Search; cada execução pode consultar múltiplas fontes.
- O parser conta os itens reais `web_search_call` do payload e aceita somente uma ou duas chamadas concluídas. Fontes são derivadas de `web_search_call.action.sources`; URL ou contagem declarada pelo modelo não é autoridade, e toda referência do suplemento deve corresponder a fonte retornada pelo provider.
- Resultado mínimo: `material_delta | no_material_delta | insufficient_evidence`.
- `material_delta`: devolver base + suplemento como proveniências consultivas distintas.
- `no_material_delta`: devolver somente a base e registrar que a busca foi executada sem diferença material sustentada.
- `insufficient_evidence`, timeout, refusal, erro de provider, resposta inválida ou ausência de fontes utilizáveis: falhar a resolução técnica, sem marcar a oferta do cliente como inválida.
- Zero chamada, mais de duas chamadas, chamada incompleta, fonte ausente ou inutilizável ou referência fora do conjunto retornado produz `insufficient_evidence` e falha técnica.
- O schema versionado discrimina os três status. `material_delta` exige suplemento não vazio e evidências válidas; `no_material_delta` proíbe suplemento e registra que a busca ocorreu; `insufficient_evidence` nunca produz saída de sucesso. Autorização, taxonomia, equivalência factual, fatos concretos do cliente e recusa não são delegados ao prompt nem inferidos de schema válido.
- Entrada de usuário, pesquisa-base e conteúdo web são dados não confiáveis e não podem substituir as instructions do workload. Enviar somente campos allowlisted, sem secret, contato privado, ID desnecessário, PHI ou contexto operacional bruto. `store:false` é obrigatório, mas não é documentado como ZDR.
- O suplemento não vira automaticamente ativo E20.5; repetição recorrente pode apenas gerar evidência para futura decisão humana de criar Deep Research especializada.

### 2.4. Saída tipada da E20.7

- A saída de sucesso distingue:
  - `specialized_deep` — Deep Research de descendente equivalente;
  - `base_only` — Deep Research do taxon servido, inclusive após `no_material_delta`;
  - `base_plus_dynamic` — Deep Research-base + suplemento material.
- A saída preserva no mínimo:
  - taxon servido e versão E20.2 efetiva;
  - modo de resolução;
  - taxon fonte, audience scope, versão e conteúdo integral da Deep Research usada;
  - fonte do match determinístico, aliases correspondentes e motivo de fallback, quando aplicáveis;
  - alvo do complemento, quando executado;
  - status, conteúdo material, fontes e data da busca dinâmica;
  - workload/revisão, response ID, usage, latência e quantidade de Web Search runs, quando disponíveis.
- A saída não contém facts concretos adicionais, destino de conversão, secret, contato privado ou contexto operacional bruto.
- Contagens e fontes da saída são derivadas exclusivamente do payload real do provider; referências não comprovadas falham fechado.
- A saída é o único handoff funcional da E20.7 para a futura evolução da E19.3.
- A E20.7 não define o shape final de `generationContext`, snapshot ou materialização; esses contratos pertencem aos recortes E19 competentes.

### 2.5. Validação, persistência e consumo

- Shape inválido de `landing_page_offering_scope`, taxon servido inválido, versão incompatível, pesquisa-base ausente ou falha de preparação continuam fail-closed.
- Ausência/ambiguidade de match por nome/alias e inequivalência factual de descendente não invalidam a oferta; apenas impedem o uso da Deep Research especializada.
- A E20.7 não cria tabela, coluna, seleção persistida por LP, cache global ou nova residência de negócio.
- A E20.7 não persiste revisão, snapshot ou materialização.
- Proveniência necessária à reprodução de uma futura revisão deve viajar na saída tipada e ser congelada pelo consumidor E19 competente em recorte próprio.
- Evidência técnica do workload segue E21.2; custo financeiro permanece sob E21.4 conforme a seção 1.9.
- A telemetria reutiliza o evento comum E21.1 e registra apenas metadados seguros: workload, ambiente, configuração/origem/revisão, modelo, effort, versões de prompt e contrato, IDs de correlação, status, latência, usage normalizada e quantidades reais de `web_search_call` e fontes utilizáveis. Prompt, resposta integral, conteúdo pesquisado, URLs, Deep Research, oferta, suplemento, PII e secrets não entram em logs.
- O consumo operacional da saída pela geração só pode começar após planejamento e implementação próprios em E19.3/E19.4.

### 2.6. Fallback e experiência do usuário

- Ausência da própria Deep Research-base selecionada continua sendo falha de preparação E20.5; pesquisa dinâmica não substitui E20.5.
- Falha de equivalência factual não autoriza pesquisa dinâmica a suprir facts do descendente, mas também não invalida automaticamente a oferta cadastrada.
- Nenhuma falha altera automaticamente seleção E20.5, revisão E20.6, taxon da conta, escopo comercial ou configuração da LP.
- A E20.7 não cria superfície de usuário.
- O cliente continua informando `O que esta landing page vai divulgar?` pelo contrato E20.2.9 e acionando a geração nos fluxos E19; a resolução de conhecimento permanece interna.
- Mensagens de erro técnico não podem afirmar que a oferta é incompatível com o nicho sem a futura validação semântica autorizada.

## 3. Fases e próxima ação

### 3.1. E20.7.3 — Resolver determinístico de conhecimento

- Automação: não.
- Objetivo: implementar a resolução `single | multiple | portfolio`, reutilizar matching por nome/aliases, avaliar elegibilidade da Deep Research especializada, aplicar equivalência factual E20.2 e produzir a saída tipada de conhecimento resolvido.
- Dependência de início: E20.2 v6 materializada como `CURRENT=6` e confirmada como reconciliada e operacionalmente autorizada pelos boundaries vigentes.
- Processamento:
  - reutilizar E20.5/E20.6, o resolver E20.2 e a autoridade determinística existente de matching por nome/aliases;
  - materializar o boundary público `lib/conversion-content/landing-page/knowledge-resolution/`, mantendo Supabase em adapter server-only e sem imports de arquivos internos dos boundaries consumidores;
  - tornar a API pública de niche resolution tipada para separar candidatos de falha operacional e mover a classificação canônica de alias para o boundary compartilhado;
  - consolidar a leitura paginada da cadeia taxonômica em uma única operação server-only compartilhada, substituindo as duas leituras privadas existentes;
  - filtrar candidatos para descendentes ativos do taxon servido;
  - aplicar preparação + equivalência conservadora somente ao candidato único elegível;
  - decidir `specialized_deep | base_only | dynamic_required`;
  - devolver contrato imutável, sem persistência própria e sem alterar E19.
- Critérios de aceite:
  - nome canônico e alias válido podem localizar o mesmo descendente;
  - `matchedAliases` e `matchSource` são preservados na proveniência;
  - ausência ou ambiguidade de match não rejeita a oferta e produz `dynamic_required` em `single`;
  - erro de RPC, resposta inválida ou exceção falha tecnicamente e não produz `dynamic_required`;
  - match fraco, ambíguo ou fora da confiança canônica não escolhe `specialized_deep`;
  - descendente inequivalente não rejeita a oferta; apenas bloqueia a pesquisa especializada e produz `dynamic_required`;
  - conteúdo estruturalmente inválido do `offering_scope` continua falhando fechado;
  - `multiple` requer um único complemento sobre o conjunto e `portfolio` não requer complemento;
  - nenhuma IA é chamada para validação semântica nesta fase;
  - nenhuma mudança em `generationContext`, workflow, snapshot, materialização ou renderer;
  - nenhum registry de aliases, tabela, coluna ou residência adicional é criado.
  - paginação acima de 500 registros preserva completude, ordenação determinística e término canônico `416/PGRST103`; erro parcial, identidade inválida, taxon ausente/inativo, cadeia quebrada e descendência transitiva falham de forma tipada;
  - os consumidores E20.5 e E20.6 preservam seus contratos públicos e casos de taxon ausente/inativo, seleção válida/inválida e preparação por versão depois da substituição das leituras privadas;
  - variações de caixa, acentuação e espaços exercitam exclusivamente o normalizador canônico de nome/aliases, sem normalização local E20.7.

### 3.2. E20.7.4 — Complemento dinâmico controlado

- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Objetivo: implementar o workload de pesquisa dinâmica e completar a saída tipada da E20.7 sem assumir a responsabilidade da geração ou recusar semanticamente a oferta.
- Limites: Responses API + Web Search hospedado, até duas execuções de busca, `store:false`, sub-timeout máximo de 45 s, fontes obrigatórias, sem retry/fallback silencioso, agente, Agents SDK, job, fila, crawler, RAG ou cache global.
- Solução: uma única requisição foreground, Structured Output estrito, somente `web_search`, `tool_choice:"required"`, `max_tool_calls:2`, fontes incluídas pelo provider e parser determinístico fail-closed.
- Avaliação formal de Automação na v2: parecer incorporado e auditado, sujeito à revisão delta do Analista.
- Dependências:
  - lifecycle E21.2 capaz de governar o novo workload `product_runtime`;
  - E20.7.3 concluída e saída `dynamic_required` disponível.
- Processamento:
  - criar prompt de runtime focado apenas no delta consultivo, conforme `docs/template-prompts.md` e `docs/template-prompts-gpt-5-6.md`, separando `instructions` do input tipado, sem reusable prompt object, com versão próxima ao consumidor e casos típicos, limítrofes e adversariais;
  - integrar `landing_page_dynamic_market_research` ao registry, resolver, apresentação e lifecycle operacional E21.1/E21.2, com migration forward-only e transição de cardinalidade compatível;
  - comparar focalmente as configurações candidatas autorizadas e congelar modelo, effort e search context size aprovados antes da ativação;
  - reutilizar `requestOpenAiResponses` e o evento comum E21.1, sem transporte ou telemetria paralelos;
  - produzir `material_delta | no_material_delta | insufficient_evidence`;
  - anexar fontes e metadados seguros à saída tipada;
  - preservar observabilidade técnica sob E21.2 e atribuição financeira sob E21.4;
  - executar ABCs independentes para `docs/automations.md`, `docs/platform-config.md`, `docs/base-tecnica.md`, `docs/schema.md` e `docs/openai-model-snapshot.md`, aplicando somente os deltas literais emitidos.
- Critérios de aceite:
  - pesquisa requerida usa Web Search de fato e preserva fontes;
  - request serializado comprova uma única tool, uma ou duas chamadas, ausência de estado conversacional, `store:false`, limite de saída, safety identifier sem PII, `modelo + reasoning_effort` vindos do lifecycle E21.2 e `search_context_size` vindo do registry E21.1;
  - campos e limites exatos do Web Search são reconfirmados na documentação oficial vigente e na prova focal antes da ativação, sem converter indisponibilidade externa em decisão humana;
  - o orçamento valida integralmente pesquisa-base, input allowlisted, contexto de busca e saída esperada contra o limite do modelo; excesso falha antes do transporte, sem truncamento silencioso;
  - fixtures de zero a três chamadas, fonte ausente, URL inventada, status inconsistente e prompt injection aprovam somente respostas integralmente fundamentadas dentro do contrato;
  - `material_delta` produz suplemento consultivo utilizável;
  - `no_material_delta` retorna base-only com proveniência explícita;
  - erro/timeout/refusal/evidência insuficiente falha a resolução técnica sem invalidar semanticamente a oferta;
  - cancelamento, timeout, refusal, erro HTTP/provider, resposta inválida e fonte ausente possuem casos focais no transporte reutilizado;
  - o workload não decide pertencimento do serviço ao nicho e não produz recusa por incompatibilidade;
  - nenhum prompt de copy, geração, imagem, revisão, snapshot ou materialização é alterado;
  - estado E21.2 anterior com dez unidades e estado novo com doze são aceitos, cardinalidade parcial falha e bootstrap Preview/Production é idempotente e íntegro;
  - migration não cria tabela/coluna, preserva constraints e assinaturas das RPCs, RLS sem policies públicas, grants restritos e runtime fail-closed antes do apply;
  - nenhuma persistência financeira ou de negócio paralela é criada;
  - sucesso e falhas emitem telemetria sanitizada e distinguível, sem prompt, resposta, fonte, conteúdo de negócio ou PII; custo continua sob E21.4.

### 3.3. Próxima ação e handoffs obrigatórios

- Após aprovação e implementação da E20.7, abrir planejamento próprio da evolução necessária em E19.3 para consumir a saída tipada.
- A evolução E19.3 deverá preservar sua responsabilidade exclusiva de compor o pacote autorizado para a E19.4.
- Qualquer mudança necessária em geração, snapshot ou materialização deverá permanecer sob E19.4 em recorte próprio.
- A validação semântica de oferta sem match determinístico deverá ser aberta em recorte posterior próprio, com IA apenas quando nome/aliases não resolverem e recusa limitada a incompatibilidade clara.
- A atualização de `docs/roadmap.md` ocorre somente depois da aprovação desta v2, pelo modo planejamento de `$lp-factory-abc`, seguida de revisão delta pelo mesmo Analista.
- O processo automatizado escolhido pelo humano usa esta branch e um único PR draft contra `main` para a v2, a reconciliação do roadmap e a implementação sequencial de E20.7.3 e E20.7.4, sem merge intermediário.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não criar segunda taxonomia, `taxon de geração`, taxon por oferta, seleção de pesquisa persistida por LP ou nova entidade de identidade comercial.
- Não alterar a autoridade E20.2 sobre fatos nem permitir que pesquisa preencha facts do cliente.
- Não alterar `generationContext`, pacote E19.3, workflow E19.4, prompt de copy, imagem, revisão, snapshot, materialização, preview ou renderer nesta E20.7.
- Não criar novo registry/tabela de aliases nem duplicar o matcher determinístico existente.
- Não rejeitar oferta apenas por ausência/ambiguidade de nome/alias, plural, variação linguística ou inexistência de taxon correspondente.
- Não bloquear a LP inteira apenas porque o catálogo E20.2 do descendente não é equivalente; bloquear somente a pesquisa especializada.
- Não implementar agora IA de validação semântica, regra de pertencimento ou UX de recusa.
- Não criar nova tabela/coluna de negócio, Storage, RAG, embeddings, vector database, crawler, cache global, service de busca, fila, cron ou job.
- Não adotar Agents SDK, agente, multiagente, handoff agentic ou persisted reasoning para resolver o complemento.
- Não pesquisar item por item em `multiple` ou `portfolio`.
- Não tornar suplemento dinâmico uma nova Deep Research E20.5 automaticamente.
- Não reescrever pesquisa, configuração, materialização ou snapshot histórico.
- Não redesenhar prompt persuasivo, contrato visual, editor, publicação, analytics ou testes A/B.
- Não criar cálculo ou persistência de custo concorrente com E21.4.

### 4.2. Critérios de parada

- Parar prova hospedada ou ativação se a E20.2 v6 não estiver reconciliada/operacional ou se sua forma final divergir materialmente do `landing_page_offering_scope` assumido neste plano.
- Parar o uso da Deep Research especializada se taxon servido e fonte não puderem ser preparados para a mesma versão E20.2 efetiva ou se a equivalência factual conservadora falhar; não transformar isso em recusa da oferta.
- Parar se a autoridade existente de aliases/matching não puder ser reutilizada sem duplicação ou sem atravessar um boundary inadequado; resolver a residência técnica na v2 antes de criar matcher paralelo.
- Parar se a implementação tentar adicionar IA semântica ou recusa de oferta neste recorte.
- Parar o complemento quando Web Search não for efetivamente executado, não produzir fontes utilizáveis ou exceder os limites aprovados; não degradar silenciosamente.
- Parar e reavaliar a residência repo-only somente quando existir evidência medida de impacto operacional material em bundle/build/deploy ou versionamento; não migrar por antecipação.
- Parar diante de necessidade de nova tabela, rota, service, job, agente, engine ou infraestrutura não prevista.
- A migration incremental estritamente necessária para admitir o workload nas tabelas e RPCs E21.2 é parte aprovada do recorte; qualquer nova tabela, coluna, policy, grant público ou mutação remota pré-merge continua proibida.
- Parar qualquer tentativa de integrar a saída à geração dentro da E20.7; devolver a necessidade ao planejamento E19 competente antes de alterar pacote, workflow, snapshot ou materialização.
