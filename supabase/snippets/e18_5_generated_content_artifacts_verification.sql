-- E18.5 - verificacao read-only consolidada
-- Retorna um unico result set para uso no Supabase SQL Editor.
-- O comportamento de criacao e ativacao deve ser validado separadamente pelo
-- smoke transacional integrado em PostgreSQL descartavel.

with
expected_columns(
  ordinal_position,
  column_name,
  formatted_type,
  is_not_null,
  column_default
) as (
  values
    (1, 'id', 'uuid', true, 'gen_random_uuid()'),
    (2, 'scope_key', 'text', true, null),
    (3, 'input_fingerprint', 'text', true, null),
    (4, 'artifact_version', 'integer', true, null),
    (5, 'status', 'text', true, '''draft''::text'),
    (6, 'template_key', 'text', true, null),
    (7, 'template_version', 'integer', true, null),
    (8, 'content_schema_version', 'text', true, null),
    (9, 'audience_scope', 'text', true, null),
    (10, 'locale', 'text', true, null),
    (11, 'scope_type', 'text', true, null),
    (12, 'research_taxon_id', 'uuid', false, null),
    (13, 'provenance_json', 'jsonb', true, null),
    (14, 'content_json', 'jsonb', true, null),
    (15, 'created_at', 'timestamp with time zone', true, 'now()'),
    (16, 'updated_at', 'timestamp with time zone', true, 'now()'),
    (17, 'activated_at', 'timestamp with time zone', false, null),
    (18, 'archived_at', 'timestamp with time zone', false, null)
),
actual_columns as (
  select
    a.attnum as ordinal_position,
    a.attname::text as column_name,
    format_type(a.atttypid, a.atttypmod) as formatted_type,
    a.attnotnull as is_not_null,
    pg_get_expr(ad.adbin, ad.adrelid) as column_default
  from pg_attribute a
  left join pg_attrdef ad
    on ad.adrelid = a.attrelid
   and ad.adnum = a.attnum
  where a.attrelid = to_regclass('public.generated_content_artifacts')
    and a.attnum > 0
    and not a.attisdropped
),
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
actual_constraints as (
  select c.conname
  from pg_constraint c
  where c.conrelid = to_regclass('public.generated_content_artifacts')
),
actual_indexes as (
  select i.indexname, i.indexdef
  from pg_indexes i
  where i.schemaname = 'public'
    and i.tablename = 'generated_content_artifacts'
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
      ('authenticated')
  ) roles(role_name)
),
ai_readonly_access as (
  select
    exists (
      select 1
      from pg_roles
      where rolname = 'ai_readonly'
    ) as role_exists,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'SELECT'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_select,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'INSERT'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_insert,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'UPDATE'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_update,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'DELETE'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_delete,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'TRUNCATE'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_truncate,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'REFERENCES'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_reference,
    coalesce((
      select has_table_privilege(
        r.oid,
        'public.generated_content_artifacts',
        'TRIGGER'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_trigger,
    coalesce((
      select has_function_privilege(
        r.oid,
        'public.create_generated_content_artifact_draft(text,text,text,integer,text,text,text,text,uuid,jsonb,jsonb)',
        'EXECUTE'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_execute_create,
    coalesce((
      select has_function_privilege(
        r.oid,
        'public.activate_generated_content_artifact(uuid)',
        'EXECUTE'
      )
      from pg_roles r
      where r.rolname = 'ai_readonly'
    ), false) as can_execute_activate
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
    'columns',
    case
      when (select count(*) from actual_columns) =
        (select count(*) from expected_columns)
       and count(*) = (select count(*) from expected_columns)
       and bool_and(
         a.column_name is not null
         and a.ordinal_position = e.ordinal_position
         and a.formatted_type = e.formatted_type
         and a.is_not_null = e.is_not_null
         and a.column_default is not distinct from e.column_default
       )
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'expected_count', (select count(*) from expected_columns),
      'actual_count', (select count(*) from actual_columns),
      'columns', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'name', coalesce(a.column_name, e.column_name),
            'position', a.ordinal_position,
            'type', a.formatted_type,
            'not_null', a.is_not_null,
            'default', a.column_default
          )
          order by e.ordinal_position
        ),
        '[]'::jsonb
      )
    )::text
  from expected_columns e
  left join actual_columns a on a.column_name = e.column_name

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
    'ai_readonly_access',
    case
      when not role_exists then 'pass'
      when not (
        can_select
        or can_insert
        or can_update
        or can_delete
        or can_truncate
        or can_reference
        or can_trigger
        or can_execute_create
        or can_execute_activate
      ) then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'role_exists', role_exists,
      'role_status', case
        when not role_exists then 'role_absent'
        when not (
          can_select
          or can_insert
          or can_update
          or can_delete
          or can_truncate
          or can_reference
          or can_trigger
          or can_execute_create
          or can_execute_activate
        ) then 'role_present_without_privileges'
        else 'role_present_with_privileges'
      end,
      'table_privileges', jsonb_build_object(
        'select', can_select,
        'insert', can_insert,
        'update', can_update,
        'delete', can_delete,
        'truncate', can_truncate,
        'references', can_reference,
        'trigger', can_trigger
      ),
      'function_execute', jsonb_build_object(
        'create_generated_content_artifact_draft', can_execute_create,
        'activate_generated_content_artifact', can_execute_activate
      )
    )::text
  from ai_readonly_access

  union all

  select
    'function_security_and_grants',
    case
      when count(*) = 2
        and bool_and(not p.prosecdef)
        and bool_and(has_function_privilege('service_role', p.oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('anon', p.oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('authenticated', p.oid, 'EXECUTE'))
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
    'trigger',
    case
      when count(*) = 1
       and bool_and(t.tgname = 'generated_content_artifacts_set_updated_at')
       and bool_and(p.proname = 'tg_set_updated_at')
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'trigger_count', count(*),
      'triggers', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'name', t.tgname,
            'function', p.proname
          )
          order by t.tgname
        ),
        '[]'::jsonb
      )
    )::text
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  where t.tgrelid = to_regclass('public.generated_content_artifacts')
    and not t.tgisinternal

  union all

  select
    'dependencies',
    case
      when to_regclass('public.business_taxons') is not null
       and to_regprocedure('public.tg_set_updated_at()') is not null
       and to_regprocedure('gen_random_uuid()') is not null
       and to_regprocedure('hashtextextended(text,bigint)') is not null
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'business_taxons', to_regclass('public.business_taxons') is not null,
      'tg_set_updated_at',
        to_regprocedure('public.tg_set_updated_at()') is not null,
      'gen_random_uuid', to_regprocedure('gen_random_uuid()') is not null,
      'hashtextextended',
        to_regprocedure('hashtextextended(text,bigint)') is not null
    )::text

  union all

  select
    'constraints',
    case
      when count(c.conname) = (select count(*) from expected_constraints)
       and (select count(*) from actual_constraints) =
         (select count(*) from expected_constraints)
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'expected_count', (select count(*) from expected_constraints),
      'actual_count', (select count(*) from actual_constraints),
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
        and (select count(*) from actual_indexes) =
          (select count(*) from expected_indexes)
        and bool_or(
          i.indexname = 'generated_content_artifacts_one_active_uidx'
          and i.indexdef ilike '%where%status%active%'
        )
      then 'pass'
      else 'fail'
    end,
    jsonb_build_object(
      'expected_count', (select count(*) from expected_indexes),
      'actual_count', (select count(*) from actual_indexes),
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
