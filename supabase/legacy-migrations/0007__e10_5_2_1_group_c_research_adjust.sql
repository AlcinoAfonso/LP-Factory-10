-- 0007__e10_5_2_1_group_c_research_adjust.sql
-- E10.5.2.1 — Ajuste estrutural de taxon_market_research e taxon_market_research_items
-- Idempotente: pode rodar em ambiente que já tenha recebido o ajuste.
-- Escopo desta migration:
-- - ajusta public.taxon_market_research para versionamento por research_block
-- - remove base_summary de public.taxon_market_research
-- - ajusta public.taxon_market_research_items para a nova estrutura alvo do Grupo C
-- - substitui item_tag por item_key, audience_scope, sort_order e notes
-- - cria os índices e constraints aprovados da etapa
-- Fora do escopo desta migration:
-- - novas tabelas
-- - ajuste de taxon_message_guides
-- - carga operacional do Grupo C
-- - atualização documental
-- - rollback

begin;

-- 1) public.taxon_market_research

alter table public.taxon_market_research
  add column if not exists research_block text;

update public.taxon_market_research
set research_block = 'legacy_block'
where research_block is null;

alter table public.taxon_market_research
  alter column research_block set not null;

alter table public.taxon_market_research
  drop column if exists base_summary;

create unique index if not exists taxon_market_research_taxon_block_version_uidx
  on public.taxon_market_research (taxon_id, research_block, version);

create unique index if not exists taxon_market_research_one_active_per_block_uidx
  on public.taxon_market_research (taxon_id, research_block)
  where status = 'active';

-- 2) public.taxon_market_research_items

alter table public.taxon_market_research_items
  add column if not exists item_key text;

alter table public.taxon_market_research_items
  add column if not exists audience_scope text;

alter table public.taxon_market_research_items
  add column if not exists sort_order integer;

alter table public.taxon_market_research_items
  add column if not exists notes text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'taxon_market_research_items'
      and column_name = 'item_tag'
  ) then
    execute $sql$
      update public.taxon_market_research_items
      set item_key = item_tag
      where item_key is null
        and item_tag is not null
    $sql$;
  end if;
end
$$;

update public.taxon_market_research_items
set sort_order = 999
where sort_order is null;

alter table public.taxon_market_research_items
  alter column sort_order set default 999;

alter table public.taxon_market_research_items
  alter column sort_order set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'taxon_market_research_items_audience_scope_chk'
      and conrelid = 'public.taxon_market_research_items'::regclass
  ) then
    alter table public.taxon_market_research_items
      add constraint taxon_market_research_items_audience_scope_chk
      check (
        audience_scope = any (
          array['end_customer'::text, 'business_buyer'::text]
        )
      );
  end if;
end
$$;

alter table public.taxon_market_research_items
  drop column if exists item_tag;

commit;
