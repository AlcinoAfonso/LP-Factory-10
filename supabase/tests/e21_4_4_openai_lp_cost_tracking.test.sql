begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2144000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e21.4.4-test@example.com',
  now(),
  now()
);

insert into public.accounts (id, owner_user_id, name, slug, subdomain, status)
values (
  'e2144000-0000-4000-8000-000000000002',
  'e2144000-0000-4000-8000-000000000001',
  'E21.4.4 Test',
  'e21-4-4-test',
  'e21-4-4-test',
  'active'
);

insert into public.account_landing_pages (id, account_id, created_by, slug, name, status)
values (
  'e2144000-0000-4000-8000-000000000003',
  'e2144000-0000-4000-8000-000000000002',
  'e2144000-0000-4000-8000-000000000001',
  'lp-custos',
  'LP custos',
  'draft'
);

set local role service_role;

do $$
declare
  v_attempt uuid := 'e2144000-0000-4000-8000-000000000004';
  v_start_id uuid;
  v_retry_id uuid;
  v_terminal_id uuid;
  v_terminal_retry_id uuid;
  v_cutoff timestamptz := clock_timestamp() - interval '1 minute';
begin
  v_start_id := public.append_openai_lp_cost_start_v1(
    v_attempt,
    'e2144000-0000-4000-8000-000000000002',
    'e2144000-0000-4000-8000-000000000003',
    'landing_page_draft_generation',
    'gpt-5.6-luna',
    'supabase_operational',
    '1',
    'max',
    null,
    null,
    '2026-08-28.openai-published-v1'
  );
  v_retry_id := public.append_openai_lp_cost_start_v1(
    v_attempt,
    'e2144000-0000-4000-8000-000000000002',
    'e2144000-0000-4000-8000-000000000003',
    'landing_page_draft_generation',
    'gpt-5.6-luna',
    'supabase_operational',
    '1',
    'max',
    null,
    null,
    '2026-08-28.openai-published-v1'
  );
  if v_start_id is distinct from v_retry_id then
    raise exception 'start retry must be idempotent';
  end if;

  v_terminal_id := public.append_openai_lp_cost_terminal_v1(
    v_attempt,
    'landing_page_draft_generation',
    'success',
    '{"inputTokens":100,"ordinaryInputTokens":100,"cachedInputTokens":0,"cacheWriteTokens":0,"outputTokens":20}'::jsonb,
    '{"serviceTier":"default","contextBand":"short","inputUsdPerMillion":"0.20","cachedInputUsdPerMillion":"0.02","cacheWriteUsdPerMillion":"0.25","outputUsdPerMillion":"1.20"}'::jsonb,
    0.000044
  );
  if v_terminal_id is null then
    raise exception 'terminal was not appended';
  end if;
  v_terminal_retry_id := public.append_openai_lp_cost_terminal_v1(
    v_attempt,
    'landing_page_draft_generation',
    'success',
    '{"inputTokens":100,"ordinaryInputTokens":100,"cachedInputTokens":0,"cacheWriteTokens":0,"outputTokens":20}'::jsonb,
    '{"serviceTier":"default","contextBand":"short","inputUsdPerMillion":"0.20","cachedInputUsdPerMillion":"0.02","cacheWriteUsdPerMillion":"0.25","outputUsdPerMillion":"1.20"}'::jsonb,
    0.000044
  );
  if v_terminal_retry_id is distinct from v_terminal_id then
    raise exception 'terminal retry must be idempotent';
  end if;

  begin
    perform public.append_openai_lp_cost_terminal_v1(
      v_attempt,
      'landing_page_draft_generation',
      'failure',
      null,
      null,
      null
    );
    raise exception 'divergent terminal retry should have failed';
  exception when unique_violation then null;
  end;

  begin
    perform public.append_openai_lp_cost_terminal_v1(
      'e2144000-0000-4000-8000-000000000099',
      'landing_page_draft_generation',
      'failure',
      null,
      null,
      null
    );
    raise exception 'terminal without start should have failed';
  exception when no_data_found then null;
  end;

  if (select count(*) from public.openai_lp_cost_events where attempt_id = v_attempt) <> 2 then
    raise exception 'attempt must contain exactly start and terminal';
  end if;

  if not exists (
    select 1
    from public.read_openai_lp_cost_events_v1(
      clock_timestamp() - interval '1 day',
      clock_timestamp()
    ) read_model
    where read_model.attempt_id = v_attempt
      and read_model.account_name = 'E21.4.4 Test'
      and read_model.landing_page_name = 'LP custos'
      and read_model.workload = 'landing_page_draft_generation'
      and read_model.result = 'success'
      and read_model.cost_usd = '0.000044000000'
  ) then
    raise exception 'read model must correlate the priced attempt';
  end if;

  if public.register_openai_lp_cost_coverage_v1(v_cutoff) is distinct from v_cutoff
     or public.register_openai_lp_cost_coverage_v1(v_cutoff) is distinct from v_cutoff then
    raise exception 'coverage cutoff must be idempotent';
  end if;

  begin
    perform public.register_openai_lp_cost_coverage_v1(v_cutoff - interval '1 second');
    raise exception 'coverage cutoff mutation should have failed';
  exception when unique_violation then null;
  end;

  begin
    update public.openai_lp_cost_events set result = 'failure' where id = v_terminal_id;
    raise exception 'event update should have failed';
  exception when object_not_in_prerequisite_state then null;
  end;

  begin
    delete from public.openai_lp_cost_coverage where singleton;
    raise exception 'coverage delete should have failed';
  exception when object_not_in_prerequisite_state then null;
  end;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1 from pg_class target
    where target.oid = 'public.openai_lp_cost_events'::regclass
      and target.relrowsecurity
  ) or not exists (
    select 1 from pg_class target
    where target.oid = 'public.openai_lp_cost_coverage'::regclass
      and target.relrowsecurity
  ) then
    raise exception 'RLS must be enabled';
  end if;

  if exists (
    select 1 from pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename in ('openai_lp_cost_events', 'openai_lp_cost_coverage')
  ) then
    raise exception 'client policies must remain absent';
  end if;

  if not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'SELECT')
     or not has_table_privilege('service_role', 'public.openai_lp_cost_events', 'INSERT')
     or has_table_privilege('service_role', 'public.openai_lp_cost_events', 'UPDATE')
     or has_table_privilege('service_role', 'public.openai_lp_cost_events', 'DELETE')
     or has_table_privilege('service_role', 'public.openai_lp_cost_events', 'TRUNCATE')
     or not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'SELECT')
     or not has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'INSERT')
     or has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'UPDATE')
     or has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'DELETE')
     or has_table_privilege('service_role', 'public.openai_lp_cost_coverage', 'TRUNCATE')
     or has_table_privilege('anon', 'public.openai_lp_cost_events', 'SELECT')
     or has_table_privilege('anon', 'public.openai_lp_cost_coverage', 'SELECT')
     or has_table_privilege('authenticated', 'public.openai_lp_cost_events', 'SELECT')
     or has_table_privilege('authenticated', 'public.openai_lp_cost_coverage', 'SELECT')
     or has_function_privilege('anon', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric)', 'EXECUTE')
     or has_function_privilege('anon', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE') then
    raise exception 'table privileges are not least-privilege';
  end if;

  if not has_function_privilege('service_role', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE') then
    raise exception 'read model privileges are not least-privilege';
  end if;

  if to_regrole('ai_readonly') is not null and (
    has_table_privilege('ai_readonly', 'public.openai_lp_cost_events', 'SELECT')
    or has_table_privilege('ai_readonly', 'public.openai_lp_cost_coverage', 'SELECT')
    or has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric)', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.register_openai_lp_cost_coverage_v1(timestamptz)', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.prevent_openai_lp_cost_mutation_v1()', 'EXECUTE')
    or has_function_privilege('ai_readonly', 'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)', 'EXECUTE')
  ) then
    raise exception 'ai_readonly must not access financial objects';
  end if;

  if exists (
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
  ) or exists (
    select 1
    from pg_proc target
    cross join lateral aclexplode(
      coalesce(target.proacl, acldefault('f', target.proowner))
    ) privilege
    where target.oid in (
      'public.append_openai_lp_cost_start_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text)'::regprocedure,
      'public.append_openai_lp_cost_terminal_v1(uuid,text,text,jsonb,jsonb,numeric)'::regprocedure,
      'public.register_openai_lp_cost_coverage_v1(timestamptz)'::regprocedure,
      'public.read_openai_lp_cost_events_v1(timestamptz,timestamptz)'::regprocedure,
      'public.prevent_openai_lp_cost_mutation_v1()'::regprocedure
    )
      and privilege.grantee = 0
  ) then
    raise exception 'PUBLIC must not access financial objects';
  end if;
end;
$$;

rollback;
