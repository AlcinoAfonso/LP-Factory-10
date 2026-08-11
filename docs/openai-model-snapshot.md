# OpenAI Model Snapshot — LP Factory 10

## 1. Objetivo e validade

- Data do snapshot: 09/08/2026.
- Objetivo: manter uma fotografia curta e datada para decisões de custo-desempenho dos workloads OpenAI do LP Factory 10.
- Este documento compara candidatos; não define sozinho o modelo em produção e não autoriza migração, implementação ou mudança de arquitetura.
- A configuração efetivamente adotada continua registrada em `docs/platform-config.md`; a governança da decisão continua em `docs/gestor-automations.md`.
- Preços, modelos, capacidades e parâmetros são voláteis. Antes de qualquer decisão, reconfirmar os valores nas fontes oficiais atuais e atualizar este snapshot quando houver mudança material.
- Fontes oficiais iniciais:
  - `https://developers.openai.com/api/docs/guides/latest-model`
  - `https://developers.openai.com/api/docs/models`
  - `https://developers.openai.com/api/docs/models/gpt-5.4-mini`
  - `https://developers.openai.com/api/docs/models/gpt-5.6-luna`
  - `https://developers.openai.com/api/docs/models/gpt-5.6-terra`
  - `https://developers.openai.com/api/docs/models/gpt-5.6-sol`
  - `https://developers.openai.com/api/docs/guides/reasoning`
  - `https://openai.com/pt-BR/index/advancing-the-price-performance-frontier-with-gpt-5-6/`

## 2. Baseline atual do projeto

### 2.1 Workloads registrados

- `OPENAI_NICHE_RESOLVER_MODEL` → referência atual `gpt-5.4-mini`.
- `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL` → configurado atualmente com `gpt-5.4-mini`.
- `OPENAI_COMMERCIAL_ACTIVATION_MODEL` → referência atual `gpt-5.4-mini`.
- Fonte operacional: `docs/platform-config.md`.

### 2.2 Regra de baseline

- O `gpt-5.4-mini` permanece como baseline até decisão específica por workload.
- O effort efetivamente usado deve ser confirmado na requisição real antes de cada comparação; não inferir configuração apenas pelo modelo.
- Na documentação atual da OpenAI, `gpt-5.4-mini` suporta `none`, `low`, `medium`, `high` e `xhigh`, com `none` como padrão quando o parâmetro é omitido.

## 3. Snapshot de modelos e custos

### 3.1 Preços e capacidades principais

| Modelo | Papel de referência | Input / 1M | Cached input / 1M | Output / 1M | Contexto | Saída máx. | Reasoning effort |
|---|---|---:|---:|---:|---:|---:|---|
| `gpt-5.4-mini` | baseline atual | US$ 0,75 | US$ 0,075 | US$ 4,50 | 400k | 128k | `none`, `low`, `medium`, `high`, `xhigh` |
| `gpt-5.6-luna` | custo/alto volume | US$ 0,20 | US$ 0,02 | US$ 1,20 | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` |
| `gpt-5.6-terra` | equilíbrio inteligência/custo | US$ 2,00 | US$ 0,20 | US$ 12,00 | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` |
| `gpt-5.6-sol` | maior capacidade / trabalho complexo | US$ 5,00 | US$ 0,50 | US$ 30,00 | 1,05M | 128k | `none`, `low`, `medium`, `high`, `xhigh`, `max` |

- Luna, Terra e Sol suportam Responses API, function calling, Structured Outputs e reasoning tokens.
- A orientação oficial atual posiciona Luna para workloads sensíveis a custo e volume, Terra para equilíbrio entre inteligência e custo e Sol para maior capacidade em trabalho profissional complexo.
- Em GPT-5.6, o effort padrão é `medium` quando omitido. Portanto, comparações devem sempre registrar o effort explicitamente.

### 3.2 Como o effort afeta custo

- O nível de `reasoning.effort` não cria uma tarifa por token diferente para o mesmo modelo.
- O effort pode alterar a quantidade de reasoning tokens, a latência e o custo total da chamada.
- Reasoning tokens são cobrados como output tokens e aparecem em `usage.output_tokens_details.reasoning_tokens`.
- A unidade correta de comparação é `workload + modelo + effort`, e não apenas o nome do modelo.
- Para GPT-5.6, prompts acima de 272k tokens de entrada têm multiplicadores de preço informados nas páginas atuais dos modelos; confirmar a regra vigente quando o workload puder atingir essa faixa.
- O modo Fast do GPT-5.6 Sol é uma opção separada de latência: o anúncio de 30/07/2026 informa até 2,5x mais velocidade pelo dobro do preço do processamento Standard, sem mudança de inteligência. Não tratar Fast como padrão.

### 3.3 Fórmula mínima de custo

- Entrada comum: `(input_tokens - cached_tokens) × tarifa_input`.
- Entrada cacheada: `cached_tokens × tarifa_cached_input`.
- Saída total: `output_tokens × tarifa_output`.
- `output_tokens` inclui os reasoning tokens contabilizados pela API.
- Custo total estimado: soma das três parcelas, acrescida de custos de tools ou modos especiais quando aplicáveis.

## 4. Comparação por workload e registro de resultados

### 4.1 Protocolo mínimo

