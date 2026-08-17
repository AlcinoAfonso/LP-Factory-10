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
  ('e1944000-0000-4000-8000-000000000021', 'e1944000-0000-4000-8000-000000000011', 'Historical draft', 'historical-draft', 'draft', 'e1944000-0000-4000-8000-000000000001'),
  ('e1944000-0000-4000-8000-000000000022', 'e1944000-0000-4000-8000-000000000011', 'Revision draft', 'revision-draft', 'draft', 'e1944000-0000-4000-8000-000000000001'),
  ('e1944000-0000-4000-8000-000000000023', 'e1944000-0000-4000-8000-000000000012', 'Other tenant draft', 'other-tenant-draft', 'draft', 'e1944000-0000-4000-8000-000000000001');

insert into public.account_landing_page_materializations (
  account_id,
  landing_page_id,
  revision_number,
  attempt_id,
  content_json,
  generation_context_snapshot_json,
  created_by
)
values (
  'e1944000-0000-4000-8000-000000000011',
  'e1944000-0000-4000-8000-000000000021',
  1,
  null,
  '{"contractVersion":1,"historical":true}'::jsonb,
  '{"snapshotVersion":1,"historical":true}'::jsonb,
  'e1944000-0000-4000-8000-000000000001'
);

select *
from public.append_account_landing_page_materialization_v1(
  'e1944000-0000-4000-8000-000000000011',
  'e1944000-0000-4000-8000-000000000022',
  'e1944000-0000-4000-8000-000000000031',
  '{"contractVersion":1,"marker":"first"}'::jsonb,
  '{"snapshotVersion":1,"marker":"first"}'::jsonb,
  'e1944000-0000-4000-8000-000000000001'
);

select *
from public.append_account_landing_page_materialization_v1(
  'e1944000-0000-4000-8000-000000000011',
  'e1944000-0000-4000-8000-000000000022',
  'e1944000-0000-4000-8000-000000000032',
  '{"contractVersion":1,"marker":"second"}'::jsonb,
  '{"snapshotVersion":1,"marker":"second"}'::jsonb,
  'e1944000-0000-4000-8000-000000000001'
);

do $$
declare
  v_duplicate_id uuid;
  v_duplicate_revision bigint;
  v_service_privileges text[];
begin
  select materialization_id, revision_number
  into v_duplicate_id, v_duplicate_revision
  from public.append_account_landing_page_materialization_v1(
    'e1944000-0000-4000-8000-000000000011',
    'e1944000-0000-4000-8000-000000000022',
    'e1944000-0000-4000-8000-000000000031',
    '{"contractVersion":1,"marker":"must-not-overwrite"}'::jsonb,
    '{"snapshotVersion":1,"marker":"must-not-overwrite"}'::jsonb,
    'e1944000-0000-4000-8000-000000000001'
  );

  if v_duplicate_revision <> 1 then
    raise exception 'repeated attempt must return original revision';
  end if;

  if (
    select count(*)
    from public.account_landing_page_materializations
    where landing_page_id = 'e1944000-0000-4000-8000-000000000022'
  ) <> 2 then
    raise exception 'two appends must create exactly two revisions';
  end if;

  if (
    select content_json ->> 'marker'
    from public.account_landing_page_materializations
    where landing_page_id = 'e1944000-0000-4000-8000-000000000022'
      and revision_number = 1
  ) <> 'first' then
    raise exception 'first revision was overwritten';
  end if;

  if (
    select content_json ->> 'marker'
    from public.account_landing_page_materializations
    where landing_page_id = 'e1944000-0000-4000-8000-000000000022'
    order by revision_number desc
    limit 1
  ) <> 'second' then
    raise exception 'current revision must be the greatest revision_number';
  end if;

  if exists (
    select 1
    from public.account_landing_page_materializations
    where attempt_id is null
      and revision_number <> 1
  ) then
    raise exception 'historical rows must remain revision 1';
  end if;

  begin
    perform *
    from public.append_account_landing_page_materialization_v1(
      'e1944000-0000-4000-8000-000000000012',
      'e1944000-0000-4000-8000-000000000022',
      'e1944000-0000-4000-8000-000000000033',
      '{}'::jsonb,
      '{}'::jsonb,
      'e1944000-0000-4000-8000-000000000001'
    );
    raise exception 'cross-tenant append must fail';
  exception when sqlstate 'P0001' then
    null;
  end;

  if exists (
    select 1
    from public.account_landing_page_materializations
    where attempt_id = 'e1944000-0000-4000-8000-000000000033'
  ) then
    raise exception 'failed append must not create a revision';
  end if;

  select coalesce(array_agg(privilege_type order by privilege_type), array[]::text[])
  into v_service_privileges
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'account_landing_page_materializations'
    and grantee = 'service_role';

  if v_service_privileges <> array['SELECT']::text[] then
    raise exception 'service_role table privileges must be SELECT only: %', v_service_privileges;
  end if;

  if not has_function_privilege(
    'service_role',
    'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
    'EXECUTE'
  ) then
    raise exception 'service_role must execute append function';
  end if;

  if not coalesce(
    (public.e19_4_landing_page_revision_readiness() ->> 'ready')::boolean,
    false
  ) then
    raise exception 'readiness probe must approve the complete local contract';
  end if;

  if exists (
    select 1
    from information_schema.role_routine_grants
    where specific_schema = 'public'
      and routine_name in (
        'append_account_landing_page_materialization_v1',
        'e19_4_landing_page_revision_readiness'
      )
      and lower(grantee) in ('public', 'anon', 'authenticated', 'ai_readonly')
  ) then
    raise exception 'unprivileged role must not execute E19.4.4 functions';
  end if;

  if not (
    select bucket.public = false
      and bucket.file_size_limit = 5242880
      and bucket.allowed_mime_types = array['image/webp']::text[]
    from storage.buckets bucket
    where bucket.id = 'landing-page-revision-assets'
  ) then
    raise exception 'private Storage bucket configuration mismatch';
  end if;

  if exists (
    select 1
    from pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and (
        coalesce(policy.qual, '') ilike '%landing-page-revision-assets%'
        or coalesce(policy.with_check, '') ilike '%landing-page-revision-assets%'
      )
  ) then
    raise exception 'revision bucket must not expose direct object policies';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.account_landing_page_materializations'::regclass) then
    raise exception 'RLS must remain enabled';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'account_landing_page_materializations'
  ) then
    raise exception 'materialization table must not expose RLS policies';
  end if;
end;
$$;

rollback;
