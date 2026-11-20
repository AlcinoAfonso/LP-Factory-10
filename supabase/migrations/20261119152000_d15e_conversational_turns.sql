-- The existing transaction guards remain the authority for both dialogue origins.
create function public.claim_account_niche_turn_v2(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_request_id uuid,p_turn_token uuid,p_content text,p_expected_revision text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.account_dialogues%rowtype; result jsonb; proposal text; official jsonb;
begin
  perform public.assert_account_niche_actor_v1(p_account_id,p_user_id);
  if p_content is null or p_content<>btrim(p_content) or char_length(p_content) not between 1 and 4000 then
    raise exception 'niche_turn_invalid' using errcode='22023';
  end if;
  select * into d from public.account_dialogues where id=p_dialogue_id and account_id=p_account_id
    and user_id=p_user_id and origin='account_niche' for update;
  if d.id is not null then
    if d.niche_state->>'lastRequestId'=p_request_id::text and d.niche_state->>'requestId'=p_request_id::text then
      if not exists(select 1 from public.account_pending_setup_messages where id=p_request_id
        and dialogue_id=d.id and role='user' and content=p_content) then
        raise exception 'niche_request_conflict' using errcode='40001'; end if;
      return jsonb_build_object('replay',true,'version',d.version,'state',d.niche_state);
    end if;
    if d.niche_state->>'requestId' is distinct from d.niche_state->>'lastRequestId'
      and d.niche_state->>'requestId' is distinct from p_request_id::text then
      raise exception 'niche_turn_conflict' using errcode='40001'; end if;
    if d.niche_state->>'requestId' is distinct from p_request_id::text and
      exists(select 1 from public.account_pending_setup_messages where id=p_request_id and dialogue_id=d.id) then
      raise exception 'niche_request_conflict' using errcode='40001'; end if;
    official:=public.account_niche_snapshot_v1(p_account_id);
    if d.ended_at is null and d.niche_state->'official' is distinct from official then
      -- A change in official context invalidates an offer, never the submitted dialogue.
      update public.account_dialogues set niche_state=(niche_state-array['proposal','nicheAccepted','synthesis','synthesisAccepted','synthesisPartialId'])||jsonb_build_object(
        'official',official,'expectedRevision',p_expected_revision) where id=d.id;
    else
      proposal:=d.niche_state->>'proposal';
    end if;
  elsif exists(select 1 from public.account_dialogues where account_id=p_account_id and user_id=p_user_id
      and origin='account_niche' and ended_at is null) then
    raise exception 'niche_turn_conflict' using errcode='40001';
  end if;
  result:=public.claim_account_niche_turn_v1(p_dialogue_id,p_account_id,p_user_id,
    p_expected_version,p_request_id,p_turn_token,p_content,p_expected_revision);
  update public.account_dialogues set niche_state=niche_state||jsonb_build_object('synthesisRequired',true,'proposal',proposal)
    where id=p_dialogue_id returning * into d;
  return jsonb_set(result,'{state}',d.niche_state);
end $$;

create function public.commit_account_niche_turn_v2(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_turn_token uuid,p_reply text,p_understanding text,p_proposal text,
  p_summary text,p_observed_summary text,p_observed_summary_updated_at timestamptz,p_accepted_proposal text,
  p_keep_proposal boolean,p_synthesis jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.account_dialogues%rowtype; s public.account_context_summaries%rowtype;
  version bigint; revision bigint;
  offer jsonb:=nullif(p_synthesis->'offer','null'::jsonb); accepted uuid:=(p_synthesis->>'accept')::uuid;
  clear_synthesis boolean:=coalesce((p_synthesis->>'clear')::boolean,false); synthesis_accepted boolean;
begin
  perform public.assert_account_niche_actor_v1(p_account_id,p_user_id);
  select * into strict d from public.account_dialogues where id=p_dialogue_id and account_id=p_account_id
    and user_id=p_user_id and origin='account_niche' for update;
  if d.niche_state->>'lastTurnToken'=p_turn_token::text then
    return jsonb_build_object('version',d.version,'confirmed',d.ended_at is not null);
  end if;
  if p_keep_proposal and p_proposal is not null then
    raise exception 'niche_turn_invalid' using errcode='22023'; end if;
  if jsonb_typeof(p_synthesis) is distinct from 'object' or
    (accepted is not null and (accepted is distinct from (d.niche_state->'synthesis'->>'messageId')::uuid or
      coalesce((d.niche_state->>'synthesisAccepted')::boolean,false) or offer is not null or clear_synthesis or
      not exists(select 1 from public.account_pending_setup_messages where id=accepted and dialogue_id=d.id and role='assistant') or
      not exists(select 1 from public.account_pending_setup_messages where id=(d.niche_state->>'requestId')::uuid
        and dialogue_id=d.id and role='user'))) or
    (offer is not null and (jsonb_typeof(offer) is distinct from 'object' or
      coalesce((offer->>'start')::integer,0)<1 or coalesce((offer->>'length')::integer,0) not between 1 and 1000 or
      (offer->>'start')::integer + (offer->>'length')::integer - 1 > char_length(btrim(p_reply)) or
      coalesce(offer->'contact','null'::jsonb)<>'null'::jsonb)) or
    (p_summary is not null and accepted is null) then
    raise exception 'niche_synthesis_required' using errcode='22023';
  end if;
  synthesis_accepted:=offer is null and not clear_synthesis and
    (accepted is not null or coalesce((d.niche_state->>'synthesisAccepted')::boolean,false));
  if p_accepted_proposal is not null and (p_proposal is not null or
    not synthesis_accepted or not coalesce(p_synthesis->>'nicheReaction'='accept' or
      (p_synthesis->>'nicheReaction'='continue' and (d.niche_state->>'nicheAccepted')::boolean),false) or
    p_accepted_proposal is distinct from d.niche_state->>'proposal' or
    not exists(select 1 from public.account_pending_setup_messages where id=(d.niche_state->>'requestId')::uuid
      and dialogue_id=d.id and role='user')) then
    raise exception 'niche_changed' using errcode='40001';
  end if;
  select * into strict s from public.account_context_summaries where account_id=p_account_id for update;
  if s.summary is distinct from p_observed_summary or s.updated_at is distinct from p_observed_summary_updated_at then
    if accepted is not null then raise exception 'niche_summary_changed' using errcode='40001'; end if;
  end if;
  version:=public.commit_account_niche_turn_v1(p_dialogue_id,p_account_id,p_user_id,p_expected_version,
    p_turn_token,p_reply,p_understanding,p_proposal,p_summary,s.summary,s.updated_at);
  update public.account_dialogues set niche_state=(niche_state-'reply')||jsonb_build_object(
    'lastTurnToken',p_turn_token,
    'synthesis',case when offer is not null then offer||jsonb_build_object('messageId',p_turn_token)
      when not clear_synthesis then d.niche_state->'synthesis' end,
    'synthesisAccepted',synthesis_accepted,
    'synthesisPartialId',case when offer is null and not clear_synthesis and not synthesis_accepted then
      case when coalesce((p_synthesis->>'partial')::boolean,false)
        then d.niche_state->>'requestId' else d.niche_state->>'synthesisPartialId' end end,
    'nicheAccepted',coalesce(p_keep_proposal and d.niche_state->>'proposal' is not null and
      (p_synthesis->>'nicheReaction'='accept' or
        (p_synthesis->>'nicheReaction'='continue' and (d.niche_state->>'nicheAccepted')::boolean)),false))
    where id=p_dialogue_id;
  if (p_accepted_proposal is not null or p_keep_proposal) and d.niche_state->>'proposal' is not null then
    update public.account_dialogues set niche_state=jsonb_set(niche_state,'{proposal}',d.niche_state->'proposal')
      where id=p_dialogue_id;
  end if;
  if p_accepted_proposal is not null then
    revision:=public.confirm_account_niche_dialogue_v1(p_dialogue_id,p_account_id,p_user_id,version,true);
    version:=version+1;
  end if;
  return jsonb_build_object('version',version,'confirmed',revision is not null);
end $$;

create function public.claim_account_pending_setup_turn_v3(p_conversation_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_request_id uuid,p_turn_token uuid,p_content text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.account_pending_setup_conversations%rowtype; state jsonb; version bigint; v_ordinal integer;
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
  return jsonb_build_object('version',version,'replay',false);
end $$;

create function public.commit_account_pending_setup_turn_v5(p_conversation_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_turn_token uuid,p_reply text,p_summary text,p_observed_summary text,
  p_observed_summary_updated_at timestamptz,p_understanding text,p_preferred_name text,p_preferred_name_declined boolean,
  p_next_stage text,p_proposal jsonb,p_accept boolean,p_observed_primary_taxon_id uuid,p_observed_niche_revision bigint,
  p_name_proposal text,p_name_reaction text,p_passage_enabled boolean,p_clear_operational boolean,p_synthesis jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare c public.account_pending_setup_conversations%rowtype; s public.account_context_summaries%rowtype;
  state jsonb; summary jsonb; accepted_name text; version bigint; assistant_id uuid;
  offer jsonb:=nullif(p_synthesis->'offer','null'::jsonb); accepted uuid:=(p_synthesis->>'accept')::uuid;
  clear_synthesis boolean:=coalesce((p_synthesis->>'clear')::boolean,false); synthesis_accepted boolean;
begin
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  if p_turn_token is not null and c.last_attendance_turn_token=p_turn_token and c.pending_turn_token is null then
    return c.version;
  end if;
  select niche_state into strict state from public.account_dialogues where id=c.id and account_id=p_account_id
    and user_id=p_user_id and origin='pending_setup' and ended_at is null for update;
  if c.pending_turn_intent is distinct from 'message' or c.pending_turn_token is distinct from p_turn_token
    or p_expected_version is distinct from c.version or p_accept is null or p_passage_enabled is null
    or p_name_reaction is null or p_name_reaction not in ('keep','accept','clear') then
    raise exception 'pending_setup_version_conflict' using errcode='40001';
  end if;
  if p_name_proposal is not null and (p_name_proposal<>btrim(p_name_proposal) or
    char_length(p_name_proposal) not between 1 and 120 or p_name_proposal ~ '[[:cntrl:]<>]'
    or strpos(p_reply,p_name_proposal)=0 or p_name_reaction='accept') then
    raise exception 'pending_setup_business_name_invalid' using errcode='22023';
  end if;
  if p_name_reaction='accept' and state->>'nameProposal' is null then
    raise exception 'pending_setup_business_name_invalid' using errcode='22023';
  end if;
  if jsonb_typeof(p_synthesis) is distinct from 'object' or
    (accepted is not null and (accepted is distinct from (state->'synthesis'->>'messageId')::uuid or
      coalesce((state->>'synthesisAccepted')::boolean,false) or offer is not null or clear_synthesis or
      not exists(select 1 from public.account_pending_setup_messages where id=accepted and conversation_id=c.id and role='assistant') or
      not exists(select 1 from public.account_pending_setup_messages where id=(state->>'requestId')::uuid
        and conversation_id=c.id and ordinal=c.pending_turn_ordinal and role='user'))) or
    (offer is not null and (jsonb_typeof(offer) is distinct from 'object' or
      coalesce((offer->>'start')::integer,0)<1 or coalesce((offer->>'length')::integer,0) not between 1 and 1000 or
      (offer->>'start')::integer + (offer->>'length')::integer - 1 > char_length(btrim(p_reply)) or
      (coalesce(offer->'contact','null'::jsonb) not in ('null'::jsonb,'"declined"'::jsonb) and
        (jsonb_typeof(offer->'contact') is distinct from 'object' or coalesce((offer->'contact'->>'index')::integer,-1)<0 or
          not exists(select 1 from public.account_pending_setup_messages
            where id=(offer->'contact'->>'messageId')::uuid and conversation_id=c.id and role='user'))))) or
    (p_summary is not null and accepted is null) then
    raise exception 'pending_setup_synthesis_required' using errcode='22023';
  end if;
  synthesis_accepted:=offer is null and not clear_synthesis and
    (accepted is not null or coalesce((state->>'synthesisAccepted')::boolean,false));
  if (p_accept or p_next_stage='ready_to_complete') and not synthesis_accepted then
    raise exception 'pending_setup_synthesis_required' using errcode='22023'; end if;
  accepted_name:=case when p_name_reaction='accept' then state->>'nameProposal'
    when p_name_reaction='keep' and p_name_proposal is null then state->>'acceptedName' end;
  if p_next_stage='ready_to_complete' and p_passage_enabled and
    coalesce(accepted_name,c.business_display_name) is null then
    raise exception 'pending_setup_business_name_required' using errcode='23514';
  end if;
  if p_accept then
    if p_proposal is not null or c.attendance_proposal is null or
      (c.attendance_proposal->>'kind'='semantic' and not coalesce(p_synthesis->>'nicheReaction'='accept' or
        (p_synthesis->>'nicheReaction'='continue' and (state->>'nicheAccepted')::boolean),false)) then
      raise exception 'pending_setup_proposal_invalid' using errcode='22023'; end if;
    update public.account_pending_setup_conversations set pending_turn_intent='confirm' where id=c.id;
  end if;
  if p_summary is not null or (p_accept and c.attendance_proposal->>'kind'='semantic') then
    select * into strict s from public.account_context_summaries where account_id=p_account_id for update;
    if s.summary is distinct from p_observed_summary or s.updated_at is distinct from p_observed_summary_updated_at then
      if accepted is not null then raise exception 'pending_setup_summary_changed' using errcode='40001'; end if;
    end if;
    if p_accept and c.attendance_proposal->>'kind'='semantic' then
      summary:=jsonb_set(coalesce(p_summary,s.summary,'{}')::jsonb-'c','{classification}',to_jsonb(c.attendance_proposal->>'nicheDescription'));
    elsif p_summary is not null then
      summary:=p_summary::jsonb;
    end if;
    if summary is not null and jsonb_typeof(summary)<>'object' then
      raise exception 'pending_setup_summary_invalid' using errcode='22023'; end if;
  end if;
  version:=public.commit_account_pending_setup_turn_v4(c.id,p_account_id,p_user_id,p_expected_version,p_turn_token,
    p_reply,coalesce(summary::text,''),p_understanding,p_preferred_name,p_next_stage,p_proposal,p_accept,
    p_preferred_name_declined,p_observed_primary_taxon_id,p_observed_niche_revision);
  if p_next_stage='ready_to_complete' and p_passage_enabled and accepted_name is not null
    and accepted_name is distinct from c.business_display_name then
    version:=public.set_account_pending_setup_business_name_v1(c.id,p_account_id,p_user_id,accepted_name,version);
  end if;
  if offer is not null then
    select id into strict assistant_id from public.account_pending_setup_messages where conversation_id=c.id
      and ordinal=c.pending_turn_ordinal+1 and role='assistant';
  end if;
  update public.account_dialogues set niche_state=niche_state||jsonb_build_object(
    'synthesis',case when offer is not null then offer||jsonb_build_object('messageId',assistant_id)
      when not clear_synthesis then state->'synthesis' end,
    'synthesisAccepted',synthesis_accepted,
    'synthesisPartialId',case when offer is null and not clear_synthesis and not synthesis_accepted then
      case when coalesce((p_synthesis->>'partial')::boolean,false)
        then state->>'requestId' else state->>'synthesisPartialId' end end,
    'nicheAccepted',coalesce(p_proposal->>'kind'='semantic' and p_proposal=c.attendance_proposal and
      (p_synthesis->>'nicheReaction'='accept' or
        (p_synthesis->>'nicheReaction'='continue' and (state->>'nicheAccepted')::boolean)),false),
    'operationalAccepted',case when p_accept and c.attendance_proposal->>'kind'='operational_fallback' then true
      when p_clear_operational or p_proposal->>'kind'='operational_fallback' then false
      else coalesce((state->>'operationalAccepted')::boolean,false) end,
    'lastRequestId',state->>'requestId','acceptedName',accepted_name,'nameProposal',
    coalesce(p_name_proposal,case when p_name_reaction='keep' then state->>'nameProposal' end))
    where id=c.id;
  return version;
end $$;

do $acl$
declare fn regprocedure; role_name text;
begin
  foreach fn in array array[
    'public.claim_account_niche_turn_v2(uuid,uuid,uuid,bigint,uuid,uuid,text,text)'::regprocedure,
    'public.commit_account_niche_turn_v2(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,timestamptz,text,boolean,jsonb)'::regprocedure,
    'public.claim_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,uuid,text)'::regprocedure,
    'public.commit_account_pending_setup_turn_v5(uuid,uuid,uuid,bigint,uuid,text,text,text,timestamptz,text,text,boolean,text,jsonb,boolean,uuid,bigint,text,text,boolean,boolean,jsonb)'::regprocedure
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated',fn);
    foreach role_name in array array['ai_readonly','readonly'] loop
      if exists(select 1 from pg_roles where rolname=role_name) then
        execute format('revoke all on function %s from %I',fn,role_name);
      end if;
    end loop;
    execute format('grant execute on function %s to service_role',fn);
  end loop;
end $acl$;
