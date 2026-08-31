# Matriz de Debate — Nova Geração Mínima de LP

## 1. Estado e finalidade

### 1.1 Estado

- Versão: v0.3.
- Data: 31/08/2026.
- Status: debate aberto; documento temporário mantido no PR #864.
- Natureza: debate e definições preliminares anteriores a qualquer plano-base.
- Não é plano-base, arquitetura-alvo, autorização de implementação, plano de cutover ou decisão operacional.
- Path temporário do debate: `docs/matriz-debate-geracao-minima.md`.
- PR de referência enquanto o debate estiver aberto: https://github.com/AlcinoAfonso/LP-Factory-10/pull/864
- Repositório: `AlcinoAfonso/LP-Factory-10`.

### 1.2 Finalidade

- Ser a fonte compartilhada e temporária do debate sobre uma geração mínima de Landing Pages.
- Consolidar propostas, contrapontos, evidências, dúvidas e definições preliminares antes da criação de um plano-base separado.
- Permitir que Estrategista, Analista, Orquestrador, executores e demais chats discutam a partir do mesmo estado.
- Evitar que hipótese, preferência ou aprendizado histórico seja convertido prematuramente em arquitetura, sequência de implementação ou obrigação de preservação.
- O conteúdo poderá ser consolidado, revisado, substituído ou descartado quando o debate for encerrado; não há intenção de torná-lo documento canônico do produto nesta fase.

### 1.3 Limite de autoridade

- Nenhuma linha desta matriz autoriza alterar código, banco, migrations, workflows, dependências, configuração, Production ou dados.
- Nenhuma linha aberta define componente futuro, arquivo futuro, boundary futuro, sequência de PRs ou estratégia de rollout.
- Definições preliminares registradas neste PR orientam o debate, mas não substituem a consolidação posterior em plano-base.
- O encerramento do debate não autoriza implementação automaticamente; o plano-base será um artefato posterior e separado.
- Referências a E19.3, E19.4, E20.7, PR13 ou outros componentes atuais são referências históricas para análise, não unidades presumidas da futura arquitetura.

### 1.4 Contexto operacional

- O estado atual de `main` e Production é evidência relevante para o debate, inclusive as falhas e contenções observadas no PR13.
- Este PR não decide se haverá estabilização separada, rollback adicional, convivência temporária, retirada imediata ou futura de qualquer componente.
- Qualquer ação operacional necessária durante o debate pertence a recorte próprio e exige autoridade própria; não decorre desta matriz.

## 2. Premissas preliminares aceitas para orientar o debate

### 2.1 Recorte

- O debate considera um redesenho greenfield focal do caminho de geração de LP, não a reconstrução do LP Factory 10 inteiro.
- A pergunta principal é qual é o menor sistema necessário para gerar uma LP útil hoje, usando os aprendizados acumulados.
- Nenhum arquivo, helper, adapter, boundary ou contrato interno do caminho atual possui direito automático de permanência.
- Reutilização de componente existente deve ser justificada por responsabilidade indispensável e simplicidade líquida, não por mera existência histórica.

### 2.2 Princípios de simplificação

- Priorizar simplicidade líquida: menos etapas, estados intermediários, dependências e pontos de falha.
- Preservar determinismo onde houver necessidade real de segurança, autorização, tenant, fatos verificáveis, estado, persistência e integridade.
- Preservar flexibilidade da IA para interpretação semântica, narrativa, persuasão e copy quando não houver necessidade comprovada de determinismo.
- Não assumir nova chamada de IA, agente, job, engine ou infraestrutura apenas por disponibilidade tecnológica.
- Antes de introduzir novo workload, avaliar se a IA já necessária para a geração pode assumir a responsabilidade semântica em questão.
- Sofisticação futura deve demonstrar benefício proporcional em qualidade, custo, latência, confiabilidade ou valor ao cliente.
- Uma simplificação que apenas desloca complexidade para outro módulo não conta como ganho.

### 2.3 Dados atuais de teste

- As LPs existentes hoje são dados de teste, inclusive revisões/materializações e imagens associadas.
- Esses dados não constituem, por si, requisito de preservação histórica do produto para o futuro redesenho.
- Esta definição preliminar remove esses dados de teste como restrição automática do debate, mas não autoriza deleção nem define quando ou como eventual limpeza ocorrerá.
- A mesma dispensa não se estende automaticamente a contas, taxonomia, pesquisas autorizadas, configurações, contratos de segurança, infraestrutura ou outros dados do projeto.

## 3. Matriz principal de debate

