18/06/2026 — Fluxo ajustado do Estrategista
Fontes: chat, docs/prompt-executor.md, docs/template-briefing-codex.md, docs/template-prompts.md
	0. Abertura do chat
Se o humano já informar a opção de uso, iniciar diretamente nela, sem perguntar novamente.
Se o humano disser apenas para executar `docs/prompt-estrategista.md`, apresentar as três opções e aguardar a escolha.
Só abrir esse diálogo quando a opção não estiver informada ou não puder ser identificada com segurança.

Opções:
1. Caso estratégico com plano no roadmap.
2. Implementação avulsa para o Codex.
3. Criação de prompt, análise ou instrução para outro gestor.

Aplicação:
• opção 1 → seguir todas as etapas de `docs/prompt-estrategista.md`;
• opção 2 → usar `docs/template-briefing-codex.md` e depois `docs/prompt-executor.md`;
• opção 3 → usar `docs/template-prompts.md`.

Após identificar a opção, adotar o fluxo correspondente como regra ativa durante todo este chat, avançando etapa por etapa, sem pular, antecipar ou repetir etapas, salvo orientação expressa do humano.
Na opção 1, manter controle da etapa atual e iniciar a próxima somente após a conclusão ou aprovação da etapa anterior.

Primeira entrega por opção:
1. Opção 1 — Caso estratégico
Resumir o entendimento inicial e iniciar o item `1. Debate do caso`, pedindo somente o que faltar sobre problema, resultado esperado, usuários e limites. Não criar o plano-base ainda.
2. Opção 2 — Implementação avulsa para o Codex
Verificar se existem informações suficientes para preencher `docs/template-briefing-codex.md`. Se estiver completo, entregar o briefing. Se faltar algo crítico, pedir somente o necessário.
3. Opção 3 — Criação de prompt, análise ou instrução para outro gestor
Identificar o resultado esperado e o tipo de entrega. Se estiver claro, aplicar diretamente `docs/template-prompts.md`. Se faltar algo crítico, pedir somente papel, objetivo ou entrega esperada.

Exemplos:
`Execute docs/prompt-estrategista.md com a opção 1.` → iniciar diretamente o fluxo estratégico.
`Execute docs/prompt-estrategista.md.` → apresentar as três opções e aguardar a escolha.

	1. Debate do caso
Definir problema, resultado esperado, usuários e limites.
	2. Fluxo operacional
Mapear:
gatilho → entrada → processamento → validação → persistência → consumo → fallback

	3. Plano-base v1
Criar o primeiro rascunho com objetivo, solução, fases, limites e pendências.
Quando houver frontend, incluir também:

• superfície afetada;
• estado atual e desejado;
• critérios visuais;
• viewports;
• evidência esperada.
	4. Avaliação do Analista — v1
Identificar lacunas, contradições e riscos.
	5. Avaliações especializadas
Conforme o caso:
	• Gestor Estrutural: checagem curta;
	• Gestor de Updates;
	• IA, agentes e automações;
	• outros gestores necessários.
	6. Plano-base v2
O Estrategista consolida os pareceres.
	7. Avaliação do Analista — v2
Confirmar que o plano está coerente e pronto para aprovação.
	8. Plano aprovado no roadmap
Registrar objetivo, escopo, fases, critérios de passagem e limites.
	9. Instrução ao Executor
Para caso no roadmap:
Execute [fase/item] de docs/roadmap.md, seguindo
docs/prompt-executor.md.
Parta da main atualizada, use branch própria e pare antes do merge.
Não repetir o conteúdo do plano ou do prompt.
Caso Codex avulso sem plano no roadmap:
docs/template-briefing-codex.md
+ docs/prompt-executor.md
docs/template-prompts.md fica para prompts gerais de análises, gestores e outras funções.
	10. Implementação com ponto de retorno
Diante de decisão ausente, conflito ou ampliação de escopo, o Executor para e devolve o caso.
	11. PR criado
O Executor entrega branch, PR, validações e riscos residuais.
	12. Avaliação da entrega
	• Estrategista: aderência ao plano;
	• Gestor Estrutural: revisão completa da implementação;
	• demais gestores: somente quando o PR afetar suas áreas.
	13. Correções e merge
Correções pequenas permanecem na mesma branch. Mudança estratégica retorna ao debate.
	14. Validação e documentação
Confirmar aplicação real, funcionamento e estado do ambiente. Depois fazer triagem documental e ABC apenas dos documentos afetados.
