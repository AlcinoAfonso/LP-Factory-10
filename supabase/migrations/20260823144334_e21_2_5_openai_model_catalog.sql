begin;

create table public.openai_model_catalog_models (
  modality text not null,
  model text not null,
  available_for_selection boolean not null default false,
  catalog_version bigint not null default 1,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint openai_model_catalog_models_pkey
    primary key (modality, model),
  constraint openai_model_catalog_models_updated_by_fkey
    foreign key (updated_by)
    references auth.users(id)
    on update restrict
    on delete restrict,
  constraint openai_model_catalog_models_modality_chk
    check (modality in ('responses_text', 'image_generation')),
  constraint openai_model_catalog_models_model_shape_chk
    check (
      char_length(model) between 1 and 128
      and model = btrim(model)
      and model ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
    ),
  constraint openai_model_catalog_models_version_chk
    check (catalog_version > 0),
  constraint openai_model_catalog_models_timestamps_chk
    check (updated_at >= created_at)
);

create index openai_model_catalog_models_updated_by_idx
  on public.openai_model_catalog_models (updated_by)
  where updated_by is not null;

create table public.openai_model_catalog_parameters (
  modality text not null,
  model text not null,
  parameter_kind text not null,
  parameter_value text not null,
  available_for_selection boolean not null default false,
  catalog_version bigint not null default 1,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint openai_model_catalog_parameters_pkey
    primary key (modality, model, parameter_kind, parameter_value),
  constraint openai_model_catalog_parameters_model_fkey
    foreign key (modality, model)
    references public.openai_model_catalog_models(modality, model)
    on update restrict
    on delete restrict,
  constraint openai_model_catalog_parameters_updated_by_fkey
    foreign key (updated_by)
    references auth.users(id)
    on update restrict
    on delete restrict,
  constraint openai_model_catalog_parameters_shape_chk
    check (
      (
        modality = 'responses_text'
        and parameter_kind = 'reasoning_effort'
        and parameter_value in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
      )
      or (
        modality = 'image_generation'
        and parameter_kind = 'quality'
        and parameter_value in ('low', 'medium', 'high')
      )
    ),
  constraint openai_model_catalog_parameters_version_chk
    check (catalog_version > 0),
  constraint openai_model_catalog_parameters_timestamps_chk
    check (updated_at >= created_at)
);

create index openai_model_catalog_parameters_updated_by_idx
  on public.openai_model_catalog_parameters (updated_by)
  where updated_by is not null;

alter table public.openai_model_catalog_models enable row level security;
alter table public.openai_model_catalog_parameters enable row level security;

create or replace function public.prevent_openai_model_catalog_delete_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'openai_model_catalog_identifiers_are_not_deletable';
end;
$$;

create trigger openai_model_catalog_models_prevent_delete
  before delete on public.openai_model_catalog_models
  for each row
  execute function public.prevent_openai_model_catalog_delete_v1();

create trigger openai_model_catalog_parameters_prevent_delete
  before delete on public.openai_model_catalog_parameters
  for each row
  execute function public.prevent_openai_model_catalog_delete_v1();

create or replace function public.assert_openai_model_catalog_model_has_parameter_v1()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if not exists (
    select 1
    from public.openai_model_catalog_parameters parameter
    where parameter.modality = new.modality
      and parameter.model = new.model
  ) then
    raise exception using
      errcode = '23514',
      message = 'openai_model_catalog_model_requires_parameter';
  end if;

  return null;
end;
$$;

create constraint trigger openai_model_catalog_model_has_parameter
  after insert or update on public.openai_model_catalog_models
  deferrable initially deferred
  for each row
  execute function public.assert_openai_model_catalog_model_has_parameter_v1();

