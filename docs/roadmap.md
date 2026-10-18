0. Introdução

0.1 Cabeçalho
- Data: 18/10/2026
- Versão: v1.5.259

0.2 Contrato do documento (consulta)
- Estado vigente dos casos; sem narrativa operacional.

0.2.1 TIPO_DO_DOCUMENTO
- TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
- Consultar para funcionalidades, estado, decisões, dependências, limites, pendências e registros materiais de casos.
- Fontes: Base Técnica (docs/base-tecnica.md), Schema (docs/schema.md), Platform Config (docs/platform-config.md), Automations (docs/automations.md). Histórico/evidências no Git/PRs.

1. E1 — Estrutura de Dados
- Objetivo: fundação multi-tenant.
- Status: concluído.

1.1 Base estrutural multi-tenant

1.1.1 Objetivo e status
- Objetivo: contas, memberships, planos, parceiros e auditoria.
- Status: implementado.

1.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.accounts`;
    - `public.account_users`;
    - `public.audit_logs`;
    - `public.plans`;
    - `public.partners`;
    - `public.partner_accounts`;
    - `public.v_access_context_v2`;
    - `public.v_account_effective_limits`;
    - `public.v_account_effective_limits_secure`;
    - `public.v_audit_logs_norm`.
- Referências:
  - Contrato atual do banco: `docs/schema.md` — seções 1, 2 e 4.

1.1.3 Invariantes preservados
- Status: vigente.
- Conteúdo: unicidade, último owner e auditoria em docs/schema.md — 1.1–1.3/4.

1.1.4 Limite do recorte
- Status: vigente.
- Conteúdo: fundação; evolução nos casos responsáveis.

2. E2 — Núcleo de Acesso
- Objetivo: acesso básico.
- Status: concluído; jornadas E5/E8/E11.

2.1 Autenticação e autorização básicas

2.1.1 Objetivo e status
- Objetivo: acesso por identidade/papel.
- Status: implementado.

2.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.is_super_admin()`;
    - `public.is_platform_admin()`;
    - `public.has_account_min_role(uuid, text)`.
- Referências:
  - Arquitetura de acesso e fluxos de Auth: `docs/base-tecnica.md` — seção 5.
  - Helpers e políticas atuais: `docs/schema.md` — seções 1.1 a 1.7 e 3.3.
  - Redirects e envio transacional de Auth: `docs/platform-config.md` — seções 4.4 e 4.5.

2.1.3 Identidade e papéis
- Status: vigente.
- Conteúdo: e-mail/senha; papéis em Schema 1.2/3.3; platform_admin inclui super_admin, sem membership (lib/access/guards.ts). Autenticação não autoriza conta.

2.1.4 Autorização de dados
- Status: vigente.
- Conteúdo: RLS/helpers no Schema 1/3.3; autorização server-side em Base Técnica 5.

2.1.5 Login e recuperação de senha
- Status: implementado.
- Conteúdo: jornadas E5; tokens/Auth em Base Técnica 5.3, redirects/SMTP em Platform Config 4.4–4.5.

2.1.6 Limites do recorte
- Status: vigente.
- Conteúdo: E8/E11; Magic Link/social/2FA sem implementação ou pendência aprovada.

3. E3 — Adapters Base
- Objetivo: adapters server-side.
- Status: concluído.

3.1 Fundação de adapters server-side

3.1.1 Objetivo e status
- Objetivo: dados normalizados fora da UI.
- Status: implementado.

3.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/access/adapters/accountAdapter.ts`;
    - `lib/access/adapters/accessContextAdapter.ts`;
    - `lib/admin/adapters/adminAdapter.ts`.
- Referências:
  - Fluxo de dados e classificação de boundaries: `docs/base-tecnica.md` — seções 3.2, 3.3 e 5.2.
  - Regras de PostgREST e Data API: `docs/base-tecnica.md` — seção 3.12.

3.1.3 Contrato dos adapters-base
- Status: vigente.
- Conteúdo: DTO/RLS/guards em docs/base-tecnica.md — 3.14/5.2–5.3.

3.1.4 Evolução por boundary de domínio
- Status: vigente.
- Conteúdo: boundary/consumidor reais; classificação/PostgREST em Base Técnica 3.3/3.12. Sem genéricos antecipados.

4. E4 — Account Dashboard (Infraestrutura SSR)
- Objetivo: gateway/seção privada.
- Status: concluído.

4.1 Gateway e seção privada do Account Dashboard

4.1.1 Objetivo e status
- Objetivo: proteção SSR sem loop/exposição.
- Status: implementado.

4.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/page.tsx`;
    - `app/a/home/page.tsx`;
    - `app/a/[account]/layout.tsx`;
    - `app/a/_server/section-guard.ts`;
    - `providers/AccessProvider.tsx`;
    - `app/auth/confirm/info/page.tsx`.
- Referências:
  - Arquitetura de acesso e gateway privado: `docs/base-tecnica.md` — seção 5.
  - Contrato do Access Context: `docs/schema.md` — seção 2.1.

4.1.3 Gateway e destino inicial
- Status: vigente.
- Conteúdo: /a → /a/home público; retomada/fallback/primeira conta conforme docs/base-tecnica.md — 5.4.

4.1.4 Seção privada e contexto para a UI
- Status: vigente.
- Conteúdo: guard/contexto sanitizado/cookie/cache conforme Base Técnica 5.1–5.2/3.13.

4.1.5 Limites e evoluções posteriores
- Status: vigente.
- Conteúdo: E8/E10/E11/E15/E16; LP retirada em E22.4.

5. E5 — UI/Auth Account Dashboard
- Objetivo: jornadas page-based de Auth.
- Status: implementado; pendências em 5.2.5.

5.1 Login e recuperação de senha

5.1.1 Objetivo e status
- Objetivo: login e recuperação seguros.
- Status: implementado.

5.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/auth/login/page.tsx`;
    - `components/login-form.tsx`;
    - `app/auth/forgot-password/page.tsx`;
    - `components/forgot-password-form.tsx`;
    - `app/auth/update-password/page.tsx`.
- Updates:
  - Aplicados:
    - `prod#16`;
    - `prod#17`.
- Referências:
  - Contrato técnico de sessão e Auth: `docs/base-tecnica.md` — seção 5.3.
  - Redirects e envio transacional: `docs/platform-config.md` — seções 4.4 e 4.5.

5.1.3 Fluxo page-based
- Status: vigente.
- Conteúdo: páginas login/recuperação/nova senha, retorno interno/fallback /a/home/cooldown; segurança em docs/base-tecnica.md — 5.3.

5.1.4 Mensagens públicas de erro
- Status: implementado.
- Conteúdo:
  - Credenciais: `E-mail ou senha inválidos.` (anti-enumeração).
  - Não confirmado: `Não foi possível entrar. Verifique se o e-mail foi confirmado e tente novamente.` Sem reenvio extra.
  - Operacional/desconhecido: `Não foi possível entrar agora. Tente novamente em instantes.` Sem erro bruto; logs em Base Técnica 5.3.3.
  - Login válido/redirect/alerta programático/Esqueci minha senha preservados.

5.2 Signup, confirmação e e-mail já cadastrado

5.2.1 Objetivo e status
- Objetivo: signup/confirmação/duplicidade.
- Status: implementado com reenvio.

5.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/auth/sign-up/page.tsx`;
    - `app/auth/sign-up-success/page.tsx`;
    - `app/auth/confirm/route.ts`.
  - Ajustados:
    - `components/sign-up-form.tsx`.
- Referências:
  - Contrato técnico de signup e confirmação: `docs/base-tecnica.md` — seções 5.3.2 e 5.3.3.
  - Redirects e envio transacional: `docs/platform-config.md` — seções 4.4 e 4.5.

5.2.3 Signup e confirmação anti-scanner
- Status: vigente.
- Conteúdo: /auth/confirm → /a/home; sign-up-success orienta confirmar. Anti-scanner/GET/POST/sessão/logs seguros em Base Técnica 5.3.2–5.3.3.

5.2.4 Estado de e-mail já cadastrado
- Status: implementado.
- Conteúdo: duplicidade/sem identidade nova substitui senha/submit por orientação/reenvio Supabase/login/troca de e-mail. Cooldown/contador/feedback/rate limit; sem infra própria ou distinção pública confirmado/não.

5.2.5 Pendências residuais de UX e validação
- Status: pendente.
- Conteúdo: copy/erros em inglês/do provider; happy path signup/e-mail/confirmação/gateway mobile sem prova conclusiva.

5.3 E-mail transacional do Supabase Auth

5.3.1 Objetivo e status
- Objetivo: entrega transacional Auth.
- Status: concluído.

5.3.2 Registros do recorte
- Referências:
  - SMTP, sender, DNS e estado operacional: `docs/platform-config.md` — seção 4.5.

5.3.3 Decisão operacional vigente
- Status: vigente.
- Conteúdo: SMTP/sender/DNS/mailbox em Platform Config 4.5/5. Subdomínio só por escala/volume/reputação justificando configuração/plano adicionais.

6. E6 — Design System e UI Base
- Objetivo: identidade e UI base reutilizável.
- Status: implementado; adoção incremental, logo oficial ainda não versionada.

6.1 Fundamentos visuais e identidade

6.1.1 Objetivo e status
- Objetivo: fundamentos visuais próprios sobre shadcn.
- Status: concluído.

6.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/layout.tsx`;
    - `app/globals.css`;
    - `tailwind.config.ts`;
    - `components/layout/Header.tsx`;
    - `components/layout/UserMenu.tsx`;
    - `components/features/account-switcher/AccountSwitcherList.tsx`.
- Referências:
  - Contrato visual vigente: `docs/design-system.md` — seções “Residência e fundamentos visuais” e “Regras de uso”.

6.1.3 Base visual vigente
- Status: implementado.
- Conteúdo: identidade/tokens em docs/design-system.md e CSS/Tailwind.

6.1.4 Identidade provisória e limite
- Status: asset oficial pendente.
- Conteúdo: wordmark provisória; sem branding por cliente/migração de kit aprovados.

6.2 Biblioteca de componentes base

6.2.1 Objetivo e status
- Objetivo: componentes base.
- Status: disponíveis/adotados.

6.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `components/ui/form-field.tsx`;
    - `components/ui/select.tsx`.
  - Ajustados:
    - `components/ui/button.tsx`;
    - `components/ui/card.tsx`;
    - `components/ui/input.tsx`;
    - `components/login-form.tsx`;
    - `components/sign-up-form.tsx`;
    - `components/forgot-password-form.tsx`;
    - `app/auth/update-password/page.tsx`.
- Referências:
  - Componentes e APIs mínimas: `docs/design-system.md` — seções “Componentes padronizados” e “API mínima esperada”.

6.2.3 Biblioteca vigente e limite
- Status: vigente.
- Conteúdo: APIs/acessibilidade no código/Design System; variação só por uso imediato, sem framework próprio.

6.3 Estados visuais e feedback

6.3.1 Objetivo e status
- Objetivo: feedback/estados.
- Status: implementado.

6.3.2 Registros do recorte
- Repositório:
  - Criados:
    - `components/ui/textarea.tsx`;
    - `components/ui/feedback-message.tsx`;
    - `components/ui/empty-state.tsx`;
    - `components/ui/loading-state.tsx`.
  - Ajustados:
    - `components/forgot-password-form.tsx`;
    - `app/auth/update-password/page.tsx`;
    - `app/a/[account]/page.tsx`;
    - `app/a/[account]/loading.tsx`.
- Referências:
  - Estados reutilizáveis: `docs/design-system.md` — seções “Componentes padronizados”, “API mínima esperada” e “Aplicação mínima visível atual”.

6.3.3 Estados vigentes e limite
- Status: vigente.
- Conteúdo: Design System; sem framework extra.

6.4 Padrões de layout para dashboards

6.4.1 Objetivo e status
- Objetivo: layout de dashboard.
- Status: Admin vigente, workspace LP retirado.

6.4.2 Registros do recorte
- Referências:
  - Superfície administrativa: `docs/design-system.md` — seção “Superfície administrativa do Admin”.

6.4.3 Padrões vigentes e limites
- Status: vigente.
- Conteúdo: Design System; sem redesign/componentização antecipados.

7. E7 — Conta Consultiva — retirada
- Objetivo: destino da Conta Consultiva.
- Status: retirado.

7.1 Encerramento do fluxo consultivo legado

7.1.1 Objetivo e status
- Objetivo: encerrar legado consultivo.
- Status: concluído.

7.1.3 Estado final e destino
- Status: retirado.
- Conteúdo: sem Admin/onboarding/token/banco/runtime próprios; UX em E10.3.

7.1.4 Limite de retomada
- Status: vigente.
- Conteúdo: retomada só com recorte aprovado; sem reconstrução/Billing pendentes.

8. E8 — Access Context e Governança
- Objetivo: decisão canônica de acesso por conta.
- Status: implementado; compatibilidade residual em 8.1.5.

8.1 Decisão canônica de acesso

8.1.1 Objetivo e status
- Objetivo: decidir acesso por conta.
- Status: implementado.

8.1.2 Registros do recorte
- Referências:
  - Arquitetura de acesso, guards e consumidores: `docs/base-tecnica.md` — seções 5.1 e 5.2.
  - View canônica do Access Context: `docs/schema.md` — seção 2.1.

8.1.3 Autoridade e decisão
- Status: vigente.
- Conteúdo: view Schema 2.1; decisão/contexto/falhas em docs/base-tecnica.md — 5.1–5.2.

8.1.4 Governança, bloqueios e rastreabilidade
- Status: vigente.
- Conteúdo: rastreio/redirect/cookie em Base Técnica 5; gateway E4, bloqueios E15/E16.

8.1.5 Compatibilidade residual
- Status: residual, não autoritativo.
- Conteúdo: placeholders getAccessContext.ts (is_super_admin/acting_as/plan/limits) não autorizam. Guards/E9 governam privilégios/comercial; remoção só por consumo real, sem refactor antecipado.

9. E9 — Billing, trial e entitlements
- Objetivo: entitlement local distinto de lifecycle.
- Status: manual/Stripe implementados; trial/provedores alternativos não, capacidades planejadas.

