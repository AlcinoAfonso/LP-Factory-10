begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e2126000-0000-4000-8000-000000000001', 'authenticated',
        'authenticated', 'e21.2.6-catalog-test@example.com', now(), now());

do $$
declare
  v_actor uuid := 'e2126000-0000-4000-8000-000000000001';
  v_version bigint;
begin
  select catalog_version into v_version
  from public.add_openai_model_catalog_model_v1(
    'responses_text', 'gpt-6-sol', 'reasoning_effort', array['medium'], v_actor
  );
  if v_version <> 1 then raise exception 'new canonical model version invalid'; end if;

  -- A preserved historical row may coexist, but no new case variant can be registered.
  insert into public.openai_model_catalog_models
    (modality, model, available_for_selection, updated_by)
  values ('responses_text', 'GPT-6-Sol', false, v_actor);
  insert into public.openai_model_catalog_parameters
    (modality, model, parameter_kind, parameter_value, available_for_selection, updated_by)
  values ('responses_text', 'GPT-6-Sol', 'reasoning_effort', 'low', true, v_actor);
  begin
    perform public.add_openai_model_catalog_model_v1(
      'responses_text', 'GpT-6-SoL', 'reasoning_effort', array['high'], v_actor
    );
    raise exception 'case variant was accepted';
  exception when unique_violation then
    if sqlerrm <> 'model_catalog_identity_conflict' then raise; end if;
  end;
  begin
    perform public.set_openai_model_catalog_model_availability_v1(
      'responses_text', 'GPT-6-Sol', false, v_actor, 0
    );
    raise exception 'stale model availability was accepted in direct SQL';
  exception when serialization_failure then
    if sqlerrm <> 'openai_model_catalog_stale_version' then raise; end if;
  end;
  begin
    perform public.set_openai_model_catalog_model_availability_v1(
      'responses_text', 'GPT-6-Sol', true, v_actor, 1
    );
    raise exception 'historical Sol was re-enabled';
  exception when invalid_parameter_value then
    if sqlerrm <> 'model_catalog_historical_variant_unavailable' then raise; end if;
  end;

  v_version := public.add_openai_model_catalog_reasoning_effort_v1(
    'gpt-6-sol', 'low', 1, v_actor
  );
  if v_version <> 2 or not exists (
    select 1 from public.openai_model_catalog_parameters
    where modality = 'responses_text' and model = 'gpt-6-sol'
      and parameter_kind = 'reasoning_effort' and parameter_value = 'low'
      and not available_for_selection
  ) then raise exception 'effort was not added unavailable'; end if;
  begin
    perform public.add_openai_model_catalog_reasoning_effort_v1(
      'gpt-6-sol', 'high', 1, v_actor
    );
    raise exception 'stale version was accepted';
  exception when serialization_failure then
    if sqlerrm <> 'openai_model_catalog_stale_version' then raise; end if;
  end;
  begin
    perform public.add_openai_model_catalog_reasoning_effort_v1(
      'gpt-6-sol', 'low', 2, v_actor
    );
    raise exception 'duplicate effort was accepted';
  exception when unique_violation then null;
  end;

  insert into public.openai_model_catalog_models
    (modality, model, available_for_selection, updated_by)
  values ('responses_text', 'GPT-6-luna', true, v_actor);
  insert into public.openai_model_catalog_parameters
    (modality, model, parameter_kind, parameter_value, available_for_selection, updated_by)
  values ('responses_text', 'GPT-6-luna', 'reasoning_effort', 'xhigh', true, v_actor);
  begin
    perform public.add_openai_model_catalog_model_v1(
      'responses_text', 'gpt-6-luna', 'reasoning_effort', array['xhigh'], v_actor
    );
    raise exception 'ordinary creation bypassed historical Luna';
  exception when unique_violation then
    if sqlerrm <> 'model_catalog_identity_conflict' then raise; end if;
  end;

  -- The external confirmation is an action boundary; only this focal RPC may
  -- reconcile the known historical row after that confirmation succeeds.
  perform public.reconcile_openai_model_catalog_luna_v1(1, v_actor);
  if not exists (
    select 1 from public.openai_model_catalog_models
    where modality = 'responses_text' and model = 'gpt-6-luna'
      and not available_for_selection
  ) or not exists (
    select 1 from public.openai_model_catalog_parameters
    where modality = 'responses_text' and model = 'gpt-6-luna'
      and parameter_value = 'xhigh' and not available_for_selection
  ) or not exists (
    select 1 from public.openai_model_catalog_models
    where modality = 'responses_text' and model = 'GPT-6-luna'
      and not available_for_selection and catalog_version = 2
  ) then raise exception 'Luna reconciliation was not atomic'; end if;
  begin
    perform public.reconcile_openai_model_catalog_luna_v1(1, v_actor);
    raise exception 'repeated Luna reconciliation was accepted';
  exception when serialization_failure then
    if sqlerrm <> 'openai_model_catalog_stale_version' then raise; end if;
  end;
  begin
    perform public.set_openai_model_catalog_model_availability_v1(
      'responses_text', 'GPT-6-luna', true, v_actor, 2
    );
    raise exception 'historical Luna was re-enabled';
  exception when invalid_parameter_value then
    if sqlerrm <> 'model_catalog_historical_variant_unavailable' then raise; end if;
  end;
  if (select count(*) from public.openai_model_catalog_models
      where modality = 'responses_text' and lower(model) = 'gpt-6-luna') <> 2 then
    raise exception 'Luna reconciliation added an unexpected identity';
  end if;
