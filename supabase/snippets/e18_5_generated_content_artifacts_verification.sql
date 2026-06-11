-- E18.5 - verificacao read-only consolidada
-- Retorna um unico result set para uso no Supabase SQL Editor.
-- O comportamento de criacao e ativacao deve ser validado separadamente pelo
-- smoke transacional integrado, executado somente apos autorizacao.

with
expected_constraints(constraint_name) as (
  values
    ('generated_content_artifacts_pkey'),
    ('generated_content_artifacts_scope_key_chk'),
    ('generated_content_artifacts_input_fingerprint_chk'),
    ('generated_content_artifacts_artifact_version_chk'),
    ('generated_content_artifacts_status_chk'),
    ('generated_content_artifacts_template_version_chk'),
    ('generated_content_artifacts_scope_type_chk'),
    ('generated_content_artifacts_scope_taxon_chk'),
    ('generated_content_artifacts_provenance_json_chk'),
    ('generated_content_artifacts_content_json_chk'),
    ('generated_content_artifacts_scope_version_uidx'),
    ('generated_content_artifacts_research_taxon_id_fkey')
),
expected_indexes(index_name) as (
  values
    ('generated_content_artifacts_pkey'),
    ('generated_content_artifacts_scope_version_uidx'),
    ('generated_content_artifacts_one_active_uidx'),
    ('generated_content_artifacts_template_lookup_idx'),
    ('generated_content_artifacts_research_taxon_id_idx')
),
table_access as (
  select
    role_name,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'SELECT'
    ) as can_select,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'INSERT'
    ) as can_insert,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'UPDATE'
    ) as can_update,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'DELETE'
    ) as can_delete,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'TRUNCATE'
    ) as can_truncate,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'REFERENCES'
    ) as can_reference,
    has_table_privilege(
      role_name,
      'public.generated_content_artifacts',
      'TRIGGER'
    ) as can_trigger
  from (
    values
      ('service_role'),
      ('anon'),
      ('authenticated'),
      ('ai_readonly')
  ) roles(role_name)
),
checks as (
  select
    'table_exists_and_rls'::text as check_name,
    case
      when count(*) = 1 and bool_and(c.relrowsecurity) then 'pass'
      else 'fail'
    end as check_status,
    jsonb_build_object(
      'table_count', count(*),
      'rls_enabled', coalesce(bool_and(c.relrowsecurity), false)
    )::text as details
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'generated_content_artifacts'
    and c.relkind = 'r'

  union all

  select
    'user_policies_absent',
    case when count(*) = 0 then 'pass' else 'fail' end,
    jsonb_build_object(
      'policy_count', count(*),
      'policies', coalesce(
        jsonb_agg(policyname order by policyname),
        '[]'::jsonb
      )
    )::text
  from pg_policies
  where schemaname = 'public'
    and tablename = 'generated_content_artifacts'

  union all

  select
    'table_grants',
    case
      when bool_and(
        case
          when role_name = 'service_role'
            then can_select
              and can_insert
              and can_update
              and not can_delete
              and not can_truncate
              and not can_reference
              and not can_trigger
          else not (
            can_select
            or can_insert
            or can_update
            or can_delete
            or can_truncate
            or can_reference
            or can_trigger
          )
        end
      )
      then 'pass'
      else 'fail'
    end,
    jsonb_object_agg(
      role_name,
      jsonb_build_object(
        'select', can_select,
        'insert', can_insert,
        'update', can_update,
        'delete', can_delete,
        'truncate', can_truncate,
        'references', can_reference,
        'trigger', can_trigger
      )
      order by role_name
    )::text
  from table_access

  union all

  select
    'function_security_and_grants',
    case
      when count(*) = 2
        and bool_and(not p.prosecdef)
        and bool_and(has_function_privilege('service_role', p.oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('anon', p.oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('authenticated', p.oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('ai_readonly', p.oid, 'EXECUTE'))
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'function_count', count(*),
      'all_security_invoker', coalesce(bool_and(not p.prosecdef), false),
      'service_role_execute', coalesce(
        bool_and(has_function_privilege('service_role', p.oid, 'EXECUTE')),
        false
      ),
      'anon_execute', coalesce(
        bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')),
        false
      ),
      'authenticated_execute', coalesce(
        bool_or(has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        false
      ),
      'ai_readonly_execute', coalesce(
        bool_or(has_function_privilege('ai_readonly', p.oid, 'EXECUTE')),
        false
      )
    )::text
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'create_generated_content_artifact_draft',
      'activate_generated_content_artifact'
    )

  union all

  select
    'constraints',
    case
      when count(c.conname) = (select count(*) from expected_constraints)
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'expected_count', (select count(*) from expected_constraints),
      'found', coalesce(
        jsonb_agg(c.conname order by c.conname)
          filter (where c.conname is not null),
        '[]'::jsonb
      )
    )::text
  from expected_constraints e
  left join pg_constraint c
    on c.conname = e.constraint_name
   and c.conrelid = to_regclass('public.generated_content_artifacts')

  union all

  select
    'indexes',
    case
      when count(i.indexname) = (select count(*) from expected_indexes)
        and bool_or(
          i.indexname = 'generated_content_artifacts_one_active_uidx'
          and i.indexdef ilike '%where%status%active%'
        )
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'expected_count', (select count(*) from expected_indexes),
      'found', coalesce(
        jsonb_agg(i.indexname order by i.indexname)
          filter (where i.indexname is not null),
        '[]'::jsonb
      )
    )::text
  from expected_indexes e
  left join pg_indexes i
    on i.schemaname = 'public'
   and i.tablename = 'generated_content_artifacts'
   and i.indexname = e.index_name

  union all

  select
    'active_scope_duplicates',
    case when count(*) = 0 then 'pass' else 'fail' end,
    jsonb_build_object(
      'duplicate_scope_count', count(*),
      'duplicate_scope_keys', coalesce(
        jsonb_agg(scope_key order by scope_key),
        '[]'::jsonb
      )
    )::text
  from (
    select scope_key
    from public.generated_content_artifacts
    where status = 'active'
    group by scope_key
    having count(*) > 1
  ) duplicates
)
select
  check_name,
  check_status,
  details
from checks
order by
  case check_status when 'fail' then 0 else 1 end,
  check_name;
