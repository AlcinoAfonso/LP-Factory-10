# LP Factory 10 - Base Técnica

**Versão: 1.7.2**  
**Data: 15/11/2025**
**Propósito: Documentação técnica do estado atual do sistema**  

---

# 📑 Sumário

1. Identificação do Projeto  
   1.1 Variáveis Obrigatórias (server-only)  
   1.2 Variáveis Públicas  
   1.3 Convenções  

2. Stack & Dependências  
   2.1 Framework  
   2.2 Backend  
   2.3 UI  
   2.4 Deploy  
   2.5 Regras de Import  

3. Regras Técnicas Globais  
   3.1 Segurança  
   3.2 Estrutura de Camadas  
   3.3 Estrutura de Arquivos  
   3.4 CI/Lint  
   3.5 Secrets & Variáveis  
   3.6 Tipos TypeScript  
   3.7 Convenções  
   3.8 Anti-Regressão  
   3.9 Rate Limit  
   3.10 Anti-Patterns  
   3.11 Sistema de Grants  
   3.12 Compatibilidade PostgREST 13  

4. Schema  
   4.1 Tabelas  
   4.2 Views  
   4.3 Functions  
   4.4 Triggers  
   4.5 Tipos Canônicos  

5. Arquitetura de Acesso  
   5.1 Conceitos Fundamentais  
   5.2 Adapters, Guards, Providers  
   5.3 Fluxos Principais  

6. Estrutura de Arquivos Essencial  
   6.1 Estrutura Base  
   6.2 Arquivos Críticos  
   6.3 Tipos & Contratos  
   6.4 Exceções SULB  
   6.5 Regras Rápidas  

7. Checklists Declarativos  

8. Changelog

