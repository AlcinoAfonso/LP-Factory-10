begin;

do $$
declare
  row_count integer;
  universal_count integer;
  policy_count integer;
begin
  select count(*), count(*) filter (where taxon_id is null)
    into row_count, universal_count
    from public.taxon_factual_fields;
  if row_count <> 25 or universal_count <> 16 then raise exception 'unexpected E20.8 seed cardinality'; end if;
  if exists (select 1 from public.taxon_factual_fields where created_by is not null or updated_by is not null) then raise exception 'bootstrap actor must be null'; end if;
  if exists (select 1 from public.taxon_factual_fields where definition ?| array['allowedPlans','version','evidence','originLayer','retiredInVersion']) then raise exception 'legacy property crossed the cutover'; end if;
  if to_regclass('public.landing_page_input_catalog_drafts') is not null then raise exception 'draft table still exists'; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'business_taxons' and column_name = 'reviewed_input_catalog_version') then raise exception 'review marker still exists'; end if;
  select count(*) into policy_count from pg_policies where schemaname = 'public' and tablename = 'taxon_factual_fields';
  if policy_count <> 0 then raise exception 'public policies are forbidden'; end if;
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
