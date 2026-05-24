-- e10_5_5_nicho_carregamento.sql
-- Objetivo: carregar pesquisa consolidada por taxon em taxon_market_research e taxon_market_research_items.
-- Uso: substituir os exemplos das tabelas temporárias pelos dados aprovados na pesquisa consolidada.
-- Tipo: operacional / execução manual no Supabase SQL Editor.
-- Observação: por padrão, usar status = 'draft'. Não ativar versão automaticamente.

begin;

drop table if exists pg_temp._e10_5_5_research_input;

create temp table _e10_5_5_research_input (
  taxon_id uuid not null,
  research_block text not null,
  audience_scope text not null,
  version integer not null default 1,
  status text not null default 'draft',
  constraint _e10_5_5_research_input_audience_scope_chk
    check (audience_scope in ('end_customer', 'business_buyer')),
  constraint _e10_5_5_research_input_status_chk
    check (status in ('draft', 'active', 'archived'))
) on commit drop;

-- Substituir pelos registros-pai da pesquisa consolidada.
insert into _e10_5_5_research_input (
  taxon_id,
  research_block,
  audience_scope,
  version,
  status
)
values
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'strategic_core',
    'business_buyer',
    1,
    'draft'
  );

drop table if exists pg_temp._e10_5_5_items_input;

create temp table _e10_5_5_items_input (
  research_block text not null,
  item_key text not null,
  item_text text not null,
  priority integer not null default 0,
  sort_order integer not null default 999,
  notes text null
) on commit drop;

-- Substituir pelos itens consolidados aprovados.
-- Usar dollar-quoted strings ($txt$...$txt$) para evitar problemas com aspas.
insert into _e10_5_5_items_input (
  research_block,
  item_key,
  item_text,
  priority,
  sort_order,
  notes
)
values
  (
    'strategic_core',
    'pain',
    $txt$Exemplo de item consolidado.$txt$,
    3,
    1,
    $txt$Exemplo de observação consolidada.$txt$
  );

do $$
begin
  if exists (
    select 1
    from _e10_5_5_items_input items_input
    left join _e10_5_5_research_input research_input
      on research_input.research_block = items_input.research_block
    where research_input.research_block is null
  ) then
    raise exception 'Há itens com research_block sem registro-pai em _e10_5_5_research_input.';
  end if;
end $$;

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
from _e10_5_5_research_input
on conflict (taxon_id, research_block, audience_scope, version)
do update set
  status = excluded.status,
  updated_at = now();

delete from public.taxon_market_research_items research_items
using public.taxon_market_research research,
      _e10_5_5_research_input research_input
where research_items.research_id = research.id
  and research.taxon_id = research_input.taxon_id
  and research.research_block = research_input.research_block
  and research.audience_scope = research_input.audience_scope
  and research.version = research_input.version;

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
from _e10_5_5_items_input items_input
join _e10_5_5_research_input research_input
  on research_input.research_block = items_input.research_block
join public.taxon_market_research research
  on research.taxon_id = research_input.taxon_id
 and research.research_block = research_input.research_block
 and research.audience_scope = research_input.audience_scope
 and research.version = research_input.version
order by
  research_input.research_block,
  items_input.sort_order,
  items_input.item_key;

select
  research.id as research_id,
  research.taxon_id,
  research.research_block,
  research.audience_scope,
  research.version,
  research.status,
  count(research_items.id) as loaded_items
from public.taxon_market_research research
join _e10_5_5_research_input research_input
  on research.taxon_id = research_input.taxon_id
 and research.research_block = research_input.research_block
 and research.audience_scope = research_input.audience_scope
 and research.version = research_input.version
left join public.taxon_market_research_items research_items
  on research_items.research_id = research.id
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
