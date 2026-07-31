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

insert into public.landing_page_generation_profiles (
  owner_taxon_id,
  version,
  status
)
values (
  '10000000-0000-4000-8000-000000000001',
  99,
  'draft'
);

do $$
begin
  if not exists (
    select 1
    from public.landing_page_generation_profiles
    where owner_taxon_id = '10000000-0000-4000-8000-000000000001'
      and version = 99
      and generation_guidance is null
  ) then
    raise exception 'generation guidance should be optional';
  end if;
end;
$$;

do $$
declare
  candidate record;
begin
  for candidate in
    select * from (values
      ('profile owner FK', $sql$insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance) values ('90000000-0000-4000-8000-000000000001', 1, 'draft', 'Guidance')$sql$),
      ('item profile FK', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('90000000-0000-4000-8000-000000000002', 'faq', 1, 'P1', 20)$sql$)
    ) as cases(case_name, statement)
  loop
    begin
      execute candidate.statement;
      raise exception 'expected foreign key violation: %', candidate.case_name;
    exception when foreign_key_violation then null;
    end;
  end loop;

  for candidate in
    select * from (values
      ('profile version', $sql$insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance) values ('10000000-0000-4000-8000-000000000001', 0, 'draft', 'Guidance')$sql$),
      ('profile status', $sql$insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance) values ('10000000-0000-4000-8000-000000000001', 2, 'published', 'Guidance')$sql$),
      ('profile guidance', $sql$insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance) values ('10000000-0000-4000-8000-000000000001', 2, 'draft', ' ')$sql$),
      ('module key', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', ' ', 1, 'P1', 20)$sql$),
      ('module version', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 0, 'P1', 20)$sql$),
      ('variant pair', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, variant_key, variant_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, 'faq.accordion@v1', null, 'P1', 20)$sql$),
      ('variant key', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, variant_key, variant_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, ' ', 1, 'P1', 20)$sql$),
      ('variant version', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, variant_key, variant_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, 'faq.accordion@v1', 0, 'P1', 20)$sql$),
      ('priority', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, 'P4', 20)$sql$),
      ('recommended order', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, 'P1', 0)$sql$),
      ('item guidance', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order, item_guidance) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, 'P1', 20, ' ')$sql$)
    ) as cases(case_name, statement)
  loop
    begin
      execute candidate.statement;
      raise exception 'expected check violation: %', candidate.case_name;
    exception when check_violation then null;
    end;
  end loop;

  for candidate in
    select * from (values
      ('profile owner and version', $sql$insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance) values ('10000000-0000-4000-8000-000000000001', 1, 'draft', 'Guidance')$sql$),
      ('single active owner', $sql$insert into public.landing_page_generation_profiles (owner_taxon_id, version, status, generation_guidance) values ('10000000-0000-4000-8000-000000000001', 2, 'active', 'Guidance')$sql$),
      ('profile and module', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'hero', 1, 'P2', 20)$sql$),
      ('profile and order', $sql$insert into public.landing_page_generation_profile_items (profile_id, module_key, module_version, priority, recommended_order) values ('20000000-0000-4000-8000-000000000001', 'faq', 1, 'P2', 10)$sql$)
    ) as cases(case_name, statement)
  loop
    begin
      execute candidate.statement;
      raise exception 'expected unique violation: %', candidate.case_name;
    exception when unique_violation then null;
    end;
  end loop;
end;
$$;

do $$
declare
  target_table text;
  target_role text;
  privilege_name text;
begin
  if exists (
    select 1
    from (values
      ('landing_page_generation_profiles', 'landing_page_generation_profiles_owner_taxon_id_fkey', 'f', 'c', 'r'),
      ('landing_page_generation_profile_items', 'landing_page_generation_profile_items_profile_id_fkey', 'f', 'c', 'c')
    ) as expected(table_name, constraint_name, constraint_type, update_action, delete_action)
    left join pg_constraint actual
      on actual.conrelid = to_regclass('public.' || expected.table_name)
      and actual.conname = expected.constraint_name
    where actual.oid is null
      or actual.contype::text <> expected.constraint_type
      or actual.confupdtype::text <> expected.update_action
      or actual.confdeltype::text <> expected.delete_action
  ) then
    raise exception 'generation profile FK definitions differ from the contract';
  end if;

  if (select count(*) from pg_class where oid in (
    to_regclass('public.landing_page_generation_profiles'),
    to_regclass('public.landing_page_generation_profile_items')
  ) and relrowsecurity) <> 2 then
    raise exception 'generation profile tables must have RLS enabled';
  end if;

  if (select count(*) from pg_policies where schemaname = 'public' and tablename in (
    'landing_page_generation_profiles',
    'landing_page_generation_profile_items'
  )) <> 0 then
    raise exception 'generation profile tables must not have policies';
  end if;

  foreach target_table in array array[
    'landing_page_generation_profiles',
    'landing_page_generation_profile_items'
  ] loop
    if not has_table_privilege('service_role', 'public.' || target_table, 'SELECT') then
      raise exception 'service_role must have SELECT on %', target_table;
    end if;

    foreach privilege_name in array array[
      'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
    ] loop
      if has_table_privilege('service_role', 'public.' || target_table, privilege_name) then
        raise exception 'service_role has unexpected % on %', privilege_name, target_table;
      end if;
    end loop;

    foreach target_role in array array['anon', 'authenticated'] loop
      foreach privilege_name in array array[
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
      ] loop
        if has_table_privilege(target_role, 'public.' || target_table, privilege_name) then
          raise exception '% has unexpected % on %', target_role, privilege_name, target_table;
        end if;
      end loop;
    end loop;

    if to_regrole('ai_readonly') is not null then
      foreach privilege_name in array array[
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
      ] loop
        if has_table_privilege('ai_readonly', 'public.' || target_table, privilege_name) then
          raise exception 'ai_readonly has unexpected % on %', privilege_name, target_table;
        end if;
      end loop;
    end if;

    if exists (
      select 1
      from pg_class c
      cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
      where c.oid = to_regclass('public.' || target_table)
        and acl.grantee = 0
    ) then
      raise exception 'PUBLIC has unexpected privileges on %', target_table;
    end if;
  end loop;
end;
$$;

rollback;
