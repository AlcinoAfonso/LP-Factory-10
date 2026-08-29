0. Introdução

0.1 Cabeçalho
• Data: 29/08/2026
• Versão: v1.5.192

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

- Objetivo: Separar condição comercial da conta do lifecycle operacional da conta; definir elegibilidade comercial para criação de LPs por entitlement local efetivo; manter provedores de pagamento como mecanismos de confirmação/persistência, não como prova direta de liberação no LP Builder.
- Status: Em execução faseada — base universal, Stripe mínimo, webhook mínimo, gate produtivo mínimo e liberação manual administrativa mínima concluídos; trial, Mercado Pago, Asaas e Billing Engine completo permanecem previstos/não implementados.

9.1 Base universal de entitlement comercial

9.1.1 Objetivo e status
• Objetivo: definir a base universal de entitlement comercial.
• Status: Fases 1, 4 e 5 concluídas.

9.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_commercial_entitlements`
    - `public.v_account_commercial_entitlement_effective`
  - Ajustados:
- Repositório:
  - Criados:
    - `supabase/migrations/20260628184945_e9_commercial_entitlements.sql`
    - `supabase/snippets/e9_phase_3_entitlements_verify.sql`
    - `lib/commercial-entitlements/contracts.ts`
    - `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`
    - `lib/commercial-entitlements/index.ts`
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:

9.1.3 Separação entre lifecycle operacional e condição comercial
• Status: Concluído (definição)
• Trial, plano, assinatura e liberação manual controlam permissões e limites de uso quando materializados como entitlement comercial válido.
• Trial, plano, assinatura e liberação manual não definem `accounts.status`.
• `accounts.status` representa lifecycle operacional da conta/setup.
• `account_users.status` representa vínculo operacional do usuário com a conta.
• Billing, trial, plano, assinatura e entitlement comercial representam condição comercial separada.
• Entitlement comercial é domínio próprio e não extensão de `lib/access`, `public.plans` ou `lib/access/plan.ts`.

9.1.4 Origem comercial e confirmação
• Status: Fase 1 concluída em 28/06/2026.
• Origem inicial válida: plano pago confirmado.
• Origens futuras possíveis: trial.
• Origem operacional implementada para liberação administrativa mínima: `liberacao_manual`.
• Provedor de checkout e webhook são mecanismos de confirmação/persistência, não origem comercial.
• Entitlement comercial válido nasce de origem comercial válida e persistência local idempotente quando aplicável.

9.1.5 Planos comerciais canônicos
• Status: Fase 1 concluída em 28/06/2026.
• Cards comerciais canônicos: Starter, Lite, Pro e Ultra.
• Chaves esperadas: `starter`, `lite`, `pro` e `ultra`.
• O legado `PlanId = "free" | "light" | "pro" | "ultra"` deve ser revisado ou aposentado antes do checkout.

9.1.6 Modelo mínimo de entitlement comercial
• Status: Fase 4 concluída em 28/06/2026.
• Fonte de verdade: `public.account_commercial_entitlements`.
• Contrato mínimo criado: `CommercialEntitlementSignal`.
• Account Dashboard carrega o sinal server-side, mas ainda não aplica bloqueio produtivo.
• Checkout, webhook, provedor, admin, trial operacional, liberação manual operacional, LP Builder e Billing Engine completo permanecem fora do recorte da Fase 4.

9.1.7 View efetiva
• Leitura efetiva: `public.v_account_commercial_entitlement_effective`.
• View efetiva validada com elegibilidade comercial positiva no recorte de liberação manual administrativa mínima (9.2).

9.1.8 Signal server-side
• Boundary server-side criado: `lib/commercial-entitlements/`.
• Adapter criado: `getCommercialEntitlementSignal({ accountId })`.
• Signal validado por contrato view → adapter.

9.1.9 Gate do LP Builder
• Status: Fases 1 e 5 concluídas.
• Regra mínima: usuário autenticado + conta `active` + membership `active` + papel `owner`/`admin` + entitlement comercial válido.
• Para gate de criação de LP, conta operacionalmente permitida significa `accounts.status = active`.
• Membership ativo significa `account_users.status = active`.
• Conta `active` não fica elegível para criação produtiva apenas por estar ativa.
• Gate produtivo confirmado no ponto real entregue pela E19: `app/lp-builder/actions.ts`, `lib/lp-builder/` e `public.account_landing_pages`.
• O LP Builder consome `getCommercialEntitlementSignal({ accountId })` antes da persistência.
• Sem entitlement comercial válido, o fluxo retorna `commercial_entitlement_required` antes do insert.
• O LP Builder não consulta Stripe diretamente, não usa redirect de checkout como liberação e não usa apenas `accounts.status` como prova comercial.
• A validação operacional direta da action é N/A neste recorte, pois não há superfície aprovada para disparo sem criar rota ou UI artificial.

9.1.10 Fail-closed, limites e ressalvas
• Fallback fail-closed: `accountId` vazio, erro, exceção ou ausência de linha retornam não elegível.
• Sem entitlement comercial válido, a criação produtiva mínima de LP permanece bloqueada.

9.2 Liberação manual administrativa mínima

9.2.1 Objetivo e status
• Objetivo: permitir concessão, atualização e cancelamento manual mínimo de entitlement por `platform_admin`.
• Status: concluída em 04/07/2026.

9.2.2 Registros do recorte
- Banco:
  - Criados:
  - Ajustados:
- Repositório:
  - Criados:
    - `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`
    - `app/admin/(protected)/contas/[accountId]/actions.ts`
  - Ajustados:
    - `app/admin/(protected)/contas/[accountId]/page.tsx`
  - Excluídos:
- Updates:
  - Aplicados:
    - `supa#40`
    - `prod#19`

9.2.3 Contrato operacional mínimo
• Liberação manual administrativa mínima é origem comercial independente de provedor de pagamento e de trial operacional.
• Ator autorizado: `platform_admin`, incluindo `super_admin` pelo guard existente `requirePlatformAdmin`.
• Superfície administrativa: `app/admin/(protected)/contas/[accountId]/page.tsx`.
• Path canônico de mutação: `app/admin/(protected)/contas/[accountId]/actions.ts`.
• Boundary de escrita: `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`.
• Mecanismo mínimo: Server Action protegida por `requirePlatformAdmin`, chamando adapter Admin server-only com `createServiceClient()`.
• Persistência exclusiva: `public.account_commercial_entitlements`.
• Origem comercial usada: `liberacao_manual`.
• Concessão manual validada com `status = ativo`, plano canônico, vigência válida e `metadata_json` mínimo.
• Conflito com entitlement efetivo de `plano_pago_confirmado` ou `trial` falha fechado.
• Entitlement manual `ativo` existente é atualizado, sem duplicidade intencional.
• Criação real de draft pelo LP Builder não foi executada porque não há superfície operacional navegável aprovada para disparar a Server Action sem implementar rota ou UI nova.

9.3 Trial

9.3.1 Objetivo e status
• Objetivo: definir trial como origem futura de entitlement comercial.
• Status: previsto / não implementado operacionalmente no recorte consolidado atual.

9.3.2 Registros do recorte
- Banco:
  - Criados:
  - Ajustados:
- Repositório:
  - Criados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:

9.3.3 Trial como origem futura de entitlement
• Trial deve controlar permissões e limites de uso quando materializado como entitlement comercial válido.
• Trial não define `accounts.status`.
• Trial permanece como origem futura possível de entitlement comercial.
• Trial deve usar a cadeia universal de entitlement local efetivo antes de liberar criação produtiva.
• Trial não deve ser confundido com liberação manual administrativa mínima.

9.3.4 Vigência, expiração e limites a definir
• Vigência, expiração, limites e efeitos comerciais do trial ainda precisam ser definidos antes de implementação.

9.3.5 Pendências para implementação operacional
• Definir contrato operacional do trial.
• Definir origem, vigência, limites, expiração e auditoria do trial.
• Implementar trial apenas por recorte futuro aprovado, sem inferir implementação a partir da liberação manual.

9.4 Stripe

9.4.1 Objetivo e status
• Objetivo: documentar o recorte mínimo de Stripe Checkout e webhook.
• Status: Checkout mínimo concluído na Fase 6; webhook mínimo concluído na Fase 7.2.

9.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.stripe_webhook_events`
  - Ajustados:
- Repositório:
  - Criados:
    - `supabase/migrations/20260701202632_e9_stripe_webhook_events.sql`
    - `supabase/snippets/e9_phase_7_2_stripe_webhook_verify.sql`
    - `lib/billing-checkout/contracts.ts`
    - `lib/billing-checkout/adapters/stripePriceMap.ts`
    - `lib/billing-checkout/adapters/stripeCheckoutAdapter.ts`
    - `lib/billing-checkout/adapters/stripeWebhookAdapter.ts`
    - `lib/billing-checkout/index.ts`
    - `app/a/[account]/_components/commercial-page/checkout-actions.ts`
    - `app/api/stripe/webhook/route.ts`
  - Ajustados:
    - `app/a/[account]/page.tsx`
    - `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
    - `lib/billing-checkout/index.ts`
  - Excluídos:
- Updates:
  - Aplicados:
    - Stripe webhook
    - Stripe test mode
    - Supabase/Postgres aplicado na Fase 7.2
    - Vercel Production aplicado na Fase 7.2

9.4.3 Checkout mínimo
• Status: Fase 6 concluída em 30/06/2026.
• Provedor inicial: Stripe.
• Ambiente inicial: teste.
• Stripe é mecanismo de checkout/confirmação/persistência, não origem comercial autônoma no gate.
• Modo de Checkout: `subscription`.
• Boundary criado: `lib/billing-checkout/`.
• App cria Checkout Session server-side.
• `free` não vira plano pago.
• `light` não entra no contrato novo.
• `PlanId` legado não é contrato de negócio.

9.4.4 Webhook mínimo
• Status: Fase 7.2 concluída em 02/07/2026.
• Endpoint produtivo: `POST /api/stripe/webhook`.
• Persistência local validada em `public.account_commercial_entitlements`.
• Payload bruto, secret, cartão e PII sensível não são persistidos.

9.4.5 Eventos aceitos, auxiliares e ignorados
• Evento que ativa/renova entitlement: `invoice.paid`.
• `checkout.session.completed` é evento auxiliar/ignorado e não libera entitlement.
• `customer.subscription.deleted` e `invoice.payment_failed` ficam registrados como controlados/ignorados neste recorte.

9.4.6 Idempotência e persistência
• Idempotência operacional: `stripe_webhook_events.event_id`.
• Retry validado para evento `failed` e para `processing` antigo com `retry_reason = stale_processing`.
• Webhook, assinatura do webhook, idempotência e persistência em `account_commercial_entitlements` foram tratados na Fase 7.

9.4.7 Limites: Stripe não substitui entitlement local
• Stripe não substitui o entitlement local.
• Redirect de sucesso não confirma pagamento nem libera entitlement.
• Redirect, checkout e webhook não liberam o LP Builder sem entitlement local efetivo.

9.5 Mercado Pago

9.5.1 Objetivo e status
• Objetivo: registrar Mercado Pago como provedor futuro possível.
• Status: previsto / não implementado.

9.5.2 Registros do recorte
- Banco:
  - Criados:
  - Ajustados:
- Repositório:
  - Criados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:

9.5.3 Critérios para abertura futura
• Mercado Pago está previsto apenas como hipótese futura; nenhuma implementação está consolidada no E9 atual.
• Abrir somente por recorte futuro aprovado, seguindo o contrato universal do 9.1.

9.5.4 Fora do escopo atual
• Permanece fora do escopo atual.

9.6 Asaas

9.6.1 Objetivo e status
• Objetivo: registrar Asaas como provedor futuro possível.
• Status: previsto / não implementado.

9.6.2 Registros do recorte
- Banco:
  - Criados:
  - Ajustados:
- Repositório:
  - Criados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:

9.6.3 Critérios para abertura futura
• Asaas está previsto apenas como hipótese futura; nenhuma implementação está consolidada no E9 atual.
• Abrir somente por recorte futuro aprovado, seguindo o contrato universal do 9.1.

9.6.4 Fora do escopo atual
• Permanece fora do escopo atual.

9.7 Catálogo canônico de capacidades e limites por plano

9.7.1 Objetivo e status
- Objetivo: definir e resolver um contrato canônico único que traduza o plano efetivo da conta em capacidades, níveis, limites e sinais suficientes para os domínios consumidores decidirem quais configurações podem ser apresentadas.
- Status: Em andamento; E9.7.3 concluída, E9.7.4 e E9.7.5 planejadas.

9.7.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/commercial-capabilities/contracts.ts`
    - `lib/commercial-capabilities/index.ts`
    - `lib/commercial-capabilities/registry.ts`
    - `lib/commercial-capabilities/resolve.ts`
    - `lib/commercial-capabilities/validation-cases.ts`
  - Ajustados:
    - `package.json`
- Updates:
  - Aplicados:
    - `supa#20`
    - `prod#19`
- Referências:
  - Plano-base v2: `docs/lousa-plano-base-e9-7.md` — seção 3.1.
  - Contrato técnico: `docs/base-tecnica.md` — seção 3.11.

9.7.3 Contrato canônico e fonte de resolução
- Status: Concluído (06/08/2026).
- Conteúdo:
  - materializa a identificação mínima por chave estável, nome, descrição, categoria, tipo com contrato de valor inequívoco e domínio consumidor;
  - suporta tipos booleano, nível fechado e limite numérico, inclusive `-1` somente quando o contrato do limite adota ilimitado explicitamente;
  - centraliza a fonte repo-only em `lib/commercial-capabilities/`, com `index.ts` como única API pública, registry interno e resolução de produção fail-closed por `planKey` e chave de capacidade;
  - mantém o registry runtime vazio, sem capacidade Starter inferida, e isola fixtures sintéticas do runtime e da API pública;
  - valida contrato, duplicidades, valores, desconhecidos, ausência de associação, fonte vazia e imutabilidade pelo comando `validate:commercial-capabilities`, integrado ao `npm run check`;
  - não cria banco, `get_feature`, grants, snapshot, integração com entitlement ou consumidor, UI, rota, serviço, job, agente ou automação.

9.7.4 Catálogo inicial do Starter
- Status: Planejado; fora do escopo da execução atual por decisão humana.
- Conteúdo:
  - incluir somente capacidades admitidas por decisão humana, com consumidor real existente ou já aprovado para a jornada imediata;
  - registrar separadamente a definição da capacidade e seu valor aprovado para o Starter;
  - manter capacidades ainda candidatas como dependências, sem completar Lite, Pro ou Ultra por extrapolação;
  - distinguir capacidade admitida, consumidor capaz de aplicá-la e recurso efetivamente existente.

9.7.5 Resolução e contrato de consumo pelo plano efetivo
- Status: Planejado; fora do escopo da execução atual por decisão humana.
- Conteúdo:
  - resolver o contrato canônico a partir do `planKey` efetivo fornecido pelo entitlement;
  - disponibilizar contrato server-side determinístico para os domínios consumidores, preservando no consumidor a medição de uso e a aplicação do gate no ponto da ação;
  - manter entitlement como prova do plano e a E9.7 como prova da capacidade, sem inferência de comportamento pela UI a partir do nome do plano;
  - falhar fechado para plano, capacidade, associação ou valor ausente, desconhecido ou inválido.

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
• Dependências: E9.1.
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
• Dependências: E9.1, E10.4.6, E10.5.1, E10.5.2, E10.5.6.
• Nota: `setup_completed_at/account_setup_completed_at` não devem ser usados no runtime, no gating, no fluxo nem nos logs; ficam mantidos no DB apenas por segurança.

10.5.1 Matriz “preparação vs produtivo” + enforcement (SSR + actions)
• Status: Briefing
• Objetivo: definir a matriz de ações/rotas “produtivas” vs “preparação” e aplicar enforcement server-side sem depender só de UI.
• Escopo:
• fechar status/entitlements mínimos por rota/ação
• declarar o sinal canônico de entitlement/limite efetivo
• definir mensagens e CTAs de bloqueio coerentes com o E10.5
• Dependências: E9.1, E10.5.
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
• O banco garante no máximo um vínculo com `is_primary = true` e `status = 'active'` por conta; zero primários ativos e múltiplos vínculos não primários ou inativos permanecem permitidos.
• As leituras de primário ativo não limitam o resultado antes de `maybeSingle()`: zero continua ausência e cardinalidade maior que um falha fechada, sem escolha silenciosa.
• Artefatos: `supabase/migrations/20260804201831_account_taxonomy_one_active_primary.sql`, `supabase/tests/account_taxonomy_one_active_primary.test.sql`, `supabase/snippets/account_taxonomy_one_active_primary_verify.sql` e `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`.

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
• Status: Concluída até a Fase 7; Fase 8 permanece futura/pausada.
• Próxima execução: Fase 8 — futura/pausada; não iniciada.
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

10.8 Resolução de pesquisas estruturadas para `landing_page` — retirada

10.8.1 Objetivo e status

* Objetivo histórico: disponibilizar um conjunto único, completo, determinístico e rastreável de pesquisas estruturadas para consumidores de `landing_page`.
* Status: Retirada em 19/08/2026 pela E22.1.6.

10.8.2 Registros do recorte

* Status: Registro histórico preservado; os artefatos retirados permanecem consolidados na E22.1.2.
* Conteúdo: o boundary `research-resolution`, o adapter, os exports e o validator foram removidos.

10.8.3 Contrato de resolução e elegibilidade

* Status: Contrato histórico retirado.
* Conteúdo: não existe substituto para E10.8.

10.8.4 Precedência, proveniência e falha fechada

* Status: Responsabilidade histórica encerrada.
* Conteúdo: E20.5 e E20.6 selecionam e avaliam o caminho vigente da pesquisa integral `end_customer`, consumido pela E19.3.

10.8.5 Validação e limites do recorte

* Status: Preservações vigentes confirmadas pela E22.1.6.
* Conteúdo: `taxon_market_research`, `taxon_market_research_items` e seus consumidores independentes permanecem preservados.

11. E11 — Gestão de Usuários e Convites
- Objetivo: permitir gestão segura de membros não-owner e convites por conta, usando Supabase Auth e o Account Dashboard.
- Status: implementação e validação hospedada concluídas; PR #656 mergeado, funcionalidade habilitada e smoke final aprovado em Production.

11.1 Gestão de membros e convites

11.1.1 Objetivo e status
- Objetivo: permitir que owner e admin convidem, acompanhem e administrem membros com papéis admin, editor e viewer, preservando o owner e o isolamento multi-tenant.
- Status: concluído; migration aplicada, estado pós-apply verificado e ativação controlada aprovada em Production.

