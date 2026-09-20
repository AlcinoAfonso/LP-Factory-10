begin;

create table public.pending_setup_conversations (
  account_id uuid primary key
    references public.accounts(id) on update cascade on delete cascade,
  owner_user_id uuid not null
    references auth.users(id) on update cascade on delete restrict,
  completed_at timestamptz null,
  completion_mode text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_setup_conversations_completion_mode_chk
    check (completion_mode is null or completion_mode in ('official', 'fallback')),
  constraint pending_setup_conversations_completion_pair_chk
    check ((completed_at is null) = (completion_mode is null))
);

create table public.pending_setup_conversation_turns (
  account_id uuid not null,
  id uuid not null,
  user_message text not null,
  turn_kind text not null,
  status text not null default 'pending',
  product_state text null,
  product_message text null,
  failure_code text null,
  attempted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint pending_setup_conversation_turns_pkey primary key (account_id, id),
  constraint pending_setup_conversation_turns_account_fkey
    foreign key (account_id)
    references public.pending_setup_conversations(account_id)
    on update cascade on delete cascade,
  constraint pending_setup_conversation_turns_user_message_chk
    check (user_message = btrim(user_message) and char_length(user_message) between 1 and 500),
  constraint pending_setup_conversation_turns_kind_chk
    check (turn_kind in ('business_description', 'clarification', 'official_confirmation', 'operational_confirmation', 'fallback_confirmation')),
  constraint pending_setup_conversation_turns_status_chk
    check (status in ('pending', 'completed', 'failed')),
  constraint pending_setup_conversation_turns_product_state_chk
    check (product_state is null or product_state in ('awaiting_confirmation', 'ready_official', 'ready_fallback', 'failure')),
  constraint pending_setup_conversation_turns_failure_shape_chk
    check (
      (status = 'pending' and completed_at is null and product_state is null and product_message is null and failure_code is null)
      or (status = 'completed' and completed_at is not null and product_state is not null and product_message is not null and failure_code is null)
      or (status = 'failed' and completed_at is not null and product_state = 'failure' and product_message is not null and failure_code is not null)
    ),
  constraint pending_setup_conversation_turns_product_message_chk
    check (product_message is null or (product_message = btrim(product_message) and char_length(product_message) between 1 and 600)),
  constraint pending_setup_conversation_turns_failure_code_chk
    check (failure_code is null or (failure_code = btrim(failure_code) and char_length(failure_code) between 1 and 80))
);

create index pending_setup_conversation_turns_account_created_idx
  on public.pending_setup_conversation_turns (account_id, created_at, id);

alter table public.pending_setup_conversations enable row level security;
alter table public.pending_setup_conversation_turns enable row level security;

revoke all on table public.pending_setup_conversations from public, anon, authenticated;
revoke all on table public.pending_setup_conversation_turns from public, anon, authenticated;
grant select, insert, update on table public.pending_setup_conversations to service_role;
grant select, insert, update on table public.pending_setup_conversation_turns to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.pending_setup_conversations from ai_readonly';
    execute 'revoke all on table public.pending_setup_conversation_turns from ai_readonly';
  end if;
end
$$;

create trigger pending_setup_conversations_set_updated_at
before update on public.pending_setup_conversations
for each row execute function public.tg_set_updated_at();

