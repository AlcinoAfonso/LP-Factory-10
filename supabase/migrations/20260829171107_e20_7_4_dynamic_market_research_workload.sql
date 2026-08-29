-- E20.7.4 / E21.2 incremental aggregate expansion.
-- Adds one product workload for Preview and Production without creating a
-- table, column, policy, public grant, business persistence, or remote action.

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
      'landing_page_draft_image_generation'
    )),
  add constraint openai_workload_configuration_revisions_modality_chk
    check (
      (
        workload in (
          'niche_resolution',
          'commercial_activation_draft_generation',
          'landing_page_draft_generation',
          'taxon_input_catalog_sufficiency_evaluation',
          'landing_page_dynamic_market_research'
        )
        and modality = 'responses_text'
      )
      or (
        workload = 'landing_page_draft_image_generation'
        and modality = 'image_generation'
      )
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
      'landing_page_draft_image_generation'
    )),
  add constraint openai_workload_operational_configurations_modality_chk
    check (
      (
        workload in (
          'niche_resolution',
          'commercial_activation_draft_generation',
          'landing_page_draft_generation',
          'taxon_input_catalog_sufficiency_evaluation',
          'landing_page_dynamic_market_research'
        )
        and modality = 'responses_text'
      )
      or (
        workload = 'landing_page_draft_image_generation'
        and modality = 'image_generation'
      )
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
      'landing_page_draft_image_generation'
    )),
  add constraint openai_workload_configuration_activations_modality_chk
    check (
      (
        workload in (
          'niche_resolution',
          'commercial_activation_draft_generation',
          'landing_page_draft_generation',
          'taxon_input_catalog_sufficiency_evaluation',
          'landing_page_dynamic_market_research'
        )
        and modality = 'responses_text'
      )
      or (
        workload = 'landing_page_draft_image_generation'
        and modality = 'image_generation'
      )
    );

