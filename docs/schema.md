0. Introdução

0.1 Cabeçalho
• Data da última atualização: 13/02/2026
• Documento: LP Factory 10 — Schema (DB Contract) v1.0.7

0.2 Contrato do documento (parseável)
• Esta seção define o que é relevante atualizar e como escrever.
0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo
0.2.2 ALLOWLIST_RELEVANCIA
• OBJETIVO_DOC: ser o contrato do DB (estado atual esperado) e a referência única para detalhes de banco.
• CONTRATO_DB: somente o que existe/é esperado no banco (tabelas, colunas, enums, relacionamentos, views, RPCs/functions, triggers, RLS/policies).
• GATE (anti-antecipação): é proibido registrar objeto/alteração que esteja apenas “decidido/planejado” sem evidência de estado final executado/observável (conforme RELATÓRIO do executor).
• ANTI_DRIFT: Base Técnica e Roadmap não repetem listas/detalhes de DB; devem apenas referenciar este arquivo quando precisarem citar DB.
• MANUTENCAO: quando faltar detalhe confirmado no Supabase, marcar como TBD e registrar o caminho de validação (Supabase > Database > Tables/Views/Functions/Policies). TBD não pode ser usado para “criar” objeto futuro; apenas para detalhe faltante de algo já existente.
0.2.3 ALLOWLIST_CHANGELOG (blocklist mínima)
• PROIBIDO: bullets administrativos (ex.: “atualizado cabeçalho/data/versão”).
0.2.4 ESTILO (opcional)
• Estado final (o que existe/é esperado), sem narrativa.
• Frases curtas e normativas; preferir bullets; manter numeração estável; incluir paths e nomes exatos quando confirmados.


1. Tabelas

1.1 accounts
1.1.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: subdomain, domain, slug
• Status: active | inactive | suspended | pending_setup
• Coluna status: text; CHECK accounts_status_chk; NOT NULL; DEFAULT 'pending_setup'::text
• Coluna setup_completed_at: timestamptz; NULL (marcador técnico de setup concluído; write-once no MVP: set NULL → timestamp; sem overwrite; deprecated sem uso no gating/fluxo)
• FK: plan_id → plans; owner_user_id → auth.users

1.1.2 Índices
• accounts_name_gin_idx (GIN to_tsvector portuguese, name)
1.1.3 Segurança
• Trigger Hub: sim (ver seção 4)
• RLS: obrigatório
1.1.4 Policies (TBD: preencher nomes reais no Supabase)
• Select: membro ativo ou platform_admin
• Update: owner/admin (restrito)
• Insert: somente via RPC (quando aplicável)

1.2 account_users
1.2.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (account_id, user_id)
• Role: owner | admin | editor | viewer
• Status: pending | active | inactive | revoked
• FK: account_id → accounts; user_id → auth.users; invited_by → auth.users
1.2.2 Segurança
• Trigger Hub: sim (protege último owner)
• RLS: obrigatório
1.2.3 Policies (TBD: preencher nomes reais no Supabase)
• Select: usuário vê seus vínculos
• Insert/Update: regras via convites e governança (hub + RPC)

1.3 audit_logs
1.3.1 Chaves e campos-chave
• PK: id uuid
• Campos-chave: user_id, table_name, record_id, changes_json, account_id, created_at
1.3.2 Segurança
• Trigger: sem trigger próprio (sink)
• RLS: recomendado/obrigatório conforme exposição
1.3.3 Policies (TBD: preencher nomes reais no Supabase)
• Select: admins/roles autorizados ou via view v_audit_logs_norm

1.4 plans
1.4.1 Chaves e campos críticos
• PK: id uuid
• UNIQUE: name
• Campos críticos: name, max_lps, max_conversions
1.4.2 Segurança
• Trigger Hub: não
• RLS: conforme uso (geralmente read-only)
1.4.3 Policies (TBD: preencher nomes reais no Supabase)
• Select: público autenticado (se aplicável) ou somente admins

