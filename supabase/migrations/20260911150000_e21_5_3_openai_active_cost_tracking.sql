begin;

create table public.openai_cost_executions (
  id uuid primary key,
  workload text not null check (workload in (
    'niche_resolution',
    'commercial_activation_draft_generation',
    'taxon_input_catalog_sufficiency_evaluation',
    'landing_page_dynamic_market_research',
    'supabase_inspect'
  )),
  environment text not null check (environment in ('production', 'preview', 'development')),
  execution_origin text not null check (execution_origin in ('runtime', 'administrative_proof')),
  universe text not null check (universe in ('lp_factory', 'client')),
  attribution_status text not null check (attribution_status in ('attributed', 'unassigned')),
  account_id uuid null references public.accounts(id) on update restrict on delete restrict,
  baseline_reference text null check (baseline_reference is null or char_length(baseline_reference) between 1 and 128),
  baseline_version text null check (baseline_version is null or char_length(baseline_version) between 1 and 128),
  started_at timestamptz not null,
  finished_at timestamptz null,
  result text null check (result is null or result in ('success', 'failure')),
  failure_category text null check (failure_category is null or char_length(failure_category) between 1 and 64),
  created_at timestamptz not null default now(),
  constraint openai_cost_executions_attribution_chk check (
    (universe = 'lp_factory' and attribution_status = 'attributed' and account_id is null)
    or (universe = 'client' and attribution_status = 'attributed' and account_id is not null)
    or (universe = 'client' and attribution_status = 'unassigned' and account_id is null)
  ),
  constraint openai_cost_executions_terminal_chk check (
    (finished_at is null and result is null and failure_category is null)
    or (finished_at is not null and (
      (result = 'success' and failure_category is null)
      or (result = 'failure' and failure_category is not null)
    ))
  ),
  constraint openai_cost_executions_time_chk check (finished_at is null or finished_at >= started_at)
);