create or replace function public.save_openai_workload_configuration_candidate_v1(
  p_environment text,
  p_workload text,
  p_model text,
  p_reasoning_effort text,
  p_quality text,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_modality text;
  v_current_version bigint;
  v_pending_revision_id uuid;
  v_parameter_kind text;
  v_parameter_value text;
  v_model_available boolean;
  v_parameter_available boolean;
  v_next_version bigint;
begin
  if p_environment is null
     or p_workload is null
     or p_model is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_candidate_input_missing';
  end if;

  select
    configuration.modality,
    configuration.configuration_version,
    configuration.pending_revision_id
  into
    v_modality,
    v_current_version,
    v_pending_revision_id
  from public.openai_workload_operational_configurations configuration
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_workload_configuration_not_found';
  end if;
  if v_current_version <> p_expected_version then
    perform public.raise_postgrest_safe_conflict_v1(
      'openai_workload_configuration_stale_version'
    );
  end if;
  if v_pending_revision_id is not null then
    raise exception using errcode = '55000', message = 'validated_revision_already_pending';
  end if;
  if char_length(p_model) not between 1 and 128
     or p_model <> btrim(p_model)
     or p_model !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
  end if;

  if v_modality = 'responses_text'
     and p_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
     and p_quality is null then
    v_parameter_kind := 'reasoning_effort';
    v_parameter_value := p_reasoning_effort;
  elsif v_modality = 'image_generation'
        and p_reasoning_effort is null
        and p_quality in ('low', 'medium', 'high') then
    v_parameter_kind := 'quality';
    v_parameter_value := p_quality;
  else
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
  end if;

  if p_workload = 'landing_page_dynamic_market_research'
     and not (
       p_model = 'gpt-5.6-luna'
       and p_reasoning_effort = 'high'
     ) then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
  end if;

  select model.available_for_selection
  into v_model_available
  from public.openai_model_catalog_models model
  where model.modality = v_modality
    and model.model = p_model
  for update;
  if not found or not v_model_available then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_available';
  end if;

  select parameter.available_for_selection
  into v_parameter_available
  from public.openai_model_catalog_parameters parameter
  where parameter.modality = v_modality
    and parameter.model = p_model
    and parameter.parameter_kind = v_parameter_kind
    and parameter.parameter_value = v_parameter_value
  for update;
  if not found or not v_parameter_available then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_available';
  end if;

  update public.openai_workload_operational_configurations configuration
  set
    candidate_model = p_model,
    candidate_reasoning_effort = p_reasoning_effort,
    candidate_quality = p_quality,
    candidate_saved_by = p_actor_user_id,
    candidate_saved_at = now(),
    configuration_version = configuration.configuration_version + 1,
    updated_at = now()
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  returning configuration.configuration_version into v_next_version;
  return v_next_version;
end;
$$;

create or replace function public.promote_openai_workload_configuration_candidate_v1(
  p_environment text,
  p_workload text,
  p_proof_metadata jsonb,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns table(
  candidate_revision_id uuid,
  candidate_revision_number bigint,
  configuration_version bigint
)
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_configuration public.openai_workload_operational_configurations%rowtype;
  v_parameter_kind text;
  v_parameter_value text;
  v_model_available boolean;
  v_parameter_available boolean;
  v_revision_id uuid;
  v_revision_number bigint;
  v_next_version bigint;
begin
  if p_environment is null
     or p_workload is null
     or p_proof_metadata is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_promotion_input_missing';
  end if;

  select configuration.*
  into v_configuration
  from public.openai_workload_operational_configurations configuration
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'openai_workload_configuration_not_found';
  end if;
  if v_configuration.configuration_version <> p_expected_version then
    perform public.raise_postgrest_safe_conflict_v1(
      'openai_workload_configuration_stale_version'
    );
  end if;
  if v_configuration.candidate_model is null
     or v_configuration.pending_revision_id is not null then
    raise exception using errcode = '55000', message = 'candidate_not_promotable';
  end if;

  if not coalesce(
    (
      jsonb_typeof(p_proof_metadata) = 'object'
      and p_proof_metadata ?& array['schema_version', 'proof_kind', 'proof_result', 'source']
      and jsonb_typeof(p_proof_metadata -> 'schema_version') = 'number'
      and p_proof_metadata ->> 'schema_version' = '1'
      and jsonb_typeof(p_proof_metadata -> 'proof_kind') = 'string'
      and p_proof_metadata ->> 'proof_kind' = 'operational'
      and jsonb_typeof(p_proof_metadata -> 'proof_result') = 'string'
      and p_proof_metadata ->> 'proof_result' = 'approved'
      and jsonb_typeof(p_proof_metadata -> 'source') = 'string'
      and p_proof_metadata ->> 'source' = 'openai_api'
      and case
        when not (p_proof_metadata ? 'request_id')
          or p_proof_metadata -> 'request_id' = 'null'::jsonb then true
        when jsonb_typeof(p_proof_metadata -> 'request_id') = 'string' then
          char_length(p_proof_metadata ->> 'request_id') between 1 and 128
          and p_proof_metadata ->> 'request_id' ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
        else false
      end
      and case
        when not (p_proof_metadata ? 'provider_request_id')
          or p_proof_metadata -> 'provider_request_id' = 'null'::jsonb then true
        when jsonb_typeof(p_proof_metadata -> 'provider_request_id') = 'string' then
          char_length(p_proof_metadata ->> 'provider_request_id') between 1 and 128
          and p_proof_metadata ->> 'provider_request_id' ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
        else false
      end
      and case
        when not (p_proof_metadata ? 'latency_ms')
          or p_proof_metadata -> 'latency_ms' = 'null'::jsonb then true
        when jsonb_typeof(p_proof_metadata -> 'latency_ms') = 'number'
          and p_proof_metadata ->> 'latency_ms' ~ '^(0|[1-9][0-9]*)$' then
          (p_proof_metadata ->> 'latency_ms')::numeric <= 900000
        else false
      end
      and case
        when not (p_proof_metadata ? 'contract_version')
          or p_proof_metadata -> 'contract_version' = 'null'::jsonb then true
        when jsonb_typeof(p_proof_metadata -> 'contract_version') = 'number'
          and p_proof_metadata ->> 'contract_version' ~ '^[1-9][0-9]*$' then
          (p_proof_metadata ->> 'contract_version')::numeric <= 1000
        else false
      end
      and p_proof_metadata - array[
        'schema_version',
        'proof_kind',
        'proof_result',
        'request_id',
        'provider_request_id',
        'latency_ms',
        'contract_version',
        'source'
      ] = '{}'::jsonb
    ),
    false
  ) then
    raise exception using errcode = '22023', message = 'proof_metadata_not_allowed';
  end if;

  if char_length(v_configuration.candidate_model) not between 1 and 128
     or v_configuration.candidate_model <> btrim(v_configuration.candidate_model)
     or v_configuration.candidate_model !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
  end if;

  if v_configuration.modality = 'responses_text'
     and v_configuration.candidate_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
     and v_configuration.candidate_quality is null then
    v_parameter_kind := 'reasoning_effort';
    v_parameter_value := v_configuration.candidate_reasoning_effort;
  elsif v_configuration.modality = 'image_generation'
        and v_configuration.candidate_reasoning_effort is null
        and v_configuration.candidate_quality in ('low', 'medium', 'high') then
    v_parameter_kind := 'quality';
    v_parameter_value := v_configuration.candidate_quality;
  else
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
  end if;

  if p_workload = 'landing_page_dynamic_market_research'
     and not (
       v_configuration.candidate_model = 'gpt-5.6-luna'
       and v_configuration.candidate_reasoning_effort = 'high'
     ) then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
  end if;

  select model.available_for_selection
  into v_model_available
  from public.openai_model_catalog_models model
  where model.modality = v_configuration.modality
    and model.model = v_configuration.candidate_model
  for update;
  if not found or not v_model_available then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_available';
  end if;

  select parameter.available_for_selection
  into v_parameter_available
  from public.openai_model_catalog_parameters parameter
  where parameter.modality = v_configuration.modality
    and parameter.model = v_configuration.candidate_model
    and parameter.parameter_kind = v_parameter_kind
    and parameter.parameter_value = v_parameter_value
  for update;
  if not found or not v_parameter_available then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_available';
  end if;

  select coalesce(max(revision.revision_number), 0) + 1
  into v_revision_number
  from public.openai_workload_configuration_revisions revision
  where revision.environment = p_environment
    and revision.workload = p_workload;

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
    p_environment,
    p_workload,
    v_configuration.modality,
    v_revision_number,
    v_configuration.candidate_model,
    v_configuration.candidate_reasoning_effort,
    v_configuration.candidate_quality,
    p_actor_user_id,
    p_proof_metadata
  )
  returning id into v_revision_id;

  update public.openai_workload_operational_configurations configuration
  set
    pending_revision_id = v_revision_id,
    candidate_model = null,
    candidate_reasoning_effort = null,
    candidate_quality = null,
    candidate_saved_by = null,
    candidate_saved_at = null,
    configuration_version = configuration.configuration_version + 1,
    updated_at = now()
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  returning configuration.configuration_version into v_next_version;
  return query select v_revision_id, v_revision_number, v_next_version;
end;
$$;

with baselines(environment, workload, modality, model, reasoning_effort, quality) as (
  values
    ('production', 'landing_page_dynamic_market_research', 'responses_text', 'gpt-5.6-luna', 'high', null::text),
    ('preview', 'landing_page_dynamic_market_research', 'responses_text', 'gpt-5.6-luna', 'high', null::text)
)
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
)
select
  baseline.environment,
  baseline.workload,
  baseline.modality,
  1,
  baseline.model,
  baseline.reasoning_effort,
  baseline.quality,
  null,
  jsonb_build_object(
    'schema_version', 1,
    'proof_kind', 'bootstrap',
    'proof_result', 'approved',
    'source', 'repo_catalog'
  )
