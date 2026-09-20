begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e1097000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e10.9.7-owner@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status, owner_user_id)
values
  ('e1097000-0000-4000-8000-000000000011', 'E10.9.7 official replacement', 'e10-9-7-official', 'e10-9-7-official', 'pending_setup', 'e1097000-0000-4000-8000-000000000001'),
  ('e1097000-0000-4000-8000-000000000012', 'E10.9.7 fallback replacement', 'e10-9-7-fallback', 'e10-9-7-fallback', 'pending_setup', 'e1097000-0000-4000-8000-000000000001'),
  ('e1097000-0000-4000-8000-000000000013', 'E10.9.7 valid primary', 'e10-9-7-valid', 'e10-9-7-valid', 'pending_setup', 'e1097000-0000-4000-8000-000000000001'),
  ('e1097000-0000-4000-8000-000000000014', 'E10.9.7 superseded turn', 'e10-9-7-superseded', 'e10-9-7-superseded', 'pending_setup', 'e1097000-0000-4000-8000-000000000001');

insert into public.account_users (account_id, user_id, role, status)
select id, 'e1097000-0000-4000-8000-000000000001', 'owner', 'active'
from public.accounts
where id in (
  'e1097000-0000-4000-8000-000000000011',
  'e1097000-0000-4000-8000-000000000012',
  'e1097000-0000-4000-8000-000000000013',
  'e1097000-0000-4000-8000-000000000014'
);

insert into public.business_taxons (id, parent_id, level, name, slug, is_active)
values
  ('e1097000-0000-4000-8000-000000000031', null, 'niche', 'Taxon obsoleto oficial', 'taxon-obsoleto-oficial', false),
  ('e1097000-0000-4000-8000-000000000032', null, 'niche', 'Taxon substituto oficial', 'taxon-substituto-oficial', true),
  ('e1097000-0000-4000-8000-000000000033', null, 'niche', 'Taxon obsoleto fallback', 'taxon-obsoleto-fallback', false),
  ('e1097000-0000-4000-8000-000000000034', null, 'niche', 'Taxon primario valido', 'taxon-primario-valido', true);

insert into public.account_niche_resolutions (
  account_id, raw_input, selected_taxon_id, confidence,
  should_use_deterministic_match, should_escalate_to_ai, ai_escalation_mode,
  needs_admin_review, reason, resolution_status, user_resolution_status,
  user_selected_taxon_id, user_confirmed_at
)
values
  ('e1097000-0000-4000-8000-000000000011', 'descricao obsoleta oficial', 'e1097000-0000-4000-8000-000000000031', 'high', true, false, 'none', false, 'high_confidence_strong_match', 'deterministic_high_confidence', 'confirmed', 'e1097000-0000-4000-8000-000000000031', now()),
  ('e1097000-0000-4000-8000-000000000012', 'descricao obsoleta fallback', 'e1097000-0000-4000-8000-000000000033', 'high', true, false, 'none', false, 'high_confidence_strong_match', 'deterministic_high_confidence', 'confirmed', 'e1097000-0000-4000-8000-000000000033', now()),
  ('e1097000-0000-4000-8000-000000000013', 'descricao valida', 'e1097000-0000-4000-8000-000000000034', 'high', true, false, 'none', false, 'high_confidence_strong_match', 'deterministic_high_confidence', 'confirmed', 'e1097000-0000-4000-8000-000000000034', now()),
  ('e1097000-0000-4000-8000-000000000014', 'estado preservado', null, 'low', false, true, 'suggest_new_taxon_for_review', true, 'low_confidence_insufficient_score', 'unclassified', 'pending_confirmation', null, null);

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values
  ('e1097000-0000-4000-8000-000000000011', 'e1097000-0000-4000-8000-000000000031', true, 'active', 'taxonomy_match'),
  ('e1097000-0000-4000-8000-000000000012', 'e1097000-0000-4000-8000-000000000033', true, 'active', 'taxonomy_match'),
  ('e1097000-0000-4000-8000-000000000013', 'e1097000-0000-4000-8000-000000000034', true, 'active', 'taxonomy_match');

