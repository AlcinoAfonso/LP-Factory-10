begin transaction read only;

with checks(check_name, status, details) as (
  select
    'objects_and_rls',
    case when
      to_regclass('public.openai_lp_cost_events') is not null
      and to_regclass('public.openai_lp_cost_coverage') is not null
      and (select relrowsecurity from pg_class where oid = 'public.openai_lp_cost_events'::regclass)
      and (select relrowsecurity from pg_class where oid = 'public.openai_lp_cost_coverage'::regclass)
      and (
        select count(*) = 3
        from information_schema.columns column_row
        where column_row.table_schema = 'public'
          and column_row.table_name = 'openai_lp_cost_events'
          and column_row.column_name in ('http_status', 'provider_error_code', 'provider_error_type')
      )
    then 'ok' else 'missing_or_insecure' end,
    jsonb_build_object(
      'events', to_regclass('public.openai_lp_cost_events'),
      'coverage', to_regclass('public.openai_lp_cost_coverage')
    )
  union all
  select
    'zero_client_policies',
    case when not exists (
      select 1 from pg_policies policy
      where policy.schemaname = 'public'
        and policy.tablename in ('openai_lp_cost_events', 'openai_lp_cost_coverage')
    ) then 'ok' else 'unexpected_policy' end,
    jsonb_build_object(
      'policy_count', (
        select count(*) from pg_policies policy
        where policy.schemaname = 'public'
          and policy.tablename in ('openai_lp_cost_events', 'openai_lp_cost_coverage')
      )
    )
  union all
  select
    'started_reader_period_index',
    case when exists (
      select 1
      from pg_index index_row
      join pg_class index_class on index_class.oid = index_row.indexrelid
      where index_row.indrelid = 'public.openai_lp_cost_events'::regclass
        and index_class.relname = 'openai_lp_cost_events_started_period_idx'
        and index_row.indisvalid
        and index_row.indnkeyatts = 3
        and pg_get_indexdef(index_row.indexrelid, 1, false) = 'created_at'
        and pg_get_indexdef(index_row.indexrelid, 2, false) = 'attempt_id'
        and pg_get_indexdef(index_row.indexrelid, 3, false) = 'workload'
        and pg_get_expr(index_row.indpred, index_row.indrelid) = '(event_kind = ''started''::text)'
    ) then 'ok' else 'missing_or_invalid' end,
    jsonb_build_object(
      'index', to_regclass('public.openai_lp_cost_events_started_period_idx')
    )
  union all
  select
    'least_privilege',
    case when
      has_table_privilege('service_role', 'public.openai_lp_cost_events', 'SELECT')
      and has_table_privilege('service_role', 'public.openai_lp_cost_events', 'INSERT')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'UPDATE')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'DELETE')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'TRUNCATE')
      and has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'SELECT')
      and has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'INSERT')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'UPDATE')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'DELETE')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'TRUNCATE')
      and not has_table_privilege('anon', 'public.openai_lp_cost_events', 'SELECT')
      and not has_table_privilege('anon', 'public.openai_lp_cost_coverage', 'SELECT')
      and not has_table_privilege('authenticated', 'public.openai_lp_cost_events', 'SELECT')
      and not has_table_privilege('authenticated', 'public.openai_lp_cost_coverage', 'SELECT')
      and has_function_privilege('service_role', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
      and not has_function_privilege('service_role', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
      and not has_function_privilege('anon', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
      and case when to_regrole('ai_readonly') is null then true else
        not has_table_privilege('ai_readonly', 'public.openai_lp_cost_events', 'SELECT')
        and not has_table_privilege('ai_readonly', 'public.openai_lp_cost_coverage', 'SELECT')
        and not has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
      end
      and not exists (
        select 1
        from pg_class target
        cross join lateral aclexplode(
          coalesce(target.relacl, acldefault('r', target.relowner))
        ) privilege
        where target.oid in (
          'public.openai_lp_cost_events'::regclass,
          'public.openai_lp_cost_coverage'::regclass
        )
          and privilege.grantee = 0
      )
      and not exists (
        select 1
        from pg_proc target
        cross join lateral aclexplode(
          coalesce(target.proacl, acldefault('f', target.proowner))
        ) privilege
        where target.oid in (
          'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)'::regprocedure,
          'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)'::regprocedure,
          'public.register_openai_lp_cost_coverage_v1(timestamptz)'::regprocedure,
          'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)'::regprocedure,
          'public.prevent_openai_lp_cost_mutation_v1()'::regprocedure
        )
          and privilege.grantee = 0
      )
    then 'ok' else 'privilege_drift' end,
    jsonb_build_object('service_role_select_insert_only', true)
  union all
  select
    'correlation_and_cutoff',
    case when
      exists (
        select 1 from pg_constraint constraint_row
        where constraint_row.conrelid = 'public.openai_lp_cost_events'::regclass
          and constraint_row.conname = 'openai_lp_cost_events_attempt_kind_key'
      )
      and exists (
        select 1 from pg_trigger trigger_row
        where trigger_row.tgrelid = 'public.openai_lp_cost_events'::regclass
          and trigger_row.tgname = 'openai_lp_cost_events_prevent_mutation'
          and not trigger_row.tgisinternal
      )
      and exists (
        select 1 from pg_trigger trigger_row
        where trigger_row.tgrelid = 'public.openai_lp_cost_coverage'::regclass
          and trigger_row.tgname = 'openai_lp_cost_coverage_prevent_mutation'
          and not trigger_row.tgisinternal
      )
      and (select count(*) from public.openai_lp_cost_coverage) <= 1
      and not exists (
        select 1
        from public.openai_lp_cost_events terminal
        where terminal.event_kind = 'terminal'
          and not exists (
            select 1 from public.openai_lp_cost_events started
            where started.attempt_id = terminal.attempt_id
              and started.workload = terminal.workload
              and started.event_kind = 'started'
          )
      )
    then 'ok' else 'append_only_or_cutoff_drift' end,
    jsonb_build_object(
      'coverage_rows', (select count(*) from public.openai_lp_cost_coverage),
      'terminal_without_start', (
        select count(*)
        from public.openai_lp_cost_events terminal
        where terminal.event_kind = 'terminal'
          and not exists (
            select 1 from public.openai_lp_cost_events started
            where started.attempt_id = terminal.attempt_id
              and started.workload = terminal.workload
              and started.event_kind = 'started'
          )
      )
    )
)
select check_name, status, details
from checks
order by check_name;

rollback;