9.1 Base universal de entitlement comercial

9.1.1 Objetivo e status
- Objetivo: elegibilidade comercial local.
- Status: implementado.

9.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_commercial_entitlements`
    - `public.v_account_commercial_entitlement_effective`
- Repositório:
  - Criados:
    - `supabase/migrations/20260628184945_e9_commercial_entitlements.sql`
    - `supabase/snippets/e9_phase_3_entitlements_verify.sql`
    - `lib/commercial-entitlements/contracts.ts`
    - `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`
    - `lib/commercial-entitlements/index.ts`

9.1.3 Separação entre lifecycle operacional e condição comercial
- Status: vigente.
- Conteúdo: só entitlement válido libera uso; não deriva de status/setup/membership/access/plans legados.

9.1.4 Origem comercial e confirmação
- Status: pago/manual implementados, trial futuro.
- Conteúdo: origens plano_pago_confirmado/liberacao_manual; Checkout/webhook confirmam/persistem idempotentemente, não autorizam uso diretamente.

9.1.5 Planos comerciais canônicos
- Status: vigente.
- Conteúdo: lib/billing-checkout/contracts.ts; plan.ts legado sem autoridade comercial.

9.1.6 Modelo mínimo de entitlement comercial
- Status: implementado.
- Conteúdo: modelo/sinal em docs/base-tecnica.md — 3.14.1 e Schema 1.5.

9.1.7 View efetiva
- Status: implementado.
- Conteúdo: view efetiva no Schema 2.5; inclui liberação manual.

9.1.8 Signal server-side
- Status: implementado.
- Conteúdo: API lib/commercial-entitlements conforme Base Técnica 3.14.1.

9.1.9 Gate histórico do LP Builder — retirado
- Status: retirado (E19).
- Conteúdo: sem gate LP; consumidores independentes preservados.

9.1.10 Fail-closed, limites e ressalvas
- Status: vigente.
- Conteúdo: sinal inválido/ausente/erro não libera uso (Base Técnica 3.14.1); sem LP legado.

9.2 Liberação manual administrativa mínima

9.2.1 Objetivo e status
- Objetivo: conceder/atualizar/cancelar manualmente.
- Status: concluído.

9.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`
    - `app/admin/(protected)/contas/[accountId]/actions.ts`
  - Ajustados:
    - `app/admin/(protected)/contas/[accountId]/page.tsx`
- Updates:
  - Aplicados:
    - `supa#40`
    - `prod#19`

9.2.3 Contrato operacional mínimo
- Status: implementado.
- Conteúdo: platform_admin, origem manual/plano canônico/vigência válida/metadata mínima; sem duplicação/conflito com pago/trial, conforme Base Técnica 3.14.2.

9.3 Trial

9.3.1 Objetivo e status
- Objetivo: trial por entitlement.
- Status: não implementado, recorte aprovado necessário.

9.3.3 Trial como origem futura de entitlement
- Status: futuro.
- Conteúdo: E9.1, distinto de manual/lifecycle.

9.3.4 Vigência, expiração e limites a definir
- Status: a definir.
- Conteúdo: vigência, expiração, limites e efeitos comerciais.

9.3.5 Pendências para implementação operacional
- Status: não implementado.
- Conteúdo: operação/auditoria exigem aprovação; manual não implementa trial.

9.4 Stripe

9.4.1 Objetivo e status
- Objetivo: Checkout/webhook Stripe.
- Status: subscription teste/invoice.paid implementados.

9.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.stripe_webhook_events`
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

9.4.3 Checkout mínimo
- Status: implementado em teste.
- Conteúdo: Checkout Session subscription server-side; free/light/PlanId legado fora do pago canônico.

9.4.4 Webhook mínimo
- Status: implementado.
- Conteúdo: POST /api/stripe/webhook; segurança/persistência em Base Técnica 3.14.3.

9.4.5 Eventos aceitos, auxiliares e ignorados
- Status: vigente.
- Conteúdo: invoice.paid ativa/renova; checkout.session.completed auxiliar; customer.subscription.deleted/invoice.payment_failed controlados/ignorados, sem liberar uso.

9.4.6 Idempotência e persistência
- Status: implementado.
- Conteúdo: event_id único; failed/processing antigo reprocessados via stale_processing (Schema 1.5.7).

9.4.7 Limites: Stripe não substitui entitlement local
- Status: vigente.
- Conteúdo: sucesso/Checkout/webhook não substituem sinal local E9.1.

9.5 Mercado Pago

9.5.1 Objetivo e status
- Objetivo: provedor alternativo.
- Status: adiado, sem integração/credencial.

9.5.3 Critérios para abertura futura
- Só recorte aprovado, conforme E9.1.

9.6 Asaas

9.6.1 Objetivo e status
- Objetivo: provedor alternativo.
- Status: não implementado, sem integração/credencial.

9.6.3 Critérios para abertura futura
- Só recorte aprovado, conforme E9.1.

9.7 Catálogo canônico de capacidades e limites por plano

9.7.1 Objetivo e status
- Objetivo: capacidades/limites por plano.
- Status: contrato concluído; catálogo/consumo planejados, execução não autorizada.

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
  - Contrato técnico: `docs/base-tecnica.md` — seção 3.11.

9.7.3 Contrato canônico e fonte de resolução
- Status: concluído.
- Conteúdo: contratos/tipos/validator em lib/commercial-capabilities, governança Base Técnica 3.11. Registry vazio/fixtures isoladas, sem Starter inferido; -1 ilimitado só se contratado. Sem banco/get_feature/grants/snapshot/consumidor/infra novos.

9.7.4 Catálogo inicial do Starter
- Status: planejado, não autorizado.
- Conteúdo: só aprovadas com consumidor real/aprovado imediato; definição ≠ valor Starter ≠ recurso existente. Candidatas são dependências, sem extrapolar demais planos.

9.7.5 Resolução e contrato de consumo pelo plano efetivo
- Status: planejado, não autorizado.
- Conteúdo: planKey efetivo → capacidade canônica server-side; medição/gate no consumidor. Ausente/desconhecido/inválido falha fechado, sem inferência UI (Base Técnica 3.11).

10. E10 — Account Dashboard e jornada da conta
- Objetivo: jornada da conta.
- Status: operacional; pendências 10.3.3/10.7.6. Factual retirado em E22.7.

10.3 Navegação multi-conta e cabeçalho

10.3.1 Objetivo e status
- Objetivo: trocar/retomar conta permitida.
- Status: implementado; nova conta indisponível.

10.3.2 Registros do recorte
- Banco:
  - Criados:
    - `public.v_user_accounts_list`
- Repositório:
  - Criados:
    - `app/api/user/accounts/route.ts`
    - `components/features/account-switcher/AccountSwitcher.tsx`
    - `components/features/account-switcher/AccountSwitcherTrigger.tsx`
    - `components/features/account-switcher/AccountSwitcherList.tsx`
    - `components/features/account-switcher/useAccountSwitcher.ts`
    - `components/features/account-switcher/useUserAccounts.ts`
  - Ajustados:
    - `app/a/home/page.tsx`
    - `app/a/[account]/layout.tsx`
    - `app/a/_server/section-guard.ts`
    - `components/layout/Header.tsx`
    - `components/layout/UserMenu.tsx`
    - `providers/AccessProvider.tsx`
- Referências:
  - Contrato de banco: `docs/schema.md` — seção 2.2.

10.3.3 Experiência vigente
- Header: conta/status/nicho e membros autorizados E11. Switcher por vínculos, oculto com até uma conta; teclado/foco/loading/erro, bloqueados não clicáveis. Retomada por cookie HttpOnly de 90 dias (Base Técnica 5.1.2).
- Criar outra conta: /a/home?consultive=1 inefetivo. Switcher não emite account_switcher_open/account_selected/create_account_click.

10.4 Primeiros passos com status `pending_setup`

10.4.1 Objetivo e status
- Objetivo: destino do formulário.
- Status: substituído por E10.9.

10.4.2 Registros do recorte
- Referências:
  - Jornada substituta: `docs/roadmap.md` — seções 10.9, 10.11 e 10.12.
  - Dados históricos preservados: `docs/schema.md` — seção 1.8.

10.4.3 Campos e validação compartilhada
- Status: retirado.
- Conteúdo: jornada 10.9–10.12; sem formulário paralelo.

10.4.4 Persistência e transição
- Status: substituído.
- Conteúdo: account_profiles histórico, sem adapter órfão; timestamps não autorizam acesso/logs. Transição em E16.1.4.

10.5 Taxonomia, pesquisa de mercado e resolução de nicho

10.5.1 Objetivo e status
- Objetivo: classificar/contextualizar nicho.
- Status: implementado.

10.5.2 Registros do recorte
- Banco:
  - Criados:
    - `public.taxon_message_guides`
    - `public.account_niche_resolutions`
    - `public.account_taxonomy`
  - Ajustados:
    - `public.taxon_market_research`
    - `public.taxon_market_research_items`
- Repositório:
  - Criados:
    - `lib/onboarding/niche-resolution/contracts.ts`
    - `lib/onboarding/niche-resolution/deterministicConfidence.ts`
    - `lib/onboarding/niche-resolution/adapters/taxonMatchAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `app/a/[account]/niche-resolution-actions.ts`
    - `app/a/[account]/_components/NicheResolutionCard.tsx`
    - `supabase/migrations/20260804201831_account_taxonomy_one_active_primary.sql`
    - `supabase/snippets/account_taxonomy_one_active_primary_verify.sql`
    - `supabase/snippets/e10_5_5_nicho_carregamento.sql`
    - `supabase/snippets/e10_5_5_nicho_verificacao.sql`
  - Ajustados:
    - `app/a/[account]/actions.ts`
    - `app/a/[account]/page.tsx`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.11–1.19.
  - Fluxo operacional: `docs/prompt-nicho-identificacao.md`, `docs/prompt-nicho-pesquisa.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/prompt-nicho-carregamento.md` e `docs/prompt-nicho-verificacao.md`.

10.5.3 Base de taxonomia e pesquisa
- Catálogo/pesquisa: Schema 1.11–1.19 e referências 10.5.2. Comercial exige pesquisas v1 ativas business_buyer/end_customer e itens ativos strategic_core/lp_overview/lp_sections/seo.

10.5.4 Resolução determinística e IA
- Determinístico antes da IA complementar; confirmação, proveniência e restrições em docs/base-tecnica.md — 3.14.5 e docs/automations.md — 3.5.

10.5.5 Confirmação pelo usuário
- Card só em active sem primário e com resolução acionável: confirmar, escolher ou reescrever; fallback sem vínculo inventado.

10.5.6 Classificação oficial e consumo
- Vínculo/primário único em account_taxonomy; automação só por alta confiança determinística, sem substituir primário diferente; cardinalidade inválida bloqueia (Base Técnica 3.14.5). Consumo E10.7 ou fallback E10.6.

10.6 Página comercial genérica

10.6.1 Objetivo e status
- Objetivo: comercial genérico.
- Status: generic-v1 implementado como fallback.

10.6.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.audit_context_event`
- Repositório:
  - Criados:
    - `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
    - `app/a/[account]/_components/commercial-page/actions.ts`
    - `app/a/[account]/_components/commercial-page/checkout-actions.ts`
    - `app/a/[account]/_content/commercial-page/generic-v1.ts`
    - `supabase/migrations/20260614124000_fix_audit_context_event_event_column.sql`
  - Ajustados:
    - `app/a/[account]/page.tsx`

10.6.3 Experiência e tracking
- Seções em generic-v1.ts (10.6.2); planos → Checkout mensal E9.4, CTA final → WhatsApp, papéis E11.2.
- commercial_page_view/commercial_primary_cta_click/commercial_plan_cta_click via audit_context_event, account_id sem PII direta.

10.6.4 Limites e fallback
- Oferta ilustrativa; card pendente acima. Ausência/erro/bundle inválido mantém genérica; sem IA na renderização.

10.7 Páginas comerciais personalizadas por nicho

10.7.1 Objetivo e status
- Objetivo: commercial_activation por taxon.
- Status: implementado; copy manual planejada.

10.7.2 Registros do recorte
- Banco:
  - Criados:
    - `public.publish_content_artifact_draft(uuid)`
    - `public.ensure_commercial_activation_composition(uuid)`
  - Ajustados:
    - `public.content_artifacts`
    - `public.content_artifact_research_sources`
- Repositório:
  - Criados:
    - `supabase/migrations/20260621162400_e10_7_admin_artifact_write_publish.sql`
    - `supabase/migrations/20260621181742_e10_7_fix_research_sources_policy_name.sql`
    - `supabase/migrations/20260624203000_e10_7_phase_5_ensure_commercial_activation_composition.sql`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `lib/conversion-content/commercial-activation/composition.ts`
    - `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
    - `app/admin/(protected)/templates/actions.ts`
    - `app/admin/(protected)/templates/commercial-activation/[taxonSlug]/page.tsx`
    - `app/a/[account]/_components/commercial-page/CommercialActivationTrackingScope.tsx`
    - `app/a/[account]/_components/commercial-page/PublishedCommercialActivationPage.tsx`
    - `supabase/snippets/e10_7_phase_7_commercial_activation_contract_verify.sql`
  - Ajustados:
    - `app/admin/(protected)/templates/page.tsx`
    - `app/a/[account]/page.tsx`
    - `lib/conversion-content/adapters/commercialActivationAdapter.ts`
    - `lib/conversion-content/commercial-activation/renderer.tsx`
- Updates:
  - Aplicados:
    - `supa#40`
    - `supa#58`
    - `prod#14`
    - `prod#16`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.22–1.23 e 3.3.

10.7.3 Elegibilidade e geração
- Elegibilidade 10.5.3; template universal/composição por taxon. Oito seções fixas: Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ, CTA final. IA só copy; geração/validação/proveniência em docs/base-tecnica.md — 3.15–3.15.1.

10.7.4 Operação administrativa
- platform_admin: lista /admin/templates; detalhe commercial-activation/[taxonSlug] gera/regenera, preview, diagnóstico/histórico e publica bundle válido transacionalmente, arquivando anterior. Sem edição manual de content_json.

