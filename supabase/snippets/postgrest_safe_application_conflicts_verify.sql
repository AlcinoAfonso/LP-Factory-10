with expected_functions(signature) as (
  values
    ('public.activate_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)'),
    ('public.append_account_landing_page_materialization_v2(uuid,uuid,uuid,jsonb,jsonb,uuid,bigint,bigint)'),
    ('public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)'),
    ('public.discard_openai_workload_configuration_candidate_v1(text,text,uuid,bigint)'),
    ('public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)'),
    ('public.publish_content_artifact_draft(uuid)'),
    ('public.rollback_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)'),
    ('public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid,uuid)'),
    ('public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)'),
    ('public.set_openai_model_catalog_model_availability_v1(text,text,boolean,uuid,bigint)'),
    ('public.set_openai_model_catalog_parameter_availability_v1(text,text,text,text,boolean,uuid,bigint)')
),
resolved_functions as (
  select
    expected.signature,
    to_regprocedure(expected.signature) as function_oid
  from expected_functions expected
),
helper as (
  select
    function_object.oid,
    pg_get_userbyid(function_object.proowner) as owner_name,
    function_object.prosecdef,
    function_object.provolatile,
    pg_get_functiondef(function_object.oid) as definition
  from pg_proc function_object
  where function_object.oid =
    to_regprocedure('public.raise_postgrest_safe_conflict_v1(text)')
),
checks as (
  select
    'helper_contract'::text as check_name,
    case when
      count(*) = 1
      and bool_and(helper.owner_name = 'postgres')
      and bool_and(not helper.prosecdef)
      and bool_and(helper.provolatile = 's')
      and bool_and(
        helper.definition ilike '%set search_path to ''pg_catalog''%'
      )
      and has_function_privilege(
        'service_role',
        'public.raise_postgrest_safe_conflict_v1(text)',
        'EXECUTE'
      )
      and not has_function_privilege(
        'authenticated',
        'public.raise_postgrest_safe_conflict_v1(text)',
        'EXECUTE'
      )
      and not has_function_privilege(
        'anon',
        'public.raise_postgrest_safe_conflict_v1(text)',
        'EXECUTE'
      )
      and (
        to_regrole('ai_readonly') is null
        or not has_function_privilege(
          'ai_readonly',
          'public.raise_postgrest_safe_conflict_v1(text)',
          'EXECUTE'
        )
      )
    then 'ok' else 'invalid' end as status,
    jsonb_build_object(
      'helper_exists', count(*) = 1,
      'owner', max(helper.owner_name),
      'security_definer', bool_or(helper.prosecdef),
      'volatility', max(helper.provolatile::text)
    ) as details
  from helper

  union all

  select
    'target_functions',
    case when
      count(*) = 11
      and count(function_oid) = 11
      and count(*) filter (
        where function_oid is not null
          and (
            select function_object.prosrc
            from pg_proc function_object
            where function_object.oid = resolved.function_oid
          ) like '%public.raise_postgrest_safe_conflict_v1(%'
      ) = 11
    then 'ok' else 'invalid' end,
    jsonb_build_object(
      'expected', count(*),
      'resolved', count(function_oid),
      'patched', count(*) filter (
        where function_oid is not null
          and (
            select function_object.prosrc
            from pg_proc function_object
            where function_object.oid = resolved.function_oid
          ) like '%public.raise_postgrest_safe_conflict_v1(%'
      ),
      'missing', coalesce(
        jsonb_agg(resolved.signature order by resolved.signature)
          filter (where function_oid is null),
        '[]'::jsonb
      )
    )
  from resolved_functions resolved

  union all

  select
    'unsafe_application_40001',
    case when count(*) = 0 then 'ok' else 'unsafe' end,
    jsonb_build_object(
      'remaining_count', count(*),
      'functions', coalesce(
        jsonb_agg(
          format(
            '%I.%I(%s)',
            function_schema.nspname,
            function_object.proname,
            pg_get_function_identity_arguments(function_object.oid)
          )
          order by function_schema.nspname,
            function_object.proname,
            pg_get_function_identity_arguments(function_object.oid)
        ),
        '[]'::jsonb
      )
    )
  from pg_proc function_object
  join pg_namespace function_schema
    on function_schema.oid = function_object.pronamespace
  where function_schema.nspname = 'public'
    and function_object.oid <>
      to_regprocedure('public.raise_postgrest_safe_conflict_v1(text)')
    and function_object.prosrc ~
      'errcode[[:space:]]*=[[:space:]]*''40001'''

  union all

  select
    'migration_recorded',
    case when exists (
      select 1
      from supabase_migrations.schema_migrations migration
      where migration.version = '20260827203000'
    ) then 'ok' else 'missing' end,
    jsonb_build_object(
      'version', '20260827203000',
      'recorded', exists (
        select 1
        from supabase_migrations.schema_migrations migration
        where migration.version = '20260827203000'
      )
    )
)
select check_name, status, details
from checks
order by check_name;
