-- e10_5_5_nicho_verificacao.sql
-- Objetivo: verificar carregamento de pesquisa por taxon em taxon_market_research e taxon_market_research_items.
-- Uso: substituir os exemplos em input pelos blocos carregados.
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

items as (
  select
    parents.research_block,
    parents.research_id,
    research_items.id as item_id,
    research_items.item_key,
    research_items.item_text,
    research_items.priority,
    research_items.sort_order,
    research_items.is_active,
    research_items.notes,
    research_items.created_at,
    research_items.updated_at
  from parents
  left join public.taxon_market_research_items research_items
    on research_items.research_id = parents.research_id
)

select
  'parent_summary' as check_type,
  parents.research_block,
  case
    when parents.research_id is null then 'missing_parent'
    when parents.status <> input.expected_status then 'status_mismatch'
    when input.expected_items is not null
      and count(items.item_id) <> input.expected_items then 'item_count_mismatch'
    else 'ok'
  end as check_status,
  parents.research_id,
  parents.taxon_id,
  parents.audience_scope,
  parents.version,
  parents.status,
  input.expected_status,
  input.expected_items,
  count(items.item_id) as loaded_items,
  count(items.item_id) filter (where items.is_active = true) as active_items,
  count(items.item_id) filter (
    where items.item_key is null
       or btrim(items.item_key) = ''
       or items.item_text is null
       or btrim(items.item_text) = ''
       or items.priority is null
       or items.sort_order is null
  ) as invalid_items,
  parents.created_at,
  parents.updated_at
from parents
join input
  on input.research_block = parents.research_block
left join items
  on items.research_id = parents.research_id
group by
  parents.research_block,
  parents.research_id,
  parents.taxon_id,
  parents.audience_scope,
  parents.version,
  parents.status,
  parents.created_at,
  parents.updated_at,
  input.expected_status,
  input.expected_items

union all

select
  'item_detail' as check_type,
  items.research_block,
  case
    when items.item_id is null then 'no_items'
    when items.item_key is null
      or btrim(items.item_key) = ''
      or items.item_text is null
      or btrim(items.item_text) = ''
      or items.priority is null
      or items.sort_order is null then 'invalid_item'
    when items.is_active is false then 'inactive_item'
    else 'ok'
  end as check_status,
  items.research_id,
  null::uuid as taxon_id,
  null::text as audience_scope,
  null::integer as version,
  null::text as status,
  null::text as expected_status,
  null::integer as expected_items,
  null::bigint as loaded_items,
  null::bigint as active_items,
  null::bigint as invalid_items,
  items.created_at,
  items.updated_at
from items

order by
  research_block,
  check_type desc,
  check_status;
