begin;

set local search_path = public, pg_catalog;

do $test$
declare
  v_helper oid :=
    to_regprocedure('public.raise_postgrest_safe_conflict_v1(text)');
  v_signature text;
  v_function oid;
  v_message text;
  v_detail text;
  v_sqlstate text;
  v_message_json jsonb;
  v_detail_json jsonb;
  v_patched_count integer;
begin
  if v_helper is null then
    raise exception 'postgrest-safe conflict helper is missing';
  end if;

  if (select pg_get_userbyid(proowner) from pg_proc where oid = v_helper) <> 'postgres'
     or (select prosecdef from pg_proc where oid = v_helper)
     or (select provolatile from pg_proc where oid = v_helper) <> 's'
     or pg_get_functiondef(v_helper) not ilike
       '%set search_path to ''pg_catalog''%' then
    raise exception 'postgrest-safe conflict helper attributes drifted';
  end if;

  if not has_function_privilege(
       'service_role',
       v_helper,
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       v_helper,
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       v_helper,
       'EXECUTE'
     )
     or (
       to_regrole('ai_readonly') is not null
       and has_function_privilege(
         'ai_readonly',
         v_helper,
         'EXECUTE'
       )
     ) then
    raise exception 'postgrest-safe conflict helper grants drifted';
  end if;

  foreach v_signature in array array[
    'public.activate_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)',
    'public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)',
    'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)',
    'public.discard_openai_workload_configuration_candidate_v1(text,text,uuid,bigint)',
    'public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)',
    'public.publish_content_artifact_draft(uuid)',
    'public.rollback_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)',
    'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)',
    'public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)',
    'public.set_openai_model_catalog_model_availability_v1(text,text,boolean,uuid,bigint)',
    'public.set_openai_model_catalog_parameter_availability_v1(text,text,text,text,boolean,uuid,bigint)'
  ] loop
    v_function := to_regprocedure(v_signature);

    if v_function is null
       or pg_get_functiondef(v_function) not like
         '%public.raise_postgrest_safe_conflict_v1(%'
       or (
         select prosrc
         from pg_proc
         where oid = v_function
       ) ~ 'errcode[[:space:]]*=[[:space:]]*''40001''' then
      raise exception 'postgrest-safe conflict target drifted: %', v_signature;
    end if;
  end loop;

  select count(*)
  into v_patched_count
  from pg_proc function_object
  join pg_namespace function_schema
    on function_schema.oid = function_object.pronamespace
  where function_schema.nspname = 'public'
    and function_object.oid <> v_helper
    and function_object.prosrc like
      '%public.raise_postgrest_safe_conflict_v1(%';

  if v_patched_count <> 11 then
    raise exception
      'postgrest-safe conflict target count drifted: expected 11, found %',
      v_patched_count;
  end if;

  if exists (
    select 1
    from pg_proc function_object
    join pg_namespace function_schema
      on function_schema.oid = function_object.pronamespace
    where function_schema.nspname = 'public'
      and function_object.oid <> v_helper
      and function_object.prosrc ~
        'errcode[[:space:]]*=[[:space:]]*''40001'''
  ) then
    raise exception 'unsafe application-level SQLSTATE 40001 remains';
  end if;

  perform set_config('request.method', 'POST', true);

  begin
    perform public.raise_postgrest_safe_conflict_v1(
      'postgrest_safe_conflict_probe'
    );
    raise exception 'postgrest-safe conflict helper did not raise PGRST';
  exception
    when sqlstate 'PGRST' then
      get stacked diagnostics
        v_message = message_text,
        v_detail = pg_exception_detail,
        v_sqlstate = returned_sqlstate;
  end;

  v_message_json := v_message::jsonb;
  v_detail_json := v_detail::jsonb;

  if v_sqlstate <> 'PGRST'
     or v_message_json ->> 'code' <> '40001'
     or v_message_json ->> 'message' <>
       'postgrest_safe_conflict_probe'
     or v_message_json -> 'details' is distinct from 'null'::jsonb
     or v_message_json -> 'hint' is distinct from 'null'::jsonb
     or (v_detail_json ->> 'status')::integer <> 409
     or jsonb_typeof(v_detail_json -> 'headers') <> 'object' then
    raise exception 'postgrest-safe conflict PGRST payload drifted';
  end if;

  perform set_config('request.method', '', true);

  begin
    perform public.raise_postgrest_safe_conflict_v1(
      'direct_sql_conflict_probe'
    );
    raise exception 'postgrest-safe conflict helper did not preserve direct SQL 40001';
  exception
    when sqlstate '40001' then
      get stacked diagnostics v_message = message_text;
  end;

  if v_message <> 'direct_sql_conflict_probe' then
    raise exception 'direct SQL conflict message drifted';
  end if;
end;
$test$;

rollback;
