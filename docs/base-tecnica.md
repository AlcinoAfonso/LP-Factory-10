# LP Factory 10 - Base Técnica

**Versão: 1.7**  
**Data: 11/11/2025**  
**Propósito: Documentação técnica do estado atual do sistema**  

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
  - [4.11 Sistema de Grants (Controle de Features)](#411-sistema-de-grants-controle-de-features)
  - [4.12 Compatibilidade PostgREST 13](#412-compatibilidade-postgrest-13)
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

> **⚠️ Ambiente:** LP Factory 10 opera via **GitHub Web + Vercel** (sem CLI local).  
> Edição, auditoria e testes são feitos no navegador.  
> Toda recomendação técnica deve ser executável via GitHub Web ou Vercel Dashboard.

**Nota: não usar `SUPABASE_SERVICE_ROLE_KEY`. Mantemos apenas `SUPABASE_SECRET_KEY` para evitar divergências entre ambiente e código.**

---

## 2. Stack & Dependências

**Framework:**

- Next.js 15+ (App Router)
- TypeScript (strict mode obrigatório)
- Tailwind CSS

**Backend:**

- Supabase (PostgreSQL + Auth + Storage + RLS)
- PostgREST 12.2.12 — preparado para v13 (aguardando liberação no plano Free)
- `@supabase/supabase-js` ≥ 2.56.0 — atualizado e validado com build verde no Vercel
- `.maxAffected(1)` aplicado em mutações 1-a-1 (ignorado com segurança no v12)
- Search Path: apenas `public` (sem `pg_temp`)
- Autenticação: email/senha (Magic Link = futuro)
- JWT Legacy (HMAC) — migração pendente para JWT Signing Keys (kid)

**UI:**

- Supabase UI Library (SULB) – auth forms  
- shadcn/ui – componentes base (provisório até Platform Kit)

**Deploy:**

- Vercel (CI/CD automático)  
- Ambientes: Preview + Produção  
- Variáveis validadas no Vercel:  
  - `SUPABASE_SECRET_KEY` (server-only)  
  - `NEXT_PUBLIC_SUPABASE_URL`  
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Billing (planed):**

- Stripe + `@supabase/stripe-sync-engine` (ainda não implementado)

**Regras de import:**

- `@supabase/*` APENAS em `src/lib/**/adapters/**`
- **Exceção:** componentes SULB (Supabase UI Library) podem importar `@supabase/*` diretamente  
  - Lista completa: ver seção 6.3  
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

**accounts — Tenants multi-tenant**

- **PK:** `id` (uuid)  
- **Unique:** `subdomain`, `domain`, `slug` (case-insensitive)  
- **Status:** `active | inactive | suspended | pending_setup | trial`  
  - `active`: conta operacional normal  
  - `inactive`: conta desativada (sem acesso)  
  - `suspended`: conta suspensa (pagamento ou violação)  
  - `pending_setup`: criada via E7 onboarding, aguardando conclusão de setup  
  - `trial`: conta em avaliação, com limites temporários ou reduzidos  
- **FK:** `plan_id` → `plans`, `owner_user_id` → `auth.users`  
- **Constraint:** `idx_one_owner_per_account` (1 owner ativo)  
- **Campos:** `id`, `name`, `subdomain`, `domain`, `slug`, `status`, `plan_id`, `owner_user_id`, `created_at`, `updated_at`  
- **Índice adicional (v13-ready):**
    
    CREATE INDEX IF NOT EXISTS accounts_name_gin_idx  
    ON accounts USING gin(to_tsvector('portuguese', name));
    
  → habilita busca full-text (`textSearch()`) compatível com PostgREST 13, sem impacto em versões anteriores.  
- **Nota:** `subdomain` é o campo oficial (UNIQUE + CHECKs); `slug` é legado.

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

**post_sale_tokens — Onboarding consultivo (E7)**

- **PK:** `id` (uuid)  
- **Campos:** `email`, `contract_ref`, `expires_at`, `used_at`, `used_by`, `account_id`, `meta`, `created_at`, `created_by`  
- **Índices:**  
  - `(email, created_at DESC)`  
  - `(created_by, created_at DESC)`  
- **Função:** armazena tokens únicos para o fluxo de **onboarding consultivo (E7)**, permitindo criação segura de contas via convite administrado.  
- **RLS:** ativo — políticas `pst_admin_all` (acesso administrativo) e `pst_self_history_select` (usuário visualiza tokens próprios).  
- **Auditoria:** integrada ao `audit_logs` via Trigger Hub indireto (eventos registrados por funções do adapter).  
- **Rate limit:** controlado por adapter (`postSaleTokenAdapter.generate()`), com limites diários por papel e email.  
- **Situação:** tabela ativa e funcional, **fora do Trigger Hub** apenas por não exigir guardas diretas.  
- **Uso principal:** base do processo de geração, consumo e revogação de tokens de conta consultiva.


### 3.2 Views Ativas

> **📘 Definição técnica:** Esta seção contém estrutura SQL e campos. Para casos de uso e integração → **Ver seção 5.1.1**

#### v_access_context_v2 — Access Context (fonte única)

**Retorna o contexto de acesso completo entre usuário e conta.**

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

---

#### v_user_accounts_list — Lista de Contas do Usuário (E10.1)

**Objetivo:** alimentar o AccountSwitcher.

**Colunas:**

* `account_id uuid`
* `account_name text`
* `account_subdomain text`
* `account_status text`
* `member_status text`
* `member_role text`
* `created_at timestamptz`

**Fonte & Lógica (atual):**
Deriva de `public.v_access_context_v2` (invoker) com `JOIN public.accounts a ON a.id = v.account_id`.
Filtros efetivos: `v.user_id = auth.uid()` e `v.allow = true`.

**Segurança (conforme BT 1.6/1.7):**

* `security_invoker = true` (definido na view).
* RLS aplicado nas tabelas base via invoker.
* Sem funções `SECURITY DEFINER`.
* `GRANT SELECT ON public.v_user_accounts_list TO authenticated`.
* `search_path` esperado: `public`.

**Exposição:** `public.v_user_accounts_list` (PostgREST/Supabase).

**Consumidores:**

* Hook de dados: `useUserAccounts()` (chamado por `useAccountSwitcher`).
* Endpoint: `/api/user/accounts`.
* UI: `AccountSwitcher.tsx`.

**Contrato de erro/estado:**

* Sem vínculo ativo ⇒ lista vazia.
* Não requer service role; cliente autenticado padrão.

---

#### v_account_effective_limits — Limites Efetivos da Conta

**Retorna os limites e configurações do plano associado à conta.**

**Colunas retornadas:**

- `account_id uuid`
- `account_name text`
- `account_status text`
- `subdomain text`
- `domain text`
- `plan_id uuid`
- `plan_name text`
- `price_monthly numeric`
- `plan_features jsonb`
- `max_lps int`
- `max_conversions int`
- `max_lps_unlimited boolean`
- `max_lps_effective bigint`
- `max_conversions_unlimited boolean`
- `max_conversions_effective bigint`
- `created_at timestamptz`
- `updated_at timestamptz`

**Lógica:**  
JOIN entre `accounts` e `plans` com helpers de limite (`plan_limit_is_unlimited`, `plan_limit_value`).

**Configuração:**
- `security_invoker = true`

**Uso:**
- Base para verificação de limites de plano
- Função `get_account_effective_limits(account_id)` usa esta view

---

#### v_account_effective_limits_secure — Limites Efetivos (Segura)

**Versão filtrada de `v_account_effective_limits` com controle de acesso.**

**Colunas retornadas:**
*(mesmas de `v_account_effective_limits`)*

**Lógica:**  
Proxy sobre `v_account_effective_limits` com filtro: apenas platform_admin ou membro ativo da conta (`is_platform_admin()` OR `is_member_active(account_id, auth.uid())`).

**Configuração:**
- `security_invoker = true`
- Filtro RLS aplicado

**Uso:**
- API endpoints que expõem limites de plano
- Dashboard de administração

---

#### v_admin_tokens_with_usage — Tokens Consultivos com Status

**View para gerenciamento de tokens de onboarding (E7).**

**Colunas retornadas:**

- `token_id uuid`
- `email text`
- `expires_at timestamptz`
- `is_used boolean`
- `is_valid boolean`
- `account_slug text`
- `created_at timestamptz`

**Lógica:**  
JOIN entre `post_sale_tokens` e `accounts`. Campos calculados: `is_used` (token consumido), `is_valid` (não usado e não expirado).

**Configuração:**
- `security_invoker = true`

**Uso:**
- Painel `/admin/tokens` (E7)
- Listagem e revogação de tokens consultivos

---

#### v_audit_logs_norm — Logs de Auditoria Normalizados

**View simplificada para consulta de logs de auditoria.**

**Colunas retornadas:**

- `id uuid`
- `entity text` (nome da tabela)
- `entity_id uuid`
- `action text`
- `diff jsonb` (changes_json)
- `account_id uuid`
- `actor_user_id uuid`
- `ip_address text`
- `created_at timestamptz`

**Lógica:**  
Renomeia campos de `audit_logs` para nomenclatura mais clara (ex: `table_name` → `entity`, `changes_json` → `diff`).

**Configuração:**
- `security_invoker = true`

**Uso:**
- Relatórios de auditoria
- Dashboard administrativo
- Integração futura com Supabase Unified Logs

---

---


### 3.3 Functions Ativas

---

#### **RPC E7 (Onboarding)**

- **create_account_with_owner(token_id, actor_id) → uuid**
  - **Status:** SECURITY DEFINER  
  - Cria conta via token (E7)
  - Busca `contract_ref` do token e usa como nome inicial da conta
  - Insere em `subdomain` (não `slug`)
  - Status inicial: `pending_setup`
  - Valida `auth.uid()` = `actor_id`
  - Consome token (`used_at`)
  - Cria vínculo owner e registra auditoria
- **_gen_provisional_slug() → text**
  - Gera slugs temporários (`acc-{uuid8}`)

---

#### **RPC Limites**

- **get_account_effective_limits(account_id) → table**
  - Retorna limites efetivos da conta (LPs, seções, conversões)

---

#### **Auth Helpers**

- **is_super_admin() → boolean**  
- **is_service_role() → boolean**  
- **is_platform_admin() → boolean**
  - Atualizada (E7): retorna `true` se `platform_admin=true` (claim)
- **is_admin_active() → boolean**  
- **is_member_active() → boolean**

---

#### **RLS Helpers (Policies)**

- **has_account_min_role(account_id, min_role) → boolean**
  - **Status:** SECURITY DEFINER  
  - Valida papel mínimo exigido em policies  
- **role_rank(role) → int**
  - Define precedência de papéis (`owner=4`, `admin=3`, `editor=2`, `viewer=1`)

---

#### **Convites**

- **accept_account_invite(account_id, ttl_days) → boolean**
  - Aceita convite (pending → active)
- **revoke_account_invite(account_id, user_id) → boolean**
  - Revoga convites ativos
- **invitation_expires_at(account_user_id, ttl_days) → timestamptz**
  - Calcula expiração
- **invitation_is_expired(account_user_id, ttl_days) → boolean**
  - Verifica expiração

---

#### **Planos (Helpers de limites)**

- **plan_limit_is_unlimited(value int) → boolean**
  - Verifica se o valor representa ilimitado (`-1`)
- **plan_limit_value(value int) → bigint**
  - Converte `-1` para `bigint::max`
  - Mantém outros valores conforme definidos

---

#### **Auditoria / Guardas — Trigger Hub (núcleo v1.6)**

- **hub_router()**
  - Trigger único BEFORE INSERT/UPDATE/DELETE (ROW)
  - Normaliza o evento (`TG_OP`, tabela, `OLD/NEW`, `actor`)
  - Executa `fn_audit_dispatch` e guardas específicas

- **fn_audit_dispatch(table text, kind text, payload jsonb)**
  - Grava `audit_logs` com `event='hub_dispatch'`
  - Campos mínimos: `table`, `kind`, `txid_current()`, `actor(jwt_claims)`, `payload`

- **fn_guard_last_owner(kind text, new account_users, old account_users)**
  - Impede remoção ou downgrade do último owner ativo

- **fn_owner_transfer_rules(kind text, new accounts, old accounts)**
  - Valida trocas de `owner_user_id` em `accounts`
  - Bloqueia se `owner_user_id` nulo ou redundante

- **fn_event_bus_publish(table text, kind text, payload jsonb)**
  - Opcional — fan-out futuro (notificações/webhooks)

---

#### **Auditoria (helpers complementares)**

- **jsonb_diff_val() → jsonb**
  - Calcula diferenças entre estados JSON para log de alterações

---

> **Nota:**  
> Funções legadas (`audit_*`, `protect_last_owner()`, `tg_guard_*`) permanecem apenas para rollback.  
> As triggers ativas agora utilizam exclusivamente o **Trigger Hub**.


### 3.4 Triggers Ativos

**Trigger Hub (única por tabela):**
- `tg_accounts_hub` — BEFORE INSERT/UPDATE/DELETE ON accounts → hub_router()  
- `tg_account_users_hub` — BEFORE INSERT/UPDATE/DELETE ON account_users → hub_router()  
- `tg_partner_accounts_hub` — BEFORE INSERT/UPDATE/DELETE ON partner_accounts → hub_router()

**Desativadas (legadas, apenas para rollback):**
- Auditoria: `trg_audit_accounts`, `trg_audit_account_users`, `trg_audit_partner_accounts`  
- Governança: `trg_protect_last_owner`, `trg_account_users_guard_last_owner`, `trg_accounts_guard_transfer_owner`  
- Utilitários: `trg_accounts_set_updated_at`, `trg_account_users_normalize_role`, `trg_partner_accounts_audit`

**Exceções:**
- `audit_logs` não possui trigger (sink de eventos).

---

### 3.4.1 Tabelas Fora do Escopo do Trigger Hub

As tabelas abaixo não foram integradas ao Trigger Hub por não exigirem auditoria ou guardas de governança.

| Tabela | Situação | Observações |
|---------|-----------|-------------|
| **plans** | 🚫 Fora do escopo | Tabela estática de referência, apenas leitura. Não possui triggers nem eventos de negócio. Mantida apenas para RLS de leitura. |
| **partners** | 🚫 Fora do escopo | Cadastro simples; não contém guardas. As alterações são refletidas em `partner_accounts`, que já é auditada via Hub. |
| **post_sale_tokens** | 🟡 Stand-by (decisão pendente) | Tabela obsoleta, ligada à view `v_admin_tokens_with_usage`. Mantida apenas por compatibilidade. Sem triggers nem guardas. Se for descontinuada, exportar dados e remover a view dependente. |

---

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
- **Cookie `last_account_subdomain`:** Definição, atributos, leitura servidor e logout → **Ver seção 5.1.2**
- Nenhum dado sensível (subdomain, ids) é acessível via client JavaScript.

### 4.2 Camadas (Estrutura Rígida)

**Fluxo único: UI → Providers → Adapters → DB**

**Proibições:**

- `app/**` e `components/**` NUNCA importam `@supabase/*` ou `lib/supabase/*`
- **Exceção SULB:** Lista completa de componentes auth permitidos → **Ver seção 6.3**
- Toda query ao banco passa por `src/lib/**/adapters/**`

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

**Regra geral:** toda modificação deve preservar compatibilidade e segurança sem afetar fluxos existentes.

**Schema:**
- Alterações sempre via migration idempotente.
- Views e functions dependentes devem ser revisadas antes da execução.
- `security_invoker=true` obrigatório em todas as views de acesso.

**Adapters:**
- Manter contratos compatíveis; nunca remover campos esperados.
- `.maxAffected(1)` aplicado em mutações 1-a-1 (ativo no v13, ignorado no v12).
- Revisar importadores antes de mudar assinatura.

**Tipos TS:**
- Fonte única: `src/lib/types/status.ts`
- Após mudanças, validar normalização nos adapters.

**JWT e SDK:**
- Projeto utiliza JWT Legacy (HMAC); migração para JWT Signing Keys pendente.
- SDK atualizado (`@supabase/supabase-js ≥ 2.56.0`) e compatível com PostgREST 13.
- Search Path restrito a `public`.

**Rollback seguro:**
- Reverter SDK ou migrations se surgir erro inesperado.
- Logs Supabase são a primeira referência para diagnóstico.

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

> **📌 Índice de Referência Cruzada:** Esta seção lista práticas proibidas com links para as regras detalhadas. Exemplos de código estão nas seções originais.

**Lista consolidada de práticas PROIBIDAS no projeto:**

| Anti-Pattern | Regra Original | Seção | Resumo |
|--------------|----------------|--------|--------|
| Imports `@supabase/*` em UI comum | Camadas (Estrutura Rígida) | 4.2 | UI/rotas nunca importam Supabase diretamente (exceto SULB) |
| Views sem `security_invoker` | Segurança | 4.1 | Toda view com dados de usuário DEVE usar `security_invoker = true` |
| `SECURITY DEFINER` não aprovado | CI/Lint (Classes de Bloqueio) | 4.4 | Requer aprovação explícita em CR + documentação no roadmap |
| Tipos duplicados | Tipos TypeScript | 4.6 | Tipos canônicos APENAS em `src/lib/types/status.ts` |
| Cookie manipulado no client | Segurança + Persistência SSR | 4.1, 5.1.2 | Cookie `last_account_subdomain` APENAS no SSR (layout.tsx) |
| Bypass do Fluxo de Dados | Camadas (Estrutura Rígida) | 4.2 | Fluxo obrigatório: UI → Providers → Adapters → DB |
| IDs/emails hardcoded | Auth Helpers | 3.3 | Usar helpers `is_super_admin()`, `is_platform_admin()` do DB |
| Schema mutation sem migration | Convenções | 4.7 | Toda mudança de schema via migration file |
| Secrets em client | Secrets & Variáveis | 4.5 | `SUPABASE_SECRET_KEY` APENAS server-side |
| Modificar SULB sem validação | Biblioteca Supabase (SULB) | 6.3 | Apenas 6 arquivos foram adaptados, resto é original upstream |

**Functions SECURITY DEFINER aprovadas:**
- `create_account_with_owner()` - E7 onboarding
- `has_account_min_role()` - RLS helper

### 4.11 Sistema de Grants (Controle de Features)

**Regra obrigatória:** Nunca hardcode verificação de planos ou limites. Use o sistema de grants.

**Padrão correto:**
```typescript
// ❌ ERRADO - lógica hardcoded
if (account.plan_id === 'pro') {
  // permite feature
}

// ✅ CORRETO - usa sistema de grants
const allowed = await getFeature(accountId, 'advanced_analytics')
if (allowed) {
  // permite feature
}
```

**Arquitetura (E9.1 - 🧩 Em evolução):**
- Tabela: `model_grants` (controle por conta)
- Function: `get_feature(account_id, feature_key, lp_id?, section_id?)`
- Fallback: section → lp → account → plan → default
- Snapshot: Cada conta preserva recursos independente de mudanças no plano

**Schema técnico:** Ver seção 3.1  
**Implementação:** Ver Roadmap E9.1

**Critério de uso:**
- Sempre que verificar disponibilidade de feature
- Sempre que checar limites (max_lps, max_conversions)
- Nunca comparar `plan_id` diretamente no código

### 4.12 Compatibilidade PostgREST 13

**Estado atual:**  
- Projeto opera com **PostgREST 12.2.12**, pronto para migração ao **v13**.  
- **SDK:** `@supabase/supabase-js ≥ 2.56.0` validado e compatível.  
- **Mutações 1-a-1:** `.maxAffected(1)` aplicado nos adapters (`renameAndActivate`, `revoke`).  
- **Índice GIN:** `accounts_name_gin_idx` ativo para suporte ao `textSearch()`.  
- **Search Path:** restrito a `public`.  
- **JWT:** ainda no modo HMAC (Legacy); migração planejada para **JWT Signing Keys**.  

**Pronto para upgrade:**  
A atualização para o PostgREST 13 poderá ser executada assim que disponível no painel do Supabase, **sem necessidade de ajustes adicionais** no código ou schema.

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

---

## 5. Arquitetura de Acesso

### 5.1 Conceitos Fundamentais

#### 5.1.1 Access Context v2

> **📘 Estrutura técnica completa (colunas, SQL, grants):** Ver seção 3.2

**Fonte única de decisão de acesso entre usuário e conta.**  
Autoriza SSR e sincroniza a UI via AccessProvider.

**View:** `v_access_context_v2`

**Integrações principais:**
- SSR gate: `/a/[account]/layout.tsx` (define cookie `last_account_subdomain`)
- Adapter: `accessContextAdapter.readAccessContext()`
- Provider: `AccessProvider` (expõe `account.name` à UI)
- Middleware: lê cookie e redireciona `/a` → `/a/{subdomain}`

#### 5.1.2 Persistência SSR (Cookie)

> **📌 Seção de referência única:** Toda lógica de cookie `last_account_subdomain` está consolidada aqui.

**Função:** Mantém a última conta usada entre sessões.

**Local de definição:** `app/a/[account]/layout.tsx`

**Atributos de segurança:**
```
Set-Cookie: last_account_subdomain=<subdomain>;
Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```
- **HttpOnly:** Inacessível via JavaScript (proteção XSS)
- **Secure:** Apenas HTTPS
- **SameSite=Lax:** Proteção CSRF
- **Max-Age:** 30 dias (2592000 segundos)
- **Leitura:** Exclusiva no servidor (middleware)

**Processo completo (Orquestração SSR):**
1. `getAccessContext()` valida acesso via `v_access_context_v2`
2. Se `allow=true`, define cookie antes de renderizar
3. Middleware lê cookie e redireciona `/a` → `/a/{subdomain}` (quando autenticado)
4. **Logout:** expira o cookie (`Max-Age=0`) para evitar persistência entre sessões diferentes

**Benefício:** Usuário autenticado reabre `/a` e retorna à última conta automaticamente, sem depender de client state.

**Restrição de segurança:** Nenhum dado sensível (subdomain, ids) é acessível via client JavaScript.

---

### 5.2 Implementação (Adapters, Guards, Providers)

#### 5.2.1 Adapters de Acesso

**accountAdapter** (`src/lib/access/adapters/`)
- `createFromToken(tokenId, actorId)` — criação de conta via token (E7 onboarding).  
- `renameAndActivate(accountId, name, slug)` — atualização e ativação da conta.  
  - `.maxAffected(1)` aplicado para limitar atualizações a uma linha (compatível v13, ignorado no v12).  
- Normaliza status e papéis conforme tipos canônicos (`AccountStatus`, `MemberStatus`, `MemberRole`).

**accessContextAdapter** (`src/lib/access/adapters/`)
- Lê `v_access_context_v2` (Access Context v2).  
- Retorna `{ account, member }` com segurança fail-closed (erro → `null`).  
- Campos retornados incluem `account.name` para o header e switcher.  

**adminAdapter** (`src/lib/admin/adapters/`)
- Valida privilégios `super_admin` e `platform_admin`.  
- Gerencia tokens administrativos (`post_sale_tokens`).  

**postSaleTokenAdapter** (`src/lib/admin/adapters/`)
- Métodos: `generate()`, `validate()`, `consume()`, `revoke()`.  
  - `.maxAffected(1)` aplicado em `revoke()` para garantir operação única.  
- Controla limites de geração (`rate limit`) e integra com auditoria.  

**Observação:**  
Todos os adapters seguem o fluxo **UI → Providers → Adapters → DB**.  
Nenhum componente de UI acessa o Supabase diretamente, exceto os autorizados na SULB (ver seção 6.3).


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

**Sistema de troca de contas com persistência via cookie.**

**Componentes:** `AccountSwitcher`, `AccountSwitcherTrigger`, `AccountSwitcherList`  
**Hooks:** `useAccountSwitcher`, `useUserAccounts`  
**View:** `v_user_accounts_list` (seção 3.2)  
**Endpoint:** `/api/user/accounts`  
**Funcionalidades:** Persistência 30d, ocultação automática (≤1 conta), suporte teclado/touch

**Cookie SSR:** Orquestração completa (set, read, expire) → **Ver seção 5.1.2**

**Benefício:** Usuário autenticado reabre `/a` e retorna à última conta automaticamente, sem depender de client state.

**Histórico de implementação:** Ver `docs/roadmap.md` seção E10.1

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

> **📌 Seção de referência única:** Esta é a lista oficial de exceções SULB mencionadas em 4.2 e 4.10. Componentes listados aqui podem importar `@supabase/*` diretamente.

**Origem:** `github.com/supabase/supabase/tree/master/examples/auth/nextjs`

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

---

## 🧾 Changelog

### v1.6 (07/11/2025)
- **Adicionada:** Seção 4.11 — Sistema de Grants (Controle de Features).  
  - Introduz `model_grants`, função `get_feature`, fallback hierárquico e snapshots por conta.  
  - Regra obrigatória: nunca hardcode planos ou limites.

### v1.6 (08/11/2025)
- **Trigger Hub ativado** em `accounts`, `account_users`, `partner_accounts`.  
- **Funções principais:** `hub_router`, `fn_audit_dispatch`, `fn_guard_last_owner`, `fn_owner_transfer_rules`.  
- **Triggers legadas desativadas** e mantidas apenas para rollback.  
- **`audit_logs`** sem trigger (sink de eventos).  
- **Tabelas fora do escopo:** `plans`, `partners`, `post_sale_tokens` (mantida ativa).  
- **Status:** ✅ **Implementado / Estável (v1.6)**

---

### v1.7 (11/11/2025)
- **Compatibilidade verificada com PostgREST 13 (QA concluído).**  
  - `@supabase/supabase-js` atualizado para ≥ 2.56.0.  
  - `.maxAffected(1)` aplicado em mutações 1-a-1 (`renameAndActivate`, `revoke`).  
  - Search Path validado: apenas `public`.  
- **Adicionado índice GIN** `accounts_name_gin_idx` para suporte a `textSearch()` (v13-ready).  
- **JWT:** ainda em modo HMAC (Legacy); migração para JWT Signing Keys pendente.  
- **Rollback validado** — reversão segura de SDK e migrations.  
- **Status:** 🟩 **Estável / Pronto para upgrade PostgREST 13**



