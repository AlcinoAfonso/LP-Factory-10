-- E10.12 revised V1: existing catalogue confirmation and contextual sales attendance.
-- Forward-only definitions and grants; no historical data conversion or backfill.
begin;

create or replace function public.effect_pending_setup_taxonomy_v1(p_account_id uuid,p_proposal jsonb,p_confirmed boolean,
  p_operational_label text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_primary uuid;
begin
  if p_proposal is null or p_confirmed is distinct from true or
    coalesce(p_proposal->>'kind','') not in ('existing','operational_fallback') or
    jsonb_typeof(p_proposal) is distinct from 'object' or
    (p_proposal - array['kind','taxonId','taxonName']) <> '{}'::jsonb then
    raise exception 'pending_setup_proposal_invalid' using errcode='22023';
  end if;
  lock table public.business_taxons,public.business_taxon_aliases,public.account_taxonomy in share row exclusive mode;
  if p_proposal->>'kind'='operational_fallback' then
    if not p_confirmed or nullif(btrim(p_operational_label),'') is null or exists(
      select 1 from public.account_taxonomy where account_id=p_account_id and is_primary and status='active') then
      raise exception 'pending_setup_fallback_invalid' using errcode='23514';
    end if;
    insert into public.account_niche_resolutions(account_id,raw_input,confidence,
      ai_escalation_mode,reason,resolution_status,user_resolution_status,user_rewrite_input,user_confirmed_at)
      values(p_account_id,p_operational_label,'low','none','no_candidates','unclassified',
        'confirmed',p_operational_label,clock_timestamp())
      on conflict(account_id) do update set user_resolution_status='confirmed',user_selected_taxon_id=null,
        user_rewrite_input=excluded.user_rewrite_input,user_confirmed_at=excluded.user_confirmed_at;
    return null;
  elsif p_proposal->>'kind'='existing' then
    v_id:=(p_proposal->>'taxonId')::uuid;
  end if;
  if not exists(select 1 from public.business_taxons leaf
    left join public.business_taxons parent on parent.id=leaf.parent_id
    left join public.business_taxons grandparent on grandparent.id=parent.parent_id
    where leaf.id=v_id and leaf.is_active and (
      (leaf.level='segment' and leaf.parent_id is null) or
      (leaf.level='niche' and parent.level='segment' and parent.is_active and parent.parent_id is null) or
      (leaf.level='ultra_niche' and parent.level='niche' and parent.is_active
        and grandparent.level='segment' and grandparent.is_active and grandparent.parent_id is null))) then
    raise exception 'pending_setup_active_hierarchy_missing' using errcode='23514';
  end if;
  select taxon_id into v_primary from public.account_taxonomy
    where account_id=p_account_id and is_primary and status='active' for update;
  if v_primary is not null and v_primary<>v_id then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_primary_conflict');
  end if;
  if v_primary=v_id then return v_id; end if; -- Preserve administrative provenance.
  insert into public.account_taxonomy(account_id,taxon_id,is_primary,status,source_type)
    values(p_account_id,v_id,true,'active','user_confirmed_ai')
    on conflict(account_id,taxon_id) do update set is_primary=true,status='active',source_type='user_confirmed_ai';
  return v_id;
end $$;

create function public.commit_account_pending_setup_turn_v3(p_conversation_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_turn_token uuid,p_assistant_content text,
  p_summary text,p_business_understanding text,p_preferred_name text,p_next_stage text,p_proposal jsonb,p_confirm boolean,
  p_preferred_name_declined boolean default false,p_observed_primary_taxon_id uuid default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare c public.account_pending_setup_conversations%rowtype; v_proposal jsonb; v_version bigint;
  v_ordinal integer; v_stage text:=p_next_stage; v_confirm_kind text; v_primary uuid;
  v_now timestamptz:=clock_timestamp();
begin
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  if p_turn_token is not null and c.last_attendance_turn_token=p_turn_token and c.pending_turn_token is null then
    return c.version;
  end if;
  if p_turn_token is null or p_expected_version is null or c.version<>p_expected_version or
    c.pending_turn_token is distinct from p_turn_token or c.pending_turn_started_at is null or
    c.pending_turn_started_at < v_now-interval '6 minutes' then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_version_conflict');
  end if;
  if p_assistant_content is null or char_length(btrim(p_assistant_content)) not between 1 and 4000 or
    p_summary is null or char_length(p_summary)>4000 or
    p_business_understanding is null or char_length(p_business_understanding)>4000 or
    p_next_stage is null or p_next_stage not in ('identity','business_understanding','niche_confirmation','ready_to_complete') or
    p_preferred_name_declined is null or (p_preferred_name_declined and p_preferred_name is not null) or
    p_confirm is null or (p_confirm and c.pending_turn_intent is distinct from 'confirm') or
    (not p_confirm and c.pending_turn_intent='confirm') then
    raise exception 'pending_setup_turn_invalid' using errcode='22023';
  end if;
  -- Protect also the absence of a primary against administrative inserts.
  lock table public.business_taxons,public.business_taxon_aliases,public.account_taxonomy in share row exclusive mode;
  select taxon_id into v_primary from public.account_taxonomy
    where account_id=p_account_id and is_primary and status='active';
  if v_primary is distinct from p_observed_primary_taxon_id then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_primary_conflict');
  end if;
  v_proposal:=case when p_confirm then c.attendance_proposal else p_proposal end;
  if p_confirm then
    if c.stage<>'niche_confirmation' or v_stage not in ('business_understanding','ready_to_complete') then
      raise exception 'pending_setup_confirmation_invalid' using errcode='23514';
    end if;
    perform public.effect_pending_setup_taxonomy_v1(p_account_id,v_proposal,true,c.business_context_text);
    v_proposal:=null;
  elsif v_proposal is not null then
    if jsonb_typeof(v_proposal) is distinct from 'object' or
      (v_proposal-array['kind','taxonId','taxonName'])<>'{}'::jsonb or
      coalesce(v_proposal->>'kind','') not in ('existing','operational_fallback') or
      v_stage<>'niche_confirmation' or nullif(btrim(p_business_understanding),'') is null then
      raise exception 'pending_setup_proposal_invalid' using errcode='22023';
    end if;
    if v_proposal->>'kind'='existing' then
      -- This validates the displayed proposal only. No official effect before confirmation.
      if not exists(select 1 from public.business_taxons where id=(v_proposal->>'taxonId')::uuid
        and is_active and name=v_proposal->>'taxonName') or
        (v_primary is not null and v_primary is distinct from (v_proposal->>'taxonId')::uuid) then
        raise exception 'pending_setup_proposal_invalid' using errcode='23514';
      end if;
      v_confirm_kind:='official';
    else
      if v_primary is not null or v_proposal->'taxonId' is distinct from 'null'::jsonb or
        v_proposal->'taxonName' is distinct from 'null'::jsonb then
        raise exception 'pending_setup_fallback_invalid' using errcode='23514';
      end if;
      v_confirm_kind:='operational_fallback';
    end if;
  elsif v_stage='niche_confirmation' then
    raise exception 'pending_setup_proposal_missing' using errcode='23514';
  end if;
  if v_stage='ready_to_complete' then
    select taxon_id into v_primary from public.account_taxonomy
      where account_id=p_account_id and is_primary and status='active';
    if v_primary is not null then
      perform public.effect_pending_setup_taxonomy_v1(p_account_id,
        jsonb_build_object('kind','existing','taxonId',v_primary),true,null);
    elsif not exists(select 1 from public.account_niche_resolutions where account_id=p_account_id
      and user_resolution_status='confirmed' and user_selected_taxon_id is null
      and nullif(btrim(raw_input),'') is not null and nullif(btrim(user_rewrite_input),'') is not null) then
      raise exception 'pending_setup_understanding_not_confirmed' using errcode='23514';
    end if;
    if nullif(btrim(case when p_confirm then c.business_context_text else p_business_understanding end),'') is null then
      raise exception 'pending_setup_understanding_missing' using errcode='23514';
    end if;
  end if;
  select coalesce(max(ordinal),0)+1 into v_ordinal from public.account_pending_setup_messages where conversation_id=c.id;
  insert into public.account_pending_setup_messages(conversation_id,ordinal,role,content)
    values(c.id,v_ordinal,'assistant',btrim(p_assistant_content));
  update public.account_context_summaries set
    summary=btrim(p_summary),source_dialogue_id=c.id,source_user_id=p_user_id,updated_at=v_now
    where account_id=p_account_id and nullif(btrim(p_summary),'') is not null
      and summary is distinct from btrim(p_summary);
  update public.account_pending_setup_conversations set
    preferred_name=case when p_preferred_name_declined then null else coalesce(nullif(btrim(p_preferred_name),''),preferred_name) end,
    preferred_name_declined=p_preferred_name_declined,
    business_context_text=case when p_confirm then c.business_context_text
      else coalesce(nullif(btrim(p_business_understanding),''),c.business_context_text) end,
    stage=v_stage,confirmation_kind=v_confirm_kind,attendance_proposal=v_proposal,
    pending_turn_token=null,pending_turn_started_at=null,pending_turn_ordinal=null,pending_turn_intent=null,
    last_attendance_turn_token=p_turn_token,version=version+1,updated_at=v_now
    where id=c.id returning version into v_version;
  return v_version;
end $$;

revoke all on function public.commit_account_pending_setup_turn_v2(uuid,uuid,uuid,bigint,uuid,text,text,text,text,jsonb,boolean,boolean,uuid)
  from public, anon, authenticated, service_role, readonly;
revoke all on function public.commit_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid)
  from public, anon, authenticated, readonly;
grant execute on function public.commit_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid) to service_role;
revoke all on function public.effect_pending_setup_taxonomy_v1(uuid,jsonb,boolean,text)
  from public, anon, authenticated, service_role, readonly;

commit;
