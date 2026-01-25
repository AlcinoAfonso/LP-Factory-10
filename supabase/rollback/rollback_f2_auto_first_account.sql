begin;

revoke all on function public.ensure_first_account_for_current_user() from public;
revoke all on function public.ensure_first_account_for_current_user() from anon;
revoke all on function public.ensure_first_account_for_current_user() from authenticated;

drop function if exists public.ensure_first_account_for_current_user();

commit;