11.1.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_users`;
    - `public.accept_account_invite(uuid, integer)`;
    - `public.revoke_account_invite(uuid, uuid)`;
    - `public.invitation_expires_at(uuid, integer)`;
    - `public.invitation_is_expired(uuid, integer)`;
    - `public.activate_user_from_auth_hook(jsonb)`.
- Repositório:
  - Criados:
    - `supabase/migrations/20260727155312_e11_account_members_security.sql`;
    - `supabase/snippets/e11_account_members_verify.sql`;
    - `lib/access/account-members/`;
    - `app/a/[account]/members/`;
    - `app/a/home/PendingInviteActionButton.tsx`;
    - `app/a/home/member-invite-actions.ts`.
  - Ajustados:
    - `app/a/[account]/layout.tsx`;
    - `app/a/home/page.tsx`;
    - `app/auth/confirm/route.ts`;
    - `app/auth/update-password/page.tsx`;
    - `components/layout/Header.tsx`;
    - `lib/access/guards.ts`;
    - `lib/supabase/service.ts`;
    - `package.json`.

11.1.3 Domínio server-side e ciclo seguro de vínculos
- Status: implementado.
- Conteúdo:
  - boundary server-only para operações de membros e Supabase Auth Admin;
  - autorização administrativa por owner ou admin e autoatendimento do convidado vinculado à sessão autenticada;
  - transições idempotentes por membership específico, com proteção do owner e do próprio ator;
  - escrita direta restrita e funções legadas amplas indisponíveis aos papéis de runtime.

11.1.4 Convite de novo usuário e conclusão do cadastro
- Status: implementado.
- Conteúdo:
  - template nativo `Invite user` para usuário novo ou ainda não confirmado;
  - contexto versionado e assinado vinculado a um único `account_user_id`;
  - confirmação anti-scanner, definição de senha e ativação apenas do vínculo validado, com retry idempotente;
  - validade e reenvio sob responsabilidade do Supabase Auth, sem expiração local, e-mail próprio, hook amplo, job ou automação.

11.1.5 Gestão de membros no Account Dashboard
- Status: implementado.
- Conteúdo:
  - rota `/a/[account]/members` restrita a owner e admin;
  - lista de membros ativos e convites pendentes;
  - convite, reenvio, revogação, alteração de papel e desativação, com proteção do owner e do próprio ator;
  - navegação, rota e ações fechadas enquanto o gate da E11 estiver desabilitado.

11.1.6 Pendências do usuário já cadastrado
- Status: implementado.
- Conteúdo:
  - usuário confirmado recebe o convite na própria `/a/home`, sem novo e-mail;
  - aceite ou recusa de uma pendência por vez, com identidade derivada da sessão;
  - canal correlacionado ao ciclo `pending` atual, com falha fechada para evento ausente ou anterior;
  - membership permanece `pending` até aceite, recusa ou revogação, sem expiração local.

11.1.7 Ativação controlada e validação hospedada
- Status: concluído; correção do transporte concorrente aprovada no Preview e smoke final aprovado em Production após o merge do PR #656.
- Conteúdo:
  - migration aplicada e estado pós-apply verificado;
  - configuração remanescente do Supabase Auth concluída, com o template `Invite user` usando `RedirectTo`, `TokenHash` e `type=invite`;
  - gate habilitado em Production após o merge do PR #656, com redeploy concluído;
  - matriz hospedada anterior aprovada para convite de usuário novo e existente, aceite, recusa, reativação, troca de papel, desativação, proteções de owner e do próprio vínculo, isolamento de acesso, logout, navegação por teclado, responsividade e retorno da gestão de membros à página principal;
  - transporte do estado assinado corrigido para ser codificado no `redirectTo` específico de cada emissão, sem gravação ou leitura por `data` ou `user_metadata` compartilhado;
  - testes humanos corretivos aprovados para convite novo e reenvio, senha e ativação, dois convites do mesmo usuário não confirmado para contas diferentes, ativação exclusiva do respectivo `account_user_id` e adulteração do estado bloqueada;
  - smoke final em Production aprovado na página de membros e convites, com dados e ações de gestão carregados;
  - fase concluída sem teste manual remanescente.

11.2 Autoridade comercial e elegibilidade para gestão de membros

11.2.1 Objetivo e status
- Objetivo: conectar os papéis da E11 ao sinal canônico de entitlement da E9, separando autoridade financeira, elegibilidade para novos convites e ações de manutenção dos vínculos existentes.
- Status: implementação e validação concluídas; Preview autenticado aprovado; HEAD funcional validado `7557f7053a95df07cd4c33b1224deed657671bfb`; merge humano do PR #667 pendente.
- Plano-base: `docs/lousa-plano-base-e11-2.md`.
- Automação: não.

11.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/[account]/_components/commercial-page/checkout-policy.ts`
    - `app/a/[account]/_components/commercial-page/checkout-validation-cases.ts`
    - `app/a/[account]/_components/commercial-page/commercial-experience-policy.ts`
    - `app/a/[account]/_components/commercial-page/commercial-experience-validation-cases.ts`
  - Ajustados:
    - `app/a/[account]/_components/commercial-page/CommercialActivationTrackingScope.tsx`
    - `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
    - `app/a/[account]/_components/commercial-page/PublishedCommercialActivationPage.tsx`
    - `app/a/[account]/_components/commercial-page/checkout-actions.ts`
    - `app/a/[account]/page.tsx`
    - `app/a/[account]/members/page.tsx`
    - `lib/access/account-members/contracts.ts`
    - `lib/access/account-members/index.ts`
    - `lib/access/account-members/policy.ts`
    - `lib/access/account-members/validation-cases.ts`
    - `lib/access/guards.ts`
    - `lib/conversion-content/commercial-activation/renderer.tsx`
    - `package.json`

11.2.3 Autoridade para o checkout
- Status: implementado.
- Conteúdo:
  - somente owner ativo de conta ativa e sem entitlement comercial válido pode visualizar a ação de contratação e iniciar o checkout existente;
  - admin, editor e viewer não iniciam checkout, com bloqueio server-side independente da UI;
  - owner com `isCommerciallyEligible=true` não cria nova assinatura pela action atual;
  - decisões server-side de checkout emitem evento estruturado seguro para `allowed`, `denied` e `error`, sem PII e sem alterar o resultado da operação;
  - preço, recorrência, webhook, gestão de assinatura e outros fluxos de billing permanecem fora do recorte.

11.2.4 Elegibilidade para criação e reenvio de convites
- Status: implementado.
- Conteúdo:
  - owner e admin só criam ou reenviam convites quando `isCommerciallyEligible=true`;
  - a conta precisa estar `active`, com `accountStatus` derivado do Access Context, e os guards ocorrem antes de leitura ou criação no Auth, preparação do membership, canal ou envio;
  - ausência ou erro do sinal bloqueia criação e reenvio;
  - o fluxo preserva `inviteUserByEmail` e o template nativo `Invite user`, sem envio customizado;
  - decisões server-side de convite e reenvio emitem evento estruturado seguro sem interferir no resultado da operação;
  - editor e viewer permanecem sem gestão de membros.

11.2.5 Experiência da conta sem entitlement
- Status: implementado e aprovado em validação humana autenticada no Preview; HEAD funcional validado `7557f7053a95df07cd4c33b1224deed657671bfb`.
- Conteúdo:
  - `GenericCommercialPage` e `PublishedCommercialActivationPage` aplicam a mesma política de autoridade financeira;
  - owner sem entitlement mantém a variante comercial vigente e inicia o checkout existente; owner com entitlement não inicia nova compra;
  - admin, editor e viewer sem entitlement recebem estado simples de espera pela ativação comercial do proprietário, e nenhum não-owner recebe cards ou CTA financeiro;
  - a variante publicada preserva bundle, conteúdo persistido, composição, ordem e schemas da E10.7;
  - a E11.2 não cria novo dashboard produtivo nem antecipa a E10.5.1.

11.2.6 Preservação dos vínculos e ações existentes
- Status: implementado e coberto pela validação automatizada.
- Conteúdo:
  - listagem, aceite, recusa, revogação, desativação e alteração de papel permanecem regidos pela E11.1 e independentes de entitlement;
  - memberships existentes não são apagados, desativados ou alterados retroativamente;
  - a decisão comercial consome exclusivamente `CommercialEntitlementSignal.isCommerciallyEligible`, sem reinterpretar origem, plano ou provedor.

11.2.7 Validação técnica, visual e humana
- Status: validações automatizada e humana autenticada aprovadas.
- Conteúdo:
  - a matriz automatizada de variante genérica/publicada, owner/admin/editor/viewer e `isCommerciallyEligible=false/true` foi aprovada, incluindo visibilidade, chamada direta e comportamento preservado;
  - os bloqueios de checkout e convite antes de efeitos externos ou persistência foram comprovados;
  - os resultados `allowed`, `denied` e `error`, com exatamente um evento seguro por decisão e logging sem interferência no fluxo, foram comprovados;
  - as ações preservadas continuaram funcionando sem entitlement;
  - a validação humana autenticada em Preview aprovou owner e non-owner em desktop e mobile, incluindo conteúdo, responsividade, foco, ausência de CTA financeiro indevido e ausência de erro ou quebra visual;
  - `npm ci`, `npm run check`, as validações específicas e `git diff --check` foram aprovados no fechamento final.


12. E12 — Admin Dashboard
- Objetivo: Consolidar o Admin Dashboard como seção administrativa protegida, separada do Account Dashboard, com navegação própria e leitura operacional read-only.
- Status: Em desenvolvimento.

12.1 Contrato administrativo base

12.1.1 Objetivo e status
- Objetivo: Definir o contrato administrativo base da E12, incluindo escopo geral, áreas atuais, limites e pendências gerais do Admin Dashboard.
- Status: Em desenvolvimento.

12.1.2 Registros do recorte
- Banco:
  - Criados: N/A.
  - Ajustados: N/A.
- Repositório:
  - Criados: N/A.
  - Ajustados: N/A.
  - Excluídos: N/A.
- Updates:
  - Aplicados: N/A.

12.1.3 Escopo atual
- Status: Consolidado como contrato vigente da E12.
- Conteúdo:
  - `/admin` é uma página pública de entrada do Admin Dashboard.
  - Subrotas internas permanecem protegidas por gate SSR administrativo em `app/admin/(protected)/layout.tsx`.
  - `/admin/contas` continua sendo o destino pós-login do admin.
  - Header e menu próprios do Admin, sem `AccountSwitcher` e sem dependência de conta ativa.
  - Shell operacional com sidebar, navegação administrativa e responsividade básica.
  - Leitura read-only real para contas, resoluções de nicho e taxonomia.
  - Sem billing, migrations, SQL ou alterações de RLS nesta fase; mutações administrativas gerais permanecem fora do escopo atual, exceto as mutações mínimas aprovadas para a E10.7 em `/admin/templates`.

12.1.4 Áreas atuais
- Status: Áreas administrativas atuais e previstas do contrato base.
- Conteúdo:
  - Contas.
  - Resoluções de nicho.
  - Taxonomia.
  - Templates.
  - Documentação.
  - Auditoria.

12.1.5 Pendências e limites gerais
- Status: Pendências mantidas para recortes futuros ou para a operação mínima já aprovada na E10.7.
- Conteúdo:
  - Templates e Auditoria permanecem como áreas previstas.
  - Mutações administrativas gerais permanecem fora do escopo atual, exceto as mutações mínimas aprovadas para a E10.7 em `/admin/templates`, descritas em 12.3.
  - Billing e operações de suspensão/reativação dependem de recorte futuro.
  - Não há editor visual, LP Builder, curadoria de composição de nicho, LP teste ou liberação de nicho para clientes neste ajuste da E12.

12.2 Base implementada do Admin Dashboard

12.2.1 Objetivo e status
- Objetivo: Consolidar o que já foi implementado e validado na base do Admin Dashboard, incluindo entrada pública, leitor read-only de documentação, shell administrativo e leitura operacional read-only.
- Status: Concluído e validado nos recortes descritos abaixo.

12.2.2 Registros do recorte
- Banco:
  - Criados: N/A.
  - Ajustados: N/A.
- Repositório:
  - Criados:
    - `app/admin/(protected)/documentacao/page.tsx`
    - `app/admin/(protected)/contas/page.tsx`
    - `app/admin/(protected)/contas/[accountId]/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/layout.tsx`
    - `components/admin/AdminPageHeader.tsx`
    - `components/admin/AdminPlaceholderPage.tsx`
    - `components/admin/AdminSidebar.tsx`
    - `components/admin/AdminStatusBadge.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adminFormat.ts`
    - `lib/admin/adapters/adminAccountsAdapter.ts`
    - `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyHelpers.ts`
    - `lib/admin/adapters/adminReadOnlyTypes.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/admin/docsCatalog.ts`
    - `lib/admin/readRepoDoc.ts`
  - Ajustados:
    - `app/admin/layout.tsx`
    - `app/admin/page.tsx`
    - `components/admin/AdminHeader.tsx`
    - `components/admin/AdminUserMenu.tsx`
    - `components/admin/adminNavigation.ts`
    - `next.config.js`
  - Excluídos: N/A.
- Updates:
  - Aplicados: N/A.

12.2.3 Entrada pública do Admin Dashboard
- Status: Concluído e validado em testes humanos (22/06/2026).
- Conteúdo:
  - `/admin` agora abre uma página pública de entrada do Admin Dashboard, com apresentação simples e botão de acesso.
  - O botão de entrada aponta para `/auth/login?next=%2Fadmin%2Fcontas`.
  - As subrotas internas continuam protegidas pelo gate administrativo deslocado para `app/admin/(protected)/layout.tsx`.
  - `/admin/contas` permanece como destino pós-login do admin.

12.2.4 Leitor read-only de documentação
- Status: Concluído e validado em testes humanos (22/06/2026).
- Conteúdo:
  - `/admin/documentacao` é uma área protegida pelo gate administrativo existente.
  - A página lista uma whitelist fixa de documentos de `docs/` e permite leitura read-only do conteúdo.
  - A leitura usa filesystem server-side do repositório, com inclusão explícita dos arquivos permitidos no tracing da rota.
  - UI final: filtro superior, dropdown alfabético, conteúdo abaixo, sem lista intermediária e responsiva em desktop/mobile.
  - Markdown é exibido como texto bruto; renderer Markdown fica como oportunidade futura por exigir dependência não instalada.
  - Não usa Supabase, migrations, GitHub API em runtime, edição, salvamento, publicação ou mutações.

12.2.5 Shell e leitura operacional read-only
- Status: Implementado como base operacional read-only da E12.
- Conteúdo:
  - Shell operacional com sidebar.
  - Navegação administrativa.
  - Responsividade básica.
  - Leitura read-only real para contas, resoluções de nicho e taxonomia.

12.3 Operação administrativa mínima da E10.7

12.3.1 Objetivo e status
- Objetivo: Isolar a operação administrativa mínima de páginas comerciais por taxon aprovada pela E10.7 dentro da superfície administrativa da E12.
- Status: Reintroduzido em recorte mínimo pela E10.7 em 19/06/2026.

12.3.2 Registros do recorte
- Banco:
  - Criados: N/A.
  - Ajustados: N/A.
- Repositório:
  - Criados: N/A.
  - Ajustados: N/A.
  - Excluídos: N/A.
- Updates:
  - Aplicados: N/A.

12.3.3 Geração administrativa de página comercial por taxon
- Status: Reintroduzido em recorte mínimo pela E10.7 em 19/06/2026.
- Conteúdo:
  - A operação administrativa não será um editor visual nem LP Builder.
  - O recorte autorizado limita-se a gerar draft, regenerar draft, visualizar, publicar e arquivar `published` anterior, conforme 12.3.4.

12.3.4 Superfície inicial em `/admin/templates`
- Status: Superfície inicial prevista para a operação administrativa mínima da E10.7.
- Conteúdo:
  - `/admin/templates` será a superfície inicial da operação administrativa mínima da E10.7.
  - Operações permitidas: listar taxons elegíveis, mostrar checklist simples, indicar pesquisas presentes ou ausentes, indicar composição disponível, gerar draft, regenerar draft, visualizar draft com `CommercialActivationRenderer`, publicar draft e arquivar `published` anterior se existir.
  - Esta tela passará a ter mutações administrativas controladas para a E10.7, respeitando permissões administrativas e operação transacional de publicação.

12.3.5 Limites da operação administrativa da E10.7
- Status: Limites mantidos como restrições do recorte mínimo aprovado.
- Conteúdo:
  - Sem editor visual.
  - Sem múltiplos aprovadores.
  - Sem gestão de clientes.
  - Sem bloqueio de ativações.
  - Sem permissão de criar LPs.
  - Sem LP Builder.
  - Sem curadoria de composição de nicho, LP teste ou liberação de nicho registrada como implementação da E12.

12.4 Gestão do perfil de orientação
- Objetivo: Definir a operação administrativa do perfil de orientação que direciona gerações futuras de landing pages sem materializar nem alterar LPs.
- Status: E12.4.3, E12.4.3.1 e E12.4.3.2 concluídas e integradas à `main`, incluindo a correção técnica do PR #681; gate funcional único no Preview e inspeção final do Estrategista aprovados.

12.4.1 Objetivo e status
- Objetivo: Entregar a operação manual completa de criação, edição, revisão, ativação e arquivamento de versões do perfil, com proposta opcional por IA no mesmo editor.
- Status: Operação manual e assistência opcional implementadas e validadas; provas automatizadas de banco e validações humanas autenticadas em Preview concluídas.

12.4.3 Proposta, revisão, aprovação e ativação do perfil
- Status: Concluída; implementação integrada à `main`, com workflow idempotente, teste SQL transacional, verificação read-only pós-apply, configuração da OpenAI em Preview e teste humano autenticado aprovados.
- Conteúdo:
  - Perfil próprio permitido somente para segmento e nicho; ultranicho resolve o perfil ativo do ancestral elegível mais próximo.
  - Estados persistidos limitados a `draft`, `active` e `archived`; uma versão ativa é imutável e qualquer mudança exige nova versão em rascunho.
  - A operação manual permanece completa; a IA apenas propõe conteúdo após ação explícita do `platform_admin`, sem salvar, aprovar, ativar, arquivar ou gerar LP.
  - `Salvar rascunho`, `Aprovar e ativar` e arquivamento permanecem ações humanas; a troca da versão ativa deve ser atômica e auditada.
  - A E12.4.3 reutiliza o contrato e a persistência da E20.3 sem alterar o resolver público do perfil ativo próprio ou herdado.
  - Dependência técnica atendida em 28/07/2026: PR #655 mergeado, branch sincronizada com a `main` e `next`/`eslint-config-next` confirmados em `16.2.11` no lockfile antes da implementação.
  - A proposta por IA exige resolução completa da E10.8 e identidades públicas vigentes da E18.5; ausência ou indisponibilidade da assistência não bloqueia o fluxo manual.
  - A E12.4.4 foi retirada da implementação e absorvida pela jornada simplificada; geração, materialização, preview, publicação e alteração de LP permanecem fora do recorte.
- Registros de implementação:
  - Admin Dashboard: listagem e editor em `app/admin/(protected)/perfis-de-orientacao/`, com salvar draft, ativar e arquivar protegidos por `platform_admin`.
  - Boundary e adapters: contratos administrativos, validação estrita, correlação da proposta, acesso server-only e integração opcional com Responses API em `lib/conversion-content/`.
  - Banco: migration `20260728153500_e12_4_3_generation_profile_lifecycle.sql` aplicada; teste SQL transacional, snippet read-only, RPCs, ACLs, RLS e policies verificados pós-apply.
  - Validação: casos executáveis do perfil, typecheck, check, checks hospedados e fluxo autenticado em Preview aprovados; proposta inicial, refinamento e gate negativo da E10.8 validados sem salvamento ou ativação automáticos.

12.4.3.1 Refinamento iterativo assistido por IA
- Status: Concluída; implementação integrada à `main`, com checks hospedados automatizados e teste humano autenticado do refinamento em Preview aprovados.
- Conteúdo:
  - Toda proposta inicial ou revisão depende de ação explícita do `platform_admin`.
  - A implementação integrada à `main` ainda permite sugestões textuais; a candidata da E12.4.3.2 restringe a saída da IA a cobertura, módulos, variantes, prioridade, ordem, gaps e avisos transitórios, preservando as orientações exclusivamente humanas.
  - O refinamento recebe o conteúdo atual do editor e o feedback humano mais recente, além das fontes já autorizadas pela E12.4.3.
  - Cada acionamento autoriza somente uma chamada; não há refinamento nem retry automático.
  - Nenhuma proposta salva, aprova ou ativa automaticamente; o `platform_admin` continua responsável por revisar, editar, salvar e ativar.
  - Não existe conversa persistente, histórico de mensagens, agente ou memória própria.

12.4.3.2 Criação e evolução estrutural baseada em `lp_sections`, catálogo vigente e debate humano–IA
- Status: Implementada e integrada à `main` pelo PR #672, com correção localizada de cardinalidade integrada pelo PR #681; gate funcional no HEAD `e6f694454b11388f30355ddbf231bb8350ecef1f` e inspeção final do Estrategista aprovados, sem banco ou migration e sem reabrir lifecycle.
- Conteúdo:
  - Sem perfil próprio, a ação será `Criar perfil com IA`; com perfil `active` próprio, será `Evoluir perfil com IA`; o fluxo manual permanece completo.
  - A evolução inicializará o editor da nova versão com a estrutura ativa completa como baseline não persistido e revalidará cada recomendação contra as versões vigentes da E10.8 e da E18.5.
  - `coverage[]` avaliará cada item de `lp_sections`; `recommendations[]` será a lista final única por módulo.
  - `covered` e `partial` exigem identidades compatíveis e escolhidas não vazias; `missing` exige ambas as listas vazias no Zod, no JSON Schema estrito e no validador fail-closed.
  - A ocorrência `coverage_identity_count_invalid` de 03/08/2026 preservou o `active v1` e não criou `draft v2`; como a resposta rejeitada não foi armazenada, cobertura, status e aliases concretos não são inferidos.
  - `coverage[]`, relações seção–módulo, gaps e estados do diff serão resultados derivados e transitórios; somente recomendações aplicadas e salvas integrarão o perfil.
  - Várias seções poderão convergir para um módulo e uma seção poderá exigir vários módulos.
  - A prioridade será convertida por `3 → P1`, `2 → P2`, `1 → P3`; a ordem final será determinística, positiva e única.
  - Cada rodada explícita ocorrerá sobre a nova versão em `draft`, usando editor original, candidata atual e feedback humano; a candidata e o diff aparecerão antes de aplicar, refinar novamente ou descartar.
  - Aplicar alterará somente o editor; `Salvar rascunho`, aprovação, ativação e arquivamento continuarão separados e humanos.
  - A pesquisa bruta será contexto complementar opcional, resolvido pela proveniência efetiva da E10.8 e incluído apenas quando existir e couber integralmente no limite da requisição; ausência ou omissão não criarão gate.
  - A IA não preencherá nem modificará `generation_guidance` ou `item_guidance`, que serão exceções humanas opcionais.
  - A decisão `wait_for_modules` ou `proceed_with_available` é registrada no evento de auditoria do rascunho; `wait_for_modules` bloqueia a ativação e `proceed_with_available` permite a ativação com a decisão auditada.
  - Não existe dependência futura de recálculo dos gaps pela E12.4.4 nem novo gate de autorização por conta.
  - A E20.3.5 tornou `generation_guidance` opcional pela migration `20260730114633`, já aplicada, sem reabrir E20.3.3 ou E20.3.4.
  - Snapshot e independência da LP permanecem consolidados; liberdade de edição e comportamento de regeneração serão decididos apenas no futuro plano-base da E19.4.
  - Registros da implementação candidata:
    - Admin Dashboard e Server Actions em `app/admin/(protected)/perfis-de-orientacao/`.
    - Contrato estrutural, validação determinística, candidata, diff, carregamento opcional de pesquisa bruta e integração server-only em `lib/conversion-content/`.
    - Migration incremental e provas em `supabase/migrations/`, `supabase/tests/` e `supabase/snippets/`.

12.4.3.3 Refinamentos futuros do editor e da modelagem do perfil
- Status: Futuro e não bloqueante para o PR #672; não constitui requisito para o merge atual e não possui implementação iniciada.
- Escopo futuro:
  - Substituir a digitação livre de módulo e variante por seleção vinculada ao catálogo público vigente.
  - Derivar automaticamente as versões de módulo e variante, ou apresentá-las como somente leitura, evitando entrada numérica livre.
  - Desabilitar `Salvar rascunho` quando o editor não possuir alterações pendentes.
  - Avaliar no documento próprio da E10.8 se `formato_medio` e `formato_longo` devem permanecer como itens de `lp_sections`.
  - Os gaps de `formato_medio` e `formato_longo` não autorizam automaticamente a criação de módulo ou variante na E18.5.

12.4.4 Prontidão, autorização e revogação por conta, taxon e plano
- Status: Retirada da implementação e absorvida pela jornada simplificada; não concluída.
- Conteúdo:
  - A decisão sobre gaps permanece no lifecycle vigente da E12.4.3.2: `wait_for_modules` bloqueia a ativação e `proceed_with_available` permite a ativação com auditoria.
  - Não haverá recálculo posterior obrigatório dos gaps, prontidão persistida, autorização ou revogação por `conta + taxon + plano` neste recorte.
  - A jornada futura não depende da implementação da E12.4.4 e não cria novo gate de autorização por conta.
  - A observação sobre `rodape_contato` não autoriza criação automática de módulo ou variante nem alteração da E18.5.

12.5 Diagnóstico e navegação operacional do Admin Dashboard

12.5.1 Objetivo e status
- Objetivo: Tornar explícito o diagnóstico operacional por taxon e conectar Taxonomia, Páginas comerciais e Resoluções de nicho sem criar prontidão persistida nem reabrir os contratos de mutação existentes.
- Status: Concluída; os consumidores administrativos históricos de E20.3 e E10.8 foram retirados pelas E22.1.4 e E22.1.6, com Página comercial, E20.5 e E20.6 preservadas.

12.5.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/perfis-de-orientacao/[taxonId]/page.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/templates/commercial-activation/[taxonSlug]/page.tsx`
    - `app/admin/(protected)/templates/page.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
    - `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyHelpers.ts`
    - `lib/admin/adapters/adminReadOnlyTypes.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdminAdapter.ts`
    - `lib/conversion-content/adapters/landingPageResearchAdapter.ts`
    - `lib/conversion-content/landing-page/generation-profile/admin-contracts.ts`
- Referências:
  - Plano-base aprovado: `docs/lousa-plano-base-e12-5.md` — E12.5.3.

12.5.3 Diagnóstico contextual e navegação
- Status: Concluída no estado vigente, sem alteração de banco, rota, action, RPC ou chamada de IA.
- Conteúdo:
  - Taxonomia resume Status e Página comercial em tabela responsiva; o detalhe preserva o diagnóstico comercial e as ações vigentes da seleção E20.5 e da avaliação E20.6.
  - Os diagnósticos BB/EC da camada E10.8 e os estados de perfil E20.3 foram retirados sem alterar a elegibilidade ou a operação de Páginas comerciais.
  - Resoluções de nicho permanece centrada na conta e mantém as ações próprias a partir do taxon confirmado, sem inferir vínculo pela sugestão da IA.
  - Leituras diagnósticas preservadas usam projeções server-side em lote e falha isolada por domínio; não há novo domínio de prontidão.

12.5.4 Validação e pendências
- Status: Concluída após o merge da E22.1.6 e o QA pós-merge aprovado em produção.
- Conteúdo:
  - `npm ci`, `npm run check`, `git diff --check` e os validadores focais preservados foram aprovados localmente.
  - Os QAs autenticados no Preview e pós-merge em produção aprovaram Taxonomia em desktop e mobile sem diagnósticos BB/EC E10.8, preservando Página comercial e os estados E20.5/E20.6, sem links, cards, estados órfãos, overflow de página ou erros de console.

12.6 Estrutura da LP no Admin Dashboard

12.6.1 Objetivo e status
- Objetivo: Expor no Admin uma consulta estrutural read-only da landing page, reunindo parâmetros e entradas em uma única rota.
- Status: Concluído; a E22.1.5 retirou Módulos e variantes, e a E22.1.6 retirou Pesquisas, preservando Parâmetros e Entradas com QA hospedado/autenticado aprovado em desktop (1280×900) e mobile (390×844).

12.6.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/admin/(protected)/estrutura-lp/page.tsx`
    - `lib/admin/adapters/adminLandingPageStructureAdapter.ts`
  - Ajustados:
    - `components/admin/AdminPageHeader.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/root-resolver.ts`
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
  - Excluídos:
    - `app/admin/(protected)/estrutura-lp/ModuleStructureFilters.tsx`
