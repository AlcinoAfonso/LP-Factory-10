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
    not exists (
      select 1 from public.taxon_factual_fields
      where definition ?| array['allowedPlans','version','evidence','originLayer','retiredInVersion']
    ) as no_legacy_properties,
    (select relrowsecurity from pg_class where oid = 'public.taxon_factual_fields'::regclass) as rls_enabled,
    not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'taxon_factual_fields') as no_public_policies,
    has_table_privilege('service_role', 'public.taxon_factual_fields', 'select,insert,update') as service_role_allowed,
    not has_table_privilege('authenticated', 'public.taxon_factual_fields', 'select,insert,update,delete') as authenticated_denied,
    not has_table_privilege('anon', 'public.taxon_factual_fields', 'select,insert,update,delete') as anon_denied,
    exists (
      select 1 from pg_trigger
      where tgrelid = 'public.taxon_factual_fields'::regclass
        and tgname = 'taxon_factual_fields_set_updated_at' and not tgisinternal
    ) as updated_at_trigger
), verdict as (
  select *, table_exists and draft_removed and review_marker_removed and seed_count and universal_count
    and no_legacy_properties and rls_enabled and no_public_policies and service_role_allowed
    and authenticated_denied and anon_denied and updated_at_trigger as passed
  from checks
)
select 1 / passed::integer as fail_closed, * from verdict;

select field_key, taxon_id, definition->>'valueScope' as value_scope, is_active
from public.taxon_factual_fields
order by taxon_id nulls first, field_key;
