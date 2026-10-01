-- Local disposable fixture only. No hosted apply or ledger claim for fixture DDL.
alter table public.business_taxons
  add column selected_end_customer_research_version integer;
revoke update on public.business_taxons from service_role;
grant update (name, slug, is_active, selected_end_customer_research_version)
  on public.business_taxons to service_role;

insert into auth.users (id, email)
  values ('ce899cd2-5360-478e-817e-ee3690aabecd', 'e22-sql-fixture@example.invalid');
insert into public.accounts (id, name, subdomain, status)
  values ('10000000-0000-4000-8000-000000000020', 'E22 fixture account', 'e22-fixture-account', 'active');
insert into public.business_taxons (id, level, name, slug, is_active)
  values ('10000000-0000-4000-8000-000000000001', 'segment', 'E22 historical fixture', 'e22-historical-fixture', false),
    ('10000000-0000-4000-8000-000000000002', 'segment', 'E22 research fixture', 'e22-research-fixture', true),
    ('10000000-0000-4000-8000-000000000003', 'segment', 'E22 account fixture', 'e22-account-fixture', true);
insert into public.taxon_factual_fields (field_key, taxon_id, definition)
  select 'e22_fixture_' || n,
    case when n = 1 then '10000000-0000-4000-8000-000000000001'::uuid else null end,
    '{"purpose":"Historical fixture","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"type_only"}}'::jsonb
  from generate_series(1,27) n;

-- Reproduce the inspected mutable tokens without rewriting append-only history.
insert into public.openai_workload_configuration_revisions (
  id, environment, workload, modality, revision_number, model,
  reasoning_effort, quality, validated_by, proof_metadata
)
select case when environment = 'preview'
    then '7175d0e9-68fd-4941-808a-774631643864'::uuid
    else 'ab47d48c-2b37-462a-955b-147d65adb4c2'::uuid end,
  environment, workload, modality, 2, model, reasoning_effort, quality,
  validated_by, proof_metadata
from public.openai_workload_configuration_revisions
where workload = 'taxon_input_catalog_sufficiency_evaluation' and revision_number = 1;

update public.openai_workload_operational_configurations set
  active_revision_id = case when environment = 'preview'
    then '7175d0e9-68fd-4941-808a-774631643864'::uuid
    else 'ab47d48c-2b37-462a-955b-147d65adb4c2'::uuid end,
  configuration_version = case when environment = 'preview' then 10 else 13 end,
  candidate_model = case when environment = 'preview' then 'gpt-5.6-luna' end,
  candidate_reasoning_effort = case when environment = 'preview' then 'xhigh' end,
  candidate_saved_by = case when environment = 'preview' then 'ce899cd2-5360-478e-817e-ee3690aabecd'::uuid end,
  candidate_saved_at = case when environment = 'preview' then '2026-09-16T00:16:37.179443+00:00'::timestamptz end
where workload = 'taxon_input_catalog_sufficiency_evaluation';

-- Preserve independently managed Base units, using the canonical E21 aggregate.
insert into public.openai_workload_configuration_revisions (
  environment, workload, modality, revision_number, model,
  reasoning_effort, quality, validated_by, proof_metadata
)
select r.environment, base.workload, r.modality, 1,
  case when base.workload = 'communication_base_stage2_intelligence' then 'gpt-6-luna' else r.model end,
  case when base.workload = 'communication_base_stage2_intelligence' then 'max' else r.reasoning_effort end,
  r.quality, r.validated_by, r.proof_metadata
from public.openai_workload_configuration_revisions r
cross join (values ('communication_base_stage1_assistance'), ('communication_base_stage2_intelligence')) base(workload)
where r.workload = 'niche_resolution' and r.revision_number = 1;
insert into public.openai_workload_operational_configurations (environment, workload, modality, active_revision_id)
  select environment, workload, modality, id from public.openai_workload_configuration_revisions
  where workload in ('communication_base_stage1_assistance', 'communication_base_stage2_intelligence');

-- Persistent only within the disposable test database, never a product archive.
create table public.e22_7_fixture_receipt as select
  (select md5(string_agg(to_jsonb(t)::text, E'\n' order by id)) from public.taxon_factual_fields t) factual_digest,
  (select md5(string_agg(to_jsonb(t)::text, E'\n' order by id)) from public.openai_workload_configuration_revisions t) revisions_digest,
  (select md5(string_agg(to_jsonb(t)::text, E'\n' order by id)) from public.openai_workload_configuration_activations t) activations_digest,
  (select md5(string_agg(to_jsonb(t)::text, E'\n' order by environment, workload)) from public.openai_workload_operational_configurations t
    where workload <> 'taxon_input_catalog_sufficiency_evaluation') independent_units_digest,
  (select md5(string_agg(conname || pg_get_constraintdef(oid), E'\n' order by conname)) from pg_constraint
    where confrelid = 'public.business_taxons'::regclass and conname <> 'taxon_factual_fields_taxon_id_fkey') independent_fks_digest;
