-- 0014__admin_taxon_management_service_role_grants.sql
-- Admin Dashboard / taxon management grants
-- Objetivo:
-- - permitir que a camada server/service gerencie taxons e aliases do Admin
-- - manter taxons e aliases sem acesso direto para public, anon e authenticated
-- - nao alterar estrutura, RLS/policies ou dados existentes

begin;

grant usage on schema public to service_role;

revoke all on table public.business_taxons from public;
revoke all on table public.business_taxons from anon;
revoke all on table public.business_taxons from authenticated;

revoke all on table public.business_taxon_aliases from public;
revoke all on table public.business_taxon_aliases from anon;
revoke all on table public.business_taxon_aliases from authenticated;

grant select, insert, update, delete on table public.business_taxons to service_role;
grant select, insert, update, delete on table public.business_taxon_aliases to service_role;

commit;
