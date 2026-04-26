-- 20260426__e10_5_2_1_research_audience_scope_parent.rollback.sql
-- E10.5.2.1 — rollback do ajuste corretivo de audience_scope no Grupo C
-- Escopo:
-- - restaura audience_scope em public.taxon_market_research_items
-- - remove audience_scope de public.taxon_market_research
-- - restaura os índices únicos anteriores
-- Regra:
-- - não usa CASCADE
-- - interrompe se houver dados incompatíveis com a unicidade antiga

begin;

-- 1) Valida compatibilidade com os índices antigos antes de reverter

do $$
begin
  if exists (
    select 1
    from public.taxon_market_research
    group by taxon_id, research_block, version
    having count(*) > 1
    limit 1
  ) then
    raise exception 'Rollback blocked: duplicate rows found for old uniqueness (taxon_id, research_block, version).';
  end if;

  if exists (
    select 1
    from public.taxon_market_research
    where status = 'active'
    group by taxon_id, research_block
    having count(*) > 1
    limit 1
  ) then
    raise exception 'Rollback blocked: duplicate active rows found for old uniqueness (taxon_id, research_block) where status = active.';
  end if;
end
$$;

-- 2) Restaura audience_scope na tabela filha

alter table public.taxon_market_research_items
  add column if not exists audience_scope text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'taxon_market_research'
      and column_name = 'audience_scope'
  ) then
    update public.taxon_market_research_items i
    set audience_scope = r.audience_scope
    from public.taxon_market_research r
    where i.research_id = r.id
      and i.audience_scope is null;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from public.taxon_market_research_items
    where audience_scope is null
    limit 1
  ) then
    raise exception 'Rollback blocked: public.taxon_market_research_items.audience_scope has NULL values.';
  end if;

  if exists (
    select 1
    from public.taxon_market_research_items
    where audience_scope is not null
      and audience_scope <> all (array['end_customer'::text, 'business_buyer'::text])
    limit 1
  ) then
    raise exception 'Rollback blocked: invalid public.taxon_market_research_items.audience_scope value found.';
  end if;
end
$$;

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
  alter column audience_scope set not null;

-- 3) Troca os índices novos pelos índices antigos

drop index if exists public.taxon_market_research_taxon_block_audience_version_uidx;

drop index if exists public.taxon_market_research_one_active_per_block_audience_uidx;

create unique index if not exists taxon_market_research_taxon_block_version_uidx
  on public.taxon_market_research (
    taxon_id,
    research_block,
    version
  );

create unique index if not exists taxon_market_research_one_active_per_block_uidx
  on public.taxon_market_research (
    taxon_id,
    research_block
  )
  where status = 'active';

-- 4) Remove audience_scope da tabela-pai

alter table public.taxon_market_research
  drop constraint if exists taxon_market_research_audience_scope_chk;

alter table public.taxon_market_research
  drop column if exists audience_scope;

commit;
