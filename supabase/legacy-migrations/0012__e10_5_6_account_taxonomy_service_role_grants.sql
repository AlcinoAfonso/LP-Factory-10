-- 0012__e10_5_6_account_taxonomy_service_role_grants.sql
-- E10.5.6 / 20.7 — grants para vínculo oficial em account_taxonomy
-- Objetivo:
-- - permitir que a camada server/service grave vínculo oficial em account_taxonomy
-- - manter account_taxonomy sem acesso direto para public, anon e authenticated
-- - não alterar estrutura da tabela
-- - não alterar policies/RLS
-- - não criar nem remover dados

begin;

grant usage on schema public to service_role;

revoke all on table public.account_taxonomy from public;
revoke all on table public.account_taxonomy from anon;
revoke all on table public.account_taxonomy from authenticated;

grant select, insert, update on table public.account_taxonomy to service_role;

commit;
