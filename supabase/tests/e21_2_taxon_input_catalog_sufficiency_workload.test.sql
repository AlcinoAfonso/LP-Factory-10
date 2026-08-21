begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2065000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e20.6.5-workload-test@example.com',
  now(),
  now()
);

do $$
declare
  v_actor_id constant uuid := 'e2065000-0000-4000-8000-000000000001';
  v_environment constant text := 'preview';
  v_workload constant text := 'taxon_input_catalog_sufficiency_evaluation';
  v_initial_version bigint;
  v_saved_version bigint;
  v_promoted_version bigint;
  v_revision_id uuid;
  v_revision_number bigint;
begin
  if (
    select count(*)
    from public.openai_workload_operational_configurations
    where workload = v_workload
  ) <> 2 then
    raise exception 'new workload bootstrap must contain production and preview units';
  end if;

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
      v_workload,
      'responses_text',
      999,
      'gpt-5.6-terra',
      null,
      null,
      null,
      '{"schema_version":1,"proof_kind":"bootstrap","proof_result":"approved","source":"repo_catalog"}'::jsonb
    );
    raise exception 'text revision with NULL reasoning_effort should have failed';
  exception when check_violation then
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
      'gpt-image-2',
      null,
      null,
      null,
      '{"schema_version":1,"proof_kind":"bootstrap","proof_result":"approved","source":"repo_catalog"}'::jsonb
    );
    raise exception 'image revision with NULL quality should have failed';
  exception when check_violation then
    null;
  end;

  begin
    update public.openai_workload_operational_configurations
    set
      candidate_model = 'gpt-5.6-terra',
      candidate_reasoning_effort = null,
      candidate_quality = null,
      candidate_saved_by = v_actor_id,
      candidate_saved_at = now()
    where environment = v_environment
      and workload = v_workload;
    raise exception 'text candidate with NULL reasoning_effort should have failed';
  exception when check_violation then
    null;
  end;

  begin
    update public.openai_workload_operational_configurations
    set
      candidate_model = 'gpt-image-2',
      candidate_reasoning_effort = null,
      candidate_quality = null,
      candidate_saved_by = v_actor_id,
      candidate_saved_at = now()
    where environment = v_environment
      and workload = 'landing_page_draft_image_generation';
    raise exception 'image candidate with NULL quality should have failed';
  exception when check_violation then
    null;
  end;

  select configuration.configuration_version
  into v_initial_version
  from public.openai_workload_operational_configurations configuration
  where configuration.environment = v_environment
    and configuration.workload = v_workload;

  begin
    perform public.save_openai_workload_configuration_candidate_v1(
      v_environment,
      v_workload,
      'gpt-5.6-terra',
      'medium',
      null,
      v_actor_id,
      v_initial_version
    );
    raise exception 'terra with non-low effort should have failed';
  exception when invalid_parameter_value then
    null;
  end;

  begin
    perform public.save_openai_workload_configuration_candidate_v1(
      v_environment,
      v_workload,
      'gpt-5.6-luna',
      'low',
      null,
      v_actor_id,
      v_initial_version
    );
    raise exception 'an alternate model should have failed';
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
    raise exception 'rejected candidates must not mutate the aggregate';
  end if;

  v_saved_version := public.save_openai_workload_configuration_candidate_v1(
    v_environment,
    v_workload,
    'gpt-5.6-terra',
    'low',
    null,
    v_actor_id,
    v_initial_version
  );

  if v_saved_version <> v_initial_version + 1 then
    raise exception 'candidate save must advance the common lifecycle version';
  end if;

  select
    candidate_revision_id,
    candidate_revision_number,
    configuration_version
  into
    v_revision_id,
    v_revision_number,
    v_promoted_version
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
    v_saved_version
  );

  if v_promoted_version <> v_saved_version + 1
     or v_revision_number <> 2 then
    raise exception 'candidate promotion must append revision two and advance the version';
  end if;

  if not exists (
    select 1
    from public.openai_workload_configuration_revisions revision
    join public.openai_workload_operational_configurations configuration
      on configuration.pending_revision_id = revision.id
      and configuration.environment = revision.environment
      and configuration.workload = revision.workload
    where revision.id = v_revision_id
      and revision.environment = v_environment
      and revision.workload = v_workload
      and revision.model = 'gpt-5.6-terra'
      and revision.reasoning_effort = 'low'
      and revision.quality is null
  ) then
    raise exception 'promoted terra low revision must become the pending revision of the same unit';
  end if;
end;
$$;

rollback;
