# OpenAI Model Snapshot — LP Factory 10

## 1. Autoridade, validade e fontes

- Data da fotografia técnica: 27/10/2026; baseline anterior de 14/09/2026, reorganizado em 22/09/2026.
- Objetivo: manter uma fotografia técnica itemizada e rastreável das capacidades OpenAI relevantes ao LP Factory 10.
- Este documento não define sozinho modelo, `reasoning.effort`, tool, arquitetura ou configuração de produção e não autoriza adoção.
- A configuração efetiva permanece em `docs/platform-config.md`; a governança das decisões por workload permanece em `docs/gestor-automations.md` e no caso competente do roadmap.
- O workflow de `docs/workflow-atualizacao-updates.md` faz a descoberta oficial ampla e atualiza esta fotografia somente diante de mudança técnica material.
- Fontes oficiais rastreadas:
  - `https://developers.openai.com/api/docs/guides/latest-model`
  - `https://developers.openai.com/api/docs/models`
  - `https://developers.openai.com/api/docs/models/gpt-4.1-mini`
  - `https://developers.openai.com/api/docs/models/gpt-5.4-mini`
  - `https://developers.openai.com/api/docs/models/gpt-5.6-luna`
  - `https://developers.openai.com/api/docs/models/gpt-5.6-terra`
  - `https://developers.openai.com/api/docs/models/gpt-5.6-sol`
  - `https://developers.openai.com/api/docs/models/gpt-6-luna`
  - `https://developers.openai.com/api/docs/models/gpt-6-sol`
  - `https://developers.openai.com/api/docs/models/gpt-6-astra`
  - `https://developers.openai.com/api/docs/models/gpt-6.1-sol`
  - `https://developers.openai.com/api/docs/models/gpt-6.1-terra`
  - `https://developers.openai.com/api/docs/guides/prompt-caching`
  - `https://developers.openai.com/api/docs/guides/error-codes`
  - `https://developers.openai.com/api/docs/changelog`
  - `https://developers.openai.com/api/docs/guides/agents-api/overview`
  - `https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra`
  - `https://developers.openai.com/api/docs/guides/async-tool-calling`
  - `https://developers.openai.com/api/docs/guides/steering`
  - `https://developers.openai.com/api/docs/guides/prompt-caching/diagnostics`
  - `https://developers.openai.com/api/docs/guides/reasoning`
  - `https://developers.openai.com/api/docs/guides/tools-web-search`
  - `https://openai.com/api-fast-mode/`
  - `https://openai.github.io/openai-agents-js/`
  - `https://openai.com/pt-BR/index/gpt-5-6/`

- Fontes complementares: `https://developers.openai.com/api/docs/guides/decisions`, `https://developers.openai.com/api/docs/models/gpt-6.1-sol`, `https://developers.openai.com/api/docs/deprecations`, `https://developers.openai.com/api/docs/guides/decisions-voice` e `https://developers.openai.com/api/docs/guides/custom-voices`.

### 1.1. Maturidade usada nos registros

- `operacional`: capacidade usada por workload vigente e confirmada nas fontes operacionais do projeto.
- `documentada`: capacidade confirmada em fonte oficial e disponível para avaliação por caso, sem adoção implícita.
- `condicional`: capacidade com hipótese técnica plausível, dependente de problema, comparação ou autorização específica.
- `histórica`: capacidade ou configuração retirada do estado corrente e preservada somente para rastreabilidade.

## 2. Baseline operacional do projeto

### 2.1. Workloads registrados

