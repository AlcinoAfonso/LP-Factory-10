begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e2154000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e21.5.4-test@example.com', now(), now());
insert into public.accounts (id, owner_user_id, name, slug, subdomain, status)
values ('e2154000-0000-4000-8000-000000000002', 'e2154000-0000-4000-8000-000000000001', 'E21.5.4 Test', 'e21-5-4-test', 'e21-5-4-test', 'active');

set local role service_role;

do $$
declare
  v_execution uuid := 'e2154000-0000-4000-8000-000000000003';
  v_operation uuid := 'e2154000-0000-4000-8000-000000000004';
  v_retry uuid := 'e2154000-0000-4000-8000-000000000005';
  v_started timestamptz := '2026-09-11T12:00:00Z';
  v_first record;
  v_second record;
begin
  perform public.start_openai_cost_execution_v1(v_execution, 'landing_page_dynamic_market_research', 'production', 'runtime', 'client', 'attributed', 'e2154000-0000-4000-8000-000000000002', 'baseline', '1', v_started);
  perform public.start_openai_cost_operation_v1(v_operation, v_execution, 1, null, 'gpt-5.6-luna', 'high', 'repo_catalog', 'v1', 'prompt-1', 'contract-1', null, v_started);
  perform public.start_openai_cost_operation_v1(v_retry, v_execution, 2, v_operation, 'gpt-5.6-luna', 'high', 'repo_catalog', 'v1', 'prompt-1', 'contract-1', null, v_started + interval '1 second');

  perform public.finish_openai_cost_operation_v2(
    v_operation, 'success', null, 200, 'resp_1', 'req_1', null, null,
    1000000, 100000, 50000, 200000, 10000, 1200000, 2,
    'web-search-2026-09-11-v1', 9007199254740993.987654321012, '2026-09-11-standard-v1',
    '2026-09-11T00:00:00Z', '{"currency":"usd","model":"gpt-5.6-luna"}'::jsonb,
    'calculated', null, 9007199254740993.123456789012, v_started + interval '2 seconds'
  );
  perform public.finish_openai_cost_operation_v2(
    v_operation, 'success', null, 200, 'resp_1', 'req_1', null, null,
    1000000, 100000, 50000, 200000, 10000, 1200000, 2,
    'web-search-2026-09-11-v1', 9007199254740993.987654321012, '2026-09-11-standard-v1',
    '2026-09-11T00:00:00Z', '{"currency":"usd","model":"gpt-5.6-luna"}'::jsonb,
    'calculated', null, 9007199254740993.123456789012, v_started + interval '2 seconds'
  );
  perform public.finish_openai_cost_operation_v2(
    v_retry, 'failure', 'provider_error', 429, null, null, 'rate_limit', 'provider_error',
    null, null, null, null, null, null, 0,
    null, null, null, null, null,
    'unavailable', 'usage_missing', null, v_started + interval '3 seconds'
  );
  perform public.finish_openai_cost_execution_v1(v_execution, 'success', null, v_started + interval '4 seconds');

  if (select cost_usd from public.openai_cost_operations where id = v_operation) <> 9007199254740993.123456789012 then
    raise exception 'exact calculated cost missing';
  end if;
  if (select cost_usd is not null or cost_status <> 'unavailable' from public.openai_cost_operations where id = v_retry) then
    raise exception 'unavailable operation invented a cost';
  end if;

  select * into strict v_first from public.read_openai_active_cost_rows_v1(
    v_started, v_started + interval '1 day', null, null, null, 1
  );
  select * into strict v_second from public.read_openai_active_cost_rows_v1(
    v_started, v_started + interval '1 day', v_first.cursor_started_at,
    v_first.execution_id, v_first.operation_sequence, 1
  );
  if v_first.operation_sequence <> 1 or v_second.operation_sequence <> 2 then
    raise exception 'keyset pagination did not progress';
  end if;
  if pg_typeof(v_first.cost_usd) <> 'text'::regtype
     or pg_typeof(v_first.web_search_price_per_call_usd) <> 'text'::regtype
     or v_first.cost_usd <> '9007199254740993.123456789012'
     or v_first.web_search_price_per_call_usd <> '9007199254740993.987654321012' then
    raise exception 'lossless decimal read contract violated';
  end if;

  begin
    perform public.finish_openai_cost_operation_v2(
      v_operation, 'success', null, 200, 'resp_1', 'req_1', null, null,
      1000000, 100000, 50000, 200000, 10000, 1200000, 2,
      'web-search-2026-09-11-v1', 0.01, '2026-09-11-standard-v1',
      '2026-09-11T00:00:00Z', '{"currency":"usd","model":"gpt-5.6-luna"}'::jsonb,
      'calculated', null, 9.999, v_started + interval '2 seconds'
    );
    raise exception 'divergent terminal replay must fail';
  exception when unique_violation then null;
  end;

  begin
    update public.openai_cost_operations set cost_usd = 9.999 where id = v_operation;
    raise exception 'historical repricing must fail';
  exception when object_not_in_prerequisite_state then null;
  end;
end;
$$;

reset role;

do $$
begin
  if not has_function_privilege('service_role', 'public.finish_openai_cost_operation_v2(uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,text,numeric,text,timestamptz,jsonb,text,text,numeric,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.read_openai_active_cost_rows_v1(timestamptz,timestamptz,timestamptz,uuid,integer,integer)', 'EXECUTE') then
    raise exception 'E21.5.4 function privilege violated';
  end if;
end;
$$;

rollback;
