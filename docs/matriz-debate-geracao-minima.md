# Matriz de Debate — Nova Geração Mínima de LP

## 1. Estado e finalidade

### 1.1 Estado

- Versão: v0.1.
- Data: 31/08/2026.
- Status: debate aberto; não é plano-base nem autorização de implementação.
- Path canônico: `docs/matriz-debate-geracao-minima.md`.
- Repositório: `AlcinoAfonso/LP-Factory-10`.

### 1.2 Finalidade

- Ser a fonte compartilhada de debate para a nova geração mínima de Landing Pages.
- Consolidar propostas, contrapontos, evidências, decisões humanas e ideias rejeitadas antes da criação de um novo plano-base.
- Permitir que Estrategista, Analista, Orquestrador, executores e demais chats trabalhem sobre o mesmo estado de discussão.
- Evitar que hipóteses de simplificação sejam transformadas prematuramente em arquitetura ou implementação.

### 1.3 Relação com a estabilização

- A estabilização do estado atual de `main` e Production é uma frente operacional separada e não depende desta matriz.
- Esta matriz discute o que deverá substituir futuramente o caminho de geração atual; não prescreve a execução da estabilização.
- A geração segura anterior permanece referência operacional temporária durante o debate, não arquitetura-alvo obrigatória.

## 2. Decisões e princípios já aceitos para o debate

### 2.1 Recorte

- O redesenho será greenfield focal do caminho de geração de LP, não reconstrução do LP Factory 10 inteiro.
- O objetivo é perguntar qual é o menor sistema necessário para gerar uma LP hoje, usando os aprendizados acumulados, e não apenas remover peças da implementação existente.
- Nenhum arquivo, helper, adapter, boundary ou contrato interno do caminho atual é preservado automaticamente.
- Reutilização de um componente existente exige justificativa concreta de responsabilidade indispensável e simplicidade líquida.

### 2.2 Princípios de simplificação

- Priorizar simplicidade líquida: menos etapas, estados intermediários, dependências e pontos de falha.
- Preservar determinismo para segurança, autorização, tenant, fatos verificáveis, estado, persistência e integridade histórica quando necessário.
- Preservar flexibilidade da IA para interpretação semântica, narrativa, persuasão, copy e outras decisões criativas quando não houver necessidade de determinismo.
- Não criar nova chamada de IA, agente, job, engine ou infraestrutura apenas por disponibilidade tecnológica.
- Preferir dar mais responsabilidade semântica à IA já necessária para a geração antes de introduzir outro workload no runtime.
- Nova sofisticação só entra no runtime após benefício proporcional comprovado em qualidade, custo, latência, confiabilidade ou valor ao cliente.
- Uma simplificação que apenas desloca a complexidade para outro módulo não é considerada ganho.

### 2.3 Regra de preservação

- Dados e históricos existentes não são descartados por padrão.
- Autenticação, multi-tenancy, autorização, persistência e leitores históricos ficam fora de qualquer remoção automática; sua participação no novo caminho deve ser avaliada pela responsabilidade que protegem.
- Contratos e componentes atuais podem ser questionados; preservar o resultado necessário não implica preservar a implementação atual.

## 3. Matriz principal de debate

