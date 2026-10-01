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


## V2 técnica candidata

### Identidade, decisões e fronteira

- V1 imutável: commit `2a23af961ffe19e389545ec67d7303481ebd9958`, blob `edea658555a19ab886902f9f06aab38383e92ac0`, neste mesmo path; fonte Debate 14C PB-A/4.1.
- Execução na mesma sessão, worktree `e25-2-experiencia-cliente/LP-Factory-10`, branch `codex-app/e25-2-experiencia-cliente`, único PR draft #1004 contra `main`.
- Base do roadmap: commit `1894f8f94fb9fe185ba58e3dab063fbe2f2d0c35`, blob `04baeb1f4212bbcaa79fff570b39ef51e6ddc02b`; E25.1 concluído positivamente, sem outro predecessor declarado para E25.2. Plano conceitual separado: N/A; a fonte funcional competente é o Debate 14C.
- Todos os acréscimos abaixo são derivação técnica da V1 e do Design System vigente. Não há mudança de produto, arquitetura de dados, autoridades ou infraestrutura.

### 25.2.1 — Objetivo e status

- Preservar a V1 e entregar uma experiência da Base com orientação breve, contexto/etapa/seção reconhecíveis, foco em um editor e continuidade de tarefa.
- Estados de planejamento, implementação e conclusão permanecem distintos; registrar o estado competente no roadmap por ABC. Merge depende dos gates independentes, QA e liberação explícita da Supervisão Autônomo para o mesmo HEAD.

### 25.2.2 — Registros do recorte

- Alvo de implementação: `app/a/[account]/base-comunicacao/page.tsx`, `CommunicationBaseTabs.tsx` e `CommunicationSectionEditor.tsx`.
- Apoios novos de apresentação e proteção somente em `app/a/[account]/base-comunicacao/_components/CommunicationBaseExperience.tsx` e `CommunicationDraftGuard.tsx`; estado efêmero limitado à rota, sem storage persistente ou provider global.
- Integração indispensável do shell: `components/features/account-switcher/useAccountSwitcher.ts` e `components/logout-button.tsx` disparam um evento cancelável de intenção de saída antes de fechar menu, navegar/fallback ou signOut. Sem listener da Base, mantêm comportamento vigente; Header, UserMenu e AccessProvider não mudam.
- Derivação de validade/alteração material reutiliza `parseEditorValue`, `formatEditorValue` e `parseSectionValue` do domínio existente. Casos focais entram no validador canônico da Base se necessários.
- Documento canônico afetado: `docs/roadmap.md`, reconciliado pela especialidade documental. Design System, schema, plataformas e automações permanecem autoridades consultadas, sem alteração prevista.
- `actions.ts`, adapters, registry, IA/prompts/insumos/pesquisa, guardas server-side, memberships/entitlement, Pending Setup e contratos E10.11/E25.1 não recebem alteração.

### 25.2.3 — Arquitetura de experiência, foco e edição da Base

- Cabeçalho humano e link de retorno à conta preservados. Manter abas “Verdade da empresa” e “Inteligência de comunicação”, exibindo apenas a etapa ativa.
- Cada etapa apresenta seleção compacta de suas sete seções, estado derivado do conteúdo salvo e um único editor visível. Desktop: navegação lateral junto ao editor; mobile: Select nativo rotulado acima do editor, em fluxo vertical. Os editores fora de vista permanecem montados para preservar sugestões/fontes e as travas existentes de geração e salvamento, sem executar IA pela seleção.
- Editor contém título/guia, conteúdo e estado humano, campo com label/dicas/erro associados e par Salvar/Cancelar. Salvar fica habilitado somente com diferença material válida, calculada pelo mesmo parser do contrato de salvamento. Cancelar restaura o texto salvo sem mutação; rascunho inválido mostra instrução localizada.
- Confirmação explícita protege descarte ao cancelar, trocar seção/etapa, retornar à conta ou seguir link interno; a recusa mantém rascunho e contexto. Fechamento/recarregamento usa beforeunload nativo quando houver alteração pendente. Cobrir também retorno do histórico sem permitir perda silenciosa de rascunho.
- A proteção é um apoio client route-local, sem interceptação de servidor ou nova autoridade. Capturar links de mesma aba no document cobre os links do shell fora da subárvore; ignorar nova aba, download e âncora sem perda. As ações programáticas do shell consultam o mesmo evento cancelável antes de seus efeitos, cobrindo ponteiro e teclado.
- Histórico SPA: guardar URL, history.state e chave/índice de navigation.currentEntry antes da travessia; navigate com tipo traverse fornece destino. No popstate em captura, aceitar deixa Next continuar; recusar impede seu listener e restaura a mesma entrada original com navigation.traverseTo(chaveOriginal). Consumir a restauração uma única vez, sem segunda confirmação nem processamento pelo Next. Sem chave/índice disponível, recusar e restaurar estado/URL original por history.pushState; esse fallback protege o rascunho, com limitação de descartar entradas Forward, que exige evidência e avaliação independente de compatibilidade.
- Durante salvamento, preservar campo e travas vigentes; não descartar antes de confirmar o resultado. Falha preserva rascunho; sucesso atualiza a referência persistida antes de router.refresh, mantendo etapa/seção. A remoção de dirty só ocorre por conteúdo semanticamente igual, resultado saved confirmado ou descarte humano aceito.
- Owner/Admin/Editor continuam editando sob o mesmo canEdit server-side; Viewer recebe o mesmo conteúdo e navegação, sem campos ou ações que dependam de edição.

