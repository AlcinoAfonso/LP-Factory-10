0. Introdução

0.1 Cabeçalho
• Data da última atualização: 28/06/2026
• Documento: LP Factory 10 — Schema (DB Contract) v1.0.30

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
• Campos-chave: user_id, actor_user_id, table_name, record_id, action, event, changes_json, account_id, ip_address, created_at
• `action`: operação de auditoria; valores permitidos `insert`, `update` e `delete`
• `event`: nome normalizado do evento de contexto
• `changes_json`: propriedades adicionais do evento ou diff auditado
1.3.2 Segurança
• Trigger: sem trigger próprio (sink)
• RLS: recomendado/obrigatório conforme exposição
1.3.3 Policies (TBD: preencher nomes reais no Supabase)
• Select: admins/roles autorizados ou via view v_audit_logs_norm

1.4 plans
1.4.1 Chaves e campos críticos
• PK: id uuid
• UNIQUE: name
• Campos críticos: name, max_lps, max_conversions, price_monthly, features
• name text not null
• max_lps integer null default 0
• max_conversions integer null default 0
• price_monthly numeric null default 0.00
• features jsonb null default '{}'::jsonb
• Fonte canônica parcial para E10.7: name, price_monthly, max_lps, max_conversions e features. Não é fonte suficiente para garantias, condições comerciais, URLs oficiais de checkout, promessas, descontos ou regras promocionais.
1.4.2 Segurança
• Trigger Hub: não
• RLS: conforme uso (geralmente read-only)
• Grants: `authenticated` com SELECT; `service_role` com SELECT para leitura server-side administrativa da E10.7.
1.4.3 Policies (TBD: preencher nomes reais no Supabase)
• Select: público autenticado (se aplicável) ou somente admins

1.5 account_commercial_entitlements
1.5.1 Chaves, constraints e relacionamentos
• PK: id uuid
• FK: account_id → accounts(id) ON DELETE CASCADE (constraint account_commercial_entitlements_account_id_fkey)
• CHECK: account_commercial_entitlements_plan_key_chk (plan_key IN ('starter', 'lite', 'pro', 'ultra'))
• CHECK: account_commercial_entitlements_origin_chk (origin IN ('plano_pago_confirmado', 'trial', 'liberacao_manual'))
• CHECK: account_commercial_entitlements_status_chk (status IN ('pendente_confirmacao', 'ativo', 'expirado', 'cancelado'))
• CHECK: account_commercial_entitlements_metadata_json_object_chk (metadata_json deve ser objeto JSON)
• CHECK: account_commercial_entitlements_vigencia_chk (expires_at deve ser maior que starts_at quando ambos existirem)
• CHECK: canceled_at só é permitido quando status='cancelado'
1.5.2 Campos
• id uuid not null default gen_random_uuid()
• account_id uuid not null
• plan_key text not null
• plan_name_snapshot text not null
• origin text not null
• status text not null
• starts_at timestamptz null
• confirmed_at timestamptz null
• expires_at timestamptz null
• canceled_at timestamptz null
• external_provider text null
• external_reference text null
• idempotency_key text null
• metadata_json jsonb not null default '{}'::jsonb
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()
1.5.3 Índices
• account_commercial_entitlements_account_id_idx (account_id)
• account_commercial_entitlements_status_idx (status)
• account_commercial_entitlements_expires_at_idx (expires_at)
• account_commercial_entitlements_effective_lookup_idx (account_id, status, starts_at, expires_at) WHERE status='ativo'
• account_commercial_entitlements_idempotency_key_uidx UNIQUE parcial em idempotency_key WHERE idempotency_key IS NOT NULL
1.5.4 Segurança
• Trigger: account_commercial_entitlements_set_updated_at usa public.tg_set_updated_at()
• RLS: ativo (enable row level security)
• Grants: authenticated com SELECT; service_role com SELECT, INSERT, UPDATE e DELETE
• INSERT/UPDATE/DELETE sem acesso direto amplo para authenticated; mutação operacional futura deve ocorrer por service_role, RPC ou webhook em fase própria.
1.5.5 Policies
• account_commercial_entitlements_select_member_or_platform (SELECT to authenticated): is_platform_admin() OU membro ativo da conta (account_users.account_id = account_commercial_entitlements.account_id; account_users.user_id = auth.uid(); account_users.status='active')
1.5.6 Observações
• `sem_entitlement` e `bloqueado_operacionalmente` são resultados derivados de consulta, não status persistidos.
• Provedor, checkout, webhook, assinatura, invoice e evento externo são referências/mecanismos, não origem comercial.
• Não há payload bruto, dado de cartão, secret ou e-mail como chave de idempotência.
• `public.plans` continua fonte parcial de metadados de plano e não prova entitlement comercial.
• Account Dashboard consumirá a leitura efetiva apenas em fase futura; esta etapa não altera runtime.