1.5 partners
• PK: id uuid
• Campos: name, type (agency | reseller | affiliate), status (active | inactive | suspended)
• Trigger Hub: não
• RLS: conforme uso
• Policies (TBD)

1.6 partner_accounts
1.6.1 Chaves e relacionamentos
• PK composto: (partner_id, account_id)
• FK: partner_id → partners; account_id → accounts
1.6.2 Segurança
• Trigger Hub: sim
• RLS: obrigatório
1.6.3 Policies (TBD: preencher nomes reais no Supabase)
• Select: platform_admin/partner autorizado
• Insert/Update/Delete: governado via hub/regras administrativas

1.7 post_sale_tokens
1.7.1 Chaves e campos
• PK: id uuid
• Campos: email, contract_ref, expires_at, used_at, used_by, account_id, meta, created_at, created_by
1.7.2 Índices
• (email, created_at DESC)
• (created_by, created_at DESC)
1.7.3 Segurança
• Trigger Hub: não
• RLS: ativo
1.7.4 Policies (TBD: preencher nomes reais no Supabase)
• Admin: gerir tokens (platform_admin/super_admin)
• Próprio usuário: histórico (created_by = auth.uid()) quando aplicável

1.8 account_profiles
1.8.1 Chaves, constraints e relacionamentos
• PK: account_id uuid (constraint account_profiles_pkey)
• FK: account_id → accounts(id) ON DELETE CASCADE (constraint account_profiles_account_id_fkey)
• CHECK: account_profiles_preferred_channel_chk (preferred_channel IN ('email', 'whatsapp'))
1.8.2 Campos
• niche text null
• preferred_channel text not null default 'email'
• whatsapp text null
• site_url text null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()
1.8.3 Segurança
• Trigger Hub: não (sem triggers)
• RLS: ativo (enable row level security)
1.8.4 Policies
• account_profiles_select_member_or_platform (SELECT to public): is_platform_admin() OU membro ativo do tenant (account_users.account_id = account_profiles.account_id; account_users.user_id = auth.uid(); account_users.status='active')
• account_profiles_insert_owner_admin_or_platform (INSERT to public): is_platform_admin() OU owner/admin ativo do tenant (account_users.role IN ('owner','admin'); status='active')
• account_profiles_update_owner_admin_or_platform (UPDATE to public): is_platform_admin() OU owner/admin ativo do tenant (USING + WITH CHECK)

2. Views

2.1 v_access_context_v2
2.1.1 Objetivo
• Fonte única de decisão user ↔ conta
2.1.2 Colunas garantidas
• account_id, account_key, account_name, account_status
• user_id, member_role, member_status
• allow, reason
• account_setup_completed_at (alias de accounts.setup_completed_at; deprecated sem uso no gating/fluxo)

2.1.3 Assunções e filtros
• allow=true só para conta active/pending_setup + membro ativo
• allow é boolean estrito (COALESCE(..., false)) — nunca NULL
2.1.4 Segurança
• security_invoker = true
2.1.5 Consumidores
• SSR + adapter (ver docs/repo-inv.md)

2.2 v_user_accounts_list
2.2.1 Objetivo
• AccountSwitcher e /api/user/accounts
2.2.2 Colunas garantidas
• account_id, account_name, account_subdomain, account_status, member_status, member_role, created_at
2.2.3 Assunções e filtros
• user_id = auth.uid()
• allow=true (via v_access_context_v2)
2.2.4 Segurança
• security_invoker = true
2.2.5 Consumidores
• API + UI (ver docs/repo-inv.md)

2.3 v_account_effective_limits
2.3.1 Objetivo
• Limites efetivos por conta
2.3.2 Colunas garantidas (principais)
• account_id, account_name, account_status, subdomain, domain
• plan_id, plan_name, price_monthly, plan_features
• max_lps, max_conversions, flags _unlimited e _effective
2.3.3 Segurança
• security_invoker = true
2.3.4 Consumidores
• Dashboards/APIs de plano e limites

