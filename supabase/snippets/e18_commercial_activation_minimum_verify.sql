-- e18_commercial_activation_minimum_verify.sql
-- Objetivo: verificar a base minima da E18 para commercial_activation.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.
-- Escopo: tabelas, constraints, indices, grants service_role, vinculos, composicoes e artefatos.

with expected_tables as (
  select *
  from (
    values
      ('content_templates'::text),
      ('content_template_taxons'::text),
      ('content_template_compositions'::text),
      ('content_template_composition_items'::text),
      ('content_artifacts'::text),
      ('content_artifact_research_sources'::text)
  ) as tables(table_name)
),

table_status as (
  select
    'table_exists'::text as check_group,
    expected_tables.table_name as object_name,
    case when tables.table_name is not null then 'ok' else 'missing' end as check_status,
    jsonb_build_object(
      'estimated_live_rows',
      coalesce(pg_stat_all_tables.n_live_tup, 0),
      'rls_enabled',
      pg_class.relrowsecurity
    ) as details
  from expected_tables
  left join information_schema.tables tables
    on tables.table_schema = 'public'
   and tables.table_name = expected_tables.table_name
  left join pg_class
    on pg_class.oid = to_regclass(format('public.%I', expected_tables.table_name))
  left join pg_stat_all_tables
    on pg_stat_all_tables.schemaname = 'public'
   and pg_stat_all_tables.relname = expected_tables.table_name
),

expected_constraints as (
  select *
  from (
    values
      ('content_templates_template_key_version_uidx'::text),
      ('content_templates_slug_version_uidx'::text),
      ('content_templates_id_version_uidx'::text),
      ('taxon_market_research_identity_version_uidx'::text),
      ('content_template_compositions_identity_uidx'::text),
      ('content_template_compositions_trace_uidx'::text),
      ('content_template_composition_items_order_uidx'::text),
      ('content_artifacts_identity_uidx'::text),
      ('content_artifacts_research_trace_uidx'::text),
      ('content_artifact_research_sources_pkey'::text)
  ) as constraints(constraint_name)
),

constraint_status as (
  select
    'constraint_or_unique_index'::text as check_group,
    expected_constraints.constraint_name as object_name,
    case
      when pg_constraint.conname is not null or pg_class.relname is not null then 'ok'
      else 'missing'
    end as check_status,
    jsonb_build_object(
      'constraint_type',
      pg_constraint.contype,
      'index_definition',
      pg_indexes.indexdef
    ) as details
  from expected_constraints
  left join pg_constraint
    on pg_constraint.conname = expected_constraints.constraint_name
  left join pg_class
    on pg_class.relname = expected_constraints.constraint_name
  left join pg_indexes
    on pg_indexes.schemaname = 'public'
   and pg_indexes.indexname = expected_constraints.constraint_name
),

expected_indexes as (
  select *
  from (
    values
      ('content_templates_one_active_page_family_uidx'::text),
      ('content_template_compositions_one_active_uidx'::text),
      ('content_template_compositions_taxon_id_idx'::text),
      ('content_template_composition_items_module_template_id_idx'::text),
      ('content_artifacts_one_published_uidx'::text),
      ('content_artifacts_composition_id_idx'::text),
      ('content_artifacts_taxon_id_idx'::text),
      ('content_artifact_research_sources_research_id_idx'::text)
  ) as indexes(index_name)
),

index_status as (
  select
    'index'::text as check_group,
    expected_indexes.index_name as object_name,
    case when pg_indexes.indexname is not null then 'ok' else 'missing' end as check_status,
    jsonb_build_object('index_definition', pg_indexes.indexdef) as details
  from expected_indexes
  left join pg_indexes
    on pg_indexes.schemaname = 'public'
   and pg_indexes.indexname = expected_indexes.index_name
),

grant_status as (
  select
    'service_role_select'::text as check_group,
    expected_tables.table_name as object_name,
    case
      when to_regclass(format('public.%I', expected_tables.table_name)) is null then 'missing_table'
      when has_table_privilege('service_role', format('public.%I', expected_tables.table_name), 'SELECT') then 'ok'
      else 'missing_grant'
    end as check_status,
    jsonb_build_object(
      'anon_select',
      case
        when to_regclass(format('public.%I', expected_tables.table_name)) is null then null
        else has_table_privilege('anon', format('public.%I', expected_tables.table_name), 'SELECT')
      end,
      'authenticated_select',
      case
        when to_regclass(format('public.%I', expected_tables.table_name)) is null then null
        else has_table_privilege('authenticated', format('public.%I', expected_tables.table_name), 'SELECT')
      end
    ) as details
  from expected_tables
),

template_taxon_links as (
  select
    'template_taxon_links'::text as check_group,
    coalesce(content_templates.template_key, content_template_taxons.template_id::text) as object_name,
    case
      when content_templates.id is null then 'missing_template'
      when content_template_taxons.is_active is not true then 'inactive_link'
      when content_templates.template_family <> 'commercial_activation' then 'non_commercial_template'
      when content_templates.template_scope <> 'page' then 'non_page_template'
      when content_templates.status <> 'active' or content_templates.is_active is not true then 'inactive_template'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'link_id',
      content_template_taxons.id,
      'template_id',
      content_template_taxons.template_id,
      'taxon_id',
      content_template_taxons.taxon_id,
      'is_primary',
      content_template_taxons.is_primary,
      'priority',
      content_template_taxons.priority,
      'created_at',
      content_template_taxons.created_at
    ) as details
  from public.content_template_taxons
  left join public.content_templates
    on content_templates.id = content_template_taxons.template_id
  order by
    content_template_taxons.is_primary desc,
    content_template_taxons.priority desc,
    content_template_taxons.created_at asc,
    content_template_taxons.id asc
  limit 50
),

composition_artifact_presence as (
  select
    'composition_or_artifact_presence'::text as check_group,
    expected_tables.table_name as object_name,
    case
      when expected_tables.table_name not in (
        'content_template_compositions',
        'content_template_composition_items',
        'content_artifacts',
        'content_artifact_research_sources'
      ) then 'not_applicable'
      when tables.table_name is null then 'missing_table'
      when coalesce(pg_stat_all_tables.n_live_tup, 0) = 0 then 'empty'
      else 'has_rows'
    end as check_status,
    jsonb_build_object(
      'estimated_live_rows',
      coalesce(pg_stat_all_tables.n_live_tup, 0)
    ) as details
  from expected_tables
  left join information_schema.tables tables
    on tables.table_schema = 'public'
   and tables.table_name = expected_tables.table_name
  left join pg_stat_all_tables
    on pg_stat_all_tables.schemaname = 'public'
   and pg_stat_all_tables.relname = expected_tables.table_name
  where expected_tables.table_name in (
    'content_template_compositions',
    'content_template_composition_items',
    'content_artifacts',
    'content_artifact_research_sources'
  )
)

select *
from table_status
union all
select *
from constraint_status
union all
select *
from index_status
union all
select *
from grant_status
union all
select *
from template_taxon_links
union all
select *
from composition_artifact_presence
order by
  check_group,
  object_name;
