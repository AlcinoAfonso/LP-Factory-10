begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('e1096000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e10.9.6-owner-one@example.com', now(), now()),
  ('e1096000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'e10.9.6-owner-two@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status, owner_user_id)
values
  ('e1096000-0000-4000-8000-000000000011', 'E10.9.6 official', 'e10-9-6-official', 'e10-9-6-official', 'pending_setup', 'e1096000-0000-4000-8000-000000000001'),
  ('e1096000-0000-4000-8000-000000000012', 'E10.9.6 fallback', 'e10-9-6-fallback', 'e10-9-6-fallback', 'pending_setup', 'e1096000-0000-4000-8000-000000000002'),
  ('e1096000-0000-4000-8000-000000000013', 'E10.9.6 incomplete', 'e10-9-6-incomplete', 'e10-9-6-incomplete', 'pending_setup', 'e1096000-0000-4000-8000-000000000001');

insert into public.account_users (account_id, user_id, role, status)
values
  ('e1096000-0000-4000-8000-000000000011', 'e1096000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e1096000-0000-4000-8000-000000000012', 'e1096000-0000-4000-8000-000000000002', 'owner', 'active'),
  ('e1096000-0000-4000-8000-000000000013', 'e1096000-0000-4000-8000-000000000001', 'owner', 'active');

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values ('e1096000-0000-4000-8000-000000000031', null, 'niche', 'Consultoria E10.9.6', 'consultoria-e10-9-6', true);

insert into public.account_niche_resolutions (
  account_id,
  raw_input,
  selected_taxon_id,
  confidence,
  should_use_deterministic_match,
  should_escalate_to_ai,
  ai_escalation_mode,
  needs_admin_review,
  reason,
  resolution_status,
  user_resolution_status,
  user_selected_taxon_id,
  user_rewrite_input,
  user_confirmed_at
)
values
  (
    'e1096000-0000-4000-8000-000000000011',
    'consultoria',
    'e1096000-0000-4000-8000-000000000031',
    'high',
    true,
    false,
    'none',
    false,
    'high_confidence_strong_match',
    'deterministic_high_confidence',
    'pending_confirmation',
    null,
    null,
    null
  ),
  (
    'e1096000-0000-4000-8000-000000000012',
    'atendimento especializado',
    null,
    'low',
    false,
    true,
    'suggest_new_taxon_for_review',
    true,
    'low_confidence_insufficient_score',
    'unclassified',
    'confirmed',
    null,
    'atendimento especializado',
    now()
  );

insert into public.pending_setup_conversations (account_id, owner_user_id)
values
  ('e1096000-0000-4000-8000-000000000011', 'e1096000-0000-4000-8000-000000000001'),
  ('e1096000-0000-4000-8000-000000000012', 'e1096000-0000-4000-8000-000000000002'),
  ('e1096000-0000-4000-8000-000000000013', 'e1096000-0000-4000-8000-000000000001');

insert into public.pending_setup_conversation_turns (
  account_id,
  id,
  user_message,
  turn_kind,
  status,
  product_state,
  product_message,
  failure_code,
  completed_at
)
values
  (
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000021',
    'consultoria',
    'business_description',
    'completed',
    'ready_official',
    'Entendimento confirmado: Consultoria E10.9.6.',
    null,
    now()
  ),
  (
    'e1096000-0000-4000-8000-000000000012',
    'e1096000-0000-4000-8000-000000000022',
    'atendimento especializado',
    'fallback_confirmation',
    'completed',
    'ready_fallback',
    'Entendimento operacional confirmado: atendimento especializado.',
    null,
    now()
  ),
  (
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000023',
    'tentativa posterior',
    'clarification',
    'failed',
    'failure',
    'Não foi possível concluir este turno. Você pode tentar novamente.',
    'provider_timeout',
    now() + interval '1 second'
  );

do $$
declare
  v_entitlements_before bigint;
  v_entitlements_after bigint;
  v_result text;
