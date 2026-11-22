begin;

alter table public.openai_cost_occurrence_lifecycle
  add column product_type text,
  add column product_instance_id uuid,
  add column action_kind text,
  add constraint openai_cost_occurrence_product_pair
    check ((product_type is null) = (product_instance_id is null)),
  add constraint openai_cost_occurrence_action
    check (
      (product_type is null and (action_kind is null or action_kind in ('niche_resolution', 'initial_attendance')))
      or (product_type is not null and product_type = 'communication_base' and action_kind is not null
          and action_kind in ('category_3_generate', 'communication_base_generate', 'communication_base_adjust'))
    ),
  add constraint openai_cost_occurrence_product_type
    check (product_type is null or product_type = 'communication_base');

grant insert (product_type, product_instance_id, action_kind)
  on public.openai_cost_occurrence_lifecycle to service_role;

create index openai_cost_occurrence_product_idx
  on public.openai_cost_occurrence_lifecycle (product_type, product_instance_id)
  where product_type is not null;

create index openai_cost_operations_period_idx
  on public.openai_cost_operations (started_at, execution_id, sequence);

create function public.start_openai_cost_execution_v4(
  p_id uuid, p_workload text, p_environment text, p_execution_origin text,
  p_universe text, p_attribution_status text, p_account_id uuid,
  p_economic_event_kind text, p_economic_event_id uuid,
  p_landing_page_id uuid, p_taxon_id uuid,
  p_baseline_reference text, p_baseline_version text, p_started_at timestamptz, p_occurrence_id uuid,
  p_product_type text, p_product_instance_id uuid, p_action_kind text
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v_scope public.openai_cost_occurrence_lifecycle%rowtype;
begin
  if p_occurrence_id is null or p_action_kind is null
    or (p_product_type is null) <> (p_product_instance_id is null)
    or (p_product_type is not null and (
      p_product_type <> 'communication_base' or p_universe is distinct from 'client'
      or p_account_id is null or p_product_instance_id is distinct from p_account_id
    )) then
    raise exception using errcode = '22023', message = 'openai_cost_occurrence_dimensions_invalid';
  end if;

  -- Serialize with v3. Write dimensions only before the first execution of an occurrence.
  perform pg_advisory_xact_lock(hashtextextended(p_occurrence_id::text, 102110));
  if not exists (select 1 from public.openai_cost_executions where occurrence_id = p_occurrence_id) then
    insert into public.openai_cost_occurrence_lifecycle (
      occurrence_id, product_type, product_instance_id, action_kind
    ) values (p_occurrence_id, p_product_type, p_product_instance_id, p_action_kind);
  end if;

  select * into v_scope from public.openai_cost_occurrence_lifecycle
  where occurrence_id = p_occurrence_id for no key update;
  if not found
    or v_scope.product_type is distinct from p_product_type
    or v_scope.product_instance_id is distinct from p_product_instance_id
    or v_scope.action_kind is distinct from p_action_kind then
    raise exception using errcode = '23505', message = 'openai_cost_occurrence_dimensions_conflict';
  end if;

  return public.start_openai_cost_execution_v3(
    p_id, p_workload, p_environment, p_execution_origin, p_universe, p_attribution_status,
    p_account_id, p_economic_event_kind, p_economic_event_id, p_landing_page_id, p_taxon_id,
    p_baseline_reference, p_baseline_version, p_started_at, p_occurrence_id
  );
end;
$$;

create function public.read_openai_active_cost_rows_v3(
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
  provider_error_type text,
  execution_started_at timestamptz,
  occurrence_id uuid,
  occurrence_closed_at timestamptz,
  product_type text,
  product_instance_id uuid,
  action_kind text
) language plpgsql stable security invoker set search_path = pg_catalog as $$
begin
  if p_start_at is null or p_end_at is null or p_start_at >= p_end_at
     or p_limit is null or p_limit < 1 or p_limit > 500
     or ((p_after_started_at is null) <> (p_after_execution_id is null))
     or ((p_after_started_at is null) <> (p_after_operation_sequence is null)) then
    raise exception using errcode = '22023', message = 'openai_active_cost_read_input_invalid';
  end if;
  return query
  with page as (
    select candidates.*
    from (
      select op.started_at as at, op.execution_id as execution, op.sequence as seq, op.id as operation
      from public.openai_cost_operations op
      where op.started_at >= p_start_at and op.started_at < p_end_at
        and (p_after_started_at is null or (op.started_at, op.execution_id, op.sequence)
          > (p_after_started_at, p_after_execution_id, p_after_operation_sequence))
      union all
      -- Preserve diagnostics for executions without any admitted operation.
      select x.started_at, x.id, 0, null::uuid
      from public.openai_cost_executions x
      where x.started_at >= p_start_at and x.started_at < p_end_at
        and (p_after_started_at is null or (x.started_at, x.id, 0)
          > (p_after_started_at, p_after_execution_id, p_after_operation_sequence))
        and not exists (select 1 from public.openai_cost_operations op where op.execution_id = x.id)
    ) candidates
    order by candidates.at, candidates.execution, candidates.seq
    limit p_limit
  )
  select
    page.at, e.id, page.seq, e.workload, e.environment,
    e.execution_origin, e.universe, e.attribution_status, e.account_id,
    a.name, e.economic_event_kind, e.economic_event_id, e.landing_page_id,
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
    o.provider_error_code, o.provider_error_type,
    e.started_at, e.occurrence_id, lifecycle.closed_at, lifecycle.product_type,
    lifecycle.product_instance_id, lifecycle.action_kind
  from page
  join public.openai_cost_executions e on e.id = page.execution
  left join public.openai_cost_operations o on o.id = page.operation
  left join public.openai_cost_occurrence_lifecycle lifecycle on lifecycle.occurrence_id = e.occurrence_id
  left join public.accounts a on a.id = e.account_id
  left join public.account_landing_pages lp
    on lp.id = e.landing_page_id and lp.account_id = e.account_id
  left join public.business_taxons taxon on taxon.id = e.taxon_id
  order by page.at, page.execution, page.seq;
end;
$$;

create function public.read_openai_product_cost_v1(p_account_id uuid)
returns table (
  calculated_usd text, pending_count bigint, unavailable_count bigint, open_occurrence_count bigint
) language sql stable security invoker set search_path = pg_catalog as $$
  select sum(o.cost_usd)::text,
    count(o.id) filter (where o.finished_at is null),
    count(o.id) filter (where o.finished_at is not null and o.cost_usd is null),
    count(distinct lifecycle.occurrence_id) filter (where lifecycle.closed_at is null)
  from public.openai_cost_occurrence_lifecycle lifecycle
  join public.openai_cost_executions e on e.occurrence_id = lifecycle.occurrence_id
  left join public.openai_cost_operations o on o.execution_id = e.id
  where lifecycle.product_type = 'communication_base'
    and lifecycle.product_instance_id = p_account_id and e.account_id = p_account_id
    and e.universe = 'client';
$$;

revoke execute on function
  public.start_openai_cost_execution_v4(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz,uuid,text,uuid,text),
  public.read_openai_active_cost_rows_v3(timestamptz,timestamptz,timestamptz,uuid,integer,integer),
  public.read_openai_product_cost_v1(uuid)
  from public, anon, authenticated, ai_readonly, service_role;
grant execute on function
  public.start_openai_cost_execution_v4(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz,uuid,text,uuid,text),
  public.read_openai_active_cost_rows_v3(timestamptz,timestamptz,timestamptz,uuid,integer,integer),
  public.read_openai_product_cost_v1(uuid) to service_role;

commit;
