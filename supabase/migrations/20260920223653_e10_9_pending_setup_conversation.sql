create table public.account_pending_setup_conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  user_id uuid not null,
  preferred_name text,
  business_context_text text,
  stage text not null default 'identity',
  confirmation_kind text,
  resolution_outcome text,
  pending_turn_token uuid,
  pending_turn_started_at timestamptz,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint account_pending_setup_conversations_account_user_key
    unique (account_id, user_id),
  constraint account_pending_setup_conversations_membership_fkey
    foreign key (account_id, user_id)
    references public.account_users (account_id, user_id)
    on update cascade
    on delete restrict,
  constraint account_pending_setup_conversations_preferred_name_chk
    check (
      preferred_name is null
      or (
        char_length(btrim(preferred_name)) between 1 and 80
        and preferred_name !~ '[[:cntrl:]@]'
      )
    ),
  constraint account_pending_setup_conversations_business_context_chk
    check (
      business_context_text is null
      or char_length(btrim(business_context_text)) between 1 and 4000
    ),
  constraint account_pending_setup_conversations_stage_chk
    check (
      stage in (
        'identity',
        'business_understanding',
        'niche_confirmation',
        'ready_to_complete',
        'completed'
      )
    ),
  constraint account_pending_setup_conversations_resolution_outcome_chk
    check (
      (stage <> 'completed' and resolution_outcome is null)
      or (
        stage = 'completed'
        and resolution_outcome in ('official', 'operational_fallback')
      )
    ),
  constraint account_pending_setup_conversations_confirmation_kind_chk
    check (
      (stage = 'niche_confirmation' and confirmation_kind in ('official', 'operational_fallback'))
      or (stage <> 'niche_confirmation' and confirmation_kind is null)
    ),
  constraint account_pending_setup_conversations_pending_turn_chk
    check (
      (pending_turn_token is null and pending_turn_started_at is null)
      or (
        pending_turn_token is not null
        and pending_turn_started_at is not null
        and stage in ('business_understanding', 'niche_confirmation')
      )
    ),
  constraint account_pending_setup_conversations_version_chk
    check (version >= 1),
  constraint account_pending_setup_conversations_timestamps_chk
    check (
      created_at <= updated_at
      and (
        (stage <> 'completed' and completed_at is null)
        or (stage = 'completed' and completed_at is not null and updated_at <= completed_at)
      )
    )
);

create table public.account_pending_setup_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  ordinal integer not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint account_pending_setup_messages_conversation_ordinal_key
    unique (conversation_id, ordinal),
  constraint account_pending_setup_messages_conversation_fkey
    foreign key (conversation_id)
    references public.account_pending_setup_conversations (id)
    on update cascade
    on delete restrict,
  constraint account_pending_setup_messages_ordinal_chk
    check (ordinal >= 1),
  constraint account_pending_setup_messages_role_chk
    check (role in ('user', 'assistant')),
  constraint account_pending_setup_messages_content_chk
    check (char_length(btrim(content)) between 1 and 4000)
);

create index account_pending_setup_messages_conversation_created_idx
  on public.account_pending_setup_messages (conversation_id, created_at, ordinal);

create trigger account_pending_setup_conversations_set_updated_at
before update on public.account_pending_setup_conversations
for each row execute function public.tg_set_updated_at();

alter table public.account_pending_setup_conversations enable row level security;
alter table public.account_pending_setup_messages enable row level security;

revoke all on table public.account_pending_setup_conversations
  from public, anon, authenticated;
revoke all on table public.account_pending_setup_messages
  from public, anon, authenticated;

grant select, insert, update on table public.account_pending_setup_conversations
  to service_role;
grant select, insert on table public.account_pending_setup_messages
  to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.account_pending_setup_conversations from ai_readonly';
    execute 'revoke all on table public.account_pending_setup_messages from ai_readonly';
  end if;
end
$$;

