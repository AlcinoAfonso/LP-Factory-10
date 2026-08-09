09/08/2026 — Plano-base v1 — E21.1 — Fundação, normalização e leitura dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado por decisão humana em 09/08/2026.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.1 — Fundação, normalização e leitura dos workloads OpenAI`.
- Plano conceitual: N/A.
- Este documento é o contrato executável do recorte aprovado e não possui questão indispensável aberta para a E21.1.
- A consolidação da v1 não autoriza iniciar a implementação; o próximo fluxo depende da escolha humana prevista em `docs/prompt-estrategista.md`.
- A E21.1 não escolhe a fonte operacional dinâmica definitiva e não implementa alteração de configuração sem redeploy.

### 1.2. Objetivo

- Criar a fundação comum mínima para identificar e resolver cada workload OpenAI por `workload + modelo + reasoning effort`.
- Normalizar explicitamente a configuração vigente dos consumidores conhecidos, eliminar hardcodes e impedir mudança silenciosa de effort por troca de modelo.
- Registrar usage completo e metadados operacionais seguros de forma uniforme nos três workloads de produto/runtime.
- Expor no Admin Dashboard um inventário read-only da configuração efetiva e da origem de cada workload, sem mutação, histórico persistido ou seleção dinâmica nesta etapa.
- Preservar uma fronteira única que permita trocar posteriormente a fonte inicial por uma configuração operacional ativa sem alterar novamente cada consumidor.

### 1.3. Fontes obrigatórias usadas

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/platform-config.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/prompt-estrategista.md`.
- `AGENTS.md`.
- `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`.
- `lib/conversion-content/landing-page/generation-profile/proposal-server.ts`.
- `lib/conversion-content/landing-page/generation-profile/proposal.ts`.
- `lib/conversion-content/commercial-activation/draft-generation.ts`.
- `automations/supabase-inspect/run.mjs`.
- `.github/workflows/pipeline-supabase-inspect.yml`.
- `components/admin/adminNavigation.ts` e shell protegido vigente do Admin Dashboard.
- PR #707, enquanto `docs/openai-model-snapshot.md` ainda não estiver incorporado à `main`.
- Documentação oficial OpenAI vigente para Responses API, `reasoning.effort`, usage, cached input, cache write e reasoning tokens.

### 1.4. Decisões fixas do caso

- A unidade canônica de configuração e comparação é `workload + modelo + reasoning effort`.
- `reasoningEffort` deve ser sempre resolvido explicitamente, inclusive como `none` ou `not_applicable`; defaults implícitos do provedor não integram o contrato.
- O inventário inicial contém quatro workloads conhecidos:
  - três de produto/runtime;
  - um operacional, Supabase Inspect.
- O catálogo tipado em código integra a normalização inicial, mas não é a solução final de gestão da configuração ativa.
- Na E21.1, o catálogo tipado torna-se a fonte inicial ativa de `modelo + effort` dos três workloads de produto.
- As três variáveis Vercel de modelo deixam de ser lidas e somente são retiradas da configuração após a validação dos três consumers em Preview; `OPENAI_API_KEY` permanece server-side na Vercel.
- Na E21.1, o usage comum permanece em logs operacionais estruturados e seguros, sem banco ou histórico persistido.
- `cacheWriteTokens` integra o contrato de observabilidade quando retornado pelo provedor; isso não autoriza prompt caching explícito na E21.1.
- A configuração operacional dinâmica sem redeploy é requisito fixo da E21 para mudanças ordinárias de `modelo + effort`.
- A futura ativação exige candidata validada, evidência associada e decisão humana.
- O futuro rollback reutiliza revisão anteriormente validada e não exige redeploy.
- Supabase e Vercel Global Config permanecem em comparação até existir evidência suficiente para escolher a fonte operacional.
- A E21.1 inclui fundação, normalização, observabilidade comum e inventário read-only no Admin Dashboard.
- A E21.1 não inclui candidata, ativação, rollback ou mutação administrativa.
- Supabase Inspect participa do inventário e da governança transversal, mas permanece fora da futura mutação administrativa dos workloads de produto.
- Cada domínio consumidor continua responsável por prompt, schema, limite de output, validação funcional, persistência de seu resultado e fallback funcional.
- A E21 não cria cliente universal, router, engine, agente ou seleção autônoma de modelo.

