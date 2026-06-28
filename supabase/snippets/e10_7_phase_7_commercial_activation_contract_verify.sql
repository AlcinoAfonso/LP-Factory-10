-- e10_7_phase_7_commercial_activation_contract_verify.sql
-- Objetivo: verificar o contrato deterministico do template commercial_activation.
-- Tipo: read-only / recorrente. Usar no Supabase Inspect ou SQL Editor.

with expected_sections(module_key, variant_key, sort_order) as (
  values
    ('hero'::text, 'hero.default'::text, 10),
    ('benefits'::text, 'benefits.cards'::text, 20),
    ('services'::text, 'services.list'::text, 30),
    ('plans'::text, 'plans.cards'::text, 40),
    ('differentials'::text, 'differentials.cards'::text, 50),
    ('how_it_works'::text, 'how_it_works.steps'::text, 60),
    ('faq'::text, 'faq.accordion'::text, 70),
    ('final_cta'::text, 'final_cta.simple'::text, 80)
),

page_template as (
  select id
  from public.content_templates
  where template_key = 'commercial_activation_page'
    and template_family = 'commercial_activation'
    and template_scope = 'page'
    and version = 1
    and status = 'active'
    and is_active = true
),

section_templates as (
  select
    expected_sections.module_key,
    expected_sections.variant_key,
    expected_sections.sort_order,
    content_templates.id as template_id
  from expected_sections
  left join public.content_templates
    on content_templates.template_key = expected_sections.module_key
   and content_templates.template_family = 'commercial_activation'
   and content_templates.template_scope = 'section'
   and content_templates.version = 1
   and content_templates.status = 'active'
   and content_templates.is_active = true
),

active_compositions as (
  select compositions.*
  from public.content_template_compositions compositions
  join page_template
    on page_template.id = compositions.template_id
  where compositions.status = 'active'
),

composition_items as (
  select
    compositions.id as composition_id,
    items.id as composition_item_id,
    module_templates.template_key as module_key,
    items.variant_key,
    items.sort_order,
    items.is_required
  from active_compositions compositions
  join public.content_template_composition_items items
    on items.composition_id = compositions.id
  join public.content_templates module_templates
    on module_templates.id = items.module_template_id
),

composition_failures as (
  select active_compositions.id as composition_id
  from active_compositions
  where (
    select count(*)
    from composition_items
    where composition_items.composition_id = active_compositions.id
  ) <> 8
  or exists (
    select 1
    from expected_sections
    left join composition_items
      on composition_items.composition_id = active_compositions.id
     and composition_items.module_key = expected_sections.module_key
     and composition_items.variant_key = expected_sections.variant_key
     and composition_items.sort_order = expected_sections.sort_order
     and composition_items.is_required = true
    where composition_items.composition_item_id is null
  )
),

published_groups as (
  select
    template_id,
    taxon_id,
    audience_scope,
    count(*) as published_count
  from public.content_artifacts
  where status = 'published'
  group by template_id, taxon_id, audience_scope
),

published_artifacts as (
  select artifacts.*
  from public.content_artifacts artifacts
  join page_template
    on page_template.id = artifacts.template_id
  where artifacts.status = 'published'
    and artifacts.audience_scope = 'business_buyer'
),

published_content_sections as (
  select
    published_artifacts.id as artifact_id,
    published_artifacts.composition_id,
    section.value as section_json,
    section.ordinality
  from published_artifacts
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(published_artifacts.content_json -> 'sections') = 'array'
      then published_artifacts.content_json -> 'sections'
      else '[]'::jsonb
    end
  ) with ordinality as section(value, ordinality)
),

