-- Prospectively link executions to a service occurrence without changing prior events or snapshots.
alter table public.openai_cost_executions add column occurrence_id uuid;
create index openai_cost_executions_occurrence_idx on public.openai_cost_executions (occurrence_id)
  where occurrence_id is not null;

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
     or new.occurrence_id is distinct from old.occurrence_id
     or new.created_at is distinct from old.created_at
     or new.finished_at is null then
    raise exception using errcode = '55000', message = 'openai_cost_execution_mutation_forbidden';
  end if;
  return new;
end;
$$;

create function public.start_openai_cost_execution_v3(
  p_id uuid, p_workload text, p_environment text, p_execution_origin text,
  p_universe text, p_attribution_status text, p_account_id uuid,
  p_economic_event_kind text, p_economic_event_id uuid,
  p_landing_page_id uuid, p_taxon_id uuid,
  p_baseline_reference text, p_baseline_version text, p_started_at timestamptz, p_occurrence_id uuid
) returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_executions%rowtype;
begin
  if p_occurrence_id is null or p_occurrence_id = p_id or p_attribution_status is distinct from 'attributed' then
    raise exception using errcode = '22023', message = 'openai_cost_occurrence_required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_occurrence_id::text, 102110));
  if exists (
    select 1 from public.openai_cost_executions e
    where e.occurrence_id = p_occurrence_id
      and (e.account_id is distinct from p_account_id or e.universe is distinct from p_universe
        or e.environment is distinct from p_environment or e.execution_origin is distinct from p_execution_origin)
  ) then
    raise exception using errcode = '23505', message = 'openai_cost_occurrence_scope_conflict';
  end if;
  insert into public.openai_cost_executions (
    id, workload, environment, execution_origin, universe, attribution_status,
    account_id, economic_event_kind, economic_event_id, landing_page_id, taxon_id,
    baseline_reference, baseline_version, started_at, occurrence_id
  ) values (
    p_id, p_workload, p_environment, p_execution_origin, p_universe, p_attribution_status,
    p_account_id, p_economic_event_kind, p_economic_event_id, p_landing_page_id, p_taxon_id,
    p_baseline_reference, p_baseline_version, p_started_at, p_occurrence_id
  ) on conflict (id) do nothing;
  select * into strict v from public.openai_cost_executions where id = p_id;
  if v.workload is distinct from p_workload or v.environment is distinct from p_environment
     or v.execution_origin is distinct from p_execution_origin or v.universe is distinct from p_universe
     or v.attribution_status is distinct from p_attribution_status or v.account_id is distinct from p_account_id
     or v.economic_event_kind is distinct from p_economic_event_kind
     or v.economic_event_id is distinct from p_economic_event_id
     or v.landing_page_id is distinct from p_landing_page_id or v.taxon_id is distinct from p_taxon_id
     or v.baseline_reference is distinct from p_baseline_reference or v.baseline_version is distinct from p_baseline_version
     or v.started_at is distinct from p_started_at or v.occurrence_id is distinct from p_occurrence_id then
    raise exception using errcode = '23505', message = 'openai_cost_execution_identity_conflict';
  end if;
  return v.id;
end;
$$;

create function public.admit_openai_cost_operation_v2(
  p_id uuid, p_execution_id uuid, p_sequence integer, p_retry_of_operation_id uuid,
  p_model text, p_reasoning_effort text, p_configuration_source text,
  p_configuration_revision text, p_prompt_version text, p_contract_version text,
  p_request_id text, p_started_at timestamptz, p_environment text, p_workload text
) returns boolean language plpgsql security invoker set search_path = pg_catalog as $$
declare v public.openai_cost_operations%rowtype; retry_sequence integer; inserted_id uuid;
begin
  if not exists (
    select 1 from public.openai_cost_executions
    where id = p_execution_id and occurrence_id is not null and occurrence_id <> p_id
      and environment = p_environment and workload = p_workload
  ) then
    raise exception using errcode = '23503', message = 'openai_cost_occurrence_required';
  end if;
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
  ) on conflict (id) do nothing returning id into inserted_id;
  select * into strict v from public.openai_cost_operations where id = p_id;
  if v.execution_id is distinct from p_execution_id or v.sequence is distinct from p_sequence
     or v.retry_of_operation_id is distinct from p_retry_of_operation_id or v.model is distinct from p_model
     or v.reasoning_effort is distinct from p_reasoning_effort or v.configuration_source is distinct from p_configuration_source
     or v.configuration_revision is distinct from p_configuration_revision or v.prompt_version is distinct from p_prompt_version
     or v.contract_version is distinct from p_contract_version or v.request_id is distinct from p_request_id
     or v.started_at is distinct from p_started_at then
    raise exception using errcode = '23505', message = 'openai_cost_operation_identity_conflict';
  end if;
  return inserted_id is not null;
end;
$$;

revoke execute on function public.start_openai_cost_execution_v3(uuid, text, text, text, text, text, uuid, text, uuid, uuid, uuid, text, text, timestamptz, uuid) from public, anon, authenticated, ai_readonly;
grant execute on function public.start_openai_cost_execution_v3(uuid, text, text, text, text, text, uuid, text, uuid, uuid, uuid, text, text, timestamptz, uuid) to service_role;
revoke execute on function public.admit_openai_cost_operation_v2(uuid, uuid, integer, uuid, text, text, text, text, text, text, text, timestamptz, text, text) from public, anon, authenticated, ai_readonly;
grant execute on function public.admit_openai_cost_operation_v2(uuid, uuid, integer, uuid, text, text, text, text, text, text, text, timestamptz, text, text) to service_role;
