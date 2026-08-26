26/08/2026 — Plano-base v2 — E21.3 — Evidências e avaliação de custo-benefício dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 consolidado a partir do blob v1 `08b5ed6bb6bca78d12ec131b06f38c854eb1963f` e das decisões humanas `B/A/A` de 26/08/2026.
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
- A baseline de cada rodada é a revisão ativa lida no início da comparação para o ambiente selecionado. Em Preview e Production sua fonte é `supabase_operational`; `repo_catalog/v2` permanece somente baseline determinístico de Development.
- Pergunta inicial: a configuração textual atual pode ser reduzida em modelo e/ou effort sem perda material de qualidade dentro da BSG vigente?
- A geração de imagem `landing_page_draft_image_generation` fica preservada como fase posterior, separada, após o método textual demonstrar utilidade.
- A E19.4 não é reaberta; ela fornece o workload real de referência.
- A rodada inicial deve permanecer curta e simples; uma janela aproximada de uma semana pode ser usada para acumular experiência humana real, sem virar gate técnico rígido ou exigir job/automação.

### 1.6. Decisões de método e experiência

- O piloto usa uma fixture versionada, autorizada e representativa de `Corretor Imóveis`, tipada no contrato público v4 da E19.4 e sem leitura de draft, conta ou dado real. O mesmo pacote imutável é reutilizado por todas as configurações da rodada.
- O cegamento é um requisito de apresentação, não um boundary de confidencialidade contra inspeção técnica: identidade e eficiência podem permanecer no estado transitório recebido pelo client, mas não são renderizadas antes de todas as avaliações qualitativas da rodada serem registradas. A interface deve informar esse limite sem antecipar a identidade visualmente.
- O piloto não implementa tabela tarifária nem cálculo monetário no runtime. Custo aparece como `não confirmado`; eventual cálculo e conclusão financeira são documentais e somente podem ocorrer após confirmação das tarifas oficiais aplicáveis.
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
- A primeira passada recebe um `roundId` opaco e um `roundToken` autenticado gerados no servidor. O token usa HMAC com separação de domínio e a `OPENAI_API_KEY` server-side já autorizada, contém somente `roundId`, ambiente, fixture/contratos, baseline e conjunto inicial de configurações e não oferece confidencialidade. Uma segunda passada, quando solicitada pelo humano, revalida o token e a correspondência do `roundId`, reutiliza a mesma fixture e a mesma BSG e aceita somente a baseline e até dois finalistas da rodada inicial; imediatamente antes do dispatch, relê o catálogo e recusa qualquer finalista que tenha deixado de estar elegível, preservando apenas a exceção da baseline original. Estabilidade permanece explicitamente `não avaliada` para qualquer configuração sem ao menos uma repetição focalizada.
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
- Persistência: não criar banco, tabela ou segunda residência neste recorte; resultados, avaliações e métricas existem somente no estado transitório da sessão e são perdidos ao recarregar a página. O resumo decisório final pertence a `docs/openai-model-snapshot.md`, e a evidência extensa pode permanecer no PR/artefato da execução.
- Proveniência: a baseline preserva sua fonte e revisão ativas. Configurações apenas elegíveis no catálogo usam a fonte explícita `model_catalog_comparison` e uma revisão experimental derivada das versões do modelo e do parâmetro no catálogo; nunca recebem `supabase_operational`, revisão ativa fictícia ou elegibilidade de lifecycle.
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
- O sistema não escolhe automaticamente entre resultados aprovados e não aplica desempate oculto: ele apresenta trade-offs observados, permite ao humano confirmar uma recomendação específica ou concluir `evidência insuficiente` quando nenhuma configuração for inequivocamente preferível.
- Ganho pequeno de qualidade não justifica automaticamente aumento desproporcional de custo ou latência.
- A recomendação é específica do workload, da BSG congelada e do conjunto de casos avaliados.
- Se nenhuma configuração atingir qualidade suficiente, registrar o limite observado sem ampliar a E21.3; eventual evolução de prompt, contexto, pesquisa, tools ou arquitetura de IA pertence a recorte posterior de BSG.

### 2.4. UX conceitual

- Etapa 1 — escolher workload:
  - exibir `landing_page_draft_generation` como contexto fixo e sua configuração ativa como baseline de referência;
  - não alterar lifecycle.
