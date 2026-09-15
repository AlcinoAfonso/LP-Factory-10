begin;

do $$
declare
  segment_ok boolean;
  niche_ok boolean;
begin
  select exists (
    select 1 from public.business_taxons
    where id = 'f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid
      and slug = 'imobiliario' and level = 'segment' and parent_id is null
  ) into segment_ok;
  select exists (
    select 1 from public.business_taxons
    where id = 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid
      and slug = 'corretor-imoveis' and level = 'niche'
      and parent_id = 'f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid
  ) into niche_ok;
  if not segment_ok or not niche_ok then
    raise exception 'E20.8_TAXON_IDENTITY_MISMATCH';
  end if;
end
$$;

create or replace function public.e20_8_factual_field_definition_is_valid(input jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  validation jsonb;
  condition jsonb;
  condition_name text;
  item jsonb;
  seen_values text[];
  minimum_value numeric;
  maximum_value numeric;
begin
  if jsonb_typeof(input) <> 'object'
    or not input ?& array['purpose','valueType','valueScope','expectedValueOrigin','obligation','validation']
    or (input - array['purpose','valueType','valueScope','expectedValueOrigin','obligation','requiredWhen','applicableWhen','validation']::text[]) <> '{}'::jsonb
    or jsonb_typeof(input->'purpose') <> 'string' or btrim(input->>'purpose') = ''
    or input->>'valueType' not in ('string','phone','email','url','enum','string_list','boolean','number_range','keyword_map','asset_reference','color_palette','offering_scope')
    or input->>'valueScope' not in ('account','business','offer','campaign','landing_page')
    or input->>'expectedValueOrigin' <> (case input->>'valueScope'
      when 'account' then 'account_provided' when 'business' then 'business_provided'
      when 'offer' then 'offer_provided' when 'campaign' then 'campaign_provided'
      when 'landing_page' then 'landing_page_provided' end)
    or input->>'obligation' not in ('required','optional','conditional')
    or ((input->>'obligation' = 'conditional') <> (input ? 'requiredWhen')) then
    return false;
  end if;

  foreach condition_name in array array['requiredWhen','applicableWhen'] loop
    if input ? condition_name then
      condition := input->condition_name;
      if jsonb_typeof(condition) <> 'object'
        or not condition ?& array['fieldKey','operator','value']
        or (condition - array['fieldKey','operator','value']::text[]) <> '{}'::jsonb
        or jsonb_typeof(condition->'fieldKey') <> 'string'
        or condition->>'fieldKey' !~ '^[a-z][a-z0-9_]*$'
        or condition->>'operator' not in ('equals','in') then
        return false;
      end if;
      if condition->>'operator' = 'equals' then
        if jsonb_typeof(condition->'value') not in ('string','boolean')
          or (jsonb_typeof(condition->'value') = 'string' and btrim(condition->>'value') = '') then
          return false;
        end if;
      else
        if jsonb_typeof(condition->'value') <> 'array' or jsonb_array_length(condition->'value') = 0 then return false; end if;
        seen_values := array[]::text[];
        for item in select value from jsonb_array_elements(condition->'value') loop
          if jsonb_typeof(item) <> 'string' or btrim(item #>> '{}') = '' then return false; end if;
        end loop;
      end if;
    end if;
  end loop;

  validation := input->'validation';
  if jsonb_typeof(validation) <> 'object' or jsonb_typeof(validation->'kind') <> 'string' then return false; end if;
  if not (case input->>'valueType'
    when 'string' then validation->>'kind' = 'type_only'
    when 'boolean' then validation->>'kind' = 'type_only'
    when 'phone' then validation->>'kind' = 'e164'
    when 'email' then validation->>'kind' = 'email'
    when 'url' then validation->>'kind' = 'https_url'
    else validation->>'kind' = input->>'valueType' end) then return false;
  end if;

  if validation->>'kind' in ('type_only','e164','email','https_url','keyword_map','asset_reference','color_palette','offering_scope') then
    return (validation - 'kind') = '{}'::jsonb;
  end if;
  if validation->>'kind' = 'enum' then
    if (validation - array['kind','allowedValues']::text[]) <> '{}'::jsonb
      or jsonb_typeof(validation->'allowedValues') <> 'array'
      or jsonb_array_length(validation->'allowedValues') = 0 then return false; end if;
  elsif validation->>'kind' = 'string_list' then
    if (validation - array['kind','allowedValues','minItems','maxItems']::text[]) <> '{}'::jsonb then return false; end if;
    if validation ? 'allowedValues' and (jsonb_typeof(validation->'allowedValues') <> 'array' or jsonb_array_length(validation->'allowedValues') = 0) then return false; end if;
    if validation ? 'minItems' and (jsonb_typeof(validation->'minItems') <> 'number' or validation->>'minItems' !~ '^[0-9]+$' or (validation->>'minItems')::numeric < 1) then return false; end if;
    if validation ? 'maxItems' and (jsonb_typeof(validation->'maxItems') <> 'number' or validation->>'maxItems' !~ '^[0-9]+$' or (validation->>'maxItems')::numeric < 1) then return false; end if;
    if validation ?& array['minItems','maxItems'] and (validation->>'minItems')::numeric > (validation->>'maxItems')::numeric then return false; end if;
    if not validation ? 'allowedValues' then return true; end if;
  elsif validation->>'kind' = 'number_range' then
    if (validation - array['kind','currency','minimum','maximum']::text[]) <> '{}'::jsonb or validation->>'currency' <> 'BRL' then return false; end if;
    if validation ? 'minimum' and (jsonb_typeof(validation->'minimum') <> 'number' or (validation->>'minimum')::numeric < 0) then return false; end if;
    if validation ? 'maximum' and (jsonb_typeof(validation->'maximum') <> 'number' or (validation->>'maximum')::numeric < 0) then return false; end if;
    minimum_value := case when validation ? 'minimum' then (validation->>'minimum')::numeric else null end;
    maximum_value := case when validation ? 'maximum' then (validation->>'maximum')::numeric else null end;
    return minimum_value is null or maximum_value is null or minimum_value <= maximum_value;
  else
    return false;
  end if;

  seen_values := array[]::text[];
  for item in select value from jsonb_array_elements(validation->'allowedValues') loop
    if jsonb_typeof(item) <> 'string' or btrim(item #>> '{}') = '' or (item #>> '{}') = any(seen_values) then return false; end if;
    seen_values := array_append(seen_values, item #>> '{}');
  end loop;
  return true;
exception when others then
  return false;
end
$$;

revoke all on function public.e20_8_factual_field_definition_is_valid(jsonb) from public, anon, authenticated, ai_readonly;
grant execute on function public.e20_8_factual_field_definition_is_valid(jsonb) to service_role;

create table public.taxon_factual_fields (
  id uuid primary key default gen_random_uuid(),
  field_key text not null unique,
  taxon_id uuid null references public.business_taxons(id) on update cascade on delete restrict,
  definition jsonb not null,
  is_active boolean not null default true,
  created_by uuid null references auth.users(id) on update cascade on delete set null,
  updated_by uuid null references auth.users(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxon_factual_fields_field_key_chk check (field_key ~ '^[a-z][a-z0-9_]*$'),
  constraint taxon_factual_fields_definition_strict_chk check (public.e20_8_factual_field_definition_is_valid(definition)),
  constraint taxon_factual_fields_definition_object_chk check (jsonb_typeof(definition) = 'object'),
  constraint taxon_factual_fields_definition_keys_chk check (
    definition ?& array['purpose','valueType','valueScope','expectedValueOrigin','obligation','validation']
    and (definition - array['purpose','valueType','valueScope','expectedValueOrigin','obligation','requiredWhen','applicableWhen','validation']::text[]) = '{}'::jsonb
  ),
  constraint taxon_factual_fields_definition_values_chk check (
    jsonb_typeof(definition->'purpose') = 'string'
    and btrim(definition->>'purpose') <> ''
    and definition->>'valueType' in ('string','phone','email','url','enum','string_list','boolean','number_range','keyword_map','asset_reference','color_palette','offering_scope')
    and definition->>'valueScope' in ('account','business','offer','campaign','landing_page')
    and definition->>'expectedValueOrigin' = case definition->>'valueScope'
      when 'account' then 'account_provided' when 'business' then 'business_provided'
      when 'offer' then 'offer_provided' when 'campaign' then 'campaign_provided'
      when 'landing_page' then 'landing_page_provided' end
    and definition->>'obligation' in ('required','optional','conditional')
    and ((definition->>'obligation' = 'conditional') = (definition ? 'requiredWhen'))
    and jsonb_typeof(definition->'validation') = 'object'
    and definition->'validation' ? 'kind'
    and definition->'validation'->>'kind' in ('type_only','enum','string_list','number_range','e164','email','https_url','keyword_map','asset_reference','color_palette','offering_scope')
  ),
  constraint taxon_factual_fields_definition_validation_chk check (
    case definition->>'valueType'
      when 'string' then definition->'validation'->>'kind' = 'type_only'
      when 'boolean' then definition->'validation'->>'kind' = 'type_only'
      when 'phone' then definition->'validation'->>'kind' = 'e164'
      when 'email' then definition->'validation'->>'kind' = 'email'
      when 'url' then definition->'validation'->>'kind' = 'https_url'
      else definition->'validation'->>'kind' = definition->>'valueType'
    end
  ),
  constraint taxon_factual_fields_definition_conditions_chk check (
    (not (definition ? 'requiredWhen') or (
      jsonb_typeof(definition->'requiredWhen') = 'object'
      and definition->'requiredWhen' ?& array['fieldKey','operator','value']
      and ((definition->'requiredWhen') - array['fieldKey','operator','value']::text[]) = '{}'::jsonb
      and definition->'requiredWhen'->>'fieldKey' ~ '^[a-z][a-z0-9_]*$'
      and definition->'requiredWhen'->>'operator' in ('equals','in')
    ))
    and (not (definition ? 'applicableWhen') or (
      jsonb_typeof(definition->'applicableWhen') = 'object'
      and definition->'applicableWhen' ?& array['fieldKey','operator','value']
      and ((definition->'applicableWhen') - array['fieldKey','operator','value']::text[]) = '{}'::jsonb
      and definition->'applicableWhen'->>'fieldKey' ~ '^[a-z][a-z0-9_]*$'
      and definition->'applicableWhen'->>'operator' in ('equals','in')
    ))
  )
);

do $$
declare
  constraint_row record;
  fingerprinted_count integer := 0;
begin
  for constraint_row in
    select oid, conname, conbin::text as predicate_tree
    from pg_constraint
    where conrelid = 'public.taxon_factual_fields'::regclass
      and conname in (
        'taxon_factual_fields_definition_object_chk',
        'taxon_factual_fields_definition_keys_chk',
        'taxon_factual_fields_definition_values_chk',
        'taxon_factual_fields_definition_validation_chk',
        'taxon_factual_fields_definition_conditions_chk'
      )
  loop
    execute format(
      'comment on constraint %I on public.taxon_factual_fields is %L',
      constraint_row.conname,
      'E20.8_CANONICAL_PREDICATE_MD5:' || md5(constraint_row.predicate_tree)
    );
    fingerprinted_count := fingerprinted_count + 1;
  end loop;
  if fingerprinted_count <> 5 then raise exception 'E20.8_CONSTRAINT_FINGERPRINT_MISMATCH'; end if;
end
$$;

create index taxon_factual_fields_taxon_id_idx on public.taxon_factual_fields (taxon_id, field_key);
create index taxon_factual_fields_created_by_idx on public.taxon_factual_fields (created_by) where created_by is not null;
create index taxon_factual_fields_updated_by_idx on public.taxon_factual_fields (updated_by) where updated_by is not null;

create trigger taxon_factual_fields_set_updated_at
before update on public.taxon_factual_fields
for each row execute function public.tg_set_updated_at();

alter table public.taxon_factual_fields enable row level security;
revoke all on table public.taxon_factual_fields from public, anon, authenticated, ai_readonly;
grant select, insert, update on table public.taxon_factual_fields to service_role;

with manifest(field_key, taxon_id, purpose, value_type, value_scope, expected_origin, obligation, required_when, applicable_when, validation) as (
  values
    ('business_display_name', null::uuid, 'Identificar factual e publicamente o negócio ou profissional atendido.', 'string', 'business', 'business_provided', 'required', null::jsonb, null::jsonb, '{"kind":"type_only"}'::jsonb),
    ('funnel_stage', null, 'Informar a intenção de funil da landing page sem confundi-la com o canal.', 'enum', 'landing_page', 'landing_page_provided', 'required', null, null, '{"kind":"enum","allowedValues":["bofu","mofu","tofu"]}'),
    ('traffic_source', null, 'Identificar a origem de tráfego separadamente da intenção da landing page.', 'enum', 'campaign', 'campaign_provided', 'optional', null, null, '{"kind":"enum","allowedValues":["paid_search","paid_social","organic","whatsapp","qr_code","other"]}'),
    ('primary_conversion_channel', null, 'Selecionar o destino operacional principal de conversão da landing page.', 'enum', 'landing_page', 'landing_page_provided', 'required', null, null, '{"kind":"enum","allowedValues":["whatsapp","form","phone","email","external_url"]}'),
    ('whatsapp_destination', null, 'Fornecer o destino E.164 quando WhatsApp for o canal principal.', 'phone', 'landing_page', 'landing_page_provided', 'conditional', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"whatsapp"}', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"whatsapp"}', '{"kind":"e164"}'),
    ('phone_destination', null, 'Fornecer o telefone E.164 quando telefone for o canal principal.', 'phone', 'landing_page', 'landing_page_provided', 'conditional', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"phone"}', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"phone"}', '{"kind":"e164"}'),
    ('email_destination', null, 'Fornecer um e-mail único quando e-mail for o canal principal.', 'email', 'landing_page', 'landing_page_provided', 'conditional', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"email"}', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"email"}', '{"kind":"email"}'),
    ('external_url_destination', null, 'Fornecer URL HTTPS quando URL externa for o canal principal.', 'url', 'landing_page', 'landing_page_provided', 'conditional', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"external_url"}', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"external_url"}', '{"kind":"https_url"}'),
    ('privacy_policy_url', null, 'Fornecer a política de privacidade HTTPS quando formulário for o canal principal.', 'url', 'business', 'business_provided', 'conditional', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"form"}', '{"fieldKey":"primary_conversion_channel","operator":"equals","value":"form"}', '{"kind":"https_url"}'),
    ('paid_search_keyword_map', null, 'Alinhar cluster de busca, contexto do anúncio e âncora factual sem produzir copy.', 'keyword_map', 'campaign', 'campaign_provided', 'optional', null, '{"fieldKey":"traffic_source","operator":"equals","value":"paid_search"}', '{"kind":"keyword_map"}'),
    ('brand_logo_asset', null, 'Referenciar de forma opaca a logo ou o asset principal da marca, quando fornecido.', 'asset_reference', 'business', 'business_provided', 'optional', null, null, '{"kind":"asset_reference"}'),
    ('brand_color_palette', null, 'Confirmar a identidade visual mínima da conta por uma paleta reutilizável com papéis de cor explícitos.', 'color_palette', 'business', 'business_provided', 'required', null, null, '{"kind":"color_palette"}'),
    ('business_offerings_summary', null, 'Resumir de forma livre e não exaustiva o que o negócio oferece; não é catálogo, whitelist ou restrição de landing_page_offering_scope.', 'string', 'business', 'business_provided', 'optional', null, null, '{"kind":"type_only"}'),
    ('primary_conversion_goal', null, 'Declarar a ação ou conversão principal pretendida pela landing page, independentemente do canal autorizado.', 'enum', 'landing_page', 'landing_page_provided', 'required', null, null, '{"kind":"enum","allowedValues":["contact","schedule","request_quote","purchase","register_interest"]}'),
    ('landing_page_offering_scope', null, 'Representar o escopo comercial informado livremente para a landing page.', 'offering_scope', 'landing_page', 'landing_page_provided', 'required', null, null, '{"kind":"offering_scope"}'),
    ('landing_page_offering_scope_description', null, 'Descrever factualmente o escopo comercial da landing page.', 'string', 'landing_page', 'landing_page_provided', 'required', null, null, '{"kind":"type_only"}'),
    ('service_locations', 'f9ba36cd-fcd9-478b-9823-c2f003cf037a', 'Declarar cidades, bairros ou regiões reais de atendimento.', 'string_list', 'business', 'business_provided', 'required', null, null, '{"kind":"string_list"}'),
    ('property_types', 'f9ba36cd-fcd9-478b-9823-c2f003cf037a', 'Declarar as tipologias reais abrangidas pela oferta.', 'string_list', 'offer', 'offer_provided', 'optional', null, null, '{"kind":"string_list"}'),
    ('property_price_range', 'f9ba36cd-fcd9-478b-9823-c2f003cf037a', 'Declarar a faixa real de preço da oferta em BRL.', 'number_range', 'offer', 'offer_provided', 'optional', null, null, '{"kind":"number_range","currency":"BRL","minimum":0}'),
    ('property_stage', 'f9ba36cd-fcd9-478b-9823-c2f003cf037a', 'Declarar o estágio real dos imóveis abrangidos pela oferta.', 'enum', 'offer', 'offer_provided', 'optional', null, null, '{"kind":"enum","allowedValues":["launch","under_construction","ready","used","mixed"]}'),
    ('transaction_intent', 'c7952d16-678c-4615-9483-a003e57d94aa', 'Declarar a intenção comercial específica da landing page do corretor.', 'enum', 'landing_page', 'landing_page_provided', 'required', null, null, '{"kind":"enum","allowedValues":["buy","sell","valuation","mixed","rent"]}'),
    ('financing_support_available', 'c7952d16-678c-4615-9483-a003e57d94aa', 'Informar se o corretor oferece apoio em financiamento.', 'boolean', 'business', 'business_provided', 'optional', null, null, '{"kind":"type_only"}'),
    ('document_support_available', 'c7952d16-678c-4615-9483-a003e57d94aa', 'Informar se o corretor oferece orientação documental.', 'boolean', 'business', 'business_provided', 'optional', null, null, '{"kind":"type_only"}'),
    ('creci_registration', 'c7952d16-678c-4615-9483-a003e57d94aa', 'Declarar a credencial CRECI a ser confirmada por fonte oficial antes do uso como prova.', 'string', 'business', 'business_provided', 'required', null, null, '{"kind":"type_only"}'),
    ('attendance_modes', 'c7952d16-678c-4615-9483-a003e57d94aa', 'Declarar modos reais de atendimento do corretor.', 'string_list', 'business', 'business_provided', 'optional', null, null, '{"kind":"string_list","allowedValues":["in_person","remote"]}')
), checked as (
  select *, count(*) over () as manifest_count, count(*) over (partition by field_key) as key_count from manifest
), inserted as (
  insert into public.taxon_factual_fields (field_key, taxon_id, definition, created_by, updated_by)
  select field_key, taxon_id,
    jsonb_strip_nulls(jsonb_build_object(
      'purpose', purpose, 'valueType', value_type, 'valueScope', value_scope,
      'expectedValueOrigin', expected_origin, 'obligation', obligation,
      'requiredWhen', required_when, 'applicableWhen', applicable_when, 'validation', validation
    )), null, null
  from checked
  where manifest_count = 25 and key_count = 1
  returning field_key
)
select count(*) from inserted;

do $$
begin
  if (select count(*) from public.taxon_factual_fields) <> 25 then
    raise exception 'E20.8_INITIAL_CARDINALITY_MISMATCH';
  end if;
end
$$;

delete from public.openai_workload_operational_configurations
where workload = 'landing_page_dynamic_market_research';

drop table public.landing_page_input_catalog_drafts;
alter table public.business_taxons drop column reviewed_input_catalog_version;

commit;
