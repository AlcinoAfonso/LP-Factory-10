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

alter function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) owner to postgres;
alter function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) owner to postgres;
revoke all on function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.begin_pending_setup_conversation_turn(uuid, uuid, uuid, text, text) from ai_readonly';
    execute 'revoke all on function public.complete_pending_setup_conversation_turn(uuid, uuid, text, text, text, text) from ai_readonly';
  end if;
end
$$;

commit;
