-- D14F §3.5. Bootstrap the independent workload and its financial coverage atomically.
begin;

do $$
declare
  r record;
  v_count integer := 0;
begin
  for r in select c.conname,c.conrelid,pg_get_expr(c.conbin,c.conrelid) as expression from pg_constraint c
    where c.contype='c' and c.conrelid in (
      'public.openai_workload_configuration_revisions'::regclass,
      'public.openai_workload_operational_configurations'::regclass,
      'public.openai_workload_configuration_activations'::regclass,
      'public.openai_cost_executions'::regclass,'public.openai_cost_coverage'::regclass)
      and c.conname in (
        'openai_workload_configuration_revisions_workload_chk','openai_workload_configuration_revisions_modality_chk',
        'openai_workload_operational_configurations_workload_chk','openai_workload_operational_configurations_modality_chk',
        'openai_workload_configuration_activations_workload_chk','openai_workload_configuration_activations_modality_chk',
        'openai_cost_executions_workload_check','openai_cost_coverage_workload_check') loop
    v_count := v_count + 1;
    execute format('alter table %s drop constraint %I',r.conrelid::regclass,r.conname);
    execute format('alter table %s add constraint %I check ((%s) or (workload=%L%s))',
      r.conrelid::regclass,r.conname,r.expression,'communication_base_agent',
      case when r.conname like '%modality_chk' then ' and modality=''responses_text''' else '' end);
  end loop;
  if v_count <> 8 then
    raise exception 'd14f_workload_allowlists_incomplete';
  end if;
end $$;

alter table public.openai_workload_operational_configurations
  drop constraint openai_workload_candidate_service_tier_chk,
  add constraint openai_workload_candidate_service_tier_chk check (
    candidate_service_tier is null or (
      candidate_model is not null and modality = 'responses_text' and (
        (candidate_model = 'gpt-6-luna' and candidate_service_tier in ('default', 'fast')) or
        (candidate_model = 'gpt-6.1-sol' and candidate_service_tier in ('default', 'fast', 'ultrafast')) or
        (candidate_model = 'gpt-6.1-terra' and candidate_service_tier in ('default', 'fast')) or
        (workload = 'communication_base_agent' and candidate_model = 'gpt-6.2-sol' and candidate_service_tier = 'default')
      )
    )
  );

alter table public.openai_workload_configuration_revisions
  drop constraint openai_workload_revision_service_tier_chk,
  add constraint openai_workload_revision_service_tier_chk check (
    (service_tier is null and workload <> 'communication_base_agent') or (service_tier is not null and modality = 'responses_text' and (
      (model = 'gpt-6-luna' and service_tier in ('default', 'fast')) or
      (model = 'gpt-6.1-sol' and service_tier in ('default', 'fast', 'ultrafast')) or
      (model = 'gpt-6.1-terra' and service_tier in ('default', 'fast')) or
      (workload = 'communication_base_agent' and model = 'gpt-6.2-sol' and service_tier = 'default')
    ))
  );

-- Keep the existing RPC contract, locks and lifecycle unchanged.
create or replace function public.save_openai_workload_configuration_candidate_v2(
  p_environment text, p_workload text, p_model text, p_reasoning_effort text,
  p_quality text, p_actor_user_id uuid, p_expected_version bigint, p_service_tier text
)
returns bigint language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_version bigint;
begin
  if p_service_tier is null or not coalesce(
    (p_model = 'gpt-6-luna' and p_service_tier in ('default', 'fast')) or
    (p_model = 'gpt-6.1-sol' and p_service_tier in ('default', 'fast', 'ultrafast')) or
    (p_model = 'gpt-6.1-terra' and p_service_tier in ('default', 'fast')) or
    (p_workload = 'communication_base_agent' and p_model = 'gpt-6.2-sol' and p_service_tier = 'default'), false
  ) then
    raise exception using errcode = '22023', message = 'candidate_service_tier_not_allowed';
  end if;
  perform 1 from public.openai_workload_operational_configurations
    where environment = p_environment and workload = p_workload for update;
  update public.openai_workload_operational_configurations
    set candidate_service_tier = null
    where environment = p_environment and workload = p_workload;
  v_version := public.save_openai_workload_configuration_candidate_v1(
    p_environment, p_workload, p_model, p_reasoning_effort, p_quality,
    p_actor_user_id, p_expected_version
  );
  update public.openai_workload_operational_configurations
    set candidate_service_tier = p_service_tier
    where environment = p_environment and workload = p_workload;
  return v_version;
