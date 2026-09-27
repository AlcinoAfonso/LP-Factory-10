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

## 5. V2 técnica candidata — derivação da V1

### 5.1 Estado, fronteira e fonte

- Esta V2 candidata acrescenta somente o contrato técnico para E25.1. A seção 4.2 acima permanece integral e imutável como V1 funcional; em conflito de resultado ou escopo, prevalece a V1.
- Referência imutável da V1: commit `4ed0ea5a366d6d566a751fcc3487209b0068ec1a`, blob `b4babf6f7224fe926f677d221a68bdfa074c3b71`. Base inicial: `origin/main@b771bec758d8cd32a40174a064af39a334bdb03e`; snapshot de `docs/roadmap.md`: blob `71dbda023094c12e6480ddc3e8e33aa52c89e6ad`.
- Plano conceitual separado: N/A; o Debate 14B é a fonte funcional aprovada. PB-B e PB-C não são pré-requisitos da criação e da primeira validação da Base. A afirmação antiga de dependência de E10.10 no roadmap é reconciliada pelo ABC de planejamento, sem alterar a jornada E10 neste recorte.
- Todas as decisões abaixo são derivações técnicas da V1 e dos contratos existentes, exceto o complemento de QA de `prod#17`, classificado como modernização técnica justificada de impacto estrutural baixo e nenhum efeito funcional. O gate financeiro de IA em 5.4 permanece questão material explícita; não reinterpreta a V1 como entrega sem Etapa 2.

### 5.2 E25.1.3 — Estrutura, governança e extensibilidade

- Criar boundary próprio `lib/communication-base/` com contratos, registry fechado de seções, validação, adapter de persistência e provider de IA separado. A Base pertence só a `account_id`; nenhuma FK, owner ou identidade persistente de taxon, conversa, pesquisa, LP, produto, Tarefa, campanha ou canal. Não importar E20/E10.10 como fonte, catálogo, gate ou adapter.
- Uma migration canônica cria `public.account_communication_bases` com `account_id uuid` como PK/FK `accounts(id)`, `sections_json jsonb NOT NULL DEFAULT '{}'` com CHECK de objeto, `version integer` positiva e timestamps. A PK impõe uma Base atual por conta. Não criar histórico funcional selecionável, tabelas por seção, storage novo, job, fila ou framework arbitrário.
- O registry em código define chave estável, etapa, formato suportado e rótulo das seções iniciais. Etapa 1: Negócio, Ofertas, Atendimento, Provas/credenciais/resultados, Materiais/identidade e Preferências/limites. Etapa 2: Quem somos, Público/contexto, Dores/desejos/crenças/objeções, Proposta de valor, Benefícios, Diferenciais e FAQ. Formatos iniciais limitados a texto e itens ordenados; FAQ pode usar pares pergunta/resposta. Nova seção nesses formatos surge como chave ausente e editável em Bases existentes; gravar uma seção preserva todas as demais chaves e valores, inclusive desconhecidos de versões futuras. Formato novo requer avaliação própria.
- O adapter valida entrada e saída por chave/formato, tamanhos e versão, devolvendo DTO em vez de row cru. Criação concorrente trata colisão da PK por releitura; atualização exige `account_id` e versão observada, avança a versão e sinaliza conflito para recarga quando nenhuma linha for atualizada. Não sobrescrever uma edição concorrente nem substituir o objeto inteiro com estado obsoleto.
- Migration habilita RLS na tabela exposta e concede somente `SELECT, INSERT, UPDATE` a `authenticated`; `anon` não recebe grants. Policies de leitura exigem membership ativa na conta e autorização comercial efetiva vigente; policies de escrita exigem também papel `owner|admin|editor`, com `USING` e `WITH CHECK` no UPDATE. A condição de entitlement usa a autoridade efetiva E9, sem inferir acesso de `accounts.status=active`. Testar grants, policies, papéis, expiração, ausência de entitlement e isolamento entre contas separadamente. Nenhuma view ou função `SECURITY DEFINER` nova.
- Rota própria `/a/[account]/base-comunicacao` e suas Server Actions revalidam Access Context, conta ativa, membership, papel e `readCommercialEntitlementSignal` server-side; erro de leitura falha fechado e ausência legítima mantém a política comercial existente. `viewer` só consulta. Um acesso visível no shell da conta autorizada conduz à rota sem exigir E10.10 nem taxon; o sinal usado no cliente não concede autorização. Não mudar `account-journey-loader`, Pending Setup, fluxo comercial ou cutover da E10.
- O runtime hospedado não consulta a nova tabela antes do apply validado. O fluxo de migration pós-merge e a estratégia de deploy/feature gate devem seguir `docs/platform-config.md`; ausência do objeto no ambiente alvo produz indisponibilidade explícita da Base, sem cair em E20/E10.10.

### 5.3 E25.1.4 — Etapa 1 e aproveitamento inicial