| ID | Workload | Configuração efetiva ou baseline | Maturidade | Autoridade |
|---|---|---|---|---|
| `OAI-W01` | `niche_resolution` | `gpt-5.4-mini + none` | operacional | `lib/openai-workloads/registry.ts` e `docs/platform-config.md` |
| `OAI-W02` | `commercial_activation_draft_generation` | `gpt-5.4-mini + none` | operacional | `lib/openai-workloads/registry.ts` e `docs/platform-config.md` |
| `OAI-W03` | `taxon_input_catalog_sufficiency_evaluation` | histórico: `gpt-5.6-terra + low` (retirado pela E22.7) | histórica | E20.8.7 (histórico), `docs/platform-config.md` e `docs/roadmap.md` 22.7.4 |
| `OAI-W04` | `supabase_inspect` | `gpt-4.1-mini + not_applicable` | referência operacional externa; modelo com retirada anunciada | `lib/openai-workloads/registry.ts`, `docs/automations.md` e `docs/platform-config.md` |
| `OAI-W05` | `landing_page_dynamic_market_research` | configuração encerrada pela E20.8 | histórica | commits e migrations da E20.7 |
| `OAI-W06` | `communication_base_stage1_assistance` | `gpt-5.4-mini + none` operacional em Preview e Production sob E21/E25.1 | operacional | `lib/openai-workloads/registry.ts`, `docs/platform-config.md`, `docs/roadmap.md` 25.1.4 e `docs/schema.md` 1.28.4 |
| `OAI-W07` | `communication_base_stage2_intelligence` | `gpt-6-luna + max`, Web Search até duas chamadas, operacional em Preview e Production após E21/E25.1 | operacional | `lib/openai-workloads/registry.ts`, `docs/platform-config.md`, `docs/roadmap.md` 25.1.5 e `docs/schema.md` 1.28.4 |
| `OAI-W08` | `pending_setup_conversation` | `gpt-6-luna + xhigh`, sem Web Search; prompt `e10_12_sales_context_v14`, contrato 5; provas E21 aprovadas nas revisões 14 de Preview e 5 de Production, com configuração ativa por ambiente na fonte operacional | operacional | `lib/openai-workloads/registry.ts`, `docs/platform-config.md`, E10.12 e PR #1069 |

- O registry usa fonte `repo_catalog` revisão `v2` no baseline local; Preview e Production usam exclusivamente `supabase_operational` com revisão decimal ativa e revisão própria por workload, conforme a governança da E21.1.
- `supabase_inspect` é uma referência de inventário para workflow operacional separado do Core, com fonte `github_actions_default_reference`; não é baseline de workload de produto nem autorização para alterar o workflow.
- `landing_page_dynamic_market_research` não integra o registry nem a configuração efetiva corrente; seus registros anteriores permanecem somente como histórico.
- Variáveis legadas de modelo não são fonte runtime atual; seu estado operacional permanece exclusivamente em `docs/platform-config.md`.
- O registry registra identidade e configuração de referência; a ativação hospedada deve ser confirmada nas fontes operacionais. `OAI-W06` e `OAI-W07` estão operacionais em Preview e Production conforme `docs/platform-config.md`, `docs/roadmap.md` 25.1.4–25.1.5 e `docs/schema.md` 1.28.4.

### 2.2. Regra de baseline

- `gpt-5.4-mini + none` permanece como baseline validada somente para `OAI-W01` e `OAI-W02` até decisão específica por workload.
- Novo workload exige decisão explícita de `modelo + reasoning effort`; nenhuma configuração existente é default universal.
- Confirmar o effort na requisição real antes de comparar comportamento; não inferir configuração apenas pelo modelo.
- Mudança de modelo, effort, tool ou configuração exige o fluxo e as evidências do recorte competente.

## 3. Modelos e limites técnicos

