-- Read-only post-apply verification for E20.7.4 / E21.2.
with expected(environment) as (
  values ('production'), ('preview')
), units as (
  select
    expected.environment,
    configuration.modality,
    revision.revision_number,
    revision.model,
    revision.reasoning_effort,
    activation.event_type,
    activation.activation_number
  from expected
  left join public.openai_workload_operational_configurations configuration
    on configuration.environment = expected.environment
    and configuration.workload = 'landing_page_dynamic_market_research'
  left join public.openai_workload_configuration_revisions revision
    on revision.id = configuration.active_revision_id
    and revision.environment = configuration.environment
    and revision.workload = configuration.workload
  left join public.openai_workload_configuration_activations activation
    on activation.environment = configuration.environment
    and activation.workload = configuration.workload
    and activation.target_revision_id = configuration.active_revision_id
)
select * from units order by environment;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
left join pg_catalog.pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in (
    'openai_workload_operational_configurations',
    'openai_workload_configuration_revisions',
    'openai_workload_configuration_activations'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

select
  routine.routine_name,
  routine.security_type,
  routine.routine_definition like '%landing_page_dynamic_market_research%' as validates_dynamic_workload
from information_schema.routines routine
where routine.specific_schema = 'public'
  and routine.routine_name in (
    'save_openai_workload_configuration_candidate_v1',
    'promote_openai_workload_configuration_candidate_v1'
  )
order by routine.routine_name;
