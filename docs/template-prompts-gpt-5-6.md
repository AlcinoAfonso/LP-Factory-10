# Template complementar de prompts — GPT-5.6

Este documento complementa `docs/template-prompts.md`. O template geral continua sendo a referência obrigatória para objetivo, fontes, critérios de sucesso, limites, aprovação, entrega, parada, validação e concisão.

Este complemento não autoriza troca de modelo, alteração de runtime ou uso automático do GPT-5.6. A adoção depende de caso de uso, avaliação comparativa e aprovação própria.

Fontes conceituais:

- https://developers.openai.com/api/docs/guides/latest-model
- https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6
- https://developers.openai.com/api/docs/models

## 1. Quando aplicar

Use este complemento somente quando o GPT-5.6 estiver sendo avaliado ou aprovado para um workload específico.

Casos candidatos:

- trabalho profissional complexo com ganho esperado de qualidade
- geração de landing pages com julgamento estrutural, textual ou visual
- tarefas longas que exijam síntese, consistência e verificação
- workloads em que o modelo vigente não atinja o critério de sucesso

Não usar apenas porque o modelo é mais novo.

## 2. Seleção do modelo

Declare explicitamente o modelo candidato:

- `gpt-5.6-sol`: maior capacidade para trabalho complexo e qualidade prioritária
- `gpt-5.6-terra`: equilíbrio entre inteligência, custo e desempenho
- `gpt-5.6-luna`: tarefas de maior volume e maior sensibilidade a custo

Em produção, prefira o identificador explícito do modelo em vez do alias genérico quando estabilidade e rastreabilidade forem necessárias.

## 3. Configuração do workload

Defina somente as configurações relevantes:

- endpoint: Responses API como interface programática preferencial para novos workloads OpenAI; ativar raciocínio, tools, continuidade ou recursos de múltiplas etapas somente quando necessários ao caso
- `reasoning.effort` em migração: começar pela configuração de raciocínio efetivamente validada no workload existente e comparar a mesma configuração e um nível inferior sobre casos representativos
- `reasoning.effort` em workload novo: não herdar configuração de outro workload; na ausência de evidência própria, `medium` pode ser usado como hipótese inicial equilibrada de teste, sem constituir configuração preferencial ou aprovação antecipada; testar níveis diferentes somente quando os critérios de qualidade, custo ou latência justificarem a comparação
- `reasoning.mode: pro`: considerar apenas para casos difíceis em que qualidade justifique maior custo e latência
- `reasoning.context`: usar somente quando o raciocínio anterior permanecer relevante entre chamadas
- `text.verbosity`: usar `low`, `medium` ou `high` somente quando houver necessidade de controlar o nível geral de detalhe; requisitos específicos de conteúdo, tamanho ou estrutura permanecem no prompt
- saída estruturada: usar quando o consumidor exigir contrato determinístico
- tools: expor somente as necessárias ao caso
- limite de saída: dimensionar pelo contrato real, sem inflar preventivamente

## 4. Ajustes específicos do prompt

Além do template geral:

- indique quando uma ambiguidade importante deve gerar pergunta ou parada
- evite prescrever cada etapa interna quando o resultado e os limites já estiverem claros

## 5. Template complementar preenchível

Use apenas os campos necessários:

### 5.1. Caso de uso

- workload:
- resultado esperado:
- motivo para avaliar GPT-5.6:

### 5.2. Modelo e configuração

- modelo candidato:
- modelo baseline:
- `reasoning.effort`:
- modo `pro`, se aplicável:
- `reasoning.context`, se aplicável:
- `text.verbosity`, se aplicável:
- saída estruturada:
- tools permitidas:
- orçamento de custo, latência ou tokens:

### 5.3. Avaliação

- casos representativos:
- critérios de qualidade:
- métricas de custo e latência:
- comparação com o baseline:
- condição de aprovação:
- fallback:

## 6. Critérios de adoção

Não alterar o runtime antes de comprovar, com os mesmos casos representativos:

- qualidade igual ou superior ao baseline ou ao critério mínimo definido para workload novo
- custo e latência aceitáveis
- estabilidade entre execuções
- preservação dos contratos de saída
- ausência de regressão funcional ou de segurança

Para `reasoning.effort`, aplicar a regra da seção 3 e escolher a configuração final pelo resultado medido do workload.

## 7. Limites

Este documento não autoriza:

- substituir o `gpt-5.4-mini` vigente
- habilitar `max`, modo `pro`, multiagente, cache explícito ou raciocínio persistido sem caso de uso aprovado
- criar nova infraestrutura
- aumentar tokens ou custo sem avaliação
- usar GPT-5.6 em todas as etapas da geração de LP

A escolha pode variar por etapa. Classificação, validação e tarefas estruturadas podem permanecer em modelos menores quando atenderem aos critérios do produto.
