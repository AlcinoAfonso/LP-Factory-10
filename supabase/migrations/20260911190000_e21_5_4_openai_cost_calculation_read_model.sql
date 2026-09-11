begin;

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
     or new.finished_at is null then
    raise exception using errcode = '55000', message = 'openai_cost_operation_mutation_forbidden';
  end if;
  return new;
end;
$$;

create or replace function public.finish_openai_cost_operation_v2(
  p_id uuid, p_result text, p_failure_category text, p_http_status integer,
  p_provider_response_id text, p_provider_request_id text, p_provider_error_code text,
  p_provider_error_type text, p_input_tokens bigint, p_cached_input_tokens bigint,
  p_cache_write_tokens bigint, p_output_tokens bigint, p_reasoning_tokens bigint,
  p_total_tokens bigint, p_web_search_call_count integer,
  p_web_search_tool_version text, p_web_search_price_per_call_usd numeric,
  p_pricing_version text, p_pricing_effective_at timestamptz, p_pricing_snapshot jsonb,
  p_cost_status text, p_cost_unavailable_reason text, p_cost_usd numeric,
  p_finished_at timestamptz
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
    web_search_call_count = p_web_search_call_count,
    web_search_tool_version = p_web_search_tool_version,
    web_search_price_per_call_usd = p_web_search_price_per_call_usd,
    pricing_version = p_pricing_version, pricing_effective_at = p_pricing_effective_at,
    pricing_snapshot = p_pricing_snapshot, cost_status = p_cost_status,
    cost_unavailable_reason = p_cost_unavailable_reason, cost_usd = p_cost_usd,
    finished_at = p_finished_at
  where id = p_id and finished_at is null;
  select * into strict v from public.openai_cost_operations where id = p_id;
  if v.result is distinct from p_result or v.failure_category is distinct from p_failure_category
     or v.http_status is distinct from p_http_status or v.provider_response_id is distinct from p_provider_response_id
     or v.provider_request_id is distinct from p_provider_request_id or v.provider_error_code is distinct from p_provider_error_code
     or v.provider_error_type is distinct from p_provider_error_type or v.input_tokens is distinct from p_input_tokens
     or v.cached_input_tokens is distinct from p_cached_input_tokens or v.cache_write_tokens is distinct from p_cache_write_tokens
     or v.output_tokens is distinct from p_output_tokens or v.reasoning_tokens is distinct from p_reasoning_tokens
     or v.total_tokens is distinct from p_total_tokens or v.web_search_call_count is distinct from p_web_search_call_count
     or v.web_search_tool_version is distinct from p_web_search_tool_version
     or v.web_search_price_per_call_usd is distinct from p_web_search_price_per_call_usd
     or v.pricing_version is distinct from p_pricing_version or v.pricing_effective_at is distinct from p_pricing_effective_at
     or v.pricing_snapshot is distinct from p_pricing_snapshot or v.cost_status is distinct from p_cost_status
     or v.cost_unavailable_reason is distinct from p_cost_unavailable_reason or v.cost_usd is distinct from p_cost_usd
     or v.finished_at is distinct from p_finished_at then
    raise exception using errcode = '23505', message = 'openai_cost_operation_terminal_conflict';
  end if;
  return v.id;
end;
$$;

create or replace function public.read_openai_active_cost_rows_v1(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_after_started_at timestamptz default null,
  p_after_execution_id uuid default null,
  p_after_operation_sequence integer default null,
  p_limit integer default 500
) returns table (
  cursor_started_at timestamptz,
  execution_id uuid,
  operation_sequence integer,
  workload text,
  environment text,
  execution_origin text,
  universe text,
  attribution_status text,
  account_id uuid,
  baseline_reference text,
  baseline_version text,
  execution_finished_at timestamptz,
  execution_result text,
  execution_failure_category text,
  operation_id uuid,
  retry_of_operation_id uuid,
  model text,
  reasoning_effort text,
  configuration_source text,
  configuration_revision text,
  prompt_version text,
  contract_version text,
  request_id text,
  provider_response_id text,
  provider_request_id text,
  input_tokens bigint,
  cached_input_tokens bigint,
  cache_write_tokens bigint,
  output_tokens bigint,
  reasoning_tokens bigint,
  total_tokens bigint,
  web_search_call_count integer,
  web_search_tool_version text,
  web_search_price_per_call_usd numeric,
  pricing_version text,
  pricing_effective_at timestamptz,
  pricing_snapshot jsonb,
  cost_status text,
  cost_unavailable_reason text,
  cost_usd numeric,
  operation_started_at timestamptz,
  operation_finished_at timestamptz,
  operation_result text,
  operation_failure_category text,
  http_status integer,
  provider_error_code text,
  provider_error_type text
) language plpgsql stable security invoker set search_path = pg_catalog as $$
begin
  if p_start_at is null or p_end_at is null or p_start_at >= p_end_at
     or p_limit is null or p_limit < 1 or p_limit > 500
     or ((p_after_started_at is null) <> (p_after_execution_id is null))
     or ((p_after_started_at is null) <> (p_after_operation_sequence is null)) then
    raise exception using errcode = '22023', message = 'openai_active_cost_read_input_invalid';
  end if;
  return query
  select
    e.started_at, e.id, coalesce(o.sequence, 0), e.workload, e.environment,
    e.execution_origin, e.universe, e.attribution_status, e.account_id,
    e.baseline_reference, e.baseline_version, e.finished_at, e.result,
    e.failure_category, o.id, o.retry_of_operation_id, o.model,
    o.reasoning_effort, o.configuration_source, o.configuration_revision,
    o.prompt_version, o.contract_version, o.request_id, o.provider_response_id,
    o.provider_request_id, o.input_tokens, o.cached_input_tokens,
    o.cache_write_tokens, o.output_tokens, o.reasoning_tokens, o.total_tokens,
    o.web_search_call_count, o.web_search_tool_version,
    o.web_search_price_per_call_usd, o.pricing_version, o.pricing_effective_at,
    o.pricing_snapshot, o.cost_status, o.cost_unavailable_reason, o.cost_usd,
    o.started_at, o.finished_at, o.result, o.failure_category, o.http_status,
    o.provider_error_code, o.provider_error_type
  from public.openai_cost_executions e
  left join public.openai_cost_operations o on o.execution_id = e.id
  where e.started_at >= p_start_at and e.started_at < p_end_at
    and (
      p_after_started_at is null
      or (e.started_at, e.id, coalesce(o.sequence, 0))
        > (p_after_started_at, p_after_execution_id, p_after_operation_sequence)
    )
  order by e.started_at, e.id, coalesce(o.sequence, 0)
  limit p_limit;
end;
$$;

grant update (
  web_search_tool_version, web_search_price_per_call_usd, pricing_version,
  pricing_effective_at, pricing_snapshot, cost_status, cost_unavailable_reason, cost_usd
) on public.openai_cost_operations to service_role;

revoke all on function public.finish_openai_cost_operation_v2(
  uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,
  text,numeric,text,timestamptz,jsonb,text,text,numeric,timestamptz
) from public, anon, authenticated;
revoke all on function public.read_openai_active_cost_rows_v1(
  timestamptz,timestamptz,timestamptz,uuid,integer,integer
) from public, anon, authenticated;
grant execute on function public.finish_openai_cost_operation_v2(
  uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,
  text,numeric,text,timestamptz,jsonb,text,text,numeric,timestamptz
) to service_role;
grant execute on function public.read_openai_active_cost_rows_v1(
  timestamptz,timestamptz,timestamptz,uuid,integer,integer
) to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.finish_openai_cost_operation_v2(uuid,text,text,integer,text,text,text,text,bigint,bigint,bigint,bigint,bigint,bigint,integer,text,numeric,text,timestamptz,jsonb,text,text,numeric,timestamptz) from ai_readonly';
    execute 'revoke all on function public.read_openai_active_cost_rows_v1(timestamptz,timestamptz,timestamptz,uuid,integer,integer) from ai_readonly';
  end if;
end;
$$;

commit;
