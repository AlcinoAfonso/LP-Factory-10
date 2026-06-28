-- e9_phase_3_entitlements_verify.sql
-- Objetivo: validar o schema minimo de entitlement comercial da E9 Fase 3.
-- Tipo: read-only / recorrente. Usar no Supabase Inspect ou SQL Editor.

with expected_constraints(conname, contype) as (
  values
    ('account_commercial_entitlements_pkey'::text, 'p'::text),
    ('account_commercial_entitlements_account_id_fkey'::text, 'f'::text),
    ('account_commercial_entitlements_plan_key_chk'::text, 'c'::text),
    ('account_commercial_entitlements_origin_chk'::text, 'c'::text),
    ('account_commercial_entitlements_status_chk'::text, 'c'::text),
    ('account_commercial_entitlements_metadata_json_object_chk'::text, 'c'::text),
    ('account_commercial_entitlements_vigencia_chk'::text, 'c'::text)
),

resolved_constraints as (
  select
    expected_constraints.conname,
    constraints.contype,
    pg_get_constraintdef(constraints.oid) as constraint_def
  from expected_constraints
  left join pg_constraint constraints
    on constraints.conname = expected_constraints.conname
   and constraints.conrelid = to_regclass('public.account_commercial_entitlements')
),

expected_indexes(indexname) as (
  values
    ('account_commercial_entitlements_account_id_idx'::text),
    ('account_commercial_entitlements_status_idx'::text),
    ('account_commercial_entitlements_expires_at_idx'::text),
    ('account_commercial_entitlements_effective_lookup_idx'::text),
    ('account_commercial_entitlements_idempotency_key_uidx'::text)
),

resolved_indexes as (
  select
    expected_indexes.indexname,
    indexes.indexdef
  from expected_indexes
  left join pg_indexes indexes
    on indexes.schemaname = 'public'
   and indexes.tablename = 'account_commercial_entitlements'
   and indexes.indexname = expected_indexes.indexname
),

expected_grants(object_name, grantee, privilege_type) as (
  values
    ('account_commercial_entitlements'::text, 'authenticated'::text, 'SELECT'::text),
    ('account_commercial_entitlements'::text, 'service_role'::text, 'SELECT'::text),
    ('account_commercial_entitlements'::text, 'service_role'::text, 'INSERT'::text),
    ('account_commercial_entitlements'::text, 'service_role'::text, 'UPDATE'::text),
    ('account_commercial_entitlements'::text, 'service_role'::text, 'DELETE'::text),
    ('v_account_commercial_entitlement_effective'::text, 'authenticated'::text, 'SELECT'::text),
    ('v_account_commercial_entitlement_effective'::text, 'service_role'::text, 'SELECT'::text)
),

resolved_grants as (
  select
    expected_grants.object_name,
    expected_grants.grantee,
    expected_grants.privilege_type,
    grants.privilege_type as resolved_privilege
  from expected_grants
  left join information_schema.role_table_grants grants
    on grants.table_schema = 'public'
   and grants.table_name = expected_grants.object_name
   and grants.grantee = expected_grants.grantee
   and grants.privilege_type = expected_grants.privilege_type
),

unexpected_authenticated_mutation_grants as (
  select privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'account_commercial_entitlements'
    and grantee = 'authenticated'
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
),

effective_rule_cases(case_name, status, starts_at, expires_at, canceled_at, expected_eligible) as (
  values
    ('active_open'::text, 'ativo'::text, now() - interval '1 day', null::timestamptz, null::timestamptz, true),
    ('active_future'::text, 'ativo'::text, now() + interval '1 day', null::timestamptz, null::timestamptz, false),
    ('active_expired'::text, 'ativo'::text, now() - interval '10 days', now() - interval '1 day', null::timestamptz, false),
    ('pending'::text, 'pendente_confirmacao'::text, null::timestamptz, null::timestamptz, null::timestamptz, false),
    ('expired'::text, 'expirado'::text, null::timestamptz, null::timestamptz, null::timestamptz, false),
    ('canceled'::text, 'cancelado'::text, null::timestamptz, null::timestamptz, now(), false)
),

effective_rule_failures as (
  select case_name
  from effective_rule_cases
  where (
    status = 'ativo'
    and canceled_at is null
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
  ) is distinct from expected_eligible
),

forbidden_columns as (
  select column_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'account_commercial_entitlements'
    and (
      column_name ilike '%checkout%'
      or column_name ilike '%webhook%'
      or column_name ilike '%stripe%'
      or column_name ilike '%mercado%'
      or column_name ilike '%asaas%'
      or column_name ilike '%card%'
      or column_name ilike '%email%'
      or column_name ilike '%payload%'
      or column_name ilike '%secret%'
    )
),

view_definitions as (
  select viewname, definition
  from pg_views
  where schemaname = 'public'
    and viewname = 'v_account_commercial_entitlement_effective'
),

