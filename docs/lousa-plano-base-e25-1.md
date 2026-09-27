# V1 funcional consolidada — PB-A / E25.1

Fonte: Debate 14B, seção 4.2, https://docs.google.com/document/d/19Gn0yxRXEIsLXQ-UqF9l-PW4nkqfc-PX2OjrNX0Tr18/edit
Revisão consultada: ANLCKQnMqGDQQFYBsO-oSWMG8npp-AQxApgjG3NLawodXiMe6-NgeCZ6sKltOy0C_C_N2Kze1TJSqWSSnTjG3xurDjYXukLdq9VXfzzrJfA

## 4.2 PB-A — E25.1 Base de Comunicação inicial — V1 funcional consolidada

### 4.2.1 Problema e resultado funcional

• Problema: com a retirada do onboarding factual E10.10 e da autoridade funcional da E20, a conta precisa de um ativo persistente que reúna a verdade da empresa e a inteligência de comunicação sem recriar camada factual intermediária.

• Resultado: uma única Base atual por conta, pertencente somente à conta, disponível após autorização comercial válida, consultável, editável, progressiva e reutilizável antes de existir Landing Page ou integração real de canal.

• A Base possui duas etapas: Etapa 1 — verdade da empresa; Etapa 2 — inteligência de comunicação. A Base pode começar incompleta e evoluir sem formulário global obrigatório anterior ao seu uso.

### 4.2.2 Comportamento, atores e limites

• Entrada mínima: e-mail de autenticação já disponível, sem torná-lo contato público; nome público do negócio/profissional; entendimento operacional da atuação. Taxon oficial competente é contexto útil quando existir, mas não é requisito para iniciar ou evoluir a Base.

• Atores: owner, admin e editor podem preencher e editar; viewer consulta em modo somente leitura, preservando Access Context, membership e autorização comercial nos domínios competentes.

• Etapa 1 organiza progressivamente a verdade da empresa, incluindo Negócio, Ofertas, Atendimento — inclusive horários, contatos e agendamento quando pertinentes — Provas/credenciais/resultados, Materiais/identidade e Preferências/limites. Uma seção incompleta não transforma toda a Base em bloqueio global.

• Contexto confirmado do Pending Setup é reaproveitado uma vez quando sua finalidade for inequívoca. Cópia direta não exige IA; texto livre pode ser organizado por IA apenas dentro do que o usuário afirmou. Hipóteses permanecem sugestões, e edição posterior da Base não sincroniza de volta com o Pending Setup, autenticação ou taxonomia.

• A IA é opcional na Etapa 1 para explicar, organizar e sugerir complementos; não inventa preço, credencial, prova, experiência, cliente, resultado, condição comercial ou outro fato particular da empresa.

• Etapa 2 usa IA para elaborar inteligência de comunicação combinando a verdade confirmada da empresa com pesquisa atual de mercado via Web Search quando atualidade ou localidade forem materiais. Pode elaborar Quem somos, Público/contexto, Dores/desejos/crenças/objeções, Proposta de valor, Benefícios, Diferenciais e FAQ.

• Dores, desejos, crenças, objeções e demais inferências de mercado que não sejam fatos verificáveis são tratadas como hipóteses estratégicas; pesquisa externa não promove automaticamente fato particular da empresa.

• Pesquisa, taxonomia, conversa, nicho, Landing Page, produto, Tarefa, campanha ou canal podem fornecer insumos ou consumir a Base, mas não se tornam proprietários, vínculos persistentes ou dependências de leitura/edição. Mudanças nesses insumos não reescrevem a Base silenciosamente.

• A LP Factory pode acrescentar novas seções posteriormente. Se usarem formato já suportado, Bases existentes recebem a nova seção sem perda do conteúdo anterior; formato ou comportamento realmente novo pode exigir recorte próprio. Não se cria agora framework ilimitado de seções.

