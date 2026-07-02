02/07/2026 — Plano-base E9.7

E9.7 — Liberação manual administrativa mínima

Fontes obrigatórias: `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md` e `docs/lousa-plano-base-e9.md`.

1. Estado e decisões fixas

* O plano-base anterior `docs/lousa-plano-base-e9.md` está encerrado no recorte executado até a Fase 7.2 e deve ser tratado apenas como fonte histórica/canônica do E9 anterior.
* Não reabrir Fases 1–7.2 e não continuar adicionando novas fases no arquivo anterior.
* Este plano-base trata somente do recorte E9.7: liberação manual administrativa mínima de entitlement comercial.
* A fonte de verdade do entitlement comercial permanece `public.account_commercial_entitlements`.
* A origem comercial deste recorte deve ser `liberacao_manual`.
* O consumo do entitlement comercial continua pelo boundary server-side `lib/commercial-entitlements/` e pelo signal existente baseado em `public.v_account_commercial_entitlement_effective`.
* O LP Builder já consome o signal server-side existente antes da persistência e não deve ser alterado neste recorte, salvo bug comprovado no consumo do entitlement.
* `accounts.status`, `account_users.status`, `public.plans`, redirect de checkout, evento auxiliar do Stripe ou comprovante informal não substituem o entitlement comercial local.
* Automação: não.
* Diretriz do recorte: MVP, baixo risco e menor complexidade.

2. Contrato do caso

* Gatilho: decisão administrativa autorizada para conceder entitlement comercial a uma conta específica sem depender de checkout/webhook.
* Entrada mínima futura: `account_id` validado, `plan_key` oficial (`starter`, `lite`, `pro` ou `ultra`), `plan_name_snapshot`, vigência opcional, justificativa operacional mínima e operador/autorizador quando o ponto administrativo aprovado existir.
* Persistência mínima esperada: criar ou atualizar `public.account_commercial_entitlements` com `origin = liberacao_manual`, `status = ativo`, plano canônico, vigência coerente, `metadata_json` mínimo e sem payload bruto, secret, cartão, e-mail como idempotência ou PII desnecessária.
* O status comercial persistido deve continuar limitado ao contrato existente: `pendente_confirmacao`, `ativo`, `expirado` e `cancelado`; `sem_entitlement` e `bloqueado_operacionalmente` continuam derivados de consulta.
* A vigência deve respeitar a regra existente: `expires_at` nulo ou maior que `starts_at` quando ambos existirem.
* Saída esperada: a view `public.v_account_commercial_entitlement_effective` e `getCommercialEntitlementSignal({ accountId })` passam a refletir a liberação manual como elegibilidade comercial quando a linha estiver efetiva.
* Fallback: ausência de entitlement manual válido, plano inválido, conta inválida, vigência inválida ou autorização administrativa não resolvida deve falhar fechado e não liberar criação produtiva de LP.
* O recorte não cria uma fonte paralela de liberação, não consulta Stripe diretamente e não usa redirect de sucesso como confirmação comercial.

3. Fases e próxima ação

* Fase única — Liberação manual administrativa mínima.
* Status: planejada.
* Automação: não.
* Objetivo da fase: implementar o menor caminho administrativo seguro para registrar `origin = liberacao_manual` em `public.account_commercial_entitlements`, preservando o consumo server-side já existente.
* Resultado esperado: conta manualmente liberada passa a ser elegível pelo signal comercial existente; conta sem entitlement válido continua bloqueada pelo gate produtivo atual.
* Pontos a confirmar antes da execução: superfície administrativa autorizada, papel/permissão do operador, formato mínimo de auditoria em `metadata_json`, regra de vigência e comportamento para atualização de uma liberação manual existente.
* Validação esperada da fase: confirmar persistência em `account_commercial_entitlements`, confirmar leitura por `v_account_commercial_entitlement_effective`, confirmar signal server-side elegível, confirmar fail-closed sem entitlement válido e confirmar ausência de alteração no LP Builder salvo bug comprovado.
* Próxima ação: submeter este plano-base E9.7 para avaliação única do Analista, Gestor Estrutural e Gestor de Updates; Gestor de Automação não é necessário porque a fase está marcada como `Automação: não`.

4. Escopo negativo e critérios de parada

* Não criar Billing Engine, Customer Portal, upgrade/downgrade, downgrade automático, régua de cobrança, inadimplência automática, trial operacional, job, fila, cron, agente, IA runtime, automação ou nova infraestrutura.
* Não alterar `docs/lousa-plano-base-e9.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md` ou docs finais neste plano-base.
* Não alterar checkout, webhook Stripe, Stripe Product/Price mapping, `lib/billing-checkout/`, endpoint de webhook, snippets existentes ou persistência de `plano_pago_confirmado`.
* Não alterar LP Builder, cards E10.7, Account Dashboard, layout, copy, comportamento visual ou fluxo público.
* Não criar fonte paralela de entitlement, tabela de customers/subscriptions/invoices/payments, Stripe Sync Engine, multi-provider engine ou admin amplo.
* Não expor lógica de entitlement para client component e não permitir mutação direta ampla por `authenticated`.
* Parar se a implementação exigir nova tabela, migration, policy, grant, trigger, rota pública, RPC, tela admin ampla, automação, escolha comercial não resolvida ou mudança no contrato atual de entitlement.
* Parar se não houver definição clara de quem pode conceder a liberação manual ou se a solução exigir alterar o gate produtivo do LP Builder em vez de consumir o signal existente.
