begin;
set transaction read only;
set local search_path = public, pg_catalog;

with tables as (
  select
    class.relname,
    class.relrowsecurity,
    has_table_privilege('service_role', class.oid, 'SELECT,INSERT,UPDATE') as service_access,
    has_table_privilege('anon', class.oid, 'SELECT') as anon_read,
    has_table_privilege('authenticated', class.oid, 'SELECT') as authenticated_read,
    has_table_privilege('ai_readonly', class.oid, 'SELECT') as ai_readonly_read
  from pg_class class
  join pg_namespace namespace on namespace.oid = class.relnamespace
  where namespace.nspname = 'public'
    and class.relname in ('pending_setup_conversations', 'pending_setup_conversation_turns')
), functions as (
  select
    procedure.oid,
    procedure.proname,
    procedure.prosecdef,
    procedure.proconfig,
    pg_get_functiondef(procedure.oid) as definition
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in (
      'begin_pending_setup_conversation_turn',
      'complete_pending_setup_conversation_turn'
    )
), required_columns as (
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public'
    and (
      (table_name = 'pending_setup_conversations' and column_name in (
        'account_id', 'owner_user_id', 'completed_at', 'completion_mode', 'created_at', 'updated_at'
      ))
      or (table_name = 'pending_setup_conversation_turns' and column_name in (
        'account_id', 'id', 'user_message', 'turn_kind', 'status', 'product_state',
        'product_message', 'failure_code', 'attempted_at', 'created_at', 'completed_at'
      ))
    )
), checks as (
  select
    'tables_rls_and_acl'::text as check_name,
    case
      when count(*) = 2
        and bool_and(relrowsecurity and service_access)
        and bool_and(not anon_read and not authenticated_read and not ai_readonly_read)
      then 'ok'
      else 'unexpected'
    end as status
  from tables

  union all

  select
    'required_columns',
    case when count(*) = 17 then 'ok' else 'unexpected' end
  from required_columns

  union all

  select
    'functions_contract_and_acl',
    case
      when count(*) = 2
        and bool_and(prosecdef = false)
        and bool_and(proconfig @> array['search_path=""'])
        and bool_and(definition ilike '%for update%')
        and bool_and(has_function_privilege('service_role', oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('anon', oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('authenticated', oid, 'EXECUTE'))
        and bool_and(not has_function_privilege('ai_readonly', oid, 'EXECUTE'))
      then 'ok'
      else 'unexpected'
    end
  from functions

  union all

  select
    'turn_order_index',
    case when to_regclass('public.pending_setup_conversation_turns_account_created_idx') is not null
      then 'ok' else 'unexpected' end
)
select check_name, status
from checks
order by check_name;

commit;