### 1.5. Progressão preservada da E21

- Fundação e leitura:
  - normalização estrutural;
  - configuração explícita;
  - observabilidade comum;
  - inventário read-only.
- Configuração operacional dinâmica:
  - fonte ativa por ambiente e workload;
  - candidata;
  - validação;
  - ativação humana;
  - rollback;
  - mudança ordinária sem redeploy.
- Evidências e histórico:
  - comparações reproduzíveis;
  - usage, latência e custo estimado por snapshot datado;
  - decisões de ativação e rollback;
  - observação histórica relevante do runtime.
- Evolução administrativa:
  - leitura enriquecida de resultados e histórico;
  - criação ou associação de candidata;
  - ativação;
  - rollback.
- Os identificadores e planos-base dos recortes posteriores serão formalizados antes de sua execução; a escolha da fonte operacional deve estar resolvida antes do recorte dinâmico.

### 1.6. Baseline factual e regressões

- Resolução de nicho:
  - tipo: produto/runtime;
  - configuração atual: `OPENAI_NICHE_RESOLVER_MODEL` na Vercel;
  - referência atual: `gpt-5.4-mini`;
  - effort omitido;
  - modelo respeitado pelo request;
  - sem usage, response ID e latência comuns registrados.
- Proposta de perfil de orientação:
  - tipo: produto/Admin runtime;
  - configuração atual: variável Vercel validada no boundary server-side;
  - request fixa `gpt-5.4-mini` e ignora o modelo recebido;
  - effort omitido;
  - usage parcial, sem cached input e reasoning tokens;
  - custo calculado por tarifas hardcoded exclusivas do modelo atual.
- Ativação comercial:
  - tipo: produto/Admin runtime;
  - configuração atual: `OPENAI_COMMERCIAL_ACTIVATION_MODEL` na Vercel;
  - referência atual: `gpt-5.4-mini`;
  - effort omitido;
  - modelo respeitado e preservado na proveniência;
  - sem usage, response ID e latência comuns registrados.
- Supabase Inspect:
  - tipo: operacional/GitHub Actions;
  - configuração atual: input do workflow e `OPENAI_MODEL` na execução;
  - default atual: `gpt-4.1-mini`;
  - effort não aplicável ao baseline atual;
  - configuração alterável por execução, sem integrar a futura mutação dos workloads de produto.
- A omissão de effort preserva hoje `none` no `gpt-5.4-mini`, mas não é segura para migrações porque valores suportados e defaults variam por modelo.

### 1.7. Decisões fechadas para a v1

- Fonte transitória dos três workloads de produto:
  - o catálogo tipado é a fonte inicial ativa de `modelo + effort`;
  - os consumers deixam de ler as três variáveis Vercel de modelo;
  - a retirada das variáveis da configuração e de `docs/platform-config.md` ocorre somente após os três consumers serem validados em Preview;
  - `OPENAI_API_KEY` permanece na Vercel.
- Destino do usage comum:
  - eventos estruturados nos logs operacionais seguros já usados pelo runtime;
  - sem tabela, migration, retenção histórica ou métricas consultáveis na página nesta etapa.
- Contrato adicional de usage:
  - normalizar `cacheWriteTokens` quando o provedor retornar `cache_write_tokens`;
  - não habilitar explicit prompt caching na E21.1.
