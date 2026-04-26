0. Introdução

0.1 Cabeçalho
• Data da última atualização: 26/04/2026
• Documento: LP Factory 10 — Schema (DB Contract) v1.0.13

0.2 Contrato do documento (consulta)
• Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
• O QUE É: a referência única do projeto para o contrato do DB (objetos e detalhes de banco).
• POR QUE CONSULTAR: para implementar/avaliar mudanças de banco sem drift (tabelas/constraints/views/RPCs/RLS/policies) e responder dúvidas sobre “o que existe no DB”.
• COMO USAR: antes de criar/alterar SQL/migration/RLS/policies, consultar este documento para nomes/estruturas/regras de DB.
• QUANDO CONSULTAR: tabelas, colunas, constraints, enums/tipos, relacionamentos, views, RPCs/functions, triggers, RLS/policies.
• QUANDO NÃO CONSULTAR: regras de app/runtime (usar `docs/base-tecnica.md`) e status/escopo de casos E* (usar `docs/roadmap.md`).
• NOTA: este documento descreve o estado do DB (não plano/decisão futura).

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

1.9 ai_readonly (role)
1.9.1 Segurança (parâmetros)
• LOGIN: sim
• statement_timeout: 5s
1.9.2 Escopo e grants (schema public)
• Schema: public (USAGE)
• Tabelas existentes em public: GRANT SELECT
• Novas tabelas em public: default privileges com GRANT SELECT

1.10 business_taxons

1.10.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: slug
• CHECK: business_taxons_level_chk (level IN ('segment', 'niche', 'ultra_niche'))
• FK: parent_id → business_taxons(id) ON UPDATE CASCADE ON DELETE SET NULL

1.10.2 Campos
• parent_id uuid null
• level text not null
• name text not null
• slug text not null
• is_active boolean not null default true

1.10.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.10.4 Policies
• business_taxons_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• business_taxons_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• business_taxons_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• business_taxons_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.11 business_taxon_aliases

1.11.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (taxon_id, alias_text_normalized)
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT
• Generated column: alias_text_normalized (normalização derivada de alias_text)

1.11.2 Campos
• taxon_id uuid not null
• alias_text text not null
• alias_text_normalized text generated always as stored
• is_active boolean not null default true

1.11.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.11.4 Policies
• business_taxon_aliases_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• business_taxon_aliases_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• business_taxon_aliases_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• business_taxon_aliases_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.12 account_taxonomy

1.12.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (account_id, taxon_id)
• CHECK: account_taxonomy_status_chk (status IN ('active', 'inactive'))
• CHECK: account_taxonomy_source_type_chk (source_type IN ('manual', 'taxonomy_match'))
• FK: account_id → accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.12.2 Campos
• account_id uuid not null
• taxon_id uuid not null
• is_primary boolean not null default false
• status text not null
• source_type text not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.12.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.12.4 Policies
• account_taxonomy_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• account_taxonomy_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• account_taxonomy_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• account_taxonomy_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.13 content_templates

1.13.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: template_key
• UNIQUE: slug
• CHECK: content_templates_template_family_chk (template_family IN ('commercial_activation', 'landing_page'))
• CHECK: content_templates_template_scope_chk (template_scope IN ('page', 'section'))
• CHECK: content_templates_status_chk (status IN ('draft', 'active', 'archived'))

1.13.2 Campos
• template_key text not null
• name text not null
• slug text not null
• template_family text not null
• template_scope text not null
• status text not null
• version integer not null default 1
• is_active boolean not null default true
• payload_json jsonb not null
• notes text null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.13.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.13.4 Policies
• content_templates_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• content_templates_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• content_templates_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• content_templates_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.14 content_template_taxons

1.14.1 Chaves, constraints e relacionamentos
• PK: id uuid
• CHECK: content_template_taxons_resolution_level_chk (resolution_level IN ('generic', 'segment', 'niche', 'ultra_niche'))
• FK: template_id → content_templates(id) ON UPDATE CASCADE ON DELETE CASCADE
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.14.2 Campos
• template_id uuid not null
• taxon_id uuid not null
• resolution_level text not null
• priority integer not null default 0
• is_primary boolean not null default false
• is_active boolean not null default true
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.14.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.14.4 Policies
• content_template_taxons_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• content_template_taxons_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• content_template_taxons_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• content_template_taxons_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.15 taxon_market_research

1.15.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (taxon_id, research_block, audience_scope, version)
• CHECK: taxon_market_research_status_chk (status IN ('draft', 'active', 'archived'))
• CHECK: taxon_market_research_audience_scope_chk (audience_scope IN ('end_customer', 'business_buyer'))
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.15.2 Campos
• taxon_id uuid not null
• research_block text not null
• Regra: texto governado por processo operacional; sem CHECK fechado nesta etapa
• audience_scope text not null
• Regra: audience_scope define o público homogêneo da pesquisa-pai; valores permitidos: end_customer | business_buyer
• version integer not null default 1
• status text not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.15.3 Índices
• taxon_market_research_taxon_block_audience_version_uidx (UNIQUE em taxon_id, research_block, audience_scope, version)
• taxon_market_research_one_active_per_block_audience_uidx (UNIQUE parcial em taxon_id, research_block, audience_scope WHERE status = 'active')

