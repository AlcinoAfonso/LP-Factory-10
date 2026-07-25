-- E20.3.3 correction: revalidate mutable owner eligibility under the activation lock.

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
  v_owner_level text;
  v_owner_active boolean;
  v_own_composition_allowed boolean;
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

  select taxons.level::text, taxons.is_active
    into v_owner_level, v_owner_active
  from public.business_taxons taxons
  where taxons.id = v_draft.owner_taxon_id
  for update;

  if not found or v_owner_active is not true then
    raise exception 'landing_page composition owner taxon must remain active'
      using errcode = '23514';
  end if;

  if v_owner_level not in ('segment', 'niche', 'ultra_niche') then
    raise exception 'landing_page composition owner taxon level is not eligible'
      using errcode = '23514';
  end if;

  if v_owner_level = 'ultra_niche' then
    select policies.own_composition_allowed
      into v_own_composition_allowed
    from public.landing_page_taxon_policies policies
    where policies.taxon_id = v_draft.owner_taxon_id
    for update;

    if coalesce(v_own_composition_allowed, false) is not true then
      raise exception 'ultra_niche composition ownership requires current explicit policy'
        using errcode = '23514';
    end if;
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

revoke all on function public.activate_landing_page_composition(uuid, text, timestamptz)
  from public, anon;
grant execute on function public.activate_landing_page_composition(uuid, text, timestamptz)
  to authenticated;

comment on function public.activate_landing_page_composition(uuid, text, timestamptz) is
  'Activates a validated landing-page composition atomically after locking and revalidating its mutable owner eligibility.';
