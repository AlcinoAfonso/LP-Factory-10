-- E20.8: verificação estritamente read-only da autoridade factual corrente.
with checks as (
  select
    to_regclass('public.taxon_factual_fields') is not null as table_exists,
    to_regclass('public.landing_page_input_catalog_drafts') is null as draft_removed,
    not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'business_taxons' and column_name = 'reviewed_input_catalog_version'
    ) as review_marker_removed,
    (select count(*) = 25 from public.taxon_factual_fields) as seed_count,
    (select count(*) filter (where taxon_id is null) = 16 from public.taxon_factual_fields) as universal_count,
    (select count(*) filter (where taxon_id = 'f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid) = 4 from public.taxon_factual_fields) as segment_count,
    (select count(*) filter (where taxon_id = 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid) = 5 from public.taxon_factual_fields) as niche_count,
    not exists (select 1 from public.taxon_factual_fields where taxon_id is not null and taxon_id not in ('f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid, 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid)) as no_ultra_residency,
    not exists (
      select 1 from public.taxon_factual_fields
      where definition ?| array['allowedPlans','version','evidence','originLayer','retiredInVersion']
    ) as no_legacy_properties,
    (select relrowsecurity from pg_class where oid = 'public.taxon_factual_fields'::regclass) as rls_enabled,
    not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'taxon_factual_fields') as no_public_policies,
    has_table_privilege('service_role', 'public.taxon_factual_fields', 'select,insert,update') as service_role_allowed,
    not has_table_privilege('service_role', 'public.taxon_factual_fields', 'delete') and not has_table_privilege('service_role', 'public.taxon_factual_fields', 'truncate') as service_role_destructive_denied,
    not has_table_privilege('authenticated', 'public.taxon_factual_fields', 'select,insert,update,delete') as authenticated_denied,
    not has_table_privilege('anon', 'public.taxon_factual_fields', 'select,insert,update,delete') as anon_denied,
    not has_table_privilege('ai_readonly', 'public.taxon_factual_fields', 'select,insert,update,delete') as ai_readonly_denied,
    not exists (
      select 1 from pg_class c, lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
      where c.oid = 'public.taxon_factual_fields'::regclass and a.grantee = 0
        and a.privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE')
    ) as public_denied,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_pkey' and contype = 'p') as primary_key_present,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_field_key_key' and contype = 'u') as field_key_unique,
    (select count(*) = 3 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and contype = 'f') as foreign_keys_present,
    (select count(*) = 3 from pg_indexes where schemaname = 'public' and tablename = 'taxon_factual_fields' and indexname in ('taxon_factual_fields_taxon_id_idx','taxon_factual_fields_created_by_idx','taxon_factual_fields_updated_by_idx')) as indexes_present,
    exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_definition_strict_chk' and pg_get_constraintdef(oid) like '%e20_8_factual_field_definition_is_valid%') as strict_definition_constraint,
    to_regprocedure('public.e20_8_factual_field_definition_is_valid(jsonb)') is not null as strict_definition_function,
    has_function_privilege('service_role', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute')
      and not has_function_privilege('authenticated', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute')
      and not has_function_privilege('anon', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute')
      and not has_function_privilege('ai_readonly', 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'execute') as strict_function_grants,
    not exists (select 1 from public.openai_workload_operational_configurations where workload = 'landing_page_dynamic_market_research') as retired_unit_removed,
    (select count(*) >= 2 from public.openai_workload_configuration_revisions where workload = 'landing_page_dynamic_market_research') as retired_revisions_preserved,
    (select count(*) >= 2 from public.openai_workload_configuration_activations where workload = 'landing_page_dynamic_market_research') as retired_activations_preserved,
    exists (
      select 1 from pg_trigger
      where tgrelid = 'public.taxon_factual_fields'::regclass
        and tgname = 'taxon_factual_fields_set_updated_at' and not tgisinternal
    ) as updated_at_trigger
), verdict as (
  select *, table_exists and draft_removed and review_marker_removed and seed_count and universal_count and segment_count and niche_count and no_ultra_residency
    and no_legacy_properties and rls_enabled and no_public_policies and service_role_allowed
    and service_role_destructive_denied and authenticated_denied and anon_denied and ai_readonly_denied and public_denied
    and primary_key_present and field_key_unique and foreign_keys_present and indexes_present
    and strict_definition_constraint and strict_definition_function and strict_function_grants and retired_unit_removed
    and retired_revisions_preserved and retired_activations_preserved and updated_at_trigger as passed
  from checks
)
select 1 / passed::integer as fail_closed, * from verdict;

select field_key, taxon_id, definition->>'valueScope' as value_scope, is_active
from public.taxon_factual_fields
order by taxon_id nulls first, field_key;
