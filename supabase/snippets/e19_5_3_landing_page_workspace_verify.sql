-- Fails closed unless 20260822170000_e19_5_3_landing_page_workspace.sql
-- is applied with the complete E19.5.3 contract in the target environment.
do $$
declare
  v_signature text;
  v_function oid;
begin
  if to_regclass('public.account_landing_page_shared_configurations') is null
     or to_regclass('public.account_landing_page_configurations') is null then
    raise exception 'E19.5.3 configuration residences are missing';
  end if;

  if not coalesce((
       select relrowsecurity
       from pg_class
       where oid = 'public.account_landing_page_shared_configurations'::regclass
     ), false)
     or not coalesce((
       select relrowsecurity
       from pg_class
       where oid = 'public.account_landing_page_configurations'::regclass
     ), false) then
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
    raise exception 'E19.5.3 residences must expose no policies';
  end if;

  if not has_table_privilege(
       'service_role', 'public.account_landing_page_shared_configurations',
       'SELECT,INSERT,UPDATE'
     )
     or has_table_privilege(
       'service_role', 'public.account_landing_page_shared_configurations',
       'DELETE,TRUNCATE'
     )
     or not has_table_privilege(
       'service_role', 'public.account_landing_page_configurations',
       'SELECT,INSERT,UPDATE'
     )
     or has_table_privilege(
       'service_role', 'public.account_landing_page_configurations',
       'DELETE,TRUNCATE'
     )
     or has_table_privilege(
       'anon', 'public.account_landing_page_shared_configurations',
       'SELECT,INSERT,UPDATE,DELETE'
     )
     or has_table_privilege(
       'authenticated', 'public.account_landing_page_shared_configurations',
       'SELECT,INSERT,UPDATE,DELETE'
     )
     or has_table_privilege(
       'anon', 'public.account_landing_page_configurations',
       'SELECT,INSERT,UPDATE,DELETE'
     )
     or has_table_privilege(
       'authenticated', 'public.account_landing_page_configurations',
       'SELECT,INSERT,UPDATE,DELETE'
     ) then
    raise exception 'E19.5.3 table grants drifted';
  end if;

  foreach v_signature in array array[
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)',
    'public.approve_account_landing_page_materialization_v1(uuid,uuid,uuid,uuid)',
    'public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)'
  ] loop
    v_function := to_regprocedure(v_signature);
    if v_function is null then
      raise exception 'E19.5.3 RPC missing: %', v_signature;
    end if;
    if (
         select procedure.prosecdef
            or pg_get_userbyid(procedure.proowner) <> 'postgres'
            or pg_get_functiondef(procedure.oid) not ilike '%security invoker%'
            or pg_get_functiondef(procedure.oid) not ilike '%set search_path to ''public'', ''pg_catalog''%'
         from pg_proc procedure
         where procedure.oid = v_function
       ) then
      raise exception 'E19.5.3 RPC security contract drifted: %', v_signature;
    end if;
    if not has_function_privilege('service_role', v_function, 'EXECUTE')
       or has_function_privilege('anon', v_function, 'EXECUTE')
       or has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'E19.5.3 RPC execute grants drifted: %', v_signature;
    end if;
    if to_regrole('ai_readonly') is not null
       and has_function_privilege('ai_readonly', v_function, 'EXECUTE') then
      raise exception 'E19.5.3 ai_readonly must not execute: %', v_signature;
    end if;
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_pages'::regclass
      and conname = 'account_landing_pages_approved_materialization_fkey'
      and condeferrable
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_landing_page_materializations'::regclass
      and conname = 'account_landing_page_materializations_id_landing_page_account_key'
  ) then
    raise exception 'E19.5.3 tenant-safe approval constraints drifted';
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
    raise exception 'E19.5.3 eager state columns are forbidden';
  end if;
end;
$$;

select 'E19.5.3 workspace contract verified' as result;
