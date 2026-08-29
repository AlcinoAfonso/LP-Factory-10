begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e2074000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e20.7.4-workload-test@example.com',
  now(),
  now()
);

do $$
declare
  v_actor_id constant uuid := 'e2074000-0000-4000-8000-000000000001';
  v_workload constant text := 'landing_page_dynamic_market_research';
  v_version bigint;
  v_saved_version bigint;
  v_promoted_version bigint;
begin
  if (select count(*) from public.openai_workload_operational_configurations) <> 12
     or (select count(*) from public.openai_workload_operational_configurations where workload = v_workload) <> 2 then
    raise exception 'E21.2 aggregate must contain exactly twelve complete units';
  end if;

  select configuration_version into v_version
  from public.openai_workload_operational_configurations
  where environment = 'preview' and workload = v_workload;

  begin
    perform public.save_openai_workload_configuration_candidate_v1(
      'preview', v_workload, 'gpt-5.6-terra', 'high', null, v_actor_id, v_version
    );
    raise exception 'configuration outside the focal E20.7.4 matrix should fail';
  exception when invalid_parameter_value then
    null;
  end;

  v_saved_version := public.save_openai_workload_configuration_candidate_v1(
    'preview', v_workload, 'gpt-5.6-terra', 'medium', null, v_actor_id, v_version
  );
  if v_saved_version <> v_version + 1 then
    raise exception 'candidate save must advance the aggregate version';
  end if;

  select configuration_version into v_promoted_version
  from public.promote_openai_workload_configuration_candidate_v1(
    'preview',
    v_workload,
    '{"schema_version":1,"proof_kind":"operational","proof_result":"approved","source":"openai_api"}'::jsonb,
    v_actor_id,
    v_saved_version
  );
  if v_promoted_version <> v_saved_version + 1 then
    raise exception 'promotion must advance the aggregate version';
  end if;

  if not exists (
    select 1
    from public.openai_workload_configuration_revisions revision
    join public.openai_workload_operational_configurations configuration
      on configuration.pending_revision_id = revision.id
    where revision.environment = 'preview'
      and revision.workload = v_workload
      and revision.model = 'gpt-5.6-terra'
      and revision.reasoning_effort = 'medium'
  ) then
    raise exception 'approved candidate must become the pending revision';
  end if;

  if exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'openai_workload_operational_configurations',
        'openai_workload_configuration_revisions',
        'openai_workload_configuration_activations'
      )
  ) then
    raise exception 'E21.2 lifecycle tables must remain without public policies';
  end if;
end;
$$;

rollback;
