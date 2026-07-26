begin;

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values (
  '10000000-0000-4000-8000-000000000001',
  null,
  'segment',
  'E20.3 test segment',
  'e20-3-test-segment',
  true
);

insert into public.landing_page_generation_profiles (
  id,
  owner_taxon_id,
  version,
  status,
  generation_guidance
)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  1,
  'active',
  'Valid generation guidance'
);

insert into public.landing_page_generation_profile_items (
  id,
  profile_id,
  module_key,
  module_version,
  variant_key,
  variant_version,
  priority,
  recommended_order,
  item_guidance
)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'hero',
  1,
  null,
  null,
  'P1',
  10,
  null
);

do $$
begin
  begin
    insert into public.landing_page_generation_profiles (
      owner_taxon_id, version, status, generation_guidance
    ) values (
      '10000000-0000-4000-8000-000000000001', 2, 'active', 'Duplicate active'
    );
    raise exception 'expected unique active profile violation';
  exception when unique_violation then null;
  end;

  begin
    insert into public.landing_page_generation_profiles (
      owner_taxon_id, version, status, generation_guidance
    ) values (
      '10000000-0000-4000-8000-000000000001', 0, 'draft', 'Invalid version'
    );
    raise exception 'expected profile version check violation';
  exception when check_violation then null;
  end;

  begin
    insert into public.landing_page_generation_profile_items (
      profile_id, module_key, module_version, variant_key, variant_version,
      priority, recommended_order
    ) values (
      '20000000-0000-4000-8000-000000000001', 'faq', 1, 'faq.accordion', null,
      'P1', 20
    );
    raise exception 'expected variant pair check violation';
  exception when check_violation then null;
  end;

  begin
    insert into public.landing_page_generation_profile_items (
      profile_id, module_key, module_version, priority, recommended_order
    ) values (
      '20000000-0000-4000-8000-000000000001', 'faq', 1, 'P4', 20
    );
    raise exception 'expected priority check violation';
  exception when check_violation then null;
  end;

  begin
    insert into public.landing_page_generation_profile_items (
      profile_id, module_key, module_version, priority, recommended_order
    ) values (
      '20000000-0000-4000-8000-000000000001', 'hero', 1, 'P2', 20
    );
    raise exception 'expected duplicate module violation';
  exception when unique_violation then null;
  end;

  begin
    insert into public.landing_page_generation_profile_items (
      profile_id, module_key, module_version, priority, recommended_order
    ) values (
      '20000000-0000-4000-8000-000000000001', 'faq', 1, 'P2', 10
    );
    raise exception 'expected duplicate recommended order violation';
  exception when unique_violation then null;
  end;
end;
$$;

do $$
begin
  if (select count(*) from pg_policies where schemaname = 'public' and tablename in (
    'landing_page_generation_profiles',
    'landing_page_generation_profile_items'
  )) <> 0 then
    raise exception 'generation profile tables must not have policies';
  end if;

  if not has_table_privilege('service_role', 'public.landing_page_generation_profiles', 'SELECT')
    or not has_table_privilege('service_role', 'public.landing_page_generation_profile_items', 'SELECT')
    or has_table_privilege('service_role', 'public.landing_page_generation_profiles', 'INSERT')
    or has_table_privilege('anon', 'public.landing_page_generation_profiles', 'SELECT')
    or has_table_privilege('authenticated', 'public.landing_page_generation_profile_items', 'SELECT') then
    raise exception 'generation profile grants differ from the read-only contract';
  end if;
end;
$$;

rollback;
