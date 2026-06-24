begin;

create or replace function public.ensure_commercial_activation_composition(
  p_taxon_id uuid
)
returns public.content_template_compositions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_taxon public.business_taxons%rowtype;
  v_page_template_id uuid;
  v_composition public.content_template_compositions%rowtype;
  v_research_count integer;
  v_module_count integer;
  v_item_count integer;
  v_variant_count integer;
begin
  select *
    into v_taxon
  from public.business_taxons
  where id = p_taxon_id
    and is_active = true;

  if v_taxon.id is null then
    raise exception 'commercial_activation_taxon_not_active';
  end if;

  with required_blocks(block) as (
    values
      ('strategic_core'::text),
      ('lp_overview'::text),
      ('lp_sections'::text),
      ('seo'::text)
  ),
  required_audiences(audience_scope) as (
    values
      ('business_buyer'::text),
      ('end_customer'::text)
  ),
  required_pairs as (
    select
      required_audiences.audience_scope,
      required_blocks.block
    from required_audiences
    cross join required_blocks
  ),
  eligible_research as (
    select
      research.audience_scope,
      research.research_block,
      count(items.id) filter (where items.is_active = true) as active_items
    from public.taxon_market_research research
    left join public.taxon_market_research_items items
      on items.research_id = research.id
    where research.taxon_id = p_taxon_id
      and research.status = 'active'
      and research.version = 1
      and research.audience_scope in ('business_buyer', 'end_customer')
      and research.research_block in ('strategic_core', 'lp_overview', 'lp_sections', 'seo')
    group by research.audience_scope, research.research_block
  )
  select count(*)
    into v_research_count
  from required_pairs
  join eligible_research
    on eligible_research.audience_scope = required_pairs.audience_scope
   and eligible_research.research_block = required_pairs.block
   and eligible_research.active_items > 0;

  if v_research_count <> 8 then
    raise exception 'commercial_activation_research_incomplete';
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
    raise exception 'commercial_activation_page_template_missing';
  end if;

  select *
    into v_composition
  from public.content_template_compositions
  where template_id = v_page_template_id
    and taxon_id = p_taxon_id
    and status = 'active'
  order by version desc, created_at asc, id asc
  limit 1;

  if v_composition.id is not null then
    return v_composition;
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
    raise exception 'commercial_activation_section_modules_missing';
  end if;

  update public.content_template_taxons
  set resolution_level = v_taxon.level,
      priority = greatest(priority, 100),
      is_primary = true,
      is_active = true
  where template_id = v_page_template_id
    and taxon_id = p_taxon_id;

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
      p_taxon_id,
      v_taxon.level,
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
    p_taxon_id,
    1,
    'active'
  )
  on conflict on constraint content_template_compositions_identity_uidx
  do update
  set status = excluded.status
  returning * into v_composition;

  if v_composition.id is null then
    raise exception 'commercial_activation_composition_materialization_failed';
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
    v_composition.id,
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
  where composition_id = v_composition.id;

  if v_item_count <> 8 or v_variant_count <> 8 then
    raise exception 'commercial_activation_composition_items_invalid';
  end if;

  return v_composition;
end;
$$;

revoke all on function public.ensure_commercial_activation_composition(uuid) from public;
revoke all on function public.ensure_commercial_activation_composition(uuid) from anon;
revoke all on function public.ensure_commercial_activation_composition(uuid) from authenticated;
grant execute on function public.ensure_commercial_activation_composition(uuid) to service_role;

commit;
