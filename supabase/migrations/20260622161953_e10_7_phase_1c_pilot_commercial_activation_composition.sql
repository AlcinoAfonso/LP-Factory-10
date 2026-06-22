begin;

do $$
declare
  v_taxon_id uuid;
  v_taxon_level text;
  v_page_template_id uuid;
  v_composition_id uuid;
  v_module_count integer;
  v_item_count integer;
  v_variant_count integer;
begin
  select id, level
    into v_taxon_id, v_taxon_level
  from public.business_taxons
  where slug = 'corretor-de-imoveis-de-medio-padrao'
    and is_active = true;

  if v_taxon_id is null then
    raise exception 'E10.7 Fase 1C: active pilot taxon not found';
  end if;

  select id
    into v_page_template_id
  from public.content_templates
  where template_key = 'commercial_activation_page'
    and template_family = 'commercial_activation'
    and template_scope = 'page'
    and version = 1
    and status = 'active'
    and is_active = true;

  if v_page_template_id is null then
    raise exception 'E10.7 Fase 1C: active commercial_activation page template version 1 not found';
  end if;

  with expected_modules(template_key, variant_key, sort_order) as (
    values
      ('hero', 'hero.default', 10),
      ('benefits', 'benefits.cards', 20),
      ('services', 'services.list', 30),
      ('plans', 'plans.cards', 40),
      ('differentials', 'differentials.cards', 50),
      ('how_it_works', 'how_it_works.steps', 60),
      ('faq', 'faq.accordion', 70),
      ('final_cta', 'final_cta.simple', 80)
  )
  select count(*)
    into v_module_count
  from expected_modules
  join public.content_templates module_template
    on module_template.template_key = expected_modules.template_key
   and module_template.template_family = 'commercial_activation'
   and module_template.template_scope = 'section'
   and module_template.version = 1
   and module_template.status = 'active'
   and module_template.is_active = true;

  if v_module_count <> 8 then
    raise exception 'E10.7 Fase 1C: expected 8 active commercial_activation section modules, found %', v_module_count;
  end if;

  update public.content_template_taxons
  set resolution_level = v_taxon_level,
      priority = greatest(priority, 100),
      is_primary = true,
      is_active = true
  where template_id = v_page_template_id
    and taxon_id = v_taxon_id;

  if not found then
    insert into public.content_template_taxons (
      template_id,
      taxon_id,
      resolution_level,
      priority,
      is_primary,
      is_active
    )
    values (
      v_page_template_id,
      v_taxon_id,
      v_taxon_level,
      100,
      true,
      true
    );
  end if;

  insert into public.content_template_compositions (
    template_id,
    taxon_id,
    version,
    status
  )
  values (
    v_page_template_id,
    v_taxon_id,
    1,
    'active'
  )
  on conflict on constraint content_template_compositions_identity_uidx
  do update
  set status = excluded.status
  returning id into v_composition_id;

  if v_composition_id is null then
    select id
      into v_composition_id
    from public.content_template_compositions
    where template_id = v_page_template_id
      and taxon_id = v_taxon_id
      and version = 1
      and status = 'active';
  end if;

  if v_composition_id is null then
    raise exception 'E10.7 Fase 1C: commercial_activation composition version 1 could not be created';
  end if;

  with expected_modules(template_key, variant_key, sort_order) as (
    values
      ('hero', 'hero.default', 10),
      ('benefits', 'benefits.cards', 20),
      ('services', 'services.list', 30),
      ('plans', 'plans.cards', 40),
      ('differentials', 'differentials.cards', 50),
      ('how_it_works', 'how_it_works.steps', 60),
      ('faq', 'faq.accordion', 70),
      ('final_cta', 'final_cta.simple', 80)
  ),
  resolved_modules as (
    select
      module_template.id as module_template_id,
      expected_modules.variant_key,
      expected_modules.sort_order
    from expected_modules
    join public.content_templates module_template
      on module_template.template_key = expected_modules.template_key
     and module_template.template_family = 'commercial_activation'
     and module_template.template_scope = 'section'
     and module_template.version = 1
     and module_template.status = 'active'
     and module_template.is_active = true
  )
  insert into public.content_template_composition_items (
    composition_id,
    module_template_id,
    variant_key,
    sort_order,
    is_required,
    config_json
  )
  select
    v_composition_id,
    resolved_modules.module_template_id,
    resolved_modules.variant_key,
    resolved_modules.sort_order,
    true,
    '{}'::jsonb
  from resolved_modules
  on conflict on constraint content_template_composition_items_order_uidx
  do update
  set module_template_id = excluded.module_template_id,
      variant_key = excluded.variant_key,
      is_required = true,
      config_json = '{}'::jsonb;

  select count(*),
         count(distinct variant_key)
    into v_item_count, v_variant_count
  from public.content_template_composition_items
  where composition_id = v_composition_id;

  if v_item_count <> 8 or v_variant_count <> 8 then
    raise exception 'E10.7 Fase 1C: expected 8 composition items and 8 variants, found % items and % variants',
      v_item_count,
      v_variant_count;
  end if;
end $$;

commit;
