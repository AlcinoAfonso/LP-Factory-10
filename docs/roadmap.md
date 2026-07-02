0. Introdução

0.1 Cabeçalho
• Data: 02/07/2026
• Versão: v1.5.87

0.2 Contrato do documento (consulta)
• Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
• O QUE É: a referência única do projeto para o contrato de casos (E*): status, escopo final e dependências.
• POR QUE CONSULTAR: para entender “o que já foi definido/implementado” e “qual é o próximo marco”, evitando drift com docs técnicas.
• COMO USAR: ao planejar execução, priorização e validação de escopo por caso, consultar este documento para o estado final de cada E*.
• QUANDO CONSULTAR: status/escopo/dependências de E*, decisões de produto/UX registradas no caso, e paths/artefatos quando fizerem parte do estado final do caso.
• QUANDO NÃO CONSULTAR: regras técnicas do runtime (usar `docs/base-tecnica.md`) e contrato/inventário de DB (usar `docs/schema.md`).
• NOTA: este documento registra estado final por caso; não é lugar de narrativa operacional.

0.3 Nota operacional (dependência externa)
• 2026-02 — Supabase: Project Clone / Restore to a New Project (beta) pode ficar indisponível; sem impacto no runtime do projeto existente. Não depender disso para staging/espelho/backup. Se precisar duplicar ambiente: criar projeto novo + aplicar migrations do repositório + configurar env/secrets manualmente.

1. E1 — Estrutura de Dados

1.1 Status
• Concluído (03/10/2025)
1.2 Implementado
• Tabelas: accounts, account_users, audit_logs, plans, partners, partner_accounts
• Views: v_access_context_v2, v_account_effective_limits, v_account_effective_limits_secure, v_audit_logs_norm
• Constraints e índices otimizados
1.3 Critérios de Aceite
• Multi-tenant funcional (subdomain/domain UNIQUE)
• 1 owner ativo por conta
• Auditoria automática
1.4 Pendências
• Nenhuma
1.5 Updates externos (avaliar)
• 2026-01 — Supabase: Index Advisor (Table Editor) — Link: https://supabase.com/docs/guides/database/extensions/index_advisor
• Nota: quando revisitar performance/índices, rodar o advisor e avaliar recomendações antes de criar índices novos (sem auto-aplicar).

2. E2 — Núcleo de Acesso

2.1 Status
• Concluído
2.2 Implementado
• Autenticação email/senha (SULB)
• Roles: owner, admin, editor, viewer, super_admin
• RLS em todas as tabelas do núcleo de acesso
• Helpers: is_super_admin, is_platform_admin, has_account_min_role
• Recovery de senha: /auth/forgot-password → e-mail → /auth/update-password (token_hash/type=recovery); confirmação e troca somente no POST /auth/confirm (anti-scanner)
2.3 Critérios de Aceite
• Login funcional e seguro
• Reset de senha com expiração (token consumido somente no POST)
• Auditoria ativa
2.4 Pendências
• Futuras features (Magic Link, Social Login, 2FA)

3. E3 — Adapters Base

3.1 Status
• Concluído

3.2 Implementado
• accountAdapter
• accessContextAdapter
• adminAdapter
• Tipos normalizados (DB → TS)
• Logs estruturados

3.3 Pendências
• Adapters de planos e LPs futuras (planAdapter, landingPageAdapter, sectionAdapter)

3.4 Updates externos (avaliar)
• 2026-01 — Supabase: Data API / PostgREST v14 — Link: https://github.com/orgs/supabase/discussions/41288
• Nota: como há uso de supabase.from().select() em adapters/SSR, ao iniciar ajustes nessa camada, revisar o que muda na v14 (filters/embeds/comportamentos) e validar impacto antes de mexer em queries.

4. E4 — Account Dashboard (Infraestrutura SSR)

4.1 Status
• Concluído

27/01/2026 16:18 — E4.2 (enxuto / anti-drift)

4.2 Implementado
• Redirect `/a` → `/a/home`
• Gateway `/a/home`
• Público sem sessão
• Com sessão: resolve conta/acesso e direciona para a melhor rota disponível
• Sem qualquer vínculo: cria a 1ª conta em modo **vitrine** (`pending_setup`) e direciona para `/a/[account]`
• Com vínculos, mas sem conta permitida: aplica anti-loop e direciona para um estado neutro de “acesso indisponível”
• CTA “Criar conta” (público) no `/a/home` → `/auth/sign-up`
• Rota privada `/a/[account]` com gate SSR (ponto único de decisão)
• Persistência de “última conta” para melhorar retorno do usuário e evitar loops
• Página neutra `/auth/confirm/info` para usuário autenticado sem vínculo válido
• Bloqueios com UX dedicada (sem deny genérico)
• Por **membership**: telas específicas (ver E15)
• Por **status da conta**: telas específicas para conta inativa/suspensa (ver E16)
4.2.1 Referências
• Regras técnicas do gate/adapters: `docs/base-tecnica.md`
• Contrato/DB e evidências: `docs/schema.md`

5. E5 — UI/Auth Account Dashboard

5.1 Status
• Concluído

5.2 Implementado
• Tela de Login (page-based em /auth/login)
• Tela "Esqueci minha senha" (/auth/forgot-password)
• Recovery sem “Continuar”: link do e-mail abre direto em /auth/update-password; submit confirma e troca senha via POST /auth/confirm (anti-scanner)
• Cooldown UI do reset: 60s com contador e botão desabilitado após solicitar
• Tela de Signup (/auth/sign-up) com envio de e-mail de confirmação
• Confirmação de e-mail (signup): link abre em /auth/confirm com type=signup e next=/a/home; token consumido somente no POST (anti-scanner)
• Pós-confirmação: usuário autenticado cai em /a/home; se não houver membership, F2 auto-cria 1ª conta pending_setup + vínculo owner/active e redireciona para /a/acc-... (modo vitrine)

5.3 Critérios de Aceite
• Fluxo page-based (sem modal overlay primário)
• Mensagens seguras e anti-enumeração no reset
• Erros genéricos/seguro no login, sem expor detalhes sensíveis

5.4 Signup/Confirmação mobile (Auth hardening — produto)

