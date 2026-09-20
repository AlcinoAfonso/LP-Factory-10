begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('e1095000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e10.9.5-owner-one@example.com', now(), now()),
  ('e1095000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'e10.9.5-owner-two@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status, owner_user_id)
values
  ('e1095000-0000-4000-8000-000000000011', 'E10.9.5 account one', 'e10-9-5-account-one', 'e10-9-5-account-one', 'pending_setup', 'e1095000-0000-4000-8000-000000000001'),
  ('e1095000-0000-4000-8000-000000000012', 'E10.9.5 account two', 'e10-9-5-account-two', 'e10-9-5-account-two', 'pending_setup', 'e1095000-0000-4000-8000-000000000002');

do $$
declare
  result text;
begin
  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'consultoria para clínicas',
    'business_description'
  );
  if result <> 'created' then
    raise exception 'first turn must be created, got %', result;
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'consultoria para clínicas',
    'business_description'
  );
  if result <> 'in_progress' then
    raise exception 'concurrent retry must remain in progress, got %', result;
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000024',
    'contabilidade para clínicas',
    'business_description'
  );
  if result <> 'in_progress' then
    raise exception 'a different concurrent turn must be serialized, got %', result;
  end if;
  if exists (
    select 1
    from public.pending_setup_conversation_turns
    where account_id = 'e1095000-0000-4000-8000-000000000011'
      and id = 'e1095000-0000-4000-8000-000000000024'
  ) then
    raise exception 'a serialized concurrent turn must not be persisted';
  end if;

  result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000021',
    'failed',
    'failure',
    'Não foi possível concluir este turno. Você pode tentar novamente.',
    'provider_timeout'
  );
  if result <> 'saved' then
    raise exception 'failed AI turn must be saved, got %', result;
  end if;

  if not exists (
    select 1
    from public.pending_setup_conversation_turns
    where account_id = 'e1095000-0000-4000-8000-000000000011'
      and id = 'e1095000-0000-4000-8000-000000000021'
      and user_message = 'consultoria para clínicas'
      and status = 'failed'
      and failure_code = 'provider_timeout'
  ) then
    raise exception 'failed AI turn must preserve the user speech';
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'consultoria para clínicas',
    'business_description'
  );
  if result <> 'resumed' then
    raise exception 'failed turn retry must resume, got %', result;
  end if;

  result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000021',
    'completed',
    'awaiting_confirmation',
    'Preciso da sua confirmação para continuar.',
    null
  );
  if result <> 'saved' then
    raise exception 'resumed turn must complete, got %', result;
  end if;

  result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000021',
    'completed',
    'awaiting_confirmation',
    'Preciso da sua confirmação para continuar.',
    null
  );
  if result <> 'saved' then
    raise exception 'identical completion retry must be idempotent, got %', result;
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'mensagem divergente',
    'clarification'
  );
  if result <> 'turn_id_reused' then
    raise exception 'divergent turn id reuse must fail closed, got %', result;
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000002',
    'e1095000-0000-4000-8000-000000000021',
    'loja de roupas',
    'business_description'
  );
  if result <> 'created' then
    raise exception 'same turn id must remain isolated across accounts, got %', result;
  end if;

  update public.pending_setup_conversation_turns
  set attempted_at = now() - interval '61 seconds'
  where account_id = 'e1095000-0000-4000-8000-000000000012'
    and id = 'e1095000-0000-4000-8000-000000000021';

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000002',
    'e1095000-0000-4000-8000-000000000024',
    'roupas sob medida',
    'clarification'
  );
  if result <> 'created' then
    raise exception 'a stale pending turn must be retired before a new turn, got %', result;
  end if;
  if not exists (
    select 1
    from public.pending_setup_conversation_turns
    where account_id = 'e1095000-0000-4000-8000-000000000012'
      and id = 'e1095000-0000-4000-8000-000000000021'
      and status = 'failed'
      and failure_code = 'stale_turn_superseded'
  ) then
    raise exception 'the stale pending turn must remain as failed history';
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000022',
    'tentativa de outro owner',
    'business_description'
  );
  if result <> 'account_not_allowed' then
    raise exception 'owner mismatch must fail closed, got %', result;
  end if;

  result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000023',
    repeat('x', 500),
    'business_description'
  );
  if result <> 'created' then
    raise exception 'maximum-length turn must be created, got %', result;
  end if;

  result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000023',
    'completed',
    'ready_fallback',
    'Entendimento operacional confirmado: ' || repeat('x', 500) || '.',
    null
  );
  if result <> 'saved' then
    raise exception 'maximum-length fallback message must be saved, got %', result;
  end if;
end;
$$;

update public.pending_setup_conversations
set completed_at = now(), completion_mode = 'official'
where account_id = 'e1095000-0000-4000-8000-000000000011';

do $$
begin
  if not exists (
    select 1
    from public.pending_setup_conversations
    where account_id = 'e1095000-0000-4000-8000-000000000011'
      and completed_at is not null
      and completion_mode = 'official'
  ) then
    raise exception 'completion discriminator must persist';
  end if;

  begin
    update public.pending_setup_conversations
    set completion_mode = null
    where account_id = 'e1095000-0000-4000-8000-000000000011';
    raise exception 'completion timestamp without mode should have been rejected';
  exception when check_violation then
    null;
  end;

  if (
    select count(*)
    from public.pending_setup_conversation_turns
    where id = 'e1095000-0000-4000-8000-000000000021'
  ) <> 2 then
    raise exception 'turn history must remain isolated by account';
  end if;
end;
$$;

rollback;