from baselines baseline
on conflict (environment, workload, revision_number) do nothing;

insert into public.openai_workload_operational_configurations (
  environment,
  workload,
  modality,
  active_revision_id
)
select revision.environment, revision.workload, revision.modality, revision.id
from public.openai_workload_configuration_revisions revision
where revision.workload = 'landing_page_dynamic_market_research'
  and revision.revision_number = 1
on conflict (environment, workload) do nothing;

insert into public.openai_workload_configuration_activations (
  environment,
  workload,
  modality,
  activation_number,
  event_type,
  previous_revision_id,
  target_revision_id,
  actor_user_id
)
select
  configuration.environment,
  configuration.workload,
  configuration.modality,
  1,
  'bootstrap',
  null,
  configuration.active_revision_id,
  null
from public.openai_workload_operational_configurations configuration
where configuration.workload = 'landing_page_dynamic_market_research'
on conflict (environment, workload, activation_number) do nothing;

do $$
declare
  v_invalid_count bigint;
begin
  with expected(environment) as (values ('production'), ('preview'))
  select count(*) into v_invalid_count
  from expected
  left join public.openai_workload_configuration_revisions revision
    on revision.environment = expected.environment
    and revision.workload = 'landing_page_dynamic_market_research'
    and revision.revision_number = 1
    and revision.modality = 'responses_text'
    and revision.model = 'gpt-5.6-luna'
    and revision.reasoning_effort = 'high'
    and revision.quality is null
    and revision.validated_by is null
  left join public.openai_workload_operational_configurations configuration
    on configuration.environment = expected.environment
    and configuration.workload = 'landing_page_dynamic_market_research'
    and configuration.modality = 'responses_text'
    and configuration.active_revision_id = revision.id
  left join public.openai_workload_configuration_activations activation
    on activation.environment = expected.environment
    and activation.workload = 'landing_page_dynamic_market_research'
    and activation.activation_number = 1
    and activation.event_type = 'bootstrap'
    and activation.previous_revision_id is null
    and activation.target_revision_id = revision.id
    and activation.actor_user_id is null
  where revision.id is null or configuration.active_revision_id is null or activation.id is null;

  if v_invalid_count <> 0
     or (select count(*) from public.openai_workload_operational_configurations) <> 12
     or (select count(*) from public.openai_workload_configuration_revisions
         where workload = 'landing_page_dynamic_market_research' and revision_number = 1) <> 2
     or (select count(*) from public.openai_workload_configuration_activations
         where workload = 'landing_page_dynamic_market_research' and activation_number = 1) <> 2 then
    raise exception using errcode = '23514', message = 'dynamic_market_research_bootstrap_invalid';
  end if;
end;
$$;

alter function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  owner to postgres;
alter function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  owner to postgres;

revoke all on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  to service_role;
grant execute on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  to service_role;

comment on constraint openai_workload_configuration_revisions_workload_chk
  on public.openai_workload_configuration_revisions
  is 'Allowlist E21.2 dos seis workloads de produto, incluindo o complemento dinâmico E20.7.4.';
comment on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  is 'Salva candidata elegível e restringe E20.7.4 à matriz focal aprovada, sem efeito no runtime.';
comment on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  is 'Revalida catálogo, prova e matriz focal E20.7.4 antes de criar revisão pendente.';

commit;
