-- E22.7: current post-apply read-only verification; E20/E21 snippets remain historical.
begin read only;
with permissions as (
  select bool_and(
    not has_table_privilege(r, 'public.taxon_factual_fields', 'SELECT,INSERT,UPDATE')
    and not has_any_column_privilege(r, 'public.taxon_factual_fields', 'SELECT,INSERT,UPDATE')
    and not has_function_privilege(r, 'public.e20_8_factual_field_definition_is_valid(jsonb)', 'EXECUTE')
  ) external_denied
  from unnest(array['anon','authenticated','service_role','ai_readonly']) r
), checks as (
  select external_denied,
    (select count(*) = 1 from supabase_migrations.schema_migrations where version = '20261001030000') applied,
    (select count(*) = 0 from supabase_migrations.schema_migrations where version in ('20260926145500','20260926171100')) rejected_onboarding_not_applied,
    (select relrowsecurity from pg_class where oid = 'public.taxon_factual_fields'::regclass) rls_enabled,
    not exists(select 1 from pg_policy where polrelid = 'public.taxon_factual_fields'::regclass) no_factual_policies,
    not exists(select 1 from pg_constraint where conrelid = 'public.taxon_factual_fields'::regclass and conname = 'taxon_factual_fields_taxon_id_fkey') factual_fk_removed,
    not exists(select 1 from public.openai_workload_operational_configurations where workload in ('taxon_input_catalog_sufficiency_evaluation','landing_page_dynamic_market_research')) retired_units_absent,
    not has_column_privilege('service_role','public.business_taxons','selected_end_customer_research_version','UPDATE') historical_selection_inert,
    not has_table_privilege('service_role','public.business_taxons','UPDATE')
      and has_column_privilege('service_role','public.business_taxons','name','UPDATE')
      and has_column_privilege('service_role','public.business_taxons','slug','UPDATE')
      and has_column_privilege('service_role','public.business_taxons','is_active','UPDATE') independent_taxonomy_update_preserved
  from permissions
), verdict as (
  select *, external_denied and applied and rejected_onboarding_not_applied and rls_enabled
    and no_factual_policies and factual_fk_removed and retired_units_absent
    and historical_selection_inert and independent_taxonomy_update_preserved passed from checks
)
select 1 / passed::integer fail_closed, to_jsonb(verdict) invariants,
  (select count(*) from public.taxon_factual_fields) factual_count,
  (select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id),'')) from public.taxon_factual_fields t) factual_digest,
  (select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id),'')) from public.openai_workload_configuration_revisions t where workload = 'taxon_input_catalog_sufficiency_evaluation') historical_revisions_digest,
  (select md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' order by id),'')) from public.openai_workload_configuration_activations t where workload = 'taxon_input_catalog_sufficiency_evaluation') historical_activations_digest,
  (select md5(coalesce(string_agg(id::text || ':' || coalesce(selected_end_customer_research_version::text,'null'), E'\n' order by id),'')) from public.business_taxons) historical_selection_digest
from verdict;
rollback;
