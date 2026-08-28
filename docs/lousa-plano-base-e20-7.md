# 28/08/2026 — Plano-base v1 ajustado — E20.7 — Liberação taxonômica para geração de Landing Pages

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: **plano-base v1 ajustado** após revisão arquitetural transversal; ainda não constitui autorização de implementação nem de merge.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte: `E20.7 — Liberação taxonômica para geração de Landing Pages`.
- Objetivo: resolver a fonte de conhecimento de mercado mais específica e segura para o escopo comercial de uma LP, sem transformar oferta em nova autoridade taxonômica, sem enfraquecer a autoridade factual E20.2 e sem tornar a E20 uma segunda orquestradora da geração.
- Plano conceitual: N/A.
- Decisão funcional: **Opção A — Deep Research preferencial por nicho ou especialização relevante, com complemento dinâmico controlado quando não existir Deep Research especializada elegível**.
- O taxon primário da conta permanece a identidade taxonômica estável do negócio.
- A fonte de conhecimento resolvida pela E20.7 é um resultado derivado e consultivo; não é segunda taxonomia, identidade da LP, field E20.2 ou seleção persistida por LP.
- O escopo comercial da LP é fornecido por `landing_page_offering_scope`, cuja autoridade pertence à E20.2.9/E19.5; a E20.7 apenas o consome para resolver conhecimento.
- O PR #830/E20.2.9.2 permanece pré-publicação no momento desta v1: `CURRENT=5`; a implementação da E20.7 depende da publicação e integração operacional da E20.2 v6.

### 1.2. Fronteira arquitetural obrigatória

- **E20.5** seleciona, versiona e disponibiliza a Deep Research autorizada por taxon.
- **E20.6** avalia suficiência factual da E20.2 e deriva a preparação do taxon.
- **E20.7** resolve qual conhecimento autorizado usar e, quando necessário, produz um complemento dinâmico consultivo.
- **E19.3** permanece o boundary responsável por compor o pacote autorizado `identities + modelContext + serverContext` consumido pela geração.
- **E19.4** permanece responsável por geração textual, imagem, validações, revisão, snapshot, materialização e preview.
- A E20.7 termina em uma **saída tipada de conhecimento resolvido**, suficiente para consumo futuro pela E19.3.
- Alterar `generationContext`, workflow E19.4, snapshot, materialização, renderer ou prompt persuasivo não pertence à implementação da E20.7.
- A integração downstream com E19 deve ser planejada em recorte próprio depois de a saída E20.7 estar definida e aprovada; não executar essa integração silenciosamente dentro da E20.7.

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

### 1.6. Autoridade factual e equivalência entre taxons

- Fatos concretos da conta/LP permanecem exclusivamente sob E20.2/E19.5 e seus consumidores autorizados.
- Deep Research especializada ou complemento dinâmico nunca autoriza preço, disponibilidade, localização concreta, credencial, prova social, condição comercial ou outro fato objetivo do cliente.
- Antes de reutilizar Deep Research de taxon descendente, taxon servido e taxon fonte precisam estar preparados para a mesma versão E20.2 efetiva.
- Seus contratos factuais resolvidos devem ser funcionalmente equivalentes de forma conservadora nos planos suportados, ignorando somente identidade/proveniência taxonômica que naturalmente diferem.
- Diferença material em field, finalidade, tipo, scope, obrigação, condição ou validação bloqueia a especialização no modelo atual.
- Essa comparação é determinística e própria do resolver E20.7/E20.2; não reutiliza `compatible_evolution` da E20.2.8 e não amplia a IA da E20.6.
- Um gap factual não pode ser contornado por Web Search; retorna ao fluxo E20.6 → E20.2 ou a planejamento estrutural competente.

### 1.7. Automação aprovada

