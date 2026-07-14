with recursive
  params as (
    select 'corretor-de-imoveis-de-medio-padrao'::text as requested_taxon_slug
  ),
  taxon_chain as (
    select
      taxon.id,
      taxon.name,
      taxon.slug,
      taxon.level,
      taxon.is_active,
      taxon.parent_id,
      0::integer as depth,
      array[taxon.id]::uuid[] as visited_ids
    from public.business_taxons as taxon
    cross join params
    where taxon.slug = params.requested_taxon_slug

    union all

    select
      parent.id,
      parent.name,
      parent.slug,
      parent.level,
      parent.is_active,
      parent.parent_id,
      child.depth + 1,
      child.visited_ids || parent.id
    from taxon_chain as child
    join public.business_taxons as parent
      on parent.id = child.parent_id
    where not (parent.id = any(child.visited_ids))
      and child.depth < 2
  )
select
  id,
  name,
  slug,
  level,
  is_active,
  parent_id,
  depth
from taxon_chain
order by depth desc
limit 3
