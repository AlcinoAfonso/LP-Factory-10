-- Prevent application-level optimistic-concurrency conflicts from being retried
-- internally by PostgREST 14.x as serialization failures.
--
-- The Data API receives SQLSTATE PGRST with HTTP 409, while the response body
-- keeps code 40001 for backward compatibility with current server consumers.
-- Direct SQL calls keep the historical SQLSTATE 40001 so existing transactional
-- database tests continue to validate rollback semantics without using PostgREST.

create or replace function public.raise_postgrest_safe_conflict_v1(
  p_message text
)
returns void
language plpgsql
stable
security invoker
set search_path = pg_catalog
as $function$
begin
  if p_message is null or btrim(p_message) = '' then
    raise exception using
      errcode = '22004',
      message = 'postgrest_safe_conflict_message_missing';
  end if;

  if nullif(current_setting('request.method', true), '') is not null then
    raise sqlstate 'PGRST' using
      message = jsonb_build_object(
        'code', '40001',
        'message', p_message,
        'details', null,
        'hint', null
      )::text,
      detail = jsonb_build_object(
        'status', 409,
        'headers', jsonb_build_object()
      )::text;
  end if;

  raise exception using
    errcode = '40001',
    message = p_message;
end;
$function$;

alter function public.raise_postgrest_safe_conflict_v1(text) owner to postgres;

revoke all on function public.raise_postgrest_safe_conflict_v1(text)
from public, anon, authenticated, service_role;

do $migration$
begin
  if to_regrole('ai_readonly') is not null then
    execute
      'revoke all on function public.raise_postgrest_safe_conflict_v1(text) from ai_readonly';
  end if;
end;
$migration$;

grant execute on function public.raise_postgrest_safe_conflict_v1(text)
to service_role;

comment on function public.raise_postgrest_safe_conflict_v1(text) is
  'Emite conflito otimista como HTTP 409 seguro para PostgREST, preservando code 40001 no body e SQLSTATE 40001 somente em chamadas SQL diretas.';

do $migration$
declare
  v_target record;
  v_conflict record;
  v_function oid;
  v_definition text;
  v_patched_definition text;
  v_needle text;
  v_replacement text;
  v_actual_count integer;
begin
  for v_target in
    select *
    from jsonb_to_recordset(
      $targets$
      [
        {
          "signature": "public.activate_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)",
          "messages": {
            "openai_workload_configuration_stale_version": 1
          }
        },
        {
          "signature": "public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)",
          "messages": {
            "shared_revision_conflict": 1,
            "landing_page_revision_conflict": 1
          }
        },
        {
          "signature": "public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)",
          "messages": {
            "openai_workload_configuration_stale_version": 1
          }
        },
        {
          "signature": "public.discard_openai_workload_configuration_candidate_v1(text,text,uuid,bigint)",
          "messages": {
            "openai_workload_configuration_stale_version": 1
          }
        },
        {
          "signature": "public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)",
          "messages": {
            "openai_workload_configuration_stale_version": 1
          }
        },
        {
          "signature": "public.rollback_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)",
          "messages": {
            "openai_workload_configuration_stale_version": 1
          }
        },
        {
          "signature": "public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)",
          "messages": {
            "materialization_baseline_conflict": 1,
            "shared_revision_conflict": 2,
            "landing_page_revision_conflict": 2
          }
        },
        {
          "signature": "public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)",
          "messages": {
            "openai_workload_configuration_stale_version": 1
          }
        },
        {
          "signature": "public.set_openai_model_catalog_model_availability_v1(text,text,boolean,uuid,bigint)",
          "messages": {
            "openai_model_catalog_stale_version": 1
          }
        },
        {
          "signature": "public.set_openai_model_catalog_parameter_availability_v1(text,text,text,text,boolean,uuid,bigint)",
          "messages": {
            "openai_model_catalog_stale_version": 1
          }
        }
      ]
      $targets$::jsonb
    ) as target(signature text, messages jsonb)
  loop
    v_function := to_regprocedure(v_target.signature);

    if v_function is null then
      raise exception using
        errcode = 'P0002',
        message = format(
          'postgrest_safe_conflict_target_missing:%s',
          v_target.signature
        );
    end if;

    v_definition := pg_get_functiondef(v_function);
    v_patched_definition := v_definition;

    for v_conflict in
      select
        conflict.key as message,
        conflict.value::integer as expected_count
      from jsonb_each_text(v_target.messages) conflict
      order by conflict.key
    loop
      v_needle := format(
        'raise exception using errcode = ''40001'', message = %L;',
        v_conflict.message
      );
      v_replacement := format(
        'perform public.raise_postgrest_safe_conflict_v1(%L);',
        v_conflict.message
      );
      v_actual_count :=
        (
          char_length(v_patched_definition)
          - char_length(replace(v_patched_definition, v_needle, ''))
        )
        / nullif(char_length(v_needle), 0);

      if v_actual_count <> v_conflict.expected_count then
        raise exception using
          errcode = 'P0001',
          message = format(
            'postgrest_safe_conflict_occurrence_drift:%s:%s:%s:%s',
            v_target.signature,
            v_conflict.message,
            v_conflict.expected_count,
            v_actual_count
          );
      end if;

      v_patched_definition :=
        replace(v_patched_definition, v_needle, v_replacement);
    end loop;

    if v_patched_definition ~
       'errcode[[:space:]]*=[[:space:]]*''40001''' then
      raise exception using
        errcode = 'P0001',
        message = format(
          'postgrest_safe_conflict_unmapped_40001:%s',
          v_target.signature
        );
    end if;

    execute v_patched_definition;
  end loop;
end;
$migration$;

do $migration$
declare
  v_function oid :=
    to_regprocedure('public.publish_content_artifact_draft(uuid)');
  v_definition text;
  v_patched_definition text;
  v_needle text :=
    E'raise exception ''content artifact % was not published'', p_artifact_id\n      using errcode = ''40001'';';
  v_replacement text :=
    E'perform public.raise_postgrest_safe_conflict_v1(\n      format(''content artifact %s was not published'', p_artifact_id)\n    );';
  v_actual_count integer;
begin
  if v_function is null then
    raise exception using
      errcode = 'P0002',
      message = 'postgrest_safe_conflict_target_missing:public.publish_content_artifact_draft(uuid)';
  end if;

  v_definition := pg_get_functiondef(v_function);
  v_actual_count :=
    (
      char_length(v_definition)
      - char_length(replace(v_definition, v_needle, ''))
    )
    / nullif(char_length(v_needle), 0);

  if v_actual_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = format(
        'postgrest_safe_conflict_occurrence_drift:public.publish_content_artifact_draft(uuid):1:%s',
        v_actual_count
      );
  end if;

  v_patched_definition := replace(v_definition, v_needle, v_replacement);

  if v_patched_definition ~
     'errcode[[:space:]]*=[[:space:]]*''40001''' then
    raise exception using
      errcode = 'P0001',
      message = 'postgrest_safe_conflict_unmapped_40001:public.publish_content_artifact_draft(uuid)';
  end if;

  execute v_patched_definition;
end;
$migration$;

do $migration$
declare
  v_helper oid :=
    to_regprocedure('public.raise_postgrest_safe_conflict_v1(text)');
  v_patched_count integer;
begin
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
    raise exception using
      errcode = 'P0001',
      message = format(
        'postgrest_safe_conflict_target_count_drift:11:%s',
        v_patched_count
      );
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
    raise exception using
      errcode = 'P0001',
      message = 'postgrest_safe_conflict_unsafe_40001_remains';
  end if;
end;
$migration$;
