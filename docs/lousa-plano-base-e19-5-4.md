25/08/2026 — Rascunho vivo — E19.5.4 — UX operacional do workspace de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação

- Caso macro: `E19 — LP Builder`.
- Recorte em debate: `E19.5.4 — UX operacional do workspace de LPs`.
- Path canônico deste debate: `docs/lousa-plano-base-e19-5-4.md`.
- Estado: **rascunho vivo; ainda não consolidado como plano-base v1 e sem autorização de implementação**.
- Processo: `docs/prompt-estrategista.md` v32.
- Fonte principal de visão: `README.md`.
- Antecessor material: E19.5.3 concluída e operacional em Preview e Production.
- Plano conceitual: `N/A`.

### 1.2. Problema comprovado por uso real

- O smoke técnico da E19.5.3 comprovou funcionamento de workspace, configuração, geração, histórico, preview e aprovação, mas o teste humano posterior em Production mostrou que a experiência operacional não comunica o modelo mental do produto com clareza suficiente.
- A superfície atual prioriza termos e metadados técnicos como revisão, aprovação e identificadores sem explicar ao cliente o que representa uma LP, o que representa uma versão, o que mudou e qual ação deve ser tomada em seguida.
- A geração de nova versão apresenta espera pouco informativa, conclusão sem transição clara para o resultado novo e navegação insuficiente, inclusive dependência percebida do voltar do navegador.
- A lista principal não torna imediatamente reconhecível a identidade comercial de cada LP nem organiza de forma simples a relação `LP → versões`.
- A E19.5.4 nasce como correção de produto/UX baseada em evidência real, sem reabrir a validade técnica da E19.5.3.

### 1.3. Decisões humanas já aceitas no debate

- UX passa a ser gate de produto anterior ao código para fluxos materiais: modelo mental, wireframe, estados, linguagem e navegação devem ser aprovados pelo humano antes de autorizar implementação.
- Modelo mental principal: `Conta → LP → Versões`.
- A opção escolhida para desktop é o **wireframe B compacto**, orientado a lista, em vez de coleção ampla de cards.
- Cada LP deve ocupar uma entrada principal reconhecível e permitir expansão de suas versões abaixo dela.
- O nome amigável da LP, por exemplo `Primeiro imóvel no Rio`, permanece distinto da identidade comercial definida pelos quatro atributos abaixo.
- O bloco `Identidade da LP` deve apresentar de forma legível:
  - `funnel_stage`;
  - `transaction_intent`, quando aplicável;
  - `primary_conversion_goal`;
  - `primary_service_or_offer`.
- A linha principal deve priorizar nome da LP, versão mais recente, data de criação, identidade comercial, estado e endereço/slug.
- A versão mais recente é evidente pela ordenação e pelo número; não criar um conceito adicional de `versão escolhida/oficial` na UX enquanto não houver consequência de produto clara para essa escolha.
- `Principal` é papel de roteamento futuro, não status; quando existir dado real para sustentá-lo, deve aparecer como marcador simples junto ao nome da LP.
- O modelo de estado de UX a preservar para evolução é `Draft | Ativa | Publicada | Arquivada`; `Publicada` pressupõe LP ativa e por isso não deve exigir duas colunas simultâneas. Este rascunho não autoriza implementar publicação, roteamento principal ou archive/restore sem contrato próprio.
- Arquivadas não devem ocupar por padrão a lista corrente quando essa capacidade existir; filtro por estado pode expô-las.
- A experiência principal não deve exibir IDs técnicos, attempt IDs, request IDs, prompt IDs, modelo ou metadata interna; esses dados podem permanecer disponíveis apenas em detalhe técnico quando houver necessidade real.
- Linguagem voltada ao cliente deve usar `versão` em vez de `revisão` nas superfícies de produto.
- Criar uma nova versão deve possuir interação anterior à geração; disparo imediato sem contexto não é a experiência desejada.
- A alternativa preferida em debate para essa interação é híbrida: opções estruturadas de alteração + instrução livre em linguagem natural, ainda sujeita a fechamento do contrato abaixo.

### 1.4. Questões abertas do rascunho

- Definir exatamente quais alterações entram no diálogo `Criar nova versão` nesta entrega e quais ficam para evolução posterior.
- Decidir se a primeira E19.5.4 permite criar uma nova versão a partir de qualquer versão histórica ou somente a partir da versão mais recente.
- Se for permitido partir de versão histórica, definir semântica append-only: a escolha da base deve gerar sempre uma nova versão no topo do histórico, sem sobrescrever ou renumerar versões anteriores.
- Definir a consequência de produto do ponteiro técnico de aprovação já existente na E19.5.3 e como, ou se, ele deve aparecer na nova UX antes da publicação física.
- Fechar o wireframe mobile equivalente ao wireframe B desktop.
- Definir mapeamento entre estados técnicos existentes e os quatro estados de UX sem simular publicação ou arquivamento ainda não implementados.
- A decisão sobre materializar ou projetar os quatro atributos de identidade como primeira classe da LP permanece em avaliação paralela; nenhuma mudança de banco é autorizada por este rascunho.
- O PR #814 / E20.2.8 altera o lifecycle e o consumo da versão corrente do catálogo E20.2; a implementação da E19.5.4 deve reconciliar a `main` vigente depois da decisão final desse PR antes de tocar adapters ou contratos dependentes.

## 2. Contrato do caso

### 2.1. Resultado esperado

