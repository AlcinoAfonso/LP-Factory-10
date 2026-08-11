begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e1944000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e19.4.4-test@example.com',
  now(),
  now()
);

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('e1944000-0000-4000-8000-000000000011', 'E19.4.4 account one', 'e19-4-4-one', 'e19-4-4-one', 'active'),
  ('e1944000-0000-4000-8000-000000000012', 'E19.4.4 account two', 'e19-4-4-two', 'e19-4-4-two', 'active');

insert into public.account_landing_pages (id, account_id, name, slug, status, created_by)
values
  ('e1944000-0000-4000-8000-000000000021', 'e1944000-0000-4000-8000-000000000011', 'Draft one', 'draft-one', 'draft', 'e1944000-0000-4000-8000-000000000001'),
  ('e1944000-0000-4000-8000-000000000022', 'e1944000-0000-4000-8000-000000000012', 'Draft two', 'draft-two', 'draft', 'e1944000-0000-4000-8000-000000000001');

insert into public.account_landing_page_materializations (
  landing_page_id,
  account_id,
  content_json,
  generation_context_snapshot_json,
  created_by
)
values (
  'e1944000-0000-4000-8000-000000000021',
  'e1944000-0000-4000-8000-000000000011',
  '{"schemaVersion":1,"family":"landing_page"}'::jsonb,
  '{"snapshotVersion":1}'::jsonb,
  'e1944000-0000-4000-8000-000000000001'
);

do $$
begin
  begin
    insert into public.account_landing_page_materializations (
      landing_page_id, account_id, content_json, generation_context_snapshot_json, created_by
    ) values (
      'e1944000-0000-4000-8000-000000000021',
      'e1944000-0000-4000-8000-000000000011',
      '{}'::jsonb,
      '{}'::jsonb,
      'e1944000-0000-4000-8000-000000000001'
    );
    raise exception 'second materialization must collide';
  exception when unique_violation then
    null;
  end;

  begin
    insert into public.account_landing_page_materializations (
      landing_page_id, account_id, content_json, generation_context_snapshot_json, created_by
    ) values (
      'e1944000-0000-4000-8000-000000000022',
      'e1944000-0000-4000-8000-000000000011',
      '{}'::jsonb,
      '{}'::jsonb,
      'e1944000-0000-4000-8000-000000000001'
    );
    raise exception 'cross-tenant materialization must fail';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.account_landing_page_materializations (
      landing_page_id, account_id, content_json, generation_context_snapshot_json, created_by
    ) values (
      'e1944000-0000-4000-8000-000000000022',
      'e1944000-0000-4000-8000-000000000012',
      '[]'::jsonb,
      '{}'::jsonb,
      'e1944000-0000-4000-8000-000000000001'
    );
    raise exception 'non-object content must fail';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
declare
  service_privileges text[];
begin
  select coalesce(array_agg(privilege_type order by privilege_type), array[]::text[])
  into service_privileges
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'account_landing_page_materializations'
    and grantee = 'service_role';

  if service_privileges <> array['INSERT', 'SELECT']::text[] then
    raise exception 'service_role privileges differ from SELECT and INSERT: %', service_privileges;
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'account_landing_page_materializations'
      and grantee in ('PUBLIC', 'anon', 'authenticated', 'ai_readonly')
  ) then
    raise exception 'unexpected table privilege';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.account_landing_page_materializations'::regclass) then
    raise exception 'RLS must be enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'account_landing_page_materializations'
  ) then
    raise exception 'materialization table must not expose RLS policies';
  end if;
end;
$$;

rollback;
