with expected_columns(column_name, data_type, is_nullable) as (
  values
    ('landing_page_id', 'uuid', 'NO'),
    ('account_id', 'uuid', 'NO'),
    ('content_json', 'jsonb', 'NO'),
    ('generation_context_snapshot_json', 'jsonb', 'NO'),
    ('created_by', 'uuid', 'NO'),
    ('created_at', 'timestamp with time zone', 'NO')
),
checks as (
  select
    'table_exists'::text as check_name,
    case when to_regclass('public.account_landing_page_materializations') is not null then 'ok' else 'missing' end as status,
    jsonb_build_object('regclass', to_regclass('public.account_landing_page_materializations')::text) as details
  union all
  select
    'columns',
    case when count(*) filter (
      where actual.column_name is not null
        and actual.data_type = expected.data_type
        and actual.is_nullable = expected.is_nullable
    ) = 6 then 'ok' else 'mismatch' end,
    jsonb_agg(jsonb_build_object(
      'column_name', expected.column_name,
      'data_type', actual.data_type,
      'is_nullable', actual.is_nullable,
      'column_default', actual.column_default
    ) order by expected.column_name)
  from expected_columns expected
  left join information_schema.columns actual
    on actual.table_schema = 'public'
    and actual.table_name = 'account_landing_page_materializations'
    and actual.column_name = expected.column_name
  union all
  select
    'constraints',
    case when count(*) filter (where conname in (
      'account_landing_page_materializations_pkey',
      'account_landing_page_materializations_landing_page_fkey',
      'account_landing_page_materializations_account_id_fkey',
      'account_landing_page_materializations_created_by_fkey',
      'account_landing_page_materializations_content_object_chk',
      'account_landing_page_materializations_snapshot_object_chk'
    )) = 6 then 'ok' else 'missing' end,
    jsonb_agg(jsonb_build_object('name', conname, 'definition', pg_get_constraintdef(oid)) order by conname)
  from pg_constraint
  where conrelid = to_regclass('public.account_landing_page_materializations')
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
    and policy.tablename = 'account_landing_page_materializations'
  where target.oid = to_regclass('public.account_landing_page_materializations')
  group by target.relrowsecurity
  union all
  select
    'service_role_grants',
    case when
      has_table_privilege('service_role', 'public.account_landing_page_materializations', 'SELECT')
      and has_table_privilege('service_role', 'public.account_landing_page_materializations', 'INSERT')
      and not has_table_privilege('service_role', 'public.account_landing_page_materializations', 'UPDATE')
      and not has_table_privilege('service_role', 'public.account_landing_page_materializations', 'DELETE')
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'select', has_table_privilege('service_role', 'public.account_landing_page_materializations', 'SELECT'),
      'insert', has_table_privilege('service_role', 'public.account_landing_page_materializations', 'INSERT'),
      'update', has_table_privilege('service_role', 'public.account_landing_page_materializations', 'UPDATE'),
      'delete', has_table_privilege('service_role', 'public.account_landing_page_materializations', 'DELETE')
    )
  union all
  select
    'unprivileged_roles',
    case when not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'account_landing_page_materializations'
        and lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
    ) then 'ok' else 'unexpected_grant' end,
    coalesce((
      select jsonb_agg(jsonb_build_object('grantee', grantee, 'privilege', privilege_type))
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'account_landing_page_materializations'
        and lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
    ), '[]'::jsonb)
  union all
  select
    'no_partial_rows',
    case when count(*) = 0 then 'ok' else 'invalid_row' end,
    jsonb_build_object('invalid_rows', count(*))
  from public.account_landing_page_materializations
  where content_json is null
    or generation_context_snapshot_json is null
    or jsonb_typeof(content_json) <> 'object'
    or jsonb_typeof(generation_context_snapshot_json) <> 'object'
)
select check_name, status, details
from checks
order by check_name;
