# Lousa plano-base E10.11 — Passagem mínima para a Base

## V1 funcional aprovada — congelada

Fonte: Debate 14B — Simplificação terminal da jornada até a Base de Comunicação — LP Factory 10, §4.3.
URL: https://docs.google.com/document/d/19Gn0yxRXEIsLXQ-UqF9l-PW4nkqfc-PX2OjrNX0Tr18/edit
Revisão da fonte: ANLCKQmgb5n3I2BkyQgZ1XY_9YaKXNeU-k-IEa6AsOu4Apm6mkT7t2OyIV3yBTNOdEOJjO04qdu6uasmm23gGIx8P8b1SCj6KI2s7r-2ttQ
Consultada em: 28/09/2026.

4.3 PB-B — E10.11 Passagem mínima para a Base — V1 funcional consolidada
4.3.1 Problema e resultado funcional
• Problema: o Pending Setup vigente identifica a pessoa, mas não garante o nome público do negócio; após a ativação da conta, a jornada atual ainda pode encaminhar conta elegível ao onboarding factual E10.10 e tratar taxon oficial como condição do caminho pós-entitlement.
• Resultado: ajustar somente o necessário entre a conclusão do Pending Setup, a experiência comercial existente e a Base, garantindo o nome público, o reaproveitamento inicial do contexto e o encaminhamento correto conforme autorização comercial, sem executar D15B ou redesenhar venda.
4.3.2 Comportamento, atores e limites
• O Pending Setup continua sob autoridade do Debate 15. Quando o nome público do negócio/profissional não estiver legitimamente disponível, o fluxo deve obtê-lo sem confundi-lo com o nome preferido da pessoa, razão social ou antigo nome de projeto; o Debate 15 deve ser reconciliado documentalmente com esse ajuste antes do handoff de implementação.
• Preservar compreensão operacional da atuação, matching, aliases, vínculo taxonômico quando seguro, confirmação e fallback já existentes; ausência de taxon oficial competente não bloqueia a Base quando houver entendimento operacional suficiente.
• Contexto pertinente e confirmado é disponibilizado para o preenchimento inicial da Base sem duplicar perguntas e sem sincronização permanente. Dado direto é copiado deterministicamente; organização assistida de texto livre não promove hipótese a fato.
• Conta sem autorização comercial válida continua nas superfícies e políticas comerciais E10.6/E10.7 vigentes. Conta com autorização válida segue para a Base sem depender de página personalizada, pesquisa comercial preparada para seu nicho ou taxon oficial.
• Para dogfooding e contas de teste, a liberação administrativa E9.2 é autorização válida e não é trial. O plano não altera preço, checkout, trial, entitlement, papéis comerciais ou regras de membership.
• Escopo negativo: não inclui atendimento integral por IA, pesquisa/cadastro automático de novos taxons, persuasão ampliada, novo comercial, novos planos/combos, carteira de créditos, formulário pré-Base ou alteração das seções internas da Base. Não criar segunda jornada, onboarding, engine ou framework de transição; não alterar os contratos de accounts.status, membership, entitlement, checkout ou autoridade comercial; active não significa autorização comercial. Não restaurar E10.10 como fallback, não tornar taxon oficial gate da Base, não usar IA apenas para copiar dado conhecido ou inferir nome público e não criar sincronização permanente entre Pending Setup, taxonomia e Base.
4.3.3 Posição planejada no roadmap e fases
• Posição planejada: E10.11 — Passagem mínima para a Base.
• 10.11.1 — Objetivo e status; 10.11.2 — Registros do recorte, materializados somente pela execução.
• 10.11.3 — Nome público e contexto de saída: ajuste focal da informação mínima e projeção inicial do contexto confirmado, sem ampliar o atendimento.
• 10.11.4 — Gate e encaminhamento: preservar comercial para não autorizados e enviar conta autorizada à Base, eliminando o destino E10.10 e a exigência de taxon oficial para iniciar a Base.
• 10.11.5 — Continuidade e regressão: comprovar que navegação E10, taxonomia útil, comercial E10.6/E10.7, checkout, membership e entitlement preservam seus contratos após o cutover.
4.3.4 Classificação, automação e dependências
• Execução: Light. Motivo: o resultado cabe nos contratos vigentes de E10.9, E9, Access Context, taxonomia e comercial; não cria novo domínio nem nova automação. Se a investigação técnica revelar mudança estrutural material incompatível com Light, o fluxo deve escalar para reclassificação.
• Automação nova: não. Nome público, cópia de contexto e decisão de rota permanecem determinísticos; a IA já existente da E10.9 para resolução de nicho é preservada sem ampliação.
• Dependência: PB-A. O cutover para a Base só pode ocorrer quando o destino PB-A existir e estiver validado de forma suficiente para receber conta autorizada.
4.3.5 Critérios de aceite e evidências esperadas
• Nome público já conhecido não é perguntado novamente; quando ausente, é obtido sem substituir nem sobrescrever o nome preferido da pessoa.
• Contexto confirmado reaproveitável chega à Base uma única vez e não sobrescreve edição posterior nem cria sincronização reversa.
• Conta autorizada segue à Base mesmo sem taxon oficial; conta sem autorização permanece no comercial existente com as mesmas políticas de papel e ação financeira.
• Nenhuma jornada ativa encaminha a conta ao E10.10 após o cutover; o ajuste não cria fallback para onboarding factual rejeitado.
• Trial continua não implementado e não é exigido para validar o fluxo com conta de teste autorizada administrativamente.
• QA desktop/mobile comprova passagem clara, loading/erro compreensíveis, teclado, foco visível, alvo mínimo de 44 px e ausência de regressão perceptível no Account Dashboard e no comercial preservado.
4.3.6 Supervisão
• Supervisão: Autônomo. Após o handoff, o fluxo técnico conduz o plano sem supervisão rotineira do Estrategista Original, preservando integralmente a V1 e seu escopo negativo; questões fora da autoridade concedida devem ser escaladas conforme o Prompt Estrategista.

