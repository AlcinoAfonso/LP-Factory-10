begin;
set local search_path = public, pg_catalog;

do $$
declare
  v_expected_count integer;
begin
  with expected(environment, workload, model, reasoning_effort) as (
    values
      ('production', 'communication_base_stage1_assistance', 'gpt-5.4-mini', 'none'),
      ('preview', 'communication_base_stage1_assistance', 'gpt-5.4-mini', 'none'),
      ('production', 'communication_base_stage2_intelligence', 'gpt-5.6-terra', 'low'),
      ('preview', 'communication_base_stage2_intelligence', 'gpt-5.6-terra', 'low')
  )
  select count(*) into v_expected_count
  from expected
  join public.openai_workload_configuration_revisions revision
    on revision.environment = expected.environment
    and revision.workload = expected.workload
    and revision.modality = 'responses_text'
    and revision.revision_number = 1
    and revision.model = expected.model
    and revision.reasoning_effort = expected.reasoning_effort
    and revision.quality is null
  join public.openai_workload_operational_configurations unit
    on unit.environment = expected.environment
    and unit.workload = expected.workload
    and unit.modality = revision.modality
    and unit.active_revision_id = revision.id
  join public.openai_workload_configuration_activations activation
    on activation.environment = expected.environment
    and activation.workload = expected.workload
    and activation.modality = revision.modality
    and activation.activation_number = 1
    and activation.event_type = 'bootstrap'
    and activation.target_revision_id = revision.id;
  if v_expected_count <> 4 then
    raise exception 'E25.1 requires four complete E21 configuration chains';
  end if;

  if exists (
    select 1 from public.openai_cost_coverage
    where workload in (
      'communication_base_stage1_assistance',
      'communication_base_stage2_intelligence'
    )
  ) then
    raise exception 'E25.1 cost coverage must be activated prospectively, not by migration';
  end if;

  if has_table_privilege('anon', 'public.openai_workload_operational_configurations', 'SELECT')
     or has_table_privilege('authenticated', 'public.openai_workload_operational_configurations', 'SELECT')
     or has_table_privilege('anon', 'public.openai_cost_executions', 'INSERT')
     or has_table_privilege('authenticated', 'public.openai_cost_coverage', 'INSERT') then
    raise exception 'E25.1 must not broaden public or authenticated E21 grants';
  end if;
end;
$$;

do $$
begin
  begin
    insert into public.openai_workload_configuration_revisions (
      environment, workload, modality, revision_number, model,
      reasoning_effort, quality, validated_by, proof_metadata
    ) values (
      'preview', 'communication_base_stage1_assistance', 'image_generation',
      999, 'gpt-image-2', null, 'medium', null,
      '{"schema_version":1,"proof_kind":"bootstrap","proof_result":"approved","source":"repo_catalog"}'::jsonb
    );
    raise exception 'stage 1 accepted image modality';
  exception when check_violation then null;
  end;

  begin
    insert into public.openai_cost_executions (
      id, workload, environment, execution_origin, universe,
      attribution_status, account_id, started_at
    ) values (
      'e2510000-0000-4000-8000-000000000099', 'unregistered_e25_workload',
      'preview', 'runtime', 'lp_factory', 'attributed', null, now()
    );
    raise exception 'unknown cost workload accepted';
  exception when check_violation then null;
  end;
end;
$$;

insert into public.openai_cost_executions (
  id, workload, environment, execution_origin, universe,
  attribution_status, account_id, started_at
) values
  ('e2510000-0000-4000-8000-000000000001', 'communication_base_stage1_assistance',
   'preview', 'runtime', 'lp_factory', 'attributed', null, now()),
  ('e2510000-0000-4000-8000-000000000002', 'communication_base_stage2_intelligence',
   'preview', 'runtime', 'lp_factory', 'attributed', null, now());

insert into public.openai_cost_coverage (
  environment, workload, activated_at, contract_version, metadata
) values
  ('preview', 'communication_base_stage1_assistance', now() - interval '1 second', 'e25.1-test', '{}'::jsonb),
  ('preview', 'communication_base_stage2_intelligence', now() - interval '1 second', 'e25.1-test', '{}'::jsonb);

rollback;
