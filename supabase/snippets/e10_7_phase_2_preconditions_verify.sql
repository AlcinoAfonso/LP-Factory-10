-- e10_7_phase_2_preconditions_verify.sql
-- Objetivo: verificar pre-condicoes da E10.7 Fase 2 para o taxon piloto.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.

with constants as (
  select
    'corretor-de-imoveis-de-medio-padrao'::text as pilot_slug,
    1::integer as expected_version
),

expected_blocks as (
  select *
  from (
    values
      ('business_buyer'::text, 'strategic_core'::text),
      ('business_buyer'::text, 'lp_overview'::text),
      ('business_buyer'::text, 'lp_sections'::text),
      ('business_buyer'::text, 'seo'::text),
      ('end_customer'::text, 'strategic_core'::text),
      ('end_customer'::text, 'lp_overview'::text),
      ('end_customer'::text, 'lp_sections'::text),
      ('end_customer'::text, 'seo'::text)
  ) as blocks(audience_scope, research_block)
),

expected_variants as (
  select *
  from (
    values
      ('hero'::text, 'hero.default'::text, 10),
      ('benefits'::text, 'benefits.cards'::text, 20),
      ('services'::text, 'services.list'::text, 30),
      ('plans'::text, 'plans.cards'::text, 40),
      ('differentials'::text, 'differentials.cards'::text, 50),
      ('how_it_works'::text, 'how_it_works.steps'::text, 60),
      ('faq'::text, 'faq.accordion'::text, 70),
      ('final_cta'::text, 'final_cta.simple'::text, 80)
  ) as variants(template_key, variant_key, sort_order)
),

pilot as (
  select business_taxons.*
  from public.business_taxons
  join constants
    on constants.pilot_slug = business_taxons.slug
),

page_template as (
  select content_templates.*
  from public.content_templates
  where template_key = 'commercial_activation_page'
    and template_family = 'commercial_activation'
    and template_scope = 'page'
    and version = 1
    and status = 'active'
    and is_active = true
),

composition as (
  select content_template_compositions.*
  from public.content_template_compositions
  join pilot
    on pilot.id = content_template_compositions.taxon_id
  join page_template
    on page_template.id = content_template_compositions.template_id
  where content_template_compositions.version = 1
    and content_template_compositions.status = 'active'
),

research_status as (
  select
    'research_block'::text as check_group,
    format('%s:%s', expected_blocks.audience_scope, expected_blocks.research_block) as object_name,
    case
      when taxon_market_research.id is null then 'missing'
      when taxon_market_research.status <> 'active' then 'not_active'
      when count(taxon_market_research_items.*) filter (where taxon_market_research_items.is_active = true) = 0 then 'missing_active_items'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'research_id', taxon_market_research.id,
      'status', taxon_market_research.status,
      'version', taxon_market_research.version,
      'active_item_count', count(taxon_market_research_items.*) filter (where taxon_market_research_items.is_active = true)
    ) as details
  from expected_blocks
  cross join constants
  left join pilot on true
  left join public.taxon_market_research
    on taxon_market_research.taxon_id = pilot.id
   and taxon_market_research.audience_scope = expected_blocks.audience_scope
   and taxon_market_research.research_block = expected_blocks.research_block
   and taxon_market_research.version = constants.expected_version
  left join public.taxon_market_research_items
    on taxon_market_research_items.research_id = taxon_market_research.id
  group by
    expected_blocks.audience_scope,
    expected_blocks.research_block,
    taxon_market_research.id,
    taxon_market_research.status,
    taxon_market_research.version
),

pilot_status as (
  select
    'pilot_taxon'::text as check_group,
    constants.pilot_slug as object_name,
    case
      when pilot.id is null then 'missing'
      when pilot.is_active is not true then 'not_active'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'taxon_id', pilot.id,
      'name', pilot.name,
      'level', pilot.level,
      'is_active', pilot.is_active
    ) as details
  from constants
  left join pilot on true
),

template_link_status as (
  select
    'template_link'::text as check_group,
    'commercial_activation_page'::text as object_name,
    case
      when pilot.id is null then 'missing_pilot'
      when page_template.id is null then 'missing_template'
      when count(content_template_taxons.*) filter (where content_template_taxons.is_active = true) = 0 then 'missing_active_link'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'active_link_count', count(content_template_taxons.*) filter (where content_template_taxons.is_active = true),
      'template_id', max(page_template.id::text)
    ) as details
  from pilot
  full join page_template on true
  left join public.content_template_taxons
    on content_template_taxons.taxon_id = pilot.id
   and content_template_taxons.template_id = page_template.id
  group by pilot.id, page_template.id
),

composition_status as (
  select
    'composition'::text as check_group,
    'commercial_activation_version_1'::text as object_name,
    case
      when composition.id is null then 'missing'
      when composition.status <> 'active' then 'not_active'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'composition_id', composition.id,
      'version', composition.version,
      'status', composition.status
    ) as details
  from composition
),

composition_item_count_status as (
  select
    'composition_items'::text as check_group,
    'composition_item_count'::text as object_name,
    case when count(content_template_composition_items.*) = 8 then 'ok' else 'unexpected_count' end as check_status,
    jsonb_build_object('item_count', count(content_template_composition_items.*)) as details
  from composition
  left join public.content_template_composition_items
    on content_template_composition_items.composition_id = composition.id
),

variant_status as (
  select
    'composition_variant'::text as check_group,
    expected_variants.variant_key as object_name,
    case
      when content_template_composition_items.id is null then 'missing'
      when content_template_composition_items.sort_order <> expected_variants.sort_order then 'unexpected_sort_order'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'composition_item_id', content_template_composition_items.id,
      'template_key', expected_variants.template_key,
      'sort_order', content_template_composition_items.sort_order
    ) as details
  from expected_variants
  left join composition on true
  left join public.content_templates module_template
    on module_template.template_key = expected_variants.template_key
   and module_template.template_family = 'commercial_activation'
   and module_template.template_scope = 'section'
   and module_template.version = 1
   and module_template.status = 'active'
   and module_template.is_active = true
  left join public.content_template_composition_items
    on content_template_composition_items.composition_id = composition.id
   and content_template_composition_items.module_template_id = module_template.id
   and content_template_composition_items.variant_key = expected_variants.variant_key
)

select *
from pilot_status
union all
select *
from research_status
union all
select *
from template_link_status
union all
select *
from composition_status
union all
select *
from composition_item_count_status
union all
select *
from variant_status
order by check_group, object_name;
