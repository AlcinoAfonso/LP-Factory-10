begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e2153000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e21.5.3-test@example.com', now(), now());
insert into public.accounts (id, owner_user_id, name, slug, subdomain, status)
values ('e2153000-0000-4000-8000-000000000002', 'e2153000-0000-4000-8000-000000000001', 'E21.5.3 Test', 'e21-5-3-test', 'e21-5-3-test', 'active');

set local role service_role;

do $$
declare
  v_execution uuid := 'e2153000-0000-4000-8000-000000000003';
  v_operation uuid := 'e2153000-0000-4000-8000-000000000004';
  v_retry uuid := 'e2153000-0000-4000-8000-000000000005';
  v_started timestamptz := '2026-09-11T12:00:00Z';
begin
  perform public.start_openai_cost_execution_v1(v_execution, 'niche_resolution', 'development', 'runtime', 'client', 'attributed', 'e2153000-0000-4000-8000-000000000002', null, null, v_started);
  perform public.start_openai_cost_execution_v1(v_execution, 'niche_resolution', 'development', 'runtime', 'client', 'attributed', 'e2153000-0000-4000-8000-000000000002', null, null, v_started);
  perform public.start_openai_cost_operation_v1(v_operation, v_execution, 1, null, 'gpt-5.6-luna', 'low', 'repo_catalog', '1', null, '1', null, v_started);
  perform public.start_openai_cost_operation_v1(v_retry, v_execution, 2, v_operation, 'gpt-5.6-luna', 'low', 'repo_catalog', '1', null, '1', null, v_started + interval '1 second');
  perform public.finish_openai_cost_operation_v1(v_operation, 'success', null, null, 'resp_1', 'req_1', null, null, 10, 2, null, 4, 1, 14, 0, v_started + interval '2 seconds');
  perform public.finish_openai_cost_execution_v1(v_execution, 'success', null, v_started + interval '3 seconds');
  perform public.register_openai_cost_coverage_v1('development', 'niche_resolution', v_started, 'e21.5.3-v1', '{"source":"test"}'::jsonb);
  if (select count(*) from public.openai_cost_executions where id = v_execution) <> 1 then raise exception 'execution replay duplicated'; end if;
  if (select count(*) from public.openai_cost_operations where execution_id = v_execution) <> 2 then raise exception 'operation or retry missing'; end if;
  if (select cost_status from public.openai_cost_operations where id = v_operation) <> 'unavailable' then raise exception 'phase 3 must preserve unavailable cost'; end if;

  begin
    perform public.start_openai_cost_execution_v1(v_execution, 'niche_resolution', 'development', 'runtime', 'client', 'unassigned', null, null, null, v_started);
    raise exception 'divergent execution replay must fail';
  exception when unique_violation then null;
  end;

  perform public.start_openai_cost_execution_v1('e2153000-0000-4000-8000-000000000006', 'commercial_activation_draft_generation', 'development', 'runtime', 'lp_factory', 'attributed', null, null, null, v_started);
  begin
    insert into public.openai_cost_operations (
      id, execution_id, sequence, retry_of_operation_id, model, reasoning_effort,
      configuration_source, configuration_revision, started_at
    ) values (
      'e2153000-0000-4000-8000-000000000007',
      'e2153000-0000-4000-8000-000000000006', 2, v_operation,
      'gpt-5.6-luna', 'low', 'repo_catalog', '1', v_started
    );
    raise exception 'cross-execution retry must fail';
  exception when foreign_key_violation then null;
  end;

  begin
    update public.openai_cost_executions set created_at = created_at + interval '1 second' where id = v_execution;
    raise exception 'created_at mutation must fail';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename in ('openai_cost_executions', 'openai_cost_operations', 'openai_cost_coverage')) then
    raise exception 'direct RLS policies are forbidden';
  end if;
  if has_table_privilege('anon', 'public.openai_cost_executions', 'SELECT')
     or has_table_privilege('authenticated', 'public.openai_cost_operations', 'SELECT')
     or has_table_privilege('service_role', 'public.openai_cost_operations', 'DELETE')
     or has_table_privilege('service_role', 'public.openai_cost_operations', 'UPDATE')
     or not has_column_privilege('service_role', 'public.openai_cost_operations', 'finished_at', 'UPDATE')
     or has_column_privilege('service_role', 'public.openai_cost_operations', 'created_at', 'UPDATE') then
    raise exception 'least privilege violated';
  end if;
  if not has_function_privilege('service_role', 'public.start_openai_cost_execution_v1(uuid,text,text,text,text,text,uuid,text,text,timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.finish_openai_cost_execution_v1(uuid,text,text,timestamptz)', 'EXECUTE') then
    raise exception 'function privilege violated';
  end if;
  if (select count(*) from pg_trigger where tgrelid in ('public.openai_cost_executions'::regclass, 'public.openai_cost_operations'::regclass, 'public.openai_cost_coverage'::regclass) and not tgisinternal) <> 3 then
    raise exception 'expected mutation guards missing';
  end if;
end;
$$;

rollback;