- Updates:
  - Aplicados: `prod#14`, `prod#16`, `prod#17`.
- Referências:
  - Plano-base aprovado: `docs/lousa-plano-base-e12-6.md` — E12.6.3.

12.6.3 Consulta estrutural read-only
- Status: Concluída após o merge da E22.1.6 e o QA pós-merge aprovado em produção, sem alteração de banco, persistência, mutation, IA, automação ou infraestrutura.
- Conteúdo:
  - O Admin possui um único item `Estrutura da LP` e uma única rota `/admin/estrutura-lp`; somente as visões Parâmetros e Entradas permanecem na rota por query string.
  - Parâmetros consulta o contrato público vigente da E18.4; Entradas resolve o catálogo da E20.2 por versão, plano e taxon ativo.
  - As visões históricas Módulos e variantes e Pesquisas foram retiradas pelas E22.1.5 e E22.1.6; queries antigas caem com segurança em Parâmetros.
  - A leitura administrativa usa um único adapter e consultas server-side em lote, sem exportar registry ou schema privado, sem N+1 e sem regra de domínio em React.
  - `npm ci`, `npm run check`, `git diff --check` e os validadores canônicos preservados da E18.4 e E20.2 foram aprovados localmente; os QAs hospedado/autenticado e pós-merge em produção, em desktop (1280×900) e mobile (390×844), aprovaram as duas visões e confirmaram 23 campos válidos resolvidos pela E20.2.

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
- Objetivo: Definir infraestrutura e contratos reutilizáveis para famílias de templates por canal, templates versionados, módulos de conteúdo, seções de página, variantes, composições e artefatos finais persistidos; sustentar primeiro a E10.7 sem produzir diretamente a página comercial de um taxon; e permitir consumidores futuros somente como visão de evolução, sem antecipar sua implementação.
- Status: Base mínima de `commercial_activation` concluída; parametrização raiz versionada de `landing_page` concluída em 13/07/2026 e preservada; implementação anterior de composição `landing_page` removida; catálogo repo-only da E18.5 retirado pela E22.1.5.

18.1 Contrato transversal de templates, módulos, composições e artefatos

18.1.1 Objetivo e status
- Objetivo: Consolidar o contrato conceitual permanente da E18 para famílias de templates por canal, templates versionados, módulos, seções, variantes, composições reutilizáveis e artefatos finais.
- Status: Aprovado como base transversal; materialização inicial concentrada na base mínima de `commercial_activation` do recorte 18.2.

18.1.2 Registros do recorte
- Banco:
  - Criados: N/A; registros materiais consolidados no recorte 18.2.
  - Ajustados: N/A; registros materiais consolidados no recorte 18.2.
- Repositório:
  - Criados: N/A; registros materiais consolidados no recorte 18.2.
  - Ajustados: N/A; registros materiais consolidados no recorte 18.2.
  - Excluídos: N/A.
- Updates:
  - Aplicados: N/A.

18.1.3 Decisão estrutural aprovada
- Status: Aprovada.
- Conteúdo:
  - Separação conceitual: canal → família de renderer → template-base versionado → módulos/seções compatíveis → composição por contexto → artefato final.
  - Regra inicial: 1 canal → 1 família de renderer → 1 versão-base inicial → versões ou variantes futuras quando necessárias.
  - A regra não limita definitivamente cada canal a um único template.
  - Cada canal terá módulos próprios e sua própria família de renderer, mesmo quando compartilhar contratos transversais.

18.1.4 Famílias e templates versionados
- Status: Definido como contrato transversal.
- Conteúdo:
  - `content_templates` foi mantida para templates e módulos/seções versionados.
  - `content_template_taxons` foi mantida para elegibilidade, prioridade e seleção do template por taxon.
  - Os valores de `template_family` permanecem `commercial_activation` e `landing_page`.
  - O contrato detalhado dos objetos e permissões está em `docs/schema.md`.

18.1.5 Módulos, seções e variantes
- Status: Catálogo inicial definido para `commercial_activation`; ampliação condicionada a necessidade real.
- Conteúdo:
  - Catálogo inicial v1 da família `commercial_activation`:
    - `hero.default`
    - `benefits.cards`
    - `services.list`
    - `plans.cards`
    - `differentials.cards`
    - `how_it_works.steps`
    - `faq.accordion`
    - `final_cta.simple`
  - As variantes descrevem comportamento estrutural ou funcional e não podem representar nichos.
  - A ampliação do catálogo depende de necessidade comprovada por consumidores reais.
  - Para `landing_page`, a parametrização raiz pertence ao recorte 18.4; o catálogo histórico separado de módulos e variantes da E18.5 foi retirado pela E22.1.5, sem afetar a raiz.

18.1.6 Contrato entre código e banco
- Status: Definido como separação de responsabilidades.
- Conteúdo:
  - Código: contrato, validação, componente visual e comportamento responsivo.
  - Banco: identificação, variante, composição, ordem e conteúdo concreto.
  - Adicionar uma definição no banco não cria automaticamente um componente visual.
  - Novos tipos ou variantes estruturais continuam exigindo implementação no repositório.

18.1.7 Composição reutilizável
- Status: Definida como camada intermediária entre template, contexto e artefato final.
- Conteúdo:
  - Composição: canal + template + taxon ou contexto → módulos + variantes + ordem + obrigatoriedade.
  - Um taxon pode usar vários módulos e um módulo pode atender vários taxons.
  - A composição não é o artefato final publicado.
  - A composição comercial da E10.7 deverá definir seções, variantes, ordem, obrigatoriedade e regras específicas do contexto comercial.

18.1.8 Artefato final
- Status: Definido como entidade separada de template, composição e conteúdo.
- Conteúdo:
  - Separar explicitamente template, composição, conteúdo e artefato publicado.
  - Escopo global por taxon: página comercial da E10.7.
  - Escopo específico por conta: futura landing page de cliente.
  - Escopo específico por campanha ou canal: evolução futura.
  - A estrutura persistida deve preservar identidade e versões suficientes para rastrear pesquisa, template e composição usados.

18.1.9 Transversalidade futura
- Status: Visão futura, fora do primeiro recorte implementado.
- Conteúdo:
  - Páginas → seções.
  - E-mail → blocos de mensagem.
  - WhatsApp → mensagens ou etapas.
  - Instagram → hook, slides, legenda e CTA.
  - TikTok → hook, cenas, prova e CTA.
  - Esses consumidores representam visão futura e não fazem parte do primeiro recorte.

18.2 Base mínima `commercial_activation`

18.2.1 Objetivo e status
- Objetivo: Consolidar a implementação mínima de `commercial_activation` como primeira materialização da base transversal da E18, cobrindo banco/runtime, contratos, renderer e registros-base.
- Status: Concluída e validada em 16/06/2026; primeiro recorte implementado em 15/06/2026; Fase 1 mergeada no PR #392 em 16/06/2026; Fase 2 mergeada no PR #393 em 16/06/2026.

18.2.2 Registros do recorte
- Banco:
  - Criados:
    - `content_template_compositions`
    - `content_template_composition_items`
    - `content_artifacts`
    - `content_artifact_research_sources`
  - Ajustados:
    - `content_templates`
    - `content_template_taxons`
    - `taxon_market_research`
- Repositório:
  - Criados:
    - `supabase/migrations/20260615190000_e18_commercial_activation_minimum.sql`
    - `supabase/snippets/e18_commercial_activation_minimum_verify.sql`
    - `lib/conversion-content/contracts.ts`
    - `lib/conversion-content/validation.ts`
    - `lib/conversion-content/adapters/commercialActivationAdapter.ts`
    - `lib/conversion-content/index.ts`
    - `lib/conversion-content/commercial-activation/fixture.ts`
    - `lib/conversion-content/commercial-activation/index.ts`
    - `lib/conversion-content/commercial-activation/registry.ts`
    - `lib/conversion-content/commercial-activation/renderer.tsx`
    - `lib/conversion-content/commercial-activation/resolve.ts`
    - `lib/conversion-content/commercial-activation/schemas.ts`
    - `lib/conversion-content/commercial-activation/validation-cases.ts`
    - `supabase/migrations/20260616142000_e18_commercial_activation_base_records.sql`
    - `supabase/snippets/e18_commercial_activation_base_records_verify.sql`
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
    - `package-lock.json`
  - Excluídos: N/A.
- Updates:
  - Aplicados: N/A.

18.2.3 Primeiro recorte implementado
- Status: Implementado em 15/06/2026.
- Conteúdo:
  - Recorte limitado a `template_family = commercial_activation`.
  - Composição versionada separada por template + taxon.
  - Artefato publicado separado da composição, com rastreabilidade de template, composição, taxon e pesquisas.
  - Seleção do template iniciada em `content_template_taxons`.
  - Runtime server-side valida composição, artefato publicado e fontes de pesquisa antes de retornar o bundle.
  - Sem vínculo elegível ou composição ativa, o runtime retorna `composition_not_found`, sem fallback implícito.
  - Migration aplicada e verificada no Supabase real.
  - Runtime validado com `npm ci`, `npm run check` e previews aprovados.

18.2.4 Contratos e renderer de `commercial_activation`
- Status: Fase 1 concluída e mergeada no PR #392 em 16/06/2026.
- Conteúdo:
  - Implementados `content_json` v1, validação Zod server-side, registry fechado, resolver e `CommercialActivationRenderer`.
  - Catálogo inicial com oito variantes transversais.
  - Fixture sintética, casos executáveis de validação e testes manuais desktop/mobile aprovados.

18.2.5 Registros-base de `commercial_activation`
- Status: Fase 2 concluída e mergeada no PR #393 em 16/06/2026.
- Conteúdo:
  - Migration aplicada e confirmada no Supabase real.
  - Registrados um template-base de página e oito módulos de seção, todos na versão 1, ativos e com `payload_json = {}`.
  - Confirmados nove registros, unicidade funcional, zero vínculos com taxons e RLS ativa.
  - Grants confirmados: `service_role` com `SELECT`; `anon` e `authenticated` sem `SELECT`.

18.3 Consumo pela E10.7 e limites do recorte comercial

18.3.1 Objetivo e status
- Objetivo: Explicitar a dependência entre a base transversal mínima da E18 e o consumo real pela E10.7, preservando os limites do recorte comercial e mantendo LP Builder separado na E19.
- Status: E10.7 aprovada como primeiro consumidor real da base E18; composição, conteúdo por taxon, integração, fallback e tracking permanecem sob responsabilidade da E10.7; LP Builder permanece separado na E19.

18.3.2 Registros do recorte
- Banco:
  - Criados: N/A.
  - Ajustados: N/A.
- Repositório:
  - Criados: N/A.
  - Ajustados: N/A.
  - Excluídos: N/A.
- Updates:
  - Aplicados: N/A.

18.3.3 Dependência e validação
- Status: Dependência estrutural definida e validação atribuída ao consumidor real.
- Conteúdo:
  - E18 — base transversal mínima → dependência estrutural da E10.7.
  - E10.7 — primeiro consumidor real → valida e ajusta a base da E18.
  - A abstração transversal deve evoluir somente com evidência obtida no piloto e em um segundo taxon.
  - A E10.6 permanece fora dessa infraestrutura e continua como fallback genérico concluído.

18.3.4 Fora do recorte comercial
- Status: Fora do segundo recorte.
- Conteúdo:
  - implementação de e-mail, WhatsApp, Instagram ou TikTok
  - editor visual
  - criação dinâmica de componentes pelo banco
  - testes A/B
  - múltiplos templates ativos sem caso real
  - geração multicanal
  - arquitetura completa para todos os canais
  - catálogo extenso sem uso comprovado
  - vínculo entre template e taxon;
  - composição específica por taxon;
  - pesquisas e itens estruturados;
  - conteúdo e artefato comercial por taxon;
  - resolução hierárquica;
  - integração com `/a/[account]`;
  - fallback e tracking da E10.7.

18.3.5 Recorte aprovado para consumo pela E10.7
- Status: Aprovado para consumo pela E10.7.
- Conteúdo:
  - A E10.7 reutilizará a base transversal já concluída: template `commercial_activation`, módulos existentes, composição ativa, renderer existente, `content_artifacts` e `content_artifact_research_sources`.
  - Manter `research_version = 1` e `business_buyer` como `audience_scope` do artefato publicado.
  - Registrar em `content_artifact_research_sources` somente fontes compatíveis com `business_buyer`; pesquisas `end_customer` entram apenas no `provenance_json`.
  - Não alterar a FK composta de `content_artifact_research_sources` nesta etapa, não criar nova tabela e não resolver versões independentes por bloco agora.
  - A E10.7 pode exigir migration técnica mínima limitada a viabilizar escrita administrativa controlada. Possíveis alvos: grants, policies, adapter/RPC e função transacional de publicação.
  - A publicação deve arquivar o `published` anterior e publicar o novo `draft` na mesma operação segura.
  - A escrita administrativa precisa estar viabilizada antes da persistência do draft.

18.4 Parametrização raiz da família `landing_page`

18.4.1 Objetivo e status

* Objetivo: Consolidar a parametrização raiz versionada que define os parâmetros comuns da família `landing_page`.
* Status: Concluída como implementação repo-only em 13/07/2026, com ciclo de vida inicial `hypothesis`.

18.4.2 Registros do recorte

* Repositório:

  * Criados:

    * `lib/conversion-content/landing-page/contracts.ts`
    * `lib/conversion-content/landing-page/index.ts`
    * `lib/conversion-content/landing-page/root-registry.ts`
    * `lib/conversion-content/landing-page/root-resolver.ts`
    * `lib/conversion-content/landing-page/root-schema.ts`
    * `lib/conversion-content/landing-page/root-validation-cases.ts`
  * Ajustados:

    * `lib/conversion-content/index.ts`
    * `package.json`
  * Excluídos:

    * `lib/conversion-content/landing-page/composition-validator.ts`
    * `lib/conversion-content/landing-page/fixture.ts`
    * `lib/conversion-content/landing-page/registry.ts`
    * `lib/conversion-content/landing-page/render-model.ts`
    * `lib/conversion-content/landing-page/renderer.tsx`
    * `lib/conversion-content/landing-page/schemas.ts`
    * `lib/conversion-content/landing-page/validation-cases.ts`

18.4.3 Fonte canônica e versionamento

* Status: Implementados.
* Conteúdo:

  * Registry raiz versionado como fonte canônica.
  * Resolução por versão registrada, sem fallback implícito.
  * Ciclo de vida inicial mantido como `hypothesis`.

18.4.4 Parâmetros semânticos e editoriais

* Status: Implementados na raiz.
* Conteúdo:

  * Papéis comuns, faixas recomendadas e limites técnicos absolutos.
  * Valores exatos mantidos no registry canônico.

18.4.5 Limites e evolução

* Status: Definidos.
* Conteúdo:

  * Faixas recomendadas orientam a geração.
  * Limites absolutos bloqueiam valores inválidos.
  * Ampliação de limite absoluto exige nova versão raiz.

18.4.6 Critérios visuais e responsivos

* Status: Implementados na raiz.
* Conteúdo:

  * Critérios abstratos visuais, responsivos e de acessibilidade.
  * Contrato detalhado mantido no registry canônico.

18.4.7 Presets e espaçamento

* Status: Implementados e versionados.
* Conteúdo:

  * Presets raiz e opções permitidas de espaçamento.
  * Chaves e valores exatos mantidos no registry canônico.

18.4.8 Resolver e validação

* Status: Implementados.
* Conteúdo:

  * Schema estrito, resolução determinística e saída imutável.
  * Falha fechada para versão, preset ou contrato inválido.
  * Validação executável própria da parametrização raiz.

18.4.9 Limites do recorte

* Status: Preservados.
* Conteúdo:

  * A implementação antiga de composição e renderização foi removida.
  * O catálogo histórico de módulos, variantes e especializações do recorte 18.5 foi retirado pela E22.1.5, sem alterar esta parametrização raiz.
  * Não houve alteração de banco nem consumo real por LP.
  * Os parâmetros permanecem como hipótese até validação por LP real.

18.5 Parametrização de módulos e variantes `landing_page`

18.5.1 Objetivo e status
- Objetivo histórico: manter um catálogo repo-only versionado de módulos e variantes da família `landing_page`.
- Status: Retirada concluída pela E22.1.5 em 19/08/2026 após merge do PR #783 e QA pós-merge aprovado em produção, sem consumidor no caminho canônico.
- Destino: sem substituto. A parametrização raiz da E18.4 e o catálogo de entradas da E20.2 permanecem preservados e independentes.

18.5.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
  - Excluídos:
    - `lib/conversion-content/landing-page/module-catalog/`

19. E19 — LP Builder
- Objetivo: Consolidar o fluxo Core de landing pages por conta, da identidade mínima em `draft` às futuras etapas de geração, revisão, materialização e publicação, sempre por recortes aprovados.
- Status: E19.1, E19.2 e E19.3 concluídas. E19.4.3, E19.4.4 e E19.4.5 concluídas; a E19.4 está encerrada e integrada à `main` pelo PR #776. A revisão 3 permanece preservada como baseline dos gaps persuasivos observados. A E19.5.3 está concluída e operacional em Preview e Production após os gates pós-merge e os smokes autenticados com a E20.2 v5.

19.1 Criação produtiva mínima de LP por conta

19.1.1 Objetivo e status
- Objetivo: Criar a identidade mínima de uma LP real pertencente à conta, sem antecipar geração de conteúdo, revisão ou publicação.
- Status: Concluído em 30/06/2026.

