begin;

set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e1953000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e19.5.3-test@example.com',
  now(),
  now()
);

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('e1953000-0000-4000-8000-000000000011', 'E19.5.3 account one', 'e19-5-3-one', 'e19-5-3-one', 'active'),
  ('e1953000-0000-4000-8000-000000000012', 'E19.5.3 account two', 'e19-5-3-two', 'e19-5-3-two', 'active');

insert into public.account_users (account_id, user_id, role, status)
values
  ('e1953000-0000-4000-8000-000000000011', 'e1953000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e1953000-0000-4000-8000-000000000012', 'e1953000-0000-4000-8000-000000000001', 'owner', 'active');

insert into public.account_landing_pages (id, account_id, name, slug, status, created_by)
values
  ('e1953000-0000-4000-8000-000000000021', 'e1953000-0000-4000-8000-000000000011', 'Workspace one', 'workspace-one', 'draft', 'e1953000-0000-4000-8000-000000000001'),
  ('e1953000-0000-4000-8000-000000000022', 'e1953000-0000-4000-8000-000000000012', 'Workspace two', 'workspace-two', 'draft', 'e1953000-0000-4000-8000-000000000001');

do $$
declare
  v_signature text;
  v_function oid;
  v_definition text;
begin
  if to_regclass('public.account_landing_page_shared_configurations') is null
     or to_regclass('public.account_landing_page_configurations') is null then
    raise exception 'E19.5.3 configuration residences are missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'account_landing_pages'
      and column_name = 'approved_materialization_id'
      and data_type = 'uuid'
      and is_nullable = 'YES'
      and column_default is null
  ) then
    raise exception 'E19.5.3 approval pointer column drifted';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'account_landing_page_shared_configurations',
        'account_landing_page_configurations'
      )
      and column_name in ('is_initialized', 'is_complete', 'status')
  ) then
    raise exception 'E19.5.3 must not persist eager initialization or completeness state';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.account_landing_page_shared_configurations'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.account_landing_page_configurations'::regclass) then
    raise exception 'E19.5.3 RLS must be enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in (
        'account_landing_page_shared_configurations',
        'account_landing_page_configurations'
      )
  ) then
    raise exception 'E19.5.3 residences must have no policies';
  end if;

  if exists (
    select 1
    from pg_class table_object
    left join lateral (
      select
        array_agg(
          distinct privilege.privilege_type
          order by privilege.privilege_type
        ) as privileges,
        bool_or(privilege.is_grantable) as has_grant_option
      from aclexplode(
        coalesce(table_object.relacl, acldefault('r', table_object.relowner))
      ) privilege
      where privilege.grantee = to_regrole('service_role')
    ) service_acl on true
    where table_object.oid in (
      'public.account_landing_page_shared_configurations'::regclass,
      'public.account_landing_page_configurations'::regclass
    )
      and (
        service_acl.privileges is distinct from array['INSERT', 'SELECT', 'UPDATE']::text[]
        or coalesce(service_acl.has_grant_option, false)
      )
  ) then
    raise exception 'E19.5.3 table grants are not least privilege';
  end if;

  if exists (
    select 1
    from pg_class table_object
    cross join lateral aclexplode(
      coalesce(table_object.relacl, acldefault('r', table_object.relowner))
    ) privilege
    where table_object.oid in (
      'public.account_landing_page_shared_configurations'::regclass,
      'public.account_landing_page_configurations'::regclass
    )
      and (
        privilege.grantee = 0
        or privilege.grantee in (
          select role_object.oid
          from pg_roles role_object
          where role_object.rolname in ('anon', 'authenticated', 'ai_readonly')
        )
      )
  ) then
    raise exception 'E19.5.3 external table ACLs drifted';
  end if;

  if not has_function_privilege(
       'service_role', 'public.e19_5_actor_can_manage(uuid,uuid)', 'EXECUTE'
     )
     or not has_function_privilege(
       'service_role', 'public.e19_5_configuration_values_have_scopes(jsonb,text[])', 'EXECUTE'
     )
     or has_function_privilege(
       'authenticated', 'public.e19_5_actor_can_manage(uuid,uuid)', 'EXECUTE'
     )
     or has_function_privilege(
       'authenticated', 'public.e19_5_configuration_values_have_scopes(jsonb,text[])', 'EXECUTE'
     )
     or (
       to_regrole('ai_readonly') is not null
       and (
         has_function_privilege(
           'ai_readonly', 'public.e19_5_actor_can_manage(uuid,uuid)', 'EXECUTE'
         )
         or has_function_privilege(
           'ai_readonly', 'public.e19_5_configuration_values_have_scopes(jsonb,text[])', 'EXECUTE'
         )
       )
     ) then
    raise exception 'E19.5.3 helper grants are not service-only';
  end if;

  foreach v_signature in array array[
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)',
    'public.approve_account_landing_page_materialization_v1(uuid,uuid,uuid,uuid)',
    'public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)'
  ] loop
    v_function := to_regprocedure(v_signature);
    if v_function is null
       or (select prosecdef from pg_proc where oid = v_function)
       or (select pg_get_userbyid(proowner) <> 'postgres' from pg_proc where oid = v_function)
       or pg_get_functiondef(v_function) not ilike '%set search_path to ''public'', ''pg_catalog''%'
       or not has_function_privilege('service_role', v_function, 'EXECUTE')
       or has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'E19.5.3 RPC contract drifted: %', v_signature;
    end if;
  end loop;

  v_function := to_regprocedure(
    'public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)'
  );
  v_definition := pg_get_functiondef(v_function);
  if v_definition not ilike '%public.raise_postgrest_safe_conflict_v1(''shared_revision_conflict'')%'
     or v_definition not ilike '%public.raise_postgrest_safe_conflict_v1(''landing_page_revision_conflict'')%'
     or v_definition ~ 'errcode[[:space:]]*=[[:space:]]*''40001''' then
    raise exception 'E19.5.3 append conflicts must remain PostgREST-safe';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_pages'::regclass
      and conname = 'account_landing_pages_approved_materialization_fkey'
      and condeferrable
  ) then
    raise exception 'E19.5.3 tenant-safe approval FK is missing';
  end if;

  if not public.e19_5_configuration_values_have_scopes(
    '{"business_offerings_summary":{"scope":"business","value":"Resumo aberto"}}'::jsonb,
    array['account', 'business']
  ) or not public.e19_5_configuration_values_have_scopes(
    '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"}}'::jsonb,
    array['offer', 'campaign', 'landing_page']
  ) then
    raise exception 'E19.5.3 v5 fields must fit their declared residences';
  end if;
