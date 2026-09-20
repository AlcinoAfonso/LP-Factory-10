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
  begin_result jsonb;
  write_result text;
  lease_version bigint;
  expected_revision timestamptz;
  failed_before integer;
  failed_after integer;
begin
  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'consultoria para clínicas',
    'business_description',
    null
  );
  if begin_result ->> 'status' <> 'created'
    or (begin_result ->> 'lease_version')::bigint <> 1
  then
    raise exception 'first turn must be created with lease 1, got %', begin_result;
  end if;

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'consultoria para clínicas',
    'business_description',
    null
  );
  if begin_result ->> 'status' <> 'in_progress'
    or begin_result ? 'lease_version'
  then
    raise exception 'recent pending retry must return in_progress without lease, got %', begin_result;
  end if;

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000024',
    'contabilidade para clínicas',
    'business_description',
    null
  );
  if begin_result ->> 'status' <> 'in_progress'
    or begin_result ? 'lease_version'
  then
    raise exception 'different concurrent turn must remain in progress without lease, got %', begin_result;
  end if;
  if exists (
    select 1 from public.pending_setup_conversation_turns
    where account_id = 'e1095000-0000-4000-8000-000000000011'
      and id = 'e1095000-0000-4000-8000-000000000024'
  ) then
    raise exception 'in-progress concurrent turn must not be persisted';
  end if;

  write_result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000021',
    1,
    'failed',
    'failure',
    'Não foi possível concluir este turno. Você pode tentar novamente.',
    'provider_timeout'
  );
  if write_result <> 'saved' then
    raise exception 'current lease must be allowed to fail its turn, got %', write_result;
  end if;

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000021',
    'consultoria para clínicas',
    'business_description',
    null
  );
  lease_version := (begin_result ->> 'lease_version')::bigint;
  if begin_result ->> 'status' <> 'resumed' or lease_version <> 2 then
    raise exception 'same-turn retry must increment the lease atomically, got %', begin_result;
  end if;

  write_result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000021',
    1,
    'failed',
    'failure',
    'writer antigo',
    'late_writer'
  );
  if write_result <> 'lease_lost' then
    raise exception 'old attempt must lose the lease, got %', write_result;
  end if;

  write_result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000021',
    lease_version,
    'completed',
    'awaiting_confirmation',
    'Preciso da sua confirmação para continuar.',
    null
  );
  if write_result <> 'saved' then
    raise exception 'current retry lease must complete, got %', write_result;
  end if;
  if not exists (
    select 1 from public.pending_setup_conversation_turns as turn_row
    where turn_row.account_id = 'e1095000-0000-4000-8000-000000000011'
      and turn_row.id = 'e1095000-0000-4000-8000-000000000021'
      and turn_row.lease_version = 2
      and turn_row.status = 'completed'
      and turn_row.failure_code is null
  ) then
    raise exception 'late writer must not alter the valid completion';
  end if;

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000002',
    'e1095000-0000-4000-8000-000000000021',
    'loja de roupas',
    'business_description',
    null
  );
  if begin_result ->> 'status' <> 'created' then
    raise exception 'same turn id must remain isolated across accounts, got %', begin_result;
  end if;

  update public.pending_setup_conversation_turns
  set attempted_at = now() - interval '61 seconds'
  where account_id = 'e1095000-0000-4000-8000-000000000012'
    and id = 'e1095000-0000-4000-8000-000000000021';

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000002',
    'e1095000-0000-4000-8000-000000000024',
    'roupas sob medida',
    'clarification',
    null
  );
  if begin_result ->> 'status' <> 'created' then
    raise exception 'different expired turn must be superseded, got %', begin_result;
  end if;
  if not exists (
    select 1 from public.pending_setup_conversation_turns
    where account_id = 'e1095000-0000-4000-8000-000000000012'
      and id = 'e1095000-0000-4000-8000-000000000021'
      and status = 'failed'
      and failure_code = 'stale_turn_superseded'
  ) then
    raise exception 'superseded expired turn must remain failed history';
  end if;

  write_result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000021',
    1,
    'failed',
    'failure',
    'writer superseded',
    'late_writer'
  );
  if write_result <> 'turn_not_current' then
    raise exception 'superseded different turn must not write, got %', write_result;
  end if;

  write_result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000024',
    1,
    'completed',
    'awaiting_confirmation',
    'Preciso da sua confirmação para continuar.',
    null
  );
  if write_result <> 'saved' then
    raise exception 'replacement turn must complete, got %', write_result;
  end if;

  insert into public.account_niche_resolutions (
    account_id, raw_input, selected_taxon_id, confidence,
    should_use_deterministic_match, should_escalate_to_ai, ai_escalation_mode,
    needs_admin_review, reason, resolution_status, user_resolution_status
  ) values (
    'e1095000-0000-4000-8000-000000000011', 'consultoria para clínicas', null,
    'low', false, true, 'suggest_new_taxon_for_review', true,
    'low_confidence_insufficient_score', 'unclassified', 'pending_confirmation'
  );

  select updated_at into expected_revision
  from public.account_niche_resolutions
  where account_id = 'e1095000-0000-4000-8000-000000000011';

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000030',
    'Opção oficial A',
    'official_confirmation',
    expected_revision
  );
  if begin_result ->> 'status' <> 'created' then
    raise exception 'first confirmation on the shared revision must start, got %', begin_result;
  end if;

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000031',
    'Opção oficial B',
    'official_confirmation',
    expected_revision
  );
  if begin_result ->> 'status' <> 'in_progress'
    or begin_result ? 'lease_version'
  then
    raise exception 'second confirmation on the same revision must wait without lease, got %', begin_result;
  end if;

  write_result := public.complete_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000030',
    1,
    'completed',
    'ready_official',
    'Entendimento confirmado: Opção oficial A.',
    null
  );
  if write_result <> 'saved' then
    raise exception 'winning confirmation turn must complete, got %', write_result;
  end if;
  expected_revision := expected_revision - interval '1 millisecond';

  select count(*) into failed_before
  from public.pending_setup_conversation_turns
  where account_id = 'e1095000-0000-4000-8000-000000000011'
    and status = 'failed';

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000031',
    'Opção oficial B',
    'official_confirmation',
    expected_revision
  );
  if begin_result ->> 'status' <> 'stale_context' then
    raise exception 'losing confirmation must observe stale_context, got %', begin_result;
  end if;

  select updated_at into expected_revision
  from public.account_niche_resolutions
  where account_id = 'e1095000-0000-4000-8000-000000000011';
  expected_revision := expected_revision - interval '1 millisecond';

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000011',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000032',
    'novo detalhe concorrente',
    'clarification',
    expected_revision
  );
  if begin_result ->> 'status' <> 'stale_context' then
    raise exception 'clarification on a stale revision must reload context, got %', begin_result;
  end if;

  if exists (
    select 1 from public.pending_setup_conversation_turns
    where account_id = 'e1095000-0000-4000-8000-000000000011'
      and id in (
        'e1095000-0000-4000-8000-000000000031',
        'e1095000-0000-4000-8000-000000000032'
      )
  ) then
    raise exception 'stale context must not insert a turn';
  end if;

  select count(*) into failed_after
  from public.pending_setup_conversation_turns
  where account_id = 'e1095000-0000-4000-8000-000000000011'
    and status = 'failed';
  if failed_after <> failed_before then
    raise exception 'technical stale contexts must not create failed turns';
  end if;

  begin_result := public.begin_pending_setup_conversation_turn(
    'e1095000-0000-4000-8000-000000000012',
    'e1095000-0000-4000-8000-000000000001',
    'e1095000-0000-4000-8000-000000000022',
    'tentativa de outro owner',
    'business_description',
    null
  );
  if begin_result ->> 'status' <> 'account_not_allowed' then
    raise exception 'owner mismatch must fail closed, got %', begin_result;
  end if;
end;
$$;

rollback;