- O cliente deve reconhecer em poucos segundos quais LPs possui, qual trabalho comercial cada uma representa, qual é sua versão mais recente, qual o estado da LP e quais ações estão disponíveis.
- O cliente deve conseguir abrir uma LP, expandir seu histórico, visualizar uma versão e iniciar uma nova versão sem compreender conceitos internos de materialização, snapshot ou aprovação técnica.
- Ao gerar nova versão, a experiência deve explicar o que está acontecendo, preservar orientação durante a espera, levar o usuário ao resultado novo quando concluído e indicar a próxima ação possível.
- A navegação deve ser explícita e previsível; nenhuma jornada operacional depende do botão `Voltar` do navegador como mecanismo principal.
- O redesenho deve preservar tenant isolation, papéis, entitlement, versionamento append-only, configuração E20.2, histórico e demais boundaries já comprovados da E19.5.3.

### 2.2. Usuários e autoridade

- Owner e admin ativos continuam sendo os perfis mutáveis conforme contrato vigente.
- Viewer ativo continua em leitura sem controles que sugiram permissão inexistente.
- O redesenho não cria novo papel, entitlement ou capability comercial.

### 2.3. Fluxo operacional em debate

- Gatilho:
  - cliente entra no workspace da conta ou escolhe `Nova LP`, `Abrir`, `Versões` ou `Nova versão`.
- Entrada:
  - identidade e estado reais da LP;
  - histórico de versões;
  - quando aplicável, intenção explícita do usuário para uma nova versão.
- Processamento:
  - compor lista compacta por identidade;
  - expandir histórico sob demanda;
  - preparar geração somente após confirmação do diálogo de nova versão.
- Validação:
  - preservar gates atuais de conta, membership, entitlement, configuração e E20.2;
  - validar UX por wireframe e teste humano antes de código e novamente em Preview antes de Production.
- Persistência:
  - nenhuma nova residência é presumida neste rascunho;
  - alterações de persistência dependem de fonte técnica e decisão explícita na consolidação.
- Consumo:
  - workspace desktop e mobile da conta;
  - preview de versão e ações contextuais.
- Fallback:
  - estados de carregamento, erro, vazio e indisponibilidade devem explicar o problema e oferecer retorno ou próxima ação segura, sem coleção parcial apresentada como completa.

### 2.4. Wireframe B desktop — direção aprovada

- Cabeçalho:
  - `Minhas landing pages`;
  - ação principal `Nova LP`;
  - filtro por estados apenas quando sustentado por estados reais disponíveis.
- Cada entrada de LP:
  - nome amigável + número da versão mais recente;
  - marcador `Principal` somente quando houver papel real implementado;
  - bloco `Identidade da LP` com os quatro atributos comerciais;
  - estado;
  - data de criação;
  - slug/endereço;
  - ações `Abrir`, `Nova versão` e `Versões`.
- Expansão `Versões`:
  - ordem decrescente;
  - número e data;
  - ação `Visualizar`;
  - resumo útil de diferença em relação à versão anterior quando houver fonte confiável para derivá-lo;
  - eventual ação de criar nova versão a partir da versão selecionada somente se essa capacidade for aprovada neste debate.

### 2.5. Gate de UX pré-implementação

- Nenhum código da E19.5.4 é autorizado antes da aprovação humana de:
  - modelo mental;
  - wireframe desktop;
  - wireframe mobile;
  - diálogo e estados de `Criar nova versão`;
  - linguagem das ações e mensagens;
  - navegação e retornos;
  - critérios de aceite visual/humano.
- O framework permanente desse gate deve ter residência canônica no `docs/design-system.md`; `docs/prompt-estrategista.md` deve apenas referenciar e tornar obrigatória sua aplicação, sem duplicar o framework integral.

## 3. Fases e próxima ação

### 3.1. E19.5.4 — UX operacional do workspace de LPs

- Automação: não.
- Estado: debate e wireframe em andamento; implementação não autorizada.
- Entrega prevista após consolidação:
  - workspace compacto desktop e mobile aprovado;
  - histórico expansível por LP;
  - identidade comercial legível;
  - linguagem de versão orientada ao cliente;
  - navegação explícita;
  - fluxo de nova versão com espera, sucesso e erro compreensíveis;
  - atualização proporcional do framework de UX canônico e do enforcement processual pelo fluxo ABC, somente após aprovação da v1/v2 aplicável.
- Próxima ação:
  - fechar com o humano o diálogo `Criar nova versão` e a semântica de base da nova versão;
  - em seguida desenhar o wireframe mobile e consolidar os critérios humanos de aceite.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo enquanto não houver decisão explícita

- publicação física da LP;
- definição física ou roteamento da LP principal;
- archive/restore operacional;
- editor manual completo de conteúdo;
- melhoria parcial por IA fora do diálogo aprovado;
- testes A/B, tracking, mensuração e analytics;
- hard delete;
- nova infraestrutura, job, fila, agente ou automação recorrente;
- migration para mover os quatro atributos de identidade para `account_landing_pages`;
- reescrita das versões históricas ou substituição do modelo append-only;
- reabertura da validade técnica da E19.5.3 sem evidência específica.

### 4.2. Critérios de parada

- Parar se uma decisão de UX exigir implementar publicação, principal, archive/restore ou outra capability ainda sem contrato aprovado.
- Parar se a semântica de gerar a partir de versão histórica exigir novo contrato de geração não resolvido no debate.
- Parar se a decisão final do PR #814 alterar materialmente autoridade, identidade ou consumo E20.2 relevante ao workspace antes da implementação; reconciliar primeiro a `main` real.
- Parar se a solução exigir nova residência, coluna, RPC, rota ou infraestrutura sem fonte real e decisão explícita do plano consolidado.
- Não consolidar plano-base v1 enquanto permanecer aberta questão indispensável para implementar a experiência sem ambiguidade para o cliente.