• Status: Concluído (exec) (24/02/2026)
• Implementado (estado final): fluxo sign-up → envio do e-mail de confirmação → clique no link → /auth/confirm → redirect para /a/home executado (happy path).
• emailRedirectTo: configurado para apontar para /auth/confirm com next=/a/home e rid para correlação (não-PII).
• UX mínima: página /auth/sign-up-success orientando “cadastro iniciado / confirme no e-mail”.
• Observability mínima: logs estruturados no client para eventos de signup/resend sem PII, com rid (supa#5) e sinal mínimo via logs no runtime do front em produção (Vercel).
• ARTEFATOS_REPO:
• Ajustados: components/sign-up-form.tsx

5.4.1 Escopo
• Garantir fluxo estável de sign-up/confirm no mobile (happy path) com redirect correto para /a/home.
• Incluir correlação por rid (não-PII) no redirect para rastrear signup → confirm → redirect.
• Entregar UX mínima de “cadastro iniciado / confirme no e-mail” em /auth/sign-up-success.
• Emitir logs estruturados (supa#5) sem PII com rid e sinal mínimo no runtime Vercel.

5.4.2 Dependências
• Fluxos Sistema de Acesso 2.0 (signup/confirm/resend).
• Configurações do Supabase Auth (URL/redirect/confirm).

5.4.3 Pendências
• Repetir o happy path em mobile (teste manual ponta a ponta) para fechar “ponta a ponta no mobile”.
• Repetição de tentativas pode ser afetada por rate limit (fora do escopo do E5.4; tratar em caso separado).

5.5 E-mail já cadastrado (estado dedicado + cooldown)
• Status: Briefing
• Objetivo: reduzir fricção no sign-up quando o e-mail já foi usado (confirmado ou não), com estado dedicado + Reenviar confirmação + Fazer login + cooldown com contador e feedback.
• Escopo (MVP): detectar duplicidade (erro exists/already registered ou ok com identities_count==0), ocultar senha/submit, auth.resend({ type: 'signup' }), cooldown ~60s, logs supa#5 sem PII (incl. resend).
• Fora de escopo: diferenciar Caso 2 vs 3, mudanças de infra/SMTP/Resend, BD.

5.6 Infra Auth — E-mail transacional (Supabase Auth via Resend SMTP)
• Status: Concluído (exec) (26/02/2026)
• Objetivo: estabilizar envio de e-mails transacionais do Supabase Auth (signup confirm e reset password) com entrega validada, baixo risco e zero custo adicional no MVP.
• Implementado (estado final): Resend com domínio verificado `lpfactory.com.br` (plano Free); Supabase Auth configurado para SMTP Resend; sender `no-reply@lpfactory.com.br`; signup e forgot password testados com entrega confirmada e links funcionais.
• Decisão: manter sender no domínio raiz (`no-reply@lpfactory.com.br`) no estágio atual; não adotar `no-reply@mail.lpfactory.com.br` por limitação do plano e ausência de escala/volume.
• Consequência (domínio raiz): reputação compartilhada entre site, e-mails transacionais e futuros e-mails humanos (SPF/DKIM/DMARC únicos).
• Operação: e-mails humanos (ex.: alcinoafonso@, support@, vendas@) em provedor humano (Workspace/M365/Zoho); Resend permanece apenas para envio transacional.
• Evolução (quando houver escala): avaliar migração para subdomínio dedicado (`mail.`) para isolamento de reputação, com plano pago e novos registros DNS.
• Referência técnica: detalhes e parâmetros ficam em `docs/base-tecnica.md` (Supabase Auth — E-mail transacional).

6. E6 — UI Kit Provisório

6.1 Status
• Concluído

6.2 Implementado
• Componentes: Button, Card, Input, Label, AlertBanner
• Base: shadcn/ui
• Tipografia oficial (UI do dashboard): Inter via next/font/google aplicada globalmente no <html> (PATH: app/layout.tsx)
• Tailwind tokens LP Factory (aditivo, sem substituir tokens shadcn): namespaces brand/ink/graytech/surface/state + boxShadow.card (PATH: tailwind.config.ts)
• Tailwind content: incluir js/jsx/mdx em {pages,components,app,src} para evitar purge silencioso (PATH: tailwind.config.ts)

6.3 Pendências
• Futura migração para Supabase Platform Kit

6.4 Identidade visual da LP Factory (design system / UI infra)
• Status: Concluído (exec) (09/03/2026)
• Implementado/Definido: base visual proprietária consolidada no repo (remapeamento semântico contido).
• Docs: criado `docs/design-system.md` como documentação oficial do design system.
• Aplicação mínima perceptível: header, menu do usuário, seletor de conta e área admin.
• Escopo: repo-only (sem Supabase; sem alterações funcionais de fluxos).
• Decisão: uso de wordmark textual temporário enquanto o asset oficial da logo não estiver versionado no repo.
• ARTEFATOS_REPO:
• Criados: `docs/design-system.md`
• Ajustados:
• `app/globals.css`
• `components/layout/Header.tsx`
• `components/layout/UserMenu.tsx`
• `components/features/account-switcher/AccountSwitcherList.tsx`
• Pendências:
• asset oficial de logo ainda não versionado no repo
• formulários/componentes-base ainda não padronizados pelo design system
• telas como `pending_setup` e `/a/home` ainda herdam mais a infraestrutura do que uma componentização visual completa
• responsividade ainda depende da implementação de cada nova página/componente
• ajuste fino futuro desejável para uniformizar tratamento visual de estados como `pending_setup`

6.5 UI Component Library
• Status: Concluído (exec) (09/03/2026)
• Natureza: repo-only (sem Supabase; sem migrations; sem SQL; sem backend novo; sem mudança de regra de negócio).
• Objetivo: padronizar biblioteca base de UI proprietária e reduzir markup cru em Auth e onboarding mínimo com baixo risco.
• Implementado (biblioteca base):
• Ajustes leves e compatíveis em `Button`, `Input`, `Card`.
• Novos componentes mínimos: `Select` proprietário simples e `FormField` mínimo (label/hint/error).
• Aplicação mínima real:
• Auth: login, sign up, forgot password, update password.
• Onboarding: `pending_setup`.
• Docs: `docs/design-system.md` atualizado com componentes padronizados desta fase, API mínima, regras de uso, superfícies cobertas e itens fora do escopo.
• ARTEFATOS_REPO:
• Criados:
• `components/ui/form-field.tsx`
• `components/ui/select.tsx`
• Ajustados:
• `app/a/[account]/page.tsx`
• `app/auth/update-password/page.tsx`
• `components/forgot-password-form.tsx`
• `components/login-form.tsx`
• `components/sign-up-form.tsx`
• `components/ui/button.tsx`
• `components/ui/card.tsx`
• `components/ui/input.tsx`
• `docs/design-system.md`
• Checks/QA (reportado): `npm ci` ok; `npm run check` ok; QA manual ok nas superfícies tocadas (Auth e `pending_setup` com Email/WhatsApp).
• Fora do escopo mantido: `Textarea`, `EmptyState`, redesign amplo de dashboards, Supabase/migrations/SQL/policies/backend.

6.6 Visual States & Feedback
• Status: Concluído (exec) (10/03/2026)
• Natureza: repo-only (sem Supabase; sem migrations; sem SQL; sem backend novo; sem mudança de regra de negócio).
• Objetivo: padronizar estados visuais reutilizáveis (loading/empty/feedback) e completar a infraestrutura visual do ciclo E6.4–E6.6 com baixo risco.
• Implementado:
• Componentes novos: `Textarea`, `FeedbackMessage` (erro/sucesso/aviso), `EmptyState`, `LoadingState`.
• Aplicação mínima real:
• `components/forgot-password-form.tsx` (sucesso no novo padrão)
• `app/auth/update-password/page.tsx` (aviso sem token no novo padrão)
• `app/a/[account]/page.tsx` (`pending_setup` ajustado)
• `app/a/[account]/loading.tsx` (loading reutilizável)
• Docs: `docs/design-system.md` atualizado como documento consolidado do ciclo E6.4–E6.6 (componentes, API mínima, uso e superfícies cobertas).
• Checks/QA (reportado): `npm ci` ok; `npm run check` ok; QA manual ok nas superfícies validadas (forgot password, update password sem token, `pending_setup`, loading da conta).

6.7 Dashboard Layout Patterns
• Status: Planejado
• Objetivo: consolidar padrões visuais reutilizáveis para corpo de páginas proprietárias.

7. E7 — Conta Consultiva

7.1 Status
• Concluído (18/10/2025)

7.2 Escopo (entrega concluída)
• Fluxo consultivo legado por token encerrado e removido do runtime atual
• Estrutura de conta consultiva mantida como referência histórica de produto (sem superfície ativa em /admin)

7.3 Critérios de Aceite (estado atual)
• Sem dependência ativa de token pós-venda no runtime
• Onboarding legado por token removido de app e contrato de BD

7.4 Pendências (migradas)
• Refinamentos de UX migrados para Account Dashboard UX (ex-E7.2)

7.5 Evolução — Conta Consultiva Update
7.5.1 Status
• Suspenso (aguardando novo Admin Dashboard)
7.5.2 Objetivo
• Reintroduzir operações consultivas em nova superfície administrativa (etapa posterior)
7.5.3 Escopo
• Definir novo fluxo administrativo sem reativar o legado removido
• Coleta de dados do cliente e configuração comercial em arquitetura revisada
• Integração futura com Billing Engine (E9) e Account Dashboard (E10)
7.5.4 Critérios de Aceite
• Novo fluxo sem dependências de legado removido
• Registro auditável e consistente com contratos atuais de app/DB
7.5.5 Valor agregado
• Mantém a limpeza do legado intencional e reduz drift operacional
• Permite evolução do Admin Dashboard com base estrutural atual
7.5.6 Próximos Passos
• Definir briefing do novo Admin Dashboard consultivo
• Validar escopo com E9/E10 antes de implementação


8. E8 — Access Context & Governança

8.1 Status
• Concluído (03/10/2025)

8.2 Implementado
• Access Context como fonte única para decisão de acesso e roteamento (SSR/UI)
• Contexto mínimo para UI (ex.: dados básicos da conta)
• Decisão “fail-closed” (quando não houver contexto permitido, não entra)
• Logs canônicos de decisão de acesso (para rastreabilidade)
• Resolução de “melhor destino” pós-login (inclui cenário de usuário sem vínculo, em modo vitrine) — ver E4.2/E5.2/E16
8.2.1 Referências
• Regras técnicas (gate/adapters/logs): docs/base-tecnica.md
• Contrato/DB do Access Context: docs/schema.md

8.3 Critérios de Aceite
• Decisão de acesso rastreável (log) e sem “deny genérico” quando houver status conhecido
• Bloqueios por membership seguem UX dedicada (ver E15)
• Bloqueios por status da conta seguem UX dedicada (ver E16)
• Redirect seguro e anti-loop (ver E4.2

9. E9 — Billing, trial e entitlements

9.1 Status
• Em execução faseada — Fase 6 concluída em 30/06/2026.
• Schema mínimo de entitlement comercial versionado.
• Consumo server-side mínimo da elegibilidade comercial disponível.
• Stripe Checkout em teste disponível no app.
• Assinatura teste criada sem entitlement local automático.
• Sem Billing Engine completo implementado nesta fase.
• Próxima execução recomendada: E9 Fase 7.1 — contrato do webhook Stripe e persistência de entitlement.

9.2 Objetivo atual
• Separar condição comercial da conta do lifecycle operacional da conta.
• Definir elegibilidade comercial para criação de LPs como sinal derivado de conta operacionalmente permitida, membership ativo e entitlement comercial válido.
• Preparar o gate comercial sem implementar LP Builder, checkout, webhook ou fluxo visual de criação de LPs.

9.3 Decisões consolidadas

9.3.1 Trial/plano como entitlement
• Status: Concluído (definição)
• Trial, plano e assinatura controlam permissões e limites de uso.
• Trial, plano e assinatura não definem `accounts.status`.
• Expiração de trial/plano deve afetar permissões comerciais, não o lifecycle da conta.

9.3.2 Lifecycle da conta separado de billing
• Status: Concluído (definição)
• `accounts.status` representa lifecycle operacional da conta/setup.
• `account_users.status` representa vínculo operacional do usuário com a conta.
• Billing, trial, plano, assinatura e entitlement comercial representam condição comercial separada.

9.3.3 Elegibilidade comercial para criação de LPs
• Status: Fase 1 concluída em 28/06/2026.
• Regra mínima: conta operacionalmente permitida + membership ativo + entitlement comercial válido.
• Para gate de criação de LP, conta operacionalmente permitida significa `accounts.status = active`.
• Membership ativo significa `account_users.status = active`.
• Conta `active` não fica elegível para criação produtiva apenas por estar ativa.
• E9 libera apenas gate/elegibilidade comercial; não implementa LP Builder nem fluxo visual de criação de LPs.

9.3.4 Origem comercial e confirmação
• Status: Fase 1 concluída em 28/06/2026.
• Origem inicial válida: plano pago confirmado.
• Origens futuras possíveis: trial e liberação manual.
• Provedor de checkout e webhook são mecanismos de confirmação/persistência, não origem comercial.
• Entitlement comercial válido, no recorte inicial, nasce de plano pago confirmado e idempotentemente persistido em fase futura.

9.3.5 Planos comerciais canônicos
• Status: Fase 1 concluída em 28/06/2026.
• Cards comerciais canônicos: Starter, Lite, Pro e Ultra.
• Chaves esperadas: `starter`, `lite`, `pro` e `ultra`.
• O legado `PlanId = "free" | "light" | "pro" | "ultra"` deve ser revisado ou aposentado antes do checkout.

9.3.6 Modelo mínimo de entitlement comercial
• Status: Fase 4 concluída em 28/06/2026.
• Entitlement comercial é domínio próprio e não extensão de `lib/access`, `public.plans` ou `lib/access/plan.ts`.
• Fonte de verdade: `public.account_commercial_entitlements`.
• Leitura efetiva: `public.v_account_commercial_entitlement_effective`.
• Boundary server-side criado: `lib/commercial-entitlements/`.
• Contrato mínimo criado: `CommercialEntitlementSignal`.
• Adapter criado: `getCommercialEntitlementSignal({ accountId })`.
• Fallback fail-closed: `accountId` vazio, erro, exceção ou ausência de linha retornam não elegível.
• Account Dashboard carrega o sinal server-side, mas ainda não aplica bloqueio produtivo.
• Checkout, webhook, provedor, admin, trial operacional, liberação manual operacional, LP Builder e Billing Engine completo permanecem fora do recorte.

9.3.7 Provedor de checkout mínimo
• Status: Fase 6 concluída em 30/06/2026.
• Provedor inicial: Stripe.
• Ambiente inicial: teste.
• Modo de Checkout: `subscription`.
• Boundary criado: `lib/billing-checkout/`.
• App cria Checkout Session server-side.
• Stripe não substitui o entitlement local.
• Redirect de sucesso não confirma pagamento nem libera entitlement.
• `free` não vira plano pago.
• `light` não entra no contrato novo.
• `PlanId` legado não é contrato de negócio.
• Webhook, assinatura do webhook, idempotência e persistência em `account_commercial_entitlements` ficam para a Fase 7.

9.3.8 Webhook Stripe mínimo
• Status: Fase 7.2 concluída em 02/07/2026.
• Endpoint produtivo: `POST /api/stripe/webhook`.
• Evento que ativa/renova entitlement: `invoice.paid`.
• `checkout.session.completed` é evento auxiliar/ignorado e não libera entitlement.
• `customer.subscription.deleted` e `invoice.payment_failed` ficam registrados como controlados/ignorados neste recorte.
• Idempotência operacional: `stripe_webhook_events.event_id`.
• Retry validado para evento `failed` e para `processing` antigo com `retry_reason = stale_processing`.
• Persistência local validada em `public.account_commercial_entitlements`.
• Redirect de sucesso continua sem liberar entitlement.
• Payload bruto, secret, cartão e PII sensível não são persistidos.

9.3.9 Updates avaliados
• `supa#5`, `supa#36`, `supa#40`, `supa#58`.
• Stripe webhook, Vercel Production, Stripe test mode e Supabase/Postgres aplicados na Fase 7.2.

9.4 Pendências vigentes
• N/A para o recorte concluído da Fase 7.2.

9.5 Estruturas e artefatos

Banco — Criados
• `public.account_commercial_entitlements`
• `public.v_account_commercial_entitlement_effective`
• `public.stripe_webhook_events`

Repositório — Criados
• `supabase/migrations/20260628184945_e9_commercial_entitlements.sql`
• `supabase/snippets/e9_phase_3_entitlements_verify.sql`
• `supabase/migrations/20260701202632_e9_stripe_webhook_events.sql`
• `supabase/snippets/e9_phase_7_2_stripe_webhook_verify.sql`
• `lib/commercial-entitlements/contracts.ts`
• `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`
• `lib/commercial-entitlements/index.ts`
• `lib/billing-checkout/contracts.ts`
• `lib/billing-checkout/adapters/stripePriceMap.ts`
• `lib/billing-checkout/adapters/stripeCheckoutAdapter.ts`
• `lib/billing-checkout/adapters/stripeWebhookAdapter.ts`
• `lib/billing-checkout/index.ts`
• `app/a/[account]/_components/commercial-page/checkout-actions.ts`
• `app/api/stripe/webhook/route.ts`

Repositório — Ajustados
• `app/a/[account]/page.tsx`
• `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
• `lib/billing-checkout/index.ts`

9.6 Fora do escopo da Fase 7.2
• Billing Engine completo.
• Admin comercial.
• Trial operacional.
• Liberação manual operacional.
• LP Builder.
• Alteração de layout, copy ou cards da E10.7.
• Processamento de cancelamento e falha de pagamento fora do registro controlado/ignorado.
• Job, rotina, monitoramento ou automação.

10. E10 — Account Dashboard (UX)

10.1 Status
• Em andamento (nova definição)

10.2 Objetivo
• Consolidar experiência pós-login do usuário principal
• Incluir header unificado, troca de contas, persistência e telemetria

10.3 Account Dashboard UX (ex-E7.2)
10.3.1 Status
• 100% concluído (29/10/2025)
10.3.2 Versão
• Roadmap 1.4
10.3.3 Objetivos
• Refinar UX e comportamento multi-conta no Account Dashboard
• Consolidar persistência da última conta e previsibilidade no pipeline público/privado
10.3.4 Implementado
• Componentes AccountSwitcher, AccountSwitcherTrigger, AccountSwitcherList
• Hooks useAccountSwitcher, useUserAccounts
• Header unificado com nome da conta e avatar
• Persistência da última conta via cookie (90d, HttpOnly)
• Leitura do cookie no gateway /a/home para redirecionar para /a/{account}
• Definição do cookie no SSR de /a/[account] quando allow=true
• Middleware usado para limpeza do cookie quando necessário (clear_last=1)
• Integração UserMenu + AccessProvider
• Telemetria (account_switcher_open, account_selected, create_account_click)
10.3.5 QA Validado
• Known issue (produção, multi-contas): last account não reabre consistentemente a última conta após troca de conta e/ou após logout/login
• Troca de conta (UI) e navegação para /a/{account}
• Ocultação automática quando há ≤1 conta
• Comportamento mobile/touch
• SSR deny → público seguro
10.3.6 Valor agregado
• UX limpa e previsível
• Pipeline público/privado estável
• Componentes desacoplados e fáceis de manter
10.3.7 Próxima revisão
• UX Partner Dashboard

10.4 Primeiros passos (pending_setup — status-based)

• Status: Concluído (exec) (13/02/2026)
• Escopo final: entregar o fluxo ponta a ponta de “Primeiros passos” em `/a/[account]` quando `accounts.status=pending_setup`, com formulário inline, validação, persistência do perfil v1, promoção `pending_setup → active` e redirecionamento para o pós-setup.
• Estado atual: onboarding v1 inline em `pending_setup`, com `name` obrigatório, `niche` obrigatório, `preferred_channel` opcional com default `email`, `whatsapp` obrigatório somente quando `preferred_channel=whatsapp` e `site_url` opcional com normalização para URL válida.
• Dependências: E9.3.1.
• Nota: `setup_completed_at/account_setup_completed_at` não devem ser usados no runtime, no gating, no fluxo nem nos logs; ficam mantidos no DB apenas por segurança.

10.4.1 Marcador legado de setup (deprecated)
• Status: Concluído (deprecated) (06/02/2026)
• Estado atual: a estratégia anterior baseada em `setup_completed_at/account_setup_completed_at` foi superada pelo modelo status-based em E10.4.6.
• Regra atual: manter os campos legados no DB por segurança, sem uso no runtime, no gating, no fluxo ou nos logs.

10.4.4 Onboarding: dados mínimos v1
• Status: Concluído (definição consolidada)
• Campos e regras atuais:
• `name` obrigatório
• `niche` obrigatório
• `preferred_channel` opcional com default `email`
• `whatsapp` obrigatório somente quando `preferred_channel=whatsapp`
• `site_url` opcional
• Validações consolidadas:
• `name` e `niche` com `trim` e obrigatoriedade
• `whatsapp` somente dígitos; 10–15 dígitos quando exigido
• `site_url` aceita domínio sem esquema e normaliza para `https://` quando necessário

10.4.5 Onboarding: persistência dos dados mínimos v1
• Status: Concluído (definição) (07/02/2026)
• Decisão: persistir o perfil do onboarding em `account_profiles` (1:1), mantendo `accounts.name` no core.
• Referência: os campos persistidos seguem o contrato funcional definido em 10.4.4.

10.4.6 Exec: persistência do perfil v1 + setup status-based
• Status: Concluído (13/02/2026)
• Implementado:
• persistência de `account_profiles` (v1)
• atualização de `accounts.name`
• promoção `pending_setup → active` com update condicional/idempotente
• redirecionamento para a rota correta da conta após salvar
• endurecimento do Access Context para seleção de conta e tratamento de bloqueios
• ARTEFATOS_REPO:
• Criados:
• `lib/access/adapters/accountProfileAdapter.ts`
• `supabase/migrations/0004__account_profiles.sql`
• Ajustados:
• `app/a/[account]/actions.ts`
• `app/a/[account]/page.tsx`
• `lib/access/getAccessContext.ts`
• `lib/access/adapters/accessContextAdapter.ts`
• `lib/access/adapters/accountAdapter.ts`

10.4.7 Refinamentos de UX pós-implementação
• Status: Concluído (exec) (21/02/2026)
• Implementado/Definido:
• preservação dos valores válidos do formulário em erro
• `site_url` aceita domínio sem esquema e normaliza para `https://`
• botão “Salvar e continuar” gated por nome válido
• Enter com foco no primeiro inválido
• progressive disclosure mobile
• ARTEFATOS_REPO:
• Criados:
• `lib/onboarding/e10_4_setup_validation.ts`
• `app/a/[account]/_components/PendingSetupFirstSteps.tsx`
• Ajustados:
• `app/a/[account]/actions.ts`
• `app/a/[account]/page.tsx`
• `app/a/[account]/_components/PendingSetupFirstSteps.tsx`
• `lib/access/adapters/accountAdapter.ts`

10.4.8 Anti-drift: validação compartilhada UI/server (opcional)
• Status: Briefing (opcional)
• Objetivo: consolidar as regras de validação do onboarding mínimo em módulo compartilhado entre UI e server, com outputs padronizados de erro.
• Dependências: E10.4.6, E10.4.7, E12.8.1.
• Fora de escopo: mudanças de BD, tracking interno e alteração do escopo de campos.

10.5 Pós-setup persuasivo sem entitlements (active — conversão)

• Status: Em evolução
• Escopo atual: separar o estado `active` do fluxo `pending_setup` e preparar a camada pós-setup do dashboard da conta.
• Estado atual do runtime: `app/a/[account]/page.tsx` renderiza “Primeiros passos” somente para `accounts.status=pending_setup`; para conta autenticada fora desse estado, a rota ainda não entrega UX específica do E10.5.
• Base já implementada no repo: estrutura de taxonomia/templates/guides no BD e pipeline operacional de resolução de nicho no pós-save do onboarding.
• Dependências: E9.3.1, E10.4.6, E10.5.1, E10.5.2, E10.5.6.
• Nota: `setup_completed_at/account_setup_completed_at` não devem ser usados no runtime, no gating, no fluxo nem nos logs; ficam mantidos no DB apenas por segurança.

10.5.1 Matriz “preparação vs produtivo” + enforcement (SSR + actions)
• Status: Briefing
• Objetivo: definir a matriz de ações/rotas “produtivas” vs “preparação” e aplicar enforcement server-side sem depender só de UI.
• Escopo:
• fechar status/entitlements mínimos por rota/ação
• declarar o sinal canônico de entitlement/limite efetivo
• definir mensagens e CTAs de bloqueio coerentes com o E10.5
• Dependências: E9.3.1, E10.5.
• Fora de escopo: implementação da UX principal do E10.5 nesta etapa.

10.5.2 Base do BD do E10.5
• Status: Concluído (26/04/2026)
• Escopo final:
• criação da base estrutural do E10.5 no BD
• ajuste estrutural de `taxon_market_research`
• ajuste estrutural de `taxon_market_research_items`
• Estado final:
• `taxon_market_research`: `id`, `taxon_id`, `research_block`, `audience_scope`, `version`, `status`, `created_at`, `updated_at`
• unicidade por (`taxon_id`, `research_block`, `audience_scope`, `version`) e no máximo 1 versão `active` por (`taxon_id`, `research_block`, `audience_scope`)
• `taxon_market_research_items`: `id`, `research_id`, `item_key`, `item_text`, `priority`, `sort_order`, `is_active`, `notes`, `created_at`, `updated_at`
• `taxon_market_research_items`: herda `audience_scope` por `research_id`; sem UNIQUE extra nesta etapa; `sort_order` como `NOT NULL DEFAULT 999`
• `taxon_message_guides`: base de guides por contexto vinculada à pesquisa-pai
• ARTEFATOS_REPO:
• Criados:
• `supabase/migrations/0006__e10_5_2_taxonomy_content_base.sql`
• `supabase/migrations/0007__e10_5_2_1_group_c_research_adjust.sql`
• `supabase/migrations/0008__e10_5_2_1_research_audience_scope_parent.sql`

10.5.3 Kit operacional de expansão do Grupo A
• Status: Concluído (exec) (15/04/2026)
• Objetivo: padronizar a expansão de `business_taxons` e `business_taxon_aliases` com investigação, proposta, aprovação, carga e validação sem drift entre chats.
• Implementado:
• guia operacional do Grupo A versionado em `docs/`
• snippets SQL operacionais do Grupo A versionados em `supabase/snippets/`
• investigação prévia, proposta, aprovação, carga e validação consolidadas como fluxo operacional
• `parent_slug` nulo aceito para `niche` e `ultra_niche`
• `parent_slug` preenchido e inexistente aborta explicitamente a carga
• carga prática reportada para `implante-dentario` com pai `odontologia` e alias `implantodontia`
• ARTEFATOS_REPO:
• Criados:
• `docs/e10-5-3-grupo-a-investigacao.md`
• `supabase/snippets/e10_5_3_grupo_a_carga.sql`
• `supabase/snippets/e10_5_3_grupo_a_investigacao_taxons.sql`
• `supabase/snippets/e10_5_3_grupo_a_investigacao_aliases.sql`

10.5.3.1 Curadoria operacional de aliases enxutos vs microvariações textuais
• Status: Briefing
• Objetivo: definir o critério operacional de curadoria de aliases no Grupo A, separando o que deve ser cadastrado manualmente do que deve ficar para matching textual leve futuro.
• Dependências: E10.5.3, E10.5.6.

10.5.4 Helper puro de confiança determinística para taxon match
• Status: Concluído (exec) (10/05/2026)
• Natureza: repo-only.
• Objetivo: avaliar candidatos de taxonomia e produzir decisão determinística tipada para consumo pelo fluxo de resolução de nicho.
• Implementado:
• helper puro `evaluateDeterministicTaxonMatch`
• contrato tipado de decisão determinística
• `aiEscalationMode` para preparar escalonamento IA
• ARTEFATOS_REPO:
• Criados:
• `lib/onboarding/niche-resolution/deterministicConfidence.ts`
• Ajustados:
• `lib/onboarding/niche-resolution/contracts.ts`

10.5.5 Fluxo operacional de pesquisa por taxon
• Status: Implementado e validado na `main`.
• Objetivo: operar a pesquisa por taxon em etapas separadas de identificação, pesquisa bruta, estruturação dos itens, carregamento e verificação.
• Modelo operacional:
  • cada `research_block` é uma unidade operacional própria;
  • não há `strategic_synthesis` nem nova tabela de síntese;
  • `taxon_market_research` guarda o registro-pai e os metadados de cada bloco;
  • `taxon_market_research_items` guarda os itens estruturados e é a fonte principal para templates futuros.

10.5.5.1 Artefatos na ordem de uso
• `docs/prompt-nicho-identificacao.md` — identifica o taxon, o `audience_scope` e os blocos da pesquisa.
• `docs/prompt-nicho-pesquisa.md` — produz a pesquisa bruta por `research_block`.
• `docs/prompt-nicho-itens-estruturados.md` — transforma a pesquisa aprovada em itens estruturados.
• `docs/prompt-nicho-carregamento.md` — orienta a geração do SQL de carregamento.
• `supabase/snippets/e10_5_5_nicho_carregamento.sql` — carrega registros-pai e itens com CTEs diretas.
• `docs/prompt-nicho-verificacao.md` — orienta a conferência após o carregamento.
• `supabase/snippets/e10_5_5_nicho_verificacao.sql` — retorna um resumo read-only da carga.

10.5.5.2 Validação concluída
• Fluxo validado na `main` para o taxon `Corretor de imóveis de médio padrão`, com `audience_scope = end_customer`, `version = 1`, `status = draft` e os blocos `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
• Foram carregados 74 itens; a verificação retornou `check_status = ok`, `invalid_items = 0` e `other_versions = 0` em todos os blocos.

10.5.5.3 Recorte aprovado para consumo pela E10.7
• Para a E10.7, a pesquisa completa do taxon deve entregar `version = 1`, `status = active` e dois `audience_scope`: `business_buyer` e `end_customer`.
• Cada `audience_scope` deve conter quatro blocos fixos: `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
• O recorte não resolve versões independentes por bloco nesta etapa: a E10.7 usa pesquisas `active version 1` completas.
• O recorte não altera schema, não cria nova tabela e não muda a hierarquia dos taxons.
• Novos blocos futuros ficam fora do recorte atual e dependem de planejamento próprio.

10.5.5.4 Pendências
• Decidir se a pesquisa bruta será arquivada no repo, no banco ou em ambos.
• Se o arquivamento for no banco, avaliar o ajuste de schema necessário em etapa futura própria.
• Usar os dados carregados futuramente na E10.7, para páginas comerciais personalizadas por nicho, sem vincular esse consumo à página genérica da E10.6.

10.5.6 Classificação da conta e resolução do nicho
• Status: Parcialmente concluído (14/05/2026)
• Escopo atual: pipeline server-side no pós-save do `pending_setup`, com matching determinístico, decisão de confiança, persistência operacional, vínculo oficial sob alta confiança e escalonamento IA estruturado.

10.5.6.1 Matching determinístico e adapter server-side
• Status: Concluído
• Matching determinístico por RPC read-only com normalização textual, FTS/`pg_trgm`, `match_source` e `score`.
• Adapter server-side tipado para consumo no fluxo de resolução.

10.5.6.2 Regra de confiança determinística
• Status: Concluído
• Avaliação de candidatos via `evaluateDeterministicTaxonMatch` com saída tipada de decisão.
• Separação entre alta confiança, ambiguidade e escalonamento IA.
• Match `pg_trgm` com candidato único forte segue sem fricção para decisão determinística.

10.5.6.3 Persistência operacional em `account_niche_resolutions`
• Status: Concluído
• Camada operacional da resolução de nicho.
• Não é vínculo oficial.
• Base para decisão determinística, IA, fallback e revisão.

10.5.6.4 Vínculo oficial em `account_taxonomy`
• Status: Concluído
• `account_taxonomy` é o vínculo oficial da conta com taxon aprovado.
• Gravação automática apenas em alta confiança determinística.
• Não substitui automaticamente vínculo primário diferente.

10.5.6.5 IA estruturada e persistência `ai_*`
• Status: Concluído
• Resolver IA server-side com Structured Outputs quando o determinístico não resolve com segurança.
• IA não cria taxon, não cria alias e não grava `account_taxonomy`.
• Resultado IA persistido em `account_niche_resolutions`.

10.5.6.6 Microdiálogo visual e fallback final
• Status: Em andamento
• Componente atual: `app/a/[account]/_components/NicheResolutionCard.tsx`.
• O `NicheResolutionCard` é um componente da E10.5 para confirmação do nicho da conta; não é parte do conteúdo comercial da E10.6.
• O card pode:
• confirmar um único nicho sugerido;
• permitir escolha entre opções;
• solicitar que o usuário informe manualmente seu nicho quando não houver resultado seguro.
• O card é exibido somente para conta `active`, sem taxon primário e com resolução acionável ainda não finalizada.
• Quando necessário, deve permanecer acima da página comercial genérica da E10.6.
• A E10.6 não deve redesenhar, remover nem alterar o comportamento funcional desse card.
• Fallback elegante sem rechamar IA em loop.

10.5.6.7 Resolução do template comercial
• Status: Retirado do recorte atual (12/06/2026)
• A resolução antecipada de template comercial foi removida junto com a implementação anterior da E10.6.
• A E10.6 será genérica, independente de taxon e sem consulta a pesquisas ou itens estruturados.
• A E10.7 será responsável futuramente pela personalização da página comercial por nicho.
• Não existe, no estado atual, arquitetura universal ou multicanal, contrato universal, resolver de template ou fallback compartilhado para canais.

• ARTEFATOS_REPO preservados do E10.5.6:
• `supabase/snippets/e10_5_6_7_commercial_template_service_role_grants.sql`
• `supabase/migrations/0014__e10_5_6_7_commercial_template_service_role_grants.sql`
• `supabase/rollbacks/20260609__e10_5_6_7_commercial_template_service_role_grants.rollback.sql`
• `supabase/migrations/0009__e10_5_6_deterministic_taxon_matching.sql`
• `supabase/migrations/0011__e10_5_6_account_niche_resolutions.sql`
• `supabase/migrations/0012__e10_5_6_account_taxonomy_service_role_grants.sql`
• `supabase/migrations/0013__e10_5_6_ai_structured_outputs.sql`
• `supabase/rollbacks/20260509__e10_5_6_deterministic_taxon_matching.rollback.sql`
• `supabase/rollbacks/20260511__e10_5_6_account_niche_resolutions.rollback.sql`
• `supabase/rollbacks/20260511__e10_5_6_account_taxonomy_service_role_grants.rollback.sql`
• `supabase/rollbacks/20260514__e10_5_6_ai_structured_outputs.rollback.sql`
• `lib/onboarding/niche-resolution/adapters/taxonMatchAdapter.ts`
• `lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter.ts`
• `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`
• `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
• `lib/onboarding/niche-resolution/deterministicConfidence.ts`
• Ajustados:
• `lib/onboarding/niche-resolution/contracts.ts`
• `app/a/[account]/actions.ts`

• Pendências gerais do E10.5.6:
• a UX principal do E10.5 para conta `active` sem entitlements ainda não está implementada na rota `/a/[account]`
• o resultado operacional da resolução de nicho ainda não está exposto em UX final do dashboard da conta

10.6 Página comercial genérica do Account Dashboard
• Status: Concluído (15/06/2026)
• Objetivo: disponibilizar em `/a/[account]` uma página comercial genérica para contas `active`, antes da personalização por nicho da E10.7.
• Implementado:
• página responsiva com hero, benefícios, serviços, planos, diferenciais, funcionamento, FAQ e CTA final;
• conteúdo fixo `generic-v1` mantido localmente na rota;
• planos ilustrativos Starter, Lite, Pro e Ultra, com aviso de que não constituem oferta definitiva;
• CTAs gerais e por plano direcionados ao WhatsApp;
• `NicheResolutionCard` preservado acima da página quando aplicável;
• tracking server-side vinculado ao `account_id`, sem PII, com os eventos `commercial_page_view`, `commercial_primary_cta_click` e `commercial_plan_cta_click`;
• eventos armazenados em `audit_logs.event`, propriedades em `changes_json` e `action = insert`;
• Preview, produção, WhatsApp e tracking validados.

10.6.1 Estruturas e artefatos

Banco — Ajustados
• `public.audit_context_event`

Repositório — Criados
• `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
• `app/a/[account]/_components/commercial-page/actions.ts`
• `app/a/[account]/_content/commercial-page/generic-v1.ts`
• `supabase/migrations/20260614124000_fix_audit_context_event_event_column.sql`

Repositório — Ajustados
• `app/a/[account]/page.tsx`

10.6.2 Pendências
• Aprovar ou refinar a página como referência visual para as futuras páginas nichadas.
• Avaliar personalização por histórico da conta sem exigir CRM ou identificação individual.
• Avaliar experiência específica do WhatsApp por dispositivo somente se o ganho justificar a complexidade.
• Tracking de scroll, FAQ e “Como funciona” permanece fora desta versão.
• Updates futuros já aprovados relacionados: `prod#3`, `vercel#8`, `vercel#10`, `vercel#11`, `vercel#20` e `prod#15`.

10.6.3 Relação com a E10.7
• A E10.7 permanece separada e será responsável pelas páginas comerciais personalizadas por nicho.
• A página genérica da E10.6 permanece como fallback quando não houver página nichada publicada.
• Persistência, edição, geração e publicação da E10.7 serão definidas no planejamento desse caso.

10.6.4 Personalização por histórico da conta
• Status: Futuro.
• Usar eventos vinculados ao `account_id` para reconhecer contas recorrentes.
• Considerar último acesso, quantidade de visitas, último plano clicado e CTAs utilizados.
• Adaptar futuramente mensagem, plano destacado ou CTA.
• Manter a página genérica como fallback.
• Não exigir identificação individual nem CRM completo.

10.6.5 Evoluções futuras de UX dos CTAs
• Status: Futuro.
• Avaliar `web.whatsapp.com/send` no desktop.
• Manter `wa.me` no celular e como fallback.
• Não realizar envio automático.
• Implementar detecção por ambiente somente se o ganho justificar a complexidade.

10.7 Páginas comerciais personalizadas por nicho
• Status: Em execução faseada — Fase 7 concluída em 28/06/2026.
• Próxima execução: Fase 8 — edição manual de copy e gestão simples de versões.
• Objetivo: gerar, revisar, publicar e consumir páginas comerciais por taxon; a IA roda apenas em operação administrativa/server-side; `/a/[account]` consome somente artefato publicado e validado; ausência de conteúdo nichado não pode quebrar `/a/[account]`.
• Dependência estrutural: a E18 define os contratos reutilizáveis mínimos; a E10.7 aplica, valida e ajusta esses contratos no caso comercial concreto.
• A página genérica `generic-v1` da E10.6 permanece concluída e será o fallback obrigatório.

10.7.1 Decisões aprovadas
• Usar `version = 1` nas pesquisas consumidas pela E10.7.
• Exigir quatro blocos fixos por `audience_scope`: `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
• Publicar o artefato com `audience_scope = business_buyer`.
• Registrar `end_customer` apenas como contexto no `provenance_json`.
• Não alterar a hierarquia dos taxons nesta etapa.
• Não resolver versões independentes por bloco nesta etapa.
• Não implementar LP Builder, liberação de LPs, continuidade de contas, bloqueio de novas ativações nem IA em runtime da página.
• O conteúdo da página comercial é global por taxon e reutilizado por contas que resolvam a mesma página publicada; a exibição ocorre no contexto da conta e o tracking permanece vinculado ao `account_id`.
• O taxon piloto valida o mecanismo, mas não limita a implementação ao seu slug.
• Taxon elegível é definido por pesquisa estruturada completa.
• Para `commercial_activation`, o template é universal por canal e não deve ser duplicado por taxon.
• A estrutura da página comercial é fixa no MVP: Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ e CTA final.
• A IA gera copy dentro da estrutura definida; não decide seções nem ordem.
• As cores permanecem universais do template comercial no MVP.
• A composição por taxon é materialização técnica no schema atual, não composição estratégica nem tarefa manual do operador.

10.7.2 Fase 1 — Ajuste documental e patch estrutural mínimo
• Status: Concluída e validada em 21/06/2026.
• Resultado: escrita administrativa controlada viabilizada antes da persistência do draft; publicação transacional disponível no banco; detalhes de DB permanecem em `docs/schema.md`.
• Fora do escopo preservado: geração IA, Account Dashboard, LP Builder, nova tabela, hierarquia de taxons e alteração de `research_version`.
• Estruturas e artefatos:
  • Banco — Ajustados: `content_artifacts`; `content_artifact_research_sources`
  • Banco — Criados: `publish_content_artifact_draft(uuid)`
  • Repositório — Criados: `supabase/migrations/20260621162400_e10_7_admin_artifact_write_publish.sql`; `supabase/migrations/20260621181742_e10_7_fix_research_sources_policy_name.sql`; `supabase/snippets/e10_7_admin_artifact_write_publish_verify.sql`
  • Repositório — Ajustados: `docs/schema.md`

10.7.3 Fase 2 — Geração IA administrativa de draft comercial
• Status: Concluída em 22/06/2026.
• Estado atual: geração server-side/Admin de draft comercial por taxon disponível, criando artifact `draft` validável antes de publicação.
• Persistência e proveniência: fontes de pesquisa são vinculadas ao artifact e contexto complementar permanece no `provenance_json`.
• Falha segura: inconsistência na persistência de fontes invalida/arquiva o draft recém-criado.
• Limites: sem publicação automática, sem consumo em `/a/[account]`, sem IA em runtime público, sem LP Builder, sem job, fila ou agente, sem nova tabela, view, função, grant, policy, migration ou alteração de hierarquia dos taxons.
• Estruturas e artefatos:
  • Repositório — Criados: `app/admin/(protected)/templates/actions.ts`; `lib/conversion-content/commercial-activation/draft-generation.ts`; `supabase/snippets/e10_7_phase_2_draft_verify.sql`

10.7.4 Fase 3 — Operação administrativa mínima em `/admin/templates`
• Status: Concluída em 23/06/2026.
• Estado atual: `/admin/templates` oferece operação administrativa mínima para gerar, regenerar, revisar e publicar drafts comerciais `commercial_activation`.
• IA: restrita ao fluxo administrativo/server-side, sem IA em runtime público.
• Publicação: usa `publish_content_artifact_draft(uuid)` e valida server-side o draft publicável do bundle esperado.
• Estado funcional: preview administrativo usa renderer existente; composição é resolvida por `content_template_taxons`; Templates está disponível na navegação Admin.
• Limites: não inclui `/a/[account]`, Account Dashboard, consumo público, fallback por ancestral, segundo taxon, LP Builder, edição visual avançada, Agents SDK, Sandbox Agents, job, fila, agente, nova tabela, nova migration, nova função, novo grant, nova policy, alteração de `research_version`, liberação de LPs, continuidade de contas ou bloqueio de ativações.

10.7.4.1 Estruturas e artefatos

Repositório — Criados
• `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
• `lib/conversion-content/commercial-activation/composition.ts`

Repositório — Ajustados
• `app/admin/(protected)/templates/page.tsx`
• `app/admin/(protected)/templates/actions.ts`
• `components/admin/adminNavigation.ts`
• `lib/conversion-content/commercial-activation/draft-generation.ts`

10.7.5 Fase 4 — Consumo no Account Dashboard
• Status: Concluída em 23/06/2026.
• Estado atual: `/a/[account]` consome página comercial nichada quando existir bundle `commercial_activation` publicado e validado.
• Fallback: ausência, erro, artefato inválido ou conteúdo não consumível retorna para `generic-v1`.
• Limites: não consome `draft`, não consome `archived` e não usa IA em runtime público.
• Tracking: mantém eventos comerciais vinculados ao `account_id`, sem PII.
• Pendências: nenhuma vigente neste recorte.

10.7.5.1 Estruturas e artefatos

Repositório — Criados
• `app/a/[account]/_components/commercial-page/CommercialActivationTrackingScope.tsx`
• `app/a/[account]/_components/commercial-page/PublishedCommercialActivationPage.tsx`

Repositório — Ajustados
• `app/a/[account]/_components/commercial-page/actions.ts`
• `app/a/[account]/page.tsx`
• `lib/conversion-content/adapters/commercialActivationAdapter.ts`
• `lib/conversion-content/commercial-activation/renderer.tsx`
• `lib/conversion-content/commercial-activation/validation-cases.ts`

10.7.6 Fase 5 — Validação com segundo taxon e composição genérica
• Status: Concluída em 25/06/2026.
• Estado atual: `/admin/templates` lista taxons elegíveis por pesquisa estruturada completa e permite gerar/publicar página `commercial_activation` para qualquer taxon elegível.
• Geração: exige `taxonSlug`; o fallback implícito para o taxon piloto foi removido.
• Composição: `ensureCommercialActivationCompositionForTaxon(taxonId)` materializa composição técnica sob demanda quando o taxon elegível ainda não tem composição ativa.
• Publicação: continua usando `publish_content_artifact_draft(uuid)`.
• Consumo: `/a/[account]` permanece consumindo somente página publicada e validada.
• Limites: não cria template por taxon, não leva IA para runtime público, não cria procedimento manual de composição por taxon e não altera a hierarquia dos taxons.
• Pendência vigente: trocar erro técnico `missing_openai_env` por mensagem amigável quando aplicável.
• Updates Supabase aplicados: `#Supa36`, `#Supa05`, `#Supa40` e `#Supa58`.

10.7.6.1 Estruturas e artefatos

Banco — Criados
• `ensure_commercial_activation_composition(p_taxon_id uuid)`

Repositório — Criados
• `supabase/migrations/20260624203000_e10_7_phase_5_ensure_commercial_activation_composition.sql`
• `supabase/snippets/e10_7_phase_5_eligible_taxons_verify.sql`

Repositório — Ajustados
• `app/admin/(protected)/templates/page.tsx`
• `app/admin/(protected)/templates/actions.ts`
• `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
• `lib/conversion-content/commercial-activation/draft-generation.ts`
• `lib/conversion-content/commercial-activation/composition.ts`
• `docs/lousa-plano-base-e10-7.md`
• `docs/schema.md`
• `docs/platform-config.md`

10.7.7 Fase 6 — Admin comercial enxuto e contrato fixo da página comercial
• Status: Concluída em 26/06/2026.
• Estado atual: `/admin/templates` funciona como lista limpa de taxons comerciais, sem preview, histórico completo, geração, publicação ou operação detalhada na lista.
• Lista: exibe taxon, estado, pesquisa, composição, artefatos e ação Selecionar.
• Página operacional: `/admin/templates/commercial-activation/[taxonSlug]` concentra status do taxon, gerar/regenerar draft, publicar draft, cards de estado, diagnóstico técnico mínimo, preview e histórico.
• Botões: Gerar draft, Regenerar draft e Publicar draft usam loading/disable durante submissão.
• Regra de ação: quando houver draft publicável, o próximo passo é Publicar draft; quando houver draft em revisão ou published sem draft ativo, a ação de geração aparece como Regenerar draft; quando não houver draft nem published, aparece como Gerar draft.
• Mensagem de publicação: informa sucesso e, quando aplicável, arquivamento da versão anterior publicada.
• Limites: não inclui edição manual de draft, IA assistida, regeneração baseada em latest published, seleção de published oficial, editor visual, alteração do layout público, alteração de cores, alteração do runtime público `/a/[account]`, nova migration, nova tabela, nova RPC, novo grant, nova policy, flags, A/B test, cache novo, server-side tracking novo ou navegação global multi-contas.
• Updates aplicados: `prod#14` e `prod#16`.

10.7.7.1 Estruturas e artefatos

Repositório — Criados
• `app/admin/(protected)/templates/_components/PendingSubmitButton.tsx`
• `app/admin/(protected)/templates/commercial-activation/[taxonSlug]/page.tsx`

Repositório — Ajustados
• `app/admin/(protected)/templates/page.tsx`
• `app/admin/(protected)/templates/actions.ts`
• `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`

10.7.8 Fase 7 — Auditoria e consolidação do contrato commercial_activation
• Status: Concluída em 28/06/2026.
• Resultado: auditoria determinística do contrato `commercial_activation` concluída, com verificação read-only versionada para template, composição, published, `content_json` e fontes.
• Estrutura fixa confirmada no MVP: Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ e CTA final.
• Limite confirmado: IA preenche copy dentro da estrutura aprovada, mas não decide seções, ordem, layout ou cores.
• Runtime público preservado: sem alteração em `/a/[account]`, sem IA em runtime público e sem novo consumo de `draft` ou `archived`.
• Banco preservado: nenhuma tabela, view, RPC, policy, grant, constraint, trigger ou migration criada/alterada.
• Updates relacionados: `supa#40`, `supa#58` e `prod#16`.
• Pendência vigente: executar o snippet read-only no Supabase Inspect/SQL Editor quando for necessária evidência operacional do estado real do banco.

10.7.8.1 Estruturas e artefatos

Repositório — Criados
• `supabase/snippets/e10_7_phase_7_commercial_activation_contract_verify.sql`

Repositório — Ajustados
• `docs/lousa-plano-base-e10-7.md`

10.7.9 Fase 8 — Edição manual de copy e gestão simples de versões
• Status: Planejada.
• Objetivo: permitir ajuste humano de copy e gestão simples de versões depois do contrato fixo auditado.
• Limites: não incluir IA assistida, editor visual, edição por bloco independente, múltiplas versões `published` ativas, alteração do runtime público, alteração de template, composição, layout ou cores.

10.7.10 Exibição, fallbacks e tracking
• Fluxo em `/a/[account]`: conta `active` → resolver `account_id` → resolver taxon primário ativo → procurar bundle `commercial_activation` publicado → renderizar página nichada somente quando o bundle estiver `ready` → usar `generic-v1` quando não houver bundle consumível.
• Preservar `NicheResolutionCard` acima da página quando aplicável.
• Conta sem taxon, taxon inativo ou inválido, pesquisa incompleta, composição ausente ou inválida, página não publicada, artifact inválido, erro de leitura ou render model não `ready` usam a página genérica E10.6 como fallback seguro.
• Reutilizar `commercial_page_view`, `commercial_primary_cta_click` e `commercial_plan_cta_click`, com identificadores seguros e sem PII.
• A E10.7 não pode bloquear o acesso à página comercial.
• O runtime público não pode consumir `draft`, `archived` nem chamar IA para renderizar a página comercial.

11. E11 — Gestão de Usuários e Convites

11.1 Status
• Planejado

11.2 Escopo
• UI /a/[account]/members
• Convites via email com tokens
• Controle de papéis (Admin, Editor, Viewer)

11.3 Regras
• Viewer não convida
• Admin pode convidar e revogar

12. E12 — Admin Dashboard

12.1 Status
• Em desenvolvimento

12.2 Objetivo
• Consolidar o Admin Dashboard como seção administrativa protegida, separada do Account Dashboard, com navegação própria e leitura operacional read-only.

12.3 Escopo atual
• `/admin` é uma página pública de entrada do Admin Dashboard.
• Subrotas internas permanecem protegidas por gate SSR administrativo em `app/admin/(protected)/layout.tsx`.
• `/admin/contas` continua sendo o destino pós-login do admin.
• Header e menu próprios do Admin, sem `AccountSwitcher` e sem dependência de conta ativa.
• Shell operacional com sidebar, navegação administrativa e responsividade básica.
• Leitura read-only real para contas, resoluções de nicho e taxonomia.
• Sem mutações administrativas, billing, migrations, SQL ou alterações de RLS nesta fase.

12.3.1 Entrada pública do Admin Dashboard
• Status: Concluído e validado em testes humanos (22/06/2026).
• `/admin` agora abre uma página pública de entrada do Admin Dashboard, com apresentação simples e botão de acesso.
• O botão de entrada aponta para `/auth/login?next=%2Fadmin%2Fcontas`.
• As subrotas internas continuam protegidas pelo gate administrativo deslocado para `app/admin/(protected)/layout.tsx`.
• `/admin/contas` permanece como destino pós-login do admin.

12.3.2 Leitor read-only de documentação do repositório no Admin Dashboard
• Status: Concluído e validado em testes humanos (22/06/2026).
• `/admin/documentacao` é uma área protegida pelo gate administrativo existente.
• A página lista uma whitelist fixa de documentos de `docs/` e permite leitura read-only do conteúdo.
• A leitura usa filesystem server-side do repositório, com inclusão explícita dos arquivos permitidos no tracing da rota.
• UI final: filtro superior, dropdown alfabético, conteúdo abaixo, sem lista intermediária e responsiva em desktop/mobile.
• Markdown é exibido como texto bruto; renderer Markdown fica como oportunidade futura por exigir dependência não instalada.
• Não usa Supabase, migrations, GitHub API em runtime, edição, salvamento, publicação ou mutações.

12.4 Áreas atuais
• Contas
• Resoluções de nicho
• Taxonomia
• Templates
• Documentação
• Auditoria

12.5 Artefatos principais

Criados:
• `app/admin/(protected)/documentacao/page.tsx`
• `app/admin/(protected)/contas/page.tsx`
• `app/admin/(protected)/contas/[accountId]/page.tsx`
• `app/admin/(protected)/resolucoes-de-nicho/page.tsx`
• `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
• `app/admin/(protected)/taxonomia/page.tsx`
• `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
• `app/admin/(protected)/layout.tsx`
• `components/admin/AdminPageHeader.tsx`
• `components/admin/AdminPlaceholderPage.tsx`
• `components/admin/AdminSidebar.tsx`
• `components/admin/AdminStatusBadge.tsx`
• `components/admin/adminNavigation.ts`
• `lib/admin/adminFormat.ts`
• `lib/admin/adapters/adminAccountsAdapter.ts`
• `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
• `lib/admin/adapters/adminReadOnlyAdapter.ts`
• `lib/admin/adapters/adminReadOnlyHelpers.ts`
• `lib/admin/adapters/adminReadOnlyTypes.ts`
• `lib/admin/adapters/adminTaxonomyAdapter.ts`
• `lib/admin/docsCatalog.ts`
• `lib/admin/readRepoDoc.ts`

Ajustados:
• `app/admin/layout.tsx`
• `app/admin/page.tsx`
• `components/admin/AdminHeader.tsx`
• `components/admin/AdminUserMenu.tsx`
• `components/admin/adminNavigation.ts`
• `next.config.js`

12.6 Pendências
• Templates e Auditoria permanecem como áreas previstas.
• Mutações administrativas gerais permanecem fora do escopo atual, exceto as mutações mínimas aprovadas para a E10.7 em `/admin/templates`, descritas em 12.8.
• Billing e operações de suspensão/reativação dependem de recorte futuro.

12.7 Geração administrativa de página comercial por taxon
• Status: Reintroduzido em recorte mínimo pela E10.7 em 19/06/2026.
• A operação administrativa não será um editor visual nem LP Builder.
• O recorte autorizado limita-se a gerar draft, regenerar draft, visualizar, publicar e arquivar `published` anterior, conforme 12.8.

12.8 Superfície inicial da operação administrativa mínima da E10.7
• `/admin/templates` será a superfície inicial da operação administrativa mínima da E10.7.
• Operações permitidas: listar taxons elegíveis, mostrar checklist simples, indicar pesquisas presentes ou ausentes, indicar composição disponível, gerar draft, regenerar draft, visualizar draft com `CommercialActivationRenderer`, publicar draft e arquivar `published` anterior se existir.
• Limites: sem editor visual, sem múltiplos aprovadores, sem gestão de clientes, sem bloqueio de ativações, sem permissão de criar LPs e sem LP Builder.
• Esta tela passará a ter mutações administrativas controladas para a E10.7, respeitando permissões administrativas e operação transacional de publicação.

13. E13 — Partner Dashboard

13.1 Status
• Planejado

13.2 Escopo
• Painel de agências e parceiros
• Branding, gestão de clientes, relatórios
• Integração futura com Partner API
• Partner só deve ganhar boundary própria quando houver massa real de código; até lá, novas estruturas não devem ser abertas por antecipação.

14. E14 — Workspace Dashboard

14.1 Status
• Planejado

14.2 Escopo
• Perfil e preferências do usuário
• Seleção de conta ativa
• Integração com Access Context

15. E15 — Usuário e Membership (B1)

15.1 Status
• Concluído

15.2 Escopo
• Definir Usuário vs Membership (vínculo por conta).
• Definir status do membership: pending | active | inactive | revoked.
• Regra única: pending → active somente via claim/aceite de convite.
• Status é por membership (o mesmo usuário pode ter status diferentes em contas diferentes).
• UX por status (snapshot): bloqueios por membership levam a telas dedicadas /auth/confirm/* (sem “deny genérico”).
• Usuário autenticado sem membership: segue o fluxo de “primeiro acesso” (auto 1ª conta vitrine) e retorna ao dashboard (ver E5/E8)..
15.2.1 Referências
• Regras técnicas do gate/adapters: docs/base-tecnica.md
• Contrato/DB (membership/status): docs/schema.md

15.3 Critérios de conclusão
• Gate SSR diferencia corretamente todos os status de membership (UX dedicada por status).
• Não existe “atalho” que ative membership fora do claim/aceite oficial.
• Usuário autenticado sem membership não fica bloqueado (fluxo de 1ª conta vitrine concluído) (ver E5/E8).

15.4 Dependências resolvidas
• Alinhamento com lifecycle de contas (vitrine pending_setup como entrada padrão) (ver E16).
• Hardening do lifecycle de accounts.status aplicado (detalhes/evidências em docs/schema.md)..

16. E16 — Accounts

16.1 Status
• Concluído

16.2 Objetivo
• Definir o lifecycle de **contas** e o comportamento esperado no dashboard (Produto + UX).
• Manter **billing/trial/entitlements** fora de `accounts.status` (ver E9).
• Setup concluído (produto) é representado por **status** (ver E10.4/E10.4.6).

16.3 Status de conta (definição prática)

16.3.1 `pending_setup` (onboarding mínimo)
• Ao entrar no dashboard da conta, renderiza **“Primeiros passos”** (formulário inline).
• Objetivo: coletar dados mínimos e concluir setup.
• Ao salvar com sucesso, a conta **deixa de ser `pending_setup`** (ver transição 16.5).
• CTAs típicos: “Salvar e continuar” (onboarding) e alternativas de suporte/consultoria (quando aplicável).

16.3.2 `active` (pós-setup / operação normal)
• Setup concluído; uso normal do dashboard.
• **Permissões de features** (ex.: criar/publicar recursos) são controladas por **entitlements/trial/plano** (E9), não por `accounts.status`.

16.3.3 `inactive` (restrição operacional — reversível)
• Acesso restrito com explicação clara do motivo (ex.: billing), com CTA de reativação.
• Enforcement automático fica para caso de uso operacional (Admin/Jobs).

16.3.4 `suspended` (bloqueio admin)
• Acesso restrito com explicação clara do motivo (bloqueio administrativo).
• CTA: contatar suporte.
• Enforcement automático fica para caso de uso operacional (Admin/Jobs).

16.4 Regras de produto (alto nível)
• Bloqueio por conta é independente do vínculo do usuário: mesmo com membership “ativo”, pode haver restrição por status da conta.
• Trial comercial não é status de conta; é estado de plano/assinatura/entitlements (ver E9).
• `pending_setup` é exclusivo para **setup incompleto**; `active` é o estado pós-setup.

16.5 Transições oficiais (lifecycle)
• `pending_setup → active`: evento = **sucesso no “Salvar e continuar” de “Primeiros passos”** (E10.4.6).
• `active → inactive`: evento de billing/operacional (E9/E12) (regras detalhadas fora deste item).
• `inactive → active`: reativação (E9/E12).
• `* → suspended` e `suspended → active`: decisão/admin/operacional (E12).

16.6 UX por status (snapshot)
• `pending_setup`: tela da conta com **Primeiros passos** (onboarding mínimo).
• `active`: estado pós-setup (inclui vitrine/CTAs de conversão quando **sem plano/trial**, ver E10.5; gating de features via entitlements, ver E9).
• `inactive`: tela de conta inativa com CTA reativar/pagar.
• `suspended`: tela de conta suspensa com CTA suporte.
• Observação: detalhes de rotas/gate e regras técnicas ficam em `docs/base-tecnica.md` (ver também E4/E8).

16.7 QA e evidência (snapshot)
• Confirmar que contas novas “nascem” em `pending_setup`.
• Confirmar que, após sucesso no onboarding, a conta passa a renderizar estado `active` (sem “deny genérico”).
• Detalhes de contrato/DB e evidências de hardening ficam em `docs/schema.md`.

16.8 Casos relacionados / drifts (owners)
• E10.4/E10.4.6: onboarding mínimo e transição `pending_setup → active` (setup status-based).
• E10.5: “active persuasiva” sem plano/trial (UX pós-setup; gating por entitlements).
• E9: trial/entitlements (fonte de verdade de permissões).
• E12: enforcement operacional (jobs) e políticas de restrição/reativação/configurações.

17 E17 - Automations, Agents & Validation Infrastructure

17.1 Status
• Em evolução (setup mínimo concluído) (04/03/2026)

17.2 Objetivo
• Consolidar uma linha de evolução de automações/agentes (OpenAI, Supabase, Vercel, GitHub) para tarefas operacionais e diagnósticos.
• Garantir execução controlada (permissões mínimas, read-only quando aplicável), com governança e baixo risco.
• Padronizar rastreabilidade/observabilidade (logs estruturados, correlação) para acelerar investigação e execução de casos sem alterar o core do app.

17.3 Implementado (exec) — OpenAI Platform (02/03/2026)
• Projects criados: `LPF10-DEV` e `LPF10-PROD`.
• Sharing: “Enabled for selected projects” com apenas `LPF10-DEV` selecionado (DEV compartilha; Default e PROD não).
• Service Account criada no `LPF10-DEV` com key gerada.
• Segurança de keys: revogação imediata em caso de exposição; estado final reportado = 1 key ativa no `LPF10-DEV`.

17.4 Codex (sandbox) checks determinísticos
• Status: Concluído (exec) (03/03/2026)
• Objetivo: padronizar checks determinísticos no sandbox antes de abrir PR.
• Referência técnica: `docs/base-tecnica.md`.

17.5 Referência documental
• Automações operacionais de produto, componentes consumidores, MCPs e evoluções dessa camada passam a ser documentados em `docs/automacoes.md`.


17.6 Supabase STAGING (espelho operacional para validação de casos de uso) — descontinuado

• Objetivo: Criar ambiente Supabase separado para validação segura de alterações (schema, RLS, Auth e dados) antes de produção.
• Resumo: O ambiente STAGING foi descontinuado; o projeto `LP-Factory-10-staging` foi efetivamente deletado em 31/03/2026 após alerta crítico do Security Advisor associado a esse projeto já descontinuado.
• Situação atual: não existe STAGING ativo no Supabase; os previews permanecem no projeto principal.
• Status: Descontinuado.

18. E18 — Base transversal de templates, módulos, composições e artefatos

18.1 Status
• Base transversal mínima de `commercial_activation` concluída e validada em 16/06/2026.
• Primeiro recorte de banco/runtime e segundo recorte de contratos, renderer e registros-base aplicados.
• E10.7 desbloqueada como primeiro consumidor real; composição, conteúdo por taxon, integração, fallback e tracking permanecem sob responsabilidade da E10.7.

18.2 Objetivo
• Definir infraestrutura e contratos reutilizáveis para famílias de templates por canal, templates versionados, módulos de conteúdo, seções de página, variantes, composições e artefatos finais persistidos.
• Sustentar primeiro a E10.7 sem produzir diretamente a página comercial de um taxon.
• Permitir consumidores futuros somente como visão de evolução, sem antecipar sua implementação.

18.3 Decisão estrutural aprovada
• Separação conceitual: canal → família de renderer → template-base versionado → módulos/seções compatíveis → composição por contexto → artefato final.
• Regra inicial: 1 canal → 1 família de renderer → 1 versão-base inicial → versões ou variantes futuras quando necessárias.
• A regra não limita definitivamente cada canal a um único template.
• Cada canal terá módulos próprios e sua própria família de renderer, mesmo quando compartilhar contratos transversais.

18.4 Famílias e templates versionados
• `content_templates` foi mantida para templates e módulos/seções versionados.
• `content_template_taxons` foi mantida para elegibilidade, prioridade e seleção do template por taxon.
• Os valores de `template_family` permanecem `commercial_activation` e `landing_page`.
• O contrato detalhado dos objetos e permissões está em `docs/schema.md`.

18.5 Módulos, seções e variantes
• Catálogo inicial v1 da família `commercial_activation`:
• `hero.default`
• `benefits.cards`
• `services.list`
• `plans.cards`
• `differentials.cards`
• `how_it_works.steps`
• `faq.accordion`
• `final_cta.simple`
• As variantes descrevem comportamento estrutural ou funcional e não podem representar nichos.
• A ampliação do catálogo depende de necessidade comprovada por consumidores reais.

18.6 Contrato entre código e banco
• Código: contrato, validação, componente visual e comportamento responsivo.
• Banco: identificação, variante, composição, ordem e conteúdo concreto.
• Adicionar uma definição no banco não cria automaticamente um componente visual.
• Novos tipos ou variantes estruturais continuam exigindo implementação no repositório.

18.7 Composição reutilizável
• Composição: canal + template + taxon ou contexto → módulos + variantes + ordem + obrigatoriedade.
• Um taxon pode usar vários módulos e um módulo pode atender vários taxons.
• A composição não é o artefato final publicado.
• A composição comercial da E10.7 deverá definir seções, variantes, ordem, obrigatoriedade e regras específicas do contexto comercial.

18.8 Artefato final
• Separar explicitamente template, composição, conteúdo e artefato publicado.
• Escopo global por taxon: página comercial da E10.7.
• Escopo específico por conta: futura landing page de cliente.
• Escopo específico por campanha ou canal: evolução futura.
• A estrutura persistida deve preservar identidade e versões suficientes para rastrear pesquisa, template e composição usados.

18.9 Transversalidade futura
• Páginas → seções.
• E-mail → blocos de mensagem.
• WhatsApp → mensagens ou etapas.
• Instagram → hook, slides, legenda e CTA.
• TikTok → hook, cenas, prova e CTA.
• Esses consumidores representam visão futura e não fazem parte do primeiro recorte.

18.10 Primeiro recorte implementado — 15/06/2026
• Recorte limitado a `template_family = commercial_activation`.
• Composição versionada separada por template + taxon.
• Artefato publicado separado da composição, com rastreabilidade de template, composição, taxon e pesquisas.
• Seleção do template iniciada em `content_template_taxons`.
• Runtime server-side valida composição, artefato publicado e fontes de pesquisa antes de retornar o bundle.
• Sem vínculo elegível ou composição ativa, o runtime retorna `composition_not_found`, sem fallback implícito.
• Migration aplicada e verificada no Supabase real.
• Runtime validado com `npm ci`, `npm run check` e previews aprovados.

Banco — Criados
• `content_template_compositions`
• `content_template_composition_items`
• `content_artifacts`
• `content_artifact_research_sources`

Banco — Ajustados
• `content_templates`
• `content_template_taxons`
• `taxon_market_research`

Repositório — Criados
• `supabase/migrations/20260615190000_e18_commercial_activation_minimum.sql`
• `supabase/snippets/e18_commercial_activation_minimum_verify.sql`
• `lib/conversion-content/contracts.ts`
• `lib/conversion-content/validation.ts`
• `lib/conversion-content/adapters/commercialActivationAdapter.ts`
• `lib/conversion-content/index.ts`

18.11 Dependência e validação
• E18 — base transversal mínima → dependência estrutural da E10.7.
• E10.7 — primeiro consumidor real → valida e ajusta a base da E18.
• A abstração transversal deve evoluir somente com evidência obtida no piloto e em um segundo taxon.
• A E10.6 permanece fora dessa infraestrutura e continua como fallback genérico concluído.

18.12 Fase 1 — Contratos e renderer de `commercial_activation`
• Status: Concluída e mergeada no PR #392 em 16/06/2026.
• Implementados `content_json` v1, validação Zod server-side, registry fechado, resolver e `CommercialActivationRenderer`.
• Catálogo inicial com oito variantes transversais.
• Fixture sintética, casos executáveis de validação e testes manuais desktop/mobile aprovados.

Repositório — Criados
• `lib/conversion-content/commercial-activation/fixture.ts`
• `lib/conversion-content/commercial-activation/index.ts`
• `lib/conversion-content/commercial-activation/registry.ts`
• `lib/conversion-content/commercial-activation/renderer.tsx`
• `lib/conversion-content/commercial-activation/resolve.ts`
• `lib/conversion-content/commercial-activation/schemas.ts`
• `lib/conversion-content/commercial-activation/validation-cases.ts`

Repositório — Ajustados
• `lib/conversion-content/index.ts`
• `package.json`
• `package-lock.json`

18.13 Fase 2 — Registros-base de `commercial_activation`
• Status: Concluída e mergeada no PR #393 em 16/06/2026.
• Migration aplicada e confirmada no Supabase real.
• Registrados um template-base de página e oito módulos de seção, todos na versão 1, ativos e com `payload_json = {}`.
• Confirmados nove registros, unicidade funcional, zero vínculos com taxons e RLS ativa.
• Grants confirmados: `service_role` com `SELECT`; `anon` e `authenticated` sem `SELECT`.

Banco — Ajustados
• `content_templates`

Repositório — Criados
• `supabase/migrations/20260616142000_e18_commercial_activation_base_records.sql`
• `supabase/snippets/e18_commercial_activation_base_records_verify.sql`

18.14 Fora do segundo recorte
• implementação de e-mail, WhatsApp, Instagram ou TikTok
• editor visual
• criação dinâmica de componentes pelo banco
• testes A/B
• múltiplos templates ativos sem caso real
• geração multicanal
• arquitetura completa para todos os canais
• catálogo extenso sem uso comprovado
• vínculo entre template e taxon;
• composição específica por taxon;
• pesquisas e itens estruturados;
• conteúdo e artefato comercial por taxon;
• resolução hierárquica;
• integração com `/a/[account]`;
• fallback e tracking da E10.7.

18.15 Recorte aprovado para consumo pela E10.7
• A E10.7 reutilizará a base transversal já concluída: template `commercial_activation`, módulos existentes, composição ativa, renderer existente, `content_artifacts` e `content_artifact_research_sources`.
• Manter `research_version = 1` e `business_buyer` como `audience_scope` do artefato publicado.
• Registrar em `content_artifact_research_sources` somente fontes compatíveis com `business_buyer`; pesquisas `end_customer` entram apenas no `provenance_json`.
• Não alterar a FK composta de `content_artifact_research_sources` nesta etapa, não criar nova tabela e não resolver versões independentes por bloco agora.
• A E10.7 pode exigir migration técnica mínima limitada a viabilizar escrita administrativa controlada. Possíveis alvos: grants, policies, adapter/RPC e função transacional de publicação.
• A publicação deve arquivar o `published` anterior e publicar o novo `draft` na mesma operação segura.
• A escrita administrativa precisa estar viabilizada antes da persistência do draft.

19. E19 — LP Builder

19.1 Status
• Em execução faseada — Fase 3 concluída em 30/06/2026.
• Criação produtiva mínima de LP por conta implementada.
• Persistência mínima em `public.account_landing_pages` criada.
• Boundary próprio do LP Builder criado em `lib/lp-builder/`.
• Gate E9 aplicado antes da persistência.
• Editor visual, publicação, render público, domínio customizado, analytics, A/B, IA runtime e automações permanecem fora do recorte.

19.2 Objetivo atual
• Consolidar a seção do Core responsável pela criação, edição e organização de landing pages.
• No recorte atual, limitar E19 à criação mínima de LP por conta com status inicial `draft`.

19.3 Decisões consolidadas

19.3.1 Boundary do LP Builder
• E19 pertence à camada Core.
• E19 é seção própria, separada de Account Dashboard, Admin Dashboard e Partner Dashboard.
• Boundary criado: `lib/lp-builder/`.
• Action server-side canônica criada: `app/lp-builder/actions.ts`.

19.3.2 Criação produtiva mínima
• LP nasce com status inicial `draft`.
• Persistência mínima ocorre em `public.account_landing_pages`.
• Slug é único por conta.
• Nome não pode ser vazio.
• Slug deve seguir formato seguro.

19.3.3 Gate comercial e operacional
• Criação de LP exige conta `active`.
• Criação de LP exige membership `active` com role `owner` ou `admin`.
• Criação de LP exige entitlement comercial válido via E9.
• Gate é aplicado server-side antes do insert.

19.3.4 Updates avaliados
• `github#499`, `supa#20260630210213`, `e9#gate`, `automation#E19`.

19.4 Estruturas e artefatos

Banco — Criados
• `public.account_landing_pages`
• `account_landing_pages_select_member_or_platform`
• `account_landing_pages_set_updated_at`

Repositório — Criados
• `app/lp-builder/actions.ts`
• `lib/lp-builder/contracts.ts`
• `lib/lp-builder/adapters/landingPagesAdapter.ts`
• `lib/lp-builder/index.ts`
• `supabase/migrations/20260630210213_e19_account_landing_pages.sql`
• `supabase/snippets/e19_account_landing_pages_verify.sql`


19.5 Fora do escopo da Fase 3
• Editor visual.
• Publicação.
• Render público.
• Domínio customizado.
• Analytics.
• Teste A/B.
• IA runtime.
• Automações.
• Agentes.
• Jobs.
• Rotinas recorrentes.

19.6 Dependências / referências
• E9 — Billing, trial e entitlements.
• E10 — Account Dashboard.
• E12 — Admin Dashboard.
• E13 — Partner Dashboard.
• E18 — Base transversal de templates, módulos, composições e artefatos.

19.7 Fronteiras futuras preservadas
• E19 pode futuramente consumir página comercial publicada por taxon.
• E10.7 não implementa LP Builder.
• E10.7 não implementa regra de liberação para criação de LPs.
• E10.7 não implementa continuidade de contas.
• E10.7 não implementa bloqueio de novas ativações.
• Esta referência não cria obrigação de nova implementação agora.

99. Changelog
v1.5.87 — 02/07/2026 — E9 Fase 7.2 concluída com webhook Stripe mínimo em produção, `invoice.paid` ativando entitlement local, idempotência em `stripe_webhook_events`, retry operacional e persistência validada em `account_commercial_entitlements`.

v1.5.86 — 30/06/2026 — E19 Fase 3 concluída com criação produtiva mínima de LP por conta, persistência em public.account_landing_pages, boundary lib/lp-builder/ e gate E9 antes do insert.

v1.5.85 — 26/06/2026 — E10.7 Fase 6 concluída; próxima fase: Fase 7 — edição manual de copy e gestão simples de versões.

v1.5.84 — 25/06/2026 — E10.7 Fase 5 concluída com taxons elegíveis por pesquisa estruturada completa, composição técnica genérica sob demanda, geração/publicação `commercial_activation` por `taxonSlug` e próxima Fase 6 planejada para Admin comercial enxuto.

v1.5.83 — 23/06/2026 — E10.7 Fase 4 concluída com consumo no Account Dashboard: `/a/[account]` renderiza bundle `commercial_activation` publicado e `ready`, mantém fallback `generic-v1`, preserva `NicheResolutionCard` e tracking comercial, rejeita draft/archived/artifact inválido e mantém IA fora do runtime público.

v1.5.82 — 23/06/2026 — E10.7 Fase 3 concluída com operação administrativa mínima em `/admin/templates`: geração/regeneração de draft, preview administrativo, publicação via RPC existente, validação server-side do draft publicável, resolução compartilhada por `content_template_taxons` e estado real validado com `v3` published, `v2` draft histórico e `v1` archived.

v1.5.81 — 22/06/2026 — E12.3.2 concluído e validado: `/admin/documentacao` passa a leitor read-only protegido de documentos whitelist de `docs/`, com leitura server-side por filesystem, tracing explícito dos arquivos permitidos, UI responsiva com filtro/dropdown e sem Supabase, migrations, GitHub API em runtime, edição ou mutações.

v1.5.80 — 22/06/2026 — E10.7 Fase 2 concluída e validada: geração administrativa server-side de draft comercial por IA, draft real criado como `status = draft` para o taxon piloto, validação em duas camadas, fontes `business_buyer` registradas, `end_customer` apenas em `provenance_json`, falha segura por arquivamento/invalidação de draft parcial e sem publicação, `published`, Account Dashboard ou `/a/[account]`.

v1.5.79 — 22/06/2026 — E12 registra o refinamento 12.3.2 em implementação: `/admin/documentacao` como leitor read-only protegido para whitelist de documentos de `docs/`, sem Supabase, migrations, GitHub API em runtime, edição ou mutações.
v1.5.78 — 22/06/2026 — E12 registra o refinamento 12.3.1 concluído e validado: `/admin` passa a entrada pública do Admin Dashboard, subrotas internas seguem protegidas por `app/admin/(protected)/layout.tsx`.
v1.5.77 — 21/06/2026 — E10.7 Fase 2: critérios de IA, validação e logs.
• Incorporados pareceres de Updates e Automations para a Fase 2.
• Registrado uso de fluxo IA server-side/Admin com structured output, sem Agents SDK/job/fila/agente.
• Registrada validação em duas camadas, regra segura para `cta.href`, snippets read-only quando aplicável e logs seguros.
v1.5.76 — 21/06/2026 — E10.7 Fase 1 concluída e validada: escrita administrativa controlada, publicação transacional e verificação read-only aplicadas no Supabase real; próxima execução passa a ser Fase 2.
v1.5.75 — 19/06/2026 — Roadmap registra o plano aprovado da E10.7 distribuído em E10.5.5, E18, E12, E10.7 e E19: pesquisas `active version 1`, quatro blocos fixos por `audience_scope`, `business_buyer` como artefato publicado, `end_customer` apenas em `provenance_json`, operação administrativa mínima em `/admin/templates`, patch estrutural mínimo para escrita administrativa controlada e referência futura ao E19 sem obrigação de implementação agora.
v1.5.74 — 16/06/2026 — E18 conclui o segundo recorte da base transversal de `commercial_activation`: contrato `content_json` v1, validação Zod, registry, renderer, catálogo inicial de oito seções e nove registros-base aplicados e confirmados no Supabase; a E10.7 fica desbloqueada como primeiro consumidor real.

v1.5.73 — 15/06/2026 — E18 consolida o primeiro recorte autônomo implementado e validado: banco de composições e artefatos aplicado no Supabase, runtime server-side mergeado e seleção determinística de template por taxon; dados do primeiro consumidor e integração com a E10.7 permanecem pendentes.
v1.5.72 — 15/06/2026 — E10.6 concluída com página comercial genérica responsiva em `/a/[account]`, planos e CTAs ilustrativos, tracking server-side validado, correção de `public.audit_context_event` e registro dos artefatos finais; personalização por nicho permanece na E10.7.
v1.5.71 — 12/06/2026 — Separadas a E10.6, agora dedicada à primeira página comercial genérica sem banco novo, pesquisa ou IA, e a futura E10.7, responsável por páginas comerciais personalizadas por nicho após a aprovação da E10.6; referências ao consumo direto de pesquisas pela E10.6 foram corrigidas.
v1.5.70 — 12/06/2026 — Retirada a implementação antecipada da E18/E18.5 e a primeira E10.6; removidos templates universais, artefatos e persistência não aplicada, restaurado o Account Dashboard simples e reiniciada a página comercial como caso específico antes de qualquer abstração compartilhada.
v1.5.69 — 11/06/2026 — E18.5 adota o primeiro fluxo incremental pós-baseline: migration canônica estrita de `generated_content_artifacts`, verificação read-only ampliada, validação isolada com smoke, rollback e reconstrução, mantendo aplicação remota e runtime consumidor bloqueados.
v1.5.68 — 11/06/2026 — E10.6 e E18.5 registram o backlog da página comercial `version: 2`, com recursos, diferenciais, provas, FAQ, CTA final ampliado e evolução coordenada de contrato, fallback, validação, geração e renderização, preservando a `version: 1`.
v1.5.67 — 11/06/2026 — E10.6 corrige a acentuação da copy fallback e remove o espaço reservado acima da página comercial quando não há card de resolução de nicho.
v1.5.66 — 11/06/2026 — E10.6 recebe a primeira página comercial funcional e responsiva no Account Dashboard, consumindo o resolver existente e o fallback determinístico sem consultar a persistência ainda não aplicada.
v1.5.65 — 11/06/2026 — E18.5 separa escopo estável de fingerprint das entradas, preserva o histórico entre mudanças de pesquisa/template/schema e generaliza apenas a persistência ainda não aplicada para `generated_content_artifacts`.
v1.5.64 — 10/06/2026 — E18.5 prepara runtime e persistência versionada dos artefatos comerciais, com adapter server-side, estados draft/active/archived, ativação transacional, SQL operacional, verificação e rollback, mantendo aplicação no Supabase e migration histórica pendentes.
v1.5.63 — 10/06/2026 — E10.6 e E18.5 registram observabilidade futura, ausência de nova infraestrutura Vercel na primeira entrega e condições de adoção para updates Supabase, Vercel, cache, fila e tracking, sem implementar essas capacidades nesta etapa.
v1.5.62 — 10/06/2026 — E18.5 iniciada com contrato técnico dos campos finais da página comercial, template versionado, proveniência das pesquisas, identidade inicial do artefato, validação estrutural pura e fallback determinístico, sem provider, persistência ou UI.
v1.5.61 — 10/06/2026 — Roadmap registra a página comercial da E10.6 como primeiro laboratório controlado da geração automatizada por taxon, com visão planejada na E18.5, futura operação administrativa na E12.7, consumo da versão ativa e válida ou fallback sem IA em renderização e pendência da etapa técnica responsável pelos artefatos.
v1.5.60 — 09/06/2026 — E10.5.6.7 concluído com template comercial universal, contrato e exports da family `conversion-content`, resolução pura, adapter server-only, fallback taxon/pai/ancestral/genérico e grants read-only validados para pesquisa `business_buyer`.
v1.5.59 — 09/06/2026 — E10.5.6.7 e E10.6 alinhados para explicitar que a página comercial é interna ao Account Dashboard e possui conta existente, mas não depende de taxon nem de dados comerciais ricos; o taxon é opcional para personalização e o fallback genérico usa o mesmo template universal.
v1.5.58 — 28/05/2026 — Roadmap atualizado em E10.5.5 para refletir o novo modelo de pesquisa bruta por taxon, mantendo `taxon_market_research` como registro-pai e `taxon_market_research_items` como itens estruturados da pesquisa, sem criação de bloco agregado, nova tabela ou nova camada.
v1.5.57 (20/05/2026)
• E10.5.6 reorganizado em subitens estáveis (10.5.6.1–10.5.6.7), mantendo estado final enxuto, separação de pendências reais e artefatos consolidados sem misturar escopo do E10.4.
v1.5.56 (20/05/2026)
• E10.5 atualizado para refletir somente o estado real do repositório: bloco 10.5 substituído integralmente, removendo promessas de UX pós-setup ainda não implementadas no runtime e consolidando os subcasos 10.5.1/10.5.2/10.5.3/10.5.3.1/10.5.4/10.5.6 com artefatos e pendências alinhados.
v1.5.55 (20/05/2026) — E10.4 enxugado e consolidado no estado final: bloco substituído para remover histórico intermediário e duplicações internas, absorvendo 10.4.2/10.4.3 e mantendo 10.5+ intacto.

v1.5.54 — 19/05/2026 — E12 atualizado para refletir o estado atual do Admin Dashboard: shell operacional protegido, navegação própria, páginas read-only reais para contas, resoluções de nicho e taxonomia, artefatos criados/ajustados e limites explícitos sem mutações, SQL, migrations ou RLS.

v1.5.53 — 14/05/2026 — Roadmap atualizado com o estado final da implementação 20.8: IA estruturada server-side como complemento ao matching determinístico, persistência apenas em `account_niche_resolutions`, preservação de `account_taxonomy`, artefatos, validações, PR mergeado e pendências futuras.

v1.5.52 — 11/05/2026 — Roadmap atualizado com o estado final da implementação 20.7: vínculo oficial em `account_taxonomy` apenas para alta confiança, preservação de `account_niche_resolutions` como registro operacional, regra de conflito de primário, artefatos, QA runtime e pendências futuras.

v1.5.51 — 11/05/2026 — Roadmap atualizado com o estado final da implementação 20.6: persistência da resolução operacional em `account_niche_resolutions`, decisão sobre `account_taxonomy`, artefatos, QA e pendências futuras.

v1.5.50 — 10/05/2026 — Roadmap atualizado com o estado final da integração de matching determinístico de taxonomia no pós-save do `pending_setup`, incluindo artefato ajustado, regra não bloqueante, observability segura e pendências explícitas.

v1.5.49 (10/05/2026)
• Adicionado 10.5.4 como concluído (exec): helper puro de confiança determinística para taxon match, com contrato tipado, `aiEscalationMode` e artefatos em `lib/onboarding/niche-resolution/`, mantendo escopo repo-only e pendência explícita de branch sem merge e sem integração ao `pending_setup`.

v1.5.49 — 09/05/2026 — E10.5.6: registrado adapter server-side `matchBusinessTaxonsDeterministic` e contrato TypeScript para consumo futuro da RPC de matching determinístico de taxonomia.

v1.5.48 — 09/05/2026 — E10.5.6: registrado matching determinístico inicial de taxonomia, com `pg_trgm`, normalização textual, FTS, trigram, RPC read-only, migration/rollback e validação funcional no Supabase.

v1.5.47 (08/05/2026) — E10.4: registrado `niche` obrigatório no `pending_setup`, com artefatos ajustados, validação client/server e QA funcional aprovado.

v1.5.46 (07/05/2026) — E10.4: registra refinamento técnico do PR #226, movendo a mutação `pending_setup → active` para `accountAdapter` e preservando a action como orquestradora do fluxo.

v1.5.44 (27/04/2026) — Simplificada a seção 10.5.2 do roadmap, fundindo 10.5.2 e 10.5.2.1 no estado final único da base do BD do E10.5.

v1.5.43 (26/04/2026) — 10.5.2.1: ajuste corretivo do Grupo C
• Registrado o estado final do ajuste de `audience_scope`: público da pesquisa no registro-pai, itens herdando público por `research_id`, unicidade por `taxon_id + research_block + audience_scope + version` e artefatos de migration/rollback.

v1.5.42 (23/04/2026)
• Adicionado 10.5.2.1 com o ajuste estrutural de taxon_market_research e taxon_market_research_items no BD.

v1.5.41 (18/04/2026)
• E12 atualizado para refletir a execução do primeiro recorte real do Admin: superfície protegida de `/admin` entregue como base de acesso/UI do contexto administrativo.
• 12.5 deixou de ser “próximo subcaso” genérico e passou a registrar o recorte executado de acesso e superfície inicial do Admin.
• Registrados os ARTEFATOS_REPO do caso: `app/admin/layout.tsx`, `app/admin/page.tsx`, `components/admin/AdminHeader.tsx`, `components/admin/AdminUserMenu.tsx`, além dos ajustes em `app/auth/login/page.tsx` e `components/login-form.tsx`.
• Registradas as pendências explícitas do caso sobre possível `/admin` público com área protegida separada e sobre destino próprio do logout administrativo.
v1.5.40 (17/04/2026)
• E12 enxugado para formato de reinício do Admin Dashboard com apenas 12.1–12.5 (status, objetivo, escopo atual, base existente e próximo subcaso), removendo subitens amplos que inflavam o caso.
• E12 mantido aderente ao estado real do repo: base mínima em `lib/admin/index.ts`, `lib/admin/adapters/adminAdapter.ts` e `lib/access/guards.ts`, sem backlog amplo no corpo principal.
v1.5.39 (17/04/2026)
• E12 reescrito para refletir apenas o estado real implementado no repositório: infraestrutura mínima de privilégio admin (`lib/admin/index.ts`, `lib/admin/adapters/adminAdapter.ts` e `lib/access/guards.ts`), sem tratar dashboard amplo como já definido/implementado.
• E12 limpo de escopo presente amplo (operação consultiva, painel de contas/prospects/status, relatórios/auditoria consultiva e jobs/tracking), mantendo essas frentes apenas como evolução futura.
• 12.9 desassociado do E12 atual e realinhado ao estado concluído já registrado em E5.6 (Infra Auth — e-mail transacional).
v1.5.38 (15/04/2026)
• 10.5.3 atualizado para Concluído (exec): kit operacional do Grupo A versionado em `docs/` e `supabase/snippets/`, com investigação consolidada, regra de `parent_slug` e carga prática reportada para `implante-dentario`.
• Adicionado 10.5.3.1 (Briefing): curadoria operacional de aliases enxutos vs microvariações textuais, para separar cadastro manual do Grupo A e matching leve futuro do E10.5.6.
v1.5.37 (13/04/2026)
• Documentação alinhada ao estado pós-remoção do legado de tokens: E7/E7.5/E12.5 atualizados para registrar descontinuação do fluxo por token e planejamento do novo Admin Dashboard sem superfície legada ativa.
• E1/E3 e registros de E6 ajustados para remover referências ativas ao fluxo legado descontinuado e às superfícies administrativas removidas.
v1.5.36 (09/04/2026)
• 10.5 ajustado para “Em evolução”, com dependência explícita de 10.5.2.
• 10.5.2 adicionado como concluído (exec): base estrutural admin/interna de taxonomia, templates e guides, com migration `0006__e10_5_2_taxonomy_content_base.sql`.
• 10.5.3 adicionado como planejado para popular a base inicial de taxons, aliases, templates e vínculos.
v1.5.35 (01/04/2026)
• Adicionado **E19 — LP Builder** como nova seção do Core, no mesmo nível estrutural de Account Dashboard, Admin Dashboard e Partner Dashboard.
v1.5.34 (31/03/2026)
• Atualização documental dos artefatos e paths atuais dos casos afetados.
v1.5.33 (31/03/2026)
• Atualização documental: item 17.6 retificado para registrar que o projeto `LP-Factory-10-staging` foi deletado em 31/03/2026 após alerta crítico do Security Advisor e que não existe staging ativo no Supabase.
• Execução da fase 1 estrutural do Core registrada: separação cliente/admin via guards SSR de seção, sem fase 2, sem Partner e sem nova camada no root.
v1.5.32 (20/03/2026)
• E17 ajustado: removidos do roadmap os blocos operacionais de GitHub/openai-smoke e do pipeline `supabase-inspect`, preservando o caso de uso enxuto de checks determinísticos do Codex (com referência para `docs/base-tecnica.md`) e adicionando referência documental para que automações operacionais de produto, componentes consumidores, MCPs e evoluções dessa camada passem a ser documentados em `docs/automacoes.md`.
• Renumeração local do E17 aplicada após a limpeza: o caso de sandbox passou a `17.4`, a referência documental passou a `17.5` e o item de Supabase STAGING descontinuado passou a `17.6`.
v1.5.31 (10/03/2026)
• 6.6 concluído (exec): adicionados estados reutilizáveis (FeedbackMessage/EmptyState/LoadingState) e Textarea, com aplicação mínima em Auth, `pending_setup` e loading da conta; `docs/design-system.md` consolidado (E6.4–E6.6) atualizado.
v1.5.30 (09/03/2026)
• 6.5 concluído (exec): UI Component Library base (Button/Input/Card ajustados; Select e FormField criados) aplicada em Auth + `pending_setup`, com `docs/design-system.md` atualizado (repo-only; sem Supabase/SQL/migrations).
v1.5.29 (09/03/2026)
• 6.4 concluído (exec): identidade visual mínima aplicada (repo-only) + `docs/design-system.md`; wordmark temporário até versionar asset oficial de logo; pendências e novos casos (6.5–6.7) registrados.
v1.5.28 (06/03/2026)
• E17 atualizado (exec): `supabase-inspect` ganhou modo batch (`---`) com execução determinística e relatório completo por query no Job Summary; contrato atualizado no README do pipeline e pendência opcional de templates registrada.
v1.5.27 (05/03/2026)
• E18 adicionado (planejado): referência ao **Vercel AI Gateway** como padrão de integração de IA na fase IA-ready (ver `docs/vercel-up.md`, Item 1).
v1.5.26 (04/03/2026)
• E17 atualizado (exec): pipeline `supabase-inspect` v1 (read-only) implementado (workflow + pipeline em `pipelines/`), com secret `SUPABASE_DB_URL_READONLY` e referência ao contrato detalhado no README do pipeline e ao contrato de DB em docs/schema.md.
v1.5.25 (04/03/2026)
• E17 atualizado (exec): checks determinísticos do Codex no sandbox (AGENTS.md + lint via ESLint CLI + typecheck), com build validado fora do sandbox (CI/Vercel) e pendência futura “harden lint” registrada.
v1.5.24 (02/03/2026)
• E17 atualizado: setup mínimo concluído (OpenAI Projects DEV/PROD com sharing isolado no DEV e hardening de keys; GitHub secret `OPENAI_API_KEY` + workflow `.github/workflows/openai-smoke.yml` verde), com pendências registradas para limits por projeto, piloto `supabase_inspector` read-only, role Supabase read-only e decisão de endpoint Vercel.
v1.5.23 (01/03/2026)
• E5.6 concluído (exec): e-mail transacional do Supabase Auth estabilizado via Resend SMTP com sender `no-reply@lpfactory.com.br` (domínio raiz), com decisão registrada e condição de migração futura para subdomínio dedicado quando houver escala.
v1.5.22 (24/02/2026)
• E5.4 concluído (exec): fluxo signup → e-mail → /auth/confirm → redirect /a/home (happy path), com emailRedirectTo incluindo next=/a/home e rid (não-PII), /auth/sign-up-success (UX mínima) e logs estruturados no client (supa#5) com sinal mínimo no runtime Vercel (Vercel).
v1.5.21 (21/02/2026)
• E10.4.7 concluído (exec): refinamentos de UX no “Primeiros passos” (sem reset de campos em erro; nome com placeholder + CTA gated; Enter com foco no primeiro inválido; progressive disclosure no mobile; site_url aceita domínio sem esquema e normaliza para https://), com ARTEFATOS_REPO (criados/ajustados) registrados.
• E6 atualizado (exec): tipografia Inter aplicada globalmente e tokens Tailwind LP Factory adicionados de forma aditiva (preservando shadcn), incluindo expansão do content para js/jsx/mdx.
v1.5.19 (13/02/2026)
• E10.4.6 concluído (exec): “Primeiros passos” persiste `account_profiles`, atualiza `accounts.name` e promove `pending_setup → active`; setup concluído passa a ser status-based (`accounts.status=active`) e `setup_completed_at/account_setup_completed_at` ficam deprecated sem uso no gating/fluxo.
• E10.5 ajustado para “active persuasiva” (pós-setup sem plano/trial), removendo dependência do marcador no fluxo.
• Access Context endurecido (v_access_context_v2) e ajustes de Supabase Auth fora do repo (Redirect URLs Preview + templates de signup/reset usando RedirectTo).
v1.5.18 (07/02/2026)
• E10.4.5 concluído (definição): decisão de persistência do onboarding/perfil em account_profiles (1:1), mantendo accounts.name no core, com contrato mínimo v1 (niche, preferred_channel, whatsapp, site_url).
v1.5.17 (06/02/2026)
• E10.4.4 concluído (definição): contrato v1 de campos/validações do formulário “Primeiros passos” (incl. regra condicional do WhatsApp e microcopy por intenção)
v1.5.16 (06/02/2026)
• E10.4.3 concluído: política do marcador de setup (once set, never unset) + permitido/proibido (snapshot).
v1.5.15 (04/02/2026)
• E9.8.3 marcado como Concluído (remoção do drift trial do runtime + alinhamento de docs; sem migrations; smoke test em preview e produção).
v1.5.14 (03/02/2026)
• Adicionado E9.8.5 para decidir a persistência do sinal comercial (commercial.expires_at) e o destino de accounts.trial_ends_at (manter como legado até decisão).
v1.5.13 (02/02/2026)
• E9.8.2 concluído (definição): commercial.inactive_reason com trial_expired e churn (opcional payment_failed), sem alterar accounts.status.
• Criado E9.8.4 (pendente): decisão sobre persistência/consulta do motivo para CRM/relatórios
v1.5.12 (01/02/2026)
• Reestruturado o fluxo pending_setup por subestado via account_setup_completed_at, separando 10.4 (setup incompleto: IS NULL) e 10.5 (pós-setup sem plano/trial: IS NOT NULL).
• Atualizado 10.4 para focar em UX/CTAs do subestado “setup incompleto” e registrar a transição para 10.5 ao setar setup_completed_at (sem mudar accounts.status).
• Registrados 10.4.1 e 10.4.2 como Concluídos (infra do marcador + regra v0 executável de setup concluído), com dependências e pendência explícita de dados mínimos v1.
• Mantidos como Briefing: 10.4.3 (política do marcador), 10.4.4 (dados mínimos v1: nicho/WhatsApp/outros) e criado 10.5.1 (matriz “preparação vs produtivo” + enforcement servidor).
• Ajustadas dependências de 10.4 e 10.5 para incluir E9.3.1 apenas como referência de CTA/roteamento (sem implementar entitlements aqui).
v1.5.11 (31/01/2026)
• Atualizado 9.3.1 com definição do trial como entitlement (início pós-setup; expiração `active → inactive`) e contrato mínimo do sinal comercial consumido por SSR/gate/UX.
• Adicionado 9.8.2 (Briefing) para motivos de `inactive` (trial_expired vs churn) para segmentação de marketing.
• Adicionado 9.8.3 (Briefing) para execução: remoção do drift `trial` no runtime + alinhamento de docs ao estado final.
v1.5.10 (31/01/2026)
• Adicionado E10.4.2 (setup concluído v0 — regra executável) com evento “Salvar/Confirmar” e chamada idempotente do marcador.
• Adicionado E10.4.3 (Briefing) para política do marcador setup_completed_at (MVP).
• Adicionado E10.4.4 (Briefing) para matriz “preparação vs produtivo” + enforcement no servidor.
• Adicionado E10.4.5 (Briefing) para dados mínimos v1 (nicho/WhatsApp/outros) com contrato de armazenamento/validações.
v1.5.9 (30/01/2026)
• Adicionado E10.4.1 (infra do marcador setup_completed_at) como pré-requisito para diferenciar subestados de pending_setup.
• Ajustado 9.3.1 para manter foco em entitlements; remoção do hardcode/allowlist de trial no Access Context foi concluída em E10.4.1.
• Adicionado placeholder do E10.4 (Briefing) com dependências (E10.4.1, E9.3.1).
v1.5.8 (27/01/2026)
• Adicionado E16 (Accounts) para consolidar lifecycle de accounts.status (definições, transições e UX/CTAs), com referências para docs/base-tecnica.md e docs/schema.md (anti-drift).
• Ajustado E4.2 para remover redundâncias e focar no fluxo/UX do gateway e roteamentos, adicionando subitem de referências numerado.
• Ajustado E8 para focar em Access Context como decisão única e remover sobreposição com E4/E15/E16, com referências numeradas.
• Ajustado E15 (15.2–15.4) para reduzir redundâncias, apontar dependências para E16 e reforçar referências para docs/base-tecnica.md e docs/schema.md (anti-drift).
v1.5.7 (27/01/2026) — F1.1: CTA Criar conta no /a/home direciona para signup
• E4: registrado que o CTA Criar conta no /a/home (sem sessão) navega para /auth/sign-up (remoção de placeholder/modal).
v1.5.6 (27/01/2026) — F2: Auto 1ª conta (pending_setup) e atualização do fluxo pós-confirmação
• E4/E5: usuário autenticado sem membership passa a auto-criar 1ª conta pending_setup e cair em /a/[account] (modo vitrine).
• E8/E15: registrada a regra “sem membership cria; com qualquer membership não cria” e alinhado o tratamento de usuário sem membership.
• E5: registrada pendência de regressão em /auth/forgot-password (produção).
v1.5.3 (21/01/2026) — Gate SSR: UX de bloqueio por status (membership/conta)
• E4: Gate SSR roteia bloqueios de membership para rotas dedicadas e diferencia fallback de conta bloqueada por status (inactive/suspended) com páginas específicas.
• E15: Detalhada a UX/CTAs e rotas por status de membership, incluindo tratamento de usuário autenticado sem membership (clear_last).

v1.5.45 (29/04/2026) — E10.4: registra extração route-local do formulário `PendingSetupFirstSteps` e QA do fluxo `pending_setup → active`.
