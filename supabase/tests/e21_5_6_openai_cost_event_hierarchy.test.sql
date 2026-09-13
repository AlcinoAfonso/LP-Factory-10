begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e2156000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e21.5.6-test@example.com', now(), now());
insert into public.accounts (id, owner_user_id, name, slug, subdomain, status)
values ('e2156000-0000-4000-8000-000000000002', 'e2156000-0000-4000-8000-000000000001', 'Cliente E21.5.6', 'e21-5-6-test', 'e21-5-6-test', 'active');
insert into public.account_landing_pages (id, account_id, name, slug, status, created_by)
values ('e2156000-0000-4000-8000-000000000003', 'e2156000-0000-4000-8000-000000000002', 'LP E21.5.6', 'lp-e21-5-6', 'draft', 'e2156000-0000-4000-8000-000000000001');
insert into public.business_taxons (id, level, name, slug, is_active)
values ('e2156000-0000-4000-8000-000000000004', 'niche', 'Taxon E21.5.6', 'taxon-e21-5-6', true);

set local role service_role;

do $$
declare
  v_started timestamptz := '2026-09-12T20:00:00Z';
  v_landing uuid := 'e2156000-0000-4000-8000-000000000010';
  v_niche uuid := 'e2156000-0000-4000-8000-000000000011';
  v_internal uuid := 'e2156000-0000-4000-8000-000000000012';
  v_uncorrelated uuid := 'e2156000-0000-4000-8000-000000000013';
  v_v1_bridge uuid := 'e2156000-0000-4000-8000-000000000014';
  v_row record;
begin
  perform public.start_openai_cost_execution_v2(
    v_landing, 'niche_resolution', 'production', 'runtime', 'client', 'attributed',
    'e2156000-0000-4000-8000-000000000002', 'landing_page',
    'e2156000-0000-4000-8000-000000000003', 'e2156000-0000-4000-8000-000000000003', null,
    null, null, v_started
  );
  perform public.start_openai_cost_execution_v2(
    v_landing, 'niche_resolution', 'production', 'runtime', 'client', 'attributed',
    'e2156000-0000-4000-8000-000000000002', 'landing_page',
    'e2156000-0000-4000-8000-000000000003', 'e2156000-0000-4000-8000-000000000003', null,
    null, null, v_started
  );
  perform public.start_openai_cost_execution_v2(
    v_niche, 'niche_resolution', 'production', 'runtime', 'client', 'attributed',
    'e2156000-0000-4000-8000-000000000002', 'niche_resolution',
    'e2156000-0000-4000-8000-000000000021', null, null,
    null, null, v_started + interval '1 second'
  );
  perform public.start_openai_cost_execution_v2(
    v_internal, 'taxon_input_catalog_sufficiency_evaluation', 'production', 'runtime',
    'lp_factory', 'attributed', null, 'lp_factory_internal',
    'e2156000-0000-4000-8000-000000000022', null,
    'e2156000-0000-4000-8000-000000000004', null, null, v_started + interval '2 seconds'
  );
  perform public.start_openai_cost_execution_v2(
    v_uncorrelated, 'supabase_inspect', 'production', 'administrative_proof',
    'lp_factory', 'attributed', null, null, null, null, null,
    null, null, v_started + interval '3 seconds'
  );
  perform public.start_openai_cost_execution_v1(
    v_v1_bridge, 'supabase_inspect', 'production', 'administrative_proof',
    'lp_factory', 'attributed', null, null, null, v_started + interval '4 seconds'
  );
  if exists (
    select 1 from public.openai_cost_executions
    where id = v_v1_bridge
      and (economic_event_kind is not null or economic_event_id is not null
        or landing_page_id is not null or taxon_id is not null)
  ) then
    raise exception 'v1 bridge row must remain uncorrelated without backfill';
  end if;

  select * into strict v_row from public.read_openai_active_cost_rows_v2(
    v_started, v_started + interval '1 day', null, null, null, 1
  );
  if v_row.execution_id <> v_landing or v_row.operation_sequence <> 0
     or v_row.account_name <> 'Cliente E21.5.6'
     or v_row.landing_page_name <> 'LP E21.5.6' then
    raise exception 'v2 read model did not preserve landing page identity or execution without operation';
  end if;

  select * into strict v_row from public.read_openai_active_cost_rows_v2(
    v_started, v_started + interval '1 day', v_started + interval '1 second', v_niche, 0, 1
  );
  if v_row.execution_id <> v_internal or v_row.taxon_name <> 'Taxon E21.5.6' then
    raise exception 'v2 keyset or taxon label failed';
  end if;

  begin
    update public.openai_cost_executions
    set economic_event_id = 'e2156000-0000-4000-8000-000000000099'
    where id = v_niche;
    raise exception 'economic identity mutation must fail';
  exception
    when insufficient_privilege or object_not_in_prerequisite_state then null;
  end;

  begin
    perform public.start_openai_cost_execution_v2(
      'e2156000-0000-4000-8000-000000000030', 'niche_resolution', 'production', 'runtime',
      'client', 'attributed', 'e2156000-0000-4000-8000-000000000002',
      'niche_resolution', 'e2156000-0000-4000-8000-000000000030', null, null,
      null, null, v_started
    );
    raise exception 'technical execution id must not become economic identity';
  exception when check_violation then null;
  end;

  begin
    perform public.start_openai_cost_execution_v2(
      'e2156000-0000-4000-8000-000000000031', 'niche_resolution', 'production', 'runtime',
      'client', 'attributed', 'e2156000-0000-4000-8000-000000000002',
      'landing_page', 'e2156000-0000-4000-8000-000000000021', null, null,
      null, null, v_started
    );
    raise exception 'incomplete landing page correlation must fail';
  exception when check_violation then null;
  end;

  begin
    perform public.start_openai_cost_execution_v2(
      'e2156000-0000-4000-8000-000000000032', 'niche_resolution', 'production', 'runtime',
      'client', 'attributed', 'e2156000-0000-4000-8000-000000000002',
      null, 'e2156000-0000-4000-8000-000000000023', null, null,
      null, null, v_started
    );
    raise exception 'partial correlation with null kind must fail';
  exception when check_violation then null;
  end;
