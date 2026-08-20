begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e1950000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e19.5-expand-test@example.com',
  now(),
  now()
);

insert into public.accounts (id, name, subdomain, slug, status)
values (
  'e1950000-0000-4000-8000-000000000011',
  'E19.5 expand account',
  'e19-5-expand',
  'e19-5-expand',
  'active'
);

insert into public.account_landing_pages (
  id,
  account_id,
  name,
  slug,
  status,
  created_by
)
values
  (
    'e1950000-0000-4000-8000-000000000021',
    'e1950000-0000-4000-8000-000000000011',
    'Draft preservado',
    'draft-preservado',
    'draft',
    'e1950000-0000-4000-8000-000000000001'
  ),
  (
    'e1950000-0000-4000-8000-000000000022',
    'e1950000-0000-4000-8000-000000000011',
    'Active tolerado',
    'active-tolerado',
    'active',
    'e1950000-0000-4000-8000-000000000001'
  ),
  (
    'e1950000-0000-4000-8000-000000000023',
    'e1950000-0000-4000-8000-000000000011',
    'Archived bloqueado',
    'archived-bloqueado',
    'archived',
    'e1950000-0000-4000-8000-000000000001'
  );

insert into public.account_landing_pages (
  id,
  account_id,
  name,
  slug,
  created_by
)
values (
  'e1950000-0000-4000-8000-000000000024',
  'e1950000-0000-4000-8000-000000000011',
  'Default draft',
  'default-draft',
  'e1950000-0000-4000-8000-000000000001'
);

select *
from public.append_account_landing_page_materialization_v1(
  'e1950000-0000-4000-8000-000000000011',
  'e1950000-0000-4000-8000-000000000021',
  'e1950000-0000-4000-8000-000000000031',
  '{"contractVersion":1,"status":"draft"}'::jsonb,
  '{"snapshotVersion":1,"status":"draft"}'::jsonb,
  'e1950000-0000-4000-8000-000000000001'
);

select *
from public.append_account_landing_page_materialization_v1(
  'e1950000-0000-4000-8000-000000000011',
  'e1950000-0000-4000-8000-000000000022',
  'e1950000-0000-4000-8000-000000000032',
  '{"contractVersion":1,"status":"active"}'::jsonb,
  '{"snapshotVersion":1,"status":"active"}'::jsonb,
  'e1950000-0000-4000-8000-000000000001'
);

do $$
declare
  v_constraint text;
  v_default text;
  v_function text;
begin
  select pg_get_constraintdef(constraint_row.oid)
  into v_constraint
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.account_landing_pages'::regclass
    and constraint_row.conname = 'account_landing_pages_status_chk';

  if v_constraint is null
     or v_constraint not ilike '%draft%'
     or v_constraint not ilike '%active%'
     or v_constraint not ilike '%archived%' then
    raise exception 'status check must tolerate draft, active and archived: %', v_constraint;
  end if;

  select pg_get_expr(attribute.adbin, attribute.adrelid)
  into v_default
  from pg_attrdef attribute
  join pg_attribute column_row
    on column_row.attrelid = attribute.adrelid
    and column_row.attnum = attribute.adnum
  where attribute.adrelid = 'public.account_landing_pages'::regclass
    and column_row.attname = 'status';

  if v_default is distinct from '''draft''::text' then
    raise exception 'status default must remain draft: %', v_default;
  end if;

  if (
    select status
    from public.account_landing_pages
    where id = 'e1950000-0000-4000-8000-000000000024'
  ) <> 'draft' then
    raise exception 'current creation default must remain draft';
  end if;

  if (
    select count(*)
    from public.account_landing_page_materializations
    where landing_page_id in (
      'e1950000-0000-4000-8000-000000000021',
      'e1950000-0000-4000-8000-000000000022'
    )
  ) <> 2 then
    raise exception 'append must support both draft and active';
  end if;

  begin
    perform *
    from public.append_account_landing_page_materialization_v1(
      'e1950000-0000-4000-8000-000000000011',
      'e1950000-0000-4000-8000-000000000023',
      'e1950000-0000-4000-8000-000000000033',
      '{}'::jsonb,
      '{}'::jsonb,
      'e1950000-0000-4000-8000-000000000001'
    );
    raise exception using errcode = 'P0002', message = 'archived append must fail';
  exception when sqlstate 'P0001' then
    null;
  end;

  if exists (
    select 1
    from public.account_landing_page_materializations
    where attempt_id = 'e1950000-0000-4000-8000-000000000033'
  ) then
    raise exception 'archived append must not persist a revision';
  end if;

  select pg_get_functiondef(
    'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)'::regprocedure
  )
  into v_function;

  if v_function !~* 'status[[:space:]]+in[[:space:]]*\(''draft'',[[:space:]]*''active''\)' then
    raise exception 'append must lock only draft or active landing pages';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
    'EXECUTE'
  ) then
    raise exception 'append grants must remain service_role-only';
  end if;
end;
$$;

rollback;
