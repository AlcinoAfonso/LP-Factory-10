with checks as (
  select
    'draft_table'::text as check_name,
    to_regclass('public.landing_page_input_catalog_drafts') is not null as ok
  union all
  select
    'rls_service_only',
    coalesce((
      select c.relrowsecurity
        and not exists (
          select 1 from pg_policies p
          where p.schemaname = 'public'
            and p.tablename = 'landing_page_input_catalog_drafts'
        )
        and not has_table_privilege('anon', c.oid, 'SELECT')
        and not has_table_privilege('anon', c.oid, 'INSERT')
        and not has_table_privilege('anon', c.oid, 'UPDATE')
        and not has_table_privilege('anon', c.oid, 'DELETE')
        and not has_table_privilege('authenticated', c.oid, 'SELECT')
        and not has_table_privilege('authenticated', c.oid, 'INSERT')
        and not has_table_privilege('authenticated', c.oid, 'UPDATE')
        and not has_table_privilege('authenticated', c.oid, 'DELETE')
        and not exists (
          select 1
          from information_schema.role_table_grants grants
          where grants.table_schema = 'public'
            and grants.table_name = 'landing_page_input_catalog_drafts'
            and grants.grantee = 'PUBLIC'
        )
        and (
          to_regrole('ai_readonly') is null
          or (
            not has_table_privilege('ai_readonly', c.oid, 'SELECT')
            and not has_table_privilege('ai_readonly', c.oid, 'INSERT')
            and not has_table_privilege('ai_readonly', c.oid, 'UPDATE')
            and not has_table_privilege('ai_readonly', c.oid, 'DELETE')
          )
        )
        and has_table_privilege('service_role', c.oid, 'SELECT')
        and has_table_privilege('service_role', c.oid, 'INSERT')
        and has_table_privilege('service_role', c.oid, 'UPDATE')
        and has_table_privilege('service_role', c.oid, 'DELETE')
      from pg_class c
      where c.oid = to_regclass('public.landing_page_input_catalog_drafts')
    ), false)
  union all
  select
    'single_non_operational_draft',
    coalesce((
      select count(*) <= 1
        and bool_and(target_version = base_version + 1)
        and bool_and(publication_fingerprint is null or publication_fingerprint = validation_fingerprint)
        and bool_and(publication_context_fingerprint is null or publication_context_fingerprint = validation_context_fingerprint)
        and bool_and(jsonb_typeof(taxon_review_evidence) = 'object')
      from public.landing_page_input_catalog_drafts
    ), true)
  union all
  select
    'effective_version_rpc',
    coalesce((
      select position('is distinct from 5' in lower(pg_get_functiondef(p.oid))) = 0
        and position('p_catalog_version <= 0' in pg_get_functiondef(p.oid)) > 0
      from pg_proc p
      where p.oid = 'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)'::regprocedure
    ), false)
)
select check_name, ok
from checks
order by check_name;
