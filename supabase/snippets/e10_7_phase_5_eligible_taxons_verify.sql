with required_blocks(block) as (
  values
    ('strategic_core'::text),
    ('lp_overview'::text),
    ('lp_sections'::text),
    ('seo'::text)
),
eligible_research as (
  select
    taxon.id as taxon_id,
    taxon.name,
    taxon.slug,
    research.audience_scope,
    research.research_block,
    count(items.id) filter (where items.is_active = true) as active_items
  from public.business_taxons taxon
  join public.taxon_market_research research
    on research.taxon_id = taxon.id
   and research.status = 'active'
   and research.version = 1
   and research.audience_scope in ('business_buyer', 'end_customer')
   and research.research_block in ('strategic_core', 'lp_overview', 'lp_sections', 'seo')
  left join public.taxon_market_research_items items
    on items.research_id = research.id
  where taxon.is_active = true
  group by taxon.id, taxon.name, taxon.slug, research.audience_scope, research.research_block
),
eligible_taxons as (
  select
    taxon_id,
    name,
    slug,
    count(*) filter (
      where audience_scope = 'business_buyer'
        and active_items > 0
    ) as business_buyer_blocks,
    sum(active_items) filter (
      where audience_scope = 'business_buyer'
    ) as business_buyer_items,
    count(*) filter (
      where audience_scope = 'end_customer'
        and active_items > 0
    ) as end_customer_blocks,
    sum(active_items) filter (
      where audience_scope = 'end_customer'
    ) as end_customer_items
  from eligible_research
  group by taxon_id, name, slug
  having count(*) filter (
      where audience_scope = 'business_buyer'
        and active_items > 0
    ) = 4
     and count(*) filter (
      where audience_scope = 'end_customer'
        and active_items > 0
    ) = 4
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
composition_summary as (
  select
    composition.taxon_id,
    count(*) filter (where composition.status = 'active') as active_compositions
  from public.content_template_compositions composition
  join page_template on page_template.id = composition.template_id
  group by composition.taxon_id
),
artifact_summary as (
  select
    artifact.taxon_id,
    count(*) filter (where artifact.status = 'draft') as drafts,
    count(*) filter (where artifact.status = 'published') as published,
    count(*) filter (where artifact.status = 'archived') as archived
  from public.content_artifacts artifact
  join page_template on page_template.id = artifact.template_id
  where artifact.audience_scope = 'business_buyer'
  group by artifact.taxon_id
)
select
  eligible_taxons.name,
  eligible_taxons.slug,
  eligible_taxons.business_buyer_blocks,
  eligible_taxons.business_buyer_items,
  eligible_taxons.end_customer_blocks,
  eligible_taxons.end_customer_items,
  coalesce(composition_summary.active_compositions, 0) as active_compositions,
  coalesce(artifact_summary.drafts, 0) as drafts,
  coalesce(artifact_summary.published, 0) as published,
  coalesce(artifact_summary.archived, 0) as archived,
  case
    when coalesce(artifact_summary.published, 0) > 0 then 'published'
    when coalesce(artifact_summary.drafts, 0) > 0 then 'review'
    else 'eligible_to_generate'
  end as admin_state
from eligible_taxons
left join composition_summary
  on composition_summary.taxon_id = eligible_taxons.taxon_id
left join artifact_summary
  on artifact_summary.taxon_id = eligible_taxons.taxon_id
order by eligible_taxons.name, eligible_taxons.slug;
