begin;

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values ('12040000-0000-4000-8000-000000000001', null, 'segment', 'E12.4.3 test segment', 'e12-4-3-test-segment', true);

insert into public.landing_page_generation_profiles (id, owner_taxon_id, version, status, generation_guidance)
values ('12040000-0000-4000-8000-000000000010', '12040000-0000-4000-8000-000000000001', 1, 'active', 'Previous active guidance');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"12040000-0000-4000-8000-000000000097","role":"authenticated"}',
  true
);

do $$
begin
  begin
    perform public.save_landing_page_generation_profile_draft(
      '12040000-0000-4000-8000-000000000001',
      null,
      null,
      'Unauthorized draft',
      '[]'::jsonb,
      'manual',
      null,
      null
    );
    raise exception 'expected ordinary authenticated save rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_UNAUTHORIZED%' then raise; end if;
  end;

  begin
    perform public.activate_landing_page_generation_profile(
      '12040000-0000-4000-8000-000000000010',
      now()
    );
    raise exception 'expected ordinary authenticated activation rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_UNAUTHORIZED%' then raise; end if;
  end;

  begin
    perform public.archive_landing_page_generation_profile(
      '12040000-0000-4000-8000-000000000010',
      now()
    );
    raise exception 'expected ordinary authenticated archive rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_UNAUTHORIZED%' then raise; end if;
  end;

  begin
    perform public.get_landing_page_generation_profile_lifecycle_status();
    raise exception 'expected ordinary authenticated readiness rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_UNAUTHORIZED%' then raise; end if;
  end;
end;
$$;

reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ce899cd2-5360-478e-817e-ee3690aabecd","role":"authenticated","platform_admin":true}',
  true
);

do $$
declare
  v_ready boolean;
  v_created record;
  v_ai_updated record;
  v_uncorrelated record;
  v_activated record;
  v_archived_active record;
  v_draft_to_archive record;
  v_archived_draft record;
begin
  select status.ready into v_ready
  from public.get_landing_page_generation_profile_lifecycle_status() status;
  if not coalesce(v_ready, false) then
    raise exception 'lifecycle readiness should be true after the migration';
  end if;

  select * into v_created
  from public.save_landing_page_generation_profile_draft(
    '12040000-0000-4000-8000-000000000001',
    null,
    null,
    'Draft guidance',
    '[{"module_key":"hero","module_version":1,"variant_key":null,"variant_version":null,"priority":"P1","recommended_order":10,"item_guidance":null}]'::jsonb,
    'manual',
    null,
    null
  );

  select * into v_ai_updated
  from public.save_landing_page_generation_profile_draft(
    '12040000-0000-4000-8000-000000000001',
    v_created.profile_id,
    v_created.updated_at,
    'AI-assisted draft guidance',
    '[{"module_key":"hero","module_version":1,"variant_key":"hero.form","variant_version":1,"priority":"P1","recommended_order":10,"item_guidance":"Specific guidance"}]'::jsonb,
    'ai',
    '12040000-0000-4000-8000-000000000098',
    'adjusted'
  );

  select * into v_uncorrelated
  from public.save_landing_page_generation_profile_draft(
    '12040000-0000-4000-8000-000000000001',
    v_ai_updated.profile_id,
    v_ai_updated.updated_at,
    'AI draft with unavailable correlation',
    '[{"module_key":"hero","module_version":1,"variant_key":null,"variant_version":null,"priority":"P1","recommended_order":10,"item_guidance":null}]'::jsonb,
    'ai',
    null,
    null
  );

  begin
    perform public.save_landing_page_generation_profile_draft(
      '12040000-0000-4000-8000-000000000001',
      v_created.profile_id,
      v_created.updated_at - interval '1 second',
      'Stale write',
      '[]'::jsonb,
      'manual',
      null,
      null
    );
    raise exception 'expected stale snapshot rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_STALE_SNAPSHOT%' then raise; end if;
  end;

  begin
    perform public.save_landing_page_generation_profile_draft(
      '12040000-0000-4000-8000-000000000001',
      '12040000-0000-4000-8000-000000000010',
      v_uncorrelated.updated_at,
      'Forbidden active edit',
      '[]'::jsonb,
      'manual',
      null,
      null
    );
    raise exception 'expected active edit rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_INVALID_STATE%' then raise; end if;
  end;

  begin
    perform public.activate_landing_page_generation_profile(
      v_uncorrelated.profile_id,
      v_uncorrelated.updated_at - interval '1 second'
    );
    raise exception 'expected stale activation rejection';
  exception when others then
    if sqlerrm not like '%E12_4_3_STALE_SNAPSHOT%' then raise; end if;
  end;
  execute 'reset role';
  if (select status from public.landing_page_generation_profiles where id = '12040000-0000-4000-8000-000000000010') <> 'active'
    or (select status from public.landing_page_generation_profiles where id = v_uncorrelated.profile_id) <> 'draft' then
    raise exception 'failed activation did not preserve active and draft';
  end if;
  execute 'set local role authenticated';

  select * into v_activated
  from public.activate_landing_page_generation_profile(v_uncorrelated.profile_id, v_uncorrelated.updated_at);

  select * into v_archived_active
  from public.archive_landing_page_generation_profile(v_activated.profile_id, v_activated.updated_at);

  select * into v_draft_to_archive
  from public.save_landing_page_generation_profile_draft(
    '12040000-0000-4000-8000-000000000001',
    null,
    null,
    'Independent draft archive',
    '[]'::jsonb,
    'manual',
    null,
    null
  );
  select * into v_archived_draft
  from public.archive_landing_page_generation_profile(v_draft_to_archive.profile_id, v_draft_to_archive.updated_at);

  perform set_config('e12_4_3.test_active_profile_id', v_archived_active.profile_id::text, true);
  perform set_config('e12_4_3.test_draft_profile_id', v_archived_draft.profile_id::text, true);