1.6 partners
• PK: id uuid
• Campos: name, type (agency | reseller | affiliate), status (active | inactive | suspended)
• Trigger Hub: não
• RLS: conforme uso
• Policies (TBD)

1.7 partner_accounts
1.7.1 Chaves e relacionamentos
• PK composto: (partner_id, account_id)
• FK: partner_id → partners; account_id → accounts
1.7.2 Segurança
• Trigger Hub: sim
• RLS: obrigatório
1.7.3 Policies (TBD: preencher nomes reais no Supabase)
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

1.9 account_landing_pages
1.9.1 Função
• Persistência mínima de landing pages produtivas por conta na E19.
• Criação inicial limitada a status `draft`.

1.9.2 Colunas
• id uuid primary key default gen_random_uuid()
• account_id uuid not null
• name text not null
• slug text not null
• status text not null default 'draft'
• created_by uuid not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.9.3 Relacionamentos
• account_id referencia public.accounts(id) com ON UPDATE CASCADE e ON DELETE CASCADE.
• created_by referencia auth.users(id) com ON UPDATE CASCADE e ON DELETE RESTRICT.

1.9.4 Constraints
• account_landing_pages_status_chk: status in ('draft').
• account_landing_pages_slug_chk: slug no padrão seguro `^[a-z0-9]+(-[a-z0-9]+)*$`.
• account_landing_pages_name_chk: nome não vazio após trim.
• account_landing_pages_account_slug_uidx: UNIQUE (account_id, slug).

1.9.5 Índices
• account_landing_pages_account_id_idx em account_id.
• account_landing_pages_created_by_idx em created_by.
• account_landing_pages_status_idx em status.

1.9.6 Trigger
• account_landing_pages_set_updated_at: executa public.tg_set_updated_at() antes de update.

1.9.7 RLS / policies / grants
• RLS habilitado.
• Policy account_landing_pages_select_member_or_platform: permite SELECT para platform admin ou membro ativo da conta.
• authenticated: SELECT.
• service_role: SELECT, INSERT, UPDATE, DELETE.
• public e anon: sem grants.

1.9.8 Observações de escopo
• Escrita deve ocorrer por fluxo server-side autorizado.
• Criação inicial é apenas `draft`.
• Publicação, render público, domínio customizado, analytics, A/B e IA runtime não fazem parte deste schema inicial.

1.10 ai_readonly (role)
1.10.1 Segurança (parâmetros)
• LOGIN: sim
• statement_timeout: 5s
1.10.2 Escopo e grants (schema public)
• Schema: public (USAGE)
• Tabelas existentes em public: GRANT SELECT
• Novas tabelas em public: default privileges com GRANT SELECT

1.11 business_taxons

1.11.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: slug
• CHECK: business_taxons_level_chk (level IN ('segment', 'niche', 'ultra_niche'))
• FK: parent_id → business_taxons(id) ON UPDATE CASCADE ON DELETE SET NULL

1.11.2 Campos
• parent_id uuid null
• level text not null
• name text not null
• slug text not null
• is_active boolean not null default true

1.11.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT

1.11.4 Policies
• business_taxons_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• business_taxons_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• business_taxons_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• business_taxons_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.11.5 Índices
• business_taxons_name_normalized_idx (btree em normalize_taxon_match_text(name))
• business_taxons_slug_normalized_idx (btree em normalize_taxon_match_text(replace(slug, '-', ' ')))
• business_taxons_name_slug_fts_gin_idx (GIN em to_tsvector('portuguese', normalize_taxon_match_text(name) + slug normalizado))
• business_taxons_name_normalized_trgm_gin_idx (GIN trigram em normalize_taxon_match_text(name))
• business_taxons_slug_normalized_trgm_gin_idx (GIN trigram em slug normalizado)

1.12 business_taxon_aliases

1.12.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (taxon_id, alias_text_normalized)
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT
• Generated column: alias_text_normalized (normalização derivada de alias_text)

1.12.2 Campos
• taxon_id uuid not null
• alias_text text not null
• alias_text_normalized text generated always as stored
• is_active boolean not null default true

1.12.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT

1.12.4 Policies
• business_taxon_aliases_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• business_taxon_aliases_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• business_taxon_aliases_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• business_taxon_aliases_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.12.5 Índices
• business_taxon_aliases_alias_text_normalized_idx (btree em alias_text_normalized)
• business_taxon_aliases_alias_text_normalized_fts_gin_idx (GIN em to_tsvector('portuguese', alias_text_normalized))
• business_taxon_aliases_alias_text_normalized_trgm_gin_idx (GIN trigram em alias_text_normalized)

1.13 account_taxonomy

1.13.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (account_id, taxon_id)
• CHECK: account_taxonomy_status_chk (status IN ('active', 'inactive'))
• CHECK: account_taxonomy_source_type_chk (source_type IN ('manual', 'taxonomy_match', 'user_confirmed_ai'))
• FK: account_id → accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT
• Nota: não há constraint/índice garantindo apenas um `is_primary = true` por conta nesta etapa.

1.13.2 Campos
• account_id uuid not null
• taxon_id uuid not null
• is_primary boolean not null default false
• status text not null
• source_type text not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.13.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT, INSERT, UPDATE
• anon/authenticated/public: sem acesso direto

1.13.4 Policies
• account_taxonomy_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• account_taxonomy_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• account_taxonomy_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• account_taxonomy_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.14 content_templates

1.14.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (template_key, version)
• UNIQUE: (slug, version)
• UNIQUE auxiliar: (id, version)
• UNIQUE parcial: no máximo um template `active` e `is_active = true` por família com escopo `page`
• CHECK: content_templates_template_family_chk (template_family IN ('commercial_activation', 'landing_page'))
• CHECK: content_templates_template_scope_chk (template_scope IN ('page', 'section'))
• CHECK: content_templates_status_chk (status IN ('draft', 'active', 'archived'))

1.14.2 Campos
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

1.14.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT

1.14.4 Policies
• content_templates_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• content_templates_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• content_templates_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• content_templates_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.14.5 Registros-base de `commercial_activation`
• Template de página: `commercial_activation_page`, slug `commercial-activation-page`, escopo `page`.
• Módulos de seção: `hero`, `benefits`, `services`, `plans`, `differentials`, `how_it_works`, `faq` e `final_cta`.
• Slugs especiais: `how-it-works` e `final-cta`; os demais coincidem com `template_key`.
• Todos pertencem à família `commercial_activation`, versão 1, status `active`, `is_active = true` e `payload_json = {}`.
• IDs físicos são UUIDs gerados pelo banco; a identidade funcional é protegida por `template_key + version` e `slug + version`.
• O provisionamento inicial cria nove registros-base e não cria vínculos em `content_template_taxons`; esses vínculos pertencem aos consumidores por taxon.
• Migration: `supabase/migrations/20260616142000_e18_commercial_activation_base_records.sql`.
• Verificação: `supabase/snippets/e18_commercial_activation_base_records_verify.sql`.

1.15 content_template_taxons

1.15.1 Chaves, constraints e relacionamentos
• PK: id uuid
• CHECK: content_template_taxons_resolution_level_chk (resolution_level IN ('generic', 'segment', 'niche', 'ultra_niche'))
• FK: template_id → content_templates(id) ON UPDATE CASCADE ON DELETE CASCADE
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.15.2 Campos
• template_id uuid not null
• taxon_id uuid not null
• resolution_level text not null
• priority integer not null default 0
• is_primary boolean not null default false
• is_active boolean not null default true
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.15.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT

1.15.4 Policies
• content_template_taxons_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• content_template_taxons_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• content_template_taxons_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• content_template_taxons_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.16 taxon_market_research

1.16.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (taxon_id, research_block, audience_scope, version)
• UNIQUE auxiliar: (id, taxon_id, audience_scope, version)
• CHECK: taxon_market_research_status_chk (status IN ('draft', 'active', 'archived'))
• CHECK: taxon_market_research_audience_scope_chk (audience_scope IN ('end_customer', 'business_buyer'))
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.16.2 Campos
• taxon_id uuid not null
• research_block text not null
• Regra: texto governado por processo operacional; sem CHECK fechado nesta etapa
• audience_scope text not null
• Regra: audience_scope define o público homogêneo da pesquisa-pai; valores permitidos: end_customer | business_buyer
• version integer not null default 1
• status text not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.16.3 Índices
• taxon_market_research_taxon_block_audience_version_uidx (UNIQUE em taxon_id, research_block, audience_scope, version)
• taxon_market_research_one_active_per_block_audience_uidx (UNIQUE parcial em taxon_id, research_block, audience_scope WHERE status = 'active')

1.16.4 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT

1.16.5 Policies
• taxon_market_research_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• taxon_market_research_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.17 taxon_market_research_items

