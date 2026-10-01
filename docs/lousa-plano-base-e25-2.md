# E25.2 — Experiência de cliente da Base de Comunicação

Fonte: Debate 14C — PB-A, seção 4.1, V1 funcional aprovada.
Referência: https://docs.google.com/document/d/1-gV_16Gh5_y4bc7R2219KZ_Bhv6PV9p30-LOvnA-v8E/edit
Supervisão: Autônomo. Execução: end-to-end.
Base do repositório: 1894f8f94fb9fe185ba58e3dab063fbe2f2d0c35.

## V1 aprovada — conteúdo integral congelado

4.1 PB-A — E25.2 Experiência de cliente da Base de Comunicação — V1 funcional aprovada
4.1.1 Problema e resultado funcional
• Problema: a Base funciona, mas sua experiência ainda pode parecer excessivamente operacional, densa ou administrativa para uma superfície diretamente usada pelo cliente.
• Resultado: transformar a Base em uma experiência client-facing compreensível, fluida, profissional e confiável, com foco claro na tarefa e percepção de qualidade, preservando integralmente os contratos funcionais existentes.
4.1.2 Comportamento esperado
• O cliente deve compreender rapidamente onde está, qual é o papel da área atual e o que pode fazer em seguida.
• A separação funcional entre Verdade da empresa e Inteligência de comunicação deve permanecer clara, sem exigir que a solução visual atual de abas seja preservada se o Gestor de Design definir alternativa melhor dentro do mesmo contrato.
• A experiência deve reduzir carga cognitiva e competição entre controles, favorecer foco na área em trabalho e preservar acesso simples às demais áreas da Base.
• Edição, salvamento, cancelamento, alterações não salvas, feedback e estados assíncronos devem seguir o docs/design-system.md vigente e manter o conteúdo válido já disponível.
• A assistência por IA deve aparecer como apoio à tarefa do cliente, com linguagem humana e sem expor complexidade técnica desnecessária. Política de pesquisa, metodologia estratégica e qualidade do conteúdo da Etapa 2 permanecem sob autoridade do Debate 14D.
• A composição concreta — cards, workspace, navegação, modal, detalhe ou outra solução — não é fixada nesta V1 e deve ser definida pelo Gestor de Design dentro do Design System e do resultado funcional aprovado.
• Desktop e mobile devem preservar contexto, informação essencial, ações e continuidade da tarefa.
4.1.3 Usuários e permissões
• Owner, Admin e Editor preservam edição conforme o contrato vigente da Base; Viewer preserva acesso somente leitura.
• Nenhuma decisão visual pode ampliar, reduzir ou redistribuir permissões, entitlement, membership ou regras de acesso.
4.1.4 Limites e escopo negativo
• Não alterar o domínio funcional da Base, sua autoridade por conta, persistência, permissões, entitlement, Pending Setup ou contratos de E10.11/E25.1.
• Não redefinir conteúdo, estratégia persuasiva, prompts, Web Search, modelo, reasoning effort ou metodologia da Etapa 2; esses temas pertencem ao Debate 14D e aos contratos técnicos competentes.
• Não criar nova infraestrutura, engine, automação, rota, banco ou domínio para viabilizar a experiência.
• Não transformar wireframes exploratórios deste Debate em especificação visual obrigatória.
• Não executar redesign amplo de outros dashboards nem alterar o Design System dentro deste plano; achado transversal deve retornar ao Debate 13/Design System.
4.1.5 Posição planejada no roadmap e fases
• Posição planejada: E25.2 — Experiência de cliente da Base de Comunicação, dentro de E25 — Base de Comunicação.
• 25.2.1 — Objetivo e status.
• 25.2.2 — Registros do recorte.
• 25.2.3 — Arquitetura de experiência, foco e edição da Base.
• 25.2.4 — Estados, assistência por IA, responsividade e validação da experiência.
4.1.6 Automação e supervisão
• Automação: não criar nova automação. As assistências de IA já existentes permanecem capacidades do produto e não transformam este plano em automação operacional.
• Supervisão: Autônomo, por escolha explícita do titular em 01/10/2026.
4.1.7 Critérios de aceite e evidências esperadas
• O fluxo técnico consulta o docs/design-system.md vigente e usa o Gestor de Design para definir a solução UI/UX concreta sem ampliar a V1.
• A experiência renderizada permite ao cliente reconhecer contexto, área ativa, estado de edição e próxima ação sem depender de conhecimento técnico do sistema.
• A superfície reduz densidade e competição visual quando isso melhorar a tarefa, sem perda de conteúdo, ação, permissão ou capacidade existente.
• Estados de edição, salvamento, saída sem salvar, loading, erro, sucesso e assistência por IA são compreensíveis e previsíveis.
• A separação entre conteúdo do cliente, assistência da IA e ações humanas permanece clara.
• Desktop e mobile preservam operação, contexto e ações essenciais, com teclado, foco, labels e acessibilidade aplicáveis conforme o Design System.
• O QA inclui evidência renderizada e observação da jornada como cliente em desktop e mobile; inspeção de código isolada não comprova o aceite visual.
• Nenhuma mudança funcional de D14D, E25.1, E10.11, acesso, banco ou infraestrutura é necessária para considerar este plano concluído.
