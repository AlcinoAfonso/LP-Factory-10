-- D14F: commit the complete generated intelligence only against the current Base, niche and catalog.
begin;

create function public.commit_generated_communication_intelligence_v1(
  p_account_id uuid,
  p_expected_version integer,
  p_expected_catalog jsonb,
  p_expected_niche jsonb,
  p_generated_sections jsonb
) returns setof public.account_communication_bases
language plpgsql security invoker set search_path='' as $$
declare
  v_base public.account_communication_bases%rowtype;
  v_official public.account_official_niches%rowtype;
  v_taxon_id uuid;
  v_taxon_updated_at timestamptz;
  v_taxon_name text;
  v_catalog jsonb;
  v_expected_keys jsonb;
  v_received_keys jsonb;
  v_section record;
  v_value jsonb;
begin
  if p_account_id is null or p_expected_version is null or p_expected_version < 1 or
     jsonb_typeof(p_expected_catalog) is distinct from 'object' or
     jsonb_typeof(p_expected_niche) is distinct from 'object' or
     jsonb_typeof(p_generated_sections) is distinct from 'object' then
    raise exception 'invalid_generation_commit' using errcode='22023';
  end if;

  -- Existing catalog administrator uses this exact advisory lock.
  perform pg_catalog.pg_advisory_xact_lock(253,1);
  select pg_catalog.jsonb_build_object(
    'business', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'key',section_key,'label',label,'format',format) order by sort_order,section_key)
      from public.communication_base_sections where category='business'),'[]'::jsonb),
    'targets', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'key',section_key,'label',label,'format',format) order by sort_order,section_key)
      from public.communication_base_sections where category='intelligence'),'[]'::jsonb)
  ) into v_catalog;
  if v_catalog is distinct from p_expected_catalog then
    raise exception 'generation_catalog_changed' using errcode='40001';
  end if;

  -- Niche confirmation locks the account FOR UPDATE; this SHARE lock serializes with it.
  perform 1 from public.accounts where id=p_account_id and status='active' for share;
  if not found then raise exception 'generation_account_changed' using errcode='40001'; end if;
  select * into v_official from public.account_official_niches
    where account_id=p_account_id for share;
  if found then
    if v_official.description is distinct from p_expected_niche->>'name' or
       v_official.revision::text is distinct from p_expected_niche->>'textRevision' or
       p_expected_niche->>'taxonId' is not null then
      raise exception 'generation_niche_changed' using errcode='40001';
    end if;
  else
    select t.taxon_id,t.updated_at,b.name into v_taxon_id,v_taxon_updated_at,v_taxon_name
      from public.account_taxonomy t join public.business_taxons b on b.id=t.taxon_id
      where t.account_id=p_account_id and t.is_primary and t.status='active' and b.is_active
      for share of t,b;
    if not found or p_expected_niche->>'textRevision' is distinct from '0' or
       v_taxon_id::text is distinct from p_expected_niche->>'taxonId' or
       v_taxon_updated_at is distinct from (p_expected_niche->>'legacyUpdatedAt')::timestamptz or
       v_taxon_name is distinct from p_expected_niche->>'name' then
      raise exception 'generation_niche_changed' using errcode='40001';
    end if;
  end if;

  select coalesce(pg_catalog.jsonb_agg(section_key order by section_key),'[]'::jsonb)
    into v_expected_keys from public.communication_base_sections where category='intelligence';
  select coalesce(pg_catalog.jsonb_agg(key order by key),'[]'::jsonb)
    into v_received_keys from pg_catalog.jsonb_object_keys(p_generated_sections) as k(key);
  if v_expected_keys='[]'::jsonb or v_received_keys is distinct from v_expected_keys then
    raise exception 'invalid_generation_sections' using errcode='22023';
  end if;
  for v_section in select section_key,format from public.communication_base_sections
      where category='intelligence' loop
    v_value:=p_generated_sections->v_section.section_key;
    if pg_catalog.jsonb_typeof(v_value) is distinct from 'object' or
       v_value->>'origin' is distinct from 'agent_generated' or
       v_value->>'format' is distinct from v_section.format or
       v_value ? 'facts' or
       (v_section.format='text' and
         (pg_catalog.jsonb_typeof(v_value->'value') is distinct from 'string' or
          pg_catalog.btrim(v_value->>'value')='')) or
       (v_section.format in ('items','faq') and
         (pg_catalog.jsonb_typeof(v_value->'value') is distinct from 'array' or
          pg_catalog.jsonb_array_length(v_value->'value')=0)) then
      raise exception 'invalid_generation_sections' using errcode='22023';
    end if;
  end loop;

  select * into v_base from public.account_communication_bases
    where account_id=p_account_id for update;
  if not found or v_base.version<>p_expected_version then
    raise exception 'generation_base_changed' using errcode='40001';
  end if;
  update public.account_communication_bases
    set sections_json=v_base.sections_json || p_generated_sections,
        version=v_base.version+1, updated_at=pg_catalog.clock_timestamp()
    where account_id=p_account_id returning * into v_base;
  return next v_base;
end;
$$;

revoke all on function public.commit_generated_communication_intelligence_v1(uuid,integer,jsonb,jsonb,jsonb)
  from public,anon,authenticated,ai_readonly;
grant execute on function public.commit_generated_communication_intelligence_v1(uuid,integer,jsonb,jsonb,jsonb)
  to service_role;

commit;