19.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_landing_pages`
    - `account_landing_pages_select_member_or_platform`
    - `account_landing_pages_set_updated_at`
- Repositório:
  - Criados:
    - `app/lp-builder/actions.ts`
    - `lib/lp-builder/contracts.ts`
    - `lib/lp-builder/adapters/landingPagesAdapter.ts`
    - `lib/lp-builder/index.ts`
    - `supabase/migrations/20260630210213_e19_account_landing_pages.sql`
    - `supabase/snippets/e19_account_landing_pages_verify.sql`
- Referências:
  - Contrato de banco: `docs/schema.md` — `account_landing_pages`.
  - Plano encerrado: `docs/lousa-plano-base-E19.md`.

19.1.3 Identidade mínima e persistência
- Status: Implementadas.
- Conteúdo:
  - A LP nasce com status inicial `draft` e pertence a uma conta.
  - A persistência mínima ocorre em `public.account_landing_pages`.
  - Nome não pode ser vazio.
  - Slug segue formato seguro e é único por conta.

19.1.4 Gate comercial e operacional
- Status: Implementado server-side antes da persistência.
- Conteúdo:
  - A criação exige conta `active`.
  - A criação exige membership `active` com papel `owner` ou `admin`.
  - A criação exige entitlement comercial válido via E9.
  - Ausência de entitlement falha fechado antes do insert.
  - O recorte não resolve taxon, pesquisas, catálogo de entradas ou perfil de orientação.

19.1.5 Boundary e limites do recorte
- Status: Consolidados.
- Conteúdo:
  - E19 pertence à camada Core; o boundary vigente é `lib/lp-builder/` e a action server-side canônica é `app/lp-builder/actions.ts`.
  - Account Dashboard, Admin Dashboard e Partner Dashboard podem fornecer superfícies consumidoras, mas não são proprietários do domínio da E19.
  - O recorte concluído não gera conteúdo, não coleta valores da E20.2, não compõe E10.8/E18.4/E18.5/E20.2/E20.3 e não cria snapshot.
  - Revisão, materialização, renderer, publicação, edição, regeneração e evolução entre planos permanecem para o plano-base próprio da próxima evolução da E19.
  - Editor visual, domínio customizado, analytics, teste A/B, automação, agente, job e rotina recorrente permanecem fora deste recorte.

19.2 Onboarding e configuração mínima da conta para LP Starter

19.2.1 Objetivo e status
- Objetivo: Criar a experiência pós-entitlement que configura a conta e os valores mínimos necessários para iniciar a primeira LP Starter, sem gerar conteúdo, materializar a LP final ou publicar.
- Status: Concluído: PR #700 mergeado, migration aplicada, verificador SQL read-only aprovado e validação funcional hospedada autenticada concluída.

19.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/lp-builder/onboardingConfiguration.ts`
    - `lib/lp-builder/adapters/onboardingConfigurationAdapter.ts`
    - `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`
    - `lib/lp-builder/validation-cases.ts`
    - `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`
    - `app/a/[account]/_components/OnboardingCompletionJourney.tsx`
    - `app/a/[account]/_components/onboarding-configuration-action-contract.ts`
    - `app/a/[account]/_components/onboarding-journey-policy.ts`
    - `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
    - `app/a/[account]/onboarding-configuration-actions.ts`
    - `supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql`
    - `supabase/snippets/e19_2_3_account_landing_page_onboarding_configuration_verify.sql`
    - `supabase/tests/e19_2_3_account_landing_page_onboarding_configuration.test.sql`
  - Ajustados:
    - `lib/lp-builder/contracts.ts`
    - `lib/lp-builder/index.ts`
    - `app/a/[account]/page.tsx`
    - `package.json`
- Updates:
  - Aplicados:
    - `supa#40`
    - `prod#14`
    - `prod#17`

19.2.3 Contrato de configuração, completude e persistência mínima
- Status: Implementado e validado após o merge: migration aplicada e verificador SQL hospedado aprovado.
- Conteúdo:
  - O boundary `lib/lp-builder/` resolve o catálogo E20.2 por versão e taxonomia autoritativa, valida valores por `fieldKey` e escopo, reutiliza fontes autoritativas sem duplicá-las e deriva completude sem `onboarding_status`.
  - A persistência candidata usa um agregado 1:1 por conta, revisão otimista, FK tenant-safe e vínculo de `landing_page_id` write-once; o Data API permanece restrito ao adapter server-only com `service_role`, sem grants de cliente ou DELETE operacional.
  - O runtime distingue ausência legítima, objeto ainda indisponível e falha operacional; nenhum `draft`, bucket, upload, Storage, UI ou infraestrutura de assets foi criado nesta subseção.
  - Casos executáveis cobrem progresso parcial, completude derivada, precedência autoritativa, isolamento por conta, ator autorizado, contrato da migration, concorrência otimista e proteções de vínculo.

19.2.4 Jornada guiada pós-entitlement e retomada
- Objetivo: Substituir a permanência na experiência comercial por uma jornada curta de onboarding quando a conta elegível estiver incompleta.
- Status: Implementado e validado na jornada hospedada autenticada.
- Conteúdo:
  - A superfície autenticada deriva os estados comercial, onboarding, operacional e bloqueado a partir de papel, entitlement e configuração; conta sem entitlement preserva a experiência comercial e objeto de configuração ainda indisponível mantém o fallback anterior.
  - Owner ou admin elegível com configuração incompleta recebe uma jornada responsiva em dois passos, com taxon somente leitura, valores autoritativos reutilizados e campos existentes derivados do catálogo E20.2, sem lista de domínio paralela.
  - Avançar, voltar e sair salvam o agregado por Server Action fina e boundary `lib/lp-builder/`; erro localizado preserva os demais valores e conflito de revisão solicita recarga explícita.
  - A jornada usa componentes vigentes, associação entre label, hint e erro, foco após transição ou falha, alvos de ação ampliados e operação por teclado; identidade visual, logo, draft, geração, tracking e IA permanecem fora desta subseção.

19.2.5 Identidade visual mínima da conta
- Objetivo: Permitir confirmar a identidade visual mínima necessária ao Starter sem IA e sem tornar logo obrigatório.
- Status: Implementado e validado na jornada hospedada autenticada.
- Conteúdo:
  - A E19.2.5 adiciona um terceiro passo à jornada, com três paletas iniciais e edição humana dos cinco papéis canônicos `primary`, `secondary`, `accent`, `background` e `text`, sem catálogo paralelo de campos.
  - O boundary valida formato e contraste de modo determinístico: texto exige razão mínima 4,5:1 contra o fundo e cores principal, secundária e de destaque exigem 3:1.
  - Somente paleta válida pode ser persistida e participar da completude derivada; a prévia exibe leitura e destaques antes do save.
  - Logo permanece opcional e ausente quando não existe referência canônica autoritativa; nenhum campo livre, upload, bucket, Storage, Blob, URL ou infraestrutura de assets foi criado, e referência não autoritativa não é persistida pelo runtime.

19.2.6 Revisão, conclusão e transição para LP `draft`
- Objetivo: Concluir a configuração derivada e transferir a conta para o espaço operacional sem criar LP antes da hora.
- Status: Implementado e validado no fluxo hospedado autenticado integrado.
- Conteúdo:
  - Configuração completa sem vínculo entra em revisão final; configuração incompleta não consulta nem cria LP, e configuração já vinculada segue para o estado operacional sem persistir `onboarding_status`.
  - A leitura server-only do boundary `lib/lp-builder/` retorna zero, um ou vários drafts legítimos da conta em ordem determinística e preserva falha operacional como erro, sem consulta direta da página, UI ou Server Action a `account_landing_pages`.
  - Zero drafts permite criação explícita pelo fluxo E19.1; um ou vários drafts exigem seleção humana explícita, sem escolha silenciosa, duplicação automática ou limite de quantidade antecipado.
  - O agregado é vinculado somente ao draft escolhido da mesma conta, com revisão otimista, predicado de ausência de vínculo e mutação limitada a uma linha; valores não são copiados para `account_landing_pages` e rebind permanece proibido.
  - A transição não inicia geração, revisão de copy, publicação, tracking, CRM, capability nova ou infraestrutura de assets.

19.2.7 Evolução do catálogo operacional e handoff para E19.5

19.2.7.1 Objetivo e status
- Objetivo: Permitir que o onboarding pré-handoff opere contra a versão E20.2 explicitamente revisada para o taxon, preserve valores válidos durante a evolução e deixe E19.5 como única autoridade operacional após o vínculo da primeira jornada.
- Status: Implementação do boundary concluída no PR #802; a E20.2 v5 está executável e operacionalmente autorizada para o taxon servido `Corretor Imóveis` (`corretor-imoveis`) por `reviewed_input_catalog_version = 5`.

19.2.7.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/lp-builder/contracts.ts`
    - `lib/lp-builder/index.ts`
    - `lib/lp-builder/adapters/onboardingConfigurationAdapter.ts`
    - `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`
    - `lib/lp-builder/validation-cases.ts`
    - `app/a/[account]/onboarding-configuration-actions.ts`
    - `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`
    - `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
- Referências:
  - Plano do recorte: `docs/lousa-plano-base-e19-2.md` — 3.6.
  - Autoridade E20.6: `docs/lousa-plano-base-e20-6.md` — preparação por versão revisada.
  - Handoff operacional: `docs/lousa-plano-base-e19-5.md` — fronteira E19.2/E19.5.

19.2.7.3 Autoridade pré-handoff e revalidação
- Status: Implementado no boundary server-side.
- Conteúdo:
  - A E19.2 consome `loadTaxonPreparationForReviewedVersion` para resolver `reviewed_input_catalog_version` do taxon servido; a versão enviada pelo client e qualquer `latest`, maior chave ou fallback deixam de ser autoridade.
  - Antes do handoff, a configuração é resolvida pelo catálogo autorizado, preserva valores ainda válidos e pode evoluir `catalog_version` do agregado após revalidação e persistência válidas; a completude continua derivada e novos obrigatórios permanecem pendentes até preenchimento humano.
  - Ausência, divergência, versão não executável ou falha da preparação bloqueiam fechado. A E19.2 não promove a v5; somente a consome quando o taxon a autoriza pela E20.6.

19.2.7.4 Handoff e UI declarativa
- Status: Implementado conforme o contrato do plano-base.
- Conteúdo:
  - Após o handoff válido da E19.2, o agregado permanece bootstrap/histórico, não sofre novas atualizações operacionais nem serve fallback; E19.5 assume a autoridade operacional, com materialização de suas residências somente de forma lazy.
  - A jornada remove a autoridade do hidden `catalog_version`, continua derivando fields, tipos, obrigação, opções e condições do E20.2 resolvido e usa humanização localizada de `fieldKey` apenas quando não há label amigável existente; paleta e logo mantêm suas especializações.
  - Não houve nova persistência, migration, schema, estado de migração, registry paralelo, backfill, upload ou infraestrutura de assets.

19.2.7.5 Validação e autoridade vigente
- Status: Validado nos casos focais locais com a v5 executável; avaliação E20.6 suficiente sem gaps candidatos e decisão administrativa humana confirmada para o taxon servido.
- Conteúdo:
  - Os casos executáveis cobrem evolução pré-handoff com versão autorizada executável, preservação de valor, payload de client adulterado sem efeito, autoridade ausente/divergente, isolamento tenant-safe e bloqueio de atualização após handoff; os validadores de catálogo, preparação E20.6, contexto de geração e jornada permanecem aprovados.
  - Após a reconciliação com a `main` que contém o PR #803, os casos comprovam literalmente o agregado histórico/current em v2, a autoridade operacional simulada em v5, a preservação de valores válidos, `business_offerings_summary` opcional, `primary_conversion_goal` obrigatório, incompletude sem esse valor e evolução confirmada de `catalog_version` para 5.
  - A autoridade operacional real registra `reviewed_input_catalog_version = 5` para `Corretor Imóveis` (`corretor-imoveis`); a E19.2 consome esse estado sem fallback ou inferência e não o promove.

19.3 Pacote autorizado para geração no Cenário E

19.3.1 Objetivo e status
- Objetivo: manter a E19.3 como o menor boundary determinístico entre as fontes autorizadas do projeto e a E19.4, entregando um único pacote autorizado com pesquisa integral, fatos concretos revalidados, limites editoriais e contexto operacional.
- Status: Concluída; implementação validada e mergeada pelo PR #757 no contrato v3.

19.3.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/a/[account]/page.tsx`
    - `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    - `lib/lp-builder/adapters/generationContextAdapter.ts`
    - `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    - `lib/lp-builder/generation-context-validation-cases.ts`
    - `lib/lp-builder/generationContext.ts`
    - `lib/lp-builder/generationContextContracts.ts`
    - `lib/lp-builder/index.ts`
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `package.json`
  - Excluídos:
    - `app/a/[account]/_components/LandingPageDraftJourney.tsx`
    - `app/a/[account]/_components/landing-page-generation-action-contract.ts`
    - `app/a/[account]/landing-page-actions.ts`
    - `app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx`
    - `lib/conversion-content/landing-page/materialization.ts`
    - `lib/conversion-content/landing-page/materialized-renderer.tsx`
    - `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageGenerationOpenAiAdapter.ts`
    - `lib/lp-builder/adapters/landingPageMaterializationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageMaterializationAdapterCore.ts`
    - `lib/lp-builder/adapters/landingPagePreviewAdapter.ts`
    - `lib/lp-builder/adapters/materializeFirstLandingPageDraftAdapter.ts`
    - `lib/lp-builder/landing-page-generation-validation-cases.ts`
    - `lib/lp-builder/landing-page-materialization-validation-cases.ts`
    - `lib/lp-builder/landing-page-preview-validation-cases.tsx`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageGeneration.ts`
    - `lib/lp-builder/landingPageGenerationContracts.ts`
    - `lib/lp-builder/landingPageMaterialization.ts`
    - `lib/lp-builder/landingPageMaterializationContracts.ts`
    - `lib/lp-builder/landingPagePreview.ts`
    - `lib/lp-builder/materializeFirstLandingPageDraft.ts`
- Updates:
  - Aplicados:
    - `prod#19`
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — 3.14.4.
  - Configuração operacional: `docs/platform-config.md` — configuração efetiva dos workloads OpenAI de produto.
  - Plano-base v2 aprovado: `docs/lousa-plano-base-e19-3.md`.

19.3.3 Contrato v3, pesquisa integral e revalidação
- Status: Concluída e mergeada pelo PR #757.
- Conteúdo:
  - A interface permanece exatamente `identities + modelContext + serverContext` e usa exclusivamente `contractVersion: 3`, sem alias ou fallback para v2.
  - A operação aditiva `loadTaxonPreparationForReviewedVersion` faz uma única leitura canônica, usa a versão E20.2 revisada persistida como requisito explícito e preserva integralmente `loadTaxonPreparationForVersion` e seu controle negativo de incompatibilidade.
  - A resolução usa o plano efetivo atual e a cadeia taxonômica autoritativa completa pelo resolver canônico, sem constante fixa, `latest`, maior versão do registry, slug ou layer codificado.
  - Os valores históricos da E19.2 são revalidados read-only contra o catálogo efetivo, mantendo distintas e auditáveis a versão original da configuração e a versão E20.2 efetivamente usada.
  - Novo field obrigatório aplicável, valor ausente ou incompatível retorna como gap factual à E19.2; defeito de catálogo, cadeia ou resolver retorna à E20.2, sem correção silenciosa ou regravação da configuração histórica.
  - A pesquisa integral `end_customer` selecionada pela E20.5 chega ao `modelContext` sem resumo, atomização, ranking, seleção semântica, filtragem editorial ou leitura filesystem duplicada; `business_buyer` permanece ausente do contexto do modelo, sem depender do boundary histórico E10.8.
  - Fatos permanecem separados por `valueType`, com valores operacionais brutos fora do `modelContext` e sem path físico da pesquisa no contrato entregue à E19.4.
  - A prova read-only no draft real confirmou `E19.2 v2 → E20.2 v4`, pesquisa integral `end_customer` v1, separação entre fatos semânticos e operacionais, ausência de path físico e imutabilidade profunda como primeiro caso do mecanismo genérico temporal e taxonômico.
  - `npm ci`, `npm run check`, os validadores focais e `git diff --check` foram aprovados; o lint permaneceu sem erros e seus warnings preexistentes não ampliaram o recorte.
  - A E19.3 não implementa a E19.4, não chama OpenAI, não escolhe composição, não materializa conteúdo e não renderiza a landing page.

19.4 Geração e materialização da landing page em `draft`

19.4.1 Objetivo e status
- Objetivo: gerar, validar, materializar e visualizar privadamente a primeira LP real em `draft` a partir do pacote v3 da E19.3, com revisões append-only, mídia privada estável e prova humana.
- Status: E19.4.3, E19.4.4 e E19.4.5 concluídas e aprovadas em 18/08/2026. A primeira prova real confirmou o pipeline e o Preview; os gaps persuasivos da revisão 3 permanecem registrados como baseline de calibração futura, sem iniciar E19.5.

19.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.append_account_landing_page_materialization_v1(uuid, uuid, uuid, jsonb, jsonb, uuid)`
    - `landing-page-revision-assets`
  - Ajustados:
    - `public.account_landing_page_materializations`
- Repositório:
  - Criados:
    - `app/a/[account]/landing-pages/[landingPageId]/preview/`
    - `app/a/[account]/landing-pages/[landingPageId]/preview/loading.tsx`
    - `components/lp-builder/LandingPageRenderer.tsx`
    - `lib/conversion-content/landing-page/presentation/`
    - `lib/lp-builder/adapters/landingPageDraftCandidateWorkflowAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftImageGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftAdapter.ts`
    - `lib/lp-builder/adapters/landingPagePreviewAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionReadinessAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionStorageAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionWorkflowAdapter.ts`
    - `lib/lp-builder/landing-page-draft-generation-validation-cases.ts`
    - `lib/lp-builder/landing-page-preview-validation-cases.tsx`
    - `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageDraftImageGeneration.ts`
    - `lib/lp-builder/landingPageDraftWorkflow.ts`
    - `lib/lp-builder/landingPagePreview.ts`
    - `lib/lp-builder/landingPageRevision.ts`
    - `lib/lp-builder/landingPageRevisionWorkflow.ts`
    - `supabase/migrations/20260817180000_e19_4_4_landing_page_revisions.sql`
    - `supabase/snippets/e19_4_4_landing_page_materializations_verify.sql`
    - `supabase/tests/e19_4_4_landing_page_materializations.test.sql`
  - Ajustados:
    - `app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx`
    - `app/admin/(protected)/workloads-openai/page.tsx`
    - `lib/conversion-content/landing-page/generation-profile/validation-cases.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    - `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    - `lib/lp-builder/adapters/generationContextAdapter.ts`
    - `lib/lp-builder/generation-context-validation-cases.ts`
    - `lib/lp-builder/index.ts`
    - `lib/openai-workloads/`
    - `next.config.js`
    - `package.json`
- Updates:
  - Aplicados na E19.4.3/E19.4.4:
    - `supa#5`
    - `supa#40`
    - `supa#47`
    - `prod#6`
  - Aplicados na E19.4.5:
    - `prod#14`
    - `prod#16`
    - `prod#17`
- Referências:
  - Plano-base aprovado: `docs/lousa-plano-base-e19-4.md`.
  - Matriz auditada: `docs/matriz-consolidacao-e19-4.md`.
  - Contrato técnico: `docs/base-tecnica.md`.
  - Contrato de banco: `docs/schema.md`.
  - Configuração operacional: `docs/platform-config.md`.
  - Modelos e workloads: `docs/openai-model-snapshot.md`.
  - Automação controlada: `docs/automations.md`.

19.4.3 Geração controlada e validação integral da candidata
- Status: concluída e aprovada nos gates hospedados em 18/08/2026.
- Automações: sim — `2.1.3`, IA em fluxo controlado no runtime do LP Factory.
- Conteúdo:
  - a autoridade de apresentação v1, o DTO discriminado, o Structured Output estrito, os validators determinísticos e o prompt `e19.4-presentation-v2` estão implementados a partir da autoridade canônica da E18.4;
  - o workload textual `landing_page_draft_generation` usa uma única chamada a `gpt-5.6-luna`, `reasoning.effort=max`, `store:false` e nenhuma política de retry ou fallback;
  - o workload separado `landing_page_draft_image_generation` usa `gpt-image-2` com configuração própria e sem transportar parâmetros exclusivos do workload textual;
  - `modelContext.facts` é a única autoridade para fatos objetivos; `modelContext.research` permanece contexto consultivo para narrativa, dores e linguagem, sem autorizar preço, disponibilidade, localização, credencial, prova social, resultado, pessoa ou cliente;
  - o canal primário é lido exclusivamente de `modelContext.facts` e o destino operacional correspondente de `serverContext.facts`, preservando bindings determinísticos e mantendo dados operacionais brutos fora do modelo;
  - o workflow possui um único ownership de `requestId`, preserva `attemptId` e os pontos de injeção determinística e registra observabilidade segura para preparação e falhas HTTP do provider;
  - a projeção destinada ao provider preserva a autoridade Zod e converte somente a união conhecida das oito variantes de seção para `anyOf`, falhando fechado diante de qualquer `oneOf` inesperado;
  - por decisão humana, o gate originalmente previsto de canários isolados sem persistência foi substituído pelo primeiro append integrado do fluxo oficial; as duas execuções integradas posteriores comprovaram os workloads textual e de imagem e o caminho oficial sem retry ou fallback;
  - o segmento produtivo permanece configurado com `maxDuration = 300`; deployment READY e duas execuções integradas completas sem timeout incompatível corroboraram operacionalmente esse gate.

