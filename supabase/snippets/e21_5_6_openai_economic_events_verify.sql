-- E21.5.6 post-apply verification. Read-only; never classifies or repairs rows.
select
  c.column_name,
  c.data_type,
  c.is_nullable
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'openai_cost_executions'
  and c.column_name in (
    'economic_event_kind', 'economic_event_id', 'landing_page_id', 'taxon_id'
  )
order by c.ordinal_position;

select
  con.conname,
  con.contype,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
where con.conrelid = 'public.openai_cost_executions'::regclass
  and con.conname in (
    'openai_cost_executions_economic_event_chk',
    'openai_cost_executions_landing_page_fkey',
    'openai_cost_executions_taxon_id_fkey'
  )
order by con.conname;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'openai_cost_executions'
  and indexname = 'openai_cost_executions_economic_event_idx';

select
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'start_openai_cost_execution_v2', 'read_openai_active_cost_rows_v2'
  )
order by p.proname;

select
  c.relname,
  c.relrowsecurity,
  count(pol.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies pol
  on pol.schemaname = n.nspname and pol.tablename = c.relname
where n.nspname = 'public'
  and c.relname in (
    'openai_cost_executions', 'openai_cost_operations', 'openai_cost_coverage'
  )
group by c.relname, c.relrowsecurity
order by c.relname;

select
  coalesce(e.economic_event_kind, 'uncorrelated') as economic_event_kind,
  e.universe,
  count(*) as execution_count,
  count(*) filter (where e.economic_event_id is not null) as correlated_count,
  min(e.started_at) as first_started_at,
  max(e.started_at) as last_started_at
from public.openai_cost_executions e
group by coalesce(e.economic_event_kind, 'uncorrelated'), e.universe
order by economic_event_kind, e.universe;

select
  count(*) filter (where economic_event_kind = 'landing_page') as landing_page_events,
  count(*) filter (where economic_event_kind = 'niche_resolution') as niche_resolution_events,
  count(*) filter (where economic_event_kind = 'lp_factory_internal') as lp_factory_internal_events,
  count(*) filter (where economic_event_kind is null) as uncorrelated_executions,
  count(*) filter (
    where economic_event_kind is null
      and (economic_event_id is not null or landing_page_id is not null or taxon_id is not null)
  ) as invalid_partial_correlations
from public.openai_cost_executions;

select
  cursor_started_at,
  execution_id,
  operation_sequence,
  workload,
  universe,
  attribution_status,
  account_name,
  economic_event_kind,
  economic_event_id,
  landing_page_name,
  taxon_name,
  cost_status,
  cost_usd
from public.read_openai_active_cost_rows_v2(
  date_trunc('month', now()),
  now(),
  null,
  null,
  null,
  100
);