begin
  v_result := public.confirm_pending_setup_niche_resolution_taxon(
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000031'
  );
  if v_result <> 'saved' then
    raise exception 'deterministic official resolution must be confirmed atomically, got %', v_result;
  end if;
  if not exists (
    select 1
    from public.account_niche_resolutions
    where account_id = 'e1096000-0000-4000-8000-000000000011'
      and user_resolution_status = 'confirmed'
      and user_selected_taxon_id = 'e1096000-0000-4000-8000-000000000031'
  ) or not exists (
    select 1
    from public.account_taxonomy
    where account_id = 'e1096000-0000-4000-8000-000000000011'
      and taxon_id = 'e1096000-0000-4000-8000-000000000031'
      and is_primary = true
      and status = 'active'
      and source_type = 'taxonomy_match'
  ) then
    raise exception 'deterministic confirmation must persist resolution and official taxonomy together';
  end if;

  select count(*) into v_entitlements_before
  from public.account_commercial_entitlements
  where account_id in (
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000012'
  );

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000001'
  );
  if v_result <> 'turn_not_ready' then
    raise exception 'a newer failed turn must prevent stale completion, got %', v_result;
  end if;

  delete from public.pending_setup_conversation_turns
  where account_id = 'e1096000-0000-4000-8000-000000000011'
    and id = 'e1096000-0000-4000-8000-000000000023';

  insert into public.pending_setup_conversation_turns (
    account_id,
    id,
    user_message,
    turn_kind
  ) values (
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000024',
    'nova fala ainda em processamento',
    'clarification'
  );

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000001'
  );
  if v_result <> 'turn_not_ready' then
    raise exception 'a newer pending turn must prevent stale completion, got %', v_result;
  end if;
  if not exists (
    select 1 from public.accounts
    where id = 'e1096000-0000-4000-8000-000000000011'
      and status = 'pending_setup'
      and setup_completed_at is null
  ) then
    raise exception 'a pending turn must keep the account in pending_setup';
  end if;

  delete from public.pending_setup_conversation_turns
  where account_id = 'e1096000-0000-4000-8000-000000000011'
    and id = 'e1096000-0000-4000-8000-000000000024';

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000001'
  );
  if v_result <> 'saved' then
    raise exception 'official completion must be saved, got %', v_result;
  end if;

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000001'
  );
  if v_result <> 'already_completed' then
    raise exception 'official completion retry must be idempotent, got %', v_result;
  end if;

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000012',
    'e1096000-0000-4000-8000-000000000002'
  );
  if v_result <> 'saved' then
    raise exception 'fallback completion must be saved, got %', v_result;
  end if;

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000013',
    'e1096000-0000-4000-8000-000000000001'
  );
  if v_result <> 'resolution_not_ready' then
    raise exception 'incomplete resolution must fail closed, got %', v_result;
  end if;

  v_result := public.complete_pending_setup_conversation(
    'e1096000-0000-4000-8000-000000000012',
    'e1096000-0000-4000-8000-000000000001'
  );
  if v_result <> 'account_not_allowed' then
    raise exception 'another owner must be rejected, got %', v_result;
  end if;

  if not exists (
    select 1 from public.accounts
    where id = 'e1096000-0000-4000-8000-000000000011'
      and status = 'active'
      and setup_completed_at is not null
  ) or not exists (
    select 1 from public.pending_setup_conversations
    where account_id = 'e1096000-0000-4000-8000-000000000011'
      and completed_at is not null
      and completion_mode = 'official'
  ) then
    raise exception 'official completion must activate the account and discriminate the conversation';
  end if;

  if not exists (
    select 1 from public.accounts
    where id = 'e1096000-0000-4000-8000-000000000012'
      and status = 'active'
      and setup_completed_at is not null
  ) or not exists (
    select 1 from public.pending_setup_conversations
    where account_id = 'e1096000-0000-4000-8000-000000000012'
      and completed_at is not null
      and completion_mode = 'fallback'
  ) then
    raise exception 'fallback completion must activate the account and discriminate the conversation';
  end if;

  if not exists (
    select 1 from public.accounts
    where id = 'e1096000-0000-4000-8000-000000000013'
      and status = 'pending_setup'
      and setup_completed_at is null
  ) then
    raise exception 'incomplete account must remain pending setup';
  end if;

  select count(*) into v_entitlements_after
  from public.account_commercial_entitlements
  where account_id in (
    'e1096000-0000-4000-8000-000000000011',
    'e1096000-0000-4000-8000-000000000012'
  );
  if v_entitlements_after <> v_entitlements_before then
    raise exception 'pending setup completion must not write commercial entitlements';
  end if;
end;
$$;

rollback;
