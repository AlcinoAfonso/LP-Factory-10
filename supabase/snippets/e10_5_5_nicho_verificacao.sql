-- e10_5_5_nicho_verificacao.sql
-- Objetivo: verificar o carregamento de pesquisa por taxon em taxon_market_research e taxon_market_research_items.
-- Uso: substituir todo o bloco input de exemplo abaixo pelos dados reais do carregamento antes de executar.
-- Saída: um único resultado final de resumo, com uma linha por research_block.
-- Tipo: read-only / execução manual no Supabase SQL Editor.

with input as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as taxon_id,
    'business_buyer'::text as audience_scope,
    1::integer as version,
    'draft'::text as expected_status,
    *
  from (
    values
      ('strategic_core'::text, null::integer),
      ('lp_overview'::text, null::integer),
      ('lp_sections'::text, null::integer),
      ('seo'::text, null::integer)
  ) as blocks(research_block, expected_items)
),

parents as (
  select
    input.research_block,
    input.expected_items,
    input.taxon_id as expected_taxon_id,
    input.audience_scope as expected_audience_scope,
    input.version as expected_version,
    input.expected_status,
    research.id as research_id,
    research.taxon_id,
    research.audience_scope,
    research.version,
    research.status,
    research.created_at,
    research.updated_at
  from input
  left join public.taxon_market_research research
    on research.taxon_id = input.taxon_id
   and research.research_block = input.research_block
   and research.audience_scope = input.audience_scope
   and research.version = input.version
),

other_versions as (
  select
    input.research_block,
    count(research.id) as other_versions
  from input
  left join public.taxon_market_research research
    on research.taxon_id = input.taxon_id
   and research.research_block = input.research_block
   and research.audience_scope = input.audience_scope
   and research.version <> input.version
  group by
    input.research_block
),

items as (
  select
    parents.research_block,
    parents.research_id,
    research_items.id as item_id,
    research_items.item_key,
    research_items.item_text,
    research_items.priority,
    research_items.sort_order,
    research_items.is_active
  from parents
  left join public.taxon_market_research_items research_items
    on research_items.research_id = parents.research_id
)

select
  parents.research_block,
  case
    when parents.research_id is null then 'missing_parent'
    when parents.expected_status is not null
      and parents.status is distinct from parents.expected_status then 'status_mismatch'
    when parents.expected_items is not null
      and count(items.item_id) <> parents.expected_items then 'item_count_mismatch'
    when count(items.item_id) filter (
      where items.item_id is not null
        and (items.item_key is null
          or btrim(items.item_key) = ''
          or items.item_text is null
          or btrim(items.item_text) = ''
          or items.priority is null
          or items.sort_order is null)
    ) > 0 then 'invalid_items'
    else 'ok'
  end as check_status,
  parents.research_id,
  coalesce(parents.taxon_id, parents.expected_taxon_id) as taxon_id,
  coalesce(parents.audience_scope, parents.expected_audience_scope) as audience_scope,
  coalesce(parents.version, parents.expected_version) as version,
  parents.status,
  parents.expected_status,
  parents.expected_items,
  count(items.item_id) as loaded_items,
  count(items.item_id) filter (where items.is_active = true) as active_items,
  count(items.item_id) filter (
    where items.item_id is not null
      and (items.item_key is null
        or btrim(items.item_key) = ''
        or items.item_text is null
        or btrim(items.item_text) = ''
        or items.priority is null
        or items.sort_order is null)
  ) as invalid_items,
  other_versions.other_versions,
  parents.created_at,
  parents.updated_at
from parents
join other_versions
  on other_versions.research_block = parents.research_block
left join items
  on items.research_id = parents.research_id
group by
  parents.research_block,
  parents.expected_items,
  parents.expected_taxon_id,
  parents.expected_audience_scope,
  parents.expected_version,
  parents.expected_status,
  other_versions.other_versions,
  parents.research_id,
  parents.taxon_id,
  parents.audience_scope,
  parents.version,
  parents.status,
  parents.created_at,
  parents.updated_at
order by
  parents.research_block;
