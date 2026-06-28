28/06/2026 — Plano-base E9
Fontes: chat, docs/roadmap.md, docs/prompt-estrategista.md

1. Estado e decisões fixas

* E9 define elegibilidade comercial para criar LPs.
* E9 libera apenas o gate/elegibilidade comercial; não implementa LP Builder nem fluxo visual de criação de LPs.
* Conta active não fica elegível apenas por estar ativa.
* Entitlement comercial não substitui bloqueios de conta, membership ou status operacional.
* Elegibilidade nasce de origem comercial válida: plano pago confirmado ou, futuramente, trial concedido.
* Recorte inicial: cards pagos Starter, Lite, Pro e Ultra + checkout confirmado.
* Usar a nomenclatura canônica dos planos vigente no projeto; se houver diferença entre Start e Starter, resolver antes da implementação do checkout.
* Provedor de checkout entra como subseção futura E9.xx.
* Trial automático/manual entra como subseção futura E9.xx.
* Ajuste de valores pertence a E12.xx, por ser operação administrativa no Admin Dashboard.

2. Contrato do caso

* Usuário clica em Starter, Lite, Pro ou Ultra.
* Sistema inicia checkout no provedor escolhido.
* Provedor confirma pagamento/assinatura por webhook.
* Sistema valida evento, conta, plano, status e idempotência.
* Sistema persiste entitlement comercial.
* Account Dashboard libera criação de LPs somente após confirmação válida.
* Sem confirmação válida, conta permanece sem elegibilidade produtiva.

3. Fases e próxima ação

* Fase 1 — Contrato interno de elegibilidade: definir origem comercial, status, consumo pelo Account Dashboard e necessidade estrutural mínima de persistência.

3.1 Detalhamento da Fase 1 — Contrato interno de elegibilidade

* Objetivo: definir o contrato mínimo que decide quando uma conta pode acessar o gate comercial de criação de LPs.
* Resultado esperado: contrato conceitual aprovado, sem checkout, sem webhook, sem migration e sem alteração de runtime.
* Investigar: lógica atual de conta ativa, membership, Account Dashboard, plans, trial, permissões e bloqueios existentes.
* Definir: origens comerciais válidas, status conceituais, bloqueios independentes, consumo pelo Account Dashboard e dados mínimos necessários para fases futuras.
* Regra central: conta precisa estar em estado operacional permitido, membership precisa permitir acesso e entitlement comercial precisa estar válido.
* Origem inicial: plano pago confirmado.
* Origens futuras: trial e liberação manual; provedor de checkout e webhook ficam como mecanismos futuros de confirmação e persistência.
* Status conceituais esperados: sem_entitlement, pendente_confirmacao, ativo, expirado, cancelado e bloqueado_operacionalmente.
* Os nomes são conceituais; antes da implementação, verificar se já existe nomenclatura canônica no projeto.
* Não implementar checkout, provedor, webhook, migration, tabela, RPC, policy, grant, constraint, Account Dashboard, cards, LP Builder ou tela admin.
* Parar se a investigação exigir mudança de banco, runtime, arquitetura, cards da E10.7 ou mutação administrativa da E12 antes de nova decisão estratégica.
* Entrega esperada da Fase 1: investigação resumida, arquivos consultados, contrato interno proposto, riscos, lacunas e validação documental.

3.1.1 Investigação da Fase 1 — proposta de contrato interno

Arquivos consultados:

* `AGENTS.md`
* `docs/prompt-executor.md`
* `docs/lousa-plano-base-e9.md`
* `docs/roadmap.md`
* `docs/schema.md`
* `docs/base-tecnica.md`
* `lib/types/status.ts`
* `lib/access/types.ts`
* `lib/access/getAccessContext.ts`
* `lib/access/adapters/accessContextAdapter.ts`
* `lib/access/adapters/accountAdapter.ts`
* `lib/access/plan.ts`
* `app/a/[account]/page.tsx`
* `app/a/[account]/_content/commercial-page/generic-v1.ts`
* `app/a/[account]/_components/commercial-page/actions.ts`
* `lib/conversion-content/commercial-activation/draft-generation.ts`
* `supabase/snippets/e10_7_phase_2_draft_verify.sql`
* `supabase/migrations/20260621194501_e10_7_normalize_lite_plan_name.sql`

Estado encontrado:

* `accounts.status` canônico: `pending_setup`, `active`, `inactive`, `suspended`; `trial` não é status de conta.
* `account_users.status` canônico: `pending`, `active`, `inactive`, `revoked`.
* `v_access_context_v2` libera acesso operacional somente para conta `active` ou `pending_setup` com membership `active`.
* O Account Dashboard em `/a/[account]` trata `pending_setup` como onboarding, bloqueia estados diferentes de `active` para página comercial e renderiza a página comercial somente para conta `active`.
* Eventos da página comercial também exigem `ctx` não bloqueado e `ctx.account.status === "active"`.
* `public.plans` é fonte canônica parcial para `name`, `price_monthly`, `max_lps`, `max_conversions` e `features`; não é fonte suficiente para checkout, descontos, garantias, promoções, URLs oficiais ou condição comercial completa.
* A nomenclatura operacional mais recente de planos comerciais é `Starter`, `Lite`, `Pro` e `Ultra`, com chaves `starter`, `lite`, `pro` e `ultra`; `Light` foi normalizado para `Lite`. O termo `Start` do plano-base conflita com `Starter` e deve ser decidido antes do checkout.
* Existe código legado em `lib/access/plan.ts` com `PlanId = "free" | "light" | "pro" | "ultra"` e placeholders de Stripe; isso não deve ser usado como contrato E9 sem revisão, pois diverge de `Lite` e dos cards atuais.

