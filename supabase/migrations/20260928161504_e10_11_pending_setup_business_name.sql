-- PB-B/E10.11: preserve completed history and the gate-off E10.9 RPC.
alter table public.account_pending_setup_conversations
  add column business_display_name text,
  add constraint account_pending_setup_conversations_business_display_name_chk
    check (
      business_display_name is null
      or (char_length(btrim(business_display_name)) between 1 and 120
          and business_display_name !~ '[[:cntrl:]]')
    );

comment on column public.account_pending_setup_conversations.business_display_name is
  'Public business/professional name explicitly supplied in Pending Setup; not the preferred user name or accounts.name.';

create or replace function public.set_account_pending_setup_business_name_v1(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_business_display_name text,
  p_expected_version bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.account_pending_setup_conversations%rowtype;
  v_name text := btrim(p_business_display_name);
  v_new_version bigint;
begin
  if v_name is null or char_length(v_name) not between 1 and 120 or
     v_name ~ '[[:cntrl:]]' then
    raise exception 'pending_setup_business_name_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.accounts a
    join public.account_users au
      on au.account_id = a.id
     and au.user_id = p_user_id
    where a.id = p_account_id
      and a.status = 'pending_setup'
      and au.status = 'active'
      and au.role = 'owner'
  ) then
    raise exception 'pending_setup_actor_not_allowed' using errcode = '42501';
  end if;

  select c.*
  into strict v_conversation
  from public.account_pending_setup_conversations c
  where c.id = p_conversation_id
    and c.account_id = p_account_id
    and c.user_id = p_user_id
  for update;

  if v_conversation.stage <> 'ready_to_complete' or
     v_conversation.pending_turn_token is not null then
    raise exception 'pending_setup_stage_not_claimable' using errcode = '22023';
  end if;
  if p_expected_version is null or v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
  end if;

  update public.account_pending_setup_conversations
  set business_display_name = v_name,
      version = version + 1,
      updated_at = now()
  where id = p_conversation_id
  returning version into v_new_version;
  return v_new_version;
end;
$$;
create or replace function public.complete_account_pending_setup_v2(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_expected_version bigint,
  p_resolution_outcome text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.account_pending_setup_conversations%rowtype;
  v_now timestamptz := now();
begin
  if p_resolution_outcome is null or
     p_resolution_outcome not in ('official', 'operational_fallback') then
    raise exception 'pending_setup_resolution_outcome_invalid' using errcode = '22023';
  end if;

  select c.*
  into strict v_conversation
  from public.account_pending_setup_conversations c
  where c.id = p_conversation_id
    and c.account_id = p_account_id
    and c.user_id = p_user_id
  for update;

  if v_conversation.stage = 'completed' then
    if not exists (
      select 1
      from public.accounts a
      join public.account_users au
        on au.account_id = a.id
       and au.user_id = p_user_id
      where a.id = p_account_id
        and a.status = 'active'
        and au.status = 'active'
        and au.role = 'owner'
    ) then
      raise exception 'pending_setup_actor_not_allowed' using errcode = '42501';
    end if;
    return true;
  end if;

  if not exists (
    select 1
    from public.accounts a
    join public.account_users au
      on au.account_id = a.id
     and au.user_id = p_user_id
    where a.id = p_account_id
      and a.status = 'pending_setup'
      and au.status = 'active'
      and au.role = 'owner'
  ) then
    raise exception 'pending_setup_actor_not_allowed' using errcode = '42501';
  end if;

  if v_conversation.stage <> 'ready_to_complete' then
    raise exception 'pending_setup_not_ready' using errcode = '22023';
  end if;

  if p_expected_version is null or v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
  end if;

  if v_conversation.business_display_name is null then
    raise exception 'pending_setup_business_name_required' using errcode = '23514';
  end if;

  if v_conversation.pending_turn_token is not null then
    raise exception 'pending_setup_turn_in_progress' using errcode = '40001';
  end if;

  if p_resolution_outcome = 'official' and not exists (
    select 1
    from public.account_taxonomy atx
    join public.business_taxons bt on bt.id = atx.taxon_id
    where atx.account_id = p_account_id
      and atx.is_primary is true
      and atx.status = 'active'
      and bt.is_active is true
  ) then
    raise exception 'pending_setup_official_taxon_missing' using errcode = '23514';
  end if;

  if p_resolution_outcome = 'operational_fallback' then
    if exists (
      select 1
      from public.account_taxonomy atx
      join public.business_taxons bt on bt.id = atx.taxon_id
      where atx.account_id = p_account_id
        and atx.is_primary is true
        and atx.status = 'active'
        and bt.is_active is true
    ) then
      raise exception 'pending_setup_fallback_official_taxon_present' using errcode = '23514';
    end if;

    if not exists (
      select 1
      from public.account_niche_resolutions anr
      where anr.account_id = p_account_id
        and btrim(anr.raw_input) <> ''
        and anr.user_resolution_status = 'confirmed'
        and anr.user_selected_taxon_id is null
        and btrim(coalesce(anr.user_rewrite_input, '')) <> ''
    ) then
      raise exception 'pending_setup_operational_fallback_missing' using errcode = '23514';
    end if;
  end if;

  update public.account_pending_setup_conversations
  set stage = 'completed',
      confirmation_kind = null,
      resolution_outcome = p_resolution_outcome,
      version = version + 1,
      updated_at = v_now,
      completed_at = v_now
  where id = p_conversation_id;

  update public.accounts
  set status = 'active'
  where id = p_account_id
    and status = 'pending_setup';

  perform public.audit_context_event(
    'pending_setup_completed',
    'account_pending_setup_conversations',
    p_conversation_id,
    jsonb_build_object(
      'stage', 'completed',
      'resolution_outcome', p_resolution_outcome
    ),
    p_account_id
  );

  return true;
end;
$$;

revoke all on function public.set_account_pending_setup_business_name_v1(uuid, uuid, uuid, text, bigint)
  from public, anon, authenticated;
revoke all on function public.complete_account_pending_setup_v2(uuid, uuid, uuid, bigint, text)
  from public, anon, authenticated;
grant execute on function public.set_account_pending_setup_business_name_v1(uuid, uuid, uuid, text, bigint)
  to service_role;
grant execute on function public.complete_account_pending_setup_v2(uuid, uuid, uuid, bigint, text)
  to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.set_account_pending_setup_business_name_v1(uuid, uuid, uuid, text, bigint) from ai_readonly';
    execute 'revoke all on function public.complete_account_pending_setup_v2(uuid, uuid, uuid, bigint, text) from ai_readonly';
  end if;
end
$$;
