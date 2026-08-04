begin;
set local search_path = public, pg_catalog;

do $$
declare
  index_row record;
begin
  select
    index_state.indisunique,
    index_state.indisvalid,
    index_state.indisready,
    pg_get_expr(index_state.indpred, index_state.indrelid) as predicate
  into index_row
  from pg_index index_state
  where index_state.indexrelid = to_regclass('public.account_taxonomy_one_active_primary_idx');

  if not found
    or index_row.indisunique is not true
    or index_row.indisvalid is not true
    or index_row.indisready is not true
    or index_row.predicate !~* 'is_primary\s*=\s*true'
    or index_row.predicate !~* 'status\s*=\s*''active'''
  then
    raise exception 'account_taxonomy active-primary unique index is missing or invalid';
  end if;
end;
$$;

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('a1200000-0000-4000-8000-000000000001', 'Account taxonomy primary test', 'account-taxonomy-primary-test', 'account-taxonomy-primary-test', 'active'),
  ('a1200000-0000-4000-8000-000000000002', 'Account taxonomy zero-primary test', 'account-taxonomy-zero-primary-test', 'account-taxonomy-zero-primary-test', 'active');

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values
  ('b1200000-0000-4000-8000-000000000001', null, 'segment', 'Account taxonomy test segment one', 'account-taxonomy-test-segment-one', true),
  ('b1200000-0000-4000-8000-000000000002', null, 'segment', 'Account taxonomy test segment two', 'account-taxonomy-test-segment-two', true),
  ('b1200000-0000-4000-8000-000000000003', null, 'segment', 'Account taxonomy test segment three', 'account-taxonomy-test-segment-three', true);

do $$
begin
  if exists (
    select 1
    from public.account_taxonomy
    where account_id = 'a1200000-0000-4000-8000-000000000002'
      and is_primary = true
      and status = 'active'
  ) then
    raise exception 'an account with zero active primary links must be allowed';
  end if;
end;
$$;

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values (
  'a1200000-0000-4000-8000-000000000001',
  'b1200000-0000-4000-8000-000000000001',
  true,
  'active',
  'manual'
);

do $$
begin
  begin
    insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
    values (
      'a1200000-0000-4000-8000-000000000001',
      'b1200000-0000-4000-8000-000000000002',
      true,
      'active',
      'manual'
    );

    raise exception 'a second active primary link should have been rejected';
  exception when unique_violation then
    null;
  end;
end;
$$;

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values (
  'a1200000-0000-4000-8000-000000000001',
  'b1200000-0000-4000-8000-000000000002',
  false,
  'active',
  'manual'
);

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values (
  'a1200000-0000-4000-8000-000000000001',
  'b1200000-0000-4000-8000-000000000003',
  true,
  'inactive',
  'manual'
);

do $$
begin
  begin
    update public.account_taxonomy
    set status = 'active'
    where account_id = 'a1200000-0000-4000-8000-000000000001'
      and taxon_id = 'b1200000-0000-4000-8000-000000000003';

    raise exception 'activating a second primary link should have been rejected';
  exception when unique_violation then
    null;
  end;
end;
$$;

do $$
begin
  if (
    select count(*)
    from public.account_taxonomy
    where account_id = 'a1200000-0000-4000-8000-000000000001'
      and is_primary = true
      and status = 'active'
  ) <> 1 then
    raise exception 'the final state must contain exactly one active primary link';
  end if;

  if not exists (
    select 1
    from public.account_taxonomy
    where account_id = 'a1200000-0000-4000-8000-000000000001'
      and taxon_id = 'b1200000-0000-4000-8000-000000000002'
      and is_primary = false
      and status = 'active'
  ) then
    raise exception 'non-primary links must remain allowed';
  end if;

  if not exists (
    select 1
    from public.account_taxonomy
    where account_id = 'a1200000-0000-4000-8000-000000000001'
      and taxon_id = 'b1200000-0000-4000-8000-000000000003'
      and is_primary = true
      and status = 'inactive'
  ) then
    raise exception 'historical inactive primary links must remain allowed';
  end if;

  if exists (
    select account_id
    from public.account_taxonomy
    where is_primary = true
      and status = 'active'
    group by account_id
    having count(*) > 1
  ) then
    raise exception 'the final state contains duplicate active primary links';
  end if;
end;
$$;

rollback;
