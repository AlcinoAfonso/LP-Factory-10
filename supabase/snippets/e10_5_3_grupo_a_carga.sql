-- E10.5.3 — Grupo A — Carga canônica idempotente
-- Uso:
-- 1) preencher staged_taxons
-- 2) preencher staged_aliases
-- 3) rodar somente após aprovação humana do lote
-- Observações:
-- - este arquivo não deve conter dados reais por padrão
-- - por padrão ele nasce em modo no-op até preenchimento
-- - a carga é baseada em slug como chave operacional do taxon

begin;

-- =========================================================
-- 1) STAGING DO LOTE APROVADO
-- Preencher apenas após aprovação humana.
-- =========================================================

with staged_taxons(input_order, level, name, slug, parent_slug, is_active) as (
  select *
  from (
    values
      -- (10, 'segment', 'Marketing digital', 'marketing-digital', null, true),
      -- (20, 'niche', 'SaaS de landing pages e conversão', 'saas-de-landing-pages-e-conversao', 'marketing-digital', true)
      (0::int, ''::text, ''::text, ''::text, null::text, true::boolean)
  ) as v(input_order, level, name, slug, parent_slug, is_active)
  where slug <> ''
)
insert into public.business_taxons (
  level,
  name,
  slug,
  parent_id,
  is_active
)
select
  st.level,
  st.name,
  st.slug,
  null::uuid as parent_id,
  st.is_active
from staged_taxons st
where st.level = 'segment'
on conflict (slug) do update
set
  level = excluded.level,
  name = excluded.name,
  is_active = excluded.is_active;

with staged_taxons(input_order, level, name, slug, parent_slug, is_active) as (
  select *
  from (
    values
      -- (10, 'segment', 'Marketing digital', 'marketing-digital', null, true),
      -- (20, 'niche', 'SaaS de landing pages e conversão', 'saas-de-landing-pages-e-conversao', 'marketing-digital', true)
      (0::int, ''::text, ''::text, ''::text, null::text, true::boolean)
  ) as v(input_order, level, name, slug, parent_slug, is_active)
  where slug <> ''
)
insert into public.business_taxons (
  level,
  name,
  slug,
  parent_id,
  is_active
)
select
  st.level,
  st.name,
  st.slug,
  parent.id as parent_id,
  st.is_active
from staged_taxons st
join public.business_taxons parent
  on parent.slug = st.parent_slug
where st.level = 'niche'
on conflict (slug) do update
set
  level = excluded.level,
  name = excluded.name,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

with staged_taxons(input_order, level, name, slug, parent_slug, is_active) as (
  select *
  from (
    values
      -- (10, 'segment', 'Marketing digital', 'marketing-digital', null, true),
      -- (20, 'niche', 'SaaS de landing pages e conversão', 'saas-de-landing-pages-e-conversao', 'marketing-digital', true)
      (0::int, ''::text, ''::text, ''::text, null::text, true::boolean)
  ) as v(input_order, level, name, slug, parent_slug, is_active)
  where slug <> ''
)
insert into public.business_taxons (
  level,
  name,
  slug,
  parent_id,
  is_active
)
select
  st.level,
  st.name,
  st.slug,
  parent.id as parent_id,
  st.is_active
from staged_taxons st
join public.business_taxons parent
  on parent.slug = st.parent_slug
where st.level = 'ultra_niche'
on conflict (slug) do update
set
  level = excluded.level,
  name = excluded.name,
  parent_id = excluded.parent_id,
  is_active = excluded.is_active;

with staged_aliases(target_slug, alias_text, is_active) as (
  select *
  from (
    values
      -- ('marketing-digital', 'agência de marketing digital', true),
      -- ('saas-de-landing-pages-e-conversao', 'fábrica de landing pages', true)
      (''::text, ''::text, true::boolean)
  ) as v(target_slug, alias_text, is_active)
  where target_slug <> ''
    and alias_text <> ''
)
insert into public.business_taxon_aliases (
  taxon_id,
  alias_text,
  is_active
)
select
  bt.id as taxon_id,
  sa.alias_text,
  sa.is_active
from staged_aliases sa
join public.business_taxons bt
  on bt.slug = sa.target_slug
on conflict (taxon_id, alias_text_normalized) do update
set
  alias_text = excluded.alias_text,
  is_active = excluded.is_active;

commit;

-- =========================================================
-- 2) SANITY CHECKS PÓS-CARGA
-- =========================================================

with staged_taxons(input_order, level, name, slug, parent_slug, is_active) as (
  select *
  from (
    values
      -- (10, 'segment', 'Marketing digital', 'marketing-digital', null, true),
      -- (20, 'niche', 'SaaS de landing pages e conversão', 'saas-de-landing-pages-e-conversao', 'marketing-digital', true)
      (0::int, ''::text, ''::text, ''::text, null::text, true::boolean)
  ) as v(input_order, level, name, slug, parent_slug, is_active)
  where slug <> ''
)
select
  st.slug,
  st.level,
  st.parent_slug,
  bt.id as actual_taxon_id,
  parent.slug as actual_parent_slug,
  bt.is_active as actual_is_active
from staged_taxons st
left join public.business_taxons bt
  on bt.slug = st.slug
left join public.business_taxons parent
  on parent.id = bt.parent_id
order by st.input_order;

with staged_aliases(target_slug, alias_text, is_active) as (
  select *
  from (
    values
      -- ('marketing-digital', 'agência de marketing digital', true),
      -- ('saas-de-landing-pages-e-conversao', 'fábrica de landing pages', true)
      (''::text, ''::text, true::boolean)
  ) as v(target_slug, alias_text, is_active)
  where target_slug <> ''
    and alias_text <> ''
)
select
  sa.target_slug,
  sa.alias_text,
  bta.id as actual_alias_id,
  bta.alias_text_normalized,
  bta.is_active as actual_is_active
from staged_aliases sa
join public.business_taxons bt
  on bt.slug = sa.target_slug
left join public.business_taxon_aliases bta
  on bta.taxon_id = bt.id
 and bta.alias_text_normalized = btrim(
   regexp_replace(
     translate(
       lower(sa.alias_text),
       'áàãâäéèêëíìîïóòõôöúùûüçñ',
       'aaaaaeeeeiiiiooooouuuucn'
     ),
     '\s+',
     ' ',
     'g'
   )
 )
order by sa.target_slug, sa.alias_text;
