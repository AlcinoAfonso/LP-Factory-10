-- E25.1 extends the existing E21 operational and financial workload allowlists.
-- Historical workload IDs remain valid; no E21 migration is rewritten.

begin;

alter table public.openai_workload_configuration_revisions
  drop constraint openai_workload_configuration_revisions_workload_chk,
  drop constraint openai_workload_configuration_revisions_modality_chk;
alter table public.openai_workload_configuration_revisions
  add constraint openai_workload_configuration_revisions_workload_chk
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'landing_page_draft_generation',
      'taxon_input_catalog_sufficiency_evaluation',
      'landing_page_dynamic_market_research',
      'landing_page_draft_image_generation',
      'communication_base_stage1_assistance',
      'communication_base_stage2_intelligence'
    )),
  add constraint openai_workload_configuration_revisions_modality_chk
    check (
      (workload in (
        'niche_resolution',
        'commercial_activation_draft_generation',
        'landing_page_draft_generation',
        'taxon_input_catalog_sufficiency_evaluation',
        'landing_page_dynamic_market_research',
        'communication_base_stage1_assistance',
        'communication_base_stage2_intelligence'
      ) and modality = 'responses_text')
      or (workload = 'landing_page_draft_image_generation' and modality = 'image_generation')
    );

alter table public.openai_workload_operational_configurations
  drop constraint openai_workload_operational_configurations_workload_chk,
  drop constraint openai_workload_operational_configurations_modality_chk;
alter table public.openai_workload_operational_configurations
  add constraint openai_workload_operational_configurations_workload_chk
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'landing_page_draft_generation',
      'taxon_input_catalog_sufficiency_evaluation',
      'landing_page_dynamic_market_research',
      'landing_page_draft_image_generation',
      'communication_base_stage1_assistance',
      'communication_base_stage2_intelligence'
    )),
  add constraint openai_workload_operational_configurations_modality_chk
    check (
      (workload in (
        'niche_resolution',
        'commercial_activation_draft_generation',
        'landing_page_draft_generation',
        'taxon_input_catalog_sufficiency_evaluation',
        'landing_page_dynamic_market_research',
        'communication_base_stage1_assistance',
        'communication_base_stage2_intelligence'
      ) and modality = 'responses_text')
      or (workload = 'landing_page_draft_image_generation' and modality = 'image_generation')
    );

alter table public.openai_workload_configuration_activations
  drop constraint openai_workload_configuration_activations_workload_chk,
  drop constraint openai_workload_configuration_activations_modality_chk;
alter table public.openai_workload_configuration_activations
  add constraint openai_workload_configuration_activations_workload_chk
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'landing_page_draft_generation',
      'taxon_input_catalog_sufficiency_evaluation',
      'landing_page_dynamic_market_research',
      'landing_page_draft_image_generation',
      'communication_base_stage1_assistance',
      'communication_base_stage2_intelligence'
    )),
  add constraint openai_workload_configuration_activations_modality_chk
    check (
      (workload in (
        'niche_resolution',
        'commercial_activation_draft_generation',
        'landing_page_draft_generation',
        'taxon_input_catalog_sufficiency_evaluation',
        'landing_page_dynamic_market_research',
        'communication_base_stage1_assistance',
        'communication_base_stage2_intelligence'
      ) and modality = 'responses_text')
      or (workload = 'landing_page_draft_image_generation' and modality = 'image_generation')
    );

alter table public.openai_cost_executions
  drop constraint openai_cost_executions_workload_check;
alter table public.openai_cost_executions
  add constraint openai_cost_executions_workload_check
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'taxon_input_catalog_sufficiency_evaluation',
      'landing_page_dynamic_market_research',
      'supabase_inspect',
      'communication_base_stage1_assistance',
      'communication_base_stage2_intelligence'
    ));

alter table public.openai_cost_coverage
  drop constraint openai_cost_coverage_workload_check;
