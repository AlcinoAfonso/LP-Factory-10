begin;

create table public.openai_workload_configuration_revisions (
  id uuid primary key default gen_random_uuid(),
  environment text not null,
  workload text not null,
  modality text not null,
  revision_number bigint not null,
  model text not null,
  reasoning_effort text null,
  quality text null,
  validated_by uuid null,
  validated_at timestamptz not null default now(),
  proof_metadata jsonb not null,
  constraint openai_workload_configuration_revisions_unit_revision_key
    unique (environment, workload, revision_number),
  constraint openai_workload_configuration_revisions_id_unit_key
    unique (id, environment, workload),
  constraint openai_workload_configuration_revisions_validated_by_fkey
    foreign key (validated_by)
    references auth.users(id)
    on update restrict
    on delete restrict,
  constraint openai_workload_configuration_revisions_environment_chk
    check (environment in ('production', 'preview')),
  constraint openai_workload_configuration_revisions_workload_chk
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'landing_page_draft_generation',
      'landing_page_draft_image_generation'
    )),
  constraint openai_workload_configuration_revisions_modality_chk
    check (
      (
        workload in (
          'niche_resolution',
          'commercial_activation_draft_generation',
          'landing_page_draft_generation'
        )
        and modality = 'responses_text'
      )
      or (
        workload = 'landing_page_draft_image_generation'
        and modality = 'image_generation'
      )
    ),
  constraint openai_workload_configuration_revisions_number_chk
    check (revision_number > 0),
  constraint openai_workload_configuration_revisions_shape_chk
    check (
      (
        modality = 'responses_text'
        and quality is null
        and reasoning_effort is not null
        and (
          (
            model = 'gpt-5.4-mini'
            and reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh')
          )
          or (
            model = 'gpt-5.6-luna'
            and reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
          )
        )
      )
      or (
        modality = 'image_generation'
        and model = 'gpt-image-2'
        and reasoning_effort is null
        and quality is not null
        and quality in ('low', 'medium', 'high')
      )
    ),
  constraint openai_workload_configuration_revisions_proof_metadata_chk
    check (
      jsonb_typeof(proof_metadata) = 'object'
      and proof_metadata @> '{"schema_version":1,"proof_result":"approved"}'::jsonb
      and proof_metadata ? 'proof_kind'
      and proof_metadata ->> 'proof_kind' in ('bootstrap', 'operational')
      and proof_metadata - array[
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
  constraint openai_workload_configuration_revisions_validator_chk
    check (
      (
        proof_metadata ->> 'proof_kind' = 'bootstrap'
        and validated_by is null
      )
      or (
        proof_metadata ->> 'proof_kind' = 'operational'
        and validated_by is not null
      )
    )
);

create table public.openai_workload_operational_configurations (
  environment text not null,
  workload text not null,
  modality text not null,
  active_revision_id uuid not null,
  pending_revision_id uuid null,
  candidate_model text null,
  candidate_reasoning_effort text null,
  candidate_quality text null,
  candidate_saved_by uuid null,
  candidate_saved_at timestamptz null,
  configuration_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint openai_workload_operational_configurations_pkey
    primary key (environment, workload),
  constraint openai_workload_operational_configurations_active_revision_fkey
    foreign key (active_revision_id, environment, workload)
    references public.openai_workload_configuration_revisions(id, environment, workload)
    on update restrict
    on delete restrict,
  constraint openai_workload_operational_configurations_pending_revision_fkey
    foreign key (pending_revision_id, environment, workload)
    references public.openai_workload_configuration_revisions(id, environment, workload)
    on update restrict
    on delete restrict,
  constraint openai_workload_operational_configurations_candidate_saved_by_fkey
    foreign key (candidate_saved_by)
    references auth.users(id)
    on update restrict
    on delete restrict,
  constraint openai_workload_operational_configurations_environment_chk
    check (environment in ('production', 'preview')),
  constraint openai_workload_operational_configurations_workload_chk
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'landing_page_draft_generation',
      'landing_page_draft_image_generation'
    )),
  constraint openai_workload_operational_configurations_modality_chk
    check (
      (
        workload in (
          'niche_resolution',
          'commercial_activation_draft_generation',
          'landing_page_draft_generation'
        )
        and modality = 'responses_text'
      )
      or (
        workload = 'landing_page_draft_image_generation'
        and modality = 'image_generation'
      )
    ),
  constraint openai_workload_operational_configurations_version_chk
    check (configuration_version > 0),
  constraint openai_workload_operational_configurations_pending_candidate_chk
    check (pending_revision_id is null or candidate_model is null),
  constraint openai_workload_operational_configurations_pending_differs_from_active_chk
    check (
      pending_revision_id is null
      or pending_revision_id <> active_revision_id
    ),
  constraint openai_workload_operational_configurations_candidate_completeness_chk
    check (
      (
        candidate_model is null
        and candidate_reasoning_effort is null
        and candidate_quality is null
        and candidate_saved_by is null
        and candidate_saved_at is null
      )
      or (
        candidate_model is not null
        and candidate_saved_by is not null
        and candidate_saved_at is not null
        and pending_revision_id is null
        and (
          (
            modality = 'responses_text'
            and candidate_quality is null
            and candidate_reasoning_effort is not null
            and (
              (
                candidate_model = 'gpt-5.4-mini'
                and candidate_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh')
              )
              or (
                candidate_model = 'gpt-5.6-luna'
                and candidate_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
              )
            )
          )
          or (
            modality = 'image_generation'
            and candidate_model = 'gpt-image-2'
            and candidate_reasoning_effort is null
            and candidate_quality is not null
            and candidate_quality in ('low', 'medium', 'high')
          )
        )
      )
    )
);

