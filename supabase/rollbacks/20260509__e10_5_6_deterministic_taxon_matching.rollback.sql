-- 20260509__e10_5_6_deterministic_taxon_matching.rollback.sql
-- E10.5.6 / 4.1 — rollback do matching determinístico inicial de taxonomia
-- Escopo:
-- - remove a RPC de matching determinístico
-- - remove os índices criados para exact/normalized, FTS e trigram
-- - remove a função de normalização textual
-- Regra:
-- - não usa CASCADE
-- - não remove pg_trgm automaticamente, pois a extensão pode ser reutilizada depois
-- - não altera tabelas de taxonomia, aliases, account_taxonomy ou dados existentes

begin;

drop function if exists public.match_business_taxons_deterministic(text, integer);

drop index if exists public.business_taxon_aliases_alias_text_normalized_trgm_gin_idx;

drop index if exists public.business_taxons_slug_normalized_trgm_gin_idx;

drop index if exists public.business_taxons_name_normalized_trgm_gin_idx;

drop index if exists public.business_taxon_aliases_alias_text_normalized_fts_gin_idx;

drop index if exists public.business_taxons_name_slug_fts_gin_idx;

drop index if exists public.business_taxon_aliases_alias_text_normalized_idx;

drop index if exists public.business_taxons_slug_normalized_idx;

drop index if exists public.business_taxons_name_normalized_idx;

drop function if exists public.normalize_taxon_match_text(text);

commit;