1.17.1 Chaves, constraints e relacionamentos
• PK: id uuid
• FK: research_id → taxon_market_research(id) ON UPDATE CASCADE ON DELETE CASCADE
• UNIQUE adicional: nenhuma nesta etapa

1.17.2 Campos
• research_id uuid not null
• item_key text not null
• item_text text not null
• priority integer not null default 0
• sort_order integer not null default 999
• is_active boolean not null default true
• notes text null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.17.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT

1.17.4 Policies
• taxon_market_research_items_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_items_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• taxon_market_research_items_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• taxon_market_research_items_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.18 taxon_message_guides

1.18.1 Chaves, constraints e relacionamentos
• PK: id uuid
• CHECK: taxon_message_guides_context_type_chk (context_type IN ('e10_5', 'landing_page', 'email', 'whatsapp'))
• FK: research_id → taxon_market_research(id) ON UPDATE CASCADE ON DELETE CASCADE

1.18.2 Campos
• research_id uuid not null
• context_type text not null
• guide_payload_json jsonb not null
• version integer not null default 1
• is_active boolean not null default true
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.18.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)

1.18.4 Policies
• taxon_message_guides_select_admin_only (SELECT to public): is_super_admin() OU is_platform_admin()
• taxon_message_guides_insert_admin_only (INSERT to public): is_super_admin() OU is_platform_admin()
• taxon_message_guides_update_admin_only (UPDATE to public): is_super_admin() OU is_platform_admin() (USING + WITH CHECK)
• taxon_message_guides_delete_admin_only (DELETE to public): is_super_admin() OU is_platform_admin()

1.19 account_niche_resolutions

1.19.1 Chaves, constraints e relacionamentos
• CHECK: account_niche_resolutions_ai_status_chk
• CHECK: account_niche_resolutions_ai_result_json_chk
• CHECK: account_niche_resolutions_ai_ux_mode_chk
• CHECK: account_niche_resolutions_user_resolution_status_chk
• CHECK: account_niche_resolutions_user_rewrite_input_chk
• FK: ai_suggested_taxon_id → business_taxons(id)
• FK: user_selected_taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE SET NULL
• PK: account_id uuid
• FK: account_id → accounts(id)
• FK: selected_taxon_id → business_taxons(id)
• CHECK: raw_input não vazio
• CHECK: confidence
• CHECK: ai_escalation_mode
• CHECK: reason
• CHECK: resolution_status
• CHECK: score entre 0 e 1 ou NULL

1.19.2 Campos
• ai_status text null
• ai_error_code text null
• ai_model text null
• ai_schema_version text null
• ai_result_json jsonb null
• ai_ux_mode text null
• ai_suggested_taxon_id uuid null
• ai_suggested_new_taxon_label text null
• ai_needs_user_confirmation boolean null
• ai_needs_admin_review boolean null
• ai_reason text null
• ai_processed_at timestamptz null
• user_resolution_status text null
• user_selected_taxon_id uuid null
• user_confirmed_at timestamptz null
• user_rejected_at timestamptz null
• user_rewrite_input text null
• user_dismissed_at timestamptz null
• account_id uuid not null
• raw_input text not null
• selected_taxon_id uuid null
• confidence text not null
• should_use_deterministic_match boolean not null
• should_escalate_to_ai boolean not null
• ai_escalation_mode text not null
• needs_admin_review boolean not null
• reason text not null
• resolution_status text not null
• match_source text null
• score numeric null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.19.3 Segurança
• Trigger Hub: não
• RLS: ativo
• Policies: admin-only
• Acesso direto removido de public, anon e authenticated
• service_role: SELECT, INSERT e UPDATE

1.19.4 Índices
• account_niche_resolutions_ai_suggested_taxon_id_idx

1.20 content_template_compositions

1.20.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (template_id, taxon_id, version)
• UNIQUE auxiliar: (id, template_id, taxon_id, version)
• UNIQUE parcial: no máximo uma composição `active` por (template_id, taxon_id)
• CHECK: version > 0
• CHECK: status IN ('draft', 'active', 'archived')
• FK: template_id → content_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.20.2 Campos
• template_id uuid not null
• taxon_id uuid not null
• version integer not null default 1
• status text not null default 'draft'
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.20.3 Segurança
• Trigger Hub: não
• RLS: ativo
• anon/authenticated/public: sem acesso
• service_role: SELECT

1.20.4 Índices
• `content_template_compositions_one_active_uidx`: UNIQUE parcial em (`template_id`, `taxon_id`) para `status = 'active'`.
• `content_template_compositions_taxon_id_idx`: btree em `taxon_id`.