- Não permanece questão indispensável aberta para executar a E21.1.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho de runtime: cada chamada OpenAI de produto solicita sua configuração efetiva pelo identificador canônico do workload.
- Gatilho administrativo: platform admin abre o inventário read-only no Admin Dashboard.
- Entrada: identificador do workload, ambiente atual e configuração inicial reconhecida pelo catálogo.
- Processamento: resolver configuração → validar combinação → entregar `model + reasoningEffort + source + revision` → consumidor constrói sua própria requisição → capturar resposta e usage → registrar evento seguro.
- Validação: garantir identidade conhecida, configuração explícita, modelo e effort entregues ao request, usage normalizado quando disponível e ausência de dados sensíveis no evento.
- Persistência: nenhuma nova persistência de domínio na E21.1; logs operacionais não se tornam histórico canônico de avaliação.
- Consumo: três consumers de produto/runtime e inventário administrativo read-only; Supabase Inspect entra apenas como item operacional externo no inventário.
- Fallback: cada workload preserva o fallback funcional vigente; não há fallback automático para outro modelo ou effort.

### 2.2. Identificadores canônicos iniciais

- `niche_resolution`:
  - classificação: `product_runtime`;
  - consumidor: resolvedor IA opcional do onboarding;
  - fallback: continuar sem bloquear o onboarding conforme contrato vigente.
- `landing_page_generation_profile_proposal`:
  - classificação: `product_runtime`;
  - consumidor: proposta administrativa opcional do perfil de orientação;
  - fallback: edição manual permanece funcional.
- `commercial_activation_draft_generation`:
  - classificação: `product_runtime`;
  - consumidor: geração administrativa de draft comercial;
  - fallback: falha não publica nem substitui conteúdo vigente.
- `supabase_inspect`:
  - classificação: `operational`;
  - consumidor: workflow operacional separado do Core;
  - fallback: falha permanece restrita à execução do workflow.
- Identificador representa uma chamada OpenAI independente, não a página, a rota ou o domínio inteiro.

### 2.3. Catálogo estrutural e resolução inicial

- Criar boundary transversal mínimo no Core para:
  - declarar os workloads de produto;
  - validar identificadores únicos;
  - resolver `model` e `reasoningEffort` explicitamente;
  - preservar classificação, origem e revisão rastreável;
  - fornecer uma projeção read-only segura ao Admin Dashboard.
- Baseline inicial dos workloads de produto:
  - modelo: `gpt-5.4-mini`;
  - effort: `none`.
- Baseline inventariado do Supabase Inspect:
  - modelo: `gpt-4.1-mini`;
  - effort: `not_applicable`.
- O catálogo inicial não contém preços e não mantém resultados comparativos.
- O catálogo inicial não deve obrigar alteração de código em cada consumer quando a fonte dinâmica futura assumir a configuração ativa; consumers dependem apenas do resolver comum.
- O resolver comum não executa a chamada OpenAI, não conhece prompts, schemas, limites de output ou regras funcionais dos consumers.
- Supabase Inspect mantém sua fonte operacional própria; a aplicação apenas conhece sua projeção documental segura para inventário.

### 2.4. Integração e correções de regressão

- Os três consumers de produto devem receber e usar exatamente a configuração resolvida.
- Cada request deve enviar `reasoning.effort` explicitamente.
- A proposta do perfil deve deixar de fixar `gpt-5.4-mini` dentro do request e usar o modelo resolvido.
- A validação de disponibilidade do perfil deve deixar de funcionar como allowlist exclusiva do modelo atual.
- Remover as constantes de tarifa e o cálculo `estimatedCostUsd` acoplado ao `gpt-5.4-mini`.
- Logs, metadados, contratos e UI que hoje esperam `estimatedCostUsd` devem deixar de tratá-lo como dado de runtime confiável.
- Prompts, Structured Outputs, limites de output, retries, schemas e regras funcionais permanecem nos domínios consumidores.
- Não refatorar os três consumers para um cliente OpenAI universal.

### 2.5. Observabilidade comum e custo

- Registrar por tentativa de chamada de produto, quando disponível:
  - workload;
  - ambiente;
  - source e revision da configuração efetiva;
  - modelo;
  - reasoning effort;
  - response ID;
  - sucesso ou categoria segura de falha;
  - latência;
  - input tokens;
  - cached input tokens;
  - cache write tokens, quando retornados;
  - output tokens;
  - reasoning tokens;
  - total tokens.
