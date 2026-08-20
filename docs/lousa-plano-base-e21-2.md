20/08/2026 — Rascunho vivo — E21.2 — Configuração operacional dinâmica dos workloads OpenAI

## 1. Estado do debate

### 1.1. Status

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.2 — Configuração operacional dinâmica dos workloads OpenAI`.
- O objetivo do debate é fechar o contrato conceitual antes de escolher mecanismo técnico.
- A E21.1 permanece implementada, validada e preservada como fundação e boundary transversal.
- A E21.3 permanece como próxima evolução de evidências e avaliação de custo-benefício e não integra o recorte executável da E21.2.

### 1.2. Fontes obrigatórias consultadas

- `README.md`.
- `AGENTS.md`.
- `docs/prompt-estrategista.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/lousa-plano-base-e21-1.md`.
- `docs/base-tecnica.md`.
- `docs/platform-config.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- Como fontes factuais complementares do estado implementado: `lib/openai-workloads/contracts.ts`, `lib/openai-workloads/registry.ts`, `lib/openai-workloads/resolve.ts` e `app/admin/(protected)/workloads-openai/page.tsx`.

### 1.3. Decisões já fixas pelo roadmap e pela E21.1

- A configuração operacional futura deve ser explícita por ambiente e workload.
- Deve existir configuração candidata antes da ativação.
- A candidata deve ser validada antes de poder tornar-se ativa.
- A ativação exige decisão humana.
- O rollback deve voltar para revisão anteriormente validada.
- Mudança ordinária de configuração deve ser possível sem redeploy.
- Os consumidores de produto devem continuar resolvendo sua configuração pelo boundary canônico `lib/openai-workloads/`, sem passar a conhecer diretamente a residência técnica da configuração.
- Workloads textuais e de imagem permanecem discriminados e recebem somente os parâmetros aplicáveis à própria modalidade.
- O boundary comum não se torna cliente OpenAI universal e não absorve prompts, schemas funcionais, persistência de resultado ou fallback dos consumidores.
- O mecanismo efetivo ainda não está autorizado: o roadmap não escolheu banco, rota, dashboard mutável, provider de configuração nem nova infraestrutura.

## 2. Problema e resultado esperado

### 2.1. Problema objetivo

- Hoje a configuração efetiva dos workloads de produto está no `repo_catalog`, em `lib/openai-workloads/registry.ts`.
- Alterar essa configuração exige mudança versionada no repositório e novo deployment, o que não atende ao requisito já aprovado de mudança ordinária sem redeploy.
- Ao mesmo tempo, a E21.1 foi construída para evitar nova refatoração dos consumidores quando a origem da configuração mudar: os consumidores já dependem do resolver comum.
- A E21.2 precisa, portanto, fechar como uma configuração operacional é proposta, validada, ativada, resolvida e revertida sem enfraquecer o boundary existente nem transformar governança em seleção autônoma de modelo.

### 2.2. Resultado esperado do recorte

- Definir um contrato operacional mínimo no qual cada workload aplicável possua uma configuração ativa inequívoca no ambiente aplicável.
- Permitir preparar uma candidata sem alterar silenciosamente a configuração ativa.
- Impedir ativação de candidata que não tenha cumprido os gates aprovados.
- Exigir ação humana explícita para promoção da candidata.
- Preservar revisão rastreável suficiente para permitir rollback controlado para configuração previamente validada.
- Manter a resolução fail-closed e sem fallback silencioso para modelo, effort ou configuração de mídia diferentes.
- Separar governança operacional de configuração da avaliação comparativa da E21.3.

## 3. Decisões ainda abertas para debate

### 3.1. Significado de configuração ativa e candidata

- Fechar se `ativa` significa exatamente uma revisão autoritativa por `ambiente + workload` ou se existe outra semântica necessária.
- Fechar se pode existir apenas uma candidata em preparação por `ambiente + workload` ou mais de uma candidata simultânea.
- Fechar em que momento uma candidata recebe identidade/revisão estável e quando passa a ser considerada validada.

### 3.2. Atores e autoridade

