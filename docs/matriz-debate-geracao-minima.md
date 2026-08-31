# Matriz de Debate — Nova Geração Mínima de LP

## 1. Estado e finalidade

### 1.1 Estado

- Versão: v0.2.
- Data: 31/08/2026.
- Status: debate aberto; documento temporário mantido no PR #864; não é plano-base nem autorização de implementação.
- Path temporário do debate: `docs/matriz-debate-geracao-minima.md`.
- PR de referência obrigatória enquanto o debate estiver aberto: https://github.com/AlcinoAfonso/LP-Factory-10/pull/864
- Repositório: `AlcinoAfonso/LP-Factory-10`.

### 1.2 Finalidade

- Ser a fonte compartilhada e temporária de debate para a nova geração mínima de Landing Pages.
- Consolidar propostas, contrapontos, evidências, decisões humanas e ideias rejeitadas antes da criação de um novo plano-base.
- Permitir que Estrategista, Analista, Orquestrador, executores e demais chats trabalhem sobre o mesmo estado de discussão.
- Evitar que hipóteses de simplificação sejam transformadas prematuramente em arquitetura ou implementação.
- O conteúdo deste PR poderá ser consolidado, substituído ou descartado quando o debate produzir o plano-base greenfield; não há intenção de torná-lo documento canônico do produto nesta fase.

### 1.3 Estado operacional durante o debate

- Production permanece apenas contida operacionalmente após a falha do PR13; essa contenção não transforma o AA-PR12 em arquitetura-alvo nem cria uma frente independente de estabilização.
- Não será criado, por esta matriz, um recorte separado apenas para retirar o PR13 e restaurar definitivamente o caminho antigo.
- A retirada do PR13 e dos demais elementos do caminho de geração que forem rejeitados será absorvida pelo futuro cutover greenfield, conforme decisão específica de D12 e D13.
- Até o cutover, o estado atual deve ser tratado como contingência operacional temporária, não como baseline arquitetural a ser preservada.
- Esta matriz não autoriza alterar Production, promoções, código, banco ou configurações.

## 2. Decisões e princípios já aceitos para o debate

### 2.1 Recorte

- O redesenho será greenfield focal do caminho de geração de LP, não reconstrução do LP Factory 10 inteiro.
- O objetivo é perguntar qual é o menor sistema necessário para gerar uma LP hoje, usando os aprendizados acumulados, e não apenas remover peças da implementação existente.
- Nenhum arquivo, helper, adapter, boundary ou contrato interno do caminho atual é preservado automaticamente.
- Reutilização de um componente existente exige justificativa concreta de responsabilidade indispensável e simplicidade líquida.

### 2.2 Princípios de simplificação

- Priorizar simplicidade líquida: menos etapas, estados intermediários, dependências e pontos de falha.
- Preservar determinismo para segurança, autorização, tenant, fatos verificáveis, estado, persistência e integridade quando necessário.
- Preservar flexibilidade da IA para interpretação semântica, narrativa, persuasão, copy e outras decisões criativas quando não houver necessidade de determinismo.
- Não criar nova chamada de IA, agente, job, engine ou infraestrutura apenas por disponibilidade tecnológica.
- Preferir dar mais responsabilidade semântica à IA já necessária para a geração antes de introduzir outro workload no runtime.
- Nova sofisticação só entra no runtime após benefício proporcional comprovado em qualidade, custo, latência, confiabilidade ou valor ao cliente.
- Uma simplificação que apenas desloca a complexidade para outro módulo não é considerada ganho.

### 2.3 Regra de preservação