19.4.4 Revisões append-only, mídia e snapshot imutável
- Status: concluída e aprovada nos gates hospedados em 18/08/2026.
- Automações: não.
- Conteúdo:
  - a migration `20260817180000_e19_4_4_landing_page_revisions.sql` foi aplicada oficialmente e o readiness hospedado confirmou `ready: true` e `schema_version: 1`;
  - `account_landing_page_materializations` opera em 1:N append-only, com PK em `id`, numeração positiva, unicidade por LP/revisão, `attempt_id` idempotente e revisão corrente definida pela maior numeração;
  - a materialização histórica foi preservada como revisão 1 e os dois appends controlados criaram as revisões 2 e 3, com três conteúdos e três snapshots distintos e sem overwrite;
  - a revisão 2 foi persistida como `963f0a37-8dd3-4240-9f31-8072aef40d60`, com `requestId d227c031-5068-499d-aeb8-a0b5f723ccf2` e `attemptId 41ced98d-331a-4e46-914e-c28e3b026802`;
  - a revisão 3 foi persistida como `ab332478-c504-425a-a6bc-993d31142449`, com `requestId 8c67dfd6-d7c8-4bb0-9955-09fc9f988cef` e `attemptId dec1251f-297e-418a-93b5-e2722f773dcd`;
  - P-01 foi comprovado ponta a ponta pela correspondência de `requestId` e `attemptId` entre compilação, workloads e snapshots persistidos;
  - P-02 foi comprovado em runtime porque as duas execuções passaram pelos providers, pela nova validação de acesso, conta, ator e entitlement e pelo append transacional;
  - o verificador SQL read-only retornou `ok` para colunas, constraints e índices, invariantes de revisão, prova de múltiplas revisões, projeção da revisão corrente, segurança, bucket e policies de Storage;
  - RLS permanece habilitada, sem policies diretas; `service_role` possui leitura e execução do RPC, mas não escrita direta, e `anon` e `authenticated` não executam o append;
  - o bucket `landing-page-revision-assets` é privado, aceita WebP conforme o limite aprovado e não possui policy pública ou autenticada;
  - os dois novos snapshots referenciam dois paths canônicos distintos, não-URL, e os dois objetos correspondentes existem no Storage;
  - a revisão corrente é a revisão 3.

19.4.5 Visualização privada e prova humana da primeira LP real
- Status: concluída, aprovada e integrada à `main` pelo PR B #776 em 18/08/2026. A revisão 3 permanece como baseline da primeira prova real e dos gaps persuasivos identificados; nenhuma calibração posterior ou E19.5 foi iniciada.
- Automações: não.
- Conteúdo:
  - a rota privada reutilizada carrega a revisão corrente sob nova validação de ator, conta, membership, entitlement, LP em `draft` e tenant da revisão, com estados fail-closed para indisponibilidade, acesso negado e conteúdo inválido;
  - o read model usa allowlist explícita do conteúdo e snapshot persistidos, recebe URL assinada server-side com TTL de 300 segundos e não expõe `DBRow`, contexto de pesquisa, valores operacionais, bucket, path, autenticação ou provider;
  - o renderer é puro, read-only e cobre as oito variantes do contrato v1 sem reler E19.3, chamar Supabase, provider ou qualquer fonte mutável;
  - a prova hospedada da revisão corrente 3 (`revisionId ab332478-c504-425a-a6bc-993d31142449`, `attemptId dec1251f-297e-418a-93b5-e2722f773dcd`) confirmou imagem privada, CTA WhatsApp, ausência de overflow em 360, 768 e 1280 px, console limpo, estados de erro, foco/teclado, contraste e isolamento tenant-safe;
  - no veredito humano, adequação público/oferta foi aprovada; imagem foi aprovada com ressalva de genericidade; CTA foi aprovado funcionalmente; jornada persuasiva, especificidade da copy e variação visual receberam ajuste necessário como aprendizado da prova, não como defeito técnico obrigatório do renderer;
  - factualidade, segurança e funcionamento foram aprovados nos três gates binários;
  - a E19.4.5 está aprovada como primeira prova real, mas a qualidade persuasiva da revisão 3 não é registrada genericamente como aprovada; repetição conceitual, linguagem genérica, baixa progressão de convicção e sensação de template permanecem baseline de calibração futura;
  - não houve revisão 4 nem ajuste ad hoc do renderer; publicação, E19.5, calibração persuasiva, editor, histórico visual, DAM, formulário, tracking, analytics, CRM, agente e filas permanecem fora do recorte.

19.5 — Workspace operacional e lifecycle da LP

19.5.1 Objetivo e status
- Objetivo: entregar o ciclo operacional reduzido para múltiplas identidades de LP por conta, com configuração contextual lazy, revisões integrais append-only, histórico, preview e aprovação humana explícita.
- Status: Concluída em 23/08/2026 após merge, apply canônico, verificações pós-apply e rollout controlado aprovado em Preview e Production.

19.5.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_landing_page_shared_configurations`;
    - `public.account_landing_page_configurations`;
    - `public.e19_5_actor_can_manage(uuid, uuid)`;
    - `public.e19_5_configuration_values_have_scopes(jsonb, text[])`;
    - `public.save_account_landing_page_configuration_v1(uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid, uuid)`;
    - `public.approve_account_landing_page_materialization_v1(uuid, uuid, uuid, uuid)`;
    - `public.append_account_landing_page_materialization_v2(uuid, uuid, uuid, jsonb, jsonb, uuid, bigint, bigint)`.
  - Ajustados:
    - `public.account_landing_pages`;
    - `public.account_landing_page_materializations`.
- Repositório:
  - Criados:
    - `app/a/[account]/_components/LandingPageWorkspace.tsx`;
    - `app/a/[account]/_components/WorkspaceSubmitButton.tsx`;
    - `app/a/[account]/workspace-actions.ts`;
    - `app/a/[account]/landing-pages/[landingPageId]/page.tsx`;
    - `app/a/[account]/landing-pages/[landingPageId]/actions.ts`;
    - `app/a/[account]/landing-pages/[landingPageId]/configuration-actions.ts`;
    - `lib/lp-builder/landingPageWorkspace.ts`;
    - `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts`;
    - `lib/lp-builder/landing-page-workspace-validation-cases.ts`;
    - `supabase/migrations/20260822170000_e19_5_3_landing_page_workspace.sql`;
    - `supabase/snippets/e19_5_3_landing_page_workspace_verify.sql`;
    - `supabase/tests/e19_5_3_landing_page_workspace.test.sql`.
  - Ajustados:
    - `app/a/[account]/page.tsx`;
    - `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`;
    - `app/a/[account]/_components/onboarding-configuration-action-contract.ts`;
    - `app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx`;
    - `app/a/[account]/landing-pages/[landingPageId]/preview/GenerationTrigger.tsx`;
    - `app/a/[account]/landing-pages/[landingPageId]/preview/actions.ts`;
    - `lib/lp-builder/contracts.ts`;
    - `lib/lp-builder/index.ts`;
    - `lib/lp-builder/generationContext.ts`;
    - `lib/lp-builder/generationContextContracts.ts`;
    - `lib/lp-builder/adapters/generationContextAdapter.ts`;
    - `lib/lp-builder/adapters/generationContextAdapterCore.ts`;
    - `lib/lp-builder/landingPageRevision.ts`;
    - `lib/lp-builder/landingPagePreview.ts`;
    - `lib/lp-builder/adapters/landingPagePreviewAdapter.ts`;
    - `lib/lp-builder/adapters/landingPageRevisionAdapter.ts`;
    - `lib/lp-builder/landingPageDraftGeneration.ts`;
    - `lib/lp-builder/generation-context-validation-cases.ts`;
    - `lib/lp-builder/landing-page-draft-generation-validation-cases.ts`;
    - `lib/lp-builder/landing-page-preview-validation-cases.tsx`;
    - `package.json`.
- Referências:
  - Plano-base aprovado: `docs/lousa-plano-base-e19-5.md` — seções 1, 2 e 3.
  - Contrato de banco: `docs/schema.md` — seções 1.9, 1.27, 1.31, 1.32 e 3.8.
  - Contrato técnico: `docs/base-tecnica.md` — seções 3.14.4 e 3.15.9.
  - Configuração operacional: `docs/platform-config.md` — seção 3.5.
  - Contrato visual: `docs/design-system.md` — Workspace operacional do Account Dashboard.

19.5.3 Workspace operacional reduzido, configuração e aprovação da LP
- Status: Concluída em 23/08/2026, com implementação integrada à `main`, banco validado e operação autenticada aprovada em Preview e Production.
- Conteúdo:
  - o Account Dashboard ganha workspace master-detail paginado, uma entrada por identidade de LP, cinco estados de UX derivados, criação explícita para owner/admin e leitura integral sem mutações para viewer;
  - a configuração reutiliza declarativamente o catálogo E20.2 v5 e separa fisicamente scopes compartilhados `account/business` dos contextuais `offer/campaign/landing_page`, sem lista paralela, placeholder, precriação, backfill, `is_initialized` ou completude persistida;
  - `primary_conversion_goal` é obrigatório e participa do núcleo de identidade após a primeira revisão válida que o contenha; `business_offerings_summary` é opcional, reside no compartilhado e sua ausência isolada não bloqueia completude;
  - o handoff da E19.2 é lazy e vinculado à LP exata; depois que a residência operacional existe, o agregado histórico permanece apenas como bootstrap/proveniência e não serve fallback concorrente;
  - o save das duas residências é atômico, `SECURITY INVOKER`, versionado e protegido por revisões otimistas independentes; no-op não incrementa, e conflito preserva integralmente o estado anterior;
  - geração e revalidação exigem literalmente a v5 e igualdade exata com `reviewed_input_catalog_version`, falhando fechado para ausência, divergência, versão não executável ou erro; não existe fallback para v4, `latest`, maior versão ou versão implícita;
  - novas revisões usam snapshot v2/contexto v4 com proveniência das residências; readers aceitam somente os pares históricos v1/contexto v3 e atuais v2/contexto v4, sem cruzamento ou reinterpretação retroativa;
  - histórico e preview são carregados sob demanda por LP; o preview pode abrir a revisão mais recente ou uma revisão histórica e a aprovação idempotente move somente o ponteiro tenant-safe da revisão aprovada;
  - os testes determinísticos cobrem v5, `primary_conversion_goal`, ausência válida de `business_offerings_summary`, evolução histórica × operacional, mismatch E20.6, fail-closed, viewer read-only, paginação, histórico e aprovação; `npm ci`, `npm run check` e `git diff --check` foram aprovados, com 24 warnings de lint preexistentes e nenhum erro;
  - a migration foi aplicada pelo fluxo canônico; o verificador read-only e os Security Controls passaram após a correção forward-only das grants dos helpers, sem editar a migration aplicada;
  - a avaliação E20.6 da v5 e a decisão humana de suficiência permanecem concluídas para o taxon real servido `Corretor Imóveis` (`corretor-imoveis`), com `reviewed_input_catalog_version = 5` e sem gaps candidatos; o smoke hospedado confirmou o consumo operacional da v5 sem promover o marcador nem alterar a E20.6;
  - `E19_5_WORKSPACE_ENABLED` foi habilitado sequencialmente com redeploy e aprovação em Preview e Production; o smoke final confirmou workspace, configuração v5, histórico, preview e a revisão 4 já aprovada, sem gerar revisão adicional; archive/restore, publicação, editor manual, melhoria parcial por IA, hard delete, tracking, mensuração, testes A/B, catálogo avançado de ofertas e mecanismo global ou em massa permanecem fora do recorte.

20. E20 — Preparação e liberação de taxons para geração de landing pages

* Objetivo: consolidar catálogo de entradas por taxon e plano, perfis versionados de orientação à geração, herança e, em recortes futuros, prontidão e liberação antes da geração de LPs por conta.
* Status: E20.2 definida no contrato repo-only até a v5; E20.3 retirada; E20.5 concluída e ativada após merge do PR #746, apply canônico, prova SQL e smokes autenticados em Preview e Production.

20.2 Catálogo de entradas por taxon

20.2.1 Objetivo e status

* Objetivo: definir e resolver um catálogo declarativo versionado de entradas de `landing_page` por taxon e plano, separado de valores operacionais, composição, conteúdo e entitlement.
* Status: Contrato repo-only definido até a versão executável v5; consumo operacional depende de versão explicitamente requerida e de revisão compatível pela E20.6.

20.2.2 Registros do recorte

* Repositório:

  * Criados:

    * `lib/conversion-content/landing-page/input-catalog/contracts.ts`
    * `lib/conversion-content/landing-page/input-catalog/registry.ts`
    * `lib/conversion-content/landing-page/input-catalog/schema.ts`
    * `lib/conversion-content/landing-page/input-catalog/resolver.ts`
    * `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`
    * `lib/conversion-content/landing-page/input-catalog/index.ts`
    * `supabase/snippets/e20_2_taxon_chain_verify.sql`
    * `app/admin/(protected)/estrutura-lp/validation-cases.ts`
  * Ajustados:

    * `lib/conversion-content/index.ts`
    * `package.json`
    * `app/admin/(protected)/estrutura-lp/page.tsx`
    * `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`
    * `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
* Updates:

  * Aplicados: `prod#14`, `prod#16`.

20.2.3 Catálogo e resolução

* Status: Implementados.
* Conteúdo:

  * O catálogo é declarativo, versionado no repositório e resolvido por taxon e plano, sempre com versão explícita e sem fallback automático.
  * A v1 permanece integralmente preservada com os 19 campos e a ordem anteriores.
  * A v2 contém 23 campos: os 19 da v1 e os quatro mínimos do Starter — serviço ou oferta principal, descrição factual curta, referência opaca opcional de logo ou asset principal e paleta visual confirmada.
  * A v3 preserva integralmente os 23 campos, a ordem e a estrutura da v2 e acrescenta somente metadata declarativo que autoriza `financing_support_available` e `document_support_available` a sustentar `applicable_capabilities` quando o valor booleano for `true`; a v2 permanece imutável e continua validando os valores persistidos.
  * A v4 preserva integralmente os 23 campos, a ordem, as camadas, a metadata e os bindings da v3 e acrescenta somente `rent` ao final do enum de `transaction_intent`, com evidência atualizada para locação exclusiva; v1–v3 permanecem imutáveis.
  * A v5 preserva integralmente v1–v4 e acrescenta `business_offerings_summary` como contexto universal opcional de negócio e `primary_conversion_goal` como objetivo principal de conversão obrigatório da LP, com valores `contact`, `schedule`, `request_quote`, `purchase` e `register_interest`; a versão só se torna operacional para um consumidor quando é requerida explicitamente e coincide com a revisão humana registrada pela E20.6.
  * Os quatro campos da v2 permanecem disponíveis em Starter, Lite, Pro e Ultra, sem diferenças adicionais entre planos neste recorte.
  * Strings obrigatórias rejeitam valor vazio; o asset aceita somente objeto estrito com `asset_id` opaco não vazio; a paleta exige exatamente `primary`, `secondary`, `accent`, `background` e `text` em hexadecimal `#RRGGBB`.
  * Os campos criados na v2 declaram `landingPageSubstitutionPolicy`: oferta, descrição e logo usam `forbidden`, enquanto a paleta usa `explicit_allowed`; ausência da política nos campos históricos da v1 não autoriza substituição.
  * Campos próprios da LP usam `not_applicable`; campos reutilizáveis usam `forbidden` ou `explicit_allowed`. Especialização taxonômica de definições e substituição explícita de valores concretos por LP permanecem conceitos distintos, e a especialização não altera essa política.
  * A herança segue `universal → segmento → nicho → ultranicho autorizado`.
  * O ultranicho de corretor de imóveis de médio padrão herda o catálogo sem camada própria.
  * O resultado preserva versão, plano, taxon atendido, camadas aplicadas, ordem determinística, proveniência, validação, evidência e sinal de validade.
  * `requiredWhen` e `applicableWhen` permanecem declarativos e são preservados após o filtro por plano.
  * Depois do merge da v2, mudança funcional no catálogo resolvido exige nova versão; refatoração interna sem alteração do resultado e novo taxon que apenas herda campos não exigem nova versão.

20.2.4 Dependências e limites

* Status: Validados.
* Conteúdo:

  * O resolver falha fechado para cadeia, camada, especialização, condição ou relação entre planos inválida.
  * As retiradas concluídas da E20.3 e da E18.5 não alteram o catálogo, os valores nem a prontidão definidos pela E20.2.
  * A E20.2 define os campos e valida o formato dos valores; a E19.2 coleta, valida, persiste e compõe os valores, implementa a substituição explícita por LP e preserva o snapshot dos valores efetivamente usados.
  * O recorte não cria banco, migration, bucket, Storage, rota, API, Server Action, UI, onboarding, upload, adapter de banco, entitlement, capacidade comercial, tracking, Google Ads, Analytics, integração, valor operacional, snapshot operacional, geração, IA, automação, agente, job ou infraestrutura.

20.2.7 Refinamento de `transaction_intent` para locação

* Objetivo: criar a versão executável v4 do catálogo, preservando integralmente v1–v3 e acrescentando somente o valor canônico `rent`, com rótulo humano `Locação`, ao field existente `transaction_intent`.
* Status: Concluída em 15/08/2026.
* Conteúdo:

  * A v4 parte de cópia profunda da v3, preserva os 23 fields, sua ordem, camadas, metadata, bindings de capabilities e equivalência entre `starter`, `lite`, `pro` e `ultra`, mantém `buy`, `sell`, `valuation` e `mixed` e acrescenta `rent` ao final do conjunto permitido.
  * A consulta administrativa existente de estrutura exibe `Locação`; a jornada E19.2 recebeu somente o rótulo local correspondente e permanece na versão operacional v2, sem promoção de configurações ou do compilador E19.3 para v4.
  * As regressões focais, `npm ci`, `npm run check`, `git diff --check` e a inspeção autenticada do Preview em desktop e largura móvel foram aprovados; o servidor local iniciou na porta 3000, mas a renderização local ficou indisponível por ausência das chaves públicas do Supabase no worktree isolado.
  * A E20.6 deve ser executada novamente contra a versão explícita 4 antes de qualquer registro de suficiência.
  * O recorte não criou field, banco, migration, rota, API, nova UI, persistência, infraestrutura, automação, agente, job ou workload OpenAI e não alterou a E20.6.

20.2.8 Versão atual e propagação escalável do catálogo E20.2

20.2.8.1 Objetivo e status

* Objetivo: definir uma versão atual global, explícita e repo-only para o catálogo E20.2, propagá-la de forma determinística aos consumidores correntes e evitar reavaliação humana por taxon quando a evolução for comprovadamente compatível.
* Status: Concluída em 26/08/2026; implementação mergeada na `main` pelo PR #814 no commit `63213cc338ca8b92320e57f976b261a26b99c2d1`, migration `20260824180000_e20_2_8_input_catalog_lifecycle.sql` aplicada e validada no Supabase, QA positivo autenticado e somente leitura aprovado em Production nos viewports desktop e mobile, e gate negativo aprovado com sessão autorizada sem `platform_admin`: o acesso a `/admin/estrutura-lp?view=entradas` foi redirecionado para `/auth/confirm/info` com “Acesso não disponível”, sem exposição da superfície, dados ou controles administrativos e sem mutações.

20.2.8.2 Registros do recorte

* Banco:
  * Criados:
    * `public.landing_page_input_catalog_drafts`
  * Ajustados:
    * `public.save_account_landing_page_configuration_v1`
* Repositório:
  * Criados:
    * `lib/conversion-content/landing-page/input-catalog/lifecycle.ts`
    * `lib/conversion-content/landing-page/input-catalog/draft.ts`
    * `lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts`
    * `lib/admin/adapters/adminInputCatalogLifecyclePagination.ts`
    * `lib/admin/adapters/adminInputCatalogLifecycleValidation.ts`
    * `app/admin/(protected)/estrutura-lp/actions.ts`
    * `app/admin/(protected)/estrutura-lp/_components/AdminInputCatalogLifecycle.tsx`
    * `supabase/migrations/20260824180000_e20_2_8_input_catalog_lifecycle.sql`
    * `supabase/tests/e20_2_8_input_catalog_lifecycle.test.sql`
    * `supabase/snippets/e20_2_8_input_catalog_lifecycle_verify.sql`
  * Ajustados:
    * `lib/conversion-content/landing-page/input-catalog/contracts.ts`
    * `lib/conversion-content/landing-page/input-catalog/schema.ts`
    * `lib/conversion-content/landing-page/input-catalog/resolver.ts`
    * `lib/conversion-content/landing-page/input-catalog/index.ts`
    * `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/preparation.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/index.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    * `lib/conversion-content/adapters/inputCatalogEvaluationContextAdapter.ts`
    * `lib/lp-builder/onboardingConfiguration.ts`
    * `lib/lp-builder/adapters/onboardingConfigurationAdapter.ts`
    * `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`
    * `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts`
    * `lib/lp-builder/adapters/generationContextAdapter.ts`
    * `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    * `lib/lp-builder/generationContext.ts`
    * `lib/lp-builder/landingPageWorkspace.ts`
    * `lib/lp-builder/index.ts`
    * `lib/lp-builder/validation-cases.ts`
    * `lib/lp-builder/generation-context-validation-cases.ts`
    * `lib/lp-builder/landing-page-workspace-validation-cases.ts`
    * `lib/admin/adapters/adminLandingPageStructureAdapter.ts`
    * `app/admin/(protected)/estrutura-lp/page.tsx`
    * `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    * `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    * `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`
    * `app/admin/(protected)/taxonomia/actions.ts`
* Referências:
  * Catálogo e preparação factual: `docs/base-tecnica.md` — seções 3.15.4 e 3.15.7.
  * Draft administrativo e RPC de configuração: `docs/schema.md` — seções 1.35 e 3.8.2.

