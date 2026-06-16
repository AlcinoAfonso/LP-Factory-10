begin;

insert into public.content_templates (
  id,
  template_key,
  name,
  slug,
  template_family,
  template_scope,
  status,
  version,
  is_active,
  payload_json,
  notes
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'commercial_activation_page',
    'Commercial activation page',
    'commercial-activation-page',
    'commercial_activation',
    'page',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base page template for commercial_activation.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'hero',
    'Hero',
    'hero',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    'benefits',
    'Benefits',
    'benefits',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    'services',
    'Services',
    'services',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
    'plans',
    'Plans',
    'plans',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
    'differentials',
    'Differentials',
    'differentials',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6',
    'how_it_works',
    'How it works',
    'how-it-works',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7',
    'faq',
    'FAQ',
    'faq',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8',
    'final_cta',
    'Final CTA',
    'final-cta',
    'commercial_activation',
    'section',
    'active',
    1,
    true,
    '{}'::jsonb,
    'E18 Fase 2 base section module.'
  );

do $$
declare
  inserted_count integer;
begin
  with expected_records (
    id,
    template_key,
    slug,
    template_family,
    template_scope,
    version,
    status,
    is_active,
    payload_json
  ) as (
    values
      ('11111111-1111-4111-8111-111111111111'::uuid, 'commercial_activation_page', 'commercial-activation-page', 'commercial_activation', 'page', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'::uuid, 'hero', 'hero', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'::uuid, 'benefits', 'benefits', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'::uuid, 'services', 'services', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'::uuid, 'plans', 'plans', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5'::uuid, 'differentials', 'differentials', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6'::uuid, 'how_it_works', 'how-it-works', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7'::uuid, 'faq', 'faq', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8'::uuid, 'final_cta', 'final-cta', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb)
  )
  select count(*)
  into inserted_count
  from expected_records
  join public.content_templates
    on content_templates.id = expected_records.id
   and content_templates.template_key = expected_records.template_key
   and content_templates.slug = expected_records.slug
   and content_templates.template_family = expected_records.template_family
   and content_templates.template_scope = expected_records.template_scope
   and content_templates.version = expected_records.version
   and content_templates.status = expected_records.status
   and content_templates.is_active = expected_records.is_active
   and content_templates.payload_json = expected_records.payload_json;

  if inserted_count <> 9 then
    raise exception 'E18 Fase 2 base records were not fully inserted';
  end if;
end $$;

commit;
