-- E22.7: terminal retirement after the application cutover.
-- Preserve historical factual data, E21 revisions/activations and independent domains.
begin;

lock table public.taxon_factual_fields in access exclusive mode;
lock table public.openai_workload_operational_configurations in share row exclusive mode;
lock table public.openai_workload_configuration_revisions,
  public.openai_workload_configuration_activations in share mode;

do $$
declare
  factual_before text;
  revisions_before text;
  activations_before text;
  removed_count bigint;
  external_role text;
begin
  perform 1 from public.openai_workload_operational_configurations
    where workload = 'taxon_input_catalog_sufficiency_evaluation'
    order by environment for update;

  if (select count(*) from public.openai_workload_operational_configurations
      where workload = 'taxon_input_catalog_sufficiency_evaluation') <> 2
    or exists (select 1 from public.openai_workload_operational_configurations
      where workload = 'taxon_input_catalog_sufficiency_evaluation'
        and pending_revision_id is not null)
    or not exists (
      select 1 from public.openai_workload_operational_configurations
      where environment = 'preview' and workload = 'taxon_input_catalog_sufficiency_evaluation'
        and modality = 'responses_text' and configuration_version = 10
        and active_revision_id = '7175d0e9-68fd-4941-808a-774631643864'::uuid
        and candidate_model = 'gpt-5.6-luna' and candidate_reasoning_effort = 'xhigh'
        and candidate_quality is null
        and candidate_saved_by = 'ce899cd2-5360-478e-817e-ee3690aabecd'::uuid
        and candidate_saved_at = '2026-09-16T00:16:37.179443+00:00'::timestamptz
    ) or not exists (
      select 1 from public.openai_workload_operational_configurations
      where environment = 'production' and workload = 'taxon_input_catalog_sufficiency_evaluation'
        and modality = 'responses_text' and configuration_version = 13
        and active_revision_id = 'ab47d48c-2b37-462a-955b-147d65adb4c2'::uuid
        and candidate_model is null and candidate_reasoning_effort is null
        and candidate_quality is null and candidate_saved_by is null and candidate_saved_at is null
    ) or exists (select 1 from public.openai_workload_operational_configurations
      where workload = 'landing_page_dynamic_market_research') then
    raise exception 'E22_7_MUTABLE_CONFIGURATION_DRIFT';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = 'public.taxon_factual_fields'::regclass
      and c.conname = 'taxon_factual_fields_taxon_id_fkey' and c.contype = 'f'
      and c.confrelid = 'public.business_taxons'::regclass
      and c.confupdtype = 'c' and c.confdeltype = 'r'
      and c.conkey = array[(select attnum from pg_catalog.pg_attribute
        where attrelid = c.conrelid and attname = 'taxon_id')]::smallint[]
      and c.confkey = array[(select attnum from pg_catalog.pg_attribute
        where attrelid = c.confrelid and attname = 'id')]::smallint[]
  ) or exists (select 1 from pg_catalog.pg_constraint
      where confrelid = 'public.taxon_factual_fields'::regclass and contype = 'f') then
    raise exception 'E22_7_FACTUAL_DEPENDENCY_DRIFT';
  end if;
  if pg_catalog.has_table_privilege('service_role', 'public.business_taxons', 'UPDATE')
    or not pg_catalog.has_column_privilege('service_role', 'public.business_taxons', 'name', 'UPDATE')
    or not pg_catalog.has_column_privilege('service_role', 'public.business_taxons', 'slug', 'UPDATE')
    or not pg_catalog.has_column_privilege('service_role', 'public.business_taxons', 'is_active', 'UPDATE') then
    raise exception 'E22_7_TAXONOMY_GRANT_DRIFT';
  end if;
  if not (select relrowsecurity from pg_catalog.pg_class
      where oid = 'public.taxon_factual_fields'::regclass)
    or exists (select 1 from pg_catalog.pg_policy
      where polrelid = 'public.taxon_factual_fields'::regclass) then
    raise exception 'E22_7_FACTUAL_POLICY_DRIFT';
  end if;

  select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
    into factual_before from public.taxon_factual_fields t;
  select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
    into revisions_before from public.openai_workload_configuration_revisions t;
  select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
    into activations_before from public.openai_workload_configuration_activations t;

  execute 'alter table public.taxon_factual_fields drop constraint taxon_factual_fields_taxon_id_fkey';
  execute 'revoke select, insert, update on table public.taxon_factual_fields from service_role';
  execute 'revoke execute on function public.e20_8_factual_field_definition_is_valid(jsonb) from public, anon, authenticated, service_role, ai_readonly';
  execute 'revoke update (selected_end_customer_research_version) on table public.business_taxons from service_role';

  with removed as (
    delete from public.openai_workload_operational_configurations
    where workload = 'taxon_input_catalog_sufficiency_evaluation'
      and environment in ('preview', 'production') returning environment
  ) select count(*) into removed_count from removed;
  if removed_count <> 2 then raise exception 'E22_7_RETIREMENT_COUNT_MISMATCH'; end if;

  execute 'alter table public.openai_workload_operational_configurations
    drop constraint openai_workload_operational_configurations_workload_chk,
    drop constraint openai_workload_operational_configurations_modality_chk';
  execute $ddl$alter table public.openai_workload_operational_configurations
    add constraint openai_workload_operational_configurations_workload_chk
      check (workload in ('niche_resolution', 'commercial_activation_draft_generation',
        'landing_page_draft_generation', 'landing_page_draft_image_generation',
        'communication_base_stage1_assistance', 'communication_base_stage2_intelligence')),
    add constraint openai_workload_operational_configurations_modality_chk
      check ((workload in ('niche_resolution', 'commercial_activation_draft_generation',
        'landing_page_draft_generation', 'communication_base_stage1_assistance',
        'communication_base_stage2_intelligence') and modality = 'responses_text')
        or (workload = 'landing_page_draft_image_generation' and modality = 'image_generation'))$ddl$;

  foreach external_role in array array['anon', 'authenticated', 'service_role', 'ai_readonly'] loop
    if pg_catalog.has_table_privilege(external_role, 'public.taxon_factual_fields', 'SELECT,INSERT,UPDATE')
      or pg_catalog.has_function_privilege(external_role,
        'public.e20_8_factual_field_definition_is_valid(jsonb)', 'EXECUTE')
      or pg_catalog.has_any_column_privilege(external_role, 'public.taxon_factual_fields', 'SELECT,INSERT,UPDATE') then
      raise exception 'E22_7_FACTUAL_PERMISSION_REMAINS';
    end if;
  end loop;
  if pg_catalog.has_column_privilege('service_role', 'public.business_taxons',
      'selected_end_customer_research_version', 'UPDATE') then
    raise exception 'E22_7_SELECTION_PERMISSION_REMAINS';
  end if;
  if factual_before is distinct from (select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
      from public.taxon_factual_fields t)
    or revisions_before is distinct from (select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
      from public.openai_workload_configuration_revisions t)
    or activations_before is distinct from (select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id), ''))
      from public.openai_workload_configuration_activations t) then
    raise exception 'E22_7_HISTORICAL_DATA_CHANGED';
  end if;
end
$$;

commit;
