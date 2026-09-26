-- E10.10: converge the 25/26 active E20.8 facts while preserving any
-- pre-existing inactive rows. Exactly three facts remain active.
begin;

lock table public.taxon_factual_fields in share row exclusive mode;

do $$
declare
  initial_active_count integer;
  initial_inactive_count integer;
  professional_taxon_id uuid;
  baseline_keys text[] := array[
    'business_display_name', 'funnel_stage', 'traffic_source',
    'primary_conversion_channel', 'whatsapp_destination', 'phone_destination',
    'email_destination', 'external_url_destination', 'privacy_policy_url',
    'paid_search_keyword_map', 'brand_logo_asset', 'brand_color_palette',
    'business_offerings_summary', 'primary_conversion_goal',
    'landing_page_offering_scope', 'landing_page_offering_scope_description',
    'service_locations', 'property_types', 'property_price_range',
    'property_stage', 'transaction_intent', 'financing_support_available',
    'document_support_available', 'creci_registration', 'attendance_modes'
  ];
begin
  select count(*) filter (where is_active), count(*) filter (where not is_active)
    into initial_active_count, initial_inactive_count
    from public.taxon_factual_fields;
  if initial_active_count not in (25, 26) or
     (select count(*) from public.taxon_factual_fields
       where is_active and field_key = any(baseline_keys)) <> 25 or
     (select count(*) from public.taxon_factual_fields
       where is_active and field_key <> all(baseline_keys)
         and field_key <> 'professional_regulatory_credential') <> 0 or
     (initial_active_count = 25 and exists (select 1 from public.taxon_factual_fields
       where field_key = 'professional_regulatory_credential')) or
     (initial_active_count = 26 and not exists (select 1 from public.taxon_factual_fields
       where field_key = 'professional_regulatory_credential' and is_active)) or
     (select count(*) from public.taxon_factual_fields f
       left join public.business_taxons t on t.id = f.taxon_id
       where (f.field_key = 'business_display_name' and f.is_active and f.taxon_id is null and
              f.definition->>'obligation' = 'required' and f.definition->>'valueType' = 'string')
          or (f.field_key = 'creci_registration' and f.is_active and t.slug = 'corretor-imoveis' and t.level = 'niche' and
              f.definition->>'obligation' = 'required' and f.definition->>'valueType' = 'string')) <> 2
  then
    raise exception 'E10_10_FACTUAL_CATALOG_PRECONDITION_FAILED';
  end if;

  if not exists (select 1 from public.taxon_factual_fields where field_key = 'professional_regulatory_credential') then
    select id into professional_taxon_id from public.business_taxons
    where slug = 'servicos-profissionais' and level = 'segment';
    if professional_taxon_id is null then
      raise exception 'E10_10_PROFESSIONAL_TAXON_MISSING';
    end if;
    insert into public.taxon_factual_fields (field_key, taxon_id, definition)
    values ('professional_regulatory_credential', professional_taxon_id,
      '{"purpose":"Dados da licença ou credencial aplicável, incluindo órgão emissor, jurisdição e situação verificável.","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"optional","validation":{"kind":"type_only"}}'::jsonb);
  end if;

  if (select count(*) from public.taxon_factual_fields) <> initial_inactive_count + 26 or
     (select count(*) from public.taxon_factual_fields f
       join public.business_taxons t on t.id = f.taxon_id
       where f.field_key = 'professional_regulatory_credential'
         and f.is_active
         and t.slug = 'servicos-profissionais' and t.level = 'segment'
         and f.definition->>'obligation' = 'optional' and f.definition->>'valueType' = 'string') <> 1
  then
    raise exception 'E10_10_FACTUAL_CATALOG_PRECONDITION_FAILED';
  end if;

  update public.taxon_factual_fields
  set is_active = false
  where is_active and field_key not in ('business_display_name', 'creci_registration', 'professional_regulatory_credential');

  update public.taxon_factual_fields
  set definition = jsonb_set(definition, '{obligation}', '"optional"'::jsonb)
  where field_key = 'creci_registration' and is_active;

  if (select count(*) from public.taxon_factual_fields) <> initial_inactive_count + 26 or
     (select count(*) from public.taxon_factual_fields where is_active) <> 3 or
     (select count(*) from public.taxon_factual_fields where not is_active) <> initial_inactive_count + 23 or
     exists (select 1 from public.taxon_factual_fields
       where is_active and (definition ? 'requiredWhen' or definition ? 'applicableWhen')) or
     exists (select 1 from public.taxon_factual_fields
       where field_key = 'business_display_name' and definition->>'obligation' <> 'required') or
     exists (select 1 from public.taxon_factual_fields
       where field_key in ('creci_registration', 'professional_regulatory_credential') and definition->>'obligation' <> 'optional')
  then
    raise exception 'E10_10_FACTUAL_CATALOG_POSTCONDITION_FAILED';
  end if;
end
$$;

commit;
