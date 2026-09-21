begin;
set local search_path = public, pg_catalog;

do $$
begin
  if to_regclass('public.account_pending_setup_conversations') is null
     or to_regclass('public.account_pending_setup_messages') is null then
    raise exception 'E10.9 conversation tables are missing';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.account_pending_setup_conversations'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.account_pending_setup_messages'::regclass) then
    raise exception 'E10.9 RLS must be enabled';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('account_pending_setup_conversations', 'account_pending_setup_messages')
  ) then
    raise exception 'E10.9 conversation tables must not expose policies';
  end if;
  if has_table_privilege('authenticated', 'public.account_pending_setup_conversations', 'select')
     or has_table_privilege('authenticated', 'public.account_pending_setup_messages', 'select') then
    raise exception 'authenticated must not read E10.9 conversation tables directly';
  end if;
  if not has_table_privilege('service_role', 'public.account_pending_setup_conversations', 'select,insert,update')
     or not has_table_privilege('service_role', 'public.account_pending_setup_messages', 'select,insert')
     or has_table_privilege('service_role', 'public.account_pending_setup_messages', 'update,delete') then
    raise exception 'E10.9 service_role table privileges drifted';
  end if;
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.account_pending_setup_messages'::regclass
      and not tgisinternal
  ) then
    raise exception 'E10.9 messages must remain outside generic row-level triggers';
  end if;
  if exists (
    select 1
    from pg_trigger trigger_state
    join pg_proc trigger_function on trigger_function.oid = trigger_state.tgfoid
    where trigger_state.tgrelid = 'public.account_pending_setup_conversations'::regclass
      and not trigger_state.tgisinternal
      and trigger_function.proname <> 'tg_set_updated_at'
  ) then
    raise exception 'E10.9 conversations must remain outside generic row-level audit triggers';
  end if;
  if not has_function_privilege('service_role', 'public.start_account_pending_setup_v1(uuid,uuid,text)', 'execute')
     or not has_function_privilege('service_role', 'public.claim_account_pending_setup_turn_v1(uuid,uuid,uuid,bigint,uuid)', 'execute')
     or not has_function_privilege('service_role', 'public.append_account_pending_setup_turn_v1(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text)', 'execute')
     or not has_function_privilege('service_role', 'public.complete_account_pending_setup_v1(uuid,uuid,uuid,bigint,text)', 'execute') then
    raise exception 'E10.9 service_role function privileges drifted';
  end if;
