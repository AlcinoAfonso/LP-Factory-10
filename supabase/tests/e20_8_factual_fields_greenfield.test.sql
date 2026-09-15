begin;

do $$
declare
  row_count integer;
  universal_count integer;
  segment_count integer;
  niche_count integer;
  policy_count integer;
begin
  select count(*), count(*) filter (where taxon_id is null)
    into row_count, universal_count
    from public.taxon_factual_fields;
  if row_count <> 25 or universal_count <> 16 then raise exception 'unexpected E20.8 seed cardinality'; end if;
  select count(*) filter (where taxon_id = 'f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid),
         count(*) filter (where taxon_id = 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid)
    into segment_count, niche_count from public.taxon_factual_fields;
  if segment_count <> 4 or niche_count <> 5 then raise exception 'unexpected E20.8 taxon residency'; end if;
  if exists (select 1 from public.taxon_factual_fields where taxon_id is not null and taxon_id not in ('f9ba36cd-fcd9-478b-9823-c2f003cf037a'::uuid, 'c7952d16-678c-4615-9483-a003e57d94aa'::uuid)) then raise exception 'unexpected ultra or foreign residency'; end if;
  if exists (select 1 from public.taxon_factual_fields where created_by is not null or updated_by is not null) then raise exception 'bootstrap actor must be null'; end if;
  if exists (select 1 from public.taxon_factual_fields where definition ?| array['allowedPlans','version','evidence','originLayer','retiredInVersion']) then raise exception 'legacy property crossed the cutover'; end if;
  if to_regclass('public.landing_page_input_catalog_drafts') is not null then raise exception 'draft table still exists'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_taxons' and column_name = 'reviewed_input_catalog_version') then raise exception 'review marker still exists'; end if;
  select count(*) into policy_count from pg_policies where schemaname = 'public' and tablename = 'taxon_factual_fields';
  if policy_count <> 0 then raise exception 'public policies are forbidden'; end if;
  if exists (select 1 from public.openai_workload_operational_configurations where workload = 'landing_page_dynamic_market_research') then raise exception 'retired workload is still mutable'; end if;
end
$$;

do $$
declare
  invalid_definitions jsonb[] := array[
    '{"purpose":"Teste","valueType":"enum","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"enum"}}'::jsonb,
    '{"purpose":"Teste","valueType":"enum","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"enum","allowedValues":["a","a"]}}'::jsonb,
    '{"purpose":"Teste","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"type_only","extra":true}}'::jsonb,
    '{"purpose":"Teste","valueType":"string_list","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"string_list","minItems":3,"maxItems":2}}'::jsonb,
    '{"purpose":"Teste","valueType":"number_range","valueScope":"offer","expectedValueOrigin":"offer_provided","obligation":"optional","validation":{"kind":"number_range","currency":"BRL","minimum":-1,"maximum":-2}}'::jsonb,
    '{"purpose":"Teste","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"conditional","requiredWhen":{"fieldKey":"other_field","operator":"in","value":"wrong"},"validation":{"kind":"type_only"}}'::jsonb,
    '{"purpose":"Teste","valueType":null,"valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"type_only"}}'::jsonb,
    '{"purpose":"Teste","valueType":"string","valueScope":null,"expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"type_only"}}'::jsonb,
    '{"purpose":"Teste","valueType":"string","valueScope":"business","expectedValueOrigin":null,"obligation":"required","validation":{"kind":"type_only"}}'::jsonb,
    '{"purpose":"Teste","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":null,"validation":{"kind":"type_only"}}'::jsonb,
    '{"purpose":"Teste","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"conditional","requiredWhen":{"fieldKey":"other_field","operator":null,"value":["x"]},"validation":{"kind":"type_only"}}'::jsonb,
    '{"purpose":"Teste","valueType":"number_range","valueScope":"offer","expectedValueOrigin":"offer_provided","obligation":"optional","validation":{"kind":"number_range"}}'::jsonb
  ];
  invalid_definition jsonb;
  case_number integer := 0;
begin
  foreach invalid_definition in array invalid_definitions loop
    case_number := case_number + 1;
    begin
      insert into public.taxon_factual_fields(field_key, definition)
      values ('test_invalid_' || case_number, invalid_definition);
      raise exception 'invalid definition % was accepted', case_number;
    exception when check_violation then
      null;
    end;
  end loop;
end
$$;

insert into public.taxon_factual_fields(field_key, definition)
values ('test_greenfield_contract', '{"purpose":"Teste","valueType":"string","valueScope":"business","expectedValueOrigin":"business_provided","obligation":"required","validation":{"kind":"type_only"}}');

update public.taxon_factual_fields
set definition = jsonb_set(definition, '{purpose}', '"Teste atualizado"'), updated_by = null
where field_key = 'test_greenfield_contract';

do $$
begin
  if not exists (select 1 from public.taxon_factual_fields where field_key = 'test_greenfield_contract' and definition->>'purpose' = 'Teste atualizado') then raise exception 'logical update failed'; end if;
end
$$;

rollback;
