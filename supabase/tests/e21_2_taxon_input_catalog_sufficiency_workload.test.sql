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