20.2.8.3 Autoridade e lifecycle de publicação

* Status: Implementados.
* Conteúdo:
  * O registry versionado no repositório permanece a autoridade exclusiva das versões publicadas e da versão atual; v1–v5 não serão migradas para o banco.
  * Pode existir somente um próximo draft mutável e não operacional. Persistência administrativa em banco só é admissível se a análise técnica a demonstrar como menor solução e nunca constitui autoridade do catálogo publicado.
  * O draft preserva os fields publicados e sua `createdInVersion`; remoção direta ou proveniência retroativa falha fechada, e retirada usa somente `retiredInVersion` igual à versão alvo.
  * A análise técnica confirmou um singleton service-only como menor residência robusta do draft e das evidências humanas vinculadas ao seu fingerprint, sem integração externa adicional e sem migrar v1–v5.
  * Publicar exige congelar draft e evidências, materializar no repositório a nova versão executável e a declaração explícita de versão atual, validar em CI/Preview, obter revisão e merge humanos, concluir o deploy de Production e comprovar a identidade exata no runtime.
  * A ativação bem-sucedida do artefato em Production torna a nova versão atual; qualquer falha anterior preserva a versão vigente. Eventual reconciliação administrativa posterior não pode substituir nem reverter a autoridade repo-only e, se atrasada, bloqueia novo draft/publicação administrativa até que o estado seja reconciliado com o artefato ativo exato.
  * A reconciliação pós-deploy ocorre somente no runtime de Production quando versão, conteúdo e fingerprint do registry implantado coincidem exatamente com o handoff congelado; antes de remover a residência temporária, revalida identidade, conteúdo e contexto das decisões E20.6.5, materializa os marcadores `reviewed_input_catalog_version` ainda válidos sem nova IA e confirma a leitura final. Divergência, decisão obrigatória ausente/stale ou efeito não confirmado falha fechado e preserva o draft.

20.2.8.4 Versão revisada, versão efetiva e compatibilidade

* Status: Implementadas.
* Conteúdo:
  * `R` é a última versão com decisão humana explícita de suficiência; `C` é a versão operacional efetivamente autorizada pelo boundary canônico de preparação.
  * `C` acompanha a versão atual quando `R = C` ou quando a transição resolvida for deterministicamente `sem mudança material` ou `evolução compatível`, sem escrita artificial em `reviewed_input_catalog_version`.
  * Remoção, restrição, reinterpretação, ambiguidade ou mudança fora da allowlist conservadora exigem revisão E20.6.5; falhas permanecem fechadas e a IA não classifica compatibilidade estrutural.
  * E19.2 pré-handoff, workspace E19.5 e geração E19.5 devem consumir o mesmo número concreto `C`; nenhum consumidor pode inferir `latest`, maior versão ou substituir `C` por `R`.

20.2.8.5 Draft, gates e experiência administrativa

* Status: Implementados; publicação de nova versão permanece sujeita a handoff repo-only, validações e decisão humana.
* Conteúdo:
  * O draft pode ser resolvido e validado administrativamente, mas nunca é operacional; qualquer edição material torna stale as evidências dependentes.
  * O gate pré-publicação separa suficiência taxonômica E20.6 de validade estrutural das configurações E19.2 pré-handoff e E19.5, cobre com paginação e cardinalidade exata somente contas ativas com entitlement comercial elegível, plano válido e demais requisitos operacionais, e bloqueia diante de truncamento, cardinalidade divergente ou configuração operacional inválida/ilegível. LPs e configurações históricas de contas inativas ou inelegíveis permanecem preservadas sem bloquear a publicação global.
  * E20.2 define e valida fields; E19.5 governa continuidade da identidade comercial; E20.6 decide somente suficiência factual. No MVP, `funnel_stage`, `transaction_intent` quando aplicável, `primary_conversion_goal` e `primary_service_or_offer` bloqueiam a publicação quando retirados ou alterados de modo `review_required` sem autoridade E19.5 específica, independentemente da E20.6; `compatible_evolution`, inclusive expansão estrita de `allowedValues`, permanece permitida, e field novo não adquire autoridade de identidade.
  * Validação e handoff congelam fingerprints distintos do conteúdo do draft e da coleção operacional completa; qualquer drift posterior de taxonomia, configurações, LPs ou elegibilidade deixa a evidência stale e exige nova preparação antes da revisão/merge.
  * A visão agregada deve evoluir `/admin/estrutura-lp?view=entradas`; `/admin/taxonomia/[taxonId]` permanece responsável pela avaliação individual E20.6.5. Não criar nova rota de primeiro nível; qualquer proposta de nova rota depende de insuficiência comprovada das superfícies existentes.
  * A primeira entrega preserva histórico imutável, retirada forward-only de fields publicados e snapshots/configurações na versão efetivamente usada; não inclui rollback, múltiplos drafts, targeting por taxon, job, fila, agente, automação recorrente ou engine genérica de diff.

20.2.9 Escopo comercial da LP e reconciliação da identidade

20.2.9.1 Objetivo e status

* Objetivo: substituir a representação singular de oferta por um escopo comercial capaz de expressar uma oferta, algumas ofertas ou o portfólio amplo, reconciliando a continuidade da identidade E19.5 sem alterar snapshots históricos.
* Status: Em andamento em duas etapas. A Etapa 1 foi concluída e incorporada à `main` pelo PR #826; a Etapa 2 está em implementação no PR draft #830, com publicação e reconciliação pós-deploy ainda pendentes.

20.2.9.2 Bootstrap mantendo v5

* Status: Concluído e incorporado à `main` pelo PR #826, preservando `CURRENT=5` e o registry publicado v1–v5 nesse checkpoint.
* Conteúdo:
  * Mantém `CURRENT=5`, registry publicado v1–v5 e toda operação do cliente em v5.
  * Adiciona ao contrato E20.2 o value type administrativo `offering_scope`, com modos técnicos `single | multiple | portfolio` e rótulos futuros `Uma oferta | Algumas ofertas | Todo o portfólio`.
  * `offerings` permanece entrada livre: não é validado semanticamente, restringido ou derivado de `business_offerings_summary`, que continua opcional, não exaustivo e sem função de catálogo ou whitelist; após `trim`, a lista rejeita duplicidades case-insensitive e exige uma oferta distinta em `single`, pelo menos duas em `multiple` e pelo menos uma em `portfolio`.
  * O resolver usado pelo gate E20.2.8 projeta em memória os dois fields v5 para os dois fields futuros somente quando valida um registry candidato que os retire, canonicaliza e falha fechado para legado malformado, sem persistência.
  * O Admin recebe somente o reconhecimento mínimo do novo value type para visualizar/avaliar draft; não há registry v6 publicado, nova identidade E19.5, UI operacional do cliente, geração/snapshots v6, migration, DDL, ACL ou nova residência.

20.2.9.3 Contrato e limites definidos

* Status: Definidos.
* Conteúdo:
  * A próxima versão executável preserva v1–v5, introduz `landing_page_offering_scope` e `landing_page_offering_scope_description` e retira os fields singulares somente de forma forward-only.
  * E20.2 mantém a autoridade de tipo, validação, canonicalização e igualdade material; E19.5 passa a considerar `funnel_stage`, `transaction_intent` quando aplicável e `landing_page_offering_scope` como núcleo de identidade, enquanto `primary_conversion_goal` permanece estratégia obrigatória fora desse núcleo.
  * A adaptação lazy cobre E19.2 pré-handoff e E19.5 sob o mesmo `C`, sem regravar snapshots, criar residência, schema, migration, ACL ou autoridade paralela.
  * A nova versão só pode tornar-se atual após os gates E20.2.8 e E20.6 aplicáveis; a configuração mínima dos novos fields não reabre home, detalhe, preview, grupos, A/B, prompt, algoritmo de geração ou renderer.

20.2.9.4 Draft, revisão e publicação da v6

* Status: Implementação candidata materializada no PR draft #830, com draft v6 validado, decisão humana E20.6.5 `confirm_sufficient` registrada, handoff repo-only congelado e `CURRENT=6`; revisão e merge humanos, deploy de Production, reconciliação canônica do draft e QA operacional pós-reconciliação permanecem pendentes.
* Sequência:
  * o lifecycle E20.2.8 criou exatamente o draft v6 a partir da `main` ainda em v5;
  * as configurações operacionais completas foram validadas, a E20.6.5 pré-publicação resultou `sufficient` sem gaps ou refinamentos e a decisão humana vigente foi vinculada aos fingerprints revalidados;
  * o PR #830 reconcilia identidade E19.5, UI operacional, save/reload, geração e snapshots e materializa a v6 no registry repo-only com `CURRENT=6`;
  * o Preview do artefato v6 foi aprovado como gate de build/artefato; como Preview e Production compartilham o Supabase, a transição material exige `R=6` e a reconciliação canônica é exclusiva de Production, o QA operacional completo foi transferido, sem dispensa, para imediatamente após essa reconciliação, sem bypass ou escrita antecipada no marcador;
  * após revisão e merge humanos, o deploy de Production deve comprovar o artefato exato e reconciliar os marcadores válidos antes de remover o draft, conforme o lifecycle canônico.

20.3 Perfil de orientação para geração

20.3.1 Objetivo e status
- Objetivo histórico: orientar a geração de `landing_page` por perfil versionado de taxon, com recomendações baseadas no catálogo histórico da E18.5.
- Status: Retirada concluída pela E22.1.4 em 19/08/2026; consumidores, superfícies administrativas, workload e validações foram removidos no PR #781, e as duas tabelas e quatro RPCs foram removidas pela migration `20260819153112` no PR #782.
- Destino: sem substituto. A prova read-only pós-apply confirmou ausência dos objetos retirados, preservação de `tg_set_updated_at`, 24 registros em `taxon_market_research` e 379 registros em `taxon_market_research_items`; migrations históricas permanecem preservadas.

20.5 Seleção da pesquisa integral `end_customer` por taxon

20.5.1 Objetivo e status

* Objetivo: permitir que um taxon ativo possua exatamente uma versão integral `end_customer` explicitamente selecionada por decisão humana autorizada e que essa versão possa ser lida integralmente por um boundary server-side, com validação de identidade e falha fechada.
* Status: Concluída e ativada em 15/08/2026; PR #746 mergeado, migration aplicada, prova SQL aprovada e smokes autenticados gate-on aprovados em Preview e Production. O taxon `corretor-imoveis` mantém a versão integral `end_customer` v1 selecionada por decisão humana.

20.5.2 Registros do recorte

* Banco:

  * Ajustados:

    * `public.business_taxons`

* Repositório:

  * Criados:

    * `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/research.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/index.ts`
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapterCore.ts`
    * `components/admin/AdminTaxonResearchSelectionForm.tsx`
    * `supabase/migrations/20260814174500_e20_5_selected_end_customer_research_version.sql`
    * `supabase/snippets/e20_5_selected_end_customer_research_version_verify.sql`
  * Ajustados:

    * `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    * `app/admin/(protected)/taxonomia/actions.ts`
    * `lib/admin/adapters/adminReadOnlyAdapter.ts`
    * `lib/admin/adapters/adminReadOnlyTypes.ts`
    * `lib/admin/adapters/adminTaxonomyAdapter.ts`
    * `next.config.js`
    * `package.json`
* Referências:

  * Plano-base E20.5: `docs/lousa-plano-base-e20-5.md` — seções 3.1, 3.2 e 3.3.
  * Configuração do gate: `docs/platform-config.md` — seção 3.5, secrets e variáveis server-side no Vercel.
  * Contrato de banco: `docs/schema.md` — seção 1.11.

20.5.3 Leitura e validação repo-only da pesquisa integral

* Status: Concluída, validada e integrada à `main` pelo PR #746.
* Conteúdo:

  * O boundary repo-only deriva exclusivamente o path canônico de uma versão candidata `end_customer`, confina a leitura a `docs/pesquisas-brutas/` e nunca consulta a API do GitHub.
  * A leitura preserva o conteúdo integral e valida taxon ativo, slug canônico, versão inteira positiva e metadata única na seção `## 1. Identificação e uso`; path inválido, arquivo ausente, falha operacional, metadata incompatível ou conteúdo vazio falham sem payload parcial.
  * Casos determinísticos cobrem sucesso integral e falhas de versão, path, leitura, metadata e conteúdo; o script dedicado integra `npm run check`.

20.5.4 Persistência e seleção humana mínima

* Objetivo: adicionar a referência mínima de versão selecionada e permitir sua alteração somente por ação humana administrativa explícita, reutilizando a validação da E20.5.3.
* Status: Concluída e ativada; migration aplicada, prova SQL aprovada e seleção humana validada em Preview e Production.
* Conteúdo:

  * A migration adiciona somente `selected_end_customer_research_version integer null`, com check positivo quando preenchida, sem nova tabela, lifecycle ou histórico; ela preserva RLS/policies, revoga o `UPDATE` de tabela inteira de `service_role` e mantém somente os grants de coluna usados pelo editor vigente (`name`, `slug`, `is_active`) e pela seleção. O snippet read-only comprovou esse conjunto exato após o apply.
  * O gate server-only `E20_5_SELECTED_RESEARCH_ENABLED` aceita apenas o literal `true` e antecede toda leitura ou mutação da coluna. Com o gate desligado, a interface e a ação novas permanecem inacessíveis, sem fallback para schema ausente.
  * A tela existente de detalhe do taxon recebe formulário separado com rótulos e associações programáticas; a Server Action exige `requirePlatformAdmin`, valida a candidata repo-only e atualiza somente a seleção por `id + slug + is_active`, com `.maxAffected(1)`.
  * Apply canônico, prova SQL, ativação da flag e redeploy foram concluídos; os smokes autenticados gate-on aprovaram ausência de seleção, candidata inválida, seleção válida após reload, acesso negado a papel não autorizado, responsividade móvel e ausência de erros observados.
  * O taxon `corretor-imoveis` possui `selected_end_customer_research_version = 1`, persistido após decisão humana explícita e confirmado no banco e na interface hospedada.

20.5.5 Contrato de consumo da seleção válida

* Objetivo: disponibilizar ao recorte seguinte uma leitura única que prove taxon ativo e pesquisa integral selecionada válida, sem antecipar o gate final de preparação.
* Status: Concluída, integrada à `main` e validada com a funcionalidade ativa em Preview e Production.
* Conteúdo:

  * O adapter server-only exige `E20_5_SELECTED_RESEARCH_ENABLED` antes de criar o client Supabase ou alcançar a consulta da nova coluna.
  * A leitura valida o identificador, exige taxon existente e ativo, distingue `NULL` legítimo de seleção inválida e carrega exatamente a versão persistida pelo boundary repo-only da E20.5.3.
  * O resultado tipado separa funcionalidade desabilitada, taxon ausente/inativo, ausência de seleção, versão ou identidade inválida, falha de banco e falhas de arquivo, filesystem, metadata ou conteúdo.
  * Somente o sucesso fornece taxon, slug, versão selecionada, conteúdo integral e a projeção derivada `selectedResearchValid: true`; nenhuma marca `prepared` é criada ou persistida.
  * Casos determinísticos cobrem todos os estados públicos e comprovam que o gate antecede o acesso à coluna; as validações consolidadas permanecem verdes.

20.6 Avaliação de suficiência factual da E20.2 por taxon

20.6.1 Objetivo e status

* Objetivo: avaliar a suficiência factual da pesquisa integral `end_customer` selecionada pela E20.5 em conjunto com uma versão executável explícita do catálogo E20.2 e definir o predicado final de preparação do taxon, sem autorizar geração.
* Status: E20.6.3 e E20.6.4 concluídas e operacionais desde 15/08/2026; o expand gate-off da E20.6.5 foi mergeado no #795 e sua migration incremental foi aplicada, permanecendo pendentes o merge do PR corretivo pós-apply, a prova operacional, o rollout e o contract final.

20.6.2 Registros do recorte

* Banco:
  * Ajustados:
    * `public.business_taxons`.
* Repositório:
  * Criados:
    * `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`;
    * `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogReview.tsx`;
    * `lib/admin/adapters/adminTaxonomyReviewPolicy.ts`;
    * `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-review.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation-schema.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/preparation.ts`;
    * `supabase/migrations/20260815172449_e20_6_reviewed_input_catalog_version.sql`;
    * `supabase/migrations/20260820213900_e21_2_taxon_input_catalog_sufficiency_workload.sql`;
    * `supabase/snippets/e21_2_taxon_input_catalog_sufficiency_workload_verify.sql`;
    * `supabase/tests/e21_2_taxon_input_catalog_sufficiency_workload.test.sql`;
    * `supabase/snippets/e20_6_reviewed_input_catalog_version_verify.sql`.
  * Ajustados:
    * `app/admin/(protected)/estrutura-lp/page.tsx`;
    * `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`;
    * `app/admin/(protected)/taxonomia/actions.ts`;
    * `lib/admin/adapters/adminLandingPageStructureAdapter.ts`;
    * `lib/admin/adapters/adminReadOnlyAdapter.ts`;
    * `lib/admin/adapters/adminReadOnlyTypes.ts`;
    * `lib/admin/adapters/adminTaxonomyAdapter.ts`;
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`;
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapterCore.ts`;
    * `lib/conversion-content/landing-page/input-catalog/index.ts`;
    * `lib/conversion-content/landing-page/input-catalog/resolver.ts`;
    * `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/index.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`;
    * `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`.
* Updates:
  * Aplicados:
    * `prod#14`;
    * `prod#16`;
    * `prod#17`.
* Referências:
  * Plano-base E20.6: `docs/lousa-plano-base-e20-6.md` — seções 2 e 3.
  * Contrato de banco: `docs/schema.md` — seção 1.11.
  * Configuração do gate: `docs/platform-config.md` — seção 3.5.
  * Boundary de preparação: `docs/base-tecnica.md` — seção 3.15.7.
  * Fluxo assistido: `docs/automations.md` — seção 3.10.

20.6.3 Avaliação assistida e registro humano da suficiência

* Status: Concluída em 15/08/2026; a reavaliação real de `corretor-imoveis` contra a versão executável E20.2 `4` resultou em `suficiente`, foi aceita por decisão humana e teve `reviewed_input_catalog_version = 4` registrado e confirmado após reload no Admin autenticado.
* Conteúdo:
  * usar o fluxo humano `Admin → Codex → Admin`, com IA em fluxo controlado no ambiente interno do Codex e sem workload OpenAI no runtime do LP Factory;
  * confrontar integralmente a pesquisa E20.5 autorizada com uma versão executável E20.2 escolhida explicitamente pelo humano, resolvendo e comparando `starter`, `lite`, `pro` e `ultra`, sem `latest` ou fallback;
  * a IA recomenda `suficiente`, `gaps candidatos` ou `inconclusivo`; a decisão final pertence ao humano;
  * somente após suficiência aceita pelo humano registrar a versão avaliada em `business_taxons.reviewed_input_catalog_version`; gap factual real retorna ao recorte próprio da E20.2 e exige nova execução da E20.6 após a evolução aplicável;
  * reutilizar a Taxonomia administrativa existente para orientar a ida ao Codex por instrução copiável que inclua a cadeia taxonômica autoritativa integral e para registrar ou reabrir a avaliação, sem nova rota nem integração direta com o Codex;
  * invalidar a avaliação quando a seleção E20.5 mudar efetivamente e exigir reabertura explícita antes de alterar identidade ou cadeia taxonômica própria ou ancestral que afete avaliação preenchida do taxon ou de descendente.

20.6.4 Gate derivado de preparação do taxon

* Status: Concluída em 15/08/2026; predicado derivado comprovado para a versão executável explicitamente requerida `4`.
* Conteúdo:
  * derivar deterministicamente a preparação por `taxon ativo + E20.5 selecionada/válida + reviewed_input_catalog_version compatível com a versão executável explicitamente requerida`;
  * falhar fechado para ausência ou incompatibilidade e não persistir estado adicional de prontidão;
  * a prova real de `corretor-imoveis`, com pesquisa integral `end_customer` v1, `reviewed_input_catalog_version = 4` e `requiredInputCatalogVersion = 4`, retornou `prepared: true`;
  * o controle negativo com `requiredInputCatalogVersion = 3` retornou `INPUT_CATALOG_REVIEW_VERSION_MISMATCH`, comprovando igualdade exata sem `latest` ou fallback;
  * preservar E19.2, E19.3 e E19.4 sem alteração neste recorte.

20.6.5 Avaliação factual com IA no runtime do Admin

