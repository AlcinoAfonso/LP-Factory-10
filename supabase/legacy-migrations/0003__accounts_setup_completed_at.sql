-- 0003__accounts_setup_completed_at.sql
-- E10.4.1 — Indicador de setup concluído (infra do marcador)

-- 1) Coluna (aditiva)
alter table public.accounts
  add column if not exists setup_completed_at timestamptz;

-- 2) View (exposição do marcador + hardening allow + remove drift 'trial')
create or replace view public.v_access_context_v2 as
select
  a.id as account_id,
  a.subdomain as account_key,
  a.status as account_status,
  au.user_id,
  au.role as member_role,
  au.status as member_status,
  (a.status = any (array['active'::text, 'pending_setup'::text]))
    and coalesce(au.status = 'active'::text, false) as allow,
  case
    when not (a.status = any (array['active'::text, 'pending_setup'::text])) then 'account_blocked'::text
    when au.user_id is null then 'no_membership'::text
    when au.status <> 'active'::text then 'member_inactive'::text
    else null::text
  end as reason,
  a.name as account_name,
  a.setup_completed_at as account_setup_completed_at
from public.accounts a
left join public.account_users au
  on au.account_id = a.id
 and au.user_id = auth.uid();

-- 3) Hardening de segurança da view
alter view public.v_access_context_v2 set (security_invoker = true);