alter table public.openai_cost_coverage
  add constraint openai_cost_coverage_workload_check
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'taxon_input_catalog_sufficiency_evaluation',
      'landing_page_dynamic_market_research',
      'supabase_inspect',
      'communication_base_stage1_assistance',
      'communication_base_stage2_intelligence'
    ));

with baselines(environment, workload, model, reasoning_effort) as (
  values
    ('production', 'communication_base_stage1_assistance', 'gpt-5.4-mini', 'none'),
    ('preview', 'communication_base_stage1_assistance', 'gpt-5.4-mini', 'none'),
    ('production', 'communication_base_stage2_intelligence', 'gpt-6-luna', 'max'),
    ('preview', 'communication_base_stage2_intelligence', 'gpt-6-luna', 'max')
)
insert into public.openai_workload_configuration_revisions (
  environment, workload, modality, revision_number, model, reasoning_effort,
  quality, validated_by, proof_metadata
)
select environment, workload, 'responses_text', 1, model, reasoning_effort,
  null, null,
  jsonb_build_object(
    'schema_version', 1,
    'proof_kind', 'bootstrap',
    'proof_result', 'approved',
    'source', 'repo_catalog'
  )
from baselines
on conflict (environment, workload, revision_number) do nothing;

insert into public.openai_workload_operational_configurations (
  environment, workload, modality, active_revision_id
)
select revision.environment, revision.workload, revision.modality, revision.id
from public.openai_workload_configuration_revisions revision
where revision.workload in (
  'communication_base_stage1_assistance',
  'communication_base_stage2_intelligence'
)
  and revision.revision_number = 1
on conflict (environment, workload) do nothing;

insert into public.openai_workload_configuration_activations (
  environment, workload, modality, activation_number, event_type,
  previous_revision_id, target_revision_id, actor_user_id
)
select configuration.environment, configuration.workload, configuration.modality,
  1, 'bootstrap', null, configuration.active_revision_id, null
from public.openai_workload_operational_configurations configuration
where configuration.workload in (
  'communication_base_stage1_assistance',
  'communication_base_stage2_intelligence'
)
on conflict (environment, workload, activation_number) do nothing;

do $$
declare
  v_invalid_count bigint;
begin
  with expected(environment, workload, model, reasoning_effort) as (
    values
      ('production', 'communication_base_stage1_assistance', 'gpt-5.4-mini', 'none'),
      ('preview', 'communication_base_stage1_assistance', 'gpt-5.4-mini', 'none'),
      ('production', 'communication_base_stage2_intelligence', 'gpt-6-luna', 'max'),
      ('preview', 'communication_base_stage2_intelligence', 'gpt-6-luna', 'max')
  )
  select count(*) into v_invalid_count
  from expected
  left join public.openai_workload_configuration_revisions revision
    on revision.environment = expected.environment
    and revision.workload = expected.workload
    and revision.modality = 'responses_text'
    and revision.revision_number = 1
    and revision.model = expected.model
    and revision.reasoning_effort = expected.reasoning_effort
    and revision.quality is null
  left join public.openai_workload_operational_configurations configuration
    on configuration.environment = expected.environment
    and configuration.workload = expected.workload
    and configuration.modality = 'responses_text'
    and configuration.active_revision_id = revision.id
    and configuration.pending_revision_id is null
    and configuration.candidate_model is null
  left join public.openai_workload_configuration_activations activation
    on activation.environment = expected.environment
    and activation.workload = expected.workload
    and activation.modality = 'responses_text'
    and activation.activation_number = 1
    and activation.event_type = 'bootstrap'
    and activation.target_revision_id = revision.id
  where revision.id is null
    or configuration.active_revision_id is null
    or activation.id is null;

  if v_invalid_count <> 0 then
    raise exception using errcode = '23514',
      message = 'e25_1_openai_workload_bootstrap_invariant_failed';
  end if;
end;
$$;

commit;
