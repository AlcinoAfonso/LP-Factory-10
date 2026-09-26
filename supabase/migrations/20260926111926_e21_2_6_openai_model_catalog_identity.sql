begin;

-- Keep the historical identity while removing it from future selections.
update public.openai_model_catalog_models
set available_for_selection = false,
    catalog_version = catalog_version + 1,
    updated_at = now()
where modality = 'responses_text'
  and model = 'GPT-6-Sol'
  and available_for_selection;

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
  if p_modality is null or p_model is null or p_parameter_kind is null
     or p_parameter_values is null or p_actor_user_id is null then
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
  if v_parameter_count = 0 or v_parameter_count <> v_distinct_parameter_count
     or exists (
       select 1 from unnest(p_parameter_values) parameter_value
       where parameter_value is null or not (
         (p_modality = 'responses_text' and p_parameter_kind = 'reasoning_effort'
          and parameter_value in ('none', 'low', 'medium', 'high', 'xhigh', 'max'))
         or (p_modality = 'image_generation' and p_parameter_kind = 'quality'
          and parameter_value in ('low', 'medium', 'high'))
       )
     ) then
    raise exception using errcode = '22023', message = 'model_catalog_parameter_set_invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_modality || ':' || pg_catalog.lower(p_model), 0)
  );
  if exists (
    select 1 from public.openai_model_catalog_models existing
    where existing.modality = p_modality
      and pg_catalog.lower(existing.model) = pg_catalog.lower(p_model)
  ) then
    raise exception using errcode = '23505', message = 'model_catalog_identity_conflict';
  end if;

  insert into public.openai_model_catalog_models (
    modality, model, available_for_selection, updated_by
  ) values (p_modality, p_model, false, p_actor_user_id);
  insert into public.openai_model_catalog_parameters (
    modality, model, parameter_kind, parameter_value,
    available_for_selection, updated_by
  )
  select p_modality, p_model, p_parameter_kind, parameter_value, false, p_actor_user_id
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
  if p_modality is null or p_model is null or p_available_for_selection is null
     or p_actor_user_id is null or p_expected_version is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_availability_input_missing';
  end if;
  select model.available_for_selection, model.catalog_version
  into v_available_for_selection, v_catalog_version
  from public.openai_model_catalog_models model
  where model.modality = p_modality and model.model = p_model
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'openai_model_catalog_model_not_found';
  end if;
  if v_catalog_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'openai_model_catalog_stale_version';
  end if;
  if p_available_for_selection and p_modality = 'responses_text'
     and p_model in ('GPT-6-Sol', 'GPT-6-luna') then
    raise exception using errcode = '22023', message = 'model_catalog_historical_variant_unavailable';
  end if;
  if v_available_for_selection = p_available_for_selection then
    return v_catalog_version;
  end if;
  update public.openai_model_catalog_models model
  set available_for_selection = p_available_for_selection,
      catalog_version = model.catalog_version + 1,
      updated_by = p_actor_user_id,
      updated_at = now()
  where model.modality = p_modality and model.model = p_model
  returning model.catalog_version into v_next_catalog_version;
  return v_next_catalog_version;
end;
$$;