insert into public.pending_setup_conversations (account_id, owner_user_id)
select id, 'e1097000-0000-4000-8000-000000000001'
from public.accounts
where id in (
  'e1097000-0000-4000-8000-000000000011',
  'e1097000-0000-4000-8000-000000000012',
  'e1097000-0000-4000-8000-000000000013',
  'e1097000-0000-4000-8000-000000000014'
);

insert into public.pending_setup_conversation_turns (account_id, id, user_message, turn_kind, attempted_at)
values
  ('e1097000-0000-4000-8000-000000000011', 'e1097000-0000-4000-8000-000000000021', 'descricao substituta oficial', 'business_description', now()),
  ('e1097000-0000-4000-8000-000000000012', 'e1097000-0000-4000-8000-000000000022', 'descricao substituta fallback', 'business_description', now()),
  ('e1097000-0000-4000-8000-000000000013', 'e1097000-0000-4000-8000-000000000023', 'tentativa indevida', 'business_description', now()),
  ('e1097000-0000-4000-8000-000000000014', 'e1097000-0000-4000-8000-000000000024', 'turno abandonado', 'business_description', now() - interval '61 seconds');

do $$
declare
  v_result text;
begin
  v_result := public.upsert_pending_setup_niche_resolution_for_turn(
    'e1097000-0000-4000-8000-000000000013',
    'e1097000-0000-4000-8000-000000000023',
    'tentativa indevida', null, 'low', false, true,
    'suggest_new_taxon_for_review', true, 'low_confidence_insufficient_score',
    'unclassified', 'none', null
  );
  if v_result <> 'already_finalized' then
    raise exception 'confirmed deterministic resolution with a valid primary must remain finalized, got %', v_result;
  end if;
  if not exists (
    select 1 from public.account_niche_resolutions
    where account_id = 'e1097000-0000-4000-8000-000000000013'
      and raw_input = 'descricao valida'
      and user_resolution_status = 'confirmed'
  ) or not exists (
    select 1 from public.account_taxonomy
    where account_id = 'e1097000-0000-4000-8000-000000000013'
      and taxon_id = 'e1097000-0000-4000-8000-000000000034'
      and is_primary = true
      and status = 'active'
  ) then
    raise exception 'valid confirmed resolution and primary must remain unchanged';
  end if;

  v_result := public.upsert_pending_setup_niche_resolution_for_turn(
    'e1097000-0000-4000-8000-000000000011',
    'e1097000-0000-4000-8000-000000000021',
    'descricao substituta oficial', 'e1097000-0000-4000-8000-000000000032',
    'high', true, false, 'none', false, 'high_confidence_strong_match',
    'deterministic_high_confidence', 'exact_alias', 1
  );
  if v_result <> 'saved' then
    raise exception 'stale official primary must allow a leased replacement, got %', v_result;
  end if;
  v_result := public.confirm_pending_setup_niche_resolution_taxon(
    'e1097000-0000-4000-8000-000000000011',
    'e1097000-0000-4000-8000-000000000021',
    'e1097000-0000-4000-8000-000000000032'
  );
  if v_result <> 'saved' then
    raise exception 'replacement official taxon must be confirmable by the current turn, got %', v_result;
  end if;

  v_result := public.upsert_pending_setup_niche_resolution_for_turn(
    'e1097000-0000-4000-8000-000000000012',
    'e1097000-0000-4000-8000-000000000022',
    'descricao substituta fallback', null, 'low', false, true,
    'suggest_new_taxon_for_review', true, 'low_confidence_insufficient_score',
    'unclassified', 'none', null
  );
  if v_result <> 'saved' then
    raise exception 'stale fallback primary must allow a leased replacement, got %', v_result;
  end if;
  v_result := public.update_pending_setup_niche_resolution_ai_for_turn(
    'e1097000-0000-4000-8000-000000000012',
    'e1097000-0000-4000-8000-000000000022',
    'descricao substituta fallback', 'resolved', null, 'test-model', '1',
    jsonb_build_object('mode', 'fallback_review'), 'fallback_review', null, null,
    true, true, 'fallback_review_required'
  );
  if v_result <> 'saved' then
    raise exception 'fallback AI result must be saved by the current turn, got %', v_result;
  end if;
  v_result := public.confirm_pending_setup_operational_choice_for_turn(
    'e1097000-0000-4000-8000-000000000012',
    'e1097000-0000-4000-8000-000000000022',
    'descricao substituta fallback'
  );
  if v_result <> 'saved' then
    raise exception 'replacement fallback must be confirmable by the current turn, got %', v_result;
  end if;

  if exists (
    select 1 from public.account_taxonomy
    where account_id in (
      'e1097000-0000-4000-8000-000000000011',
      'e1097000-0000-4000-8000-000000000012'
    )
      and taxon_id in (
        'e1097000-0000-4000-8000-000000000031',
        'e1097000-0000-4000-8000-000000000033'
      )
      and (is_primary = true or status <> 'inactive')
  ) then
    raise exception 'stale primary links must remain retired';
  end if;

  v_result := public.begin_pending_setup_conversation_turn(
    'e1097000-0000-4000-8000-000000000014',
    'e1097000-0000-4000-8000-000000000001',
    'e1097000-0000-4000-8000-000000000025',
    'turno atual',
    'clarification'
  );
  if v_result <> 'created' then
    raise exception 'a truly abandoned turn must be superseded, got %', v_result;
  end if;

  v_result := public.upsert_pending_setup_niche_resolution_for_turn(
    'e1097000-0000-4000-8000-000000000014',
    'e1097000-0000-4000-8000-000000000024',
    'mutacao obsoleta', null, 'low', false, true,
    'suggest_new_taxon_for_review', true, 'low_confidence_insufficient_score',
    'unclassified', 'none', null
  );
  if v_result <> 'turn_not_current' then
    raise exception 'superseded turn must not upsert the resolution, got %', v_result;
  end if;
  v_result := public.update_pending_setup_niche_resolution_ai_for_turn(
    'e1097000-0000-4000-8000-000000000014',
    'e1097000-0000-4000-8000-000000000024',
    'estado preservado', 'resolved', null, 'stale-model', '1', '{}'::jsonb,
    'fallback_review', null, null, true, true, 'stale_write'
  );
  if v_result <> 'turn_not_current' then
    raise exception 'superseded turn must not save an AI result, got %', v_result;
  end if;
  v_result := public.confirm_pending_setup_operational_choice_for_turn(
    'e1097000-0000-4000-8000-000000000014',
    'e1097000-0000-4000-8000-000000000024',
    'estado preservado'
  );
  if v_result <> 'turn_not_current' then
    raise exception 'superseded turn must not confirm an operational label, got %', v_result;
  end if;
  v_result := public.confirm_pending_setup_niche_resolution_taxon(
    'e1097000-0000-4000-8000-000000000014',
    'e1097000-0000-4000-8000-000000000024',
    'e1097000-0000-4000-8000-000000000032'
  );
  if v_result <> 'turn_not_current' then
    raise exception 'superseded turn must not confirm a taxon, got %', v_result;
  end if;
  if not exists (
    select 1 from public.account_niche_resolutions
    where account_id = 'e1097000-0000-4000-8000-000000000014'
      and raw_input = 'estado preservado'
      and ai_status is null
      and user_resolution_status = 'pending_confirmation'
  ) then
    raise exception 'superseded writes must leave the canonical resolution unchanged';
  end if;

  v_result := public.upsert_pending_setup_niche_resolution_for_turn(
    'e1097000-0000-4000-8000-000000000014',
    'e1097000-0000-4000-8000-000000000025',
    'turno atual', null, 'low', false, true,
    'suggest_new_taxon_for_review', true, 'low_confidence_insufficient_score',
    'unclassified', 'none', null
  );
  if v_result <> 'saved' then
    raise exception 'the replacement turn must own the canonical write lease, got %', v_result;
  end if;
end;
$$;

rollback;
