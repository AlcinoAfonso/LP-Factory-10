-- e10_5_5_nicho_carregamento.sql
-- Objetivo: carregar pesquisa consolidada por taxon em taxon_market_research e taxon_market_research_items.
-- Uso: substituir os exemplos das CTEs research_input e items_input pelos dados aprovados.
-- Tipo: operacional / execução manual no Supabase SQL Editor.
-- Observação: por padrão, usar status = 'draft'. Não ativar versão automaticamente.

begin;

with
research_input (
  taxon_id,
  research_block,
  audience_scope,
  version,
  status
) as (
  values
    (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'strategic_core'::text,
      'business_buyer'::text,
      1::integer,
      'draft'::text
    )
),
items_input (
  research_block,
  item_key,
  item_text,
  priority,
  sort_order,
  notes
) as (
  values
    (
      'strategic_core'::text,
      'pain'::text,
      $txt$Exemplo de item consolidado.$txt$::text,
      3::integer,
      1::integer,
      $txt$Exemplo de observação consolidada.$txt$::text
    )
),
upserted_research as (
  insert into public.taxon_market_research (
    taxon_id,
    research_block,
    audience_scope,
    version,
    status
  )
  select
    taxon_id,
    research_block,
    audience_scope,
    version,
    status
  from research_input
  on conflict (taxon_id, research_block, audience_scope, version)
  do update set
    status = excluded.status,
    updated_at = now()
  returning
    id,
    taxon_id,
    research_block,
    audience_scope,
    version,
    status
),
deleted_items as (
  delete from public.taxon_market_research_items research_items
  using upserted_research research
  where research_items.research_id = research.id
  returning research_items.research_id
),
inserted_items as (
  insert into public.taxon_market_research_items (
    research_id,
    item_key,
    item_text,
    priority,
    sort_order,
    is_active,
    notes
  )
  select
    research.id,
    items_input.item_key,
    items_input.item_text,
    items_input.priority,
    items_input.sort_order,
    true,
    nullif(items_input.notes, '')
  from items_input
  join upserted_research research
    on research.research_block = items_input.research_block
  where (select count(*) from deleted_items) >= 0
  order by
    research.research_block,
    items_input.sort_order,
    items_input.item_key
  returning research_id
)
select
  research.id as research_id,
  research.taxon_id,
  research.research_block,
  research.audience_scope,
  research.version,
  research.status,
  count(inserted_items.research_id) as loaded_items
from upserted_research research
left join inserted_items
  on inserted_items.research_id = research.id
group by
  research.id,
  research.taxon_id,
  research.research_block,
  research.audience_scope,
  research.version,
  research.status
order by
  research.research_block;

commit;