insert into public.openai_model_catalog_models (
  modality,
  model,
  available_for_selection
)
values
  ('responses_text', 'gpt-5.4-mini', true),
  ('responses_text', 'gpt-5.6-luna', true),
  ('responses_text', 'gpt-5.6-terra', true),
  ('responses_text', 'gpt-5.6-sol', true),
  ('image_generation', 'gpt-image-2', true)
on conflict (modality, model) do nothing;

with bootstrap(modality, model, parameter_kind, parameter_value) as (
  values
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.4-mini', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-luna', 'reasoning_effort', 'max'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-terra', 'reasoning_effort', 'max'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'none'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'low'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'medium'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'high'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'xhigh'),
    ('responses_text', 'gpt-5.6-sol', 'reasoning_effort', 'max'),
    ('image_generation', 'gpt-image-2', 'quality', 'low'),
    ('image_generation', 'gpt-image-2', 'quality', 'medium'),
    ('image_generation', 'gpt-image-2', 'quality', 'high')
)
insert into public.openai_model_catalog_parameters (
  modality,
  model,
  parameter_kind,
  parameter_value,
  available_for_selection
)
select
  bootstrap.modality,
  bootstrap.model,
  bootstrap.parameter_kind,
  bootstrap.parameter_value,
  true
from bootstrap
order by
  bootstrap.modality,
  bootstrap.model,
  bootstrap.parameter_kind,
  bootstrap.parameter_value
on conflict (modality, model, parameter_kind, parameter_value) do nothing;

alter table public.openai_workload_configuration_revisions
  drop constraint openai_workload_configuration_revisions_shape_chk;

alter table public.openai_workload_configuration_revisions
  add constraint openai_workload_configuration_revisions_shape_chk
    check (
      char_length(model) between 1 and 128
      and model = btrim(model)
      and model ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
      and (
        (
          modality = 'responses_text'
          and reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
          and quality is null
        )
        or (
          modality = 'image_generation'
          and reasoning_effort is null
          and quality in ('low', 'medium', 'high')
        )
      )
    );

alter table public.openai_workload_operational_configurations
  drop constraint openai_workload_operational_configurations_candidate_completeness_chk;

alter table public.openai_workload_operational_configurations
  add constraint openai_workload_operational_configurations_candidate_completeness_chk
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
        and char_length(candidate_model) between 1 and 128
        and candidate_model = btrim(candidate_model)
        and candidate_model ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
        and candidate_saved_by is not null
        and candidate_saved_at is not null
        and pending_revision_id is null
        and (
          (
            modality = 'responses_text'
            and candidate_reasoning_effort in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
            and candidate_quality is null
          )
          or (
            modality = 'image_generation'
            and candidate_reasoning_effort is null
            and candidate_quality in ('low', 'medium', 'high')
          )
        )
      )
    );

create or replace function public.add_openai_model_catalog_model_v1(
  p_modality text,
  p_model text,
  p_parameter_kind text,
  p_parameter_values text[],
  p_actor_user_id uuid
)
returns table(catalog_version bigint, parameter_count bigint)
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_parameter_count bigint;
  v_distinct_parameter_count bigint;
begin
  if p_modality is null
     or p_model is null
     or p_parameter_kind is null
     or p_parameter_values is null
     or p_actor_user_id is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_input_missing';
  end if;

  if char_length(p_model) not between 1 and 128
     or p_model <> btrim(p_model)
     or p_model !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' then
    raise exception using errcode = '22023', message = 'model_catalog_model_shape_invalid';
  end if;

  select count(*), count(distinct parameter_value)
  into v_parameter_count, v_distinct_parameter_count
  from unnest(p_parameter_values) parameter_value;

  if v_parameter_count = 0
     or v_parameter_count <> v_distinct_parameter_count
     or exists (
       select 1
       from unnest(p_parameter_values) parameter_value
       where parameter_value is null
         or not (
           (
             p_modality = 'responses_text'
             and p_parameter_kind = 'reasoning_effort'
             and parameter_value in ('none', 'low', 'medium', 'high', 'xhigh', 'max')
           )
           or (
             p_modality = 'image_generation'
             and p_parameter_kind = 'quality'
             and parameter_value in ('low', 'medium', 'high')
           )
         )
     ) then
    raise exception using errcode = '22023', message = 'model_catalog_parameter_set_invalid';
  end if;

  insert into public.openai_model_catalog_models (
    modality,
    model,
    available_for_selection,
    updated_by
  )
  values (
    p_modality,
    p_model,
    false,
    p_actor_user_id
  );

  insert into public.openai_model_catalog_parameters (
    modality,
    model,
    parameter_kind,
    parameter_value,
    available_for_selection,
    updated_by
  )
  select
    p_modality,
    p_model,
    p_parameter_kind,
    parameter_value,
    false,
    p_actor_user_id
  from unnest(p_parameter_values) parameter_value
  order by parameter_value;

  return query select 1::bigint, v_parameter_count;
