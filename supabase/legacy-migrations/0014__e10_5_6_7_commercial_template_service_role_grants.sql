-- E10.5.6.7 - historical record of the validated server-side read grants.

begin;

grant select on table public.taxon_market_research to service_role;
grant select on table public.taxon_market_research_items to service_role;

commit;