• Escopo negativo: não inclui geração de LP ou outro produto, integração real com canais, alteração do Pending Setup ou da jornada E10, redesign comercial, implementação de trial, taxonomia sob demanda, D15B, nova autoridade factual, sincronização permanente, Agents SDK, multiagente, job, fila ou nova infraestrutura antecipada. Não reutilizar E20/E10.10 como arquitetura, catálogo ou segunda autoridade da Base; não criar Base por nicho, canal, produto, campanha ou LP; não construir framework arbitrário de seções, schema específico por nicho ou versionamento funcional selecionável por consumidores.

### 4.2.3 Posição planejada no roadmap e fases

• Caso macro planejado: E25 — Base de Comunicação. Recorte: E25.1 — Base de Comunicação inicial.

• 25.1.1 — Objetivo e status; 25.1.2 — Registros do recorte, materializados somente pela execução.

• 25.1.3 — Estrutura, governança e extensibilidade: Base única por conta, papéis, formatos iniciais, evolução de seções, isolamento e proteção contra vínculo vivo com fontes ou consumidores.

• 25.1.4 — Etapa 1 e aproveitamento inicial: verdade da empresa, Ofertas e demais seções iniciais, preenchimento progressivo, contexto confirmado do Pending Setup e assistência opcional de IA.

• 25.1.5 — Etapa 2 e inteligência de comunicação: pesquisa atual quando necessária, elaboração assistida por IA, distinção entre fato e hipótese estratégica e consumo posterior sem dependência persistente da pesquisa.

### 4.2.4 Classificação, automação e dependências

• Execução: Complexa. Motivo: cria novo caso macro e novo ativo persistente da conta, combina UI operacional, regras de edição, extensibilidade e assistência de IA/Web Search e exige derivação técnica formal antes da implementação.

• Automação: sim — automação com IA em fluxo controlado, não agentic. Etapa 1 permanece deterministic-first com IA opcional; Etapa 2 usa IA e pesquisa atual dentro de limites definidos. Ambiente principal: runtime da LP Factory, com OpenAI submetida à governança E21 vigente.

• Participação humana: o usuário fornece ou confirma a verdade da empresa e pode revisar/editar o conteúdo; não há aprovação humana obrigatória por chamada de IA. Falha de pesquisa quando atualidade/localidade forem materiais não autoriza substituição silenciosa por conhecimento paramétrico como se fosse atual.

• Dependências reais: Access Context/membership e entitlement comercial efetivo já existentes. Não depende de PB-B ou PB-C para a primeira validação por dogfooding, pois uma conta de teste pode usar a liberação administrativa vigente da E9.2.

### 4.2.5 Critérios de aceite e evidências esperadas

• Conta autorizada de dogfooding/teste consegue iniciar e usar a Base sem passar por E10.10 e sem taxon oficial obrigatório.

• Existe uma única Base atual por conta e o isolamento entre contas é preservado; nenhum consumidor externo se torna proprietário da Base.

• Etapa 1 funciona em casos representativos sem chamada obrigatória de IA, reaproveita informação confirmada sem pergunta repetida e não transforma hipótese em fato.

• O usuário consegue avançar progressivamente sem preencher todas as seções; Ofertas, atendimento, provas, materiais e demais conteúdos podem ser complementados depois.

• Etapa 2, quando acionada, usa pesquisa atual quando material, produz inteligência coerente com a verdade confirmada e distingue fato da empresa de hipótese estratégica de mercado.

• Nova seção com formato já suportado pode tornar-se disponível para Base existente sem perda ou reescrita do conteúdo anterior.

• QA em desktop e mobile comprova fluxo compreensível, estados de loading/erro/sucesso textuais, operação por teclado, foco visível e alvos de interação de pelo menos 44 px nos controles alterados, conforme Design System.

• Evidência final deve comprovar ausência de dependência funcional da E20/E10.10 para criar, ler, editar ou evoluir a Base.

### 4.2.6 Supervisão

• Supervisão: Autônomo. Após o handoff, o fluxo técnico conduz o plano sem supervisão rotineira do Estrategista Original, preservando integralmente a V1 e seu escopo negativo; questões fora da autoridade concedida devem ser escaladas conforme o Prompt Estrategista.
