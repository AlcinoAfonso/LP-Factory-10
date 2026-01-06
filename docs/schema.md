23/12/2025 LP Factory 10 — Schema (DB Contract) v1.0
Propósito: contrato do banco (DB) para orientar IA em views/RPC/triggers/RLS sem inflar a Base Técnica.
Regra anti-drift: base-tec.md não repete listas de DB; apenas referencia este arquivo.
0. Como este arquivo é mantido
	• Este arquivo descreve o que existe no DB e o que é esperado como contrato.
	• Onde faltarem detalhes (ex.: nomes exatos de policies), marcar como TBD e preencher ao confirmar no Supabase.
	• Caminho para validar RLS/policies: Supabase > Database > Tables > {tabela} > Policies
	• Caminho para validar views/functions: Supabase > Database > Views / Functions
	• Policies: quando Delete não estiver listado, assumir proibido/TBD.
1. Tabelas
1.1 accounts
	• PK: id uuid
	• UNIQUE: subdomain, domain, slug
	• Status: active | inactive | suspended | pending_setup | trial
	• FK: plan_id → plans; owner_user_id → auth.users
	• Índices:
		○ accounts_name_gin_idx (GIN to_tsvector portuguese, name)
	• Trigger Hub: sim (ver seção 4)
	• RLS: obrigatório
	• Policies (TBD: preencher nomes reais no Supabase):
		○ Select: membro ativo ou platform_admin
		○ Update: owner/admin (restrito)
		○ Insert: somente via RPC (quando aplicável)
1.2 account_users
	• PK: id uuid
	• UNIQUE: (account_id, user_id)
	• Role: owner | admin | editor | viewer
	• Status: pending | active | inactive | revoked
	• FK: account_id → accounts; user_id → auth.users; invited_by → auth.users
	• Trigger Hub: sim (protege último owner)
	• RLS: obrigatório
	• Policies (TBD):
		○ Select: usuário vê seus vínculos
		○ Insert/Update: regras via convites e governança (hub + RPC)
1.3 audit_logs
	• PK: id uuid
	• Campos-chave: user_id, table_name, record_id, changes_json, account_id, created_at
	• Trigger: sem trigger próprio (sink)
	• RLS: recomendado/obrigatório conforme exposição
	• Policies (TBD):
		○ Select: admins/roles autorizados ou via view v_audit_logs_norm
1.4 plans
	• PK: id uuid
	• UNIQUE: name
	• Campos críticos: name, max_lps, max_conversions
	• Trigger Hub: não
	• RLS: conforme uso (geralmente read-only)
	• Policies (TBD):
		○ Select: público autenticado (se aplicável) ou somente admins
1.5 partners
	• PK: id uuid
	• Campos: name, type (agency | reseller | affiliate), status (active | inactive | suspended)
	• Trigger Hub: não
	• RLS: conforme uso
	• Policies (TBD)
1.6 partner_accounts
	• PK composto: (partner_id, account_id)
	• FK: partner_id → partners; account_id → accounts
	• Trigger Hub: sim
	• RLS: obrigatório
	• Policies (TBD):
		○ Select: platform_admin/partner autorizado
		○ Insert/Update/Delete: governado via hub/regras administrativas
1.7 post_sale_tokens
	• PK: id uuid
	• Campos: email, contract_ref, expires_at, used_at, used_by, account_id, meta, created_at, created_by
	• Índices obrigatórios:
		○ (email, created_at DESC)
		○ (created_by, created_at DESC)
	• Trigger Hub: não
	• RLS: ativo
	• Policies (TBD: nomes reais):
		○ Admin: gerir tokens (platform_admin/super_admin)
		○ Próprio usuário: histórico (created_by = auth.uid()) quando aplicável
2. Views
2.1 v_access_context_v2
	• Objetivo: fonte única de decisão user ↔ conta
	• Colunas garantidas:
		○ account_id, account_key, account_name, account_status
		○ user_id, member_role, member_status
		○ allow, reason
	• Assunções/filtros:
		○ allow=true só para conta active/trial/pending_setup + membro ativo
	• Segurança: security_invoker = true
	• Consumidores: SSR + adapter (ver docs/repo-inv.md)