* Status: expand gate-off mergeado no #795 e migration `20260820213900` aplicada; o PR corretivo pós-apply repara os artefatos de prova sem alterar o schema e já revalidou testes SQL, snippets read-only, invariantes e Security Controls, enquanto seu merge, revisão operacional `2`, gates específicos, prova real, rollout e contract final permanecem pendentes.
* Conteúdo:
  * internalizar na Taxonomia administrativa existente a avaliação semântica não autoritativa nos modos sistemático e hipótese humana, preservando a decisão administrativa explícita, a revalidação determinística e o gate E20.6.4 sem IA;
  * o checkpoint pré-integração materializou domínio e contratos, identidade e reconstrução/revalidação do contexto, Structured Output estrito, UI route-local apresentacional não montada e testes com portas e fakes injetados, sem alterar `lib/openai-workloads/`, criar configuração repo-only, chamar provider real ou declarar a E20.6.5 completa;
  * o #795 implementou `taxon_input_catalog_sufficiency_evaluation` no agregado E21.2, com configuração inicial aprovada `gpt-5.6-terra` + `reasoning.effort=low`; mudanças posteriores de modelo ou effort ficam sob governança E21 e decisão humana;
  * `OPENAI_OPERATIONAL_CONFIG_ENABLED=true` já está ativo em Preview e Production e deve permanecer ativo; a E20.6.5 apenas verifica essa condição, sem etapa futura de habilitação do gate da E21.2;
  * a migration do novo workload foi aplicada e o bootstrap hospedado está na revisão `1`, sem candidata ou revisão pendente; após o merge do PR corretivo pós-apply, verificar que o gate operacional permanece ativo em Preview e então provar, promover e ativar a revisão operacional `2` de `taxon_input_catalog_sufficiency_evaluation`; somente depois habilitar `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` em Preview e resolver os parâmetros exclusivamente pelo lifecycle dinâmico Supabase e sua API pública, sem consulta direta, configuração paralela ou transporte exclusivo da E20.6.5;
  * a avaliação exige uma versão executável E20.2 `N` escolhida explicitamente e mantida apenas no estado transitório da UI; a leitura canônica carrega a pesquisa E20.5 selecionada, valida e resolve `N` em `starter`, `lite`, `pro` e `ultra`, e somente a decisão humana de suficiência pode gravar `reviewed_input_catalog_version = N`; `loadTaxonPreparationForReviewedVersion()` permanece para E20.6.4 e consumidores posteriores;
  * `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` bloqueia servidor e UI; em Preview/Production, mesmo gate-on recusa `repo_catalog` e a revisão bootstrap `1`, exigindo fonte ativa `supabase_operational` em revisão operacional `2` ou posterior; somente o retorno explícito `ROLLOUT_GATE_OFF` preserva o handoff Codex;
  * `confirm_sufficient` aceita somente resultado `sufficient`; para `candidate_gaps`, o humano seleciona e reconhece somente gaps reais, recebendo handoff E20.2 transitório sem escrita, ou limpa a seleção e usa `reject_candidates_and_confirm_sufficient` para rejeitar todos e confirmar `N`, com `kind` distinto por decisão e sem veto da IA;
  * somente `ROLLOUT_GATE_OFF` mantém handoff Codex e registro legado; gate-on comprovado e `OPERATIONAL_CONFIGURATION_UNPROVEN` ocultam e bloqueiam ambos server-side, sem gravação, fallback Codex ou rotulagem gate-off, preservando reabertura;
  * o #795 não constitui fechamento: a decisão expand/contract está aprovada, o expand gate-off foi mergeado e sua migration foi aplicada; o PR corretivo deve ser mergeado antes da revisão operacional `2` provada/promovida/ativada e do rollout do gate E20.6.5 em Preview → decisão humana → repetição controlada em Production; o PR contract remove definitivamente o legado e atualiza os documentos finais.

20.7 Liberação taxonômica para geração de Landing Pages

20.7.1 Objetivo e status

* Objetivo: resolver a fonte de conhecimento de mercado mais específica e segura para o escopo comercial de uma LP, preservando a autoridade factual E20.2, a identidade taxonômica da conta e os boundaries E19.3/E19.4.
* Status: E20.7.3 implementada repo-side e validada; E20.7.4 permanece pendente e condicionada ao checkpoint aprovado da E20.7.3.

20.7.3 Resolver determinístico de conhecimento

* Status: Implementada repo-side e validada; Automação: não.
* Conteúdo:
  * resolver `single | multiple | portfolio` por APIs públicas canônicas, com matching por nome/aliases, descendência ativa, preparação E20.5/E20.6 e equivalência factual conservadora; autorizar `specialized_deep` somente quando `matchSource` contiver `alias_exact`, `alias_normalized`, `taxon_name_exact` ou `taxon_name_normalized`, mantendo resultado apoiado apenas em `fts`, `trgm` ou `taxon_slug_normalized` como `dynamic_required` sem recusar nem invalidar a oferta;
  * distinguir falha operacional de ausência ou ambiguidade legítima e produzir `specialized_deep | base_only | dynamic_required` sem recusa semântica da oferta;
  * reutilizar a cadeia taxonômica paginada compartilhada e terminar em saída tipada imutável, sem persistência própria, IA, integração E19 ou mudança em geração, snapshot, materialização ou renderer;
  * permitir planejamento, implementação repo-side e testes determinísticos com `CURRENT=6` já na `main`, mantendo a reconciliação para `reviewed_input_catalog_version=6` como gate somente antes de prova hospedada ou ativação.

20.7.4 Complemento dinâmico controlado

* Status: Planejada; Automação: sim; categoria `2.1.3 — Automação com IA em fluxo controlado`.
* Conteúdo:
  * iniciar somente após a implementação da E20.7.3 e sua aprovação pelo Analista; antes da E20.7.4, confrontar os contratos compartilhados com o estado corrente do PR #831 e parar apenas diante de sobreposição material ainda aberta;
  * executar server-side uma única requisição foreground à Responses API com somente Web Search hospedado e Structured Output estrito, aceitando uma ou duas chamadas fundamentadas e falhando tecnicamente sem invalidar a oferta;
  * governar o workload `landing_page_dynamic_market_research` pelos boundaries E21.1/E21.2, com configuração própria comprovada antes da ativação humana por ambiente e sem agente, retry, fallback, job, fila, RAG, cache global ou nova residência de negócio;
  * ampliar o agregado E21.2 por migration forward-only sem nova tabela ou coluna, preservando runtime anterior, segurança e falha fechada até configuração ativa válida;
  * preservar a atribuição financeira causal sob E21.4 e manter consumo pela geração, validação semântica de oferta e qualquer mudança E19 em recortes próprios posteriores.

21. E21 — Gestão e governança dos workloads OpenAI
- Objetivo: gerir e governar os workloads OpenAI por recortes aprovados, com configuração explícita, observabilidade segura, leitura administrativa e configuração operacional dinâmica por ambiente, sem otimização automatizada.
- Status: a fundação E21.1 permanece preservada; a E21.2, incluindo o catálogo operacional da E21.2.5, está concluída com apply e gates hospedados aprovados; o plano-base v1 da E21.3 já está na `main`, enquanto a implementação experimental da E21.3.3 permaneceu no PR #819, fechado sem merge por repriorização humana; a E21.4 passa a ser a prioridade imediata.

21.1 Fundação, normalização e leitura dos workloads OpenAI

21.1.1 Objetivo e status
- Objetivo: estabelecer catálogo tipado e resolução explícita dos workloads OpenAI, integrar os consumidores de produto à configuração e à observabilidade comuns e expor inventário administrativo read-only.
- Status: Fundação E21.1 implementada, validada e preservada; o catálogo vigente possui cinco workloads de produto e uma referência operacional, sem mudar a natureza repo-only e read-only do boundary.

21.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `lib/openai-workloads/index.ts`
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `app/admin/(protected)/workloads-openai/page.tsx`
  - Ajustados:
    - `app/a/[account]/actions.ts`
    - `app/admin/(protected)/perfis-de-orientacao/page.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/[taxonId]/page.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/_components/GenerationProfileEditor.tsx`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileOpenAiAdapter.ts`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `lib/conversion-content/commercial-activation/validation-cases.ts`
    - `lib/conversion-content/landing-page/generation-profile/index.ts`
    - `lib/conversion-content/landing-page/generation-profile/proposal-server.ts`
    - `lib/conversion-content/landing-page/generation-profile/proposal.ts`
    - `lib/conversion-content/landing-page/generation-profile/validation-cases.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — 3.16.
  - Configuração operacional: `docs/platform-config.md` — 3.5 e 6.3.

21.1.3 Catálogo estrutural e resolução explícita
- Status: Implementada e validada.
- Conteúdo:
  - O boundary transversal `lib/openai-workloads/` mantém registry interno, repo-only e profundamente imutável, com cinco configurações de produto e uma referência operacional separada do Supabase Inspect.
  - Dois workloads textuais preservam `gpt-5.4-mini + none`; a E19.4 acrescenta `landing_page_draft_generation` e o workload de mídia independente `landing_page_draft_image_generation`; a E20.6.5 acrescenta `taxon_input_catalog_sufficiency_evaluation` com baseline `gpt-5.6-terra + low`, sem transportar parâmetros inaplicáveis entre modalidades.
  - O resolver público discrimina `responses_text | image_generation`, aceita somente workloads de produto conhecidos, falha fechado para identidade desconhecida ou referência operacional e projeta inventário seguro com classificação, origem, revisão e configuração efetiva.
  - Ambiente, uniões discriminadas de resultado/evento e normalização de usage foram definidos como contratos puros comuns e integrados às chamadas reais na E21.1.4.
  - Os casos executáveis fundacionais cobrem unicidade, resolução, separação effective/reference, imutabilidade, projeção sem secrets, ambiente, usage, evento e ausência de transporte, persistência ou payload funcional no boundary.
  - Nenhum banco, integração remota, cliente universal, preço, prompt, schema funcional ou fallback silencioso foi criado.

21.1.4 Integração dos consumidores e observabilidade comum
- Status: integração técnica validada para os cinco workloads de produto vigentes; as execuções integradas hospedadas da E19.4 comprovaram os dois workloads de draft, enquanto a prova hospedada do workload da E20.6.5 permanece condicionada ao rollout próprio.
- Conteúdo:
  - Consumidores textuais resolvem modelo e reasoning effort explícitos; o workload de imagem resolve somente sua configuração de mídia. Prompts, schemas, limites, persistência e fallbacks funcionais permanecem nos domínios consumidores.
  - Eventos textuais e de imagem registram por tentativa somente metadados operacionais seguros e aplicáveis; métricas ausentes permanecem `null` e nenhum prompt, resposta integral, payload de negócio, PII ou secret é registrado.
  - Os consumidores ativos não leem variáveis legadas de modelo nem mantêm hardcode client ou cálculo monetário local; as variáveis externas permanecem apenas como legado temporário de reversão conforme a configuração operacional canônica.
  - O transporte OpenAI comercial foi isolado no adapter previsto e novos drafts registram workload, origem, revisão, modelo e effort resolvidos na proveniência existente, sem migration, backfill ou persistência de usage.
  - Validators determinísticos exercitam os cinco workloads de produto, separação textual/mídia, configuração inválida sem transporte, parâmetros exatos, IDs de provider, usage aplicável, eventos discriminados e ausência de referências legadas.
  - As execuções integradas hospedadas da E19.4 comprovaram `landing_page_draft_generation` e `landing_page_draft_image_generation` e substituíram, por decisão humana, o gate de canários isolados; não permanece pendência de canários isolados.
  - Permanece fora do PR #710 a correção separada da automação de smoke para remover senha de logs e artifacts, gerar credenciais não previsíveis e tratar colisões corretamente.

21.1.5 Inventário read-only no Admin Dashboard
- Status: inventário versionado vigente com seis itens; o QA pós-merge da E22.1.4 aprovou os cinco itens então existentes em Preview e Production, e a prova hospedada do item acrescentado pela E20.6.5 permanece no rollout próprio.
- Conteúdo:
  - A rota protegida `/admin/workloads-openai` integra o shell e a navegação administrativos vigentes e projeta diretamente da API pública do boundary os seis itens vigentes, sem adapter, API, componente client ou controle de mutação novos.
  - Os cinco workloads de produto exibem ambiente observado, configuração efetiva, origem e revisão; o Supabase Inspect permanece diferenciado como referência operacional externa e informa explicitamente `Ambiente da execução: não verificado nesta página`.
  - A superfície é responsiva, sem consulta runtime à OpenAI, GitHub ou Vercel e sem configuração remota, métricas históricas ou capacidades inexistentes.
  - As evidências hospedadas aprovaram desktop, viewport mobile de 390 × 844 sem overflow, navegação lógica por TAB com foco visível, acesso positivo de `platform_admin` e bloqueio da identidade preexistente sem esse papel.

21.2 Configuração operacional dinâmica dos workloads OpenAI

21.2.1 Objetivo e status
- Objetivo: permitir configuração ativa por ambiente e workload, com candidata, validação, ativação humana, rollback e mudança ordinária sem redeploy.
- Status: concluída em 28/08/2026; fonte operacional, catálogo e correção do transporte de conflitos pela Data API aplicados, com cutover e gates hospedados aprovados.
- O recorte preserva a E21.1 como boundary transversal, mantém Development determinístico/local e deixa a E21.3 prevista, sem início de execução.

21.2.2 Registros do recorte
- Banco:
  - Criados:
    - `public.openai_workload_operational_configurations`
    - `public.openai_workload_configuration_revisions`
    - `public.openai_workload_configuration_activations`
    - `public.save_openai_workload_configuration_candidate_v1`
    - `public.discard_openai_workload_configuration_candidate_v1`
    - `public.promote_openai_workload_configuration_candidate_v1`
    - `public.activate_openai_workload_configuration_revision_v1`
    - `public.rollback_openai_workload_configuration_revision_v1`
    - `public.prevent_openai_workload_append_only_mutation_v1`
    - `public.openai_model_catalog_models`
    - `public.openai_model_catalog_parameters`
    - `public.prevent_openai_model_catalog_delete_v1`
    - `public.assert_openai_model_catalog_model_has_parameter_v1`
    - `public.add_openai_model_catalog_model_v1`
    - `public.set_openai_model_catalog_model_availability_v1`
    - `public.set_openai_model_catalog_parameter_availability_v1`
    - `public.check_openai_model_catalog_configuration_available_v1`
    - `public.raise_postgrest_safe_conflict_v1(text)`
  - Ajustados:
    - `public.save_openai_workload_configuration_candidate_v1`
    - `public.discard_openai_workload_configuration_candidate_v1`
    - `public.promote_openai_workload_configuration_candidate_v1`
    - `public.activate_openai_workload_configuration_revision_v1`
    - `public.rollback_openai_workload_configuration_revision_v1`
    - `public.check_openai_model_catalog_configuration_available_v1`
    - `public.set_openai_model_catalog_model_availability_v1`
    - `public.set_openai_model_catalog_parameter_availability_v1`
- Repositório:
  - Criados:
    - `app/admin/(protected)/workloads-openai/_components/OpenAiConfigurationManager.tsx`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `app/admin/(protected)/workloads-openai/actions.ts`
    - `app/admin/(protected)/workloads-openai/commercialProof.ts`
    - `app/admin/(protected)/workloads-openai/proofCore.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.tsx`
    - `lib/openai-workloads/adapters/operationalConfigurationAdapter.ts`
    - `lib/openai-workloads/adapters/operationalConfigurationAdapterCore.ts`
    - `supabase/migrations/20260820190422_e21_2_3_openai_workload_operational_configurations.sql`
    - `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql`
    - `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiModelCatalogManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadDetail.tsx`
    - `app/admin/(protected)/workloads-openai/catalogActions.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapter.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapterCore.ts`
    - `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`
    - `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`
    - `supabase/tests/e21_2_5_openai_model_catalog.test.sql`
    - `supabase/migrations/20260827203000_postgrest_safe_application_conflicts.sql`
    - `supabase/snippets/postgrest_safe_application_conflicts_verify.sql`
    - `supabase/tests/postgrest_safe_application_conflicts.test.sql`
  - Ajustados:
    - `app/admin/(protected)/workloads-openai/page.tsx`
    - `lib/access/guards.ts`
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `lib/conversion-content/commercial-activation/validation-cases.ts`
    - `lib/lp-builder/landing-page-draft-generation-validation-cases.ts`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageDraftImageGeneration.ts`
    - `lib/lp-builder/landingPageRevision.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/index.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `lib/supabase/service.ts`
- Referências:
  - Plano-base v1: `docs/lousa-plano-base-e21-2.md`.
  - Plano-base v2 aprovado: `docs/lousa-plano-base-e21-2-v2.md`.
  - Matriz integral de tratamentos: `docs/matriz-consolidacao-e21-2.md`.
  - Plano-base v2 aprovado da E21.2.5: `docs/lousa-plano-base-e21-2-5.md`.
  - Matriz de consolidação da E21.2.5: `docs/matriz-consolidacao-e21-2-5.md`.
  - Contrato técnico: `docs/base-tecnica.md` — 3.12 e 3.16.
  - Configuração operacional: `docs/platform-config.md` — 3.5 e 6.3.
  - Contrato de banco: `docs/schema.md` — 1.28, 1.29, 1.30, 3.7 e 3.9.

21.2.3 Fonte operacional dinâmica e resolução por ambiente/workload
- Status: Concluída; fonte operacional aplicada e cutover aprovado em Preview e Production.
- Automação: não.
- As migrations forward-only materializam o agregado de configuração, revisões validadas e ativações/rollback por `ambiente + workload`, com bootstrap exato das dez unidades de Production e Preview, lifecycle transacional, concorrência otimista, constraints unit-safe, RLS/grants mínimos e metadados de prova fechados e sanitizados.
- `lib/openai-workloads/` permanece o boundary público comum: resolvers assíncronos recebem ambiente explícito, Development continua no baseline local, e os cinco callsites preservam transporte, fallback funcional e proveniência ao consumir `repo_catalog` ou `supabase_operational`.
- Adapter server-side, comportamento fail-closed, shape tipado por workload, validação de snapshots funcionais, snippet SQL read-only, testes SQL e documentação canônica aplicável foram entregues; a elegibilidade corrente de novas candidatas foi posteriormente centralizada pela E21.2.5.
- A migration foi aplicada pelo workflow canônico; o snippet hospedado aprovou 10/10 verificações e o Security Controls não apresentou alerta incompatível com as tabelas ou RPCs do recorte.
- `OPENAI_OPERATIONAL_CONFIG_ENABLED=true` foi habilitada e redeployada primeiro em Preview e, somente após sua aprovação integral, em Production; os dois ambientes usam exclusivamente `supabase_operational`, enquanto Development permanece no baseline local.
- Não usar `repo_catalog` como fallback quando o gate estiver ativo; não introduzir cache, Realtime, AI Gateway, Vercel Flags, Global Config, tracing, drains, workflow ou segunda residência.
- Conflitos funcionais de versão ou revisão expostos pela Data API preservam a rejeição da tentativa sem serem transportados como falha transacional retryable; o corretivo foi aplicado e o gate hospedado confirmou ausência de retry autônomo.

21.2.4 Gestão administrativa, validação, ativação e rollback
- Status: Concluída; gestão administrativa, provas reais, lifecycle, QA hospedada e smoke mínimo de Production aprovados.
- Automação: não.
- `/admin/workloads-openai` passou a gerir ativa, candidata, prova, revisão validada pendente, ativação, histórico e rollback separadamente em Production e Preview; texto aceita somente `model + reasoning effort`, imagem somente `model + quality`, e o Supabase Inspect permanece referência read-only separada.
- A página reautoriza `platform_admin` antes do read model service-role; cada action reexecuta o guard, deriva o ator no servidor, valida unidade, versão e shape tipado, e a E21.2.5 acrescenta a revalidação de elegibilidade corrente sem alterar concorrência otimista ou estados fail-closed.
- A prova despacha fixture segura pelos quatro transportes existentes, não cria persistência funcional, benchmark, ranking ou decisão autônoma e só promove após sucesso; erro preserva a candidata e nunca altera a revisão ativa. A prova comercial reutiliza o parser comum do shape REST real de `/v1/responses`.
- O Preview aprovou os quatro transportes, criação/edição/descarte de candidata, promoção, ativação, execução subsequente com nova revisão, isolamento de Production e rollback, além de papéis positivo/negativo, desktop 1440 × 900, mobile 390 × 844, estados de sucesso/erro, reconhecimento do lifecycle e checklist proporcional WCAG 2.2.
- O smoke mínimo de Production confirmou as quatro baselines ativas e uma execução comercial real com origem `supabase_operational` e revisão 1, criando somente draft não publicado; a janela autenticada permaneceu sem erro ou warning no runtime.
- O estado operacional mantém os cinco workloads de Preview e Production sem candidata ou revisão pendente; o workload `taxon_input_catalog_sufficiency_evaluation` permanece na revisão bootstrap `1` em ambos os ambientes, e os eventos append-only dos lifecycles anteriores permanecem preservados.
- `OPENAI_API_KEY` permaneceu server-side e foi reutilizada sem cópia, exposição ou versionamento. A E21.3 não foi iniciada.

21.2.5 Catálogo administrável e UX compacta dos workloads OpenAI
- Status: Concluída em 24/08/2026; catálogo aplicado e QA hospedado/autenticado integralmente aprovado em Production.
- Automação: não.
- O catálogo global separa elegibilidade corrente de novas candidatas do lifecycle por ambiente e workload; save e promoção revalidam a combinação de forma transacional, e a prova confirma a elegibilidade imediatamente antes do transporte sem manter lock durante a chamada externa.
- Falha ou indisponibilidade exclusiva do catálogo bloqueia catálogo, save, prova e promoção, sem afetar resolução ativa, ativação de revisão validada ou rollback histórico; revisões e snapshots preservam qualquer identificador técnico com parâmetro tipado válido.
- As leituras administrativas são completas, ordenadas e fail-closed; páginas acumuladas só são aceitas no término esperado, nunca após erro ou resposta parcial.
- A superfície administrativa mantém catálogo global superior, seletor Preview/Production, lista compacta com cabeçalho sticky e um detalhe expandido; a geração de Landing Page agrupa texto e imagem apenas visualmente, preservando lifecycle independente.
- A migration foi aplicada pelo fluxo canônico; o snippet read-only aprovou 8/8 verificações e o Security Controls não apresentou alerta incompatível com tabelas, constraints, RLS, policies, grants, RPCs ou triggers do catálogo. O INFO de RLS sem policy permaneceu compatível com a residência exclusiva de `service_role`.
- O QA autenticado de Production aprovou `platform_admin` em desktop 1280 × 720 e mobile responsivo 482 × 698, sem overflow horizontal, com cabeçalho sticky, controles da superfície de 44 px ou mais, nomes/labels, lifecycle reconhecível e contraste de 5,54:1 no estado normal e 13,81:1 no hover dos botões primários.
- O papel negativo foi redirecionado para o estado de acesso indisponível, sem formulário, catálogo, lifecycle ou controle administrativo exposto. O QA não alterou catálogo, candidata, revisão ou lifecycle; a E21.3 não foi iniciada.

