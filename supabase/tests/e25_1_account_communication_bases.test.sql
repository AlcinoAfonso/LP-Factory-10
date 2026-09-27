begin;
set local search_path = public, pg_catalog;

do $$
begin
  if to_regclass('public.account_communication_bases') is null then
    raise exception 'E25.1 Base table is missing';
  end if;
  if not (select relrowsecurity from pg_class
          where oid = 'public.account_communication_bases'::regclass) then
    raise exception 'E25.1 RLS must be enabled';
  end if;
  if not has_table_privilege('authenticated', 'public.account_communication_bases', 'select')
     or has_table_privilege('authenticated', 'public.account_communication_bases', 'insert')
     or has_table_privilege('authenticated', 'public.account_communication_bases', 'update')
     or has_table_privilege('authenticated', 'public.account_communication_bases', 'delete')
     or has_table_privilege('anon', 'public.account_communication_bases', 'select')
     or has_table_privilege('anon', 'public.account_communication_bases', 'insert')
     or has_table_privilege('anon', 'public.account_communication_bases', 'update')
     or has_table_privilege('service_role', 'public.account_communication_bases', 'delete')
     or not has_table_privilege('service_role', 'public.account_communication_bases', 'select')
     or not has_table_privilege('service_role', 'public.account_communication_bases', 'insert')
     or not has_table_privilege('service_role', 'public.account_communication_bases', 'update') then
    raise exception 'E25.1 ACL drifted';
  end if;
  if to_regrole('ai_readonly') is not null and
     has_table_privilege('ai_readonly', 'public.account_communication_bases', 'select') then
    raise exception 'E25.1 ai_readonly ACL drifted';
  end if;
  if (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'account_communication_bases') <> 1
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'account_communication_bases'
         and cmd = 'SELECT'
         and roles = array['authenticated']::name[]
     ) then
    raise exception 'E25.1 RLS policies drifted';
  end if;
end;
$$;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('e2510000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e25-owner@example.com', now(), now()),
  ('e2510000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'e25-viewer@example.com', now(), now()),
  ('e2510000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'e25-expired@example.com', now(), now()),
  ('e2510000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'e25-other@example.com', now(), now()),
  ('e2510000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'e25-absent@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('e2510000-0000-4000-8000-000000000011', 'E25 eligible', 'e25-eligible', 'e25-eligible', 'active'),
  ('e2510000-0000-4000-8000-000000000012', 'E25 expired', 'e25-expired', 'e25-expired', 'active'),
  ('e2510000-0000-4000-8000-000000000013', 'E25 other eligible', 'e25-other', 'e25-other', 'active'),
  ('e2510000-0000-4000-8000-000000000014', 'E25 absent entitlement', 'e25-absent', 'e25-absent', 'active');

insert into public.account_users (account_id, user_id, role, status)
values
  ('e2510000-0000-4000-8000-000000000011', 'e2510000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e2510000-0000-4000-8000-000000000011', 'e2510000-0000-4000-8000-000000000002', 'viewer', 'active'),
  ('e2510000-0000-4000-8000-000000000012', 'e2510000-0000-4000-8000-000000000003', 'owner', 'active'),
  ('e2510000-0000-4000-8000-000000000013', 'e2510000-0000-4000-8000-000000000004', 'owner', 'active'),
  ('e2510000-0000-4000-8000-000000000014', 'e2510000-0000-4000-8000-000000000005', 'owner', 'active');

insert into public.account_commercial_entitlements
  (account_id, plan_key, plan_name_snapshot, origin, status, confirmed_at, expires_at)
values
  ('e2510000-0000-4000-8000-000000000011', 'starter', 'Starter', 'liberacao_manual', 'ativo', now(), null),
  ('e2510000-0000-4000-8000-000000000012', 'starter', 'Starter', 'liberacao_manual', 'ativo', now() - interval '2 days', now() - interval '1 day'),
  ('e2510000-0000-4000-8000-000000000013', 'starter', 'Starter', 'liberacao_manual', 'ativo', now(), null);

insert into public.account_communication_bases (account_id, sections_json)
values
  ('e2510000-0000-4000-8000-000000000011', '{"business_name":{"format":"text","value":"Negócio","origin":"user_confirmed"}}'),
  ('e2510000-0000-4000-8000-000000000012', '{}'::jsonb),
  ('e2510000-0000-4000-8000-000000000013', '{}'::jsonb),
  ('e2510000-0000-4000-8000-000000000014', '{}'::jsonb);

do $$
begin
  begin
    insert into public.account_communication_bases (account_id) values
      ('e2510000-0000-4000-8000-000000000011');
    raise exception 'duplicate Base should fail';
  exception when unique_violation then null;
  end;
  begin
    update public.account_communication_bases
      set sections_json = '[]'::jsonb
      where account_id = 'e2510000-0000-4000-8000-000000000011';
    raise exception 'array sections should fail';
  exception when check_violation then null;
  end;
end;
$$;

do $$
declare affected integer;
begin
  update public.account_communication_bases
    set sections_json = sections_json || '{"business_context":{"format":"text","value":"Atuação","origin":"user_confirmed"}}'::jsonb,
        version = version + 1
    where account_id = 'e2510000-0000-4000-8000-000000000011' and version = 1;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'first versioned write must succeed'; end if;

  update public.account_communication_bases
    set sections_json = '{}'::jsonb, version = 3
    where account_id = 'e2510000-0000-4000-8000-000000000011' and version = 1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'stale version must not overwrite Base'; end if;
  if not exists (
    select 1 from public.account_communication_bases
    where account_id = 'e2510000-0000-4000-8000-000000000011'
      and version = 2
      and sections_json -> 'business_name' ->> 'value' = 'Negócio'
      and sections_json -> 'business_context' ->> 'value' = 'Atuação'
  ) then raise exception 'versioned write must preserve other sections'; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e2510000-0000-4000-8000-000000000001', true);

do $$
declare visible_count integer;
begin
  select count(*) into visible_count from public.account_communication_bases;
  if visible_count <> 1 then raise exception 'eligible owner must see only own Base'; end if;
  begin
    insert into public.account_communication_bases (account_id)
    values ('e2510000-0000-4000-8000-000000000011');
    raise exception 'authenticated INSERT should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.account_communication_bases
      set sections_json = '{}'::jsonb
      where account_id = 'e2510000-0000-4000-8000-000000000011';
    raise exception 'authenticated UPDATE should fail';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', 'e2510000-0000-4000-8000-000000000002', true);
do $$
begin
  if (select count(*) from public.account_communication_bases) <> 1 then
    raise exception 'eligible viewer must read own Base';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'e2510000-0000-4000-8000-000000000003', true);
do $$
begin
  if (select count(*) from public.account_communication_bases) <> 0 then
    raise exception 'expired entitlement must hide Base';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'e2510000-0000-4000-8000-000000000004', true);
do $$
begin
  if (select array_agg(account_id) from public.account_communication_bases) is distinct from array['e2510000-0000-4000-8000-000000000013'::uuid] then
    raise exception 'second eligible account must see only own Base';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'e2510000-0000-4000-8000-000000000005', true);
do $$
begin
  if (select count(*) from public.account_communication_bases) <> 0 then
    raise exception 'absent entitlement must hide Base';
  end if;
end;
$$;

reset role;
rollback;
