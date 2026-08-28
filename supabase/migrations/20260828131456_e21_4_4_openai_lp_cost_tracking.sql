begin;

create table public.openai_lp_cost_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  account_id uuid not null,
  landing_page_id uuid not null,
  workload text not null,
  event_kind text not null,
  environment text not null,
  result text null,
  model text not null,
  configuration_source text not null,
  configuration_revision text not null,
  reasoning_effort text null,
  quality text null,
  size text null,
  price_version text not null,
  usage_json jsonb null,
  pricing_json jsonb null,
  cost_usd numeric(30, 12) null,
  created_at timestamptz not null default now(),
  constraint openai_lp_cost_events_landing_page_fkey
    foreign key (landing_page_id, account_id)
    references public.account_landing_pages(id, account_id)
    on update restrict
    on delete restrict,
  constraint openai_lp_cost_events_workload_chk
    check (workload in (
      'landing_page_draft_generation',
      'landing_page_draft_image_generation'
    )),
  constraint openai_lp_cost_events_event_kind_chk
    check (event_kind in ('started', 'terminal')),
  constraint openai_lp_cost_events_environment_chk
    check (environment = 'production'),
  constraint openai_lp_cost_events_model_shape_chk
    check (
      char_length(model) between 1 and 128
      and model = btrim(model)
      and model ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
      and char_length(configuration_revision) between 1 and 128
      and configuration_revision = btrim(configuration_revision)
      and char_length(price_version) between 1 and 128
      and price_version = btrim(price_version)
    ),
  constraint openai_lp_cost_events_configuration_shape_chk
    check (
      configuration_source in ('repo_catalog', 'supabase_operational')
      and (
        (
          workload = 'landing_page_draft_generation'
          and reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
          and quality is null
          and size is null
        )
        or (
          workload = 'landing_page_draft_image_generation'
          and reasoning_effort is null
          and quality in ('low', 'medium', 'high')
          and size = '1536x1024'
        )
      )
    ),
  constraint openai_lp_cost_events_terminal_shape_chk
    check (
      (
        event_kind = 'started'
        and result is null
        and usage_json is null
        and pricing_json is null
        and cost_usd is null
      )
      or (
        event_kind = 'terminal'
        and result in ('success', 'failure')
        and (usage_json is null or jsonb_typeof(usage_json) = 'object')
        and (pricing_json is null or jsonb_typeof(pricing_json) = 'object')
        and (cost_usd is null or cost_usd >= 0)
        and (
          cost_usd is null
          or (usage_json is not null and pricing_json is not null)
        )
      )
    ),
  constraint openai_lp_cost_events_attempt_kind_key
    unique (attempt_id, workload, event_kind)
);

alter table public.openai_lp_cost_events enable row level security;

create index openai_lp_cost_events_period_idx
  on public.openai_lp_cost_events (created_at, account_id, landing_page_id, workload)
  where event_kind = 'terminal';

create table public.openai_lp_cost_coverage (
  singleton boolean primary key default true,
  environment text not null default 'production',
  activated_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint openai_lp_cost_coverage_singleton_chk check (singleton),
  constraint openai_lp_cost_coverage_environment_chk check (environment = 'production'),
  constraint openai_lp_cost_coverage_timestamp_chk check (activated_at <= created_at)
);

alter table public.openai_lp_cost_coverage enable row level security;

create or replace function public.prevent_openai_lp_cost_mutation_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'openai_lp_cost_records_are_append_only';
end;
$$;

create trigger openai_lp_cost_events_prevent_mutation
  before update or delete on public.openai_lp_cost_events
  for each row execute function public.prevent_openai_lp_cost_mutation_v1();

create trigger openai_lp_cost_coverage_prevent_mutation
  before update or delete on public.openai_lp_cost_coverage
  for each row execute function public.prevent_openai_lp_cost_mutation_v1();

