begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('d10d0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'd10d-test@example.com', now(), now());
insert into public.accounts (id, owner_user_id, name, slug, subdomain, status)
values ('d10d0000-0000-4000-8000-000000000002', 'd10d0000-0000-4000-8000-000000000001', 'D10D Test', 'd10d-test', 'd10d-test', 'active');

create function pg_temp.d10d_operation(
  op uuid, execution uuid, seq integer, retry uuid, at timestamptz, amount numeric, failed boolean default false
) returns void language plpgsql as $$
begin
  if not public.admit_openai_cost_operation_v2(op, execution, seq, retry, 'gpt-6.2-sol', 'high',
    'repo_catalog', 'v1', null, null, null, at, 'preview', 'communication_base_stage2_intelligence') then
    raise exception 'expected new admission';
  end if;
  perform public.finish_openai_cost_operation_v2(
    op, case when failed then 'failure' else 'success' end,
    case when failed then 'provider_error' end, case when failed then 502 else 200 end,
    null, null, null, null, 2, 1, 0, 1, 0, 3, 1,
    'web-search-test', 0.01, 'd10d-test', at, '{"model":"gpt-6.2-sol"}'::jsonb,
    case when amount is null then 'unavailable' else 'calculated' end,
    case when amount is null then 'usage_missing' end, amount, at + interval '1 second'
  );
end;
$$;

set local role service_role;

do $$
declare
  account constant uuid := 'd10d0000-0000-4000-8000-000000000002';
  generated constant uuid := gen_random_uuid();
  regenerated constant uuid := gen_random_uuid();
  adjusted constant uuid := gen_random_uuid();
  old_occurrence constant uuid := gen_random_uuid();
  unlinked constant uuid := gen_random_uuid();
  execution uuid;
  first_execution uuid;
  attempt constant uuid := gen_random_uuid();
  retried constant uuid := gen_random_uuid();
  october constant timestamptz := '2026-10-01T00:00:00Z';
  november constant timestamptz := '2026-11-01T00:00:00Z';
  december constant timestamptz := '2026-12-01T00:00:00Z';
  start_at constant timestamptz := '2026-10-31T23:59:58Z';
  first_row record;
  next_row record;
  lifetime record;
begin
  for section in 1..7 loop
    execution := gen_random_uuid();
    perform public.start_openai_cost_execution_v4(execution, 'communication_base_stage2_intelligence',
      'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, start_at, generated,
      'communication_base', account, 'category_3_generate');
    if section = 1 then
      first_execution := execution;
      perform pg_temp.d10d_operation(attempt, execution, 1, null, '2026-10-31T23:59:59.999999Z', 0.03);
      perform pg_temp.d10d_operation(retried, execution, 2, attempt, november, 0.05, true);
    else
      perform pg_temp.d10d_operation(gen_random_uuid(), execution, 1, null, '2026-11-01T00:00:00.000001Z', 0);
    end if;
  end loop;

  begin
    perform public.start_openai_cost_execution_v4(gen_random_uuid(), 'communication_base_stage2_intelligence',
      'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, start_at, generated,
      'communication_base', account, 'communication_base_adjust');
    raise exception 'divergent action was accepted';
  exception when unique_violation then null;
  end;

  begin
    perform public.start_openai_cost_execution_v4(gen_random_uuid(), 'communication_base_stage2_intelligence',
      'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, start_at, gen_random_uuid(),
      null, null, 'category_3_generate');
    raise exception 'product action was accepted without a product';
  exception when check_violation then null;
  end;

  perform public.close_openai_cost_occurrence_v1(generated, 'preview', 'runtime', 'client', account);
  if public.admit_openai_cost_operation_v2(attempt, first_execution, 1, null, 'gpt-6.2-sol', 'high',
    'repo_catalog', 'v1', null, null, null, '2026-10-31T23:59:59.999999Z', 'preview', 'communication_base_stage2_intelligence') then
    raise exception 'replay after closure released another provider send';
  end if;
  begin
    perform pg_temp.d10d_operation(gen_random_uuid(), first_execution, 3, null, november, null);
    raise exception 'new admission after closure was accepted';
  exception when object_not_in_prerequisite_state then null;
  end;

  execution := gen_random_uuid();
  perform public.start_openai_cost_execution_v4(execution, 'communication_base_stage2_intelligence',
    'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, start_at, regenerated,
    'communication_base', account, 'category_3_generate');
  perform pg_temp.d10d_operation(gen_random_uuid(), execution, 1, null, start_at, 0.04);
  perform pg_temp.d10d_operation(gen_random_uuid(), execution, 2, null, november + interval '5 seconds', null);

  execution := gen_random_uuid();
  perform public.start_openai_cost_execution_v4(execution, 'communication_base_stage2_intelligence',
    'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, november, adjusted,
    'communication_base', account, 'communication_base_adjust');
  perform pg_temp.d10d_operation(gen_random_uuid(), execution, 1, null, november + interval '2 seconds', 0.02);
  perform public.admit_openai_cost_operation_v2(gen_random_uuid(), execution, 2, null, 'gpt-6.2-sol', 'high',
    'repo_catalog', 'v1', null, null, null, november + interval '3 seconds', 'preview', 'communication_base_stage2_intelligence');

  execution := gen_random_uuid();
  perform public.start_openai_cost_execution_v4(execution, 'niche_resolution',
    'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, november, unlinked,
    null, null, 'niche_resolution');
  if not exists (select from public.read_openai_active_cost_rows_v3(november, december)
    where occurrence_id = unlinked and action_kind = 'niche_resolution'
      and product_type is null and product_instance_id is null and operation_id is null) then
    raise exception 'activity with declared action and no product was lost';
  end if;

  perform public.start_openai_cost_execution_v3(gen_random_uuid(), 'niche_resolution',
    'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, start_at, old_occurrence);
  perform public.start_openai_cost_execution_v4(gen_random_uuid(), 'niche_resolution',
    'preview', 'runtime', 'client', 'attributed', account, null, null, null, null, null, null, start_at, old_occurrence,
    null, null, 'niche_resolution');
  if exists (select from public.read_openai_active_cost_rows_v3(october, november)
    where occurrence_id = old_occurrence and (action_kind is not null or product_type is not null)) then
    raise exception 'legacy occurrence was reclassified';
  end if;

  if (select sum(cost_usd::numeric) from public.read_openai_active_cost_rows_v3(october, november)
      where occurrence_id = generated) is distinct from 0.03::numeric
    or (select sum(cost_usd::numeric) from public.read_openai_active_cost_rows_v3(november, december)
      where occurrence_id = generated) is distinct from 0.05::numeric
    or (select sum(cost_usd) from public.openai_cost_operations o join public.openai_cost_executions e
      on e.id = o.execution_id where e.occurrence_id = generated) is distinct from 0.08::numeric
    or (select count(*) from public.openai_cost_executions where occurrence_id = generated) <> 7 then
    raise exception 'generation, monthly parts or complete cost incorrect';
  end if;

  select * into strict first_row from public.read_openai_active_cost_rows_v3(november, december, null, null, null, 2)
    where operation_id = retried;
  select * into strict next_row from public.read_openai_active_cost_rows_v3(november, december,
    first_row.cursor_started_at, first_row.execution_id, first_row.operation_sequence, 2)
    where operation_id is not null
    order by cursor_started_at, execution_id, operation_sequence limit 1;
  if first_row.operation_id <> retried or next_row.cursor_started_at <> '2026-11-01T00:00:00.000001Z'::timestamptz
    or first_row.execution_started_at <> start_at or first_row.operation_result <> 'failure'
    or first_row.retry_of_operation_id <> attempt or first_row.web_search_call_count <> 1
    or first_row.cached_input_tokens <> 1 then
    raise exception 'keyset or financial details changed';
  end if;

  select * into strict lifetime from public.read_openai_product_cost_v1(account);
  if lifetime.calculated_usd::numeric is distinct from 0.14::numeric
    or lifetime.pending_count <> 1 or lifetime.unavailable_count <> 1 or lifetime.open_occurrence_count <> 2 then
    raise exception 'product lifetime or incomplete states incorrect';
  end if;
  if not exists (select from public.read_openai_active_cost_rows_v1(october, november) where operation_id = retried)
    or not exists (select from public.read_openai_active_cost_rows_v2(october, november) where operation_id = retried) then
    raise exception 'legacy readers should retain execution-period semantics';
  end if;
end;
$$;

reset role;
do $$
begin
  if exists (
    select from pg_proc p cross join (values ('anon'), ('authenticated'), ('ai_readonly')) role(name)
    where p.pronamespace = 'public'::regnamespace
      and proname in ('read_openai_active_cost_rows_v3', 'read_openai_product_cost_v1', 'start_openai_cost_execution_v4')
      and (has_function_privilege(role.name, p.oid, 'EXECUTE') or p.prosecdef)
  ) or has_column_privilege('service_role', 'public.openai_cost_occurrence_lifecycle', 'action_kind', 'UPDATE') then
    raise exception 'unexpected function grants or permission to mutate identity';
  end if;
end;
$$;

rollback;
