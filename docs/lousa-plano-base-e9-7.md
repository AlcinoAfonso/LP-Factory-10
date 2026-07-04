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
* Critério de parada: parar se faltar ator autorizado, superfície, path, boundary, mecanismo, vigência ou auditoria mínima.

3.2 Fase 2 — Mecanismo mínimo de concessão

* Automação: não.
* Objetivo: implementar o menor mecanismo aprovado na Fase 1 para registrar `origin = liberacao_manual`.
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

Próxima ação: após merge/consolidação deste PR, enviar ao Executor somente a Fase 1, não a Fase 2.

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