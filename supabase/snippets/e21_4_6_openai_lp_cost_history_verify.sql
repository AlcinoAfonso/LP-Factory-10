begin transaction read only;

with checks(check_name, status, details) as (
  select
    'historical_baseline',
    case when
      (select count(*) from public.openai_lp_cost_events) = 8
      and (select count(*) from public.openai_lp_cost_coverage) = 1
      and (select min(activated_at) from public.openai_lp_cost_coverage) = timestamptz '2026-08-29 21:55:36.827207+00'
      and (select max(activated_at) from public.openai_lp_cost_coverage) = timestamptz '2026-08-29 21:55:36.827207+00'
    then 'ok' else 'baseline_drift' end,
    jsonb_build_object(
      'event_count', (select count(*) from public.openai_lp_cost_events),
      'coverage_count', (select count(*) from public.openai_lp_cost_coverage),
      'activated_at', (select min(activated_at) from public.openai_lp_cost_coverage)
    )
  union all
  select
    'structure_and_rls',
    case when
      to_regclass('public.openai_lp_cost_events') is not null
      and to_regclass('public.openai_lp_cost_coverage') is not null
      and (select relrowsecurity from pg_class where oid = 'public.openai_lp_cost_events'::regclass)
      and (select relrowsecurity from pg_class where oid = 'public.openai_lp_cost_coverage'::regclass)
      and not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename in ('openai_lp_cost_events', 'openai_lp_cost_coverage')
      )
      and (
        select array_agg(conname::text order by conname)
        from pg_constraint
        where conrelid in (
          'public.openai_lp_cost_events'::regclass,
          'public.openai_lp_cost_coverage'::regclass
        )
      ) = array[
        'openai_lp_cost_coverage_environment_chk',
        'openai_lp_cost_coverage_pkey',
        'openai_lp_cost_coverage_singleton_chk',
        'openai_lp_cost_coverage_timestamp_chk',
        'openai_lp_cost_events_attempt_kind_key',
        'openai_lp_cost_events_configuration_shape_chk',
        'openai_lp_cost_events_environment_chk',
        'openai_lp_cost_events_event_kind_chk',
        'openai_lp_cost_events_landing_page_fkey',
        'openai_lp_cost_events_model_shape_chk',
        'openai_lp_cost_events_pkey',
        'openai_lp_cost_events_terminal_shape_chk',
        'openai_lp_cost_events_workload_chk'
      ]::text[]
      and (
        select array_agg(index_class.relname::text order by index_class.relname)
        from pg_index index_binding
        join pg_class index_class on index_class.oid = index_binding.indexrelid
        where index_binding.indrelid in (
          'public.openai_lp_cost_events'::regclass,
          'public.openai_lp_cost_coverage'::regclass
        )
      ) = array[
        'openai_lp_cost_coverage_pkey',
        'openai_lp_cost_events_attempt_kind_key',
        'openai_lp_cost_events_period_idx',
        'openai_lp_cost_events_pkey',
        'openai_lp_cost_events_started_period_idx'
      ]::text[]
      and (
        select array_agg(tgname::text order by tgname)
        from pg_trigger
        where tgrelid in (
          'public.openai_lp_cost_events'::regclass,
          'public.openai_lp_cost_coverage'::regclass
        )
          and not tgisinternal
      ) = array[
        'openai_lp_cost_coverage_prevent_mutation',
        'openai_lp_cost_events_prevent_mutation'
      ]::text[]
    then 'ok' else 'structure_drift' end,
    jsonb_build_object('zero_client_policies', true)
  union all
  select
    'service_role_read_only',
    case when
      has_table_privilege('service_role', 'public.openai_lp_cost_events', 'SELECT')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'INSERT,UPDATE,DELETE,TRUNCATE')
      and has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'SELECT')
      and not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'INSERT,UPDATE,DELETE,TRUNCATE')
      and not has_function_privilege('service_role', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
      and not has_function_privilege('service_role', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
      and not has_function_privilege('service_role', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
    then 'ok' else 'privilege_drift' end,
    jsonb_build_object('table_access', 'select_only', 'rpc_access', 'read_only')
  union all
  select
    'no_public_or_client_access',
    case when
      not has_table_privilege('anon', 'public.openai_lp_cost_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
      and not has_table_privilege('authenticated', 'public.openai_lp_cost_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
      and not has_table_privilege('anon', 'public.openai_lp_cost_coverage', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
      and not has_table_privilege('authenticated', 'public.openai_lp_cost_coverage', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
      and not has_function_privilege('anon', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
      and not exists (
        select 1
        from pg_class target
        cross join lateral aclexplode(coalesce(target.relacl, acldefault('r', target.relowner))) privilege
        where target.oid in (
          'public.openai_lp_cost_events'::regclass,
          'public.openai_lp_cost_coverage'::regclass
        )
          and privilege.grantee = 0
      )
      and not exists (
        select 1
        from pg_proc target
        cross join lateral aclexplode(coalesce(target.proacl, acldefault('f', target.proowner))) privilege
        where target.oid in (
          'public.prevent_openai_lp_cost_mutation_v1()'::regprocedure,
          'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)'::regprocedure,
          'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)'::regprocedure,
          'public.register_openai_lp_cost_coverage_v1(timestamptz)'::regprocedure,
          'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)'::regprocedure
        )
          and privilege.grantee = 0
      )
      and case when to_regrole('ai_readonly') is null then true else
        not has_table_privilege('ai_readonly', 'public.openai_lp_cost_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
        and not has_table_privilege('ai_readonly', 'public.openai_lp_cost_coverage', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
        and not has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
      end
    then 'ok' else 'unexpected_access' end,
    jsonb_build_object('roles', jsonb_build_array('public', 'anon', 'authenticated', 'ai_readonly'))
)
select check_name, status, details
from checks
order by check_name;

rollback;
