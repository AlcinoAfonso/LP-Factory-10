begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e2063000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'e20.6.3-test@example.com', now(), now());

do $$
declare
  v_review_id uuid;
  v_final record;
  v_taxonomy record;
  v_reconcile record;
  v_publication_context jsonb;
  v_output jsonb := jsonb_build_object(
    'schemaVersion', 2,
    'status', 'sufficient',
    'mode', 'systematic',
    'sourceStrategy', 'e20_5',
    'sourceState', 'e20_5_available',
    'summary', 'Cobertura suficiente.',
    'summarySourceUrls', '[]'::jsonb,
    'candidates', jsonb_build_array(jsonb_build_object(
      'origin', 'evaluation', 'conclusion', 'possible_new_field',
      'factualNeed', 'Necessidade factual', 'evidence', 'Evidência factual',
      'sourceUrls', '[]'::jsonb
    )),
    'followUpQuestion', null
  );
begin
  if to_regclass('public.business_taxon_factual_reviews') is null
     or to_regclass('public.business_taxon_factual_review_events') is not null
     or to_regclass('public.business_taxon_input_catalog_review_invalidations') is not null
     or not (select relrowsecurity from pg_class where oid = 'public.business_taxon_factual_reviews'::regclass)
     or exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'business_taxon_factual_reviews') then
    raise exception 'single factual-review residence or service-only RLS drifted';
  end if;
  if has_table_privilege('anon', 'public.business_taxon_factual_reviews', 'SELECT')
     or has_table_privilege('authenticated', 'public.business_taxon_factual_reviews', 'SELECT')
     or not has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'SELECT,INSERT,UPDATE')
     or has_table_privilege('service_role', 'public.business_taxon_factual_reviews', 'DELETE') then
    raise exception 'factual-review ACL drifted';
  end if;
  if not has_function_privilege('service_role',
       'public.finalize_business_taxon_factual_review_v1(uuid,bigint,uuid,integer,jsonb,bigint,text,text)', 'EXECUTE')
     or not has_function_privilege('service_role',
       'public.update_business_taxon_with_factual_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,uuid,boolean)', 'EXECUTE')
     or not has_function_privilege('service_role',
       'public.reconcile_business_taxon_factual_review_publication_v1(uuid,bigint,integer,text,text)', 'EXECUTE') then
    raise exception 'focused factual-review RPC ACL drifted';
  end if;
  if has_function_privilege('anon', 'public.guard_open_business_taxon_factual_review_v1()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.guard_open_business_taxon_factual_review_v1()', 'EXECUTE')
     or has_function_privilege('anon', 'public.guard_closed_business_taxon_factual_review_v1()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.guard_closed_business_taxon_factual_review_v1()', 'EXECUTE')
     or has_function_privilege('anon', 'public.guard_business_taxon_factual_research_selection_v1()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.guard_business_taxon_factual_research_selection_v1()', 'EXECUTE') then
    raise exception 'factual-review trigger function ACL drifted';
  end if;
  if (select count(*) from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname in (
          'finalize_business_taxon_factual_review_v1',
          'update_business_taxon_with_factual_review_invalidation_v1',
          'reconcile_business_taxon_factual_review_publication_v1'
        )) <> 3 then
    raise exception 'factual-review RPC count drifted';
  end if;

  insert into public.business_taxons
    (id, parent_id, level, name, slug, is_active, reviewed_input_catalog_version)
  values
    ('e2063000-0000-4000-8000-000000000010', null, 'segment', 'Raiz', 'raiz-e206', true, 5),
    ('e2063000-0000-4000-8000-000000000011', 'e2063000-0000-4000-8000-000000000010', 'niche', 'Filho', 'filho-e206', true, 5),
    ('e2063000-0000-4000-8000-000000000012', 'e2063000-0000-4000-8000-000000000011', 'ultra_niche', 'Neto', 'neto-e206', true, 5);

  begin
    insert into public.business_taxon_factual_reviews
      (taxon_id, kind, baseline_is_active, baseline_reviewed_input_catalog_version,
       context_fingerprint, chain_snapshot, opened_by)
    values (
      'e2063000-0000-4000-8000-000000000010', 'revision', true, 5, repeat('9', 64),
      jsonb_build_array(jsonb_build_object(
        'id', 'e2063000-0000-4000-8000-000000000010', 'name', 'Snapshot obsoleto',
        'slug', 'raiz-e206', 'level', 'segment', 'isActive', true, 'parentId', null
      )),
      'e2063000-0000-4000-8000-000000000001'
    );
    raise exception 'stale factual-review snapshot unexpectedly opened';
  exception when serialization_failure then null;
  end;

  insert into public.business_taxon_factual_reviews
    (taxon_id, kind, baseline_is_active, baseline_reviewed_input_catalog_version,
     context_fingerprint, chain_snapshot, opened_by)
  select child.id, 'revision', true, 5, repeat('a', 64),
    case child.level
      when 'niche' then jsonb_build_array(
        jsonb_build_object('id', root.id, 'name', root.name, 'slug', root.slug,
          'level', root.level, 'isActive', root.is_active, 'parentId', root.parent_id),
        jsonb_build_object('id', child.id, 'name', child.name, 'slug', child.slug,
          'level', child.level, 'isActive', child.is_active, 'parentId', child.parent_id)
      )
      else jsonb_build_array(
        jsonb_build_object('id', root.id, 'name', root.name, 'slug', root.slug,
          'level', root.level, 'isActive', root.is_active, 'parentId', root.parent_id),
        jsonb_build_object('id', parent.id, 'name', parent.name, 'slug', parent.slug,
          'level', parent.level, 'isActive', parent.is_active, 'parentId', parent.parent_id),
        jsonb_build_object('id', child.id, 'name', child.name, 'slug', child.slug,
          'level', child.level, 'isActive', child.is_active, 'parentId', child.parent_id)
      )
    end,
    'e2063000-0000-4000-8000-000000000001'
  from public.business_taxons child
  join public.business_taxons root on root.id = 'e2063000-0000-4000-8000-000000000010'
  left join public.business_taxons parent on parent.id = child.parent_id
  where child.id in ('e2063000-0000-4000-8000-000000000011', 'e2063000-0000-4000-8000-000000000012');

  begin
    perform * from public.update_business_taxon_with_factual_review_invalidation_v1(
      'e2063000-0000-4000-8000-000000000010', 'Raiz', 'raiz-e206', true,
      'Raiz concorrente', 'raiz-e206', true, 'e2063000-0000-4000-8000-000000000001', false
    );
    raise exception 'subtree review state was invalidated without under-lock authorization';
  exception when serialization_failure then null;
  end;
  if (select name from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010') <> 'Raiz'
     or (select count(*) from public.business_taxon_factual_reviews
         where taxon_id in ('e2063000-0000-4000-8000-000000000011', 'e2063000-0000-4000-8000-000000000012')
           and status = 'open') <> 2
     or (select count(*) from public.business_taxons
         where id in ('e2063000-0000-4000-8000-000000000010', 'e2063000-0000-4000-8000-000000000011', 'e2063000-0000-4000-8000-000000000012')
           and reviewed_input_catalog_version = 5) <> 3 then
    raise exception 'authorization conflict did not preserve taxonomy review state';
  end if;

  select * into v_taxonomy
  from public.update_business_taxon_with_factual_review_invalidation_v1(
    'e2063000-0000-4000-8000-000000000010', 'Raiz', 'raiz-e206', true,
    'Raiz', 'raiz-e206', false, 'e2063000-0000-4000-8000-000000000001', true
  );
  if v_taxonomy.invalidated_review_count <> 2 or v_taxonomy.cleared_marker_count <> 3
     or (select count(*) from public.business_taxon_factual_reviews
         where taxon_id in ('e2063000-0000-4000-8000-000000000011', 'e2063000-0000-4000-8000-000000000012')
           and status = 'closed' and outcome = 'invalidated') <> 2 then
    raise exception 'ancestor deactivation did not close subtree reviews and clear markers atomically';
  end if;

  begin
    update public.business_taxon_factual_reviews set revision = revision + 1
    where taxon_id = 'e2063000-0000-4000-8000-000000000011';
    raise exception 'closed review unexpectedly mutable';
  exception when insufficient_privilege then null;
  end;

  insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
  values ('e2063000-0000-4000-8000-000000000020', null, 'segment', 'Draft', 'draft-e206', true);
  insert into public.landing_page_input_catalog_drafts
    (singleton, base_version, target_version, catalog_json, content_fingerprint, revision,
     validation_fingerprint, validation_context_fingerprint, validated_at,
     taxon_review_evidence, created_by, updated_by)
  values (true, 5, 6, '{}'::jsonb, repeat('b', 64), 1,
    repeat('b', 64), repeat('c', 64), now(),
    '{}'::jsonb, 'e2063000-0000-4000-8000-000000000001', 'e2063000-0000-4000-8000-000000000001');
  insert into public.business_taxon_factual_reviews
    (taxon_id, kind, baseline_is_active, context_fingerprint, chain_snapshot,
     evaluation_mode, evaluation_source, evaluation_input_catalog_version,
     evaluation_draft_revision, evaluation_context_fingerprint, evaluation_output,
     evaluation_by, evaluated_at, revision, opened_by)
  values ('e2063000-0000-4000-8000-000000000020', 'revision', true, repeat('d', 64),
    jsonb_build_array(jsonb_build_object(
      'id', 'e2063000-0000-4000-8000-000000000020', 'name', 'Draft', 'slug', 'draft-e206',
      'level', 'segment', 'isActive', true, 'parentId', null
    )),
    'systematic', 'draft', 6, 1, repeat('e', 64), v_output,
    'e2063000-0000-4000-8000-000000000001', now(), 2,
    'e2063000-0000-4000-8000-000000000001')
  returning id into v_review_id;

  begin
    perform * from public.finalize_business_taxon_factual_review_v1(
      v_review_id, 2, 'e2063000-0000-4000-8000-000000000001', 6,
      jsonb_build_object(
        'decisionKind', 'catalog_change', 'recommendationCandidateCount', 1,
        'recommendationSelection', 'zero', 'acceptedCandidates', '[]'::jsonb,
        'rejectedCandidateIndexes', '[0]'::jsonb,
        'ownCandidate', jsonb_build_object(
          'factualNeed', 'Candidato próprio', 'layer', 'segment', 'origin', 'human-added'
        )
      ), 1, repeat('b', 64), repeat('e', 64)
    );
    if (select decision_payload -> 'ownCandidate' ->> 'origin'
        from public.business_taxon_factual_reviews where id = v_review_id) <> 'human-added' then
      raise exception 'human-added origin was not persisted exactly';
    end if;
    raise exception using errcode = 'ZX001', message = 'rollback_human_added_probe';
  exception when sqlstate 'ZX001' then null;
  end;

  begin
    perform * from public.finalize_business_taxon_factual_review_v1(
      v_review_id, 2, 'e2063000-0000-4000-8000-000000000001', 6,
      jsonb_build_object(
        'decisionKind', 'catalog_change', 'recommendationCandidateCount', 1,
        'recommendationSelection', 'zero', 'acceptedCandidates', '[]'::jsonb,
        'rejectedCandidateIndexes', '[0]'::jsonb,
        'ownCandidate', jsonb_build_object(
          'factualNeed', 'Candidato próprio', 'layer', 'segment', 'origin', 'human'
        )
      ), 1, repeat('b', 64), repeat('e', 64)
    );
    raise exception 'legacy human origin unexpectedly persisted';
  exception when invalid_parameter_value then null;
  end;

  begin
    update public.business_taxons set selected_end_customer_research_version = 1
    where id = 'e2063000-0000-4000-8000-000000000020';
    raise exception 'research selection changed while factual review was open';
  exception when serialization_failure then null;
  end;
  if (select selected_end_customer_research_version from public.business_taxons
      where id = 'e2063000-0000-4000-8000-000000000020') is not null
     or (select status from public.business_taxon_factual_reviews where id = v_review_id) <> 'open'
     or (select taxon_review_evidence from public.landing_page_input_catalog_drafts where singleton) <> '{}'::jsonb then
    raise exception 'research-selection conflict did not preserve the open review and draft evidence';
  end if;
  update public.business_taxons set name = 'Filho alterado durante revisão'
  where id = 'e2063000-0000-4000-8000-000000000020';
  begin
    perform * from public.finalize_business_taxon_factual_review_v1(
      v_review_id, 2, 'e2063000-0000-4000-8000-000000000001', 6,
      jsonb_build_object(
        'decisionKind', 'no_change', 'recommendationCandidateCount', 1,
        'recommendationSelection', 'zero', 'acceptedCandidates', '[]'::jsonb,
        'rejectedCandidateIndexes', '[0]'::jsonb, 'ownCandidate', null
      ), 1, repeat('b', 64), repeat('e', 64)
    );
    raise exception 'stale factual-review decision unexpectedly finalized';
  exception when serialization_failure then null;
  end;
  if (select status from public.business_taxon_factual_reviews where id = v_review_id) <> 'open'
     or (select taxon_review_evidence from public.landing_page_input_catalog_drafts where singleton) <> '{}'::jsonb then
    raise exception 'stale finalization did not roll back without closing or recording evidence';
  end if;
  update public.business_taxons set name = 'Filho'
  where id = 'e2063000-0000-4000-8000-000000000020';

  select * into v_final from public.finalize_business_taxon_factual_review_v1(
    v_review_id, 2, 'e2063000-0000-4000-8000-000000000001', 6,
    jsonb_build_object(
      'decisionKind', 'no_change', 'recommendationCandidateCount', 1,
      'recommendationSelection', 'zero', 'acceptedCandidates', '[]'::jsonb,
      'rejectedCandidateIndexes', '[0]'::jsonb, 'ownCandidate', null
    ), 1, repeat('b', 64), repeat('e', 64)
  );
  if v_final.review_status <> 'closed' or v_final.decision_kind <> 'no_change'
     or (select taxon_review_evidence -> 'e2063000-0000-4000-8000-000000000020' ->> 'review_id'
         from public.landing_page_input_catalog_drafts where singleton) <> v_review_id::text then
    raise exception 'draft no_change did not preserve exact evidence';
  end if;

  select jsonb_build_object(
    'taxons', coalesce((select jsonb_agg(jsonb_build_object(
      'identity', jsonb_build_object(
        'id', taxons.id::text, 'parentId', taxons.parent_id::text, 'level', taxons.level,
        'name', taxons.name, 'slug', taxons.slug, 'isActive', taxons.is_active
      ),
      'reviewedVersion', taxons.reviewed_input_catalog_version,
      'selectedResearchVersion', taxons.selected_end_customer_research_version
    ) order by taxons.id) from public.business_taxons taxons
      where taxons.level in ('segment', 'niche', 'ultra_niche')), '[]'::jsonb),
    'unclosedReleaseTaxonIds', coalesce((select jsonb_agg(reviews.taxon_id::text order by reviews.taxon_id)
      from public.business_taxon_factual_reviews reviews
      where reviews.kind = 'release' and reviews.status = 'open'), '[]'::jsonb)
  ) into v_publication_context;
  update public.landing_page_input_catalog_drafts
  set publication_fingerprint = repeat('b', 64),
      publication_context_fingerprint = repeat('c', 64),
      publication_context_snapshot = v_publication_context,
      publication_required_taxon_ids = array['e2063000-0000-4000-8000-000000000020'::uuid],
      publication_prepared_at = now()
  where singleton and revision = 1;

  begin
    insert into public.business_taxon_factual_reviews
      (taxon_id, kind, baseline_is_active, context_fingerprint, chain_snapshot, opened_by)
    values (
      'e2063000-0000-4000-8000-000000000020', 'revision', true, repeat('4', 64),
      jsonb_build_array(jsonb_build_object(
        'id', 'e2063000-0000-4000-8000-000000000020', 'name', 'Draft', 'slug', 'draft-e206',
        'level', 'segment', 'isActive', true, 'parentId', null
      )),
      'e2063000-0000-4000-8000-000000000001'
    );
    perform * from public.reconcile_business_taxon_factual_review_publication_v1(
      'e2063000-0000-4000-8000-000000000001', 1, 6, repeat('b', 64), repeat('c', 64)
    );
    raise exception 'publication reconciled stale evidence while a newer review was open';
  exception when serialization_failure then null;
  end;
  if not exists (select 1 from public.landing_page_input_catalog_drafts where singleton)
     or (select reviewed_input_catalog_version from public.business_taxons
         where id = 'e2063000-0000-4000-8000-000000000020') is not null
     or exists (select 1 from public.business_taxon_factual_reviews
         where taxon_id = 'e2063000-0000-4000-8000-000000000020' and status = 'open') then
    raise exception 'open-review reconciliation conflict did not preserve draft and marker state';
  end if;

  select * into v_reconcile from public.reconcile_business_taxon_factual_review_publication_v1(
    'e2063000-0000-4000-8000-000000000001', 1, 6, repeat('b', 64), repeat('c', 64)
  );
  if v_reconcile.reconciled_taxon_count <> 1
     or exists (select 1 from public.landing_page_input_catalog_drafts where singleton)
     or (select reviewed_input_catalog_version from public.business_taxons
         where id = 'e2063000-0000-4000-8000-000000000020') <> 6 then
    raise exception 'publication reconciliation did not consume exact closed evidence';
  end if;

  insert into public.landing_page_input_catalog_drafts
    (singleton, base_version, target_version, catalog_json, content_fingerprint, revision,
     validation_fingerprint, validation_context_fingerprint, validated_at,
     taxon_review_evidence, created_by, updated_by)
  values (true, 6, 7, '{}'::jsonb, repeat('f', 64), 2,
    repeat('f', 64), repeat('0', 64), now(),
    '{}'::jsonb, 'e2063000-0000-4000-8000-000000000001', 'e2063000-0000-4000-8000-000000000001');
  insert into public.business_taxon_factual_reviews
    (taxon_id, kind, baseline_is_active, baseline_reviewed_input_catalog_version,
     context_fingerprint, chain_snapshot, evaluation_mode, evaluation_source,
     evaluation_input_catalog_version, evaluation_draft_revision,
     evaluation_context_fingerprint, evaluation_output, evaluation_by,
     evaluated_at, revision, opened_by)
  values ('e2063000-0000-4000-8000-000000000020', 'revision', true, 6, repeat('2', 64),
    jsonb_build_array(jsonb_build_object(
      'id', 'e2063000-0000-4000-8000-000000000020', 'name', 'Draft', 'slug', 'draft-e206',
      'level', 'segment', 'isActive', true, 'parentId', null
    )),
    'systematic', 'draft', 7, 2, repeat('3', 64), v_output,
    'e2063000-0000-4000-8000-000000000001', now(), 2,
    'e2063000-0000-4000-8000-000000000001')
  returning id into v_review_id;
  perform * from public.finalize_business_taxon_factual_review_v1(
    v_review_id, 2, 'e2063000-0000-4000-8000-000000000001', 7,
    jsonb_build_object(
      'decisionKind', 'no_change', 'recommendationCandidateCount', 1,
      'recommendationSelection', 'zero', 'acceptedCandidates', '[]'::jsonb,
      'rejectedCandidateIndexes', '[0]'::jsonb, 'ownCandidate', null
    ), 2, repeat('f', 64), repeat('3', 64)
  );
  select jsonb_build_object(
    'taxons', coalesce((select jsonb_agg(jsonb_build_object(
      'identity', jsonb_build_object(
        'id', taxons.id::text, 'parentId', taxons.parent_id::text, 'level', taxons.level,
        'name', taxons.name, 'slug', taxons.slug, 'isActive', taxons.is_active
      ),
      'reviewedVersion', taxons.reviewed_input_catalog_version,
      'selectedResearchVersion', taxons.selected_end_customer_research_version
    ) order by taxons.id) from public.business_taxons taxons
      where taxons.level in ('segment', 'niche', 'ultra_niche')), '[]'::jsonb),
    'unclosedReleaseTaxonIds', coalesce((select jsonb_agg(reviews.taxon_id::text order by reviews.taxon_id)
      from public.business_taxon_factual_reviews reviews
      where reviews.kind = 'release' and reviews.status = 'open'), '[]'::jsonb)
  ) into v_publication_context;
  update public.landing_page_input_catalog_drafts
  set publication_fingerprint = repeat('f', 64),
      publication_context_fingerprint = repeat('0', 64),
      publication_context_snapshot = v_publication_context,
      publication_required_taxon_ids = array['e2063000-0000-4000-8000-000000000020'::uuid],
      publication_prepared_at = now()
  where singleton and revision = 2;
  insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
  values ('e2063000-0000-4000-8000-000000000021', null, 'segment', 'Novo pós-prepare', 'novo-pos-prepare-e206', true);
  insert into public.business_taxon_aliases (taxon_id, alias_text, is_active)
  values ('e2063000-0000-4000-8000-000000000021', 'Novo pós-prepare E20.6', true);
  begin
    perform * from public.reconcile_business_taxon_factual_review_publication_v1(
      'e2063000-0000-4000-8000-000000000001', 2, 7, repeat('f', 64), repeat('0', 64)
    );
    raise exception 'stale publication evidence unexpectedly reconciled';
  exception when serialization_failure then null;
  end;
  if not exists (select 1 from public.landing_page_input_catalog_drafts where singleton and revision = 2)
     or (select reviewed_input_catalog_version from public.business_taxons
         where id = 'e2063000-0000-4000-8000-000000000020') <> 6 then
    raise exception 'stale reconciliation did not roll back without consuming the draft';
  end if;
  delete from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000021';
  if exists (select 1 from public.business_taxon_aliases where taxon_id = 'e2063000-0000-4000-8000-000000000021') then
    raise exception 'taxon delete did not cascade aliases in the same statement';
  end if;
  delete from public.landing_page_input_catalog_drafts where singleton and revision = 2;

  insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
  values ('e2063000-0000-4000-8000-000000000030', null, 'segment', 'Release', 'release-e206', false);
  insert into public.business_taxon_factual_reviews
    (taxon_id, kind, baseline_is_active, context_fingerprint, chain_snapshot, opened_by)
  values ('e2063000-0000-4000-8000-000000000030', 'release', false, repeat('1', 64),
    jsonb_build_array(jsonb_build_object(
      'id', 'e2063000-0000-4000-8000-000000000030', 'name', 'Release', 'slug', 'release-e206',
      'level', 'segment', 'isActive', false, 'parentId', null
    )),
    'e2063000-0000-4000-8000-000000000001') returning id into v_review_id;
  perform * from public.finalize_business_taxon_factual_review_v1(
    v_review_id, 1, 'e2063000-0000-4000-8000-000000000001', 5,
    jsonb_build_object(
      'decisionKind', 'no_change', 'recommendationCandidateCount', 0,
      'recommendationSelection', 'zero', 'acceptedCandidates', '[]'::jsonb,
      'rejectedCandidateIndexes', '[]'::jsonb, 'ownCandidate', null
    ), null, null, null
  );
  if not (select is_active from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000030')
     or (select reviewed_input_catalog_version from public.business_taxons
         where id = 'e2063000-0000-4000-8000-000000000030') <> 5 then
    raise exception 'human no-AI release did not activate and mark the taxon';
  end if;
  insert into public.business_taxon_aliases (taxon_id, alias_text, is_active)
  values ('e2063000-0000-4000-8000-000000000030', 'Release E20.6', true);
  begin
    delete from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000030';
    raise exception 'taxon with factual history unexpectedly deleted';
  exception when foreign_key_violation then null;
  end;
  if not exists (
    select 1 from public.business_taxon_aliases
    where taxon_id = 'e2063000-0000-4000-8000-000000000030'
  ) then
    raise exception 'failed factual-history delete did not preserve aliases atomically';
  end if;
end;
$$;

rollback;
