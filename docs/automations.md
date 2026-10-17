0.1 Cabeçalho
- Data: 17/10/2026
- Versão: v1.38
- Status: catálogo operacional vigente.

0.2 Função do documento
- Automações, modo de uso, resultado esperado, consumidores e dependências, sem secrets.

0.3 Relação com outros documentos
- Services: `docs/services.md`; regras técnicas: `docs/base-tecnica.md`; banco: `docs/schema.md`; evolução funcional: `docs/roadmap.md`; configuração externa e catálogo de workflows: `docs/platform-config.md`.

0.4 Estrutura canônica
- Subprojetos isolados em `automations/<nome>/`; `.github/workflows/` somente como entrada/orquestração.

0.5 Residência dos runtimes
- `automations/supabase-inspect/` e `automations/docs-apply-report/` são as raízes vigentes. Paths antigos em `pipelines/` não são oficiais; Inspect não usa fallback `npm install --no-save`.

1. Objetivo e escopo
- Catálogo operacional conforme 0.2; demais assuntos nas fontes de 0.3.
- Automação que materialize caso informa Aplicação funcional no roadmap; facilitador de testes informa Caso funcional validado, sem referência funcional inversa. Infraestrutura genérica sem vínculo material omite esses blocos.
- Credenciais somente por nome, plataforma, ambiente, localização, finalidade e escopo; nunca valores reais.

2. Plataformas e configuração global
- Deprecada em 04/08/2026: conteúdo consolidado em `docs/platform-config.md`.

3. Catálogo de automações operacionais

3.1 Supabase Inspect Actions
- Objetivo/status: inspeção Supabase read-only implementada via GitHub Actions, sem mutação nem persistência de resultados.
- Uso: GitHub → Actions → pipeline-supabase-inspect; informar briefing_path ou inputs manuais. SQL livre e batch seguem o README local.
- Resultado: logs e Job Summary com SQL executado, rowCount, colunas, amostra e diagnóstico; guardrails e limites em `automations/supabase-inspect/README.md`.
- Dependências: runtime `automations/supabase-inspect/`; workflow `.github/workflows/pipeline-supabase-inspect.yml`; credenciais/configuração em `docs/platform-config.md` — 2.2.

3.1.1 Supabase Inspect — presets opcionais de verificação
- Não implementados nem autorizados; modo livre por SQL permanece disponível. Proposta futura não altera a operação atual nem substitui `docs/schema.md`.

3.2 Pipeline Docs Apply Report
- Objetivo/status: aplicação de reports JSON em Markdown implementada, com branch, commit e PR para revisão humana.
- Uso: GitHub → Actions → pipeline-docs-apply-report, informando report_path.
- Resultado: alterações documentais em branch própria e PR; não faz merge.
- Referências: `automations/docs-apply-report/README.md`; workflow `.github/workflows/pipeline-docs-apply-report.yml`; runtime `automations/docs-apply-report/`.

3.3 Supabase Inspect Agente
- Retirado em 01/09/2026; sem workflow Agent Builder operacional ou consumidor independente do MCP. Estado externo em `docs/platform-config.md` — 6.4.

3.3.1 Update — Agents SDK
- Não implementado nem autorizado como substituto.

3.3.2 Update — ChatGPT + MCP
- Sem continuidade operacional após a retirada do MCP; nenhum substituto criado.

3.5 Resolver IA de Nicho no pending_setup
- Objetivo/status: resolvedor complementar implementado no onboarding server-side; matching determinístico precede a IA e governa o escalonamento. Não é o atendimento E10.12 de 3.11.
- Uso: turno ambíguo da conversa legada E10.9 em continuePendingSetupConversationAction, após autorização owner e reserva otimista. Sem intervenção durante a chamada.
- Resultado: saída estruturada reduzida a confirm_official, ask_clarifying_question ou unresolved_fallback, com no máximo uma pergunta code-owned por turno. Resolução, modelo, schema e estado persistidos em account_niche_resolutions.
- Confirmação: sugestão oficial exige ação humana, candidato ativo/permitido revalidado e user_confirmed_ai; a automação não grava account_taxonomy. Vínculo automático permanece restrito à alta confiança determinística pelo consumidor competente.
- Falha: configuração ausente, recusa, timeout ou erro registra skipped/failed e mantém retry ou nova explicação disponíveis. Somente ausência semântica legítima permite fallback operacional, confirmado por ação humana inequívoca.
- Transporte/logs: Responses API/Structured Outputs estritos; projeção recente, limitada e sanitizada, store:false, background:false e deadline; sem tools, conversation ou previous_response_id. Logs só de status, contagens e correlação, sem prompt/resposta completa.
- Limites: não cria/aprova taxon ou alias; sem retry automático, loop, Agents SDK, Sandbox Agents, job, fila ou recorrência. Não substitui matching determinístico.
- Aplicação funcional no roadmap: `docs/roadmap.md` — E10.5.6.5.
- Referências: `docs/base-tecnica.md` — 3.14.5; `docs/platform-config.md` — 3.5; action `app/a/[account]/pending-setup-actions.ts`; adapters `lib/onboarding/niche-resolution/adapters/openAiResolver.ts` e `lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter.ts`; confiança em `lib/onboarding/niche-resolution/deterministicConfidence.ts`.

