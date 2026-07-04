03/07/2026 — Plano-base E9.7 v1

E9.7 — Liberação manual administrativa mínima

Fontes: `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md` e `docs/lousa-plano-base-e9.md`.

1. Estado e decisões fixas

* `docs/lousa-plano-base-e9.md` está encerrado no recorte executado até a Fase 7.2 e entra aqui apenas como fonte do contrato anterior.
* Este plano não reabre as Fases 1–7.2 e não adiciona fases no arquivo anterior.
* O recorte E9.7 trata somente de liberação manual administrativa mínima de entitlement comercial.
* A fonte de verdade permanece `public.account_commercial_entitlements`.
* A origem comercial deste recorte é `liberacao_manual`.
* O consumo continua pelo boundary server-side `lib/commercial-entitlements/` e pelo signal existente baseado em `public.v_account_commercial_entitlement_effective`.
* O LP Builder não deve ser alterado neste recorte, salvo bug comprovado no consumo do entitlement.
* Diretriz: MVP, baixo risco e menor complexidade.

2. Contrato do caso

* Gatilho: decisão administrativa autorizada para conceder entitlement comercial a uma conta específica.
* Entrada mínima futura: `account_id`, `plan_key` oficial (`starter`, `lite`, `pro` ou `ultra`), `plan_name_snapshot`, vigência opcional, justificativa mínima e identificação operacional do responsável quando houver superfície aprovada.
* Persistência esperada: criar ou atualizar `public.account_commercial_entitlements` com `origin = liberacao_manual`, status comercial permitido, plano canônico, vigência coerente e `metadata_json` mínimo.
* `expires_at` deve ser nulo ou maior que `starts_at` quando ambos existirem.
* A liberação manual só vale quando a view efetiva e `getCommercialEntitlementSignal({ accountId })` retornarem elegibilidade comercial.
* Fallback: ausência de entitlement válido, plano inválido, conta inválida, vigência inválida ou autorização administrativa não resolvida falha fechado.

3. Fases e próxima ação

* Fase 1 — Contrato operacional.
  * Automação: não.
  * Objetivo: fechar o contrato operacional da liberação manual, incluindo ator autorizado, dados mínimos, status permitido, vigência, auditoria mínima e comportamento de atualização/cancelamento.
  * Saída: instrução executável para a fase seguinte, sem implementação de runtime.
* Fase 2 — Mecanismo mínimo de concessão.
  * Automação: não.
  * Objetivo: implementar o menor mecanismo administrativo aprovado para persistir `origin = liberacao_manual` em `public.account_commercial_entitlements`.
  * Saída: concessão manual registrada no entitlement local, sem Billing Engine, Customer Portal, trial operacional ou nova infraestrutura.
* Fase 3 — Validação de entitlement e gate.
  * Automação: não.
  * Objetivo: validar que a concessão manual aparece na leitura efetiva e no signal server-side existente, e que o gate produtivo continua fail-closed sem entitlement válido.
  * Saída: evidência de elegibilidade para conta liberada manualmente e bloqueio para conta sem entitlement válido, sem alterar LP Builder salvo bug comprovado.
* Próxima ação: enviar este plano-base para avaliação única do Analista, Gestor Estrutural e Gestor de Updates. Gestor de Automação não é necessário.

4. Escopo negativo e critérios de parada

* Não implementar Billing Engine, Customer Portal, upgrade/downgrade, trial operacional, inadimplência automática, job, fila, cron, agente, automação ou nova infraestrutura.
* Não alterar `docs/lousa-plano-base-e9.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, runtime, migrations, snippets, Stripe, checkout, webhook ou LP Builder neste PR.
* Não criar migration, tabela, rota, action, RPC, policy, grant, trigger, admin amplo ou tela nova sem fase aprovada.
* Não usar `accounts.status`, `account_users.status`, `public.plans`, redirect de checkout ou evento auxiliar do Stripe como prova comercial.
* Não expor lógica de entitlement para client component e não permitir mutação direta ampla por `authenticated`.
* Parar se faltar decisão sobre ator autorizado, superfície administrativa, regra de vigência, auditoria mínima ou se a execução exigir ampliar para Billing Engine, automação, admin amplo ou alteração do gate do LP Builder.