- A resolução taxonômica/factual da fonte é determinística e não usa IA.
- O complemento dinâmico, quando acionado, é **Automação: sim**.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal: `2.2.1 — Runtime do LP Factory`.
- Plataforma dependente: OpenAI Platform / Responses API com Web Search hospedado.
- Objetivo: obter somente o delta de conhecimento material ausente na Deep Research-base para o escopo comercial daquela LP.
- Limites: até duas execuções de Web Search, `store:false`, sub-timeout máximo de 45 s, fontes preservadas, sem retry automático, fallback de modelo/tool, agente, Agents SDK, job, fila, crawler, RAG ou cache global.
- Participação humana: nenhuma intervenção durante a resolução; o gatilho e a aprovação da revisão continuam sob os fluxos E19 competentes.
- Avaliação formal de Automação na v2: **necessária**.

### 1.8. Relação com E21

- O novo workload de pesquisa dinâmica segue lifecycle, configuração e observabilidade técnica da E21.2.
- A E21.4 reduzida não é pré-requisito para ativar esse workload.
- Financeiramente, a pesquisa dinâmica permanece dentro do gasto oficial em `Outros gastos / reconciliação`; a E20.7 não cria cálculo ou persistência financeira própria nem amplia o MVP da E21.4.

### 1.9. Dependências de execução

- E20.2 v6 precisa estar publicada, atual e consumível pelos boundaries vigentes; o plano não assume conclusão antecipada do PR #830.
- O taxon servido precisa possuir E20.5 válida e E20.6 compatível com a versão E20.2 efetiva requerida.
- Taxon descendente candidato a fonte especializada precisa estar ativo, possuir E20.5/E20.6 válidas para a mesma versão efetiva e passar pela equivalência factual da seção 1.6.
- O lifecycle E21.2 precisa admitir o novo workload de pesquisa dinâmica antes de sua ativação.

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
- `mode = single`:
  - procurar somente match canônico exato e único entre a oferta informada e `business_taxons.name` de taxon descendente ativo;
  - comparar após `trim` e de forma case-insensitive, sem sinônimos, stemming, embeddings ou roteamento semântico;
  - o `slug` identifica o taxon apenas depois de encontrado o match;
  - se houver match único, exigir preparação e equivalência factual;
  - se passar, usar a Deep Research descendente como `specialized_deep`;
  - se o descendente conhecido falhar por diferença factual material, bloquear a especialização e devolver erro tipado; não contornar o gap com pesquisa dinâmica;
  - se não existir match canônico único/elegível, usar a Deep Research do taxon servido como base e requerer complemento dinâmico.
- `mode = multiple`:
  - usar a Deep Research do taxon servido como base;
  - executar um único complemento dinâmico sobre o conjunto inteiro de ofertas;
  - não usar classificador prévio para decidir se a pesquisa será necessária;
  - nunca selecionar Deep Research ou disparar pesquisa separada por item.
- `mode = portfolio`:
  - usar somente a Deep Research do taxon servido;
  - não pesquisar individualmente cada item do portfólio.
- O match textual localiza uma fonte candidata de conhecimento; não reclassifica a conta, não altera o taxon servido e não cria autoridade taxonômica nova.

### 2.3. Complemento dinâmico

- Quando requerido, ocorre em workload próprio e separado da geração de copy.
- Entrada mínima: Deep Research-base autorizada, escopo/descrição das ofertas, taxon servido e os contextos factuais estritamente necessários.
- Pesquisa somente o delta que pode alterar a interpretação do público: situações/jobs, dores/riscos, objeções, critérios/trade-offs, alternativas, confiança/prova, linguagem/perguntas e aspectos atuais/voláteis relevantes.
- Não produzir wireframe, seções, CTA, copy, layout, fato concreto do cliente ou contrato E20.2.
- O Web Search deve efetivamente ser usado; resposta de memória não substitui a pesquisa quando o complemento foi requerido.
- Limite inicial: até duas execuções do recurso Web Search; cada execução pode consultar múltiplas fontes.
- Resultado mínimo: `material_delta | no_material_delta | insufficient_evidence`.
- `material_delta`: devolver base + suplemento como proveniências consultivas distintas.
- `no_material_delta`: devolver somente a base e registrar que a busca foi executada sem diferença material sustentada.
- `insufficient_evidence`, timeout, refusal, erro de provider, resposta inválida ou ausência de fontes utilizáveis: falhar a resolução.
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
  - alvo do complemento, quando executado;
  - status, conteúdo material, fontes e data da busca dinâmica;
  - workload/revisão, response ID, usage, latência e quantidade de Web Search runs, quando disponíveis.