10.7.5 Consumo na conta
- Cadeia do primário ativo resolve published + composição válida/render model ready; ausência/invalidez → generic-v1. Sem draft/archived ou IA runtime; tracking/Checkout/papéis E10.6/E11.2.

10.7.6 Próximo recorte aprovado
- Status: planejado.
- Conteúdo: copy manual/versões simples; sem editor visual/por bloco, published simultâneos ou mudança estrutural/visual/runtime público.

10.8 Resolução de pesquisas estruturadas para `landing_page` — retirada

10.8.1 Objetivo e status
- Objetivo: destino da resolução landing_page.
- Status: retirada (E22.1.6).

10.8.3 Estado e destino
- Sem substituto; retirada em E22.1.2/22.1.6, E20 encerrada em E22.7.

10.9 Pending Setup pré-comercial e continuidade conversacional

10.9.1 Objetivo e status
- Objetivo: setup sem entitlement.
- Status: Production, só legadas; novas em E10.12, sem conversão.

10.9.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_pending_setup_conversations`
    - `public.account_pending_setup_messages`
    - `public.start_account_pending_setup_v1`
    - `public.set_account_pending_setup_preferred_name_v1`
    - `public.claim_account_pending_setup_turn_v1`
    - `public.append_account_pending_setup_turn_v1`
    - `public.complete_account_pending_setup_v1`
- Repositório:
  - Criados:
    - `lib/onboarding/pending-setup/`
    - `app/a/[account]/_components/PendingSetupConversation.tsx`
    - `app/a/[account]/pending-setup-actions.ts`
    - `supabase/migrations/20260920223653_e10_9_pending_setup_conversation.sql`
    - `supabase/tests/e10_9_pending_setup_conversation.test.sql`
  - Ajustados:
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/page.tsx`
    - `lib/onboarding/niche-resolution/`
    - `lib/openai-costs/`
  - Excluídos:
    - `app/a/[account]/_components/PendingSetupFirstSteps.tsx`
    - `lib/onboarding/e10_4_setup_validation.ts`
    - `lib/access/adapters/accountProfileAdapter.ts`
- Referências:
  - Persistência, RLS e grants: `docs/schema.md` — seção 1.19A.

10.9.3 Entrada e identidade sem fricção
- Status: implementado.
- Conteúdo: após confirmar e-mail, reutilizar nome preferido válido ou perguntar uma vez. Sem Site/LP, canal ou Nome do projeto exigidos.

10.9.4 Conversa adaptativa e resolução do nicho
- Status: implementado.
- Conteúdo: nicho E10.5; reserva/atomicidade/retry em docs/base-tecnica.md — 3.14.5–3.14.6.

10.9.5 Histórico conversacional e retomada
- Status: implementado.
- Conteúdo: retomada pending_setup; histórico isolado preservado, sem chat após active (Base Técnica 3.14.6).

10.9.6 Conclusão, cutover e passagem ao comercial
- Status: concluído em Production.
- Conteúdo: transição E16.1.4; legado/comercial independentes preservados, sem E10.4 executável.

10.10 Onboarding factual pós-compra/trial

10.10.1 Objetivo e status
- Objetivo: destino do factual.
- Status: retirado (E22.7); sem apply.

10.10.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_profiles`
    - `public.taxon_factual_fields`
- Repositório:
  - Criados:
    - `supabase/migrations/20260926145500_e10_10_account_factual_profile.sql`
    - `supabase/migrations/20260926171100_e10_10_factual_catalog_cutover.sql`
  - Ajustados:
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/page.tsx`
    - `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
    - `app/a/[account]/_components/onboarding-journey-policy.ts`
    - `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`
    - `lib/commercial-entitlements/index.ts`
    - `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`
    - `package.json`
- Updates:
  - Aplicados: `prod#17`.
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.8 e 1.35.

10.10.3 Recorte factual e cutover
- Status: retirado.
- Conteúdo: exclusão do apply/dados preservados em E22.7.5, sem cutover pendente.

10.10.4 UX factual e prontidão para a Base
- Status: retirado.
- Conteúdo: E10.11, sem prontidão factual.

10.11 Passagem mínima para a Base

10.11.1 Objetivo e status
- Objetivo: nome/contexto consentido na Base.
- Status: operacional em Preview/Production.

10.11.2 Registros do recorte
- Banco:
  - Ajustados: `public.account_pending_setup_conversations`.
  - Criados: `set_account_pending_setup_business_name_v1`, `complete_account_pending_setup_v2`.
- Repositório:
  - Criados: `supabase/migrations/20260928161504_e10_11_pending_setup_business_name.sql`, `supabase/tests/e10_11_pending_setup_business_name.test.sql`, `.github/workflows/e10-11-sql-proof.yml`, `lib/onboarding/pending-setup/config.ts`.
  - Ajustados: `.github/workflows/pipeline-supabase-apply-migrations.yml`, `lib/onboarding/pending-setup/`, `lib/communication-base/`, `app/a/[account]/`.
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.19A e 3.1.2.
  - Configuração operacional: `docs/platform-config.md` — seções 2.3 e gate E10.11.

10.11.3 Nome público e contexto de saída
- Status: implementado.
- Conteúdo: nome público explícito, distinto de preferido/razão social/conta. Copiar de uma conversa concluída; contexto só consentido, sem sincronização reversa. Legado sem nome fica vazio/editável.

10.11.4 Gate e encaminhamento
- Status: Preview/Production habilitados.
- Conteúdo: active resolve entitlement antes da taxonomia. Autorizado → Base, inclusive manual sem taxon; demais → comercial/espera E11.2. Erro de leitura exigida bloqueia; sem E10.10.

10.11.5 Continuidade e regressão
- Status: vigente.
- Conteúdo: nicho/Checkout/membership/entitlement preservados; apply integral suspenso, E10.10 excluído (Platform Config 2.3).

10.12 Atendimento inicial por IA e agente vendedor

10.12.1 Objetivo e status
- Objetivo: entender negócio/necessidade, orientar e definir próximo passo.
- Status: base operacional em Preview/Production; refinamentos do Pending Setup básico implementados na branch, com validação visual autenticada pendente e sem liberação para merge. Legadas E10.9 preservadas. Depende de E10.13, não de PB-B.

10.12.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_context_summaries`
    - `public.commit_account_pending_setup_turn_v3`
- Repositório:
  - Criados:
    - `supabase/migrations/20261011121811_e10_12_summary_capacity.sql`
    - `supabase/rollbacks/20261011121811_e10_12_summary_capacity.rollback.sql`
    - `supabase/tests/e10_12_summary_capacity.test.sql`
  - Ajustados:
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `lib/onboarding/pending-setup/attendance-core.ts`
    - `lib/onboarding/pending-setup/attendance-coordinator.ts`
    - `lib/onboarding/pending-setup/attendance-provider.ts`
    - `lib/onboarding/pending-setup/attendance-validation-cases.ts`
    - `lib/onboarding/text-redaction.ts`
    - `app/a/[account]/_components/PendingSetupConversation.tsx`
- Referências:
  - Memória contextual e autoridades: `docs/base-tecnica.md` — seção 3.14.6.
  - Contrato de banco aplicado: `docs/schema.md` — seções 1.19D e 3.1.3.
  - Apply, reversão e configuração operacional: `docs/platform-config.md` — seções 2.3 e 3.5.

10.12.3 Atendimento, Diálogo da conta e Resumo da conta
- Status: operacional; refinamentos do Pending Setup básico definidos.
- Conteúdo: mensagem/nomes/Diálogo/Resumo, distinções de aceite/proposta, compactação/confirmação e falhas em docs/base-tecnica.md — 3.14.6; sem autoridade/versionamento funcional próprios. Resumo 6.000 caracteres sem meta, entendimento 4.000; demais limites mantidos. Sem teto de três chamadas/tabela/estado/memória/parser por frase/formulário/infraestrutura novos.
- Definido: acolher, pedir nome e nome do negócio, colher só informações essenciais e apresentar brevemente o valor real da LP Factory, sem insistência. Solicitar WhatsApp opcional perto do fim, se ainda não informado; preservar número fornecido no Diálogo e no Resumo existentes. Recusa não bloqueia avanço; fornecimento não autoriza contato posterior.

10.12.4 Identificação pelo catálogo
- Status: operacional; refinamentos do Pending Setup básico definidos.
- Conteúdo: classificação/ausência e vínculo em Base Técnica 3.14.6; catálogo/repertório D21, comparação semântica/pergunta focal. Sem Web classificatória/manutenção de taxons/aliases.
- Definido: comparar atividade, ofertas e público com catálogo/aliases usando conhecimento paramétrico; explicar equivalências e confirmar só classificação segura, sem impor categoria incorreta. Sem correspondência, esclarecer oferta/público; persistindo a ausência, informá-la e preservar no Resumo apenas dados comerciais relevantes e pendência, além do Diálogo integral, para uso futuro autorizado pelo D17.

10.12.5 Repertório do nicho e apoio à venda
- Status: operacional.
- Conteúdo: Entender → Impressionar → Conectar → Avançar sem roteiro/turnos fixos. Após atividade/oferta/necessidade mínimas, insight ligado à proposta real antes de nova pergunta comercial. Informação acessória só se material; identidade/confirmações mantidas.
- D21 contextualiza, não impõe fala ou promessa; serviço/condição/prazo/disponibilidade efetivos exigem fonte comercial vigente. Avançar por 10.12.6, sem esgotar venda/diagnóstico ou interromper avanço útil. D21 governa catálogo/pesquisa/aliases; aprofundamento D17.
- Só leituras independentes paralelas; efeitos/provider/commit ordenados, sem duração ou ganho causal comprovados.

10.12.6 Conclusão e experiência
- Status: operacional; refinamentos do Pending Setup básico definidos.
- Conteúdo: negócio/necessidades compreendidos, orientação/próximo passo claros, categoria confirmada ou ausência explícita; categoria sozinha não conclui. Identidade/E10.11 obrigatórios; WhatsApp opcional conforme 10.12.3. Sem taxon não bloqueia comercial/Base com entendimento suficiente, nem concede entitlement/trial/contratação.
- Definido: conduzir à página comercial mesmo sem nicho identificado, preservando entendimento operacional confirmado e pendência de classificação no Resumo; encerrar sem prolongar a conversa. D15B preservado; sem consulta à Base de Comunicação, pesquisa ou contato posterior com leads, nem promessa de pesquisa/retorno sem capacidade e autorização do D17.
- Redirecionar desvio ocasional; persistência/repetição/circularidade/sem avanço → encerramento cordial com contexto/pendência no Resumo e retomada possível. Sem promessa de análise/prazo/retorno/contato, contador/tempo fixo/failsafe econômico.
- Conflitos/atomicidade/pós-conclusão/Base em Base Técnica 3.14.6; sem continuidade assíncrona. Objeções/comparação/recomendação/contratação aprofundadas no D17 até absorção aprovada.

10.13 Cadastro inicial de taxonomia e inteligência de mercado

10.13.1 Objetivo e status
- Objetivo: carregar Nichos.zip/pasta original e inteligência aproveitável.
- Status: concluído; E10.5/E10.12 preservadas, PB-B não iniciado.

10.13.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.business_taxons`
    - `public.taxon_market_research`
    - `public.taxon_market_research_items`
- Repositório:
  - Criados:
    - `supabase/snippets/e10_13_source_inventory.csv`
    - `supabase/snippets/e10_13_initial_catalog.sql`
    - `supabase/snippets/e10_13_initial_catalog_verify.sql`
    - `supabase/snippets/e10_13_editorial_correction.sql`
    - `supabase/snippets/e10_13_editorial_correction_verify.sql`
    - `supabase/snippets/e10_13_editorial_review.md`

10.13.3 Reconciliação e carga da taxonomia
- Status: concluído; cinco ocorrências/quatro rótulos ambíguos pendentes aceitos.
- Conteúdo: inventário 10.13.2 reconcilia destinos/pais ativos válidos/hierarquia sem duplicação. Só segmentos/nichos seguros ausentes; sem ultranicho, alias, reativação/duplicação de inativo ou nicho por oferta/público/localidade/atributo. Existentes preservados; colisão/concorrência aborta carga inteira.

10.13.4 Adaptação e disponibilidade do conteúdo
- Status: disponível; oito nichos novos sem pesquisa e lacunas de validação/atualização no PB-B não autorizado.
- Conteúdo: panorama/tendências/maturidade digital/oportunidades/diferenciação condicionais por taxon, sem tamanho uniforme; fontes/períodos/incertezas explícitos, indicador rastreável, hipótese distinta de fato empresarial. Leitura autorizada comprovada, preexistentes preservados.
- Sem pesquisa/manutenção periódica de rotina, schema/permissões/UI/runtime/infraestrutura/contato novos. D15B integra conversa; D14D governa dores/crenças/copy/fatos empresariais. Contas/Bases/publicados/entitlement/busca/consumidores preservados.

11. E11 — Gestão de membros e autoridade comercial
- Objetivo: membros e autoridade comercial.
- Status: operacional Preview/Production.

11.1 Gestão de membros e convites

11.1.1 Objetivo e status
- Objetivo: owner/admin gerem admin/editor/viewer.
- Status: gate E11_MEMBERS_ENABLED=true hospedado.