final_results as (
  select
    'table'::text as check_group,
    'account_commercial_entitlements_exists'::text as object_name,
    case when to_regclass('public.account_commercial_entitlements') is not null then 'ok' else 'missing' end as check_status,
    jsonb_build_object('regclass', to_regclass('public.account_commercial_entitlements')::text) as details

  union all

  select
    'view'::text,
    'v_account_commercial_entitlement_effective_exists'::text,
    case when to_regclass('public.v_account_commercial_entitlement_effective') is not null then 'ok' else 'missing' end,
    jsonb_build_object('regclass', to_regclass('public.v_account_commercial_entitlement_effective')::text)

  union all

  select
    'view'::text,
    'effective_view_security_invoker'::text,
    case
      when exists (
        select 1
        from pg_class
        join pg_namespace on pg_namespace.oid = pg_class.relnamespace
        where pg_namespace.nspname = 'public'
          and pg_class.relname = 'v_account_commercial_entitlement_effective'
          and coalesce(pg_class.reloptions, array[]::text[]) @> array['security_invoker=true']
      ) then 'ok'
      else 'missing_security_invoker'
    end,
    '{}'::jsonb

  union all

  select
    'constraints'::text,
    'required_checks_fk_pk'::text,
    case when count(*) filter (where contype is null) = 0 then 'ok' else 'missing_constraints' end,
    jsonb_build_object(
      'missing', coalesce(jsonb_agg(conname) filter (where contype is null), '[]'::jsonb)
    )
  from resolved_constraints

  union all

  select
    'constraints'::text,
    'plan_origin_status_values'::text,
    case
      when bool_or(conname = 'account_commercial_entitlements_plan_key_chk' and constraint_def like '%starter%' and constraint_def like '%lite%' and constraint_def like '%pro%' and constraint_def like '%ultra%')
       and bool_or(conname = 'account_commercial_entitlements_origin_chk' and constraint_def like '%plano_pago_confirmado%' and constraint_def like '%trial%' and constraint_def like '%liberacao_manual%')
       and bool_or(conname = 'account_commercial_entitlements_status_chk' and constraint_def like '%pendente_confirmacao%' and constraint_def like '%ativo%' and constraint_def like '%expirado%' and constraint_def like '%cancelado%')
      then 'ok'
      else 'unexpected_constraint_values'
    end,
    jsonb_build_object('checked_constraints', count(*))
  from resolved_constraints

  union all

  select
    'rls'::text,
    'table_rls_enabled'::text,
    case when relrowsecurity then 'ok' else 'rls_disabled' end,
    jsonb_build_object('relrowsecurity', relrowsecurity)
  from pg_class
  join pg_namespace on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relname = 'account_commercial_entitlements'

  union all

  select
    'rls'::text,
    'select_policy_member_or_platform'::text,
    case when count(*) = 1 then 'ok' else 'missing_or_duplicate_policy' end,
    jsonb_build_object('policy_count', count(*))
  from pg_policies
  where schemaname = 'public'
    and tablename = 'account_commercial_entitlements'
    and policyname = 'account_commercial_entitlements_select_member_or_platform'
    and cmd = 'SELECT'

  union all

  select
    'grants'::text,
    'expected_table_and_view_grants'::text,
    case when count(*) filter (where resolved_privilege is null) = 0 then 'ok' else 'missing_grants' end,
    jsonb_build_object(
      'missing', coalesce(jsonb_agg(object_name || ':' || grantee || ':' || privilege_type) filter (where resolved_privilege is null), '[]'::jsonb)
    )
  from resolved_grants

  union all

  select
    'grants'::text,
    'authenticated_has_no_mutation_grants'::text,
    case when count(*) = 0 then 'ok' else 'unexpected_mutation_grant' end,
    jsonb_build_object('unexpected', coalesce(jsonb_agg(privilege_type), '[]'::jsonb))
  from unexpected_authenticated_mutation_grants

  union all

  select
    'indexes'::text,
    'expected_indexes_exist'::text,
    case when count(*) filter (where indexdef is null) = 0 then 'ok' else 'missing_indexes' end,
    jsonb_build_object(
      'missing', coalesce(jsonb_agg(indexname) filter (where indexdef is null), '[]'::jsonb)
    )
  from resolved_indexes

  union all

  select
    'indexes'::text,
    'idempotency_key_unique_partial'::text,
    case
      when exists (
        select 1
        from resolved_indexes
        where indexname = 'account_commercial_entitlements_idempotency_key_uidx'
          and indexdef ilike '%UNIQUE%'
          and indexdef ilike '%idempotency_key%'
          and indexdef ilike '%WHERE (idempotency_key IS NOT NULL)%'
      ) then 'ok'
      else 'missing_or_not_partial_unique'
    end,
    '{}'::jsonb

  union all

  select
    'effective_read'::text,
    'synthetic_eligible_and_ineligible_rules'::text,
    case when count(*) = 0 then 'ok' else 'unexpected_effective_rule' end,
    jsonb_build_object('failing_cases', coalesce(jsonb_agg(case_name), '[]'::jsonb))
  from effective_rule_failures

  union all

  select
    'provider_dependency'::text,
    'no_checkout_webhook_provider_specific_columns'::text,
    case when count(*) = 0 then 'ok' else 'forbidden_columns' end,
    jsonb_build_object('columns', coalesce(jsonb_agg(column_name), '[]'::jsonb))
  from forbidden_columns

  union all

  select
    'provider_dependency'::text,
    'view_has_no_provider_specific_dependency'::text,
    case
      when count(*) = 1
       and bool_and(definition not ilike '%checkout%')
       and bool_and(definition not ilike '%webhook%')
       and bool_and(definition not ilike '%stripe%')
       and bool_and(definition not ilike '%mercado%')
       and bool_and(definition not ilike '%asaas%')
      then 'ok'
      else 'unexpected_provider_dependency'
    end,
    jsonb_build_object('view_count', count(*))
  from view_definitions
)

select *
from final_results
order by check_group, object_name
limit 50