3.6 Apply versionado de migrations no Supabase
- Objetivo/status: apply versionado implementado; automático integral suspenso, duas migrations E10.10 excluídas. Applies seletivos concluídos e escopos disponíveis em `docs/platform-config.md` — 2.3.
- Uso: criar migration em supabase/migrations/<timestamp>_<nome>.sql e validar no PR. Apply exige merge autorizado e decisão operacional própria; executar pipeline-supabase-apply-migrations somente pelo fluxo aprovado.
- Controles: push na main não autoriza apply integral; retomada exige resolução separada ou revisão explícita do filtro canônico. Não usar SQL Editor no fluxo normal; migration aplicada é imutável, com correção/reversão por nova migration incremental.
- Referências: `docs/base-tecnica.md` — 3.4.4; gates, ambientes, filtros e secrets em `docs/platform-config.md` — 2.2–2.3.

3.8 Geração administrativa de draft comercial por taxon
- Objetivo/status: automação implementada para gerar draft commercial_activation server-side/Admin, com Responses API e Structured Outputs.
- Uso: ação administrativa protegida, com gatilho humano e revisão posterior; sem intervenção durante a chamada. Não roda no runtime público.
- Resultado: content_json validado antes de persistir draft em content_artifacts; fontes relacionais somente business_buyer, contexto end_customer em provenance_json e CTA seguro server-side. Falha após criação invalida/arquiva o draft parcial e retorna erro seguro.
- Limites: não publica nem altera published; sem agente, Agents SDK, Sandbox Agents, job, fila ou recorrência.
- Aplicação funcional no roadmap: `docs/roadmap.md` — E10.7.3.
- Referências: `docs/base-tecnica.md` — 3.15.1; `docs/platform-config.md` — 3.5; action `app/admin/(protected)/templates/actions.ts`; geração `lib/conversion-content/commercial-activation/draft-generation.ts`; verificação `supabase/snippets/e10_7_phase_2_draft_verify.sql`.

3.10 Avaliação assistida da suficiência factual por taxon
- Retirada em 01/10/2026, sem consumidor operacional. Motivo/destino: retirada E20 pela E22.7 em `docs/roadmap.md` — 22.7.4; configuração em `docs/platform-config.md` — 2.3 e 3.5.

3.11 Atendimento inicial por IA
- Objetivo/status: atendimento implementado e ativo em Preview/Production, para compreender negócio/necessidades, orientar sobre serviços comprovados e definir próximo passo. Conversas legadas permanecem sem backfill/conversão.
- Uso/consumidor: Pending Setup server-side, após autorização owner e reserva do turno. Lead confirma categoria existente ou entendimento operacional sem correspondência segura; classificação não conclui automaticamente o atendimento.
- Resultado: histórico atribuível ao participante e Resumo contextual único por conta distinguem síntese proposta, entendimento aceito, classificação e sugestões; fontes oficiais prevalecem. Ausência de categoria não impede continuidade nem concede acesso/entitlement; falha de gravação não anuncia sucesso.
- Dependências: Responses API/Structured Outputs, catálogo ativo e repertório E10.13; workload pending_setup_conversation sob E21. Bootstrap não substitui prova empírica nem autoriza ativação.
- Limites: sem autoridade administrativa, Web classificatória ou manutenção de taxons/aliases. Atomicidade, deduplicação, hierarquia, categorias inativas e proteção do primário são determinísticas. Serviço, condição, prazo ou disponibilidade exigem fonte comercial competente; aprofundamento no D17. Sem relacionamento operacional com a Base, consumidor futuro, engine genérica, job, fila ou retorno assíncrono.
- Aplicação funcional no roadmap: `docs/roadmap.md` — E10.12, com comportamento e critérios de conclusão.
- Referências: `docs/base-tecnica.md` — 3.14.6; configuração `docs/platform-config.md` — 3.5.

4. Aprendizados operacionais
- Deprecada em 04/08/2026: conteúdo histórico superado; aprendizados vigentes nos respectivos itens do catálogo e fontes canônicas.