2.4 v_account_effective_limits_secure
2.4.1 Objetivo
• Expor limites apenas para quem pode ver
2.4.2 Assunções e filtros
• is_platform_admin() OU is_member_active(account_id, auth.uid())
2.4.3 Segurança
• security_invoker = true
2.4.4 Consumidores
• APIs e dashboards com detalhes de plano

2.5 v_admin_tokens_with_usage
• Objetivo: /admin/tokens (E7)
• Colunas garantidas: token_id, email, expires_at, is_used, is_valid, account_slug, created_at
• Segurança: security_invoker = true
• Consumidores: Admin (tokens)

2.6 v_audit_logs_norm
• Objetivo: leitura simplificada de audit_logs
• Colunas garantidas: id, entity, entity_id, action, diff, account_id, actor_user_id, ip_address, created_at
• Segurança: security_invoker = true
• Consumidores: Admin/Auditoria

3. Functions / RPC

3.1 Onboarding (E7)
3.1.1 create_account_with_owner(token_id uuid, actor_id uuid) → uuid
• Segurança: SECURITY DEFINER (aprovado)
• search_path: public (obrigatório)
• Efeito: cria conta pending_setup, vincula owner, consome token
• Consumidores: onboarding UI + adapter (ver docs/repo-inv.md)
3.1.2 _gen_provisional_slug() → text
• Segurança: invoker (TBD confirmar)
• search_path: public (obrigatório)
• Efeito: slug temporário acc-{uuid8}

3.2 Limites de Plano
3.2.1 get_account_effective_limits(account_id uuid) → SETOF record
• Segurança: invoker (TBD confirmar)
• search_path: public (obrigatório)
• Efeito/shape: TBD (shape)
• Consumidores: dashboards/APIs de limites
3.2.2 plan_limit_is_unlimited(value int) → boolean
• TBD
3.2.3 plan_limit_value(value int) → bigint
• TBD

3.3 Auth / RLS Helpers
3.3.1 Funções
• is_super_admin() → boolean
• is_service_role() → boolean
• is_platform_admin() → boolean (TBD confirmar claim/origem)
• is_admin_active() → boolean
• is_member_active(p_account_id uuid, p_user_id uuid) → boolean
• has_account_min_role(account_id uuid, min_role text) → boolean
• role_rank(role text) → int (owner=4, admin=3, editor=2, viewer=1)
• ensure_first_account_for_current_user() → table(account_id uuid, account_key text)
3.3.2 has_account_min_role(account_id uuid, min_role text) — segurança
• Segurança: SECURITY DEFINER (aprovado; usado em RLS)
• search_path: public (obrigatório)
3.3.3 SECURITY DEFINER allowlist
• create_account_with_owner (motivo: onboarding; limites: TBD)
• has_account_min_role (motivo: helper RLS; limites: somente leitura; sem writes)
• ensure_first_account_for_current_user (motivo: F2 auto 1ª conta; limites: idempotente; cria 1ª conta + owner/active)

3.4 Convites de Conta
• accept_account_invite(account_id uuid, ttl_days int) → boolean
• revoke_account_invite(account_id uuid, user_id uuid) → boolean
• invitation_expires_at(account_user_id uuid, ttl_days int) → timestamptz
• invitation_is_expired(account_user_id uuid, ttl_days int) → boolean

3.5 Trigger Hub & Auditoria
• hub_router()
• fn_audit_dispatch(table text, kind text, payload jsonb)
• fn_guard_last_owner(kind text, new account_users, old account_users)
• fn_owner_transfer_rules(kind text, new accounts, old accounts)
• fn_event_bus_publish(table text, kind text, payload jsonb)
• jsonb_diff_val(old jsonb, new jsonb) → jsonb

4. Triggers 