create or replace function public.append_openai_lp_cost_start_v1(
  p_attempt_id uuid,
  p_account_id uuid,
  p_landing_page_id uuid,
  p_workload text,
  p_model text,
  p_configuration_source text,
  p_configuration_revision text,
  p_reasoning_effort text,
  p_quality text,
  p_size text,
  p_price_version text
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_id uuid;
  v_existing public.openai_lp_cost_events%rowtype;
begin
  if p_attempt_id is null
     or p_account_id is null
     or p_landing_page_id is null
     or p_workload is null
     or p_model is null
     or p_configuration_source is null
     or p_configuration_revision is null
     or p_price_version is null then
    raise exception using errcode = '22004', message = 'openai_lp_cost_start_identity_missing';
  end if;

  insert into public.openai_lp_cost_events (
    attempt_id,
    account_id,
    landing_page_id,
    workload,
    event_kind,
    environment,
    model,
    configuration_source,
    configuration_revision,
    reasoning_effort,
    quality,
    size,
    price_version
  )
  values (
    p_attempt_id,
    p_account_id,
    p_landing_page_id,
    p_workload,
    'started',
    'production',
    p_model,
    p_configuration_source,
    p_configuration_revision,
    p_reasoning_effort,
    p_quality,
    p_size,
    p_price_version
  )
  on conflict (attempt_id, workload, event_kind) do nothing
  returning id into v_id;

  select * into v_existing
  from public.openai_lp_cost_events event
  where event.attempt_id = p_attempt_id
    and event.workload = p_workload
    and event.event_kind = 'started';

  if not found then
    raise exception using errcode = 'P0001', message = 'openai_lp_cost_start_not_persisted';
  end if;

  if v_existing.account_id is distinct from p_account_id
     or v_existing.landing_page_id is distinct from p_landing_page_id
     or v_existing.model is distinct from p_model
     or v_existing.configuration_source is distinct from p_configuration_source
     or v_existing.configuration_revision is distinct from p_configuration_revision
     or v_existing.reasoning_effort is distinct from p_reasoning_effort
     or v_existing.quality is distinct from p_quality
     or v_existing.size is distinct from p_size
     or v_existing.price_version is distinct from p_price_version then
    raise exception using errcode = '23505', message = 'openai_lp_cost_attempt_identity_conflict';
  end if;

  return v_existing.id;
end;
$$;

create or replace function public.append_openai_lp_cost_terminal_v1(
  p_attempt_id uuid,
  p_workload text,
  p_result text,
  p_usage_json jsonb,
  p_pricing_json jsonb,
  p_cost_usd numeric
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_start public.openai_lp_cost_events%rowtype;
  v_existing public.openai_lp_cost_events%rowtype;
  v_id uuid;
begin
  if p_attempt_id is null or p_workload is null or p_result is null then
    raise exception using errcode = '22004', message = 'openai_lp_cost_terminal_identity_missing';
  end if;

  select * into v_start
  from public.openai_lp_cost_events event
  where event.attempt_id = p_attempt_id
    and event.workload = p_workload
    and event.event_kind = 'started';

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_lp_cost_start_not_found';
  end if;

  insert into public.openai_lp_cost_events (
    attempt_id,
    account_id,
    landing_page_id,
    workload,
    event_kind,
    environment,
    result,
    model,
    configuration_source,
    configuration_revision,
    reasoning_effort,
    quality,
    size,
    price_version,
    usage_json,
    pricing_json,
    cost_usd
  )
  values (
    v_start.attempt_id,
    v_start.account_id,
    v_start.landing_page_id,
    v_start.workload,
    'terminal',
    v_start.environment,
    p_result,
    v_start.model,
    v_start.configuration_source,
    v_start.configuration_revision,
    v_start.reasoning_effort,
    v_start.quality,
    v_start.size,
    v_start.price_version,
    p_usage_json,
    p_pricing_json,
    p_cost_usd
  )
  on conflict (attempt_id, workload, event_kind) do nothing
  returning id into v_id;

  select * into v_existing
  from public.openai_lp_cost_events event
  where event.attempt_id = p_attempt_id
    and event.workload = p_workload
    and event.event_kind = 'terminal';

  if not found then
    raise exception using errcode = 'P0001', message = 'openai_lp_cost_terminal_not_persisted';
  end if;

  if v_existing.result is distinct from p_result
     or v_existing.usage_json is distinct from p_usage_json
     or v_existing.pricing_json is distinct from p_pricing_json
     or v_existing.cost_usd is distinct from p_cost_usd then
    raise exception using errcode = '23505', message = 'openai_lp_cost_terminal_conflict';
  end if;

  return v_existing.id;
end;
$$;

create or replace function public.register_openai_lp_cost_coverage_v1(
  p_activated_at timestamptz
)
returns timestamptz
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_activated_at timestamptz;
begin
  if p_activated_at is null or p_activated_at > now() then
    raise exception using errcode = '22023', message = 'openai_lp_cost_coverage_timestamp_invalid';
  end if;

  insert into public.openai_lp_cost_coverage (singleton, environment, activated_at)
  values (true, 'production', p_activated_at)
  on conflict (singleton) do nothing;

  select coverage.activated_at into v_activated_at
  from public.openai_lp_cost_coverage coverage
  where coverage.singleton;

  if v_activated_at is distinct from p_activated_at then
    raise exception using errcode = '23505', message = 'openai_lp_cost_coverage_is_immutable';
  end if;

  return v_activated_at;
end;
$$;

create or replace function public.read_openai_lp_cost_events_v1(
  p_start_at timestamptz,
  p_end_at timestamptz
)
returns table (
  attempt_id uuid,
  account_id uuid,
  account_name text,
  landing_page_id uuid,
  landing_page_name text,
  workload text,
  started_at timestamptz,
  terminal_at timestamptz,
  result text,
  cost_usd text
)
language plpgsql
stable
security invoker
set search_path = pg_catalog
as $$
begin
  if p_start_at is null
     or p_end_at is null
     or p_end_at <= p_start_at
     or p_end_at > clock_timestamp()
     or p_end_at - p_start_at > interval '180 days' then
    raise exception using errcode = '22023', message = 'openai_lp_cost_period_invalid';
  end if;

  return query
  select
    started.attempt_id,
    started.account_id,
    account.name,
    started.landing_page_id,
    landing_page.name,
    started.workload,
    started.created_at,
    terminal.created_at,
    terminal.result,
    terminal.cost_usd::text
  from public.openai_lp_cost_events started
  join public.accounts account
    on account.id = started.account_id
  join public.account_landing_pages landing_page
    on landing_page.id = started.landing_page_id
   and landing_page.account_id = started.account_id
  left join public.openai_lp_cost_events terminal
    on terminal.attempt_id = started.attempt_id
   and terminal.workload = started.workload
   and terminal.event_kind = 'terminal'
  where started.event_kind = 'started'
    and started.created_at >= p_start_at
    and started.created_at < p_end_at
  order by started.created_at, started.attempt_id, started.workload;
end;
$$;

revoke all on table public.openai_lp_cost_events, public.openai_lp_cost_coverage
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.openai_lp_cost_events, public.openai_lp_cost_coverage from ai_readonly';
  end if;
end;
$$;

grant select, insert on table public.openai_lp_cost_events, public.openai_lp_cost_coverage
  to service_role;

revoke all on function public.prevent_openai_lp_cost_mutation_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric)
  from public, anon, authenticated, service_role;
revoke all on function public.register_openai_lp_cost_coverage_v1(timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.read_openai_lp_cost_events_v1(timestamptz, timestamptz)
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.prevent_openai_lp_cost_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text) from ai_readonly';
    execute 'revoke all on function public.append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric) from ai_readonly';
    execute 'revoke all on function public.register_openai_lp_cost_coverage_v1(timestamptz) from ai_readonly';
    execute 'revoke all on function public.read_openai_lp_cost_events_v1(timestamptz, timestamptz) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text)
  to service_role;
grant execute on function public.append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric)
  to service_role;
grant execute on function public.register_openai_lp_cost_coverage_v1(timestamptz)
  to service_role;
grant execute on function public.read_openai_lp_cost_events_v1(timestamptz, timestamptz)
  to service_role;

comment on table public.openai_lp_cost_events
  is 'Eventos financeiros prospectivos append-only das tentativas Production de texto e imagem de Landing Pages.';
comment on table public.openai_lp_cost_coverage
  is 'Data de corte imutavel e unica da cobertura prospectiva de custos OpenAI das Landing Pages em Production.';

commit;
