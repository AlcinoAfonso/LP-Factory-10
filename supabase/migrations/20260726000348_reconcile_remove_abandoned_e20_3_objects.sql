begin;

do $$
declare
  v_actual text[];
  v_expected text[];
begin
  if to_regclass('public.landing_page_taxon_policies') is null
    or to_regclass('public.landing_page_compositions') is null
    or to_regclass('public.landing_page_readiness_evaluations') is null then
    raise exception 'E20.3 reconciliation aborted: an abandoned table is missing';
  end if;

  if (select count(*) from public.landing_page_taxon_policies) <> 0
    or (select count(*) from public.landing_page_compositions) <> 0
    or (select count(*) from public.landing_page_readiness_evaluations) <> 0 then
    raise exception 'E20.3 reconciliation aborted: an abandoned table is not empty';
  end if;

  v_expected := array[
    '20260725210305:e20_3_3_landing_page_compositions',
    '20260725212930:e20_3_3_activation_owner_revalidation',
    '20260725213816:e20_3_4_landing_page_readiness_evaluations'
  ]::text[];

  select array_agg(migrations.version || ':' || migrations.name order by migrations.version)
    into v_actual
  from supabase_migrations.schema_migrations as migrations
  where migrations.version in ('20260725210305', '20260725212930', '20260725213816');

  if v_actual is distinct from v_expected then
    raise exception 'E20.3 reconciliation aborted: historical migrations differ: %', v_actual;
  end if;

  v_expected := array[
    'landing_page_compositions.landing_page_compositions_insert_admin',
    'landing_page_compositions.landing_page_compositions_select_admin',
    'landing_page_compositions.landing_page_compositions_update_admin',
    'landing_page_readiness_evaluations.landing_page_readiness_evaluations_insert_admin',
    'landing_page_readiness_evaluations.landing_page_readiness_evaluations_select_admin',
    'landing_page_taxon_policies.landing_page_taxon_policies_insert_admin',
    'landing_page_taxon_policies.landing_page_taxon_policies_select_admin',
    'landing_page_taxon_policies.landing_page_taxon_policies_update_admin'
  ]::text[];

  select array_agg(policies.tablename || '.' || policies.policyname order by policies.tablename, policies.policyname)
    into v_actual
  from pg_policies as policies
  where policies.schemaname = 'public'
    and policies.tablename in (
      'landing_page_taxon_policies',
      'landing_page_compositions',
      'landing_page_readiness_evaluations'
    );

  if v_actual is distinct from v_expected then
    raise exception 'E20.3 reconciliation aborted: policies differ: %', v_actual;
  end if;

  v_expected := array[
    'landing_page_compositions.landing_page_compositions_protect_lifecycle',
    'landing_page_compositions.landing_page_compositions_validate_owner',
    'landing_page_readiness_evaluations.landing_page_readiness_evaluations_append_only',
    'landing_page_readiness_evaluations.landing_page_readiness_evaluations_validate',
    'landing_page_taxon_policies.landing_page_taxon_policies_validate'
  ]::text[];

  select array_agg(tables.relname || '.' || triggers.tgname order by tables.relname, triggers.tgname)
    into v_actual
  from pg_trigger as triggers
  join pg_class as tables on tables.oid = triggers.tgrelid
  join pg_namespace as schemas on schemas.oid = tables.relnamespace
  where not triggers.tgisinternal
    and schemas.nspname = 'public'
    and tables.relname in (
      'landing_page_taxon_policies',
      'landing_page_compositions',
      'landing_page_readiness_evaluations'
    );

  if v_actual is distinct from v_expected then
    raise exception 'E20.3 reconciliation aborted: triggers differ: %', v_actual;
  end if;

  v_expected := array[
    'activate_landing_page_composition(p_composition_id uuid, p_expected_fingerprint text, p_expected_updated_at timestamp with time zone)',
    'protect_landing_page_composition_lifecycle()',
    'protect_landing_page_readiness_evaluation()',
    'validate_landing_page_composition_owner()',
    'validate_landing_page_readiness_evaluation()',
    'validate_landing_page_taxon_policy()'
  ]::text[];

  select array_agg(
      functions.proname || '(' || pg_get_function_identity_arguments(functions.oid) || ')'
      order by functions.proname
    )
    into v_actual
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
    );

  if v_actual is distinct from v_expected then
    raise exception 'E20.3 reconciliation aborted: functions differ: %', v_actual;
  end if;

  v_expected := array[
    'landing_page_compositions_one_active_per_owner_idx',
    'landing_page_compositions_owner_status_version_idx',
    'landing_page_readiness_evaluations_composition_id_idx',
    'landing_page_readiness_evaluations_evaluated_by_idx',
    'landing_page_readiness_evaluations_latest_idx'
  ]::text[];

  select array_agg(indexes.relname order by indexes.relname)
    into v_actual
  from pg_class as indexes
  join pg_namespace as schemas on schemas.oid = indexes.relnamespace
  where schemas.nspname = 'public'
    and indexes.relkind = 'i'
    and indexes.relname = any(v_expected);

  if v_actual is distinct from v_expected then
    raise exception 'E20.3 reconciliation aborted: specific indexes differ: %', v_actual;
  end if;

  if to_regclass('public.business_taxons') is null
    or to_regclass('auth.users') is null
    or to_regprocedure('public.audit_context_event(text,text,uuid,jsonb,uuid)') is null then
    raise exception 'E20.3 reconciliation aborted: a shared object is missing';
  end if;
end;
$$;

drop policy landing_page_taxon_policies_select_admin
  on public.landing_page_taxon_policies;
drop policy landing_page_taxon_policies_insert_admin
  on public.landing_page_taxon_policies;
drop policy landing_page_taxon_policies_update_admin
  on public.landing_page_taxon_policies;

drop policy landing_page_compositions_select_admin
  on public.landing_page_compositions;
drop policy landing_page_compositions_insert_admin
  on public.landing_page_compositions;
drop policy landing_page_compositions_update_admin
  on public.landing_page_compositions;

drop policy landing_page_readiness_evaluations_select_admin
  on public.landing_page_readiness_evaluations;
drop policy landing_page_readiness_evaluations_insert_admin
  on public.landing_page_readiness_evaluations;

drop trigger landing_page_taxon_policies_validate
  on public.landing_page_taxon_policies;

drop trigger landing_page_compositions_validate_owner
  on public.landing_page_compositions;
drop trigger landing_page_compositions_protect_lifecycle
  on public.landing_page_compositions;

drop trigger landing_page_readiness_evaluations_validate
  on public.landing_page_readiness_evaluations;
drop trigger landing_page_readiness_evaluations_append_only
  on public.landing_page_readiness_evaluations;

drop function public.activate_landing_page_composition(uuid, text, timestamptz);
drop function public.protect_landing_page_composition_lifecycle();
drop function public.protect_landing_page_readiness_evaluation();
drop function public.validate_landing_page_composition_owner();
drop function public.validate_landing_page_readiness_evaluation();
drop function public.validate_landing_page_taxon_policy();

drop table public.landing_page_readiness_evaluations;
drop table public.landing_page_compositions;
drop table public.landing_page_taxon_policies;

commit;
