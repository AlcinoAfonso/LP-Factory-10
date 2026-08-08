with expected_columns(column_name, data_type, is_nullable) as (
  values
    ('account_id', 'uuid', 'NO'),
    ('landing_page_id', 'uuid', 'YES'),
    ('catalog_version', 'integer', 'NO'),
    ('values', 'jsonb', 'NO'),
    ('revision', 'bigint', 'NO'),
    ('created_by', 'uuid', 'NO'),
    ('updated_by', 'uuid', 'NO'),
    ('created_at', 'timestamp with time zone', 'NO'),
    ('updated_at', 'timestamp with time zone', 'NO')
),
checks as (
  select
    'table_exists'::text as check_name,
    case when to_regclass('public.account_landing_page_onboarding_configurations') is not null then 'ok' else 'missing' end as status,
    jsonb_build_object('regclass', to_regclass('public.account_landing_page_onboarding_configurations')::text) as details
  union all
  select
    'columns',
    case when count(*) filter (
      where actual.column_name is not null
        and actual.data_type = expected.data_type
        and actual.is_nullable = expected.is_nullable
    ) = 9 then 'ok' else 'mismatch' end,
    jsonb_agg(jsonb_build_object(
      'column_name', expected.column_name,
      'data_type', actual.data_type,
      'is_nullable', actual.is_nullable,
      'column_default', actual.column_default
    ) order by expected.column_name)
  from expected_columns expected
  left join information_schema.columns actual
    on actual.table_schema = 'public'
    and actual.table_name = 'account_landing_page_onboarding_configurations'
    and actual.column_name = expected.column_name
  union all
  select
    'constraints',
    case when count(*) filter (where conname in (
      'account_landing_page_onboarding_configurations_pkey',
      'account_landing_page_onboarding_configurations_account_id_fkey',
      'account_landing_page_onboarding_configurations_landing_page_fkey',
      'account_landing_page_onboarding_configurations_created_by_fkey',
      'account_landing_page_onboarding_configurations_updated_by_fkey',
      'account_landing_page_onboarding_configurations_catalog_version_chk',
      'account_landing_page_onboarding_configurations_revision_chk',
      'account_landing_page_onboarding_configurations_values_object_chk'
    )) = 8 then 'ok' else 'missing' end,
    jsonb_agg(jsonb_build_object(
      'name', conname,
      'definition', pg_get_constraintdef(oid)
    ) order by conname)
  from pg_constraint
  where conrelid = to_regclass('public.account_landing_page_onboarding_configurations')
  union all
  select
    'rls_and_policies',
    case when target.relrowsecurity and count(policy.policyname) = 0 then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'rls_enabled', target.relrowsecurity,
      'policies', coalesce(jsonb_agg(policy.policyname) filter (where policy.policyname is not null), '[]'::jsonb)
    )
  from pg_class target
  left join pg_policies policy
    on policy.schemaname = 'public'
    and policy.tablename = 'account_landing_page_onboarding_configurations'
  where target.oid = to_regclass('public.account_landing_page_onboarding_configurations')
  group by target.relrowsecurity
  union all
  select
    'service_role_grants',
    case when
      has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'SELECT')
      and has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'INSERT')
      and has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'UPDATE')
      and not has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'DELETE')
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'select', has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'SELECT'),
      'insert', has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'INSERT'),
      'update', has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'UPDATE'),
      'delete', has_table_privilege('service_role', 'public.account_landing_page_onboarding_configurations', 'DELETE')
    )
  union all
  select
    'unprivileged_roles',
    case when not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'account_landing_page_onboarding_configurations'
        and lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
    ) then 'ok' else 'unexpected_grant' end,
    coalesce((
      select jsonb_agg(jsonb_build_object('grantee', grantee, 'privilege', privilege_type))
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'account_landing_page_onboarding_configurations'
        and lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
    ), '[]'::jsonb)
  union all
  select
    'triggers',
    case when count(*) filter (where trigger_name in (
      'account_landing_page_onboarding_configurations_prevent_rebind',
      'account_landing_page_onboarding_configurations_set_updated_at'
    )) = 2 then 'ok' else 'missing' end,
    jsonb_agg(jsonb_build_object(
      'trigger_name', trigger_name,
      'action_statement', action_statement
    ) order by trigger_name)
  from information_schema.triggers
  where event_object_schema = 'public'
    and event_object_table = 'account_landing_page_onboarding_configurations'
  union all
  select
    'no_premature_landing_page_storage',
    case when count(*) = 0 then 'ok' else 'unexpected_column' end,
    coalesce(jsonb_agg(column_name), '[]'::jsonb)
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'account_landing_pages'
    and column_name in ('onboarding_status', 'catalog_version', 'values', 'configuration_values')
)
select check_name, status, details
from checks
order by check_name;
