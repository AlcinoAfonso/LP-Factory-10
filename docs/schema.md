0. Introdução

0.1 Cabeçalho
• Data da última atualização: 28/08/2026
• Documento: LP Factory 10 — Schema (DB Contract) v1.0.59

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
• RLS: habilitado
• Grants finais versionados: `authenticated` com SELECT; `service_role` com SELECT, INSERT e UPDATE, sem DELETE; `ai_readonly` permanece somente com SELECT.
• Mutações operacionais de membros ocorrem somente no boundary server-only autorizado; o Trigger Hub e a proteção do último owner permanecem ativos.
1.2.3 Policies
• account_users_select_self_or_admin (SELECT): vínculo próprio, owner/admin ativo da conta ou platform admin.
• account_users_insert_by_admins (INSERT): owner/admin ativo da conta ou platform admin.
• account_users_update_by_admins (UPDATE): owner/admin ativo da conta ou platform admin, em USING e WITH CHECK.
• account_users_delete_by_admins (DELETE): owner/admin ativo da conta ou platform admin; o runtime E11 não usa DELETE.
1.2.4 Migration relacionada
• `supabase/migrations/20260727155312_e11_account_members_security.sql` versiona os grants e ACLs finais; o apply permanece reservado ao fluxo automático posterior ao merge.

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

1.5.7 stripe_webhook_events
1.5.7.1 Função
• Idempotência e auditoria operacional mínima de eventos Stripe.
• Não armazena payload bruto, secrets, dados de cartão ou PII.

1.5.7.2 Colunas
• id uuid primary key default gen_random_uuid()
• event_id text not null
• event_type text not null
• provider text not null default 'stripe'
• processing_status text not null
• account_id uuid null
• entitlement_id uuid null
• external_reference text null
• error_code text null
• metadata_json jsonb not null default '{}'::jsonb
• received_at timestamptz not null default now()
• processed_at timestamptz null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.5.7.3 Constraints e relacionamentos
• UNIQUE: event_id
• CHECK: provider = 'stripe'
• CHECK: processing_status IN ('processing', 'processed', 'ignored', 'failed')
• CHECK: event_id não vazio
• CHECK: event_type não vazio
• CHECK: external_reference não vazio quando existir
• CHECK: error_code não vazio quando existir
• CHECK: metadata_json deve ser objeto JSON
• FK: account_id → accounts(id) ON UPDATE CASCADE ON DELETE SET NULL
• FK: entitlement_id → account_commercial_entitlements(id) ON UPDATE CASCADE ON DELETE SET NULL

1.5.7.4 Índices
• stripe_webhook_events_event_type_idx
• stripe_webhook_events_processing_status_idx
• stripe_webhook_events_account_id_idx
• stripe_webhook_events_external_reference_idx parcial quando external_reference IS NOT NULL

1.5.7.5 Segurança
• Trigger: stripe_webhook_events_set_updated_at usa public.tg_set_updated_at()
• RLS: ativo
• Grants: service_role com SELECT, INSERT e UPDATE
• public, anon e authenticated sem grants

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
• Rollout expand da E19.5 tolera `draft | active | archived`, sem alterar linhas existentes; criação corrente e default permanecem `draft`.

1.9.2 Colunas
• id uuid primary key default gen_random_uuid()
• account_id uuid not null
• name text not null
• slug text not null
• status text not null default 'draft'
• approved_materialization_id uuid null
• created_by uuid not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.9.3 Relacionamentos
• account_id referencia public.accounts(id) com ON UPDATE CASCADE e ON DELETE CASCADE.
• `(approved_materialization_id, id, account_id)` referencia `(id, landing_page_id, account_id)` de public.account_landing_page_materializations com ON UPDATE RESTRICT, ON DELETE NO ACTION e validação DEFERRABLE INITIALLY DEFERRED.
• created_by referencia auth.users(id) com ON UPDATE CASCADE e ON DELETE RESTRICT.

1.9.4 Constraints
• account_landing_pages_status_chk: status in ('draft', 'active', 'archived').
• account_landing_pages_slug_chk: slug no padrão seguro `^[a-z0-9]+(-[a-z0-9]+)*$`.
• account_landing_pages_name_chk: nome não vazio após trim.
• account_landing_pages_account_slug_uidx: UNIQUE (account_id, slug).
• account_landing_pages_id_account_id_key: UNIQUE (id, account_id), usado pelo vínculo tenant-safe da configuração de onboarding.
• account_landing_pages_approved_materialization_fkey: a revisão aprovada deve pertencer à mesma LP e conta; o ponteiro nulo significa ausência de aprovação explícita.

1.9.5 Índices
• account_landing_pages_account_id_idx em account_id.
• account_landing_pages_created_by_idx em created_by.
• account_landing_pages_status_idx em status.
• account_landing_pages_account_status_updated_idx em account_id, status, updated_at desc e id para paginação determinística do workspace.

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
• Criação corrente permanece apenas `draft`; `active` e `archived` estão reservados ao runtime funcional E19.5.
• O precursor expand não executa backfill, não muda o default e não retira suporte a `draft`.
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
• CHECK: business_taxons_selected_end_customer_research_version_chk (selected_end_customer_research_version IS NULL OR selected_end_customer_research_version > 0)
• CHECK: business_taxons_reviewed_input_catalog_version_chk (reviewed_input_catalog_version IS NULL OR reviewed_input_catalog_version > 0)
• FK: parent_id → business_taxons(id) ON UPDATE CASCADE ON DELETE SET NULL

1.11.2 Campos
• parent_id uuid null
• level text not null
• name text not null
• slug text not null
• is_active boolean not null default true
• selected_end_customer_research_version integer null
• reviewed_input_catalog_version integer null

