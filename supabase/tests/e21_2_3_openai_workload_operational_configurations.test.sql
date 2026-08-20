begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2123000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e21.2.3-test@example.com',
  now(),
  now()
);

do $$
declare
  v_actor_id constant uuid := 'e2123000-0000-4000-8000-000000000001';
  v_environment constant text := 'preview';
  v_workload constant text := 'niche_resolution';
  v_initial_active_revision_id uuid;
  v_initial_version bigint;
  v_version bigint;
  v_candidate_revision_id uuid;
  v_candidate_revision_number bigint;
  v_revision_count bigint;
  v_activation_count bigint;
  v_cross_unit_revision_id uuid;
begin
  if (select count(*) from public.openai_workload_operational_configurations) <> 8
     or (
       select count(*)
       from public.openai_workload_configuration_revisions
       where revision_number = 1
     ) <> 8
     or (
       select count(*)
       from public.openai_workload_configuration_activations
       where event_type = 'bootstrap'
     ) <> 8 then
    raise exception 'bootstrap must contain exactly eight units, revisions and events';
  end if;

  if exists (
    with expected(environment, workload, model, reasoning_effort, quality) as (
      values
        ('production', 'niche_resolution', 'gpt-5.4-mini', 'none', null::text),
        ('preview', 'niche_resolution', 'gpt-5.4-mini', 'none', null::text),
        ('production', 'commercial_activation_draft_generation', 'gpt-5.4-mini', 'none', null::text),
        ('preview', 'commercial_activation_draft_generation', 'gpt-5.4-mini', 'none', null::text),
        ('production', 'landing_page_draft_generation', 'gpt-5.6-luna', 'max', null::text),
        ('preview', 'landing_page_draft_generation', 'gpt-5.6-luna', 'max', null::text),
        ('production', 'landing_page_draft_image_generation', 'gpt-image-2', null::text, 'medium'),
        ('preview', 'landing_page_draft_image_generation', 'gpt-image-2', null::text, 'medium')
    )
    select 1
    from expected
    left join public.openai_workload_configuration_revisions revision
      on revision.environment = expected.environment
      and revision.workload = expected.workload
      and revision.revision_number = 1
      and revision.model = expected.model
      and revision.reasoning_effort is not distinct from expected.reasoning_effort
      and revision.quality is not distinct from expected.quality
    left join public.openai_workload_operational_configurations configuration
      on configuration.environment = expected.environment
      and configuration.workload = expected.workload
      and configuration.active_revision_id = revision.id
    where revision.id is null
      or configuration.active_revision_id is null
  ) then
    raise exception 'bootstrap baseline values must match the approved eight configurations';
  end if;

  select
    configuration.active_revision_id,
    configuration.configuration_version
  into
    v_initial_active_revision_id,
    v_initial_version
  from public.openai_workload_operational_configurations configuration
  where configuration.environment = v_environment
    and configuration.workload = v_workload;

  v_version := public.save_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    'gpt-5.6-luna',
    'max',
    null,
    v_actor_id,
    v_initial_version
  );

  if v_version <> v_initial_version + 1 then
    raise exception 'candidate save must increment the optimistic token once';
  end if;

  begin
    perform public.save_openai_workload_configuration_candidate_v1(
      v_environment,
      v_workload,
      'gpt-5.4-mini',
      'low',
      null,
      v_actor_id,
      v_initial_version
    );
    raise exception 'stale candidate update should have failed';
  exception when serialization_failure then
    null;
  end;

  if (
    select configuration_version
    from public.openai_workload_operational_configurations
    where environment = v_environment
      and workload = v_workload
  ) <> v_version then
    raise exception 'stale candidate update must not alter the aggregate';
  end if;

  v_version := public.save_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    'gpt-5.6-luna',
    'high',
    null,
    v_actor_id,
    v_version
  );

  v_version := public.discard_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    v_actor_id,
    v_version
  );

  if exists (
    select 1
    from public.openai_workload_operational_configurations
    where environment = v_environment
      and workload = v_workload
      and (
        candidate_model is not null
        or candidate_reasoning_effort is not null
        or candidate_quality is not null
        or candidate_saved_by is not null
        or candidate_saved_at is not null
      )
  ) then
    raise exception 'candidate discard must clear the complete mutable candidate';
  end if;

  v_version := public.save_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    'gpt-5.6-luna',
    'max',
    null,
    v_actor_id,
    v_version
  );

  begin
    perform 1
    from public.promote_openai_workload_configuration_candidate_v1(
      v_environment,
      v_workload,
      '{"schema_version":1,"proof_kind":"operational","proof_result":"approved","secret":"forbidden"}'::jsonb,
      v_actor_id,
      v_version
    );
    raise exception 'unsafe proof metadata should have failed';
  exception when invalid_parameter_value then
    null;
  end;

  select
    promoted.candidate_revision_id,
    promoted.candidate_revision_number,
    promoted.configuration_version
  into
    v_candidate_revision_id,
    v_candidate_revision_number,
    v_version
  from public.promote_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    jsonb_build_object(
      'schema_version', 1,
      'proof_kind', 'operational',
      'proof_result', 'approved',
      'request_id', 'e21-2-3-sql-test',
      'latency_ms', 1,
      'contract_version', 1
    ),
    v_actor_id,
    v_version
  ) promoted;

  if v_candidate_revision_number <> 2
     or not exists (
       select 1
       from public.openai_workload_operational_configurations configuration
       where configuration.environment = v_environment
         and configuration.workload = v_workload
         and configuration.pending_revision_id = v_candidate_revision_id
         and configuration.candidate_model is null
     ) then
    raise exception 'promotion must append revision 2 and install it as the sole pending substitution';
  end if;

  begin
    update public.openai_workload_operational_configurations
    set
      candidate_model = 'gpt-5.4-mini',
      candidate_reasoning_effort = 'none',
      candidate_saved_by = v_actor_id,
      candidate_saved_at = now()
    where environment = v_environment
      and workload = v_workload;
    raise exception 'candidate and validated pending revision should be mutually exclusive';
  exception when check_violation then
    null;
  end;

  v_version := public.activate_openai_workload_configuration_revision_v1(
    v_environment,
    v_workload,
    v_candidate_revision_id,
    v_actor_id,
    v_version
  );

  if not exists (
    select 1
    from public.openai_workload_operational_configurations configuration
    where configuration.environment = v_environment
      and configuration.workload = v_workload
      and configuration.active_revision_id = v_candidate_revision_id
      and configuration.pending_revision_id is null
  ) then
    raise exception 'activation must atomically select the pending revision and clear pending state';
  end if;

  v_version := public.rollback_openai_workload_configuration_revision_v1(
    v_environment,
    v_workload,
    v_initial_active_revision_id,
    v_actor_id,
    v_version
  );

  if v_version <> v_initial_version + 7
     or not exists (
       select 1
       from public.openai_workload_operational_configurations configuration
       where configuration.environment = v_environment
         and configuration.workload = v_workload
         and configuration.active_revision_id = v_initial_active_revision_id
         and configuration.pending_revision_id is null
     ) then
    raise exception 'rollback must reactivate the prior revision with the expected token progression';
  end if;

  select count(*)
  into v_revision_count
  from public.openai_workload_configuration_revisions
  where environment = v_environment
    and workload = v_workload;

  select count(*)
  into v_activation_count
  from public.openai_workload_configuration_activations
  where environment = v_environment
    and workload = v_workload;

  if v_revision_count <> 2 or v_activation_count <> 3 then
    raise exception 'lifecycle must preserve two revisions and three ordered activation events';
  end if;

  if exists (
    with chain as (
      select
        activation.*,
        lag(activation.target_revision_id) over (
          partition by activation.environment, activation.workload
          order by activation.activation_number
        ) as expected_previous_revision_id
      from public.openai_workload_configuration_activations activation
      where activation.environment = v_environment
        and activation.workload = v_workload
    )
    select 1
    from chain
    where activation_number = 1
      and (event_type <> 'bootstrap' or actor_user_id is not null)
      or activation_number > 1
      and (
        actor_user_id is null
        or previous_revision_id is distinct from expected_previous_revision_id
      )
  ) then
    raise exception 'activation events must reconstruct the complete ordered lifecycle';
  end if;

  begin
    update public.openai_workload_configuration_revisions
    set model = 'gpt-5.4-mini'
    where id = v_candidate_revision_id;
    raise exception 'validated revision update should have failed';
  exception when object_not_in_prerequisite_state then
    null;
  end;

  begin
    delete from public.openai_workload_configuration_revisions
    where id = v_candidate_revision_id;
    raise exception 'validated revision delete should have failed';
  exception when object_not_in_prerequisite_state then
    null;
  end;

  begin
    update public.openai_workload_configuration_activations
    set event_type = 'activate'
    where environment = v_environment
      and workload = v_workload
      and activation_number = 3;
    raise exception 'activation event update should have failed';
  exception when object_not_in_prerequisite_state then
    null;
  end;

  begin
    delete from public.openai_workload_configuration_activations
    where environment = v_environment
      and workload = v_workload
      and activation_number = 3;
    raise exception 'activation event delete should have failed';
  exception when object_not_in_prerequisite_state then
    null;
  end;

  select revision.id
  into v_cross_unit_revision_id
  from public.openai_workload_configuration_revisions revision
  where revision.environment = 'production'
    and revision.workload = v_workload
    and revision.revision_number = 1;

  begin
    update public.openai_workload_operational_configurations
    set pending_revision_id = v_cross_unit_revision_id
    where environment = v_environment
      and workload = v_workload;
    raise exception 'cross-unit pending revision should have failed';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.openai_workload_configuration_revisions (
      environment,
      workload,
      modality,
      revision_number,
      model,
      reasoning_effort,
      quality,
      validated_by,
      proof_metadata
    ) values (
      'preview',
      'landing_page_draft_image_generation',
      'image_generation',
      999,
      'gpt-5.4-mini',
      'none',
      null,
      v_actor_id,
      '{"schema_version":1,"proof_kind":"operational","proof_result":"approved"}'::jsonb
    );
    raise exception 'cross-modality revision should have failed';
  exception when check_violation then
    null;
  end;
