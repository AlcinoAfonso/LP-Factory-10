begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2125000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e21.2.5-catalog-test@example.com',
  now(),
  now()
);

do $$
declare
  v_missing bigint;
begin
  with expected_models(modality, model) as (
    values
      ('responses_text', 'gpt-5.4-mini'),
      ('responses_text', 'gpt-5.6-luna'),
      ('responses_text', 'gpt-5.6-terra'),
      ('responses_text', 'gpt-5.6-sol'),
      ('image_generation', 'gpt-image-2')
  )
  select count(*)
  into v_missing
  from expected_models expected
  left join public.openai_model_catalog_models model
    on model.modality = expected.modality
    and model.model = expected.model
    and model.available_for_selection
    and model.catalog_version = 1
    and model.updated_by is null
  where model.model is null;

  if v_missing <> 0 then
    raise exception 'catalog model bootstrap is incomplete';
  end if;

  with expected_parameters(modality, model, parameter_kind, parameter_value) as (
    values
      ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'none'),
      ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'low'),
      ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'medium'),
      ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'high'),
      ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'xhigh'),
      ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'none'),
      ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'low'),
      ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'medium'),
      ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'high'),
      ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'xhigh'),
      ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'max'),
      ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'none'),
      ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'low'),
      ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'medium'),
      ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'high'),
      ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'xhigh'),
      ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'max'),
      ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'none'),
      ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'low'),
      ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'medium'),
      ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'high'),
      ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'xhigh'),
      ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'max'),
      ('image_generation', 'gpt-image-2', 'quality', 'low'),
      ('image_generation', 'gpt-image-2', 'quality', 'medium'),
      ('image_generation', 'gpt-image-2', 'quality', 'high')
  )
  select count(*)
  into v_missing
  from expected_parameters expected
  left join public.openai_model_catalog_parameters parameter
    on parameter.modality = expected.modality
    and parameter.model = expected.model
    and parameter.parameter_kind = expected.parameter_kind
    and parameter.parameter_value = expected.parameter_value
    and parameter.available_for_selection
    and parameter.catalog_version = 1
    and parameter.updated_by is null
  where parameter.parameter_value is null;

  if v_missing <> 0
     or (select count(*) from public.openai_model_catalog_models) <> 5
     or (select count(*) from public.openai_model_catalog_parameters) <> 26 then
    raise exception 'catalog parameter bootstrap is incomplete or contains drift';
  end if;

  if exists (
    select 1
    from public.openai_model_catalog_models model
    where not exists (
      select 1
      from public.openai_model_catalog_parameters parameter
      where parameter.modality = model.modality
        and parameter.model = model.model
    )
  ) then
    raise exception 'every catalog model must have at least one supported parameter';
  end if;
end;
$$;

set local role service_role;

do $$
declare
  v_actor_id constant uuid := 'e2125000-0000-4000-8000-000000000001';
  v_catalog_version bigint;
  v_parameter_count bigint;
begin
  begin
    perform *
    from public.add_openai_model_catalog_model_v1(
      'responses_text',
      'gpt-5.7-empty',
      'reasoning_effort',
      array[]::text[],
      v_actor_id
    );
    raise exception 'empty parameter set should have failed';
  exception when invalid_parameter_value then
    null;
  end;

  begin
    perform *
    from public.add_openai_model_catalog_model_v1(
      'responses_text',
      'gpt-5.7-duplicate',
      'reasoning_effort',
      array['low', 'low'],
      v_actor_id
    );
    raise exception 'duplicate parameter set should have failed';
  exception when invalid_parameter_value then
    null;
  end;

  select added.catalog_version, added.parameter_count
  into v_catalog_version, v_parameter_count
  from public.add_openai_model_catalog_model_v1(
    'responses_text',
    'gpt-5.7-test',
    'reasoning_effort',
    array['medium', 'low'],
    v_actor_id
  ) added;

  if v_catalog_version <> 1 or v_parameter_count <> 2 then
    raise exception 'add model RPC returned an invalid initial shape';
  end if;

  if not exists (
    select 1
    from public.openai_model_catalog_models model
    where model.modality = 'responses_text'
      and model.model = 'gpt-5.7-test'
      and not model.available_for_selection
      and model.catalog_version = 1
      and model.updated_by = v_actor_id
  )
  or (
    select count(*)
    from public.openai_model_catalog_parameters parameter
    where parameter.modality = 'responses_text'
      and parameter.model = 'gpt-5.7-test'
      and not parameter.available_for_selection
      and parameter.catalog_version = 1
      and parameter.updated_by = v_actor_id
  ) <> 2 then
    raise exception 'new model and parameters must start unavailable and audited';
  end if;

  begin
    insert into public.openai_model_catalog_parameters (
      modality,
      model,
      parameter_kind,
      parameter_value,
      updated_by
    )
    values (
      'responses_text',
      'gpt-5.7-test',
      'quality',
      'low',
      v_actor_id
    );
    raise exception 'cross-modality parameter shape should have failed';
  exception when check_violation then
    null;
  end;