- Normalizar `cached input` a partir de `usage.input_tokens_details.cached_tokens`.
- Normalizar `cacheWriteTokens` a partir de `usage.input_tokens_details.cache_write_tokens`, quando o campo for retornado pelo provedor.
- Normalizar `reasoning tokens` a partir de `usage.output_tokens_details.reasoning_tokens`.
- A captura de `cacheWriteTokens` não habilita nem autoriza `prompt_cache_options`, `prompt_cache_breakpoint` ou outra configuração de prompt caching explícito na E21.1.
- Campos indisponíveis em falhas anteriores à resposta permanecem ausentes ou nulos; não fabricar zero quando o provedor não retornou usage.
- Não registrar prompt integral, pesquisa bruta, resposta completa, dados pessoais, secrets ou payloads de negócio.
- Não calcular custo monetário no runtime da E21.1.
- Avaliações de custo usam usage real e snapshot datado com fontes oficiais vigentes; o PR #707 é a referência inicial enquanto seu documento não estiver na `main`.
- A E21.1 não cria engine, tabela ou fonte dinâmica de pricing.

### 2.6. Inventário read-only no Admin Dashboard

- Criar página protegida em `/admin/workloads-openai`, integrada à navegação administrativa vigente.
- Título administrativo: `Workloads OpenAI`.
- Exibir somente dados reais disponíveis na E21.1:
  - nome e identificador do workload;
  - classificação `produto/runtime` ou `operacional`;
  - ambiente observado pela página;
  - modelo efetivo;
  - reasoning effort efetivo;
  - origem da configuração;
  - revisão rastreável;
  - estado operacional descritivo.
- Supabase Inspect deve aparecer como operacional externo e sem controle de mutação.
- A página não consulta GitHub, Vercel ou OpenAI e não infere configuração remota indisponível.
- A página não mostra resultados comparativos, custo agregado, tokens históricos, latência histórica, candidata, ativação ou rollback enquanto essas fontes não existirem.
- A UI deve reutilizar shell, navegação e componentes administrativos vigentes, com cabeçalho operacional, listagem read-only e estado vazio enxuto quando aplicável.
- A superfície deve ser responsiva, navegável por teclado e sem controles que aparentem mutação.

### 2.7. Fronteira para configuração dinâmica posterior

- A E21.1 deve deixar consumers dependentes de uma única interface de resolução, sem escolher sua implementação dinâmica futura.
- O recorte dinâmico posterior deve poder substituir a origem inicial por fonte ativa sem alterar os consumers.
- O contrato futuro deverá preservar por ambiente e workload:
  - candidata;
  - evidência associada;
  - configuração ativa;
  - revisão;
  - ativação atômica;
  - rollback para revisão validada;
  - mudança ordinária sem redeploy.
- A indisponibilidade da futura fonte ativa não autoriza troca silenciosa de modelo ou effort.
- A comparação Supabase versus Global Config deve avaliar antes do recorte dinâmico:
  - latência e disponibilidade de leitura;
  - atomicidade por ambiente e workload;
  - autorização de escrita;
  - auditoria e histórico decisório;
  - rollback;
  - integração com Admin Dashboard;
  - custo e condições do plano;
  - dependência operacional adicional;
  - comportamento de falha.

### 2.8. Segurança e autorização

- A página é server-side e protegida pelo guard administrativo vigente.
- Owner ou admin de conta não recebe acesso por pertencer a uma conta.
- A E21.1 não cria mutação, Server Action de escrita, API pública, secret, token ou credencial adicional.
- `OPENAI_API_KEY` permanece server-side e fora do catálogo projetado para a UI.
- O client não recebe secrets, prompts, respostas ou metadados de chamada não necessários ao inventário.
- A E21.1 não altera RLS, grants, RPCs, audit logs ou schema de banco.

### 2.9. Casos executáveis mínimos

- Catálogo e resolver:
  - quatro identificadores únicos;
  - três workloads de produto e um operacional;
  - `model + reasoningEffort` sempre explícitos;
  - workload desconhecido rejeitado;
  - projeção administrativa sem secrets;
  - Supabase Inspect sem integração indevida ao runtime do Core.