| ID | Modelo | Aplicabilidade de referência | Contexto | Saída máxima | Reasoning efforts documentados | Maturidade | Fonte |
|---|---|---|---:|---:|---|---|---|
| `OAI-M01` | `gpt-5.4-mini` | baseline dos workloads `OAI-W01` e `OAI-W02` | 400k | 128k | `none`, `low`, `medium`, `high`, `xhigh` | operacional | documentação específica do modelo |
| `OAI-M02` | `gpt-5.6-luna` | tarefas de alto volume que justifiquem comparação própria | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | documentada | documentação específica do modelo |
| `OAI-M03` | `gpt-5.6-terra` | equilíbrio de capacidade para casos que justifiquem comparação própria | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | documentada | documentação específica do modelo |
| `OAI-M04` | `gpt-5.6-sol` | trabalho profissional complexo que justifique comparação própria | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | documentada | documentação específica do modelo |
| `OAI-M05` | `gpt-4.1-mini` | referência externa do workflow `OAI-W04`; não é baseline de produto | 1.047.576 | 32.768 | não aplicável; modelo sem etapa de reasoning | referência operacional externa; depreciação anunciada | documentação específica do modelo e `lib/openai-workloads/registry.ts` |
| `OAI-M06` | `gpt-6-luna` | configuração operacional de `OAI-W07` e `OAI-W08` em Preview e Production | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | operacional em `OAI-W07` e `OAI-W08` | documentação específica do modelo, registry e fontes operacionais do projeto |
| `OAI-M07` | `gpt-6-sol` | alternativa técnica avaliada focalmente para `OAI-W07` | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | documentada | documentação específica do modelo e PR #978 |
| `OAI-M08` | `gpt-6-astra` | tarefas complexas somente mediante comparação própria | 1,05M | 128k | `low`, `medium`, `high`, `xhigh`, `max` | documentada | documentação específica do modelo |
| `OAI-M09` | `gpt-6.1-sol` | trabalho profissional complexo; candidato ainda não comparado para `OAI-W07` | 1,05M | 128k | `low`, `medium`, `high`, `xhigh`, `max` | documentada; `medium` é o padrão | documentação específica do modelo e Model guidance |
| `OAI-M10` | `gpt-6.1-terra` | escrita e raciocínio visual; candidato dependente de comparação própria | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | documentada desde 26/10/2026; `medium` padrão | documentação específica do modelo e changelog |

- Luna, Terra e Sol documentam Responses API, function calling, Structured Outputs e reasoning tokens.
- Em GPT-5.6, o effort padrão documentado é `medium` quando omitido; comparações devem registrar o valor explicitamente.
- Para `gpt-5.4-mini`, o padrão documentado é `none` quando o parâmetro é omitido.
- `gpt-4.1-mini` é um modelo não reasoning; a referência operacional externa `OAI-W04` não deve receber `reasoning.effort`.
- `OAI-M05`/`OAI-W04`: aviso oficial de 14/10/2026 agenda retirada de `gpt-4.1-mini-2025-04-14` para 14/01/2027 e indica `gpt-6-luna` como substituto. O workflow `pipeline-supabase-inspect.yml` ainda oferece somente `gpt-4.1-mini`; planejar migração antes do prazo, validando modelo resolvido, contrato, tools, qualidade e limites no recorte próprio. A configuração hospedada não foi inspecionada; não presumir troca automática nem equivalência. Fonte: página oficial de deprecações.
- `gpt-6.1-sol` requer Responses API para tool calling; Chat Completions não oferece tools para esse modelo. Não suporta `none` nem `minimal`; preservar o effort atual e comparar somente em recorte autorizado.
- `OAI-M10`: entrada textual/visual e saída textual; tools por Responses API, incluindo function calling, Web Search, file search, imagem, code interpreter, shell, apply patch, skills, computer use, MCP e tool search. Disponibilidade não demonstra superioridade nem substitui modelo/effort de workload existente.
- Limites e capacidades são voláteis e devem ser reconfirmados na fonte oficial focal antes de uma decisão material.
- A documentação da família GPT-6 indica entrada textual e visual, saída textual e limite máximo de entrada de 922k tokens; capacidade técnica não altera os gates de cada workload.

## 4. APIs, tools e capacidades agentic

### `OAI-C01` — Responses API

- Natureza: API de execução textual e multimodal usada como base programática preferencial do projeto.
- Aplicabilidade: workloads server-side com contrato e guardrails definidos pelo recorte.
- Maturidade: operacional em `OAI-W01`, `OAI-W02`, `OAI-W06`, `OAI-W07` e `OAI-W08`.
- Limite: não substitui regras de negócio determinísticas, autorização ou persistência verificável.
- Fontes: Model guidance, catálogo Models e contratos vigentes do projeto.

### `OAI-C02` — Structured Outputs