1.11.3 Segurança
• Trigger Hub: não
• RLS: ativo (enable row level security)
• service_role: SELECT; sem UPDATE da tabela inteira; UPDATE somente em is_active, name, reviewed_input_catalog_version, selected_end_customer_research_version e slug
• anon/authenticated: sem UPDATE em selected_end_customer_research_version e reviewed_input_catalog_version

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
• UNIQUE parcial: account_taxonomy_one_active_primary_idx em (account_id) WHERE is_primary = true AND status = 'active'; garante no máximo um vínculo primário ativo por conta, permite zero e preserva múltiplos vínculos não primários ou inativos.

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

1.26 account_landing_page_onboarding_configurations
1.26.1 Função
• Agregado versionado e retomável da configuração mínima de onboarding da primeira LP Starter por conta.
• A completude é derivada dos valores válidos do catálogo aplicável; não há `onboarding_status` persistido.

1.26.2 Colunas
• account_id uuid primary key
• landing_page_id uuid null
• catalog_version integer not null
• `values` jsonb not null default '{}'::jsonb
• revision bigint not null default 1
• created_by uuid not null
• updated_by uuid not null
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.26.3 Relacionamentos e constraints
• account_id referencia public.accounts(id) com ON UPDATE CASCADE e ON DELETE CASCADE.
• `(landing_page_id, account_id)` referencia `(id, account_id)` de public.account_landing_pages com ON UPDATE CASCADE e ON DELETE RESTRICT.
• created_by e updated_by referenciam auth.users(id) com ON UPDATE CASCADE e ON DELETE RESTRICT.
• `catalog_version > 0`, `revision > 0` e `jsonb_typeof(values) = 'object'`.
• A PK em account_id mantém exatamente uma configuração por conta.

1.26.4 Índice
• `account_landing_page_onboarding_configurations_landing_page_id_idx`: btree parcial em landing_page_id quando não nulo.

1.26.5 Segurança e triggers
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT, INSERT e UPDATE; sem DELETE.
• `account_landing_page_onboarding_configurations_set_updated_at`: executa `public.tg_set_updated_at()` antes de UPDATE.
• `account_landing_page_onboarding_configurations_prevent_rebind`: trigger BEFORE UPDATE de landing_page_id; permite somente NULL → draft válido da mesma conta e rejeita rebind ou desvinculação.
• `public.prevent_account_landing_page_onboarding_rebind()`: SECURITY INVOKER, search_path fixado e sem EXECUTE para roles externas.

1.26.6 Observações de escopo
• A configuração parcial permanece neste agregado e não é copiada para `account_landing_pages`.
• Logo permanece opcional; não há bucket, Storage, Blob, URL ou infraestrutura de assets neste contrato.
• O agregado não participa do Trigger Hub.

1.27 account_landing_page_materializations
1.27.1 Estado hospedado atual — revisões append-only 1:N
• O mesmo agregado histórico foi evoluído para revisões append-only 1:N de uma landing page em `draft`; não existe entidade concorrente de revisões.
• A migration `supabase/migrations/20260817180000_e19_4_4_landing_page_revisions.sql` está aplicada no ambiente hospedado. O readiness retornou `ready: true` e `schema_version: 1`, e o verificador SQL read-only aprovou colunas, constraints, índices, invariantes, segurança, RPC, bucket e policies.
• A linha histórica foi preservada como revisão 1. Novos appends criaram as revisões 2 e 3 sem overwrite; a revisão corrente é a linha válida de maior `revision_number` da LP, sem flag mutável.

1.27.2 Colunas
• id uuid primary key default gen_random_uuid()
• landing_page_id uuid not null
• account_id uuid not null
• revision_number bigint not null, positivo
• attempt_id uuid nullable somente para materializações históricas anteriores à evolução 1:N
• content_json jsonb not null
• generation_context_snapshot_json jsonb not null
• created_by uuid not null
• created_at timestamptz not null default now()

1.27.3 Relacionamentos e constraints
• `(landing_page_id, account_id)` referencia `(id, account_id)` de public.account_landing_pages com ON UPDATE RESTRICT e ON DELETE CASCADE.
• account_id referencia public.accounts(id) com ON UPDATE RESTRICT e ON DELETE CASCADE.
• created_by referencia auth.users(id) com ON UPDATE RESTRICT e ON DELETE RESTRICT.
• `(landing_page_id, revision_number)` é único; `attempt_id` é único quando não nulo.
• `(id, landing_page_id, account_id)` é único e sustenta o ponteiro tenant-safe de aprovação explícita em `account_landing_pages`.
• Linhas históricas recebem novo `id` e `revision_number = 1`, preservando conteúdo, snapshot, autoria e timestamp.
• `content_json` e `generation_context_snapshot_json` devem ser objetos JSON.

1.27.4 Índices
• `account_landing_page_materializations_account_id_idx`: btree em account_id.
• `account_landing_page_materializations_created_by_idx`: btree em created_by.
• `account_landing_page_materializations_attempt_id_uidx`: unicidade parcial de attempt_id não nulo.
• `account_landing_page_materializations_current_idx`: btree em account_id, landing_page_id e revision_number desc.

1.27.5 Segurança e acesso
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT direto; sem INSERT, UPDATE, DELETE ou TRUNCATE direto.
• `public.append_account_landing_page_materialization_v1(...)`: SECURITY DEFINER, owner postgres, search_path fixado, EXECUTE exclusivo de service_role e append tenant-safe sob lock da LP pai.
• `public.e19_4_landing_page_revision_readiness()`: probe read-only com EXECUTE exclusivo de service_role.
• Não há trigger nem participação no Trigger Hub.

