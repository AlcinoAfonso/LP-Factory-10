begin;

create table public.landing_page_taxon_policies (
  taxon_id uuid primary key
    references public.business_taxons(id) on update cascade on delete restrict,
  inheritance_blocked boolean not null default false,
  own_composition_allowed boolean not null default false,
  decision_reason text,
  created_by uuid not null
    references auth.users(id) on update cascade on delete restrict,
  updated_by uuid not null
    references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_page_taxon_policies_reason_check
    check (decision_reason is null or length(btrim(decision_reason)) between 3 and 500)
);

comment on table public.landing_page_taxon_policies is
  'E20.3 policy for landing_page composition inheritance and explicit ultra-niche ownership.';

create table public.landing_page_compositions (
  id uuid primary key default gen_random_uuid(),
  owner_taxon_id uuid not null
    references public.business_taxons(id) on update cascade on delete restrict,
  version integer not null,
  status text not null default 'draft',
  root_snapshot_json jsonb not null,
  module_catalog_snapshot_json jsonb not null,
  research_snapshot_json jsonb not null,
  input_catalog_snapshot_json jsonb not null,
  items_json jsonb not null,
  gaps_json jsonb not null default '[]'::jsonb,
  provenance_json jsonb not null,
  validation_fingerprint text not null,
  created_by uuid not null
    references auth.users(id) on update cascade on delete restrict,
  updated_by uuid not null
    references auth.users(id) on update cascade on delete restrict,
  activated_by uuid
    references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  constraint landing_page_compositions_owner_version_key
    unique (owner_taxon_id, version),
  constraint landing_page_compositions_version_check
    check (version > 0),
  constraint landing_page_compositions_status_check
    check (status in ('draft', 'active', 'archived')),
  constraint landing_page_compositions_root_snapshot_check
    check (jsonb_typeof(root_snapshot_json) = 'object'),
  constraint landing_page_compositions_module_catalog_snapshot_check
    check (jsonb_typeof(module_catalog_snapshot_json) = 'object'),
  constraint landing_page_compositions_research_snapshot_check
    check (jsonb_typeof(research_snapshot_json) = 'object'),
  constraint landing_page_compositions_input_catalog_snapshot_check
    check (jsonb_typeof(input_catalog_snapshot_json) = 'object'),
  constraint landing_page_compositions_items_check
    check (jsonb_typeof(items_json) = 'array' and jsonb_array_length(items_json) > 0),
  constraint landing_page_compositions_gaps_check
    check (jsonb_typeof(gaps_json) = 'array'),
  constraint landing_page_compositions_provenance_check
    check (jsonb_typeof(provenance_json) = 'object'),
  constraint landing_page_compositions_fingerprint_check
    check (length(btrim(validation_fingerprint)) between 16 and 256),
  constraint landing_page_compositions_activation_check
    check (
      (status = 'draft' and activated_by is null and activated_at is null)
      or (status in ('active', 'archived') and activated_by is not null and activated_at is not null)
    )
);

create unique index landing_page_compositions_one_active_per_owner_idx
  on public.landing_page_compositions(owner_taxon_id)
  where status = 'active';

create index landing_page_compositions_owner_status_version_idx
  on public.landing_page_compositions(owner_taxon_id, status, version desc);

comment on table public.landing_page_compositions is
  'Versioned E20.3 landing_page compositions with frozen source snapshots, ordered items, gaps and provenance.';

create or replace function public.validate_landing_page_taxon_policy()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_level text;
begin
  select level into v_level
  from public.business_taxons
  where id = new.taxon_id;

  if v_level is null then
    raise exception 'landing_page taxon policy requires an existing taxon'
      using errcode = '23503';
  end if;

  if new.own_composition_allowed and v_level <> 'ultra_niche' then
    raise exception 'own_composition_allowed is reserved for ultra_niche taxons'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

create trigger landing_page_taxon_policies_validate
before insert or update on public.landing_page_taxon_policies
for each row execute function public.validate_landing_page_taxon_policy();

create or replace function public.validate_landing_page_composition_owner()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_level text;
  v_is_active boolean;
  v_own_composition_allowed boolean;
begin
  select level, is_active
    into v_level, v_is_active
  from public.business_taxons
  where id = new.owner_taxon_id;

  if v_level is null then
    raise exception 'landing_page composition requires an existing owner taxon'
      using errcode = '23503';
  end if;

  if not v_is_active then
    raise exception 'landing_page composition owner taxon must be active'
      using errcode = '23514';
  end if;

  if v_level not in ('segment', 'niche', 'ultra_niche') then
    raise exception 'landing_page composition owner taxon level is not eligible'
      using errcode = '23514';
  end if;

  if v_level = 'ultra_niche' then
    select own_composition_allowed
      into v_own_composition_allowed
    from public.landing_page_taxon_policies
    where taxon_id = new.owner_taxon_id;

    if coalesce(v_own_composition_allowed, false) is not true then
      raise exception 'ultra_niche composition ownership requires explicit policy'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger landing_page_compositions_validate_owner
before insert or update of owner_taxon_id on public.landing_page_compositions
for each row execute function public.validate_landing_page_composition_owner();