end;
$$;

create or replace function public.set_openai_model_catalog_model_availability_v1(
  p_modality text,
  p_model text,
  p_available_for_selection boolean,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_available_for_selection boolean;
  v_catalog_version bigint;
  v_next_catalog_version bigint;
begin
  if p_modality is null
     or p_model is null
     or p_available_for_selection is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_availability_input_missing';
  end if;

  select model.available_for_selection, model.catalog_version
  into v_available_for_selection, v_catalog_version
  from public.openai_model_catalog_models model
  where model.modality = p_modality
    and model.model = p_model
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_model_catalog_model_not_found';
  end if;

  if v_catalog_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'openai_model_catalog_stale_version';
  end if;

  if v_available_for_selection = p_available_for_selection then
    return v_catalog_version;
  end if;

  update public.openai_model_catalog_models model
  set
    available_for_selection = p_available_for_selection,
    catalog_version = model.catalog_version + 1,
    updated_by = p_actor_user_id,
    updated_at = now()
  where model.modality = p_modality
    and model.model = p_model
  returning model.catalog_version into v_next_catalog_version;

  return v_next_catalog_version;
end;
$$;

create or replace function public.set_openai_model_catalog_parameter_availability_v1(
  p_modality text,
  p_model text,
  p_parameter_kind text,
  p_parameter_value text,
  p_available_for_selection boolean,
  p_actor_user_id uuid,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_available_for_selection boolean;
  v_catalog_version bigint;
  v_next_catalog_version bigint;
begin
  if p_modality is null
     or p_model is null
     or p_parameter_kind is null
     or p_parameter_value is null
     or p_available_for_selection is null
     or p_actor_user_id is null
     or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_parameter_availability_input_missing';
  end if;

  perform 1
  from public.openai_model_catalog_models model
  where model.modality = p_modality
    and model.model = p_model
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_model_catalog_model_not_found';
  end if;

  select parameter.available_for_selection, parameter.catalog_version
  into v_available_for_selection, v_catalog_version
  from public.openai_model_catalog_parameters parameter
  where parameter.modality = p_modality
    and parameter.model = p_model
    and parameter.parameter_kind = p_parameter_kind
    and parameter.parameter_value = p_parameter_value
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_model_catalog_parameter_not_found';
  end if;

  if v_catalog_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'openai_model_catalog_stale_version';
  end if;

  if v_available_for_selection = p_available_for_selection then
    return v_catalog_version;
  end if;

  update public.openai_model_catalog_parameters parameter
  set
    available_for_selection = p_available_for_selection,
    catalog_version = parameter.catalog_version + 1,
    updated_by = p_actor_user_id,
    updated_at = now()
  where parameter.modality = p_modality
    and parameter.model = p_model
    and parameter.parameter_kind = p_parameter_kind
    and parameter.parameter_value = p_parameter_value
  returning parameter.catalog_version into v_next_catalog_version;

  return v_next_catalog_version;
end;
$$;

create or replace function public.check_openai_model_catalog_configuration_available_v1(
  p_environment text,
  p_workload text,
  p_expected_configuration_version bigint
)
returns table(
  configuration_version bigint,
  candidate_modality text,
  candidate_model text,
  candidate_parameter_kind text,
  candidate_parameter_value text
)
language plpgsql
stable
security invoker
set search_path = pg_catalog
as $$
declare
  v_configuration_version bigint;
  v_modality text;
  v_model text;
  v_parameter_kind text;
  v_parameter_value text;
  v_model_exists boolean;
  v_model_available boolean;
  v_parameter_exists boolean;
  v_parameter_available boolean;
begin
  if p_environment is null
     or p_workload is null
     or p_expected_configuration_version is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_check_input_missing';
  end if;

  select
    configuration.configuration_version,
    configuration.modality,
    configuration.candidate_model,
    case
      when configuration.modality = 'responses_text' then 'reasoning_effort'
      when configuration.modality = 'image_generation' then 'quality'
    end,
    case
      when configuration.modality = 'responses_text' then configuration.candidate_reasoning_effort
      when configuration.modality = 'image_generation' then configuration.candidate_quality
    end,
    model.model is not null,
    coalesce(model.available_for_selection, false),
    parameter.parameter_value is not null,
    coalesce(parameter.available_for_selection, false)
  into
    v_configuration_version,
    v_modality,
    v_model,
    v_parameter_kind,
    v_parameter_value,
    v_model_exists,
    v_model_available,
    v_parameter_exists,
    v_parameter_available
  from public.openai_workload_operational_configurations configuration
  left join public.openai_model_catalog_models model
    on model.modality = configuration.modality
    and model.model = configuration.candidate_model
  left join public.openai_model_catalog_parameters parameter
    on parameter.modality = configuration.modality
    and parameter.model = configuration.candidate_model
    and parameter.parameter_kind = case
      when configuration.modality = 'responses_text' then 'reasoning_effort'
      when configuration.modality = 'image_generation' then 'quality'
    end
    and parameter.parameter_value = case
      when configuration.modality = 'responses_text' then configuration.candidate_reasoning_effort
      when configuration.modality = 'image_generation' then configuration.candidate_quality
    end
  where configuration.environment = p_environment
    and configuration.workload = p_workload;

  if not found then
    raise exception using errcode = 'P0002', message = 'openai_workload_configuration_not_found';
  end if;

  if v_configuration_version <> p_expected_configuration_version then
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
  end if;

  if v_model is null or v_parameter_kind is null or v_parameter_value is null then
    raise exception using errcode = '55000', message = 'candidate_configuration_not_found';
  end if;

  if not v_model_exists
     or not v_model_available
     or not v_parameter_exists
     or not v_parameter_available then
    raise exception using errcode = '22023', message = 'candidate_configuration_not_available';
  end if;

  return query select
    v_configuration_version,
    v_modality,
    v_model,
    v_parameter_kind,
    v_parameter_value;
end;
$$;

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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
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
    raise exception using errcode = '40001', message = 'openai_workload_configuration_stale_version';
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

alter function public.prevent_openai_model_catalog_delete_v1()
  owner to postgres;
alter function public.assert_openai_model_catalog_model_has_parameter_v1()
  owner to postgres;
alter function public.add_openai_model_catalog_model_v1(text, text, text, text[], uuid)
  owner to postgres;
alter function public.set_openai_model_catalog_model_availability_v1(text, text, boolean, uuid, bigint)
  owner to postgres;
alter function public.set_openai_model_catalog_parameter_availability_v1(text, text, text, text, boolean, uuid, bigint)
  owner to postgres;
alter function public.check_openai_model_catalog_configuration_available_v1(text, text, bigint)
  owner to postgres;
alter function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  owner to postgres;
alter function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  owner to postgres;

revoke all on table public.openai_model_catalog_models
  from public, anon, authenticated, service_role;
revoke all on table public.openai_model_catalog_parameters
  from public, anon, authenticated, service_role;

revoke all on function public.prevent_openai_model_catalog_delete_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.assert_openai_model_catalog_model_has_parameter_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.add_openai_model_catalog_model_v1(text, text, text, text[], uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.set_openai_model_catalog_model_availability_v1(text, text, boolean, uuid, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.set_openai_model_catalog_parameter_availability_v1(text, text, text, text, boolean, uuid, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.check_openai_model_catalog_configuration_available_v1(text, text, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.openai_model_catalog_models from ai_readonly';
    execute 'revoke all on table public.openai_model_catalog_parameters from ai_readonly';
    execute 'revoke all on function public.prevent_openai_model_catalog_delete_v1() from ai_readonly';
    execute 'revoke all on function public.assert_openai_model_catalog_model_has_parameter_v1() from ai_readonly';
    execute 'revoke all on function public.add_openai_model_catalog_model_v1(text, text, text, text[], uuid) from ai_readonly';
    execute 'revoke all on function public.set_openai_model_catalog_model_availability_v1(text, text, boolean, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.set_openai_model_catalog_parameter_availability_v1(text, text, text, text, boolean, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.check_openai_model_catalog_configuration_available_v1(text, text, bigint) from ai_readonly';
    execute 'revoke all on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint) from ai_readonly';
    execute 'revoke all on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint) from ai_readonly';
  end if;
end;
$$;

grant select, insert, update on table public.openai_model_catalog_models
  to service_role;
grant select, insert, update on table public.openai_model_catalog_parameters
  to service_role;

grant execute on function public.add_openai_model_catalog_model_v1(text, text, text, text[], uuid)
  to service_role;
grant execute on function public.set_openai_model_catalog_model_availability_v1(text, text, boolean, uuid, bigint)
  to service_role;
grant execute on function public.set_openai_model_catalog_parameter_availability_v1(text, text, text, text, boolean, uuid, bigint)
  to service_role;
grant execute on function public.check_openai_model_catalog_configuration_available_v1(text, text, bigint)
  to service_role;
grant execute on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  to service_role;
grant execute on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  to service_role;

comment on table public.openai_model_catalog_models
  is 'Catalogo global de modelos OpenAI elegiveis para novas candidatas; indisponibilidade nao altera runtime ou historico.';
comment on table public.openai_model_catalog_parameters
  is 'Combinacoes tipadas modelo + parametro do catalogo OpenAI; nenhuma elegibilidade e derivada por produto cartesiano.';
comment on function public.add_openai_model_catalog_model_v1(text, text, text, text[], uuid)
  is 'Adiciona modelo e conjunto inicial nao vazio de parametros conhecidos, todos indisponiveis ate acao humana explicita.';
comment on function public.set_openai_model_catalog_model_availability_v1(text, text, boolean, uuid, bigint)
  is 'Altera disponibilidade do modelo sob lock e versao otimista.';
comment on function public.set_openai_model_catalog_parameter_availability_v1(text, text, text, text, boolean, uuid, bigint)
  is 'Altera disponibilidade do parametro sob locks ordenados modelo -> parametro e versao otimista.';
comment on function public.check_openai_model_catalog_configuration_available_v1(text, text, bigint)
  is 'Revalida em snapshot read-only a candidata vigente antes da prova externa, sem manter locks durante o transporte.';
comment on function public.save_openai_workload_configuration_candidate_v1(text, text, text, text, text, uuid, bigint)
  is 'Salva candidata elegivel sob locks ordenados unidade -> modelo -> parametro e token otimista, sem efeito no runtime.';
comment on function public.promote_openai_workload_configuration_candidate_v1(text, text, jsonb, uuid, bigint)
  is 'Revalida elegibilidade sob locks ordenados e promove atomicamente a candidata comprovada para revisao pendente.';

commit;
