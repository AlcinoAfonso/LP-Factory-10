# LP Factory 10 - Base Técnica

**Versão: 1.4**  
**Data: 31/10/2025**  
**Propósito: Documentação técnica do estado atual do sistema**  
**Versão anterior: 1.3 (18/10/2025)**

---

## 📑 Sumário

- [1. Identificação do Projeto](#1-identificação-do-projeto)
- [2. Stack & Dependências](#2-stack--dependências)
  - [2.1 Referências Rápidas](#21-referências-rápidas)
- [3. Schema](#3-schema)
  - [3.1 Tabelas Ativas](#31-tabelas-ativas)
  - [3.2 Views Ativas](#32-views-ativas)
  - [3.3 Functions Ativas](#33-functions-ativas)
  - [3.4 Triggers Ativos](#34-triggers-ativos)
  - [3.5 Tipos TypeScript Canônicos](#35-tipos-typescript-canônicos)
- [4. Regras Técnicas Globais](#4-regras-técnicas-globais)
  - [4.1 Segurança](#41-segurança)
  - [4.2 Camadas (Estrutura Rígida)](#42-camadas-estrutura-rígida)
  - [4.3 Estrutura de Arquivos](#43-estrutura-de-arquivos)
  - [4.4 CI/Lint (Classes de Bloqueio)](#44-cilint-classes-de-bloqueio)
  - [4.5 Secrets & Variáveis](#45-secrets--variáveis)
  - [4.6 Tipos TypeScript](#46-tipos-typescript)
  - [4.7 Convenções](#47-convenções)
  - [4.8 Anti-Regressão](#48-anti-regressão)
  - [4.9 Rate Limit](#49-rate-limit)
  - [4.10 ❌ Anti-Patterns](#410--anti-patterns)
- [5. Arquitetura de Acesso](#5-arquitetura-de-acesso)
  - [5.1 Conceitos Fundamentais](#51-conceitos-fundamentais)
  - [5.2 Implementação (Adapters, Guards, Providers)](#52-implementação-adapters-guards-providers)
  - [5.3 Fluxos Principais](#53-fluxos-principais)
- [6. Estrutura de Arquivos](#6-estrutura-de-arquivos)
  - [6.1 Princípios de Organização](#61-princípios-de-organização)
  - [6.2 Inventário de Arquivos](#62-inventário-de-arquivos)
  - [6.3 Biblioteca Supabase (SULB)](#63-biblioteca-supabase-sulb)

---

## 1. Identificação do Projeto

**Nome: LP Factory 10**  
**Repositório: github.com/AlcinoAfonso/LP-Factory-10**  
**Deploy: Vercel (preview + produção)**  
**Supabase: Projeto `lp-factory-10`**  
**Super Admin: alcinoafonso@live.com**

**Variáveis críticas (server-only):**

- `SUPABASE_SECRET_KEY` (chave de serviço usada pelo `service.ts`)
- `ACCESS_CONTEXT_ENFORCED=true` - obrigatória em preview/prod
- `ACCESS_CTX_USE_V2=true` (habilita Access Context v2)

**Variáveis públicas:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Convenções:**

- TypeScript: camelCase
- Postgres: snake_case
- Deploy: GitHub → Vercel (sem comandos locais)

**Nota: não usar `SUPABASE_SERVICE_ROLE_KEY`. Mantemos apenas `SUPABASE_SECRET_KEY` para evitar divergências entre ambiente e código.**

---

## 2. Stack & Dependências

**Framework:**

- Next.js 15+ (App Router)
- TypeScript (strict mode obrigatório)
- Tailwind CSS

**Backend:**

- Supabase (PostgreSQL + Auth + Storage + RLS)
- Autenticação: email/senha (Magic Link = futuro)

**UI:**

- Supabase UI Library (SULB) - auth forms
- shadcn/ui - componentes base (provisório até Platform Kit)

**Deploy:**

- Vercel (CI/CD automático)
- Preview + Produção

**Billing (planejado):**

- Stripe + @supabase/stripe-sync-engine (não implementado)

**Regras de import:**

- `@supabase/*` APENAS em `src/lib/**/adapters/**`
- **Exceção:** Componentes SULB (Supabase UI Library) podem importar `@supabase/*` diretamente
  - Lista completa de arquivos SULB: Ver seção 6.3
  - SULB são componentes de UI prontos do Supabase para auth forms
- UI/rotas (fora SULB) NUNCA importam Supabase diretamente

### 2.1 Referências Rápidas

**🎯 Tipos Canônicos**
- **Fonte única:** `src/lib/types/status.ts`
- **Importar via:** `src/lib/access/types.ts`
- **Tipos:** `AccountStatus`, `MemberStatus`, `MemberRole`

**🔧 Adapters por Domínio**
- **Contas:** `accountAdapter` (seção 5.2)
- **Acesso:** `accessContextAdapter` (seção 5.2)
- **Admin:** `adminAdapter`, `postSaleTokenAdapter` (seção 5.2)

**🗄️ Views Principais**
- **Access Context:** `v_access_context_v2` (seção 3.2)
- **Lista Contas:** `v_user_accounts_list` (seção 3.2)

**🔐 Checklist de Segurança**
- [ ] Views usam `security_invoker = true`
- [ ] Sem `@supabase/*` em `app/**` ou `components/**`
- [ ] Cookie `last_account_subdomain` apenas no SSR
- [ ] Toda query ao DB passa por adapters
- [ ] RLS em todas as tabelas de dados sensíveis

**🚦 Fluxo de Dados**
```
UI → Providers → Adapters → DB
```

**📍 Localização de Features**
- **E7 Onboarding:** Seção 5.3.2
- **Multi-conta:** Seção 5.3.3
- **Rate Limit:** Seção 4.9
- **SULB (Auth):** Seção 6.3

---

## 3. Schema

### 3.1 Tabelas Ativas

**accounts - Tenants multi-tenant**

- PK: `id` (uuid)
- Unique: `subdomain`, `domain`, `slug` (case-insensitive)
- Status: `active | inactive | suspended | pending_setup | trial`
  - `active`: Conta operacional normal
  - `inactive`: Conta desativada (não pode acessar)
  - `suspended`: Conta suspensa (problema de pagamento/violação)
  - `pending_setup`: Conta criada via E7 onboarding, aguardando conclusão de setup
  - `trial`: Conta em período de avaliação (com limites temporários ou reduzidos)
- FK: `plan_id` → plans, `owner_user_id` → auth.users
- Constraint: `idx_one_owner_per_account` (1 owner ativo)
- Campos: id, name, subdomain, domain, slug, status, plan_id, owner_user_id, created_at, updated_at
- Nota: `subdomain` é campo oficial (UNIQUE + CHECKs), `slug` é legado

**account_users - Memberships**

- PK: `id` (uuid)
- Unique: `(account_id, user_id)`
- Role: `owner | admin | editor | viewer`
- Status: `pending | active | inactive | revoked`
- FK: `account_id` → accounts, `user_id` → auth.users, `invited_by` → auth.users

**audit_logs - Trilha de auditoria**

- PK: `id` (uuid)
- `user_id` nullable (permite auditoria automática)
- Action: `insert | update | delete`
- Campos: `table_name`, `record_id`, `changes_json`, `account_id`

**plans - Catálogo de planos de assinatura**

- PK: `id` (uuid)
- Unique: `name`
- Campos principais:
  - `name` (text) - Nome do plano (ex: "Free", "Pro", "Enterprise")
  - `max_lps` (int) - Limite de landing pages (-1 = ilimitado)
  - `max_conversions` (int) - Limite de conversões/mês (-1 = ilimitado)
- Função: Define os limites de uso de cada conta baseado no plano contratado
- Uso: `account.plan_id` → `plans.id`
- Query: `get_account_effective_limits(account_id)` retorna limites aplicáveis

**partners - White-label**

- Type: `agency | reseller | affiliate`
- Status: `active | inactive | suspended`

**partner_accounts - Relacionamento parceiro ↔ conta**

- PK composto: `(partner_id, account_id)`

**post_sale_tokens - Onboarding consultivo (E7)**

- PK: id (uuid)
- Campos: email, contract_ref, expires_at, used_at, used_by, account_id, meta, created_at (DEFAULT now()), created_by (uuid)
- Índices: email, expires_at, used_at, account_id, (created_by, created_at DESC), (email, created_at DESC)
- RLS: pst_admin_all (super_admin | platform_admin | is_service_role), pst_self_history_select (usuário vê tokens próprios)

### 3.2 Views Ativas

#### v_access_context_v2 — Access Context (fonte única)

**Retorna o contexto de acesso completo entre usuário e conta.**  
**Usada pelo SSR (`getAccessContext.ts`) e pelo `AccessProvider`.**

**Colunas retornadas:**

- `account_id uuid`
- `account_key text` (subdomain)
- `account_name text` 🆕 *(E10.1 – campo essencial para header e AccountSwitcher)*
- `account_status text`
- `user_id uuid`
- `member_role text`
- `member_status text`
- `allow boolean`
- `reason text`

**Regra de autorização:**

- `allow = true` se `account.status IN ('active','trial','pending_setup')` e `member.status='active'`.
- `reason` pode ser `account_blocked`, `member_inactive` ou `no_membership`.

**Configuração de segurança:**  
`security_invoker = true`

**Usos:**

- SSR gate em `/a/[account]/layout.tsx`
- Adapter `accessContextAdapter.readAccessContext()`
- `AccessProvider` (exposição de `account.name` à UI)
- Cookie `last_account_subdomain` definido quando `allow = true`

---

#### v_user_accounts_list — Lista de Contas do Usuário (E10.1)

**View criada para alimentar o componente AccountSwitcher.**

**Colunas retornadas:**

- `account_id uuid`
- `account_name text`
- `account_subdomain text`
- `account_status text`
- `member_status text`
- `member_role text`

**Lógica:**  
JOIN entre `account_users` e `accounts`

```sql
SELECT
  a.id AS account_id,
  a.name AS account_name,
  a.subdomain AS account_subdomain,
  a.status AS account_status,
  au.status AS member_status,
  au.role AS member_role
FROM account_users au
JOIN accounts a ON a.id = au.account_id
WHERE au.user_id = auth.uid();
```

**Configuração:**

- `security_invoker = true`
- `GRANT SELECT ON v_user_accounts_list TO authenticated;`

**Usos:**

- Hook `useUserAccounts()`
- Endpoint `/api/user/accounts`
- `AccountSwitcher.tsx` (dropdown multi-conta)

---

### 3.3 Functions Ativas

**RPC E7 (Onboarding):**

- **create_account_with_owner(token_id, actor_id) → uuid** - Cria conta via token
  - Status: SECURITY DEFINER
  - Busca contract_ref do token e usa como nome inicial da conta
  - Insere em `subdomain` (não `slug`)
  - Status inicial: `pending_setup`
  - Valida auth.uid() = actor_id
  - Consome token (marca used_at)
  - Cria vínculo owner
  - Registra auditoria
- **_gen_provisional_slug() → text** - Gera slugs temporários (acc-{uuid8})

**RPC Limites:**

- **get_account_effective_limits(account_id) → table** - Retorna limites da conta

**Auth Helpers:**

- **is_super_admin() → boolean**
- **is_service_role() → boolean**
- **is_platform_admin() → boolean** - atualizada (E7): retorna `true` se `platform_admin=true` (claim) ou `auth.uid()` = UUID legado ou `is_super_admin()`
- **is_admin_active() → boolean**
- **is_member_active() → boolean**

**RLS Helpers (usadas em policies):**

- **has_account_min_role(account_id, min_role) → boolean** - Valida papel mínimo (DEFINER)
- **role_rank(role) → int** - Precedência (owner=4, admin=3, editor=2, viewer=1)

**Convites:**

- **accept_account_invite(account_id, ttl_days) → boolean** - Aceita convite (pending→active)
- **revoke_account_invite(account_id, user_id) → boolean** - Revoga/inativa convites
- **invitation_expires_at(account_user_id, ttl_days) → timestamptz** - Calcula expiração
- **invitation_is_expired(account_user_id, ttl_days) → boolean** - Verifica expiração

**Planos (helpers para limites):**

- **plan_limit_is_unlimited(value int) → boolean** 
  - Verifica se valor representa "ilimitado" (value = -1)
  - Uso: Checar se conta tem limite ou não
  - Exemplo: `plan_limit_is_unlimited(account.max_lps)` → true se ilimitado
  
- **plan_limit_value(value int) → bigint** 
  - Converte -1 para bigint::max (representação numérica de ilimitado)
  - Converte outros valores para bigint
  - Uso: Comparações numéricas que precisam tratar "ilimitado"

**Auditoria (usadas por triggers):**

- **audit_accounts(), audit_account_users(), audit_partner_accounts()**
- **jsonb_diff_val() → jsonb** - Calcula diffs para changes_json

**Governança:**

- **protect_last_owner()** - Impede remover último owner
- **tg_guard_last_owner(), tg_guard_accounts_transfer_owner()** - Proteções owner
- **tg_account_users_normalize_role()** - Normaliza papéis

### 3.4 Triggers Ativos

**Auditoria:**

- `trg_audit_accounts` → audit_accounts()
- `trg_audit_account_users` → audit_account_users()
- `trg_audit_partner_accounts` → audit_partner_accounts()

**Governança:**

- `trg_protect_last_owner` - Protege último owner
- `trg_account_users_guard_last_owner` - Impede remoção
- `trg_accounts_guard_transfer_owner` - Valida transferência

**Utilitários:**

- `trg_accounts_set_updated_at` - Timestamp automático
- `trg_account_users_normalize_role` - Normaliza papéis
- `trg_partner_accounts_audit` - Auditoria parceiros

### 3.5 Tipos TypeScript Canônicos

**Arquivo: `src/lib/types/status.ts` (fonte única)**

```typescript
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending_setup' | 'trial';
export type MemberStatus = 'pending' | 'active' | 'inactive' | 'revoked';
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer';
```

**Importadores: `src/lib/access/types.ts`, adapters (accountAdapter, accessContextAdapter)**

**Normalização: accountAdapter contém `normalizeAccountStatus()`, `normalizeMemberStatus()`, `normalizeRole()`**

---

## 4. Regras Técnicas Globais

### 4.1 Segurança

- Todas as views que expõem dados de contas de usuário (ex.: `v_user_accounts_list`) devem usar `security_invoker = true` e filtrar `user_id = auth.uid()`.
- O cookie `last_account_subdomain` é definido somente no SSR (`/a/[account]/layout.tsx`) após validação `allow=true`.
  - Atributos: `HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` (30 dias).
  - Leitura exclusiva no servidor (middleware).
- O logout deve expirar o cookie (`Max-Age=0`) para evitar persistência entre sessões diferentes no mesmo device.
- Nenhum dado sensível (subdomain, ids) é acessível via client JavaScript.

### 4.2 Camadas (Estrutura Rígida)

**Fluxo único: UI → Providers → Adapters → DB**

**Proibições:**

- `app/**` e `components/**` NUNCA importam `@supabase/*` ou `lib/supabase/*`
- **Exceção:** Componentes SULB (ver seção 6.3) podem importar `@supabase/*` diretamente
- Toda query ao banco passa por `src/lib/**/adapters/**`
- UI (exceto SULB) nunca fala diretamente com Supabase

**Quando criar adapter:**

- Lógica repetida em 3+ locais
- Entidade complexa (tabelas + relacionamentos)
- Operações críticas (billing, convites, tokens)

### 4.3 Estrutura de Arquivos

**Por domínio isolado:**

```
src/lib/
  access/          # Contas, membros, governança
    adapters/
    contracts.ts
    index.ts
  admin/           # Governança super_admin
    adapters/
    contracts.ts
    index.ts
  types/           # Tipos canônicos (status, etc)
```

**Regras:**

- Contracts = interface pública do módulo
- Adapters = única camada que toca DB
- index.ts = re-exporta contratos + orquestra flags

### 4.4 CI/Lint (Classes de Bloqueio)

**CI deve reprovar PR com:**

- `SECURITY DEFINER` em migrations (exceto functions aprovadas)
- Views sem `security_invoker = true`
- Implicit flow fora de `app/auth/confirm/route.ts`
- Imports `@supabase/*` em `app/**` ou `components/**`

**ESLint (planejado):**

- Banir `supabase.*` fora de `src/lib/**/adapters/**`
- Banir imports `lib/supabase/*` em UI/rotas

### 4.5 Secrets & Variáveis

**Server-only (nunca expor):**

- `SUPABASE_SECRET_KEY`
- `STRIPE_SECRET_KEY` (quando implementar)

**Públicas (NEXT_PUBLIC_*):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Flags obrigatórias:**

- `ACCESS_CONTEXT_ENFORCED=true` (preview/prod)
- `ACCESS_CTX_USE_V2=true` (temporária, remover após burn-in)

### 4.6 Tipos TypeScript

**Fonte única: `src/lib/types/status.ts`**

- Nunca redefinir tipos em outros arquivos
- Importar via re-export de `src/lib/access/types.ts`
- Normalizar valores do DB nos adapters

### 4.7 Convenções

**Nomenclatura:**

- TypeScript: camelCase
- Postgres: snake_case
- Constraints: `check_<tabela>_<campo>` ou `uq_<tabela>_<campo>`
- Índices: `idx_<tabela>_<campo>`

**Limites:**

- -1 = ilimitado (em campos numéricos de planos)

**Auditoria:**

- `user_id` nullable (permite auditoria automática)
- `changes_json` via `jsonb_diff_val()`

### 4.8 Anti-Regressão

**Antes de modificar código existente:**

**Schema (tabelas/views/functions):**

- Buscar nome no repositório (grep/search global)
- Identificar views/policies/adapters dependentes
- Atualizar todos ou rejeitar mudança

**Adapters:**

- Verificar importadores antes de mudar assinatura de método
- Manter contratos retrocompatíveis (adicionar campos opcionais, não remover/renomear)

**Tipos TS:**

- Modificar apenas em fonte única (`src/lib/types/status.ts`)
- Verificar normalização em adapters após mudança (accountAdapter, accessContextAdapter)

**Arquivos com regras especiais:**

- Arquivos SULB originais: manter compatibilidade com upstream
- `middleware.ts` raiz: fluxo único estabelecido (bypass /a, /a/home)
- Tipos canônicos: fonte única inviolável (`src/lib/types/status.ts`)

**Quando criar novo arquivo:**

- Novo módulo/domínio → `src/lib/{domínio}/`
- Nova UI feature → `components/features/{feature}/`
- Novo adapter → quando lógica repetida em 3+ locais

### 4.9 Rate Limit

**Regras (MVP) aplicadas na geração de tokens (`src/lib/admin/adapters/postSaleTokenAdapter.ts` → `generate`):**

**Limites por papel:**

- super_admin: 200 tokens/dia
- platform_admin: 20 tokens/dia
- Ambos: 3 tokens/email/dia, 5 burst/5min

**Ambiente (defaults):**

- RATE_LIMIT_SUPER_ADMIN_PER_DAY=200
- RATE_LIMIT_TOKENS_PER_DAY=20
- RATE_LIMIT_TOKENS_PER_EMAIL=3
- RATE_LIMIT_BURST_5M=5

**Implementação: consulta `post_sale_tokens` por `created_by`, `email`, `created_at`; bloqueio com log `rate_limit_exceeded`.**

**Índices de suporte: `(created_by, created_at DESC)` e `(email, created_at DESC)`.**

### 4.10 ❌ Anti-Patterns

**Lista consolidada de práticas PROIBIDAS no projeto.**

#### ❌ Nunca Fazer: Imports

```typescript
// ❌ ERRADO - UI comum importando Supabase diretamente
import { createClient } from '@supabase/supabase-js'

// ✅ CORRETO - UI importa adapter
import { accountAdapter } from '@/lib/access'

// ✅ EXCEÇÃO - Componentes SULB podem importar Supabase
// components/login-form.tsx (SULB)
import { createBrowserClient } from '@supabase/ssr'
```

```typescript
// ❌ ERRADO - Componente comum acessando DB
const accounts = await supabase.from('accounts').select()

// ✅ CORRETO - Componente usa adapter
const accounts = await accountAdapter.list()
```

**Regra:** `@supabase/*` APENAS em `src/lib/**/adapters/**`  
**Exceção:** Componentes SULB (auth forms) - Ver seção 6.3 para lista completa

---

#### ❌ Nunca Fazer: Views sem Security Invoker

```sql
-- ❌ ERRADO - View sem security_invoker
CREATE VIEW v_user_data AS
SELECT * FROM accounts WHERE owner_user_id = auth.uid();

-- ✅ CORRETO - View com security_invoker
CREATE VIEW v_user_data
WITH (security_invoker = true) AS
SELECT * FROM accounts WHERE owner_user_id = auth.uid();
```

**Regra:** Toda view que expõe dados de usuário DEVE usar `security_invoker = true`

---

#### ❌ Nunca Fazer: SECURITY DEFINER sem Aprovação

```sql
-- ❌ ERRADO - Function DEFINER não aprovada
CREATE FUNCTION delete_user_account()
RETURNS void
SECURITY DEFINER
AS $$...$$;

-- ✅ CORRETO - Function INVOKER (padrão seguro)
CREATE FUNCTION delete_user_account()
RETURNS void
SECURITY INVOKER
AS $$...$$;
```

**Regra:** `SECURITY DEFINER` requer aprovação explícita em CR + documentação no roadmap

**Functions DEFINER aprovadas:**
- `create_account_with_owner()` - E7 onboarding
- `has_account_min_role()` - RLS helper

---

#### ❌ Nunca Fazer: Tipos Duplicados

```typescript
// ❌ ERRADO - Redefinindo tipo
export type AccountStatus = 'active' | 'inactive'

// ✅ CORRETO - Importando da fonte única
import { AccountStatus } from '@/lib/types/status'
```

**Regra:** Tipos canônicos APENAS em `src/lib/types/status.ts`

---

#### ❌ Nunca Fazer: Cookie no Client

```typescript
// ❌ ERRADO - Cookie manipulado no client
document.cookie = 'last_account_subdomain=xyz'

// ✅ CORRETO - Cookie definido no SSR
// app/a/[account]/layout.tsx define via Set-Cookie header
```

**Regra:** Cookie `last_account_subdomain` APENAS no SSR (layout.tsx)

---

#### ❌ Nunca Fazer: Bypass do Fluxo de Dados

```typescript
// ❌ ERRADO - Provider chamando DB diretamente
const AccessProvider = () => {
  const data = await supabase.from('accounts').select()
}

// ✅ CORRETO - Provider chama adapter
const AccessProvider = () => {
  const data = await accountAdapter.list()
}
```

**Regra:** Fluxo obrigatório: `UI → Providers → Adapters → DB`

---

#### ❌ Nunca Fazer: Hardcoded IDs/Emails

```typescript
// ❌ ERRADO - Super admin hardcoded
if (user.id === '12345-abc-...') {
  // super admin logic
}

// ✅ CORRETO - Helper function
if (await is_super_admin()) {
  // super admin logic
}
```

**Regra:** Usar helpers `is_super_admin()`, `is_platform_admin()` do DB

---

#### ❌ Nunca Fazer: Mutation de Schema sem Migration

```typescript
// ❌ ERRADO - ALTER TABLE no código
await supabase.sql`ALTER TABLE accounts ADD COLUMN new_field text`

// ✅ CORRETO - Migration file
// supabase/migrations/20251031_add_new_field.sql
ALTER TABLE accounts ADD COLUMN new_field text;
```

**Regra:** Toda mudança de schema via migration file

---

#### ❌ Nunca Fazer: Secrets em Client

```typescript
// ❌ ERRADO - Secret exposta
const client = createClient(url, process.env.SUPABASE_SECRET_KEY)

// ✅ CORRETO - Publishable key no client
const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
```

**Regra:** `SUPABASE_SECRET_KEY` APENAS server-side (`src/lib/supabase/service.ts`)

---

#### ❌ Nunca Fazer: Modificar SULB sem Testar

```typescript
// ❌ ERRADO - Alterar SULB original sem plano
// components/login-form.tsx - mudar lógica core

// ✅ CORRETO - Verificar lista de arquivos modificados (seção 6.3)
// Apenas 6 arquivos SULB foram adaptados, resto é original
```

**Regra:** Ver seção 6.3 para lista de arquivos SULB modificados vs originais

---

#### 🎯 Checklist Anti-Patterns (Code Review)

Antes de aprovar PR, validar:
- [ ] Sem `@supabase/*` em `app/**` ou `components/**` (exceto SULB - ver 6.3)
- [ ] Views usam `security_invoker = true`
- [ ] Sem `SECURITY DEFINER` não aprovado
- [ ] Sem tipos duplicados (fonte única: `status.ts`)
- [ ] Cookie apenas no SSR
- [ ] Fluxo de dados respeitado (UI→Providers→Adapters→DB, exceto SULB)
- [ ] Sem IDs/emails hardcoded
- [ ] Schema via migrations, não código
- [ ] Sem secrets no client
- [ ] SULB: apenas arquivos aprovados modificados (ver seção 6.3)

**Índices de suporte: `(created_by, created_at DESC)` e `(email, created_at DESC)`.**

---

## 5. Arquitetura de Acesso

### 5.1 Conceitos Fundamentais

#### 5.1.1 Access Context v2

**Fonte única de decisão de acesso entre usuário e conta.**  
Autoriza SSR e sincroniza a UI via AccessProvider.

**View:** `v_access_context_v2` (ver seção 3.2 para detalhes completos)

**Integrações principais:**
- SSR gate: `/a/[account]/layout.tsx` (define cookie `last_account_subdomain`)
- Adapter: `accessContextAdapter.readAccessContext()`
- Provider: `AccessProvider` (expõe `account.name` à UI)
- Middleware: lê cookie e redireciona `/a` → `/a/{subdomain}`

#### 5.1.2 Persistência SSR (Cookie)

**Função:** Mantém a última conta usada entre sessões.

**Local:** `app/a/[account]/layout.tsx`

**Processo:**
1. `getAccessContext()` valida acesso via `v_access_context_v2`
2. Se `allow=true`, define cookie antes de renderizar:
   ```
   Set-Cookie: last_account_subdomain=<subdomain>;
   Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
   ```
3. Middleware lê cookie e redireciona `/a` → `/a/{subdomain}`
4. Logout expira o cookie (`Max-Age=0`)

**Benefício:** Usuário autenticado reabre `/a` e retorna à última conta, sem depender de client state.

---

### 5.2 Implementação (Adapters, Guards, Providers)

#### 5.2.1 Adapters de Acesso

**accountAdapter** (`src/lib/access/adapters/`)
- `createFromToken(tokenId, actorId)` - E7 onboarding
- `renameAndActivate(accountId, name, slug)` - E7 setup
- Normaliza status/role do DB para tipos TS (fonte: seção 3.5)

**accessContextAdapter** (`src/lib/access/adapters/`)
- Única função de acesso ao contexto via `v_access_context_v2`
- Logging padronizado, fail-closed (erro → null)
- Retorna: `{ account: { id, subdomain, name?, status }, member: { user_id, account_id, role, status } }`

**adminAdapter** (`src/lib/admin/adapters/`) - E7
- `checkSuperAdmin()` - valida JWT claims
- `tokens.*` - CRUD post_sale_tokens (usa service client)

**postSaleTokenAdapter** (`src/lib/admin/adapters/`) - E7
- `generate()`, `validate()`, `consume()`, `revoke()`
- Usa service client (GRANT service_role na view)
- Rate limits aplicados (ver seção 4.9)

#### 5.2.2 Guards SSR

**Arquivo:** `src/lib/access/guards.ts`

**Funções:**
- `requireSuperAdmin()` - valida + redirect se não for super_admin
- `requirePlatformAdmin()` - valida + redirect se não for platform_admin (ou super_admin)

**Usos:**
- `app/admin/layout.tsx` → requirePlatformAdmin()
- `app/admin/tokens/page.tsx` → requirePlatformAdmin() (Server Actions)

#### 5.2.3 Providers

**AccessProvider.tsx** (`src/providers/`)
- Fornece contexto global `{account, member}` para a UI
- Sincroniza automaticamente com `getAccessContext()` (SSR)
- Expõe `account.name` (campo de `v_access_context_v2`)
- Garante consistência do header e AccountSwitcher

---

### 5.3 Fluxos Principais

#### 5.3.1 Login & Reset (SULB)

**Forms:** `components/login-form.tsx`, `forgot-password-form.tsx`  
**Intersticial:** `app/auth/confirm/route.ts` (valida tokens, estabiliza sessão)  
**Redirect final:** `/a/[account]` ou `/auth/confirm/info`

#### 5.3.2 E7 Onboarding Consultivo

1. Token único enviado ao cliente (pós-venda)
2. Cliente define senha → cria usuário
3. RPC `create_account_with_owner()` → conta provisória (`pending_setup`)
4. Redirect → `/a/[account]` com banner setup
5. Cliente nomeia conta → status muda para `active`

**Arquivos principais:**
- `/onboard/page.tsx` - validação token SSR
- `/onboard/actions.ts` - Server Action `onboardAction()`
- `accountAdapter.createFromToken()` - RPC wrapper

#### 5.3.3 Multi-conta (AccountSwitcher)

Sistema de troca de contas com persistência via cookie (`last_account_subdomain`, 30d, HttpOnly).

**Componentes:** `AccountSwitcher`, `AccountSwitcherTrigger`, `AccountSwitcherList`  
**Hooks:** `useAccountSwitcher`, `useUserAccounts`  
**View:** `v_user_accounts_list` (seção 3.2)  
**Endpoint:** `/api/user/accounts`  
**Funcionalidades:** Persistência 30d, ocultação automática (≤1 conta), suporte teclado/touch

**Orquestração SSR:**
1. `app/a/[account]/layout.tsx` executa gate SSR via `getAccessContext()`
2. Se `allow=true`, define cookie antes de responder (atributos: ver seção 4.1 ou 5.1.2)
3. Middleware lê cookie e redireciona `/a` → `/a/{subdomain}` (quando autenticado)
4. Logout expira cookie (`Max-Age=0`)

**Benefício:** Usuário autenticado reabre `/a` e retorna à última conta automaticamente, sem depender de client state.

Histórico de implementação: Ver `docs/roadmap.md` seção E10.1

#### 5.3.4 Observabilidade

**Eventos estruturados:**

| Evento | Origem | Status |
|--------|--------|--------|
| `account_switcher_open` | AccountSwitcher.tsx | ✅ |
| `account_selected` | AccountSwitcher.tsx | ✅ |
| `create_account_click` | Header / UserMenu | ✅ |
| `preferred_account_cookie_set` | /a/[account]/layout.tsx | 🟡 planejado |

**Padrão:** JSON único (event, scope, latency_ms, timestamp, error?)

---

## 6. Estrutura de Arquivos

### 6.1 Princípios de Organização

**Estrutura por domínio isolado:**

```
src/lib/{domínio}/
  ├── adapters/      # Única camada que acessa DB
  ├── contracts.ts   # Interface pública do módulo
  └── index.ts       # Re-exports + orquestração
```

**Separação de responsabilidades (camadas):**

- UI (app/ + components/): Renderização e interação
- Providers (src/providers/): Contextos React (consome adapters)
- Adapters (src/lib/*/adapters/): Queries/mutations Supabase
- DB: Apenas adapters acessam (via `@supabase/*`)

**Fluxo de dados obrigatório:**

```
UI → Providers → Adapters → DB
```

**Regras de import:**

- ❌ `app/**` e `components/**` nunca importam `@supabase/*`
- ✅ Toda query ao banco passa por `src/lib/**/adapters/**`
- ✅ Tipos canônicos só em `src/lib/types/status.ts`

### 6.2 Inventário de Arquivos

**Formato:** Módulo → Arquivo → Responsabilidade

#### 📂 Lógica de Negócio (src/lib/)

| Módulo | Arquivo | Responsabilidade | Status |
|--------|---------|------------------|--------|
| **access/** | accountAdapter.ts | CRUD contas, createFromToken, renameAndActivate | ✅ |
| | accessContextAdapter.ts | Lê v_access_context_v2, inclui account_name | ✅ E10.1 |
| | getAccessContext.ts | Orquestrador SSR (fonte única Access Context) | ✅ |
| | guards.ts | requireSuperAdmin, requirePlatformAdmin | ✅ |
| | types.ts | Re-exporta tipos de ../types/status.ts | ✅ |
| | audit.ts | auditAccountSwitch (telemetria) | ✅ |
| | plan.ts | fetchPlanAndLimits (RPC) | ✅ |
| **admin/** | adminAdapter.ts | Valida super/platform admin, CRUD tokens | ✅ E7 |
| | postSaleTokenAdapter.ts | generate, validate, consume, revoke | ✅ E7 |
| | contracts.ts | Tipos PostSaleToken, TokenWithUsage | ✅ |
| **types/** | status.ts | Fonte única: AccountStatus, MemberStatus, MemberRole | ✅ |
| **supabase/** | service.ts | Client server-side (SUPABASE_SECRET_KEY) | ✅ |
| | client.ts | Client browser-side (PUBLISHABLE_KEY) | ✅ |
| | middleware.ts | updateSession, bypass /a, /a/home, /onboard | ✅ |
| | server.ts | Client SSR (createServerClient) | ✅ |

#### 🗂 Rotas (app/)

| Rota | Arquivo | Responsabilidade | Status |
|------|---------|------------------|--------|
| **auth/** | confirm/route.ts | Intersticial anti-scanner (GET+POST) | ✅ |
| | login/page.tsx | Login SULB | ✅ |
| | forgot-password/page.tsx | Reset senha SULB | ✅ |
| | update-password/page.tsx | SSR redefinição (validação + verifyOtp) | ✅ |
| **a/** | [account]/layout.tsx | Gate SSR + set-cookie last_account_subdomain | ✅ |
| | [account]/page.tsx | Dashboard principal | ✅ |
| | [account]/actions.ts | renameAccountAction (E7) | ✅ |
| | home/page.tsx | Página pública entrada | ✅ |
| **admin/** | layout.tsx | Gate requirePlatformAdmin | ✅ E7 |
| | tokens/page.tsx | Painel tokens (gera/revoga) | ✅ E7 |
| **onboard/** | page.tsx | Valida token SSR + formulário | ✅ E7 |
| | actions.ts | onboardAction (signUp→signIn→createFromToken) | ✅ E7 |
| **api/** | user/accounts/route.ts | Lista contas via v_user_accounts_list | ✅ |

#### 🧩 Interface (components/)

| Categoria | Arquivos | Responsabilidade | Status |
|-----------|----------|------------------|--------|
| **ui/** | button, card, input, label | Base shadcn/ui | ✅ |
| | AlertBanner.tsx | Aviso genérico (setup consultivo) | ✅ |
| **layout/** | UserMenu.tsx | Dropdown Avatar + AccountSwitcher | ✅ |
| **features/account-switcher/** | AccountSwitcher.tsx, AccountSwitcherTrigger.tsx, AccountSwitcherList.tsx, useAccountSwitcher.ts, useUserAccounts.ts | Multi-conta (5 arquivos) | ✅ |
| **admin/** | CopyLinkButton.tsx | Copia link onboarding | ✅ E7 |
| **onboard/** | OnboardForm.tsx | Formulário senha/validação | ✅ E7 |

#### ⚙ Providers & Config

| Arquivo | Responsabilidade | Status |
|---------|------------------|--------|
| AccessProvider.tsx | Contexto {account, member}, expõe account.name | ✅ |
| middleware.ts | Bypass routes, lê cookie last_account_subdomain, redirect /a | ✅ |
| next.config.js | Rewrites, redirects, headers | ✅ |
| .github/workflows/security.yml | CI: bloqueia implicit flow, views sem security_invoker | ✅ |

- `README.md` → Guia de build e deploy (Vercel + Supabase).
- `.gitignore`, `postcss.config.js` → Padrão Tailwind/Vercel.

### 6.3 Biblioteca Supabase (SULB)

**Origem: `github.com/supabase/supabase/tree/master/examples/auth/nextjs`**

**Arquivos modificados (adaptados ao LP Factory 10):**

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `lib/supabase/client.ts` | Sem alteração estrutural | Compatível com env vars |
| `lib/supabase/middleware.ts` | `getUser()` em vez de `getClaims()` + bypass `/a`, `/a/home`, `/onboard` | Evitar redirect em rotas públicas/SSR gate |
| `lib/supabase/server.ts` | Sem alteração estrutural | Compatível |
| `app/auth/confirm/route.ts` | Reescrito completo | Intersticial anti-scanner (GET→form→POST) |
| `app/auth/update-password/page.tsx` | Server Component + validações | Consome token 1x via SSR, valida senha |
| `app/auth/protected/page.tsx` | `user.email` em vez de claims | Simplificação |

**Arquivos originais (sem modificação):**

- `app/auth/error/page.tsx`
- `app/auth/forgot-password/page.tsx`
- `app/auth/login/page.tsx`
- `app/auth/sign-up/page.tsx`
- `app/auth/sign-up-success/page.tsx`
- `components/login-form.tsx`
- `components/forgot-password-form.tsx`
- `components/sign-up-form.tsx`
- `components/logout-button.tsx`
- `components/update-password-form.tsx` (não usado, substituído por SSR)

**⚠️ Ao atualizar SULB:**

1. Revisar apenas os 6 arquivos modificados listados acima
2. Manter modificações (bypass routes, validações, intersticial)
3. Testar fluxos: reset senha, confirm tokens, update password

---

**Última atualização: 31/10/2025**  
**Versão anterior: 1.3 (18/10/2025)**  
**Próxima revisão: Após E10.2 (UX Partner Dashboard) ou E9 (Stripe Sync)**
