begin;
do $$
begin
  if exists(select 1 from pg_extension where extname='pg_graphql')
    or to_regprocedure('graphql.resolve(text,jsonb,text,jsonb)') is not null
    or graphql_public.graphql(query => '{ __typename }')->'data' is not null
    or graphql_public.graphql(query => '{ __typename }')->'errors' is null then
    raise exception 'E23_5_GRAPHQL_STILL_FUNCTIONAL';
  end if;
  if not exists(select 1 from pg_event_trigger where evtname='issue_graphql_placeholder' and evtenabled='O')
    or not exists(select 1 from pg_event_trigger where evtname='issue_pg_graphql_access' and evtenabled='O') then
    raise exception 'E23_5_MANAGED_HELPER_REMOVED';
  end if;
end;
$$;

set local role anon;
do $$
begin
  if (select count(*) from public.e23_5_rest_probe) <> 1 then
    raise exception 'E23_5_ANON_REST_RLS_REGRESSION';
  end if;
  if graphql_public.graphql(query => '{ __typename }') is distinct from
    '{"errors":[{"message":"pg_graphql extension is not enabled."}]}'::jsonb then
    raise exception 'E23_5_ANON_GRAPHQL_STILL_FUNCTIONAL';
  end if;
end;
$$;
reset role;

set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$
begin
  if (select count(*) from public.e23_5_rest_probe) <> 1
    or auth.uid() is distinct from '00000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'E23_5_AUTH_REST_RLS_REGRESSION';
  end if;
  if graphql_public.graphql(query => '{ __typename }') is distinct from
    '{"errors":[{"message":"pg_graphql extension is not enabled."}]}'::jsonb then
    raise exception 'E23_5_AUTHENTICATED_GRAPHQL_STILL_FUNCTIONAL';
  end if;
end;
$$;
reset role;

set local role service_role;
do $$
begin
  if (select count(*) from public.e23_5_rest_probe) <> 2 then
    raise exception 'E23_5_SERVICE_REST_REGRESSION';
  end if;
  if graphql_public.graphql(query => '{ __typename }') is distinct from
    '{"errors":[{"message":"pg_graphql extension is not enabled."}]}'::jsonb then
    raise exception 'E23_5_SERVICE_GRAPHQL_STILL_FUNCTIONAL';
  end if;
end;
$$;
reset role;
rollback;