- Natureza: contrato estruturado de saída com schema.
- Aplicabilidade: casos em que forma e validação estrutural da resposta são requisitos materiais.
- Maturidade: operacional nos workloads vigentes que exigem JSON Schema estrito.
- Limite: schema válido não garante factualidade, qualidade editorial ou autorização de mutação.
- Fontes: catálogo Models e implementações registradas em `docs/automations.md`.

### `OAI-C03` — Function calling

- Natureza: interface para o modelo selecionar chamadas de funções autorizadas.
- Aplicabilidade: fluxo em que a escolha de capacidade externa pelo modelo produz benefício demonstrável.
- Maturidade: documentada; sem adoção universal no projeto.
- Limite: uma fonte consultada deterministicamente pelo backend não se torna tool por participar do contexto.
- Fonte: catálogo Models.

### `OAI-C04` — Web Search

- Natureza: tool hospedada de pesquisa web.
- Aplicabilidade: fallback ou hipótese focal autorizada quando fonte externa atual é indispensável.
- Maturidade: operacional de forma delimitada em `OAI-W07` em Preview e Production, sob os controles E21/E25.1.
- Limite: não substitui fonte competente, não amplia escopo e deve preservar URLs comprovadas pela metadata do provider.
- Fonte: guia oficial Web search.

### `OAI-C05` — Reasoning effort e reasoning tokens

- Natureza: controle de esforço e sinal técnico de uso do raciocínio do modelo.
- Aplicabilidade: comparação por workload quando qualidade, latência ou estabilidade justificarem variar effort.
- Maturidade: operacional nas configurações explícitas da seção 2 e documentada nos modelos da seção 3.
- Limite: effort maior não é promoção automática; o menor effort que cumpre os gates permanece preferível.
- Fonte: guia oficial Reasoning.

### `OAI-C06` — Programmatic Tool Calling

- Natureza: coordenação programática de chamadas e resultados intermediários em fluxos intensivos em tools.
- Aplicabilidade: somente quando houver sequência delimitada e hipótese verificável de ganho contra o fluxo de referência.
- Maturidade: condicional.
- Limite: não autoriza novo agente, tool ou orquestração neste documento.
- Fonte: Model guidance.

### `OAI-C07` — Persisted reasoning

- Natureza: continuidade de raciocínio entre etapas relacionadas.
- Aplicabilidade: tarefas em que a continuidade possa melhorar completude ou estabilidade.
- Maturidade: condicional.
- Limite: não substitui estado verificável de negócio ou processo.
- Fonte: Model guidance.

### `OAI-C08` — Explicit prompt caching

- Natureza: reutilização de prefixos estáveis; em modelos elegíveis, `prompt_cache_options.ttl` admite `30m` e `12h` na Responses API, com controle por breakpoint.
- Aplicabilidade: medir reutilização e latência do contexto antes de escolher duração ou breakpoint; complementar a `OAI-C15`.
- Maturidade: documentada; opção de 12h anunciada em 20/10/2026, sem configuração alterada no projeto.
- Limites: TTL mínimo não é prazo máximo de retenção nem garantia de hit/latência. É distinto do parâmetro legado `prompt_cache_retention`; elegibilidade e política de dados precisam de validação focal. Não é memória escolhida pelo modelo nem pausa de workflow.
- Fonte: guia oficial Prompt caching e changelog; conteúdo financeiro permanece fora desta fotografia.

### `OAI-C09` — Agents SDK

- Natureza: framework para turns, tools, guardrails, handoffs, sessions e tracing.
- Aplicabilidade: somente quando essas capacidades reduzirem complexidade líquida em problema agentic real.
- Maturidade: documentada; não é evolução automática de Responses API.
- Limite: adoção exige recorte próprio e não substitui backend determinístico suficiente.
- Fonte: documentação oficial Agents SDK para JavaScript.

### `OAI-C10` — Padrão multi-agent

- Natureza: decomposição de trabalho complexo em frentes independentes com síntese.
- Aplicabilidade: tarefas realmente separáveis que se beneficiem de execução paralela.
- Maturidade: condicional; o `gpt-6.1-sol` passou a oferecer delegação multi-agent em beta via Responses API, sem uso registrado no projeto.
- Limite: não presumir ganho quando as etapas forem fortemente dependentes; disponibilidade beta exige comparação e validação próprias.
- Fontes: Model guidance, documentação Agents SDK e changelog oficial (lançamento de 29/09/2026 do GPT-6.1 Sol).

