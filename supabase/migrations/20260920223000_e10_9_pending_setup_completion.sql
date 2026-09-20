begin;

create or replace function public.complete_pending_setup_conversation(
  p_account_id uuid,
  p_owner_user_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account record;
  v_conversation record;
  v_resolution record;
  v_latest_turn record;
  v_latest_turn_found boolean;
  v_primary_taxon_id uuid;
  v_completion_mode text;
  v_updated_count integer;
begin
  select owner_user_id, status
  into v_account
  from public.accounts
  where id = p_account_id
  for update;

  if not found or v_account.owner_user_id is distinct from p_owner_user_id then
    return 'account_not_allowed';
  end if;

  perform 1
  from public.account_users
  where account_id = p_account_id
    and user_id = p_owner_user_id
    and role = 'owner'
    and status = 'active'
  for share;

  if not found then
    return 'account_not_allowed';
  end if;

  select owner_user_id, completed_at, completion_mode
  into v_conversation
  from public.pending_setup_conversations
  where account_id = p_account_id
  for update;

  if not found then
    return 'conversation_not_found';
  end if;
  if v_conversation.owner_user_id is distinct from p_owner_user_id then
    return 'conversation_owner_mismatch';
  end if;

  if v_conversation.completed_at is not null then
    if v_account.status = 'active'
      and v_conversation.completion_mode in ('official', 'fallback')
    then
      return 'already_completed';
    end if;
    return 'completion_inconsistent';
  end if;

  if v_account.status <> 'pending_setup' then
    return 'account_not_pending_setup';
  end if;

  select status, product_state
  into v_latest_turn
  from public.pending_setup_conversation_turns
  where account_id = p_account_id
  order by created_at desc, id desc
  limit 1
  for update;
  v_latest_turn_found := found;

  select
    user_resolution_status,
    user_selected_taxon_id,
    nullif(btrim(user_rewrite_input), '') as operational_label
  into v_resolution
  from public.account_niche_resolutions
  where account_id = p_account_id
  for update;

  if not found or v_resolution.user_resolution_status is distinct from 'confirmed' then
    return 'resolution_not_ready';
  end if;

  if not v_latest_turn_found
    or v_latest_turn.status <> 'completed'
    or v_latest_turn.product_state not in ('ready_official', 'ready_fallback')
  then
    return 'turn_not_ready';
  end if;

  select taxon_id
  into v_primary_taxon_id
  from public.account_taxonomy
  where account_id = p_account_id
    and is_primary = true
    and status = 'active'
  for update;

  if v_latest_turn.product_state = 'ready_official' then
    if v_resolution.user_selected_taxon_id is null
      or v_primary_taxon_id is distinct from v_resolution.user_selected_taxon_id
      or not exists (
        select 1
        from public.business_taxons
        where id = v_primary_taxon_id
          and is_active = true
      )
    then
      return 'official_taxon_not_ready';
    end if;
    v_completion_mode := 'official';
  elsif v_latest_turn.product_state = 'ready_fallback' then
    if v_resolution.user_selected_taxon_id is not null
      or v_resolution.operational_label is null
      or v_primary_taxon_id is not null
    then
      return 'fallback_not_ready';
    end if;
    v_completion_mode := 'fallback';
  else
    return 'turn_not_ready';
  end if;

  update public.pending_setup_conversations
  set
    completed_at = now(),
    completion_mode = v_completion_mode
  where account_id = p_account_id
    and completed_at is null;

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> 1 then
    raise exception 'pending setup conversation changed concurrently';
  end if;

  update public.accounts
  set
    status = 'active',
    setup_completed_at = coalesce(setup_completed_at, now())
  where id = p_account_id
    and status = 'pending_setup';

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> 1 then
    raise exception 'pending setup account changed concurrently';
  end if;

  return 'saved';
end;
$$;

alter function public.complete_pending_setup_conversation(uuid, uuid) owner to postgres;
revoke all on function public.complete_pending_setup_conversation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_pending_setup_conversation(uuid, uuid) to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.complete_pending_setup_conversation(uuid, uuid) from ai_readonly';
  end if;
end
$$;

commit;
