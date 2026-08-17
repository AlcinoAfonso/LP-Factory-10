with expected_columns(column_name, data_type, is_nullable) as (
  values
    ('id', 'uuid', 'NO'),
    ('landing_page_id', 'uuid', 'NO'),
    ('account_id', 'uuid', 'NO'),
    ('revision_number', 'bigint', 'NO'),
    ('attempt_id', 'uuid', 'YES'),
    ('content_json', 'jsonb', 'NO'),
    ('generation_context_snapshot_json', 'jsonb', 'NO'),
    ('created_by', 'uuid', 'NO'),
    ('created_at', 'timestamp with time zone', 'NO')
),
checks as (
  select
    'columns'::text as check_name,
    case when count(*) filter (
      where actual.column_name is not null
        and actual.data_type = expected.data_type
        and actual.is_nullable = expected.is_nullable
    ) = 9 then 'ok' else 'mismatch' end as status,
    jsonb_agg(jsonb_build_object(
      'column_name', expected.column_name,
      'data_type', actual.data_type,
      'is_nullable', actual.is_nullable,
      'column_default', actual.column_default
    ) order by expected.column_name) as details
  from expected_columns expected
  left join information_schema.columns actual
    on actual.table_schema = 'public'
    and actual.table_name = 'account_landing_page_materializations'
    and actual.column_name = expected.column_name

  union all

  select
    'constraints_and_indexes',
    case when
      count(*) filter (where object_name = 'account_landing_page_materializations_pkey') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_landing_page_revision_key') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_revision_number_chk') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_landing_page_fkey') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_account_id_fkey') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_created_by_fkey') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_attempt_id_uidx') >= 1
      and count(*) filter (where object_name = 'account_landing_page_materializations_current_idx') >= 1
    then 'ok' else 'missing' end,
    jsonb_agg(jsonb_build_object('name', object_name, 'definition', definition) order by object_name)
  from (
    select conname as object_name, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = to_regclass('public.account_landing_page_materializations')
    union all
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'account_landing_page_materializations'
  ) objects

  union all

  select
    'revision_invariants',
    case when
      count(*) filter (where revision_number <= 0) = 0
      and count(*) filter (where attempt_id is null and revision_number <> 1) = 0
      and count(*) = count(distinct (landing_page_id, revision_number))
      and count(attempt_id) = count(distinct attempt_id)
    then 'ok' else 'invalid_row' end,
    jsonb_build_object(
      'rows', count(*),
      'landing_pages', count(distinct landing_page_id),
      'historical_rows', count(*) filter (where attempt_id is null),
      'invalid_revision_numbers', count(*) filter (where revision_number <= 0),
      'invalid_historical_rows', count(*) filter (where attempt_id is null and revision_number <> 1)
    )
  from public.account_landing_page_materializations

  union all

  select
    'two_revision_proof',
    case when count(*) > 0 then 'ok' else 'pending' end,
    coalesce(jsonb_agg(jsonb_build_object(
      'account_id', account_id,
      'landing_page_id', landing_page_id,
      'revision_count', revision_count,
      'first_revision', first_revision,
      'current_revision', current_revision,
      'distinct_content', distinct_content,
      'distinct_snapshots', distinct_snapshots
    ) order by account_id, landing_page_id), '[]'::jsonb)
  from (
    select
      account_id,
      landing_page_id,
      count(*) as revision_count,
      min(revision_number) as first_revision,
      max(revision_number) as current_revision,
      count(distinct content_json::text) as distinct_content,
      count(distinct generation_context_snapshot_json::text) as distinct_snapshots
    from public.account_landing_page_materializations
    group by account_id, landing_page_id
    having count(*) >= 2
      and count(distinct content_json::text) >= 2
      and count(distinct generation_context_snapshot_json::text) >= 2
  ) proof

  union all

  select
    'current_revision_projection',
    case when count(*) filter (where selected_id <> expected_id) = 0 then 'ok' else 'mismatch' end,
    coalesce(jsonb_agg(jsonb_build_object(
      'account_id', account_id,
      'landing_page_id', landing_page_id,
      'revision_number', revision_number,
      'selected_id', selected_id,
      'expected_id', expected_id
    ) order by account_id, landing_page_id), '[]'::jsonb)
  from (
    select distinct on (materialization.account_id, materialization.landing_page_id)
      materialization.account_id,
      materialization.landing_page_id,
      materialization.revision_number,
      materialization.id as selected_id,
      first_value(materialization.id) over (
        partition by materialization.account_id, materialization.landing_page_id
        order by materialization.revision_number desc
      ) as expected_id
    from public.account_landing_page_materializations materialization
    order by materialization.account_id, materialization.landing_page_id, materialization.revision_number desc
  ) current_rows

  union all

  select
    'security',
    case when
      target.relrowsecurity
      and count(policy.policyname) = 0
      and has_table_privilege('service_role', 'public.account_landing_page_materializations', 'SELECT')
      and not has_table_privilege('service_role', 'public.account_landing_page_materializations', 'INSERT,UPDATE,DELETE,TRUNCATE')
      and has_function_privilege('service_role', 'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)', 'EXECUTE')
    then 'ok' else 'mismatch' end,
    jsonb_build_object(
      'rls_enabled', target.relrowsecurity,
      'policies', coalesce(jsonb_agg(policy.policyname) filter (where policy.policyname is not null), '[]'::jsonb),
      'service_select', has_table_privilege('service_role', 'public.account_landing_page_materializations', 'SELECT'),
      'service_direct_write', has_table_privilege('service_role', 'public.account_landing_page_materializations', 'INSERT,UPDATE,DELETE,TRUNCATE'),
      'service_append_execute', has_function_privilege('service_role', 'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)', 'EXECUTE')
    )
  from pg_class target
  left join pg_policies policy
    on policy.schemaname = 'public'
    and policy.tablename = 'account_landing_page_materializations'
  where target.oid = to_regclass('public.account_landing_page_materializations')
  group by target.relrowsecurity

  union all

  select
    'storage_bucket',
    case when count(*) filter (
      where bucket.name = bucket.id
        and bucket.public = false
        and bucket.file_size_limit = 5242880
        and bucket.allowed_mime_types = array['image/webp']::text[]
    ) = 1 then 'ok' else 'mismatch' end,
    coalesce(jsonb_agg(jsonb_build_object(
      'id', bucket.id,
      'public', bucket.public,
      'file_size_limit', bucket.file_size_limit,
      'allowed_mime_types', bucket.allowed_mime_types
    )), '[]'::jsonb)
  from storage.buckets bucket
  where bucket.id = 'landing-page-revision-assets'

  union all

  select
    'storage_policies',
    case when count(*) = 0 then 'ok' else 'unexpected_policy' end,
    coalesce(jsonb_agg(jsonb_build_object(
      'policy', policy.policyname,
      'roles', policy.roles,
      'command', policy.cmd
    )), '[]'::jsonb)
  from pg_policies policy
  where policy.schemaname = 'storage'
    and policy.tablename = 'objects'
    and (
      coalesce(policy.qual, '') ilike '%landing-page-revision-assets%'
      or coalesce(policy.with_check, '') ilike '%landing-page-revision-assets%'
    )
)
select check_name, status, details
from checks
order by check_name;