end;
$$;

do $$
declare
  v_shared_revision bigint;
  v_landing_revision bigint;
  v_materialization_id uuid;
  v_revision_number bigint;
  v_retry_id uuid;
  v_retry_revision bigint;
begin
  select shared_revision, landing_page_revision
  into v_shared_revision, v_landing_revision
  from public.save_account_landing_page_configuration_v1(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    '{"business_offerings_summary":{"scope":"business","value":"Resumo aberto"}}'::jsonb,
    '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"}}'::jsonb,
    null,
    null,
    5,
    'e1953000-0000-4000-8000-000000000001',
    null
  );
  if v_shared_revision <> 1 or v_landing_revision <> 1 then
    raise exception 'E19.5.3 first lazy save must create revision one';
  end if;

  select shared_revision, landing_page_revision
  into v_shared_revision, v_landing_revision
  from public.save_account_landing_page_configuration_v1(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    '{"business_offerings_summary":{"scope":"business","value":"Resumo aberto"}}'::jsonb,
    '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"}}'::jsonb,
    1,
    1,
    5,
    'e1953000-0000-4000-8000-000000000001',
    null
  );
  if v_shared_revision <> 1 or v_landing_revision <> 1 or (
    select revision
    from public.account_landing_page_shared_configurations
    where account_id = 'e1953000-0000-4000-8000-000000000011'
  ) <> 1 or (
    select revision
    from public.account_landing_page_configurations
    where account_id = 'e1953000-0000-4000-8000-000000000011'
      and landing_page_id = 'e1953000-0000-4000-8000-000000000021'
  ) <> 1 then
    raise exception 'E19.5.3 same values must remain a no-op without revision increment';
  end if;

  begin
    perform *
    from public.save_account_landing_page_configuration_v1(
      'e1953000-0000-4000-8000-000000000011',
      'e1953000-0000-4000-8000-000000000021',
      '{"business_offerings_summary":{"scope":"business","value":"must rollback"}}'::jsonb,
      '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"}}'::jsonb,
      1,
      999,
      5,
      'e1953000-0000-4000-8000-000000000001',
      null
    );
    raise exception 'stale landing revision must fail';
  exception when sqlstate '40001' then
    null;
  end;
  if (
    select values -> 'business_offerings_summary' ->> 'value'
    from public.account_landing_page_shared_configurations
    where account_id = 'e1953000-0000-4000-8000-000000000011'
  ) <> 'Resumo aberto' or (
    select revision
    from public.account_landing_page_shared_configurations
    where account_id = 'e1953000-0000-4000-8000-000000000011'
  ) <> 1 then
    raise exception 'failed atomic save must roll back the shared update';
  end if;

  select materialization_id, revision_number
  into v_materialization_id, v_revision_number
  from public.append_account_landing_page_materialization_v2(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    'e1953000-0000-4000-8000-000000000031',
    '{"contractVersion":1}'::jsonb,
    '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
    'e1953000-0000-4000-8000-000000000001',
    1,
    1
  );
  if v_revision_number <> 1 then
    raise exception 'E19.5.3 first append must create revision one';
  end if;

  begin
    perform *
    from public.save_account_landing_page_configuration_v1(
      'e1953000-0000-4000-8000-000000000011',
      'e1953000-0000-4000-8000-000000000021',
      '{"business_offerings_summary":{"scope":"business","value":"Resumo aberto"}}'::jsonb,
      '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"}}'::jsonb,
      1,
      1,
      5,
      'e1953000-0000-4000-8000-000000000001',
      null
    );
    raise exception 'stale materialization baseline must fail';
  exception when sqlstate '40001' then
    null;
  end;

  perform *
  from public.save_account_landing_page_configuration_v1(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    '{"business_offerings_summary":{"scope":"business","value":"Resumo aberto"}}'::jsonb,
    '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"},"primary_service_or_offer":{"scope":"offer","value":"Oferta ajustada"}}'::jsonb,
    1,
    1,
    5,
    'e1953000-0000-4000-8000-000000000001',
    v_materialization_id
  );

  begin
    perform *
    from public.append_account_landing_page_materialization_v2(
      'e1953000-0000-4000-8000-000000000011',
      'e1953000-0000-4000-8000-000000000021',
      'e1953000-0000-4000-8000-000000000032',
      '{"contractVersion":1}'::jsonb,
      '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
      'e1953000-0000-4000-8000-000000000001',
      1,
      1
    );
    raise exception 'append with stale configuration provenance must fail';
  exception when sqlstate '40001' then
    null;
  end;
  if exists (
    select 1 from public.account_landing_page_materializations
    where attempt_id = 'e1953000-0000-4000-8000-000000000032'
  ) then
    raise exception 'failed append must not persist a partial revision';
  end if;

  select materialization_id, revision_number
  into v_materialization_id, v_revision_number
  from public.append_account_landing_page_materialization_v2(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    'e1953000-0000-4000-8000-000000000032',
    '{"contractVersion":1}'::jsonb,
    '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
    'e1953000-0000-4000-8000-000000000001',
    1,
    2
  );
  if v_revision_number <> 2 then
    raise exception 'append after current provenance must create revision two';
  end if;

  select materialization_id, revision_number
  into v_retry_id, v_retry_revision
  from public.append_account_landing_page_materialization_v2(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    'e1953000-0000-4000-8000-000000000032',
    '{}'::jsonb,
    '{}'::jsonb,
    'e1953000-0000-4000-8000-000000000001',
    999,
    999
  );
  if v_retry_id <> v_materialization_id or v_retry_revision <> v_revision_number then
    raise exception 'append retry must remain idempotent';
  end if;

  update public.account_landing_page_shared_configurations
  set catalog_version = 6
  where account_id = 'e1953000-0000-4000-8000-000000000011';
  update public.account_landing_page_configurations
  set catalog_version = 6
  where account_id = 'e1953000-0000-4000-8000-000000000011'
    and landing_page_id = 'e1953000-0000-4000-8000-000000000021';

  select materialization_id, revision_number
  into v_materialization_id, v_revision_number
  from public.append_account_landing_page_materialization_v2(
    'e1953000-0000-4000-8000-000000000011',
    'e1953000-0000-4000-8000-000000000021',
    'e1953000-0000-4000-8000-000000000033',
    '{"contractVersion":1}'::jsonb,
    '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
    'e1953000-0000-4000-8000-000000000001',
    1,
    2
  );
  if v_revision_number <> 3 then
    raise exception 'append with catalog v6 must create the next revision';
  end if;

  begin
    perform *
    from public.append_account_landing_page_materialization_v2(
      'e1953000-0000-4000-8000-000000000011',
      'e1953000-0000-4000-8000-000000000021',
      'e1953000-0000-4000-8000-000000000034',
      '{"contractVersion":1}'::jsonb,
      '{"snapshotVersion":2,"generationContext":{"contractVersion":4}}'::jsonb,
      'e1953000-0000-4000-8000-000000000001',
      1,
      1
    );
    raise exception 'catalog v6 append with stale revision must fail';
  exception when sqlstate '40001' then
    null;
  end;
  if exists (
    select 1 from public.account_landing_page_materializations
    where attempt_id = 'e1953000-0000-4000-8000-000000000034'
  ) then
    raise exception 'stale catalog v6 append must not persist a partial revision';
  end if;

  if public.approve_account_landing_page_materialization_v1(
       'e1953000-0000-4000-8000-000000000011',
       'e1953000-0000-4000-8000-000000000021',
       v_materialization_id,
       'e1953000-0000-4000-8000-000000000001'
     ) <> v_materialization_id
     or public.approve_account_landing_page_materialization_v1(
       'e1953000-0000-4000-8000-000000000011',
       'e1953000-0000-4000-8000-000000000021',
       v_materialization_id,
       'e1953000-0000-4000-8000-000000000001'
     ) <> v_materialization_id then
    raise exception 'approval must be idempotent';
  end if;

  begin
    perform public.approve_account_landing_page_materialization_v1(
      'e1953000-0000-4000-8000-000000000012',
      'e1953000-0000-4000-8000-000000000022',
      v_materialization_id,
      'e1953000-0000-4000-8000-000000000001'
    );
    raise exception 'cross-tenant approval must fail';
  exception when foreign_key_violation then
    null;
  end;
  if (
    select approved_materialization_id
    from public.account_landing_pages
    where id = 'e1953000-0000-4000-8000-000000000021'
  ) <> v_materialization_id then
    raise exception 'failed approval must preserve the previous pointer';
  end if;
end;
$$;

rollback;