end;
$$;

set local role service_role;

do $$
begin
  begin
    update public.openai_workload_operational_configurations
    set
      pending_revision_id = active_revision_id,
      configuration_version = configuration_version + 1,
      updated_at = now()
    where environment = 'preview'
      and workload = 'niche_resolution';

    raise exception 'service_role direct DML should not allow active revision as pending';
  exception when check_violation then
    null;
  end;

  if exists (
    select 1
    from public.openai_workload_operational_configurations configuration
    where configuration.pending_revision_id is not null
      and configuration.pending_revision_id = configuration.active_revision_id
  ) then
    raise exception 'active revision persisted as pending after rejected direct DML';
  end if;
end;
$$;

reset role;

do $$
declare
  v_signature text;
begin
  if exists (
    select 1
    from pg_class target
    where target.oid in (
      'public.openai_workload_operational_configurations'::regclass,
      'public.openai_workload_configuration_revisions'::regclass,
      'public.openai_workload_configuration_activations'::regclass
    )
      and not target.relrowsecurity
  ) then
    raise exception 'RLS must be enabled on all three public tables';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'openai_workload_operational_configurations',
        'openai_workload_configuration_revisions',
        'openai_workload_configuration_activations'
      )
  ) then
    raise exception 'the three public tables must not have permissive RLS policies';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in (
        'openai_workload_operational_configurations',
        'openai_workload_configuration_revisions',
        'openai_workload_configuration_activations'
      )
      and lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
  ) then
    raise exception 'unprivileged roles must not receive direct table grants';
  end if;

  if not has_table_privilege(
    'service_role',
    'public.openai_workload_operational_configurations',
    'SELECT'
  )
  or not has_column_privilege(
    'service_role',
    'public.openai_workload_operational_configurations',
    'pending_revision_id',
    'UPDATE'
  )
  or has_table_privilege(
    'service_role',
    'public.openai_workload_operational_configurations',
    'INSERT,DELETE,TRUNCATE'
  )
  or not has_table_privilege(
    'service_role',
    'public.openai_workload_configuration_revisions',
    'SELECT,INSERT'
  )
  or has_table_privilege(
    'service_role',
    'public.openai_workload_configuration_revisions',
    'UPDATE,DELETE,TRUNCATE'
  )
  or not has_table_privilege(
    'service_role',
    'public.openai_workload_configuration_activations',
    'SELECT,INSERT'
  )
  or has_table_privilege(
    'service_role',
    'public.openai_workload_configuration_activations',
    'UPDATE,DELETE,TRUNCATE'
  ) then
    raise exception 'service_role table grants must remain minimal and append-only';
  end if;

  foreach v_signature in array array[
    'public.save_openai_workload_configuration_candidate_v1(text,text,text,text,text,uuid,bigint)',
    'public.discard_openai_workload_configuration_candidate_v1(text,text,uuid,bigint)',
    'public.promote_openai_workload_configuration_candidate_v1(text,text,jsonb,uuid,bigint)',
    'public.activate_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)',
    'public.rollback_openai_workload_configuration_revision_v1(text,text,uuid,uuid,bigint)'
  ]
  loop
    if to_regprocedure(v_signature) is null
       or not has_function_privilege('service_role', v_signature, 'EXECUTE')
       or has_function_privilege('anon', v_signature, 'EXECUTE')
       or has_function_privilege('authenticated', v_signature, 'EXECUTE')
       or exists (
         select 1
         from pg_proc proc
         where proc.oid = to_regprocedure(v_signature)
           and (
             proc.prosecdef
             or not coalesce(proc.proconfig @> array['search_path=pg_catalog'], false)
           )
       ) then
      raise exception 'RPC security mismatch for %', v_signature;
    end if;
  end loop;
end;
$$;

rollback;
