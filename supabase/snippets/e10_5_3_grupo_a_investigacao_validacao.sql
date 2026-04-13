-- E10.5.3 — Grupo A — Investigação e validação pós-carga
-- Uso:
-- 1) Rodar a seção A antes de qualquer proposta.
-- 2) Rodar a seção B depois da carga, preenchendo os CTEs expected_* quando necessário.
-- Regras:
-- - arquivo read-only
-- - apenas SELECT / WITH
-- - sem mutações

-- =========================================================
-- A) INVESTIGAÇÃO PRÉVIA
-- =========================================================

-- A1) Taxons existentes com hierarquia
select
  bt.id,
  bt.level,
  bt.name,
  bt.slug,
  bt.parent_id,
  parent.level as parent_level,
  parent.name as parent_name,
  parent.slug as parent_slug,
  bt.is_active
from public.business_taxons bt
left join public.business_taxons parent
  on parent.id = bt.parent_id
order by
  case bt.level
    when 'segment' then 1
    when 'niche' then 2
    when 'ultra_niche' then 3
    else 99
  end,
  coalesce(parent.slug, ''),
  bt.slug
limit 300;

-- A2) Aliases existentes com taxon alvo
select
  bta.id,
  bt.level,
  bt.name as taxon_name,
  bt.slug as taxon_slug,
  bta.alias_text,
  bta.alias_text_normalized,
  bta.is_active
from public.business_taxon_aliases bta
join public.business_taxons bt
  on bt.id = bta.taxon_id
order by
  bt.slug,
  bta.alias_text_normalized
limit 500;

-- A3) Sanity check de duplicidade de slug
select
  bt.slug,
  count(*) as total
from public.business_taxons bt
group by bt.slug
having count(*) > 1
order by total desc, bt.slug
limit 50;

-- A4) Sanity check de duplicidade por (taxon_id, alias_text_normalized)
select
  bta.taxon_id,
  bt.slug as taxon_slug,
  bta.alias_text_normalized,
  count(*) as total
from public.business_taxon_aliases bta
join public.business_taxons bt
  on bt.id = bta.taxon_id
group by
  bta.taxon_id,
  bt.slug,
  bta.alias_text_normalized
having count(*) > 1
order by total desc, bt.slug, bta.alias_text_normalized
limit 50;

-- A5) Mesmos aliases normalizados usados em taxons diferentes
select
  bta.alias_text_normalized,
  count(distinct bt.slug) as total_taxons,
  string_agg(distinct bt.slug, ' | ' order by bt.slug) as taxon_slugs
from public.business_taxon_aliases bta
join public.business_taxons bt
  on bt.id = bta.taxon_id
group by bta.alias_text_normalized
having count(distinct bt.slug) > 1
order by total_taxons desc, bta.alias_text_normalized
limit 100;

-- =========================================================
-- B) VALIDAÇÃO PÓS-CARGA
-- Preencher os CTEs abaixo com o lote aprovado.
-- Se mantidos vazios, as queries retornam vazio por padrão.
-- =========================================================

with expected_taxons(expected_slug, expected_level, expected_parent_slug) as (
  select *
  from (
    values
      -- ('marketing-digital', 'segment', null),
      -- ('saas-de-landing-pages-e-conversao', 'niche', 'marketing-digital')
      (null::text, null::text, null::text)
  ) as v(expected_slug, expected_level, expected_parent_slug)
  where expected_slug is not null
),
actual_taxons as (
  select
    bt.slug,
    bt.level,
    parent.slug as parent_slug,
    bt.name,
    bt.is_active
  from public.business_taxons bt
  left join public.business_taxons parent
    on parent.id = bt.parent_id
)
select
  et.expected_slug,
  et.expected_level,
  et.expected_parent_slug,
  at.level as actual_level,
  at.parent_slug as actual_parent_slug,
  at.name as actual_name,
  at.is_active as actual_is_active,
  case
    when at.slug is null then 'missing'
    when at.level <> et.expected_level then 'level_mismatch'
    when coalesce(at.parent_slug, '') <> coalesce(et.expected_parent_slug, '') then 'parent_mismatch'
    else 'ok'
  end as validation_status
from expected_taxons et
left join actual_taxons at
  on at.slug = et.expected_slug
order by et.expected_slug
limit 200;

with expected_aliases(expected_target_slug, expected_alias_text) as (
  select *
  from (
    values
      -- ('marketing-digital', 'agência de marketing digital'),
      -- ('saas-de-landing-pages-e-conversao', 'fábrica de landing pages')
      (null::text, null::text)
  ) as v(expected_target_slug, expected_alias_text)
  where expected_target_slug is not null
),
actual_aliases as (
  select
    bt.slug as target_slug,
    bta.alias_text,
    bta.alias_text_normalized,
    bta.is_active
  from public.business_taxon_aliases bta
  join public.business_taxons bt
    on bt.id = bta.taxon_id
),
normalized_expected as (
  select
    expected_target_slug,
    expected_alias_text,
    btrim(
      regexp_replace(
        translate(
          lower(expected_alias_text),
          'áàãâäéèêëíìîïóòõôöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'
        ),
        '\s+',
        ' ',
        'g'
      )
    ) as expected_alias_text_normalized
  from expected_aliases
)
select
  ne.expected_target_slug,
  ne.expected_alias_text,
  ne.expected_alias_text_normalized,
  aa.target_slug as actual_target_slug,
  aa.alias_text as actual_alias_text,
  aa.is_active as actual_is_active,
  case
    when aa.target_slug is null then 'missing'
    else 'ok'
  end as validation_status
from normalized_expected ne
left join actual_aliases aa
  on aa.target_slug = ne.expected_target_slug
 and aa.alias_text_normalized = ne.expected_alias_text_normalized
order by
  ne.expected_target_slug,
  ne.expected_alias_text_normalized
limit 300;