1.20.5 Triggers
• `content_template_compositions_set_updated_at`: executa `public.tg_set_updated_at()` antes de UPDATE.

1.21 content_template_composition_items

1.21.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (composition_id, sort_order)
• CHECK: variant_key descritivo no formato `modulo.variante`
• CHECK: sort_order >= 0
• CHECK: config_json é objeto JSON
• FK: composition_id → content_template_compositions(id) ON UPDATE CASCADE ON DELETE CASCADE
• FK: module_template_id → content_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.21.2 Campos
• composition_id uuid not null
• module_template_id uuid not null
• variant_key text not null
• sort_order integer not null
• is_required boolean not null default true
• config_json jsonb not null default '{}'
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.21.3 Segurança
• Trigger Hub: não
• RLS: ativo
• anon/authenticated/public: sem acesso
• service_role: SELECT

1.21.4 Índices
• `content_template_composition_items_module_template_id_idx`: btree em `module_template_id`.

1.21.5 Triggers
• `content_template_composition_items_set_updated_at`: executa `public.tg_set_updated_at()` antes de UPDATE.

1.22 content_artifacts

1.22.1 Chaves, constraints e relacionamentos
• PK: id uuid
• UNIQUE: (template_id, composition_id, taxon_id, audience_scope, research_version, artifact_version)
• UNIQUE parcial: no máximo um artefato `published` por (template_id, taxon_id, audience_scope)
• CHECK: audience_scope IN ('end_customer', 'business_buyer')
• CHECK: versões de template, composição, pesquisa e artefato > 0
• CHECK: status IN ('draft', 'published', 'archived')
• CHECK: ciclo de vida coerente com published_at e archived_at
• CHECK: content_json e provenance_json são objetos JSON
• FK composta: (template_id, template_version) → content_templates(id, version)
• FK composta: (composition_id, template_id, taxon_id, composition_version) → content_template_compositions(id, template_id, taxon_id, version)
• FK: taxon_id → business_taxons(id) ON UPDATE CASCADE ON DELETE RESTRICT

1.22.2 Campos
• template_id uuid not null
• composition_id uuid not null
• taxon_id uuid not null
• audience_scope text not null
• template_version integer not null
• composition_version integer not null
• research_version integer not null
• artifact_version integer not null default 1
• status text not null default 'draft'
• content_json jsonb not null
• provenance_json jsonb not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()
• published_at timestamptz null
• archived_at timestamptz null

1.22.3 Segurança
• Trigger Hub: não
• RLS: ativo
• public/anon: sem acesso
• authenticated: SELECT, INSERT e UPDATE restrito às colunas `content_json` e `provenance_json` somente em artefatos `draft`
• service_role: SELECT, INSERT, UPDATE
• Policies:
  • content_artifacts_select_admin_only (SELECT to authenticated): is_super_admin() OU is_platform_admin()
  • content_artifacts_insert_admin_draft_only (INSERT to authenticated): is_super_admin() OU is_platform_admin(); somente `status = 'draft'`, `published_at IS NULL` e `archived_at IS NULL`
  • content_artifacts_update_admin_draft_content_only (UPDATE to authenticated): is_super_admin() OU is_platform_admin(); somente `status = 'draft'`, `published_at IS NULL` e `archived_at IS NULL` (USING + WITH CHECK)

1.22.4 Índices
• `content_artifacts_one_published_uidx`: UNIQUE parcial em (`template_id`, `taxon_id`, `audience_scope`) para `status = 'published'`.
• `content_artifacts_composition_id_idx`: btree em `composition_id`.
• `content_artifacts_taxon_id_idx`: btree em `taxon_id`.

1.22.5 Triggers
• `content_artifacts_set_updated_at`: executa `public.tg_set_updated_at()` antes de UPDATE.

1.23 content_artifact_research_sources

1.23.1 Chaves, constraints e relacionamentos
• PK: (artifact_id, research_id)
• FK composta: (artifact_id, taxon_id, audience_scope, research_version) → content_artifacts(id, taxon_id, audience_scope, research_version)
• FK composta: (research_id, taxon_id, audience_scope, research_version) → taxon_market_research(id, taxon_id, audience_scope, version)

1.23.2 Campos
• artifact_id uuid not null
• research_id uuid not null
• taxon_id uuid not null
• audience_scope text not null
• research_version integer not null
• created_at timestamptz not null default now()

