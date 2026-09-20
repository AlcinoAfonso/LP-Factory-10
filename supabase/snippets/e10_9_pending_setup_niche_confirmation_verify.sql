begin;
set transaction read only;
set local search_path = public, pg_catalog;

with function_state as (
  select
    procedure.oid,
    procedure.prosecdef,
    procedure.proconfig,
    pg_get_functiondef(procedure.oid) as definition
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname = 'confirm_pending_setup_niche_resolution_taxon'
    and pg_get_function_identity_arguments(procedure.oid) = 'p_account_id uuid, p_turn_id uuid, p_taxon_id uuid'
), checks as (
  select
    'function_contract'::text as check_name,
    case
      when count(*) = 1
        and bool_and(prosecdef = false)
        and bool_and(proconfig @> array['search_path=""'])
        and bool_and(definition ilike '%for update%')
        and bool_and(definition ilike '%pending_setup%')
        and bool_and(definition ilike '%user_resolution_status%')
      then 'ok'
      else 'unexpected'
    end as status
  from function_state

  union all

  select
    'function_acl',
    case
      when count(*) = 1
        and bool_and(has_function_privilege('service_role', oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('anon', oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('authenticated', oid, 'EXECUTE'))
        and bool_and(
          case
            when to_regrole('ai_readonly') is null then true
            else not has_function_privilege(to_regrole('ai_readonly'), oid, 'EXECUTE')
          end
        )
      then 'ok'
      else 'unexpected'
    end
  from function_state
)
select check_name, status
from checks
order by check_name;

commit;
