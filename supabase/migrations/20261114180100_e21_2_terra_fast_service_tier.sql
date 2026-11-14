-- E21.2: include GPT-6.1 Terra in the existing Standard/Fast tier contract.
-- Preserve all existing tiers, proof requirements, grants and lifecycle semantics.
begin;

alter table public.openai_workload_operational_configurations
  drop constraint openai_workload_candidate_service_tier_chk,
  add constraint openai_workload_candidate_service_tier_chk check (
    candidate_service_tier is null or (
      candidate_model is not null and modality = 'responses_text' and (
        (candidate_model = 'gpt-6-luna' and candidate_service_tier in ('default', 'fast')) or
        (candidate_model = 'gpt-6.1-sol' and candidate_service_tier in ('default', 'fast', 'ultrafast')) or
        (candidate_model = 'gpt-6.1-terra' and candidate_service_tier in ('default', 'fast'))
      )
    )
  );

alter table public.openai_workload_configuration_revisions
  drop constraint openai_workload_revision_service_tier_chk,
  add constraint openai_workload_revision_service_tier_chk check (
    service_tier is null or (modality = 'responses_text' and (
      (model = 'gpt-6-luna' and service_tier in ('default', 'fast')) or
      (model = 'gpt-6.1-sol' and service_tier in ('default', 'fast', 'ultrafast')) or
      (model = 'gpt-6.1-terra' and service_tier in ('default', 'fast'))
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
    (p_model = 'gpt-6.1-terra' and p_service_tier in ('default', 'fast')), false
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

notify pgrst, 'reload schema';
commit;