- Consumers:
  - modelo e effort resolvidos chegam exatamente ao body da Responses API;
  - proposta de perfil não usa modelo hardcoded;
  - nenhum consumer depende do default de effort do provedor;
  - fallback funcional vigente preservado.
- Usage:
  - input, cached input, cache write quando retornado, output, reasoning e total normalizados;
  - ausência e payload inválido tratados sem fabricar métricas;
  - response ID, latência e categoria segura registrados;
  - nenhum prompt, pesquisa bruta, resposta completa ou secret nos eventos.
- Custo:
  - ausência de constantes de tarifa no runtime do perfil;
  - ausência de `estimatedCostUsd` calculado com preço único hardcoded;
  - usage disponível para avaliação externa por snapshot datado.
- Admin Dashboard:
  - acesso de platform admin;
  - inventário dos quatro workloads;
  - configuração inicial efetiva dos workloads de produto;
  - Supabase Inspect marcado como operacional externo;
  - nenhuma mutação ou histórico inventado;
  - desktop, mobile e navegação por TAB aprovados.
- Validações técnicas previstas:
  - novo validator focal do catálogo e resolver;
  - validators vigentes dos três domínios consumidores materialmente afetados;
  - `npm run check`;
  - `git diff --check`;
  - smoke hospedado dos três fluxos de produto e da página administrativa.

## 3. Fases e próxima ação

### 3.1. E21.1.3 — Catálogo estrutural e resolução explícita

- Status: planejada na v1; primeira fase executável, ainda não iniciada.
- Automação: não.
- Objetivo:
  - criar identificadores canônicos, catálogo inicial tipado, projeção administrativa segura e interface única de resolução.
- Entregas:
  - boundary transversal mínimo no Core;
  - baseline explícito dos três workloads de produto em `gpt-5.4-mini + none`;
  - inventário seguro do Supabase Inspect em `gpt-4.1-mini + not_applicable`;
  - source, revision e classificação rastreáveis;
  - validator focal de contrato;
  - fronteira preparada para futura fonte dinâmica sem criar adapter de banco ou Global Config.
- Critérios de aceite:
  - consumidores podem resolver configuração sem conhecer sua origem concreta;
  - nenhum preço, prompt, schema funcional, secret ou chamada OpenAI no boundary;
  - nenhum cliente universal, router ou engine;
  - nenhuma nova persistência ou infraestrutura.

### 3.2. E21.1.4 — Integração dos consumers e observabilidade comum

- Status: planejada na v1; depende da E21.1.3 e ainda não foi iniciada.
- Automação: não.
- Objetivo:
  - integrar os três consumers de produto ao resolver, corrigir as regressões e uniformizar os eventos operacionais seguros.
- Entregas:
  - modelo e effort explícitos nos três requests;
  - correção do hardcode da proposta de perfil;
  - remoção da tarifa e do custo hardcoded do perfil;
  - normalização de response ID, latência e usage completo;
  - eventos comuns seguros preservando os fallbacks funcionais;
  - atualização coordenada de `docs/base-tecnica.md` e `docs/platform-config.md` conforme a decisão da seção 1.7.
- Critérios de aceite:
  - request real de cada workload usa exatamente a configuração resolvida;
  - nenhum default implícito de effort;
  - cached input, cache write e reasoning tokens capturados quando retornados;
  - nenhuma PII, prompt ou resposta integral em logs;
  - sem cálculo monetário de runtime;
  - validators dos domínios e smoke hospedado aprovados.

### 3.3. E21.1.5 — Inventário read-only no Admin Dashboard

- Status: planejada na v1; depende da E21.1.3 e do contrato efetivo validado na E21.1.4; ainda não foi iniciada.
- Automação: não.
- Objetivo:
  - expor a visão inicial segura dos workloads e de sua configuração efetiva no shell administrativo vigente.
- Entregas:
  - página `/admin/workloads-openai`;
  - item `Workloads OpenAI` na navegação administrativa;
  - listagem read-only dos quatro workloads;
  - classificação, ambiente, modelo, effort, origem, revisão e estado operacional;
  - diferenciação visual e textual do Supabase Inspect como workload externo;
  - estados responsivos e acessíveis.