- Etapa 2 — escolher configurações:
  - selecionar de 2 a 6 combinações pertinentes;
  - novas candidatas devem ser elegíveis no catálogo E21.2.5;
  - a baseline ativa permanece comparável se tiver sido posteriormente indisponibilizada no catálogo, somente como revisão ativa de referência; essa exceção de comparação não cria elegibilidade para nova candidata nem altera disponibilidade ou lifecycle.
- Etapa 3 — escolher caso(s) representativo(s):
  - exibir como contexto fixo a fixture autorizada e versionada de `Corretor Imóveis` no contrato v4;
  - manter o mesmo conjunto e a mesma BSG para todas as configurações.
- Etapa 4 — executar e avaliar cegamente:
  - apresentar entregas como `Resultado A/B/C...`, sem revelar configuração ou eficiência;
  - projetar de cada candidata somente o contrato textual necessário à avaliação — seções ordenadas, papéis semânticos, títulos, corpo, listas e rótulo textual do CTA — sem inventar imagem, destino de conversão, identidade técnica ou revisão materializada;
  - registrar validade, qualidade, correção humana e comentário opcional.
  - executar as configurações concorrentemente dentro do limite de 2 a 6, com isolamento de falha por resultado e sem exceder a duração hospedada da action;
- Etapa 5 — revelar identidade e eficiência:
  - revelar modelo + effort de cada resultado;
  - apresentar usage, reasoning, latência, custo quando válido e estabilidade.
- Etapa 6 — concluir:
  - apresentar trade-offs e permitir que o humano confirme uma configuração recomendada ou registre `evidência insuficiente`, com motivos e limitações;
  - gerar resumo transitório copiável antes de qualquer reload, sem persistência operacional;
  - oferecer somente continuação humana para o lifecycle E21.2.5, sem ativação automática.

### 2.5. Critérios de experiência

- A experiência deve ser compreensível por função de negócio, sem exigir IDs técnicos como informação principal.
- A validação de UX deve comprovar que o `platform_admin` reconhece o próximo passo correto em cada etapa — confirmar workload e fixture fixos, escolher configurações, avaliar, revelar e concluir — a partir de nomes, estados e ações visíveis, sem depender de memorização de IDs técnicos; não instituir tempo de clique ou telemetria obrigatória.
- Desktop deve favorecer comparação lado a lado; mobile pode empilhar resultados sem perder associação entre resultado, avaliação e métricas.
- Estados de execução, erro, resultado inválido, revelação e conclusão precisam ser explícitos.
- A identidade da configuração não pode ser revelada antes de a avaliação qualitativa da rodada ser registrada.
- Nenhum estado de UI deve sugerir que uma recomendação já foi ativada em Production.
- A superfície deve preservar os critérios de acessibilidade e responsividade já vigentes no Admin.

## 3. Fases e próxima ação

### 3.1. E21.3.3 — Comparação representativa do workload textual de Landing Page

