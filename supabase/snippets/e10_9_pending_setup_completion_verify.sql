with target as (
  select
    procedure.oid,
    procedure.proowner,
    procedure.proacl,
    procedure.prosecdef,
    procedure.proconfig,
    pg_get_functiondef(procedure.oid) as definition
  from pg_proc procedure
  where procedure.oid = to_regprocedure(
    'public.complete_pending_setup_conversation(uuid,uuid)'
  )
), contract as (
  select
    true as completion_rpc_exists,
    pg_get_userbyid(target.proowner) = 'postgres' as postgres_owned,
    target.prosecdef = false as security_invoker,
    coalesce(target.proconfig @> array['search_path=""'], false) as search_path_closed,
    target.definition ilike '%for update%' as uses_update_locks,
    target.definition ilike '%for share%' as uses_membership_lock,
    (
      select count(*) = 1
      from aclexplode(coalesce(target.proacl, acldefault('f', target.proowner))) privilege
      where privilege.grantee = to_regrole('service_role')
        and privilege.privilege_type = 'EXECUTE'
        and privilege.is_grantable = false
    ) as service_role_execute_only,
    not exists (
      select 1
      from aclexplode(coalesce(target.proacl, acldefault('f', target.proowner))) privilege
      where privilege.grantee = 0
        or privilege.grantee = to_regrole('anon')
        or privilege.grantee = to_regrole('authenticated')
        or (
          to_regrole('ai_readonly') is not null
          and privilege.grantee = to_regrole('ai_readonly')
        )
    ) as external_execute_denied
  from target
), result as (
  select
    *,
    completion_rpc_exists
      and postgres_owned
      and security_invoker
      and search_path_closed
      and uses_update_locks
      and uses_membership_lock
      and service_role_execute_only
      and external_execute_denied as contract_ok
  from contract
)
select
  case when coalesce(contract_ok, false) then 'ok' else 'failed' end as verification,
  coalesce(completion_rpc_exists, false) as completion_rpc_exists,
  coalesce(postgres_owned, false) as postgres_owned,
  coalesce(security_invoker, false) as security_invoker,
  coalesce(search_path_closed, false) as search_path_closed,
  coalesce(uses_update_locks, false) as uses_update_locks,
  coalesce(uses_membership_lock, false) as uses_membership_lock,
  coalesce(service_role_execute_only, false) as service_role_execute_only,
  coalesce(external_execute_denied, false) as external_execute_denied
from result
union all
select 'failed', false, false, false, false, false, false, false, false
where not exists (select 1 from result);

select
  account.status,
  account.setup_completed_at,
  conversation.completed_at,
  conversation.completion_mode,
  exists (
    select 1
    from public.account_commercial_entitlements entitlement
    where entitlement.account_id = account.id
  ) as has_commercial_entitlement
from public.accounts account
join public.pending_setup_conversations conversation
  on conversation.account_id = account.id
where conversation.completed_at is not null
order by conversation.completed_at desc
limit 20;