end;
$$;

reset role;

do $$
declare
  v_active_profile_id uuid := current_setting('e12_4_3.test_active_profile_id')::uuid;
  v_draft_profile_id uuid := current_setting('e12_4_3.test_draft_profile_id')::uuid;
  v_temporary_active_id uuid;
begin
  begin
    insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance)
    values ('12040000-0000-4000-8000-000000000001', 1, 'draft', 'Duplicate version');
    raise exception 'expected version uniqueness rejection';
  exception when unique_violation then null;
  end;
  insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance)
  values ('12040000-0000-4000-8000-000000000001', 99, 'active', 'Temporary active')
  returning id into v_temporary_active_id;
  begin
    insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance)
    values ('12040000-0000-4000-8000-000000000001', 100, 'active', 'Duplicate active');
    raise exception 'expected active uniqueness rejection';
  exception when unique_violation then null;
  end;
  delete from public.landing_page_generation_profiles where id = v_temporary_active_id;

  if (select status from public.landing_page_generation_profiles where id = '12040000-0000-4000-8000-000000000010') <> 'archived' then
    raise exception 'previous active profile was not archived atomically';
  end if;
  if (select status from public.landing_page_generation_profiles where id = v_active_profile_id) <> 'archived' then
    raise exception 'active archive did not persist';
  end if;
  if (select status from public.landing_page_generation_profiles where id = v_draft_profile_id) <> 'archived' then
    raise exception 'draft archive did not persist';
  end if;
  if (select count(*) from public.landing_page_generation_profile_items where profile_id = v_active_profile_id) <> 1 then
    raise exception 'draft aggregate items were not replaced atomically';
  end if;
  if exists (
    select 1
    from public.audit_logs
    where record_id = v_active_profile_id
      and event = 'generation_profile_activated'
      and (changes_json ? 'request_id' or changes_json->>'correlation_status' <> 'unavailable')
  ) then
    raise exception 'activation reused stale proposal correlation';
  end if;
  if (select count(*) from public.audit_logs where record_id = v_active_profile_id and event in ('generation_profile_draft_saved', 'generation_profile_activated', 'generation_profile_archived')) <> 5 then
    raise exception 'confirmed active lifecycle mutations were not fully audited';
  end if;
  if (select count(*) from public.audit_logs where record_id = v_draft_profile_id and event in ('generation_profile_draft_saved', 'generation_profile_archived')) <> 2 then
    raise exception 'independent draft archive was not fully audited';
  end if;

  if exists (
    select 1
    from pg_class relation
    cross join lateral aclexplode(coalesce(relation.relacl, acldefault('r', relation.relowner))) privilege
    where relation.oid in (
      'public.landing_page_generation_profiles'::regclass,
      'public.landing_page_generation_profile_items'::regclass
    )
      and privilege.grantee = 0
      and privilege.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'PUBLIC retained direct DML';
  end if;

  if exists (
    select 1
    from (values ('anon'), ('authenticated'), ('service_role')) runtime_role(role_name)
    cross join (values ('public.landing_page_generation_profiles'), ('public.landing_page_generation_profile_items')) relation(table_name)
    cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) operation(privilege_name)
    where has_table_privilege(runtime_role.role_name, relation.table_name, operation.privilege_name)
  ) then
    raise exception 'runtime roles retained direct generation-profile DML';
  end if;
  if to_regrole('ai_readonly') is not null then
    if exists (
      select 1
      from (values ('public.landing_page_generation_profiles'), ('public.landing_page_generation_profile_items')) relation(table_name)
      cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) operation(privilege_name)
      where has_table_privilege('ai_readonly', relation.table_name, operation.privilege_name)
    ) then
      raise exception 'ai_readonly retained direct generation-profile DML';
    end if;
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ce899cd2-5360-478e-817e-ee3690aabecd","role":"authenticated","platform_admin":true}',
  true
);
do $$
begin
  begin
    update public.landing_page_generation_profiles set generation_guidance = 'Forbidden direct client write';
    raise exception 'expected direct DML rejection';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
