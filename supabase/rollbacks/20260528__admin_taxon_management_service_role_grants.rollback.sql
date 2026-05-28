-- 20260528__admin_taxon_management_service_role_grants.rollback.sql
-- Rollback dos grants operacionais de gestao de taxons no Admin
-- Escopo:
-- - remove permissoes concedidas ao service_role em taxons e aliases
-- - mantem tabelas, dados, RLS e policies intactos

begin;

revoke select, insert, update, delete on table public.business_taxons from service_role;
revoke select, insert, update, delete on table public.business_taxon_aliases from service_role;

commit;