- As LPs existentes hoje são exclusivamente dados de teste. Nenhuma LP atual, revisão/materialização associada ou imagem produzida para esses testes precisa ser preservada como histórico de produto no redesenho greenfield.
- O descarte desses dados de teste poderá fazer parte do futuro plano de implementação/cutover quando houver autorização operacional explícita; esta matriz, isoladamente, não executa nem autoriza deleção.
- A dispensa de preservação das LPs de teste não se estende automaticamente a contas, taxonomia, pesquisas autorizadas, configurações, contratos de segurança, infraestrutura ou outros dados do projeto.
- Autenticação, multi-tenancy, autorização e persistência ficam fora de qualquer remoção automática; sua participação no novo caminho deve ser avaliada pela responsabilidade que protegem.
- Contratos e componentes atuais podem ser questionados; preservar o resultado necessário não implica preservar a implementação atual.

## 3. Matriz principal de debate

| ID | Tema | Situação atual / referência | Hipótese de simplificação | O que pode exigir preservação | Papel possível da IA | Risco principal | Evidência necessária | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Entrada da geração | O caminho atual recebe contexto preparado por múltiplas fronteiras | Definir o menor pacote de entrada que contenha tudo o que a geração realmente precisa | autorização, tenant, fatos, pesquisa válida e identidade mínima | interpretar o contexto semântico sem pré-composição narrativa | omitir informação indispensável | comparar pacote mínimo com geração atual | Aberto |
| D02 | Pacote E19.3 | `identities + modelContext + serverContext` é o boundary vigente | Preservar apenas responsabilidades indispensáveis ou substituir por contrato menor | separação modelo/server, fatos revalidados e proveniência | interpretar diretamente pesquisa e fatos autorizados | exposição de dado server-side ou perda factual | inventário de consumidores e campos realmente usados | Aberto |
| D03 | Pesquisa-base | Pesquisa integral autorizada/preparada chega ao caminho de geração | Entregar a pesquisa autorizada com o mínimo de transformação sem seleção semântica determinística | identidade, versão, integridade e autorização da fonte | selecionar quais trechos importam para oferta e público | uso de fonte errada ou desatualizada | geração comparativa com pesquisa integral | Aberto |
| D04 | E20.7 / pesquisa dinâmica | A introdução no caminho crítico mostrou custo, latência e fragilidade | Manter fora da arquitetura greenfield mínima até prova de valor; sua retirada técnica ocorrerá no cutover, não em estabilização separada | apenas evidências históricas úteis ao debate | evaluator ou experimento offline antes de eventual reintegração | reintroduzir complexidade sem ganho mensurável | comparação objetiva `base` × candidata dinâmica | Aberto |
| D05 | Estrutura da LP | Contrato estrutural versionado limita formas, cardinalidades e layouts | Reduzir às invariantes realmente necessárias para renderização, acessibilidade e segurança | shape renderizável, hierarquia mínima e limites absolutos | escolher seções, sequência intermediária e narrativa | shape inválido ou experiência inconsistente | medir quais regras evitam falhas reais | Aberto |
| D06 | Copy e decisão persuasiva | Prompt + schema + validações determinísticas cercam a geração | Dar maior liberdade à IA e remover regras que antecipem decisões semânticas | claims objetivamente verificáveis e limites de segurança | argumento, hierarquia persuasiva, CTA e copy | invenção factual ou perda de qualidade | evaluator IA + amostra humana | Aberto |
| D07 | Validação factual | Validação pós-modelo cruza claims verificáveis com fatos autorizados | Manter apenas verificações determinísticas de alto valor; evitar policiamento semântico excessivo | fatos de empresa, preço, endereço, credenciais, prova social e outras afirmações objetivas | evaluator pode sinalizar qualidade/risco sem virar autoridade factual | hallucination factual | catálogo de falhas reais e testes negativos | Aberto |
| D08 | Imagem | Workload separado gera uma imagem antes da materialização | Avaliar se imagem deve permanecer obrigatória no produto mínimo ou entrar depois | experiência visual e requisito comercial real | gerar brief ou imagem dentro do fluxo mais simples possível | custo, latência e falha bloqueante | comparar valor do produto com/sem imagem obrigatória | Aberto |
| D09 | Workflow e persistência | Geração textual, imagem, validação e append formam workflow controlado | Reduzir o número de estados e passos sem permitir materialização parcial ou inconsistente | atomicidade lógica, concorrência e integridade das futuras LPs reais | não aplicável a invariantes de persistência | materialização parcial ou duplicada | mapear o mínimo necessário para uma LP válida | Aberto |
| D10 | Avaliação de qualidade | Qualidade hoje depende de QA, testes e avaliações pontuais | Criar baseline simples e comparar candidatas fora do runtime antes de sofisticar | critérios humanos do produto | evaluator IA para especificidade, persuasão, aderência factual e qualidade | evaluator virar autoridade única | rubrica + comparação cega/amostral | Aberto |
| D11 | Produto mínimo | A geração atual incorporou vários requisitos técnicos e de qualidade antes de provar o menor produto utilizável | Definir qual entrega mínima precisa existir para o cliente considerar uma LP gerada, sem importar automaticamente requisitos históricos | capacidade real de gerar, visualizar e usar uma LP coerente com a oferta | IA pode concentrar interpretação, estrutura e copy em uma única decisão semântica | cortar algo que seja requisito real do produto | definir critérios mínimos de entrega e validar com LPs de teste | Aberto |
| D12 | Cutover e UX temporária | Production está contida e `main` ainda carrega o caminho atual; não há necessidade de preservar LPs de teste | Definir como manter a operação temporária durante o greenfield e fazer um único cutover que substitua o caminho antigo, retire PR13 e trate a UX transitória | acesso seguro ao produto e comunicação clara do que está ou não disponível durante a transição | IA não substitui decisão de disponibilidade/cutover | manter dois caminhos ativos por tempo demais ou expor fluxo quebrado ao usuário | plano de cutover com estado anterior, transição, rollback e smoke | Aberto |
| D13 | Legado técnico e dados de teste | Código, contratos, adapters, testes e dados atuais acumulam decisões de várias etapas; LPs atuais são todas de teste | Inventariar o que pode ser removido no cutover e evitar carregar compatibilidade sem valor para a geração greenfield | somente componentes externos com consumidor real ou responsabilidade de segurança ainda necessária | IA pode ajudar a classificar dependências, não autoriza deleção | apagar dependência ainda usada fora da geração ou manter legado desnecessário | inventário de consumidores + lista explícita de exclusão técnica e de dados | Aberto |

