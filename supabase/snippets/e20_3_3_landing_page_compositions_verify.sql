-- E20.3.3: verificacao read-only da persistencia de composicoes landing_page.
-- Resultado esperado: todas as linhas com check_status = ok.

with expected_tables(table_name) as (
  values
    ('landing_page_taxon_policies'::text),
    ('landing_page_compositions'::text)
),
checks as (
  select
    'table_and_rls'::text as check_group,
    expected_tables.table_name as object_name,
    case
      when tables.table_name is null then 'missing'
      when classes.relrowsecurity is not true then 'rls_disabled'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'rls_enabled', classes.relrowsecurity,
      'estimated_rows', coalesce(stats.n_live_tup, 0)
    ) as details
  from expected_tables
  left join information_schema.tables tables
    on tables.table_schema = 'public'
   and tables.table_name = expected_tables.table_name
  left join pg_class classes
    on classes.oid = to_regclass(format('public.%I', expected_tables.table_name))
  left join pg_stat_all_tables stats
    on stats.schemaname = 'public'
   and stats.relname = expected_tables.table_name

  union all

  select
    'admin_policies',
    expected_tables.table_name,
    case when count(policies.policyname) = 3 then 'ok' else 'missing' end,
    jsonb_agg(
      jsonb_build_object(
        'name', policies.policyname,
        'command', policies.cmd,
        'roles', policies.roles
      ) order by policies.policyname
    )
  from expected_tables
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected_tables.table_name
  group by expected_tables.table_name

  union all

  select
    'direct_privileges',
    expected_tables.table_name,
    case
      when has_table_privilege(
        'service_role',
        format('public.%I', expected_tables.table_name),
        'SELECT'
      )
      and not has_table_privilege(
        'anon',
        format('public.%I', expected_tables.table_name),
        'SELECT'
      )
      and not has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'SELECT'
      )
      and not has_table_privilege(
        'service_role',
        format('public.%I', expected_tables.table_name),
        'DELETE'
      ) then 'ok'
      else 'invalid'
    end,
    jsonb_build_object(
      'service_role_select', has_table_privilege(
        'service_role',
        format('public.%I', expected_tables.table_name),
        'SELECT'
      ),
      'service_role_delete', has_table_privilege(
        'service_role',
        format('public.%I', expected_tables.table_name),
        'DELETE'
      ),
      'anon_select', has_table_privilege(
        'anon',
        format('public.%I', expected_tables.table_name),
        'SELECT'
      ),
      'authenticated_select', has_table_privilege(
        'authenticated',
        format('public.%I', expected_tables.table_name),
        'SELECT'
      )
    )
  from expected_tables

  union all

  select
    'activation_function',
    'activate_landing_page_composition',
    case
      when procedures.prosecdef
        and procedures.proconfig @> array['search_path=public, pg_temp']
        and has_function_privilege(
          'authenticated',
          'public.activate_landing_page_composition(uuid,text,timestamptz)',
          'EXECUTE'
        )
        and not has_function_privilege(
          'anon',
          'public.activate_landing_page_composition(uuid,text,timestamptz)',
          'EXECUTE'
        ) then 'ok'
      else 'invalid'
    end,
    jsonb_build_object(
      'security_definer', procedures.prosecdef,
      'config', procedures.proconfig,
      'authenticated_execute', has_function_privilege(
        'authenticated',
        'public.activate_landing_page_composition(uuid,text,timestamptz)',
        'EXECUTE'
      ),
      'anon_execute', has_function_privilege(
        'anon',
        'public.activate_landing_page_composition(uuid,text,timestamptz)',
        'EXECUTE'
      )
    )
  from pg_proc procedures
  join pg_namespace namespaces on namespaces.oid = procedures.pronamespace
  where namespaces.nspname = 'public'
    and procedures.proname = 'activate_landing_page_composition'

  union all

  select
    'active_uniqueness',
    'landing_page_compositions_one_active_per_owner_idx',
    case
      when indexes.indexdef ilike '%unique%'
        and indexes.indexdef ilike '%where (status = ''active''::text)%'
      then 'ok'
      else 'missing'
    end,
    jsonb_build_object('definition', indexes.indexdef)
  from pg_indexes indexes
  where indexes.schemaname = 'public'
    and indexes.indexname = 'landing_page_compositions_one_active_per_owner_idx'

  union all

  select
    'foreign_key_delete_actions',
    'landing_page_e20_3_3_foreign_keys',
    case when bool_and(constraints.confdeltype <> 'c') then 'ok' else 'cascade_found' end,
    jsonb_agg(
      jsonb_build_object(
        'name', constraints.conname,
        'delete_action', constraints.confdeltype,
        'update_action', constraints.confupdtype
      ) order by constraints.conname
    )
  from pg_constraint constraints
  where constraints.contype = 'f'
    and constraints.conrelid in (
      to_regclass('public.landing_page_taxon_policies'),
      to_regclass('public.landing_page_compositions')
    )
)
select check_group, object_name, check_status, details
from checks
order by check_group, object_name;
