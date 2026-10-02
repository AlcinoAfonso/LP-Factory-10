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

## V2 técnica candidata

Derivação técnica da V1; nenhum acréscimo funcional. Referência V1: commit `16abf1b4244bb2ca94b8817247918922fac62356`, blob `9d5b8a4dd32f6a5ba2a02c483e51cb2b12eb07e8`. Roadmap da base: commit `bcc55ceea461d21bef62ae8830323d24015f5e60`, blob `04baeb1f4212bbcaa79fff570b39ef51e6ddc02b`. Plano conceitual separado: N/A; o vínculo competente é PB-A do Debate 14C.

### 25.2.1 — Objetivo e status

Executar a V1 revisada na branch `codex-app/e25-2-colecao-detalhe`, PR único #1008 contra main, na mesma sessão e worktree. E25.1 está encerrado na fonte canônica; nenhuma dependência externa adicional consta na V1. Estado: derivação candidata, implementação e QA pendentes. PR #1004 não será reaberto nem usado como baseline.

### 25.2.2 — Registros do recorte e boundaries

- Alterações limitadas a `app/a/[account]/base-comunicacao/page.tsx`, componentes client da própria Base e validação focal de seu estado de apresentação; `docs/lousa-plano-base-e25-2.md` e registro factual E25.2 em `docs/roadmap.md`.
- Reutilizar registry, formatos/parser, Server Actions, adapters, access/membership/entitlement, versões, guards de geração/salvamento, precedência de sugestões e ui-state-keys. Não alterar esses contratos de domínio, prompts, workloads ou shell; testes focais podem reutilizar seus exports públicos.
- Nenhum novo pacote, rota, engine, workflow, banco ou infraestrutura. Componente local de coleção/dialog encapsula somente apresentação e retorno à coleção; não assume responsabilidade de domínio.
- QA/acessibilidade derivam dos critérios de aceite da V1 e do Design System vigente. Nenhuma modernização tecnológica ou oportunidade condicional integra a implementação. Baseline/renderização permanecem pendentes.
- Estrutura: N/A — responsabilidades de domínio, boundaries, dependências e persistência permanecem; o delta é composição local da UI. Automação: N/A — não há operação automatizada nova/alterada. Analista de plano necessário pelo risco de regressão do ciclo edição/salvamento/IA e proteção contra perda; avaliação independente da candidata antes da implementação.

### 25.2.3 — Coleção tabular, abertura de detalhe e edição da Base

- Preservar abas superiores e navegação acessível por setas/Home/End. Cada painel mostra sete seções na ordem e com labels do registry. Tabela HTML simples com `Seção`, `Estado` e `Ação`; linhas consecutivas, `Abrir` com nome acessível próprio, sem filtro/ordenação desnecessários. Estado deriva de conteúdo salvo e sugestão transitória disponível, sem nova métrica ou status de domínio.
- `Abrir` usa dialog nativo na rota existente, uma seção visível por vez, com título/aba, fechamento explícito, fundo inerte, foco contido e devolvido ao acionador. Mobile preserva tabela e identidade/estado/ação; dialog quase integral, conteúdo rolável, ações alcançáveis. Nenhum editor completo permanece visível na coleção.
- Detalhe inicia em leitura; Owner/Admin/Editor têm `Editar`, Viewer não recebe edição/IA. Ao editar, rascunho parte do persistido; `Salvar` disponível somente com alteração material válida pelos formatos/parser existentes e fora do lock de salvamento. `Cancelar` restaura persistido sem mutação. Usar componentes base e tokens semânticos, sem novo padrão visual.
- Comparação material normaliza pelo parser vigente; rascunho inválido diferente do persistido também fica protegido. Sucesso só retorna à leitura após resposta e refresh coerentes; erro/conflito preserva rascunho. Preservar versionamento e locks existentes; não usar refresh ou remount de coleção como descarte implícito.
- Saída por Cancelar, Fechar, Escape, backdrop, retorno/navegação aplicável requer confirmação se houver perda possível; continuar mantém texto/contexto, descartar retorna ao persistido/coleção. Modal impede troca de aba ao fundo. Proteção local de navegação/histórico e beforeunload cobre volta/saída da rota e fechamento do navegador sem alterar shell global. Salvamento em andamento não pode ser apresentado como operação reversível por Cancelar; aguardar sua conclusão.

### 25.2.4 — Estados, assistência por IA, responsividade e validação

- Preservar entrada sem Base e confirmação de importação do Pending Setup. Aplicar EmptyState/LoadingState/FeedbackMessage às finalidades pertinentes. Conteúdo válido permanece durante operações assíncronas; mensagens ficam próximas da ação com anúncio textual apropriado.
- Na aba Inteligência, ação geral explícita e opção de pesquisa mantêm alcance atual; resultado marca sugestões nas linhas. No detalhe, assistência local preserva insumos/alvo e informação a confirmar, fato versus hipótese e fontes correspondentes sob revelação progressiva. `Usar no editor` instala rascunho e entra em edição, sem salvar. IA geral/local, exclusão mútua, precedência, revisão e versões continuam nos guards existentes. Alternar/abrir/fechar não dispara IA nem gravação. Resultados transitórios não se confundem com conteúdo persistido.
- QA real autenticado no Preview do código corrente, com contas exclusivas catalogadas e acesso vigente, sem criar conta nem alterar entitlement para viabilizar o plano. Capturar baseline anterior e resultado em desktop/mobile; falta de acesso/evidência mantém somente o gate de QA aberto. Não reproduzir credenciais nos artefatos. `npm run dev` e inspeção local complementam Preview conforme recursos locais aprovados; não materializar secrets técnicos novos.
- Provar 320, 390 e 1280 px sem overflow horizontal; sete linhas e uma coleção ativa; dialog individual, leitura/edição, parser/validade, salvar sem alteração, sucesso/erro/conflito, permanecer/descartar, retorno com aba/rolagem/foco, navegador/volta, loading/sugestão/fontes e ausência de autosave. Papéis preservados por QA permitido e validadores de acesso existentes. Combinar inspeção automática e manual de teclado/foco/labels/anúncios/alvos >=44px/contraste/reflow; não declarar conformidade WCAG integral.
- `npm ci` executado; validar focalmente estados/transições de apresentação e guards existentes, depois `npm run check`, `git diff --check`, diff da base e QA renderizado. Observabilidade: N/A para nova instrumentação; execução IA conserva telemetria E21 existente e feedback de falha.
- Reconciliação final factual focal do roadmap preserva versão/data e registros históricos; julgamento documental material, se necessário, segue wrapper competente. Após QA e correções, review independente do HEAD publicado e conclusão explícita de toda revisão automática disparada; threads materiais/checks pendentes impedem liberação. Merge remoto somente por supervisão competente, com guarda atômica do SHA. Confirmar Production e registrar recibo/PR/merge/evidências no Debate 14C preservando V1 e histórico antes de concluir.
