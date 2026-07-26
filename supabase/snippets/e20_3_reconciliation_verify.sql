begin;
set transaction read only;

do $$
declare
  v_has_rows boolean;
  v_table text;
begin
  foreach v_table in array array[
    'public.landing_page_taxon_policies',
    'public.landing_page_compositions',
    'public.landing_page_readiness_evaluations'
  ]::text[] loop
    if to_regclass(v_table) is not null then
      execute format(
        'select exists (select 1 from %s)',
        to_regclass(v_table)
      ) into v_has_rows;

      if v_has_rows then
        raise exception 'E20.3 reconciliation verification failed: % is not empty', v_table;
      end if;
    end if;
  end loop;
end;
$$;

with inventory as (
  select
    (select count(*)
      from supabase_migrations.schema_migrations
      where version in ('20260725210305', '20260725212930', '20260725213816')) as historical_migrations,
    (select count(*)
      from supabase_migrations.schema_migrations
      where version = '20260726000348') as cleanup_migration,
    (select count(*)
      from pg_class as tables
      join pg_namespace as schemas on schemas.oid = tables.relnamespace
      where schemas.nspname = 'public'
        and tables.relkind = 'r'
        and tables.relname in (
          'landing_page_taxon_policies',
          'landing_page_compositions',
          'landing_page_readiness_evaluations'
        )) as abandoned_tables,
    (select count(*)
      from pg_policies
      where schemaname = 'public'
        and tablename in (
          'landing_page_taxon_policies',
          'landing_page_compositions',
          'landing_page_readiness_evaluations'
        )) as abandoned_policies,
    (select count(*)
      from pg_trigger as triggers
      join pg_class as tables on tables.oid = triggers.tgrelid
      join pg_namespace as schemas on schemas.oid = tables.relnamespace
      where not triggers.tgisinternal
        and schemas.nspname = 'public'
        and tables.relname in (
          'landing_page_taxon_policies',
          'landing_page_compositions',
          'landing_page_readiness_evaluations'
        )) as abandoned_triggers,
    (select count(*)
      from pg_proc as functions
      join pg_namespace as schemas on schemas.oid = functions.pronamespace
      where schemas.nspname = 'public'
        and functions.proname in (
          'activate_landing_page_composition',
          'protect_landing_page_composition_lifecycle',
          'protect_landing_page_readiness_evaluation',
          'validate_landing_page_composition_owner',
          'validate_landing_page_readiness_evaluation',
          'validate_landing_page_taxon_policy'
        )) as abandoned_functions,
    (select count(*)
      from pg_class as indexes
      join pg_namespace as schemas on schemas.oid = indexes.relnamespace
      where schemas.nspname = 'public'
        and indexes.relkind = 'i'
        and indexes.relname in (
          'landing_page_compositions_one_active_per_owner_idx',
          'landing_page_compositions_owner_status_version_idx',
          'landing_page_readiness_evaluations_composition_id_idx',
          'landing_page_readiness_evaluations_evaluated_by_idx',
          'landing_page_readiness_evaluations_latest_idx'
        )) as abandoned_specific_indexes,
    to_regclass('public.business_taxons') is not null as business_taxons_preserved,
    to_regclass('auth.users') is not null as auth_users_preserved,
    to_regprocedure('public.audit_context_event(text,text,uuid,jsonb,uuid)') is not null as audit_function_preserved
)
select
  case
    when historical_migrations = 3
      and cleanup_migration = 0
      and abandoned_tables = 3
      and abandoned_policies = 8
      and abandoned_triggers = 5
      and abandoned_functions = 6
      and abandoned_specific_indexes = 5
      and business_taxons_preserved
      and auth_users_preserved
      and audit_function_preserved
      then 'pre_merge_pending'
    when historical_migrations = 3
      and cleanup_migration = 1
      and abandoned_tables = 0
      and abandoned_policies = 0
      and abandoned_triggers = 0
      and abandoned_functions = 0
      and abandoned_specific_indexes = 0
      and business_taxons_preserved
      and auth_users_preserved
      and audit_function_preserved
      then 'post_merge_reconciled'
    else 'unexpected'
  end as reconciliation_state,
  inventory.*
from inventory;

rollback;