1.27.6 Contrato operacional
• O append valida conta, LP operacional em `draft | active`, attempt, conteúdo e snapshot; `archived` rejeita attempts inéditos, enquanto retry tenant-safe do mesmo `attempt_id` já materializado retorna a revisão existente mesmo após arquivamento, sem overwrite.
• O conteúdo final combina apresentação validada, bindings determinísticos e referência canônica da mídia. O snapshot preserva contexto autorizado, configurações, usage, latência, validações e custo indisponível, sem secret, resposta bruta, raciocínio privado ou URL assinada.
• A leitura corrente server-only ordena por revision_number desc no par tenant-scoped e valida integralmente conteúdo e snapshot.
• Migration histórica preservada: `supabase/migrations/20260811133500_e19_4_4_landing_page_materializations.sql`.
• Evolução 1:N aplicada: `supabase/migrations/20260817180000_e19_4_4_landing_page_revisions.sql`.
• Verificação read-only: `supabase/snippets/e19_4_4_landing_page_materializations_verify.sql`; casos SQL: `supabase/tests/e19_4_4_landing_page_materializations.test.sql`.
• Expand backward-compatible repo-only: `supabase/migrations/20260820214422_e19_5_expand_landing_page_status.sql`; verificação `supabase/snippets/e19_5_expand_landing_page_status_verify.sql`; casos SQL `supabase/tests/e19_5_expand_landing_page_status.test.sql`.

1.27.7 Storage privado
• O bucket privado `landing-page-revision-assets` está ativo no ambiente hospedado com limite de 5 MB e MIME permitido somente `image/webp`.
• Nenhuma policy de storage.objects concede leitura ou escrita direta do bucket a anon ou authenticated.
• A identidade persistida da mídia usa bucket e path estáveis com metadata; URL assinada é temporária, server-side e nunca integra a identidade do asset.

1.28 openai_workload_operational_configurations
1.28.1 Função e unidade
• Agregado operacional aplicado da E21.2.3 com exatamente uma linha por `environment + workload`.
• `environment` aceita somente `production | preview`; Development permanece fora desta residência dinâmica.
• A PK composta `(environment, workload)` é o lock canônico das RPCs e impede mais de uma unidade para a mesma combinação.
• A migration forward-only `supabase/migrations/20260820190422_e21_2_3_openai_workload_operational_configurations.sql` está aplicada no ambiente hospedado; o snippet read-only aprovou 10/10 verificações e o Security Controls não apresentou alerta incompatível com o agregado ou suas RPCs.
• A migration incremental forward-only `supabase/migrations/20260820213900_e21_2_taxon_input_catalog_sufficiency_workload.sql` também está aplicada no ambiente hospedado e estende o mesmo agregado com `taxon_input_catalog_sufficiency_evaluation`, sem nova entidade ou tabela de negócio; os testes SQL, snippets read-only e invariantes pós-apply foram aprovados, e o Security Controls reportou para as três tabelas apenas o INFO esperado de RLS sem policy, compatível com a residência service-only sem grants públicos.

1.28.2 Colunas
• environment text not null
• workload text not null
• modality text not null (`responses_text | image_generation`, derivada pelo workload)
• active_revision_id uuid not null
• pending_revision_id uuid null
• candidate_model text null
• candidate_reasoning_effort text null
• candidate_quality text null
• candidate_saved_by uuid null
• candidate_saved_at timestamptz null
• configuration_version bigint not null default 1
• created_at timestamptz not null default now()
• updated_at timestamptz not null default now()

1.28.3 Relacionamentos e invariantes
• `(active_revision_id, environment, workload)` e `(pending_revision_id, environment, workload)` referenciam a chave candidata `(id, environment, workload)` de `openai_workload_configuration_revisions`, sempre com ON UPDATE RESTRICT e ON DELETE RESTRICT.
• candidate_saved_by referencia auth.users(id) com ON UPDATE RESTRICT e ON DELETE RESTRICT.
• Exatamente um entre candidata mutável e revisão validada pendente pode existir; candidata ausente exige que todos os seus campos sejam nulos.
• pending_revision_id deve ser nulo ou diferente de active_revision_id; uma revisão já ativa não constitui substituição pendente.
• Candidata textual exige identificador técnico de modelo e `reasoning_effort` em `none | low | medium | high | xhigh | max`, sempre sem quality; sua elegibilidade corrente é revalidada nas tabelas do catálogo E21.2.5.
• Candidata de imagem exige identificador técnico de modelo e `quality` em `low | medium | high`, sem reasoning_effort; disponibilidade corrente não integra o snapshot da unidade.
• configuration_version é positivo e funciona como token otimista obrigatório de toda transição.

1.28.4 Índices, bootstrap e segurança
• `openai_workload_operational_configurations_active_revision_idx`: btree em active_revision_id + unidade.
• `openai_workload_operational_configurations_pending_revision_idx`: btree parcial em pending_revision_id + unidade quando não nulo.
• O bootstrap idempotente cria as dez unidades Production/Preview × cinco workloads, sem candidata ou revisão pendente e com active_revision_id na revisão 1 correspondente.
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT e UPDATE somente dos nove campos necessários às transições; sem INSERT, DELETE ou TRUNCATE.

1.29 openai_workload_configuration_revisions
1.29.1 Função e colunas
• Snapshots validados e append-only da configuração operacional por unidade.
• id uuid primary key default gen_random_uuid()
• environment text not null
• workload text not null
• modality text not null
• revision_number bigint not null e positivo
• model text not null
• reasoning_effort text null
• quality text null
• validated_by uuid null somente no bootstrap
• validated_at timestamptz not null default now()
• proof_metadata jsonb not null

