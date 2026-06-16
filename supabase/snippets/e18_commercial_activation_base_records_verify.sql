-- e18_commercial_activation_base_records_verify.sql
-- Objetivo: verificar os 9 registros-base da E18 Fase 2 para commercial_activation.
-- Tipo: read-only / execucao manual no Supabase SQL Editor.
-- Escopo: registros em content_templates, unicidade, status, familia, escopo, RLS e grants.

with expected_records as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        'commercial_activation_page'::text,
        'commercial-activation-page'::text,
        'Commercial activation page'::text,
        'commercial_activation'::text,
        'page'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'::uuid,
        'hero'::text,
        'hero'::text,
        'Hero'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'::uuid,
        'benefits'::text,
        'benefits'::text,
        'Benefits'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'::uuid,
        'services'::text,
        'services'::text,
        'Services'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'::uuid,
        'plans'::text,
        'plans'::text,
        'Plans'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5'::uuid,
        'differentials'::text,
        'differentials'::text,
        'Differentials'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6'::uuid,
        'how_it_works'::text,
        'how-it-works'::text,
        'How it works'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7'::uuid,
        'faq'::text,
        'faq'::text,
        'FAQ'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8'::uuid,
        'final_cta'::text,
        'final-cta'::text,
        'Final CTA'::text,
        'commercial_activation'::text,
        'section'::text,
        1::integer,
        true::boolean
      )
  ) as records(
    id,
    template_key,
    slug,
    name,
    template_family,
    template_scope,
    version,
    expect_empty_payload
  )
),

record_status as (
  select
    'record'::text as check_group,
    expected_records.template_key as object_name,
    case
      when content_templates.id is null then 'missing'
      when content_templates.id <> expected_records.id then 'id_mismatch'
      when content_templates.slug <> expected_records.slug then 'slug_mismatch'
      when content_templates.name <> expected_records.name then 'name_mismatch'
      when content_templates.template_family <> expected_records.template_family then 'family_mismatch'
      when content_templates.template_scope <> expected_records.template_scope then 'scope_mismatch'
      when content_templates.version <> expected_records.version then 'version_mismatch'
      when content_templates.status <> 'active' then 'status_mismatch'
      when content_templates.is_active is not true then 'inactive'
      when expected_records.expect_empty_payload
        and content_templates.payload_json <> '{}'::jsonb then 'payload_not_empty'
      when jsonb_typeof(content_templates.payload_json) <> 'object' then 'payload_not_object'
      else 'ok'
    end as check_status,
    jsonb_build_object(
      'id',
      content_templates.id,
      'template_key',
      content_templates.template_key,
      'slug',
      content_templates.slug,
      'template_family',
      content_templates.template_family,
      'template_scope',
      content_templates.template_scope,
      'version',
      content_templates.version,
      'status',
      content_templates.status,
      'is_active',
      content_templates.is_active,
      'payload_json',
      content_templates.payload_json
    ) as details
  from expected_records
  left join public.content_templates
    on content_templates.template_key = expected_records.template_key
   and content_templates.version = expected_records.version
),

count_status as (
  select
    'count'::text as check_group,
    'expected_base_records'::text as object_name,
    case when count(content_templates.id) = 9 then 'ok' else 'count_mismatch' end as check_status,
    jsonb_build_object('count', count(content_templates.id)) as details
  from expected_records
  left join public.content_templates
    on content_templates.template_key = expected_records.template_key
   and content_templates.version = expected_records.version
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
from rls_status
union all
select *
from grant_status
order by
  check_group,
  object_name;