## 4. Questões abertas prioritárias

### 4.1 Entrada mínima

- Qual é o conjunto mínimo de fatos e pesquisa que a IA precisa receber para gerar uma LP de boa qualidade?
- O contrato `identities + modelContext + serverContext` ainda é o menor boundary útil ou pode ser reduzido?
- Quais dados hoje carregados nunca influenciam legitimamente a geração?

### 4.2 Determinismo versus IA

- Quais regras atuais existem para proteger segurança/fatos e quais apenas tentam antecipar decisões criativas?
- Quais decisões podem ser entregues diretamente à IA sem criar novo workload?
- Quais validações pós-modelo são indispensáveis e quais apenas duplicam instruções do prompt/schema?

### 4.3 Estrutura e mídia

- Qual é a menor estrutura determinística necessária para o renderer produzir uma LP segura e consistente?
- A imagem precisa fazer parte do produto mínimo ou pode ser incorporada após a geração textual mínima estar comprovada?
- É possível reduzir estados intermediários sem perder materialização íntegra das futuras LPs reais?

### 4.4 Produto mínimo e transição

- Qual é a menor entrega que ainda representa uma Landing Page utilizável para o MVP?
- Durante o desenvolvimento greenfield, qual UX temporária deve existir para impedir que o usuário dependa de uma geração conhecida como contida ou transitória?
- O cutover deve substituir o caminho antigo de uma vez ou existe alguma necessidade comprovada de convivência temporária?
- Quais artefatos e dados de teste podem ser eliminados no mesmo cutover?

### 4.5 Prova de valor