end;
$$;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('e1090000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e10.9-one@example.com', now(), now()),
  ('e1090000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'e10.9-two@example.com', now(), now()),
  ('e1090000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'e10.9-three@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status)
values
  ('e1090000-0000-4000-8000-000000000011', 'E10.9 official', 'e10-9-official', 'e10-9-official', 'pending_setup'),
  ('e1090000-0000-4000-8000-000000000012', 'E10.9 fallback', 'e10-9-fallback', 'e10-9-fallback', 'pending_setup'),
  ('e1090000-0000-4000-8000-000000000013', 'E10.9 incomplete', 'e10-9-incomplete', 'e10-9-incomplete', 'pending_setup');

insert into public.account_users (account_id, user_id, role, status)
values
  ('e1090000-0000-4000-8000-000000000011', 'e1090000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e1090000-0000-4000-8000-000000000012', 'e1090000-0000-4000-8000-000000000002', 'owner', 'active'),
  ('e1090000-0000-4000-8000-000000000013', 'e1090000-0000-4000-8000-000000000003', 'owner', 'active');

do $$
begin
  begin
    insert into public.account_pending_setup_conversations (account_id, user_id, stage)
    values (
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000001',
      'invalid_stage'
    );
    raise exception 'E10.9 invalid stage should fail';
  exception when check_violation then
    null;
  end;
  begin
    insert into public.account_pending_setup_conversations (account_id, user_id, business_context_text)
    values (
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000001',
      repeat('x', 4001)
    );
    raise exception 'E10.9 oversized context should fail';
  exception when check_violation then
    null;
  end;
  begin
    insert into public.account_pending_setup_conversations (account_id, user_id)
    values (
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000002'
    );
    raise exception 'E10.9 cross-account membership should fail';
  exception when foreign_key_violation then
    null;
  end;
end;
$$;

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values ('e1090000-0000-4000-8000-000000000021', null, 'segment', 'E10.9 official taxon', 'e10-9-official-taxon', true);

do $$
declare
  official_conversation uuid;
  repeated_conversation uuid;
  fallback_conversation uuid;
  official_version bigint;
  fallback_version bigint;
  official_token uuid := 'e1090000-0000-4000-8000-000000000031';
  fallback_token uuid := 'e1090000-0000-4000-8000-000000000032';
begin
  official_conversation := public.start_account_pending_setup_v1(
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000001',
    'Ana'
  );
  repeated_conversation := public.start_account_pending_setup_v1(
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000001',
    'Outro nome'
  );
  if official_conversation <> repeated_conversation then
    raise exception 'E10.9 start must be idempotent';
  end if;
  if (select count(*) from public.account_pending_setup_messages where conversation_id = official_conversation) <> 1 then
    raise exception 'E10.9 repeated start must not duplicate the first question';
  end if;

  official_version := public.claim_account_pending_setup_turn_v1(
    official_conversation,
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000001',
    1,
    official_token
  );
  begin
    perform public.claim_account_pending_setup_turn_v1(
      official_conversation,
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000001',
      1,
      'e1090000-0000-4000-8000-000000000039'
    );
    raise exception 'E10.9 duplicate claim must fail before external effects';
  exception when serialization_failure then
    null;
  end;
  begin
    perform public.append_account_pending_setup_turn_v1(
      official_conversation,
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000001',
      official_version,
      official_token,
      'invalid', 'invalid', 'completed', null, 'invalid'
    );
    raise exception 'E10.9 invalid stage transition must fail';
  exception when invalid_parameter_value then
    null;
  end;
  official_version := public.append_account_pending_setup_turn_v1(
    official_conversation,
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000001',
    official_version,
    official_token,
    'Consultoria financeira para restaurantes',
    'Entendi. Já podemos seguir.',
    'ready_to_complete',
    null,
    'Consultoria financeira para restaurantes'
  );
  begin
    perform public.claim_account_pending_setup_turn_v1(
      official_conversation,
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000001',
      1,
      'e1090000-0000-4000-8000-000000000038'
    );
    raise exception 'E10.9 stale version should fail';
  exception when serialization_failure then
    null;
  end;

  insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
  values (
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000021',
    true,
    'active',
    'user_confirmed_ai'
  );

  if not public.complete_account_pending_setup_v1(
    official_conversation,
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000001',
    official_version,
    'official'
  ) then
    raise exception 'E10.9 official completion failed';
  end if;
  if not public.complete_account_pending_setup_v1(
    official_conversation,
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000001',
    official_version,
    'official'
  ) then
    raise exception 'E10.9 repeated completion must be idempotent';
  end if;

  fallback_conversation := public.start_account_pending_setup_v1(
    'e1090000-0000-4000-8000-000000000012',
    'e1090000-0000-4000-8000-000000000002',
    'Bia'
  );
  fallback_version := public.claim_account_pending_setup_turn_v1(
    fallback_conversation,
    'e1090000-0000-4000-8000-000000000012',
    'e1090000-0000-4000-8000-000000000002',
    1,
    fallback_token
  );
  fallback_version := public.append_account_pending_setup_turn_v1(
    fallback_conversation,
    'e1090000-0000-4000-8000-000000000012',
    'e1090000-0000-4000-8000-000000000002',
    fallback_version,
    fallback_token,
    'Atividade nova sem taxon oficial',
    'Vou preservar essa descrição.',
    'ready_to_complete',
    null,
    'Atividade nova sem taxon oficial'
  );

  insert into public.account_niche_resolutions (
    account_id, raw_input, selected_taxon_id, confidence,
    should_use_deterministic_match, should_escalate_to_ai, ai_escalation_mode,
    needs_admin_review, reason, resolution_status, match_source, score,
    user_resolution_status, user_selected_taxon_id, user_rewrite_input, user_confirmed_at
  ) values (
    'e1090000-0000-4000-8000-000000000012',
    'Atividade nova sem taxon oficial', null, 'low', false, true,
    'suggest_new_taxon_for_review', true, 'no_candidates', 'unclassified', null, null,
    'confirmed', null, 'Atividade nova sem taxon oficial', now()
  );

  insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
  values (
    'e1090000-0000-4000-8000-000000000012',
    'e1090000-0000-4000-8000-000000000021',
    true,
    'active',
    'taxonomy_match'
  );
  begin
    perform public.complete_account_pending_setup_v1(
      fallback_conversation,
      'e1090000-0000-4000-8000-000000000012',
      'e1090000-0000-4000-8000-000000000002',
      fallback_version,
      'operational_fallback'
    );
    raise exception 'E10.9 fallback must reject an official primary link';
  exception when check_violation then
    null;
  end;
  delete from public.account_taxonomy
  where account_id = 'e1090000-0000-4000-8000-000000000012';

  update public.account_niche_resolutions
  set user_resolution_status = 'dismissed'
  where account_id = 'e1090000-0000-4000-8000-000000000012';
  begin
    perform public.complete_account_pending_setup_v1(
      fallback_conversation,
      'e1090000-0000-4000-8000-000000000012',
      'e1090000-0000-4000-8000-000000000002',
      fallback_version,
      'operational_fallback'
    );
    raise exception 'E10.9 dismissed fallback must not complete';
  exception when check_violation then
    null;
  end;
  update public.account_niche_resolutions
  set user_resolution_status = 'confirmed'
  where account_id = 'e1090000-0000-4000-8000-000000000012';

  if not public.complete_account_pending_setup_v1(
    fallback_conversation,
    'e1090000-0000-4000-8000-000000000012',
    'e1090000-0000-4000-8000-000000000002',
    fallback_version,
    'operational_fallback'
  ) then
    raise exception 'E10.9 operational fallback completion failed';
  end if;

  repeated_conversation := public.start_account_pending_setup_v1(
    'e1090000-0000-4000-8000-000000000013',
    'e1090000-0000-4000-8000-000000000003',
    null
  );
  update public.accounts
  set status = 'active'
  where id = 'e1090000-0000-4000-8000-000000000013';
  begin
    perform public.complete_account_pending_setup_v1(
      repeated_conversation,
      'e1090000-0000-4000-8000-000000000013',
      'e1090000-0000-4000-8000-000000000003',
      1,
      'operational_fallback'
    );
    raise exception 'E10.9 active incomplete account must not complete';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  if exists (
    select 1 from public.accounts
    where id in (
      'e1090000-0000-4000-8000-000000000011',
      'e1090000-0000-4000-8000-000000000012'
    ) and status <> 'active'
  ) then
    raise exception 'E10.9 completion must activate both accounts';
  end if;
  if (select count(*) from public.account_commercial_entitlements where account_id in (
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000012'
  )) <> 0 then
    raise exception 'E10.9 completion must not create entitlement';
  end if;
  if (select count(*) from public.account_pending_setup_conversations where stage = 'completed' and completed_at is not null and account_id in (
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000012'
  )) <> 2 then
    raise exception 'E10.9 completed conversations were not preserved';
  end if;
  if (select count(*) from public.account_pending_setup_messages m join public.account_pending_setup_conversations c on c.id = m.conversation_id where c.account_id in (
    'e1090000-0000-4000-8000-000000000011',
    'e1090000-0000-4000-8000-000000000012'
  )) <> 6 then
    raise exception 'E10.9 transcript must remain preserved after activation';
  end if;
end;
$$;

rollback;
