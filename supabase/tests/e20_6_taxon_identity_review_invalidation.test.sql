begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2066000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e20.6-invalidation-test@example.com',
  now(),
  now()
);

do $$
declare
  v_result record;
  v_snapshot jsonb;
begin
  if to_regclass('public.business_taxon_input_catalog_review_invalidations') is null
     or not (select relrowsecurity from pg_class where oid = 'public.business_taxon_input_catalog_review_invalidations'::regclass)
     or exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'business_taxon_input_catalog_review_invalidations'
     )
     or has_table_privilege('anon', 'public.business_taxon_input_catalog_review_invalidations', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('authenticated', 'public.business_taxon_input_catalog_review_invalidations', 'SELECT,INSERT,UPDATE,DELETE')
     or not has_table_privilege('service_role', 'public.business_taxon_input_catalog_review_invalidations', 'SELECT,INSERT')
     or has_table_privilege('service_role', 'public.business_taxon_input_catalog_review_invalidations', 'UPDATE,DELETE,TRUNCATE')
     or has_function_privilege(
       'anon',
       'public.update_business_taxon_identity_with_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,jsonb,uuid,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.update_business_taxon_identity_with_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,jsonb,uuid,uuid)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public.update_business_taxon_identity_with_review_invalidation_v1(uuid,text,text,boolean,text,text,boolean,jsonb,uuid,uuid)',
       'EXECUTE'
     ) then
    raise exception 'E20.6 identity invalidation service-only contract drifted';
  end if;

  insert into public.business_taxons (
    id, parent_id, level, name, slug, is_active, reviewed_input_catalog_version
  ) values
    (
      'e2066000-0000-4000-8000-000000000010', null, 'segment',
      'E20.6 reviewed root', 'e20-6-reviewed-root', true, 6
    ),
    (
      'e2066000-0000-4000-8000-000000000011',
      'e2066000-0000-4000-8000-000000000010', 'niche',
      'E20.6 reviewed child', 'e20-6-reviewed-child', true, 6
    );

  v_snapshot := jsonb_build_array(
    jsonb_build_object(
      'id', 'e2066000-0000-4000-8000-000000000010',
      'parentId', null,
      'level', 'segment',
      'name', 'E20.6 reviewed root',
      'slug', 'e20-6-reviewed-root',
      'isActive', true
    ),
    jsonb_build_object(
      'id', 'e2066000-0000-4000-8000-000000000011',
      'parentId', 'e2066000-0000-4000-8000-000000000010',
      'level', 'niche',
      'name', 'E20.6 reviewed child',
      'slug', 'e20-6-reviewed-child',
      'isActive', true
    )
  );

  begin
    perform *
    from public.update_business_taxon_identity_with_review_invalidation_v1(
      'e2066000-0000-4000-8000-000000000010',
      'E20.6 reviewed root', 'e20-6-reviewed-root', true,
      'E20.6 renamed root', 'e20-6-renamed-root', true,
      '[{"taxonId":"e2066000-0000-4000-8000-000000000010","reviewedVersion":5},{"taxonId":"e2066000-0000-4000-8000-000000000011","reviewedVersion":6}]'::jsonb,
      'e2066000-0000-4000-8000-000000000029',
      'e2066000-0000-4000-8000-000000000001'
    );
    raise exception 'identity mutation with stale reviewed coverage unexpectedly succeeded';
  exception when serialization_failure then null;
  end;

  insert into public.business_taxon_factual_reviews (
    id, taxon_id, kind, status, baseline_is_active,
    baseline_reviewed_input_catalog_version, context_fingerprint, chain_snapshot,
    opened_operation_id, opened_by
  ) values (
    'e2066000-0000-4000-8000-000000000020',
    'e2066000-0000-4000-8000-000000000011',
    'revision', 'open', true, 6, repeat('a', 64), v_snapshot,
    'e2066000-0000-4000-8000-000000000021',
    'e2066000-0000-4000-8000-000000000001'
  );

  begin
    perform *
    from public.update_business_taxon_identity_with_review_invalidation_v1(
      'e2066000-0000-4000-8000-000000000010',
      'E20.6 reviewed root', 'e20-6-reviewed-root', true,
      'E20.6 renamed root', 'e20-6-renamed-root', true,
      '[{"taxonId":"e2066000-0000-4000-8000-000000000010","reviewedVersion":6},{"taxonId":"e2066000-0000-4000-8000-000000000011","reviewedVersion":6}]'::jsonb,
      'e2066000-0000-4000-8000-000000000030',
      'e2066000-0000-4000-8000-000000000001'
    );
    raise exception 'identity mutation with an unclosed factual review unexpectedly succeeded';
  exception when serialization_failure then null;
  end;

  if (select name from public.business_taxons where id = 'e2066000-0000-4000-8000-000000000010') <> 'E20.6 reviewed root'
     or (select count(*) from public.business_taxon_input_catalog_review_invalidations) <> 0 then
    raise exception 'blocked identity mutation changed state';
  end if;

  update public.business_taxon_factual_reviews
  set status = 'closed_without_change',
      closed_by = 'e2066000-0000-4000-8000-000000000001',
      closed_at = now(),
      revision = revision + 1
  where id = 'e2066000-0000-4000-8000-000000000020';

  select * into v_result
  from public.update_business_taxon_identity_with_review_invalidation_v1(
    'e2066000-0000-4000-8000-000000000010',
    'E20.6 reviewed root', 'e20-6-reviewed-root', true,
    'E20.6 renamed root', 'e20-6-renamed-root', true,
    '[{"taxonId":"e2066000-0000-4000-8000-000000000010","reviewedVersion":6},{"taxonId":"e2066000-0000-4000-8000-000000000011","reviewedVersion":6}]'::jsonb,
    'e2066000-0000-4000-8000-000000000030',
    'e2066000-0000-4000-8000-000000000001'
  );

  if v_result.taxon_id <> 'e2066000-0000-4000-8000-000000000010'
     or v_result.invalidated_taxon_ids <> array[
       'e2066000-0000-4000-8000-000000000010'::uuid,
       'e2066000-0000-4000-8000-000000000011'::uuid
     ]
     or (select name from public.business_taxons where id = 'e2066000-0000-4000-8000-000000000010') <> 'E20.6 renamed root'
     or (select slug from public.business_taxons where id = 'e2066000-0000-4000-8000-000000000010') <> 'e20-6-renamed-root'
     or exists (
       select 1 from public.business_taxons
       where id in (
         'e2066000-0000-4000-8000-000000000010',
         'e2066000-0000-4000-8000-000000000011'
       ) and reviewed_input_catalog_version is not null
     )
     or (select count(*) from public.business_taxon_input_catalog_review_invalidations) <> 2 then
    raise exception 'atomic reviewed-coverage invalidation failed';
  end if;

  select * into v_result
  from public.update_business_taxon_identity_with_review_invalidation_v1(
    'e2066000-0000-4000-8000-000000000010',
    'E20.6 reviewed root', 'e20-6-reviewed-root', true,
    'E20.6 renamed root', 'e20-6-renamed-root', true,
    '[{"taxonId":"e2066000-0000-4000-8000-000000000010","reviewedVersion":6},{"taxonId":"e2066000-0000-4000-8000-000000000011","reviewedVersion":6}]'::jsonb,
    'e2066000-0000-4000-8000-000000000030',
    'e2066000-0000-4000-8000-000000000001'
  );
  if (select count(*) from public.business_taxon_input_catalog_review_invalidations) <> 2 then
    raise exception 'idempotent invalidation replay duplicated audit receipts';
  end if;

  begin
    update public.business_taxon_input_catalog_review_invalidations
    set root_name_after = 'forbidden';
    raise exception 'append-only invalidation receipt accepted update';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
