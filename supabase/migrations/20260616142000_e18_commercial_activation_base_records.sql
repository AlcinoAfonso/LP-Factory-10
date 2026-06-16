begin;

insert into public.content_templates (
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
      ('commercial_activation_page', 'commercial-activation-page', 'commercial_activation', 'page', 1, 'active', true, '{}'::jsonb),
      ('hero', 'hero', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('benefits', 'benefits', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('services', 'services', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('plans', 'plans', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('differentials', 'differentials', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('how_it_works', 'how-it-works', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('faq', 'faq', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb),
      ('final_cta', 'final-cta', 'commercial_activation', 'section', 1, 'active', true, '{}'::jsonb)
  )
  select count(*)
  into inserted_count
  from expected_records
  join public.content_templates
    on content_templates.template_key = expected_records.template_key
   and content_templates.version = expected_records.version
   and content_templates.slug = expected_records.slug
   and content_templates.template_family = expected_records.template_family
   and content_templates.template_scope = expected_records.template_scope
   and content_templates.status = expected_records.status
   and content_templates.is_active = expected_records.is_active
   and content_templates.payload_json = expected_records.payload_json;

  if inserted_count <> 9 then
    raise exception 'E18 Fase 2 base records were not fully inserted';
  end if;
end $$;

commit;