create function public.add_openai_model_catalog_reasoning_effort_v1(
  p_model text,
  p_reasoning_effort text,
  p_expected_model_version bigint,
  p_actor_user_id uuid
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_model_version bigint;
  v_next_version bigint;
begin
  if p_model is null or p_reasoning_effort is null
     or p_expected_model_version is null or p_actor_user_id is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_parameter_input_missing';
  end if;
  if p_reasoning_effort not in ('none', 'low', 'medium', 'high', 'xhigh', 'max') then
    raise exception using errcode = '22023', message = 'model_catalog_parameter_set_invalid';
  end if;
  if p_model in ('GPT-6-Sol', 'GPT-6-luna') then
    raise exception using errcode = '22023', message = 'model_catalog_historical_variant_unavailable';
  end if;
  select model.catalog_version into v_model_version
  from public.openai_model_catalog_models model
  where model.modality = 'responses_text' and model.model = p_model
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'openai_model_catalog_model_not_found';
  end if;
  if v_model_version <> p_expected_model_version then
    raise exception using errcode = '40001', message = 'openai_model_catalog_stale_version';
  end if;
  insert into public.openai_model_catalog_parameters (
    modality, model, parameter_kind, parameter_value,
    available_for_selection, updated_by
  ) values (
    'responses_text', p_model, 'reasoning_effort', p_reasoning_effort,
    false, p_actor_user_id
  );
  update public.openai_model_catalog_models model
  set catalog_version = model.catalog_version + 1,
      updated_by = p_actor_user_id,
      updated_at = now()
  where model.modality = 'responses_text' and model.model = p_model
  returning model.catalog_version into v_next_version;
  return v_next_version;
end;
$$;

create function public.reconcile_openai_model_catalog_luna_v1(
  p_expected_legacy_version bigint,
  p_actor_user_id uuid
)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_legacy_version bigint;
begin
  if p_expected_legacy_version is null or p_actor_user_id is null then
    raise exception using errcode = '22004', message = 'required_model_catalog_reconciliation_input_missing';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('responses_text:gpt-6-luna', 0)
  );
  select model.catalog_version into v_legacy_version
  from public.openai_model_catalog_models model
  where model.modality = 'responses_text' and model.model = 'GPT-6-luna'
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'model_catalog_historical_variant_missing';
  end if;
  if v_legacy_version <> p_expected_legacy_version then
    raise exception using errcode = '40001', message = 'openai_model_catalog_stale_version';
  end if;
  if exists (
    select 1 from public.openai_model_catalog_models model
    where model.modality = 'responses_text'
      and pg_catalog.lower(model.model) = 'gpt-6-luna'
      and model.model <> 'GPT-6-luna'
  ) then
    raise exception using errcode = '23505', message = 'model_catalog_identity_conflict';
  end if;
  if not exists (
    select 1 from public.openai_model_catalog_parameters parameter
    where parameter.modality = 'responses_text'
      and parameter.model = 'GPT-6-luna'
      and parameter.parameter_kind = 'reasoning_effort'
      and parameter.parameter_value = 'xhigh'
  ) then
    raise exception using errcode = 'P0002', message = 'model_catalog_historical_parameter_missing';
  end if;
  insert into public.openai_model_catalog_models (
    modality, model, available_for_selection, updated_by
  ) values ('responses_text', 'gpt-6-luna', false, p_actor_user_id);
  insert into public.openai_model_catalog_parameters (
    modality, model, parameter_kind, parameter_value,
    available_for_selection, updated_by
  ) values (
    'responses_text', 'gpt-6-luna', 'reasoning_effort', 'xhigh', false, p_actor_user_id
  );
  update public.openai_model_catalog_models model
  set available_for_selection = false,
      catalog_version = model.catalog_version + 1,
      updated_by = p_actor_user_id,
      updated_at = now()
  where model.modality = 'responses_text'
    and model.model = 'GPT-6-luna';
  return 1;
end;
$$;

alter function public.add_openai_model_catalog_reasoning_effort_v1(text, text, bigint, uuid)
  owner to postgres;
alter function public.reconcile_openai_model_catalog_luna_v1(bigint, uuid)
  owner to postgres;

revoke all on function public.add_openai_model_catalog_reasoning_effort_v1(text, text, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.reconcile_openai_model_catalog_luna_v1(bigint, uuid)
  from public, anon, authenticated, service_role;
do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.add_openai_model_catalog_reasoning_effort_v1(text, text, bigint, uuid) from ai_readonly';
    execute 'revoke all on function public.reconcile_openai_model_catalog_luna_v1(bigint, uuid) from ai_readonly';
  end if;
end;
$$;
grant execute on function public.add_openai_model_catalog_reasoning_effort_v1(text, text, bigint, uuid)
  to service_role;
grant execute on function public.reconcile_openai_model_catalog_luna_v1(bigint, uuid)
  to service_role;

commit;
