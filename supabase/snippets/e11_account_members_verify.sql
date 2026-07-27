begin;
set transaction read only;
set local search_path = public, pg_catalog;

with expected_policies(policyname, command) as (
  values
    ('account_users_delete_by_admins'::text, 'DELETE'::text),
    ('account_users_insert_by_admins', 'INSERT'),
    ('account_users_select_self_or_admin', 'SELECT'),
    ('account_users_update_by_admins', 'UPDATE')
), actual_policies as (
  select policyname, cmd as command
  from pg_policies
  where schemaname = 'public'
    and tablename = 'account_users'
), policy_mismatches as (
  select
    coalesce(expected.policyname, actual.policyname) as policyname,
    expected.command as expected_command,
    actual.command as actual_command
  from expected_policies expected
  full join actual_policies actual using (policyname)
  where expected.command is distinct from actual.command
), target_roles(role_name) as (
  values
    ('authenticated'::text),
    ('service_role')
), table_privileges(privilege_name) as (
  values
    ('SELECT'::text),
    ('INSERT'),
    ('UPDATE'),
    ('DELETE'),
    ('TRUNCATE'),
    ('REFERENCES'),
    ('TRIGGER'),
    ('MAINTAIN')
), privilege_mismatches as (
  select
    role_name,
    privilege_name,
    has_table_privilege(role_name, 'public.account_users', privilege_name) as has_privilege
  from target_roles
  cross join table_privileges
  where has_table_privilege(role_name, 'public.account_users', privilege_name)
    is distinct from (
      privilege_name = 'SELECT'
      or (role_name = 'service_role' and privilege_name in ('INSERT', 'UPDATE'))
    )
), target_function_roles(function_signature, role_name) as (
  values
    ('public.accept_account_invite(uuid, integer)'::text, 'PUBLIC'::text),
    ('public.accept_account_invite(uuid, integer)', 'anon'),
    ('public.accept_account_invite(uuid, integer)', 'authenticated'),
    ('public.accept_account_invite(uuid, integer)', 'ai_readonly'),
    ('public.revoke_account_invite(uuid, uuid)', 'PUBLIC'),
    ('public.revoke_account_invite(uuid, uuid)', 'anon'),
    ('public.revoke_account_invite(uuid, uuid)', 'authenticated'),
    ('public.revoke_account_invite(uuid, uuid)', 'ai_readonly'),
    ('public.invitation_expires_at(uuid, integer)', 'PUBLIC'),
    ('public.invitation_expires_at(uuid, integer)', 'anon'),
    ('public.invitation_expires_at(uuid, integer)', 'authenticated'),
    ('public.invitation_expires_at(uuid, integer)', 'ai_readonly'),
    ('public.invitation_is_expired(uuid, integer)', 'PUBLIC'),
    ('public.invitation_is_expired(uuid, integer)', 'anon'),
    ('public.invitation_is_expired(uuid, integer)', 'authenticated'),
    ('public.invitation_is_expired(uuid, integer)', 'ai_readonly'),
    ('public.activate_user_from_auth_hook(jsonb)', 'PUBLIC'),
    ('public.activate_user_from_auth_hook(jsonb)', 'anon'),
    ('public.activate_user_from_auth_hook(jsonb)', 'authenticated'),
    ('public.activate_user_from_auth_hook(jsonb)', 'ai_readonly'),
    ('public.activate_user_from_auth_hook(jsonb)', 'supabase_auth_admin')
), function_acl_mismatches as (
  select function_signature, role_name
  from target_function_roles
  where to_regprocedure(function_signature) is null
    or (
      role_name = 'PUBLIC'
      and exists (
        select 1
        from pg_proc function_row
        cross join lateral aclexplode(
          coalesce(function_row.proacl, acldefault('f', function_row.proowner))
        ) acl
        where function_row.oid = to_regprocedure(function_signature)
          and acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
    )
    or (
      role_name <> 'PUBLIC'
      and to_regrole(role_name) is not null
      and has_function_privilege(role_name, function_signature, 'EXECUTE')
    )
), checks as (
  select
    'account_users_rls'::text as check_name,
    case when relrowsecurity and not relforcerowsecurity then 'ok' else 'unexpected' end as status,
    jsonb_build_object('enabled', relrowsecurity, 'forced', relforcerowsecurity) as details
  from pg_class
  where oid = 'public.account_users'::regclass
  union all
  select
    'account_users_policies',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(policy_mismatches) order by policyname), '[]'::jsonb)
  from policy_mismatches
  union all
  select
    'account_users_table_privileges',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(privilege_mismatches) order by role_name, privilege_name), '[]'::jsonb)
  from privilege_mismatches
  union all
  select
    'legacy_function_execute_acl',
    case when count(*) = 0 then 'ok' else 'unexpected' end,
    coalesce(jsonb_agg(to_jsonb(function_acl_mismatches) order by function_signature, role_name), '[]'::jsonb)
  from function_acl_mismatches
)
select check_name, status, details
from checks
order by check_name;

rollback;