end;
$$;

set constraints openai_model_catalog_model_has_parameter immediate;

do $$
declare
  v_actor_id constant uuid := 'e2125000-0000-4000-8000-000000000001';
  v_environment constant text := 'preview';
  v_workload constant text := 'niche_resolution';
  v_initial_active_revision_id uuid;
  v_initial_version bigint;
  v_initial_revision_count bigint;
  v_initial_activation_count bigint;
  v_version bigint;
  v_parameter_version bigint;
  v_model_version bigint;
  v_checked_version bigint;
  v_checked_modality text;
  v_checked_model text;
  v_checked_parameter_kind text;
  v_checked_parameter_value text;
  v_revision_count_before_race bigint;
  v_pending_revision_id uuid;
  v_pending_revision_number bigint;
begin
  select
    configuration.active_revision_id,
    configuration.configuration_version
  into
    v_initial_active_revision_id,
    v_initial_version
  from public.openai_workload_operational_configurations configuration
  where configuration.environment = v_environment
    and configuration.workload = v_workload;

  if not found then
    raise exception 'lifecycle fixture not found';
  end if;

  if exists (
    select 1
    from public.openai_workload_operational_configurations configuration
    where configuration.environment = v_environment
      and configuration.workload = v_workload
      and (
        configuration.pending_revision_id is not null
        or configuration.candidate_model is not null
      )
  ) then
    raise exception 'lifecycle fixture must start without candidate or pending revision';
  end if;

  select count(*) into v_initial_revision_count
  from public.openai_workload_configuration_revisions revision
  where revision.environment = v_environment
    and revision.workload = v_workload;

  select count(*) into v_initial_activation_count
  from public.openai_workload_configuration_activations activation
  where activation.environment = v_environment
    and activation.workload = v_workload;

  v_parameter_version := public.set_openai_model_catalog_parameter_availability_v1(
    'responses_text',
    'gpt-5.7-test',
    'reasoning_effort',
    'low',
    true,
    v_actor_id,
    1
  );

  if v_parameter_version <> 2 then
    raise exception 'parameter optimistic version did not advance';
  end if;

  begin
    perform public.save_openai_workload_configuration_candidate_v1(
      v_environment,
      v_workload,
      'gpt-5.7-test',
      'low',
      null,
      v_actor_id,
      v_initial_version
    );
    raise exception 'model-unavailable save should have failed';
  exception when invalid_parameter_value then
    null;
  end;

  if exists (
    select 1
    from public.openai_workload_operational_configurations configuration
    where configuration.environment = v_environment
      and configuration.workload = v_workload
      and (
        configuration.configuration_version <> v_initial_version
        or configuration.candidate_model is not null
      )
  ) then
    raise exception 'failed save changed lifecycle state';
  end if;

  v_model_version := public.set_openai_model_catalog_model_availability_v1(
    'responses_text',
    'gpt-5.7-test',
    true,
    v_actor_id,
    1
  );

  if v_model_version <> 2 then
    raise exception 'model optimistic version did not advance';
  end if;

  begin
    perform public.set_openai_model_catalog_model_availability_v1(
      'responses_text',
      'gpt-5.7-test',
      false,
      v_actor_id,
      1
    );
    raise exception 'stale model availability update should have failed';
  exception when serialization_failure then
    null;
  end;

  v_version := public.save_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    'gpt-5.7-test',
    'low',
    null,
    v_actor_id,
    v_initial_version
  );

  select
    checked.configuration_version,
    checked.candidate_modality,
    checked.candidate_model,
    checked.candidate_parameter_kind,
    checked.candidate_parameter_value
  into
    v_checked_version,
    v_checked_modality,
    v_checked_model,
    v_checked_parameter_kind,
    v_checked_parameter_value
  from public.check_openai_model_catalog_configuration_available_v1(
    v_environment,
    v_workload,
    v_version
  ) checked;

  if v_checked_version <> v_version
     or v_checked_modality <> 'responses_text'
     or v_checked_model <> 'gpt-5.7-test'
     or v_checked_parameter_kind <> 'reasoning_effort'
     or v_checked_parameter_value <> 'low' then
    raise exception 'proof preflight RPC returned an invalid candidate snapshot';
  end if;

  select count(*) into v_revision_count_before_race
  from public.openai_workload_configuration_revisions revision
  where revision.environment = v_environment
    and revision.workload = v_workload;

  -- Race order A: unavailability serializes before promotion. Promotion must
  -- observe the unavailable parameter and leave candidate/history untouched.
  v_parameter_version := public.set_openai_model_catalog_parameter_availability_v1(
    'responses_text',
    'gpt-5.7-test',
    'reasoning_effort',
    'low',
    false,
    v_actor_id,
    v_parameter_version
  );

  begin
    perform 1
    from public.check_openai_model_catalog_configuration_available_v1(
      v_environment,
      v_workload,
      v_version
    );
    raise exception 'proof preflight should fail closed after unavailability';
  exception when invalid_parameter_value then
    null;
  end;

  begin
    perform 1
    from public.promote_openai_workload_configuration_candidate_v1(
      v_environment,
      v_workload,
      jsonb_build_object(
        'schema_version', 1,
        'proof_kind', 'operational',
        'proof_result', 'approved',
        'source', 'openai_api'
      ),
      v_actor_id,
      v_version
    );
    raise exception 'unavailability-before-promotion should have failed';
  exception when invalid_parameter_value then
    null;
  end;

  if (
    select count(*)
    from public.openai_workload_configuration_revisions revision
    where revision.environment = v_environment
      and revision.workload = v_workload
  ) <> v_revision_count_before_race
  or not exists (
    select 1
    from public.openai_workload_operational_configurations configuration
    where configuration.environment = v_environment
      and configuration.workload = v_workload
      and configuration.configuration_version = v_version
      and configuration.candidate_model = 'gpt-5.7-test'
      and configuration.pending_revision_id is null
  ) then
    raise exception 'unavailability-before-promotion produced a partial revision';
  end if;

  v_parameter_version := public.set_openai_model_catalog_parameter_availability_v1(
    'responses_text',
    'gpt-5.7-test',
    'reasoning_effort',
    'low',
    true,
    v_actor_id,
    v_parameter_version
  );

  -- Race order B: promotion serializes before unavailability. The validated
  -- pending revision must remain activatable and rollback must remain possible.
  select
    promoted.candidate_revision_id,
    promoted.candidate_revision_number,
    promoted.configuration_version
  into
    v_pending_revision_id,
    v_pending_revision_number,
    v_version
  from public.promote_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    jsonb_build_object(
      'schema_version', 1,
      'proof_kind', 'operational',
      'proof_result', 'approved',
      'source', 'openai_api'
    ),
    v_actor_id,
    v_version
  ) promoted;

  v_model_version := public.set_openai_model_catalog_model_availability_v1(
    'responses_text',
    'gpt-5.7-test',
    false,
    v_actor_id,
    v_model_version
  );

  if v_pending_revision_id is null
     or v_pending_revision_number <= 1
     or not exists (
       select 1
       from public.openai_workload_operational_configurations configuration
       where configuration.environment = v_environment
         and configuration.workload = v_workload
         and configuration.pending_revision_id = v_pending_revision_id
     ) then
    raise exception 'promotion-before-unavailability did not preserve the pending revision';
  end if;

  v_version := public.activate_openai_workload_configuration_revision_v1(
    v_environment,
    v_workload,
    v_pending_revision_id,
    v_actor_id,
    v_version
  );

  v_version := public.rollback_openai_workload_configuration_revision_v1(
    v_environment,
    v_workload,
    v_initial_active_revision_id,
    v_actor_id,
    v_version
  );

  if not exists (
    select 1
    from public.openai_workload_operational_configurations configuration
    where configuration.environment = v_environment
      and configuration.workload = v_workload
      and configuration.active_revision_id = v_initial_active_revision_id
      and configuration.pending_revision_id is null
      and configuration.candidate_model is null
      and configuration.configuration_version = v_version
  )
  or (
    select count(*)
    from public.openai_workload_configuration_revisions revision
    where revision.environment = v_environment
      and revision.workload = v_workload
  ) <> v_initial_revision_count + 1
  or (
    select count(*)
    from public.openai_workload_configuration_activations activation
    where activation.environment = v_environment
      and activation.workload = v_workload
  ) <> v_initial_activation_count + 2 then
    raise exception 'catalog unavailability changed active/history/rollback semantics';
  end if;