- A saída não contém facts concretos adicionais, destino de conversão, secret, contato privado ou contexto operacional bruto.
- A saída é o único handoff funcional da E20.7 para a futura evolução da E19.3.
- A E20.7 não define o shape final de `generationContext`, snapshot ou materialização; esses contratos pertencem aos recortes E19 competentes.

### 2.5. Validação, persistência e consumo

- Resolver, preparação e equivalência falham fechado diante de inconsistência de taxon, versão, pesquisa ou catálogo.
- A E20.7 não cria tabela, coluna, seleção persistida por LP, cache global ou nova residência de negócio.
- A E20.7 não persiste revisão, snapshot ou materialização.
- Proveniência necessária à reprodução de uma futura revisão deve viajar na saída tipada e ser congelada pelo consumidor E19 competente em recorte próprio.
- Evidência técnica do workload segue E21.2; custo financeiro permanece sob E21.4 conforme a seção 1.8.
- O consumo operacional da saída pela geração só pode começar após planejamento e implementação próprios em E19.3/E19.4.

### 2.6. Fallback e experiência do usuário

- Ausência da própria Deep Research-base selecionada continua sendo falha de preparação E20.5; pesquisa dinâmica não substitui E20.5.
- Falha de equivalência factual não autoriza pesquisa dinâmica a suprir facts do descendente.
- Nenhuma falha altera automaticamente seleção E20.5, revisão E20.6, taxon da conta, escopo comercial ou configuração da LP.
- A E20.7 não cria superfície de usuário.
- O cliente continua informando `O que esta landing page vai divulgar?` pelo contrato E20.2.9 e acionando a geração nos fluxos E19; a resolução de conhecimento permanece interna.

## 3. Fases e próxima ação

### 3.1. E20.7.3 — Resolver determinístico de conhecimento

- Automação: não.
- Objetivo: implementar a resolução `single | multiple | portfolio`, a elegibilidade da Deep Research especializada, a equivalência factual E20.2 e a saída tipada de conhecimento resolvido.
- Dependência de início: E20.2 v6 publicada e operacionalmente autorizada; não implementar contra `CURRENT=5` como contrato definitivo.
- Processamento:
  - reutilizar E20.5/E20.6 e o resolver E20.2 existentes;
  - localizar candidato descendente somente por match exato único do `single`;
  - aplicar preparação + equivalência conservadora;
  - decidir `specialized_deep | base_only | dynamic_required`;
  - devolver contrato imutável, sem persistência própria e sem alterar E19.
- Critérios de aceite:
  - base-only preserva o conhecimento do taxon servido;
  - descendente equivalente pode fornecer Deep Research sem alterar taxon servido ou facts;
  - descendente com diferença material é bloqueado;
  - ausência/ambiguidade de match não escolhe taxon por heurística;
  - `multiple` requer um único complemento sobre o conjunto e `portfolio` não requer complemento;
  - nenhuma mudança em `generationContext`, workflow, snapshot, materialização ou renderer;
  - nenhuma nova tabela, coluna ou residência.

### 3.2. E20.7.4 — Complemento dinâmico controlado

- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Objetivo: implementar o workload de pesquisa dinâmica e completar a saída tipada da E20.7 sem assumir a responsabilidade da geração.
- Limites: Responses API + Web Search hospedado, até duas execuções de busca, `store:false`, sub-timeout máximo de 45 s, fontes obrigatórias, sem retry/fallback silencioso, agente, Agents SDK, job, fila, crawler, RAG ou cache global.
- Avaliação formal de Automação na v2: necessária.
- Dependências:
  - lifecycle E21.2 capaz de governar o novo workload `product_runtime`;
  - E20.7.3 concluída e saída `dynamic_required` disponível.
