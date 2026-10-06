-- PB 18B.2 / E23.5: retire only the unused GraphQL capability.
-- RESTRICT rejects an unexpected consumer; never cascade into product objects.
begin;
set local lock_timeout = '5s';

drop extension if exists pg_graphql restrict;

-- Preserve Supabase-managed schemas, grants, helpers and disabled placeholder.
-- The resolver is removed; REST/public, Auth and their ACLs are unchanged.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_graphql')
    or to_regprocedure('graphql.resolve(text,jsonb,text,jsonb)') is not null then
    raise exception 'E23_5_GRAPHQL_RETIREMENT_INCOMPLETE';
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