1.29.2 Relacionamentos, constraints e índices
• `(environment, workload, revision_number)` é único e `(id, environment, workload)` é chave candidata unit-safe para os ponteiros e eventos.
• validated_by referencia auth.users(id) com ON UPDATE RESTRICT e ON DELETE RESTRICT.
• Ambiente e workload permanecem fechados; modalidade, identificador técnico do modelo e parâmetro tipado preservam o shape da revisão sem exigir disponibilidade corrente no catálogo.
• proof_metadata é objeto JSON fechado às chaves `schema_version`, `proof_kind`, `proof_result`, `request_id`, `provider_request_id`, `latency_ms`, `contract_version` e `source`; chaves adicionais são rejeitadas.
• `schema_version` é obrigatório, número inteiro JSON e exatamente 1; `proof_kind` é string obrigatória `bootstrap | operational`; `proof_result` é string obrigatória e exatamente `approved`.
• `request_id` e `provider_request_id` podem estar ausentes ou ser JSON null; quando presentes como valor, são strings de 1 a 128 caracteres no formato técnico `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`.
• `latency_ms` pode estar ausente ou ser JSON null; quando presente como valor, é número inteiro JSON entre 0 e 900000 inclusive.
• `contract_version` pode estar ausente ou ser JSON null; quando presente como valor, é número inteiro JSON entre 1 e 1000 inclusive.
• `source` é string obrigatória e vinculada ao kind: `repo_catalog` para `bootstrap` e `openai_api` para `operational`.
• Revisão bootstrap preserva source `repo_catalog`, resultado aprovado e validated_by nulo; revisão operacional exige source `openai_api`, prova aprovada e validated_by não nulo. Prompt, resposta, secret, PII, payload de negócio e raciocínio privado não têm chave aceita.
• `openai_workload_configuration_revisions_validated_by_idx`: btree parcial em validated_by quando não nulo.

1.29.3 Segurança e imutabilidade
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT e INSERT; sem UPDATE, DELETE ou TRUNCATE.
• O trigger `openai_workload_configuration_revisions_append_only` rejeita UPDATE e DELETE inclusive quando houver privilégio superior ao grant operacional.

1.30 openai_workload_configuration_activations
1.30.1 Função e colunas
• Histórico append-only de `bootstrap | activate | rollback`, ordenado por activation_number dentro da unidade.
• id uuid primary key default gen_random_uuid()
• environment text not null
• workload text not null
• modality text not null
• activation_number bigint not null e positivo
• event_type text not null
• previous_revision_id uuid null somente no bootstrap
• target_revision_id uuid not null
• actor_user_id uuid null somente no bootstrap
• created_at timestamptz not null default now()

1.30.2 Relacionamentos, lifecycle e índices
• `(environment, workload, activation_number)` é único.
• previous_revision_id e target_revision_id usam FKs compostas unit-safe para `(id, environment, workload)` de revisões, com ON UPDATE RESTRICT e ON DELETE RESTRICT.
• actor_user_id referencia auth.users(id) com ON UPDATE RESTRICT e ON DELETE RESTRICT.
• O evento bootstrap é sempre activation_number 1, sem anterior e sem ator; activate/rollback exigem sequência posterior, anterior diferente do alvo e ator humano não nulo.
• Índices compostos sustentam as FKs de target_revision_id e previous_revision_id; índice parcial cobre actor_user_id não nulo.

1.30.3 Segurança e imutabilidade
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT e INSERT; sem UPDATE, DELETE ou TRUNCATE.
• O trigger `openai_workload_configuration_activations_append_only` rejeita UPDATE e DELETE.
• O snippet read-only `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql` comprova bootstrap, cardinalidade, referências, lifecycle, colunas, constraints, índices, RLS, grants, RPCs, triggers e drift.
• Os casos SQL focais residem em `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql` e executam dentro de transação com rollback.

1.31 account_landing_page_shared_configurations
1.31.1 Função e residência
• Residência operacional lazy dos fields E20.2 com `scope = account | business`, compartilhada pelas LPs da conta.
• A linha pode não existir enquanto nenhum valor compartilhado tiver sido salvo; ausência não equivale a incompletude persistida.
• O shape de `values` permanece declarativo por `scope`; a tabela não replica uma lista de fields do catálogo.

1.31.2 Colunas e constraints
• account_id uuid primary key
• catalog_version integer not null e positivo
• values jsonb not null default '{}'::jsonb
• revision bigint not null default 1 e positiva
• created_by uuid not null; updated_by uuid not null
• created_at timestamptz not null default now(); updated_at timestamptz not null default now()
• account_id referencia public.accounts(id) com ON UPDATE CASCADE e ON DELETE CASCADE.
• created_by e updated_by referenciam auth.users(id) com ON UPDATE CASCADE e ON DELETE RESTRICT.
• O check de shape aceita somente objetos `{ scope, value }` com scope `account | business`; sem colunas de initialized, complete ou status.

1.31.3 Segurança e ciclo de vida
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT, INSERT e UPDATE; sem DELETE ou TRUNCATE.
• O trigger `account_landing_page_shared_configurations_set_updated_at` atualiza updated_at antes de update.
• Não há backfill, placeholder ou criação eager.

1.32 account_landing_page_configurations
1.32.1 Função e residência
• Residência operacional lazy por LP dos fields E20.2 com `scope = offer | campaign | landing_page`.
• A linha nasce no primeiro save da LP; configuração parcial é válida e completude continua derivada em runtime pela versão atual explícita do catálogo repo-only.
• O shape de `values` permanece declarativo por `scope`; a tabela não replica uma lista de fields do catálogo.

