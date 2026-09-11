-- E21.5.4 post-apply verification. Read-only; do not mutate pricing history.
select
  cost_status,
  cost_unavailable_reason,
  pricing_version,
  count(*) as operation_count,
  sum(cost_usd) filter (where cost_status = 'calculated') as calculated_cost_usd
from public.openai_cost_operations
group by cost_status, cost_unavailable_reason, pricing_version
order by cost_status, cost_unavailable_reason, pricing_version;

select
  environment,
  workload,
  activated_at,
  contract_version
from public.openai_cost_coverage
order by environment, workload;

select
  cursor_started_at,
  execution_id,
  operation_sequence,
  workload,
  universe,
  attribution_status,
  account_id,
  operation_id,
  retry_of_operation_id,
  model,
  reasoning_effort,
  cost_status,
  cost_unavailable_reason,
  cost_usd
from public.read_openai_active_cost_rows_v1(
  date_trunc('month', now()),
  now(),
  null,
  null,
  null,
  100
);
