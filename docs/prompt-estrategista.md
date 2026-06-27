27/06/2026 — Fluxo do Estrategista

1. Debate do caso
   Definir problema, resultado esperado, usuários, limites e seção afetada do docs/roadmap.md.

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

6. Avaliação do Gestor Estrutural
   Informar ao Gestor Estrutural o path do plano-base no repositório e a fase atual, solicitando avaliação e sugestões estruturais.