1.32.2 Colunas, constraints e índice
• landing_page_id uuid primary key; account_id uuid not null
• catalog_version integer not null e positivo
• values jsonb not null default '{}'::jsonb
• revision bigint not null default 1 e positiva
• created_by uuid not null; updated_by uuid not null
• created_at timestamptz not null default now(); updated_at timestamptz not null default now()
• `(landing_page_id, account_id)` referencia `(id, account_id)` de public.account_landing_pages com ON UPDATE CASCADE e ON DELETE CASCADE.
• account_id referencia public.accounts(id) com ON UPDATE CASCADE e ON DELETE CASCADE; created_by e updated_by referenciam auth.users(id) com ON UPDATE CASCADE e ON DELETE RESTRICT.
• O check de shape aceita somente objetos `{ scope, value }` com scope `offer | campaign | landing_page`; sem colunas de initialized, complete ou status.
• `account_landing_page_configurations_account_idx`: btree em account_id e landing_page_id.

1.32.3 Segurança e ciclo de vida
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT, INSERT e UPDATE; sem DELETE ou TRUNCATE.
• O trigger `account_landing_page_configurations_set_updated_at` atualiza updated_at antes de update.
• Não há backfill, placeholder, inicialização eager ou cópia da configuração histórica de onboarding para este agregado.
• O contrato foi aplicado no ambiente hospedado por `supabase/migrations/20260822170000_e19_5_3_landing_page_workspace.sql` e validado pelos testes e verificadores focais da E19.5.3.

1.33 openai_model_catalog_models
1.33.1 Função e colunas
• Catálogo global server-side das identidades de modelo elegíveis para novas candidatas, separado da revisão ativa por ambiente/workload.
• PK composta: `(modality, model)`; modality aceita `responses_text | image_generation` e model usa o formato técnico `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`.
• `available_for_selection boolean not null default false`; `catalog_version bigint not null default 1` e positivo.
• `updated_by uuid null` referencia `auth.users(id)` com ON UPDATE/DELETE RESTRICT; `created_at` e `updated_at` são timestamptz não nulos e monotônicos.
• Modelo novo nasce indisponível e deve possuir ao menos um parâmetro associado na mesma transação; o bootstrap idempotente cria Mini, Luna, Terra, Sol e GPT Image 2 disponíveis sem alterar lifecycle existente.

1.33.2 Segurança e imutabilidade de identidade
• RLS habilitado e nenhuma policy.
• public, anon, authenticated e ai_readonly: sem grants.
• service_role: SELECT, INSERT e UPDATE; sem DELETE ou TRUNCATE.
• O trigger `openai_model_catalog_models_prevent_delete` rejeita DELETE; o constraint trigger diferido `openai_model_catalog_model_has_parameter` impede modelo sem parâmetro.

1.34 openai_model_catalog_parameters
1.34.1 Função, chave e shape
• PK composta: `(modality, model, parameter_kind, parameter_value)`; FK `(modality, model)` referencia `openai_model_catalog_models` com ON UPDATE/DELETE RESTRICT.
• Texto aceita somente `parameter_kind = reasoning_effort` com valor `none | low | medium | high | xhigh | max`; imagem aceita somente `parameter_kind = quality` com valor `low | medium | high`.
• `available_for_selection boolean not null default false`; `catalog_version bigint not null default 1` e positivo; `updated_by`, `created_at` e `updated_at` seguem o contrato de auditoria do modelo.
• Uma combinação é elegível somente quando modelo e parâmetro exatos estão disponíveis; nenhuma combinação é inferida por produto cartesiano.

1.34.2 Segurança, artefatos e estado de apply
• RLS habilitado, zero policies e ACLs idênticas às da tabela de modelos; o trigger `openai_model_catalog_parameters_prevent_delete` rejeita DELETE.
• Migration forward-only: `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`.
• Teste transacional: `supabase/tests/e21_2_5_openai_model_catalog.test.sql`; verificador read-only: `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`.
• Estado atual: migration aplicada no ambiente hospedado pelo fluxo canônico; o verificador read-only aprovou 8/8 verificações e o Security Controls não apresentou alerta incompatível com as tabelas, constraints, RLS, policies, ACLs, RPCs ou triggers do catálogo. O INFO de RLS sem policy é esperado e compatível com acesso exclusivo por service_role.

1.35 landing_page_input_catalog_drafts
1.35.1 Função e autoridade
• Residência singleton do único próximo draft administrativo do catálogo E20.2; o conteúdo é mutável e não operacional.
• A tabela não armazena nem replica as versões publicadas e não define a versão atual. Registry, versionamento publicado e declaração de versão atual permanecem autoridade exclusiva do repositório implantado.
• base_version e target_version são inteiros positivos e sequenciais; catalog_json é objeto JSON; revision é bigint positiva e suporta concorrência otimista.

1.35.2 Evidências e constraints
• content_fingerprint é SHA-256 hexadecimal obrigatório; validation_fingerprint/validation_context_fingerprint/validated_at e publication_fingerprint/publication_context_fingerprint/publication_prepared_at formam conjuntos consistentes.
• Evidência de publicação só pode referenciar o mesmo conteúdo e a mesma coleção operacional integral validados. Drift de taxonomia, configuração E19.2 pré-handoff, configuração E19.5, LP ou elegibilidade torna o handoff stale. O registro significa handoff repo-only preparado, não publicação, ativação ou autoridade operacional.
• taxon_review_evidence é objeto JSON server-only de decisões humanas pré-publicação vinculadas ao fingerprint exato do conteúdo e do contexto E20.6.5; editar o draft limpa essas evidências, e registrá-las não atualiza reviewed_input_catalog_version.
• singleton é a primary key booleana e aceita somente true; no máximo uma linha pode existir.
• created_by e updated_by referenciam auth.users(id) com ON UPDATE CASCADE e ON DELETE RESTRICT; created_at e updated_at são timestamptz não nulos, e trigger canônico mantém updated_at.