end;
$$;

do $postgrest$
declare
  v_actor uuid := 'e2126000-0000-4000-8000-000000000001';
  v_case integer;
  v_message text;
  v_detail text;
  v_sqlstate text;
  v_message_json jsonb;
  v_detail_json jsonb;
begin
  perform set_config('request.method', 'POST', true);
  for v_case in 1..3 loop
    v_message := null;
    v_detail := null;
    v_sqlstate := null;
    begin
      if v_case = 1 then
        perform public.set_openai_model_catalog_model_availability_v1(
          'responses_text', 'gpt-6-sol', false, v_actor, 1
        );
      elsif v_case = 2 then
        perform public.add_openai_model_catalog_reasoning_effort_v1(
          'gpt-6-sol', 'high', 1, v_actor
        );
      else
        perform public.reconcile_openai_model_catalog_luna_v1(1, v_actor);
      end if;
      raise exception 'PostgREST stale conflict was accepted: %', v_case;
    exception when sqlstate 'PGRST' then
      get stacked diagnostics
        v_message = message_text,
        v_detail = pg_exception_detail,
        v_sqlstate = returned_sqlstate;
    end;
    v_message_json := v_message::jsonb;
    v_detail_json := v_detail::jsonb;
    if v_sqlstate <> 'PGRST'
       or v_message_json ->> 'code' <> '40001'
       or v_message_json ->> 'message' <> 'openai_model_catalog_stale_version'
       or (v_detail_json ->> 'status')::integer <> 409
       or jsonb_typeof(v_detail_json -> 'headers') <> 'object' then
      raise exception 'PostgREST stale conflict payload drifted: %', v_case;
    end if;
  end loop;
  perform set_config('request.method', '', true);

  if (select catalog_version from public.openai_model_catalog_models
      where modality = 'responses_text' and model = 'gpt-6-sol') <> 2
     or (select catalog_version from public.openai_model_catalog_models
      where modality = 'responses_text' and model = 'GPT-6-luna') <> 2
     or exists (select 1 from public.openai_model_catalog_parameters
      where modality = 'responses_text' and model = 'gpt-6-sol'
        and parameter_kind = 'reasoning_effort' and parameter_value = 'high') then
    raise exception 'PostgREST stale conflicts changed the catalog';
  end if;
end;
$postgrest$;

rollback;
