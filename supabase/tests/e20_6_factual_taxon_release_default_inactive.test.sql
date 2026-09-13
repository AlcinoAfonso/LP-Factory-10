begin;
set local search_path = public, pg_catalog;

do $$
declare
  v_default text;
begin
  select pg_get_expr(attribute_default.adbin, attribute_default.adrelid)
    into v_default
  from pg_attribute attribute
  join pg_attrdef attribute_default
    on attribute_default.adrelid = attribute.attrelid
   and attribute_default.adnum = attribute.attnum
  where attribute.attrelid = 'public.business_taxons'::regclass
    and attribute.attname = 'is_active'
    and not attribute.attisdropped;

  if v_default is distinct from 'false'::text then
    raise exception 'E20.6 business_taxons.is_active default drifted: %', v_default;
  end if;
end;
$$;

insert into public.business_taxons (id, level, name, slug, is_active)
values
  ('e2060000-0000-4000-8000-000000000001', 'segment', 'E20.6 historical active', 'e20-6-historical-active', true),
  ('e2060000-0000-4000-8000-000000000002', 'segment', 'E20.6 historical inactive', 'e20-6-historical-inactive', false);

alter table public.business_taxons
  alter column is_active set default false;

insert into public.business_taxons (id, level, name, slug)
values (
  'e2060000-0000-4000-8000-000000000003',
  'segment',
  'E20.6 default inactive',
  'e20-6-default-inactive'
);

do $$
begin
  if (select is_active from public.business_taxons where id = 'e2060000-0000-4000-8000-000000000001') is distinct from true then
    raise exception 'E20.6 default migration changed a preexisting active taxon';
  end if;

  if (select is_active from public.business_taxons where id = 'e2060000-0000-4000-8000-000000000002') is distinct from false then
    raise exception 'E20.6 default migration changed a preexisting inactive taxon';
  end if;

  if (select is_active from public.business_taxons where id = 'e2060000-0000-4000-8000-000000000003') is distinct from false then
    raise exception 'E20.6 new taxon without explicit activity must start inactive';
  end if;
end;
$$;

rollback;
