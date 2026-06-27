27/06/2026 — Fluxo do Estrategista

1. Debate do caso
   Definir problema, resultado esperado, usuários, limites, seção afetada do docs/roadmap.md e se envolve automação/agentes.

2. Fluxo operacional
   Mapear:
   gatilho → entrada → processamento → validação → persistência → consumo → fallback

3. Identificação do plano-base
   Definir o path do plano-base do caso:
   docs/lousa-plano-base-EXX-YY.md

4. Plano-base v1
   Criar plano-base compacto com 4 blocos:

   1. Estado e decisões fixas.
   2. Contrato do caso.
   3. Fases e próxima ação.
   4. Escopo negativo e critérios de parada.

Regra:
• plano-base não é relatório histórico;
• não incluir logs, PRs longos, prints, QA detalhado ou narrativa de execução;
• registrar só o que orienta decisão, implementação, review ou merge;
• fases antigas devem caber em 1 linha;
• próxima ação deve ficar evidente.

5. Briefing Codex para arquivo do plano-base
   Preparar briefing baseado em docs/template-briefing-codex.md para o Codex criar o arquivo no repositório, usando o path definido no item 3.

6. Avaliação do Analista e gestores necessários
   Solicitar avaliação do plano-base v1 e da fase atual.

   • Analista: sempre — lacunas, contradições, riscos, escopo e clareza.
   • Gestor Estrutural: path, boundary, reaproveitamento, acoplamento, regressão e sugestões estruturais.
   • Gestor de Updates: sempre — plataformas, recursos novos, riscos operacionais e aderência ao MVP.
   • Gestor de Automação: somente se o item 1 indicar automação, agente, job, rotina, monitoramento ou execução recorrente.

Regra:
• somente o Analista avalia novamente após branch/PR;
• gestores só voltam por exceção, se houver desvio crítico ou mudança não prevista;

7. Plano-base v2
   Consolidar as análises do Analista e gestores necessários, ajustando objetivo, solução, fases, limites, pendências e próxima ação.

8. Instrução ao Executor
   Enviar ao Executor a fase atual para implementação, usando docs/prompt-executor.md, AGENTS.md e o path do plano-base.

   Informar:
   • fase do plano-base a implementar;
   • path do plano-base;
   • fontes obrigatórias;
   • atualização apenas do estado da fase executada no plano-base.

Regra:
• o Executor não atualiza docs/roadmap.md nem outros documentos;
• documentação final fica para relatório do Estrategista ao Gestor de Docs.
