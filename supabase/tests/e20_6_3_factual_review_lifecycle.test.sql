begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2063000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e20.6.3-test@example.com',
  now(),
  now()
);

do $$
declare
  v_default text;
  v_open record;
  v_retry record;
  v_release_snapshot jsonb;
  v_revision_snapshot jsonb;
begin
  select column_default into v_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'business_taxons'
    and column_name = 'is_active';
  if lower(coalesce(v_default, '')) not in ('false', 'false::boolean') then
    raise exception 'E20.6.3 taxons must default to inactive';
  end if;

  if to_regclass('public.business_taxon_factual_reviews') is null
     or to_regclass('public.business_taxon_factual_review_events') is null
     or not (select relrowsecurity from pg_class where oid = 'public.business_taxon_factual_reviews'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.business_taxon_factual_review_events'::regclass)
     or exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename in ('business_taxon_factual_reviews', 'business_taxon_factual_review_events')
     ) then
    raise exception 'E20.6.3 factual lifecycle tables or service-only RLS drifted';
  end if;
  if has_table_privilege('anon', 'public.business_taxon_factual_reviews', 'SELECT')
     or has_table_privilege('authenticated', 'public.business_taxon_factual_reviews', 'SELECT')
     or has_table_privilege('anon', 'public.business_taxon_factual_review_events', 'SELECT')
     or has_table_privilege('authenticated', 'public.business_taxon_factual_review_events', 'SELECT')
     or not has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'SELECT,INSERT,UPDATE')
     or has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'DELETE,TRUNCATE')
     or not has_table_privilege('service_role', 'public.business_taxon_factual_review_events', 'SELECT,INSERT')
     or has_table_privilege('service_role', 'public.business_taxon_factual_review_events', 'UPDATE,DELETE,TRUNCATE')
     or (to_regrole('ai_readonly') is not null and (
       has_table_privilege('ai_readonly', 'public.business_taxon_factual_reviews', 'SELECT,INSERT,UPDATE,DELETE')
       or has_table_privilege('ai_readonly', 'public.business_taxon_factual_review_events', 'SELECT,INSERT,UPDATE,DELETE')
     )) then
    raise exception 'E20.6.3 factual lifecycle ACL drifted';
  end if;
  if has_function_privilege(
       'anon',
       'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public.open_business_taxon_factual_review_v1(uuid,text,jsonb,uuid,uuid,boolean,integer)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb,jsonb)',
       'EXECUTE'
     ) then
    raise exception 'E20.6.3 RPC ACL drifted';
  end if;

  insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
  values (
    'e2063000-0000-4000-8000-000000000010', null, 'segment',
    'E20.6.3 active parent', 'e20-6-3-active-parent', true
  );
  insert into public.business_taxons (id, parent_id, level, name, slug)
  values (
    'e2063000-0000-4000-8000-000000000011',
    'e2063000-0000-4000-8000-000000000010', 'niche',
    'E20.6.3 inactive release', 'e20-6-3-inactive-release'
  );

  v_release_snapshot := jsonb_build_array(
    jsonb_build_object(
      'id', 'e2063000-0000-4000-8000-000000000010',
      'parentId', null,
      'level', 'segment',
      'name', 'E20.6.3 active parent',
      'slug', 'e20-6-3-active-parent',
      'isActive', true
    ),
    jsonb_build_object(
      'id', 'e2063000-0000-4000-8000-000000000011',
      'parentId', 'e2063000-0000-4000-8000-000000000010',
      'level', 'niche',
      'name', 'E20.6.3 inactive release',
      'slug', 'e20-6-3-inactive-release',
      'isActive', false
    )
  );

  select * into v_open
  from public.open_business_taxon_factual_review_v1(
    'e2063000-0000-4000-8000-000000000011', repeat('a', 64),
    v_release_snapshot,
    'e2063000-0000-4000-8000-000000000020',
    'e2063000-0000-4000-8000-000000000001', false, null
  );
  if v_open.review_kind <> 'release'
     or v_open.review_status <> 'open'
     or v_open.review_revision <> 1
     or (select chain_snapshot from public.business_taxon_factual_reviews where id = v_open.review_id) <> v_release_snapshot then
    raise exception 'E20.6.3 release opening returned invalid state';
  end if;

  select * into v_retry
  from public.open_business_taxon_factual_review_v1(
    'e2063000-0000-4000-8000-000000000011', repeat('a', 64),
    v_release_snapshot,
    'e2063000-0000-4000-8000-000000000020',
    'e2063000-0000-4000-8000-000000000001', false, null
  );
  if v_retry.review_id is distinct from v_open.review_id then
    raise exception 'E20.6.3 idempotent opening created another session';
  end if;

  begin
    perform * from public.open_business_taxon_factual_review_v1(
      'e2063000-0000-4000-8000-000000000011', repeat('a', 64),
      v_release_snapshot,
      'e2063000-0000-4000-8000-000000000021',
      'e2063000-0000-4000-8000-000000000001', false, null
    );
    raise exception 'parallel factual session unexpectedly accepted';
  exception when serialization_failure then null;
  end;

  begin
    perform * from public.close_business_taxon_factual_review_without_change_v1(
      v_open.review_id, 'e2063000-0000-4000-8000-000000000022',
      'e2063000-0000-4000-8000-000000000001', 2, 6,
      repeat('a', 64), repeat('b', 64), v_release_snapshot
    );
    raise exception 'stale factual revision unexpectedly accepted';
  exception when serialization_failure then null;
  end;
  if (select is_active from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000011')
     or (select status <> 'open' or revision <> 1 from public.business_taxon_factual_reviews where id = v_open.review_id)
     or (select count(*) from public.business_taxon_factual_review_events where review_id = v_open.review_id) <> 1 then
    raise exception 'failed stale closure did not preserve the prior state';
  end if;

  begin
    update public.business_taxons
    set name = 'E20.6.3 drifted release'
    where id = 'e2063000-0000-4000-8000-000000000011';
    perform * from public.close_business_taxon_factual_review_without_change_v1(
      v_open.review_id, 'e2063000-0000-4000-8000-000000000031',
      'e2063000-0000-4000-8000-000000000001', 1, 6,
      repeat('a', 64), repeat('b', 64), v_release_snapshot
    );
    raise exception 'selected taxon identity drift unexpectedly accepted';
  exception when serialization_failure then null;
  end;
  if (select name from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000011') <> 'E20.6.3 inactive release'
     or (select count(*) from public.business_taxon_factual_review_events where review_id = v_open.review_id) <> 1 then
    raise exception 'selected taxon drift rollback did not preserve state';
  end if;

  begin
    update public.business_taxons
    set slug = 'e20-6-3-drifted-parent'
    where id = 'e2063000-0000-4000-8000-000000000010';
    perform * from public.close_business_taxon_factual_review_without_change_v1(
      v_open.review_id, 'e2063000-0000-4000-8000-000000000032',
      'e2063000-0000-4000-8000-000000000001', 1, 6,
      repeat('a', 64), repeat('b', 64), v_release_snapshot
    );
    raise exception 'ancestor identity drift unexpectedly accepted';
  exception when serialization_failure then null;
  end;
  if (select slug from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010') <> 'e20-6-3-active-parent'
     or (select status <> 'open' or revision <> 1 from public.business_taxon_factual_reviews where id = v_open.review_id)
     or (select count(*) from public.business_taxon_factual_review_events where review_id = v_open.review_id) <> 1 then
    raise exception 'ancestor drift rollback did not preserve state';
  end if;

  select * into v_retry
  from public.close_business_taxon_factual_review_without_change_v1(
    v_open.review_id, 'e2063000-0000-4000-8000-000000000023',
    'e2063000-0000-4000-8000-000000000001', 1, 6,
    repeat('a', 64), repeat('b', 64), v_release_snapshot
  );
  if v_retry.review_status <> 'closed_without_change'
     or v_retry.review_revision <> 2
     or not (select is_active from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000011')
     or (select reviewed_input_catalog_version from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000011') <> 6
     or (select count(*) from public.business_taxon_factual_review_events where review_id = v_open.review_id) <> 3
     or (select payload_json ->> 'expected_revision'
         from public.business_taxon_factual_review_events
         where review_id = v_open.review_id and operation_id = 'e2063000-0000-4000-8000-000000000023') <> '1' then
    raise exception 'E20.6.3 atomic no-change release failed';
  end if;

  begin
    perform * from public.close_business_taxon_factual_review_without_change_v1(
      v_open.review_id, 'e2063000-0000-4000-8000-000000000023',
      'e2063000-0000-4000-8000-000000000001', 2, 6,
      repeat('a', 64), repeat('b', 64), v_release_snapshot
    );
    raise exception 'divergent replay revision unexpectedly accepted';
  exception when invalid_parameter_value then null;
  end;
  if (select count(*) from public.business_taxon_factual_review_events where review_id = v_open.review_id) <> 3
     or (select revision from public.business_taxon_factual_reviews where id = v_open.review_id) <> 2 then
    raise exception 'divergent replay changed factual state';
  end if;

  select * into v_retry
  from public.close_business_taxon_factual_review_without_change_v1(
    v_open.review_id, 'e2063000-0000-4000-8000-000000000023',
    'e2063000-0000-4000-8000-000000000001', 1, 6,
    repeat('a', 64), repeat('b', 64), v_release_snapshot
  );
  if v_retry.review_revision <> 2
     or (select count(*) from public.business_taxon_factual_review_events where review_id = v_open.review_id) <> 3 then
    raise exception 'E20.6.3 idempotent closure duplicated effects';
  end if;

  update public.business_taxons
  set reviewed_input_catalog_version = 5
  where id = 'e2063000-0000-4000-8000-000000000010';
  v_revision_snapshot := jsonb_build_array(
    jsonb_build_object(
      'id', 'e2063000-0000-4000-8000-000000000010',
      'parentId', null,
      'level', 'segment',
      'name', 'E20.6.3 active parent',
      'slug', 'e20-6-3-active-parent',
      'isActive', true
    )
  );
  select * into v_open
  from public.open_business_taxon_factual_review_v1(
    'e2063000-0000-4000-8000-000000000010', repeat('c', 64),
    v_revision_snapshot,
    'e2063000-0000-4000-8000-000000000024',
    'e2063000-0000-4000-8000-000000000001', true, 5
  );
  if v_open.review_kind <> 'revision'
     or v_open.review_baseline_reviewed_input_catalog_version <> 5 then
    raise exception 'active revision did not preserve its non-null marker';
  end if;

  begin
    update public.business_taxons
    set name = 'E20.6.3 drifted active revision'
    where id = 'e2063000-0000-4000-8000-000000000010';
    perform * from public.close_business_taxon_factual_review_without_change_v1(
      v_open.review_id, 'e2063000-0000-4000-8000-000000000025',
      'e2063000-0000-4000-8000-000000000001', 1, 6,
      repeat('c', 64), repeat('d', 64), v_revision_snapshot
    );
    raise exception 'active revision identity drift unexpectedly accepted';
  exception when serialization_failure then null;
  end;
  if (select name from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010') <> 'E20.6.3 active parent'
     or (select reviewed_input_catalog_version from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010') <> 5
     or not (select is_active from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010')
     or (select status <> 'open' or revision <> 1 from public.business_taxon_factual_reviews where id = v_open.review_id) then
    raise exception 'active revision rollback did not preserve state';
  end if;

  select * into v_retry
  from public.close_business_taxon_factual_review_without_change_v1(
    v_open.review_id, 'e2063000-0000-4000-8000-000000000026',
    'e2063000-0000-4000-8000-000000000001', 1, 6,
    repeat('c', 64), repeat('d', 64), v_revision_snapshot,
    jsonb_build_object(
      'recommendationCandidateCount', 2,
      'recommendationSelection', 'zero',
      'acceptedCandidates', '[]'::jsonb,
      'rejectedCandidateIndexes', '[0,1]'::jsonb,
      'ownCandidate', null
    )
  );
  if v_retry.review_status <> 'closed_without_change'
     or v_retry.review_revision <> 2
     or not (select is_active from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010')
     or (select reviewed_input_catalog_version from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010') <> 6
     or (select payload_json -> 'human_decision' ->> 'recommendationSelection'
         from public.business_taxon_factual_review_events
         where review_id = v_open.review_id
           and operation_id = 'e2063000-0000-4000-8000-000000000026') <> 'zero' then
    raise exception 'active no-change revision failed';
  end if;

  select * into v_retry
  from public.close_business_taxon_factual_review_without_change_v1(
    v_open.review_id, 'e2063000-0000-4000-8000-000000000026',
    'e2063000-0000-4000-8000-000000000001', 1, 6,
    repeat('c', 64), repeat('d', 64), v_revision_snapshot,
    jsonb_build_object(
      'recommendationCandidateCount', 2,
      'recommendationSelection', 'zero',
      'acceptedCandidates', '[]'::jsonb,
      'rejectedCandidateIndexes', '[0,1]'::jsonb,
      'ownCandidate', null
    )
  );
  if v_retry.review_revision <> 2
     or (select count(*) from public.business_taxon_factual_review_events
         where review_id = v_open.review_id) <> 3 then
    raise exception 'exact human no-change replay duplicated effects';
  end if;

  begin
    perform * from public.close_business_taxon_factual_review_without_change_v1(
      v_open.review_id, 'e2063000-0000-4000-8000-000000000026',
      'e2063000-0000-4000-8000-000000000001', 1, 6,
      repeat('c', 64), repeat('d', 64), v_revision_snapshot,
      jsonb_build_object(
        'recommendationCandidateCount', 1,
        'recommendationSelection', 'zero',
        'acceptedCandidates', '[]'::jsonb,
        'rejectedCandidateIndexes', '[0]'::jsonb,
        'ownCandidate', null
      )
    );
    raise exception 'divergent human no-change replay unexpectedly accepted';
  exception when invalid_parameter_value then null;
  end;

  begin
    update public.business_taxon_factual_review_events
    set payload_json = '{"tampered":true}'::jsonb
    where review_id = v_open.review_id;
    raise exception 'append-only factual event unexpectedly updated';
  exception when insufficient_privilege then null;
  end;
end;
$$;

do $$
declare
  v_actor constant uuid := 'e2063000-0000-4000-8000-000000000001';
  v_release_taxon constant uuid := 'e2064000-0000-4000-8000-000000000101';
  v_revision_taxon constant uuid := 'e2064000-0000-4000-8000-000000000102';
  v_uncovered_release_taxon constant uuid := 'e2064000-0000-4000-8000-000000000103';
  v_release_review record;
  v_revision_review record;
  v_uncovered_release_review record;
  v_result record;
  v_release_snapshot jsonb;
  v_revision_snapshot jsonb;
  v_uncovered_release_snapshot jsonb;
  v_zero_decision jsonb;
  v_partial_decision jsonb;
  v_total_decision jsonb;
  v_drift_taxon uuid;
begin
  insert into public.business_taxons (
    id, parent_id, level, name, slug, is_active, reviewed_input_catalog_version
  ) values
    (
      v_release_taxon, null, 'segment', 'E20.6.4 inactive release',
      'e20-6-4-inactive-release', false, null
    ),
    (
      v_revision_taxon, null, 'segment', 'E20.6.4 active revision',
      'e20-6-4-active-revision', true, 6
    );

  v_release_snapshot := jsonb_build_array(jsonb_build_object(
    'id', v_release_taxon::text,
    'parentId', null,
    'level', 'segment',
    'name', 'E20.6.4 inactive release',
    'slug', 'e20-6-4-inactive-release',
    'isActive', false
  ));
  v_revision_snapshot := jsonb_build_array(jsonb_build_object(
    'id', v_revision_taxon::text,
    'parentId', null,
    'level', 'segment',
    'name', 'E20.6.4 active revision',
    'slug', 'e20-6-4-active-revision',
    'isActive', true
  ));

  select * into v_release_review
  from public.open_business_taxon_factual_review_v1(
    v_release_taxon, repeat('a', 64), v_release_snapshot,
    'e2064000-0000-4000-8000-000000000201', v_actor, false, null
  );
  select * into v_revision_review
  from public.open_business_taxon_factual_review_v1(
    v_revision_taxon, repeat('b', 64), v_revision_snapshot,
    'e2064000-0000-4000-8000-000000000202', v_actor, true, 6
  );

  insert into public.landing_page_input_catalog_drafts (
    base_version, target_version, catalog_json, content_fingerprint,
    created_by, updated_by
  ) values (6, 7, '{"version":7}'::jsonb, repeat('c', 64), v_actor, v_actor);

  v_zero_decision := jsonb_build_object(
    'recommendationCandidateCount', 2,
    'recommendationSelection', 'zero',
    'acceptedCandidates', '[]'::jsonb,
    'rejectedCandidateIndexes', '[0,1]'::jsonb,
    'ownCandidate', jsonb_build_object(
      'factualNeed', 'Necessidade própria sem criar field',
      'layer', 'segment'
    )
  );
  v_partial_decision := jsonb_build_object(
    'recommendationCandidateCount', 2,
    'recommendationSelection', 'partial',
    'acceptedCandidates', jsonb_build_array(jsonb_build_object(
      'index', 0,
      'layer', 'universal'
    )),
    'rejectedCandidateIndexes', '[1]'::jsonb,
    'ownCandidate', null
  );
  v_total_decision := jsonb_build_object(
    'recommendationCandidateCount', 2,
    'recommendationSelection', 'total',
    'acceptedCandidates', jsonb_build_array(
      jsonb_build_object('index', 0, 'layer', 'segment'),
      jsonb_build_object('index', 1, 'layer', 'niche')
    ),
    'rejectedCandidateIndexes', '[]'::jsonb,
    'ownCandidate', null
  );

  select * into v_result
  from public.record_business_taxon_factual_catalog_change_decision_v1(
    v_release_review.review_id,
    'e2064000-0000-4000-8000-000000000211', v_actor,
    1, repeat('a', 64), v_release_snapshot,
    1, 7, repeat('c', 64), repeat('d', 64), v_zero_decision
  );
  if v_result.review_status <> 'awaiting_catalog_publication'
     or v_result.review_revision <> 2 then
    raise exception 'E20.6.4 zero plus own decision did not persist';
  end if;
  select * into v_result
  from public.record_business_taxon_factual_catalog_change_decision_v1(
    v_revision_review.review_id,
    'e2064000-0000-4000-8000-000000000212', v_actor,
    1, repeat('b', 64), v_revision_snapshot,
    1, 7, repeat('c', 64), repeat('e', 64), v_partial_decision
  );
  if v_result.review_status <> 'awaiting_catalog_publication'
     or v_result.review_revision <> 2 then
    raise exception 'E20.6.4 partial decision did not persist';
  end if;

  if (select count(*)
      from public.landing_page_input_catalog_drafts drafts,
        lateral jsonb_object_keys(drafts.taxon_review_evidence)
      where drafts.singleton) <> 2
     or (select taxon_review_evidence -> v_release_taxon::text ->> 'draft_revision'
         from public.landing_page_input_catalog_drafts where singleton) <> '1'
     or (select is_active from public.business_taxons where id = v_release_taxon)
     or (select reviewed_input_catalog_version from public.business_taxons where id = v_release_taxon) is not null
     or not (select is_active from public.business_taxons where id = v_revision_taxon)
     or (select reviewed_input_catalog_version from public.business_taxons where id = v_revision_taxon) <> 6 then
    raise exception 'E20.6.4 decision changed publication or activation state';
  end if;

  begin
    update public.landing_page_input_catalog_drafts
    set taxon_review_evidence = '{"tampered":true}'::jsonb
    where singleton;
    raise exception 'direct factual projection mutation unexpectedly accepted';
  exception when insufficient_privilege then null;
  end;

  select * into v_result
  from public.record_business_taxon_factual_catalog_change_decision_v1(
    v_release_review.review_id,
    'e2064000-0000-4000-8000-000000000211', v_actor,
    1, repeat('a', 64), v_release_snapshot,
    1, 7, repeat('c', 64), repeat('d', 64), v_zero_decision
  );
  if v_result.review_revision <> 2
     or (select count(*) from public.business_taxon_factual_review_events
         where review_id = v_release_review.review_id) <> 3 then
    raise exception 'E20.6.4 exact decision replay duplicated effects';
  end if;

  begin
    perform *
    from public.record_business_taxon_factual_catalog_change_decision_v1(
      v_release_review.review_id,
      'e2064000-0000-4000-8000-000000000211', v_actor,
      1, repeat('a', 64), v_release_snapshot,
      1, 7, repeat('c', 64), repeat('d', 64), v_total_decision
    );
    raise exception 'divergent factual decision replay unexpectedly accepted';
  exception when invalid_parameter_value then null;
  end;

  begin
    perform *
    from public.record_business_taxon_factual_catalog_change_decision_v1(
      v_release_review.review_id,
      'e2064000-0000-4000-8000-000000000211', v_actor,
      1, repeat('a', 64),
      jsonb_set(v_release_snapshot, '{0,name}', '"identity drift"'::jsonb),
      1, 7, repeat('c', 64), repeat('d', 64), v_zero_decision
    );
    raise exception 'divergent chain snapshot replay unexpectedly accepted';
  exception when invalid_parameter_value then null;
  end;

  select * into v_result
  from public.save_business_taxon_factual_review_draft_v1(
    'e2064000-0000-4000-8000-000000000221', v_actor,
    1, '{"version":7,"edited":true}'::jsonb, repeat('f', 64)
  );
  if v_result.draft_revision <> 2
     or (select taxon_review_evidence <> '{}'::jsonb
         from public.landing_page_input_catalog_drafts where singleton)
     or (select validation_fingerprint is not null or publication_fingerprint is not null
         from public.landing_page_input_catalog_drafts where singleton)
     or (select count(*) from public.business_taxon_factual_reviews
         where id in (v_release_review.review_id, v_revision_review.review_id)
           and status = 'open' and revision = 3
           and draft_revision is null) <> 2
     or (select count(*) from public.business_taxon_factual_review_events
         where event_kind = 'draft_invalidated'
           and operation_id = 'e2064000-0000-4000-8000-000000000221') <> 2 then
    raise exception 'E20.6.4 draft edit did not globally invalidate and reopen';
  end if;

  select * into v_result
  from public.save_business_taxon_factual_review_draft_v1(
    'e2064000-0000-4000-8000-000000000221', v_actor,
    1, '{"version":7,"edited":true}'::jsonb, repeat('f', 64)
  );
  if v_result.draft_revision <> 2
     or (select count(*) from public.business_taxon_factual_review_events
         where event_kind = 'draft_invalidated'
           and operation_id = 'e2064000-0000-4000-8000-000000000221') <> 2
     or (select count(*) from public.business_taxon_factual_reviews
         where id in (v_release_review.review_id, v_revision_review.review_id)
           and status = 'open' and revision = 3) <> 2 then
    raise exception 'E20.6.4 exact draft-save replay duplicated effects';
  end if;

  begin
    perform *
    from public.save_business_taxon_factual_review_draft_v1(
      'e2064000-0000-4000-8000-000000000221', v_actor,
      1, '{"version":7,"edited":"divergent"}'::jsonb, repeat('f', 64)
    );
    raise exception 'divergent draft-save replay unexpectedly accepted';
  exception when invalid_parameter_value then null;
  end;
  if (select count(*) from public.business_taxon_factual_review_events
      where event_kind = 'draft_invalidated'
        and operation_id = 'e2064000-0000-4000-8000-000000000221') <> 2
     or (select revision from public.landing_page_input_catalog_drafts where singleton) <> 2 then
    raise exception 'divergent draft-save replay left duplicate effects';
  end if;

  perform *
  from public.record_business_taxon_factual_catalog_change_decision_v1(
    v_release_review.review_id,
    'e2064000-0000-4000-8000-000000000231', v_actor,
    3, repeat('a', 64), v_release_snapshot,
    2, 7, repeat('f', 64), repeat('d', 64), v_total_decision
  );
  perform *
  from public.record_business_taxon_factual_catalog_change_decision_v1(
    v_revision_review.review_id,
    'e2064000-0000-4000-8000-000000000232', v_actor,
    3, repeat('b', 64), v_revision_snapshot,
    2, 7, repeat('f', 64), repeat('e', 64), v_zero_decision
  );

  update public.landing_page_input_catalog_drafts
  set validation_fingerprint = repeat('f', 64),
      validation_context_fingerprint = repeat('c', 64),
      validated_at = now()
  where singleton;

  begin
    perform *
    from public.authorize_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000241', v_actor,
      2, repeat('f', 64), repeat('c', 64), array[v_release_taxon]
    );
    raise exception 'incomplete factual publication coverage unexpectedly accepted';
  exception when serialization_failure then null;
  end;
  if (select publication_fingerprint is not null
      from public.landing_page_input_catalog_drafts where singleton)
     or exists (
       select 1 from public.business_taxon_factual_review_events
       where event_kind = 'publication_authorized'
     ) then
    raise exception 'incomplete authorization was not rolled back';
  end if;

  v_uncovered_release_snapshot := jsonb_build_array(jsonb_build_object(
    'id', v_uncovered_release_taxon::text,
    'parentId', null,
    'level', 'segment',
    'name', 'E20.6.4 uncovered inactive release',
    'slug', 'e20-6-4-uncovered-inactive-release',
    'isActive', false
  ));
  begin
    insert into public.business_taxons (
      id, parent_id, level, name, slug, is_active
    ) values (
      v_uncovered_release_taxon, null, 'segment',
      'E20.6.4 uncovered inactive release',
      'e20-6-4-uncovered-inactive-release', false
    );
    select * into v_uncovered_release_review
    from public.open_business_taxon_factual_review_v1(
      v_uncovered_release_taxon, repeat('a', 64), v_uncovered_release_snapshot,
      'e2064000-0000-4000-8000-000000000244', v_actor, false, null
    );
    perform *
    from public.authorize_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000245', v_actor,
      2, repeat('f', 64), repeat('c', 64),
      array[v_release_taxon, v_revision_taxon]
    );
    raise exception 'uncovered inactive release unexpectedly ignored';
  exception when serialization_failure then null;
  end;
  if exists (
    select 1 from public.business_taxons where id = v_uncovered_release_taxon
  ) then
    raise exception 'uncovered release authorization rollback was incomplete';
  end if;

  select * into v_result
  from public.authorize_business_taxon_factual_review_publication_v1(
    'e2064000-0000-4000-8000-000000000242', v_actor,
    2, repeat('f', 64), repeat('c', 64),
    array[v_release_taxon, v_revision_taxon]
  );
  if v_result.draft_revision <> 2
     or (select publication_fingerprint
         from public.landing_page_input_catalog_drafts where singleton) <> repeat('f', 64)
     or (select count(*) from public.business_taxon_factual_review_events
         where event_kind = 'publication_authorized'
           and operation_id = 'e2064000-0000-4000-8000-000000000242') <> 2
     or exists (
       select 1 from public.business_taxons
       where id in (v_release_taxon, v_revision_taxon)
         and reviewed_input_catalog_version = 7
     ) then
    raise exception 'E20.6.4 authorization was not distinct from publication';
  end if;

  select * into v_result
  from public.authorize_business_taxon_factual_review_publication_v1(
    'e2064000-0000-4000-8000-000000000242', v_actor,
    2, repeat('f', 64), repeat('c', 64),
    array[v_release_taxon, v_revision_taxon]
  );
  if v_result.draft_revision <> 2
     or (select count(*) from public.business_taxon_factual_review_events
         where event_kind = 'publication_authorized'
           and operation_id = 'e2064000-0000-4000-8000-000000000242') <> 2 then
    raise exception 'E20.6.4 exact authorization replay duplicated effects';
  end if;

  begin
    perform *
    from public.authorize_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000242', v_actor,
      2, repeat('f', 64), repeat('c', 64), array[v_release_taxon]
    );
    raise exception 'divergent authorization replay unexpectedly accepted';
  exception when serialization_failure then null;
  end;

  begin
    perform *
    from public.authorize_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000243', v_actor,
      2, repeat('f', 64), repeat('c', 64),
      array[v_release_taxon, v_revision_taxon]
    );
    raise exception 'second publication authorization unexpectedly accepted';
  exception when serialization_failure then null;
  end;

  begin
    perform *
    from public.reconcile_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000251', v_actor,
      2, 7, repeat('e', 64), repeat('c', 64)
    );
    raise exception 'divergent deployed fingerprint unexpectedly reconciled';
  exception when serialization_failure then null;
  end;
  if not exists (select 1 from public.landing_page_input_catalog_drafts where singleton)
     or (select is_active from public.business_taxons where id = v_release_taxon)
     or (select reviewed_input_catalog_version from public.business_taxons where id = v_revision_taxon) <> 6 then
    raise exception 'failed multi-taxon reconciliation did not roll back atomically';
  end if;

  begin
    v_drift_taxon := case
      when v_release_review.review_id < v_revision_review.review_id
        then v_revision_taxon
      else v_release_taxon
    end;
    update public.business_taxons
    set reviewed_input_catalog_version = 5
    where id = v_drift_taxon;
    perform *
    from public.reconcile_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000253', v_actor,
      2, 7, repeat('f', 64), repeat('c', 64)
    );
    raise exception 'mid-set taxon drift unexpectedly reconciled';
  exception when serialization_failure then null;
  end;
  if (select is_active from public.business_taxons where id = v_release_taxon)
     or (select reviewed_input_catalog_version from public.business_taxons where id = v_release_taxon) is not null
     or (select reviewed_input_catalog_version from public.business_taxons where id = v_revision_taxon) <> 6
     or exists (
       select 1 from public.business_taxon_factual_review_events
       where operation_id = 'e2064000-0000-4000-8000-000000000253'
     ) then
    raise exception 'mid-set reconciliation failure left a partial taxon effect';
  end if;

  select * into v_result
  from public.reconcile_business_taxon_factual_review_publication_v1(
    'e2064000-0000-4000-8000-000000000252', v_actor,
    2, 7, repeat('f', 64), repeat('c', 64)
  );
  if v_result.reconciled_taxon_count <> 2
     or exists (select 1 from public.landing_page_input_catalog_drafts where singleton)
     or not (select is_active from public.business_taxons where id = v_release_taxon)
     or not (select is_active from public.business_taxons where id = v_revision_taxon)
     or (select count(*) from public.business_taxons
         where id in (v_release_taxon, v_revision_taxon)
           and reviewed_input_catalog_version = 7) <> 2
     or (select count(*) from public.business_taxon_factual_reviews
         where id in (v_release_review.review_id, v_revision_review.review_id)
           and status = 'closed_published') <> 2 then
    raise exception 'E20.6.4 atomic multi-taxon reconciliation failed';
  end if;

  select * into v_result
  from public.reconcile_business_taxon_factual_review_publication_v1(
    'e2064000-0000-4000-8000-000000000252', v_actor,
    2, 7, repeat('f', 64), repeat('c', 64)
  );
  if v_result.reconciled_taxon_count <> 2
     or (select count(*) from public.business_taxon_factual_review_events
         where operation_id = 'e2064000-0000-4000-8000-000000000252') <> 2 then
    raise exception 'E20.6.4 reconciliation replay duplicated effects';
  end if;

  begin
    perform *
    from public.reconcile_business_taxon_factual_review_publication_v1(
      'e2064000-0000-4000-8000-000000000252', v_actor,
      2, 8, repeat('f', 64), repeat('c', 64)
    );
    raise exception 'divergent reconciliation replay unexpectedly accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;

rollback;