- Critérios de aceite:
  - somente platform admin acessa a página;
  - nenhum controle de mutação;
  - nenhuma consulta externa a GitHub, Vercel ou OpenAI;
  - nenhuma métrica histórica ou custo inventado;
  - desktop, mobile e TAB aprovados;
  - `npm run check` e `git diff --check` aprovados.

### 3.4. Próxima ação

- Orientar o Executor a ajustar `docs/roadmap.md` no mesmo PR conforme `docs/prompt-estrategista.md`, `docs/prompt-abc.md` e `docs/template-roadmap.md`, registrando somente seções, subseções, títulos, objetivos e status planejado.
- Submeter ao humano a escolha entre o processo atual e o processo automatizado definida em `docs/prompt-estrategista.md`.
- No processo atual, encaminhar depois o plano-base v1 completo ao Analista, ao Gestor Estrutural e ao Gestor de Updates.
- Não iniciar implementação, escolher Supabase ou Global Config, ou executar fase antes dos gates do processo escolhido.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo da E21.1

- Escolha ou implementação da fonte operacional dinâmica.
- Banco, tabela, migration, RPC, RLS, policy, trigger ou grant novos.
- Vercel Global Config, Edge Config, SDK, token ou recurso novo.
- Candidata, validação persistida, ativação, promoção ou rollback.
- Alteração ordinária de configuração sem redeploy já nesta etapa.
- Histórico persistido de usage, testes, decisões ou ativações.
- Dashboard de custo, tokens, latência ou qualidade histórica.
- Fonte dinâmica ou engine de pricing.
- Migração para GPT-5.6 ou troca de baseline.
- Comparação automatizada, A/B test, benchmark contínuo ou promoção automática.
- Fallback automático entre modelos ou efforts.
- Allowlist rígida de todos os modelos futuros no consumer.
- Cliente OpenAI universal, router, engine, agente, job, fila, cron ou webhook.
- Mudança de prompt, schema, regra funcional, output máximo ou persistência própria dos consumers sem necessidade comprovada pela integração.
- Mutação do Supabase Inspect pela página do Admin Dashboard.
- Alteração de secrets ou exposição de `OPENAI_API_KEY`.
- Redesign amplo do Admin Dashboard.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - a normalização exigir mudar prompt, schema ou resultado funcional de um consumer;
  - surgir necessidade de banco, Global Config ou nova infraestrutura para concluir a E21.1;
  - a página read-only exigir consultar secret ou plataforma externa no client;
  - o usage completo exigir registrar prompt, resposta, pesquisa bruta ou PII;
  - um consumer não puder preservar seu fallback funcional;
  - o Supabase Inspect precisar ser acoplado ao Core para aparecer no inventário;
  - a implementação tentar escolher ou promover automaticamente modelo ou effort;
  - o código real divergir do inventário e revelar novo consumer OpenAI não debatido;
  - a remoção das variáveis ou do custo hardcoded causar mudança funcional não prevista;
  - surgir mudança que contradiga ou reabra decisão fixa da seção 1.7.

### 4.3. Validação deste trabalho documental

- Confirmar:
  - somente `docs/lousa-plano-base-e21-1.md` alterado na consolidação;
  - documento marcado como plano-base v1;
  - quatro seções preservadas;
  - três fases executáveis, todas com `Automação: não`;
  - E21.1 limitada a fundação, normalização, observabilidade comum e leitura administrativa;
  - requisito dinâmico sem redeploy preservado explicitamente como parte fixa da E21;
  - Supabase e Global Config mantidos em comparação;
  - decisões da seção 1.7 fechadas;
  - `cacheWriteTokens` opcional incluído sem autorizar prompt caching explícito;
  - nenhuma implementação, roadmap, banco ou configuração de plataforma alterados nesta consolidação.
- Executar validação de whitespace do conteúdo documental.
- Registrar como não aplicável nesta etapa documental:
  - `npm ci`;
  - `npm run check`;
  - validação material;
  - teste humano;
  - smoke visual.
