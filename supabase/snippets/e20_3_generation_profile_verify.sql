begin;
set transaction read only;

with target_tables(table_name) as (
  values
    ('landing_page_generation_profiles'::text),
    ('landing_page_generation_profile_items'::text)
), checks as (
  select
    'tables_exist'::text as check_name,
    case when count(c.oid) = 2 then 'ok' else 'unexpected' end as status,
    jsonb_agg(t.table_name order by t.table_name) as details
  from target_tables t
  left join pg_class c on c.oid = to_regclass('public.' || t.table_name)
  union all
  select
    'expected_columns',
    case when count(*) = 18 then 'ok' else 'unexpected' end,
    jsonb_agg(table_name || '.' || column_name order by table_name, ordinal_position)
  from information_schema.columns
  where table_schema = 'public'
    and (
      (table_name = 'landing_page_generation_profiles'
        and column_name in ('id', 'owner_taxon_id', 'version', 'status', 'generation_guidance', 'created_at', 'updated_at'))
      or
      (table_name = 'landing_page_generation_profile_items'
        and column_name in ('id', 'profile_id', 'module_key', 'module_version', 'variant_key', 'variant_version', 'priority', 'recommended_order', 'item_guidance', 'created_at', 'updated_at'))
    )
  union all
  select
    'constraints',
    case when count(*) = 18 then 'ok' else 'unexpected' end,
    jsonb_agg(conname order by conname)
  from pg_constraint
  where conrelid in (
    to_regclass('public.landing_page_generation_profiles'),
    to_regclass('public.landing_page_generation_profile_items')
  )
  union all
  select
    'single_active_profile_index',
    case when count(*) = 1 then 'ok' else 'unexpected' end,
    jsonb_agg(indexdef order by indexname)
  from pg_indexes
  where schemaname = 'public'
    and indexname = 'landing_page_generation_profiles_one_active_owner_idx'
    and indexdef ilike '%unique%'
    and indexdef ilike '%where (status = ''active''%'
  union all
  select
    'rls_without_policies',
    case
      when count(*) filter (where c.relrowsecurity) = 2
        and (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename in (select table_name from target_tables)) = 0
      then 'ok' else 'unexpected'
    end,
    jsonb_build_object(
      'rls_tables', count(*) filter (where c.relrowsecurity),
      'policies', (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename in (select table_name from target_tables))
    )
  from target_tables t
  join pg_class c on c.oid = to_regclass('public.' || t.table_name)
  union all
  select
    'least_privilege_grants',
    case
      when count(*) filter (where grantee = 'service_role' and privilege_type = 'SELECT') = 2
        and count(*) filter (where grantee = 'service_role' and privilege_type in ('INSERT', 'UPDATE', 'DELETE')) = 0
        and count(*) filter (where lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')) = 0
      then 'ok' else 'unexpected'
    end,
    coalesce(
      jsonb_agg(jsonb_build_object('table', table_name, 'role', grantee, 'privilege', privilege_type) order by table_name, grantee, privilege_type),
      '[]'::jsonb
    )
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (select table_name from target_tables)
  union all
  select
    'no_official_rows',
    case
      when (select count(*) from public.landing_page_generation_profiles) = 0
        and (select count(*) from public.landing_page_generation_profile_items) = 0
      then 'ok' else 'unexpected'
    end,
    jsonb_build_object(
      'profiles', (select count(*) from public.landing_page_generation_profiles),
      'items', (select count(*) from public.landing_page_generation_profile_items)
    )
)
select check_name, status, details
from checks
order by check_name;

rollback;
