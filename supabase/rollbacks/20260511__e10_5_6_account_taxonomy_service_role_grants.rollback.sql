-- 20260511__e10_5_6_account_taxonomy_service_role_grants.rollback.sql
-- E10.5.6 / 20.7 — rollback dos grants para vínculo oficial em account_taxonomy
-- Escopo:
-- - remove permissões operacionais concedidas ao service_role em account_taxonomy
-- - mantém a tabela e os dados de account_taxonomy intactos
-- - não altera account_niche_resolutions
-- - não altera business_taxons
-- - não altera business_taxon_aliases
-- - não altera RLS/policies
-- - não usa CASCADE

begin;

revoke select, insert, update on table public.account_taxonomy from service_role;

commit;