### `OAI-C11` — Geração de imagem

- Natureza: capacidade de imagem preservada no catálogo de modelos do projeto.
- Aplicabilidade: workload de imagem futuro autorizado por recorte próprio.
- Maturidade: documentada; não existe workload de imagem vigente.
- Limite: disponibilidade de `gpt-image-2` e parâmetros não autoriza ativação.
- Fontes: catálogo Models, `lib/openai-workloads/adapters/modelCatalogAdapter.ts` e `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`.

### `OAI-C12` — Fast mode para `gpt-5.6-sol`

- Natureza: tier de processamento de menor latência, separado do modelo e do `reasoning.effort`, com até 2,5 vezes a velocidade do processamento Standard e sem mudança de inteligência.
- Aplicabilidade: comparação focal de workload sensível a latência quando o mesmo modelo e effort já forem candidatos tecnicamente adequados.
- Maturidade: documentada; `service_tier=fast` e o alias retrocompatível `service_tier=priority` são aceitos por requisição.
- Limites: não é padrão nem autorização de adoção; compartilha rate limits com os demais tiers e pode sofrer fallback para Standard diante dos limites de aceleração de tráfego. Reconfirmar disponibilidade, comportamento e elegibilidade na fonte oficial antes de qualquer avaliação.
- Fonte: página oficial Fast mode for API Customers.

### `OAI-C13` — Agents API

- Natureza: API gerenciada de sessões, execução e observabilidade de agentes, distinta do Agents SDK.
- Aplicabilidade: somente recorte agentic com necessidade comprovada de estado ou orquestração gerenciada.
- Maturidade: documentada em beta público; não registrada como workload do projeto.
- Limite: não autoriza substituir Responses API nem criar fluxo autônomo sem contrato, governança e avaliação próprios.
- Evolução documentada em outubro: pre-warm de sandbox, Artifact SDK/skills de documentos em sandboxes hospedados e Ultrafast com modelo elegível; continuam condicionados ao recorte, sem execução hospedada aprovada nesta fotografia.
- Fonte: changelog e guia oficial Agents API, lançamento de 10/09/2026.

### `OAI-C14` — Async tool calling e mid-turn steering

- Natureza: recursos documentados para chamada assíncrona de tools e direcionamento de uma resposta ainda em curso na família GPT-6.
- Aplicabilidade: fluxos longos com tools ou intervenção durante a execução, se um caso próprio demonstrar benefício.
- Maturidade: documentada; sem uso identificado nos workloads registrados.
- Limite: não implica paralelismo, delegação ou mutação autorizada no projeto.
- Fontes: guia Using GPT-6, Async tool calling e Mid-turn steering.

### `OAI-C15` — Prompt cache diagnostics

- Natureza: diagnósticos oficiais de acertos e perdas do cache de prompt para modelos elegíveis.
- Aplicabilidade: análise focal de workloads com prefixos repetidos e telemetria suficiente.
- Maturidade: documentada como GA em 08/09/2026; sem adoção registrada no projeto.
- Limite: observabilidade de cache não substitui avaliação de qualidade nem autoriza mudança de configuração.
- Fonte: changelog e guia oficial Prompt cache diagnostics.

### `OAI-C16` — Decisions API

- Natureza: endpoint `POST /v1/decisions` para respostas tipadas `predicate`, `choice` ou `score` a partir de texto e imagens.
- Aplicabilidade: hipótese futura de classificação ou avaliação delimitada; não substitui geração de conteúdo ou conversa dos workloads atuais.
- Maturidade: GA desde 22/10/2026, somente com `gpt-6-luna`; sem uso registrado no projeto. Até 400 perguntas por request, `input_json`, imagens nas instruções de cada pergunta e reutilização de entrada compartilhada documentados.
- Limites: exige comparação própria de qualidade, latência e probabilidades. A aceleração anunciada é referência do fornecedor, sem medição local; objetos JSON livres e tool calling continuam em Responses API. SDK mínimo documentado para JavaScript: 7.30.0.
- Integração de voz: desde 15/10/2026, GPT-Live pode delegar decisões nativamente ou dispará-las a partir de deltas de transcrição de entrada/saída; capacidade condicional descrita em `OAI-C18`, sem alterar workloads textuais.
- Fonte: changelog, guia oficial Decisions e Connect voice to Decisions.

