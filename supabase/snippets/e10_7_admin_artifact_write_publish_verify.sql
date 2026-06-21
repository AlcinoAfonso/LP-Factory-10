-- e10_7_admin_artifact_write_publish_verify.sql
-- Objetivo: verificar o patch estrutural minimo da E10.7 Fase 1.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.
-- Escopo: grants, RLS, policies, RPC transacional e guarda de published unico.

with expected_table_privileges as (
  select *
  from (
    values
      ('content_artifacts'::text, 'authenticated'::text, 'SELECT'::text),
      ('content_artifacts'::text, 'authenticated'::text, 'INSERT'::text),
      ('content_artifacts'::text, 'service_role'::text, 'SELECT'::text),
      ('content_artifacts'::text, 'service_role'::text, 'INSERT'::text),
      ('content_artifacts'::text, 'service_role'::text, 'UPDATE'::text),
      ('content_artifact_research_sources'::text, 'authenticated'::text, 'SELECT'::text),
      ('content_artifact_research_sources'::text, 'authenticated'::text, 'INSERT'::text),
      ('content_artifact_research_sources'::text, 'service_role'::text, 'SELECT'::text),
      ('content_artifact_research_sources'::text, 'service_role'::text, 'INSERT'::text)
  ) as privileges(table_name, role_name, privilege_name)
),

table_privilege_status as (
  select
    'table_privilege'::text as check_group,
    format('%s:%s:%s', table_name, role_name, privilege_name) as object_name,
    case
      when has_table_privilege(role_name, format('public.%I', table_name), privilege_name) then 'ok'
      else 'missing'
    end as check_status,
    jsonb_build_object(
      'table_name', table_name,
      'role_name', role_name,
      'privilege_name', privilege_name
    ) as details
  from expected_table_privileges
),

expected_column_privileges as (
  select *
  from (
    values
      ('content_artifacts'::text, 'content_json'::text, 'authenticated'::text, 'UPDATE'::text),
      ('content_artifacts'::text, 'provenance_json'::text, 'authenticated'::text, 'UPDATE'::text)
  ) as privileges(table_name, column_name, role_name, privilege_name)
),

column_privilege_status as (
  select
    'column_privilege'::text as check_group,
    format('%s.%s:%s:%s', table_name, column_name, role_name, privilege_name) as object_name,
    case
      when has_column_privilege(role_name, format('public.%I', table_name), column_name, privilege_name) then 'ok'
      else 'missing'
    end as check_status,
    jsonb_build_object(
      'table_name', table_name,
      'column_name', column_name,
      'role_name', role_name,
      'privilege_name', privilege_name
    ) as details
  from expected_column_privileges
),

rls_status as (
  select
    'rls'::text as check_group,
    pg_class.relname as object_name,
    case when pg_class.relrowsecurity then 'ok' else 'disabled' end as check_status,
    jsonb_build_object('rls_forced', pg_class.relforcerowsecurity) as details
  from pg_class
  join pg_namespace
    on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relname in (
      'content_artifacts',
      'content_artifact_research_sources'
    )
),

expected_policies as (
  select *
  from (
    values
      ('content_artifacts'::text, 'content_artifacts_select_admin_only'::text),
      ('content_artifacts'::text, 'content_artifacts_insert_admin_draft_only'::text),
      ('content_artifacts'::text, 'content_artifacts_update_admin_draft_content_only'::text),
      ('content_artifact_research_sources'::text, 'content_artifact_research_sources_select_admin_only'::text),
      ('content_artifact_research_sources'::text, 'content_artifact_research_sources_insert_admin_business_buyer_only'::text)
  ) as policies(table_name, policy_name)
),

policy_status as (
  select
    'policy'::text as check_group,
    expected_policies.policy_name as object_name,
    case when pg_policies.policyname is not null then 'ok' else 'missing' end as check_status,
    jsonb_build_object(
      'table_name', expected_policies.table_name,
      'cmd', pg_policies.cmd,
      'roles', pg_policies.roles,
      'qual', pg_policies.qual,
      'with_check', pg_policies.with_check
    ) as details
  from expected_policies
  left join pg_policies
    on pg_policies.schemaname = 'public'
   and pg_policies.tablename = expected_policies.table_name
   and pg_policies.policyname = expected_policies.policy_name
),

function_status as (
  select
    'function'::text as check_group,
    expected_functions.function_name as object_name,
    case
      when pg_proc.oid is null then 'missing'
      when pg_proc.prosecdef is not true then 'not_security_definer'
      when not has_function_privilege('authenticated', pg_proc.oid, 'EXECUTE') then 'missing_authenticated_execute'
      when has_function_privilege('anon', pg_proc.oid, 'EXECUTE') then 'anon_can_execute'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'security_definer', pg_proc.prosecdef,
      'authenticated_execute',
      case when pg_proc.oid is null then null else has_function_privilege('authenticated', pg_proc.oid, 'EXECUTE') end,
      'anon_execute',
      case when pg_proc.oid is null then null else has_function_privilege('anon', pg_proc.oid, 'EXECUTE') end
    ) as details
  from (
    values ('publish_content_artifact_draft(uuid)'::text, 'publish_content_artifact_draft'::text)
  ) as expected_functions(function_name, proname)
  left join pg_namespace
    on pg_namespace.nspname = 'public'
  left join pg_proc
    on pg_proc.pronamespace = pg_namespace.oid
   and pg_proc.proname = expected_functions.proname
),

published_unique_index_status as (
  select
    'index'::text as check_group,
    expected_indexes.index_name as object_name,
    case
      when pg_indexes.indexname is null then 'missing'
      when pg_indexes.indexdef ilike '%WHERE (status = ''published''::text)%' then 'ok'
      else 'unexpected_definition'
    end as check_status,
    jsonb_build_object('index_definition', pg_indexes.indexdef) as details
  from (
    values ('content_artifacts_one_published_uidx'::text)
  ) as expected_indexes(index_name)
  left join pg_indexes
    on pg_indexes.schemaname = 'public'
   and pg_indexes.tablename = 'content_artifacts'
   and pg_indexes.indexname = expected_indexes.index_name
)

select *
from table_privilege_status
union all
select *
from column_privilege_status
union all
select *
from rls_status
union all
select *
from policy_status
union all
select *
from function_status
union all
select *
from published_unique_index_status
order by check_group, object_name;
