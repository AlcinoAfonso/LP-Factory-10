-- Versioned pre-merge. Apply only after confirming that the broad Auth Hook is not configured.

alter table public.account_users enable row level security;

revoke all privileges on table public.account_users from authenticated;
grant select on table public.account_users to authenticated;

revoke all privileges on table public.account_users from service_role;
grant select, insert, update on table public.account_users to service_role;

revoke execute on function public.accept_account_invite(uuid, integer)
  from public, anon, authenticated, ai_readonly;

revoke execute on function public.revoke_account_invite(uuid, uuid)
  from public, anon, authenticated, ai_readonly;

revoke execute on function public.invitation_expires_at(uuid, integer)
  from public, anon, authenticated, ai_readonly;

revoke execute on function public.invitation_is_expired(uuid, integer)
  from public, anon, authenticated, ai_readonly;

revoke execute on function public.activate_user_from_auth_hook(jsonb)
  from public, anon, authenticated, ai_readonly, supabase_auth_admin;