### `OAI-C17` — Ultrafast para GPT-6.1 Sol

- Natureza: tier de processamento `service_tier: "ultrafast"` na Responses API, separado de modelo e effort.
- Aplicabilidade: comparação focal quando latência entre tokens for problema material e GPT-6.1 Sol já for candidato adequado.
- Maturidade: documentada desde 08/10/2026; disponível aos usuários API, sujeito a rate limits, com processamento global e residência US/EU.
- Limite: nenhum workload vigente usa GPT-6.1 Sol ou esse tier; disponibilidade não altera configuração nem autoriza adoção. Reconfirmar elegibilidade e medir benefício no recorte competente.
- Fontes: changelog e página oficial GPT-6.1 Sol.

### `OAI-C18` — GPT-Live: decisões durante conversa e vozes por descrição

- Natureza: GPT-Live integra decisões com `gpt-6-luna` durante a fala; desde 16/10/2026, criação de voz por descrição textual disponível aos clientes API para reutilização em sessões Live.
- Aplicabilidade: serviço futuro aprovado de voz/atendimento; pode avaliar intenção ou critério durante conversa e adaptar identidade vocal. Não há consumidor Live no projeto.
- Maturidade: capacidades documentadas no changelog de 15–16/10 e guias específicos; elegibilidade, idiomas, limites e versão do SDK exigem validação focal no caso real.
- Limites: novo canal exige consentimento, handoff, interrupção e controle de ações; descrição de voz não autoriza imitação de pessoa. Não substitui Responses ou `OAI-W08`, nem justifica streaming, sessão persistente ou agente novo agora.
- Fontes: changelog, Connect voice to Decisions e Custom voices oficiais. Sem adoção ou conteúdo financeiro.

### `OAI-C19` — Restrições de níveis de serviço por projeto/organização

- Natureza: desde 21/10/2026, configurações Platform podem restringir os tiers permitidos por projeto; a organização limita o que seus projetos podem habilitar.
- Aplicabilidade: verificar compatibilidade em revisão autorizada de workloads/tiers ou diante de rejeição da API. Disponibilidade do modelo não comprova permissão para usar um tier.
- Maturidade: documentada; política efetiva das contas do projeto não foi inspecionada.
- Limites: `auto` ou parâmetro omitido também depende do tier resolvido permitido. Não alterar settings, credenciais, allowlist ou configuração E21 nesta catalogação; nenhuma nova implementação recomendada sem caso e custo zero comprovados.
- Fontes: changelog e guia oficial Error codes.

## 5. Aplicabilidade e registro de decisões

| Workload | Baseline | Candidatos técnicos rastreados | Estado da comparação |
|---|---|---|---|
| resolvedor IA de nicho | `gpt-5.4-mini + none` | `OAI-M02`, `OAI-M03` e `OAI-M04`, com effort focal | não comparado nesta fotografia |
| ativação comercial | `gpt-5.4-mini + none` | `OAI-M02`, `OAI-M03` e `OAI-M04`, com effort focal | não comparado nesta fotografia |
| suficiência factual do catálogo por taxon (`OAI-W03`) | histórico: `gpt-5.6-terra + low` | — | workload retirado pela E22.7; sem aplicabilidade operacional corrente |
| Base de Comunicação, Etapa 1 | `gpt-5.4-mini + none` ativo em Preview e Production | sem candidato comparado nesta fotografia | operacional após E21/E25.1 |
| Base de Comunicação, Etapa 2 | `gpt-6-luna + max` ativo em Preview e Production | `gpt-6-sol + medium` comparado focalmente; `OAI-M09` ainda não comparado | comparação anterior concluída para `gpt-6-sol`; novo candidato `gpt-6.1-sol` não comparado nesta fotografia; `gpt-6-luna + max` permanece operacional |
| atendimento inicial por IA (`OAI-W08`) | `gpt-6-luna + xhigh` ativo em Preview e Production | sem novo candidato comparado nesta fotografia | configuração E10.12 validada; sem Web Search |