2.2 v_user_accounts_list
	• Objetivo: AccountSwitcher e /api/user/accounts
	• Colunas garantidas:
		○ account_id, account_name, account_subdomain, account_status, member_status, member_role, created_at
	• Assunções/filtros:
		○ user_id = auth.uid()
		○ allow=true (via v_access_context_v2)
	• Segurança: security_invoker = true
	• Consumidores: API + UI (ver docs/repo-inv.md)
2.3 v_account_effective_limits
	• Objetivo: limites efetivos por conta
	• Colunas garantidas (principais):
		○ account_id, account_name, account_status, subdomain, domain
		○ plan_id, plan_name, price_monthly, plan_features
		○ max_lps, max_conversions, flags _unlimited e _effective
	• Segurança: security_invoker = true
	• Consumidores: dashboards/APIs de plano e limites
2.4 v_account_effective_limits_secure
	• Objetivo: expor limites apenas para quem pode ver
	• Assunções/filtros:
		○ is_platform_admin() OU is_member_active(account_id, auth.uid())
	• Segurança: security_invoker = true
	• Consumidores: APIs e dashboards com detalhes de plano
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
	• create_account_with_owner(token_id uuid, actor_id uuid) → uuid
		○ Segurança: SECURITY DEFINER (aprovado)
		○ search_path: public (obrigatório)
		○ Efeito: cria conta pending_setup, vincula owner, consome token
		○ Consumidores: onboarding UI + adapter (ver docs/repo-inv.md)
	• _gen_provisional_slug() → text
		○ Segurança: invoker (TBD confirmar)
		○ search_path: public (obrigatório)
		○ Efeito: slug temporário acc-{uuid8}
3.2 Limites de Plano
	• get_account_effective_limits(account_id uuid) → SETOF record
		○ Segurança: invoker (TBD confirmar)
		○ search_path: public (obrigatório)
		○ Efeito/shape: TBD (shape)
		○ Consumidores: dashboards/APIs de limites
	• plan_limit_is_unlimited(value int) → boolean
	• plan_limit_value(value int) → bigint
3.3 Auth / RLS Helpers
	• is_super_admin() → boolean
	• is_service_role() → boolean
	• is_platform_admin() → boolean (TBD confirmar claim/origem)
	• is_admin_active() → boolean
	• is_member_active(p_account_id uuid, p_user_id uuid) → boolean
	• has_account_min_role(account_id uuid, min_role text) → boolean
		○ Segurança: SECURITY DEFINER (aprovado; usado em RLS)
		○ search_path: public (obrigatório)
	• role_rank(role text) → int (owner=4, admin=3, editor=2, viewer=1)
	• SECURITY DEFINER allowlist: create_account_with_owner (motivo: onboarding; limites: TBD) / has_account_min_role (motivo: helper RLS; limites: somente leitura; sem writes)
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
	• tg_accounts_hub
		○ Tabela: accounts
		○ Evento: TBD (confirmar no Supabase)
		○ Função: hub_router()
	• tg_account_users_hub
		○ Tabela: account_users
		○ Evento: TBD (confirmar no Supabase)
		○ Função: hub_router()
	• tg_partner_accounts_hub
		○ Tabela: partner_accounts
		○ Evento: TBD (confirmar no Supabase)
		○ Função: hub_router()
4.2 Fora do Hub
	• plans: sem trigger
	• partners: sem trigger hub
	• post_sale_tokens: sem trigger
5. Tipos canônicos 
	• Fonte única: PATH: src/lib/types/status.ts
	• AccountStatus: active | inactive | suspended | pending_setup | trial
	• MemberStatus: pending | active | inactive | revoked
	• MemberRole: owner | admin | editor | viewer
	• Regra: proibido redefinir fora do arquivo canônico; adapters normalizam valores do DB
99. Changelog