11.1.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_users`
    - `public.accept_account_invite(uuid, integer)`
    - `public.revoke_account_invite(uuid, uuid)`
    - `public.invitation_expires_at(uuid, integer)`
    - `public.invitation_is_expired(uuid, integer)`
    - `public.activate_user_from_auth_hook(jsonb)`
- Repositório:
  - Criados:
    - `supabase/migrations/20260727155312_e11_account_members_security.sql`
    - `supabase/snippets/e11_account_members_verify.sql`
    - `lib/access/account-members/`
    - `app/a/[account]/members/`
    - `app/a/home/PendingInviteActionButton.tsx`
    - `app/a/home/member-invite-actions.ts`
  - Ajustados:
    - `app/a/[account]/layout.tsx`
    - `app/a/home/page.tsx`
    - `app/auth/confirm/route.ts`
    - `app/auth/update-password/page.tsx`
    - `components/layout/Header.tsx`
    - `lib/access/guards.ts`
    - `lib/supabase/service.ts`
    - `package.json`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.2 e 3.4.
  - Configuração hospedada: `docs/platform-config.md` — seções 3.5 e 4.6.

11.1.3 Autoridade e transições
- Rota/leituras/ações só com gate e owner/admin; owner/próprio ator protegidos. Papel/desativação/revogação por membership, idempotentes; boundary account-members, legadas sem EXECUTE runtime.

11.1.4 Convite por e-mail
- Novo/não confirmado: Invite user Auth, estado versionado/assinado por account_user_id; confirmação anti-scanner/senha/ativação isoladas/idempotentes. Validade/reenvio só Auth, sem expiração local/e-mail customizado/hook amplo/job.
- Callback por ambiente em lib/access/account-members/confirm-url.ts; template/allowlist em Platform Config 4.6; origem inválida/ausente bloqueia. Prova Production só convite/confirmação/cadastro/viewer-active/login no tenant, sem cobertura universal de papéis/ambientes/extremos.

11.1.5 Convite dentro do produto
- Confirmado: pendência /a/home sem e-mail; sessão identifica aceite/recusa de um vínculo por tentativa. Canal deve pertencer ao pending atual; ausente/antigo bloqueia. Pending até aceite/recusa/revogação.

11.1.6 Superfície de gestão
- Lista ativos/pendentes; owner/admin convidam/reenviam e operam 11.1.3. Gate ausente/≠true fecha rota/nav/leituras/mutações.

11.2 Autoridade comercial por papel

11.2.1 Objetivo e status
- Objetivo: Checkout/convites por papel/entitlement.
- Status: implementado no servidor/comercial genérico e publicado.

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
- Referências:
  - Entitlement canônico: E9.1.
  - Experiência comercial: E10.6–E10.7.

11.2.3 Checkout
- Só owner, conta/membership active e sem entitlement válido vê/inicia financeiro; action reautoriza, já elegível não assina de novo. Sinal E9.1, pagamento E9.4.
- Até um commercial_checkout_decision allowed/denied/error por decisão, sem PII/efeito no resultado.

11.2.4 Novos convites e reenvio
- Só owner/admin, conta active e elegível. Falta/erro de entitlement bloqueia antes de qualquer Auth/membership/canal/envio. Até um account_member_invite_decision não bloqueante; editor/viewer sem gestão.

11.2.5 Experiência sem entitlement
- Sem entitlement: owner recebe financeiro, demais espera sem cards/CTA financeiro. Mesma política genérica/publicada, contrato E10.7 preservado; autorizado segue E10.11, sem dashboard paralelo.

11.2.6 Operações preservadas
- Só criar/reenviar dependem do entitlement; listar/aceitar/recusar/revogar/desativar/alterar papel independem, sem alteração retroativa de vínculos.

12. E12 — Admin Dashboard
- Objetivo: Admin independente da conta.
- Status: implementado; Auditoria em preparação.

12.1 Contrato administrativo base

12.1.1 Objetivo e status
- Objetivo: delimitar Admin.
- Status: implementado.

12.1.3 Fronteira vigente
- /admin público; internos SSR/platform_admin, pós-login /admin/contas. Shell próprio sem AccountSwitcher/conta ativa; operações só pelos contratos E9.2/E10.7/E21/E25.3.

12.1.4 Áreas atuais
- Navegação responsiva/autorizada conforme components/admin/adminNavigation.ts; Auditoria ainda em preparação.

12.2 Shell, documentação e leituras administrativas base

12.2.1 Objetivo e status
- Objetivo: shell e leituras administrativas.
- Status: implementado.

12.2.2 Registros do recorte
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
    - `components/admin/AdminMobileMenu.tsx`
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
    - `next.config.js`

12.2.3 Entrada e proteção
- Login com next=/admin/contas; requirePlatformAdmin: anônimo → login, sem autoridade → público neutro. Header/sidebar/mobile com largura única.

12.2.4 Documentação read-only
- Leitor filtra/seleciona whitelist fixa; filesystem server-side com tracing explícito, Markdown bruto read-only. Sem GitHub API/editor/publicação/banco.

12.2.5 Leituras e integrações de conta
- Adapters/paginação/filtros conforme Base Técnica 3.14. Resoluções read-only; conta E9.2, taxonomia 12.5.

12.3 Integração administrativa de `commercial_activation`

12.3.1 Objetivo e status
- Objetivo: integrar E10.7.
- Status: implementado.

12.3.2 Registros do recorte
- Referências:
  - Registros materiais e contrato funcional: E10.7.2–E10.7.5.

12.3.3 Superfície integrada
- Superfície/contrato E10.7; layout e cada action reautorizam platform_admin, sem editor visual/LP Builder.

12.4 Perfil de orientação — retirado

12.4.1 Objetivo e status
- Objetivo: destino do perfil.
- Status: retirado (E22.1.4).

12.4.3 Estado e destino
- Exclusivos removidos em E22.1.2/22.1.4, sem dependência na geração.

12.5 Taxonomia e diagnóstico contextual

12.5.1 Objetivo e status
- Objetivo: taxonomia/resoluções/diagnóstico.
- Status: implementado, sem factual E20.

12.5.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/taxonomia/novo/page.tsx`
    - `app/admin/(protected)/taxonomia/actions.ts`
    - `app/admin/(protected)/resolucoes-de-nicho/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `components/admin/AdminTaxonCreateForm.tsx`
    - `components/admin/AdminTaxonManageForm.tsx`
    - `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
    - `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyAdapter.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
- Referências:
  - Retirada factual: `docs/roadmap.md` — seção 22.7.

12.5.3 Taxonomia
- Status: implementado.
- Conteúdo: busca/filtros nível/status; identidade/hierarquia/uso/aliases/diagnóstico comercial. CRUD seguro platform_admin com vínculos/pai ativo/concorrência; novos inativos (Base Técnica 3.14.5).

12.5.4 Resoluções de nicho e navegação
- Read-only: entrada/confiança/determinístico/IA/revisão. Navegação só pelo confirmado; falha não inventa prontidão/resultado, sem perfil/E10.8 órfãos.

12.5.5 Evolução da revisão factual por taxon
- Status: retirado (E22.7).
- Conteúdo: taxonomia independente em 12.5.3.

12.6 Estrutura da LP no Admin Dashboard

12.6.1 Objetivo e status
- Objetivo: consultar raiz LP.
- Status: implementado; demais visões retiradas.

12.6.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/admin/(protected)/estrutura-lp/page.tsx`
    - `lib/admin/adapters/adminLandingPageStructureAdapter.ts`
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    - `components/admin/AdminPageHeader.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/root-resolver.ts`
- Updates:
  - Aplicados:
    - `prod#14`
    - `prod#16`
    - `prod#17`
- Referências:
  - Parâmetros raiz: E18.4.
  - Retirada da gestão factual: `docs/roadmap.md` — seção 22.7.

12.6.3 Consulta vigente
- Status: implementado.
- Conteúdo: /admin/estrutura-lp consulta E18.4 via API pública por versão/preset; query inválida → Parâmetros. Server-only, sem N+1, registry privado, domínio React, factual/IA/publicação.

12.6.4 Evolução do catálogo factual
- Status: retirado (E22.7).
- Conteúdo: sem consumidor/cutover/QA factual pendentes.

12.7 Contrato de apresentação para páginas operacionais de dashboard

12.7.1 Objetivo e status
- Objetivo: apresentação operacional canônica.
- Status: vigente, sem migração automática.

12.7.2 Registros do recorte
- Updates:
  - Aplicados:
    - `prod#17`
- Referências:
  - Contrato visual canônico: `docs/design-system.md` — Contrato de apresentação para páginas operacionais de dashboard.
  - Gate de planejamento: `docs/prompt-estrategista.md`.
  - Gate operacional: `AGENTS.md`.

12.7.3 Materialização canônica do contrato mínimo
- Status: vigente.
- Conteúdo: Design System em 12.7.2; autoridade no domínio, tecnologia de listas aberta.

12.7.4 Refinamento canônico de composição e responsividade
- Status: vigente.
- Conteúdo: contrato 12.7.2 para Admin/Account/Partner funcional, exceto público/LP comercial.

12.7.5 Enforcement do contrato de apresentação
- Status: vigente.
- Conteúdo: implementação/review/QA verificam Design System; exceção funcional só humana.

12.8 Piloto do padrão transversal no fluxo Taxonomia e cobertura factual

12.8.1 Objetivo e status
- Objetivo: pilotar E12.7 na Taxonomia.
- Status: implementado; factual retirado, demais áreas fora.

12.8.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
- Referências:
  - Contrato visual: `docs/design-system.md` — Contrato de apresentação para páginas operacionais de dashboard.

12.8.3 Taxonomia como piloto de coleção e detalhe
- Status: implementado.
- Conteúdo: coleção identidade/nível/estado/diagnóstico/Abrir, busca/filtros nível/estado. Filtros no cabeçalho desktop; mobile compacto/rolagem indicada. Detalhe humano/técnica progressiva; padrão 12.7.2.

12.8.4 Cobertura factual e subtarefas como piloto de interação
- Status: retirado (E22.7).
- Conteúdo: Design System preservado, sem consumidor factual.

13. E13 — Partner Dashboard
- Objetivo: jornada de parceiros.
- Status: não iniciado, sem produto/API.

13.1 Recorte futuro de parceiros

13.1.1 Objetivo e status
- Objetivo: definir atores/permissões/resultado.
- Status: futuro sem escopo aprovado.

13.1.2 Registros do recorte
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.6–1.7.

13.1.3 Estado atual e limite
- Fundação E1/Schema 1.6–1.7; sem branding/gestão de clientes/relatórios. Boundary só com recorte aprovado e consumidor real.

14. E14 — Área pessoal do usuário — não iniciada
- Objetivo: perfil/preferências pessoais.
- Status: não iniciado; sem rota/persistência/boundary.

14.1 Perfil e preferências pessoais

14.1.1 Objetivo e status
- Objetivo: definir campos/autoridade/resultado.
- Status: futuro sem aprovação.

14.1.3 Estado atual e residência das responsabilidades
- Link UserMenu /workspace/profile sem rota/jornada. Seleção E10.3, acesso E8, workspace LP retirado E22.4. Nova área exige recorte pessoal aprovado.

15. E15 — Usuário e membership por conta
- Objetivo: acesso por membership.
- Status: implementado.

15.1 Contrato de membership

15.1.1 Objetivo e status
- Objetivo: papel/status por tenant.
- Status: concluído.

15.1.2 Registros do recorte
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — seções 5.1.1 e 5.4.
  - Contrato de banco: `docs/schema.md` — seções 1.2 e 2.1.
  - Ciclo de convite: E11.1.

15.1.3 Identidade e vínculo
- Identidade global ≠ vínculo por conta; estados/papéis em Schema 1.2/2.1 e Base Técnica 5.1.1, sem reutilizar outro tenant.

15.1.4 Ativação e bloqueios
- Ativação não-owner só por convite validado E11.1. Bloqueios/redirects em E4/E8, sem hook amplo/legadas no runtime.

15.1.5 Usuário sem membership
- Gateway/primeira conta em Base Técnica 5.4; nenhum vínculo → /auth/confirm/info, sem auto-criação no gateway.

16. E16 — Lifecycle operacional de contas
- Objetivo: lifecycle operacional distinto de billing.
- Status: consumo/transição inicial implementados; sem gestão de suspensão/inativação/reativação.

16.1 Estados e transições da conta

16.1.1 Objetivo e status
- Objetivo: unificar status/UX.
- Status: implementado, copy divergente em 16.1.6.

16.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/auth/confirm/account/inactive/page.tsx`
    - `app/auth/confirm/account/suspended/page.tsx`
  - Ajustados:
    - `lib/types/status.ts`
    - `lib/access/adapters/accountAdapter.ts`
    - `app/a/_server/section-guard.ts`
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — seções 5.1.1 e 5.4.
  - Contrato de banco: `docs/schema.md` — seção 1.1.
  - Setup da conta: `docs/roadmap.md` — seções 10.9–10.12.
  - Entitlement comercial: E9.1.

16.1.3 Estados vigentes
- pending_setup → conversa E10.9/E10.12; active → jornada E10.11. inactive/suspended → bloqueio público reversível/administrativo. Conta e membership devem permitir acesso; contrato Base Técnica 5.1.1/5.4.

16.1.4 Transição implementada
- pending_setup → active: conclusão E10.9/E10.12 + E10.11, condicional/transacional/idempotente. Sem outras mutações Admin; billing/trial/pagamento/entitlement não mudam status.

16.1.5 UX dos bloqueios
- Limpar última conta best effort, sem trocar silenciosamente; bloqueios oferecem troca/login e e-mail (inativa) ou suporte (suspensa).

16.1.6 Limite e drift atual
- Copy inactive ainda culpa pagamento/“Reativar / pagar”, sem integração billing/transição automática. Inactive/suspended só consumidos/bloqueados até operação aprovada.

17. E17 — Automações e infraestrutura de validação
- Objetivo: automações/validação controladas.
- Status: implementado conforme docs/automations.md.

17.1 Automações operacionais e validação

17.1.1 Objetivo e status
- Objetivo: operação por Actions.
- Status: implementado.

17.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `.github/workflows/security.yml`
    - `.github/workflows/pipeline-supabase-inspect.yml`
    - `.github/workflows/pipeline-docs-apply-report.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `automations/supabase-inspect/`
    - `automations/docs-apply-report/`
  - Ajustados:
    - `AGENTS.md`
    - `package.json`
- Referências:
  - Catálogo operacional: `docs/automations.md` — automações vigentes.
  - Configuração e secrets por nome: `docs/platform-config.md` — seções 2.2–2.4.
  - Validação local: `docs/base-tecnica.md` — seção 3.4.2.

17.1.3 Estrutura canônica
- Estrutura/runtimes em docs/automations.md; configuração em Platform Config.

17.1.4 Checks e segurança
- Checks/exceção documental em AGENTS.md; security.yml ativo. SQL read-only, mutação só por contrato autorizado.