- Usar o mesmo conjunto de tarefas representativas e os mesmos gates de validade para comparar candidatos.
- Preservar o modelo atual como baseline até existir evidência suficiente para substituí-lo.
- Para GPT-5.6, testar `reasoning.effort` explicitamente; usar esforço maior somente quando houver ganho de qualidade mensurável.
- Registrar por execução: workload, modelo, effort, modo quando aplicável, resultado válido, critério de qualidade, `input_tokens`, `cached_tokens`, `output_tokens`, `reasoning_tokens`, latência e custo estimado.
- Escolher a combinação mais simples e econômica que cumpra o resultado, a qualidade, a segurança e a latência exigidos pelo workload.
- Não generalizar o vencedor de um workload para outro.

### 4.2 Workloads iniciais para comparação

| Workload | Baseline atual | Candidatos de referência | Resultado vigente |
|---|---|---|---|
| resolvedor IA de nicho | `gpt-5.4-mini` | Luna / Terra / Sol + effort aplicável | não comparado neste snapshot |
| perfil de orientação de landing page | `gpt-5.4-mini` | Luna / Terra / Sol + effort aplicável | não comparado neste snapshot |
| ativação comercial | `gpt-5.4-mini` | Luna / Terra / Sol + effort aplicável | não comparado neste snapshot |

### 4.3 Registro de decisão

- Quando houver teste real, registrar somente o resumo necessário para reproduzir a decisão: data, workload, baseline, combinações comparadas, gates, métricas principais e combinação vencedora.
- Resultados detalhados ou evidências extensas devem permanecer no PR ou artefato do recorte; este documento mantém apenas o snapshot decisório.
- Se preços ou capacidades mudarem, atualizar a seção 3 sem apagar decisões históricas já sustentadas por testes; marcar a data da nova fotografia.

## 5. Laboratório futuro de avaliação de custo-benefício

### 5.1 Finalidade

- Preservar como capacidade futura um laboratório de avaliação que substitua escolhas intuitivas de configuração por decisões baseadas em evidência para cada workload real.
- A unidade mínima de comparação continua sendo `workload + modelo + reasoning effort`, conforme a seção 3.2; não comparar apenas nomes de modelos.
- Exemplos conceituais de combinações comparáveis incluem `GPT-5.6 Terra + medium`, `GPT-5.6 Terra + high`, `GPT-5.6 Sol + medium` e `GPT-5.6 Sol + high`, sem transformá-las em candidatos permanentes ou preferência antecipada.
- Princípio de decisão: medir antes de promover uma combinação de modelo + effort como configuração preferencial.

### 5.2 Métricas e método

- O laboratório deverá aplicar o protocolo da seção 4.1 e as regras de custo das seções 3.2 e 3.3 sobre a mesma tarefa representativa, mantendo constantes as demais variáveis sempre que possível.
- Para cada combinação testada, avaliar: qualidade da entrega, taxa de sucesso, necessidade de correção humana, `input_tokens`, `cached input tokens` quando aplicável, `output_tokens`, `reasoning_tokens`, custo financeiro efetivo, latência e estabilidade/repetibilidade.
- O preço unitário dos tokens é determinado pelo modelo; alterar o reasoning effort não cria tarifa unitária própria.
- Effort maior pode produzir mais reasoning/output tokens e, portanto, elevar o custo financeiro total; também pode aumentar a latência.
- Reasoning tokens fazem parte dos output tokens e não constituem uma terceira tarifa independente.

| Configuração conceitual | Qualidade | Custo | Latência |
|---|---|---|---|
| Terra + medium | medir | medir | medir |
| Terra + high | medir | medir | medir |
| Sol + medium | medir | medir | medir |
| Sol + high | medir | medir | medir |

### 5.3 Perguntas de decisão

- O ganho de `high` sobre `medium` justifica custo e espera adicionais?
- Terra + high entrega resultado equivalente a Sol + medium por custo menor?
- Quais workloads realmente precisam de configurações mais fortes?
- Quais workloads podem operar com modelos ou esforços mais econômicos sem perder os gates exigidos?

### 5.4 Escopo e limites

- Esta seção registra somente uma capacidade futura de avaliação; não representa laboratório já implementado.
- Não define banco, tabela, rota, dashboard, job, engine, agente, automação, migration, código de benchmarking ou nova infraestrutura.
- A forma de implementação do laboratório permanece em aberto para decisão futura baseada no recorte que vier a planejá-lo.
- O escopo atual deste documento permanece nos workloads do produto/API. Codex App, tasks e custom agents podem ser extensão futura do conceito, mas seu consumo e sua cobrança não devem ser tratados como equivalentes aos custos da API sem verificação específica.

### 5.5 Governança e fonte dinâmica

- O laboratório deve apoiar decisões futuras por workload; não transforma um modelo em padrão universal, `high` ou `max` em effort padrão nem o modelo mais caro em escolha automática para tarefas críticas.
- Não manter nesta seção catálogo permanente de preços, modelos disponíveis, efforts, parâmetros ou capacidades específicas da API; esses elementos permanecem voláteis conforme a seção 1.
- Quando o laboratório vier a ser planejado ou implementado, consultar a documentação oficial vigente da OpenAI, preferencialmente via `$openai-docs` no Codex.
- O registro interno deve preservar principalmente objetivo, critérios, método, métricas e princípios de decisão.