create table public.openai_workload_configuration_activations (
  id uuid primary key default gen_random_uuid(),
  environment text not null,
  workload text not null,
  modality text not null,
  activation_number bigint not null,
  event_type text not null,
  previous_revision_id uuid null,
  target_revision_id uuid not null,
  actor_user_id uuid null,
  created_at timestamptz not null default now(),
  constraint openai_workload_configuration_activations_unit_number_key
    unique (environment, workload, activation_number),
  constraint openai_workload_configuration_activations_target_revision_fkey
    foreign key (target_revision_id, environment, workload)
    references public.openai_workload_configuration_revisions(id, environment, workload)
    on update restrict
    on delete restrict,
  constraint openai_workload_configuration_activations_previous_revision_fkey
    foreign key (previous_revision_id, environment, workload)
    references public.openai_workload_configuration_revisions(id, environment, workload)
    on update restrict
    on delete restrict,
  constraint openai_workload_configuration_activations_actor_user_id_fkey
    foreign key (actor_user_id)
    references auth.users(id)
    on update restrict
    on delete restrict,
  constraint openai_workload_configuration_activations_environment_chk
    check (environment in ('production', 'preview')),
  constraint openai_workload_configuration_activations_workload_chk
    check (workload in (
      'niche_resolution',
      'commercial_activation_draft_generation',
      'landing_page_draft_generation',
      'landing_page_draft_image_generation'
    )),
  constraint openai_workload_configuration_activations_modality_chk
    check (
      (
        workload in (
          'niche_resolution',
          'commercial_activation_draft_generation',
          'landing_page_draft_generation'
        )
        and modality = 'responses_text'
      )
      or (
        workload = 'landing_page_draft_image_generation'
        and modality = 'image_generation'
      )
    ),
  constraint openai_workload_configuration_activations_number_chk
    check (activation_number > 0),
  constraint openai_workload_configuration_activations_event_type_chk
    check (event_type in ('bootstrap', 'activate', 'rollback')),
  constraint openai_workload_configuration_activations_lifecycle_chk
    check (
      (
        event_type = 'bootstrap'
        and activation_number = 1
        and previous_revision_id is null
        and actor_user_id is null
      )
      or (
        event_type in ('activate', 'rollback')
        and activation_number > 1
        and previous_revision_id is not null
        and previous_revision_id <> target_revision_id
        and actor_user_id is not null
      )
    )
);

create index openai_workload_operational_configurations_active_revision_idx
  on public.openai_workload_operational_configurations (
    active_revision_id,
    environment,
    workload
  );

create index openai_workload_operational_configurations_pending_revision_idx
  on public.openai_workload_operational_configurations (
    pending_revision_id,
    environment,
    workload
  )
  where pending_revision_id is not null;

create index openai_workload_configuration_revisions_validated_by_idx
  on public.openai_workload_configuration_revisions (validated_by)
  where validated_by is not null;

create index openai_workload_configuration_activations_target_revision_idx
  on public.openai_workload_configuration_activations (
    target_revision_id,
    environment,
    workload
  );

create index openai_workload_configuration_activations_previous_revision_idx
  on public.openai_workload_configuration_activations (
    previous_revision_id,
    environment,
    workload
  )
  where previous_revision_id is not null;

create index openai_workload_configuration_activations_actor_user_id_idx
  on public.openai_workload_configuration_activations (actor_user_id)
  where actor_user_id is not null;

