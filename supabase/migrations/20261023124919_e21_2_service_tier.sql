-- E21.2: explicit service tier. NULL preserves every legacy snapshot and request.
begin;

alter table public.openai_workload_operational_configurations
  add column candidate_service_tier text null;
alter table public.openai_workload_configuration_revisions
  add column service_tier text null;

alter table public.openai_workload_operational_configurations
  add constraint openai_workload_candidate_service_tier_chk check (
    candidate_service_tier is null or (
      candidate_model is not null and modality = 'responses_text' and (
        (candidate_model = 'gpt-6-luna' and candidate_service_tier in ('default', 'fast')) or
        (candidate_model = 'gpt-6.1-sol' and candidate_service_tier in ('default', 'fast', 'ultrafast'))
      )
    )
  );
alter table public.openai_workload_configuration_revisions
  add constraint openai_workload_revision_service_tier_chk check (
    service_tier is null or (modality = 'responses_text' and (
      (model = 'gpt-6-luna' and service_tier in ('default', 'fast')) or
      (model = 'gpt-6.1-sol' and service_tier in ('default', 'fast', 'ultrafast'))
    ))
  ),
  add constraint openai_workload_revision_tier_proof_chk check (
    case when service_tier is null then
      not (proof_metadata ?| array['requested_service_tier', 'applied_service_tier'])
    else coalesce(
      proof_metadata ->> 'proof_kind' = 'operational' and
      proof_metadata ->> 'requested_service_tier' = service_tier and
      (proof_metadata ->> 'applied_service_tier' = service_tier or
        (service_tier = 'fast' and proof_metadata ->> 'applied_service_tier' = 'priority')),
      false
    ) end
  );

alter table public.openai_workload_configuration_revisions
  drop constraint openai_workload_configuration_revisions_proof_metadata_chk,
  add constraint openai_workload_configuration_revisions_proof_metadata_chk
    check (
      coalesce(
        (
          jsonb_typeof(proof_metadata) = 'object'
          and proof_metadata ?& array[
            'schema_version',
            'proof_kind',
            'proof_result',
            'source'
          ]
          and jsonb_typeof(proof_metadata -> 'schema_version') = 'number'
          and proof_metadata ->> 'schema_version' = '1'
          and jsonb_typeof(proof_metadata -> 'proof_kind') = 'string'
          and proof_metadata ->> 'proof_kind' in ('bootstrap', 'operational')
          and jsonb_typeof(proof_metadata -> 'proof_result') = 'string'
          and proof_metadata ->> 'proof_result' = 'approved'
          and jsonb_typeof(proof_metadata -> 'source') = 'string'
          and (
            (
              proof_metadata ->> 'proof_kind' = 'bootstrap'
              and proof_metadata ->> 'source' = 'repo_catalog'
            )
            or (
              proof_metadata ->> 'proof_kind' = 'operational'
              and proof_metadata ->> 'source' = 'openai_api'
            )
          )
          and case
            when not (proof_metadata ? 'request_id')
              or proof_metadata -> 'request_id' = 'null'::jsonb then true
            when jsonb_typeof(proof_metadata -> 'request_id') = 'string' then
              char_length(proof_metadata ->> 'request_id') between 1 and 128
              and proof_metadata ->> 'request_id'
                ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
            else false
          end
          and case
            when not (proof_metadata ? 'provider_request_id')
              or proof_metadata -> 'provider_request_id' = 'null'::jsonb then true
            when jsonb_typeof(proof_metadata -> 'provider_request_id') = 'string' then
              char_length(proof_metadata ->> 'provider_request_id') between 1 and 128
              and proof_metadata ->> 'provider_request_id'
                ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
            else false
          end
          and case
            when not (proof_metadata ? 'latency_ms')
              or proof_metadata -> 'latency_ms' = 'null'::jsonb then true
            when jsonb_typeof(proof_metadata -> 'latency_ms') = 'number'
              and proof_metadata ->> 'latency_ms' ~ '^(0|[1-9][0-9]*)$' then
              (proof_metadata ->> 'latency_ms')::numeric <= 900000
            else false
          end
          and case
            when not (proof_metadata ? 'contract_version')
              or proof_metadata -> 'contract_version' = 'null'::jsonb then true
            when jsonb_typeof(proof_metadata -> 'contract_version') = 'number'
              and proof_metadata ->> 'contract_version' ~ '^[1-9][0-9]*$' then
              (proof_metadata ->> 'contract_version')::numeric <= 1000
            else false
          end
          and proof_metadata - array[
            'requested_service_tier',
            'applied_service_tier',
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
    candidate_service_tier = null,
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

create or replace function public.discard_openai_workload_configuration_candidate_v1(
  p_environment text,
  p_workload text,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_current_version bigint;
  v_candidate_model text;
  v_next_version bigint;
begin
  if p_environment is null
     or p_workload is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_discard_input_missing';
  end if;

  select
    configuration.configuration_version,
    configuration.candidate_model
  into
    v_current_version,
    v_candidate_model
  from public.openai_workload_operational_configurations configuration
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_workload_configuration_not_found';
  end if;

  if v_current_version <> p_expected_version then
    perform public.raise_postgrest_safe_conflict_v1('openai_workload_configuration_stale_version');
  end if;

  if v_candidate_model is null then
    raise exception using errcode = '55000', message = 'candidate_configuration_not_found';
  end if;

  update public.openai_workload_operational_configurations configuration
  set
    candidate_service_tier = null,
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
        'requested_service_tier',
        'applied_service_tier',
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

  if not coalesce(case when v_configuration.candidate_service_tier is null then
    not (p_proof_metadata ?| array['requested_service_tier', 'applied_service_tier'])
  else p_proof_metadata ->> 'requested_service_tier' = v_configuration.candidate_service_tier and
    (p_proof_metadata ->> 'applied_service_tier' = v_configuration.candidate_service_tier or
      (v_configuration.candidate_service_tier = 'fast' and p_proof_metadata ->> 'applied_service_tier' = 'priority'))
  end, false) then
    raise exception using errcode = '22023', message = 'candidate_service_tier_not_proven';
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
    service_tier,
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
    v_configuration.candidate_service_tier,
    p_actor_user_id,
    p_proof_metadata
  )
  returning id into v_revision_id;

  update public.openai_workload_operational_configurations configuration
  set
    pending_revision_id = v_revision_id,
    candidate_service_tier = null,
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

-- Reuse the existing unit -> catalog locks and its single version increment.
-- Clearing a previous tier under the unit lock permits edits across exact models.
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
    (p_model = 'gpt-6.1-sol' and p_service_tier in ('default', 'fast', 'ultrafast')), false
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
alter function public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text) owner to postgres;
revoke all on function public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'ai_readonly') then
    revoke all on function public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text) from ai_readonly;
  end if;
end; $$;
grant execute on function public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text) to service_role;
grant update (candidate_service_tier) on public.openai_workload_operational_configurations to service_role;

comment on column public.openai_workload_configuration_revisions.service_tier is
  'E21.2 requested service tier; null is an immutable legacy snapshot, never an inferred Standard tier.';
comment on column public.openai_workload_operational_configurations.candidate_service_tier is
  'E21.2 candidate tier, effective only after real proof and later explicit human activation.';

notify pgrst, 'reload schema';
commit;