- A Base nasce sob ação de conta autorizada e pode permanecer parcial. Cada seção salva independentemente com estados textuais de loading, sucesso, validação, conflito e falha; seções vazias não bloqueiam leitura ou edição das demais. Nome público do negócio/profissional e atuação operacional são campos próprios da Base; nome preferido da pessoa, razão social, e-mail de autenticação e contato público não se confundem. O e-mail autenticado pode aparecer apenas como referência privada.
- A criação faz uma única leitura focal e sem efeito lateral de conversa `account_pending_setup_conversations` concluída, na própria conta. Não chamar o adapter que inicia conversa nem escrever de volta nessa fonte. Só copiar dado confirmado cujo destino e finalidade sejam inequívocos; havendo ausência, conflito, hipótese ou ambiguidade, deixar o campo editável vazio ou mostrar sugestão separada. Criação idempotente e releituras não repetem importação nem sobrescrevem edição posterior.
- Dado direto é copiado por regra determinística. IA opcional pode explicar campos, organizar texto livre ou sugerir complementos, sempre como rascunho separado dos valores confirmados. A saída é validada no servidor; fato particular só entra na verdade da empresa após ação explícita do usuário. Falha da IA preserva todos os formulários manuais.
- Materiais/identidade na primeira entrega aceitam referências textuais informadas pelo cliente; upload, novo storage e integração de canal não são necessários para cumprir a V1.

### 5.4 E25.1.5 — Etapa 2 e inteligência de comunicação

- Acionamento explícito pelo usuário envia ao provider server-side somente os campos confirmados pertinentes. Registrar workload próprio no catálogo E21 vigente e usar as APIs públicas de configuração, observabilidade e custo; prompt, transporte e validação residem no boundary da Base. Antes de criar prompt consumido pelo runtime, usar o subfluxo `$lp-factory-criar-prompt` e validar exemplos representativos.
- Saída estruturada e validada separa descrições derivadas dos fatos confirmados da empresa de hipóteses estratégicas de mercado. Pesquisa externa nunca confirma por si só preço, credencial, prova, resultado, condição ou outro fato particular. O resultado fica revisável/editável como conteúdo da Base; referências de pesquisa são proveniência da elaboração, sem vínculo vivo nem sincronização com a fonte. Dados web são tratados como dados, não instruções.
- Quando atualidade ou localidade forem materiais para a elaboração, exigir Web Search efetivamente executado e fontes verificáveis antes de concluir. Erro, ausência de pesquisa requerida ou fonte insuficiente geram estado inconclusivo/erro textual; não apresentar conhecimento paramétrico como pesquisa atual. Sem essa materialidade, não exigir busca por rotina. Não há aprovação humana obrigatória por chamada, mas o usuário pode revisar e editar.
- Ponto material a resolver no gate do Analista: `docs/gestor-automations.md` exige prova de custo incremental zero antes de recomendar/implementar automação. A V1 exige IA na Etapa 2, e a cobrança por tokens/Web Search impede presumir gratuidade com base na chave existente. A V2 não autoriza remover, transformar em opcional ou fasear a Etapa 2, nem ativar chamadas pagas sem prova/decisão competente. Investigar créditos/contrato vigente sem expor secrets; se o gate não puder ser satisfeito, devolver a incompatibilidade ao supervisor competente mantendo a V1 intacta.

### 5.5 Gates de implementação e aceite

- Ordem de checkpoints executáveis: `E25.1.3 — Estrutura, governança e extensibilidade`; `E25.1.4 — Etapa 1 e aproveitamento inicial`; `E25.1.5 — Etapa 2 e inteligência de comunicação`. `25.1.1` é objetivo/status; `25.1.2` recebe registros reais somente na execução.
- E25.1.3 prova PK por conta, proteção cruzada, papel viewer, entitlement ausente/expirado/falha, concorrência e evolução de seção; E25.1.4 prova uso progressivo sem IA, importação confirmada única e ausência de escrita reversa; E25.1.5 prova distinção fato/hipótese, pesquisa quando material, falha fechada da pesquisa e edição posterior sem dependência viva.
- Antes de qualquer checkpoint com código: `npm ci` no início do lote contínuo, validações focais e `npm run check`; `git diff --check`. Migration integral e casos SQL positivos/negativos em PostgreSQL compatível isolado ou transação efêmera com rollback antes do merge; inspeção remota somente read-only antes do merge. Após apply canônico, repetir provas hospedadas aplicáveis antes de declarar a Base operacional.
- QA real em Preview e, após apply, no ambiente alvo autorizado: conta de dogfooding com liberação E9.2 e sem taxon/E10.10; papéis owner/admin/editor/viewer; desktop/mobile; criação, retorno, edição, falhas e estados; teclado, foco visível e alvo mínimo de 44 px. Na nova rota e controles alterados, registrar critérios WCAG 2.2 pertinentes: labels/instruções, contraste, ausência de ação só por hover e feedback textual. Combinar inspeção automática e manual; não declarar conformidade WCAG integral por resultado automático isolado.
- Evidência final mostra que criar, ler, editar e evoluir a Base não dependem funcionalmente de E20/E10.10; nenhuma alteração deste recorte implementa PB-B/PB-C, LP, canal, trial, novo comercial, nova taxonomia ou mudança do Pending Setup/E10.
