-- E10.12: gated attendance; existing transcript and legacy RPCs remain intact.
begin;

do $$
begin
  if exists (select 1 from public.business_taxons group by level, parent_id,
    public.normalize_taxon_match_text(name) having count(*) > 1) then
    raise exception 'e10_12_preexisting_taxon_collision' using errcode = '23505';
  end if;
end $$;
create unique index business_taxons_level_parent_name_uidx on public.business_taxons
  (level, parent_id, public.normalize_taxon_match_text(name)) nulls not distinct;

alter table public.account_pending_setup_conversations
  add column attendance_proposal jsonb,
  add column attendance_primary_conflict_taxon_id uuid references public.business_taxons(id),
  add column preferred_name_declined boolean not null default false,
  add column pending_turn_ordinal integer,
  add column pending_turn_intent text,
  add column last_attendance_turn_token uuid,
  add constraint account_pending_setup_attendance_proposal_chk check (
    attendance_proposal is null or (jsonb_typeof(attendance_proposal) = 'object'
      and octet_length(attendance_proposal::text) <= 16000)),
  add constraint account_pending_setup_attendance_ordinal_fk foreign key (id, pending_turn_ordinal)
    references public.account_pending_setup_messages(conversation_id, ordinal),
  add constraint account_pending_setup_attendance_intent_chk check (
    pending_turn_intent is null or pending_turn_intent in ('initialize','message','confirm','clarify')),
  drop constraint account_pending_setup_conversations_pending_turn_chk,
  add constraint account_pending_setup_conversations_pending_turn_chk check (
    (pending_turn_token is null and pending_turn_started_at is null)
    or (pending_turn_token is not null and pending_turn_started_at is not null
      and stage in ('identity','business_understanding','niche_confirmation')));

-- Infer refusal only from legacy transitions before the new attendance gate.
update public.account_pending_setup_conversations set preferred_name_declined=true
  where preferred_name is null and stage<>'identity';
-- Preserve the legacy signature, ACLs and flow across apply, gate OFF and rollback.
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
      preferred_name_declined = (v_preferred_name IS NULL),
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


