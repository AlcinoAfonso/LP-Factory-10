-- e18_commercial_activation_base_records_verify.sql
-- Objetivo: verificar os 9 registros-base da E18 Fase 2 para commercial_activation.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.
-- Escopo: registros em content_templates, unicidade, status, familia, escopo, payload, RLS, grants e ausencia de vinculos em content_template_taxons.

with expected_records as (
  select *
  from (
    values
      (
        'commercial_activation_page'::text,
        'commercial-activation-page'::text,
        'Commercial activation page'::text,
        'commercial_activation'::text,
        'page'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'hero'::text,
        'hero'::text,
        'Hero'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'benefits'::text,
        'benefits'::text,
        'Benefits'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'services'::text,
        'services'::text,
        'Services'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'plans'::text,
        'plans'::text,
        'Plans'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'differentials'::text,
        'differentials'::text,
        'Differentials'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'how_it_works'::text,
        'how-it-works'::text,
        'How it works'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'faq'::text,
        'faq'::text,
        'FAQ'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      ),
      (
        'final_cta'::text,
        'final-cta'::text,
        'Final CTA'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        '{}'::jsonb
      )
  ) as records(
    template_key,
    slug,
    name,
    template_family,
    template_scope,
    version,
    payload_json
  )
),

matched_templates as (
  select
    expected_records.template_key,
    expected_records.slug,
    expected_records.name,
    expected_records.template_family,
    expected_records.template_scope,
    expected_records.version,
    expected_records.payload_json,
    content_templates.id,
    content_templates.slug as actual_slug,
    content_templates.name as actual_name,
    content_templates.template_family as actual_template_family,
    content_templates.template_scope as actual_template_scope,
    content_templates.status as actual_status,
    content_templates.is_active as actual_is_active,
    content_templates.payload_json as actual_payload_json
  from expected_records
  left join public.content_templates
    on content_templates.template_key = expected_records.template_key
   and content_templates.version = expected_records.version
),

record_status as (
  select
    'record'::text as check_group,
    matched_templates.template_key as object_name,
    case
      when matched_templates.id is null then 'missing'
      when matched_templates.actual_slug <> matched_templates.slug then 'slug_mismatch'
      when matched_templates.actual_name <> matched_templates.name then 'name_mismatch'
      when matched_templates.actual_template_family <> matched_templates.template_family then 'family_mismatch'
      when matched_templates.actual_template_scope <> matched_templates.template_scope then 'scope_mismatch'
      when matched_templates.actual_status <> 'active' then 'status_mismatch'
      when matched_templates.actual_is_active is not true then 'inactive'
      when matched_templates.actual_payload_json <> matched_templates.payload_json then 'payload_mismatch'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'id',
      matched_templates.id,
      'template_key',
      matched_templates.template_key,
      'slug',
      matched_templates.actual_slug,
      'template_family',
      matched_templates.actual_template_family,
      'template_scope',
      matched_templates.actual_template_scope,
      'version',
      matched_templates.version,
      'status',
      matched_templates.actual_status,
      'is_active',
      matched_templates.actual_is_active,
      'payload_json',
      matched_templates.actual_payload_json
    ) as details
  from matched_templates
),

count_status as (
  select
    'count'::text as check_group,
    'expected_base_records'::text as object_name,
    case when count(matched_templates.id) = 9 then 'ok' else 'count_mismatch' end as check_status,
    jsonb_build_object('count', count(matched_templates.id)) as details
  from matched_templates
),

duplicate_status as (
  select
    'uniqueness'::text as check_group,
    duplicate_key as object_name,
    case when duplicate_count = 1 then 'ok' else 'duplicate' end as check_status,
    jsonb_build_object('count', duplicate_count) as details
  from (
    select
      'template_key_version:' || content_templates.template_key || ':' || content_templates.version::text as duplicate_key,
      count(*) as duplicate_count
    from public.content_templates
    where (content_templates.template_key, content_templates.version) in (
      select expected_records.template_key, expected_records.version
      from expected_records
    )
    group by content_templates.template_key, content_templates.version
    union all
    select
      'slug_version:' || content_templates.slug || ':' || content_templates.version::text as duplicate_key,
      count(*) as duplicate_count
    from public.content_templates
    where (content_templates.slug, content_templates.version) in (
      select expected_records.slug, expected_records.version
      from expected_records
    )
    group by content_templates.slug, content_templates.version
  ) duplicates
),

taxon_link_status as (
  select
    'taxon_links'::text as check_group,
    matched_templates.template_key as object_name,
    case when count(content_template_taxons.id) = 0 then 'ok' else 'unexpected_taxon_link' end as check_status,
    jsonb_build_object('count', count(content_template_taxons.id)) as details
  from matched_templates
  left join public.content_template_taxons
    on content_template_taxons.template_id = matched_templates.id
  group by matched_templates.template_key
),

rls_status as (
  select
    'rls'::text as check_group,
    'content_templates'::text as object_name,
    case when pg_class.relrowsecurity then 'ok' else 'rls_disabled' end as check_status,
    jsonb_build_object('rls_enabled', pg_class.relrowsecurity) as details
  from pg_class
  where pg_class.oid = 'public.content_templates'::regclass
),

grant_status as (
  select
    'grants'::text as check_group,
    'content_templates'::text as object_name,
    case
      when has_table_privilege('service_role', 'public.content_templates', 'SELECT')
        and not has_table_privilege('anon', 'public.content_templates', 'SELECT')
        and not has_table_privilege('authenticated', 'public.content_templates', 'SELECT')
      then 'ok'
      else 'grant_mismatch'
    end as check_status,
    jsonb_build_object(
      'service_role_select',
      has_table_privilege('service_role', 'public.content_templates', 'SELECT'),
      'anon_select',
      has_table_privilege('anon', 'public.content_templates', 'SELECT'),
      'authenticated_select',
      has_table_privilege('authenticated', 'public.content_templates', 'SELECT')
    ) as details
)

select *
from record_status
union all
select *
from count_status
union all
select *
from duplicate_status
union all
select *
from taxon_link_status
union all
select *
from rls_status
union all
select *
from grant_status
order by
  check_group,
  object_name;