- Preservar o baseline atual até existir evidência suficiente e autorização no recorte competente.
- Usar o mesmo conjunto de tarefas representativas e os mesmos gates ao comparar candidatos.
- Registrar por execução: workload, modelo, effort, modo aplicável, validade do resultado, qualidade, intervenção humana, tokens, latência e estabilidade.
- Não generalizar o resultado de um workload para outro.
- Quando houver teste real, registrar aqui somente o resumo necessário para reproduzir a decisão; evidência extensa permanece no PR ou artefato do recorte.
- A decisão histórica de `gpt-5.6-luna + high` para `landing_page_dynamic_market_research` permanece rastreável nos commits e migrations E20.7, sem representar candidato, pendência ou configuração corrente após a E20.8.

### 5.1. PB-A/E25.1 — comparação isolada da Etapa 2 em Preview (28/09/2026 UTC)

- Workload: `communication_base_stage2_intelligence`. Comparação interna e temporária, em processamento Standard, na ordem `gpt-6-luna`/`max` e `gpt-6-sol`/`medium`. Ambos os pares estavam disponíveis no catálogo E21 (modelo v3, parâmetro v2). Na comparação de 28/09, o override ficou restrito ao QA administrativo no Preview; essa prova não promoveu configuração operacional.
- Os quatro casos usaram a mesma Base sintética e imutável por caso: `general_initial` sem rascunho, `general_update` com as sete seções atuais, `local_about` e `local_market_web` com alcance de seção única. A saída de uma chamada não entrou na entrada da seguinte. Prompt `e25_1_v3`, contrato 2, schema e política Web iguais entre candidatos. Hashes SHA-256 do prompt por caso, idênticos nos dois pares: `825c48b6bf72fb0057d1f9628666f7ead0393f4faafac456df34059132fa451a`, `2472d78c206086d06c96627cee7932b466e2a7d1b631605ab6a483d488dd407a`, `79e3460b5072b305bd45376197caa56b069c55972749a2818f50ebae3e858a27`, `b6b01c27cf6e4b991d36e69c95ea64457061920b82a2b0ea5554a50129c58656`, respectivamente.
- Validade e qualidade: as oito operações capturadas concluíram com resposta do provider e contrato válido. As ações gerais retornaram sete seções; as locais, somente a seção alvo. `about` permaneceu derivado dos fatos confirmados; os demais campos foram marcados como hipóteses. Não foi observada invenção de preço, credencial, prova ou resultado particular na inspeção focal. Ambos foram adequados; Luna produziu hipóteses mais desenvolvidas e, no caso Web, ligou a recomendação à comunicação observada de prestadores, ressalvando que isso não prova demanda. Sol foi mais conciso e trouxe hipóteses sobre chuvas e intervenções em árvores, de utilidade menos direta para o posicionamento pedido. A fonte [Ficus Paisagismo em Recife](https://www.ficuspaisagismo.com.br/manutencao-de-jardins/) confirma que há comunicação pública de manutenção periódica, poda e limpeza; a amostra de fontes de ambos inclui URLs pouco pertinentes e requer curadoria na apresentação. Esta é avaliação técnica focal de um caso sintético, sem alegar estabilidade estatística ou avaliação humana cega concluída.

| Caso | Validade A/B | Qualidade A/B | Utilidade A/B | Observação focal |
|---|---|---|---|---|
| Geração geral | válida / válida | adequada / adequada | boa / boa | As sete seções preservam fatos e hipóteses; A desenvolve mais a estratégia. |
| Atualização geral | válida / válida | adequada / adequada | boa / boa | Ambas usam o rascunho como contexto sem elevá-lo a fato confirmado. |
| Revisão `about` | válida / válida | adequada / adequada | boa / boa | Uma seção factual, com texto equivalente. |
| Revisão `market_insights` | válida / válida | superior / adequada | boa / moderada | A ancora melhor a hipótese em comunicação observada; B inclui temas de chuva e poda arbórea de utilidade menos direta. |

Na identificação interna, A corresponde a Luna/max e B a Sol/medium. Esta régua é uma avaliação técnica com identidade conhecida pelo executor; não representa avaliação humana cega E21.3. Não houve pontuação opaca nem generalização para outro workload.

| Par | Caso | Input / cache read / cache write / output / reasoning | Web / fontes | Latência |
|---|---|---:|---:|---:|
| Luna/max | Geração geral | 692 / 0 / 0 / 5316 / 4785 | 0 / 0 | 41.772 ms |
| Luna/max | Atualização geral | 818 / 0 / 0 / 3238 / 2773 | 0 / 0 | 25.466 ms |
| Luna/max | Revisão `about` | 442 / 0 / 0 / 797 / 748 | 0 / 0 | 6.835 ms |
| Luna/max | Revisão `market_insights` | 13456 / 4695 / 0 / 1945 / 1783 | 1 / 36 | 17.212 ms |
| Sol/medium | Geração geral | 692 / 0 / 0 / 810 / 352 | 0 / 0 | 12.877 ms |
| Sol/medium | Atualização geral | 818 / 0 / 0 / 587 / 215 | 0 / 0 | 12.049 ms |
| Sol/medium | Revisão `about` | 442 / 0 / 0 / 187 / 138 | 0 / 0 | 3.764 ms |
| Sol/medium | Revisão `market_insights` | 15064 / 0 / 4695 / 455 / 274 | 2 / 38 | 12.554 ms |

- As quatro operações capturadas totalizaram 91.285 ms para Luna e 41.244 ms para Sol. Essa amostra focal não estabelece estabilidade estatística. A evidência completa da decisão permanece no PR #978.
- Três envios anteriores pretendiam executar Sol, mas produziram somente registro de middleware, sem terminal, ID/usage ou resposta capturada; não integram as oito operações conclusivas. O recorder E21 foi injetado em memória somente para esta prova: `hostedLedgerWritten=false`; portanto, os casos desta comparação não escreveram eventos no ledger. Isso descreve a prova comparativa isolada de 28/09, não a cobertura operacional posterior dos workloads E25.1 em Preview e Production, registrada em `docs/roadmap.md` 25.1.4–25.1.5 e `docs/schema.md` 1.28.4.
- **Seleção técnica registrada para o único par candidato da Etapa 2: `gpt-6-luna`/`max` Standard.** Ambos cumpriram a validade e a qualidade mínima observadas; Luna apresentou melhor desenvolvimento das hipóteses neste recorte, enquanto Sol teve menor latência. A decisão integral permanece no PR #978. A comparação de 28/09 não ativou o workload. No estado posterior registrado nesta fotografia, `OAI-W06` (`gpt-5.4-mini`/`none`) e `OAI-W07` (`gpt-6-luna`/`max`) estão operacionais em Preview e Production após os gates E21/E25.1, a ativação e o QA hospedado; ver `docs/platform-config.md`, `docs/roadmap.md` 25.1.4–25.1.5 e `docs/schema.md` 1.28.4.

## 6. Manutenção semanal e limites

- O workflow semanal confronta esta fotografia com fontes oficiais e altera somente itens materialmente afetados.
- Cada item mantém ID estável, aplicabilidade, maturidade, limite e fonte; mudança de estado preserva rastreabilidade no diff e no PR da rodada.
- Ausência de mudança material gera justificativa no relatório da rodada, sem regravação, nova data ou PR artificial.
- O Gestor de Updates consulta este snapshot somente quando houver capacidade OpenAI relacionada ao plano avaliado e não o mantém.
- O Gestor de Automações consome primeiro as capacidades identificadas e valida focalmente, nas fontes oficiais atuais, apenas o necessário à decisão concreta; não repete a descoberta ampla.
- Nenhuma disponibilidade registrada neste documento autoriza implementação, ativação, mudança de modelo, alteração de effort, uso de tool ou nova arquitetura.
