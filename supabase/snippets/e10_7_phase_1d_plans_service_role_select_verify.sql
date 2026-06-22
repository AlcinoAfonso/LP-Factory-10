-- e10_7_phase_1d_plans_service_role_select_verify.sql
-- Objetivo: validar grant minimo de leitura server-side em public.plans.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.

select
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'plans'
  and grantee in ('anon', 'authenticated', 'service_role')
order by grantee, privilege_type;