```

# 1. Identificação do Projeto

**Nome:** LP Factory 10  
**Repositório:** https://github.com/AlcinoAfonso/LP-Factory-10  
**Deploy:** Vercel (preview + produção)  
**Backend:** Supabase — projeto `lp-factory-10`

## 1.1 Variáveis Obrigatórias (server-only)
- `SUPABASE_SECRET_KEY`
- `ACCESS_CONTEXT_ENFORCED=true`
- `ACCESS_CTX_USE_V2=true`

## 1.2 Variáveis Públicas
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 1.3 Convenções
- TypeScript: `camelCase`
- SQL/Postgres: `snake_case`
- Pipeline: GitHub Web → Vercel
- Regra: não usar `SUPABASE_SERVICE_ROLE_KEY` (usar apenas `SUPABASE_SECRET_KEY`)

---

# 2. Stack & Dependências

## 2.1 Framework
- **Next.js ≥ 15** (App Router, SSR, Server Components)
- **TypeScript (strict)**
- **Tailwind CSS**

## 2.2 Backend
- **Supabase** (PostgreSQL 17.6, Auth, Storage, RLS)  
- **PostgREST 12.2.12** — pronto para **v13**  
- **@supabase/supabase-js ≥ 2.56.0**  
- `.maxAffected(1)` em mutações 1-a-1  
- `search_path = public` em funções críticas  
- JWT HMAC (migração futura para Signing Keys)

## 2.3 UI
- **SULB** (auth forms)  
- **shadcn/ui** (base provisória)

## 2.4 Deploy
- **Vercel** (CI automático)  
- Variáveis validadas:  
  - `SUPABASE_SECRET_KEY`  
  - `NEXT_PUBLIC_SUPABASE_URL`  
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 2.5 Regras de Import
- `@supabase/*` **somente** em `src/lib/**/adapters/**`  
- Exceção: componentes SULB  
- UI/rotas nunca acessam Supabase diretamente

---

# 3. Regras Técnicas Globais

## 3.1 Segurança
- Todas as views que expõem dados de usuário devem usar **security_invoker=true**.  
- RLS obrigatório em todas as tabelas sensíveis.  
- Cookie `last_account_subdomain` só pode ser definido/lido no **SSR** (HttpOnly, Secure, SameSite=Lax).  
- Nenhum dado sensível pode ser acessível no client.

## 3.2 Estrutura de Camadas
Fluxo obrigatório:
`UI → Providers → Adapters → DB`

Regras:
- UI/rotas **não** importam `@supabase/*`.  
- Supabase só pode ser utilizado dentro de `src/lib/**/adapters/**`.  
- Exceção: componentes **SULB** autorizados (ver seção 6.3).

## 3.3 Estrutura de Arquivos
- Cada domínio deve seguir:  
  `adapters/` (DB) → `contracts.ts` (interface pública) → `index.ts` (re-exports).  
- Nenhum módulo pode acessar DB fora de adapters.  
- Tipos canônicos só em `src/lib/types/status.ts`.

## 3.4 CI/Lint (Bloqueios)
PR deve falhar se:
- Houver `SECURITY DEFINER` não aprovado.  
- View sem `security_invoker=true`.  
- Imports Supabase em `app/**` ou `components/**` (exceto SULB).  
- Tipos duplicados fora de `status.ts`.

## 3.5 Secrets & Variáveis
- Server-only: `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY` (futuro).  
- Públicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.  
- Flags obrigatórias: `ACCESS_CONTEXT_ENFORCED=true`, `ACCESS_CTX_USE_V2=true`.

## 3.6 Tipos TypeScript
- Fonte única: `src/lib/types/status.ts`.  
- Proibido redefinir tipos em qualquer outro módulo.  
- Adapters devem normalizar valores lidos do DB.

## 3.7 Convenções
- TS: camelCase / SQL: snake_case.  
- `-1` = ilimitado para limites numéricos.  
- Auditoria via `jsonb_diff_val()`.

## 3.8 Anti-Regressão
- Migrations sempre idempotentes.  
- `.maxAffected(1)` obrigatório em mutações 1-a-1.  
- Qualquer alteração de schema exige revisão de views/functions dependentes.  
- Sem secrets expostos no client.

## 3.9 Rate Limit (E7)
- super_admin: 200 tokens/dia  
- platform_admin: 20 tokens/dia  
- 3 tokens/email/dia  
- 5 burst/5min  
- Índices obrigatórios: `(created_by, created_at DESC)` e `(email, created_at DESC)`.

## 3.10 Anti-Patterns
- Imports de Supabase na UI (exceto SULB).  
- Views sem `security_invoker=true`.  
- Hardcode de lógica de planos/limites.  
- Modificar SULB fora dos arquivos autorizados.  
- Manipular `last_account_subdomain` no client.

## 3.11 Sistema de Grants (E9)
- Nunca usar `plan_id` para liberar features.  
- Usar sempre `get_feature(account_id, feature_key)`.  
- Hierarquia: section → lp → account → plan → default.  
- Cada conta preserva seu snapshot de recursos.

## 3.12 Compatibilidade PostgREST 13
- SDK pronto (`@supabase/supabase-js ≥ 2.56.0`).  
- `.maxAffected(1)` ativo para mutações críticas.  
- Índice GIN `accounts_name_gin_idx` obrigatório.  
- Search Path fixado em `public`.  

---

# 4. Schema

Inventário objetivo do banco usado pelo LP Factory 10 — apenas o necessário para gerar SQL correto.

## 4.1 Tabelas Ativas

### 4.1.1 accounts
- **PK:** `id uuid`
- **UNIQUE:** `subdomain`, `domain`, `slug`
- **Status:** `active | inactive | suspended | pending_setup | trial`
- **FK:** `plan_id` → `plans`, `owner_user_id` → `auth.users`
- **RLS:** obrigatório
- **Índice GIN (v13-ready):**
  - `accounts_name_gin_idx` em `to_tsvector('portuguese', name)`

### 4.1.2 account_users
- **PK:** `id uuid`
- **UNIQUE:** `(account_id, user_id)`
- **Role:** `owner | admin | editor | viewer`
- **Status:** `pending | active | inactive | revoked`
- **FK:** `account_id` → `accounts`, `user_id` → `auth.users`, `invited_by` → `auth.users`
- **RLS:** obrigatório
- **Governança:** integra Trigger Hub (protege último owner)

### 4.1.3 audit_logs
- **PK:** `id uuid`
- **Campos principais:** `user_id`, `table_name`, `record_id`, `changes_json`, `account_id`, `created_at`
- **Função:** sink de auditoria (sem trigger próprio)
- **Observação:** `user_id` pode ser `NULL` para eventos automáticos

### 4.1.4 plans
- **PK:** `id uuid`
- **UNIQUE:** `name`
- **Campos críticos:** `name`, `max_lps`, `max_conversions`
- **Uso:** base para limites via `get_account_effective_limits`
- **Triggers:** nenhum (tabela estática / read-only)

### 4.1.5 partners
- **PK:** `id uuid`
- **Campos principais:** `name`, `type` (`agency | reseller | affiliate`), `status` (`active | inactive | suspended`)
- **Uso:** cadastro de parceiros/white-label
- **Triggers:** fora do Trigger Hub

### 4.1.6 partner_accounts
- **PK composto:** `(partner_id, account_id)`
- **FK:** `partner_id` → `partners`, `account_id` → `accounts`
- **RLS:** obrigatório
- **Governança:** integra Trigger Hub (auditoria e regras de vínculo)

### 4.1.7 post_sale_tokens
- **PK:** `id uuid`
- **Campos principais:** `email`, `contract_ref`, `expires_at`, `used_at`, `used_by`, `account_id`, `meta`, `created_at`, `created_by`
- **Índices:** `(email, created_at DESC)`, `(created_by, created_at DESC)`
- **RLS:** ativo (políticas admin + histórico do próprio usuário)
- **Uso:** fluxo E7 (onboarding consultivo)
- **Triggers:** fora do Trigger Hub (não exige guardas de owner)

---

## 4.2 Views Ativas

### 4.2.1 v_access_context_v2
- **Objetivo:** fonte única de decisão de acesso entre usuário e conta
- **Campos-chave:** `account_id`, `account_key` (subdomain), `account_name`, `account_status`, `user_id`, `member_role`, `member_status`, `allow`, `reason`
- **Regra:** `allow = true` apenas para conta ativa/trial/pending_setup + membro ativo
- **Segurança:** `security_invoker = true`

### 4.2.2 v_user_accounts_list
- **Objetivo:** alimentar AccountSwitcher e `/api/user/accounts`
- **Campos:** `account_id`, `account_name`, `account_subdomain`, `account_status`, `member_status`, `member_role`, `created_at`
- **Filtro:** `user_id = auth.uid()` e `allow = true` (via `v_access_context_v2`)
- **Segurança:** `security_invoker = true`

### 4.2.3 v_account_effective_limits
- **Objetivo:** limites efetivos de plano por conta
- **Campos principais:** `account_id`, `account_name`, `account_status`, `subdomain`, `domain`, `plan_id`, `plan_name`, `price_monthly`, `plan_features`, `max_lps`, `max_conversions`, flags `_unlimited` e `_effective`
- **Base:** join `accounts` + `plans` + helpers de limites
- **Segurança:** `security_invoker = true`

### 4.2.4 v_account_effective_limits_secure
- **Objetivo:** expor limites apenas para quem pode ver
- **Filtro:** `is_platform_admin()` **OU** `is_member_active(account_id, auth.uid())`
- **Segurança:** `security_invoker = true`
- **Uso:** APIs e dashboards que mostram detalhes de plano

### 4.2.5 v_admin_tokens_with_usage
- **Objetivo:** painel `/admin/tokens` (E7)
- **Campos principais:** `token_id`, `email`, `expires_at`, `is_used`, `is_valid`, `account_slug`, `created_at`
- **Base:** join `post_sale_tokens` + `accounts`
- **Segurança:** `security_invoker = true`

### 4.2.6 v_audit_logs_norm
- **Objetivo:** leitura simplificada de `audit_logs`
- **Campos principais:** `id`, `entity`, `entity_id`, `action`, `diff`, `account_id`, `actor_user_id`, `ip_address`, `created_at`
- **Base:** normalização de `table_name` → `entity`, `changes_json` → `diff`
- **Segurança:** `security_invoker = true`

---

## 4.3 Functions Ativas

### 4.3.1 Onboarding (E7)
- `create_account_with_owner(token_id uuid, actor_id uuid) → uuid`  
  - **SECURITY DEFINER aprovado**  
  - Cria conta via `post_sale_tokens`, define `pending_setup`, vincula owner, consome token
- `_gen_provisional_slug() → text`  
  - Gera slug temporário (`acc-{uuid8}`)

### 4.3.2 Limites de Plano
- `get_account_effective_limits(account_id uuid) → SETOF record`  
  - Usa `v_account_effective_limits`
- `plan_limit_is_unlimited(value int) → boolean`
- `plan_limit_value(value int) → bigint`

### 4.3.3 Auth / RLS Helpers
- `is_super_admin() → boolean`
- `is_service_role() → boolean`
- `is_platform_admin() → boolean`  *(usa claim `platform_admin=true`)*
- `is_admin_active() → boolean`
- `is_member_active() → boolean`
- `has_account_min_role(account_id uuid, min_role text) → boolean`  
  - **SECURITY DEFINER aprovado**, usado em RLS
- `role_rank(role text) → int`  *(owner=4, admin=3, editor=2, viewer=1)*

### 4.3.4 Convites de Conta
- `accept_account_invite(account_id uuid, ttl_days int) → boolean`
- `revoke_account_invite(account_id uuid, user_id uuid) → boolean`
- `invitation_expires_at(account_user_id uuid, ttl_days int) → timestamptz`
- `invitation_is_expired(account_user_id uuid, ttl_days int) → boolean`

### 4.3.5 Trigger Hub & Auditoria
- `hub_router()` — roteia eventos BEFORE INSERT/UPDATE/DELETE
- `fn_audit_dispatch(table text, kind text, payload jsonb)` — grava em `audit_logs`
- `fn_guard_last_owner(kind text, new account_users, old account_users)` — protege último owner
- `fn_owner_transfer_rules(kind text, new accounts, old accounts)` — valida troca de `owner_user_id`
- `fn_event_bus_publish(table text, kind text, payload jsonb)` — fan-out opcional (webhooks/eventos)
- `jsonb_diff_val(old jsonb, new jsonb) → jsonb` — diff para auditoria

---

## 4.4 Triggers Ativos

### 4.4.1 Trigger Hub (tabelas com governança)
- `accounts` → `tg_accounts_hub` → `hub_router()`
- `account_users` → `tg_account_users_hub` → `hub_router()`
- `partner_accounts` → `tg_partner_accounts_hub` → `hub_router()`

### 4.4.2 Tabelas fora do Trigger Hub
- `plans` — estática (sem trigger)
- `partners` — cadastro simples (sem trigger Hub)
- `post_sale_tokens` — sem trigger; auditável via adapters e views

### 4.4.3 Triggers Legadas (desativadas)
- Conjunto antigo de triggers de auditoria/guardas permanece apenas para rollback.  
- Regra: qualquer nova lógica deve usar **apenas** o Trigger Hub.

---

## 4.5 Tipos TypeScript Canônicos

### 4.5.1 Fonte Única
- Arquivo: `src/lib/types/status.ts`
- Consumidores: `src/lib/access/types.ts` + adapters (`accountAdapter`, `accessContextAdapter`, etc.)

### 4.5.2 Tipos
```ts
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending_setup' | 'trial';
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'revoked';
export type MemberRole   = 'owner' | 'admin' | 'editor' | 'viewer';
```
### 4.5.3 Regras
Proibido redefinir esses tipos em qualquer outro arquivo.  
Adapters devem normalizar valores do DB para esses tipos antes de expor à UI.

---

# 5. Arquitetura de Acesso

Camada que liga Supabase (RLS) ao Next.js (SSR + UI) usando Access Context v2, cookies SSR e adapters.

## 5.1 Conceitos Fundamentais

### 5.1.1 Access Context v2
- Fonte única de verdade de acesso: `v_access_context_v2`.  
- Decide se o usuário pode acessar uma conta (`allow` + `reason`).  
- Usado em SSR (`getAccessContext`), `AccessProvider` e AccountSwitcher.

### 5.1.2 Persistência SSR (Cookie `last_account_subdomain`)
- Definido em `/a/[account]/layout.tsx` após `allow=true`.  
- Atributos obrigatórios: `HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`.  
- Lido apenas no servidor (middleware) para redirecionar `/a` → `/a/{subdomain}`.  
- No logout, o cookie deve ser expirado (`Max-Age=0`).

---

## 5.2 Adapters, Guards, Providers

### 5.2.1 Adapters

**accountAdapter** — `src/lib/access/adapters/accountAdapter.ts`
- `createFromToken(tokenId, actorId)` → RPC `create_account_with_owner`.  
- `renameAndActivate(accountId, name, slug)` com `.maxAffected(1)`.  
- Normaliza `AccountStatus`, `MemberStatus`, `MemberRole`.

**accessContextAdapter** — `src/lib/access/adapters/accessContextAdapter.ts`
- Lê `v_access_context_v2`.  
- Retorna `{ account, member }` para SSR e `AccessProvider`.  

**adminAdapter** — `src/lib/admin/adapters/adminAdapter.ts`
- Valida `super_admin` / `platform_admin`.  
- Opera sobre `post_sale_tokens` via `postSaleTokenAdapter`.

**postSaleTokenAdapter** — `src/lib/admin/adapters/postSaleTokenAdapter.ts`
- `generate`, `validate`, `consume`, `revoke` com `.maxAffected(1)` em revogação.  
- Aplica rate limit (ver seção 3.9) sobre `post_sale_tokens`.

### 5.2.2 Guards SSR

**guards.ts** — `src/lib/access/guards.ts`
- `requireSuperAdmin()` → bloqueia acesso se não for `super_admin`.  
- `requirePlatformAdmin()` → bloqueia acesso se não for `platform_admin` ou `super_admin`.  
- Usado em rotas `/admin/**` (layout e páginas).

### 5.2.3 Providers

**AccessProvider** — `src/providers/AccessProvider.tsx`
- Recebe contexto SSR de `getAccessContext()`.  
- Expõe `{ account, member }` (inclui `account.name`) para a UI.  
- Garante consistência entre header, AccountSwitcher e permissões.

---

## 5.3 Fluxos Principais

### 5.3.1 Login & Reset de Senha (SULB)

Rotas/arquivos:
- `app/auth/login/page.tsx` — login.  
- `app/auth/forgot-password/page.tsx` — reset (email).  
- `app/auth/update-password/page.tsx` — redefinição SSR com validação de token.  
- `app/auth/confirm/route.ts` — intersticial (GET/POST) para confirmar tokens e estabilizar sessão.

Regras:
- Fluxo sempre passa pela SULB; não criar formularios auth fora deste núcleo.  
- Após login/reset/update, redirect final deve passar pelo Access Context (`/a/[account]` ou `/auth/confirm/info`).

### 5.3.2 E7 — Onboarding Consultivo

Rotas/arquivos:
- `app/onboard/page.tsx` — valida token SSR (`post_sale_tokens`).  
- `app/onboard/actions.ts` — `onboardAction()` (signUp → signIn → `createFromToken`).  

Fluxo:
1. Token consultivo gerado em `/admin/tokens` (`post_sale_tokens`).  
2. Cliente acessa `/onboard?token=…`.  
3. Definição de senha + criação de user.  
4. RPC `create_account_with_owner()` cria conta `pending_setup` e vincula owner.  
5. Redirect para `/a/[account]` com cookie `last_account_subdomain` definido.

### 5.3.3 Multi-conta (AccountSwitcher)

Arquivos:
- `components/features/account-switcher/AccountSwitcher.tsx`  
- `…/AccountSwitcherTrigger.tsx`  
- `…/AccountSwitcherList.tsx`  
- `…/useAccountSwitcher.ts`  
- `…/useUserAccounts.ts`  
- API: `app/api/user/accounts/route.ts` (usa `v_user_accounts_list`).

Fluxo:
1. Hook `useUserAccounts()` chama `/api/user/accounts` → `v_user_accounts_list`.  
2. `AccountSwitcher` lista contas permitidas para o usuário.  
3. Ao trocar de conta, UI dispara eventos de telemetria e navega para `/a/[account]`.  
4. SSR grava cookie `last_account_subdomain` para persistir a última conta ativa.

### 5.3.4 Observabilidade de Acesso

Eventos (telemetria):
- `account_switcher_open` — ao abrir o seletor de contas.  
- `account_selected` — ao trocar de conta.  
- `create_account_click` — CTA para criar nova conta.  
- `preferred_account_cookie_set` — evento planejado ao escrever o cookie preferido.

Regra:
- Eventos devem seguir estrutura padrão (`event`, `scope`, `latency_ms`, `timestamp`, `error?`)  
- Logs devem permitir rastrear decisões de acesso (allow/deny) ligadas ao Access Context.

---

# 6. Estrutura de Arquivos Essencial

> Somente o necessário para a IA localizar **pontos críticos** do projeto.  
> Inventário completo fica fora da Base Técnica em `docs/repository-inventory.md`.

## 6.1 Estrutura Base por Domínio

```text
src/
  lib/
    access/                 → Governança de contas e acesso
      adapters/             → Único ponto que toca o DB
      contracts.ts
      index.ts
    admin/                  → Operações administrativas (E7)
      adapters/
      contracts.ts
      index.ts
    types/                  → Tipos canônicos (fonte única)
    supabase/               → Clients SSR, browser e middleware
  providers/                → AccessProvider
  app/
    a/                      → Account Dashboard (SSR + switcher)
    admin/                  → Painel administrativo
    onboard/                → Fluxo E7 (token consultivo)
    auth/                   → SULB
    api/                    → Endpoints internos
  components/
    features/               → AccountSwitcher
    layout/                 → Header, menus
    ui/                     → shadcn/ui
```

---

## 6.2 Arquivos Críticos

### Acesso (núcleo SSR + RLS)

- `src/lib/access/getAccessContext.ts`  
  → **Fonte SSR** que consulta `v_access_context_v2`.

- `src/lib/access/adapters/accessContextAdapter.ts`  
  → Lê a view e normaliza `account` + `member`.

- `src/providers/AccessProvider.tsx`  
  → Distribui acesso para toda a UI.

- `app/a/[account]/layout.tsx`  
  → Gate SSR + define cookie `last_account_subdomain`.

- `middleware.ts`  
  → Redireciona `/a` usando o cookie; aplica sessão.

---

### Onboarding Consultivo (E7)

- `app/onboard/page.tsx`  
  → Validação SSR do token.

- `app/onboard/actions.ts`  
  → `onboardAction()` (signUp → signIn → RPC).

- `src/lib/access/adapters/accountAdapter.ts`  
  → `createFromToken()` (RPC `create_account_with_owner`).

- `src/lib/admin/adapters/postSaleTokenAdapter.ts`  
  → Geração, validação, revogação e rate limit de tokens.

---

### Multi-Conta (AccountSwitcher)

- `components/features/account-switcher/*`  
  → Switcher completo (UI + hooks).

- `app/api/user/accounts/route.ts`  
  → Endpoint que lê `v_user_accounts_list`.

---

### Segurança e Supabase

- `src/lib/supabase/server.ts`  
  → Client SSR (`SUPABASE_SECRET_KEY`).

- `src/lib/supabase/client.ts`  
  → Client browser (chave pública).

- `src/lib/supabase/middleware.ts`  
  → Sessão + bypass de rotas protegidas.

---

### UI/Autenticação (SULB)

- `app/auth/confirm/route.ts`  
  → Intersticial GET/POST (token + estabilização de sessão).

- `app/auth/update-password/page.tsx`  
  → Redefinição SSR (consumo do token).

---

### Governança Admin

- `app/admin/layout.tsx`  
  → `requirePlatformAdmin()`.

- `app/admin/tokens/page.tsx`  
  → Painel E7 (geração + revogação de tokens).

- `src/lib/admin/adapters/adminAdapter.ts`  
  → Valida privilégios admin/super-admin.

---

## 6.3 Tipos e Contratos Críticos

- `src/lib/types/status.ts`  
  → **Única fonte** de `AccountStatus`, `MemberStatus`, `MemberRole`.

- `src/lib/access/types.ts`  
  → Reexporta tipos canônicos para adapters/providers.

- `src/lib/admin/contracts.ts`  
  → Tipos do E7 (`PostSaleToken`, `TokenWithUsage`).

---

## 6.4 Arquivos SULB Autorizados a Importar Supabase

> Exceção oficial (os únicos que podem importar `@supabase/*` fora de adapters).

- `lib/supabase/client.ts`  
- `lib/supabase/middleware.ts`  
- `lib/supabase/server.ts`  
- `app/auth/confirm/route.ts`  
- `app/auth/update-password/page.tsx`  
- `app/auth/protected/page.tsx`

---

## 6.5 Regras Rápidas

- Todo acesso ao DB passa por **adapters**.  
- Todo fluxo de acesso passa por **Access Context v2**.  
- Toda decisão de conta passa pelo cookie SSR.  
- Toda auth passa pela SULB.  
- Todo o resto da estrutura é opcional para a Base Técnica e vai para o inventário externo.

---

# 7. Checklists Declarativos

> Blocos objetivos para validação automática (CI, agentes e revisões rápidas).  
> Formato previsível, sem narrativa, pronto para JSON Schema.

## 7.1 Segurança
- [ ] Todas as views usam `security_invoker = true`
- [ ] RLS ativo em todas as tabelas sensíveis
- [ ] Cookie `last_account_subdomain` definido apenas no SSR
- [ ] Nenhum dado sensível exposto no client
- [ ] Sem `SUPABASE_SECRET_KEY` no client

## 7.2 Camadas
- [ ] Fluxo respeitado: UI → Providers → Adapters → DB
- [ ] UI/rotas não importam `@supabase/*` (exceto SULB)
- [ ] Adapters são o único ponto com acesso ao DB
- [ ] Tipos vêm apenas de `src/lib/types/status.ts`

## 7.3 SQL & Migrations
- [ ] Migrations idempotentes (`IF NOT EXISTS`)
- [ ] `.maxAffected(1)` em mutações 1-a-1
- [ ] Índice `accounts_name_gin_idx` criado
- [ ] Functions críticas com `search_path = public`
- [ ] Nenhuma function `SECURITY DEFINER` sem aprovação

## 7.4 Acesso & Governança
- [ ] Access Context v2 é a única fonte de verdade
- [ ] SSR usa `getAccessContext()` antes de renderizar
- [ ] Guards (`requirePlatformAdmin`, `requireSuperAdmin`) aplicados em `/admin/**`
- [ ] `post_sale_tokens` com índices obrigatórios

## 7.5 Adapters
- [ ] Todos os adapters normalizam `AccountStatus`, `MemberStatus`, `MemberRole`
- [ ] Nenhum adapter expõe valores brutos do DB
- [ ] Adapters só usam client SSR ou server-side
- [ ] `postSaleTokenAdapter` respeita rate limit

## 7.6 UI / SULB
- [ ] Fluxos de login/reset/update-password usam apenas SULB
- [ ] `auth/confirm/route.ts` ativo e funcional
- [ ] Nenhuma outra rota implementa lógica própria de auth

## 7.7 Telemetria
- [ ] Eventos principais (`account_switcher_open`, `account_selected`, `create_account_click`)
- [ ] Formato: `{ event, scope, latency_ms, timestamp, error? }`
- [ ] Sem logs contendo dados sensíveis

## 7.8 Publicação / SSR
- [ ] Cookie de conta persistido no SSR
- [ ] Middleware lê cookie e redireciona corretamente
- [ ] Logout expira o cookie

## 7.9 Grants & Limites
- [ ] Nenhum código compara `plan_id`
- [ ] Sempre usar `get_feature(account_id, feature_key)`
- [ ] Respeito ao fallback: section → lp → account → plan → default

## 7.10 PostgREST 13 Ready
- [ ] SDK `@supabase/supabase-js ≥ 2.56.0`
- [ ] Mutações críticas com `.maxAffected(1)`
- [ ] Views compatíveis com `textSearch`
- [ ] Search Path restrito a `public`

---

# 8. Changelog

Registro objetivo das alterações estruturais da Base Técnica.  
Mantém apenas marcos relevantes para Next.js + SQL + Trigger Hub.

---

## v1.7.2 (15/11/2025) — Otimização para JSON Schema
- Reorganização completa da Base Técnica seguindo o relatório oficial.  
- Nova ordem: **1 Identificação → 2 Stack → 3 Regras Técnicas → 4 Schema → 5 Arquitetura de Acesso → 6 Estrutura Essencial → 7 Checklists → 8 Changelog**.  
- Remoção de narrativa, histórico e duplicações.  
- Seção 6 reduzida ao mínimo e inventário completo movido para `docs/repository-inventory.md`.  
- Padronização total para blocos prescritivos.

---

## v1.7.1 (12/11/2025)
- Supabase atualizado para **PostgreSQL 17.6** (patches de segurança).  
- Fixado `search_path = public` em funções críticas.  
- Validação de compatibilidade com `@supabase/supabase-js ≥ 2.56.0`.  
- Migração para JWT Signing Keys pendente (não afeta operação atual).  
- Fluxos E5/E7/E10 retestados sem regressões.

---

## v1.7 (11/11/2025)
- Compatibilidade confirmada com **PostgREST 13**.  
- Aplicado `.maxAffected(1)` em mutações críticas.  
- Adicionado índice GIN `accounts_name_gin_idx` (full-text v13-ready).  
- Rollback validado (schema + SDK).  
- Status: **Estável / Pronto para upgrade**.

---

## v1.6 (07–08/11/2025)
- Ativação do **Trigger Hub** em `accounts`, `account_users`, `partner_accounts`.  
- Desativação dos triggers antigos (mantidos apenas para rollback).  
- Inclusão da seção **Sistema de Grants** (`model_grants`, `get_feature`).  
- Normalização de auditoria via `jsonb_diff_val()`.

---

## v1.5 (histórico consolidado)
- Estrutura inicial da Base Técnica.  
- Introdução formal de:  
  - Fluxo de camadas (UI → Providers → Adapters → DB).  
  - Access Context v2.  
  - Governança RLS completa (owner/admin/editor/viewer).  
  - SULB como núcleo de autenticação.  

---

**Regra:** versões anteriores ao v1.5 são irrelevantes para o estado atual do projeto.

 