- Objetivo: materializar o menor fluxo útil para comparar configurações de inferência do `landing_page_draft_generation` dentro da BSG vigente congelada, com o mesmo caso representativo, avaliação humana cega e métricas operacionais suficientes para decisão reproduzível.
- Automação: não.
- Composição física e ownership:
  - a experiência permanece na rota existente `/admin/workloads-openai`; `page.tsx` conserva SSR, `requirePlatformAdmin()` e composição dos read models e declara `export const maxDuration = 300` como configuração efetiva do segmento hospedado;
  - a UI reside em `_components/OpenAiLandingPageTextComparison.tsx`, sem Supabase, secret ou chamada direta ao provider;
  - `comparisonActions.ts` reexecuta `requirePlatformAdmin()`, valida ambiente, fixture e conjunto único de 2 a 6 configurações, relê baseline ativa e catálogo no servidor e orquestra a execução;
  - cada chamada ao provider preserva timeout individual máximo de 120 segundos e as configurações da rodada executam concorrentemente com isolamento de falha por resultado dentro do limite hospedado do segmento;
  - `comparisonActions.ts` emite e verifica o `roundToken` com HMAC e separação de domínio, reutilizando `OPENAI_API_KEY` somente no servidor, sem nova credencial, cookie, banco ou sigilo alegado para o token;
  - o transporte, prompt, Structured Output, parser e validação permanecem sob `lib/lp-builder/landingPageDraftGeneration.ts`; o adapter server-only `lib/lp-builder/adapters/landingPageDraftComparisonAdapter.ts` fornece a configuração explícita e a credencial, reutilizando esse caminho sem parser ou chamada OpenAI paralelos;
  - o contrato comum acrescenta `model_catalog_comparison` somente como proveniência experimental verdadeira. O resolver runtime nunca produz essa fonte; o adapter da comparação a associa às versões correntes do modelo e parâmetro do catálogo, enquanto a baseline conserva `supabase_operational` e sua revisão ativa;
  - a fixture v4 e os contratos puros da comparação residem em `lib/lp-builder/landingPageDraftComparison.ts`; não importar nem reutilizar `proofLandingPageContext`, que declara contrato v3 e é incompatível com o gerador textual v4;
  - a comparação usa a projeção pública do catálogo e os adapters server-side E21 existentes; não chama save, prova, promoção, ativação, rollback nem qualquer RPC de mutação;
  - a ordem cega é embaralhada no servidor por rodada e usa aliases `Resultado A/B/C...`; identidade e métricas permanecem não renderizadas até o registro completo da régua humana no client;
  - a conclusão elimina deterministicamente apenas resultados inválidos, inseguros ou abaixo da qualidade mínima, apresenta trade-offs dos restantes e exige confirmação humana da recomendação ou de `evidência insuficiente`, sem pontuação opaca, desempate automático, promoção ou persistência;
  - repetições focalizadas verificam o `roundId` autenticado, aceitam somente a baseline e até dois finalistas da rodada inicial, revalidam no catálogo a elegibilidade corrente de cada finalista imediatamente antes do dispatch e agregam resultados por configuração sem declarar estabilidade antes de repetição;
  - a projeção cega é textual e completa para avaliação editorial, mas não reutiliza `LandingPageRenderer`, que exige mídia, destino e metadados de revisão inexistentes no experimento;
  - antes de recarregar, a UI oferece resumo copiável com ambiente, workload, fixture e versões dos contratos, baseline e revisão, combinações, avaliações, gates de validade, usage, latência, custo não confirmado, repetições, limitações e decisão humana.
- Artefatos previstos:
  - ajustar `app/admin/(protected)/workloads-openai/page.tsx` para compor o read model da comparação;
  - criar `app/admin/(protected)/workloads-openai/_components/OpenAiLandingPageTextComparison.tsx`;
  - criar `app/admin/(protected)/workloads-openai/comparisonActions.ts`;
  - criar `lib/lp-builder/landingPageDraftComparison.ts`;
  - criar `lib/lp-builder/adapters/landingPageDraftComparisonAdapter.ts`;
  - ajustar `lib/lp-builder/landingPageDraftGeneration.ts` apenas para aceitar a configuração explícita validada pelo adapter experimental, preservando o resolver runtime como default e sem duplicar request, parser ou validator;
  - ajustar `lib/openai-workloads/contracts.ts`, `lib/openai-workloads/registry.ts` e os validators estritamente para reconhecer e validar `model_catalog_comparison` como proveniência experimental, sem permitir que o resolver runtime a produza;
  - ampliar `lib/lp-builder/landing-page-draft-generation-validation-cases.ts` e `app/admin/(protected)/workloads-openai/validation-cases.tsx` com casos focais da comparação;
  - atualizar por ABC, quando confirmado pelo estado final, `docs/roadmap.md`, `docs/base-tecnica.md` e `docs/openai-model-snapshot.md`; este último deve distinguir Development de Preview/Production e registrar ambiente, revisão ativa, data, combinações efetivamente avaliadas, limitações e decisão.
