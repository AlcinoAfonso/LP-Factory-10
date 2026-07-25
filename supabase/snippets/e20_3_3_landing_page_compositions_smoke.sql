-- E20.3.3: transactional activation smoke cases.
-- Expected: four rows with check_status = ok and no persistent writes.

begin;

do $$
declare
  v_actor uuid;
  v_owner uuid := gen_random_uuid();
  v_inactive_owner uuid := gen_random_uuid();
  v_ultra_owner uuid := gen_random_uuid();
  v_first uuid := gen_random_uuid();
  v_second uuid := gen_random_uuid();
  v_inactive_draft uuid := gen_random_uuid();
  v_ultra_draft uuid := gen_random_uuid();
  v_updated_at timestamptz;
begin
  select users.id
    into v_actor
  from auth.users users
  order by users.created_at, users.id
  limit 1;

  if v_actor is null then
    raise exception 'E20.3.3 smoke requires one existing auth user';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_actor, 'role', 'super_admin')::text,
    true
  );

  insert into public.business_taxons (id, level, name, slug, is_active)
  values
    (v_owner, 'segment', 'E20.3.3 smoke owner', 'e20-3-3-smoke-' || v_owner, true),
    (
      v_inactive_owner,
      'niche',
      'E20.3.3 inactive owner',
      'e20-3-3-inactive-' || v_inactive_owner,
      true
    ),
    (
      v_ultra_owner,
      'ultra_niche',
      'E20.3.3 ultra owner',
      'e20-3-3-ultra-' || v_ultra_owner,
      true
    );

  insert into public.landing_page_taxon_policies (
    taxon_id,
    own_composition_allowed,
    decision_reason,
    created_by,
    updated_by
  ) values (
    v_ultra_owner,
    true,
    'Transactional smoke authorization',
    v_actor,
    v_actor
  );

  insert into public.landing_page_compositions (
    id,
    owner_taxon_id,
    version,
    root_snapshot_json,
    module_catalog_snapshot_json,
    research_snapshot_json,
    input_catalog_snapshot_json,
    items_json,
    gaps_json,
    provenance_json,
    validation_fingerprint,
    created_by,
    updated_by
  ) values (
    v_first,
    v_owner,
    1,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '[{"moduleKey":"hero"}]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    repeat('a', 64),
    v_actor,
    v_actor
  ) returning updated_at into v_updated_at;

  perform public.activate_landing_page_composition(
    v_first,
    repeat('a', 64),
    v_updated_at
  );

  insert into public.landing_page_compositions (
    id,
    owner_taxon_id,
    version,
    root_snapshot_json,
    module_catalog_snapshot_json,
    research_snapshot_json,
    input_catalog_snapshot_json,
    items_json,
    gaps_json,
    provenance_json,
    validation_fingerprint,
    created_by,
    updated_by
  ) values (
    v_second,
    v_owner,
    2,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '[{"moduleKey":"hero"}]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    repeat('b', 64),
    v_actor,
    v_actor
  ) returning updated_at into v_updated_at;

  begin
    perform public.activate_landing_page_composition(
      v_second,
      repeat('c', 64),
      v_updated_at
    );
    raise exception 'snapshot divergence did not fail closed';
  exception
    when sqlstate '40001' then null;
  end;

  perform public.activate_landing_page_composition(
    v_second,
    repeat('b', 64),
    v_updated_at
  );

  if not exists (
    select 1
    from public.landing_page_compositions
    where id = v_first and status = 'archived'
  ) or not exists (
    select 1
    from public.landing_page_compositions
    where id = v_second and status = 'active'
  ) then
    raise exception 'activation did not archive the previous active snapshot';
  end if;

  insert into public.landing_page_compositions (
    id,
    owner_taxon_id,
    version,
    root_snapshot_json,
    module_catalog_snapshot_json,
    research_snapshot_json,
    input_catalog_snapshot_json,
    items_json,
    gaps_json,
    provenance_json,
    validation_fingerprint,
    created_by,
    updated_by
  ) values (
    v_inactive_draft,
    v_inactive_owner,
    1,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '[{"moduleKey":"hero"}]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    repeat('d', 64),
    v_actor,
    v_actor
  ) returning updated_at into v_updated_at;

  update public.business_taxons
  set is_active = false
  where id = v_inactive_owner;

  begin
    perform public.activate_landing_page_composition(
      v_inactive_draft,
      repeat('d', 64),
      v_updated_at
    );
    raise exception 'inactive owner activated';
  exception
    when sqlstate '23514' then null;
  end;

  insert into public.landing_page_compositions (
    id,
    owner_taxon_id,
    version,
    root_snapshot_json,
    module_catalog_snapshot_json,
    research_snapshot_json,
    input_catalog_snapshot_json,
    items_json,
    gaps_json,
    provenance_json,
    validation_fingerprint,
    created_by,
    updated_by
  ) values (
    v_ultra_draft,
    v_ultra_owner,
    1,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '[{"moduleKey":"hero"}]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    repeat('e', 64),
    v_actor,
    v_actor
  ) returning updated_at into v_updated_at;

  update public.landing_page_taxon_policies
  set own_composition_allowed = false,
      decision_reason = 'Transactional smoke revocation',
      updated_by = v_actor
  where taxon_id = v_ultra_owner;

  begin
    perform public.activate_landing_page_composition(
      v_ultra_draft,
      repeat('e', 64),
      v_updated_at
    );
    raise exception 'revoked ultra-niche authorization activated';
  exception
    when sqlstate '23514' then null;
  end;
end;
$$;

rollback;

select case_name, 'ok'::text as check_status
from (
  values
    ('snapshot_divergence_fails_closed'),
    ('previous_active_is_archived'),
    ('inactive_owner_fails_closed'),
    ('revoked_ultra_niche_policy_fails_closed')
) as checks(case_name)
order by case_name;
