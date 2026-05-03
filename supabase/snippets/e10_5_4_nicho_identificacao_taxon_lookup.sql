-- e10_5_4_nicho_identificacao_taxon_lookup.sql
-- Objetivo: localizar taxon cadastrado por nome, slug ou alias.
-- Uso: substituir o valor de input.q pelo nome informado pelo humano.
-- Tipo: read-only.

with input as (
  select
    'Harmonização Facial'::text as q
),

normalized_input as (
  select
    q,
    btrim(
      regexp_replace(
        translate(
          lower(q),
          'áàãâäéèêëíìîïóòõôöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'
        ),
        '\s+',
        ' ',
        'g'
      )
    ) as q_norm
  from input
),

tokens as (
  select token
  from normalized_input,
  regexp_split_to_table(q_norm, '\s+') as token
  where token not in (
    'a', 'o', 'as', 'os',
    'da', 'de', 'do', 'das', 'dos',
    'e', 'em', 'para'
  )
),

taxons_norm as (
  select
    bt.id as taxon_id,
    bt.name as taxon_name,
    bt.slug as taxon_slug,
    bt.level as taxon_level,
    bt.parent_id,
    parent.name as parent_name,
    bt.is_active,
    btrim(
      regexp_replace(
        translate(
          lower(bt.name),
          'áàãâäéèêëíìîïóòõôöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'
        ),
        '\s+',
        ' ',
        'g'
      )
    ) as taxon_name_norm,
    replace(lower(bt.slug), '-', ' ') as taxon_slug_norm
  from public.business_taxons bt
  left join public.business_taxons parent
    on parent.id = bt.parent_id
),

direct_matches as (
  select distinct
    tn.taxon_id,
    tn.taxon_name,
    tn.taxon_slug,
    tn.taxon_level,
    tn.parent_id,
    tn.parent_name,
    tn.is_active,
    'business_taxons.name_or_slug' as match_source
  from taxons_norm tn
  cross join normalized_input ni
  left join tokens t
    on tn.taxon_name_norm ilike '%' || t.token || '%'
    or tn.taxon_slug_norm ilike '%' || t.token || '%'
  where
    tn.taxon_name ilike '%' || ni.q || '%'
    or tn.taxon_slug ilike '%' || ni.q || '%'
    or tn.taxon_name_norm ilike '%' || ni.q_norm || '%'
    or tn.taxon_slug_norm ilike '%' || ni.q_norm || '%'
    or t.token is not null
),

alias_matches as (
  select distinct
    bt.id as taxon_id,
    bt.name as taxon_name,
    bt.slug as taxon_slug,
    bt.level as taxon_level,
    bt.parent_id,
    parent.name as parent_name,
    bt.is_active,
    'business_taxon_aliases.alias_text' as match_source
  from public.business_taxon_aliases bta
  join public.business_taxons bt
    on bt.id = bta.taxon_id
  left join public.business_taxons parent
    on parent.id = bt.parent_id
  cross join normalized_input ni
  left join tokens t
    on bta.alias_text_normalized ilike '%' || t.token || '%'
  where
    bta.is_active = true
    and (
      bta.alias_text ilike '%' || ni.q || '%'
      or bta.alias_text_normalized ilike '%' || ni.q_norm || '%'
      or t.token is not null
    )
)

select *
from direct_matches

union

select *
from alias_matches

order by
  taxon_level,
  taxon_name,
  match_source;
