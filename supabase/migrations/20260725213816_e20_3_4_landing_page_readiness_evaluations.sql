create table public.landing_page_readiness_evaluations (
  id uuid primary key default gen_random_uuid(),
  served_taxon_id uuid not null,
  plan_key text not null,
  composition_id uuid,
  composition_version integer,
  result text not null,
  checks_json jsonb not null,
  codes_json jsonb not null,
  evaluation_fingerprint text not null,
  evaluated_by uuid not null,
  evaluated_at timestamptz not null default now(),
  constraint landing_page_readiness_evaluations_served_taxon_id_fkey
    foreign key (served_taxon_id) references public.business_taxons(id)
    on update cascade on delete restrict,
  constraint landing_page_readiness_evaluations_composition_id_fkey
    foreign key (composition_id) references public.landing_page_compositions(id)
    on update cascade on delete restrict,
  constraint landing_page_readiness_evaluations_evaluated_by_fkey
    foreign key (evaluated_by) references auth.users(id)
    on update cascade on delete restrict,
  constraint landing_page_readiness_evaluations_plan_key_check
    check (plan_key in ('starter', 'lite', 'pro', 'ultra')),
  constraint landing_page_readiness_evaluations_composition_reference_check
    check (
      (composition_id is null and composition_version is null)
      or (composition_id is not null and composition_version > 0)
    ),
  constraint landing_page_readiness_evaluations_result_check
    check (result in ('ready', 'blocked')),
  constraint landing_page_readiness_evaluations_checks_check
    check (
      jsonb_typeof(checks_json) = 'array'
      and jsonb_array_length(checks_json) > 0
    ),
  constraint landing_page_readiness_evaluations_codes_check
    check (jsonb_typeof(codes_json) = 'array'),
  constraint landing_page_readiness_evaluations_result_codes_check
    check (
      (result = 'ready' and composition_id is not null and jsonb_array_length(codes_json) = 0)
      or (result = 'blocked' and jsonb_array_length(codes_json) > 0)
    ),
  constraint landing_page_readiness_evaluations_fingerprint_check
    check (evaluation_fingerprint ~ '^[0-9a-f]{64}$')
);

create index landing_page_readiness_evaluations_latest_idx
  on public.landing_page_readiness_evaluations(
    served_taxon_id,
    plan_key,
    evaluated_at desc,
    id desc
  );

create index landing_page_readiness_evaluations_composition_id_idx
  on public.landing_page_readiness_evaluations(composition_id)
  where composition_id is not null;

create index landing_page_readiness_evaluations_evaluated_by_idx
  on public.landing_page_readiness_evaluations(evaluated_by);

comment on table public.landing_page_readiness_evaluations is
  'Append-only evidence of deterministic E20.3 landing-page readiness evaluations; never an authorization cache.';

create or replace function public.validate_landing_page_readiness_evaluation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_composition_version integer;
  v_composition_status text;
begin
  if new.composition_id is not null then
    select compositions.version, compositions.status
      into v_composition_version, v_composition_status
    from public.landing_page_compositions compositions
    where compositions.id = new.composition_id
    for share;

    if not found
      or v_composition_version is distinct from new.composition_version
      or v_composition_status <> 'active' then
      raise exception 'readiness evaluation must reference the current active composition version'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger landing_page_readiness_evaluations_validate
before insert on public.landing_page_readiness_evaluations
for each row execute function public.validate_landing_page_readiness_evaluation();

create or replace function public.protect_landing_page_readiness_evaluation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'landing_page readiness evaluations are append-only'
    using errcode = '23514';
end;
$$;

create trigger landing_page_readiness_evaluations_append_only
before update or delete on public.landing_page_readiness_evaluations
for each row execute function public.protect_landing_page_readiness_evaluation();

alter table public.landing_page_readiness_evaluations enable row level security;

create policy landing_page_readiness_evaluations_select_admin
on public.landing_page_readiness_evaluations
for select
to authenticated
using (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

create policy landing_page_readiness_evaluations_insert_admin
on public.landing_page_readiness_evaluations
for insert
to authenticated
with check (
  (
    (select public.is_platform_admin())
    or (select public.is_super_admin())
  )
  and evaluated_by = (select auth.uid())
);

revoke all on table public.landing_page_readiness_evaluations
  from public, anon, authenticated;
grant select, insert on table public.landing_page_readiness_evaluations
  to service_role;

revoke all on function public.validate_landing_page_readiness_evaluation()
  from public, anon, authenticated;
revoke all on function public.protect_landing_page_readiness_evaluation()
  from public, anon, authenticated;
