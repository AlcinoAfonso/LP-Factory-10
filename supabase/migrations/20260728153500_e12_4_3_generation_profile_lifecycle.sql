begin;

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
    or p_generation_guidance is null
    or length(btrim(p_generation_guidance)) = 0
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
      btrim(p_generation_guidance)
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
    set generation_guidance = btrim(p_generation_guidance)
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

create or replace function public.activate_landing_page_generation_profile(
  p_profile_id uuid,
  p_expected_updated_at timestamptz
)
returns table(profile_id uuid, version integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_profile public.landing_page_generation_profiles%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_owner_taxon_id uuid;
  v_previous_active_id uuid;
  v_request_id text;
  v_correlation_status text;
  v_last_save_changes jsonb;
begin
  if auth.uid() is null or not (
    coalesce(public.is_platform_admin(), false)
    or coalesce(public.is_super_admin(), false)
  ) then
    raise exception 'E12_4_3_UNAUTHORIZED';
  end if;

  select owner_taxon_id into v_owner_taxon_id
  from public.landing_page_generation_profiles
  where id = p_profile_id;
  if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;

  select * into v_taxon
  from public.business_taxons
  where id = v_owner_taxon_id
  for update;
  if not found or not v_taxon.is_active or v_taxon.level not in ('segment', 'niche') then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  select * into v_profile
  from public.landing_page_generation_profiles
  where id = p_profile_id and owner_taxon_id = v_owner_taxon_id
  for update;
  if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;
  if v_profile.status <> 'draft' then raise exception 'E12_4_3_INVALID_STATE'; end if;
  if p_expected_updated_at is null or v_profile.updated_at <> p_expected_updated_at then
    raise exception 'E12_4_3_STALE_SNAPSHOT';
  end if;

  select id into v_previous_active_id
  from public.landing_page_generation_profiles
  where owner_taxon_id = v_profile.owner_taxon_id and status = 'active'
  for update;

  if v_previous_active_id is not null then
    update public.landing_page_generation_profiles
    set status = 'archived'
    where id = v_previous_active_id;
  end if;

  update public.landing_page_generation_profiles
  set status = 'active'
  where id = v_profile.id
  returning * into v_profile;

  select changes_json into v_last_save_changes
  from public.audit_logs
  where record_id = v_profile.id
    and event = 'generation_profile_draft_saved'
  order by created_at desc, id desc
  limit 1;
  v_request_id := v_last_save_changes->>'request_id';
  v_correlation_status := coalesce(v_last_save_changes->>'correlation_status', 'unavailable');

  perform public.audit_context_event(
    'generation_profile_activated',
    'landing_page_generation_profiles',
    v_profile.id,
    jsonb_strip_nulls(jsonb_build_object(
      'request_id', v_request_id,
      'correlation_status', v_correlation_status,
      'human_result', 'activated',
      'previous_active_id', v_previous_active_id,
      'version', v_profile.version
    )),
    null
  );

  return query select v_profile.id, v_profile.version, v_profile.updated_at;
end
$function$;

create or replace function public.archive_landing_page_generation_profile(
  p_profile_id uuid,
  p_expected_updated_at timestamptz
)
returns table(profile_id uuid, version integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_profile public.landing_page_generation_profiles%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_owner_taxon_id uuid;
  v_previous_status text;
begin
  if auth.uid() is null or not (
    coalesce(public.is_platform_admin(), false)
    or coalesce(public.is_super_admin(), false)
  ) then
    raise exception 'E12_4_3_UNAUTHORIZED';
  end if;

  select owner_taxon_id into v_owner_taxon_id
  from public.landing_page_generation_profiles
  where id = p_profile_id;
  if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;

  select * into v_taxon
  from public.business_taxons
  where id = v_owner_taxon_id
  for update;
  if not found or not v_taxon.is_active or v_taxon.level not in ('segment', 'niche') then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  select * into v_profile
  from public.landing_page_generation_profiles
  where id = p_profile_id and owner_taxon_id = v_owner_taxon_id
  for update;
  if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;
  if v_profile.status not in ('draft', 'active') then raise exception 'E12_4_3_INVALID_STATE'; end if;
  if p_expected_updated_at is null or v_profile.updated_at <> p_expected_updated_at then
    raise exception 'E12_4_3_STALE_SNAPSHOT';
  end if;

  v_previous_status := v_profile.status;
  update public.landing_page_generation_profiles
  set status = 'archived'
  where id = v_profile.id
  returning * into v_profile;

  perform public.audit_context_event(
    'generation_profile_archived',
    'landing_page_generation_profiles',
    v_profile.id,
    jsonb_build_object(
      'previous_status', v_previous_status,
      'human_result', 'archived',
      'version', v_profile.version
    ),
    null
  );

  return query select v_profile.id, v_profile.version, v_profile.updated_at;
end
$function$;

create or replace function public.get_landing_page_generation_profile_lifecycle_status()
returns table(ready boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if auth.uid() is null or not (
    coalesce(public.is_platform_admin(), false)
    or coalesce(public.is_super_admin(), false)
  ) then
    raise exception 'E12_4_3_UNAUTHORIZED';
  end if;

  return query
  select
    has_function_privilege('authenticated', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('service_role', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text)', 'EXECUTE')
    and not has_function_privilege('service_role', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('service_role', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_table_privilege('authenticated', 'public.landing_page_generation_profiles', 'INSERT')
    and not has_table_privilege('authenticated', 'public.landing_page_generation_profiles', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.landing_page_generation_profiles', 'DELETE')
    and not has_table_privilege('authenticated', 'public.landing_page_generation_profile_items', 'INSERT')
    and not has_table_privilege('authenticated', 'public.landing_page_generation_profile_items', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.landing_page_generation_profile_items', 'DELETE')
    and not has_table_privilege('anon', 'public.landing_page_generation_profiles', 'INSERT')
    and not has_table_privilege('anon', 'public.landing_page_generation_profiles', 'UPDATE')
    and not has_table_privilege('anon', 'public.landing_page_generation_profiles', 'DELETE')
    and not has_table_privilege('anon', 'public.landing_page_generation_profile_items', 'INSERT')
    and not has_table_privilege('anon', 'public.landing_page_generation_profile_items', 'UPDATE')
    and not has_table_privilege('anon', 'public.landing_page_generation_profile_items', 'DELETE')
    and not has_table_privilege('service_role', 'public.landing_page_generation_profiles', 'INSERT')
    and not has_table_privilege('service_role', 'public.landing_page_generation_profiles', 'UPDATE')
    and not has_table_privilege('service_role', 'public.landing_page_generation_profiles', 'DELETE')
    and not has_table_privilege('service_role', 'public.landing_page_generation_profile_items', 'INSERT')
    and not has_table_privilege('service_role', 'public.landing_page_generation_profile_items', 'UPDATE')
    and not has_table_privilege('service_role', 'public.landing_page_generation_profile_items', 'DELETE')
    and has_table_privilege('service_role', 'public.landing_page_generation_profiles', 'SELECT')
    and has_table_privilege('service_role', 'public.landing_page_generation_profile_items', 'SELECT')
    and case
      when to_regrole('ai_readonly') is null then true
      else (
        not has_table_privilege('ai_readonly', 'public.landing_page_generation_profiles', 'INSERT')
        and not has_table_privilege('ai_readonly', 'public.landing_page_generation_profiles', 'UPDATE')
        and not has_table_privilege('ai_readonly', 'public.landing_page_generation_profiles', 'DELETE')
        and not has_table_privilege('ai_readonly', 'public.landing_page_generation_profile_items', 'INSERT')
        and not has_table_privilege('ai_readonly', 'public.landing_page_generation_profile_items', 'UPDATE')
        and not has_table_privilege('ai_readonly', 'public.landing_page_generation_profile_items', 'DELETE')
        and not has_function_privilege('ai_readonly', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
      )
    end
    and coalesce((select relrowsecurity from pg_class where oid = 'public.landing_page_generation_profiles'::regclass), false)
    and coalesce((select relrowsecurity from pg_class where oid = 'public.landing_page_generation_profile_items'::regclass), false)
    and not exists (
      select 1
      from pg_policy
      where polrelid in (
        'public.landing_page_generation_profiles'::regclass,
        'public.landing_page_generation_profile_items'::regclass
      )
    );
end
$function$;

revoke all on function public.save_landing_page_generation_profile_draft(uuid, uuid, timestamptz, text, jsonb, text, uuid, text)
  from public, anon, service_role;
revoke all on function public.activate_landing_page_generation_profile(uuid, timestamptz)
  from public, anon, service_role;
revoke all on function public.archive_landing_page_generation_profile(uuid, timestamptz)
  from public, anon, service_role;
revoke all on function public.get_landing_page_generation_profile_lifecycle_status()
  from public, anon, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.save_landing_page_generation_profile_draft(uuid, uuid, timestamptz, text, jsonb, text, uuid, text) from ai_readonly';
    execute 'revoke all on function public.activate_landing_page_generation_profile(uuid, timestamptz) from ai_readonly';
    execute 'revoke all on function public.archive_landing_page_generation_profile(uuid, timestamptz) from ai_readonly';
    execute 'revoke all on function public.get_landing_page_generation_profile_lifecycle_status() from ai_readonly';
  end if;
end;
$$;

grant execute on function public.save_landing_page_generation_profile_draft(uuid, uuid, timestamptz, text, jsonb, text, uuid, text) to authenticated;
grant execute on function public.activate_landing_page_generation_profile(uuid, timestamptz) to authenticated;
grant execute on function public.archive_landing_page_generation_profile(uuid, timestamptz) to authenticated;
grant execute on function public.get_landing_page_generation_profile_lifecycle_status() to authenticated;

comment on function public.save_landing_page_generation_profile_draft(uuid, uuid, timestamptz, text, jsonb, text, uuid, text)
  is 'E12.4.3: salva atomicamente um agregado draft com concorrencia otimista e auditoria.';
comment on function public.activate_landing_page_generation_profile(uuid, timestamptz)
  is 'E12.4.3: arquiva o active anterior e ativa o draft atomicamente.';
comment on function public.archive_landing_page_generation_profile(uuid, timestamptz)
  is 'E12.4.3: arquiva explicitamente um draft ou active com auditoria.';
comment on function public.get_landing_page_generation_profile_lifecycle_status()
  is 'E12.4.3: readiness read-only do lifecycle, incluindo ACL, RLS e ausencia de policies.';

commit;
