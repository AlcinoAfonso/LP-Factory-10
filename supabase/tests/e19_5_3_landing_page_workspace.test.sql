begin;

do $$
declare
  v_save_definition text;
begin
  if to_regclass('public.account_landing_page_shared_configurations') is null
     or to_regclass('public.account_landing_page_configurations') is null then
    raise exception 'E19.5.3 configuration residences are missing';
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

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.account_landing_page_shared_configurations'::regclass
  ) or not (
    select relrowsecurity
    from pg_class
    where oid = 'public.account_landing_page_configurations'::regclass
  ) then
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

  if not has_table_privilege(
    'service_role',
    'public.account_landing_page_shared_configurations',
    'SELECT,INSERT,UPDATE'
  ) or has_table_privilege(
    'service_role',
    'public.account_landing_page_shared_configurations',
    'DELETE,TRUNCATE'
  ) then
    raise exception 'E19.5.3 shared grants are not least privilege';
  end if;

  if not has_table_privilege(
    'service_role',
    'public.account_landing_page_configurations',
    'SELECT,INSERT,UPDATE'
  ) or has_table_privilege(
    'service_role',
    'public.account_landing_page_configurations',
    'DELETE,TRUNCATE'
  ) then
    raise exception 'E19.5.3 landing-page grants are not least privilege';
  end if;

  if not has_function_privilege(
       'service_role',
       'public.e19_5_actor_can_manage(uuid,uuid)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'service_role',
       'public.e19_5_configuration_values_have_scopes(jsonb,text[])',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.e19_5_actor_can_manage(uuid,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'public.e19_5_configuration_values_have_scopes(jsonb,text[])',
       'EXECUTE'
     ) then
    raise exception 'E19.5.3 helper grants are not service-only';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_pages'::regclass
      and conname = 'account_landing_pages_approved_materialization_fkey'
      and condeferrable
  ) then
    raise exception 'E19.5.3 tenant-safe approval FK is missing';
  end if;

  select pg_get_functiondef(
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid)'::regprocedure
  ) into v_save_definition;
  if (
       select prosecdef
       from pg_proc
       where oid = 'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid)'::regprocedure
     )
     or v_save_definition not ilike '%security invoker%'
     or v_save_definition not ilike '%set search_path to ''public'', ''pg_catalog''%'
     or v_save_definition not ilike '%p_expected_shared_revision is null%'
     or v_save_definition not ilike '%p_expected_landing_page_revision is null%'
     or v_save_definition not ilike '%for update%'
     or v_save_definition not ilike '%p_catalog_version is distinct from 5%' then
    raise exception 'E19.5.3 atomic save contract is incomplete';
  end if;

  if not public.e19_5_configuration_values_have_scopes(
    '{"business_offerings_summary":{"scope":"business","value":"Resumo aberto"}}'::jsonb,
    array['account', 'business']
  ) then
    raise exception 'E19.5.3 optional business summary must fit the shared residence';
  end if;

  if not public.e19_5_configuration_values_have_scopes(
    '{"primary_conversion_goal":{"scope":"landing_page","value":"contact"}}'::jsonb,
    array['offer', 'campaign', 'landing_page']
  ) then
    raise exception 'E19.5.3 primary conversion goal must fit the LP residence';
  end if;

  if public.e19_5_configuration_values_have_scopes(
    '{"primary_conversion_goal":{"scope":"business","value":"contact"}}'::jsonb,
    array['offer', 'campaign', 'landing_page']
  ) then
    raise exception 'E19.5.3 scope drift must fail closed';
  end if;
end;
$$;

rollback;
