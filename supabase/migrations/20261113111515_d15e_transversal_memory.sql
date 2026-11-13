begin;

-- Extend the existing private history; Pending Setup rows and consumers keep their keys.
alter table public.account_dialogues drop constraint account_dialogues_origin_check,
  add constraint account_dialogues_origin_check check(origin in ('pending_setup','account_niche')),
  add column version bigint not null default 0 check(version between 0 and 9007199254740991),
  add column niche_state jsonb not null default '{}'::jsonb check(jsonb_typeof(niche_state)='object'),
  add column pending_turn_token uuid,
  add column pending_turn_started_at timestamptz,
  add constraint account_dialogues_turn_check check((pending_turn_token is null)=(pending_turn_started_at is null));
alter table public.account_pending_setup_messages alter column conversation_id drop not null,
  add column dialogue_id uuid references public.account_dialogues(id) on delete restrict,
  add constraint account_messages_one_journey_check check((conversation_id is null)<>(dialogue_id is null)),
  add constraint account_messages_dialogue_ordinal_key unique(dialogue_id,ordinal);

-- All new operations are server-only invokers. Lock order: account, membership, dialogue, Summary.
create function public.assert_account_niche_actor_v1(p_account_id uuid,p_user_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.accounts where id=p_account_id and status='active' for update;
  if not found then raise exception 'niche_access_denied' using errcode='42501'; end if;
  perform 1 from public.account_users where account_id=p_account_id and user_id=p_user_id
    and status='active' and role in ('owner','admin','editor') for share;
  if not found then raise exception 'niche_access_denied' using errcode='42501'; end if;
end $$;

create function public.account_niche_snapshot_v1(p_account_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare n public.account_official_niches%rowtype; t record;
begin
  select * into n from public.account_official_niches where account_id=p_account_id;
  if found then return jsonb_build_object('revision','text:'||n.revision,'textRevision',n.revision,
    'description',n.description,'classification',n.description); end if;
  select a.taxon_id,a.updated_at,b.name,
    (a.source_type in ('manual','user_confirmed_ai') or a.user_confirmed_at is not null or exists(
      select 1 from public.account_niche_resolutions r where r.account_id=a.account_id
        and r.user_resolution_status='confirmed' and r.user_selected_taxon_id=a.taxon_id
        and r.user_confirmed_at is not null)) confirmed
    into t from public.account_taxonomy a join public.business_taxons b on b.id=a.taxon_id
    where a.account_id=p_account_id and a.is_primary and a.status='active' and b.is_active;
  return jsonb_build_object('textRevision',0,'legacyTaxonId',t.taxon_id,'legacyUpdatedAt',t.updated_at,
    'description',t.name,'classification',case when t.confirmed then t.name else 'Não identificada.' end);
end $$;

create function public.claim_account_niche_turn_v1(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
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
  if n->>'description' is not null and p_content is not null and exists(select 1 from public.account_landing_pages where account_id=p_account_id) then
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

create function public.commit_account_niche_turn_v1(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
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
  if n->>'description' is not null and p_proposal is distinct from n->>'description' and exists(select 1 from public.account_landing_pages where account_id=p_account_id) then
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

create function public.release_account_niche_turn_v1(p_dialogue_id uuid,p_account_id uuid,p_user_id uuid,
  p_expected_version bigint,p_turn_token uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
  perform public.assert_account_niche_actor_v1(p_account_id,p_user_id);
  update public.account_dialogues set pending_turn_token=null,pending_turn_started_at=null
    where id=p_dialogue_id and account_id=p_account_id and user_id=p_user_id and origin='account_niche'
      and version=p_expected_version and pending_turn_token=p_turn_token;
end $$;

create function public.confirm_account_niche_dialogue_v1(p_dialogue_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_confirmed boolean)
returns bigint language plpgsql security invoker set search_path='' as $$
declare d public.account_dialogues%rowtype; s public.account_context_summaries%rowtype;
  n jsonb; j jsonb; v_description text; v_revision bigint;
begin
  perform public.assert_account_niche_actor_v1(p_account_id,p_user_id);
  select * into strict d from public.account_dialogues where id=p_dialogue_id and account_id=p_account_id
    and user_id=p_user_id and origin='account_niche' for update;
  if p_confirmed is distinct from true then raise exception 'niche_confirmation_required' using errcode='22023'; end if;
  n:=public.account_niche_snapshot_v1(p_account_id);
  v_description:=d.niche_state->>'proposal';
  if d.ended_at is not null and d.niche_state->>'confirmedVersion'=p_expected_version::text and
    n->>'revision'=d.niche_state->>'confirmedRevision' and n->>'description'=v_description and
    exists(select 1 from public.account_context_summaries where account_id=p_account_id
      and coalesce(summary::jsonb->>'classification',summary::jsonb->>'c')=v_description) then
    return (n->>'textRevision')::bigint;
  end if;
  if p_expected_version is null or d.version<>p_expected_version or d.pending_turn_token is not null or d.ended_at is not null or
    v_description is null or n is distinct from d.niche_state->'official' then
    raise exception 'niche_changed' using errcode='40001'; end if;
  -- Calling the deployed guard inside this transaction makes a later Summary failure roll back the official write.
  v_revision:=public.confirm_account_official_niche_v1(p_account_id,p_user_id,v_description,
    (n->>'textRevision')::bigint,(n->>'legacyTaxonId')::uuid,(n->>'legacyUpdatedAt')::timestamptz,true);
  select * into strict s from public.account_context_summaries where account_id=p_account_id for update;
  j:=coalesce(s.summary::jsonb,jsonb_build_object('contextualUnderstanding',null,'confirmedUnderstanding',null,
    'classification','Não identificada.','suggestions','[]'::jsonb,'pendingReason',null));
  if jsonb_typeof(j)<>'object' then raise exception 'niche_summary_invalid' using errcode='22023'; end if;
  j:=jsonb_set(j,case when j ? 'c' then '{c}'::text[] else '{classification}'::text[] end,to_jsonb(v_description));
  if char_length(j::text)>6000 then raise exception 'niche_summary_capacity' using errcode='22023'; end if;
  if s.summary is null or s.summary::jsonb is distinct from j then
    update public.account_context_summaries set summary=j::text,source_dialogue_id=p_dialogue_id,
      source_user_id=p_user_id,updated_at=clock_timestamp() where account_id=p_account_id;
  end if;
  update public.account_dialogues set ended_at=clock_timestamp(),version=version+1,
    niche_state=niche_state||jsonb_build_object('confirmedVersion',p_expected_version,'confirmedRevision','text:'||v_revision)
    where id=p_dialogue_id;
  return v_revision;
end $$;

do $acl$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('assert_account_niche_actor_v1','account_niche_snapshot_v1',
      'claim_account_niche_turn_v1','commit_account_niche_turn_v1','release_account_niche_turn_v1','confirm_account_niche_dialogue_v1')
  loop
    execute format('revoke all on function %s from public,anon,authenticated',f);
    if to_regrole('ai_readonly') is not null then execute format('revoke all on function %s from ai_readonly',f); end if;
    if to_regrole('readonly') is not null then execute format('revoke all on function %s from readonly',f); end if;
    execute format('grant execute on function %s to service_role',f);
  end loop;
end $acl$;
commit;
