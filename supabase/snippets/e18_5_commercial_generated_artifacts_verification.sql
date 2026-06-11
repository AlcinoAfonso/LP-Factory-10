-- E18.5 - verificacao read-only consolidada
-- Retorna um unico result set para uso no Supabase SQL Editor.
-- O comportamento de criacao e ativacao deve ser validado separadamente pelo
-- smoke transacional integrado, executado somente apos autorizacao.

with
expected_policies(policy_name, policy_command) as (
  values
    ('commercial_generated_artifacts_select_admin_only', 'SELECT'),
    ('commercial_generated_artifacts_insert_admin_only', 'INSERT'),
    ('commercial_generated_artifacts_update_admin_only', 'UPDATE')
),
expected_constraints(constraint_name) as (
  values
    ('commercial_generated_artifacts_pkey'),
    ('commercial_generated_artifacts_identity_key_chk'),
    ('commercial_generated_artifacts_artifact_version_chk'),
    ('commercial_generated_artifacts_status_chk'),
    ('commercial_generated_artifacts_template_version_chk'),
    ('commercial_generated_artifacts_resolution_source_chk'),
    ('commercial_generated_artifacts_identity_json_chk'),
    ('commercial_generated_artifacts_research_sources_json_chk'),
    ('commercial_generated_artifacts_content_json_chk'),
    ('commercial_generated_artifacts_identity_version_uidx'),
    ('commercial_generated_artifacts_research_taxon_id_fkey')
),
expected_indexes(index_name) as (
  values
    ('commercial_generated_artifacts_pkey'),
    ('commercial_generated_artifacts_identity_version_uidx'),
    ('commercial_generated_artifacts_one_active_uidx'),
    ('commercial_generated_artifacts_template_lookup_idx'),
    ('commercial_generated_artifacts_research_taxon_id_idx')
),
table_access as (
  select
    role_name,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
      'SELECT'
    ) as can_select,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
      'INSERT'
    ) as can_insert,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
      'UPDATE'
    ) as can_update,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
      'DELETE'
    ) as can_delete,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
      'TRUNCATE'
    ) as can_truncate,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
      'REFERENCES'
    ) as can_reference,
    has_table_privilege(
      role_name,
      'public.commercial_generated_artifacts',
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
    and c.relname = 'commercial_generated_artifacts'
    and c.relkind = 'r'

  union all

  select
    'policies',
    case
      when count(p.policyname) = (select count(*) from expected_policies)
        and count(p.policyname) filter (
          where p.policyname is null
        ) = 0
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'expected', (select jsonb_agg(policy_name order by policy_name) from expected_policies),
      'found', coalesce(
        jsonb_agg(p.policyname order by p.policyname)
          filter (where p.policyname is not null),
        '[]'::jsonb
      )
    )::text
  from expected_policies e
  left join pg_policies p
   on p.schemaname = 'public'
   and p.tablename = 'commercial_generated_artifacts'
   and p.policyname = e.policy_name
   and p.cmd = e.policy_command

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
      'create_commercial_generated_artifact_draft',
      'activate_commercial_generated_artifact'
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
   and c.conrelid = 'public.commercial_generated_artifacts'::regclass

  union all

  select
    'indexes',
    case
      when count(i.indexname) = (select count(*) from expected_indexes)
        and bool_or(
          i.indexname = 'commercial_generated_artifacts_one_active_uidx'
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
   and i.tablename = 'commercial_generated_artifacts'
   and i.indexname = e.index_name

  union all

  select
    'active_identity_duplicates',
    case when count(*) = 0 then 'pass' else 'fail' end,
    jsonb_build_object(
      'duplicate_identity_count', count(*),
      'duplicate_identity_keys', coalesce(
        jsonb_agg(identity_key order by identity_key),
        '[]'::jsonb
      )
    )::text
  from (
    select identity_key
    from public.commercial_generated_artifacts
    where status = 'active'
    group by identity_key
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