create or replace function public.protect_landing_page_composition_lifecycle()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'landing_page compositions cannot be deleted'
      using errcode = '23514';
  end if;

  if new.owner_taxon_id is distinct from old.owner_taxon_id
    or new.version is distinct from old.version
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'landing_page composition identity is immutable'
      using errcode = '23514';
  end if;

  if old.status = 'archived' then
    raise exception 'archived landing_page compositions are immutable'
      using errcode = '23514';
  end if;

  if old.status = 'active' then
    if new.status <> 'archived'
      or new.root_snapshot_json is distinct from old.root_snapshot_json
      or new.module_catalog_snapshot_json is distinct from old.module_catalog_snapshot_json
      or new.research_snapshot_json is distinct from old.research_snapshot_json
      or new.input_catalog_snapshot_json is distinct from old.input_catalog_snapshot_json
      or new.items_json is distinct from old.items_json
      or new.gaps_json is distinct from old.gaps_json
      or new.provenance_json is distinct from old.provenance_json
      or new.validation_fingerprint is distinct from old.validation_fingerprint
      or new.activated_by is distinct from old.activated_by
      or new.activated_at is distinct from old.activated_at then
      raise exception 'active landing_page composition payload is immutable'
        using errcode = '23514';
    end if;
  elsif old.status = 'draft' and new.status not in ('draft', 'active') then
    raise exception 'draft landing_page composition can only remain draft or become active'
      using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger landing_page_compositions_protect_lifecycle
before update or delete on public.landing_page_compositions
for each row execute function public.protect_landing_page_composition_lifecycle();

create or replace function public.activate_landing_page_composition(
  p_composition_id uuid,
  p_expected_fingerprint text,
  p_expected_updated_at timestamptz
)
returns public.landing_page_compositions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_draft public.landing_page_compositions%rowtype;
  v_result public.landing_page_compositions%rowtype;
  v_now timestamptz := now();
begin
  if v_actor is null or not (
    coalesce(public.is_platform_admin(), false)
    or coalesce(public.is_super_admin(), false)
  ) then
    raise exception 'activate_landing_page_composition requires platform admin privileges'
      using errcode = '42501';
  end if;

  select * into v_draft
  from public.landing_page_compositions
  where id = p_composition_id
  for update;

  if not found then
    raise exception 'landing_page composition not found'
      using errcode = 'P0002';
  end if;

  if v_draft.status <> 'draft' then
    raise exception 'landing_page composition must be draft to activate'
      using errcode = '23514';
  end if;

  if v_draft.validation_fingerprint is distinct from p_expected_fingerprint
    or v_draft.updated_at is distinct from p_expected_updated_at then
    raise exception 'landing_page composition changed after validation'
      using errcode = '40001';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_draft.gaps_json) as gap
    where coalesce((gap ->> 'blocking')::boolean, false)
      or gap ->> 'humanDecision' = 'blocking'
  ) then
    raise exception 'landing_page composition has a blocking gap'
      using errcode = '23514';
  end if;

  perform 1
  from public.landing_page_compositions
  where owner_taxon_id = v_draft.owner_taxon_id
    and status = 'active'
  for update;

  update public.landing_page_compositions
  set status = 'archived',
      updated_by = v_actor
  where owner_taxon_id = v_draft.owner_taxon_id
    and status = 'active';

  update public.landing_page_compositions
  set status = 'active',
      activated_by = v_actor,
      activated_at = v_now,
      updated_by = v_actor
  where id = v_draft.id
    and status = 'draft'
    and validation_fingerprint = p_expected_fingerprint
    and updated_at = p_expected_updated_at
  returning * into v_result;

  if not found then
    raise exception 'landing_page composition activation lost its validated snapshot'
      using errcode = '40001';
  end if;

  perform public.audit_context_event(
    'landing_page_composition_activated',
    'landing_page_compositions',
    v_result.id,
    jsonb_build_object(
      'owner_taxon_id', v_result.owner_taxon_id,
      'version', v_result.version,
      'previous_status', 'draft',
      'status', 'active'
    ),
    null
  );

  return v_result;
end;
$$;

alter table public.landing_page_taxon_policies enable row level security;
alter table public.landing_page_compositions enable row level security;

create policy landing_page_taxon_policies_select_admin
on public.landing_page_taxon_policies
for select to authenticated
using (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

create policy landing_page_taxon_policies_insert_admin
on public.landing_page_taxon_policies
for insert to authenticated
with check (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

create policy landing_page_taxon_policies_update_admin
on public.landing_page_taxon_policies
for update to authenticated
using (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
)
with check (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

create policy landing_page_compositions_select_admin
on public.landing_page_compositions
for select to authenticated
using (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

create policy landing_page_compositions_insert_admin
on public.landing_page_compositions
for insert to authenticated
with check (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

create policy landing_page_compositions_update_admin
on public.landing_page_compositions
for update to authenticated
using (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
)
with check (
  (select public.is_platform_admin())
  or (select public.is_super_admin())
);

revoke all on table public.landing_page_taxon_policies from public, anon, authenticated;
revoke all on table public.landing_page_compositions from public, anon, authenticated;

grant select, insert on table public.landing_page_taxon_policies to service_role;
grant update (
  inheritance_blocked,
  own_composition_allowed,
  decision_reason,
  updated_by
) on table public.landing_page_taxon_policies to service_role;

grant select, insert on table public.landing_page_compositions to service_role;
grant update (
  root_snapshot_json,
  module_catalog_snapshot_json,
  research_snapshot_json,
  input_catalog_snapshot_json,
  items_json,
  gaps_json,
  provenance_json,
  validation_fingerprint,
  updated_by
) on table public.landing_page_compositions to service_role;

revoke all on function public.validate_landing_page_taxon_policy() from public, anon, authenticated;
revoke all on function public.validate_landing_page_composition_owner() from public, anon, authenticated;
revoke all on function public.protect_landing_page_composition_lifecycle() from public, anon, authenticated;
revoke all on function public.activate_landing_page_composition(uuid, text, timestamptz) from public, anon;
grant execute on function public.activate_landing_page_composition(uuid, text, timestamptz) to authenticated;

comment on function public.activate_landing_page_composition(uuid, text, timestamptz) is
  'Activates the exact E20.3 draft snapshot validated by a platform admin and archives the prior active composition atomically.';

commit;
