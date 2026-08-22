-- Read-only verification for E19.5.3. Run after applying
-- 20260822170000_e19_5_3_landing_page_workspace.sql in the target environment.
with object_checks as (
  select
    to_regclass('public.account_landing_page_shared_configurations') is not null
      as shared_table_exists,
    to_regclass('public.account_landing_page_configurations') is not null
      as landing_table_exists,
    to_regprocedure(
      'public.save_account_landing_page_configuration_v1(uuid,uuid,jsonb,jsonb,bigint,bigint,integer,uuid)'
    ) is not null as save_rpc_exists,
    to_regprocedure(
      'public.approve_account_landing_page_materialization_v1(uuid,uuid,uuid,uuid)'
    ) is not null as approval_rpc_exists
), security_checks as (
  select
    (select relrowsecurity from pg_class where oid = 'public.account_landing_page_shared_configurations'::regclass)
      as shared_rls,
    (select relrowsecurity from pg_class where oid = 'public.account_landing_page_configurations'::regclass)
      as landing_rls,
    not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename in (
          'account_landing_page_shared_configurations',
          'account_landing_page_configurations'
        )
    ) as no_policies,
    has_table_privilege('service_role', 'public.account_landing_page_shared_configurations', 'SELECT,INSERT,UPDATE')
      and not has_table_privilege('service_role', 'public.account_landing_page_shared_configurations', 'DELETE,TRUNCATE')
      as shared_service_role_least_privilege,
    has_table_privilege('service_role', 'public.account_landing_page_configurations', 'SELECT,INSERT,UPDATE')
      and not has_table_privilege('service_role', 'public.account_landing_page_configurations', 'DELETE,TRUNCATE')
      as landing_service_role_least_privilege,
    not has_table_privilege('anon', 'public.account_landing_page_shared_configurations', 'SELECT,INSERT,UPDATE,DELETE')
      and not has_table_privilege('authenticated', 'public.account_landing_page_shared_configurations', 'SELECT,INSERT,UPDATE,DELETE')
      and not has_table_privilege('anon', 'public.account_landing_page_configurations', 'SELECT,INSERT,UPDATE,DELETE')
      and not has_table_privilege('authenticated', 'public.account_landing_page_configurations', 'SELECT,INSERT,UPDATE,DELETE')
      as data_api_denied
), contract_checks as (
  select
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.account_landing_pages'::regclass
        and conname = 'account_landing_pages_approved_materialization_fkey'
        and condeferrable
    ) as approval_fk_tenant_safe,
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.account_landing_page_materializations'::regclass
        and conname = 'account_landing_page_materializations_id_landing_page_account_key'
    ) as materialization_composed_unique,
    not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name in (
          'account_landing_page_shared_configurations',
          'account_landing_page_configurations'
        )
        and column_name in ('is_initialized', 'is_complete', 'status')
    ) as no_eager_state_columns
)
select *
from object_checks
cross join security_checks
cross join contract_checks;
