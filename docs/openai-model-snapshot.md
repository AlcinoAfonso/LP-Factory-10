# OpenAI Model Snapshot — LP Factory 10

## 1. Autoridade, validade e fontes

- Data da fotografia técnica preservada: 14/09/2026.
- Reorganizado em 22/09/2026 para a cobertura semanal da E24.1.
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
  - `https://developers.openai.com/api/docs/guides/reasoning`
  - `https://developers.openai.com/api/docs/guides/tools-web-search`
  - `https://openai.com/api-fast-mode/`
  - `https://openai.github.io/openai-agents-js/`
  - `https://openai.com/pt-BR/index/gpt-5-6/`

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
| `OAI-W03` | `taxon_input_catalog_sufficiency_evaluation` | `gpt-5.6-terra + low` | operacional | `lib/openai-workloads/registry.ts`, E20.8.7 e `docs/platform-config.md` |
| `OAI-W04` | `supabase_inspect` | `gpt-4.1-mini + not_applicable` | referência operacional externa | `lib/openai-workloads/registry.ts`, `docs/automations.md` e `docs/platform-config.md` |
| `OAI-W05` | `landing_page_dynamic_market_research` | configuração encerrada pela E20.8 | histórica | commits e migrations da E20.7 |

- O registry usa fonte `repo_catalog` no baseline e revisão própria por workload, conforme a governança da E21.1.
- `supabase_inspect` é uma referência de inventário para workflow operacional separado do Core, com fonte `github_actions_default_reference`; não é baseline de workload de produto nem autorização para alterar o workflow.
- `landing_page_dynamic_market_research` não integra o registry nem a configuração efetiva corrente; seus registros anteriores permanecem somente como histórico.
- Variáveis legadas de modelo não são fonte runtime atual; seu estado operacional permanece exclusivamente em `docs/platform-config.md`.

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
| `OAI-M03` | `gpt-5.6-terra` | equilíbrio de capacidade para casos que justifiquem comparação própria | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | operacional em `OAI-W03` | documentação específica do modelo |
| `OAI-M04` | `gpt-5.6-sol` | trabalho profissional complexo que justifique comparação própria | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` | documentada | documentação específica do modelo |
| `OAI-M05` | `gpt-4.1-mini` | referência externa do workflow `OAI-W04`; não é baseline de produto | 1.047.576 | 32.768 | não aplicável; modelo sem etapa de reasoning | referência operacional externa | documentação específica do modelo e `lib/openai-workloads/registry.ts` |

- Luna, Terra e Sol documentam Responses API, function calling, Structured Outputs e reasoning tokens.
- Em GPT-5.6, o effort padrão documentado é `medium` quando omitido; comparações devem registrar o valor explicitamente.
- Para `gpt-5.4-mini`, o padrão documentado é `none` quando o parâmetro é omitido.
- `gpt-4.1-mini` é um modelo não reasoning; a referência operacional externa `OAI-W04` não deve receber `reasoning.effort`.
- Limites e capacidades são voláteis e devem ser reconfirmados na fonte oficial focal antes de uma decisão material.

## 4. APIs, tools e capacidades agentic

### `OAI-C01` — Responses API

- Natureza: API de execução textual e multimodal usada como base programática preferencial do projeto.
- Aplicabilidade: workloads server-side com contrato e guardrails definidos pelo recorte.
- Maturidade: operacional em `OAI-W01`, `OAI-W02` e `OAI-W03`.
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
- Maturidade: operacional de forma delimitada em `OAI-W03`.
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

- Natureza: reutilização de prefixos estáveis e repetidos do contexto.
- Aplicabilidade: workloads com contexto repetitivo e benefício técnico mensurável.
- Maturidade: condicional.
- Limite: não é memória escolhida pelo modelo nem mecanismo de pausa do workflow.
- Fonte: Model guidance.

### `OAI-C09` — Agents SDK

- Natureza: framework para turns, tools, guardrails, handoffs, sessions e tracing.
- Aplicabilidade: somente quando essas capacidades reduzirem complexidade líquida em problema agentic real.
- Maturidade: documentada; não é evolução automática de Responses API.
- Limite: adoção exige recorte próprio e não substitui backend determinístico suficiente.
- Fonte: documentação oficial Agents SDK para JavaScript.

### `OAI-C10` — Padrão multi-agent

- Natureza: decomposição de trabalho complexo em frentes independentes com síntese.
- Aplicabilidade: tarefas realmente separáveis que se beneficiem de execução paralela.
- Maturidade: condicional.
- Limite: não presumir ganho quando as etapas forem fortemente dependentes.
- Fontes: Model guidance e documentação Agents SDK.

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

## 5. Aplicabilidade e registro de decisões

| Workload | Baseline | Candidatos técnicos rastreados | Estado da comparação |
|---|---|---|---|
| resolvedor IA de nicho | `gpt-5.4-mini + none` | `OAI-M02`, `OAI-M03` e `OAI-M04`, com effort focal | não comparado nesta fotografia |
| ativação comercial | `gpt-5.4-mini + none` | `OAI-M02`, `OAI-M03` e `OAI-M04`, com effort focal | não comparado nesta fotografia |
| suficiência factual do catálogo por taxon | `gpt-5.6-terra + low` | modelos e efforts que o recorte competente justificar | configuração própria da E20.8.7/E21.2 |

- Preservar o baseline atual até existir evidência suficiente e autorização no recorte competente.
- Usar o mesmo conjunto de tarefas representativas e os mesmos gates ao comparar candidatos.
- Registrar por execução: workload, modelo, effort, modo aplicável, validade do resultado, qualidade, intervenção humana, tokens, latência e estabilidade.
- Não generalizar o resultado de um workload para outro.
- Quando houver teste real, registrar aqui somente o resumo necessário para reproduzir a decisão; evidência extensa permanece no PR ou artefato do recorte.
- A decisão histórica de `gpt-5.6-luna + high` para `landing_page_dynamic_market_research` permanece rastreável nos commits e migrations E20.7, sem representar candidato, pendência ou configuração corrente após a E20.8.

## 6. Manutenção semanal e limites

- O workflow semanal confronta esta fotografia com fontes oficiais e altera somente itens materialmente afetados.
- Cada item mantém ID estável, aplicabilidade, maturidade, limite e fonte; mudança de estado preserva rastreabilidade no diff e no PR da rodada.
- Ausência de mudança material gera justificativa no relatório da rodada, sem regravação, nova data ou PR artificial.
- O Gestor de Updates consulta este snapshot somente quando houver capacidade OpenAI relacionada ao plano avaliado e não o mantém.
- O Gestor de Automações consome primeiro as capacidades identificadas e valida focalmente, nas fontes oficiais atuais, apenas o necessário à decisão concreta; não repete a descoberta ampla.
- Nenhuma disponibilidade registrada neste documento autoriza implementação, ativação, mudança de modelo, alteração de effort, uso de tool ou nova arquitetura.