4.1 Trigger Hub (governança)
4.1.1 tg_accounts_hub
• Tabela: accounts
• Evento: TBD (confirmar no Supabase)
• Função: hub_router()
4.1.2 tg_account_users_hub
• Tabela: account_users
• Evento: TBD (confirmar no Supabase)
• Função: hub_router()
4.1.3 tg_partner_accounts_hub
• Tabela: partner_accounts
• Evento: TBD (confirmar no Supabase)
• Função: hub_router()

4.2 Fora do Hub
• plans: sem trigger
• partners: sem trigger hub
• post_sale_tokens: sem trigger

5. Tipos canônicos
• Fonte única: PATH: src/lib/types/status.ts
• AccountStatus: active | inactive | suspended | pending_setup
• MemberStatus: pending | active | inactive | revoked
• MemberRole: owner | admin | editor | viewer
• Nota: accounts.status não aceita trial (CHECK accounts_status_chk). No estado atual, views não contêm trial e o runtime/tipos (PATH) não incluem trial (drift resolvido).

99. Changelog
v1.0.7 (13/02/2026) — E10.4.6: account_profiles (tabela + RLS/policies) e deprecação do marcador de setup
• Adicionada a tabela public.account_profiles (1:1 com accounts via account_id PK/FK ON DELETE CASCADE) com campos: niche, preferred_channel (default 'email' + CHECK email|whatsapp), whatsapp, site_url, created_at, updated_at.
• account_profiles: RLS ativo e policies reais: account_profiles_select_member_or_platform; account_profiles_insert_owner_admin_or_platform; account_profiles_update_owner_admin_or_platform.
• Accounts/v_access_context_v2: setup_completed_at e account_setup_completed_at marcados como deprecated sem uso no gating/fluxo (mantidos no DB).

v1.0.6 (07/02/2026) — E10.4.3: clarificações do marcador setup_completed_at e do alias account_setup_completed_at
• Accounts: setup_completed_at declarado como write-once no MVP (NULL → timestamp; sem overwrite).
• v_access_context_v2: account_setup_completed_at explicitado como alias de accounts.setup_completed_at
v1.0.5 (04/02/2026) — E9.8.3: drift de runtime/tipos (trial) resolvido
• Atualizada a seção 5 (Tipos canônicos): removido trial de AccountStatus e removida a nota de drift remanescente de runtime/tipos (alinhado ao estado atual do BD e ao PATH).
v1.0.4 (31/01/2026) — Drift trial: escopo do schema (DB) vs runtime
• Clarificado: no estado atual do BD, accounts.status não aceita trial (CHECK) e as definições atuais de views não contêm trial; o drift remanescente é de runtime/tipos.
• Atualizada a seção 5 (Tipos canônicos) para manter o registro do drift restrito ao contrato do BD e ao apontamento do PATH no runtime.
v1.0.3 (30/01/2026) — E10.4.1: marcador de setup concluído + alinhamento v_access_context_v2
• accounts: adicionada coluna setup_completed_at (timestamptz, nullable).
• v_access_context_v2: expõe account_setup_completed_at; remove trial do allowlist; endurece allow para nunca NULL (COALESCE(..., false)).
v1.0.2 (27/01/2026) — F2: RPC ensure_first_account_for_current_user (auto 1ª conta)
• Adicionada a RPC public.ensure_first_account_for_current_user() ao contrato (retorna account_id, account_key).
• Atualizada a allowlist SECURITY DEFINER para incluir ensure_first_account_for_current_user.
v1.0.1 (23/01/2026) — Hardening de accounts.status + registro de drift trial
• accounts: status consolidado como active|inactive|suspended|pending_setup e documentado como NOT NULL + DEFAULT 'pending_setup'::text (CHECK accounts_status_chk).
• v_access_context_v2: trial hardcoded mantido como drift para resolução no caso H (billing/entitlements).
• Tipos canônicos: registrado drift de trial no código vs CHECK do BD (owner: caso H).