1.23.3 Segurança
• Trigger Hub: não
• RLS: ativo
• public/anon: sem acesso
• authenticated: SELECT, INSERT
• service_role: SELECT, INSERT
• Policies:
  • content_artifact_research_sources_select_admin_only (SELECT to authenticated): is_super_admin() OU is_platform_admin()
  • cars_insert_admin_business_buyer_only (INSERT to authenticated): is_super_admin() OU is_platform_admin(); somente `audience_scope = 'business_buyer'`

1.23.4 Índices
• `content_artifact_research_sources_research_id_idx`: btree em `research_id`.

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

2.5 v_account_commercial_entitlement_effective
2.5.1 Objetivo
• Leitura efetiva read-only do entitlement comercial por conta.
2.5.2 Colunas garantidas
• id, account_id, plan_key, plan_name_snapshot, origin
• persisted_status, effective_status
• starts_at, confirmed_at, expires_at, canceled_at
• is_commercially_eligible
• created_at, updated_at
2.5.3 Regras efetivas
• Retorna no máximo um entitlement por account_id.
• Prioriza entitlement comercial elegível; em seguida usa confirmed_at, created_at e id para desempate.
• is_commercially_eligible=true somente quando status persistido é `ativo`, canceled_at é NULL, starts_at é NULL ou passado, e expires_at é NULL ou futuro.
• effective_status deriva `cancelado`, `expirado` e `pendente_confirmacao` quando a vigência contradiz o status persistido `ativo`.
• Ausência de linha para uma conta deve ser tratada pelo consumidor futuro como `sem_entitlement`.
2.5.4 Segurança
• security_invoker = true
• RLS da tabela account_commercial_entitlements governa a leitura.
• Grants: authenticated e service_role com SELECT.
2.5.5 Consumidores
• Account Dashboard server-side em fase futura; sem consumo de runtime nesta etapa.

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
• publish_content_artifact_draft (motivo: publicação transacional E10.7; limites: publica um draft por `id`, arquiva o published anterior do mesmo template/taxon/audience_scope e exige is_super_admin() OU is_platform_admin())
• ensure_commercial_activation_composition (motivo: materialização técnica genérica E10.7 Fase 5; limites: somente `commercial_activation`, taxon ativo e elegível por pesquisa completa v1; cria/atualiza vínculo, composição e itens técnicos mínimos sem duplicar template de canal)

3.3.4 publish_content_artifact_draft(p_artifact_id uuid) → content_artifacts
• Segurança: SECURITY DEFINER (aprovado; escrita transacional controlada)
• search_path: public, pg_temp
• Grants de EXECUTE: authenticated
• Sem EXECUTE para public/anon
• Efeito: bloqueia o draft alvo, valida `status = 'draft'`, bloqueia o `published` anterior do mesmo template/taxon/audience_scope, arquiva o anterior e publica o draft na mesma transação.
• Garantia complementar: `content_artifacts_one_published_uidx` mantém no máximo um `published` por (`template_id`, `taxon_id`, `audience_scope`).
• Risco residual aceito para Fase 2: geração segura da próxima `artifact_version`; a UNIQUE `(template_id, composition_id, taxon_id, audience_scope, research_version, artifact_version)` protege colisão, mas o fluxo de geração ainda deve calcular ou tentar inserir a próxima versão de forma segura.

3.3.5 public.ensure_commercial_activation_composition(p_taxon_id uuid) → content_template_compositions
• Finalidade: garantir composição técnica `commercial_activation` para taxon elegível.
• Entrada: `p_taxon_id uuid`.
• Comportamento: retorna composição existente quando houver composição ativa; materializa composição técnica quando o taxon elegível ainda não tiver composição ativa.
• Valida taxon ativo.
• Valida pesquisa estruturada completa.
• Usa template existente `commercial_activation_page`.
• Não cria novo template por taxon.
• Não depende de slug, nome de taxon ou taxon piloto.
• Segurança: SECURITY DEFINER.
• search_path: public, pg_temp.
• EXECUTE: somente `service_role`.
• `public`, `anon` e `authenticated`: sem `EXECUTE`.
• Migration relacionada: `supabase/migrations/20260624203000_e10_7_phase_5_ensure_commercial_activation_composition.sql`.

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

3.5.1 audit_context_event
• Assinatura: audit_context_event(p_event text, p_entity text, p_entity_id uuid, p_diff jsonb, p_account_id uuid) → void
• Segurança: invoker; SECURITY DEFINER = false
• search_path: public, extensions
• Grants de EXECUTE: authenticated e service_role.
• Efeito: insere evento em `public.audit_logs`
• `table_name = p_entity`
• `record_id = coalesce(p_entity_id, gen_random_uuid())`
• `action = 'insert'`
• `event = lower(p_event)`
• `changes_json = coalesce(p_diff, '{}'::jsonb)`
• `account_id = p_account_id`
• `user_id` e `actor_user_id`: `auth.uid()` quando disponível
• Migration corretiva: `supabase/migrations/20260614124000_fix_audit_context_event_event_column.sql`


