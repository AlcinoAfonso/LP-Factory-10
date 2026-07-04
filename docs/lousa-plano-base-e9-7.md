04/07/2026 — Plano-base E9.7 v2 — Liberação manual administrativa mínima

Fontes: chat, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lousa-plano-base-e9.md`, `docs/gestor-estrutural.md`, `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md` e `docs/prod-up.md`.

1. Estado e decisões fixas

* `docs/lousa-plano-base-e9.md` está encerrado até a Fase 7.2 e entra aqui apenas como fonte do contrato anterior.
* Este plano-base trata somente de `E9.7 — Liberação manual administrativa mínima`.
* Path do plano-base: `docs/lousa-plano-base-e9-7.md`.
* Fonte de verdade: `public.account_commercial_entitlements`.
* Origem deste recorte: `liberacao_manual`.
* Status válidos do entitlement: `pendente_confirmacao`, `ativo`, `expirado`, `cancelado`.
* Para concessão manual ativa, a Fase 1 deve decidir se E9.7 usa apenas `status = ativo` ou se também inclui cancelamento/expiração manual.
* Consumo: `lib/commercial-entitlements/` e `getCommercialEntitlementSignal({ accountId })`.
* O LP Builder não deve ser alterado, salvo bug comprovado no consumo do entitlement.
* Updates aceitos apenas como apoio: `supa#40`, `prod#19`, `supa#2`, `supa#56`.
* Nenhum update aceito pode gerar nova infra, engine, job, agente, rota, banco, dashboard ou automação.

2. Contrato do caso

* Problema: o MVP precisa liberar manualmente uma conta específica para piloto, cliente estratégico, venda assistida ou exceção controlada, sem depender de pagamento Stripe imediato.
* Resultado esperado: uma conta recebe entitlement manual válido e passa a ser elegível pelo signal comercial existente.
* Fluxo operacional:
  * gatilho: decisão administrativa autorizada;
  * entrada: conta, plano canônico, vigência e justificativa mínima;
  * processamento: criar ou atualizar entitlement manual;
  * validação: conta existente, plano válido, vigência válida e operação autorizada;
  * persistência: `account_commercial_entitlements`;
  * consumo: view efetiva + signal server-side;
  * fallback: sem entitlement válido, segue bloqueado.
* A superfície administrativa ainda não está definida e deve ser decidida na Fase 1.
* A auditoria mínima ainda deve ser decidida na Fase 1: `metadata_json`, `audit_logs`, combinação dos dois ou outro mecanismo existente aprovado.
* Automação: não.

3. Fases e próxima ação

3.1 Fase 1 — Contrato operacional

* Automação: não.
* Objetivo: fechar o contrato operacional da liberação manual antes de implementar.
* Status: concluída em 04/07/2026.
* Definir:
  * ator autorizado;
  * superfície administrativa;
  * path canônico da mutação;
  * boundary de escrita;
  * mecanismo de escrita;
  * status permitido para concessão manual;
  * vigência;
  * auditoria mínima;
  * regra de criar, atualizar, cancelar ou bloquear duplicidade;
  * se encerramento/cancelamento manual entra no E9.7 ou fica fora.
* Saída: contrato operacional suficiente para liberar ou bloquear a Fase 2.
* Resultado da investigação:
  * Ator autorizado: `platform_admin`, incluindo `super_admin` pelo guard existente `requirePlatformAdmin`.
  * Superfície administrativa: detalhe read-only de conta em `app/admin/(protected)/contas/[accountId]/page.tsx`, com mutação mínima futura acoplada a essa superfície; não criar dashboard/admin amplo.
  * Path canônico da mutação para a Fase 2: `app/admin/(protected)/contas/[accountId]/actions.ts`.
  * Boundary de escrita para a Fase 2: `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`, em domínio Admin, server-only.
  * Mecanismo de escrita: Server Action protegida por `requirePlatformAdmin`, chamando adapter Admin server-only que usa `createServiceClient()`; sem client Supabase, sem Stripe, sem checkout, sem webhook e sem RPC nova.
  * Entitlement alvo: somente `public.account_commercial_entitlements` com `origin = liberacao_manual`.
  * Status permitido para concessão manual: `ativo`. `pendente_confirmacao` fica fora do MVP manual; `expirado` continua resultado de vigência e `cancelado` entra apenas para encerramento manual mínimo.
  * Vigência: `confirmed_at = now`, `starts_at = now` no ato da concessão e `expires_at` opcional; se informado, precisa ser futuro e maior que `starts_at`. Agendamento futuro por `starts_at > now` fica fora do E9.7.
  * Auditoria mínima: `metadata_json` obrigatório com `manual_reason`, `granted_by_user_id`, `granted_at`, `source_surface = admin_account_detail` e `operation = grant_manual_entitlement`. `audit_logs`/`audit_context_event` não são obrigatórios para liberar a Fase 2.
  * Criar: permitido quando a conta existe, está `active`, o plano é canônico e não há entitlement comercial efetivo conflitante.
  * Atualizar: permitido apenas sobre entitlement manual `ativo` existente da mesma conta, para ajustar plano, vigência ou justificativa, preservando `origin = liberacao_manual`.
  * Bloquear duplicidade: se já houver entitlement efetivo de outra origem (`plano_pago_confirmado` ou `trial`), a concessão manual deve falhar fechado com conflito operacional; se houver entitlement manual `ativo`, atualizar em vez de criar nova linha.
  * Encerramento/cancelamento manual: entra no E9.7 somente como revogação manual mínima de entitlement `origin = liberacao_manual`, gravando `status = cancelado`, `canceled_at = now` e metadata de cancelamento; não representa churn, inadimplência, Billing Engine ou cancelamento Stripe.
  * Fallback: qualquer conta inexistente, conta não `active`, plano inválido, vigência inválida, operador não autorizado ou conflito de origem falha fechado e não altera LP Builder.