end;
$$;

reset role;

do $$
begin
  begin
    delete from public.openai_model_catalog_parameters
    where modality = 'responses_text'
      and model = 'gpt-5.7-test'
      and parameter_kind = 'reasoning_effort'
      and parameter_value = 'medium';
    raise exception 'catalog parameter delete should have failed';
  exception when sqlstate '55000' then
    null;
  end;

  begin
    delete from public.openai_model_catalog_models
    where modality = 'responses_text'
      and model = 'gpt-5.7-test';
    raise exception 'catalog model delete should have failed';
  exception when sqlstate '55000' then
    null;
  end;
end;
$$;

do $$
declare
  v_revision_shape text;
  v_candidate_shape text;
  v_save_definition text;
  v_promote_definition text;
  v_parameter_definition text;
  v_check_definition text;
begin
  select pg_get_constraintdef(constraint_row.oid)
  into v_revision_shape
  from pg_constraint constraint_row
  where constraint_row.conname = 'openai_workload_configuration_revisions_shape_chk'
    and constraint_row.conrelid = 'public.openai_workload_configuration_revisions'::regclass;

  select pg_get_constraintdef(constraint_row.oid)
  into v_candidate_shape
  from pg_constraint constraint_row
  where constraint_row.conname = 'openai_workload_operational_configurations_candidate_completeness_chk'
    and constraint_row.conrelid = 'public.openai_workload_operational_configurations'::regclass;

  if v_revision_shape is null
     or v_candidate_shape is null
     or v_revision_shape ~ 'gpt-[0-9]'
     or v_candidate_shape ~ 'gpt-[0-9]'
     or v_revision_shape not ilike '%reasoning_effort%max%'
     or v_revision_shape not ilike '%quality%high%'
     or v_candidate_shape not ilike '%candidate_reasoning_effort%max%'
     or v_candidate_shape not ilike '%candidate_quality%high%' then
    raise exception 'lifecycle constraints must validate typed shape without model allowlists';
  end if;

  v_save_definition := lower(pg_get_functiondef(
    'public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)'::regprocedure
  ));
  v_promote_definition := lower(pg_get_functiondef(
    'public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)'::regprocedure
  ));
  v_parameter_definition := lower(pg_get_functiondef(
    'public.set_openai_model_catalog_parameter_availability_v1(text,text,text,text,boolean,uuid,bigint)'::regprocedure
  ));
  v_check_definition := lower(pg_get_functiondef(
    'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)'::regprocedure
  ));

  if strpos(v_save_definition, 'from public.openai_workload_operational_configurations') = 0
     or strpos(v_save_definition, 'from public.openai_model_catalog_models') = 0
     or strpos(v_save_definition, 'from public.openai_model_catalog_parameters') = 0
     or strpos(v_save_definition, 'from public.openai_workload_operational_configurations')
        >= strpos(v_save_definition, 'from public.openai_model_catalog_models')
     or strpos(v_save_definition, 'from public.openai_model_catalog_models')
        >= strpos(v_save_definition, 'from public.openai_model_catalog_parameters')
     or (length(v_save_definition) - length(replace(v_save_definition, 'for update', ''))) / 10 <> 3 then
    raise exception 'save lock order must be unit -> model -> parameter';
  end if;

  if strpos(v_promote_definition, 'from public.openai_workload_operational_configurations') = 0
     or strpos(v_promote_definition, 'from public.openai_model_catalog_models') = 0
     or strpos(v_promote_definition, 'from public.openai_model_catalog_parameters') = 0
     or strpos(v_promote_definition, 'from public.openai_workload_operational_configurations')
        >= strpos(v_promote_definition, 'from public.openai_model_catalog_models')
     or strpos(v_promote_definition, 'from public.openai_model_catalog_models')
        >= strpos(v_promote_definition, 'from public.openai_model_catalog_parameters')
     or (length(v_promote_definition) - length(replace(v_promote_definition, 'for update', ''))) / 10 <> 3 then
    raise exception 'promotion lock order must be unit -> model -> parameter';
  end if;

  if strpos(v_parameter_definition, 'from public.openai_model_catalog_models') = 0
     or strpos(v_parameter_definition, 'from public.openai_model_catalog_parameters') = 0
     or strpos(v_parameter_definition, 'from public.openai_model_catalog_models')
        >= strpos(v_parameter_definition, 'from public.openai_model_catalog_parameters')
     or (length(v_parameter_definition) - length(replace(v_parameter_definition, 'for update', ''))) / 10 <> 2 then
    raise exception 'parameter mutation lock order must be model -> parameter';
  end if;

  if v_check_definition like '%for update%'
     or v_check_definition not like '%left join public.openai_model_catalog_models%'
     or v_check_definition not like '%left join public.openai_model_catalog_parameters%'
     or (
       select proc.provolatile
       from pg_proc proc
       where proc.oid = 'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)'::regprocedure
     ) <> 's' then
    raise exception 'proof preflight must be stable, atomic and lock-free';
  end if;