17.1.5 Facilitadores de teste retirados
- Status: retirados (E22.6), sem substituto.
- Conteúdo: E5/E10.5.6/contas/evidências preservados.

17.1.6 Pipelines operacionais
- Inspect/Docs Apply em Automations 3.1/3.2; Inspect SQL read-only com ingresso financeiro opcional E21 via HMAC. Apply integral suspenso; exceções/gates/decisão por apply em Platform Config 2.3.
- Migrations incrementais imutáveis, sem SQL Editor no fluxo normal (Base Técnica 3.4.4).

17.1.7 Limites
- Casos governam IA de produto, E21 governa workloads/custos. Sem agente autônomo/Agents SDK/substituto Agent Builder.

17.2 Fundação operacional da OpenAI Platform

17.2.1 Objetivo e status
- Objetivo: separar projetos DEV/PROD.
- Status: configurado, sem agente.

17.2.2 Registros do recorte
- Referências:
  - Configuração canônica: `docs/platform-config.md` — seção 6.1.

17.2.3 Estado atual
- Projetos/sharing/Service Account/credenciais em Platform Config 6.1–6.3; workloads E21.

17.6 Supabase STAGING — descontinuado

17.6.1 Objetivo e status
- Objetivo: destino do STAGING.
- Status: descontinuado.

17.6.2 Registros do recorte
- Referências:
  - Estado da plataforma: `docs/platform-config.md` — seção 4.2.

17.6.3 Estado atual
- Sem staging ativo/substituto; Previews no principal (Platform Config 4.2). Novo ambiente exige recorte/segurança aprovados.

17.9 Autonomia institucional de QA

17.9.1 Objetivo e status
- Objetivo: identidade institucional exclusiva para IA executar QA sem Alcino.
- Status: planejado, objetivo não atingido.