1.15.4 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.15.5 Policies
• taxon_market_research_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• taxon_market_research_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.16 taxon_market_research_items

1.16.1 Chaves, constraints e relacionamentos
• PK: id uuid
• FK: research_id → taxon_market_research(id) ON UPDATE CASCADE ON DELETE CASCADE
• UNIQUE adicional: nenhuma nesta etapa

1.16.2 Campos
• research_id uuid not null
• item_key text not null
• item_text text not null
• priority integer not null default 0
• sort_order integer not null default 999
• is_active boolean not null default true
• notes text null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.16.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.16.4 Policies
• taxon_market_research_items_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_items_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_items_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• taxon_market_research_items_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.17 taxon_message_guides

1.17.1 Chaves, constraints e relacionamentos
• PK: id uuid
• CHECK: taxon_message_guides_context_type_chk (context_type IN ('e10_5', 'landing_page', 'email', 'whatsapp'))
• FK: research_id → taxon_market_research(id) ON UPDATE CASCADE ON DELETE CASCADE

1.17.2 Campos
• research_id uuid not null
• context_type text not null
• guide_payload_json jsonb not null
• version integer not null default 1
• is_active boolean not null default true
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.17.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.17.4 Policies
• taxon_message_guides_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• taxon_message_guides_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• taxon_message_guides_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• taxon_message_guides_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()


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
• SSR + adapter

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
• API + UI

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

2.6 v_audit_logs_norm
• Objetivo: leitura simplificada de audit_logs
• Colunas garantidas: id, entity, entity_id, action, diff, account_id, actor_user_id, ip_address, created_at
• Segurança: security_invoker = true
• Consumidores: Admin/Auditoria

3. Functions / RPC

3.1 Onboarding
3.1.1 _gen_provisional_slug() → text
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

5. Tipos canônicos
• Fonte única: PATH: lib/types/status.ts
• AccountStatus: active | inactive | suspended | pending_setup
• MemberStatus: pending | active | inactive | revoked
• MemberRole: owner | admin | editor | viewer
• Nota: accounts.status não aceita trial (CHECK accounts_status_chk). No estado atual, views não contêm trial e o runtime/tipos (PATH) não incluem trial (drift resolvido).

99. Changelog
v1.0.13 (26/04/2026) — E10.5.2.1: ajuste corretivo de audience_scope no Grupo C
• taxon_market_research: adicionado audience_scope no registro-pai; registrada unicidade por (taxon_id, research_block, audience_scope, version) e índice único parcial para no máximo 1 versão active por (taxon_id, research_block, audience_scope).
• taxon_market_research_items: removido audience_scope; itens passam a herdar o público pelo research_id.
• taxon_market_research_items.item_key: registrado como NOT NULL conforme estado validado no Supabase.

v1.0.12 (23/04/2026) — E10.5.2.1: ajuste estrutural das tabelas do Grupo C
• taxon_market_research: removido base_summary; adicionado research_block; registrada unicidade por (taxon_id, research_block, version) e índice único parcial para no máximo 1 versão active por (taxon_id, research_block).
• taxon_market_research_items: substituída a estrutura baseada em item_tag por item_key, audience_scope, item_text, priority, sort_order, is_active e notes.
• audience_scope registrado com CHECK fechado (end_customer, business_buyer); sem UNIQUE extra nesta etapa; sort_order como NOT NULL DEFAULT 999.

v1.0.11 (13/04/2026) — Remoção do legado de tokens no contrato de DB
• Removidas do contrato as referências aos objetos legados de token/onboarding removidos na limpeza de BD.
• Ajustado o inventário para refletir o estado pós-limpeza, preservando helpers admin/shared (`is_platform_admin()`, `is_super_admin()`, `ensure_first_account_for_current_user()`) e `v_audit_logs_norm`.

v1.0.10 (09/04/2026) — E10.5.2: base estrutural de taxonomia, templates e guides
• Adicionadas as tabelas: `business_taxons`, `business_taxon_aliases`, `account_taxonomy`, `content_templates`, `content_template_taxons`, `taxon_market_research`, `taxon_market_research_items` e `taxon_message_guides`.
• Todas nascem com RLS ativo e policies CRUD admin-only (`is_super_admin()` OU `is_platform_admin()`).
• `business_taxon_aliases.alias_text_normalized` registrado como generated column.
• Nesta etapa, as 8 tabelas ficam fora de auditoria e fora de Trigger Hub.

v1.0.9 (24/03/2026) — Remoção de referências ao repo-inv
• Removidas referências a docs/repo-inv.md em consumidores e apontamentos de app/runtime, alinhando o Schema aos documentos canônicos ativos.

v1.0.8 (04/03/2026) — Role read-only `ai_readonly` (public + timeout)
• Registrado o role `ai_readonly` (LOGIN + statement_timeout=5s) com escopo read-only no schema public (USAGE + GRANT SELECT em tabelas existentes e default privileges para novas tabelas).

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
