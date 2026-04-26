-- 0008__e10_5_2_1_research_audience_scope_parent.sql
-- E10.5.2.1 — Ajuste corretivo de audience_scope no Grupo C
-- Idempotente: pode rodar em ambiente que já tenha recebido o ajuste.
-- Escopo desta migration:
-- - move a responsabilidade principal de audience_scope para public.taxon_market_research
-- - remove audience_scope de public.taxon_market_research_items
-- - ajusta unicidade/versionamento para considerar audience_scope no registro-pai
-- - corrige item_key para NOT NULL conforme contrato documental
-- Fora do escopo desta migration:
-- - carga real do Grupo C
-- - prompts operacionais
-- - runtime do E10.5
-- - adapters
-- - taxon_message_guides
-- - novas tabelas
-- - alteração de RLS/policies

begin;

-- 1) public.taxon_market_research: audience_scope no registro-pai

alter table public.taxon_market_research
  add column if not exists audience_scope text;

do $$
begin
  if exists (
    select 1
    from public.taxon_market_research
    where audience_scope is null
    limit 1
  ) then
    raise exception 'Cannot set public.taxon_market_research.audience_scope as NOT NULL: existing rows with NULL audience_scope. Resolve data before applying this migration.';
  end if;

  if exists (
    select 1
    from public.taxon_market_research
    where audience_scope is not null
      and audience_scope <> all (array['end_customer'::text, 'business_buyer'::text])
    limit 1
  ) then
    raise exception 'Invalid public.taxon_market_research.audience_scope value found. Allowed values: end_customer, business_buyer.';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'taxon_market_research_audience_scope_chk'
      and conrelid = 'public.taxon_market_research'::regclass
  ) then
    alter table public.taxon_market_research
      add constraint taxon_market_research_audience_scope_chk
      check (
        audience_scope = any (
          array['end_customer'::text, 'business_buyer'::text]
        )
      );
  end if;
end
$$;

alter table public.taxon_market_research
  alter column audience_scope set not null;

-- 2) public.taxon_market_research: troca dos índices únicos

drop index if exists public.taxon_market_research_taxon_block_version_uidx;

drop index if exists public.taxon_market_research_one_active_per_block_uidx;

create unique index if not exists taxon_market_research_taxon_block_audience_version_uidx
  on public.taxon_market_research (
    taxon_id,
    research_block,
    audience_scope,
    version
  );

create unique index if not exists taxon_market_research_one_active_per_block_audience_uidx
  on public.taxon_market_research (
    taxon_id,
    research_block,
    audience_scope
  )
  where status = 'active';

-- 3) public.taxon_market_research_items: remove audience_scope da filha

alter table public.taxon_market_research_items
  drop constraint if exists taxon_market_research_items_audience_scope_chk;

alter table public.taxon_market_research_items
  drop column if exists audience_scope;

-- 4) public.taxon_market_research_items: reforça contrato de item_key obrigatório

do $$
begin
  if exists (
    select 1
    from public.taxon_market_research_items
    where item_key is null
    limit 1
  ) then
    raise exception 'Cannot set public.taxon_market_research_items.item_key as NOT NULL: existing rows with NULL item_key.';
  end if;
end
$$;

alter table public.taxon_market_research_items
  alter column item_key set not null;

commit;
