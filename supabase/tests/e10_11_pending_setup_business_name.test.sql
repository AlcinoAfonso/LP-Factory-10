begin;
set local search_path = public, pg_catalog;

do $$
begin
  if not has_function_privilege('service_role', 'public.set_account_pending_setup_business_name_v1(uuid,uuid,uuid,text,bigint)', 'execute')
     or not has_function_privilege('service_role', 'public.complete_account_pending_setup_v2(uuid,uuid,uuid,bigint,text)', 'execute')
     or has_function_privilege('authenticated', 'public.set_account_pending_setup_business_name_v1(uuid,uuid,uuid,text,bigint)', 'execute')
     or has_function_privilege('authenticated', 'public.complete_account_pending_setup_v2(uuid,uuid,uuid,bigint,text)', 'execute') then
    raise exception 'E10.11 RPC privileges drifted';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.account_pending_setup_conversations'::regclass) then
    raise exception 'E10.11 conversation RLS must remain enabled';
  end if;
end;
$$;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('e1011000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e10.11-owner@example.com', now(), now()),
  ('e1011000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'e10.11-viewer@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('e1011000-0000-4000-8000-000000000011', 'Account label is not public name', 'e10-11-new', 'e10-11-new', 'pending_setup'),
  ('e1011000-0000-4000-8000-000000000012', 'Historical', 'e10-11-historical', 'e10-11-historical', 'pending_setup');

insert into public.account_users (account_id, user_id, role, status)
values
  ('e1011000-0000-4000-8000-000000000011', 'e1011000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e1011000-0000-4000-8000-000000000011', 'e1011000-0000-4000-8000-000000000002', 'viewer', 'active'),
  ('e1011000-0000-4000-8000-000000000012', 'e1011000-0000-4000-8000-000000000001', 'owner', 'active');

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values ('e1011000-0000-4000-8000-000000000021', null, 'segment', 'E10.11 taxon', 'e10-11-taxon', true);

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values
  ('e1011000-0000-4000-8000-000000000011', 'e1011000-0000-4000-8000-000000000021', true, 'active', 'user_confirmed_ai'),
  ('e1011000-0000-4000-8000-000000000012', 'e1011000-0000-4000-8000-000000000021', true, 'active', 'user_confirmed_ai');

insert into public.account_pending_setup_conversations
  (id, account_id, user_id, stage, business_context_text)
values
  ('e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011', 'e1011000-0000-4000-8000-000000000001', 'ready_to_complete', 'Atendo clientes locais.'),
  ('e1011000-0000-4000-8000-000000000032', 'e1011000-0000-4000-8000-000000000012', 'e1011000-0000-4000-8000-000000000001', 'ready_to_complete', 'Atendo clientes históricos.');

do $$
declare
  next_version bigint;
begin
  begin
    perform public.complete_account_pending_setup_v2(
      'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
      'e1011000-0000-4000-8000-000000000001', 1, 'official');
    raise exception 'v2 completed without a public name';
  exception when check_violation then null;
  end;

  begin
    perform public.set_account_pending_setup_business_name_v1(
      'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
      'e1011000-0000-4000-8000-000000000002', 'Viewer cannot write', 1);
    raise exception 'viewer wrote a public name';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.set_account_pending_setup_business_name_v1(
      'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
      'e1011000-0000-4000-8000-000000000001', ' ', 1);
    raise exception 'blank name accepted';
  exception when invalid_parameter_value then null;
  end;

  begin
    perform public.set_account_pending_setup_business_name_v1(
      'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
      'e1011000-0000-4000-8000-000000000001', repeat('x', 121), 1);
    raise exception 'oversized name accepted';
  exception when invalid_parameter_value then null;
  end;

  next_version := public.set_account_pending_setup_business_name_v1(
    'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
    'e1011000-0000-4000-8000-000000000001', 'Studio Aurora', 1);
  if next_version <> 2 then raise exception 'name version did not advance'; end if;
  begin
    perform public.set_account_pending_setup_business_name_v1(
      'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
      'e1011000-0000-4000-8000-000000000001', 'Stale', 1);
    raise exception 'stale name write accepted';
  exception when serialization_failure then null;
  end;
  if not public.complete_account_pending_setup_v2(
    'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
    'e1011000-0000-4000-8000-000000000001', next_version, 'official') then
    raise exception 'v2 completion failed';
  end if;
  if (select business_display_name from public.account_pending_setup_conversations
      where id = 'e1011000-0000-4000-8000-000000000031') <> 'Studio Aurora' then
    raise exception 'public name changed on completion';
  end if;
  if not public.complete_account_pending_setup_v2(
    'e1011000-0000-4000-8000-000000000031', 'e1011000-0000-4000-8000-000000000011',
    'e1011000-0000-4000-8000-000000000001', next_version, 'official') then
    raise exception 'completed v2 retry was not idempotent';
  end if;

  if not public.complete_account_pending_setup_v1(
    'e1011000-0000-4000-8000-000000000032', 'e1011000-0000-4000-8000-000000000012',
    'e1011000-0000-4000-8000-000000000001', 1, 'official') then
    raise exception 'gate-off v1 completion changed';
  end if;
  if (select business_display_name from public.account_pending_setup_conversations
      where id = 'e1011000-0000-4000-8000-000000000032') is not null then
    raise exception 'historical name was inferred';
  end if;
end;
$$;

rollback;
