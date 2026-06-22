-- e10_7_phase_2_draft_verify.sql
-- Objetivo: verificar o draft gerado pela E10.7 Fase 2 para o taxon piloto.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.

with constants as (
  select
    'corretor-de-imoveis-de-medio-padrao'::text as pilot_slug,
    'business_buyer'::text as expected_audience_scope,
    1::integer as expected_research_version
),

pilot as (
  select business_taxons.*
  from public.business_taxons
  join constants
    on constants.pilot_slug = business_taxons.slug
),

latest_draft as (
  select content_artifacts.*
  from public.content_artifacts
  join pilot
    on pilot.id = content_artifacts.taxon_id
  join constants
    on constants.expected_audience_scope = content_artifacts.audience_scope
   and constants.expected_research_version = content_artifacts.research_version
  where content_artifacts.status = 'draft'
  order by content_artifacts.artifact_version desc, content_artifacts.created_at desc
  limit 1
),

published_count as (
  select count(*) as total
  from public.content_artifacts
  join pilot
    on pilot.id = content_artifacts.taxon_id
  where content_artifacts.status = 'published'
),

business_sources as (
  select count(*) as total
  from latest_draft
  join public.content_artifact_research_sources sources
    on sources.artifact_id = latest_draft.id
  where sources.audience_scope = 'business_buyer'
),

end_customer_sources as (
  select count(*) as total
  from latest_draft
  join public.content_artifact_research_sources sources
    on sources.artifact_id = latest_draft.id
  where sources.audience_scope = 'end_customer'
),

content_sections as (
  select count(*) as total
  from latest_draft,
  lateral jsonb_array_elements(latest_draft.content_json -> 'sections') section
),

provenance_status as (
  select
    latest_draft.id,
    latest_draft.provenance_json,
    case
      when latest_draft.id is null then false
      when latest_draft.provenance_json ? 'business_buyer_sources'
       and latest_draft.provenance_json ? 'end_customer_context'
       and latest_draft.provenance_json ? 'plans'
       and latest_draft.provenance_json ? 'model_env_var'
      then true
      else false
    end as has_required_context
  from constants
  left join latest_draft on true
),

plans_status as (
  select
    count(*) filter (where name in ('Starter', 'Lite', 'Pro', 'Ultra')) as expected_plan_count,
    count(*) filter (where name = 'Light') as light_count
  from public.plans
)

select
  'latest_draft'::text as check_group,
  'status'::text as object_name,
  case
    when latest_draft.id is null then 'missing'
    when latest_draft.status <> 'draft' then 'unexpected_status'
    when latest_draft.audience_scope <> 'business_buyer' then 'unexpected_audience'
    when latest_draft.research_version <> 1 then 'unexpected_research_version'
    else 'ok'
  end as check_status,
  jsonb_build_object(
    'artifact_id', latest_draft.id,
    'artifact_version', latest_draft.artifact_version,
    'status', latest_draft.status,
    'audience_scope', latest_draft.audience_scope,
    'research_version', latest_draft.research_version
  ) as details
from constants
left join latest_draft on true

union all

select
  'content_json'::text,
  'sections'::text,
  case when content_sections.total = 8 then 'ok' else 'unexpected_count' end,
  jsonb_build_object('section_count', content_sections.total)
from content_sections

union all

select
  'research_sources'::text,
  'business_buyer_only'::text,
  case
    when business_sources.total = 4 and end_customer_sources.total = 0 then 'ok'
    else 'unexpected_sources'
  end,
  jsonb_build_object(
    'business_buyer_count', business_sources.total,
    'end_customer_count', end_customer_sources.total
  )
from business_sources
cross join end_customer_sources

union all

select
  'provenance_json'::text,
  'required_context'::text,
  case
    when provenance_status.id is null then 'missing_draft'
    when provenance_status.has_required_context then 'ok'
    else 'missing_context'
  end,
  jsonb_build_object(
    'model_env_var', provenance_status.provenance_json ->> 'model_env_var',
    'business_buyer_source_count', coalesce(jsonb_array_length(provenance_status.provenance_json -> 'business_buyer_sources'), 0),
    'end_customer_context_count', coalesce(jsonb_array_length(provenance_status.provenance_json -> 'end_customer_context'), 0),
    'plans_count', coalesce(jsonb_array_length(provenance_status.provenance_json -> 'plans'), 0)
  )
from provenance_status

union all

select
  'plans'::text,
  'canonical_names'::text,
  case
    when plans_status.expected_plan_count = 4 and plans_status.light_count = 0 then 'ok'
    else 'unexpected_plans'
  end,
  jsonb_build_object(
    'expected_plan_count', plans_status.expected_plan_count,
    'light_count', plans_status.light_count
  )
from plans_status

union all

select
  'published'::text,
  'not_modified_by_phase_2'::text,
  case when published_count.total = 0 then 'ok' else 'review_existing_published' end,
  jsonb_build_object('published_count', published_count.total)
from published_count

order by check_group, object_name;
