25/08/2026 — Plano-base v1 — E21.3 — Evidências e avaliação de custo-benefício dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado após encerramento do debate humano.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.3 — Evidências e avaliação de custo-benefício dos workloads OpenAI`.
- Plano conceitual: N/A.
- Base de abertura: `main@7dc40560d71a68bdd417ca9b6e8092727dde13ce`, após o fechamento documental da E21.2.5.
- A E21.2.5 permanece concluída e não é reaberta por este recorte.

### 1.2. Fontes de visão e contrato

- `README.md` — visão, princípios do MVP e menor complexidade suficiente.
- `docs/roadmap.md` — objetivo, métricas, primeiro caso real e limites atuais da E21.3.
- `docs/openai-model-snapshot.md` — protocolo comparativo, preços/capacidades datados e residência do snapshot decisório.
- `docs/lousa-plano-base-e21-2-5.md` — catálogo administrável e lifecycle humano já concluídos.
- `docs/base-tecnica.md` — boundary transversal `lib/openai-workloads/`, observabilidade e separação entre configuração e execução.
- `docs/template-roadmap.md` e `docs/prompt-estrategista.md` — hierarquia e processo do plano-base.

### 1.3. Objetivo prático

- Substituir escolhas intuitivas de modelo e `reasoning effort` por comparações reproduzíveis por workload real.
- Identificar a menor configuração de inferência que cumpra qualidade, validade, segurança e latência exigidas pelo workload, considerando também custo e estabilidade.
- Não buscar vencedor universal entre modelos ou efforts.
- Para texto, a configuração de inferência comparada é `workload + modelo + reasoning effort`.
- Workloads de imagem preservam configuração e métricas próprias, sem herdar `reasoning effort`.

### 1.4. Baseline do Sistema de Geração e limite deste recorte

- A Baseline do Sistema de Geração, abreviada neste plano como `BSG`, representa o pacote amplo que condiciona a geração da Landing Page, incluindo, quando aplicável, prompt/instruções, contexto e qualidade das entradas/pesquisa, Responses API, Structured Output/schema, tools, estratégia de contexto/continuidade, persisted reasoning, arquitetura single-agent/multi-agent, orquestração e demais decisões materiais do pipeline.
- A E21.3 não versiona, otimiza nem experimenta a BSG.
- A BSG vigente permanece congelada durante as comparações da E21.3.3.
- O primeiro eixo experimental é somente a configuração de inferência `modelo + reasoning effort`, mantendo constantes as demais dimensões da BSG sempre que possível.
- Se a melhor configuração de inferência continuar produzindo qualidade insuficiente, isso é evidência útil de que o gargalo pode estar fora de modelo/effort; a evolução controlada da BSG deve ser tratada em recorte posterior, sem inflar a E21.3.

### 1.5. Primeiro caso e sequência

- Primeiro caso real: `landing_page_draft_generation` da E19.4.
- Pergunta inicial: a configuração textual atual pode ser reduzida em modelo e/ou effort sem perda material de qualidade dentro da BSG vigente?
- A geração de imagem `landing_page_draft_image_generation` fica preservada como fase posterior, separada, após o método textual demonstrar utilidade.
- A E19.4 não é reaberta; ela fornece o workload real de referência.
- A rodada inicial deve permanecer curta e simples; uma janela aproximada de uma semana pode ser usada para acumular experiência humana real, sem virar gate técnico rígido ou exigir job/automação.

### 1.6. Decisões de método e experiência

- O humano escolhe o workload e um conjunto pequeno de configurações relevantes, preferencialmente entre 2 e 6 combinações elegíveis no catálogo E21.2.5; novas combinações devem estar disponíveis para novas candidatas no momento do teste. A configuração ativa entra obrigatoriamente como baseline de referência mesmo se tiver sido posteriormente indisponibilizada no catálogo, exclusivamente porque já é uma revisão ativa e executável do lifecycle E21.2.5; essa exceção serve apenas à comparação e não a torna elegível para nova candidata, prova, promoção ou reativação fora das regras já existentes.
- Todas as configurações recebem o mesmo caso representativo, com as mesmas entradas, contrato funcional e gates de validade.
- A primeira avaliação qualitativa é cega quanto a modelo, effort, custo, tokens e latência: os resultados aparecem como `Resultado A`, `Resultado B`, `Resultado C` etc.; a identidade técnica é revelada somente após o registro da avaliação humana daquela rodada.
- A régua humana mínima é curta e explícita:
  - resultado: `válido` ou `inválido`;
  - qualidade: `insuficiente`, `adequada` ou `superior`;
  - correção humana: `nenhuma`, `leve` ou `relevante`;
  - comentário curto opcional.
- A UX prioriza qualidade antes de eficiência; métricas de usage, latência e custo aparecem depois da avaliação qualitativa.
- A primeira passada usa uma execução por configuração/caso; repetições adicionais ficam restritas à baseline e a um ou dois finalistas quando forem necessárias para avaliar estabilidade, evitando multiplicar custo de todas as combinações.
- O piloto pode começar com o caso real já validado de `Corretor Imóveis`; uma recomendação que pretenda generalizar a troca da configuração textual deve buscar evidência em pelo menos dois contextos válidos distintos quando tais contextos existirem no produto. Ausência de segundo contexto não invalida o piloto, mas limita a força da generalização.
- A residência física preferida da experiência é a superfície existente `/admin/workloads-openai`, sem rota nova nem dashboard separado; o detalhamento técnico dessa composição fica para a v2, sem inventar nova infraestrutura.
- Quando tarifa oficial aplicável estiver divergente ou não confirmada, a comparação pode prosseguir com qualidade, usage e latência, mas o custo deve aparecer como não confirmado para decisão e não pode sustentar conclusão financeira definitiva.
- A conclusão recomenda uma configuração e explica o trade-off observado, sem ativá-la automaticamente.
- Qualquer mudança operacional continua passando pelo lifecycle E21.2.5: candidata → prova → revisão validada → ativação humana.
- `docs/openai-model-snapshot.md` permanece a residência do resumo decisório reproduzível; evidência extensa pode permanecer no PR ou artefato do recorte.

## 2. Contrato do caso

### 2.1. Fluxo conceitual da comparação textual

- Gatilho: `platform_admin` decide avaliar configurações de inferência de um workload real já governado pela E21.2.5.
- Entrada: workload, baseline ativa, configurações candidatas elegíveis, caso(s) representativo(s), BSG vigente congelada, contrato funcional vigente e critérios humanos de avaliação.
- Processamento: executar o mesmo caso em cada configuração selecionada, mantendo constantes as demais variáveis da BSG, e coletar a observabilidade segura já disponível.
- Validação: rejeitar comparação se casos, entradas, contrato ou critérios mudarem entre configurações; separar falha técnica de resultado funcional inválido.
- Persistência: não criar banco, tabela ou segunda residência neste recorte; o resumo decisório final pertence a `docs/openai-model-snapshot.md`, e a evidência extensa pode permanecer no PR/artefato da execução.
- Consumo: humano compara qualidade primeiro, depois eficiência, e decide se alguma configuração merece seguir para o lifecycle operacional E21.2.5.
- Fallback: ausência de evidência suficiente preserva a configuração ativa atual; não há promoção automática nem troca silenciosa de baseline.

### 2.2. Métricas mínimas

- Qualidade:
  - resultado funcional válido;
  - avaliação humana de qualidade;
  - necessidade de correção humana;
  - comentário qualitativo opcional.
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

- Não somar todas as métricas em pontuação universal opaca.
- Primeiro eliminar configurações que não cumpram validade, segurança ou qualidade mínima.
- Entre as configurações aprovadas, favorecer a menor configuração que mantenha qualidade suficiente com melhor relação de custo, latência e estabilidade.
- Ganho pequeno de qualidade não justifica automaticamente aumento desproporcional de custo ou latência.
- A recomendação é específica do workload, da BSG congelada e do conjunto de casos avaliados.
- Se nenhuma configuração atingir qualidade suficiente, registrar o limite observado sem ampliar a E21.3; eventual evolução de prompt, contexto, pesquisa, tools ou arquitetura de IA pertence a recorte posterior de BSG.

### 2.4. UX conceitual

- Etapa 1 — escolher workload:
  - exibir configuração ativa como baseline de referência;
  - não alterar lifecycle.
- Etapa 2 — escolher configurações:
  - selecionar de 2 a 6 combinações pertinentes;
  - novas candidatas devem ser elegíveis no catálogo E21.2.5;
  - a baseline ativa permanece comparável se tiver sido posteriormente indisponibilizada no catálogo, somente como revisão ativa de referência; essa exceção de comparação não cria elegibilidade para nova candidata nem altera disponibilidade ou lifecycle.
- Etapa 3 — escolher caso(s) representativo(s):
  - reutilizar entradas reais ou fixtures autorizadas do próprio workload;
  - manter o mesmo conjunto e a mesma BSG para todas as configurações.
- Etapa 4 — executar e avaliar cegamente:
  - apresentar entregas como `Resultado A/B/C...`, sem revelar configuração ou eficiência;
  - registrar validade, qualidade, correção humana e comentário opcional.
- Etapa 5 — revelar identidade e eficiência:
  - revelar modelo + effort de cada resultado;
  - apresentar usage, reasoning, latência, custo quando válido e estabilidade.
- Etapa 6 — concluir:
  - apresentar configuração recomendada, motivos, limitações e trade-offs;
  - oferecer somente continuação humana para o lifecycle E21.2.5, sem ativação automática.

### 2.5. Critérios de experiência

- A experiência deve ser compreensível por função de negócio, sem exigir IDs técnicos como informação principal.
- Desktop deve favorecer comparação lado a lado; mobile pode empilhar resultados sem perder associação entre resultado, avaliação e métricas.
- Estados de execução, erro, resultado inválido, revelação e conclusão precisam ser explícitos.
- A identidade da configuração não pode ser revelada antes de a avaliação qualitativa da rodada ser registrada.
- Nenhum estado de UI deve sugerir que uma recomendação já foi ativada em Production.
- A superfície deve preservar os critérios de acessibilidade e responsividade já vigentes no Admin.

## 3. Fases e próxima ação

### 3.1. E21.3.3 — Comparação representativa do workload textual de Landing Page

- Objetivo: materializar o menor fluxo útil para comparar configurações de inferência do `landing_page_draft_generation` dentro da BSG vigente congelada, com o mesmo caso representativo, avaliação humana cega e métricas operacionais suficientes para decisão reproduzível.
- Automação: não.
- Critérios de aceite:
  - preservar configuração ativa como baseline até decisão humana posterior;
  - usar somente novas configurações candidatas elegíveis no catálogo E21.2.5;
  - permitir que a baseline ativa participe da comparação mesmo se tiver sido posteriormente indisponibilizada no catálogo, sem tratá-la como nova candidata elegível nem alterar seu lifecycle;
  - manter entradas, contrato funcional e BSG constantes por comparação;
  - suportar seleção pequena de configurações sem benchmark combinatório;
  - apresentar avaliação qualitativa cega antes da revelação de modelo/effort e eficiência;
  - usar a régua humana aprovada neste plano;
  - coletar observabilidade segura reutilizando E21.1;
  - permitir repetições focalizadas apenas quando necessárias para estabilidade;
  - tratar custo não confirmado sem fabricar conclusão financeira;
  - registrar decisão reproduzível no snapshot sem nova residência operacional;
  - validar desktop/mobile, papel positivo/negativo, acessibilidade proporcional e ausência de efeito no lifecycle durante a comparação;
  - se a qualidade máxima permanecer insuficiente, registrar o limite da BSG vigente sem abrir otimização de BSG neste recorte.

### 3.2. E21.3.4 — Comparação do workload de imagem da Landing Page

- Objetivo: aplicar o método validado da fase textual ao `landing_page_draft_image_generation`, respeitando métricas e parâmetros próprios de mídia.
- Automação: não.
- Critérios de aceite:
  - não herdar reasoning effort textual;
  - comparar apenas opções de imagem compatíveis com o catálogo vigente;
  - preservar avaliação humana de qualidade visual e métricas próprias da chamada de imagem;
  - não generalizar a decisão textual para o workload de mídia;
  - não iniciar antes da aprovação do método textual e da existência de candidatos de imagem realmente comparáveis.

### 3.3. Próxima ação

- Submeter este plano-base v1 ao processo escolhido pelo humano conforme `docs/prompt-estrategista.md`.
- Antes da implementação da E21.3.3, reconfirmar nas fontes oficiais atuais da OpenAI os modelos, parâmetros e tarifas relevantes ao conjunto de candidatos efetivamente escolhido.
- A v2 deve detalhar somente o necessário para execução segura, inclusive a composição física na superfície administrativa existente, sem ampliar escopo.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não criar modelo vencedor universal.
- Não criar escolha ou ativação automática de configuração.
- Não versionar, otimizar ou comparar versões da BSG na E21.3.
- Não alterar prompt, pesquisa/contexto, tools, estratégia de continuidade, persisted reasoning, arquitetura single-agent/multi-agent ou orquestração como parte do experimento E21.3.3.
- Não criar banco, tabela, migration, segunda residência de evidência ou histórico permanente de benchmark.
- Não criar rota nova, dashboard separado, job, engine, agente, workflow, automação ou nova infraestrutura.
- Não reabrir E19.4 nem alterar seus contratos funcionais para facilitar o benchmark.
- Não alterar catálogo ou lifecycle E21.2.5 como efeito colateral da comparação.
- Não usar preço desatualizado ou divergente como base de decisão financeira conclusiva.
- Não transformar E21.3 em avaliação geral de modelos fora dos workloads reais do produto.

### 4.2. Critérios de parada

- Parar se o caso representativo não estiver suficientemente definido para comparação justa.
- Parar se uma nova configuração candidata não estiver elegível no catálogo vigente.
- Parar a conclusão financeira se a tarifa aplicável não puder ser confirmada; a comparação qualitativa e de usage pode prosseguir sem declarar vencedor de custo.
- Parar se a comparação exigir mudança de contrato funcional ou de qualquer dimensão congelada da BSG; devolver o conflito ao humano antes de ampliar escopo.
- Parar se surgir necessidade de persistência, rota, automação ou infraestrutura não autorizada neste plano; submeter nova decisão humana antes de implementar.