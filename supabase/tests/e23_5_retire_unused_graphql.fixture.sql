-- Disposable PostgreSQL 17 fixture: reproduce the hosted GraphQL lifecycle.
-- Managed helper definitions were inspected read-only on 05/10/2026.
do $$
begin
  if current_setting('server_version_num')::int / 10000 <> 17
    or not exists (select 1 from pg_available_extension_versions
      where name = 'pg_graphql' and version = '1.5.11') then
    raise exception 'E23_5_INITIAL_GRAPHQL_VERSION_UNAVAILABLE';
  end if;
end;
$$;
CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$function$;

CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$function$;

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
