begin;

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values ('12040000-0000-4000-8000-000000000001', null, 'segment', 'E12.4.3 test segment', 'e12-4-3-test-segment', true);

insert into public.landing_page_generation_profiles (id, owner_taxon_id, version, status, generation_guidance)
values ('12040000-0000-4000-8000-000000000010', '12040000-0000-4000-8000-000000000001', 1, 'active', 'Previous active guidance');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"12040000-0000-4000-8000-000000000099","role":"authenticated","platform_admin":true}',
  true
);

do $$
declare
  v_created record;
  v_updated record;
  v_activated record;
  v_archived record;
begin
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

  select * into v_updated
  from public.save_landing_page_generation_profile_draft(
    '12040000-0000-4000-8000-000000000001',
    v_created.profile_id,
    v_created.updated_at,
    'Updated draft guidance',
    '[{"module_key":"hero","module_version":1,"variant_key":"hero.form","variant_version":1,"priority":"P1","recommended_order":10,"item_guidance":"Specific guidance"}]'::jsonb,
    'ai',
    '12040000-0000-4000-8000-000000000098',
    'adjusted'
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

  select * into v_activated
  from public.activate_landing_page_generation_profile(v_updated.profile_id, v_updated.updated_at);
  select * into v_archived
  from public.archive_landing_page_generation_profile(v_activated.profile_id, v_activated.updated_at);

  perform set_config('e12_4_3.test_profile_id', v_archived.profile_id::text, true);
end;
$$;

reset role;

do $$
declare
  v_profile_id uuid := current_setting('e12_4_3.test_profile_id')::uuid;
begin
  if (select status from public.landing_page_generation_profiles where id = '12040000-0000-4000-8000-000000000010') <> 'archived' then
    raise exception 'previous active profile was not archived atomically';
  end if;
  if (select status from public.landing_page_generation_profiles where id = v_profile_id) <> 'archived' then
    raise exception 'explicit archive did not persist';
  end if;
  if (select count(*) from public.landing_page_generation_profile_items where profile_id = v_profile_id) <> 1 then
    raise exception 'draft aggregate items were not replaced atomically';
  end if;
  if (select count(*) from public.audit_logs where record_id = v_profile_id and event in ('generation_profile_draft_saved', 'generation_profile_activated', 'generation_profile_archived')) <> 3 then
    raise exception 'confirmed lifecycle mutations were not audited';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"12040000-0000-4000-8000-000000000099","role":"authenticated","platform_admin":true}',
  true
);
do $$
begin
  begin
    update public.landing_page_generation_profiles set generation_guidance = 'Forbidden direct write';
    raise exception 'expected direct DML rejection';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
