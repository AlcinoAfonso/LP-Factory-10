24/08/2026 — Rascunho vivo — E21.3 — Evidências e avaliação de custo-benefício dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo do futuro plano-base v1; debate humano em andamento.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.3 — Evidências e avaliação de custo-benefício dos workloads OpenAI`.
- Plano conceitual: N/A.
- Base de abertura: `main@7dc40560d71a68bdd417ca9b6e8092727dde13ce`, após o fechamento documental da E21.2.5.
- A E21.2.5 permanece concluída e não é reaberta por este recorte.

### 1.2. Fontes de visão e contrato

- `README.md` — visão, princípios do MVP e menor complexidade suficiente.
- `docs/roadmap.md` — objetivo, métricas, primeiro caso real e limites atuais da E21.3.
- `docs/openai-model-snapshot.md` — protocolo comparativo, unidade `workload + modelo + parâmetro`, preços/capacidades datados e residência do snapshot decisório.
- `docs/lousa-plano-base-e21-2-5.md` — catálogo administrável e lifecycle humano já concluídos.
- `docs/base-tecnica.md` — boundary transversal `lib/openai-workloads/`, observabilidade e separação entre configuração e execução.
- `docs/template-roadmap.md` e `docs/prompt-estrategista.md` — hierarquia e processo do plano-base.

### 1.3. Objetivo prático aprovado no debate

- Substituir escolhas intuitivas de modelo e parâmetro por comparações reproduzíveis por workload real.
- Identificar a menor configuração que cumpra qualidade, validade, segurança e latência exigidas pelo workload, considerando também custo e estabilidade.
- Não buscar um vencedor universal entre modelos.
- A unidade textual de comparação permanece `workload + modelo + reasoning effort`.
- Workloads de imagem preservam unidade e métricas próprias, sem herdar reasoning effort.

### 1.4. Primeiro caso e sequência aprovada

- Primeiro caso real: `landing_page_draft_generation` da E19.4.
- Pergunta inicial de negócio: a configuração textual atual pode ser reduzida em modelo e/ou effort sem perda material de qualidade?
- O teste da geração de imagem `landing_page_draft_image_generation` fica preservado como etapa posterior, separada, após o método textual demonstrar utilidade.
- A E19.4 não é reaberta; ela fornece o workload real de referência.

### 1.5. Decisões de experiência já aceitas

- O humano escolhe o workload e um conjunto pequeno de configurações relevantes para comparação, preferencialmente entre 2 e 6 combinações elegíveis no catálogo E21.2.5.
- Todas as configurações recebem o mesmo caso representativo, com as mesmas entradas, contrato funcional e gates de validade.
- A UX prioriza primeiro a comparação da entrega e da qualidade; métricas de eficiência aparecem depois, evitando otimizar custo de um resultado pior.
- As entregas devem ser comparáveis lado a lado.
- A avaliação humana registra, no mínimo, resultado válido, qualidade percebida e necessidade de correção humana.
- A visão de eficiência considera, quando disponíveis, input tokens, cached tokens, output tokens, reasoning tokens, latência, custo financeiro e estabilidade/repetibilidade.
- A conclusão deve recomendar uma configuração e explicar o trade-off observado, sem ativá-la automaticamente.
- Qualquer mudança operacional continua passando pelo lifecycle E21.2.5: candidata → prova → revisão validada → ativação humana.
- `docs/openai-model-snapshot.md` permanece a residência do resumo decisório reproduzível; evidência extensa pode permanecer no PR ou artefato do recorte.

### 1.6. Questões ainda abertas no debate

- Definir se a avaliação qualitativa será cega quanto ao nome do modelo/configuração até o humano registrar sua percepção, reduzindo viés de marca/custo.
- Definir a régua humana mínima de qualidade: somente `aprovado/reprovado + correção humana`, escala curta de qualidade, ou combinação das duas.
- Definir quantas repetições mínimas por configuração são necessárias para considerar estabilidade sem inflar custo do MVP.
- Definir o conjunto representativo inicial da geração textual de LP: quantidade de casos e critérios para não favorecer uma configuração específica.
- Definir a residência física da UX sem criar rota nova: extensão controlada da superfície existente `/admin/workloads-openai` ou outra composição já existente e autorizada pelo projeto.
- Definir como apresentar custo quando a tarifa oficial estiver divergente ou não confirmada: bloquear conclusão financeira ou registrar apenas usage/latência até reconfirmação.

## 2. Contrato do caso

### 2.1. Fluxo conceitual da comparação textual

- Gatilho: `platform_admin` decide avaliar uma configuração de um workload real já governado pela E21.2.5.
- Entrada: workload, configurações candidatas elegíveis, caso(s) representativo(s), contrato funcional vigente e critérios humanos de avaliação.
- Processamento: executar o mesmo caso em cada configuração selecionada, mantendo constantes as demais variáveis sempre que possível, e coletar a observabilidade segura já disponível.
- Validação: rejeitar comparação se os casos, entradas, contrato ou critérios mudarem entre as configurações; separar falha técnica de resultado funcional inválido.
- Persistência: não criar banco, tabela ou segunda residência neste recorte; o resumo decisório final pertence a `docs/openai-model-snapshot.md` e a evidência extensa pode permanecer no PR/artefato da execução.
- Consumo: humano compara qualidade primeiro, depois eficiência, e decide se alguma configuração merece seguir para o lifecycle operacional E21.2.5.
- Fallback: ausência de evidência suficiente preserva a configuração ativa atual; não há promoção automática nem troca silenciosa de baseline.

### 2.2. Métricas mínimas

- Qualidade:
  - resultado funcional válido;
  - avaliação humana de qualidade;
  - necessidade de correção humana.
- Eficiência:
  - `input_tokens`;
  - `cached_tokens`, quando aplicável;
  - `output_tokens`;
  - `reasoning_tokens`, quando aplicável;
  - latência;
  - custo financeiro efetivo ou estimado somente quando a tarifa aplicável estiver confirmada;
  - estabilidade/repetibilidade.
- Métricas indisponíveis permanecem explicitamente ausentes; não inferir valores.

### 2.3. Regra de decisão

- Não somar todas as métricas em uma pontuação universal opaca.
- Primeiro eliminar configurações que não cumpram validade, segurança ou qualidade mínima.
- Entre as configurações aprovadas, favorecer a menor configuração que mantenha qualidade suficiente com melhor relação de custo, latência e estabilidade.
- Ganho pequeno de qualidade não justifica automaticamente aumento desproporcional de custo ou latência.
- A recomendação é específica do workload e do conjunto de casos avaliados.

### 2.4. UX conceitual

- Etapa 1 — escolher workload:
  - exibir configuração ativa apenas como baseline de referência;
  - não alterar o lifecycle nesta etapa.
- Etapa 2 — escolher configurações:
  - selecionar de 2 a 6 combinações elegíveis no catálogo E21.2.5;
  - não derivar combinações fora do catálogo vigente.
- Etapa 3 — escolher caso(s) representativo(s):
  - reutilizar entradas reais ou fixtures autorizadas do próprio workload;
  - manter o mesmo conjunto para todas as configurações.
- Etapa 4 — executar e comparar entregas:
  - apresentar resultados lado a lado;
  - permitir avaliação humana antes de destacar custo.
- Etapa 5 — mostrar eficiência:
  - apresentar usage, reasoning, latência, custo quando válido e estabilidade.
- Etapa 6 — concluir:
  - apresentar configuração recomendada, motivos e trade-offs;
  - oferecer somente continuação humana para o lifecycle E21.2.5, sem ativação automática.

### 2.5. Critérios de experiência

- A experiência deve ser compreensível por função de negócio, sem exigir que o humano interprete IDs técnicos como informação principal.
- Modelo e effort permanecem visíveis quando necessários para a decisão, mas a avaliação de qualidade não deve ser induzida por custo ou força presumida do modelo.
- Desktop deve favorecer comparação lado a lado; mobile pode empilhar resultados sem perder a associação entre configuração, avaliação e métricas.
- Estados de execução, erro, resultado inválido e conclusão precisam ser explícitos e não podem apagar resultados anteriores da mesma comparação em andamento sem aviso.
- Nenhum estado de UI deve sugerir que uma recomendação já foi ativada em Production.

## 3. Fases e próxima ação

### 3.1. E21.3.3 — Comparação representativa do workload textual de Landing Page

- Objetivo: materializar o menor fluxo útil para comparar configurações do `landing_page_draft_generation` com o mesmo caso representativo, avaliação humana e métricas operacionais suficientes para uma decisão reproduzível.
- Automação: não.
- Estado: em debate; não implementar antes da consolidação e aprovação do plano-base.
- Critérios mínimos previstos:
  - preservar a configuração ativa como baseline até decisão humana posterior;
  - usar somente configurações elegíveis no catálogo E21.2.5;
  - manter entradas e contrato constantes por comparação;
  - coletar observabilidade segura reutilizando E21.1;
  - separar qualidade de eficiência na UX;
  - registrar decisão reproduzível no snapshot sem nova residência operacional;
  - validar desktop/mobile, papel positivo/negativo e ausência de efeito no lifecycle durante a comparação.

### 3.2. E21.3.4 — Comparação do workload de imagem da Landing Page

- Objetivo: aplicar o método validado da fase textual ao `landing_page_draft_image_generation`, respeitando métricas e parâmetros próprios de mídia.
- Automação: não.
- Estado: preservada como fase posterior; não iniciar antes da aprovação do método textual e da definição de candidatos de imagem realmente comparáveis.
- Critérios mínimos previstos:
  - não herdar reasoning effort textual;
  - comparar apenas opções de imagem compatíveis com o catálogo vigente;
  - preservar avaliação humana de qualidade visual e métricas próprias da chamada de imagem;
  - não generalizar a decisão textual para o workload de mídia.

### 3.3. Próxima ação do debate

- Resolver as questões abertas da seção 1.6 com o humano.
- Reconfirmar nas fontes oficiais atuais da OpenAI os modelos, parâmetros e tarifas relevantes somente quando o conjunto de candidatos do primeiro benchmark estiver definido.
- Consolidar este mesmo arquivo como plano-base v1 apenas quando não restar questão indispensável para executar a fase E21.3.3 sem inventar contrato.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não criar modelo vencedor universal.
- Não criar escolha ou ativação automática de configuração.
- Não criar banco, tabela, migration, segunda residência de evidência ou histórico permanente de benchmark.
- Não criar rota nova, dashboard separado, job, engine, agente, workflow, automação ou nova infraestrutura.
- Não reabrir E19.4 nem alterar seus contratos funcionais para facilitar o benchmark.
- Não alterar o catálogo ou lifecycle E21.2.5 como efeito colateral da comparação.
- Não usar preço desatualizado ou divergente como base de decisão financeira conclusiva.
- Não transformar E21.3 em avaliação geral de modelos fora dos workloads reais do produto.

### 4.2. Critérios de parada

- Parar se o caso representativo não for suficientemente definido para comparar as configurações de forma justa.
- Parar se a configuração candidata não estiver elegível no catálogo vigente.
- Parar a conclusão financeira se a tarifa aplicável não puder ser confirmada; a comparação qualitativa e de usage pode prosseguir sem declarar vencedor de custo.
- Parar se a comparação exigir mudança de contrato funcional do workload; devolver o conflito ao humano antes de ampliar escopo.
- Parar se surgir necessidade de persistência, rota, automação ou infraestrutura não autorizada neste plano; submeter nova decisão humana antes de implementar.
