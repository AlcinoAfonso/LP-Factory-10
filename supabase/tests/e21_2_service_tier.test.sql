begin;
do $$
declare
  actor uuid := '10000000-0000-4000-8000-000000000001';
  original_id uuid;
  target_id uuid;
  ver bigint;
begin
  if exists (
    select 1 from public.openai_workload_configuration_revisions
    where service_tier is not null
  ) then raise exception 'migration backfilled history'; end if;
  if exists (
    select 1 from e21_before b join public.openai_workload_operational_configurations u
    using (environment,workload) where b.snapshot <> to_jsonb(u) - 'candidate_service_tier'
  ) then raise exception 'migration changed existing units or pending'; end if;

  insert into auth.users(id) values(actor) on conflict do nothing;
  insert into public.openai_model_catalog_models(modality,model,available_for_selection)
    values ('responses_text','gpt-6-luna',true),('responses_text','gpt-6.1-sol',true);
  insert into public.openai_model_catalog_parameters(modality,model,parameter_kind,parameter_value,available_for_selection)
    values ('responses_text','gpt-6-luna','reasoning_effort','none',true),
           ('responses_text','gpt-6.1-sol','reasoning_effort','none',true);
  select active_revision_id into original_id from public.openai_workload_operational_configurations
    where environment='preview' and workload='niche_resolution';
  ver := public.save_openai_workload_configuration_candidate_v2('preview','niche_resolution','gpt-6-luna','none',null,actor,1,'fast');
  if ver <> 2 then raise exception 'version increment'; end if;
  begin
    perform public.save_openai_workload_configuration_candidate_v2('preview','niche_resolution','gpt-6-luna','none',null,actor,ver,'ultrafast');
    raise exception 'Luna ultrafast accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.save_openai_workload_configuration_candidate_v2('preview','niche_resolution','gpt-6.1-sol','none',null,actor,1,'ultrafast');
    raise exception 'stale version accepted';
  exception when serialization_failure then null; end;
  if (select candidate_service_tier from public.openai_workload_operational_configurations
      where environment='preview' and workload='niche_resolution') <> 'fast' then raise exception 'failed save mutated candidate'; end if;
  begin
    perform public.promote_openai_workload_configuration_candidate_v1('preview','niche_resolution',
      '{"schema_version":1,"proof_kind":"operational","proof_result":"approved","source":"openai_api","requested_service_tier":"fast","applied_service_tier":"default"}',actor,ver);
    raise exception 'downgrade promoted';
  exception when invalid_parameter_value then null; end;
  select candidate_revision_id,configuration_version into target_id,ver
    from public.promote_openai_workload_configuration_candidate_v1('preview','niche_resolution',
      '{"schema_version":1,"proof_kind":"operational","proof_result":"approved","source":"openai_api","requested_service_tier":"fast","applied_service_tier":"priority"}',actor,ver);
  if (select active_revision_id from public.openai_workload_operational_configurations where environment='preview' and workload='niche_resolution') <> original_id
    then raise exception 'promotion activated'; end if;
  if (select service_tier from public.openai_workload_configuration_revisions where id=target_id) <> 'fast'
    then raise exception 'promotion lost tier'; end if;
  ver := public.activate_openai_workload_configuration_revision_v1('preview','niche_resolution',target_id,actor,ver);
  ver := public.rollback_openai_workload_configuration_revision_v1('preview','niche_resolution',original_id,actor,ver);
  if (select active_revision_id from public.openai_workload_operational_configurations where environment='preview' and workload='niche_resolution') <> original_id
    then raise exception 'rollback failed'; end if;
  ver := public.save_openai_workload_configuration_candidate_v2('preview','niche_resolution','gpt-6.1-sol','none',null,actor,ver,'ultrafast');
  ver := public.save_openai_workload_configuration_candidate_v2('preview','niche_resolution','gpt-6-luna','none',null,actor,ver,'fast');
  ver := public.discard_openai_workload_configuration_candidate_v1('preview','niche_resolution',actor,ver);
  if (select candidate_service_tier from public.openai_workload_operational_configurations where environment='preview' and workload='niche_resolution') is not null
    then raise exception 'discard retained tier'; end if;
  begin
    perform public.save_openai_workload_configuration_candidate_v2('preview','niche_resolution','gpt-5.4-mini','none',null,actor,ver,'default');
    raise exception 'unsupported model accepted';
  exception when invalid_parameter_value then null; end;
  if has_function_privilege('authenticated','public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text)','execute')
    or has_function_privilege('anon','public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text)','execute')
    or has_function_privilege('ai_readonly','public.save_openai_workload_configuration_candidate_v2(text,text,text,text,text,uuid,bigint,text)','execute')
    or not has_column_privilege('service_role','public.openai_workload_operational_configurations','candidate_service_tier','update')
    then raise exception 'tier ACL invalid'; end if;
  begin
    update public.openai_workload_configuration_revisions set service_tier='default' where id=target_id;
    raise exception 'history mutable';
  exception when object_not_in_prerequisite_state then null; end;
end;
$$;
rollback;