21.3 Evidências e avaliação de custo-benefício dos workloads OpenAI

21.3.1 Objetivo e status
- Objetivo: produzir comparações reproduzíveis por workload considerando qualidade, sucesso, necessidade de correção humana, usage, latência, custo e estabilidade.
- Status: Pausada por repriorização humana; o plano-base v1 da E21.3 já está na `main`, enquanto a implementação experimental da E21.3.3 permaneceu no PR #819, fechado sem merge.
- Registrar a E19.4 como primeiro caso real de referência, especificamente:
  - `landing_page_draft_generation`;
  - `landing_page_draft_image_generation`.
- Isso não reabre a E19.4.

21.3.3 Evidência experimental, pausa e limites de retomada
- A implementação experimental da E21.3.3 e seu QA técnico em Preview permanecem preservados no PR fechado #819, sem aceite humano final de produto/UX e sem incorporação à `main`.
- O PR #819 permanece referência histórica e técnica de retomada, incluindo plano v2, matriz, comparação Terra/Luna, decisões e aprendizados; sua implementação não constitui baseline automaticamente adotável.
- A retomada da E21.3 deve comparar e revalidar a implementação do PR #819 contra a `main` então vigente antes de decidir qualquer reaproveitamento.
- Unidade textual de comparação: `workload + modelo + reasoning effort`.
- Workloads de mídia preservam configuração e métricas próprias.
- Reutilizar observabilidade segura da E21.1.
- `docs/openai-model-snapshot.md` permanece a residência das comparações decisórias.
- Considerar, quando aplicável:
  - qualidade;
  - resultado válido;
  - correção humana;
  - input tokens;
  - cached tokens;
  - output tokens;
  - reasoning tokens;
  - latência;
  - custo financeiro;
  - estabilidade.
- Não definir vencedor ou baseline universal antes de evidência representativa.
- Não criar agora banco, tabela, rota, dashboard, job, engine, agente, automação ou infraestrutura.

21.3.4 Continuação prevista
- Status: Prevista e não iniciada; sua retomada permanece posterior à execução da E21.4 e depende de nova decisão humana.

21.4 Visibilidade financeira e atribuição de custos OpenAI

21.4.1 Objetivo e status
- Objetivo: permitir conhecer o gasto OpenAI total por período e atribuir custos, quando tecnicamente possível e confiável, por cliente, Landing Page e workload, além de investigar a disponibilidade oficial de saldo ou créditos.
- Status: Nova prioridade imediata; debate e plano-base próprios pendentes, sem implementação iniciada.

21.4.3 Previsão e limites
- A E21.4 deve ser executada antes da retomada da E21.3.4.
- Banco, tabela, API, rota, job e desenho técnico não estão definidos e somente poderão ser estabelecidos no debate e no plano-base próprios.

22. E22 — Retirada controlada de ativos históricos
- Objetivo: reduzir a superfície histórica que não participa do caminho canônico vigente, preservando consumidores reais e preparando a sequência E19.4 concluída → E22.1 → E19.5.
- Status: E22.1 concluída; E22.2 candidata aguardando merge humano.

22.1 Retirada controlada de ativos históricos

22.1.1 Objetivo e status
- Objetivo: retirar de forma controlada ativos históricos e seus consumidores somente após classificação de dependências, preservando os boundaries e dados ainda necessários ao caminho ativo.
- Status: Concluída em 19/08/2026 após o merge do PR #785 e o QA pós-merge final aprovado em produção; E22.1.4, E22.1.5, E22.1.6 e E22.1.7 permanecem concluídas. A E19.4 permanece concluída, e a E19.5 deixa de estar bloqueada pela E22.1 e passa a ser o próximo recorte a planejar, sem implementação iniciada.

22.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `supabase/migrations/20260819153112_e22_1_4_remove_generation_profile.sql`
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/page.tsx`
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `app/admin/(protected)/taxonomia/`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adapters/`
    - `lib/conversion-content/index.ts`
    - `lib/openai-workloads/`
    - `package.json`
  - Excluídos:
    - `app/admin/(protected)/estrutura-lp/ModuleStructureFilters.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdapterCore.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdminAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileOpenAiAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileRowNormalization.ts`
    - `lib/conversion-content/adapters/landingPageResearchAdapter.ts`
    - `lib/conversion-content/landing-page/generation-profile/`
    - `lib/conversion-content/landing-page/module-catalog/`
    - `lib/conversion-content/landing-page/research-resolution/`
    - `supabase/snippets/e12_4_3_generation_profile_lifecycle_verify.sql`
    - `supabase/snippets/e20_3_generation_profile_verify.sql`
    - `supabase/tests/e12_4_3_generation_profile_lifecycle.test.sql`
    - `supabase/tests/e20_3_generation_profile.test.sql`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1 e 3.

22.1.3 Auditoria e classificação integral de consumidores
- Objetivo: mapear e classificar consumidores e ativos históricos como preservados, desacoplados ou removíveis, sem retirar qualquer item apenas por estar fora do caminho canônico.
- Status: Concluída no planejamento; sem implementação material.
- Conteúdo:
  - classificar dependências de runtime, superfícies administrativas, validações e persistência antes de qualquer retirada;
  - preservar E18.4, E20.2, E20.5, E20.6, E19.2, E19.3, E19.4, E10.6 e E10.7 enquanto houver consumidor real ou autoridade ativa;
  - preservar a revisão 3 da E19.4 como baseline de regressão e manter a E19.5 pausada durante o recorte.

22.1.4 Retirada de E20.3 e E12.4.3 associado
- Objetivo: retirar o domínio histórico de perfil de geração e suas responsabilidades associadas sem criar persistência ou arquitetura substituta dentro da E22.1.
- Status: Concluída em 19/08/2026 após os PRs #781 e #782, apply da migration `20260819153112` pelo workflow e prova read-only pós-apply sem drift.
- Conteúdo:
  - o primeiro merge retirou `generation-profile`, adapters, páginas/actions de `/admin/perfis-de-orientacao`, navegação e diagnósticos associados, o workload `landing_page_generation_profile_proposal`, exports e validator;
  - `validate:landing-page-generation-profile` e sua chamada em `npm run check` foram retirados no mesmo recorte, e o QA pós-merge confirmou ausência das superfícies aposentadas;
  - o gate read-only pré-DDL confirmou o conjunto aprovado de um perfil `active` do taxon `corretor-imoveis`, seus onze itens, duas tabelas, quatro RPCs e ausência de dependências externas inesperadas;
  - a migration forward-only removeu exatamente as quatro RPCs, as duas tabelas e seus objetos próprios, sem `CASCADE`, preservando migrations históricas, `audit_logs`, `taxon_market_research` e `taxon_market_research_items`;
  - a prova read-only pós-apply confirmou ausência dos seis objetos, preservação de `tg_set_updated_at`, 24 pesquisas e 379 itens; não houve archive, snapshot, backup paralelo ou persistência substituta.

22.1.5 Retirada de E18.5 e poda dos consumidores administrativos
- Objetivo: retirar o catálogo histórico de módulos e variantes e podar somente as responsabilidades administrativas que dependem dele.
- Status: Concluída em 19/08/2026 após merge do PR #783 e QA pós-merge aprovado em produção.
- Conteúdo:
  - o boundary `module-catalog`, sua API pública, exports e validator foram retirados, junto de `validate:landing-page-module-catalog` e sua chamada em `npm run check`;
  - somente os consumidores administrativos de módulos e variantes foram podados; no estado pós-merge da E22.1.5, `/admin/estrutura-lp` preservou Parâmetros, Entradas e Pesquisas, sem Módulos e variantes;
  - E18.4 e E20.2 permanecem preservadas e validadas, sem mudança de banco, migration, persistência ou dados;
  - as regressões locais confirmaram ausência de dependência de E18.5 no caminho E19.3 → E19.4; os QAs hospedado/autenticado e pós-merge em produção preservaram Parâmetros, Entradas e Pesquisas, e E20.2 resolveu 23 campos válidos em Entradas.

22.1.6 Desacoplamento da camada E10.8
- Objetivo: desacoplar a camada histórica de resolução de pesquisas e seus consumidores históricos sem remover pesquisas estruturadas que possuam consumidor real independente.
- Status: Concluída em 19/08/2026 após merge do PR #784 e QA pós-merge aprovado em produção.
- Conteúdo:
  - o boundary `research-resolution`, o adapter `landingPageResearchAdapter`, exports e validator foram retirados, junto de `validate:landing-page-research` e sua chamada em `npm run check`;
  - os diagnósticos BB/EC E10.8 foram retirados da Taxonomia, e a visão Pesquisas foi retirada de `/admin/estrutura-lp`, que preserva somente Parâmetros e Entradas; queries antigas caem com segurança em Parâmetros;
  - E20.5, E20.6, E19.3, E19.4, E10.6, E10.7, E18.4 e E20.2 permanecem preservadas e validadas; a E19.3 continua recebendo a pesquisa integral `end_customer` selecionada, sem `business_buyer` no `modelContext`;
  - `taxon_market_research`, `taxon_market_research_items`, seus dados e migrations históricas permanecem intactos para consumidores independentes; não houve migration, DDL, substituto ou alteração de `docs/schema.md`;
  - o QA hospedado/autenticado aprovou Taxonomia e Estrutura da LP em desktop e mobile, sem links, cards, estados órfãos, overflow de página ou erros de console; E20.2 resolveu 23 campos válidos para Corretor Imóveis em v4/Starter.

22.1.7 Consolidação transversal e regressão final
- Objetivo: consolidar a retirada controlada, verificar a ausência de dependências residuais e preservar a integridade do caminho E19.4.
- Status: Concluída em 19/08/2026 após o merge do PR #785 e o QA pós-merge final aprovado em produção.
- Conteúdo:
  - a auditoria focal encontrou e removeu somente o rótulo administrativo órfão `Pesquisas estruturadas por taxon`; ocorrências em migrations e registros históricos, além de asserções negativas de regressão, permanecem preservadas;
  - `npm ci`, `npm run check`, `git diff --check` e os validadores focais de E19.3, E19.4, Preview, workloads OpenAI, ativação comercial, E20.5/E20.6 e Estrutura da LP foram aprovados;
  - os QAs hospedado/autenticado e pós-merge final em produção aprovaram Admin em desktop (1280×900) e mobile (390×844), com Estrutura da LP somente em Parâmetros e Entradas, Taxonomia sem superfícies retiradas e cinco itens inventariados em Workloads OpenAI — quatro workloads de produto ativos e a referência operacional Supabase Inspect —, sem superfície órfã, overflow de página ou erro de console;
  - a revisão 3 permaneceu persistida e reproduzível em desktop e mobile, inclusive no QA pós-merge final em produção, com três revisões materializadas e a revisão 3 vigente; nenhuma revisão 4 ou chamada real aos providers foi criada;
  - E18.4, E20.2, E20.5/E20.6, E19.2/E19.3/E19.4, E10.6/E10.7, `commercial_activation`, `taxon_market_research`, `taxon_market_research_items` e os workloads ativos permanecem preservados;
  - não houve migration, DDL, alteração de banco, infraestrutura ou mudança de `docs/schema.md`; a E19.5 não foi iniciada e, com a conclusão da E22.1, passa a ser o próximo recorte a planejar.

22.2 Retirada controlada de documentação histórica redundante

22.2.1 Objetivo e status
- Objetivo: retirar fontes documentais redundantes ou obsoletas que duplicam autoridades vigentes.
- Status: Implementação candidata.

22.2.2 Registros do recorte
- Excluídos:
  - `docs/lp-planejamento.md`;
  - `docs/prompt-catalogo-lp.md`.
- Ajustados:
  - `lib/admin/docsCatalog.ts`;
  - `docs/roadmap.md`.

22.2.3 Resultado e limites
- `docs/roadmap.md` permanece autoridade para casos, estado, dependências, previsões e pendências.
- Planos-base permanecem responsáveis pelo planejamento detalhado dos recortes.
- Nenhuma fonte transversal substitui `docs/lp-planejamento.md`.
- Referências históricas não precisam ser reescritas.
- Nenhuma alteração de banco, schema, infraestrutura ou arquitetura.

99. Changelog
v1.5.171 — 20/08/2026 — Registrada a implementação repo-only tecnicamente aprovada da E21.2.4: gestão administrativa por ambiente/workload, lifecycle explícito, reautorização server-side, prova pelos quatro transportes existentes e falha fechada; apply, validações hospedadas, smoke real, ativação e cutover permanecem pós-merge, sem iniciar a E21.3.

v1.5.170 — 20/08/2026 — Registrada a implementação repo-only tecnicamente aprovada da E21.2.3: fonte operacional por ambiente/workload, bootstrap, lifecycle transacional, resolver assíncrono fail-closed, quatro consumers, proveniência, validação de snapshots e provas SQL; apply, Security Controls, snippet real e cutover permanecem pós-merge, e a E21.2.4 fica autorizada a iniciar.

v1.5.140 — 11/08/2026 — Implementada no repositório a E19.4.4 com materialização inicial 1:1 write-once, conteúdo e snapshot runtime v1 coerentes, adapter server-only, migration transacional, readiness fail-closed e casos executáveis; apply e prova hospedada permanecem nos gates pós-merge/E19.4.5.

v1.5.131 — 08/08/2026 — Fechada a E19.2 após o merge do PR #700: migration aplicada, verificador SQL read-only aprovado e validação funcional hospedada autenticada concluída; preservados os limites de não geração, não publicação, ausência de tracking/CRM/capability nova e ausência de infraestrutura de assets.

v1.5.128 — 07/08/2026 — Reconciliado o PR #689 com a conclusão da E9.7 integrada à `main`, preservando integralmente o contrato canônico de capacidades e a implementação candidata aprovada da E12.5; inspeção final e merge humano permanecem pendentes.

v1.5.127 — 07/08/2026 — Fechada documentalmente a implementação candidata da E12.5 para diagnóstico e navegação operacional do Admin Dashboard, com contratos existentes preservados, QA visual autenticado aprovado e inspeção final pós-reconciliação com a `main` ainda pendente.

v1.5.125 — 06/08/2026 — Fechado o contrato mínimo da E20.2 v2 com política explícita de substituição por LP: oferta, descrição e logo usam `forbidden`, paleta usa `explicit_allowed`, campos próprios da LP usam `not_applicable`, e especialização taxonômica permanece distinta da substituição de valores concretos.

v1.5.124 — 05/08/2026 — Refinada a E20.2 com catálogo v2 de 23 campos: preservados integralmente os 19 campos da v1 e adicionados os quatro mínimos do Starter, com validações estritas de strings, referência opaca de asset e paleta hexadecimal, sem banco, UI, persistência, upload, geração ou infraestrutura.

v1.5.123 — 04/08/2026 — Reorganizada a E19 conforme `docs/template-roadmap.md`: removidos os blocos redundantes e defasados, renumerado o recorte material concluído para 19.1, eliminados registros vazios e referências futuras superadas e mantida a próxima evolução sem numeração antecipada até a avaliação residual e o respectivo plano-base.

v1.5.122 — 04/08/2026 — Garantido no máximo um taxon primário ativo por conta e reconciliada a retirada da E12.4.4 da implementação.

v1.5.121 — 04/08/2026 — Concluída documentalmente a correção de cardinalidade da E12.4.3.2 após gate funcional aprovado; registrada a E12.4.4 para classificar gaps modulares, problemas de pesquisa ou modelagem e requisitos globais de composição, sem implementação no PR #681.

v1.5.118 — 03/08/2026 — Registrada a correção localizada do contrato de cardinalidade da evolução do perfil com IA, preservando validação fail-closed, `active v1`, ausência de retry e gate único no Preview após revisão independente.

v1.5.117 — 30/07/2026 — Planejada a E11.2 com fases executáveis E11.2.3, E11.2.4 e E11.2.5; v1 aprovada e Processo automatizado escolhido, aguardando merge humano.

v1.5.116 — 30/07/2026 — Registrados o merge do PR #656, a habilitação da E11, o redeploy e o smoke final aprovado em Production.

v1.5.115 — 30/07/2026 — Registrada a aprovação dos testes humanos da correção concorrente da E11.1.7 no Preview autorizado, removida a pendência de reteste e mantida Production desabilitada até o merge humano do PR #656.

v1.5.114 — 30/07/2026 — Reconciliada a E12.4.3.2 para criação e evolução do perfil em `draft`, baseline ativo revalidado, ações contextuais, candidata e diff transitórios, aplicação separada do salvamento e pesquisa bruta complementar opcional; E20.3.5 mantida como evolução mínima.

v1.5.113 — 29/07/2026 — Planejada a E12.4.3.2 com cobertura por `lp_sections`, recomendações deduplicadas, prioridade e ordem determinísticas, auditoria da decisão sobre gaps e evolução E20.3.5; decisões de edição e regeneração permanecem para o futuro plano-base da E19.4.

v1.5.111 — 28/07/2026 — Corrigido o registro do transporte concorrente do `invite_state`: estado assinado por emissão no `redirectTo`, template sem metadata compartilhado e reteste corretivo de Preview preparado, mantendo Production desabilitada.

v1.5.108 — 28/07/2026 — Registrada a aprovação da matriz hospedada da E11.1.7 em Preview, com Production mantida desabilitada até o merge humano e o smoke pós-merge.

v1.5.102 — 26/07/2026 — E20.3 implementada no PR #644: E20.3.3 concluída com migration versionada e aplicação pendente do merge; E20.3.4 implementada e validada; fechamento da fase pendente apenas de merge, apply automático e verificação read-only pós-apply.

v1.5.101 — 25/07/2026 — Promovidos `comparison@v1`, `comparison.standard@v1`, `lead_capture@v1` e `lead_capture.form@v1` ao catálogo canônico da E18.5, totalizando doze módulos, quatorze variantes e 34 casos executáveis, com Form reutilizado e mecanismos centrais preservados.

v1.5.100 — 23/07/2026 — Consolidada a moldura discriminada de interações da E18.5, com Form e Accordion, capabilities derivadas, fronteira coerente da Hero e prova sintética de reutilização sem ampliar os mecanismos arquiteturais.

v1.5.99 — 23/07/2026 — Consolidada a implementação material da E18.5 com dez módulos e doze variantes, `benefits.standard@v1`, `hero.form@v1`, sources combinadas, proteções executáveis e `prod#17` ampliado ao contrato abstrato do Hero Form.

v1.5.98 — 23/07/2026 — Detalhada a evolução planejada da E18.5 em sete subseções canônicas, preservando o estado material vigente e definindo extensões atômicas, sources junto dos fields, proteções do núcleo executável e limites antes da E20.3.

v1.5.97 — 23/07/2026 — Abandonada a substituição integral planejada para a E18.5; preservado o núcleo repo-only incorporado pelo PR #590 e redirecionado o plano para otimizações pontuais, com incorporação futura de `benefits.standard@v1` e `hero.form@v1` e uso do PR #617 como evidência experimental sem merge.

v1.5.96 — 21/07/2026 — E18.5 reorganizada conforme `docs/template-roadmap.md`: registros de implementação movidos para 18.5.2 sem artefatos `docs/**`, `prod#17` registrado como update aplicado ao contrato abstrato de `faq.accordion@v1`, conteúdos implementados distribuídos entre 18.5.3 e 18.5.9 e status atualizado após aprovação e merge do PR #590.

v1.5.95 — 21/07/2026 — E18.5 implementada e reconciliada como catálogo repo-only de nove módulos e dez variantes de `landing_page`, com fields e mapas por variante, perfis de funil fechados, resolução efetiva fail-closed e API pública mínima, pendente do gate final do Analista.

v1.5.94 — 15/07/2026 — E20 criada no roadmap e 20.2 concluída com catálogo declarativo versionado de entradas de `landing_page` por taxon e plano, resolução repo-only, herança taxonômica, proveniência e falha fechada, sem banco, rota, UI ou valores operacionais.

v1.5.93 — 14/07/2026 — Ajustada a E10.8 para explicitar os quatro blocos obrigatórios, a versão comum dentro de cada `audience_scope` e a independência de versões entre `end_customer` e `business_buyer`.

v1.5.92 — 14/07/2026 — E10.8 concluída com resolução server-side, read-only, tipada e fail-closed das pesquisas estruturadas de `landing_page`, preservando precedência, atomicidade e proveniência sem alteração de banco ou implementação dos consumidores futuros.

v1.5.91 — 13/07/2026 — E18.4 consolidada como parametrização raiz versionada da família `landing_page`; removida a implementação anterior de composição e separado o recorte futuro 18.5 para módulos e variantes.

v1.5.90 — 07/07/2026 — E18.4 concluída como base técnica repo-only de composição `landing_page`, com catálogo mínimo, contratos técnicos, registry, schemas, renderer mínimo, resolver/validador e limites de `config_json`, sem liberação automática de registros-base, LP teste, rota pública, Admin, LP Builder, automação, job ou agente.

v1.5.89 — 04/07/2026 — E9.7 concluída com liberação manual administrativa mínima por `platform_admin`, persistência em `public.account_commercial_entitlements`, concessão/atualização/cancelamento manual, view efetiva validada e decisão de não criar superfície artificial para testar LP Builder.

v1.5.88 — 02/07/2026 — E9 Fase 5 fechada documentalmente após a E19 entregar o ponto produtivo real de criação mínima de LP; gate comercial confirmado antes do insert em `public.account_landing_pages`, com fail-closed por entitlement ausente.

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
