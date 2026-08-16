alter table public.business_taxons
  add column reviewed_input_catalog_version integer null;

alter table public.business_taxons
  add constraint business_taxons_reviewed_input_catalog_version_chk
  check (
    reviewed_input_catalog_version is null
    or reviewed_input_catalog_version > 0
  );

revoke update
  on table public.business_taxons
  from service_role;

grant update (
  is_active,
  name,
  reviewed_input_catalog_version,
  selected_end_customer_research_version,
  slug
)
  on table public.business_taxons
  to service_role;

comment on column public.business_taxons.reviewed_input_catalog_version is
  'Versao executavel do catalogo E20.2 avaliada como suficiente por decisao humana.';
