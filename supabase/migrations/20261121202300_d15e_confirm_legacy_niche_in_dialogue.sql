-- Allow D14D to confirm the unchanged, unconfirmed legacy niche through Dialogue.
-- Existing RPC signatures, locks and grants remain in effect.
begin;

create or replace function public.claim_account_niche_turn_v1(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_request_id uuid,p_turn_token uuid,p_content text,p_expected_revision text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.account_dialogues%rowtype; s public.account_context_summaries%rowtype;
  n jsonb; v_ordinal integer; v_existing public.account_pending_setup_messages%rowtype;
begin
  perform public.assert_account_niche_actor_v1(p_account_id,p_user_id);
  if p_dialogue_id is null or p_request_id is null or p_turn_token is null or p_expected_version is null or
    (p_content is not null and (p_content<>btrim(p_content) or char_length(p_content) not between 1 and 4000)) then
    raise exception 'niche_turn_invalid' using errcode='22023';
  end if;
  n:=public.account_niche_snapshot_v1(p_account_id);
  -- The readable legacy revision is generated in TypeScript; compare its exact timestamp separately below.
  if n->>'revision' is not null and n->>'revision' is distinct from p_expected_revision or
    n->>'description' is null and p_expected_revision is not null then
    raise exception 'niche_changed' using errcode='40001';
  end if;
  if n->>'description' is not null and p_content is not null
    and exists(select 1 from public.account_landing_pages where account_id=p_account_id)
    and (n->>'revision' is not null or not exists (
      select 1 from public.account_taxonomy a where a.account_id=p_account_id
        and a.taxon_id=(n->>'legacyTaxonId')::uuid and a.is_primary and a.status='active'
        and a.source_type not in ('manual','user_confirmed_ai') and a.user_confirmed_at is null
        and not exists (select 1 from public.account_niche_resolutions r where r.account_id=a.account_id
          and r.user_resolution_status='confirmed' and r.user_selected_taxon_id=a.taxon_id
          and r.user_confirmed_at is not null)
    )) then
    raise exception 'niche_product_exists' using errcode='23514';
  end if;
  if p_expected_version=0 then
    insert into public.account_dialogues(id,account_id,user_id,origin,niche_state)
      values(p_dialogue_id,p_account_id,p_user_id,'account_niche',jsonb_build_object('official',n,'expectedRevision',p_expected_revision))
      on conflict(id) do nothing;
  end if;
  select * into strict d from public.account_dialogues where id=p_dialogue_id
    and account_id=p_account_id and user_id=p_user_id and origin='account_niche' for update;
  if d.niche_state->'official' is distinct from n or d.niche_state->>'expectedRevision' is distinct from p_expected_revision then
    raise exception 'niche_changed' using errcode='40001'; end if;
  if d.niche_state->>'lastRequestId'=p_request_id::text then
    return jsonb_build_object('replay',true,'version',d.version,'state',d.niche_state);
  end if;
  if d.ended_at is not null or (d.version<>p_expected_version and d.niche_state->>'requestId' is distinct from p_request_id::text) or
    (d.pending_turn_token is not null and d.pending_turn_started_at>clock_timestamp()-interval '6 minutes') then
    raise exception 'niche_turn_conflict' using errcode='40001'; end if;
  if p_content is not null then
    select * into v_existing from public.account_pending_setup_messages where id=p_request_id;
    if found then
      if v_existing.dialogue_id is distinct from p_dialogue_id or v_existing.role<>'user' or v_existing.content<>p_content then
        raise exception 'niche_request_conflict' using errcode='40001'; end if;
    else
      select coalesce(max(ordinal),0)+1 into v_ordinal from public.account_pending_setup_messages where dialogue_id=p_dialogue_id;
      insert into public.account_pending_setup_messages(id,dialogue_id,ordinal,role,content)
        values(p_request_id,p_dialogue_id,v_ordinal,'user',p_content);
    end if;
  end if;
  update public.account_dialogues set version=version+1,pending_turn_token=p_turn_token,
    pending_turn_started_at=clock_timestamp(),niche_state=(niche_state-'proposal')||jsonb_build_object('requestId',p_request_id)
    where id=p_dialogue_id returning * into d;
  insert into public.account_context_summaries(account_id) values(p_account_id) on conflict(account_id) do nothing;
  select * into strict s from public.account_context_summaries where account_id=p_account_id;
  return jsonb_build_object('replay',false,'version',d.version,'state',d.niche_state,
    'summary',s.summary,'summaryUpdatedAt',s.updated_at,'recent',coalesce((select jsonb_agg(m order by m.ordinal)
      from(select role,content,ordinal from public.account_pending_setup_messages where dialogue_id=p_dialogue_id
        order by ordinal desc limit 8)m),'[]'::jsonb));
end $$;

create or replace function public.commit_account_niche_turn_v1(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_turn_token uuid,p_reply text,p_understanding text,p_proposal text,
  p_summary text,p_observed_summary text,p_observed_summary_updated_at timestamptz)
returns bigint language plpgsql security invoker set search_path='' as $$
declare d public.account_dialogues%rowtype; s public.account_context_summaries%rowtype;
  n jsonb; j jsonb; v_ordinal integer; v_version bigint;
begin
  perform public.assert_account_niche_actor_v1(p_account_id,p_user_id);
  select * into strict d from public.account_dialogues where id=p_dialogue_id and account_id=p_account_id
    and user_id=p_user_id and origin='account_niche' for update;
  if p_expected_version is null or d.version<>p_expected_version or p_turn_token is null or d.pending_turn_token is distinct from p_turn_token or
    d.pending_turn_started_at<clock_timestamp()-interval '6 minutes' or d.ended_at is not null then
    raise exception 'niche_turn_conflict' using errcode='40001'; end if;
  n:=public.account_niche_snapshot_v1(p_account_id);
  if n is distinct from d.niche_state->'official' then raise exception 'niche_changed' using errcode='40001'; end if;
  if n->>'description' is not null and p_proposal is not null and p_proposal is distinct from n->>'description' and exists(select 1 from public.account_landing_pages where account_id=p_account_id) then
    raise exception 'niche_product_exists' using errcode='23514'; end if;
  if p_reply is null or char_length(btrim(p_reply)) not between 1 and 4000 or p_understanding is null or
    char_length(p_understanding)>4000 or (p_proposal is not null and (p_proposal<>btrim(p_proposal) or
      char_length(p_proposal) not between 1 and 120 or p_proposal ~ '[[:cntrl:]<>]' or strpos(p_reply,p_proposal)=0)) then
    raise exception 'niche_turn_invalid' using errcode='22023'; end if;
  select * into strict s from public.account_context_summaries where account_id=p_account_id for update;
  if s.summary is distinct from p_observed_summary or s.updated_at is distinct from p_observed_summary_updated_at then
    raise exception 'niche_summary_changed' using errcode='40001'; end if;
  if p_summary is not null then
    j:=p_summary::jsonb;
    if jsonb_typeof(j)<>'object' then raise exception 'niche_summary_invalid' using errcode='22023'; end if;
    j:=jsonb_set(j,'{classification}',to_jsonb(coalesce(n->>'classification','Não identificada.')));
    if char_length(j::text)>6000 then raise exception 'niche_summary_capacity' using errcode='22023'; end if;
    if s.summary is null or s.summary::jsonb is distinct from j then
      update public.account_context_summaries set summary=j::text,source_dialogue_id=p_dialogue_id,
        source_user_id=p_user_id,updated_at=clock_timestamp() where account_id=p_account_id;
    end if;
  end if;
  select coalesce(max(ordinal),0)+1 into v_ordinal from public.account_pending_setup_messages where dialogue_id=p_dialogue_id;
  insert into public.account_pending_setup_messages(id,dialogue_id,ordinal,role,content)
    values(p_turn_token,p_dialogue_id,v_ordinal,'assistant',p_reply);
  update public.account_dialogues set version=version+1,pending_turn_token=null,pending_turn_started_at=null,
    niche_state=niche_state||jsonb_build_object('lastRequestId',niche_state->>'requestId','reply',p_reply,
      'understanding',case when p_understanding<>'' then p_understanding else coalesce(niche_state->>'understanding','') end,
      'proposal',p_proposal) where id=p_dialogue_id returning version into v_version;
  return v_version;
end $$;

commit;
