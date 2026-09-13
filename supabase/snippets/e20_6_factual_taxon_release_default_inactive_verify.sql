begin;
set transaction read only;
set local search_path = public, pg_catalog;

with expected_update_columns(column_name) as (
  values
    ('is_active'::text),
    ('name'::text),
    ('reviewed_input_catalog_version'::text),
    ('selected_end_customer_research_version'::text),
    ('slug'::text)
),
checks as (
  select count(*) = 1
    and bool_and(data_type = 'boolean')
    and bool_and(is_nullable = 'NO')
    and bool_and(column_default = 'false') as ok
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'business_taxons'
    and column_name = 'is_active'

  union all

  select count(*) = 4
  from pg_constraint
  where conrelid = 'public.business_taxons'::regclass
    and conname = any(array[
      'business_taxons_level_chk',
      'business_taxons_parent_id_fkey',
      'business_taxons_reviewed_input_catalog_version_chk',
      'business_taxons_selected_end_customer_research_version_chk'
    ]::text[])

  union all

  select table_row.relrowsecurity
    and (
      select array_agg(policyname order by policyname)
      from pg_policies
      where schemaname = 'public' and tablename = 'business_taxons'
    ) = array[
      'business_taxons_delete_admin_only',
      'business_taxons_insert_admin_only',
      'business_taxons_select_admin_only',
      'business_taxons_update_admin_only'
    ]::name[]
  from pg_class as table_row
  where table_row.oid = 'public.business_taxons'::regclass

  union all

  select has_table_privilege('service_role', 'public.business_taxons', 'SELECT')
    and not has_table_privilege('service_role', 'public.business_taxons', 'UPDATE')
    and (
      select array_agg(column_name::text order by column_name)
      from information_schema.role_column_grants
      where table_schema = 'public'
        and table_name = 'business_taxons'
        and grantee = 'service_role'
        and privilege_type = 'UPDATE'
    ) = (
      select array_agg(column_name order by column_name)
      from expected_update_columns
    )
    and not has_table_privilege('anon', 'public.business_taxons', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.business_taxons', 'UPDATE')
)
select case when bool_and(ok) then 'ok' else 'unexpected' end as status
from checks;

rollback;
