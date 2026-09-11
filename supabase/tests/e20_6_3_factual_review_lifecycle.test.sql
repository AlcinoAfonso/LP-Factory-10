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
       'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public.close_business_taxon_factual_review_without_change_v1(uuid,uuid,uuid,bigint,integer,text,text,jsonb)',
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
    repeat('c', 64), repeat('d', 64), v_revision_snapshot
  );
  if v_retry.review_status <> 'closed_without_change'
     or v_retry.review_revision <> 2
     or not (select is_active from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010')
     or (select reviewed_input_catalog_version from public.business_taxons where id = 'e2063000-0000-4000-8000-000000000010') <> 6 then
    raise exception 'active no-change revision failed';
  end if;

  begin
    update public.business_taxon_factual_review_events
    set payload_json = '{"tampered":true}'::jsonb
    where review_id = v_open.review_id;
    raise exception 'append-only factual event unexpectedly updated';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