end;
$$;

-- Explicit Standard on the approved bootstrap. Subsequent revisions still require
-- the ordinary OpenAI technical proof of the requested and applied service tier.
alter table public.openai_workload_configuration_revisions
  drop constraint openai_workload_revision_tier_proof_chk,
  add constraint openai_workload_revision_tier_proof_chk check (
    case
      when service_tier is null then
        not (proof_metadata ?| array['requested_service_tier', 'applied_service_tier'])
      when workload = 'communication_base_agent' and revision_number = 1
        and model = 'gpt-6.2-sol' and reasoning_effort = 'medium'
        and service_tier = 'default' and proof_metadata ->> 'proof_kind' = 'bootstrap'
      then not (proof_metadata ?| array['requested_service_tier', 'applied_service_tier'])
      else coalesce(
        proof_metadata ->> 'proof_kind' = 'operational' and
        proof_metadata ->> 'requested_service_tier' = service_tier and
        (proof_metadata ->> 'applied_service_tier' = service_tier or
          (service_tier = 'fast' and proof_metadata ->> 'applied_service_tier' = 'priority')),
        false
      )
    end
  );

insert into public.openai_model_catalog_models (modality, model, available_for_selection)
values ('responses_text', 'gpt-6.2-sol', true)
on conflict (modality, model) do nothing;

insert into public.openai_model_catalog_parameters (
  modality, model, parameter_kind, parameter_value, available_for_selection
)
select 'responses_text', 'gpt-6.2-sol', 'reasoning_effort', effort, true
from (values ('low'), ('medium'), ('high')) allowed(effort)
on conflict (modality, model, parameter_kind, parameter_value) do nothing;

do $$
begin
  if not exists (
    select from public.openai_model_catalog_models
    where modality = 'responses_text' and model = 'gpt-6.2-sol' and available_for_selection
  ) or (
    select count(*) from public.openai_model_catalog_parameters
    where modality = 'responses_text' and model = 'gpt-6.2-sol'
      and parameter_kind = 'reasoning_effort' and parameter_value in ('low', 'medium', 'high')
      and available_for_selection
  ) <> 3 then
    raise exception 'd14f_initial_model_catalog_unavailable';
  end if;
end $$;

insert into public.openai_cost_coverage (environment, workload, activated_at, contract_version, metadata)
select environment, 'communication_base_agent', now(), 'd10d-v4', '{"source":"d14f_workload_bootstrap"}'::jsonb
from (values ('preview'), ('production'), ('development')) environments(environment);

insert into public.openai_workload_configuration_revisions (
  environment, workload, modality, revision_number, model, reasoning_effort,
  service_tier, quality, validated_by, proof_metadata
)
select environment, 'communication_base_agent', 'responses_text', 1, 'gpt-6.2-sol', 'medium',
  'default', null, null,
  '{"schema_version":1,"proof_kind":"bootstrap","proof_result":"approved","source":"repo_catalog"}'::jsonb
from (values ('preview'), ('production')) environments(environment);

insert into public.openai_workload_operational_configurations (environment, workload, modality, active_revision_id)
select environment, workload, modality, id
from public.openai_workload_configuration_revisions
where workload = 'communication_base_agent' and revision_number = 1;

insert into public.openai_workload_configuration_activations (
  environment, workload, modality, activation_number, event_type, previous_revision_id, target_revision_id, actor_user_id
)
select environment, workload, modality, 1, 'bootstrap', null, active_revision_id, null
from public.openai_workload_operational_configurations
where workload = 'communication_base_agent';

notify pgrst, 'reload schema';
commit;
