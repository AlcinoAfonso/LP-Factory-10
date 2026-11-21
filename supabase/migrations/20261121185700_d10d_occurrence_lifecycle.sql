begin;

-- One stable lock and closure state for all executions of an occurrence.
create table public.openai_cost_occurrence_lifecycle (
  occurrence_id uuid primary key,
  closed_at timestamptz
);

alter table public.openai_cost_occurrence_lifecycle enable row level security;
revoke all on public.openai_cost_occurrence_lifecycle from public, anon, authenticated, ai_readonly, service_role;
grant select, insert (occurrence_id), update (closed_at) on public.openai_cost_occurrence_lifecycle to service_role;

create function public.guard_openai_cost_occurrence_closure_v1()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if old.closed_at is not null or new.closed_at is null then
    raise exception using errcode = '55000', message = 'openai_cost_occurrence_closure_immutable';
  end if;
  return new;
end;
$$;

create trigger openai_cost_occurrence_closure_guard
before update on public.openai_cost_occurrence_lifecycle
for each row execute function public.guard_openai_cost_occurrence_closure_v1();

create function public.close_openai_cost_occurrence_v1(
  p_occurrence_id uuid, p_environment text, p_execution_origin text, p_universe text, p_account_id uuid
) returns timestamptz language plpgsql security invoker set search_path = pg_catalog as $$
declare v_closed_at timestamptz;
begin
  if not exists (
    select 1 from public.openai_cost_executions e
    where e.occurrence_id = p_occurrence_id and e.environment = p_environment
      and e.execution_origin = p_execution_origin and e.universe = p_universe
      and e.account_id is not distinct from p_account_id
  ) then
    raise exception using errcode = '23503', message = 'openai_cost_occurrence_required';
  end if;

  insert into public.openai_cost_occurrence_lifecycle (occurrence_id) values (p_occurrence_id)
  on conflict (occurrence_id) do nothing;

  select closed_at into strict v_closed_at from public.openai_cost_occurrence_lifecycle
  where occurrence_id = p_occurrence_id for no key update;

  if v_closed_at is null then
    update public.openai_cost_occurrence_lifecycle set closed_at = clock_timestamp()
    where occurrence_id = p_occurrence_id returning closed_at into v_closed_at;
  end if;
  return v_closed_at;
end;
$$;

create function public.guard_openai_cost_occurrence_admission_v1()
returns trigger language plpgsql security invoker set search_path = pg_catalog as $$
declare v_occurrence_id uuid; v_closed_at timestamptz;
begin
  select e.occurrence_id into v_occurrence_id from public.openai_cost_executions e where e.id = new.execution_id;
  if v_occurrence_id is null then return new; end if;

  insert into public.openai_cost_occurrence_lifecycle (occurrence_id) values (v_occurrence_id)
  on conflict (occurrence_id) do nothing;

  select closed_at into strict v_closed_at from public.openai_cost_occurrence_lifecycle
  where occurrence_id = v_occurrence_id for no key update;

  -- Existing operations still go through the admission RPC's identity and replay checks.
  if v_closed_at is not null and not exists (
    select 1 from public.openai_cost_operations o where o.id = new.id and o.execution_id = new.execution_id
  ) then
    raise exception using errcode = '55000', message = 'openai_cost_occurrence_closed';
  end if;
  return new;
end;
$$;

create trigger openai_cost_occurrence_admission_guard
before insert on public.openai_cost_operations
for each row execute function public.guard_openai_cost_occurrence_admission_v1();

revoke execute on function public.guard_openai_cost_occurrence_closure_v1(),
  public.guard_openai_cost_occurrence_admission_v1(),
  public.close_openai_cost_occurrence_v1(uuid, text, text, text, uuid) from public, anon, authenticated, ai_readonly, service_role;
grant execute on function public.close_openai_cost_occurrence_v1(uuid, text, text, text, uuid) to service_role;

commit;