### 25.2.4 — Estados, assistência por IA, responsividade e validação da experiência

- Entrada/início, importação confirmada e falha da consulta do contexto anterior preservam o comportamento vigente; linguagem orienta próximo passo seguro. Estado vazio não inventa métrica ou conteúdo.
- Assistência contextual da Etapa 1, revisão localizada e ação geral da Etapa 2 permanecem com mesmos payloads, alcance, pesquisa opcional/material, exclusão mútua e travas contra resposta obsoleta.
- Assistência local fica em revelação progressiva junto ao editor. A ação geral da Etapa 2 tem alcance explícito. Sugestão e fontes usam bloco próprio, sem substituir ou salvar automaticamente o texto. “Usar no editor” pode mudar somente o rascunho da seção alvo; confirmar antes de substituir rascunho pendente.
- Reutilizar Button, Textarea, Select, FormField, FeedbackMessage, LoadingState e EmptyState quando pertinentes, com tokens semânticos existentes, sem alterar API do DS.
- Preservar conteúdo válido/sugestões/fontes durante espera e falha, até resultado novo válido ou descarte humano pertinente. Loading, erro, aviso e sucesso recebem feedback textual e anúncio acessível; todos os botões alterados têm foco visível e alvo mínimo de 44 px.
- Abas mantêm setas/Home/End, seleção/foco e aria-controls; seletor e editor mantêm labels; navegação de seção identifica seleção. Viewports de aceite: desktop 1440×900 e mobile 390×844, com inspeção adicional a 320 px para overflow. Sem declaração de conformidade WCAG integral.
- Validação: npm ci (uma vez no lote; concluído), npm run check, validador focal e git diff --check. Executar npm run dev e abrir sua URL; se configuração local autorizada não estiver disponível, registrar a limitação local e comprovar os critérios no Preview da mesma branch, sem nova credencial técnica ou ambiente.
- QA renderizado no Preview do mesmo HEAD: orientação, etapas/seções, vazio/leitura, edição válida/inválida, save pendente/sucesso/falha, cancelar/saída com aceitar e recusar, retorno e reentrada, assistência local/geral e sugestão/fontes, teclado/foco/labels/targets e ausência de overflow nos viewports. Usar identidades QA existentes autorizadas; não alterar entitlement, memberships, credenciais ou contas active para montar cenário.
- Casos negativos/falhas indisponíveis no ambiente podem ser demonstrados por harness efêmero de componentes reais sem nova rota, build ou infraestrutura versionada, além do QA positivo real; distinguir evidências reais e simuladas.
- Observabilidade: N/A para nova instrumentação; fluxos server/provider e a telemetria E21 existentes não mudam. Inspecionar erros visíveis/console da superfície.
- Gates finais: evidência suficiente por critério, revisão independente do HEAD corrente e resultados explícitos de reviews automáticos aplicáveis, ausência de achado material e checks obrigatórios verdes. Correção de HEAD exige novo Code Review.
- Após liberação do mesmo PR/HEAD: merge remoto com guarda atômica de SHA via conector GitHub autorizado, confirmar deploy Production e smoke proporcional das transições alteradas; atualizar o Debate 14C com PR, merge commit e evidências preservando V1/histórico. Sem migration ou apply remoto.

### Travas e pendências

- Updates concluído para a V1 congelada e source_repository_sha `2a23af961ffe19e389545ec67d7303481ebd9958`: nenhum update aplicável. Nenhum patch, dependência, ferramenta ou custo novo entra no recorte.
- Crescimento focal da proteção deriva da V1/DS: links do shell ficam fora da subárvore e account switch/logout são programáticos; beforeunload não cobre SPA e App Router não expõe beforePopState. Propagar estado a um provider global/alterar todos os links seria maior que o listener local e dois pontos de intenção. Adapters/domínio/persistência não recebem responsabilidade de navegação.
- Pendentes na candidata: avaliação técnica independente, ABC de planejamento, implementação, validações e QA, incluindo Back e Forward/aceitar/recusar e compatibilidade do fallback. Não implementar candidata sem checkpoint plan-v2-approved.
- Não ampliar escopo para resolver indisponibilidade de recurso ou cenário. Achado transversal retorna à fonte competente.