- Contrato repo-only de schema:
  - não criar nem alterar migration, tabela, view, function, RPC, trigger, RLS, policy, GRANT, teste SQL ou snippet SQL;
  - a execução experimental não persiste resultado, avaliação, usage, custo ou histórico e os testes devem confirmar ausência de chamadas às mutações de lifecycle e catálogo.
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
  - validar manualmente em Preview, de forma proporcional, desktop e mobile, papel positivo e negativo, estados de execução, erro, resultado inválido, revelação e conclusão, preservação da associação entre resultado, avaliação e métricas, ausência de efeito no lifecycle durante a comparação e ausência de erros visíveis de runtime;
  - cada execução de QA em Preview deve registrar deployment e ambiente, papel exercitado, viewport, fluxo ou estado validado e resultado observado; ferramenta automatizada pode apoiar, mas não substitui a revisão manual;
  - aplicar os critérios WCAG 2.2 pertinentes à superfície e registrar evidência manual de operação por teclado, ordem e foco visível, nomes e rótulos acessíveis, feedback de sucesso e erro, ausência de interação exclusiva por hover, contraste e alvos de toque; justificar cada critério marcado como N/A, usar auditoria automática apenas como apoio e não declarar conformidade WCAG 2.2 integral sem auditoria própria;
  - validar deterministicamente que a baseline ativa é incluída uma única vez, candidatas indisponíveis são recusadas, todas as configurações recebem a mesma fixture v4, a identidade permanece não renderizada antes do registro completo e falha de um resultado não altera os demais nem o lifecycle;
  - validar proveniência `model_catalog_comparison` sem revisão ativa fictícia, `maxDuration = 300` no entrypoint do segmento, timeout individual, projeção textual sem renderer operacional, `roundId` autenticado, segunda passada limitada com revalidação corrente do catálogo, estabilidade ausente sem repetição, confirmação humana e completude do resumo copiável;
  - executar `npm ci`, validações focais, `npm run check` e `git diff --check` antes do gate do Analista;
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
- Gate de início: E21.3.4 permanece condicionada e não recebe implementação antecipada no checkpoint E21.3.3. Após o QA humano integral da fase textual, o humano deve confirmar a utilidade do método e a existência de pelo menos duas configurações de imagem comparáveis no catálogo; ausência de qualquer condição preserva a fase como prevista, sem bloquear o fechamento técnico da E21.3.3.

### 3.3. Próxima ação

- Submeter esta v2 às Passagens 1 e 2 do Analista, reconciliar o roadmap por ABC e criar o checkpoint `LP-Factory-Stage: plan-v2-approved` no único PR draft da orquestração.
- Antes da execução hospedada da E21.3.3, reconfirmar nas fontes oficiais atuais da OpenAI os modelos e parâmetros das combinações efetivamente selecionadas; tarifas permanecem fora do runtime e qualquer divergência mantém o custo como não confirmado.
- Executar primeiro e somente `E21.3.3 — Comparação representativa do workload textual de Landing Page`; E21.3.4 respeita seu gate humano e de catálogo.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não criar modelo vencedor universal.
- Não criar escolha ou ativação automática de configuração.
- Não versionar, otimizar ou comparar versões da BSG na E21.3.
- Não alterar prompt, pesquisa/contexto, tools, estratégia de continuidade, persisted reasoning, arquitetura single-agent/multi-agent ou orquestração como parte do experimento E21.3.3.
- Não criar banco, tabela, migration, segunda residência de evidência ou histórico permanente de benchmark.
- Não criar tabela tarifária, cálculo monetário ou sincronização de preços no runtime.
- Não criar rota nova, dashboard separado, job, engine, agente, workflow, automação ou nova infraestrutura.
- Não reabrir E19.4 nem alterar seus contratos funcionais para facilitar o benchmark.
- Não alterar catálogo ou lifecycle E21.2.5 como efeito colateral da comparação.
- Não corrigir silenciosamente a fixture v3 da prova operacional E21.2 dentro da E21.3; eventual regressão desse fluxo pertence a correção separada.
- Não usar preço desatualizado ou divergente como base de decisão financeira conclusiva.
- Não transformar E21.3 em avaliação geral de modelos fora dos workloads reais do produto.

### 4.2. Critérios de parada

- Parar se o caso representativo não estiver suficientemente definido para comparação justa.
- Parar se uma nova configuração candidata não estiver elegível no catálogo vigente.
- Parar a conclusão financeira se a tarifa aplicável não puder ser confirmada; a comparação qualitativa e de usage pode prosseguir sem declarar vencedor de custo.
- Parar se a comparação exigir mudança de contrato funcional ou de qualquer dimensão congelada da BSG; devolver o conflito ao humano antes de ampliar escopo.
- Parar se surgir necessidade de persistência, rota, automação ou infraestrutura não autorizada neste plano; submeter nova decisão humana antes de implementar.