Contrato interno proposto:

* A elegibilidade produtiva para criação de LP deve ser uma decisão derivada, não um substituto de `accounts.status` ou `account_users.status`.
* A regra mínima é: conta operacionalmente permitida, membership ativo e entitlement comercial válido.
* Para o gate de criação de LP, conta operacionalmente permitida deve significar `accounts.status = active`; `pending_setup` continua permitido apenas para onboarding/acesso operacional inicial, não para criação produtiva.
* Membership válido deve significar `account_users.status = active`; papéis e permissões por ação podem restringir edição/publicação em fase própria, mas não substituem a exigência de entitlement.
* Entitlement comercial válido, no recorte inicial, nasce de plano pago confirmado e idempotentemente persistido por fase futura.
* O Account Dashboard deve consumir um sinal explícito de elegibilidade comercial antes de liberar criação de LP; até esse sinal existir, conta `active` pode exibir conversão/página comercial, mas não deve ser considerada elegível para criação produtiva apenas por estar `active`.

Origens comerciais:

* Origem inicial válida: `plano_pago_confirmado`.
* Origens futuras possíveis: `trial` e `liberacao_manual`.
* Confirmação por provedor/webhook é mecanismo de confirmação e persistência, não origem comercial.

Status conceituais:

* `sem_entitlement`: conta operacionalmente acessível, mas sem sinal comercial válido.
* `pendente_confirmacao`: checkout, assinatura ou liberação iniciada, ainda sem confirmação válida.
* `ativo`: entitlement confirmado, vigente e consumível pelo gate.
* `expirado`: entitlement com vigência encerrada.
* `cancelado`: entitlement encerrado por cancelamento ou churn.
* `bloqueado_operacionalmente`: estado derivado quando conta ou membership bloqueiam o acesso, mesmo que exista histórico comercial.

Dados mínimos para fases futuras:

* `account_id`
* chave canônica do plano (`starter`/`lite`/`pro`/`ultra`) e nome exibido vigente no momento da confirmação
* origem comercial
* status conceitual do entitlement
* data de início, data de confirmação e data de expiração ou fim, quando aplicável
* identificadores do provedor, assinatura, checkout, invoice ou evento, quando houver provedor
* chave de idempotência do evento de confirmação
* trilha de auditoria operacional sem PII sensível

Riscos, lacunas e conflitos:

* Manter `Starter`/`starter` como nomenclatura canônica antes da fase de checkout.
* Revisar ou aposentar o `PlanId` legado `light` antes de qualquer integração de checkout, porque ele conflita com `Lite`/`lite`.
* Definir em fase própria se o status conceitual será persistido em tabela nova, view, RPC ou outro contrato; esta Fase 1 não cria banco.
* Definir em fase própria como papéis (`owner`, `admin`, `editor`, `viewer`) afetam criação, edição e publicação de LPs.
* Definir em fase própria se `bloqueado_operacionalmente` será apenas status derivado de consumo ou se haverá materialização para relatório.
* Não usar `accounts.plan_id` nem `public.plans` isoladamente como prova de elegibilidade comercial.
* Não alterar E10.7, Account Dashboard, cards, schema ou runtime nesta fase.

3.2 Fases futuras e próxima ação

* E9.xx futuro — Provedor de checkout: escolher e integrar primeiro provedor para cards pagos.
* E9.xx futuro — Webhook e persistência: validar confirmação, idempotência e registro de entitlement comercial.
* E9.xx futuro — Consumo da elegibilidade: liberar gate comercial para criação de LPs após persistência validada.
* E9.xx futuro — Trial: trial automático/manual como outra origem de entitlement.
* E9.xx futuro — Liberação manual: contratação manual ou concessão administrativa como origem comercial válida, sem comprovante informal por WhatsApp.
* E12.xx futuro — Valores: ajuste administrativo de valores, planos ativos e vínculo com provedor.
* Próxima ação: seguir para consolidação do Estrategista e só depois abrir recorte de execução aprovado.
* Estrutura de persistência será definida em fase própria antes da implementação.
* Webhook de confirmação, quando implementado, deve ser catalogado em docs/automations.md como automação operacional, com recurso utilizado, categoria e classificação.
* Updates aplicáveis: supa#5 para logs seguros, supa#36 para leituras server-side, supa#40 para validação SQL read-only, supa#58 como trava de schema/grants/policies e prod#13 apenas como referência futura, sem bundles/grants no recorte inicial.

4. Escopo negativo e critérios de parada

* Não criar fluxo manual de pagamento, comprovante por WhatsApp ou liberação sem confirmação comercial.
* Não implementar trial no recorte inicial.
* Não criar múltiplos provedores ao mesmo tempo.
* Não alterar layout, copy, ordem ou design dos cards da E10.7.
* Não criar tela administrativa de valores dentro do E9.
* Não transformar E9 em Billing Engine completo.
* Não usar agente de IA.
* Não implementar LP Builder nem fluxo visual de criação de LPs no E9; E9 libera apenas o gate/elegibilidade comercial.
* Parar se a fase exigir tabela, RPC, policy, grant ou migration antes de definir contrato de entitlement, idempotência e consumo no Account Dashboard.
* Não assumir public.plans como fonte suficiente para checkout, descontos, garantias, regras promocionais ou URLs oficiais sem decisão específica.
* Parar se o recorte exigir mudança visual da E10.7, mutação administrativa ampla da E12, ou definição de trial antes do checkout pago mínimo.
