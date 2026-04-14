-- SQLA — E10.5.3 — Investigação preliminar de business_taxons
-- Rodar sozinho
-- Objetivo:
-- 1) ver exatamente o conteúdo atual de business_taxons
-- 2) esta é a fonte principal para saber o que já existe
-- 3) taxons sem alias também aparecem aqui

select
  id,
  parent_id,
  level,
  name,
  slug,
  is_active
from public.business_taxons
order by
  case level
    when 'segment' then 1
    when 'niche' then 2
    when 'ultra_niche' then 3
    else 99
  end,
  slug;