| ID | Tema | Referência atual | Hipótese para debate | Responsabilidade que pode ser indispensável | Papel possível da IA | Risco principal | Evidência necessária | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Entrada da geração | O caminho atual recebe contexto preparado por múltiplas fronteiras | Definir o menor pacote de entrada que contenha apenas o necessário para gerar bem | autorização, tenant, fatos, pesquisa válida e identidade mínima | interpretar o contexto semântico sem pré-composição narrativa | omitir informação indispensável | comparar pacote mínimo com geração atual | Aberto |
| D02 | Boundary de contexto | E19.3 hoje entrega `identities + modelContext + serverContext` | Verificar se as responsabilidades desse boundary podem ser preservadas por contrato menor ou mais direto | separação modelo/server, fatos revalidados e proveniência | interpretar diretamente pesquisa e fatos autorizados | exposição de dado server-side ou perda factual | inventário de consumidores e campos realmente usados | Aberto |
| D03 | Pesquisa-base | Pesquisa integral autorizada/preparada chega ao caminho de geração | Entregar pesquisa autorizada com o mínimo de transformação sem seleção semântica determinística prévia | identidade, versão, integridade e autorização da fonte | selecionar o que importa para oferta e público | uso de fonte errada ou desatualizada | geração comparativa com pesquisa integral | Aberto |
| D04 | Pesquisa dinâmica / E20.7 | A introdução no caminho crítico mostrou custo, latência e fragilidade | Avaliar se agrega valor suficiente para fazer parte da solução mínima, ficar fora do runtime ou ser descartada | eventual ganho factual ou de atualidade comprovado | pesquisa/evaluator apenas se benefício for demonstrado | reintroduzir complexidade sem ganho mensurável | comparação objetiva entre alternativas | Aberto |
| D05 | Estrutura da LP | O contrato atual limita formas, cardinalidades e layouts | Identificar apenas as invariantes realmente necessárias para renderização, acessibilidade e segurança | shape renderizável, hierarquia mínima e limites absolutos | escolher seções, sequência e narrativa | shape inválido ou experiência inconsistente | medir quais regras evitam falhas reais | Aberto |
| D06 | Copy e decisão persuasiva | Prompt, schema e validações cercam a geração | Dar maior liberdade à IA e retirar regras que antecipem decisões semânticas sem necessidade comprovada | claims objetivamente verificáveis e limites de segurança | argumento, hierarquia persuasiva, CTA e copy | invenção factual ou perda de qualidade | evaluator IA + amostra humana | Aberto |
| D07 | Validação factual | Validação pós-modelo cruza claims com fatos autorizados | Manter somente verificações determinísticas de alto valor e evitar policiamento semântico duplicado | fatos de empresa, preço, endereço, credenciais, prova social e afirmações objetivas | evaluator pode sinalizar qualidade/risco sem virar autoridade factual | hallucination factual | catálogo de falhas reais e testes negativos | Aberto |
| D08 | Imagem | Workload separado gera imagem antes da materialização | Avaliar se imagem integra o produto mínimo, entra depois ou deve seguir outro fluxo | valor visual/comercial realmente necessário | gerar brief ou imagem da forma mais simples justificável | custo, latência e falha bloqueante | comparar valor do produto com e sem imagem | Aberto |
| D09 | Workflow e persistência | Texto, imagem, validação e append formam workflow controlado | Reduzir estados e passos preservando apenas integridade necessária | atomicidade lógica, concorrência e integridade de futuras LPs reais | não substitui invariantes de persistência | materialização parcial ou duplicada | mapear o mínimo necessário para uma LP válida | Aberto |
| D10 | Avaliação de qualidade | Qualidade depende de QA, testes e avaliações pontuais | Criar baseline simples e comparar alternativas antes de sofisticar runtime | critérios humanos do produto | evaluator IA para especificidade, persuasão, aderência factual e qualidade | evaluator virar autoridade única | rubrica + comparação cega/amostral | Aberto |
| D11 | Produto mínimo | A geração atual incorporou vários requisitos antes de provar o menor produto utilizável | Definir qual entrega mínima ainda representa uma LP útil para o cliente | capacidade real de gerar, visualizar e usar uma LP coerente com a oferta | concentrar interpretação, estrutura e copy quando fizer sentido | cortar requisito real do produto | critérios mínimos de entrega + LPs de teste | Aberto |
| D12 | Transição futura | `main`, Production e o caminho atual não estão no mesmo estado operacional | Debater quais estratégias de transição poderão ser consideradas depois que a arquitetura mínima for definida | continuidade operacional e segurança | não substitui decisão de rollout | antecipar cutover antes da arquitetura ou manter legado sem necessidade | comparar alternativas de transição somente após definições arquiteturais preliminares | Aberto |
| D13 | Legado técnico | Código, contratos, adapters e testes acumulam decisões históricas | Identificar o que é responsabilidade real e o que é compatibilidade histórica dispensável | consumidores externos reais e responsabilidades de segurança | ajudar a inventariar dependências, sem autorizar remoção | apagar dependência ainda usada ou preservar legado sem valor | inventário de consumidores e responsabilidades | Aberto |

## 4. Questões abertas prioritárias

### 4.1 Entrada mínima

- Qual é o conjunto mínimo de fatos e pesquisa que a IA precisa receber para gerar uma LP de boa qualidade?
- Quais responsabilidades hoje concentradas no pacote E19.3 continuam necessárias, independentemente de sua implementação atual?
- Quais dados hoje carregados nunca influenciam legitimamente a geração?

### 4.2 Determinismo versus IA