1.35.3 Segurança e artefatos
• RLS habilitado e nenhuma policy; public, anon, authenticated e ai_readonly não possuem grants.
• service_role possui SELECT, INSERT, UPDATE e DELETE; não há acesso direto do client.
• DELETE é usado somente pela reconciliação humana no runtime de Production pós-deploy, depois de o boundary comprovar que versão atual, conteúdo e fingerprint do registry implantado correspondem exatamente ao draft congelado.
• Migration forward-only: `supabase/migrations/20260824180000_e20_2_8_input_catalog_lifecycle.sql`; teste transacional: `supabase/tests/e20_2_8_input_catalog_lifecycle.test.sql`; verificador read-only: `supabase/snippets/e20_2_8_input_catalog_lifecycle_verify.sql`.
• A migration não cria linha e não migra v1–v5. O apply hospedado foi concluído em 25/08/2026; o verificador read-only aprovou 4/4 checks, o teste SQL transacional foi aprovado sem resíduos e o Security Controls apresentou somente o INFO esperado de RLS sem policy, compatível com acesso exclusivo por service_role.

1.36 openai_lp_cost_events
1.36.1 Função e identidade
• Residência financeira prospectiva append-only, limitada a `landing_page_draft_generation` e `landing_page_draft_image_generation` em Production.
• Cada tentativa usa `attempt_id`, `account_id`, `landing_page_id`, workload e `event_kind = started | terminal`; `(attempt_id, workload, event_kind)` é único e torna retries idempotentes.
• A FK composta `(landing_page_id, account_id)` referencia `account_landing_pages(id, account_id)` com ON UPDATE/DELETE RESTRICT e impede atribuição cruzada entre tenants.
• Eventos started preservam configuração e versão de preço sem result, usage ou custo; eventos terminal preservam `success | failure` e podem ter custo nulo quando as unidades do provider não forem suficientes.

1.36.2 Configuração, usage e custo
• Texto exige reasoning_effort tipado e não aceita quality/size; imagem exige quality e size `1536x1024` e não aceita reasoning_effort.
• `usage_json` e `pricing_json` aceitam somente objetos quando presentes; `cost_usd numeric(30,12)` é USD não negativo e só pode existir junto dos dois objetos.
• Prompt, resposta integral, payload de negócio, PII e secrets não integram a tabela.
• O índice parcial `openai_lp_cost_events_period_idx` cobre created_at, conta, LP e workload somente nos terminais.

1.36.3 Segurança, imutabilidade e estado de apply
• RLS habilitado e zero policies; public, anon, authenticated e ai_readonly sem grants.
• service_role possui somente SELECT e INSERT, sem UPDATE, DELETE ou TRUNCATE.
• O trigger `openai_lp_cost_events_prevent_mutation` rejeita UPDATE e DELETE mesmo sob privilégio superior.
• Migration repo-only: `supabase/migrations/20260828131456_e21_4_4_openai_lp_cost_tracking.sql`; apply hospedado permanece reservado ao pós-merge canônico.
• Teste transacional: `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`; verificador read-only: `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`.

1.37 openai_lp_cost_coverage
1.37.1 Função e invariantes
• Singleton imutável da data de corte em Production; a PK booleana aceita somente true e permite no máximo uma linha.
• `activated_at` não pode estar no futuro nem depois de created_at. A ausência da linha significa que a cobertura prospectiva ainda não foi ativada.

1.37.2 Segurança e imutabilidade
• RLS habilitado e zero policies; ACLs idênticas às de `openai_lp_cost_events`.
• O trigger `openai_lp_cost_coverage_prevent_mutation` rejeita UPDATE e DELETE.
• O registro ocorre uma única vez, depois do smoke pós-apply em Production, pela RPC `register_openai_lp_cost_coverage_v1`.

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
• As funções legadas permanecem como objetos de banco, mas ficam retiradas do caminho operacional da E11.
• `accept_account_invite(uuid, integer)`, `revoke_account_invite(uuid, uuid)`, `invitation_expires_at(uuid, integer)` e `invitation_is_expired(uuid, integer)`: sem EXECUTE para PUBLIC, anon, authenticated e ai_readonly.
• `activate_user_from_auth_hook(jsonb)`: sem EXECUTE para PUBLIC, anon, authenticated, ai_readonly e supabase_auth_admin; o Auth Hook amplo não está configurado no projeto.
• Nenhuma função nova, RPC ou SECURITY DEFINER é criada pela E11.

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

3.7 Configuração operacional dos workloads OpenAI
3.7.1 RPCs versionadas
• `add_openai_model_catalog_model_v1(text, text, text, text[], uuid) → table`: adiciona modelo indisponível e conjunto inicial não vazio de parâmetros conhecidos.
• `set_openai_model_catalog_model_availability_v1(text, text, boolean, uuid, bigint) → bigint`: altera disponibilidade do modelo com versão otimista.
• `set_openai_model_catalog_parameter_availability_v1(text, text, text, text, boolean, uuid, bigint) → bigint`: altera disponibilidade do parâmetro sob locks modelo → parâmetro.
• `check_openai_model_catalog_configuration_available_v1(text, text, bigint) → table`: revalida em snapshot read-only a candidata vigente imediatamente antes da prova, sem manter lock durante o transporte.
• `save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint) → bigint`: salva ou edita candidata elegível no catálogo e retorna o novo configuration_version.
• `discard_openai_workload_configuration_candidate_v1(text, text, uuid, bigint) → bigint`: descarta integralmente a candidata e retorna o novo token.
• `promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint) → table`: revalida candidata e metadados da prova, anexa revisão imutável e instala seu ponteiro pendente na mesma transação.
• `activate_openai_workload_configuration_revision_v1(text, text, uuid, uuid, bigint) → bigint`: exige que o alvo seja a revisão pendente, troca a ativa, limpa a pendência e anexa evento activate atomicamente.
• `rollback_openai_workload_configuration_revision_v1(text, text, uuid, uuid, bigint) → bigint`: exige alvo anteriormente ativo, troca a ativa, limpa a pendência aplicável e anexa evento rollback sem duplicar revisão.

