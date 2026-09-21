begin;

alter table public.account_pending_setup_conversations
  add column openai_call_count smallint not null default 0,
  add constraint account_pending_setup_conversations_openai_call_count_chk
    check (openai_call_count between 0 and 3);

create or replace function public.claim_account_pending_setup_openai_call_v1(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_expected_version bigint,
  p_turn_token uuid
)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.account_pending_setup_conversations%rowtype;
  v_new_count smallint;
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

  if v_conversation.stage <> 'business_understanding' then
    raise exception 'pending_setup_stage_not_claimable' using errcode = '22023';
  end if;

  if v_conversation.version <> p_expected_version then
    raise exception 'pending_setup_version_conflict' using errcode = '40001';
  end if;

  if v_conversation.pending_turn_token is distinct from p_turn_token then
    raise exception 'pending_setup_turn_not_claimed' using errcode = '40001';
  end if;

  if v_conversation.openai_call_count >= 3 then
    raise exception 'pending_setup_openai_call_limit_reached' using errcode = '22023';
  end if;

  update public.account_pending_setup_conversations
  set openai_call_count = openai_call_count + 1
  where id = p_conversation_id
  returning openai_call_count into v_new_count;

  return v_new_count;
end;
$$;

revoke all on function public.claim_account_pending_setup_openai_call_v1(uuid, uuid, uuid, bigint, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_account_pending_setup_openai_call_v1(uuid, uuid, uuid, bigint, uuid)
  to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.claim_account_pending_setup_openai_call_v1(uuid, uuid, uuid, bigint, uuid) from ai_readonly';
  end if;
end
$$;

commit;
