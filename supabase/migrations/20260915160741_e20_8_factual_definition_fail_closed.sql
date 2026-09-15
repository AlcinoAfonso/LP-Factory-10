begin;

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
    or jsonb_typeof(input->'valueType') <> 'string'
    or input->>'valueType' not in ('string','phone','email','url','enum','string_list','boolean','number_range','keyword_map','asset_reference','color_palette','offering_scope')
    or jsonb_typeof(input->'valueScope') <> 'string'
    or input->>'valueScope' not in ('account','business','offer','campaign','landing_page')
    or jsonb_typeof(input->'expectedValueOrigin') <> 'string'
    or input->>'expectedValueOrigin' <> (case input->>'valueScope'
      when 'account' then 'account_provided' when 'business' then 'business_provided'
      when 'offer' then 'offer_provided' when 'campaign' then 'campaign_provided'
      when 'landing_page' then 'landing_page_provided' end)
    or jsonb_typeof(input->'obligation') <> 'string'
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
        or jsonb_typeof(condition->'operator') <> 'string'
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
        for item in select value from jsonb_array_elements(condition->'value') loop
          if jsonb_typeof(item) <> 'string' or btrim(item #>> '{}') = '' then return false; end if;
        end loop;
      end if;
    end if;
  end loop;

  validation := input->'validation';
  if jsonb_typeof(validation) <> 'object'
    or not validation ? 'kind'
    or jsonb_typeof(validation->'kind') <> 'string' then return false; end if;
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
      or not validation ? 'allowedValues'
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
    if (validation - array['kind','currency','minimum','maximum']::text[]) <> '{}'::jsonb
      or not validation ? 'currency'
      or jsonb_typeof(validation->'currency') <> 'string'
      or validation->>'currency' <> 'BRL' then return false; end if;
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

commit;