end;
$$;

reset role;

do $$
declare
  v_table text;
  v_execution_update_columns text[];
  v_operation_update_columns text[];
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in (
      'openai_cost_executions', 'openai_cost_operations', 'openai_cost_coverage'
    ) and c.relrowsecurity
    group by n.nspname
    having count(*) = 3
  ) then
    raise exception 'active cost tables must keep RLS enabled';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.openai_cost_executions'::regclass
      and conname = 'openai_cost_executions_economic_event_chk'
      and contype = 'c'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.openai_cost_executions'::regclass
      and conname = 'openai_cost_executions_landing_page_fkey'
      and contype = 'f' and confupdtype = 'r' and confdeltype = 'r'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.openai_cost_executions'::regclass
      and conname = 'openai_cost_executions_taxon_id_fkey'
      and contype = 'f' and confupdtype = 'r' and confdeltype = 'r'
  ) then
    raise exception 'economic constraints and restrictive foreign keys must exist';
  end if;
  if not exists (
    select 1 from pg_index i
    join pg_class c on c.oid = i.indexrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'openai_cost_executions_economic_event_idx'
      and i.indpred is not null
      and pg_get_indexdef(i.indexrelid) like '%(economic_event_kind, economic_event_id, started_at, id)%'
      and pg_get_expr(i.indpred, i.indrelid) = '(economic_event_id IS NOT NULL)'
  ) then
    raise exception 'partial economic event index must exist';
  end if;
  if not has_function_privilege(
    'service_role',
    'public.start_openai_cost_execution_v2(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)',
    'EXECUTE'
  ) or not has_function_privilege(
    'service_role',
    'public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)',
    'EXECUTE'
  ) then
    raise exception 'service_role must execute both v2 RPCs';
  end if;
  if (
    select count(*) <> 2
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('start_openai_cost_execution_v2', 'read_openai_active_cost_rows_v2')
      and not p.prosecdef
      and p.proconfig = array['search_path=pg_catalog']
  ) then
    raise exception 'v2 RPCs must remain security invoker with fixed pg_catalog search_path';
  end if;
  if has_function_privilege('authenticated',
      'public.start_openai_cost_execution_v2(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)', 'EXECUTE')
    or has_function_privilege('authenticated',
      'public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)', 'EXECUTE')
    or has_function_privilege('anon',
      'public.start_openai_cost_execution_v2(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)', 'EXECUTE')
    or has_function_privilege('anon',
      'public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)', 'EXECUTE') then
    raise exception 'v2 RPCs must not be exposed through client roles';
  end if;
  if to_regrole('ai_readonly') is not null and (
    has_function_privilege(
      'ai_readonly',
      'public.start_openai_cost_execution_v2(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)',
      'EXECUTE'
    ) or has_function_privilege(
      'ai_readonly',
      'public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)',
      'EXECUTE'
    )
  ) then
    raise exception 'ai_readonly must not execute v2 RPCs';
  end if;
  foreach v_table in array array[
    'public.openai_cost_executions',
    'public.openai_cost_operations',
    'public.openai_cost_coverage'
  ] loop
    if not has_table_privilege('service_role', v_table, 'SELECT')
       or not has_table_privilege('service_role', v_table, 'INSERT')
       or has_table_privilege('service_role', v_table, 'DELETE')
       or has_table_privilege('service_role', v_table, 'TRUNCATE')
       or has_table_privilege('authenticated', v_table, 'SELECT')
       or has_table_privilege('authenticated', v_table, 'INSERT')
       or has_table_privilege('authenticated', v_table, 'UPDATE')
       or has_table_privilege('authenticated', v_table, 'DELETE')
       or has_table_privilege('authenticated', v_table, 'TRUNCATE')
       or has_table_privilege('anon', v_table, 'SELECT')
       or has_table_privilege('anon', v_table, 'INSERT')
       or has_table_privilege('anon', v_table, 'UPDATE')
       or has_table_privilege('anon', v_table, 'DELETE')
       or has_table_privilege('anon', v_table, 'TRUNCATE')
       or (to_regrole('ai_readonly') is not null and (
         has_table_privilege('ai_readonly', v_table, 'SELECT')
         or has_table_privilege('ai_readonly', v_table, 'INSERT')
         or has_table_privilege('ai_readonly', v_table, 'UPDATE')
         or has_table_privilege('ai_readonly', v_table, 'DELETE')
         or has_table_privilege('ai_readonly', v_table, 'TRUNCATE')
       )) then
      raise exception 'active cost table grants must remain minimal for %', v_table;
    end if;
  end loop;

  select array_agg(column_name order by column_name)
  into v_execution_update_columns
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'openai_cost_executions'
    and grantee = 'service_role' and privilege_type = 'UPDATE';
  if v_execution_update_columns is distinct from array[
    'failure_category', 'finished_at', 'result'
  ]::text[] then
    raise exception 'execution update allowlist drift: %', v_execution_update_columns;
  end if;

  select array_agg(column_name order by column_name)
  into v_operation_update_columns
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'openai_cost_operations'
    and grantee = 'service_role' and privilege_type = 'UPDATE';
  if v_operation_update_columns is distinct from array[
    'cache_write_tokens', 'cached_input_tokens', 'cost_status',
    'cost_unavailable_reason', 'cost_usd', 'failure_category', 'finished_at',
    'http_status', 'input_tokens', 'output_tokens', 'pricing_effective_at',
    'pricing_snapshot', 'pricing_version', 'provider_error_code',
    'provider_error_type', 'provider_request_id', 'provider_response_id',
    'reasoning_tokens', 'result', 'total_tokens', 'web_search_call_count',
    'web_search_price_per_call_usd', 'web_search_tool_version'
  ]::text[] then
    raise exception 'operation update allowlist drift: %', v_operation_update_columns;
  end if;
  if exists (
    select 1 from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'openai_cost_coverage'
      and grantee = 'service_role' and privilege_type = 'UPDATE'
  ) then
    raise exception 'coverage must not expose update columns';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('openai_cost_executions', 'openai_cost_operations', 'openai_cost_coverage')
  ) then
    raise exception 'active cost tables must keep zero direct policies';
  end if;
end;
$$;

rollback;