3.7.2 Concorrência e segurança
• Save e promoção bloqueiam primeiro a unidade `(environment, workload)` e depois modelo e parâmetro exatos; mutações do catálogo serializam sobre as mesmas linhas em ordem determinística. Ativação e rollback não consultam disponibilidade corrente.
• RPCs com token otimista comparam a versão esperada e falham integralmente para token stale ou transição incompatível.
• Todas usam SECURITY INVOKER e search_path fixado em pg_catalog; cada referência de tabela é schema-qualified.
• EXECUTE é exclusivo de service_role; PUBLIC, anon, authenticated e ai_readonly não executam as RPCs.
• O ator é obrigatório nas mutações e deve ser derivado pelo boundary server-side autorizado; as RPCs não concedem autoridade de platform_admin por si mesmas.

3.7.3 Helper de imutabilidade
• `prevent_openai_workload_append_only_mutation_v1() → trigger`: SECURITY INVOKER, search_path fixado, sem EXECUTE externo; rejeita UPDATE/DELETE nas revisões e ativações.

3.8 Workspace operacional de landing pages
3.8.1 Helpers internos
• `e19_5_actor_can_manage(uuid, uuid) → boolean`: SECURITY DEFINER, stable e read-only; confirma conta ativa e membership owner/admin ativa.
• `e19_5_configuration_values_have_scopes(jsonb, text[]) → boolean`: SECURITY INVOKER, immutable e valida somente o shape genérico `{ scope, value }` contra os scopes permitidos.
• EXECUTE dos helpers é exclusivo de service_role; public, anon, authenticated e ai_readonly não executam.

3.8.2 Save atômico versionado
• `save_account_landing_page_configuration_v1(uuid, uuid, jsonb, jsonb, bigint, bigint, integer, uuid, uuid) → table(shared_revision bigint, landing_page_revision bigint)` grava as duas residências em uma transação; o último argumento é a materialização mais recente observada durante a validação dos baselines de identidade.
• O RPC usa SECURITY INVOKER, search_path fixado, lock tenant-safe da LP, tokens otimistas independentes e comparação da última materialização; ausência esperada exige inexistência da linha, concorrência com append falha fechado e save sem mudança não incrementa revisão.
• `catalog_version` deve ser inteiro positivo e corresponde à versão efetiva corrente validada pelo boundary repo-only antes da chamada; o banco não deriva current ou latest. Scope drift, versão inválida, LP não operacional, ator sem autoridade ou revisão stale falham fechados.
• A residência compartilhada só é criada quando contém valor; a residência da LP nasce no primeiro save.
• EXECUTE exclusivo de service_role; public, anon, authenticated e ai_readonly não executam.

3.8.3 Aprovação explícita de revisão
• `approve_account_landing_page_materialization_v1(uuid, uuid, uuid, uuid) → uuid`: SECURITY INVOKER, search_path fixado e idempotente para o mesmo alvo.
• O RPC exige owner/admin ativo, LP e materialização da mesma conta, e atualiza apenas o ponteiro aprovado; revisão mais recente e revisão aprovada permanecem conceitos independentes.
• EXECUTE exclusivo de service_role; public, anon, authenticated e ai_readonly não executam.

3.8.4 Append com proveniência operacional
• `append_account_landing_page_materialization_v2(uuid, uuid, uuid, jsonb, jsonb, uuid, bigint, bigint) → table(materialization_id uuid, revision_number bigint)`: SECURITY INVOKER e search_path fixado; recebe as revisões compartilhada e específica usadas pelo contexto v4.
• O RPC preserva retry idempotente do mesmo attempt, bloqueia a LP, compara as duas revisões operacionais e só então delega ao append canônico v1 na mesma transação; save concorrente ou proveniência stale falham fechados sem revisão parcial.
• EXECUTE exclusivo de service_role; public, anon, authenticated e ai_readonly não executam.

3.9 Conflitos de domínio seguros na Data API
3.9.1 Helper transversal
• `raise_postgrest_safe_conflict_v1(text) → void`: SECURITY INVOKER, stable, owner postgres e search_path fixado em pg_catalog.
• EXECUTE direto exclusivo de service_role; public, anon, authenticated e ai_readonly sem EXECUTE.
• Em requisição PostgREST identificada por `request.method`, levanta SQLSTATE real `PGRST`, HTTP 409 e corpo JSON com `code = 40001`, mensagem preservada e details/hint nulos.
• Em chamada SQL direta, preserva SQLSTATE 40001 para manter testes transacionais e a semântica de rollback.

3.9.2 Regra e cobertura
• Conflito conhecido de versão ou revisão é terminal para a tentativa atual e exige releitura ou recarregamento; repetir a mesma entrada stale não é autorizado.
• RPC ou function de domínio exposta à Data API não deve levantar diretamente SQLSTATE 40001; deve usar o helper transversal.
• A migration `supabase/migrations/20260827203000_postgrest_safe_application_conflicts.sql` cobre as onze funções ativas que usavam 40001 como erro de domínio, sem alterar assinaturas, retornos, locks, search_path, ownership, segurança ou ACLs.
• Teste transacional: `supabase/tests/postgrest_safe_application_conflicts.test.sql`.
• Verificador read-only: `supabase/snippets/postgrest_safe_application_conflicts_verify.sql`.
• Estado no PR corretivo: repo-only; apply remoto reservado ao workflow canônico após merge humano.

