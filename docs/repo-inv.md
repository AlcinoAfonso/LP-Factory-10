20/12/2025 13:31 — repo-inv-2.2

Inventário do Repositório

Propósito: mapa completo e atualizado da estrutura do repositório.
Status: Documento complementar à Base Técnica (não normativo).
Última atualização: 16/12/2025

1. Estrutura Geral

1.1 Pastas na raiz

* `.github/`
* `app/`
* `components/`
* `docs/`
* `lib/`
* `src/`
* `supabase/`

1.2 Arquivos na raiz

* `README.md`
* `.gitignore`
* `middleware.ts`
* `next.config.js`
* `package.json`
* `postcss.config.js`
* `tailwind.config.ts`
* `tsconfig.json`

2. app — Rotas (Next.js App Router)

2.1 Rotas públicas

* `app/page.tsx`
* `app/layout.tsx`
* `app/globals.css`

2.2 Account Dashboard (em desenvolvimento)

* `app/a/page.tsx`
* `app/a/home/page.tsx`
* `app/a/[account]/layout.tsx`
* `app/a/[account]/page.tsx`
* `app/a/[account]/actions.ts`
* `app/a/[account]/loading.tsx`
* `app/a/[account]/not-found.tsx`

2.3 Admin Dashboard

* `app/admin/layout.tsx`
* `app/admin/tokens/page.tsx`

2.4 Onboarding

* `app/onboard/page.tsx`
* `app/onboard/actions.ts`

2.5 Auth (SULB + rotas auxiliares)

* `app/auth/login/page.tsx`
* `app/auth/sign-up/page.tsx`
* `app/auth/sign-up-success/page.tsx`
* `app/auth/forgot-password/page.tsx`
* `app/auth/update-password/page.tsx`
* `app/auth/protected/page.tsx`
* `app/auth/error/page.tsx`
* `app/auth/confirm/route.ts`
* `app/auth/confirm/info/page.tsx`

2.6 API

* `app/api/user/accounts/route.ts`

3. components — UI e Features

3.1 Layout

* `components/layout/Header.tsx`
* `components/layout/UserMenu.tsx`

3.2 Account Switcher

* `components/features/account-switcher/AccountSwitcher.tsx`
* `components/features/account-switcher/AccountSwitcherList.tsx`
* `components/features/account-switcher/AccountSwitcherTrigger.tsx`
* `components/features/account-switcher/useAccountSwitcher.ts`
* `components/features/account-switcher/useUserAccounts.ts`

3.3 Auth forms (SULB)

* `components/login-form.tsx`
* `components/sign-up-form.tsx`
* `components/forgot-password-form.tsx`
* `components/update-password-form.tsx`
* `components/logout-button.tsx`

3.4 Onboarding UI

* `components/onboard/OnboardForm.tsx`

3.5 Admin UI

* `components/admin/CopyLinkButton.tsx`

3.6 UI base

* `components/ui/AlertBanner.tsx`
* `components/ui/button.tsx`
* `components/ui/card.tsx`
* `components/ui/input.tsx`
* `components/ui/label.tsx`

4. src — Núcleo Técnico

4.1 Providers

* `src/providers/AccessProvider.tsx`

4.2 Acesso (Access Context / guards / adapters)

* `src/lib/access/getAccessContext.ts`
* `src/lib/access/guards.ts`
* `src/lib/access/audit.ts`
* `src/lib/access/plan.ts`
* `src/lib/access/types.ts`
* `src/lib/access/adapters/accountAdapter.ts`
* `src/lib/access/adapters/accessContextAdapter.ts`

4.3 Admin (adapters e contratos)

* `src/lib/admin/index.ts`
* `src/lib/admin/contracts.ts`
* `src/lib/admin/adapters/adminAdapter.ts`
* `src/lib/admin/adapters/postSaleTokenAdapter.ts`

4.4 Auth (núcleo)

* `src/lib/auth/authAdapter.ts`

4.5 Tipos e utilitários

* `src/lib/types/status.ts`
* `src/lib/utils.ts`

5. lib — Supabase SSR (SULB)

* `lib/supabase/client.ts`
* `lib/supabase/server.ts`
* `lib/supabase/middleware.ts`
* `lib/supabase/service.ts`

6. supabase — Migrations

* `supabase/migrations/0001__baseline_e7.sql`
* `supabase/migrations/accounts_name_gin_idx.sql`

7. docs — Documentação interna (principais)

* `docs/base-tecnica.md`
* `docs/base-tecnica.schema.json`
* `docs/fluxos.md`
* `docs/roadmap.md`
* `docs/supabase-update.md`
* `docs/vercel-update.md`
* `docs/repositorio-inventario.md` (este arquivo)

8. SULB — Arquivos autorizados a importar `@supabase/*` (allowlist oficial)

* `lib/supabase/client.ts`
* `lib/supabase/middleware.ts`
* `lib/supabase/server.ts`
* `lib/supabase/service.ts`
* `app/auth/confirm/route.ts`
* `app/auth/update-password/page.tsx`
* `app/auth/protected/page.tsx`

9. Notas de alinhamento (não é regra, é alerta)

* A allowlist SULB da seção 8 é o ponto de referência para imports `@supabase/*`.
* No snapshot atual, não há imports relevantes reportados fora da allowlist.

10. Regras do Inventário

10.1 Snapshot

* Representa o snapshot atual da estrutura.
* Não define regras, apenas descreve.

10.2 Atualização

* Atualizar quando novas rotas/adapters surgirem ou pastas mudarem.
* Atualizar sempre que houver mudança de caminho (ex.: `src/app` ↔ `app`, `src/components` ↔ `components`).

11. Próxima Revisão

* Recomendada a cada milestone (ex.: upgrade Next.js, mudanças no Access Context, novas rotas de dashboard).