17.9.3 Consulta autônoma ao catálogo institucional de QA
- Objetivo: consulta autônoma ao catálogo QA.
- Status: concluído só para consulta (PR #912); sem convite/Auth/fases posteriores.

17.11 Uso do Catálogo de QA

17.11.1 Objetivo e status
- Objetivo: consultar/atualizar pontualmente catálogo QA.
- Status: contrato concluído, sem autoridade ampliada.

17.11.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `.agents/skills/lp-factory-executar-plano/SKILL.md`

17.11.3 Contrato de consulta e atualização pontual
- Teste autorizado consulta quando necessário e atualiza só valor catalogado que ele alterou; caso contrário, sem mutação. Não autoriza produto/mailbox/browser/Preview/convite/Auth/recuperação/automação/infraestrutura.

18. E18 — Base transversal de templates, composições e artefatos
- Objetivo: conteúdo comercial/raiz LP.
- Status: comercial ativo E10.7; raiz repo-only, módulos retirados.

18.1 Contrato transversal de conteúdo versionado

18.1.1 Objetivo e status
- Objetivo: separar template/composição/conteúdo/artefato.
- Status: comercial implementado; LP só raiz 18.4.

18.1.2 Registros do recorte
- Referências:
  - Contrato de banco: `docs/schema.md` — objetos de templates, composições, artefatos e pesquisas.
  - Base técnica: `docs/base-tecnica.md` — limites de runtime server-side e acesso ao Supabase.

18.1.3 Separação de responsabilidades
- Responsabilidades/validação em docs/base-tecnica.md — 3.15; banco não cria componente/variante.

18.1.4 Modelo materializado
- Modelo Schema 1.14–1.15/1.20–1.23; só commercial_activation ativo, LP repo-only.

18.2 Base `commercial_activation`

18.2.1 Objetivo e status
- Objetivo: composição/renderer comercial v1.
- Status: implementado, consumo E10.7.

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
    - `supabase/migrations/20260616142000_e18_commercial_activation_base_records.sql`
    - `supabase/snippets/e18_commercial_activation_minimum_verify.sql`
    - `supabase/snippets/e18_commercial_activation_base_records_verify.sql`
    - `lib/conversion-content/contracts.ts`
    - `lib/conversion-content/validation.ts`
    - `lib/conversion-content/adapters/commercialActivationAdapter.ts`
    - `lib/conversion-content/commercial-activation/`
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
    - `package-lock.json`
- Referências:
  - Contrato de banco e RLS: `docs/schema.md`.

18.2.3 Contrato e resolução
- Base Técnica 3.15 e resolver/validation.ts canônicos; href só interno com uma barra inicial ou HTTPS válido.

18.2.4 Catálogo ativo
- Um template/oito módulos v1, seções E10.7.3; registry no código, nicho especializa conteúdo/composição, não chave visual.

18.2.5 Segurança e limites
- Validação server-side (Base Técnica 3.15), ACLs no Schema; sem leitura anon/authenticated. Operação E10.7, sem editor/A-B/multicanal/componentes dinâmicos.

18.3 Consumo pela E10.7

18.3.1 Objetivo e status
- Objetivo: integrar E10.7.
- Status: ativo.

18.3.2 Registros do recorte
- Referências:
  - Jornada e operação comercial: `docs/roadmap.md` — seção 10.7.
  - Contrato de banco: `docs/schema.md` — artefatos de conteúdo e fontes de pesquisa.

18.3.3 Limite de responsabilidade
- Jornada E10.7/fallback E10.6. Artefato research_version=1/audience_scope=business_buyer; fontes relacionais compatíveis, contexto adicional provenance_json. LP retirada E19.

18.4 Parametrização raiz da família `landing_page`

18.4.1 Objetivo e status
- Objetivo: parâmetros comuns LP.
- Status: v1 hypothesis repo-only, sem prova por LP real.

18.4.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/conversion-content/landing-page/contracts.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/root-registry.ts`
    - `lib/conversion-content/landing-page/root-resolver.ts`
    - `lib/conversion-content/landing-page/root-schema.ts`
    - `lib/conversion-content/landing-page/root-validation-cases.ts`
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
- Referências:
  - Consumo administrativo dos parâmetros: `docs/roadmap.md` — seção 12.6.
  - Retirada das entradas factuais: `docs/roadmap.md` — seção 22.7.

18.4.3 Registry, resolução e validação
- Registry/schema/resolver E18.4.2; API/imutabilidade/falhas em Base Técnica 3.15.2.

18.4.4 Parâmetros mantidos
- Papéis/faixas/limites/espaçamento e critérios v1 no root-registry/root-schema (18.4.2). Incompatibilidade/ampliação de limite absoluto exige nova versão raiz.

18.4.5 Limites do recorte
- Só parâmetros/Admin, sem promover hypothesis ou criar catálogo/composição/renderer/persistência/lifecycle substitutos de E19/E20.

18.5 Catálogo de módulos e variantes `landing_page` — retirado

18.5.1 Objetivo e status
- Objetivo: destino dos módulos LP.
- Status: retirado (E22.1.5), sem substituto.

18.5.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
  - Excluídos:
    - `lib/conversion-content/landing-page/module-catalog/`
- Referências:
  - Retirada controlada e consumidores podados: `docs/roadmap.md` — seção 22.1.5.

18.5.3 Estado vigente
- Exclusivos retirados em E22.1.5; raiz 18.4 preservada, sem consumidor E19/E20.

19. E19 — legado operacional de Landing Pages retirado
- Objetivo vigente: delimitar resíduo LP.
- Status: produto/custos prospectivos retirados, sem substituto.

19.1 Fronteiras retiradas
- lib/lp-builder/, landing-page/presentation/, workloads draft/imagem e provas exclusivos removidos; catálogo de imagem independente preservado. Factual encerrado E22.7.

19.2 Account Dashboard
- Jornada E10.11/E11.2; sem rotas/consumo LP legados ou desvio por configuração/revisão.

19.3 Estado físico residual
- Objetos/dados/Storage inertes em Schema e Base Técnica 3.15.9; limpeza exige recorte próprio. E19_5_WORKSPACE_ENABLED hospedada inativa/sem consumidor, plataforma inalterada.

19.4 Histórico
- Histórico recuperável no Git/PRs.

20. E20 — Catálogo factual, pesquisa opcional e revisão de taxons
- Objetivo: destino do factual E20.
- Status: retirado em E22.7, sem consumidor/gate/pendência; E10/E21/E25 preservados.

20.2 Catálogo de entradas por taxon

20.2.1 Objetivo e status
- Objetivo: destino do catálogo.
- Status: retirado (E22.7).

20.2.3 Encerramento
- Status: encerrado.
- Conteúdo: sem runtime/compatibilidade/retomada/migração (E22.7).

20.3 Perfil de orientação para geração — retirado

20.3.1 Objetivo e status
- Objetivo: destino do perfil.
- Status: retirado (E22.1.4), sem substituto.

20.3.2 Registros do recorte
- Referências:
  - Retirada material: `docs/roadmap.md` — seção 22.1.2.

20.3.3 Estado vigente
- Status: retirado.
- Conteúdo: exclusivos/preservações em E22.1.2–22.1.4.

20.5 Seleção da pesquisa integral `end_customer` por taxon

20.5.1 Objetivo e status
- Objetivo: destino da seleção end_customer.
- Status: retirada (E22.7).

20.5.2 Registros do recorte
- Referências:
  - Retirada funcional: `docs/roadmap.md` — seção 22.7.
  - Coluna residual e permissões: `docs/schema.md` — seção 1.11.

20.5.3 Pesquisa repo-only
- Status: retirado.
- Conteúdo: leitor exclusivo removido; pesquisas brutas/estruturadas independentes preservadas.

20.5.4 Seleção e consumo
- Status: retirado.
- Conteúdo: UI/gate/mutação removidos; coluna histórica sem autoridade/escrita (E22.7.5).

20.5.5 Papel opcional na revisão factual
- Status: retirado.
- Conteúdo: sem revisão factual/Web Search substituta.

20.6 Liberação e revisão factual de taxons

20.6.1 Objetivo e status
- Objetivo: destino da revisão factual.
- Status: retirada (E22.7).

20.6.3 Contrato vigente
- Status: retirado.
- Conteúdo: CRUD independente E12.5.3, sem cobertura/avaliação/workload factual.

20.7 Resolução de conhecimento para geração

20.7.1 Objetivo e status
- Objetivo: destino da resolução.
- Status: retirada em 14/09/2026, sem substituto; histórico E21 inerte.

20.8 Substituição greenfield e simplificação terminal da E20

20.8.1 Objetivo e status
- Objetivo: destino da autoridade greenfield.
- Status: encerrada (E22.7), sem cutover/apply/ativação/QA pendentes.

20.8.2 Registros do recorte
- Referências:
  - Retirada material e capacidades independentes: `docs/roadmap.md` — seção 22.7.
  - Dados factuais residuais e ACLs: `docs/schema.md` — seção 1.35.

20.8.3 Demolição controlada da E20 vigente
- Status: concluída.
- Conteúdo: exclusivos/preservações em E22.7.3–22.7.5.

20.8.4 Autoridade factual única
- Status: encerrada.
- Conteúdo: taxon_factual_fields inerte (Schema 1.35), sem autoridade/gate.

20.8.5 Herança e resolução factual
- Status: retirada.
- Conteúdo: sem resolução/herança factual; Base independente (E22.7.4).

20.8.6 Gestão administrativa simples
- Status: retirada.
- Conteúdo: só consulta raiz E18.4/E12.6, sem gestão factual.

20.8.7 Liberação humana e apoio opcional por IA
- Status: retirados.
- Conteúdo: sem workload/provas/ações; histórico preservado (E22.7.5).

20.8.8 Cutover e limpeza terminal
- Status: encerrado.
- Conteúdo: apply/gates concluídos, sem retomada (E22.7.5).

21. E21 — Gestão e governança dos workloads OpenAI
- Objetivo: governar workloads/custos OpenAI.
- Status: configuração/custos ativos; E21.3 pausada, E21.4 histórica.

21.1 Fundação, normalização e leitura dos workloads OpenAI

21.1.1 Objetivo e status
- Objetivo: catálogo/resolução/telemetria comuns.
- Status: implementado; cinco workloads textuais + Inspect externo, sem imagem ativa.

21.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `lib/openai-workloads/index.ts`
    - `app/admin/(protected)/workloads-openai/page.tsx`
  - Ajustados:
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seção 3.16.
  - Configuração e credenciais: `docs/platform-config.md` — seções 3.5 e 6.3.

21.1.3 Catálogo estrutural e resolução explícita
- Status: vigente.
- Conteúdo: Base Técnica 3.16; registry 21.1.2.

21.1.4 Integração e observabilidade comum
- Status: vigente.
- Conteúdo: API/telemetria em Base Técnica 3.16, sem variável legada autoritativa.

21.1.5 Inventário administrativo
- Status: implementado.
- Conteúdo: Admin mostra configuração/origem/revisão, modalidade/consumidor/fallback; Inspect não verificado pelo Core. Sem consulta externa para inventário ou conteúdo protegido.

21.2 Configuração operacional dinâmica dos workloads OpenAI

21.2.1 Objetivo e status
- Objetivo: administrar configuração por ambiente/workload sem deploy ordinário.
- Status: ativo Preview/Production via Supabase; Development via registry.

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
    - `public.add_openai_model_catalog_reasoning_effort_v1`
    - `public.reconcile_openai_model_catalog_luna_v1`
    - `public.set_openai_model_catalog_model_availability_v1`
    - `public.set_openai_model_catalog_parameter_availability_v1`
    - `public.check_openai_model_catalog_configuration_available_v1`
    - `public.raise_postgrest_safe_conflict_v1(text)`
- Repositório:
  - Criados:
    - `lib/openai-workloads/adapters/operationalConfigurationAdapter.ts`
    - `lib/openai-workloads/adapters/operationalConfigurationAdapterCore.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapter.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapterCore.ts`
    - `app/admin/(protected)/workloads-openai/openAiModelIdentity.ts`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiConfigurationManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiModelCatalogManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadsTabs.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadDetail.tsx`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `app/admin/(protected)/workloads-openai/actions.ts`
    - `app/admin/(protected)/workloads-openai/catalogActions.ts`
    - `app/admin/(protected)/workloads-openai/commercialProof.ts`
    - `app/admin/(protected)/workloads-openai/proofCore.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.tsx`
    - `supabase/migrations/20260820190422_e21_2_3_openai_workload_operational_configurations.sql`
    - `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`
    - `supabase/migrations/20260827203000_postgrest_safe_application_conflicts.sql`
    - `supabase/migrations/20260926111926_e21_2_6_openai_model_catalog_identity.sql`
    - `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql`
    - `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`
    - `supabase/snippets/postgrest_safe_application_conflicts_verify.sql`
    - `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`
    - `supabase/tests/e21_2_5_openai_model_catalog.test.sql`
    - `supabase/tests/e21_2_6_openai_model_catalog_identity.test.sql`
    - `supabase/tests/postgrest_safe_application_conflicts.test.sql`
  - Ajustados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/index.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/page.tsx`
    - `lib/access/guards.ts`
    - `lib/supabase/service.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seções 3.12 e 3.16.
  - Configuração efetiva e gates: `docs/platform-config.md` — seções 3.5 e 6.3.
  - Contrato de banco: `docs/schema.md` — configuração, revisões, ativações e catálogo OpenAI.

21.2.3 Fonte operacional e resolução por ambiente
- Status: vigente.
- Conteúdo: unidades/fontes/gates em Base Técnica 3.16 e contracts.ts (21.1.2).

21.2.4 Lifecycle administrativo e estado operacional
- Status: implementado.
- Conteúdo: lifecycle/autorização em Base Técnica 3.16; conflito sem retry autônomo, retirado sem nova operação.

21.2.5 Catálogo administrável e UX
- Status: implementado.
- Conteúdo: autoridade em Base Técnica 3.16, UX nos componentes 21.2.2, linhas compactas/detalhes progressivos; ativas/rollback preservados.

21.2.6 Correção e proteção do catálogo de modelos OpenAI
- Status: operacional.
- Conteúdo: proteções Base Técnica 3.16; novos indisponíveis, retirados não redisponibilizados. Sem sincronização/descoberta de efforts ou mutação automática.

21.3 Evidências e avaliação de custo-benefício

21.3.1 Objetivo e status
- Objetivo: comparar qualidade/validade/correção humana, usage/latência/custo/estabilidade.
- Status: pausada, sem implementação; retomada exige decisão humana/revalidação.

21.3.2 Registros do recorte
- Referências:
  - Critérios técnicos e fotografia corrente, sem conteúdo financeiro: `docs/openai-model-snapshot.md`.
  - Preço listado: fonte oficial da OpenAI capturada como evidência focal no momento de eventual retomada; custo real observado: autoridade vigente da E21.5.
  - Contratos de telemetria e configuração: `docs/base-tecnica.md` — seção 3.16.

21.3.3 Condições de retomada
- Unidade: workload + modelo + effort; imagem com métricas próprias. Telemetria segura e critérios 21.3.1; vencedor só com amostra representativa/aceite humano. Sem laboratório, banco, dashboard, job, agente ou otimização/troca automática enquanto pausada.

21.4 Visibilidade financeira e histórico de custos OpenAI

21.4.1 Objetivo e status
- Objetivo: oficial, LP histórica e reconciliação.
- Status: Production, read-only; ativo E21.5.

21.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.openai_lp_cost_events`
    - `public.openai_lp_cost_coverage`
    - `public.append_openai_lp_cost_start_v1`
    - `public.append_openai_lp_cost_terminal_v1`
    - `public.register_openai_lp_cost_coverage_v1`
    - `public.read_openai_lp_cost_events_v1`
    - `public.prevent_openai_lp_cost_mutation_v1`
- Repositório:
  - Criados:
    - `lib/openai-costs/contracts.ts`
    - `lib/openai-costs/index.ts`
    - `lib/openai-costs/pricing.ts`
    - `lib/openai-costs/provider-error-metadata.ts`
    - `lib/openai-costs/adapters/lpCostReadModelAdapter.ts`
    - `lib/openai-costs/adapters/lpCostReadModelAdapterCore.ts`
    - `lib/openai-costs/dashboard.ts`
    - `lib/openai-costs/decimal.ts`
    - `lib/openai-costs/providers/openAiCostsProvider.ts`
    - `lib/openai-costs/providers/openAiCostsProviderCore.ts`
    - `lib/openai-costs/read-model-benchmark.ts`
    - `lib/openai-costs/read-model-validation-cases.ts`
    - `lib/openai-costs/fixtures/read-model-baseline.ts`
    - `lib/openai-costs/validation-cases.ts`
    - `app/admin/(protected)/custos-openai/actions.ts`
    - `app/admin/(protected)/custos-openai/page.tsx`
    - `app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx`
    - `app/admin/(protected)/custos-openai/validation-cases.tsx`
    - `supabase/migrations/20260828131456_e21_4_4_openai_lp_cost_tracking.sql`
  - Ajustados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seção 3.16.
  - Credenciais, gate e endpoints: `docs/platform-config.md` — seções 3.5 e 6.3.1.
  - Contrato de banco: `docs/schema.md` — eventos e cobertura de custos OpenAI.

21.4.3 Autoridade oficial de custos
- Costs API governa o total oficial UTC, sob demanda; regras em Base Técnica 3.16; endpoint/credencial em Platform Config 6.3.1. Sem saldo/créditos/estimativa heurística.

21.4.4 Série histórica congelada de Landing Pages
- Série congelada, sem produtor/escrita/backfill/reconstrução. Gasto oficial restante na reconciliação; OPENAI_LP_COST_TRACKING_ENABLED sem consumidor, plataforma inalterada.

21.4.5 Read model e reconciliação administrativa
- Status: implementado.
- Conteúdo: detalhe conta → LP → workload, tentativas/pendências/cobertura/sem preço; falha anterior ao início persistido não individualizada. Agregação/paginação integral/DTO/falhas em Base Técnica 3.16.
- RPC com materialização/ordenação/offset, sem snapshot entre páginas, prova de volume arbitrário/ganho SQL. Sem classificação ampla, câmbio/cobrança/créditos ou reconstrução histórica.

21.4.6 Transição para histórico legado

21.4.6.1 Objetivo e status
- Objetivo: congelar histórico.
- Status: aplicado.

21.4.6.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.openai_lp_cost_events`
    - `public.openai_lp_cost_coverage`
    - `public.prevent_openai_lp_cost_mutation_v1`
    - `public.append_openai_lp_cost_start_v1`
    - `public.append_openai_lp_cost_terminal_v1`
    - `public.register_openai_lp_cost_coverage_v1`
- Repositório:
  - Criados:
    - `supabase/migrations/20260912143448_e21_4_6_freeze_openai_lp_cost_history.sql`
    - `supabase/tests/e21_4_6_openai_lp_cost_history.test.sql`
    - `supabase/snippets/e21_4_6_openai_lp_cost_history_verify.sql`
  - Ajustados:
    - `lib/openai-costs/validation-cases.ts`
  - Excluídos:
    - `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`
    - `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`
- Updates:
  - Aplicados:
    - `supa#40`
- Referências:
  - Configuração operacional E21.5: `docs/platform-config.md` — seções 2.2 e 3.5.
  - Contrato preservado do histórico: `docs/schema.md` — seções 1.36, 1.37 e 3.10.

21.4.6.3 Implementação e limites
- Status: vigente.
- Conteúdo: ACLs congeladas em Schema 1.36/3.10; validators contra escrita/gate/produtor. Sem backfill/reprecificação/reclassificação/exclusão, mudança do corte, novo produtor/UI ou migration reescrita.

21.4.6.4 Gates externos
- Status: concluídos.
- Conteúdo: corte/ACLs/RLS em Schema 1.36–1.37/3.10, financeiro E21.5.5.

21.5 Controle ativo de custos OpenAI por workload e conta

21.5.1 Objetivo e status
- Objetivo: atribuição/reconciliação de custos.
- Status: E21.5.3–E21.5.6 operacionais em Production; E21.5.7 retirada.

21.5.2 Registros do recorte
- Banco:
  - Criados:
    - `openai_cost_executions`
    - `openai_cost_operations`
    - `openai_cost_coverage`
    - `start_openai_cost_execution_v1`
    - `finish_openai_cost_execution_v1`
    - `start_openai_cost_operation_v1`
    - `finish_openai_cost_operation_v1`
    - `finish_openai_cost_operation_v2`
    - `register_openai_cost_coverage_v1`
    - `read_openai_active_cost_rows_v1`
    - `start_openai_cost_execution_v2`
    - `read_openai_active_cost_rows_v2`
- Repositório:
  - Criados:
    - `lib/openai-costs/active-contracts.ts`
    - `lib/openai-costs/ingestion.ts`
    - `lib/openai-costs/recorder.ts`
    - `lib/openai-costs/adapters/activeCostReadModelAdapter.ts`
    - `lib/openai-costs/adapters/activeCostReadModelAdapterCore.ts`
    - `lib/openai-costs/adapters/activeCostTrackingAdapter.ts`
    - `lib/openai-costs/adapters/activeCostTrackingAdapterCore.ts`
    - `lib/openai-costs/active-cost-validation-cases.ts`
    - `lib/openai-costs/active-validation-cases.ts`
    - `app/api/internal/openai-costs/route.ts`
    - `automations/supabase-inspect/costRecorder.mjs`
    - `automations/supabase-inspect/responsesClient.mjs`
    - `supabase/migrations/20260911150000_e21_5_3_openai_active_cost_tracking.sql`
    - `supabase/tests/e21_5_3_openai_active_cost_tracking.test.sql`
    - `supabase/snippets/e21_5_3_openai_active_cost_tracking_verify.sql`
    - `supabase/migrations/20260911190000_e21_5_4_openai_cost_calculation_read_model.sql`
    - `supabase/tests/e21_5_4_openai_cost_calculation_read_model.test.sql`
    - `supabase/snippets/e21_5_4_openai_cost_calculation_read_model_verify.sql`
    - `lib/openai-costs/economic-hierarchy.ts`
    - `app/admin/(protected)/custos-openai/_components/OpenAiEconomicHierarchy.tsx`
    - `supabase/migrations/20260912215000_e21_5_6_openai_cost_event_correlation.sql`
    - `supabase/tests/e21_5_6_openai_cost_event_hierarchy.test.sql`
    - `supabase/snippets/e21_5_6_openai_economic_events_verify.sql`
  - Ajustados:
    - `lib/openai-costs/pricing.ts`
    - `lib/openai-costs/dashboard.ts`
    - `lib/openai-costs/index.ts`
    - `app/a/[account]/actions.ts`
    - `app/admin/(protected)/taxonomia/actions.ts`
    - `app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx`
    - `app/admin/(protected)/custos-openai/validation-cases.tsx`
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `.github/workflows/pipeline-supabase-inspect.yml`
- Updates:
  - Aplicados:
    - `vercel#32`
- Referências:
  - Contrato financeiro durável: `docs/base-tecnica.md` — seção 3.16.
  - Ledger e RPCs: `docs/schema.md` — seção 3.11.

21.5.3 Atribuição e evidência por execução
- Status: ativa nos ambientes comprovados.
- Conteúdo: atribuição/idempotência/fail-open em Base Técnica 3.16; ledger Schema 3.11, gates Platform Config 3.5. Cinco workloads e ingresso Inspect E17.1.6 sem credencial mutável de banco.

21.5.4 Cálculo e reconciliação de custos
- Status: vigente.
- Conteúdo: cálculo/paginação em Base Técnica 3.16. Global = oficial − ativo calculável − histórico, sem clamp; filtro só ativo, indisponível ≠ zero.

21.5.5 Visão administrativa de custos
- Status: operacional.
- Conteúdo: financeiro único sob demanda/platform_admin, fontes/DTO em Base Técnica 3.16; teclado/foco/nomes/estados/responsividade, sem WCAG integral comprovada.

21.5.6 Visão econômica hierárquica de custos por evento
- Status: aplicada em Production.
- Conteúdo: universo → responsável econômico → evento → workload → execução/operação; nomes humanos, decimais lossless e indisponibilidade ativo/legado preservados. Produtor declara identidade; vínculo não comprovado fica sem correlação, sem heurística. LP histórica E21.4.
- RPC v2; v1 só na ausência exata da nova, v2_active/v1_fallback explícito (Schema 3.11). Sem backfill ou mudança de oficial/reconciliação/cobertura/pricing/filtros/histórico.

21.5.7 Correlação econômica da avaliação de suficiência do catálogo
- Status: retirado (E22.7).
- Conteúdo: correlação/custos históricos preservados, sem reativar E20; produtores atuais em 21.5.6.

22. E22 — Retirada controlada de ativos históricos
- Objetivo: retirar exclusivos sem consumidor/substituto, preservar independentes.
- Status: E22.1–E22.7 concluídas; decisão pendente em 22.3.6.

22.1 Retirada de ativos históricos do domínio de Landing Page

22.1.1 Objetivo e status
- Objetivo: retirar ativos LP sem consumidor.
- Status: concluído.

22.1.2 Registros do recorte
- Banco:
  - Excluídos:
    - `public.landing_page_generation_profiles`
    - `public.landing_page_generation_profile_items`
    - `public.save_landing_page_generation_profile_draft`
    - `public.activate_landing_page_generation_profile`
    - `public.archive_landing_page_generation_profile`
    - `public.get_landing_page_generation_profile_lifecycle_status`
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
  - Estado atual do banco: `docs/schema.md` — objetos de Landing Page e pesquisas taxonômicas.
  - Estado posterior dos consumidores: `docs/roadmap.md` — seção 22.7.

22.1.3 Classificação de consumidores
- Status: vigente.
- Conteúdo: consumo real decide preservação/desacoplamento/remoção. Migrations imutáveis; DDL forward-only sem CASCADE; raiz/pesquisas compartilhadas preservadas.

22.1.4 Perfil de geração retirado
- Status: retirado.
- Conteúdo: exclusivos 22.1.2 sem substituto; pesquisas/audit_logs preservados.

22.1.5 Catálogo de módulos retirado
- Status: retirado.
- Conteúdo: exclusivos 22.1.2 sem DDL/substituto; raiz E18.4/E12.6 preservada.

22.1.6 Resolução histórica de pesquisas retirada
- Status: retirado.
- Conteúdo: exclusivos 22.1.2 removidos; query antiga retorna visão válida, pesquisas compartilhadas preservadas.

22.1.7 Estado consolidado
- Status: concluído.
- Conteúdo: sem imports/rotas/scripts retirados; só consumidores vigentes. Evidência histórica não autoriza reativação.

22.2 Retirada de documentação histórica redundante

22.2.1 Objetivo e status
- Objetivo: eliminar documentação redundante.
- Status: concluído; leitor Admin reconciliado.

22.2.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/admin/docsCatalog.ts`
- Referências:
  - `docs/lp-planejamento.md` — removido; planejamento corrente pertence ao roadmap e aos planos-base aprovados.
  - `docs/prompt-catalogo-lp.md` — removido; não permanece como fonte operacional.
  - `docs/roadmap.md` — autoridade para estado, dependências e evolução dos casos E*.

22.2.3 Resultado e limites
- Paths 22.2.2 fora do leitor; histórico só proveniência no Git. Sem mudança funcional/banco/infraestrutura; autoridades documentais no README — 2.

22.3 Retirada do Supabase Inspect MCP e infraestrutura associada

22.3.1 Objetivo e status
- Objetivo: retirar MCP/infraestrutura exclusivos.
- Status: concluído.

22.3.2 Registros do recorte
- Repositório:
  - Excluídos:
    - `services/mcp-supabase-inspect/README.md`
    - `services/mcp-supabase-inspect/api/mcp.js`
    - `services/mcp-supabase-inspect/package-lock.json`
    - `services/mcp-supabase-inspect/package.json`
    - `services/mcp-supabase-inspect/test/mcp.test.js`
    - `services/mcp-supabase-inspect/vercel.json`
- Referências:
  - Configuração externa final: `docs/platform-config.md` — camada de services e projeto Core.
  - Catálogo da camada: `docs/services.md` — nenhum service/MCP operacional.
  - Automação preservada: `docs/automations.md` — Supabase Inspect Actions.

22.3.3 Auditoria de consumidores
- Status: concluída.
- Conteúdo: Core sem MCP; Inspect/credencial read-only preservados (E17.1.6), sem substituto MCP/SDK/job.

22.3.4 Retirada do MCP
- Status: retirado.
- Conteúdo: service/Agent Builder removidos; Inspect E21 é automação GitHub, não MCP/verificação Core.

22.3.5 Retirada da infraestrutura Vercel
- Status: concluída.
- Conteúdo: lpf-10-services/configuração removidos; Core/domínio preservados (Platform Config 3.1).

22.3.6 Limite operacional remanescente
- Status: pendente de decisão.
- Conteúdo: só docs/** sem deploy automático; implementação gera Preview por push. Nova política exige recorte, preservando Production automática/main e Previews necessários.

22.4 Retirada da geração e do produto operacional legado de Landing Page

22.4.1 Objetivo e status
- Objetivo: retirar produto LP legado.
- Status: concluído; resíduo físico E19.3 preservado.

22.4.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    - `package.json`
  - Excluídos:
    - `app/a/[account]/landing-pages/[landingPageId]/preview/actions.ts`
    - `lib/lp-builder/adapters/generationContextAdapter.ts`
    - `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    - `lib/lp-builder/adapters/landingPageDraftCandidateWorkflowAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftImageGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageGenerationKnowledgeAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionReadinessAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionWorkflowAdapter.ts`
    - `lib/lp-builder/generation-context-validation-cases.ts`
    - `lib/lp-builder/generationContext.ts`
    - `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`
    - `lib/lp-builder/landingPageDraftWorkflow.ts`
    - `lib/lp-builder/landingPageGenerationKnowledge.ts`
    - `lib/lp-builder/landingPageRevisionWorkflow.ts`
- Referências:
  - Configuração preservada: `docs/platform-config.md` — workloads OpenAI e Storage privado.
  - Contrato de banco preservado: `docs/schema.md` — materializações de Landing Page.

22.4.3 Cadeia removida
- Status: retirado.
- Conteúdo: cadeia exclusiva de geração/revisão/upload e consumidores removidos (22.4.2).

22.4.4 Capacidades preservadas
- Status: vigente.
- Conteúdo: raiz/pesquisas independentes preservadas; resíduo E19.3 sem nova leitura/escrita/limpeza autorizada.

22.4.5 Produto operacional retirado no SV-PR03
- Status: retirado.
- Conteúdo: produto/rotas LP removidos sem substitutos/redirects; jornada E10.11, resíduo E19.3.

22.5 Retirada do residual E19 e da compatibilidade com E20.2

22.5.1 Objetivo e status
- Objetivo: retirar exclusivos E19 remanescentes.
- Status: concluído; sem banco/Storage/plataforma alterados.

22.5.2 Resultado
- Status: concluído.
- Conteúdo: E19.1 e congelamento E21.4; configurações/revisões/ativações anteriores inertes.

22.5.3 Capacidades preservadas
- Status: vigente.
- Conteúdo: framework/Inspect/catálogo de imagem E21 preservados; factual encerrado em 22.7, resíduo E19.3.

22.6 Remoção do Validador Final e automações adjacentes

22.6.1 Objetivo e status
- Objetivo: retirar validadores/exclusivos 22.6.2.
- Status: concluído só no repositório, sem substituto.

22.6.2 Registros do recorte
- Repositório:
  - Excluídos:
    - `.github/workflows/automation-validador-final.yml`
    - `.github/workflows/automation-niche-runtime-tests.yml`
    - `automations/validador-final/`
    - `automations/niche-runtime-tests/`
    - `automations/supabase-inspect/verify-niche-runtime.mjs`
- Referências:
  - Catálogo operacional vigente: `docs/automations.md`.
  - Mailbox e secrets preservados: `docs/platform-config.md` — seção 2.4.
  - Consulta autônoma ao catálogo institucional de QA: `docs/roadmap.md` — E17.9.3.

22.6.3 Resultado e limites
- Retirados não eram gate/script raiz/dependência Core; Inspect/CI/mailbox, usuários/contas/memberships/sessões/dados/evidências preservados, sem banco/plataforma alterados. Prova durável/expiração em Base Técnica 3.4.

22.7 Retirada terminal da E20 e E10.10

22.7.1 Objetivo e status
- Objetivo: encerrar E20/E10.10 preservando independentes.
- Status: apply seletivo/gates/QA concluídos Preview/Production; E10.11 concluída.

22.7.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.business_taxons`
    - `public.openai_workload_operational_configurations`
    - `public.taxon_factual_fields`
  - Excluídos:
    - `public.taxon_factual_fields_taxon_id_fkey`
- Repositório:
  - Criados:
    - `supabase/migrations/20261001030000_e22_7_retire_factual_authority.sql`
    - `supabase/snippets/e22_7_terminal_retirement_verify.sql`
    - `supabase/tests/e22_7_retire_factual_authority.fixture.sql`
    - `supabase/tests/e22_7_retire_factual_authority.proof.sh`
    - `supabase/tests/e22_7_retire_factual_authority.test.sql`
  - Ajustados:
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/page.tsx`
    - `app/admin/(protected)/estrutura-lp/`
    - `app/admin/(protected)/taxonomia/`
    - `components/admin/`
    - `lib/admin/`
    - `lib/conversion-content/`
    - `lib/openai-costs/`
    - `lib/openai-workloads/`
    - `package.json`
  - Excluídos:
    - `app/a/[account]/_components/FactualOnboarding.tsx`
    - `app/a/[account]/factual-actions.ts`
    - `app/admin/(protected)/estrutura-lp/_components/AdminFactualFields.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonFactualCoverage.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`
    - `components/admin/AdminTaxonResearchSelectionForm.tsx`
    - `lib/conversion-content/landing-page/input-catalog/`
    - `lib/conversion-content/landing-page/taxon-preparation/`
    - `lib/onboarding/factual/`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.11, 1.28 e 1.35.
  - Workflow e gates externos: `docs/platform-config.md` — seções 2.3 e 3.5.
  - Apply de migrations: `docs/automations.md` — seção 3.6.

22.7.3 Auditoria de consumidores e fronteiras preservadas
- Status: concluída.
- Conteúdo: exclusivos retirados; Pending Setup/E10.11/taxonomia/pesquisa/comercial independentes preservados.

22.7.4 Retirada dos caminhos funcionais
- Status: retirado e validado.
- Conteúdo: E20/E10.10 sem catálogo/cobertura/seleção/avaliação/liberação/workload; jornada E10.11, CRUD E12.5.3. Taxonomia/aliases/resolução/vínculos, pesquisas e E9/E10/E11 preservados por consumo real, especialmente E10.7; sem herança/autoridade factual ou transferência de pesquisas à Base.
- Sem redesenho/refatoração, substituto/compatibilidade/archive funcional/snapshot vivo/infraestrutura; associação aos retirados não autoriza remover capacidade/dado/objeto.

22.7.5 Retirada material residual de banco e configuração
- Status: aplicado e validado.
- Conteúdo: histórico preservado; FK/acessos/unidades mutáveis factuais e UPDATE da seleção retirados (Schema 1.11/1.35). Gates E20 ausentes Preview/Production; duas migrations E10.10 excluídas do apply (Platform Config 2.3/3.5). Migrations imutáveis/resíduos compartilhados preservados; exclusão destrutiva exige decisão própria.

23. E23 — Segurança e governança transversal da plataforma
- Objetivo: segurança/governança.
- Status: E23.1–23.5 concluídas; E23.6 encerrada com incertezas, sem remediação presumida.

23.1 Atualização de segurança do Next.js

23.1.1 Objetivo e status
- Objetivo: atualização de segurança Next.js.
- Status: concluído sem mudança funcional.

23.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `package.json`
    - `package-lock.json`
- Updates:
  - Aplicados:
    - `vercel#31`

23.1.3 Atualização segura e validação do Core
- Status: concluído.
- Conteúdo: sucedido por E23.4/E23.6; sem recursos opcionais ou QA Production pendente.

23.2 Classificação segura das variáveis Vercel

23.2.1 Objetivo e status
- Objetivo: classificar Config/Secret sem exposição.
- Status: concluído; sobreclassificações conservadoras aceitas.

23.2.2 Registros do recorte
- Updates:
  - Aplicados:
    - `vercel#32`.
- Referências:
  - Classificação efetiva e estado operacional: `docs/platform-config.md` — seção 3.6.

23.2.3 Inspeção e reconciliação segura das classificações
- Status: concluída.
- Conteúdo: classificação/scopes/limites em Platform Config 3.6, sem valores expostos; Inspect preservado, convite E11.1.4.

23.3 Retenção proporcional das evidências GitHub Actions

23.3.1 Objetivo e status
- Objetivo: evidência durável.
- Status: concluído documentalmente, sem operação alterada.

23.3.2 Registros do recorte

- Updates:
  - Aplicados:
    - `github#14`
- Referências:
  - Contrato técnico de evidência durável: `docs/base-tecnica.md` — seção 3.4.
  - Retenção efetiva e configuração GitHub Actions: `docs/platform-config.md` — seção 2.2.
  - Update incorporado: `docs/github-up.md` — `github#14`.

23.3.3 Contrato de evidência durável e expiração
- Status: vigente.
- Conteúdo: Base Técnica 3.4/Platform Config 2.2; sem exportação/storage paralelo/job. Preservação bruta excepcional exige Gestor de Automações + humano.

23.4 Atualização de segurança do Next.js — setembro de 2026

23.4.1 Objetivo e status
- Objetivo: patch Next.js 16.3.8.
- Status: Production, jornadas preservadas.

23.4.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `package.json`
    - `package-lock.json`
- Updates:
  - Aplicados:
    - `vercel#34`
- Referências:
  - Patch aplicado e acompanhamento upstream: `docs/vercel-up.md` — `vercel#34`.

23.4.3 Atualização e validação do Core
- Status: concluído.
- Conteúdo: next/eslint-config-next/lockfile alinhados; demais dependências/produto preservados. Patch/saldo upstream em docs/vercel-up.md — vercel#34; diagnóstico E23.6, sem remediação total.

23.5 Retirada da capacidade GraphQL não utilizada

23.5.1 Objetivo e status
- Objetivo: retirar GraphQL sem uso.
- Status: Production validada, demais capacidades preservadas.

23.5.2 Registros do recorte
- Banco:
  - Excluídos:
    - `pg_graphql`
    - `graphql.resolve`
  - Ajustados:
    - `graphql_public.graphql`
- Repositório:
  - Criados:
    - `supabase/migrations/20261005170954_e23_5_retire_unused_graphql.sql`
    - `supabase/tests/e23_5_retire_unused_graphql.fixture.sql`
    - `supabase/tests/e23_5_retire_unused_graphql.proof.sh`
    - `supabase/tests/e23_5_retire_unused_graphql.snapshot.sql`
    - `supabase/tests/e23_5_retire_unused_graphql.test.sql`
  - Ajustados:
    - `supabase/config.toml`
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
- Updates:
  - Aplicados:
    - `supa#39`
- Referências:
  - Estado do banco: `docs/schema.md` — seção 6.2.
  - Apply seletivo e plataforma: `docs/platform-config.md` — seções 2.3 e 4.1; `docs/automations.md` — seção 3.6.
  - Update retirado do catálogo ativo: `docs/supa-up.md` — `supa#39`.

23.5.3 Retirar e validar a capacidade GraphQL não utilizada
- Status: concluído.
- Conteúdo: stub público desabilitado e segurança/retirada transacional em Schema 6.2; dependente inesperado bloqueia atomicamente, demais ACLs/policies/owners preservados.

23.6 Diagnóstico de segurança Next.js e compatibilidade TLS Supabase

23.6.1 Objetivo e status
- Objetivo: diagnóstico delimitado Next.js/TLS.
- Status: levantamento aprovado em 14/10/2026, aplicabilidade/cobertura global inconclusivas.
- Limites: só leitura, sem exploração/mudança operacional/redução de segurança/custo adicional; sem coleta/suporte adicionais nesta rodada. Correção exige recorte/autorização.

23.6.2 Registros do recorte
- Referências:
  - Saldo Next.js, prioridade e gatilho de retomada: `docs/vercel-up.md` — `vercel#34`.
  - Saldo TLS, prioridade e gatilhos de retomada: `docs/supa-up.md` — `supa#73`.
  - Diagnóstico delimitado final e evidências: [PR #1067 — resultado final](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1067#issuecomment-6173085395); [provas técnicas TLS](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1067#issuecomment-6170466774).

23.6.3 Diagnóstico delimitado dos avisos Next.js
- Status: levantamento concluído, aplicabilidade inconclusiva.
- Conteúdo: baseline/fontes/limites/gatilhos em docs/vercel-up.md — vercel#34 e provas 23.6.2; ausência de advisory acessível não prova inexistência, uso não prova exploração. Sem versão corretiva/upgrade autorizado.

23.6.4 Diagnóstico delimitado da mudança TLS Supabase
- Status: levantamento concluído; compatibilidade só no Node local inspecionado, sem conclusão global.
- Conteúdo: cobertura/gatilhos em docs/supa-up.md — supa#73 e provas 23.6.2; Vercel/browser/SO/integrações externas não demonstrados. Quatro cifras CBC nas APIs HTTP, não Postgres/pooler/Management API. Nenhuma incompatibilidade/correção comprovada, sem novas provas exigidas nesta rodada.

24. E24 — Governança e compatibilidade transversal de updates
- Objetivo: governar updates sem custo incremental.
- Status: implementado/validado no repositório.

24.1 Governança e cobertura do workflow de updates

24.1.1 Objetivo e status
- Objetivo: ciclo semanal/cobertura OpenAI.
- Status: implementado, sem nova infraestrutura/runtime.

24.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `.codex/agents/gestor-automacoes.toml`
    - `.codex/agents/gestor-updates.toml`
- Referências:
  - Contrato da rodada semanal: `docs/workflow-atualizacao-updates.md` — seções 1 a 6.
  - Fotografia técnica OpenAI: `docs/openai-model-snapshot.md` — seções 1 a 6.
  - Governança do Gestor de Automações: `docs/gestor-automations.md` — seção 3.1.

24.1.3 Ciclo de vida, gate econômico, campos e identificador
- Identidade/ciclo/deduplicação/saldo e gate zero custo incremental em docs/workflow-atualizacao-updates.md — 1/4; não validado/cobrado fica no radar, sem adoção autorizada.

24.1.4 Cobertura semanal OpenAI e responsabilidades
- Quatro catálogos + snapshot, descoberta/atribuições no workflow — 2–3; supa#60 só consulta manual, sem feed.

24.1.5 Snapshot técnico OpenAI
- Snapshot técnico conforme 24.1.2, sem conteúdo/mecanismo financeiro substituto; configuração em Platform Config. Catálogo não autoriza adoção.

24.1.6 Validação do workflow atualizado
- Status: validado.
- Conteúdo: TOML preserva modelo/effort/sandbox; fontes 24.1.2.

24.2 Compatibilidade operacional e evidências temporárias

24.2.1 Objetivo e status
- Objetivo: compatibilidade/retenção/Health Advisors sem custo incremental.
- Status: validado, sem mudança permanente de operação/infraestrutura.

24.2.2 Registros do recorte
- Updates:
  - Aplicados:
    - `github#15`
    - `vercel#33`
    - `supa#71`
- Referências:
  - Política técnica de evidências expiráveis: `docs/base-tecnica.md` — seção 3.4.
  - Retenção Vercel Hobby e procedimento Supabase: `docs/platform-config.md` — seções 3.1 e 4.9.

24.2.3 Compatibilidade representativa no Ubuntu 26.04
- Status: compatibilidade representativa validada.
- Conteúdo: Ubuntu 26.04, Bash/grep/checkout, Node 20/22 e Supabase CLI 2.106.0; sem secrets/chamadas externas/mutações. Harness removido, ubuntu-latest mantido sem pin preventivo.

24.2.4 Evidências temporárias da Vercel
- Evidência expira; prova durável em Base Técnica 3.4, sem storage paralelo/proteção rotineira/upgrade.

24.2.5 Leitura manual dos Health Check Advisors
- Status: vigente.
- Conteúdo: procedimento Platform Config 4.9; vazio válido ≠ advisor_check_unavailable, achado exige investigação, sem correção automática.

24.2.6 Ciclo de vida dos itens da rodada
- Status: encerrado.
- Conteúdo: aplicados 24.2.2; vercel#21 excluído (storage paralelo), supa#70 futuro só com recorrência/superioridade comprovadas, sem custo incremental.

25. E25 — Base de Comunicação
- Objetivo: verdade empresarial/inteligência comunicacional por conta.
- Status: E25.1/E25.3 operacionais Preview/Production; E25.2 implementada. PB2/PB3 não autorizados.

25.1 Base de Comunicação inicial

25.1.1 Objetivo e status
- Objetivo: Base única/editável/progressiva com acesso comercial, independente de LP/canal/E20/taxon/PB-B/PB-C.
- Status: operacional Preview/Production, gate por ambiente. Fontes Web pouco pertinentes: limite aceito, revisão humana.

25.1.2 Registros do recorte
- Banco:
  - Criados: `account_communication_bases`.
  - Ajustados: `openai_workload_configuration_revisions`, `openai_workload_operational_configurations`, `openai_workload_configuration_activations`, `openai_cost_executions`, `openai_cost_coverage`.
- Repositório:
  - Criados: `app/a/[account]/base-comunicacao/`, `lib/communication-base/`, `supabase/migrations/20260927145500_e25_1_account_communication_bases.sql`, `supabase/migrations/20260927163500_e21_2_communication_base_workloads.sql`, `supabase/tests/e25_1_account_communication_bases.test.sql`, `supabase/tests/e25_1_openai_communication_base_workloads.test.sql`.
  - Ajustados: `app/a/[account]/layout.tsx`, `components/layout/Header.tsx`, `lib/openai-workloads/`, `lib/openai-costs/`, `.github/workflows/pipeline-supabase-apply-migrations.yml`.
- Referências:
  - Banco: `docs/schema.md` — 1.38 e 3.11.
  - Configuração externa: `docs/platform-config.md` — gate E25.1.
  - Comparação de modelos: `docs/openai-model-snapshot.md` — 5.1.

25.1.3 Estrutura, governança e extensibilidade
- Status: implementado.
- Conteúdo: conta única proprietária; owner/admin/editor editam, viewer lê, sob Access Context/membership/entitlement. Formatos suportados extensíveis sem perda; insumo/consumidor sem Base própria, vínculo persistente ou dependência de leitura/edição. Sem segunda autoridade factual, versão funcional selecionável ou framework arbitrário.

25.1.4 Etapa 1 e aproveitamento inicial
- Status: implementado.
- Conteúdo: nome público/atuação, Negócio, Ofertas, Atendimento, Provas/credenciais/resultados, Materiais/identidade, Preferências/limites; incompletude sem bloqueio global. Cópia inicial E10.11.
- Orientação previsível determinística; IA só explícita/com ganho real para explicar/exemplificar/organizar/resumir/reformular fornecido, sem Web, invenção de fatos ou confirmação em nome do cliente. Ausência vira pergunta localizada/pendência; falha IA mantém edição manual. Sugestões/edição seguem 25.1.5.

25.1.5 Etapa 2 e inteligência de comunicação
- Status: implementado; gpt-6-luna/max (configuração E21), comparação isolada gpt-6-sol/medium.
- Conteúdo: IA central interpreta mercado/gera comunicação com Etapa 1 confirmada pertinente; Web Search se atualidade/localidade material, sem fallback paramétrico silencioso após falha. Fato particular distinto de hipótese; revisão humana sem aprovação por chamada/vínculo persistente de pesquisa.
- Quem somos, Público/contexto, Dores/desejos/crenças/objeções, Proposta de valor, Benefícios, Diferenciais, FAQ. Geral gera sete vazias/atualiza conjunto pertinente; revisão por seção. Salvo Etapa 2 só contextualiza alvo, sem autoridade factual; sugestão exige instalação explícita, não salva automaticamente; edição manual não dispara IA.
- Sem LP/produto/canal, mudança de Pending Setup/comercial/trial ou Agents SDK/multiagente/job/fila/infraestrutura novos. Carteira/saldo/franquia/bloqueio comercial IA fora; créditos no D10B.

25.2 Experiência de cliente da Base de Comunicação

25.2.1 Objetivo e status
- Objetivo: consulta/edição progressivas.
- Status: implementado; contratos preservados.

25.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/[account]/base-comunicacao/_components/CommunicationSectionCollection.tsx`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.ts`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.validation.ts`
  - Ajustados: `app/a/[account]/base-comunicacao/page.tsx`, `app/a/[account]/base-comunicacao/CommunicationSectionEditor.tsx`.

25.2.3 Coleção tabular, abertura de detalhe e edição da Base
- Status: implementado.
- Conteúdo: coleção da aba com identidade/estado/Abrir; categorias E25.3 ou duas anteriores com gate desligado. Dialog abre editável por seção/papéis 25.1.3, Salvar/Cancelar; viewer lê. Parser/locks/versões protegem alterações materiais/rascunhos inválidos; perda possível exige confirmação. Sucesso mantém detalhe; conflito mantém rascunho. Saídas por Cancelar/Fechar/Escape/backdrop/Voltar mantêm coleção/devolvem foco.

25.2.4 Estados, assistência por IA, responsividade e validação da experiência
- Status: implementado.
- Conteúdo: feedback local/fontes progressivas, sugestão separada do salvo; exclusão mútua/revisão impedem reinstalação superada por descarte/save. Teclado/foco, altura reduzida, 44 px/reflow 320 px; sem prova de teclado virtual/WCAG integral ou acesso ampliado para QA.

25.3 Recursos das três categorias da Base de Comunicação

25.3.1 Objetivo e status
- Objetivo: recursos manuais nas três categorias, legado/acesso/concorrência/assistências preservados.
- Status: PB1/D14D operacional Preview/Production; PB2/PB3 em definição.
- Limites: sem novos agentes/IA/pesquisa, processamento/transcrição, publicação automática/canais; sem reabrir E25.1/PB-A/E25.2.

25.3.2 Registros do recorte

- Banco:
  - Criados:
    - `communication_base_sections`
    - `touch_communication_base_section`
    - `communication_base_section_updated`
    - `save_communication_base_section`
    - `communication-base-assets`
- Repositório:
  - Criados:
    - `app/a/[account]/base-comunicacao/_components/BusinessFactsFields.tsx`
    - `app/a/[account]/base-comunicacao/_components/CommunicationMaterials.tsx`
    - `app/a/[account]/base-comunicacao/_components/StructuredSectionFields.tsx`
    - `app/a/[account]/base-comunicacao/material-actions.ts`
    - `app/admin/(protected)/base-comunicacao/CommunicationCatalogEditor.tsx`
    - `app/admin/(protected)/base-comunicacao/actions.ts`
    - `app/admin/(protected)/base-comunicacao/page.tsx`
    - `lib/communication-base/adapters/communicationCatalogAdapter.ts`
    - `lib/communication-base/adapters/communicationMaterialAdapter.ts`
    - `lib/communication-base/catalog.ts`
    - `lib/communication-base/manual-editor-value.ts`
    - `lib/communication-base/materials.ts`
    - `lib/communication-base/resource-validation-cases.ts`
    - `supabase/migrations/20261010202505_e25_3_communication_resources.sql`
    - `supabase/tests/e25_3_communication_resources.test.sql`
  - Ajustados:
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `app/a/[account]/base-comunicacao/CommunicationBaseTabs.tsx`
    - `app/a/[account]/base-comunicacao/CommunicationSectionEditor.tsx`
    - `app/a/[account]/base-comunicacao/_components/CommunicationSectionCollection.tsx`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.ts`
    - `app/a/[account]/base-comunicacao/actions.ts`
    - `app/a/[account]/base-comunicacao/page.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/communication-base/adapters/communicationBaseAdapter.ts`
    - `lib/communication-base/ai-core.ts`
    - `lib/communication-base/config.ts`
    - `lib/communication-base/contracts.ts`
    - `lib/communication-base/policy.ts`
    - `lib/communication-base/registry.ts`
    - `lib/communication-base/ui-state-keys.ts`
    - `lib/communication-base/validation-cases.ts`
    - `next.config.js`
- Referências:
  - Exceção de sequência, apply seletivo e ativação por ambiente: `docs/platform-config.md` — seções 2.3 e 3.5.
  - Catálogo, segurança, RPC e Storage aplicados: `docs/schema.md` — seção 1.39.

25.3.3 Dados do negócio e Inteligência e copy
- Status: operacional Preview/Production.
- Conteúdo: Dados com rótulo/valor opcionais, vazios permitidos e nome público no cabeçalho; inicial Identificação e dados do negócio. Inteligência preserva sete seções/formatos/parágrafos/quebras/delimitadores/FAQ; novas manuais.
- Assistências 25.1.5, permissões 25.1.3, descarte/retomada/conflito/foco 25.2 em Bases antigas/novas, com isolamento; FAQ 44 px.

25.3.4 Materiais de comunicação
- Status: operacional Preview/Production.
- Conteúdo: Identidade visual; Fotos, vídeos e áudios; Depoimentos e provas sociais. Identificação/contexto/autoria/autorização pertinentes; imagem/logo upload ou link, vídeo/áudio só link, depoimento escrito texto. Consulta/edição/substituição/retirada preservam legado/publicados.
- Storage em Schema 1.39; validar imagem no servidor e liberar acesso temporário só após autorização vigente; inválido/excesso rejeitado sem escrita, erro preserva formulário/arquivo para retry. Link indisponível não altera Base; descarte mantém salvo.

25.3.5 Gestão administrativa de seções
- Status: operacional Preview/Production.
- Conteúdo: Admin central adiciona/renomeia/reordena nas três categorias; sem autoridade, recusa. Identidade/categoria/formato/salvos preservados; novas vazias/opcionais em Bases antigas/futuras, sem retroescrita/exclusão.
- Inclusão global: prova isolada/rollback/projeção antiga/vazia aceita, sem inclusão autenticada persistente; SQL não substitui Auth/Storage/UI. Gate desligado mantém runtime anterior; progressão autorizada, apply integral continua suspenso.
