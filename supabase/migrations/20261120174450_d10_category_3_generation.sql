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

-- Preserve compatibility with applications whose v2 parser predates this event.
-- The Admin recovers the association by the execution's exact ID in the ledger.
create or replace function public.read_openai_active_cost_rows_v2(
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
    a.name,
    case when e.economic_event_kind = 'category_3_generation' then null else e.economic_event_kind end,
    case when e.economic_event_kind = 'category_3_generation' then null else e.economic_event_id end,
    e.landing_page_id,
    lp.name, e.taxon_id, taxon.name,
    e.baseline_reference, e.baseline_version, e.finished_at, e.result,
    e.failure_category, o.id, o.retry_of_operation_id, o.model,
    o.reasoning_effort, o.configuration_source, o.configuration_revision,
    o.prompt_version, o.contract_version, o.request_id, o.provider_response_id,
    o.provider_request_id, o.input_tokens, o.cached_input_tokens,
    o.cache_write_tokens, o.output_tokens, o.reasoning_tokens, o.total_tokens,
    o.web_search_call_count, o.web_search_tool_version,
    o.web_search_price_per_call_usd::text, o.pricing_version, o.pricing_effective_at,
    o.pricing_snapshot, o.cost_status, o.cost_unavailable_reason, o.cost_usd::text,
    o.started_at, o.finished_at, o.result, o.failure_category, o.http_status,
    o.provider_error_code, o.provider_error_type
  from public.openai_cost_executions e
  left join public.openai_cost_operations o on o.execution_id = e.id
  left join public.accounts a on a.id = e.account_id
  left join public.account_landing_pages lp
    on lp.id = e.landing_page_id and lp.account_id = e.account_id
  left join public.business_taxons taxon on taxon.id = e.taxon_id
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

commit;
