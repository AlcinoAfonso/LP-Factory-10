# E25.2 — Experiência de cliente da Base de Comunicação

Fonte: Debate 14C — PB-A, V1 revisada e aprovada em 02/10/2026.
Google Drive: https://docs.google.com/document/d/1-gV_16Gh5_y4bc7R2219KZ_Bhv6PV9p30-LOvnA-v8E/edit
Supervisão: Autônomo. Handoff recebido em 02/10/2026.
Baseline: main `bcc55ceea461d21bef62ae8830323d24015f5e60`. PR #1004 fechado sem merge; não é baseline.

## V1 funcional aprovada (transcrição)

4. Plano Base
4.1 PB-A — E25.2 Experiência de cliente da Base de Comunicação — V1 funcional revisada e aprovada em 02/10/2026
4.1.1 Problema e resultado funcional
• Problema: a Base funciona, mas sua experiência ainda pode parecer excessivamente operacional, densa ou administrativa para uma superfície diretamente usada pelo cliente.
• Resultado: transformar a Base em uma experiência client-facing compreensível, fluida, profissional e confiável, com foco claro na tarefa e percepção de qualidade, preservando integralmente os contratos funcionais existentes.
4.1.2 Comportamento esperado
• O cliente deve compreender rapidamente onde está, qual é o papel da área atual e o que pode fazer em seguida.
• A Base mantém no topo as duas abas horizontais “Verdade da empresa” e “Inteligência de comunicação”; cada aba exibe somente sua própria coleção de seções.
• Dentro da aba ativa, as seções aparecem primeiro como lista tabular compacta, conforme o Design System, com cabeçalhos/títulos claros, uma linha por seção, estado essencial quando útil e ação explícita para abrir o detalhe. Filtros ou ordenação só entram quando realmente ajudarem a localizar, comparar ou restringir itens.
• Ao abrir uma seção, o cliente entra em um detalhe orientado à tarefa para consultar ou editar aquela seção e consegue retornar naturalmente à mesma coleção/contexto. O mecanismo concreto do detalhe pode ser página ou modal apenas quando compatível com o Design System e sem alterar a arquitetura coleção → detalhe.
• A assistência por IA deve aparecer como apoio à tarefa do cliente, com linguagem humana e sem expor complexidade técnica desnecessária. Política de pesquisa, metodologia estratégica e qualidade do conteúdo da Etapa 2 permanecem sob autoridade do Debate 14D.
• O Gestor de Design aplica o docs/design-system.md a este contrato e pode refinar hierarquia, espaçamento, componentes, responsividade, estados e o mecanismo do detalhe; não pode substituir a coleção tabular por sidebar, workspace, grid de cards, editor embutido ou outra arquitetura sem exceção funcional explícita aprovada pelo titular.
• Desktop e mobile devem preservar a mesma coleção, identidade da seção, estado essencial, ação de abertura e continuidade da tarefa, com adaptação responsiva conforme o Design System.
• No detalhe, edição, salvamento, cancelamento, alterações não salvas, feedback e estados assíncronos seguem o docs/design-system.md vigente e mantêm o conteúdo válido já disponível.
4.1.3 Usuários e permissões
• Owner, Admin e Editor preservam edição conforme o contrato vigente da Base; Viewer preserva acesso somente leitura.
• Nenhuma decisão visual pode ampliar, reduzir ou redistribuir permissões, entitlement, membership ou regras de acesso.
4.1.4 Limites e escopo negativo
• Não alterar o domínio funcional da Base, sua autoridade por conta, persistência, permissões, entitlement, Pending Setup ou contratos de E10.11/E25.1.
• Não redefinir conteúdo, estratégia persuasiva, prompts, Web Search, modelo, reasoning effort ou metodologia da Etapa 2; esses temas pertencem ao Debate 14D e aos contratos técnicos competentes.
• Não criar nova infraestrutura, engine, automação, rota, banco ou domínio para viabilizar a experiência.
• Não substituir a lista tabular por navegação lateral persistente, workspace, grid de cards ou editor embutido como arquitetura principal; cards permanecem restritos aos usos autorizados pelo Design System ou a exceção funcional aprovada.
• Não alterar shell global, AccountSwitcher, logout, navegação da conta ou outras superfícies fora da Base para viabilizar este plano. Se isso se tornar indispensável, parar e obter autorização humana explícita antes de ampliar o recorte.
• Não executar redesign amplo de outros dashboards nem alterar o Design System dentro deste plano; achado transversal deve retornar ao Debate 13/Design System.
• O PR #1004 foi fechado sem merge e não é baseline funcional ou técnica desta nova execução. Sua arquitetura, V2 e implementação não devem ser reaproveitadas por inércia; qualquer reaproveitamento futuro precisa ser necessário e compatível item a item com esta V1 e com o Design System.
4.1.5 Posição planejada no roadmap e fases
• Posição planejada: E25.2 — Experiência de cliente da Base de Comunicação, dentro de E25 — Base de Comunicação.
• 25.2.1 — Objetivo e status.
• 25.2.2 — Registros do recorte.
• 25.2.3 — Coleção tabular, abertura de detalhe e edição da Base.
• 25.2.4 — Estados, assistência por IA, responsividade e validação da experiência.
4.1.6 Automação e supervisão
• Automação: não criar nova automação. As assistências de IA já existentes permanecem capacidades do produto e não transformam este plano em automação operacional.
• Supervisão: Autônomo, por escolha explícita do titular em 01/10/2026.
4.1.7 Critérios de aceite e evidências esperadas
• O docs/design-system.md é tratado como fonte da verdade para o design da página; o Gestor de Design aplica e refina seus padrões dentro desta V1, sem substituí-los. Qualquer exceção funcional exige decisão humana explícita registrada neste Debate.
• A experiência renderizada preserva as duas abas superiores e, dentro da aba ativa, apresenta a coleção de seções como lista tabular compacta com cabeçalhos/títulos claros, linhas consecutivas e ação explícita para abrir cada detalhe.
• Abrir uma linha leva ao detalhe de uma seção por vez e o retorno preserva a coleção e o contexto; sidebar persistente, workspace, grid de cards ou editor permanentemente embutido não constituem a arquitetura principal.
• Estados de edição, salvamento, saída sem salvar, loading, erro, sucesso e assistência por IA são compreensíveis e previsíveis.
• A separação entre conteúdo do cliente, assistência da IA e ações humanas permanece clara.
• Desktop e mobile preservam operação, contexto e ações essenciais, com teclado, foco, labels e acessibilidade aplicáveis conforme o Design System.
• O QA inclui evidência renderizada e observação da jornada como cliente em desktop e mobile; inspeção de código isolada não comprova o aceite visual.
• Nenhuma mudança funcional de D14D, E25.1, E10.11, shell global, acesso, banco ou infraestrutura é necessária para considerar este plano concluído.