with baselines(environment, workload, modality, model, reasoning_effort, quality) as (
  values
    ('production', 'niche_resolution', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('preview', 'niche_resolution', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('production', 'commercial_activation_draft_generation', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('preview', 'commercial_activation_draft_generation', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
    ('production', 'landing_page_draft_generation', 'responses_text', 'gpt-5.6-luna', 'max', null::text),
    ('preview', 'landing_page_draft_generation', 'responses_text', 'gpt-5.6-luna', 'max', null::text),
    ('production', 'landing_page_draft_image_generation', 'image_generation', 'gpt-image-2', null::text, 'medium'),
    ('preview', 'landing_page_draft_image_generation', 'image_generation', 'gpt-image-2', null::text, 'medium')
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
select
  revision.environment,
  revision.workload,
  revision.modality,
  revision.id
from public.openai_workload_configuration_revisions revision
where revision.revision_number = 1
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
on conflict (environment, workload, activation_number) do nothing;

do $$
declare
  v_invalid_count bigint;
begin
  with expected(environment, workload, modality, model, reasoning_effort, quality) as (
    values
      ('production', 'niche_resolution', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
      ('preview', 'niche_resolution', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
      ('production', 'commercial_activation_draft_generation', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
      ('preview', 'commercial_activation_draft_generation', 'responses_text', 'gpt-5.4-mini', 'none', null::text),
      ('production', 'landing_page_draft_generation', 'responses_text', 'gpt-5.6-luna', 'max', null::text),
      ('preview', 'landing_page_draft_generation', 'responses_text', 'gpt-5.6-luna', 'max', null::text),
      ('production', 'landing_page_draft_image_generation', 'image_generation', 'gpt-image-2', null::text, 'medium'),
      ('preview', 'landing_page_draft_image_generation', 'image_generation', 'gpt-image-2', null::text, 'medium')
  )
  select count(*)
  into v_invalid_count
  from expected
  left join public.openai_workload_configuration_revisions revision
    on revision.environment = expected.environment
    and revision.workload = expected.workload
    and revision.revision_number = 1
    and revision.modality = expected.modality
    and revision.model = expected.model
    and revision.reasoning_effort is not distinct from expected.reasoning_effort
    and revision.quality is not distinct from expected.quality
  left join public.openai_workload_operational_configurations configuration
    on configuration.environment = expected.environment
    and configuration.workload = expected.workload
    and configuration.modality = expected.modality
    and configuration.active_revision_id = revision.id
    and configuration.pending_revision_id is null
    and configuration.candidate_model is null
  left join public.openai_workload_configuration_activations activation
    on activation.environment = expected.environment
    and activation.workload = expected.workload
    and activation.modality = expected.modality
    and activation.activation_number = 1
    and activation.event_type = 'bootstrap'
    and activation.target_revision_id = revision.id
  where revision.id is null
    or configuration.active_revision_id is null
    or activation.id is null;

  if v_invalid_count <> 0
     or (select count(*) from public.openai_workload_operational_configurations) <> 8
     or (select count(*) from public.openai_workload_configuration_revisions where revision_number = 1) <> 8
     or (select count(*) from public.openai_workload_configuration_activations where event_type = 'bootstrap') <> 8 then
    raise exception using
      errcode = '23514',
      message = 'e21_2_3_bootstrap_invariant_failed';
  end if;
end;
$$;

create or replace function public.prevent_openai_workload_append_only_mutation_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'openai_workload_history_is_append_only';
end;
$$;

create trigger openai_workload_configuration_revisions_append_only
  before update or delete
  on public.openai_workload_configuration_revisions
  for each row
  execute function public.prevent_openai_workload_append_only_mutation_v1();

create trigger openai_workload_configuration_activations_append_only
  before update or delete
  on public.openai_workload_configuration_activations
  for each row
  execute function public.prevent_openai_workload_append_only_mutation_v1();

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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
  end if;

  if v_pending_revision_id is not null then
    raise exception using errcode = '55000', message = 'validated_revision_already_pending';
  end if;

  if not (
    (
      v_modality = 'responses_text'
      and p_quality is null
      and p_reasoning_effort is not null
      and (
        (
          p_model = 'gpt-5.4-mini'
          and p_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh')
        )
        or (
          p_model = 'gpt-5.6-luna'
          and p_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
        )
      )
    )
    or (
      v_modality = 'image_generation'
      and p_model = 'gpt-image-2'
      and p_reasoning_effort is null
      and p_quality is not null
      and p_quality in ('low', 'medium', 'high')
    )
  ) then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
  end if;

  if v_candidate_model is null then
    raise exception using errcode = '55000', message = 'candidate_configuration_not_found';
  end if;

  update public.openai_workload_operational_configurations configuration
  set
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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
  end if;

  if v_configuration.candidate_model is null
     or v_configuration.pending_revision_id is not null then
    raise exception using errcode = '55000', message = 'candidate_not_promotable';
  end if;

  if jsonb_typeof(p_proof_metadata) <> 'object'
     or not p_proof_metadata @> '{"schema_version":1,"proof_kind":"operational","proof_result":"approved"}'::jsonb
     or p_proof_metadata - array[
       'schema_version',
       'proof_kind',
       'proof_result',
       'request_id',
       'provider_request_id',
       'latency_ms',
       'contract_version',
       'source'
     ] <> '{}'::jsonb then
    raise exception using errcode = '22023', message = 'proof_metadata_not_allowed';
  end if;

  if not (
    (
      v_configuration.modality = 'responses_text'
      and v_configuration.candidate_quality is null
      and v_configuration.candidate_reasoning_effort is not null
      and (
        (
          v_configuration.candidate_model = 'gpt-5.4-mini'
          and v_configuration.candidate_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh')
        )
        or (
          v_configuration.candidate_model = 'gpt-5.6-luna'
          and v_configuration.candidate_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
        )
      )
    )
    or (
      v_configuration.modality = 'image_generation'
      and v_configuration.candidate_model = 'gpt-image-2'
      and v_configuration.candidate_reasoning_effort is null
      and v_configuration.candidate_quality is not null
      and v_configuration.candidate_quality in ('low', 'medium', 'high')
    )
  ) then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_allowed';
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
  )
  values (
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

create or replace function public.activate_openai_workload_configuration_revision_v1(
  p_environment text,
  p_workload text,
  p_target_revision_id uuid,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_configuration public.openai_workload_operational_configurations%rowtype;
  v_activation_number bigint;
  v_next_version bigint;
begin
  if p_environment is null
     or p_workload is null
     or p_target_revision_id is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_activation_input_missing';
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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
  end if;

  if v_configuration.pending_revision_id is distinct from p_target_revision_id then
    raise exception using errcode = '55000', message = 'validated_revision_not_pending';
  end if;

  select coalesce(max(activation.activation_number), 0) + 1
  into v_activation_number
  from public.openai_workload_configuration_activations activation
  where activation.environment = p_environment
    and activation.workload = p_workload;

  update public.openai_workload_operational_configurations configuration
  set
    active_revision_id = p_target_revision_id,
    pending_revision_id = null,
    configuration_version = configuration.configuration_version + 1,
    updated_at = now()
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  returning configuration.configuration_version into v_next_version;

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
  values (
    p_environment,
    p_workload,
    v_configuration.modality,
    v_activation_number,
    'activate',
    v_configuration.active_revision_id,
    p_target_revision_id,
    p_actor_user_id
  );

  return v_next_version;
end;
$$;

create or replace function public.rollback_openai_workload_configuration_revision_v1(
  p_environment text,
  p_workload text,
  p_target_revision_id uuid,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_configuration public.openai_workload_operational_configurations%rowtype;
  v_activation_number bigint;
  v_next_version bigint;
begin
  if p_environment is null
     or p_workload is null
     or p_target_revision_id is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_rollback_input_missing';
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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
  end if;

  if v_configuration.active_revision_id = p_target_revision_id
     or not exists (
       select 1
       from public.openai_workload_configuration_activations activation
       where activation.environment = p_environment
         and activation.workload = p_workload
         and activation.target_revision_id = p_target_revision_id
     ) then
    raise exception using errcode = '55000', message = 'rollback_target_was_not_previously_active';
  end if;

  select coalesce(max(activation.activation_number), 0) + 1
  into v_activation_number
  from public.openai_workload_configuration_activations activation
  where activation.environment = p_environment
    and activation.workload = p_workload;

  update public.openai_workload_operational_configurations configuration
  set
    active_revision_id = p_target_revision_id,
    pending_revision_id = null,
    configuration_version = configuration.configuration_version + 1,
    updated_at = now()
  where configuration.environment = p_environment
    and configuration.workload = p_workload
  returning configuration.configuration_version into v_next_version;

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
  values (
    p_environment,
    p_workload,
    v_configuration.modality,
    v_activation_number,
    'rollback',
    v_configuration.active_revision_id,
    p_target_revision_id,
    p_actor_user_id
  );

  return v_next_version;
end;
$$;

alter function public.prevent_openai_workload_append_only_mutation_v1()
  owner to postgres;
alter function public.save_openai_workload_configuration_candidate_v1(
  text, text, text, text, text, uuid, bigint
) owner to postgres;
alter function public.discard_openai_workload_configuration_candidate_v1(
  text, text, uuid, bigint
) owner to postgres;
alter function public.promote_openai_workload_configuration_candidate_v1(
  text, text, jsonb, uuid, bigint
) owner to postgres;
alter function public.activate_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) owner to postgres;
alter function public.rollback_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) owner to postgres;

alter table public.openai_workload_operational_configurations enable row level security;
alter table public.openai_workload_configuration_revisions enable row level security;
alter table public.openai_workload_configuration_activations enable row level security;

revoke all on table public.openai_workload_operational_configurations
  from public, anon, authenticated, service_role;
revoke all on table public.openai_workload_configuration_revisions
  from public, anon, authenticated, service_role;
revoke all on table public.openai_workload_configuration_activations
  from public, anon, authenticated, service_role;

revoke all on function public.prevent_openai_workload_append_only_mutation_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.save_openai_workload_configuration_candidate_v1(
  text, text, text, text, text, uuid, bigint
) from public, anon, authenticated, service_role;
revoke all on function public.discard_openai_workload_configuration_candidate_v1(
  text, text, uuid, bigint
) from public, anon, authenticated, service_role;
revoke all on function public.promote_openai_workload_configuration_candidate_v1(
  text, text, jsonb, uuid, bigint
) from public, anon, authenticated, service_role;
revoke all on function public.activate_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) from public, anon, authenticated, service_role;
revoke all on function public.rollback_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.openai_workload_operational_configurations from ai_readonly';
    execute 'revoke all on table public.openai_workload_configuration_revisions from ai_readonly';
    execute 'revoke all on table public.openai_workload_configuration_activations from ai_readonly';
    execute 'revoke all on function public.prevent_openai_workload_append_only_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.discard_openai_workload_configuration_candidate_v1(text, text, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.activate_openai_workload_configuration_revision_v1(text, text, uuid, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.rollback_openai_workload_configuration_revision_v1(text, text, uuid, uuid, bigint) from ai_readonly';
  end if;
end;
$$;

grant select on table public.openai_workload_operational_configurations
  to service_role;
grant update (
  active_revision_id,
  pending_revision_id,
  candidate_model,
  candidate_reasoning_effort,
  candidate_quality,
  candidate_saved_by,
  candidate_saved_at,
  configuration_version,
  updated_at
) on table public.openai_workload_operational_configurations
  to service_role;

grant select, insert on table public.openai_workload_configuration_revisions
  to service_role;
grant select, insert on table public.openai_workload_configuration_activations
  to service_role;

grant execute on function public.save_openai_workload_configuration_candidate_v1(
  text, text, text, text, text, uuid, bigint
) to service_role;
grant execute on function public.discard_openai_workload_configuration_candidate_v1(
  text, text, uuid, bigint
) to service_role;
grant execute on function public.promote_openai_workload_configuration_candidate_v1(
  text, text, jsonb, uuid, bigint
) to service_role;
grant execute on function public.activate_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) to service_role;
grant execute on function public.rollback_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) to service_role;

comment on table public.openai_workload_operational_configurations
  is 'Unidade operacional environment + workload com revisao ativa, candidata mutavel ou revisao validada pendente e token otimista.';
comment on table public.openai_workload_configuration_revisions
  is 'Snapshots validados append-only das configuracoes operacionais dos workloads OpenAI.';
comment on table public.openai_workload_configuration_activations
  is 'Eventos append-only de bootstrap, ativacao e rollback das configuracoes operacionais dos workloads OpenAI.';

comment on function public.save_openai_workload_configuration_candidate_v1(
  text, text, text, text, text, uuid, bigint
) is 'Salva ou edita candidata sob lock da unidade e token otimista, sem efeito no runtime.';
comment on function public.discard_openai_workload_configuration_candidate_v1(
  text, text, uuid, bigint
) is 'Descarta candidata sob lock da unidade e token otimista.';
comment on function public.promote_openai_workload_configuration_candidate_v1(
  text, text, jsonb, uuid, bigint
) is 'Promove candidata comprovada para revisao validada append-only pendente de ativacao.';
comment on function public.activate_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) is 'Ativa atomicamente a revisao validada pendente e registra evento humano.';
comment on function public.rollback_openai_workload_configuration_revision_v1(
  text, text, uuid, uuid, bigint
) is 'Reativa atomicamente revisao anteriormente ativa e registra rollback humano.';

commit;
