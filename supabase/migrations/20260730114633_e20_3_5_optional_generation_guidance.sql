begin;

alter table public.landing_page_generation_profiles
  alter column generation_guidance drop not null;

alter table public.landing_page_generation_profiles
  drop constraint landing_page_generation_profiles_guidance_chk,
  add constraint landing_page_generation_profiles_guidance_chk
    check (
      generation_guidance is null
      or length(btrim(generation_guidance)) > 0
    );

create or replace function public.save_landing_page_generation_profile_draft(
  p_owner_taxon_id uuid,
  p_profile_id uuid,
  p_expected_updated_at timestamptz,
  p_generation_guidance text,
  p_items jsonb,
  p_origin text,
  p_request_id uuid default null,
  p_review_result text default null
)
returns table(profile_id uuid, version integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_profile public.landing_page_generation_profiles%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_version integer;
begin
  if auth.uid() is null or not (
    coalesce(public.is_platform_admin(), false)
    or coalesce(public.is_super_admin(), false)
  ) then
    raise exception 'E12_4_3_UNAUTHORIZED';
  end if;
  if p_origin is null
    or p_origin not in ('manual', 'ai')
    or (p_generation_guidance is not null and length(btrim(p_generation_guidance)) = 0)
    or p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or ((p_request_id is null) <> (p_review_result is null))
    or (p_request_id is not null and p_origin <> 'ai')
    or (p_review_result is not null and p_review_result not in ('accepted', 'adjusted')) then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as raw(item)
    where jsonb_typeof(raw.item) <> 'object'
      or raw.item - array[
        'module_key',
        'module_version',
        'variant_key',
        'variant_version',
        'priority',
        'recommended_order',
        'item_guidance'
      ] <> '{}'::jsonb
  ) then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  select * into v_taxon
  from public.business_taxons
  where id = p_owner_taxon_id
  for update;
  if not found or not v_taxon.is_active or v_taxon.level not in ('segment', 'niche') then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      module_key text,
      module_version integer,
      variant_key text,
      variant_version integer,
      priority text,
      recommended_order integer,
      item_guidance text
    )
    where item.module_key is null
      or length(btrim(item.module_key)) = 0
      or item.module_version is null
      or item.module_version <= 0
      or ((item.variant_key is null) <> (item.variant_version is null))
      or (item.variant_key is not null and length(btrim(item.variant_key)) = 0)
      or (item.variant_version is not null and item.variant_version <= 0)
      or item.priority is null
      or item.priority not in ('P1', 'P2', 'P3')
      or item.recommended_order is null
      or item.recommended_order <= 0
      or (item.item_guidance is not null and length(btrim(item.item_guidance)) = 0)
  ) or exists (
    select 1
    from jsonb_to_recordset(p_items) as item(module_key text, recommended_order integer)
    group by item.module_key
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_to_recordset(p_items) as item(module_key text, recommended_order integer)
    group by item.recommended_order
    having count(*) > 1
  ) then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  if p_profile_id is null then
    if p_expected_updated_at is not null then
      raise exception 'E12_4_3_INVALID_INPUT';
    end if;
    select coalesce(max(candidate.version), 0) + 1 into v_version
    from public.landing_page_generation_profiles candidate
    where candidate.owner_taxon_id = p_owner_taxon_id;

    insert into public.landing_page_generation_profiles (
      owner_taxon_id,
      version,
      status,
      generation_guidance
    ) values (
      p_owner_taxon_id,
      v_version,
      'draft',
      nullif(btrim(p_generation_guidance), '')
    ) returning * into v_profile;
  else
    select * into v_profile
    from public.landing_page_generation_profiles
    where id = p_profile_id and owner_taxon_id = p_owner_taxon_id
    for update;
    if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;
    if v_profile.status <> 'draft' then raise exception 'E12_4_3_INVALID_STATE'; end if;
    if p_expected_updated_at is null or v_profile.updated_at <> p_expected_updated_at then
      raise exception 'E12_4_3_STALE_SNAPSHOT';
    end if;

    update public.landing_page_generation_profiles
    set generation_guidance = nullif(btrim(p_generation_guidance), '')
    where id = v_profile.id
    returning * into v_profile;

    delete from public.landing_page_generation_profile_items
    where landing_page_generation_profile_items.profile_id = v_profile.id;
  end if;

  insert into public.landing_page_generation_profile_items (
    profile_id,
    module_key,
    module_version,
    variant_key,
    variant_version,
    priority,
    recommended_order,
    item_guidance
  )
  select
    v_profile.id,
    btrim(item.module_key),
    item.module_version,
    nullif(btrim(item.variant_key), ''),
    item.variant_version,
    item.priority,
    item.recommended_order,
    nullif(btrim(item.item_guidance), '')
  from jsonb_to_recordset(p_items) as item(
    module_key text,
    module_version integer,
    variant_key text,
    variant_version integer,
    priority text,
    recommended_order integer,
    item_guidance text
  );

  perform public.audit_context_event(
    'generation_profile_draft_saved',
    'landing_page_generation_profiles',
    v_profile.id,
    jsonb_strip_nulls(jsonb_build_object(
      'origin', p_origin,
      'request_id', p_request_id,
      'review_result', p_review_result,
      'correlation_status', case when p_request_id is null then 'unavailable' else 'available' end,
      'version', v_profile.version
    )),
    null
  );

  return query select v_profile.id, v_profile.version, v_profile.updated_at;
end
$function$;

comment on column public.landing_page_generation_profiles.generation_guidance
  is 'Optional human-authored guidance for future landing-page generation.';

comment on function public.save_landing_page_generation_profile_draft(uuid, uuid, timestamptz, text, jsonb, text, uuid, text)
  is 'E12.4.3/E20.3.5: saves a draft aggregate with optional human generation guidance, optimistic concurrency, and audit.';

commit;