create or replace function public.start_account_pending_setup_v1(
  p_account_id uuid,
  p_user_id uuid,
  p_preferred_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_stage text;
  v_preferred_name text := nullif(btrim(p_preferred_name), '');
begin
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

  if v_preferred_name is not null and (
    char_length(v_preferred_name) > 80
    or v_preferred_name ~ '[[:cntrl:]@]'
  ) then
    raise exception 'pending_setup_preferred_name_invalid' using errcode = '22023';
  end if;

  v_stage := case
    when v_preferred_name is null then 'identity'
    else 'business_understanding'
  end;

  insert into public.account_pending_setup_conversations (
    account_id,
    user_id,
    preferred_name,
    stage
  )
  values (
    p_account_id,
    p_user_id,
    v_preferred_name,
    v_stage
  )
  on conflict (account_id, user_id) do nothing
  returning id into v_conversation_id;

  if v_conversation_id is not null then
    insert into public.account_pending_setup_messages (
      conversation_id,
      ordinal,
      role,
      content
    )
    values (
      v_conversation_id,
      1,
      'assistant',
      case
        when v_stage = 'identity'
          then 'Olá! Como você prefere ser chamado?'
        else 'Para começar, conte em poucas palavras: com o que você trabalha e para quem?'
      end
    );

    return v_conversation_id;
  end if;

  select c.id
  into strict v_conversation_id
  from public.account_pending_setup_conversations c
  where c.account_id = p_account_id
    and c.user_id = p_user_id;

  return v_conversation_id;
end;
$$;

create or replace function public.set_account_pending_setup_preferred_name_v1(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_preferred_name text,
  p_expected_version bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.account_pending_setup_conversations%rowtype;
  v_preferred_name text := nullif(btrim(p_preferred_name), '');
  v_next_ordinal integer;
  v_new_version bigint;
begin
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

  if v_preferred_name is not null and (
    char_length(v_preferred_name) > 80
    or v_preferred_name ~ '[[:cntrl:]@]'
  ) then
    raise exception 'pending_setup_preferred_name_invalid' using errcode = '22023';
  end if;

  select c.*
  into strict v_conversation
  from public.account_pending_setup_conversations c
  where c.id = p_conversation_id
    and c.account_id = p_account_id
    and c.user_id = p_user_id
  for update;

  if v_conversation.stage <> 'identity' then
    return v_conversation.version;
  end if;

  if v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
  end if;

  select coalesce(max(m.ordinal), 0) + 1
  into v_next_ordinal
  from public.account_pending_setup_messages m
  where m.conversation_id = p_conversation_id;

  update public.account_pending_setup_conversations
  set preferred_name = v_preferred_name,
      stage = 'business_understanding',
      version = version + 1
  where id = p_conversation_id
  returning version into v_new_version;

  insert into public.account_pending_setup_messages (
    conversation_id,
    ordinal,
    role,
    content
  )
  values (
    p_conversation_id,
    v_next_ordinal,
    'assistant',
    'Para começar, conte em poucas palavras: com o que você trabalha e para quem?'
  );

  return v_new_version;
end;
$$;

create or replace function public.claim_account_pending_setup_turn_v1(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_expected_version bigint,
  p_turn_token uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.account_pending_setup_conversations%rowtype;
  v_new_version bigint;
begin
  if p_turn_token is null then
    raise exception 'pending_setup_turn_token_invalid' using errcode = '22023';
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

  if v_conversation.stage not in ('business_understanding', 'niche_confirmation') then
    raise exception 'pending_setup_stage_not_claimable' using errcode = '22023';
  end if;

  if v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
  end if;

  if v_conversation.pending_turn_token is not null
    and v_conversation.pending_turn_started_at >= now() - interval '2 minutes'
  then
    raise exception 'pending_setup_turn_in_progress' using errcode = '40001';
  end if;

  update public.account_pending_setup_conversations
  set pending_turn_token = p_turn_token,
      pending_turn_started_at = now(),
      version = version + 1
  where id = p_conversation_id
  returning version into v_new_version;

  return v_new_version;
end;
$$;

create or replace function public.append_account_pending_setup_turn_v1(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_expected_version bigint,
  p_turn_token uuid,
  p_user_content text,
  p_assistant_content text,
  p_next_stage text,
  p_confirmation_kind text,
  p_business_context_text text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.account_pending_setup_conversations%rowtype;
  v_next_ordinal integer;
  v_new_version bigint;
begin
  if p_next_stage not in (
    'business_understanding',
    'niche_confirmation',
    'ready_to_complete'
  ) then
    raise exception 'pending_setup_next_stage_invalid' using errcode = '22023';
  end if;

  if (p_next_stage = 'niche_confirmation' and p_confirmation_kind not in ('official', 'operational_fallback'))
    or (p_next_stage <> 'niche_confirmation' and p_confirmation_kind is not null)
  then
    raise exception 'pending_setup_confirmation_kind_invalid' using errcode = '22023';
  end if;

  if char_length(btrim(p_user_content)) not between 1 and 4000
    or char_length(btrim(p_assistant_content)) not between 1 and 4000
    or char_length(btrim(p_business_context_text)) not between 1 and 4000
  then
    raise exception 'pending_setup_turn_invalid' using errcode = '22023';
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
    and c.stage <> 'completed'
  for update;

  if v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
  end if;

  if v_conversation.pending_turn_token is distinct from p_turn_token then
    raise exception 'pending_setup_turn_not_claimed' using errcode = '40001';
  end if;

  if not (
    (v_conversation.stage = 'business_understanding'
      and p_next_stage in ('business_understanding', 'niche_confirmation', 'ready_to_complete'))
    or (v_conversation.stage = 'niche_confirmation'
      and p_next_stage in ('business_understanding', 'niche_confirmation', 'ready_to_complete'))
  ) then
    raise exception 'pending_setup_stage_transition_invalid' using errcode = '22023';
  end if;

  select coalesce(max(m.ordinal), 0) + 1
  into v_next_ordinal
  from public.account_pending_setup_messages m
  where m.conversation_id = p_conversation_id;

  insert into public.account_pending_setup_messages (
    conversation_id,
    ordinal,
    role,
    content
  )
  values
    (p_conversation_id, v_next_ordinal, 'user', btrim(p_user_content)),
    (p_conversation_id, v_next_ordinal + 1, 'assistant', btrim(p_assistant_content));

  update public.account_pending_setup_conversations
  set business_context_text = btrim(p_business_context_text),
      stage = p_next_stage,
      confirmation_kind = p_confirmation_kind,
      pending_turn_token = null,
      pending_turn_started_at = null,
      version = version + 1
  where id = p_conversation_id
  returning version into v_new_version;

  return v_new_version;
end;
$$;

create or replace function public.complete_account_pending_setup_v1(
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
  if p_resolution_outcome not in ('official', 'operational_fallback') then
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

  if v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
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

revoke all on function public.start_account_pending_setup_v1(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.set_account_pending_setup_preferred_name_v1(uuid, uuid, uuid, text, bigint)
  from public, anon, authenticated;
revoke all on function public.claim_account_pending_setup_turn_v1(uuid, uuid, uuid, bigint, uuid)
  from public, anon, authenticated;
revoke all on function public.append_account_pending_setup_turn_v1(uuid, uuid, uuid, bigint, uuid, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.complete_account_pending_setup_v1(uuid, uuid, uuid, bigint, text)
  from public, anon, authenticated;

grant execute on function public.start_account_pending_setup_v1(uuid, uuid, text)
  to service_role;
grant execute on function public.set_account_pending_setup_preferred_name_v1(uuid, uuid, uuid, text, bigint)
  to service_role;
grant execute on function public.claim_account_pending_setup_turn_v1(uuid, uuid, uuid, bigint, uuid)
  to service_role;
grant execute on function public.append_account_pending_setup_turn_v1(uuid, uuid, uuid, bigint, uuid, text, text, text, text, text)
  to service_role;
grant execute on function public.complete_account_pending_setup_v1(uuid, uuid, uuid, bigint, text)
  to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.start_account_pending_setup_v1(uuid, uuid, text) from ai_readonly';
    execute 'revoke all on function public.set_account_pending_setup_preferred_name_v1(uuid, uuid, uuid, text, bigint) from ai_readonly';
    execute 'revoke all on function public.claim_account_pending_setup_turn_v1(uuid, uuid, uuid, bigint, uuid) from ai_readonly';
    execute 'revoke all on function public.append_account_pending_setup_turn_v1(uuid, uuid, uuid, bigint, uuid, text, text, text, text, text) from ai_readonly';
    execute 'revoke all on function public.complete_account_pending_setup_v1(uuid, uuid, uuid, bigint, text) from ai_readonly';
  end if;
end
$$;
