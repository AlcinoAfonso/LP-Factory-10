23/12/2025 LP Factory 10 — Base Técnica v1.9.2 (Markdown Lite Zero)

Propósito: documentação técnica prescritiva do estado atual do sistema (foco em Next.js + Supabase + Acesso + SQL).
Regra de formatação: sem sumário/âncoras; sem tabelas; sem code fences; sem crases.

---

## 0. Regra de Edição (fixa)

* Sem crases; sem blocos de código; sem tabelas.
* Preservar exatamente títulos e numeração.
* Não reformatar: não converter parágrafos em lista; não mexer em linhas que não forem necessárias.
* Alterar somente o conteúdo solicitado e entregar sempre o documento completo atualizado (não patch).

---

## 1. Identificação do Projeto

Nome: LP Factory 10
Repositório: [https://github.com/AlcinoAfonso/LP-Factory-10](https://github.com/AlcinoAfonso/LP-Factory-10)
Controle de versão: GitHub Web (edição e commit pelo navegador; não assumir repo local, terminal, git cli ou paths locais)
Deploy: Vercel (preview + produção)
Backend: Supabase — projeto lp-factory-10


### 1.1 Variáveis Obrigatórias (server-only)

* SUPABASE_SECRET_KEY
* ACCESS_CONTEXT_ENFORCED=true
* ACCESS_CTX_USE_V2=true

### 1.2 Variáveis Públicas

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

### 1.3 Convenções

* TypeScript: camelCase
* SQL/Postgres: snake_case
* Pipeline: GitHub Web → Vercel
* Regra: não usar SUPABASE_SERVICE_ROLE_KEY (usar apenas SUPABASE_SECRET_KEY)

---

## 2. Stack & Dependências

### 2.1 Framework

* Next.js 15.5.7 (App Router, SSR, Server Components) — upgrade devido ao CVE-2025-55182
* React 19.2.x + React DOM 19.2.x (runtime oficial do Next.js 15)
* TypeScript (strict)
* Tailwind CSS

### 2.2 Backend
* Supabase (PostgreSQL 17.6.1.063, Auth, Storage, RLS)
* Regra: versões devem refletir Settings > Infrastructure (Supabase)
* PostgREST (Supabase Data API) ≥ 13 (ver painel; ex.: 14.1)
* @supabase/supabase-js ≥ 2.56.0
* .maxAffected(1) em mutações 1-a-1
* JWT Signing Keys ativo: Current ECC (P-256); Previous Legacy HS256 (não revogar por padrão); integrações futuras (se houver) devem validar JWT via JWKS + kid

### 2.3 UI

* SULB (auth forms)
  * Definição: conjunto de rotas/arquivos de autenticação copiados do Supabase (vendor interno).
  * Regra: não criar auth fora do SULB; alterações no SULB só quando necessário e sempre respeitando a allowlist 6.4.
* shadcn/ui (base provisória)

### 2.4 Deploy

* Vercel (CI automático)
* Variáveis validadas:

  * SUPABASE_SECRET_KEY
  * NEXT_PUBLIC_SUPABASE_URL
  * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

### 2.5 Regras de Import (canônica)

* @supabase/* somente em:
  * src/lib/**/adapters/** (adapters)
  * lib/supabase/* (núcleo SSR/Auth + service)
* Exceção: rotas SULB autorizadas em app/auth/* (lista na seção 6.4)
* UI e componentes client nunca acessam Supabase diretamente
* Paths canônicos confirmados no repo: src/lib/**/adapters/** e lib/supabase/*

---

## 3. Regras Técnicas Globais

### 3.1 Segurança

* Views que expõem dados de usuário devem usar security_invoker = true.
* RLS obrigatório em todas as tabelas sensíveis.
* Cookie last_account_subdomain só pode ser definido/lido no SSR (HttpOnly, Secure, SameSite=Lax).
* Nenhum dado sensível pode ser acessível no client.

### 3.2 Estrutura de Camadas

Fluxo obrigatório:

* UI → Providers → Adapters → DB

Regras:

* UI/rotas não importam @supabase/*.
* Imports Supabase seguem a regra canônica (2.5).
* Fora de adapters, só é permitido em lib/supabase/* e nas rotas SULB allowlist (6.4).

### 3.3 Estrutura de Arquivos

* Cada domínio segue:

  * adapters/ (DB) → contracts.ts (interface pública) → index.ts (re-exports)
* Nenhum módulo acessa DB fora de adapters.
* Tipos canônicos só em src/lib/types/status.ts.

### 3.4 CI/Lint (Bloqueios)

PR deve falhar se:

* existir SECURITY DEFINER não aprovado
* existir view sem security_invoker=true
* existir import de @supabase/* fora da regra canônica (2.5) (adapters + lib/supabase/*), exceto rotas SULB allowlist (6.4)
* existirem tipos duplicados fora de status.ts

### 3.5 Secrets & Variáveis

* Server-only: SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY (futuro)
* Públicas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
* Flags obrigatórias:

  * ACCESS_CONTEXT_ENFORCED=true
  * ACCESS_CTX_USE_V2=true

### 3.6 Tipos TypeScript

* Fonte única: src/lib/types/status.ts
* Proibido redefinir tipos em qualquer outro módulo
* Adapters normalizam valores lidos do DB

### 3.7 Convenções

* TS: camelCase
* SQL: snake_case
* -1 = ilimitado para limites numéricos
* Auditoria via jsonb_diff_val()

### 3.8 Anti-Regressão

* Migrations sempre idempotentes
* .maxAffected(1) obrigatório em mutações 1-a-1
* Alteração de schema exige revisão de views/functions dependentes
* Sem secrets expostos no client

### 3.9 Rate Limit (E7)

* super_admin: 200 tokens/dia
* platform_admin: 20 tokens/dia
* 3 tokens/email/dia
* 5 burst/5min
* Índices obrigatórios:

  * (created_by, created_at DESC)
  * (email, created_at DESC)

### 3.10 Anti-Patterns

* Importar Supabase na UI (exceto SULB allowlist)
* Views sem security_invoker=true
* Hardcode de lógica de planos/limites
* Modificar SULB fora dos arquivos autorizados
* Manipular last_account_subdomain no client

### 3.11 Sistema de Grants (E9)

* Nunca usar plan_id para liberar features
* Usar sempre get_feature(account_id, feature_key)
* Hierarquia: section → lp → account → plan → default
* Cada conta preserva seu snapshot de recursos

### 3.12 Compatibilidade PostgREST 13
* Ambiente atual: PostgREST ≥ 13 (ver painel; ex.: 14.1)
* Índice GIN accounts_name_gin_idx obrigatório
* search_path fixado em public
* Recurso: Spread (...) em relações to-many (disponível). Estado: não utilizado no código atualmente. Regra: em pai + filhos na mesma resposta, usar alias para evitar colisão de chaves
* Recurso: busca FTS (fts, plfts, phfts, wfts) em text/json (disponível). Estado: sem escopo de telas. Regra: ao ativar busca em UI, preferir wfts como padrão e adicionar índices GIN conforme necessidade de performance
* UX/Erro: HTTP 416 / PGRST103 em paginação. Interpretação: range/offset inválido. Comportamento obrigatório: tratar como fim da lista (não é erro de sistema), manter itens já carregados e parar novas requisições


### 3.13 Compatibilidade Next.js 15 / React 19

* cookies() e headers() são async em SSR/Server Components (usar await)
* Rotas que dependem de sessão/cookies devem ser dinâmicas (evitar cache entre usuários)
* Runtime oficial do App Router: React 19.x (React DOM 19.x)
* Em novos códigos de forms/Server Actions: preferir useActionState (não usar useFormState)

---

## 4. Schema

### 4.1 Tabelas Ativas

#### 4.1.1 accounts

* PK: id uuid
* UNIQUE: subdomain, domain, slug
* Status: active | inactive | suspended | pending_setup | trial
* FK: plan_id → plans, owner_user_id → auth.users
* RLS: obrigatório
* Índice GIN (v13-ready): accounts_name_gin_idx em to_tsvector('portuguese', name)

#### 4.1.2 account_users

* PK: id uuid
* UNIQUE: (account_id, user_id)
* Role: owner | admin | editor | viewer
* Status: pending | active | inactive | revoked
* FK: account_id → accounts, user_id → auth.users, invited_by → auth.users
* RLS: obrigatório
* Governança: integra Trigger Hub (protege último owner)

#### 4.1.3 audit_logs

* PK: id uuid
* Campos principais: user_id, table_name, record_id, changes_json, account_id, created_at
* Função: sink de auditoria (sem trigger próprio)
* Observação: user_id pode ser NULL para eventos automáticos

#### 4.1.4 plans

* PK: id uuid
* UNIQUE: name
* Campos críticos: name, max_lps, max_conversions
* Uso: base para limites via get_account_effective_limits
* Triggers: nenhum (tabela estática / read-only)

#### 4.1.5 partners

* PK: id uuid
* Campos principais: name, type (agency | reseller | affiliate), status (active | inactive | suspended)
* Uso: cadastro de parceiros/white-label
* Triggers: fora do Trigger Hub

#### 4.1.6 partner_accounts

* PK composto: (partner_id, account_id)
* FK: partner_id → partners, account_id → accounts
* RLS: obrigatório
* Governança: integra Trigger Hub (auditoria e regras de vínculo)

#### 4.1.7 post_sale_tokens

* PK: id uuid
* Campos principais: email, contract_ref, expires_at, used_at, used_by, account_id, meta, created_at, created_by
* Índices: (email, created_at DESC), (created_by, created_at DESC)
* RLS: ativo (políticas admin + histórico do próprio usuário)
* Uso: fluxo E7 (onboarding consultivo)
* Triggers: fora do Trigger Hub

### 4.2 Views Ativas

#### 4.2.1 v_access_context_v2

* Objetivo: fonte única de decisão de acesso user ↔ conta
* Campos-chave: account_id, account_key (subdomain), account_name, account_status, user_id, member_role, member_status, allow, reason
* Regra: allow=true só para conta active/trial/pending_setup + membro ativo
* Segurança: security_invoker = true

#### 4.2.2 v_user_accounts_list

* Objetivo: alimentar AccountSwitcher e /api/user/accounts
* Campos: account_id, account_name, account_subdomain, account_status, member_status, member_role, created_at
* Filtro: user_id = auth.uid() e allow=true (via v_access_context_v2)
* Segurança: security_invoker = true

#### 4.2.3 v_account_effective_limits

* Objetivo: limites efetivos de plano por conta
* Campos principais: account_id, account_name, account_status, subdomain, domain, plan_id, plan_name, price_monthly, plan_features, max_lps, max_conversions, flags _unlimited e _effective
* Base: join accounts + plans + helpers
* Segurança: security_invoker = true

#### 4.2.4 v_account_effective_limits_secure

* Objetivo: expor limites apenas para quem pode ver
* Filtro: is_platform_admin() OU is_member_active(account_id, auth.uid())
* Segurança: security_invoker = true
* Uso: APIs e dashboards que mostram detalhes de plano

#### 4.2.5 v_admin_tokens_with_usage

* Objetivo: painel /admin/tokens (E7)
* Campos principais: token_id, email, expires_at, is_used, is_valid, account_slug, created_at
* Base: join post_sale_tokens + accounts
* Segurança: security_invoker = true

#### 4.2.6 v_audit_logs_norm

* Objetivo: leitura simplificada de audit_logs
* Campos principais: id, entity, entity_id, action, diff, account_id, actor_user_id, ip_address, created_at
* Base: normalização table_name → entity e changes_json → diff
* Segurança: security_invoker = true

### 4.3 Functions Ativas

#### 4.3.1 Onboarding (E7)

* create_account_with_owner(token_id uuid, actor_id uuid) → uuid

  * SECURITY DEFINER aprovado
  * Cria conta via post_sale_tokens, define pending_setup, vincula owner, consome token
* _gen_provisional_slug() → text (gera slug temporário acc-{uuid8})

#### 4.3.2 Limites de Plano

* get_account_effective_limits(account_id uuid) → SETOF record
* plan_limit_is_unlimited(value int) → boolean
* plan_limit_value(value int) → bigint

#### 4.3.3 Auth / RLS Helpers

* is_super_admin() → boolean
* is_service_role() → boolean
* is_platform_admin() → boolean (usa claim platform_admin=true)
* is_admin_active() → boolean
* is_member_active(p_account_id uuid, p_user_id uuid) → boolean
* has_account_min_role(account_id uuid, min_role text) → boolean (SECURITY DEFINER aprovado; usado em RLS)
* role_rank(role text) → int (owner=4, admin=3, editor=2, viewer=1)

#### 4.3.4 Convites de Conta

* accept_account_invite(account_id uuid, ttl_days int) → boolean
* revoke_account_invite(account_id uuid, user_id uuid) → boolean
* invitation_expires_at(account_user_id uuid, ttl_days int) → timestamptz
* invitation_is_expired(account_user_id uuid, ttl_days int) → boolean

#### 4.3.5 Trigger Hub & Auditoria

* hub_router()
* fn_audit_dispatch(table text, kind text, payload jsonb)
* fn_guard_last_owner(kind text, new account_users, old account_users)
* fn_owner_transfer_rules(kind text, new accounts, old accounts)
* fn_event_bus_publish(table text, kind text, payload jsonb)
* jsonb_diff_val(old jsonb, new jsonb) → jsonb

### 4.4 Triggers Ativos

#### 4.4.1 Trigger Hub (tabelas com governança)

* accounts → tg_accounts_hub → hub_router()
* account_users → tg_account_users_hub → hub_router()
* partner_accounts → tg_partner_accounts_hub → hub_router()

#### 4.4.2 Tabelas fora do Trigger Hub

* plans (estática; sem trigger)
* partners (cadastro simples; sem trigger Hub)
* post_sale_tokens (sem trigger; auditável via adapters e views)

#### 4.4.3 Triggers Legadas (desativadas)

* Mantidas apenas para rollback
* Regra: nova lógica usa apenas o Trigger Hub

### 4.5 Tipos TypeScript Canônicos

Fonte única:

* Arquivo: src/lib/types/status.ts
* Consumidores: src/lib/access/types.ts + adapters

Tipos:

* AccountStatus = active | inactive | suspended | pending_setup | trial
* MemberStatus = pending | active | inactive | revoked
* MemberRole = owner | admin | editor | viewer

Regras:

* Proibido redefinir esses tipos em qualquer outro arquivo
* Adapters normalizam valores do DB para esses tipos antes de expor à UI

---

## 5. Arquitetura de Acesso

### 5.1 Conceitos Fundamentais

#### 5.1.1 Access Context v2

* Fonte única: v_access_context_v2
* Decide se o usuário pode acessar uma conta (allow + reason)
* Usado em SSR (getAccessContext), AccessProvider e AccountSwitcher

#### 5.1.2 Persistência SSR (cookie last_account_subdomain)

* Definido em /a/[account]/layout.tsx após allow=true
* Atributos obrigatórios: HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
* Lido apenas no servidor (middleware) para redirecionar /a → /a/{subdomain}
* No logout, o cookie deve expirar (Max-Age=0)

### 5.2 Adapters, Guards, Providers

Adapters:

* src/lib/access/adapters/accountAdapter.ts

  * createFromToken(tokenId, actorId) → RPC create_account_with_owner
  * renameAndActivate(accountId, name, slug) com .maxAffected(1)
  * normaliza AccountStatus, MemberStatus, MemberRole
* src/lib/access/adapters/accessContextAdapter.ts

  * lê v_access_context_v2
  * retorna { account, member } para SSR e AccessProvider
* src/lib/admin/adapters/adminAdapter.ts

  * valida super_admin / platform_admin
  * opera post_sale_tokens via postSaleTokenAdapter
* src/lib/admin/adapters/postSaleTokenAdapter.ts

  * generate, validate, consume, revoke com .maxAffected(1)
  * aplica rate limit (ver 3.9)

Guards SSR:

* src/lib/access/guards.ts

  * requireSuperAdmin()
  * requirePlatformAdmin()
* Uso: rotas /admin/** (layout e páginas)

Providers:

* src/providers/AccessProvider.tsx

  * recebe contexto SSR de getAccessContext()
  * expõe { account, member } para UI
  * mantém consistência entre header, switcher e permissões

### 5.3 Fluxos Principais

#### 5.3.1 Login & Reset de Senha (SULB)

Rotas principais:

* app/auth/login/page.tsx
* app/auth/forgot-password/page.tsx
* app/auth/update-password/page.tsx
* app/auth/confirm/route.ts

Regras:

* auth só via SULB (não criar formulários auth fora desse núcleo)
* redirect final sempre passa pelo Access Context (/a/[account] ou /auth/confirm/info)

#### 5.3.2 E7 — Onboarding Consultivo

Rotas principais:

* app/onboard/page.tsx
* app/onboard/actions.ts

Fluxo:

1. Token gerado em /admin/tokens (post_sale_tokens)
2. Cliente acessa /onboard?token=…
3. Define senha + cria usuário
4. RPC create_account_with_owner() cria conta pending_setup e vincula owner
5. Redirect para /a/[account] + cookie last_account_subdomain no SSR

#### 5.3.3 Multi-conta (AccountSwitcher)

* UI: components/features/account-switcher/*
* API: app/api/user/accounts/route.ts (usa v_user_accounts_list)

Fluxo:

1. UI chama /api/user/accounts
2. Lista contas permitidas
3. Ao trocar, navega para /a/[account]
4. SSR grava cookie last_account_subdomain para persistir última conta

#### 5.3.4 Observabilidade de Acesso
Eventos:
* account_switcher_open
* account_selected
* create_account_click
* preferred_account_cookie_set (planejado)
Regra:
* formato: { event, scope, latency_ms, timestamp, error? }
* sem logs com dados sensíveis
* Headers HTTP (diagnóstico opcional): server-timing e proxy-status não observados nos requests testados via DevTools (páginas públicas, login e rotas autenticadas); se houver necessidade de diagnóstico de latência, considerar instrumentação para expor server-timing e/ou coletar sinais equivalentes via logs/APM; proxy-status depende do provedor/proxy


### 5.4 Comportamento da rota /a (anti-regressão)

* /a é pública quando não há sessão válida
* em navegação limpa (sem sessão), /a não redireciona automaticamente para /auth/login
* dashboard privado só em /a/{account_slug}
* /a → /a/{account_slug} só quando:

  * existe sessão válida, e
  * conta foi resolvida (cookie last_account_subdomain ou fallback)
* allow/deny é responsabilidade do gate SSR em /a/{account_slug}

---

## 6. Estrutura de Arquivos Essencial

### 6.1 Visão rápida (sem árvore)

* src/lib/**/adapters/** → único ponto que toca DB
* src/providers/ → providers globais (ex.: AccessProvider)
* components/ → componentes UI (ex.: features/account-switcher/*, layout, ui)
* lib/supabase/ → núcleo SSR/Auth + service (server, client, middleware, service)
* app/ → rotas App Router (a, admin, onboard, auth, api)
* middleware.ts → regras de sessão/redirect (inclui /a)

### 6.2 Arquivos Críticos (pontos que quebram fluxo)

Acesso (SSR + RLS):

* src/lib/access/getAccessContext.ts
* src/lib/access/adapters/accessContextAdapter.ts
* src/providers/AccessProvider.tsx
* app/a/[account]/layout.tsx
* middleware.ts

Onboarding (E7):

* app/onboard/page.tsx
* app/onboard/actions.ts
* src/lib/access/adapters/accountAdapter.ts
* src/lib/admin/adapters/postSaleTokenAdapter.ts

Multi-conta:

* components/features/account-switcher/*
* app/api/user/accounts/route.ts

Supabase (núcleo):

* lib/supabase/server.ts
* lib/supabase/client.ts
* lib/supabase/middleware.ts
* lib/supabase/service.ts

SULB:

* app/auth/confirm/route.ts
* app/auth/update-password/page.tsx

Admin:

* app/admin/layout.tsx
* app/admin/tokens/page.tsx
* src/lib/admin/adapters/adminAdapter.ts

### 6.3 Tipos e Contratos Críticos

* src/lib/types/status.ts (fonte única)
* src/lib/access/types.ts (reexport)
* src/lib/admin/contracts.ts (tipos do E7)

### 6.4 Arquivos SULB Autorizados a Importar Supabase

Exceção oficial: somente os arquivos listados abaixo podem importar @supabase/* fora de src/lib/**/adapters/** e lib/supabase/*.
Regra: qualquer novo arquivo em app/auth/* não pode importar @supabase/* até ser incluído nesta allowlist.

* lib/supabase/client.ts
* lib/supabase/middleware.ts
* lib/supabase/server.ts
* lib/supabase/service.ts
* app/auth/confirm/route.ts
* app/auth/update-password/page.tsx
* app/auth/protected/page.tsx

### 6.5 Regras Rápidas

* DB só via adapters
* Acesso só via Access Context v2
* Decisão de conta via cookie SSR
* Auth só via SULB
* Supabase imports: regra canônica (2.5) (allowlist detalhada em 6.4)

---

## 7. Checklist mínima (anti-regressão)

* Views expostas a usuário: security_invoker = true (ver 3.1 e 4.2)
* RLS ativo nas tabelas sensíveis (ver 3.1 e 4.1)
* last_account_subdomain somente SSR (ver 5.1.2 e 5.4)
* @supabase/* só em adapters + lib/supabase/* + allowlist SULB (ver 2.5 e 6.4)
* Mutações 1-a-1: .maxAffected(1) (ver 3.8)
* Migrations idempotentes (ver 3.8)
* Funções críticas: search_path = public (ver 3.12)
* SECURITY DEFINER somente quando aprovado (ver 3.4 e 4.3)
* Tipos canônicos: fonte única em status.ts (ver 3.6 e 4.5)
* /a: público sem sessão; privado só em /a/{account} com gate SSR (ver 5.4)

---

## 8. Changelog

### v1.9.0 (18/12/2025) — Simplificação de formatação + consistência lib/

* Removido sumário/âncoras para reduzir erros de Markdown.
* Consolidada regra canônica de imports Supabase (seção 2.5).
* Padronizado lib/supabase/* como núcleo SSR/Auth + service (inclui lib/supabase/service.ts).
* Simplificada seção 6 (sem árvore/code fence), mantendo todos os dados.

### v1.8.0 (17/12/2025) — Upgrade Next.js 15 / React 19

* Upgrade para Next.js 15.5.7 (App Router, SSR, Server Components).
* Runtime: React 19.2.x / React DOM 19.2.x.
* Regras de compatibilidade Next 15:

  * cookies() e headers() como APIs async em SSR.
  * rotas com sessão/cookies como dinâmicas.
* Anti-regressão:

  * /a pública sem sessão; privado só em /a/{account_slug} via gate SSR.

### v1.7.2 (15/11/2025) — Otimização para JSON Schema

* Reorganização completa e padronização em blocos prescritivos.
* Seção 6 reduzida ao mínimo; inventário completo fora do documento.

### v1.7.1 (12/11/2025)

* Supabase: PostgreSQL 17.6.
* search_path = public em funções críticas.
* Compatível com @supabase/supabase-js ≥ 2.56.0.
* Migração para JWT Signing Keys pendente (não afeta operação atual).
* Fluxos E5/E7/E10 retestados.

### v1.7 (11/11/2025)

* Compatibilidade confirmada com PostgREST 13.
* .maxAffected(1) em mutações críticas.
* Índice GIN accounts_name_gin_idx.
* Rollback validado (schema + SDK).

### v1.6 (07–08/11/2025)

* Trigger Hub em accounts, account_users, partner_accounts.
* Seção de Grants (model_grants, get_feature).
* Auditoria via jsonb_diff_val().

### v1.5 (histórico consolidado)

* Estrutura inicial.
* Camadas (UI → Providers → Adapters → DB).
* Access Context v2.
* Governança RLS (owner/admin/editor/viewer).
* SULB como núcleo de autenticação.

Regra: versões anteriores ao v1.5 são irrelevantes para o estado atual do projeto.
