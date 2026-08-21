-- Read-only verification for the E21.2 incremental E20.6.5 workload delta.

with expected(environment, workload, modality, model, reasoning_effort) as (
  values
    ('production', 'taxon_input_catalog_sufficiency_evaluation', 'responses_text', 'gpt-5.6-terra', 'low'),
    ('preview', 'taxon_input_catalog_sufficiency_evaluation', 'responses_text', 'gpt-5.6-terra', 'low')
)
select
  expected.environment,
  revision.id as active_revision_id,
  revision.revision_number,
  revision.model,
  revision.reasoning_effort,
  configuration.configuration_version,
  activation.id as bootstrap_activation_id,
  activation.event_type
from expected
left join public.openai_workload_operational_configurations configuration
  on configuration.environment = expected.environment
  and configuration.workload = expected.workload
  and configuration.modality = expected.modality
left join public.openai_workload_configuration_revisions revision
  on revision.id = configuration.active_revision_id
  and revision.environment = expected.environment
  and revision.workload = expected.workload
  and revision.modality = expected.modality
  and revision.model = expected.model
  and revision.reasoning_effort = expected.reasoning_effort
  and revision.quality is null
left join public.openai_workload_configuration_activations activation
  on activation.environment = expected.environment
  and activation.workload = expected.workload
  and activation.modality = expected.modality
  and activation.activation_number = 1
  and activation.event_type = 'bootstrap'
  and activation.target_revision_id = revision.id
order by expected.environment;

select
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in (
  'public.openai_workload_configuration_revisions'::regclass,
  'public.openai_workload_operational_configurations'::regclass,
  'public.openai_workload_configuration_activations'::regclass
)
  and conname in (
    'openai_workload_configuration_revisions_workload_chk',
    'openai_workload_configuration_revisions_modality_chk',
    'openai_workload_configuration_revisions_shape_chk',
    'openai_workload_operational_configurations_workload_chk',
    'openai_workload_operational_configurations_modality_chk',
    'openai_workload_operational_configurations_candidate_completeness_chk',
    'openai_workload_configuration_activations_workload_chk',
    'openai_workload_configuration_activations_modality_chk'
  )
order by conrelid::regclass::text, conname;

select
  procedure.proname as rpc_name,
  pg_get_functiondef(procedure.oid) like '%taxon_input_catalog_sufficiency_evaluation%'
    as supports_workload,
  pg_get_functiondef(procedure.oid) like '%gpt-5.6-terra%'
    as supports_initial_model,
  pg_get_functiondef(procedure.oid) like '%reasoning_effort = ''low''%'
    as supports_initial_effort
from pg_proc procedure
join pg_namespace namespace
  on namespace.oid = procedure.pronamespace
where namespace.nspname = 'public'
  and procedure.proname in (
    'save_openai_workload_configuration_candidate_v1',
    'promote_openai_workload_configuration_candidate_v1'
  )
order by procedure.proname;
