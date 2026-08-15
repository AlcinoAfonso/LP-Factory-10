begin;
set transaction read only;
set local search_path = public, pg_catalog;

with checks as (
  select
    'column_contract'::text as check_name,
    case
      when count(*) = 1
        and bool_and(data_type = 'integer')
        and bool_and(is_nullable = 'YES')
      then 'ok' else 'unexpected'
    end as status,
    jsonb_agg(jsonb_build_object(
      'data_type', data_type,
      'is_nullable', is_nullable
    )) as details
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'business_taxons'
    and column_name = 'selected_end_customer_research_version'

  union all

  select
    'positive_check',
    case
      when count(*) = 1
        and bool_and(
          lower(pg_get_constraintdef(oid)) ~
          '^check \(\(*selected_end_customer_research_version is null\)* or \(*selected_end_customer_research_version > 0\)*\)$'
        )
      then 'ok' else 'unexpected'
    end,
    coalesce(jsonb_agg(jsonb_build_object(
      'name', conname,
      'definition', pg_get_constraintdef(oid)
    )), '[]'::jsonb)
  from pg_constraint
  where conrelid = 'public.business_taxons'::regclass
    and conname = 'business_taxons_selected_end_customer_research_version_chk'

  union all

  select
    'rls_and_policies',
    case
      when table_row.relrowsecurity
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
      then 'ok' else 'unexpected'
    end,
    jsonb_build_object(
      'rls', table_row.relrowsecurity,
      'policies', (
        select jsonb_agg(policyname order by policyname)
        from pg_policies
        where schemaname = 'public' and tablename = 'business_taxons'
      )
    )
  from pg_class table_row
  where table_row.oid = 'public.business_taxons'::regclass

  union all

  select
    'effective_grants',
    case
      when has_table_privilege('service_role', 'public.business_taxons', 'SELECT')
        and not has_table_privilege(
          'service_role',
          'public.business_taxons',
          'UPDATE'
        )
        and has_column_privilege(
          'service_role',
          'public.business_taxons',
          'selected_end_customer_research_version',
          'UPDATE'
        )
        and not has_column_privilege(
          'anon',
          'public.business_taxons',
          'selected_end_customer_research_version',
          'UPDATE'
        )
        and not has_column_privilege(
          'authenticated',
          'public.business_taxons',
          'selected_end_customer_research_version',
          'UPDATE'
        )
        and (
          select array_agg(column_name::text order by column_name)
          from information_schema.role_column_grants
          where table_schema = 'public'
            and table_name = 'business_taxons'
            and grantee = 'service_role'
            and privilege_type = 'UPDATE'
        ) = array[
          'is_active',
          'name',
          'selected_end_customer_research_version',
          'slug'
        ]::text[]
      then 'ok' else 'unexpected'
    end,
    jsonb_build_object(
      'service_role_select', has_table_privilege('service_role', 'public.business_taxons', 'SELECT'),
      'service_role_table_update', has_table_privilege('service_role', 'public.business_taxons', 'UPDATE'),
      'service_role_column_update', has_column_privilege('service_role', 'public.business_taxons', 'selected_end_customer_research_version', 'UPDATE'),
      'service_role_update_columns', (
        select jsonb_agg(column_name order by column_name)
        from information_schema.role_column_grants
        where table_schema = 'public'
          and table_name = 'business_taxons'
          and grantee = 'service_role'
          and privilege_type = 'UPDATE'
      ),
      'anon_column_update', has_column_privilege('anon', 'public.business_taxons', 'selected_end_customer_research_version', 'UPDATE'),
      'authenticated_column_update', has_column_privilege('authenticated', 'public.business_taxons', 'selected_end_customer_research_version', 'UPDATE')
    )
)
select check_name, status, details
from checks
order by check_name;

rollback;
