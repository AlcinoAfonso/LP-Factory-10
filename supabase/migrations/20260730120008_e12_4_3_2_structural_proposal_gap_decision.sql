begin;

drop function public.save_landing_page_generation_profile_draft(
  uuid, uuid, timestamptz, text, jsonb, text, uuid, text
);

create function public.save_landing_page_generation_profile_draft(
  p_owner_taxon_id uuid,
  p_profile_id uuid,
  p_expected_updated_at timestamptz,
  p_generation_guidance text,
  p_items jsonb,
  p_origin text,
  p_request_id uuid default null,
  p_review_result text default null,
  p_audit_context jsonb default '{}'::jsonb
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
  v_gap_decision text;
  v_effective_audit_context jsonb := p_audit_context;
  v_last_save_changes jsonb;
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
    or (p_review_result is not null and p_review_result not in ('accepted', 'adjusted'))
    or p_audit_context is null
    or jsonb_typeof(p_audit_context) <> 'object'
    or p_audit_context - array[
      'gap_decision', 'gap_item_keys', 'gap_impact_summary',
      'research_versions', 'raw_research_references'
    ] <> '{}'::jsonb then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  v_gap_decision := p_audit_context->>'gap_decision';
  if coalesce(jsonb_typeof(p_audit_context->'gap_item_keys'), 'array') <> 'array'
    or coalesce(jsonb_typeof(p_audit_context->'raw_research_references'), 'array') <> 'array'
    or (v_gap_decision is not null and v_gap_decision not in ('wait_for_modules', 'proceed_with_available'))
    or (
      v_gap_decision is null and (
        case when jsonb_typeof(p_audit_context->'gap_item_keys') = 'array' then jsonb_array_length(p_audit_context->'gap_item_keys') else 0 end <> 0
        or p_audit_context->>'gap_impact_summary' is not null
        or p_audit_context->'research_versions' is not null
      )
    )
    or (
      v_gap_decision is not null and (
        case when jsonb_typeof(p_audit_context->'gap_item_keys') = 'array' then jsonb_array_length(p_audit_context->'gap_item_keys') else 0 end = 0
        or coalesce(length(btrim(p_audit_context->>'gap_impact_summary')), 0) = 0
        or coalesce(jsonb_typeof(p_audit_context->'research_versions'), '') <> 'object'
        or p_audit_context->'research_versions' - array['endCustomer', 'businessBuyer'] <> '{}'::jsonb
        or not (p_audit_context->'research_versions' ?& array['endCustomer', 'businessBuyer'])
        or (p_audit_context->'research_versions'->>'endCustomer') !~ '^[1-9][0-9]*$'
        or (p_audit_context->'research_versions'->>'businessBuyer') !~ '^[1-9][0-9]*$'
      )
    )
    or exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(p_audit_context->'gap_item_keys') = 'array' then p_audit_context->'gap_item_keys' else '[]'::jsonb end) item
      where jsonb_typeof(item) <> 'string' or length(btrim(item #>> '{}')) = 0
    )
    or exists (
      select 1 from jsonb_array_elements(case when jsonb_typeof(p_audit_context->'raw_research_references') = 'array' then p_audit_context->'raw_research_references' else '[]'::jsonb end) raw
      where jsonb_typeof(raw) <> 'object'
        or raw - array['path', 'audienceScope', 'sourceTaxonId', 'sourceRelation', 'version', 'blob'] <> '{}'::jsonb
        or not (raw ?& array['path', 'audienceScope', 'sourceTaxonId', 'sourceRelation', 'version', 'blob'])
        or raw->>'path' !~ '^docs/pesquisas-brutas/[a-z0-9]+(-[a-z0-9]+)*/(business_buyer|end_customer)/v[1-9][0-9]*[.]md$'
        or raw->>'audienceScope' not in ('business_buyer', 'end_customer')
        or raw->>'sourceRelation' not in ('own', 'direct_parent')
        or raw->>'sourceTaxonId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        or (raw->>'version') !~ '^[1-9][0-9]*$'
        or raw->>'blob' !~ '^[0-9a-f]{40}$'
    ) then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as raw(item)
    where jsonb_typeof(raw.item) <> 'object'
      or raw.item - array[
        'module_key', 'module_version', 'variant_key', 'variant_version',
        'priority', 'recommended_order', 'item_guidance'
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
      module_key text, module_version integer, variant_key text,
      variant_version integer, priority text, recommended_order integer,
      item_guidance text
    )
    where item.module_key is null
      or length(btrim(item.module_key)) = 0
      or item.module_version is null or item.module_version <= 0
      or ((item.variant_key is null) <> (item.variant_version is null))
      or (item.variant_key is not null and length(btrim(item.variant_key)) = 0)
      or (item.variant_version is not null and item.variant_version <= 0)
      or item.priority is null or item.priority not in ('P1', 'P2', 'P3')
      or item.recommended_order is null or item.recommended_order <= 0
      or (item.item_guidance is not null and length(btrim(item.item_guidance)) = 0)
  ) or exists (
    select 1 from jsonb_to_recordset(p_items) as item(module_key text, recommended_order integer)
    group by item.module_key having count(*) > 1
  ) or exists (
    select 1 from jsonb_to_recordset(p_items) as item(module_key text, recommended_order integer)
    group by item.recommended_order having count(*) > 1
  ) then
    raise exception 'E12_4_3_INVALID_INPUT';
  end if;

  if p_profile_id is null then
    if p_expected_updated_at is not null then raise exception 'E12_4_3_INVALID_INPUT'; end if;
    select coalesce(max(candidate.version), 0) + 1 into v_version
    from public.landing_page_generation_profiles candidate
    where candidate.owner_taxon_id = p_owner_taxon_id;
    insert into public.landing_page_generation_profiles (
      owner_taxon_id, version, status, generation_guidance
    ) values (
      p_owner_taxon_id, v_version, 'draft', nullif(btrim(p_generation_guidance), '')
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

  if p_profile_id is not null and v_gap_decision is null then
    select changes_json into v_last_save_changes
    from public.audit_logs
    where record_id = v_profile.id
      and event = 'generation_profile_draft_saved'
    order by created_at desc, id desc
    limit 1;
    if v_last_save_changes->>'gap_decision' in ('wait_for_modules', 'proceed_with_available') then
      v_gap_decision := v_last_save_changes->>'gap_decision';
      v_effective_audit_context := p_audit_context || jsonb_build_object(
        'gap_decision', v_gap_decision,
        'gap_item_keys', v_last_save_changes->'gap_item_keys',
        'gap_impact_summary', v_last_save_changes->>'gap_impact_summary',
        'research_versions', v_last_save_changes->'research_versions'
      );
    end if;
  end if;

  insert into public.landing_page_generation_profile_items (
    profile_id, module_key, module_version, variant_key, variant_version,
    priority, recommended_order, item_guidance
  )
  select v_profile.id, btrim(item.module_key), item.module_version,
    nullif(btrim(item.variant_key), ''), item.variant_version, item.priority,
    item.recommended_order, nullif(btrim(item.item_guidance), '')
  from jsonb_to_recordset(p_items) as item(
    module_key text, module_version integer, variant_key text,
    variant_version integer, priority text, recommended_order integer,
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
      'version', v_profile.version,
      'gap_decision', v_gap_decision,
      'gap_item_keys', v_effective_audit_context->'gap_item_keys',
      'gap_count', coalesce(jsonb_array_length(v_effective_audit_context->'gap_item_keys'), 0),
      'gap_impact_summary', v_effective_audit_context->>'gap_impact_summary',
      'research_versions', v_effective_audit_context->'research_versions',
      'raw_research_references', v_effective_audit_context->'raw_research_references'
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
  if auth.uid() is null or not (coalesce(public.is_platform_admin(), false) or coalesce(public.is_super_admin(), false)) then
    raise exception 'E12_4_3_UNAUTHORIZED';
  end if;
  select owner_taxon_id into v_owner_taxon_id
  from public.landing_page_generation_profiles where id = p_profile_id;
  if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;
  select * into v_taxon from public.business_taxons where id = v_owner_taxon_id for update;
  if not found or not v_taxon.is_active or v_taxon.level not in ('segment', 'niche') then raise exception 'E12_4_3_INVALID_INPUT'; end if;
  select * into v_profile from public.landing_page_generation_profiles
  where id = p_profile_id and owner_taxon_id = v_owner_taxon_id for update;
  if not found then raise exception 'E12_4_3_NOT_FOUND'; end if;
  if v_profile.status <> 'draft' then raise exception 'E12_4_3_INVALID_STATE'; end if;
  if p_expected_updated_at is null or v_profile.updated_at <> p_expected_updated_at then raise exception 'E12_4_3_STALE_SNAPSHOT'; end if;

  select changes_json into v_last_save_changes
  from public.audit_logs
  where record_id = v_profile.id and event = 'generation_profile_draft_saved'
  order by created_at desc, id desc limit 1;
  if coalesce(v_last_save_changes->>'gap_decision', '') = 'wait_for_modules' then
    raise exception 'E12_4_3_INVALID_STATE: waiting for missing modules';
  end if;

  select id into v_previous_active_id from public.landing_page_generation_profiles
  where owner_taxon_id = v_profile.owner_taxon_id and status = 'active' for update;
  if v_previous_active_id is not null then
    update public.landing_page_generation_profiles set status = 'archived' where id = v_previous_active_id;
  end if;
  update public.landing_page_generation_profiles set status = 'active'
  where id = v_profile.id returning * into v_profile;
  v_request_id := v_last_save_changes->>'request_id';
  v_correlation_status := coalesce(v_last_save_changes->>'correlation_status', 'unavailable');
  perform public.audit_context_event(
    'generation_profile_activated', 'landing_page_generation_profiles', v_profile.id,
    jsonb_strip_nulls(jsonb_build_object(
      'request_id', v_request_id,
      'correlation_status', v_correlation_status,
      'human_result', 'activated',
      'previous_active_id', v_previous_active_id,
      'version', v_profile.version
    )), null
  );
  return query select v_profile.id, v_profile.version, v_profile.updated_at;
end
$function$;

drop function public.get_landing_page_generation_profile_lifecycle_status();

create function public.get_landing_page_generation_profile_lifecycle_status()
returns table(ready boolean, contract_version integer)
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
    has_function_privilege('authenticated', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text,jsonb)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text,jsonb)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
    and not has_function_privilege('service_role', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text,jsonb)', 'EXECUTE')
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
        and not has_function_privilege('ai_readonly', 'public.save_landing_page_generation_profile_draft(uuid,uuid,timestamp with time zone,text,jsonb,text,uuid,text,jsonb)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.activate_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
        and not has_function_privilege('ai_readonly', 'public.archive_landing_page_generation_profile(uuid,timestamp with time zone)', 'EXECUTE')
      )
    end
    and coalesce((select relrowsecurity from pg_class where oid = 'public.landing_page_generation_profiles'::regclass), false)
    and coalesce((select relrowsecurity from pg_class where oid = 'public.landing_page_generation_profile_items'::regclass), false)
    and not exists (
      select 1 from pg_policy
      where polrelid in (
        'public.landing_page_generation_profiles'::regclass,
        'public.landing_page_generation_profile_items'::regclass
      )
    ),
    2;
end
$function$;

revoke all on function public.save_landing_page_generation_profile_draft(
  uuid, uuid, timestamptz, text, jsonb, text, uuid, text, jsonb
) from public, anon, service_role;
revoke all on function public.get_landing_page_generation_profile_lifecycle_status()
  from public, anon, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.save_landing_page_generation_profile_draft(uuid, uuid, timestamptz, text, jsonb, text, uuid, text, jsonb) from ai_readonly';
    execute 'revoke all on function public.get_landing_page_generation_profile_lifecycle_status() from ai_readonly';
  end if;
end;
$$;

grant execute on function public.save_landing_page_generation_profile_draft(
  uuid, uuid, timestamptz, text, jsonb, text, uuid, text, jsonb
) to authenticated;
grant execute on function public.get_landing_page_generation_profile_lifecycle_status() to authenticated;

comment on function public.save_landing_page_generation_profile_draft(
  uuid, uuid, timestamptz, text, jsonb, text, uuid, text, jsonb
) is 'E12.4.3.2: saves a draft and audits the transient gap decision and safe source references.';
comment on function public.get_landing_page_generation_profile_lifecycle_status()
  is 'E12.4.3.2: reports lifecycle readiness with contract_version 2.';

commit;
