begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2028000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e20.2.8-test@example.com',
  now(),
  now()
);

do $$
declare
  v_function_definition text;
begin
  if to_regclass('public.landing_page_input_catalog_drafts') is null then
    raise exception 'E20.2.8 draft residence is missing';
  end if;
  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.landing_page_input_catalog_drafts'::regclass
  ) then
    raise exception 'E20.2.8 draft RLS must be enabled';
  end if;
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'landing_page_input_catalog_drafts'
  ) then
    raise exception 'E20.2.8 service-only draft must not expose consuming policies';
  end if;
  if exists (
       select 1
       from information_schema.role_table_grants
       where table_schema = 'public'
         and table_name = 'landing_page_input_catalog_drafts'
         and grantee = 'PUBLIC'
     )
     or has_table_privilege('anon', 'public.landing_page_input_catalog_drafts', 'SELECT')
     or has_table_privilege('anon', 'public.landing_page_input_catalog_drafts', 'INSERT')
     or has_table_privilege('anon', 'public.landing_page_input_catalog_drafts', 'UPDATE')
     or has_table_privilege('anon', 'public.landing_page_input_catalog_drafts', 'DELETE')
     or has_table_privilege('authenticated', 'public.landing_page_input_catalog_drafts', 'SELECT')
     or has_table_privilege('authenticated', 'public.landing_page_input_catalog_drafts', 'INSERT')
     or has_table_privilege('authenticated', 'public.landing_page_input_catalog_drafts', 'UPDATE')
     or has_table_privilege('authenticated', 'public.landing_page_input_catalog_drafts', 'DELETE')
     or (to_regrole('ai_readonly') is not null and (
       has_table_privilege('ai_readonly', 'public.landing_page_input_catalog_drafts', 'SELECT')
       or has_table_privilege('ai_readonly', 'public.landing_page_input_catalog_drafts', 'INSERT')
       or has_table_privilege('ai_readonly', 'public.landing_page_input_catalog_drafts', 'UPDATE')
       or has_table_privilege('ai_readonly', 'public.landing_page_input_catalog_drafts', 'DELETE')
     ))
     or not has_table_privilege('service_role', 'public.landing_page_input_catalog_drafts', 'SELECT')
     or not has_table_privilege('service_role', 'public.landing_page_input_catalog_drafts', 'INSERT')
     or not has_table_privilege('service_role', 'public.landing_page_input_catalog_drafts', 'UPDATE')
     or not has_table_privilege('service_role', 'public.landing_page_input_catalog_drafts', 'DELETE') then
    raise exception 'E20.2.8 draft grants drifted';
  end if;

  select pg_get_functiondef(
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)'::regprocedure
  ) into v_function_definition;
  if position('is distinct from 5' in lower(v_function_definition)) > 0
     or position('p_catalog_version <= 0' in v_function_definition) = 0 then
    raise exception 'E20.2.8 effective catalog version guard drifted';
  end if;

  begin
    insert into public.landing_page_input_catalog_drafts (
      singleton, base_version, target_version, catalog_json,
      content_fingerprint, created_by, updated_by
    ) values (
      false, 5, 6, '{}'::jsonb, repeat('a', 64),
      'e2028000-0000-4000-8000-000000000001',
      'e2028000-0000-4000-8000-000000000001'
    );
    raise exception 'singleton=false unexpectedly accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.landing_page_input_catalog_drafts (
      base_version, target_version, catalog_json,
      content_fingerprint, created_by, updated_by
    ) values (
      5, 7, '{}'::jsonb, repeat('a', 64),
      'e2028000-0000-4000-8000-000000000001',
      'e2028000-0000-4000-8000-000000000001'
    );
    raise exception 'non-sequential target unexpectedly accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

insert into public.landing_page_input_catalog_drafts (
  base_version, target_version, catalog_json, content_fingerprint,
  created_by, updated_by
) values (
  5,
  6,
  '{"version":6,"universal":{"level":"universal","entries":[]},"taxonLayers":{}}'::jsonb,
  repeat('b', 64),
  'e2028000-0000-4000-8000-000000000001',
  'e2028000-0000-4000-8000-000000000001'
);

do $$
begin
  begin
    update public.landing_page_input_catalog_drafts
    set validation_fingerprint = repeat('b', 64),
        validated_at = null;
    raise exception 'partial validation evidence unexpectedly accepted';
  exception when check_violation then
    null;
  end;

  begin
    update public.landing_page_input_catalog_drafts
    set publication_fingerprint = repeat('c', 64),
        publication_context_fingerprint = repeat('d', 64),
        publication_prepared_at = now(),
        validation_fingerprint = repeat('b', 64),
        validation_context_fingerprint = repeat('e', 64),
        validated_at = now();
    raise exception 'mismatched publication evidence unexpectedly accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

update public.landing_page_input_catalog_drafts
set validation_fingerprint = content_fingerprint,
    validation_context_fingerprint = repeat('c', 64),
    validated_at = now(),
    publication_fingerprint = content_fingerprint,
    publication_context_fingerprint = repeat('c', 64),
    publication_prepared_at = now();

do $$
begin
  begin
    update public.landing_page_input_catalog_drafts
    set taxon_review_evidence = '[]'::jsonb;
    raise exception 'non-object review evidence unexpectedly accepted';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
begin
  if (select count(*) from public.landing_page_input_catalog_drafts) <> 1 then
    raise exception 'E20.2.8 must preserve exactly one draft';
  end if;
end;
$$;

rollback;
