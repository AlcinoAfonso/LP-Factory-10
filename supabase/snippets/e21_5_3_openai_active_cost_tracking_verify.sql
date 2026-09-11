begin transaction read only;

with objects as (
  select relname, relrowsecurity
  from pg_class
  where oid in (
    to_regclass('public.openai_cost_executions'),
    to_regclass('public.openai_cost_operations'),
    to_regclass('public.openai_cost_coverage')
  )
), checks as (
  select 'tables_and_rls' as check_name,
    case when count(*) = 3 and bool_and(relrowsecurity) then 'ok' else 'missing_or_insecure' end as status,
    jsonb_agg(jsonb_build_object('table', relname, 'rls', relrowsecurity) order by relname) as details
  from objects
  union all
  select 'zero_direct_policies',
    case when count(*) = 0 then 'ok' else 'unexpected_policy' end,
    jsonb_build_object('policy_count', count(*))
  from pg_policies where schemaname = 'public' and tablename in ('openai_cost_executions', 'openai_cost_operations', 'openai_cost_coverage')
  union all
  select 'legacy_preserved',
    case when to_regclass('public.openai_lp_cost_events') is not null and to_regclass('public.openai_lp_cost_coverage') is not null then 'ok' else 'legacy_missing' end,
    jsonb_build_object('events', to_regclass('public.openai_lp_cost_events'), 'coverage', to_regclass('public.openai_lp_cost_coverage'))
  union all
  select 'least_privilege',
    case when
      has_table_privilege('service_role', 'public.openai_cost_operations', 'SELECT')
      and has_table_privilege('service_role', 'public.openai_cost_operations', 'INSERT')
      and not has_table_privilege('service_role', 'public.openai_cost_operations', 'UPDATE')
      and has_column_privilege('service_role', 'public.openai_cost_operations', 'finished_at', 'UPDATE')
      and not has_column_privilege('service_role', 'public.openai_cost_operations', 'created_at', 'UPDATE')
      and not has_table_privilege('service_role', 'public.openai_cost_operations', 'DELETE')
      and not has_table_privilege('anon', 'public.openai_cost_executions', 'SELECT')
      and not has_table_privilege('authenticated', 'public.openai_cost_operations', 'SELECT')
      and has_function_privilege('service_role', 'public.start_openai_cost_execution_v1(uuid,text,text,text,text,text,uuid,text,text,timestamptz)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.finish_openai_cost_execution_v1(uuid,text,text,timestamptz)', 'EXECUTE')
    then 'ok' else 'unexpected_grant' end,
    jsonb_build_object('service_update_finished_at', has_column_privilege('service_role', 'public.openai_cost_operations', 'finished_at', 'UPDATE'))
  union all
  select 'mutation_guards',
    case when count(*) = 3 then 'ok' else 'missing' end,
    jsonb_build_object('trigger_count', count(*))
  from pg_trigger
  where tgrelid in ('public.openai_cost_executions'::regclass, 'public.openai_cost_operations'::regclass, 'public.openai_cost_coverage'::regclass)
    and not tgisinternal
)
select check_name, status, details from checks order by check_name;

rollback;