3.6 Matching determinístico de taxonomia
3.6.1 normalize_taxon_match_text(input text) → text
• Segurança: invoker; SECURITY DEFINER = false
• search_path: public, extensions
• Volatilidade: immutable
• Grants: EXECUTE somente para service_role
• Efeito: normaliza texto para matching determinístico com lower, remoção de acentos, compactação de espaços e trim

3.6.2 match_business_taxons_deterministic(p_query text, p_limit integer default 10) → table
• Segurança: invoker; SECURITY DEFINER = false
• search_path: public, extensions
• Volatilidade: stable
• Grants: EXECUTE somente para service_role
• Retorno: taxon_id, name, slug, level, parent_id, parent_name, matched_aliases, match_source, score
• Estratégias cobertas: alias_exact, alias_normalized, taxon_name_exact, taxon_name_normalized, taxon_slug_normalized, fts, trgm
• Consumidor previsto: camada server/adapter do app; sem consumo direto pelo client nesta etapa
• Fora do escopo: writes, IA, fallback final, account_taxonomy, account_niche_resolutions e escolha de template

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
• account_commercial_entitlements_set_updated_at: trigger de atualização de updated_at em account_commercial_entitlements
• account_niche_resolutions_set_updated_at: trigger de atualização de updated_at em account_niche_resolutions

5. Tipos canônicos
• Fonte única: PATH: lib/types/status.ts
• AccountStatus: active | inactive | suspended | pending_setup
• MemberStatus: pending | active | inactive | revoked
• MemberRole: owner | admin | editor | viewer
• Nota: accounts.status não aceita trial (CHECK accounts_status_chk). No estado atual, views não contêm trial e o runtime/tipos (PATH) não incluem trial (drift resolvido).


6. Extensões
6.1 pg_trgm
• Schema: extensions
• Uso atual: suporte a índices e scoring trigram no matching determinístico de taxonomia
• Migration de origem: supabase/migrations/0009__e10_5_6_deterministic_taxon_matching.sql
• Rollback: não remove automaticamente a extensão, pois pode ser reutilizada por outros recursos

99. Changelog
v1.0.30 (28/06/2026) — E9 Fase 3: schema mínimo de entitlement comercial
• Registrada a tabela `account_commercial_entitlements` como fonte mínima de entitlement comercial por conta.
• Registrados campos, checks, índices, RLS, policy de SELECT para membro ativo/platform_admin, grants e trigger de updated_at.
• Registrada a view `v_account_commercial_entitlement_effective` com `security_invoker = true` para leitura efetiva read-only.
• Registrado que `public.plans` continua fonte parcial e não prova entitlement comercial; Account Dashboard consumirá a leitura apenas em fase futura.

v1.0.29 (25/06/2026) — E10.7 Fase 5: contrato consolidado da RPC de composição técnica genérica
• Atualizado o contrato da RPC `public.ensure_commercial_activation_composition(p_taxon_id uuid)` com finalidade, entrada, comportamento, validações, grants e migration relacionada.

v1.0.28 (24/06/2026) — E10.7 Fase 5: composição técnica genérica
• Registrada a RPC `ensure_commercial_activation_composition(uuid)` para materialização técnica controlada de composição `commercial_activation` por taxon elegível.
• Registrados limites: execução apenas via `service_role`, sem acesso público/authenticated direto, sem criação de template, sem geração de draft e sem execução na listagem administrativa.

v1.0.27 (22/06/2026) — E10.7 Fase 1D: leitura server-side de `plans`
• Registrado grant mínimo de SELECT em `public.plans` para `service_role`, viabilizando leitura server-side administrativa da fonte canônica parcial de planos.

v1.0.26 (21/06/2026) — E10.7 Fase 1B: plans como fonte canônica parcial
• Registrados `price_monthly` e `features` na tabela `plans`.
• Registrado que `plans` é fonte canônica parcial para name, price_monthly, max_lps, max_conversions e features; demais condições comerciais permanecem fora desta fonte.

v1.0.25 (21/06/2026) — E10.7 Fase 1: nome estável para policy de fontes de pesquisa
• Substituída a policy longa/truncável de INSERT em `content_artifact_research_sources` por `cars_insert_admin_business_buyer_only`.
• Mantida a mesma regra: is_super_admin() OU is_platform_admin(); somente `audience_scope = 'business_buyer'`.