- Definir quem pode propor uma candidata.
- Definir quem pode registrar ou executar sua validação.
- Definir quem pode ativar e executar rollback.
- Distinguir recomendação produzida por Estrategista, Analista, Gestor ou futura E21.3 da autoridade operacional para alterar a configuração ativa.
- Preservar que owner/admin de conta não recebe automaticamente autoridade de plataforma sobre workloads OpenAI.

### 3.3. Granularidade da configuração

- Confirmar quais ambientes entram na configuração dinâmica operacional: Production, Preview e eventual tratamento de Development.
- Confirmar que a unidade primária permanece o workload, sem criar default universal de modelo ou effort.
- Para workloads textuais, decidir se a parte dinâmica fica limitada a `model + reasoning effort` ou inclui outro parâmetro já reconhecido como configuração transversal.
- Para workload de imagem, decidir quais parâmetros atuais de mídia pertencem à configuração operacional dinâmica e quais permanecem contrato determinístico do consumidor.
- Identificar explicitamente quais propriedades estruturais continuam versionadas em código, como identidade do workload, modalidade/API, consumidor, fallback e contratos funcionais.

### 3.4. Validação obrigatória antes da ativação

- Definir quais gates são puramente determinísticos e obrigatórios para qualquer candidata.
- Definir se toda candidata também exige prova operacional do workload antes da ativação e qual evidência mínima é suficiente.
- Evitar transformar o gate de validade em benchmark: comparação de qualidade, custo, latência e estabilidade entre alternativas pertence à E21.3.
- Evitar impor um canário universal se o workload real exigir forma própria de prova; a E19.4 permanece baseline factual e não é reaberta.

### 3.5. Rollback e comportamento fail-closed

- Definir para qual revisão validada o rollback pode apontar e se a seleção é explicitamente humana.
- Definir se rollback cria nova revisão de ativação ou apenas restaura a autoridade de uma revisão já validada.
- Definir o comportamento quando a fonte operacional estiver indisponível, inconsistente ou sem configuração válida para `ambiente + workload`.
- Preservar a proibição de fallback silencioso para outra combinação de modelo, effort ou mídia.

### 3.6. Mudança ordinária sem redeploy

- Definir conceitualmente quais mudanças contam como ordinárias dentro da E21.2.
- Separar alteração de parâmetros operacionais do workload de alteração estrutural que ainda deve exigir mudança de código e deployment.
- O mecanismo técnico capaz de cumprir essa propriedade permanece aberto até o debate fechar requisitos suficientes para comparação factual das opções reais do projeto.

### 3.7. Possibilidade de automação

- Ainda não há classificação aprovada de automação para a E21.2.
- Existe hipótese material de automação apenas em partes do fluxo de validação ou aplicação controlada da configuração, mas o roadmap não exige automação e a E21.1 classificou suas fases como não automatizadas.
- Antes do plano-base v1, a possibilidade deve ser submetida ao Gestor de Automação conforme `docs/prompt-estrategista.md` e `docs/gestor-automations.md`.
- Não criar categoria técnica, job, agente, workflow ou automação antes dessa decisão.

## 4. Escopo negativo e próxima etapa do debate

### 4.1. Escopo negativo preservado

- Não implementar nada durante este debate.
- Não escolher banco, rota, dashboard mutável, provider de configuração ou nova infraestrutura por conveniência.
- Não criar job, engine, agente ou automação antecipadamente.
- Não transformar a E21.2 em laboratório de benchmarking nem absorver comparações decisórias da E21.3.
- Não reabrir a E19.4; sua revisão 3 permanece baseline real para regressão futura.
- Não alterar a E21.1 salvo incompatibilidade factual comprovada.
- Não alterar `docs/roadmap.md` durante o rascunho vivo.

### 4.2. Próxima etapa

- Debater com o humano as definições conceituais das subseções 3.1 a 3.6.
- Incorporar somente decisões aceitas ao mesmo rascunho vivo, mantendo questões abertas claramente separadas.
- Obter participação do Analista no debate antes da consolidação da v1.
- Consultar o Gestor de Automação antes da v1 se a hipótese de automação permanecer material após o fechamento conceitual.
