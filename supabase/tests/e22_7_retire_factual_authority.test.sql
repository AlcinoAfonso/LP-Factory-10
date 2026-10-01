-- Run only against the isolated fixture after the complete E22.7 migration.
begin;

do $$
declare
  before_row public.e22_7_fixture_receipt%rowtype;
  role_name text;
  factual_row public.taxon_factual_fields%rowtype;
  denied boolean;
begin
  select * into strict before_row from public.e22_7_fixture_receipt;
  if (select count(*) from public.taxon_factual_fields) <> 27
    or before_row.factual_digest is distinct from
      (select md5(string_agg(to_jsonb(t)::text, E'\n' order by id)) from public.taxon_factual_fields t)
    or before_row.revisions_digest is distinct from
      (select md5(string_agg(to_jsonb(t)::text, E'\n' order by id)) from public.openai_workload_configuration_revisions t)
    or before_row.activations_digest is distinct from
      (select md5(string_agg(to_jsonb(t)::text, E'\n' order by id)) from public.openai_workload_configuration_activations t)
    or before_row.independent_units_digest is distinct from
      (select md5(string_agg(to_jsonb(t)::text, E'\n' order by environment, workload)) from public.openai_workload_operational_configurations t
        where workload <> 'taxon_input_catalog_sufficiency_evaluation')
    or before_row.independent_fks_digest is distinct from
      (select md5(string_agg(conname || pg_get_constraintdef(oid), E'\n' order by conname)) from pg_constraint
        where confrelid = 'public.business_taxons'::regclass and conname <> 'taxon_factual_fields_taxon_id_fkey') then
    raise exception 'E22_7_TEST_HISTORICAL_OR_INDEPENDENT_DATA_CHANGED';
  end if;
  if exists (select 1 from public.openai_workload_operational_configurations
      where workload in ('taxon_input_catalog_sufficiency_evaluation', 'landing_page_dynamic_market_research'))
    or exists (select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass
      and conname = 'taxon_factual_fields_taxon_id_fkey')
    or not (select relrowsecurity from pg_class where oid = 'public.taxon_factual_fields'::regclass)
    or exists (select 1 from pg_policy where polrelid = 'public.taxon_factual_fields'::regclass) then
    raise exception 'E22_7_TEST_ACTIVE_FACTUAL_AUTHORITY_REMAINS';
  end if;
  foreach role_name in array array['anon', 'authenticated', 'service_role', 'ai_readonly'] loop
    if has_table_privilege(role_name, 'public.taxon_factual_fields', 'SELECT,INSERT,UPDATE')
      or has_any_column_privilege(role_name, 'public.taxon_factual_fields', 'SELECT,INSERT,UPDATE')
      or has_function_privilege(role_name, 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'EXECUTE') then
      raise exception 'E22_7_TEST_EXTERNAL_PERMISSION_REMAINS';
    end if;
  end loop;
  foreach role_name in array array['taxon_input_catalog_sufficiency_evaluation', 'landing_page_dynamic_market_research'] loop
    denied := false;
    begin
      insert into public.openai_workload_operational_configurations (environment, workload, modality, active_revision_id)
        select 'preview', role_name, 'responses_text', active_revision_id
        from public.openai_workload_operational_configurations
        where environment = 'preview' and workload = 'niche_resolution';
    exception when check_violation then denied := true;
    end;
    if not denied then raise exception 'E22_7_TEST_RETIRED_MUTABLE_ID_ACCEPTED'; end if;
  end loop;

  select * into strict factual_row from public.taxon_factual_fields where field_key = 'e22_fixture_1';
  delete from public.business_taxons where id = '10000000-0000-4000-8000-000000000001';
  if exists (select 1 from public.business_taxons where id = factual_row.taxon_id)
    or not exists (select 1 from public.taxon_factual_fields t where t.id = factual_row.id
      and to_jsonb(t) = to_jsonb(factual_row)) then
    raise exception 'E22_7_TEST_HISTORICAL_FACTUAL_VALUE_NOT_PRESERVED';
  end if;

  -- Research and account links still enforce their independent taxon FKs.
  denied := false;
  begin
    insert into public.taxon_market_research (taxon_id, status, research_block, audience_scope)
      values ('10000000-0000-4000-8000-000000000001', 'draft', 'fixture', 'end_customer');
  exception when foreign_key_violation then denied := true;
  end;
  if not denied then raise exception 'E22_7_TEST_RESEARCH_FK_NOT_ENFORCED'; end if;
  denied := false;
  begin
    insert into public.account_taxonomy (account_id, taxon_id, status, source_type)
      values ('10000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000001', 'active', 'manual');
  exception when foreign_key_violation then denied := true;
  end;
  if not denied then raise exception 'E22_7_TEST_ACCOUNT_FK_NOT_ENFORCED'; end if;
end
$$;

-- Execute real denied commands and the retained taxonomic UPDATE as service_role.
set local role service_role;
do $$
declare denied boolean;
begin
  denied := false;
  begin perform 1 from public.taxon_factual_fields;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'E22_7_TEST_FACTUAL_SELECT_NOT_DENIED'; end if;
  denied := false;
  begin perform public.e20_8_factual_field_definition_is_valid('{}'::jsonb);
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'E22_7_TEST_FUNCTION_EXECUTE_NOT_DENIED'; end if;
  denied := false;
  begin update public.business_taxons set selected_end_customer_research_version = 2
    where id = '10000000-0000-4000-8000-000000000002';
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'E22_7_TEST_SELECTION_UPDATE_NOT_DENIED'; end if;
  update public.business_taxons set name = 'E22 retained taxonomy', slug = 'e22-retained-taxonomy', is_active = false
    where id = '10000000-0000-4000-8000-000000000002';
  if not found then raise exception 'E22_7_TEST_TAXONOMY_UPDATE_FAILED'; end if;
end
$$;
reset role;

rollback;