- Qual será a baseline objetiva de qualidade, latência, custo e confiabilidade?
- Quais critérios o evaluator IA poderá avaliar e quais permanecem humanos/determinísticos?
- Qual ganho mínimo justifica introduzir novamente uma camada, workload ou etapa no runtime?

## 5. Decisões fechadas

### 5.1 Estado inicial

- A matriz é o artefato compartilhado e temporário de debate mantido no PR #864; não é autorização para implementar.
- O redesenho pretendido é greenfield focal da geração.
- Nenhuma implementação atual possui direito automático de permanência.
- A nova geração deve buscar a menor complexidade capaz de preservar segurança, fatos, estado e qualidade comprovada.
- Não haverá uma estabilização arquitetural independente no AA-PR12 como pré-condição do debate; Production permanece apenas contida até a estratégia de cutover ser fechada.
- A retirada do PR13 será tratada dentro do futuro cutover greenfield.

### 5.2 LPs atuais de teste

- Todas as LPs existentes no estado atual do projeto são LPs de teste.
- Não há requisito de produto para preservar essas LPs, suas revisões/materializações ou imagens durante o futuro redesenho/cutover.
- A decisão elimina o histórico dessas LPs de teste como restrição arquitetural do greenfield, sem autorizar deleção imediata nesta matriz.

## 6. Ideias rejeitadas ou suspensas

### 6.1 Registro

- Nenhuma ideia é removida da memória do projeto: propostas rejeitadas devem permanecer registradas com motivo e condição objetiva de reabertura.
- E20.7 no caminho crítico fica como hipótese suspensa até comparação objetiva de benefício; isso não elimina seus artefatos históricos nem autoriza alteração operacional por esta matriz.
- A ideia de um PR independente apenas para restaurar definitivamente o AA-PR12 antes do greenfield fica retirada deste debate; a remoção técnica será absorvida pelo cutover, salvo nova decisão humana explícita diante de risco operacional novo.

## 7. Protocolo de contribuição e handoff dos chats

### 7.1 Leitura mínima

- Antes de contribuir, consultar `README.md` e o estado mais recente desta matriz no PR #864.
- Como o documento é temporário e não será indexado no `README.md` nesta rodada, o handoff entre chats é o mecanismo obrigatório de descoberta.
- Consultar documentos adicionais somente quando forem necessários para sustentar o tema específico em debate.

### 7.2 Formato de contribuição

- Identificar o `ID` da linha debatida ou propor novo `ID`.
- Registrar a proposta de forma objetiva.
- Explicar qual complexidade é removida ou adicionada.
- Separar responsabilidade indispensável de conveniência histórica da implementação.
- Informar riscos e evidências disponíveis.
- Classificar a recomendação como `manter`, `simplificar`, `substituir`, `remover`, `experimentar fora do runtime` ou `sem decisão`.

### 7.3 Fechamento de decisão

- Apenas decisão humana explícita ou consolidação expressamente autorizada muda uma linha de `Aberto` para `Decidido`.
- Uma decisão fechada deve registrar motivo, consequência e evidência suficiente para evitar rediscussão sem fato novo.
- Alteração desta matriz não autoriza código, banco, configuração, rollout ou nova infraestrutura.

### 7.4 Handoff obrigatório

- Todo handoff para outro chat que participe deste debate deve incluir explicitamente o link do PR #864: https://github.com/AlcinoAfonso/LP-Factory-10/pull/864
- O handoff deve instruir o próximo chat a ler a versão mais recente de `docs/matriz-debate-geracao-minima.md` na branch/HEAD do PR, e não presumir que a cópia em `main` exista ou esteja atualizada.
- O handoff deve informar que o PR é uma matriz temporária de debate e que nenhuma linha aberta equivale a autorização de implementação.
- Se o PR for substituído ou encerrado por um plano-base futuro, o último estado da matriz deve registrar o novo artefato de continuidade antes do encerramento.
