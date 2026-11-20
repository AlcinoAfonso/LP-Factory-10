begin;

alter table public.openai_cost_executions
  drop constraint openai_cost_executions_economic_event_chk,
  add constraint openai_cost_executions_economic_event_chk check ((
    (
      economic_event_kind is null and economic_event_id is null
      and landing_page_id is null and taxon_id is null
    )
    or (
      economic_event_kind = 'landing_page'
      and universe = 'client' and attribution_status = 'attributed' and account_id is not null
      and economic_event_id is not null and economic_event_id <> id
      and economic_event_id = landing_page_id
      and taxon_id is null
    )
    or (
      economic_event_kind = 'niche_resolution'
      and universe = 'client' and attribution_status = 'attributed' and account_id is not null
      and economic_event_id is not null and economic_event_id <> id
      and landing_page_id is null and taxon_id is null
    )
    or (
      economic_event_kind = 'category_3_generation'
      and universe = 'client' and attribution_status = 'attributed' and account_id is not null
      and workload = 'communication_base_stage2_intelligence' and execution_origin = 'runtime'
      and economic_event_id is not null and economic_event_id <> id
      and landing_page_id is null and taxon_id is null
    )
    or (
      economic_event_kind = 'lp_factory_internal'
      and universe = 'lp_factory' and attribution_status = 'attributed' and account_id is null
      and economic_event_id is not null and economic_event_id <> id and landing_page_id is null
    )
  ) is true);

-- Keep the existing result shape and all money visible to older readers.
-- The same migration makes the raw projection available before the writer.
alter function public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)
  rename to read_openai_active_cost_rows_v3;

create function public.read_openai_active_cost_rows_v2(
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
  account_name text,
  economic_event_kind text,
  economic_event_id uuid,
  landing_page_id uuid,
  landing_page_name text,
  taxon_id uuid,
  taxon_name text,
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
  web_search_price_per_call_usd text,
  pricing_version text,
  pricing_effective_at timestamptz,
  pricing_snapshot jsonb,
  cost_status text,
  cost_unavailable_reason text,
  cost_usd text,
  operation_started_at timestamptz,
  operation_finished_at timestamptz,
  operation_result text,
  operation_failure_category text,
  http_status integer,
  provider_error_code text,
  provider_error_type text
) language sql stable security invoker set search_path = pg_catalog as $$
  select
    r.cursor_started_at,
    r.execution_id,
    r.operation_sequence,
    r.workload,
    r.environment,
    r.execution_origin,
    r.universe,
    r.attribution_status,
    r.account_id,
    r.account_name,
    case when r.economic_event_kind = 'category_3_generation' then null else r.economic_event_kind end,
    case when r.economic_event_kind = 'category_3_generation' then null else r.economic_event_id end,
    r.landing_page_id,
    r.landing_page_name,
    r.taxon_id,
    r.taxon_name,
    r.baseline_reference,
    r.baseline_version,
    r.execution_finished_at,
    r.execution_result,
    r.execution_failure_category,
    r.operation_id,
    r.retry_of_operation_id,
    r.model,
    r.reasoning_effort,
    r.configuration_source,
    r.configuration_revision,
    r.prompt_version,
    r.contract_version,
    r.request_id,
    r.provider_response_id,
    r.provider_request_id,
    r.input_tokens,
    r.cached_input_tokens,
    r.cache_write_tokens,
    r.output_tokens,
    r.reasoning_tokens,
    r.total_tokens,
    r.web_search_call_count,
    r.web_search_tool_version,
    r.web_search_price_per_call_usd,
    r.pricing_version,
    r.pricing_effective_at,
    r.pricing_snapshot,
    r.cost_status,
    r.cost_unavailable_reason,
    r.cost_usd,
    r.operation_started_at,
    r.operation_finished_at,
    r.operation_result,
    r.operation_failure_category,
    r.http_status,
    r.provider_error_code,
    r.provider_error_type
  from public.read_openai_active_cost_rows_v3(
    p_start_at, p_end_at, p_after_started_at, p_after_execution_id, p_after_operation_sequence, p_limit
  ) as r
  order by r.cursor_started_at, r.execution_id, r.operation_sequence;
$$;

create function public.start_openai_cost_execution_v3(
  p_id uuid, p_workload text, p_environment text, p_execution_origin text,
  p_universe text, p_attribution_status text, p_account_id uuid,
  p_economic_event_kind text, p_economic_event_id uuid,
  p_landing_page_id uuid, p_taxon_id uuid,
  p_baseline_reference text, p_baseline_version text, p_started_at timestamptz
) returns uuid language sql security invoker set search_path = pg_catalog as $$
  select public.start_openai_cost_execution_v2(
    p_id, p_workload, p_environment, p_execution_origin, p_universe, p_attribution_status,
    p_account_id, p_economic_event_kind, p_economic_event_id, p_landing_page_id, p_taxon_id,
    p_baseline_reference, p_baseline_version, p_started_at
  );
$$;

revoke all on function public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)
  from public, anon, authenticated, service_role;
revoke all on function public.start_openai_cost_execution_v3(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)
  from public, anon, authenticated, service_role;
do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer) from ai_readonly';
    execute 'revoke all on function public.start_openai_cost_execution_v3(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz) from ai_readonly';
  end if;
end;
$$;
grant execute on function public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer)
  to service_role;
grant execute on function public.start_openai_cost_execution_v3(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz)
  to service_role;

commit;