- Quais regras atuais protegem segurança, fatos ou integridade e quais apenas tentam antecipar decisões criativas?
- Quais decisões podem ser entregues diretamente à IA já necessária para a geração?
- Quais validações pós-modelo são indispensáveis e quais apenas duplicam prompt ou schema?

### 4.3 Estrutura e mídia

- Qual é a menor estrutura determinística necessária para o renderer produzir uma LP segura e consistente?
- A imagem precisa fazer parte do produto mínimo?
- Quais estados intermediários realmente protegem integridade e quais existem apenas por evolução histórica?

### 4.4 Produto mínimo

- Qual é a menor entrega que ainda representa uma Landing Page utilizável para o MVP?
- O que o cliente precisa conseguir ver, usar ou validar para considerarmos a geração bem-sucedida?
- Quais requisitos atuais foram introduzidos antes de existir evidência de necessidade para o MVP?

### 4.5 Transição e legado

- Depois que houver arquitetura mínima preliminarmente definida, quais opções de transição merecem comparação?
- Existe necessidade comprovada de convivência entre caminhos ou a substituição poderá ser direta?
- Quais responsabilidades atuais possuem consumidores fora da geração e por isso não podem ser tratadas como legado dispensável?
- Quais dados de teste poderão ser removidos quando houver plano e autorização próprios?

### 4.6 Prova de valor

- Qual será a baseline objetiva de qualidade, latência, custo e confiabilidade?
- Quais critérios o evaluator IA poderá avaliar e quais permanecem humanos ou determinísticos?
- Qual ganho mínimo justificaria adicionar novamente uma camada, workload ou etapa no runtime?

## 5. Definições preliminares registradas

### 5.1 Limites do debate

- O PR #864 é um artefato temporário de debate anterior ao plano-base.
- O foco é greenfield apenas no caminho de geração, não reconstrução geral do SaaS.
- Nenhuma implementação atual possui direito automático de permanência.
- O objetivo de simplificação é reduzir complexidade sem remover responsabilidades realmente necessárias.
- Referências a componentes atuais servem para aprendizado e confronto, não para preservar sua decomposição na solução futura.

### 5.2 Dados de teste

- As LPs atuais, suas revisões/materializações e imagens são dados de teste e não criam requisito histórico de produto para o redesenho.
- Eventual deleção, limpeza ou cutover permanece fora da autoridade deste PR.

### 5.3 Caráter preliminar

- As definições desta seção delimitam o debate e poderão ser refinadas antes do plano-base se surgir evidência nova ou decisão humana diferente.
- Nenhuma definição desta seção estabelece arquivo, rota, banco, job, workload, boundary, sequência de implementação, estratégia de rollout ou plano de cutover.

## 6. Ideias rejeitadas, suspensas ou sem decisão

### 6.1 Registro

- Nenhuma ideia relevante deve desaparecer do histórico do debate: propostas rejeitadas ou suspensas devem registrar motivo e condição objetiva de reabertura.
- Pesquisa dinâmica no caminho crítico permanece em debate; não possui preservação automática nem remoção automaticamente decidida por este PR.
- Estratégias de estabilização, rollback, convivência ou cutover permanecem fora de decisão enquanto forem apenas alternativas em discussão.

## 7. Protocolo de contribuição e handoff dos chats

### 7.1 Leitura mínima

- Antes de contribuir, consultar `README.md` e o estado mais recente desta matriz no PR #864.
- Como o documento é temporário e não será promovido ao índice canônico do `README.md` nesta fase, o handoff entre chats deve fornecer explicitamente o PR #864.
- Consultar documentos adicionais somente quando necessários para sustentar o tema específico em debate.

### 7.2 Formato de contribuição

- Identificar o `ID` da linha debatida ou propor novo `ID`.
- Registrar proposta ou contraponto de forma objetiva.
- Explicar qual complexidade seria removida ou adicionada.
- Separar responsabilidade indispensável de conveniência histórica da implementação atual.
- Informar riscos e evidências disponíveis.
- Classificar a contribuição como `manter`, `simplificar`, `substituir`, `remover`, `experimentar`, `suspender` ou `sem decisão`.
- Não converter a classificação em instrução de implementação dentro deste PR.

### 7.3 Consolidação preliminar

- Somente decisão humana explícita ou consolidação expressamente autorizada pode registrar uma definição preliminar na seção 5.
- Uma definição preliminar deve registrar motivo suficiente para evitar rediscussão sem fato novo, mas continua anterior ao plano-base.
- Encerrar uma linha da matriz significa apenas encerrar aquela questão para a fase de debate; não autoriza implementação.

### 7.4 Handoff obrigatório

- Todo handoff para outro chat que participe deste debate deve incluir explicitamente o link do PR #864: https://github.com/AlcinoAfonso/LP-Factory-10/pull/864
- O handoff deve instruir o próximo chat a ler a versão mais recente de `docs/matriz-debate-geracao-minima.md` na branch/HEAD do PR.
- O handoff deve informar que o PR contém debate e definições preliminares, não plano-base ou autorização de implementação.
- Quando o debate for encerrado, o último estado da matriz deve apenas apontar para o artefato posterior de plano-base, sem transformar o próprio PR #864 nesse plano.
