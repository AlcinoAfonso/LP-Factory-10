# Rascunho vivo — E20.6.5 — Avaliação factual com IA no runtime do Admin

- Data de início do debate: 17/08/2026.
- Estado: rascunho vivo; ainda não consolidado como plano-base v1.
- Recorte previsto para roadmap: `20.6.5 — Avaliação factual com IA no runtime do Admin`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Fontes consultadas nesta etapa: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/roadmap.md`, `docs/lousa-plano-base-e20-6.md`, `docs/gestor-automations.md`, `docs/automations.md`, `docs/base-tecnica.md`, `docs/platform-config.md`, `lib/openai-workloads/`, fluxo runtime já existente de proposta de perfil de geração e decisões humanas de 17/08/2026.

## 1. Estado e decisões aceitas no debate

### 1.1. Problema e resultado esperado

- A E20.6 atual executa a avaliação semântica fora do runtime do produto, por handoff `Admin → Codex App → Admin`.
- A direção aprovada no debate é internalizar a avaliação semântica no Admin Dashboard como workload OpenAI de produto, preservando a autoridade humana e os gates determinísticos existentes.
- O objetivo prático é transformar a preparação de novos taxons em aprendizado operacional real de IA dentro do próprio LP Factory, reduzindo operação manual externa e acumulando experiência sobre qualidade, custo, latência e confiabilidade do workload.
- A E20.6.4 permanece determinística: IA avalia significado; humano decide; backend valida estado e deriva `prepared`.

### 1.2. Dois modos de entrada para a IA

- Modo A — avaliação sistemática:
  - o humano inicia no Admin a avaliação da pesquisa E20.5 selecionada contra uma versão executável explícita da E20.2;
  - a IA procura autonomamente gaps factuais reais, aplicando a barreira de admissão vigente.
- Modo B — hipótese levantada pelo humano:
  - o humano pode declarar em linguagem natural uma hipótese, por exemplo: `Para o ultranicho XXX, identifiquei que precisamos do campo YYY. Avalie se você concorda.`;
  - a IA deve avaliar a hipótese com as mesmas fontes, critérios e travas da avaliação sistemática;
  - a hipótese humana não é tratada como fato aprovado nem como ordem de criação de field.
- Os dois modos pertencem ao mesmo processo de avaliação E20.6 e devem poder coexistir na mesma superfície administrativa.

### 1.3. Contrato do diálogo humano–IA para hipótese de gap

- Ao receber uma hipótese humana, a IA deve confrontá-la com:
  - taxon e cadeia taxonômica autoritativa;
  - pesquisa integral E20.5 atualmente selecionada;
  - versão executável E20.2 explicitamente escolhida;
  - catálogos resolvidos dos quatro planos quando materialmente equivalentes;
  - barreira de admissão de gap factual já definida pela E20.6.
- Antes de recomendar novo field, a IA deve verificar se a necessidade:
  - já está coberta por field herdado ou existente;
  - pode ser resolvida por correção ou refinamento de field existente;
  - é realmente fato operacional variável ou confirmável, e não copy, dor, objeção, promessa, narrativa, legislação, conhecimento geral ou contexto da pesquisa.
- A IA não deve apenas responder `concordo` ou `discordo`; deve explicar a conclusão e classificar preliminarmente a hipótese como:
  - já coberta;
  - refinamento de field existente;
  - possível novo field;
  - insuficiente/inconclusiva.
- Quando houver possível novo field ou refinamento, a IA deve recomendar também a camada taxonômica adequada — `universal`, `segment`, `niche` ou `ultra_niche` — com base no alcance factual da necessidade, sem assumir que a camada sugerida inicialmente pelo humano é a correta.
- Em ultranicho, eventual camada própria continua sujeita à autoridade humana já prevista pela E20.2; a IA não cria nem autoriza camada taxonômica por conta própria.
- O humano pode contestar, complementar ou refinar a hipótese e solicitar nova avaliação antes da decisão final.

### 1.4. Autoridade e consequência da decisão

- A recomendação da IA permanece não autoritativa.
- Se a IA discordar da hipótese humana, o humano pode fornecer nova evidência ou reformular a necessidade; a IA deve reavaliar sem transformar discordância em bloqueio definitivo.
- Se a IA recomendar gap factual e o humano concordar, o humano confirma explicitamente o gap real.
- A confirmação humana não altera diretamente a E20.2 dentro da E20.6.5.
- A evolução do catálogo continua pertencendo ao recorte próprio da E20.2, preservando versionamento explícito, regressões e imutabilidade das versões anteriores.
- Depois da nova versão E20.2 aplicável, a E20.6 deve ser executada novamente no runtime antes de registrar suficiência.
- Se a recomendação for `suficiente` e o humano aceitar, o backend determinístico revalida as precondições e registra a versão avaliada; a E20.6.4 deriva a preparação sem nova chamada de IA.

### 1.5. Automação e ambiente — decisão ainda a fechar antes da v1

- Automação: sim.
- Classificação candidata: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal candidato: `Runtime do LP Factory`.
- Plataforma dependente: OpenAI Platform via Responses API, reutilizando a governança transversal de workloads E21.1.
- Não há evidência atual de necessidade de comportamento agentic, Agents SDK, tools autônomas, job, fila ou automação recorrente.
- A classificação e o ambiente ainda devem ser submetidos à decisão humana formal antes da consolidação da v1, conforme `docs/prompt-estrategista.md` e `docs/gestor-automations.md`.

## 2. Contrato do caso — mapeamento progressivo

### 2.1. Fluxo já aceito no debate

- Gatilho:
  - ação explícita de `platform_admin` na Taxonomia administrativa.
- Entrada:
  - taxon e cadeia autoritativa;
  - pesquisa E20.5 selecionada;
  - versão E20.2 explicitamente escolhida;
  - catálogo resolvido aplicável;
  - opcionalmente, hipótese ou feedback humano em linguagem natural.
- Processamento:
  - validações determinísticas de precondição;
  - chamada do workload OpenAI de produto;
  - avaliação semântica sistemática ou focal sobre hipótese humana;
  - produção de resultado estruturado e transitório;
  - possibilidade de nova rodada com feedback humano.
- Validação:
  - schema estruturado do resultado;
  - aplicação da barreira de admissão de gap factual;
  - nenhuma mutação automática da E20.2;
  - nenhuma gravação de suficiência sem decisão humana explícita;
  - revalidação determinística do estado antes de qualquer registro.
- Persistência:
  - permanece aceita a persistência mínima de `reviewed_input_catalog_version` para a decisão final;
  - persistência de conversa, hipóteses, candidatos ou relatório de IA ainda não foi aprovada neste debate.
- Consumo:
  - humano decide no Admin;
  - E20.6.4 deriva `prepared` quando houver suficiência registrada e versão requerida compatível.
- Fallback:
  - falha técnica, resposta inválida, fonte inconsistente ou análise insuficiente não registra suficiência e mantém o fluxo humano seguro.

### 2.2. Questões ainda abertas no debate

- Definir se o diálogo será apresentado como um único painel conversacional ou como avaliação estruturada com campo de feedback e refinamentos sucessivos.
- Definir se o estado da conversa permanecerá apenas transitório na sessão/tela ou se existe necessidade real de persistência; não criar nova persistência sem evidência e decisão humana.
- Definir a forma mínima de selecionar a versão E20.2 no Admin sem introduzir `latest` ou fallback.
- Definir o contrato estruturado mínimo da resposta da IA para suportar tanto avaliação sistemática quanto hipótese humana.
- Submeter a classificação `2.1.3` e o ambiente `Runtime do LP Factory` à confirmação humana e à avaliação pré-v1 do Gestor de Automações.
- Seleção de modelo e `reasoning effort` não está decidida neste debate; deve seguir E21.1, `docs/openai-model-snapshot.md` e documentação oficial atual quando o plano exigir essa decisão.

## 3. Fases e próxima ação

### 3.1. E20.6.5 — Avaliação factual com IA no runtime do Admin

- Status: em debate.
- Automação: sim.
- Categoria candidata: `2.1.3 — Automação com IA em fluxo controlado`.
- Objetivo: internalizar no Admin a avaliação semântica da E20.6, permitindo tanto descoberta autônoma de gaps quanto diálogo sobre hipóteses levantadas pelo humano, sem alterar a autoridade humana nem o gate determinístico de preparação.
- Próxima ação no debate: fechar UX mínima do diálogo, persistência transitória ou não, contrato de saída e decisão formal de categoria/ambiente antes da consolidação da v1.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo já aceito

- Não reimplementar E20.5, E20.2 ou E20.6.4.
- Não permitir que a IA altere diretamente o registry E20.2, crie versão, field ou camada taxonômica.
- Não permitir que concordância da IA substitua confirmação humana do gap.
- Não executar segunda chamada de IA apenas para validar uma decisão humana já tomada quando a validação necessária for determinística.
- Não criar Agents SDK, agente, subagentes, tool orchestration, job, fila ou workflow recorrente sem necessidade demonstrada e novo debate.
- Não persistir prompt, resposta integral, conversa ou relatório apenas por conveniência.
- Não usar maior versão disponível, `latest` ou fallback implícito para E20.2.

### 4.2. Critérios de parada do debate

- Parar e devolver ao humano se a UX pretendida exigir persistência nova, nova entidade, histórico permanente ou workflow de evolução automática da E20.2.
- Parar se a avaliação pré-v1 de Automação concluir que `2.1.3` não atende ao comportamento realmente desejado.
- Não consolidar plano-base v1 enquanto categoria/ambiente, fluxo humano–IA e contrato mínimo de saída permanecerem materialmente abertos.
