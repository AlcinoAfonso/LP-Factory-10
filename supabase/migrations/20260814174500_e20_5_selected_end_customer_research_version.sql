alter table public.business_taxons
  add column selected_end_customer_research_version integer null;

alter table public.business_taxons
  add constraint business_taxons_selected_end_customer_research_version_chk
  check (
    selected_end_customer_research_version is null
    or selected_end_customer_research_version > 0
  );

grant update (selected_end_customer_research_version)
  on table public.business_taxons
  to service_role;

comment on column public.business_taxons.selected_end_customer_research_version is
  'Versao integral end_customer explicitamente selecionada por decisao humana autorizada.';