create or replace function public.begin_pending_setup_conversation_turn(
  p_account_id uuid,
  p_owner_user_id uuid,
  p_turn_id uuid,
  p_user_message text,
  p_turn_kind text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account record;
  v_conversation_owner uuid;
  v_inserted_count integer;
  v_turn record;
begin
  select owner_user_id, status
  into v_account
  from public.accounts
  where id = p_account_id
  for update;

  if not found
    or v_account.status is distinct from 'pending_setup'
    or v_account.owner_user_id is distinct from p_owner_user_id
  then
    return 'account_not_allowed';
  end if;

  insert into public.pending_setup_conversations (account_id, owner_user_id)
  values (p_account_id, p_owner_user_id)
  on conflict (account_id) do nothing;

  select owner_user_id
  into v_conversation_owner
  from public.pending_setup_conversations
  where account_id = p_account_id
  for update;

  if v_conversation_owner is distinct from p_owner_user_id then
    return 'conversation_owner_mismatch';
  end if;

  update public.pending_setup_conversation_turns
  set
    status = 'failed',
    product_state = 'failure',
    product_message = 'Não foi possível concluir este turno. Você pode tentar novamente.',
    failure_code = 'stale_turn_superseded',
    completed_at = now()
  where account_id = p_account_id
    and id <> p_turn_id
    and status = 'pending'
    and attempted_at <= now() - interval '60 seconds';

  if exists (
    select 1
    from public.pending_setup_conversation_turns
    where account_id = p_account_id
      and id <> p_turn_id
      and status = 'pending'
  ) then
    return 'in_progress';
  end if;

  insert into public.pending_setup_conversation_turns (
    account_id,
    id,
    user_message,
    turn_kind
  )
  values (
    p_account_id,
    p_turn_id,
    btrim(p_user_message),
    p_turn_kind
  )
  on conflict (account_id, id) do nothing;

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count = 1 then
    return 'created';
  end if;

  select user_message, turn_kind, status, attempted_at
  into v_turn
  from public.pending_setup_conversation_turns
  where account_id = p_account_id
    and id = p_turn_id
  for update;

  if v_turn.user_message is distinct from btrim(p_user_message)
    or v_turn.turn_kind is distinct from p_turn_kind
  then
    return 'turn_id_reused';
  end if;

  if v_turn.status = 'completed' then
    return 'completed';
  end if;

  if v_turn.status = 'pending'
    and v_turn.attempted_at > now() - interval '60 seconds'
  then
    return 'in_progress';
  end if;

  update public.pending_setup_conversation_turns
  set
    status = 'pending',
    product_state = null,
    product_message = null,
    failure_code = null,
    attempted_at = now(),
    completed_at = null
  where account_id = p_account_id
    and id = p_turn_id;

  return 'resumed';
end;
$$;

create or replace function public.lock_current_pending_setup_turn(
  p_account_id uuid,
  p_turn_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_turn record;
begin
  perform 1
  from public.pending_setup_conversations
  where account_id = p_account_id
  for update;
  if not found then
    return false;
  end if;

  select id, status
  into v_turn
  from public.pending_setup_conversation_turns
  where account_id = p_account_id
  order by created_at desc, id desc
  limit 1
  for update;

  return found
    and v_turn.id = p_turn_id
    and v_turn.status = 'pending';
end;
$$;

create or replace function public.upsert_pending_setup_niche_resolution_for_turn(
  p_account_id uuid,
  p_turn_id uuid,
  p_raw_input text,
  p_selected_taxon_id uuid,
  p_confidence text,
  p_should_use_deterministic_match boolean,
  p_should_escalate_to_ai boolean,
  p_ai_escalation_mode text,
  p_needs_admin_review boolean,
  p_reason text,
  p_resolution_status text,
  p_match_source text,
  p_score numeric
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account_status text;
  v_existing_resolution record;
  v_primary_taxon_id uuid;
  v_primary_taxon_is_active boolean;
  v_updated_count integer;
begin
  select status
  into v_account_status
  from public.accounts
  where id = p_account_id
  for update;

  if v_account_status is distinct from 'pending_setup' then
    return 'account_not_pending_setup';
  end if;
  if not public.lock_current_pending_setup_turn(p_account_id, p_turn_id) then
    return 'turn_not_current';
  end if;

  select user_resolution_status, user_selected_taxon_id
  into v_existing_resolution
  from public.account_niche_resolutions
  where account_id = p_account_id
  for update;

  if found and v_existing_resolution.user_resolution_status in (
    'confirmed', 'rejected', 'rewritten', 'dismissed'
  ) then
    if v_existing_resolution.user_resolution_status <> 'confirmed'
      or v_existing_resolution.user_selected_taxon_id is null
    then
      return 'already_finalized';
    end if;

    select primary_link.taxon_id, taxon.is_active
    into v_primary_taxon_id, v_primary_taxon_is_active
    from public.account_taxonomy as primary_link
    left join public.business_taxons as taxon on taxon.id = primary_link.taxon_id
    where primary_link.account_id = p_account_id
      and primary_link.is_primary = true
      and primary_link.status = 'active'
    for update of primary_link;

    if found then
      if v_primary_taxon_id is distinct from v_existing_resolution.user_selected_taxon_id then
        return 'conflicting_primary';
      end if;
      if v_primary_taxon_is_active is true then
        return 'already_finalized';
      end if;

      update public.account_taxonomy
      set
        is_primary = false,
        status = 'inactive',
        updated_at = now()
      where account_id = p_account_id
        and taxon_id = v_primary_taxon_id
        and is_primary = true
        and status = 'active';

      get diagnostics v_updated_count = row_count;
      if v_updated_count <> 1 then
        raise exception 'pending setup stale primary changed concurrently';
      end if;
    end if;
  end if;

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
    match_source,
    score,
    ai_status,
    ai_error_code,
    ai_model,
    ai_schema_version,
    ai_result_json,
    ai_ux_mode,
    ai_suggested_taxon_id,
    ai_suggested_new_taxon_label,
    ai_needs_user_confirmation,
    ai_needs_admin_review,
    ai_reason,
    ai_processed_at,
    user_resolution_status,
    user_selected_taxon_id,
    user_rewrite_input,
    user_confirmed_at,
    user_rejected_at,
    user_dismissed_at
  ) values (
    p_account_id,
    btrim(p_raw_input),
    p_selected_taxon_id,
    p_confidence,
    p_should_use_deterministic_match,
    p_should_escalate_to_ai,
    p_ai_escalation_mode,
    p_needs_admin_review,
    p_reason,
    p_resolution_status,
    p_match_source,
    p_score,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    false,
    false,
    null,
    null,
    'pending_confirmation',
    null,
    null,
    null,
    null,
    null
  )
  on conflict (account_id) do update
  set
    raw_input = excluded.raw_input,
    selected_taxon_id = excluded.selected_taxon_id,
    confidence = excluded.confidence,
    should_use_deterministic_match = excluded.should_use_deterministic_match,
    should_escalate_to_ai = excluded.should_escalate_to_ai,
    ai_escalation_mode = excluded.ai_escalation_mode,
    needs_admin_review = excluded.needs_admin_review,
    reason = excluded.reason,
    resolution_status = excluded.resolution_status,
    match_source = excluded.match_source,
    score = excluded.score,
    ai_status = null,
    ai_error_code = null,
    ai_model = null,
    ai_schema_version = null,
    ai_result_json = null,
    ai_ux_mode = null,
    ai_suggested_taxon_id = null,
    ai_suggested_new_taxon_label = null,
    ai_needs_user_confirmation = false,
    ai_needs_admin_review = false,
    ai_reason = null,
    ai_processed_at = null,
    user_resolution_status = 'pending_confirmation',
    user_selected_taxon_id = null,
    user_rewrite_input = null,
    user_confirmed_at = null,
    user_rejected_at = null,
    user_dismissed_at = null,
    updated_at = now();

  return 'saved';
end;
$$;

create or replace function public.update_pending_setup_niche_resolution_ai_for_turn(
  p_account_id uuid,
  p_turn_id uuid,
  p_expected_raw_input text,
  p_ai_status text,
  p_ai_error_code text,
  p_ai_model text,
  p_ai_schema_version text,
  p_ai_result_json jsonb,
  p_ai_ux_mode text,
  p_ai_suggested_taxon_id uuid,
  p_ai_suggested_new_taxon_label text,
  p_ai_needs_user_confirmation boolean,
  p_ai_needs_admin_review boolean,
  p_ai_reason text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account_status text;
  v_updated_count integer;
begin
  select status
  into v_account_status
  from public.accounts
  where id = p_account_id
  for update;

  if v_account_status is distinct from 'pending_setup' then
    return 'account_not_pending_setup';
  end if;
  if not public.lock_current_pending_setup_turn(p_account_id, p_turn_id) then
    return 'turn_not_current';
  end if;

  update public.account_niche_resolutions
  set
    ai_status = p_ai_status,
    ai_error_code = p_ai_error_code,
    ai_model = p_ai_model,
    ai_schema_version = p_ai_schema_version,
    ai_result_json = p_ai_result_json,
    ai_ux_mode = p_ai_ux_mode,
    ai_suggested_taxon_id = p_ai_suggested_taxon_id,
    ai_suggested_new_taxon_label = p_ai_suggested_new_taxon_label,
    ai_needs_user_confirmation = p_ai_needs_user_confirmation,
    ai_needs_admin_review = p_ai_needs_admin_review,
    ai_reason = p_ai_reason,
    ai_processed_at = now(),
    updated_at = now()
  where account_id = p_account_id
    and raw_input = btrim(p_expected_raw_input);

  get diagnostics v_updated_count = row_count;
  return case when v_updated_count = 1 then 'saved' else 'stale_input' end;
end;
$$;

create or replace function public.confirm_pending_setup_operational_choice_for_turn(
  p_account_id uuid,
  p_turn_id uuid,
  p_label text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account_status text;
  v_resolution record;
  v_label text := btrim(p_label);
  v_updated_count integer;
begin
  select status
  into v_account_status
  from public.accounts
  where id = p_account_id
  for update;

  if v_account_status is distinct from 'pending_setup' then
    return 'account_not_pending_setup';
  end if;
  if not public.lock_current_pending_setup_turn(p_account_id, p_turn_id) then
    return 'turn_not_current';
  end if;
  if v_label = '' or char_length(v_label) > 500 then
    return 'invalid_label';
  end if;

  select raw_input, ai_status, ai_result_json, ai_ux_mode, user_resolution_status
  into v_resolution
  from public.account_niche_resolutions
  where account_id = p_account_id
  for update;

  if not found
    or v_resolution.ai_status is distinct from 'resolved'
    or coalesce(v_resolution.user_resolution_status, 'pending_confirmation') <> 'pending_confirmation'
  then
    return 'resolution_not_actionable';
  end if;

  if v_resolution.ai_ux_mode = 'fallback_review' then
    if btrim(v_resolution.raw_input) is distinct from v_label then
      return 'invalid_option';
    end if;
  elsif v_resolution.ai_ux_mode = 'choose_from_options' then
    if jsonb_typeof(v_resolution.ai_result_json -> 'options') <> 'array'
      or not exists (
        select 1
        from jsonb_array_elements(v_resolution.ai_result_json -> 'options') as option_row
        where btrim(option_row ->> 'name') = v_label
          and option_row ->> 'isOfficial' = 'false'
      )
    then
      return 'invalid_option';
    end if;
  else
    return 'resolution_not_actionable';
  end if;

  if exists (
    select 1
    from public.account_taxonomy
    where account_id = p_account_id
      and is_primary = true
      and status = 'active'
    for update
  ) then
    return 'conflicting_primary';
  end if;

  update public.account_niche_resolutions
  set
    user_resolution_status = 'confirmed',
    user_selected_taxon_id = null,
    user_rewrite_input = v_label,
    user_confirmed_at = now(),
    updated_at = now()
  where account_id = p_account_id
    and coalesce(user_resolution_status, 'pending_confirmation') = 'pending_confirmation';

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> 1 then
    raise exception 'pending setup operational resolution changed concurrently';
  end if;

  return 'saved';
end;
$$;

create or replace function public.complete_pending_setup_conversation_turn(
  p_account_id uuid,
  p_turn_id uuid,
  p_status text,
  p_product_state text,
  p_product_message text,
  p_failure_code text default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_turn record;
begin
  select status, product_state, product_message, failure_code
  into v_turn
  from public.pending_setup_conversation_turns
  where account_id = p_account_id
    and id = p_turn_id
  for update;

  if not found then
    return 'turn_not_found';
  end if;

  if v_turn.status <> 'pending' then
    if v_turn.status = p_status
      and v_turn.product_state is not distinct from p_product_state
      and v_turn.product_message is not distinct from btrim(p_product_message)
      and v_turn.failure_code is not distinct from p_failure_code
    then
      return 'saved';
    end if;
    return 'already_finalized';
  end if;

  update public.pending_setup_conversation_turns
  set
    status = p_status,
    product_state = p_product_state,
    product_message = btrim(p_product_message),
    failure_code = p_failure_code,
    completed_at = now()
  where account_id = p_account_id
    and id = p_turn_id;

  return 'saved';
end;
$$;

drop function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid);

create or replace function public.confirm_pending_setup_niche_resolution_taxon(
  p_account_id uuid,
  p_turn_id uuid,
  p_taxon_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account_status text;
  v_existing_primary_taxon_id uuid;
  v_link_source_type text;
  v_resolution record;
  v_selected_option_is_valid boolean := false;
  v_updated_count integer;
begin
  select status
  into v_account_status
  from public.accounts
  where id = p_account_id
  for update;

  if v_account_status is distinct from 'pending_setup' then
    return 'account_not_pending_setup';
  end if;
  if not public.lock_current_pending_setup_turn(p_account_id, p_turn_id) then
    return 'turn_not_current';
  end if;

  select
    selected_taxon_id,
    confidence,
    should_use_deterministic_match,
    needs_admin_review,
    resolution_status,
    ai_status,
    ai_result_json,
    ai_ux_mode,
    ai_suggested_taxon_id,
    user_resolution_status
  into v_resolution
  from public.account_niche_resolutions
  where account_id = p_account_id
  for update;

  if not found or coalesce(v_resolution.user_resolution_status, 'pending_confirmation') <> 'pending_confirmation' then
    return 'resolution_not_actionable';
  end if;

  if v_resolution.resolution_status = 'deterministic_high_confidence'
    and v_resolution.confidence = 'high'
    and v_resolution.should_use_deterministic_match = true
    and v_resolution.needs_admin_review = false
    and v_resolution.selected_taxon_id = p_taxon_id
  then
    v_selected_option_is_valid := true;
    v_link_source_type := 'taxonomy_match';
  elsif v_resolution.ai_status = 'resolved'
    and v_resolution.ai_ux_mode in ('confirm_single', 'choose_from_options')
  then
    v_link_source_type := 'user_confirmed_ai';
  else
    return 'resolution_not_actionable';
  end if;

  if v_link_source_type = 'user_confirmed_ai' and v_resolution.ai_ux_mode = 'confirm_single' then
    v_selected_option_is_valid := v_resolution.ai_suggested_taxon_id = p_taxon_id;
  elsif v_link_source_type = 'user_confirmed_ai'
    and jsonb_typeof(v_resolution.ai_result_json -> 'options') = 'array'
  then
    select exists (
      select 1
      from jsonb_array_elements(v_resolution.ai_result_json -> 'options') as option_row
      where option_row ->> 'taxonId' = p_taxon_id::text
        and option_row ->> 'isOfficial' = 'true'
    )
    into v_selected_option_is_valid;
  end if;

  if v_selected_option_is_valid is distinct from true then
    return 'invalid_option';
  end if;

  if not exists (
    select 1
    from public.business_taxons
    where id = p_taxon_id
      and is_active = true
  ) then
    return 'taxon_not_active';
  end if;

  select taxon_id
  into v_existing_primary_taxon_id
  from public.account_taxonomy
  where account_id = p_account_id
    and is_primary = true
    and status = 'active'
  for update;

  if v_existing_primary_taxon_id is not null
    and v_existing_primary_taxon_id <> p_taxon_id
  then
    return 'conflicting_primary';
  end if;

  insert into public.account_taxonomy (
    account_id,
    taxon_id,
    is_primary,
    status,
    source_type
  )
  values (
    p_account_id,
    p_taxon_id,
    true,
    'active',
    v_link_source_type
  )
  on conflict (account_id, taxon_id) do update
  set
    is_primary = true,
    status = 'active',
    source_type = v_link_source_type,
    updated_at = now();

  update public.account_niche_resolutions
  set
    user_resolution_status = 'confirmed',
    user_selected_taxon_id = p_taxon_id,
    user_rewrite_input = null,
    user_confirmed_at = now(),
    updated_at = now()
  where account_id = p_account_id
    and coalesce(user_resolution_status, 'pending_confirmation') = 'pending_confirmation';

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> 1 then
    raise exception 'pending setup niche resolution changed concurrently';
  end if;

  return 'saved';
end;
$$;

alter function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) owner to postgres;
alter function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) owner to postgres;
alter function public.lock_current_pending_setup_turn(uuid, uuid) owner to postgres;
alter function public.upsert_pending_setup_niche_resolution_for_turn(uuid, uuid, text, uuid, text, boolean, boolean, text, boolean, text, text, text, numeric) owner to postgres;
alter function public.update_pending_setup_niche_resolution_ai_for_turn(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text, boolean, boolean, text) owner to postgres;
alter function public.confirm_pending_setup_operational_choice_for_turn(uuid, uuid, text) owner to postgres;
alter function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid, uuid) owner to postgres;
revoke all on function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.lock_current_pending_setup_turn(uuid, uuid) from public, anon, authenticated;
revoke all on function public.upsert_pending_setup_niche_resolution_for_turn(uuid, uuid, text, uuid, text, boolean, boolean, text, boolean, text, text, text, numeric) from public, anon, authenticated;
revoke all on function public.update_pending_setup_niche_resolution_ai_for_turn(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text, boolean, boolean, text) from public, anon, authenticated;
revoke all on function public.confirm_pending_setup_operational_choice_for_turn(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) to service_role;
grant execute on function public.lock_current_pending_setup_turn(uuid, uuid) to service_role;
grant execute on function public.upsert_pending_setup_niche_resolution_for_turn(uuid, uuid, text, uuid, text, boolean, boolean, text, boolean, text, text, text, numeric) to service_role;
grant execute on function public.update_pending_setup_niche_resolution_ai_for_turn(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text, boolean, boolean, text) to service_role;
grant execute on function public.confirm_pending_setup_operational_choice_for_turn(uuid, uuid, text) to service_role;
grant execute on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid, uuid) to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) from ai_readonly';
    execute 'revoke all on function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) from ai_readonly';
    execute 'revoke all on function public.lock_current_pending_setup_turn(uuid, uuid) from ai_readonly';
    execute 'revoke all on function public.upsert_pending_setup_niche_resolution_for_turn(uuid, uuid, text, uuid, text, boolean, boolean, text, boolean, text, text, text, numeric) from ai_readonly';
    execute 'revoke all on function public.update_pending_setup_niche_resolution_ai_for_turn(uuid, uuid, text, text, text, text, text, jsonb, text, uuid, text, boolean, boolean, text) from ai_readonly';
    execute 'revoke all on function public.confirm_pending_setup_operational_choice_for_turn(uuid, uuid, text) from ai_readonly';
    execute 'revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid, uuid) from ai_readonly';
  end if;
end
$$;

commit;
