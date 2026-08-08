begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  'e1923000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e19.2.3-test@example.com',
  now(),
  now()
);

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('e1923000-0000-4000-8000-000000000011', 'E19.2.3 account one', 'e19-2-3-account-one', 'e19-2-3-account-one', 'active'),
  ('e1923000-0000-4000-8000-000000000012', 'E19.2.3 account two', 'e19-2-3-account-two', 'e19-2-3-account-two', 'active');

insert into public.account_landing_pages (id, account_id, name, slug, status, created_by)
values
  ('e1923000-0000-4000-8000-000000000021', 'e1923000-0000-4000-8000-000000000011', 'Draft one', 'draft-one', 'draft', 'e1923000-0000-4000-8000-000000000001'),
  ('e1923000-0000-4000-8000-000000000022', 'e1923000-0000-4000-8000-000000000011', 'Draft two', 'draft-two', 'draft', 'e1923000-0000-4000-8000-000000000001'),
  ('e1923000-0000-4000-8000-000000000023', 'e1923000-0000-4000-8000-000000000012', 'Other tenant draft', 'other-tenant-draft', 'draft', 'e1923000-0000-4000-8000-000000000001');

insert into public.account_landing_page_onboarding_configurations (
  account_id,
  catalog_version,
  values,
  created_by,
  updated_by
)
values (
  'e1923000-0000-4000-8000-000000000011',
  2,
  '{"business_display_name":{"scope":"business","value":"Conta um"}}'::jsonb,
  'e1923000-0000-4000-8000-000000000001',
  'e1923000-0000-4000-8000-000000000001'
);

update public.account_landing_page_onboarding_configurations
set landing_page_id = 'e1923000-0000-4000-8000-000000000021'
where account_id = 'e1923000-0000-4000-8000-000000000011';

do $$
declare
  affected integer;
begin
  update public.account_landing_page_onboarding_configurations
  set
    values = values || '{"primary_service_or_offer":{"scope":"offer","value":"Oferta"}}'::jsonb,
    revision = 2
  where account_id = 'e1923000-0000-4000-8000-000000000011'
    and revision = 1;

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'valid optimistic update must affect exactly one row';
  end if;

  update public.account_landing_page_onboarding_configurations
  set revision = 3
  where account_id = 'e1923000-0000-4000-8000-000000000011'
    and revision = 1;

  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'stale optimistic update must affect zero rows';
  end if;
end;
$$;

do $$
begin
  begin
    update public.account_landing_page_onboarding_configurations
    set landing_page_id = 'e1923000-0000-4000-8000-000000000022'
    where account_id = 'e1923000-0000-4000-8000-000000000011';
    raise exception 'rebind should have been rejected';
  exception when check_violation then
    null;
  end;

  begin
    update public.account_landing_page_onboarding_configurations
    set landing_page_id = null
    where account_id = 'e1923000-0000-4000-8000-000000000011';
    raise exception 'unlink should have been rejected';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.account_landing_page_onboarding_configurations (
      account_id,
      landing_page_id,
      catalog_version,
      values,
      created_by,
      updated_by
    ) values (
      'e1923000-0000-4000-8000-000000000012',
      'e1923000-0000-4000-8000-000000000021',
      2,
      '{}'::jsonb,
      'e1923000-0000-4000-8000-000000000001',
      'e1923000-0000-4000-8000-000000000001'
    );
    raise exception 'cross-tenant bind should have been rejected';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.account_landing_page_onboarding_configurations (
      account_id,
      catalog_version,
      values,
      created_by,
      updated_by
    ) values (
      'e1923000-0000-4000-8000-000000000011',
      2,
      '{}'::jsonb,
      'e1923000-0000-4000-8000-000000000001',
      'e1923000-0000-4000-8000-000000000001'
    );
    raise exception 'a concurrent second aggregate insert should have collided';
  exception when unique_violation then
    null;
  end;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.account_landing_page_onboarding_configurations
    where account_id = 'e1923000-0000-4000-8000-000000000011'
      and landing_page_id = 'e1923000-0000-4000-8000-000000000021'
      and revision = 2
      and values ? 'business_display_name'
      and values ? 'primary_service_or_offer'
  ) then
    raise exception 'valid bind and unrelated updates must remain persisted';
  end if;
end;
$$;

rollback;
