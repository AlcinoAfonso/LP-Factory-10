begin;

alter table public.openai_cost_executions
  add column economic_event_kind text null,
  add column economic_event_id uuid null,
  add column landing_page_id uuid null,
  add column taxon_id uuid null,
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
      economic_event_kind = 'lp_factory_internal'
      and universe = 'lp_factory' and attribution_status = 'attributed' and account_id is null
      and economic_event_id is not null and economic_event_id <> id and landing_page_id is null
    )
  ) is true),
  add constraint openai_cost_executions_landing_page_fkey
    foreign key (landing_page_id, account_id)
    references public.account_landing_pages(id, account_id)
    on update restrict on delete restrict,
  add constraint openai_cost_executions_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons(id)
    on update restrict on delete restrict;

create index openai_cost_executions_economic_event_idx
  on public.openai_cost_executions (
    economic_event_kind, economic_event_id, started_at, id
  )
  where economic_event_id is not null;

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
     or new.economic_event_kind is distinct from old.economic_event_kind
     or new.economic_event_id is distinct from old.economic_event_id
     or new.landing_page_id is distinct from old.landing_page_id
     or new.taxon_id is distinct from old.taxon_id
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

create function public.start_openai_cost_execution_v2(
  p_id uuid, p_workload text, p_environment text, p_execution_origin text,
  p_universe text, p_attribution_status text, p_account_id uuid,
  p_economic_event_kind text, p_economic_event_id uuid,
  p_landing_page_id uuid, p_taxon_id uuid,
  p_baseline_reference text, p_baseline_version text, p_started_at timestamptz
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_executions%rowtype;
begin
  insert into public.openai_cost_executions (
    id, workload, environment, execution_origin, universe, attribution_status,
    account_id, economic_event_kind, economic_event_id, landing_page_id, taxon_id,
    baseline_reference, baseline_version, started_at
  ) values (
    p_id, p_workload, p_environment, p_execution_origin, p_universe, p_attribution_status,
    p_account_id, p_economic_event_kind, p_economic_event_id, p_landing_page_id, p_taxon_id,
    p_baseline_reference, p_baseline_version, p_started_at
  ) on conflict (id) do nothing;
  select * into strict v from public.openai_cost_executions where id = p_id;
  if v.workload is distinct from p_workload or v.environment is distinct from p_environment
     or v.execution_origin is distinct from p_execution_origin or v.universe is distinct from p_universe
     or v.attribution_status is distinct from p_attribution_status or v.account_id is distinct from p_account_id
     or v.economic_event_kind is distinct from p_economic_event_kind
     or v.economic_event_id is distinct from p_economic_event_id
     or v.landing_page_id is distinct from p_landing_page_id or v.taxon_id is distinct from p_taxon_id
     or v.baseline_reference is distinct from p_baseline_reference or v.baseline_version is distinct from p_baseline_version
     or v.started_at is distinct from p_started_at then
    raise exception using errcode = '23505', message = 'openai_cost_execution_identity_conflict';
  end if;
  return v.id;
end;
$$;

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

revoke all on function public.start_openai_cost_execution_v2(
  uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.read_openai_active_cost_rows_v2(
  timestamptz,timestamptz,timestamptz,uuid,integer,integer
) from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.start_openai_cost_execution_v2(uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz) from ai_readonly';
    execute 'revoke all on function public.read_openai_active_cost_rows_v2(timestamptz,timestamptz,timestamptz,uuid,integer,integer) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.start_openai_cost_execution_v2(
  uuid,text,text,text,text,text,uuid,text,uuid,uuid,uuid,text,text,timestamptz
) to service_role;
grant execute on function public.read_openai_active_cost_rows_v2(
  timestamptz,timestamptz,timestamptz,uuid,integer,integer
) to service_role;

commit;
