begin;
set transaction read only;

with checks as (
  select 'table_and_rls'::text as check_name,
    to_regclass('public.business_taxon_input_catalog_review_invalidations') is not null
    and coalesce((
      select relrowsecurity
      from pg_class
      where oid = to_regclass('public.business_taxon_input_catalog_review_invalidations')
    ), false) as ok

  union all

  select 'zero_public_policies',
    not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'business_taxon_input_catalog_review_invalidations'
    )

  union all

  select 'service_only_acl',
    not has_table_privilege('anon', 'public.business_taxon_input_catalog_review_invalidations', 'SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('authenticated', 'public.business_taxon_input_catalog_review_invalidations', 'SELECT,INSERT,UPDATE,DELETE')
    and has_table_privilege('service_role', 'public.business_taxon_input_catalog_review_invalidations', 'SELECT,INSERT')
    and not has_table_privilege('service_role', 'public.business_taxon_input_catalog_review_invalidations', 'UPDATE,DELETE,TRUNCATE')

  union all

  select 'rpc_acl',
    not has_function_privilege(
      'anon',
      'public.update_business_taxon_identity_with_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,jsonb,uuid,uuid)',
      'EXECUTE'
    )
    and not has_function_privilege(
      'authenticated',
      'public.update_business_taxon_identity_with_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,jsonb,uuid,uuid)',
      'EXECUTE'
    )
    and has_function_privilege(
      'service_role',
      'public.update_business_taxon_identity_with_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,jsonb,uuid,uuid)',
      'EXECUTE'
    )

  union all

  select 'append_only_trigger',
    exists (
      select 1
      from pg_trigger
      where tgrelid = to_regclass('public.business_taxon_input_catalog_review_invalidations')
        and tgname = 'business_taxon_input_catalog_review_invalidations_append_only'
        and not tgisinternal
        and tgenabled = 'O'
    )
)
select
  check_name,
  ok,
  case when bool_and(ok) over () then 'ok' else 'unexpected' end as status
from checks
order by check_name;

rollback;
