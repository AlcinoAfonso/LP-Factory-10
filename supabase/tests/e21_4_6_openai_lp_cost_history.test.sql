begin;
set local search_path = public, pg_catalog;

create temporary table e21_4_6_history_snapshot (
  source text primary key,
  rows_json jsonb not null
) on commit drop;

insert into e21_4_6_history_snapshot (source, rows_json)
select
  'events',
  coalesce(jsonb_agg(to_jsonb(event_row) order by event_row.id), '[]'::jsonb)
from public.openai_lp_cost_events event_row
union all
select
  'coverage',
  coalesce(jsonb_agg(to_jsonb(coverage_row) order by coverage_row.singleton), '[]'::jsonb)
from public.openai_lp_cost_coverage coverage_row;

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.openai_lp_cost_events'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.openai_lp_cost_coverage'::regclass) then
    raise exception 'RLS must remain enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('openai_lp_cost_events', 'openai_lp_cost_coverage')
  ) then
    raise exception 'client policies must remain absent';
  end if;

  if (
    select array_agg(conname::text order by conname)
    from pg_constraint
    where conrelid in (
      'public.openai_lp_cost_events'::regclass,
      'public.openai_lp_cost_coverage'::regclass
    )
  ) is distinct from array[
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
  ]::text[] or (
    select array_agg(index_class.relname::text order by index_class.relname)
    from pg_index index_binding
    join pg_class index_class on index_class.oid = index_binding.indexrelid
    where index_binding.indrelid in (
      'public.openai_lp_cost_events'::regclass,
      'public.openai_lp_cost_coverage'::regclass
    )
  ) is distinct from array[
    'openai_lp_cost_coverage_pkey',
    'openai_lp_cost_events_attempt_kind_key',
    'openai_lp_cost_events_period_idx',
    'openai_lp_cost_events_pkey',
    'openai_lp_cost_events_started_period_idx'
  ]::text[] or (
    select array_agg(tgname::text order by tgname)
    from pg_trigger
    where tgrelid in (
      'public.openai_lp_cost_events'::regclass,
      'public.openai_lp_cost_coverage'::regclass
    )
      and not tgisinternal
  ) is distinct from array[
    'openai_lp_cost_coverage_prevent_mutation',
    'openai_lp_cost_events_prevent_mutation'
  ]::text[] then
    raise exception 'historical structure must remain intact';
  end if;

  if not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'SELECT')
     or has_table_privilege('service_role', 'public.openai_lp_cost_events', 'INSERT,UPDATE,DELETE,TRUNCATE')
     or not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'SELECT')
     or has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'INSERT,UPDATE,DELETE,TRUNCATE') then
    raise exception 'service_role tables must be read-only';
  end if;

  if has_function_privilege('service_role', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('service_role', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
     or has_function_privilege('service_role', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE') then
    raise exception 'service_role RPC privileges must be read-only';
  end if;

  if has_table_privilege('anon', 'public.openai_lp_cost_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('authenticated', 'public.openai_lp_cost_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('anon', 'public.openai_lp_cost_coverage', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('authenticated', 'public.openai_lp_cost_coverage', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
     or has_function_privilege('anon', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE') then
    raise exception 'client roles must not access historical tables';
  end if;

  if exists (
    select 1
    from pg_class target
    cross join lateral aclexplode(coalesce(target.relacl, acldefault('r', target.relowner))) privilege
    where target.oid in (
      'public.openai_lp_cost_events'::regclass,
      'public.openai_lp_cost_coverage'::regclass
    )
      and privilege.grantee = 0
  ) or exists (
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
  ) then
    raise exception 'PUBLIC must not access historical cost objects';
  end if;

  if to_regrole('ai_readonly') is not null and (
    has_table_privilege('ai_readonly', 'public.openai_lp_cost_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
    or has_table_privilege('ai_readonly', 'public.openai_lp_cost_coverage', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
    or has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric,integer,text,text)', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
  ) then
    raise exception 'ai_readonly must not access historical cost objects';
  end if;
end;
$$;

set local role service_role;

do $$
begin
  begin
    insert into public.openai_lp_cost_coverage (activated_at)
    values (clock_timestamp());
    raise exception 'service_role INSERT should have failed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.append_openai_lp_cost_start_v1(
      'e2146000-0000-4000-8000-000000000001',
      'e2146000-0000-4000-8000-000000000002',
      'e2146000-0000-4000-8000-000000000003',
      'landing_page_draft_generation',
      'gpt-5.6-luna',
      'repo_catalog',
      '1',
      'high',
      null,
      null,
      'historical-test'
    );
    raise exception 'service_role start RPC should have failed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.append_openai_lp_cost_terminal_v1(
      'e2146000-0000-4000-8000-000000000001',
      'landing_page_draft_generation',
      'failure',
      null,
      null,
      null,
      null,
      null,
      null
    );
    raise exception 'service_role terminal RPC should have failed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.register_openai_lp_cost_coverage_v1(clock_timestamp());
    raise exception 'service_role coverage RPC should have failed';
  exception when insufficient_privilege then null;
  end;

  perform count(*)
  from public.read_openai_lp_cost_events_v1(
    clock_timestamp() - interval '1 day',
    clock_timestamp()
  );
end;
$$;

reset role;

do $$
begin
  if (select rows_json from e21_4_6_history_snapshot where source = 'events') is distinct from (
    select coalesce(jsonb_agg(to_jsonb(event_row) order by event_row.id), '[]'::jsonb)
    from public.openai_lp_cost_events event_row
  ) or (select rows_json from e21_4_6_history_snapshot where source = 'coverage') is distinct from (
    select coalesce(jsonb_agg(to_jsonb(coverage_row) order by coverage_row.singleton), '[]'::jsonb)
    from public.openai_lp_cost_coverage coverage_row
  ) then
    raise exception 'historical rows or cutoff changed during negative checks';
  end if;
end;
$$;

rollback;