3.10 Evidência prospectiva de custos OpenAI das Landing Pages
3.10.1 RPCs versionadas
• `append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text) → uuid`: anexa ou retorna idempotentemente o início tenant-safe da tentativa; conflito de identidade na mesma chave falha fechado.
• `append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric) → uuid`: exige início prévio, herda identidade/configuração e anexa ou retorna idempotentemente o terminal; retry divergente falha fechado.
• `register_openai_lp_cost_coverage_v1(timestamptz) → timestamptz`: cria uma única data de corte Production; retry idêntico é idempotente e qualquer tentativa de alteração falha fechado.
• `read_openai_lp_cost_events_v1(timestamptz, timestamptz) → setof record`: lê de forma ordenada os inícios do período, correlaciona no máximo um terminal e projeta somente identidade de conta/LP, workload, instantes, resultado e custo textual exato para paginação server-side.

3.10.2 Segurança e execução
• As quatro RPCs usam SECURITY INVOKER e search_path fixado em pg_catalog, com referências schema-qualified.
• EXECUTE é exclusivo de service_role; public, anon, authenticated e ai_readonly não executam as RPCs.
• `prevent_openai_lp_cost_mutation_v1() → trigger` não possui EXECUTE externo e rejeita UPDATE/DELETE nas duas residências.

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
• openai_workload_configuration_revisions_append_only: rejeita UPDATE e DELETE de revisões validadas.
• openai_workload_configuration_activations_append_only: rejeita UPDATE e DELETE de eventos de ativação/rollback.
• openai_lp_cost_events_prevent_mutation: rejeita UPDATE e DELETE dos eventos financeiros prospectivos.
• openai_lp_cost_coverage_prevent_mutation: rejeita UPDATE e DELETE da data de corte.

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
v1.0.60 (28/08/2026) — E21.4.5 read model administrativo de custos
• Adicionada à mesma migration ainda não aplicada a RPC read-only paginável `read_openai_lp_cost_events_v1`, com período validado, correlação determinística e projeção sanitizada para a visão conta → LP → texto/imagem.
• EXECUTE permanece exclusivo de `service_role`; teste transacional e snippet read-only cobrem o novo contrato e suas ACLs.

v1.0.59 (28/08/2026) — E21.4.4 evidência prospectiva de custos OpenAI das Landing Pages
• Registradas as tabelas repo-only `openai_lp_cost_events` e `openai_lp_cost_coverage`, com correlação tenant-safe, append-only, data de corte única, RLS sem policies e ACL service_role SELECT/INSERT.
• Registradas inicialmente as três RPCs de escrita/corte SECURITY INVOKER, triggers de imutabilidade, migration, teste transacional e verificador read-only; apply hospedado permanece pós-merge.

v1.0.58 (27/08/2026) — Conflitos de domínio seguros para PostgREST
• Versionado `raise_postgrest_safe_conflict_v1(text)` para transportar conflitos conhecidos como `PGRST`/HTTP 409 pela Data API, preservando `code = 40001` no corpo.
• Corrigidas as onze RPCs/functions ativas que usavam 40001 como erro de domínio; chamadas SQL diretas preservam 40001 para testes transacionais.
• Registrados migration, teste transacional e verificador read-only do corretivo; apply remoto permanece pós-merge pelo workflow canônico.

v1.0.49 (20/08/2026) — E19.5 precursor expand: ampliado o contrato repo-only de `account_landing_pages.status` para tolerar `draft | active | archived`, preservando default e criação corrente em `draft`, sem backfill; append e consumidores internos passam a tolerar `active`, enquanto `archived` bloqueia attempts inéditos e preserva retry idempotente tenant-safe de `attempt_id` já materializado.

v1.0.48 (20/08/2026) — E21.2.3: registrado o agregado candidato de configuração operacional dos workloads OpenAI com três tabelas públicas, oito baselines Production/Preview, FKs compostas unit-safe, candidata/pendência exclusivas, pendência distinta da revisão ativa, revisões e ativações append-only, token otimista, cinco RPCs SECURITY INVOKER, RLS sem policies, grants mínimos e verificação SQL read-only; apply hospedado permanece pós-merge.

v1.0.43 (17/08/2026) — E19.4.4: corrigido o estado factual de `account_landing_page_materializations` para registrar que a migration já está aplicada no ambiente hospedado, preservando o contrato 1:1 write-once, conteúdo e snapshot atômicos e ausência de UPDATE/DELETE para `service_role`.

v1.0.40 (11/08/2026) — E19.4.4: registrado o agregado repo-only `account_landing_page_materializations`, sua materialização 1:1 write-once, conteúdo e snapshot atômicos, projeção runtime estrita, RLS sem policies e acesso exclusivo SELECT/INSERT por `service_role`; apply hospedado permanece pós-merge.

v1.0.38 (08/08/2026) — E19.2: registrado o agregado `account_landing_page_onboarding_configurations`, a unicidade composta de `account_landing_pages` usada pelo FK tenant-safe, os checks, RLS, grants mínimos, triggers de atualização/write-once e a ausência de persistência prematura na tabela de LP.

v1.0.33 (26/07/2026) — E20.3: perfil de orientação para geração
• Registrado o contrato versionado das tabelas `landing_page_generation_profiles` e `landing_page_generation_profile_items`, sem perfis ou itens oficiais.
• Registradas FKs, checks, unicidades, RLS sem policies, ausência de acesso por papéis públicos e leitura exclusiva por `service_role`.
• Registrada a migration `20260726144651_e20_3_generation_profile.sql`, com apply automático somente após o merge e verificação read-only pós-apply por `e20_3_generation_profile_verify.sql`.

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
