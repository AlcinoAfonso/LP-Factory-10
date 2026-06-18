18/06/2026 — Fluxo ajustado do Estrategista
Fontes: chat, docs/prompt-codex-app-executor.md, docs/template-briefing-codex.md, docs/template-prompts.md
	1. Debate do caso
Definir problema, resultado esperado, usuários e limites.
	2. Fluxo operacional
Mapear:
gatilho → entrada → processamento → validação → persistência → consumo → fallback

	3. Plano-base v1
Criar o primeiro rascunho com objetivo, solução, fases, limites e pendências.
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
docs/prompt-codex-app-executor.md.
Parta da main atualizada, use branch própria e pare antes do merge.
Não repetir o conteúdo do plano ou do prompt.
Caso Codex avulso sem plano no roadmap:
docs/template-briefing-codex.md
+ docs/prompt-codex-app-executor.md
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
