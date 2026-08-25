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
- A E19.5.4 fica restrita ao **redesenho da experiência e da interface do workspace já existente**, sem criar nova capability de geração, edição ou publicação.
- Neste recorte, `UX` abrange modelo mental, arquitetura da informação, linguagem, sequência de interação, navegação, feedback e estados; `UI` é a expressão visual e interativa dessas decisões em layout, componentes, botões, campos, hierarquia e responsividade.
- O wireframe é artefato de UX materializado como proposta de UI; a implementação futura deve preservar ambos os níveis sem ampliar regra de negócio.
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
- `Nova versão` preserva neste recorte a **semântica de geração vigente**: a E19.5.4 pode melhorar rótulo, estado de espera, mensagem de sucesso/erro, transição para a nova versão e retorno ao workspace, mas não altera prompt, contexto, algoritmo, versão-base nem conteúdo enviado à IA.
- Diálogo híbrido ou conversacional para orientar o que a IA deve modificar fica explicitamente para recorte posterior.
- Editor manual e melhoria parcial por IA também ficam para recortes posteriores próprios.

### 1.4. Questões abertas do rascunho

- Fechar o wireframe mobile equivalente ao wireframe B desktop.
- Definir a linguagem e a hierarquia final das ações `Abrir`, `Nova versão`, `Versões` e `Nova LP`.
- Definir a apresentação do estado de geração vigente: espera, sucesso, erro e transição automática ou explícita para a nova versão, sem alterar o algoritmo de geração.
- Definir a consequência de UX do ponteiro técnico de aprovação já existente na E19.5.3 e como, ou se, ele deve aparecer antes da publicação física.
- Definir mapeamento entre estados técnicos existentes e os quatro estados de UX sem simular publicação ou arquivamento ainda não implementados.
- Definir a composição responsiva da lista compacta, histórico expandido e navegação de retorno sem depender do botão do navegador.
- A decisão sobre materializar ou projetar os quatro atributos de identidade como primeira classe da LP permanece em avaliação paralela; nenhuma mudança de banco é autorizada por este rascunho.
- O PR #814 / E20.2.8 altera o lifecycle e o consumo da versão corrente do catálogo E20.2; a implementação da E19.5.4 deve reconciliar a `main` vigente depois da decisão final desse PR antes de tocar adapters ou contratos dependentes.

## 2. Contrato do caso

### 2.1. Resultado esperado

- O cliente deve reconhecer em poucos segundos quais LPs possui, qual trabalho comercial cada uma representa, qual é sua versão mais recente, qual o estado da LP e quais ações estão disponíveis.
- O cliente deve conseguir abrir uma LP, expandir seu histórico, visualizar uma versão e iniciar a geração vigente de uma nova versão sem compreender conceitos internos de materialização, snapshot ou aprovação técnica.
- Ao iniciar uma nova versão, a interface deve explicar o que está acontecendo, preservar orientação durante a espera, levar o usuário ao resultado novo quando concluído e indicar a próxima ação possível, sem mudar o algoritmo que gera a versão.
- A navegação deve ser explícita e previsível; nenhuma jornada operacional depende do botão `Voltar` do navegador como mecanismo principal.
- O redesenho deve preservar tenant isolation, papéis, entitlement, versionamento append-only, configuração E20.2, histórico e demais boundaries já comprovados da E19.5.3.
- O recorte deve produzir uma experiência simples, direta, objetiva e compreensível antes de adicionar novas capacidades de IA ou edição.

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
  - geração vigente quando o cliente escolhe `Nova versão`.
- Processamento:
  - compor lista compacta por identidade;
  - expandir histórico sob demanda;
  - disparar a geração vigente sem alterar seu contrato, apresentando estados de interação compreensíveis.
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
  - resumo útil de diferença em relação à versão anterior somente se houver fonte real já disponível e sem introduzir novo processamento de IA neste recorte.

### 2.5. Gate de UX pré-implementação

- Nenhum código da E19.5.4 é autorizado antes da aprovação humana de:
  - modelo mental;
  - wireframe desktop;
  - wireframe mobile;
  - linguagem das ações e mensagens;
  - estados de espera, sucesso, erro e indisponibilidade;
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
  - feedback compreensível da geração vigente sem alteração do algoritmo;
  - atualização proporcional do framework de UX canônico e do enforcement processual pelo fluxo ABC, somente após aprovação da v1/v2 aplicável.
- Próxima ação:
  - fechar com o humano a composição final do wireframe B desktop;
  - desenhar o wireframe mobile equivalente;
  - fechar linguagem, navegação e estados de interação da geração vigente.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo enquanto não houver decisão explícita

- diálogo híbrido ou conversacional com IA para orientar nova versão;
- escolher versão histórica como base de uma nova geração;
- mudança de prompt, contexto ou algoritmo da geração vigente;
- publicação física da LP;
- definição física ou roteamento da LP principal;
- archive/restore operacional;
- editor manual completo de conteúdo;
- melhoria parcial por IA;
- testes A/B, tracking, mensuração e analytics;
- hard delete;
- nova infraestrutura, job, fila, agente ou automação recorrente;
- migration para mover os quatro atributos de identidade para `account_landing_pages`;
- reescrita das versões históricas ou substituição do modelo append-only;
- reabertura da validade técnica da E19.5.3 sem evidência específica.

### 4.2. Critérios de parada

- Parar se uma decisão de UX exigir implementar publicação, principal, archive/restore, editor, diálogo de IA ou outra capability ainda sem contrato aprovado.
- Parar se o redesenho exigir alterar prompt, contexto, versão-base ou algoritmo da geração vigente.
- Parar se a decisão final do PR #814 alterar materialmente autoridade, identidade ou consumo E20.2 relevante ao workspace antes da implementação; reconciliar primeiro a `main` real.
- Parar se a solução exigir nova residência, coluna, RPC, rota ou infraestrutura sem fonte real e decisão explícita do plano consolidado.
- Não consolidar plano-base v1 enquanto permanecer aberta questão indispensável para implementar a experiência sem ambiguidade para o cliente.
