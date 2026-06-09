-- E10.5.6.7 - leitura server-side da pesquisa usada na resolucao comercial.
-- SQL operacional validado; historico em migration 0014 e rollback correspondente.

begin;

grant select on table public.taxon_market_research to service_role;
grant select on table public.taxon_market_research_items to service_role;

commit;
