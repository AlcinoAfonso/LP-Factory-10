-- Disposable PostgreSQL 17 fixture: reproduce the hosted GraphQL lifecycle.
-- Reuse the image's managed helpers; never overwrite their ownership.
do $$
begin
  if current_setting('server_version_num')::int / 10000 <> 17
    or not exists (select 1 from pg_available_extension_versions
      where name = 'pg_graphql' and version = '1.5.11') then
    raise exception 'E23_5_INITIAL_GRAPHQL_VERSION_UNAVAILABLE';
  end if;
end;
$$;

drop extension if exists pg_graphql restrict;
create extension pg_graphql version '1.5.11' schema graphql;
grant usage on schema graphql, graphql_public to anon, authenticated, service_role;
grant execute on function graphql_public.graphql(text,text,jsonb,jsonb)
  to anon, authenticated, service_role;

create table public.e23_5_rest_probe (id integer primary key);
insert into public.e23_5_rest_probe values (1), (2);
alter table public.e23_5_rest_probe enable row level security;
create policy e23_5_probe_read on public.e23_5_rest_probe
  for select to anon, authenticated using (id = 1);
grant select on public.e23_5_rest_probe to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

do $$
begin
  if (select extversion from pg_extension where extname='pg_graphql') <> '1.5.11'
    or not has_schema_privilege('anon','graphql_public','USAGE')
    or not has_schema_privilege('authenticated','graphql_public','USAGE')
    or not has_function_privilege('anon',
      'graphql_public.graphql(text,text,jsonb,jsonb)','EXECUTE')
    or not has_function_privilege('authenticated',
      'graphql_public.graphql(text,text,jsonb,jsonb)','EXECUTE')
    or not exists (select 1 from pg_event_trigger where evtname='issue_graphql_placeholder'
      and evtenabled='O')
    or graphql_public.graphql(query => '{ __typename }')->'data' is null then
    raise exception 'E23_5_INITIAL_GRAPHQL_STATE_MISMATCH';
  end if;
end;
$$;