published_content_failures as (
  select
    published_artifacts.id,
    case
      when published_artifacts.content_json ->> 'schema_version' <> '1'
        then 'invalid_schema_version'
      when jsonb_typeof(published_artifacts.content_json -> 'sections') <> 'array'
        then 'sections_not_array'
      when count(published_content_sections.section_json) <> 8
        then 'unexpected_section_count'
      when count(distinct published_content_sections.section_json ->> 'composition_item_id') <> 8
        then 'duplicate_or_missing_composition_item_id'
      when count(*) filter (
        where jsonb_typeof(published_content_sections.section_json -> 'content') is distinct from 'object'
      ) > 0
        then 'section_content_not_object'
      when count(*) filter (
        where composition_items.composition_item_id is null
      ) > 0
        then 'unknown_composition_item_id'
      when (
        select count(*)
        from composition_items required_items
        left join published_content_sections required_sections
          on required_sections.composition_id = required_items.composition_id
         and required_sections.artifact_id = published_artifacts.id
         and required_sections.section_json ->> 'composition_item_id' = required_items.composition_item_id::text
        where required_items.composition_id = published_artifacts.composition_id
          and required_items.is_required = true
          and required_sections.artifact_id is null
      ) > 0
        then 'required_composition_item_missing'
      else null
    end as failure_reason
  from published_artifacts
  left join published_content_sections
    on published_content_sections.artifact_id = published_artifacts.id
  left join composition_items
    on composition_items.composition_id = published_artifacts.composition_id
   and composition_items.composition_item_id::text = published_content_sections.section_json ->> 'composition_item_id'
  group by
    published_artifacts.id,
    published_artifacts.composition_id,
    published_artifacts.content_json
  having case
      when published_artifacts.content_json ->> 'schema_version' <> '1'
        then 'invalid_schema_version'
      when jsonb_typeof(published_artifacts.content_json -> 'sections') <> 'array'
        then 'sections_not_array'
      when count(published_content_sections.section_json) <> 8
        then 'unexpected_section_count'
      when count(distinct published_content_sections.section_json ->> 'composition_item_id') <> 8
        then 'duplicate_or_missing_composition_item_id'
      when count(*) filter (
        where jsonb_typeof(published_content_sections.section_json -> 'content') is distinct from 'object'
      ) > 0
        then 'section_content_not_object'
      when count(*) filter (
        where composition_items.composition_item_id is null
      ) > 0
        then 'unknown_composition_item_id'
      when (
        select count(*)
        from composition_items required_items
        left join published_content_sections required_sections
          on required_sections.composition_id = required_items.composition_id
         and required_sections.artifact_id = published_artifacts.id
         and required_sections.section_json ->> 'composition_item_id' = required_items.composition_item_id::text
        where required_items.composition_id = published_artifacts.composition_id
          and required_items.is_required = true
          and required_sections.artifact_id is null
      ) > 0
        then 'required_composition_item_missing'
      else null
    end is not null
),

published_source_counts as (
  select
    published_artifacts.id as artifact_id,
    count(sources.id) filter (where sources.audience_scope = 'business_buyer') as business_buyer_sources,
    count(sources.id) filter (where sources.audience_scope <> 'business_buyer') as other_sources
  from published_artifacts
  left join public.content_artifact_research_sources sources
    on sources.artifact_id = published_artifacts.id
  group by published_artifacts.id
),

published_source_failures as (
  select artifact_id
  from published_source_counts
  where business_buyer_sources <> 4
     or other_sources <> 0
),

final_results as (
  select
    'template'::text as check_group,
    'commercial_activation_page_active_v1'::text as object_name,
    case when count(*) = 1 then 'ok' else 'unexpected_count' end as check_status,
    jsonb_build_object('active_template_count', count(*)) as details
  from page_template

  union all

  select
    'template_sections'::text,
    'eight_active_section_modules_v1'::text,
    case
      when count(*) = 8 and count(template_id) = 8 then 'ok'
      else 'missing_or_unexpected_sections'
    end,
    jsonb_build_object(
      'expected_count', 8,
      'resolved_count', count(template_id)
    )
  from section_templates

  union all

  select
    'composition'::text,
    'active_compositions_have_fixed_required_eight_section_order'::text,
    case when count(*) = 0 then 'ok' else 'invalid_compositions' end,
    jsonb_build_object('invalid_composition_count', count(*))
  from composition_failures

  union all

  select
    'published'::text,
    'one_published_per_template_taxon_audience'::text,
    case
      when count(*) filter (where published_count > 1) = 0 then 'ok'
      else 'multiple_published'
    end,
    jsonb_build_object(
      'published_groups', count(*),
      'violating_groups', count(*) filter (where published_count > 1)
    )
  from published_groups

  union all

  select
    'published_content'::text,
    'published_content_json_matches_required_composition_items'::text,
    case when count(*) = 0 then 'ok' else 'invalid_published_content' end,
    jsonb_build_object(
      'invalid_artifact_count', count(*),
      'failure_reasons', coalesce(jsonb_agg(distinct failure_reason) filter (where failure_reason is not null), '[]'::jsonb)
    )
  from published_content_failures

  union all

  select
    'published_sources'::text,
    'published_sources_are_four_business_buyer_only'::text,
    case when count(*) = 0 then 'ok' else 'invalid_published_sources' end,
    jsonb_build_object('invalid_artifact_count', count(*))
  from published_source_failures
)

select *
from final_results
order by check_group, object_name
limit 50