create function public.assert_pending_setup_actor_v2(p_account_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.accounts a join public.account_users au on au.account_id = a.id
    where a.id = p_account_id and a.status = 'pending_setup' and au.user_id = p_user_id
      and au.status = 'active' and au.role = 'owner' for share of a, au;
  if not found then raise exception 'pending_setup_actor_not_allowed' using errcode = '42501'; end if;
end $$;

create function public.start_account_pending_setup_v2(p_account_id uuid, p_user_id uuid,
  p_preferred_name text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  insert into public.account_pending_setup_conversations(account_id,user_id,preferred_name,stage)
    values(p_account_id,p_user_id,nullif(btrim(p_preferred_name),''),
      case when nullif(btrim(p_preferred_name),'') is null then 'identity' else 'business_understanding' end)
    on conflict(account_id,user_id) do nothing returning id into v_id;
  if v_id is null then
    select id into strict v_id from public.account_pending_setup_conversations
      where account_id=p_account_id and user_id=p_user_id;
  end if;
  return v_id;
end $$;

create function public.claim_account_pending_setup_turn_v2(p_conversation_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_turn_token uuid,p_user_content text,p_intent text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare c public.account_pending_setup_conversations%rowtype; v_ordinal integer; v_version bigint;
begin
  if p_turn_token is null or p_intent is null or p_intent not in ('initialize','message','confirm','clarify') then
    raise exception 'pending_setup_turn_invalid' using errcode='22023';
  end if;
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  if c.pending_turn_token=p_turn_token and c.pending_turn_started_at > clock_timestamp()-interval '6 minutes' then
    return c.version;
  end if;
  if p_expected_version is null or c.version<>p_expected_version or
    c.stage not in ('identity','business_understanding','niche_confirmation') or
    (c.pending_turn_token is not null and c.pending_turn_started_at > clock_timestamp()-interval '6 minutes') then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_version_conflict');
  end if;
  if c.pending_turn_intent is null then
    if p_intent='initialize' then
      if exists(select 1 from public.account_pending_setup_messages where conversation_id=c.id) then
        perform public.raise_postgrest_safe_conflict_v1('pending_setup_already_initialized');
      end if;
    else
      if p_user_content is null or char_length(btrim(p_user_content)) not between 1 and 4000 or
        (p_intent='confirm' and (c.stage<>'niche_confirmation' or c.attendance_proposal is null
          or c.attendance_primary_conflict_taxon_id is not null)) then
        raise exception 'pending_setup_input_invalid' using errcode='22023';
      end if;
      select coalesce(max(ordinal),0)+1 into v_ordinal from public.account_pending_setup_messages where conversation_id=c.id;
      insert into public.account_pending_setup_messages(conversation_id,ordinal,role,content)
        values(c.id,v_ordinal,'user',btrim(p_user_content));
    end if;
  else
    v_ordinal:=c.pending_turn_ordinal; -- Recover the persisted entry, never append it again.
  end if;
  update public.account_pending_setup_conversations set pending_turn_token=p_turn_token,
    pending_turn_started_at=clock_timestamp(),pending_turn_ordinal=v_ordinal,
    pending_turn_intent=coalesce(c.pending_turn_intent,p_intent),version=version+1,updated_at=clock_timestamp()
    where id=c.id returning version into v_version;
  return v_version;
end $$;

-- Called only inside the fenced conversation transaction; table locks also serialize admin writers.
create function public.effect_pending_setup_taxonomy_v1(p_account_id uuid,p_proposal jsonb,p_confirmed boolean,
  p_operational_label text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_parent uuid; v_existing uuid; v_level text; v_name text;
  v_node jsonb; v_alias jsonb; v_index integer:=0; v_primary uuid; v_slug text;
begin
  if p_proposal is null or p_confirmed is null or
    coalesce(p_proposal->>'kind','') not in ('existing','new','operational_fallback') then
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
  else
    if not p_confirmed or nullif(btrim(p_proposal->>'evidence'),'') is null or
      jsonb_typeof(p_proposal->'sources') is distinct from 'array' or
      jsonb_array_length(p_proposal->'sources')=0 or
      jsonb_typeof(p_proposal->'chain') is distinct from 'array' or
      jsonb_array_length(p_proposal->'chain') not between 1 and 3 or
      jsonb_typeof(p_proposal->'aliases') is distinct from 'array' or
      jsonb_array_length(p_proposal->'aliases')>4 then
      raise exception 'pending_setup_market_evidence_missing' using errcode='23514';
    end if;
    if exists(select 1 from jsonb_array_elements_text(p_proposal->'sources') s
      where s is null or s !~ '^https://[^/@[:space:]]+([/:][^[:space:]]*)?$') then
      raise exception 'pending_setup_market_source_invalid' using errcode='22023';
    end if;
    for v_node in select value from jsonb_array_elements(p_proposal->'chain') loop
      v_level:=v_node->>'level'; v_name:=btrim(v_node->>'name');
      if v_level is distinct from (array['segment','niche','ultra_niche'])[v_index+1] or
        v_name is null or char_length(v_name) not between 1 and 120 or v_name ~ '[[:cntrl:]@]' then
        raise exception 'pending_setup_hierarchy_invalid' using errcode='23514';
      end if;
      v_existing:=nullif(v_node->>'existingId','')::uuid;
      select id into v_id from public.business_taxons where level=v_level and parent_id is not distinct from v_parent
        and public.normalize_taxon_match_text(name)=public.normalize_taxon_match_text(v_name);
      if v_existing is not null and v_id is distinct from v_existing then
        raise exception 'pending_setup_parent_changed' using errcode='23514';
      end if;
      if v_id is not null then
        if not exists(select 1 from public.business_taxons where id=v_id and is_active) then
          raise exception 'pending_setup_inactive_taxon' using errcode='23514';
        end if;
      else
        -- Check both names and aliases before creation, including inactive records.
        if exists(select 1 from public.business_taxon_aliases
          where public.normalize_taxon_match_text(alias_text)=public.normalize_taxon_match_text(v_name)) then
          raise exception 'pending_setup_alias_collision' using errcode='23514';
        end if;
        v_slug:=regexp_replace(public.normalize_taxon_match_text(v_name),'[^a-z0-9]+','-','g');
        v_id:=gen_random_uuid();
        if exists(select 1 from public.business_taxons where slug=v_slug) then
          -- Scoped names may be homonyms; the new node ID disambiguates the global slug.
          v_slug:=concat_ws('-',v_slug,v_level,v_id::text);
        end if;
        insert into public.business_taxons(id,parent_id,level,name,slug,is_active)
          values(v_id,v_parent,v_level,v_name,v_slug,false);
        update public.business_taxons set is_active=true where id=v_id;
      end if;
      v_parent:=v_id; v_index:=v_index+1;
    end loop;
    for v_alias in select value from jsonb_array_elements(p_proposal->'aliases') loop
      if v_alias->>'equivalence' is distinct from 'proven' or
        nullif(btrim(v_alias->>'text'),'') is null or char_length(btrim(v_alias->>'text')) not between 1 and 120 or
        nullif(btrim(v_alias->>'justification'),'') is null or
        public.normalize_taxon_match_text(v_alias->>'equivalentTo') is distinct from public.normalize_taxon_match_text(v_name) or
        public.normalize_taxon_match_text(v_alias->>'text')=public.normalize_taxon_match_text(v_name) or
        jsonb_typeof(v_alias->'evidenceUrls') is distinct from 'array' or
        jsonb_array_length(v_alias->'evidenceUrls')=0 or
        exists(select 1 from jsonb_array_elements_text(v_alias->'evidenceUrls') s
          where not p_proposal->'sources' @> jsonb_build_array(s)) or
        exists(select 1 from public.business_taxons where id<>v_id and
          public.normalize_taxon_match_text(name)=public.normalize_taxon_match_text(v_alias->>'text')) or
        exists(select 1 from public.business_taxon_aliases where
          public.normalize_taxon_match_text(alias_text)=public.normalize_taxon_match_text(v_alias->>'text')
          and (taxon_id<>v_id or not is_active)) then
        raise exception 'pending_setup_alias_not_equivalent_or_ambiguous' using errcode='23514';
      end if;
      insert into public.business_taxon_aliases(taxon_id,alias_text,is_active)
        values(v_id,btrim(v_alias->>'text'),true) on conflict(taxon_id,alias_text_normalized) do nothing;
    end loop;
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

create function public.commit_account_pending_setup_turn_v2(p_conversation_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_turn_token uuid,p_assistant_content text,
  p_summary text,p_preferred_name text,p_next_stage text,p_proposal jsonb,p_confirm boolean,
  p_preferred_name_declined boolean default false,p_reassessment boolean default false,
  p_observed_primary_taxon_id uuid default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare c public.account_pending_setup_conversations%rowtype; v_proposal jsonb; v_version bigint;
  v_ordinal integer; v_stage text:=p_next_stage; v_confirm_kind text; v_primary uuid;
  v_conflict uuid; v_keep_proposal boolean:=false;
begin
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  if c.last_attendance_turn_token=p_turn_token and c.pending_turn_token is null then return c.version; end if;
  if p_turn_token is null or p_expected_version is null or c.version<>p_expected_version or
    c.pending_turn_token is distinct from p_turn_token or
    c.pending_turn_started_at < clock_timestamp()-interval '6 minutes' then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_version_conflict');
  end if;
  if p_assistant_content is null or char_length(btrim(p_assistant_content)) not between 1 and 4000 or
    p_next_stage is null or p_next_stage not in ('identity','business_understanding','niche_confirmation','ready_to_complete') or
    p_preferred_name_declined is null or (p_preferred_name_declined and p_preferred_name is not null) or
    p_confirm is null or (p_confirm and c.pending_turn_intent<>'confirm') or
    (not p_confirm and c.pending_turn_intent='confirm') then
    raise exception 'pending_setup_turn_invalid' using errcode='22023';
  end if;
  if p_reassessment is null or (p_confirm and c.attendance_primary_conflict_taxon_id is not null) then
    raise exception 'pending_setup_confirmation_blocked' using errcode='22023';
  end if;
  -- Also serialize the absence of a primary against administrative inserts.
  lock table public.business_taxons,public.business_taxon_aliases,public.account_taxonomy in share row exclusive mode;
  select taxon_id into v_primary from public.account_taxonomy
    where account_id=p_account_id and is_primary and status='active';
  if v_primary is distinct from p_observed_primary_taxon_id then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_primary_conflict');
  end if;
  v_conflict:=c.attendance_primary_conflict_taxon_id;
  v_proposal:=case when p_confirm then c.attendance_proposal else p_proposal end;
  if p_reassessment and v_primary is not null then
    if v_proposal->>'kind'='existing' and v_proposal->>'taxonId'=v_primary::text and v_stage='niche_confirmation' then
      if not exists(select 1 from public.business_taxons where id=v_primary and is_active) then
        raise exception 'pending_setup_inactive_taxon' using errcode='23514';
      end if;
      v_conflict:=null; -- New current proposal still requires a new lead confirmation.
      v_confirm_kind:='official';
    elsif v_proposal is null and v_stage='business_understanding' then
      v_proposal:=c.attendance_proposal; v_conflict:=v_primary; v_keep_proposal:=true;
    else
      raise exception 'pending_setup_reassessment_invalid' using errcode='23514';
    end if;
  elsif p_reassessment then
    v_conflict:=null; -- Primary removed; only newly validated output can advance.
  end if;
  if p_confirm or (v_proposal->>'kind'='existing' and v_stage='ready_to_complete') then
    perform public.effect_pending_setup_taxonomy_v1(p_account_id,v_proposal,p_confirm,p_summary);
    v_stage:='ready_to_complete'; v_proposal:=null;
  elsif v_stage='ready_to_complete' then
    raise exception 'pending_setup_taxonomy_not_committed' using errcode='23514';
  elsif v_proposal is not null and not v_keep_proposal then
    if coalesce(v_proposal->>'kind','') not in ('new','existing','operational_fallback') or v_stage<>'niche_confirmation'
      or (v_proposal->>'kind'='existing' and (not p_reassessment or v_primary is null or v_proposal->>'taxonId'<>v_primary::text)) then
      raise exception 'pending_setup_proposal_invalid' using errcode='22023';
    end if;
    v_confirm_kind:=case when v_proposal->>'kind' in ('new','existing') then 'official' else 'operational_fallback' end;
  elsif v_stage='niche_confirmation' then
    raise exception 'pending_setup_proposal_missing' using errcode='23514';
  end if;
  select coalesce(max(ordinal),0)+1 into v_ordinal from public.account_pending_setup_messages where conversation_id=c.id;
  insert into public.account_pending_setup_messages(conversation_id,ordinal,role,content)
    values(c.id,v_ordinal,'assistant',btrim(p_assistant_content));
  update public.account_pending_setup_conversations set
    preferred_name=case when p_preferred_name_declined then null else coalesce(nullif(btrim(p_preferred_name),''),preferred_name) end,
    preferred_name_declined=p_preferred_name_declined,
    business_context_text=case when v_keep_proposal then c.business_context_text
      else coalesce(nullif(btrim(p_summary),''),c.business_context_text) end,stage=v_stage,confirmation_kind=v_confirm_kind,
    attendance_proposal=v_proposal,attendance_primary_conflict_taxon_id=v_conflict,
    pending_turn_token=null,pending_turn_started_at=null,
    pending_turn_ordinal=null,pending_turn_intent=null,last_attendance_turn_token=p_turn_token,
    version=version+1,updated_at=clock_timestamp()
    where id=c.id returning version into v_version;
  return v_version;
end $$;

create function public.release_account_pending_setup_turn_v2(p_conversation_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_turn_token uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare c public.account_pending_setup_conversations%rowtype; v_version bigint;
begin
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  if p_expected_version is null or c.version<>p_expected_version or p_turn_token is null or
    c.pending_turn_token is distinct from p_turn_token then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_version_conflict');
  end if;
  update public.account_pending_setup_conversations set pending_turn_token=null,pending_turn_started_at=null,
    version=version+1,updated_at=clock_timestamp() where id=c.id returning version into v_version;
  -- Preserve ordinal and intent for retry without a second user message.
  return v_version;
end $$;
create function public.recover_account_pending_setup_primary_conflict_v2(p_conversation_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_turn_token uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare c public.account_pending_setup_conversations%rowtype; v_primary uuid; v_target uuid; v_version bigint;
begin
  select * into strict c from public.account_pending_setup_conversations
    where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id for update;
  perform public.assert_pending_setup_actor_v2(p_account_id,p_user_id);
  if p_turn_token is not null and c.last_attendance_turn_token=p_turn_token and c.pending_turn_token is null then
    return c.version;
  end if;
  if p_expected_version is null or c.version<>p_expected_version or p_turn_token is null or
    c.pending_turn_token is distinct from p_turn_token or
    c.pending_turn_started_at < clock_timestamp()-interval '6 minutes' then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_version_conflict');
  end if;
  lock table public.business_taxons,public.business_taxon_aliases,public.account_taxonomy in share row exclusive mode;
  select taxon_id into v_primary from public.account_taxonomy
    where account_id=p_account_id and is_primary and status='active';
  if c.attendance_proposal->>'kind'='existing' then v_target:=(c.attendance_proposal->>'taxonId')::uuid; end if;
  update public.account_pending_setup_conversations set
    attendance_primary_conflict_taxon_id=case when v_primary is distinct from v_target then v_primary else null end,
    stage='business_understanding',confirmation_kind=null,
    pending_turn_token=null,pending_turn_started_at=null,pending_turn_ordinal=null,pending_turn_intent=null,
    last_attendance_turn_token=p_turn_token,version=version+1,updated_at=clock_timestamp()
    where id=c.id returning version into v_version;
  -- Preserve the original proposal, confirmed summary and append-only user confirmation.
  return v_version;
end $$;

-- Service-only; helper effect cannot be called outside the fenced turn by service consumers.
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('assert_pending_setup_actor_v2',
      'start_account_pending_setup_v2','claim_account_pending_setup_turn_v2',
      'effect_pending_setup_taxonomy_v1','commit_account_pending_setup_turn_v2','release_account_pending_setup_turn_v2',
      'recover_account_pending_setup_primary_conflict_v2') loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',r.signature);
    if to_regrole('ai_readonly') is not null then execute format('revoke all on function %s from ai_readonly',r.signature); end if;
    if r.proname not in ('effect_pending_setup_taxonomy_v1','assert_pending_setup_actor_v2') then
      execute format('grant execute on function %s to service_role',r.signature);
    end if;
  end loop;
end $$;

-- Extend current allowlists without restoring retired workloads or changing old constraints.
do $$
declare r record; v_expression text;
begin
  for r in select c.oid,c.conname,c.conrelid from pg_constraint c
    where c.contype='c' and c.conrelid in (
      'public.openai_workload_configuration_revisions'::regclass,
      'public.openai_workload_operational_configurations'::regclass,
      'public.openai_workload_configuration_activations'::regclass,
      'public.openai_cost_executions'::regclass,'public.openai_cost_coverage'::regclass)
      and c.conname in (
        'openai_workload_configuration_revisions_workload_chk','openai_workload_configuration_revisions_modality_chk',
        'openai_workload_operational_configurations_workload_chk','openai_workload_operational_configurations_modality_chk',
        'openai_workload_configuration_activations_workload_chk','openai_workload_configuration_activations_modality_chk',
        'openai_cost_executions_workload_check','openai_cost_coverage_workload_check') loop
    v_expression:=pg_get_expr((select conbin from pg_constraint where oid=r.oid),r.conrelid);
    execute format('alter table %s drop constraint %I',r.conrelid::regclass,r.conname);
    execute format('alter table %s add constraint %I check ((%s) or (workload=%L%s))',
      r.conrelid::regclass,r.conname,v_expression,'pending_setup_conversation',
      case when r.conname like '%modality_chk' then ' and modality=''responses_text''' else '' end);
  end loop;
end $$;

insert into public.openai_workload_configuration_revisions(environment,workload,modality,revision_number,
  model,reasoning_effort,quality,validated_by,proof_metadata)
select environment,'pending_setup_conversation','responses_text',1,'gpt-6-luna','xhigh',null,null,
  '{"schema_version":1,"proof_kind":"bootstrap","proof_result":"approved","source":"repo_catalog"}'::jsonb
from (values('preview'),('production')) e(environment);
insert into public.openai_workload_operational_configurations(environment,workload,modality,active_revision_id)
select environment,workload,modality,id from public.openai_workload_configuration_revisions
  where workload='pending_setup_conversation' and revision_number=1;
insert into public.openai_workload_configuration_activations(environment,workload,modality,activation_number,
  event_type,previous_revision_id,target_revision_id,actor_user_id)
select environment,workload,modality,1,'bootstrap',null,active_revision_id,null
from public.openai_workload_operational_configurations where workload='pending_setup_conversation';
-- Bootstrap registers the candidate only: feature remains OFF until a real eligible operational proof.
insert into public.openai_cost_coverage(environment,workload,activated_at,contract_version,metadata)
select environment,'pending_setup_conversation',now(),'e21.5.6-v2','{"source":"e10_12_prospective"}'::jsonb
from (values('preview'),('production'),('development')) e(environment);
commit;