create table public.openai_cost_operations (
  id uuid primary key,
  execution_id uuid not null references public.openai_cost_executions(id) on update restrict on delete restrict,
  sequence integer not null check (sequence > 0),
  retry_of_operation_id uuid null,
  model text not null check (char_length(model) between 1 and 128 and model = btrim(model)),
  reasoning_effort text not null check (reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max', 'not_applicable')),
  configuration_source text not null check (configuration_source in ('repo_catalog', 'supabase_operational', 'github_actions_default_reference')),
  configuration_revision text not null check (char_length(configuration_revision) between 1 and 128 and configuration_revision = btrim(configuration_revision)),
  prompt_version text null check (prompt_version is null or char_length(prompt_version) between 1 and 128),
  contract_version text null check (contract_version is null or char_length(contract_version) between 1 and 128),
  request_id text null check (request_id is null or char_length(request_id) between 1 and 128),
  provider_response_id text null check (provider_response_id is null or char_length(provider_response_id) between 1 and 128),
  provider_request_id text null check (provider_request_id is null or char_length(provider_request_id) between 1 and 128),
  input_tokens bigint null check (input_tokens is null or input_tokens >= 0),
  cached_input_tokens bigint null check (cached_input_tokens is null or cached_input_tokens >= 0),
  cache_write_tokens bigint null check (cache_write_tokens is null or cache_write_tokens >= 0),
  output_tokens bigint null check (output_tokens is null or output_tokens >= 0),
  reasoning_tokens bigint null check (reasoning_tokens is null or reasoning_tokens >= 0),
  total_tokens bigint null check (total_tokens is null or total_tokens >= 0),
  web_search_call_count integer null check (web_search_call_count is null or web_search_call_count >= 0),
  web_search_tool_version text null,
  web_search_price_per_call_usd numeric(30, 12) null check (web_search_price_per_call_usd is null or web_search_price_per_call_usd >= 0),
  pricing_version text null,
  pricing_effective_at timestamptz null,
  pricing_snapshot jsonb null check (pricing_snapshot is null or jsonb_typeof(pricing_snapshot) = 'object'),
  cost_status text not null default 'unavailable' check (cost_status in ('calculated', 'unavailable')),
  cost_unavailable_reason text null default 'pricing_not_evaluated' check (cost_unavailable_reason is null or char_length(cost_unavailable_reason) between 1 and 128),
  cost_usd numeric(30, 12) null check (cost_usd is null or cost_usd >= 0),
  started_at timestamptz not null,
  finished_at timestamptz null,
  result text null check (result is null or result in ('success', 'failure')),
  failure_category text null check (failure_category is null or char_length(failure_category) between 1 and 64),
  http_status integer null check (http_status is null or http_status between 100 and 599),
  provider_error_code text null check (provider_error_code is null or char_length(provider_error_code) between 1 and 128),
  provider_error_type text null check (provider_error_type is null or char_length(provider_error_type) between 1 and 128),
  created_at timestamptz not null default now(),
  constraint openai_cost_operations_execution_sequence_key unique (execution_id, sequence),
  constraint openai_cost_operations_id_execution_key unique (id, execution_id),
  constraint openai_cost_operations_retry_execution_fkey
    foreign key (retry_of_operation_id, execution_id)
    references public.openai_cost_operations(id, execution_id)
    on update restrict on delete restrict,
  constraint openai_cost_operations_retry_self_chk check (retry_of_operation_id is null or retry_of_operation_id <> id),
  constraint openai_cost_operations_cost_chk check (
    (cost_status = 'calculated' and cost_usd is not null and pricing_version is not null and pricing_effective_at is not null and pricing_snapshot is not null and cost_unavailable_reason is null)
    or (cost_status = 'unavailable' and cost_usd is null and cost_unavailable_reason is not null)
  ),
  constraint openai_cost_operations_terminal_chk check (
    (finished_at is null and result is null and failure_category is null)
    or (finished_at is not null and (
      (result = 'success' and failure_category is null)
      or (result = 'failure' and failure_category is not null)
    ))
  ),
  constraint openai_cost_operations_time_chk check (finished_at is null or finished_at >= started_at)
);

create table public.openai_cost_coverage (
  environment text not null check (environment in ('production', 'preview', 'development')),
  workload text not null check (workload in (
    'niche_resolution',
    'commercial_activation_draft_generation',
    'taxon_input_catalog_sufficiency_evaluation',
    'landing_page_dynamic_market_research',
    'supabase_inspect'
  )),
  activated_at timestamptz not null,
  contract_version text not null check (char_length(contract_version) between 1 and 128),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint openai_cost_coverage_time_chk check (activated_at <= created_at),
  primary key (environment, workload)
);

alter table public.openai_cost_executions enable row level security;
alter table public.openai_cost_operations enable row level security;
alter table public.openai_cost_coverage enable row level security;

create index openai_cost_executions_period_idx on public.openai_cost_executions (started_at, id);
create index openai_cost_executions_workload_period_idx on public.openai_cost_executions (workload, universe, started_at, id);
create index openai_cost_executions_account_period_idx on public.openai_cost_executions (account_id, started_at, id) where account_id is not null;
create index openai_cost_operations_execution_idx on public.openai_cost_operations (execution_id, sequence);
create index openai_cost_operations_retry_idx on public.openai_cost_operations (retry_of_operation_id) where retry_of_operation_id is not null;

create or replace function public.guard_openai_cost_execution_mutation_v1()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then raise exception using errcode = '55000', message = 'openai_cost_execution_delete_forbidden'; end if;
  if old.finished_at is not null
     or new.id is distinct from old.id
     or new.workload is distinct from old.workload
     or new.environment is distinct from old.environment
     or new.execution_origin is distinct from old.execution_origin
     or new.universe is distinct from old.universe
     or new.attribution_status is distinct from old.attribution_status
     or new.account_id is distinct from old.account_id
     or new.baseline_reference is distinct from old.baseline_reference
     or new.baseline_version is distinct from old.baseline_version
     or new.started_at is distinct from old.started_at
     or new.created_at is distinct from old.created_at
     or new.finished_at is null then
    raise exception using errcode = '55000', message = 'openai_cost_execution_mutation_forbidden';
  end if;
  return new;
end;
$$;

create or replace function public.guard_openai_cost_operation_mutation_v1()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if tg_op = 'DELETE' then raise exception using errcode = '55000', message = 'openai_cost_operation_delete_forbidden'; end if;
  if old.finished_at is not null
     or new.id is distinct from old.id
     or new.execution_id is distinct from old.execution_id
     or new.sequence is distinct from old.sequence
     or new.retry_of_operation_id is distinct from old.retry_of_operation_id
     or new.model is distinct from old.model
     or new.reasoning_effort is distinct from old.reasoning_effort
     or new.configuration_source is distinct from old.configuration_source
     or new.configuration_revision is distinct from old.configuration_revision
     or new.prompt_version is distinct from old.prompt_version
     or new.contract_version is distinct from old.contract_version
     or new.request_id is distinct from old.request_id
     or new.started_at is distinct from old.started_at
     or new.created_at is distinct from old.created_at
     or new.web_search_tool_version is distinct from old.web_search_tool_version
     or new.web_search_price_per_call_usd is distinct from old.web_search_price_per_call_usd
     or new.pricing_version is distinct from old.pricing_version
     or new.pricing_effective_at is distinct from old.pricing_effective_at
     or new.pricing_snapshot is distinct from old.pricing_snapshot
     or new.cost_status is distinct from old.cost_status
     or new.cost_unavailable_reason is distinct from old.cost_unavailable_reason
     or new.cost_usd is distinct from old.cost_usd
     or new.finished_at is null then
    raise exception using errcode = '55000', message = 'openai_cost_operation_mutation_forbidden';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_openai_cost_coverage_mutation_v1()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  raise exception using errcode = '55000', message = 'openai_cost_coverage_immutable';
end;
$$;

create trigger openai_cost_executions_guard before update or delete on public.openai_cost_executions for each row execute function public.guard_openai_cost_execution_mutation_v1();
create trigger openai_cost_operations_guard before update or delete on public.openai_cost_operations for each row execute function public.guard_openai_cost_operation_mutation_v1();
create trigger openai_cost_coverage_guard before update or delete on public.openai_cost_coverage for each row execute function public.prevent_openai_cost_coverage_mutation_v1();

create or replace function public.start_openai_cost_execution_v1(
  p_id uuid, p_workload text, p_environment text, p_execution_origin text,
  p_universe text, p_attribution_status text, p_account_id uuid,
  p_baseline_reference text, p_baseline_version text, p_started_at timestamptz
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_executions%rowtype;
begin
  insert into public.openai_cost_executions (
    id, workload, environment, execution_origin, universe, attribution_status,
    account_id, baseline_reference, baseline_version, started_at
  ) values (
    p_id, p_workload, p_environment, p_execution_origin, p_universe, p_attribution_status,
    p_account_id, p_baseline_reference, p_baseline_version, p_started_at
  ) on conflict (id) do nothing;
  select * into strict v from public.openai_cost_executions where id = p_id;
  if v.workload is distinct from p_workload or v.environment is distinct from p_environment
     or v.execution_origin is distinct from p_execution_origin or v.universe is distinct from p_universe
     or v.attribution_status is distinct from p_attribution_status or v.account_id is distinct from p_account_id
     or v.baseline_reference is distinct from p_baseline_reference or v.baseline_version is distinct from p_baseline_version
     or v.started_at is distinct from p_started_at then
    raise exception using errcode = '23505', message = 'openai_cost_execution_identity_conflict';
  end if;
  return v.id;
end;
$$;

create or replace function public.finish_openai_cost_execution_v1(
  p_id uuid, p_result text, p_failure_category text, p_finished_at timestamptz
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_executions%rowtype;
begin
  update public.openai_cost_executions set result = p_result, failure_category = p_failure_category, finished_at = p_finished_at
  where id = p_id and finished_at is null;
  select * into strict v from public.openai_cost_executions where id = p_id;
  if v.result is distinct from p_result or v.failure_category is distinct from p_failure_category or v.finished_at is distinct from p_finished_at then
    raise exception using errcode = '23505', message = 'openai_cost_execution_terminal_conflict';
  end if;
  return v.id;
end;
$$;

create or replace function public.start_openai_cost_operation_v1(
  p_id uuid, p_execution_id uuid, p_sequence integer, p_retry_of_operation_id uuid,
  p_model text, p_reasoning_effort text, p_configuration_source text,
  p_configuration_revision text, p_prompt_version text, p_contract_version text,
  p_request_id text, p_started_at timestamptz
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_operations%rowtype; retry_sequence integer;
begin
  if p_retry_of_operation_id is not null then
    select sequence into retry_sequence from public.openai_cost_operations where id = p_retry_of_operation_id and execution_id = p_execution_id;
    if retry_sequence is null or retry_sequence >= p_sequence then
      raise exception using errcode = '23503', message = 'openai_cost_retry_reference_invalid';
    end if;
  end if;
  insert into public.openai_cost_operations (
    id, execution_id, sequence, retry_of_operation_id, model, reasoning_effort,
    configuration_source, configuration_revision, prompt_version, contract_version,
    request_id, started_at
  ) values (
    p_id, p_execution_id, p_sequence, p_retry_of_operation_id, p_model, p_reasoning_effort,
    p_configuration_source, p_configuration_revision, p_prompt_version, p_contract_version,
    p_request_id, p_started_at
  ) on conflict (id) do nothing;
  select * into strict v from public.openai_cost_operations where id = p_id;
  if v.execution_id is distinct from p_execution_id or v.sequence is distinct from p_sequence
     or v.retry_of_operation_id is distinct from p_retry_of_operation_id or v.model is distinct from p_model
     or v.reasoning_effort is distinct from p_reasoning_effort or v.configuration_source is distinct from p_configuration_source
     or v.configuration_revision is distinct from p_configuration_revision or v.prompt_version is distinct from p_prompt_version
     or v.contract_version is distinct from p_contract_version or v.request_id is distinct from p_request_id
     or v.started_at is distinct from p_started_at then
    raise exception using errcode = '23505', message = 'openai_cost_operation_identity_conflict';
  end if;
  return v.id;
end;
$$;

create or replace function public.finish_openai_cost_operation_v1(
  p_id uuid, p_result text, p_failure_category text, p_http_status integer,
  p_provider_response_id text, p_provider_request_id text, p_provider_error_code text,
  p_provider_error_type text, p_input_tokens bigint, p_cached_input_tokens bigint,
  p_cache_write_tokens bigint, p_output_tokens bigint, p_reasoning_tokens bigint,
  p_total_tokens bigint, p_web_search_call_count integer, p_finished_at timestamptz
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_operations%rowtype;
begin
  update public.openai_cost_operations set
    result = p_result, failure_category = p_failure_category, http_status = p_http_status,
    provider_response_id = p_provider_response_id, provider_request_id = p_provider_request_id,
    provider_error_code = p_provider_error_code, provider_error_type = p_provider_error_type,
    input_tokens = p_input_tokens, cached_input_tokens = p_cached_input_tokens,
    cache_write_tokens = p_cache_write_tokens, output_tokens = p_output_tokens,
    reasoning_tokens = p_reasoning_tokens, total_tokens = p_total_tokens,
    web_search_call_count = p_web_search_call_count, finished_at = p_finished_at
  where id = p_id and finished_at is null;
  select * into strict v from public.openai_cost_operations where id = p_id;
  if v.result is distinct from p_result or v.failure_category is distinct from p_failure_category
     or v.http_status is distinct from p_http_status or v.provider_response_id is distinct from p_provider_response_id
     or v.provider_request_id is distinct from p_provider_request_id or v.provider_error_code is distinct from p_provider_error_code
     or v.provider_error_type is distinct from p_provider_error_type or v.input_tokens is distinct from p_input_tokens
     or v.cached_input_tokens is distinct from p_cached_input_tokens or v.cache_write_tokens is distinct from p_cache_write_tokens
     or v.output_tokens is distinct from p_output_tokens or v.reasoning_tokens is distinct from p_reasoning_tokens
     or v.total_tokens is distinct from p_total_tokens or v.web_search_call_count is distinct from p_web_search_call_count
     or v.finished_at is distinct from p_finished_at then
    raise exception using errcode = '23505', message = 'openai_cost_operation_terminal_conflict';
  end if;
  return v.id;
end;
$$;

create or replace function public.register_openai_cost_coverage_v1(
  p_environment text, p_workload text, p_activated_at timestamptz,
  p_contract_version text, p_metadata jsonb
) returns text language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_coverage%rowtype;
begin
  insert into public.openai_cost_coverage (environment, workload, activated_at, contract_version, metadata)
  values (p_environment, p_workload, p_activated_at, p_contract_version, coalesce(p_metadata, '{}'::jsonb))
  on conflict (environment, workload) do nothing;
  select * into strict v from public.openai_cost_coverage where environment = p_environment and workload = p_workload;
  if v.activated_at is distinct from p_activated_at or v.contract_version is distinct from p_contract_version
     or v.metadata is distinct from coalesce(p_metadata, '{}'::jsonb) then
    raise exception using errcode = '23505', message = 'openai_cost_coverage_conflict';
  end if;
  return v.workload;
end;
$$;

revoke all on public.openai_cost_executions, public.openai_cost_operations, public.openai_cost_coverage from public, anon, authenticated;
revoke all on public.openai_cost_executions, public.openai_cost_operations, public.openai_cost_coverage from service_role;
grant select, insert on public.openai_cost_executions, public.openai_cost_operations to service_role;
grant update (finished_at, result, failure_category) on public.openai_cost_executions to service_role;
grant update (
  finished_at, result, failure_category, http_status, provider_response_id,
  provider_request_id, provider_error_code, provider_error_type, input_tokens,
  cached_input_tokens, cache_write_tokens, output_tokens, reasoning_tokens,
  total_tokens, web_search_call_count
) on public.openai_cost_operations to service_role;
grant select, insert on public.openai_cost_coverage to service_role;
revoke all on function public.start_openai_cost_execution_v1(uuid,text,text,text,text,text,uuid,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.finish_openai_cost_execution_v1(uuid,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.start_openai_cost_operation_v1(uuid,uuid,integer,uuid,text,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.finish_openai_cost_operation_v1(uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,timestamptz) from public, anon, authenticated;
revoke all on function public.register_openai_cost_coverage_v1(text,text,timestamptz,text,jsonb) from public, anon, authenticated;
revoke all on function public.guard_openai_cost_execution_mutation_v1() from public, anon, authenticated, service_role;
revoke all on function public.guard_openai_cost_operation_mutation_v1() from public, anon, authenticated, service_role;
revoke all on function public.prevent_openai_cost_coverage_mutation_v1() from public, anon, authenticated, service_role;
do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on public.openai_cost_executions, public.openai_cost_operations, public.openai_cost_coverage from ai_readonly';
    execute 'revoke all on function public.start_openai_cost_execution_v1(uuid,text,text,text,text,text,uuid,text,text,timestamptz) from ai_readonly';
    execute 'revoke all on function public.finish_openai_cost_execution_v1(uuid,text,text,timestamptz) from ai_readonly';
    execute 'revoke all on function public.start_openai_cost_operation_v1(uuid,uuid,integer,uuid,text,text,text,text,text,text,text,timestamptz) from ai_readonly';
    execute 'revoke all on function public.finish_openai_cost_operation_v1(uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,timestamptz) from ai_readonly';
    execute 'revoke all on function public.register_openai_cost_coverage_v1(text,text,timestamptz,text,jsonb) from ai_readonly';
    execute 'revoke all on function public.guard_openai_cost_execution_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.guard_openai_cost_operation_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.prevent_openai_cost_coverage_mutation_v1() from ai_readonly';
  end if;
end;
$$;
grant execute on function public.start_openai_cost_execution_v1(uuid,text,text,text,text,text,uuid,text,text,timestamptz) to service_role;
grant execute on function public.finish_openai_cost_execution_v1(uuid,text,text,timestamptz) to service_role;
grant execute on function public.start_openai_cost_operation_v1(uuid,uuid,integer,uuid,text,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.finish_openai_cost_operation_v1(uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,timestamptz) to service_role;
grant execute on function public.register_openai_cost_coverage_v1(text,text,timestamptz,text,jsonb) to service_role;

commit;
