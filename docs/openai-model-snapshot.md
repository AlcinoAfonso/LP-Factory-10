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

### 5.1. PB-A/E25.1 — comparação isolada da Etapa 2 em Preview (28/09/2026 UTC)

- Workload: `communication_base_stage2_intelligence`. Comparação interna e temporária, em processamento Standard, na ordem `gpt-6-luna`/`max` e `gpt-6-sol`/`medium`. Ambos os pares estavam disponíveis no catálogo E21 (modelo v3, parâmetro v2). O override ficou restrito ao QA administrativo no Preview; nenhuma configuração operacional foi promovida.
- Os quatro casos usaram a mesma Base sintética e imutável por caso: `general_initial` sem rascunho, `general_update` com as sete seções atuais, `local_about` e `local_market_web` com alcance de seção única. A saída de uma chamada não entrou na entrada da seguinte. Prompt `e25_1_v3`, contrato 2, schema e política Web iguais entre candidatos. Hashes SHA-256 do prompt por caso, idênticos nos dois pares: `825c48b6bf72fb0057d1f9628666f7ead0393f4faafac456df34059132fa451a`, `2472d78c206086d06c96627cee7932b466e2a7d1b631605ab6a483d488dd407a`, `79e3460b5072b305bd45376197caa56b069c55972749a2818f50ebae3e858a27`, `b6b01c27cf6e4b991d36e69c95ea64457061920b82a2b0ea5554a50129c58656`, respectivamente.
- Validade e qualidade antes do custo: as oito operações capturadas concluíram com resposta do provider e contrato válido. As ações gerais retornaram sete seções; as locais, somente a seção alvo. `about` permaneceu derivado dos fatos confirmados; os demais campos foram marcados como hipóteses. Não foi observada invenção de preço, credencial, prova ou resultado particular na inspeção focal. Ambos foram adequados; Luna produziu hipóteses mais desenvolvidas e, no caso Web, ligou a recomendação à comunicação observada de prestadores, ressalvando que isso não prova demanda. Sol foi mais conciso e trouxe hipóteses sobre chuvas e intervenções em árvores, de utilidade menos direta para o posicionamento pedido. A fonte [Ficus Paisagismo em Recife](https://www.ficuspaisagismo.com.br/manutencao-de-jardins/) confirma que há comunicação pública de manutenção periódica, poda e limpeza; a amostra de fontes de ambos inclui URLs pouco pertinentes e requer curadoria na apresentação. Esta é avaliação técnica focal de um caso sintético, sem alegar estabilidade estatística ou avaliação humana cega concluída.

| Caso | Validade A/B | Qualidade A/B | Utilidade A/B | Observação focal |
|---|---|---|---|---|
| Geração geral | válida / válida | adequada / adequada | boa / boa | As sete seções preservam fatos e hipóteses; A desenvolve mais a estratégia. |
| Atualização geral | válida / válida | adequada / adequada | boa / boa | Ambas usam o rascunho como contexto sem elevá-lo a fato confirmado. |
| Revisão `about` | válida / válida | adequada / adequada | boa / boa | Uma seção factual, com texto equivalente. |
| Revisão `market_insights` | válida / válida | superior / adequada | boa / moderada | A ancora melhor a hipótese em comunicação observada; B inclui temas de chuva e poda arbórea de utilidade menos direta. |

Na identificação interna, A corresponde a Luna/max e B a Sol/medium. Esta régua é uma avaliação técnica com identidade conhecida pelo executor; não representa avaliação humana cega E21.3. Não houve pontuação opaca nem generalização para outro workload.

| Par | Caso | Input / cache read / cache write / output / reasoning | Web / fontes | Latência | Custo E21 USD |
|---|---|---:|---:|---:|---:|
| Luna/max | Geração geral | 692 / 0 / 0 / 5316 / 4785 | 0 / 0 | 41.772 ms | 0.0027272 |
| Luna/max | Atualização geral | 818 / 0 / 0 / 3238 / 2773 | 0 / 0 | 25.466 ms | 0.0017008 |
| Luna/max | Revisão `about` | 442 / 0 / 0 / 797 / 748 | 0 / 0 | 6.835 ms | 0.0004427 |
| Luna/max | Revisão `market_insights` | 13456 / 4695 / 0 / 1945 / 1783 | 1 / 36 | 17.212 ms | 0.01189555 |
| Sol/medium | Geração geral | 692 / 0 / 0 / 810 / 352 | 0 / 0 | 12.877 ms | 0.009484 |
| Sol/medium | Atualização geral | 818 / 0 / 0 / 587 / 215 | 0 / 0 | 12.049 ms | 0.007506 |
| Sol/medium | Revisão `about` | 442 / 0 / 0 / 187 / 138 | 0 / 0 | 3.764 ms | 0.002754 |
| Sol/medium | Revisão `market_insights` | 15064 / 0 / 4695 / 455 / 274 | 2 / 38 | 12.554 ms | 0.0570255 |

- Soma das quatro operações capturadas: Luna USD 0.01676625 e 91.285 ms; Sol USD 0.07676950 e 41.244 ms. Sol foi aproximadamente 2,2 vezes mais rápido; Luna custou aproximadamente 4,6 vezes menos neste recorte. O custo foi calculado pelo E21 sobre usage e chamadas Web reais, com tabela `2026-09-27-standard-v2`, coerente com as [tarifas oficiais Standard e Web Search](https://developers.openai.com/api/docs/pricing) consultadas em 28/09/2026 UTC. São custos atribuídos às operações capturadas, não extrato de cobrança.
- Três envios anteriores pretendiam executar Sol, mas produziram somente registro de middleware, sem terminal, ID/usage ou resposta capturada; o middleware não comprova nem o candidato efetivo nem chamada ao provider. Outros envios do formulário antigo também ficaram sem terminal verificável. Todos permanecem inconclusivos, com custo potencial desconhecido, e não integram as oito linhas ou suas somas. O recorder E21 foi injetado em memória somente para esta prova: `hostedLedgerWritten=false`. Nenhum resultado, prompt ou resposta integral foi gravado no banco ou em logs; ainda não existe cobertura hospedada E21.5 para os novos workloads.
- **Seleção técnica para o único par candidato da Etapa 2: `gpt-6-luna`/`max` Standard.** Ambos cumpriram a validade e a qualidade mínima observadas; a vantagem de latência de Sol não compensou o custo 4,6 vezes maior e o ganho de conteúdo não demonstrado neste caso. Esta seleção não ativa o workload. Candidata, prova, revisão validada e ativação humana continuam sob o lifecycle E21.2.5, após merge/apply autorizados, cobertura financeira prospectiva e QA hospedado. A UI do cliente oferece somente ações funcionais da Base, sem modelo, effort ou escolha de configuração.

## 6. Manutenção semanal e limites

- O workflow semanal confronta esta fotografia com fontes oficiais e altera somente itens materialmente afetados.
- Cada item mantém ID estável, aplicabilidade, maturidade, limite e fonte; mudança de estado preserva rastreabilidade no diff e no PR da rodada.
- Ausência de mudança material gera justificativa no relatório da rodada, sem regravação, nova data ou PR artificial.
- O Gestor de Updates consulta este snapshot somente quando houver capacidade OpenAI relacionada ao plano avaliado e não o mantém.
- O Gestor de Automações consome primeiro as capacidades identificadas e valida focalmente, nas fontes oficiais atuais, apenas o necessário à decisão concreta; não repete a descoberta ampla.
- Nenhuma disponibilidade registrada neste documento autoriza implementação, ativação, mudança de modelo, alteração de effort, uso de tool ou nova arquitetura.