end;
$$;

do $$
declare
  v_signature text;
  v_proc_oid oid;
begin
  if exists (
    select 1
    from pg_class target
    where target.oid in (
      'public.openai_model_catalog_models'::regclass,
      'public.openai_model_catalog_parameters'::regclass
    )
      and not target.relrowsecurity
  ) then
    raise exception 'RLS must be enabled on both catalog tables';
  end if;

  if exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename in (
        'openai_model_catalog_models',
        'openai_model_catalog_parameters'
      )
  ) then
    raise exception 'catalog tables must have zero RLS policies';
  end if;

  if (
    select count(*)
    from pg_class target
    cross join lateral aclexplode(coalesce(target.relacl, acldefault('r', target.relowner))) acl
    join pg_roles grantee on grantee.oid = acl.grantee
    where target.oid in (
      'public.openai_model_catalog_models'::regclass,
      'public.openai_model_catalog_parameters'::regclass
    )
      and grantee.rolname = 'service_role'
      and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
      and not acl.is_grantable
  ) <> 6
  or exists (
    select 1
    from pg_class target
    cross join lateral aclexplode(coalesce(target.relacl, acldefault('r', target.relowner))) acl
    where target.oid in (
      'public.openai_model_catalog_models'::regclass,
      'public.openai_model_catalog_parameters'::regclass
    )
      and acl.grantee <> target.relowner
      and (
        acl.grantee <> 'service_role'::regrole
        or acl.privilege_type not in ('SELECT', 'INSERT', 'UPDATE')
        or acl.is_grantable
      )
  ) then
    raise exception 'catalog table ACLs must be exact for service_role';
  end if;

  foreach v_signature in array array[
    'public.add_openai_model_catalog_model_v1(text,text,text,text[],uuid)',
    'public.set_openai_model_catalog_model_availability_v1(text,text,boolean,uuid,bigint)',
    'public.set_openai_model_catalog_parameter_availability_v1(text,text,text,text,boolean,uuid,bigint)',
    'public.check_openai_model_catalog_configuration_available_v1(text,text,bigint)',
    'public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)',
    'public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)'
  ]
  loop
    v_proc_oid := to_regprocedure(v_signature);

    if v_proc_oid is null
       or (
         select count(*)
         from pg_proc proc
         cross join lateral aclexplode(coalesce(proc.proacl, acldefault('f', proc.proowner))) acl
         where proc.oid = v_proc_oid
           and acl.grantee = 'service_role'::regrole
           and acl.privilege_type = 'EXECUTE'
           and not acl.is_grantable
       ) <> 1
       or exists (
         select 1
         from pg_proc proc
         cross join lateral aclexplode(coalesce(proc.proacl, acldefault('f', proc.proowner))) acl
         where proc.oid = v_proc_oid
           and acl.grantee <> proc.proowner
           and (
             acl.grantee <> 'service_role'::regrole
             or acl.privilege_type <> 'EXECUTE'
             or acl.is_grantable
           )
       )
       or exists (
         select 1
         from pg_proc proc
         where proc.oid = v_proc_oid
           and (
             proc.prosecdef
             or not coalesce(proc.proconfig @> array['search_path=pg_catalog'], false)
           )
       ) then
      raise exception 'RPC ACL/security mismatch for %', v_signature;
    end if;
  end loop;

  foreach v_signature in array array[
    'public.prevent_openai_model_catalog_delete_v1()',
    'public.assert_openai_model_catalog_model_has_parameter_v1()'
  ]
  loop
    v_proc_oid := to_regprocedure(v_signature);
    if v_proc_oid is null
       or exists (
         select 1
         from pg_proc proc
         cross join lateral aclexplode(coalesce(proc.proacl, acldefault('f', proc.proowner))) acl
         where proc.oid = v_proc_oid
           and acl.grantee <> proc.proowner
       ) then
      raise exception 'trigger helper must not be directly executable: %', v_signature;
    end if;
  end loop;

  if (
    select count(*)
    from pg_trigger trigger_row
    where trigger_row.tgrelid in (
      'public.openai_model_catalog_models'::regclass,
      'public.openai_model_catalog_parameters'::regclass
    )
      and not trigger_row.tgisinternal
      and trigger_row.tgenabled <> 'D'
      and trigger_row.tgname in (
        'openai_model_catalog_models_prevent_delete',
        'openai_model_catalog_parameters_prevent_delete',
        'openai_model_catalog_model_has_parameter'
      )
  ) <> 3 then
    raise exception 'catalog delete/completeness triggers are missing or disabled';
  end if;
end;
$$;

rollback;