v1.0.24 (21/06/2026) — E10.7 Fase 1: escrita administrativa e publicação transacional de artefatos
• Registrados grants e policies admin-only para criação de drafts em `content_artifacts` e registro de fontes `business_buyer` em `content_artifact_research_sources`.
• Registrado UPDATE direto de `authenticated` restrito às colunas `content_json` e `provenance_json` somente para artefatos `draft`.
• Registrada a RPC `publish_content_artifact_draft(uuid)` para arquivar o `published` anterior e publicar o novo `draft` na mesma transação.

v1.0.23 (16/06/2026) — E18: registros-base de `commercial_activation`
• Registrados o template-base de página e os oito módulos de seção da versão 1.
• Confirmados nove registros ativos, identidade funcional por chave/slug + versão e ausência de vínculos com taxons.
• RLS e grants preservados: `service_role` com SELECT; `anon` e `authenticated` sem SELECT.

v1.0.22 (15/06/2026) — E18: índices e triggers complementares
• Registrados os índices auxiliares das composições, itens, artefatos e fontes de pesquisa.
• Registrados os triggers de atualização automática de `updated_at` das composições, itens e artefatos.

v1.0.21 (15/06/2026) — E18: base mínima de `commercial_activation`
• `content_templates`: versionamento por chave/slug + versão e leitura server-side.
• `content_template_taxons`: leitura server-side para resolução determinística do vínculo template + taxon.
• Adicionadas composições versionadas por template + taxon, itens ordenados, artefatos publicados e vínculo rastreável às pesquisas.
• Novos objetos com RLS ativo, sem acesso público e com SELECT restrito ao `service_role`.

v1.0.20 (15/06/2026) — E10.6: correção da auditoria de eventos comerciais
• Atualizados os campos relevantes de `audit_logs`, distinguindo `action`, `event` e `changes_json`.
• Registrada a assinatura e o comportamento de `public.audit_context_event`.
• Registrado que eventos de contexto usam `action = 'insert'` e armazenam o nome normalizado em `event`.
• Registrada a migration `20260614124000_fix_audit_context_event_event_column.sql`, aplicada e validada no Supabase.
v1.0.19 (11/06/2026) — Drift confirmado durante a extração da baseline
• Atualizado `account_taxonomy_source_type_chk` com `user_confirmed_ai`, conforme estado remoto.
• Registrados os campos `user_*`, checks e FK de confirmação do usuário em `account_niche_resolutions`.

v1.0.18 (09/06/2026) — E10.5.6.7: grants de leitura server-side para pesquisa comercial
• Registrado `service_role` com SELECT em `taxon_market_research` e `taxon_market_research_items`, limitado ao consumo server-side da resolução do template comercial.

v1.0.17 (14/05/2026) — E10.5.6: IA Structured Outputs em account_niche_resolutions
• Registradas colunas `ai_*` em `account_niche_resolutions` para persistência da saída estruturada da IA.
• Registrados checks, FK e índice relacionados à resolução complementar com IA.
• Registrado que a IA persiste apenas resolução operacional e não grava vínculo oficial em `account_taxonomy`.

v1.0.16 (11/05/2026) — E10.5.6: grants operacionais para account_taxonomy
• Registrado `service_role` com SELECT, INSERT e UPDATE em `account_taxonomy`.
• Registrado que `anon`, `authenticated` e `public` permanecem sem acesso direto.
• Registrada ausência de constraint/índice para apenas um `is_primary = true` por conta nesta etapa.

v1.0.15 (11/05/2026) — E10.5.6: account_niche_resolutions
• Registrada a tabela `account_niche_resolutions` como persistência operacional da resolução atual da conta.
• Registradas PK/FKs, constraints principais, RLS, policies admin-only e permissões operacionais de `service_role`.
• Registrado o trigger `account_niche_resolutions_set_updated_at`.
• Registrado `service_role` com SELECT em `business_taxons` e `business_taxon_aliases`.

v1.0.14 (09/05/2026) — E10.5.6: matching determinístico inicial de taxonomia
• Registrada a extensão `pg_trgm` no schema `extensions`.
• Registrados índices auxiliares em `business_taxons` e `business_taxon_aliases` para normalização, FTS e trigram.
• Registradas as funções `normalize_taxon_match_text(text)` e `match_business_taxons_deterministic(text, integer)`, com SECURITY DEFINER=false e grants restritos a `service_role`.
• Registrado o contrato de retorno da RPC com candidatos oficiais, `match_source` e `score`.

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
