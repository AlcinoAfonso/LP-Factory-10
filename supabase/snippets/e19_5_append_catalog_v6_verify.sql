-- Fails closed unless the corrective append RPC supports catalogs v5 and v6
-- while preserving the existing invoker and least-privilege contract.
do $$
declare
  v_function oid := to_regprocedure(
    'public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)'
  );
  v_definition text;
begin
  if v_function is null then
    raise exception 'E19.5 append RPC is missing';
  end if;

  v_definition := pg_get_functiondef(v_function);

  if (select prosecdef from pg_proc where oid = v_function)
     or (select pg_get_userbyid(proowner) <> 'postgres' from pg_proc where oid = v_function)
     or v_definition not ilike '%set search_path to ''public'', ''pg_catalog''%'
     or v_definition not ilike '%v_shared_catalog is distinct from 5%'
     or v_definition not ilike '%v_shared_catalog is distinct from 6%'
     or v_definition not ilike '%v_landing_catalog is distinct from 5%'
     or v_definition not ilike '%v_landing_catalog is distinct from 6%'
     or v_definition not ilike '%public.raise_postgrest_safe_conflict_v1(''shared_revision_conflict'')%'
     or v_definition not ilike '%public.raise_postgrest_safe_conflict_v1(''landing_page_revision_conflict'')%'
     or v_definition ~ 'errcode[[:space:]]*=[[:space:]]*''40001'''
     or not has_function_privilege('service_role', v_function, 'EXECUTE')
     or has_function_privilege('anon', v_function, 'EXECUTE')
     or has_function_privilege('authenticated', v_function, 'EXECUTE')
     or (
       to_regrole('ai_readonly') is not null
       and has_function_privilege('ai_readonly', v_function, 'EXECUTE')
     ) then
    raise exception 'E19.5 catalog v6 append contract drifted';
  end if;
end;
$$;
