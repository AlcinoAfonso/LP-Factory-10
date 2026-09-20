begin;
set local search_path = public, pg_catalog;

insert into auth.users (id, aud, role, email, created_at, updated_at)
values ('e1097000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e10.9.7-owner@example.com', now(), now());

insert into public.accounts (id, name, subdomain, slug, status, owner_user_id)
values
  ('e1097000-0000-4000-8000-000000000011', 'E10.9.7 official replacement', 'e10-9-7-official', 'e10-9-7-official', 'pending_setup', 'e1097000-0000-4000-8000-000000000001'),
  ('e1097000-0000-4000-8000-000000000012', 'E10.9.7 fallback replacement', 'e10-9-7-fallback', 'e10-9-7-fallback', 'pending_setup', 'e1097000-0000-4000-8000-000000000001'),
  ('e1097000-0000-4000-8000-000000000013', 'E10.9.7 valid primary', 'e10-9-7-valid', 'e10-9-7-valid', 'pending_setup', 'e1097000-0000-4000-8000-000000000001');

insert into public.account_users (account_id, user_id, role, status)
values
  ('e1097000-0000-4000-8000-000000000011', 'e1097000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e1097000-0000-4000-8000-000000000012', 'e1097000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('e1097000-0000-4000-8000-000000000013', 'e1097000-0000-4000-8000-000000000001', 'owner', 'active');

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
  ('e1097000-0000-4000-8000-000000000013', 'descricao valida', 'e1097000-0000-4000-8000-000000000034', 'high', true, false, 'none', false, 'high_confidence_strong_match', 'deterministic_high_confidence', 'confirmed', 'e1097000-0000-4000-8000-000000000034', now());

insert into public.account_taxonomy (account_id, taxon_id, is_primary, status, source_type)
values
  ('e1097000-0000-4000-8000-000000000011', 'e1097000-0000-4000-8000-000000000031', true, 'active', 'taxonomy_match'),
  ('e1097000-0000-4000-8000-000000000012', 'e1097000-0000-4000-8000-000000000033', true, 'active', 'taxonomy_match'),
  ('e1097000-0000-4000-8000-000000000013', 'e1097000-0000-4000-8000-000000000034', true, 'active', 'taxonomy_match');

insert into public.pending_setup_conversations (account_id, owner_user_id)
values ('e1097000-0000-4000-8000-000000000012', 'e1097000-0000-4000-8000-000000000001');

do $$
declare
  v_result text;
begin
  v_result := public.retire_stale_pending_setup_primary('e1097000-0000-4000-8000-000000000013');
  if v_result <> 'primary_still_usable' then
    raise exception 'valid active primary must remain blocked, got %', v_result;
  end if;

  v_result := public.retire_stale_pending_setup_primary('e1097000-0000-4000-8000-000000000011');
  if v_result <> 'retired' then
    raise exception 'stale official primary must retire, got %', v_result;
  end if;

  update public.account_niche_resolutions
  set
    raw_input = 'descricao substituta oficial',
    selected_taxon_id = 'e1097000-0000-4000-8000-000000000032',
    user_resolution_status = 'pending_confirmation',
    user_selected_taxon_id = null,
    user_confirmed_at = null
  where account_id = 'e1097000-0000-4000-8000-000000000011';

  v_result := public.confirm_pending_setup_niche_resolution_taxon(
    'e1097000-0000-4000-8000-000000000011',
    'e1097000-0000-4000-8000-000000000032'
  );
  if v_result <> 'saved' then
    raise exception 'replacement official taxon must be confirmable, got %', v_result;
  end if;

  v_result := public.retire_stale_pending_setup_primary('e1097000-0000-4000-8000-000000000012');
  if v_result <> 'retired' then
    raise exception 'stale fallback primary must retire, got %', v_result;
  end if;

  update public.account_niche_resolutions
  set
    raw_input = 'descricao substituta fallback',
    selected_taxon_id = null,
    user_resolution_status = 'confirmed',
    user_selected_taxon_id = null,
    user_rewrite_input = 'descricao substituta fallback',
    user_confirmed_at = now()
  where account_id = 'e1097000-0000-4000-8000-000000000012';

  insert into public.pending_setup_conversation_turns (
    account_id, id, user_message, turn_kind, status, product_state,
    product_message, completed_at
  ) values (
    'e1097000-0000-4000-8000-000000000012',
    'e1097000-0000-4000-8000-000000000021',
    'descricao substituta fallback',
    'fallback_confirmation',
    'completed',
    'ready_fallback',
    'Entendimento operacional confirmado: descricao substituta fallback.',
    now()
  );

  v_result := public.complete_pending_setup_conversation(
    'e1097000-0000-4000-8000-000000000012',
    'e1097000-0000-4000-8000-000000000001'
  );
  if v_result <> 'saved' then
    raise exception 'replacement fallback must complete, got %', v_result;
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
end;
$$;

rollback;
