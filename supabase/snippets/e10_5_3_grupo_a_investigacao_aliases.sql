-- SQLB — E10.5.3 — Investigação preliminar de business_taxon_aliases
-- Rodar sozinho
-- Objetivo:
-- 1) ver os aliases já cadastrados
-- 2) identificar a qual taxon cada alias pertence
-- 3) usar este snippet só depois do snippet de taxons

select
  bta.id,
  bt.level,
  bt.name as taxon_name,
  bt.slug as target_slug,
  bta.alias_text,
  bta.alias_text_normalized,
  bta.is_active
from public.business_taxon_aliases bta
join public.business_taxons bt
  on bt.id = bta.taxon_id
order by
  bt.slug,
  bta.alias_text_normalized;
