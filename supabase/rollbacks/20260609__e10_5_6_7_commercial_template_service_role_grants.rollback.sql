-- E10.5.6.7 - rollback of the server-side research read grants.

begin;

revoke select on table public.taxon_market_research from service_role;
revoke select on table public.taxon_market_research_items from service_role;

commit;