* Decisão da Fase 1: Fase 2 liberada para implementar apenas o mecanismo mínimo acima.
* Critério de parada: resolvido para a Fase 1; reabrir ao Estrategista se a Fase 2 exigir nova tabela, migration, RPC, policy, grant, trigger, dashboard amplo ou alteração do gate do LP Builder.

3.2 Fase 2 — Mecanismo mínimo de concessão

* Automação: não.
* Objetivo: implementar o menor mecanismo aprovado na Fase 1 para registrar `origin = liberacao_manual`.
* Status: concluída em 04/07/2026.
* Direção:
  * reaproveitar schema existente;
  * evitar UI ampla;
  * evitar nova tabela;
  * evitar alteração no LP Builder;
  * manter fail-closed.
* Saída: entitlement manual persistido conforme contrato, pronto para validação pela view efetiva e pelo signal na Fase 3.
* Critério de aceite:
  * conta válida pode receber entitlement manual;
  * plano inválido falha;
  * vigência inválida falha;
  * operação não autorizada falha;
  * não há consulta Stripe;
  * não há bypass do signal comercial.
* Condição: esta fase não pode ser enviada ao Executor antes da conclusão da Fase 1.
* Resultado da execução:
  * Criado o boundary Admin server-only `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`.
  * Criado o path de mutação `app/admin/(protected)/contas/[accountId]/actions.ts`, protegido por `requirePlatformAdmin`.
  * A superfície `app/admin/(protected)/contas/[accountId]/page.tsx` recebeu mecanismo mínimo para conceder/atualizar e cancelar entitlement manual, sem criar dashboard/admin amplo.
  * A escrita usa `createServiceClient()` e persiste somente em `public.account_commercial_entitlements`.
  * Concessão manual grava `origin = liberacao_manual`, `status = ativo`, plano canônico, vigência validada e `metadata_json` mínimo.
  * Conflito com entitlement efetivo `plano_pago_confirmado` ou `trial` falha fechado.
  * Entitlement manual `ativo` existente é atualizado em vez de criar duplicidade.
  * Não houve Stripe, checkout, webhook, migration, tabela, RPC, policy, grant, trigger, LP Builder, job, agente ou automação.

3.3 Fase 3 — Validação de entitlement e gate

* Automação: não.
* Justificativa da fase própria: billing, dados, RLS e gate produtivo têm risco técnico suficiente para validação isolada.
* Objetivo: validar que a liberação manual funciona pelo fluxo existente.
* Validar:
  * linha em `account_commercial_entitlements`;
  * leitura por `v_account_commercial_entitlement_effective`;
  * retorno de `getCommercialEntitlementSignal`;
  * LP Builder continua bloqueando sem entitlement;
  * nenhuma consulta direta ao Stripe;
  * `supa#40` pode apoiar validação read-only.
* Saída: evidência objetiva de que a liberação manual ativa elegibilidade sem alterar o gate produtivo.

Próxima ação: após merge/consolidação deste PR, enviar ao Executor a Fase 3 — Validação de entitlement e gate.

4. Escopo negativo e critérios de parada

* Não reabrir Fases 1–7.2.
* Não editar `docs/lousa-plano-base-e9.md`.
* No PR de criação/consolidação deste plano-base, não alterar runtime, migrations, snippets, Stripe, checkout, webhook ou LP Builder.
* Em fases futuras, qualquer alteração de runtime, route/action, adapter, schema, migration, RPC, policy ou grant exige fase aprovada, path canônico e validação estrutural própria.
* Não implementar trial operacional.
* Não alterar Stripe Checkout ou webhook.
* Não alterar LP Builder, salvo bug comprovado.
* Não criar nova tabela sem decisão humana.
* Não criar tela admin ampla.
* Não criar Billing Engine.
* Não criar job, cron, fila, agente ou automação.
* Não adotar Stripe Sync Engine, Vercel Flags, Vercel Agent, AI Cloud, Private Blob, observabilidade nova ou GitHub/Copilot tooling no E9.7.
* Parar se não houver definição clara de quem pode conceder a liberação manual.
* Parar se a solução exigir mudança no contrato atual de entitlement.
* Parar se a solução deixar de ser liberação manual mínima.
* Parar se a Fase 1 não definir se encerramento/cancelamento manual entra no E9.7 ou fica fora.
