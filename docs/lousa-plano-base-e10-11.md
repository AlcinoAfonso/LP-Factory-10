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