| ID | Tema | Situação atual / referência | Hipótese de simplificação | O que pode exigir preservação | Papel possível da IA | Risco principal | Evidência necessária | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Entrada da geração | O caminho atual recebe contexto preparado por múltiplas fronteiras | Definir o menor pacote de entrada que contenha tudo o que a geração realmente precisa | autorização, tenant, fatos, pesquisa válida e identidade mínima | interpretar o contexto semântico sem pré-composição narrativa | omitir informação indispensável | comparar pacote mínimo com geração atual | Aberto |
| D02 | Pacote E19.3 | `identities + modelContext + serverContext` é o boundary vigente | Preservar apenas responsabilidades indispensáveis ou substituir por contrato menor | separação modelo/server, fatos revalidados e proveniência | interpretar diretamente pesquisa e fatos autorizados | exposição de dado server-side ou perda factual | inventário de consumidores e campos realmente usados | Aberto |
| D03 | Pesquisa-base | Pesquisa integral autorizada/preparada chega ao caminho de geração | Entregar a pesquisa autorizada com o mínimo de transformação sem seleção semântica determinística | identidade, versão, integridade e autorização da fonte | selecionar quais trechos importam para oferta e público | uso de fonte errada ou desatualizada | geração comparativa com pesquisa integral | Aberto |
| D04 | E20.7 / pesquisa dinâmica | Introdução no caminho crítico mostrou custo, latência e fragilidade | Manter fora do runtime da geração mínima até prova de valor | eventual pesquisa experimental e evidências históricas | evaluator ou experimento offline antes de reintegração | reintroduzir complexidade sem ganho mensurável | comparação objetiva `base` × candidata dinâmica | Aberto |
| D05 | Estrutura da LP | Contrato estrutural versionado limita formas, cardinalidades e layouts | Reduzir às invariantes realmente necessárias para renderização, acessibilidade e segurança | shape renderizável, hierarquia mínima e limites absolutos | escolher seções, sequência intermediária e narrativa | shape inválido ou experiência inconsistente | medir quais regras evitam falhas reais | Aberto |
| D06 | Copy e decisão persuasiva | Prompt + schema + validações determinísticas cercam a geração | Dar maior liberdade à IA e remover regras que antecipem decisões semânticas | claims objetivamente verificáveis e limites de segurança | argumento, hierarquia persuasiva, CTA e copy | invenção factual ou perda de qualidade | evaluator IA + amostra humana | Aberto |
| D07 | Validação factual | Validação pós-modelo cruza claims verificáveis com fatos autorizados | Manter apenas verificações determinísticas de alto valor; evitar policiamento semântico excessivo | fatos de empresa, preço, endereço, credenciais, prova social e outras afirmações objetivas | evaluator pode sinalizar qualidade/risco sem virar autoridade factual | hallucination factual | catálogo de falhas reais e testes negativos | Aberto |
| D08 | Imagem | Workload separado gera uma imagem antes da materialização | Avaliar se imagem deve permanecer obrigatória na primeira geração mínima | experiência visual e contrato atual do preview | gerar brief ou imagem diretamente dentro do fluxo mais simples possível | custo, latência e falha bloqueante | comparar LP com/sem imagem obrigatória | Aberto |
| D09 | Workflow e persistência | Geração textual, imagem, validação e append formam workflow controlado | Reduzir o número de estados e passos sem permitir revisão parcial ou inconsistente | atomicidade lógica, append-only, concorrência e histórico | não aplicável a invariantes de persistência | materialização parcial ou duplicada | mapear o mínimo necessário para uma revisão válida | Aberto |
| D10 | Avaliação de qualidade | Qualidade hoje depende de QA, testes e avaliações pontuais | Criar baseline simples e comparar candidatas fora do runtime antes de sofisticar | critérios humanos do produto | evaluator IA para especificidade, persuasão, aderência factual e qualidade | evaluator virar autoridade única | rubrica + comparação cega/amostral | Aberto |

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
- A imagem precisa ser condição de sucesso da primeira geração mínima?
- É possível reduzir estados intermediários sem perder materialização íntegra e histórico?

### 4.4 Prova de valor

- Qual será a baseline objetiva de qualidade, latência, custo e confiabilidade?
- Quais critérios o evaluator IA poderá avaliar e quais permanecem humanos/determinísticos?
- Qual ganho mínimo justifica introduzir novamente uma camada, workload ou etapa no runtime?

## 5. Decisões fechadas

### 5.1 Estado inicial

- A matriz é o artefato compartilhado de debate; não é autorização para implementar.
- O redesenho pretendido é greenfield focal da geração.
- Nenhuma implementação atual possui direito automático de permanência.
- A nova geração deve buscar a menor complexidade capaz de preservar segurança, fatos, estado e qualidade comprovada.

## 6. Ideias rejeitadas ou suspensas

### 6.1 Registro

- Nenhuma ideia é removida da memória do projeto: propostas rejeitadas devem permanecer registradas com motivo e condição objetiva de reabertura.
- E20.7 no caminho crítico fica, neste debate, como hipótese suspensa até comparação objetiva de benefício; isso não elimina seus artefatos históricos nem autoriza alteração operacional por esta matriz.

## 7. Protocolo de contribuição dos chats

### 7.1 Leitura mínima

- Antes de contribuir, consultar `README.md` e esta matriz.
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