- Processamento:
  - criar prompt de runtime focado apenas no delta consultivo;
  - produzir `material_delta | no_material_delta | insufficient_evidence`;
  - anexar fontes e metadados seguros à saída tipada;
  - preservar observabilidade técnica sob E21.2 e custo sob E21.4.
- Critérios de aceite:
  - pesquisa requerida usa Web Search de fato e preserva fontes;
  - `material_delta` produz suplemento consultivo utilizável;
  - `no_material_delta` retorna base-only com proveniência explícita;
  - erro/timeout/refusal/evidência insuficiente falha a resolução;
  - nenhum prompt de copy, geração, imagem, revisão, snapshot ou materialização é alterado;
  - nenhuma persistência financeira ou de negócio paralela é criada.

### 3.3. Próxima ação e handoff obrigatório

- Após aprovação e implementação da E20.7, abrir planejamento próprio da evolução necessária em E19.3 para consumir a saída tipada.
- A evolução E19.3 deverá preservar sua responsabilidade exclusiva de compor o pacote autorizado para a E19.4.
- Qualquer mudança necessária em geração, snapshot ou materialização deverá permanecer sob E19.4 em recorte próprio.
- Conforme `docs/prompt-estrategista.md` v35, a atualização de `docs/roadmap.md` pertence ao processo posterior à v1 e não é antecipada nesta consolidação.
- O humano ainda deve escolher explicitamente o processo posterior:
  - **Opção 1 — Processo atual:** avaliação única da v1 por Analista, Gestor Estrutural, Gestor de Updates e Gestor de Automação; depois consolidação v2 e execução por fases.
  - **Opção 2 — Processo automatizado:** após autorização explícita de merge da v1, marcar o PR ready, mergear remotamente e entregar `Use $lp-factory-orquestrar-plano no PR #821.`

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não criar segunda taxonomia, `taxon de geração`, taxon por oferta, seleção de pesquisa persistida por LP ou nova entidade de identidade comercial.
- Não alterar a autoridade E20.2 sobre fatos nem permitir que pesquisa preencha facts do cliente.
- Não alterar `generationContext`, pacote E19.3, workflow E19.4, prompt de copy, imagem, revisão, snapshot, materialização, preview ou renderer nesta E20.7.
- Não criar nova tabela/coluna de negócio, Storage, RAG, embeddings, vector database, crawler, cache global, service de busca, fila, cron ou job.
- Não adotar Agents SDK, agente, multiagente, handoff agentic ou persisted reasoning para resolver o complemento.
- Não pesquisar item por item em `multiple` ou `portfolio`.
- Não usar IA, sinônimos ou similaridade semântica para escolher taxon fonte no MVP.
- Não tornar suplemento dinâmico uma nova Deep Research E20.5 automaticamente.
- Não reescrever pesquisa, configuração, materialização ou snapshot histórico.
- Não redesenhar prompt persuasivo, contrato visual, editor, publicação, analytics ou testes A/B.
- Não criar cálculo ou persistência de custo concorrente com E21.4.

### 4.2. Critérios de parada

- Parar a implementação se E20.2 v6 não estiver publicada/operacional ou se sua forma final divergir materialmente do `landing_page_offering_scope` assumido nesta v1.
- Parar a especialização se taxon servido e fonte não puderem ser preparados para a mesma versão E20.2 efetiva ou se a equivalência factual conservadora falhar.
- Parar e replanejar se o match exato único de `single` se mostrar insuficiente para um caso real relevante; não introduzir roteamento semântico por conveniência.
- Parar o complemento quando Web Search não for efetivamente executado, não produzir fontes utilizáveis ou exceder os limites aprovados; não degradar silenciosamente.
- Parar e reavaliar a residência repo-only somente quando existir evidência medida de impacto operacional material em bundle/build/deploy ou versionamento; não migrar por antecipação.
- Parar diante de necessidade de nova tabela, rota, service, job, agente, engine ou infraestrutura não prevista.
- Parar qualquer tentativa de integrar a saída à geração dentro da E20.7; devolver a necessidade ao planejamento E19 competente antes de alterar pacote, workflow, snapshot ou materialização.