## V2 Light mínima — contrato técnico executável

Referência imutável da V1: commit `f34eb1a3b10985aa50410404c5c303af7a9a93f1`, neste arquivo. A V1 acima permanece literal e limita esta derivação. Fonte operacional adicional: supervisão Autônomo recebida em 28/09/2026, autorizando examinar migration focal e extensão seletiva do workflow sem incluir E10.10. Updates: nenhum update aplicável.

### 10.11.1 — Objetivo e status

Implementar somente a passagem do Pending Setup vigente ao comercial E10.6/E10.7 ou à Base E25.1, conforme entitlement comercial já existente. A Base E25.1 e seu gate estão operacionais em Preview e Production; Debate 15 §5.5 já reconciliou nome público e taxon não bloqueador. O recorte permanece pendente até validação e cutover.

### 10.11.3 — Nome público e contexto de saída

- Acrescentar `business_display_name` opcional, validado em 1–120 caracteres, à conversa E10.9 existente. Não usar `accounts.name`, nome preferido, razão social, taxon ou inferência por IA como nome público. Conversa já concluída permanece válida historicamente sem backfill inventado.
- Na etapa `ready_to_complete`, exibir uma pergunta focal de nome público apenas quando o campo confirmado estiver ausente. Persistir por RPC versionada com owner ativo, conta `pending_setup`, conversa da mesma relação, controle otimista de versão e ausência de turno reservado. Não alterar o transcript ou as etapas de resolução do nicho. A conclusão de uma conversa ainda `pending_setup` deve exigir o nome público persistido; idempotência das conversas históricas `completed` permanece.
- Na criação única da Base, copiar deterministicamente o nome público confirmado e, quando o usuário confirmar seu uso, o contexto de atuação já confirmado. A leitura só considera conversa `completed` da conta. O insert único da Base preserva edições posteriores e não sincroniza no sentido inverso. Não copiar contato pessoal ou hipótese. O contrato existente de seções da Base admite essa origem apenas para `business_name` e `business_context`.

### 10.11.4 — Gate e encaminhamento

- No Account Dashboard, checar entitlement comercial pelo adapter vigente. Falha de leitura permanece fechada. Conta elegível segue diretamente à rota da Base E25.1 sem consulta obrigatória de taxon, pesquisa comercial ou E10.10. A própria Base revalida membership, status e entitlement no servidor.
- Conta não elegível preserva a decisão por papel, taxonomia útil e comercial E10.6/E10.7 existentes; owner mantém as ações financeiras vigentes, demais papéis aguardam ativação. Falha material de leitura taxonômica nesse caminho continua fechada. Nenhuma alteração em checkout, entitlement, membership, taxonomia ou regra de compra.
- Como a migration só pode ser aplicada após merge pelo fluxo canônico, usar um gate operacional server-side, desligado por padrão, para ativar o novo contrato de leitura, coleta e rota somente após apply seletivo e prova hospedada. Antes do cutover, o deployment conserva o comportamento prévio; depois de ativado, a jornada não encaminha a E10.10. O gate não cria jornada adicional nem fallback funcional novo. Preview antes de Production; revalidar o ambiente antes de cada ativação.

### 10.11.5 — Continuidade, validação e regressão

- Migration incremental única da conversa e RPC, sem aplicar nem alterar as migrations E10.10. Extender somente o workflow canônico com escopo manual `e10_11_only`, guarda de SHA exato da `main`, inventário explícito e dry-run que aceite somente a nova migration; preservar `e25_1_only`, E10.10 excluída e apply integral suspenso. Gate de apply retorna a `false` após a operação.
- Provar a migration integral e SQL positivo/negativo em PostgreSQL compatível efêmero com rollback antes do merge. O runner de validação pode preparar o estado aplicado E10.9/E25.1 sem E10.10; não altera Production/Preview. Conferir ACL/RLS, ownership, versão, nome válido/inválido, conclusão sem nome, histórico já concluído e ausência de escrita por papel não autorizado.
- Rodar `npm ci`, `npm run check`, testes focais de nome e projeção única, jornada autorizada sem taxon, não autorizada por papel, erro de entitlement/taxon e regressões de E10.6/E10.7, checkout, membership e Base. `npm run build` não integra o gate local. Observabilidade aplicável: sinais sanitizados de conclusão, falha de leitura e falha de ação, sem nome/transcript nos logs.
- QA de Preview e Production no mesmo código aplicável, com conta de teste autorizada por `liberacao_manual` E9.2 quando necessária, sem criar trial: desktop e mobile; passagem, loading/erro, teclado, foco, alvo de 44 px, ausência de overflow e regressão perceptível no Dashboard e comercial. Credenciais e recursos seguem `docs/platform-config.md`, `docs/automations.md` e Catálogo de QA autorizado. Evidência obrigatória ausente impede prontidão para merge ou conclusão.

### Limites e entrega

PB-C/E22.7 mantém a retirada terminal de E20/E10.10. Este PB só elimina a entrada ativa em E10.10 no cutover. Não criar créditos, trial, comercial novo, IA adicional, framework de transição, seção nova da Base, autoridade factual ou infraestrutura de produto. Antes do merge, entregar PR/head/diff/checks/reviews/QA à Supervisão Autônomo; merge e pós-merge seguem exclusivamente a liberação expressa e o contrato da skill.
