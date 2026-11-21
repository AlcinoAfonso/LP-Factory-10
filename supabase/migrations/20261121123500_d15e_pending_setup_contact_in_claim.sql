-- D15E: persist voluntary WhatsApp in the already-authorized message claim transaction.
-- No new function signature, table, grant, route or background processing.
begin;
create or replace function public.claim_account_pending_setup_turn_v3(p_conversation_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_request_id uuid,p_turn_token uuid,p_content text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.account_pending_setup_conversations%rowtype; s public.account_context_summaries%rowtype;
  state jsonb; v_summary jsonb; v_phone text; version bigint; v_ordinal integer;
begin
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  select niche_state into strict state from public.account_dialogues where id=c.id and account_id=p_account_id
    and user_id=p_user_id and origin='pending_setup' and ended_at is null for update;
  if p_request_id is null or p_content is null or p_content<>btrim(p_content)
    or char_length(p_content) not between 1 and 4000 then
    raise exception 'pending_setup_input_invalid' using errcode='22023'; end if;
  if state->>'requestId'=p_request_id::text then
    if not exists(select 1 from public.account_pending_setup_messages where conversation_id=c.id
      and ordinal=(state->>'requestOrdinal')::integer and role='user' and content=p_content) then
      raise exception 'pending_setup_request_conflict' using errcode='40001'; end if;
    if state->>'lastRequestId'=p_request_id::text then
      return jsonb_build_object('version',c.version,'replay',true);
    end if;
  elsif c.pending_turn_intent is not null or exists(select 1 from public.account_pending_setup_messages
    where id=p_request_id and conversation_id=c.id) then
    raise exception 'pending_setup_request_conflict' using errcode='40001';
  end if;
  if c.pending_turn_intent is not null and c.pending_turn_intent<>'message' then
    raise exception 'pending_setup_request_conflict' using errcode='40001'; end if;
  if c.stage='ready_to_complete' and c.business_display_name is null and c.version=p_expected_version then
    update public.account_pending_setup_conversations set stage='business_understanding' where id=c.id;
    if exists(select 1 from public.account_niche_resolutions where account_id=p_account_id
      and user_resolution_status='confirmed' and user_selected_taxon_id is null
      and nullif(btrim(raw_input),'') is not null and nullif(btrim(user_rewrite_input),'') is not null) then
      update public.account_dialogues set niche_state=niche_state||'{"operationalAccepted":true}'::jsonb where id=c.id;
    end if;
  end if;
  version:=public.claim_account_pending_setup_turn_v2(c.id,p_account_id,p_user_id,
    case when state->>'requestId'=p_request_id::text then c.version else p_expected_version end,
    p_turn_token,p_content,'message');
  select pending_turn_ordinal into strict v_ordinal from public.account_pending_setup_conversations where id=c.id;
  if not state ? 'requestId' or state->>'requestId'<>p_request_id::text then
    -- This is the newly appended user row, still inside its reservation transaction.
    update public.account_pending_setup_messages set id=p_request_id where conversation_id=c.id
      and account_pending_setup_messages.ordinal=v_ordinal and role='user';
  end if;
  update public.account_dialogues set niche_state=niche_state||jsonb_build_object(
    'requestId',p_request_id,'requestOrdinal',v_ordinal) where id=c.id;
  -- The contact field is part of the submitted message, never an AI confirmation.
  v_phone:=substring(p_content from 'WhatsApp para contato: ([(][0-9]{2}[)] 9[0-9]{4}-[0-9]{4})
end $$;);
  if v_phone is not null then
    select * into strict s from public.account_context_summaries where account_id=p_account_id for update;
    v_summary:=coalesce(s.summary,'{}')::jsonb;
    if jsonb_typeof(v_summary) is distinct from 'object' then
      raise exception 'pending_setup_summary_invalid' using errcode='22023';
    end if;
    if coalesce(v_summary->>'whatsapp',v_summary->>'w') is distinct from v_phone
      or coalesce((v_summary->>'whatsappDeclined')::boolean,(v_summary->>'d')::boolean,false)
      or v_summary ? 'w' or v_summary ? 'd' then
      v_summary:=(v_summary-'w'-'d')||jsonb_build_object('whatsapp',v_phone,'whatsappDeclined',false);
      update public.account_context_summaries set summary=v_summary::text,
        source_dialogue_id=c.id,source_user_id=p_user_id,updated_at=clock_timestamp()
        where account_id=p_account_id;
    end if;
  end if;
  return jsonb_build_object('version',version,'replay',false);
end $$;
commit;
