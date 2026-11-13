begin;
create table public.account_official_niches (
  account_id uuid primary key references public.accounts(id),
  description text not null check (description=btrim(description) and char_length(description) between 1 and 120
    and description !~ '[[:cntrl:]<>]'),
  revision bigint not null check (revision between 1 and 9007199254740991),
  confirmed_by uuid not null,
  confirmed_at timestamptz not null,
  foreign key (account_id,confirmed_by) references public.account_users(account_id,user_id)
);
alter table public.account_official_niches enable row level security;
revoke all on public.account_official_niches from public,anon,authenticated;
grant select,insert,update on public.account_official_niches to service_role;

create function public.confirm_account_official_niche_v1(
  p_account_id uuid,p_actor_user_id uuid,p_description text,p_expected_revision bigint,
  p_expected_legacy_taxon_id uuid,p_expected_legacy_updated_at timestamptz,p_confirmed boolean
) returns bigint language plpgsql security invoker set search_path='' as $fn$
declare
  v_current public.account_official_niches%rowtype;
  v_legacy uuid; v_legacy_time timestamptz; v_legacy_name text; v_revision bigint;
begin
  if p_confirmed is distinct from true or p_expected_revision is null or
    p_description is null or p_description<>btrim(p_description) or
    char_length(p_description) not between 1 and 120 or p_description ~ '[[:cntrl:]<>]' then
    raise exception using errcode='22023',message='niche_confirmation_required';
  end if;
  perform 1 from public.accounts where id=p_account_id and status='active' for update;
  if not found then raise exception using errcode='42501',message='niche_access_denied'; end if;
  perform 1 from public.account_users where account_id=p_account_id and user_id=p_actor_user_id
    and status='active' and role in ('owner','admin','editor') for share;
  if not found then raise exception using errcode='42501',message='niche_access_denied'; end if;
  select * into v_current from public.account_official_niches where account_id=p_account_id for update;
  if coalesce(v_current.revision,0)<>p_expected_revision then
    raise exception using errcode='40001',message='niche_changed';
  end if;
  if v_current.account_id is null then
    select t.taxon_id,t.updated_at,b.name into v_legacy,v_legacy_time,v_legacy_name
      from public.account_taxonomy t join public.business_taxons b on b.id=t.taxon_id
      where t.account_id=p_account_id and t.is_primary and t.status='active' and b.is_active for update of t;
    if v_legacy is distinct from p_expected_legacy_taxon_id or
      v_legacy_time is distinct from p_expected_legacy_updated_at then
      raise exception using errcode='40001',message='niche_changed';
    end if;
  end if;
  if coalesce(v_current.description,v_legacy_name) is not null and
    coalesce(v_current.description,v_legacy_name) is distinct from p_description and
    exists(select 1 from public.account_landing_pages where account_id=p_account_id) then
    raise exception using errcode='23514',message='niche_product_exists';
  end if;
  if v_current.description=p_description then return v_current.revision; end if;
  v_revision:=coalesce(v_current.revision,0)+1;
  insert into public.account_official_niches(account_id,description,revision,confirmed_by,confirmed_at)
    values(p_account_id,p_description,v_revision,p_actor_user_id,clock_timestamp())
    on conflict(account_id) do update set description=excluded.description,revision=excluded.revision,
      confirmed_by=excluded.confirmed_by,confirmed_at=excluded.confirmed_at;
  return v_revision;
end;
$fn$;
revoke all on function public.confirm_account_official_niche_v1(uuid,uuid,text,bigint,uuid,timestamptz,boolean)
  from public,anon,authenticated;
grant execute on function public.confirm_account_official_niche_v1(uuid,uuid,text,bigint,uuid,timestamptz,boolean)
  to service_role;

create function public.commit_account_pending_setup_turn_v4(p_conversation_id uuid,p_account_id uuid,
  p_user_id uuid,p_expected_version bigint,p_turn_token uuid,p_assistant_content text,
  p_summary text,p_business_understanding text,p_preferred_name text,p_next_stage text,p_proposal jsonb,p_confirm boolean,
  p_preferred_name_declined boolean default false,p_observed_primary_taxon_id uuid default null,p_observed_niche_revision bigint default 0)
returns bigint language plpgsql security definer set search_path = '' as $$
declare c public.account_pending_setup_conversations%rowtype; v_proposal jsonb; v_version bigint;
  v_ordinal integer; v_stage text:=p_next_stage; v_confirm_kind text; v_primary uuid; v_legacy_name text;
  v_now timestamptz:=clock_timestamp(); v_niche public.account_official_niches%rowtype;
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
    p_summary is null or char_length(p_summary)>6000 or
    p_business_understanding is null or char_length(p_business_understanding)>4000 or
    p_next_stage is null or p_next_stage not in ('identity','business_understanding','niche_confirmation','ready_to_complete') or
    p_preferred_name_declined is null or (p_preferred_name_declined and p_preferred_name is not null) or
    p_confirm is null or (p_confirm and c.pending_turn_intent is distinct from 'confirm') or
    (not p_confirm and c.pending_turn_intent='confirm') then
    raise exception 'pending_setup_turn_invalid' using errcode='22023';
  end if;

  perform 1 from public.accounts where id=p_account_id for update;
  perform 1 from public.account_users where account_id=p_account_id and user_id=p_user_id and status='active' and role='owner' for share;
  if not found then raise exception 'pending_setup_actor_not_allowed' using errcode='42501'; end if;
  select * into v_niche from public.account_official_niches where account_id=p_account_id for update;
  if coalesce(v_niche.revision,0) is distinct from p_observed_niche_revision then
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_primary_conflict');
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
    if coalesce((v_proposal->>'expectedNicheRevision')::bigint,0)<>coalesce(v_niche.revision,0) then
      perform public.raise_postgrest_safe_conflict_v1('pending_setup_primary_conflict');
    end if;
    if c.stage<>'niche_confirmation' or v_stage not in ('business_understanding','ready_to_complete') then
      raise exception 'pending_setup_confirmation_invalid' using errcode='23514';
    end if;

    if v_proposal->>'kind'='semantic' then
      if (v_proposal-array['kind','taxonId','taxonName','nicheDescription','expectedNicheRevision'])<>'{}'::jsonb or
        v_proposal->'taxonId' is distinct from 'null'::jsonb or v_proposal->'taxonName' is distinct from 'null'::jsonb or
        nullif(btrim(v_proposal->>'nicheDescription'),'') is null or
        char_length(v_proposal->>'nicheDescription')>120 or v_proposal->>'nicheDescription' ~ '[[:cntrl:]<>]' then
        raise exception 'pending_setup_proposal_invalid' using errcode='23514';
      end if;
      select b.name into v_legacy_name
        from public.account_taxonomy t join public.business_taxons b on b.id=t.taxon_id
        where t.account_id=p_account_id and t.is_primary and t.status='active' and b.is_active
          and (t.source_type in ('manual','user_confirmed_ai') or t.user_confirmed_at is not null or exists(
            select 1 from public.account_niche_resolutions r where r.account_id=p_account_id
              and r.user_resolution_status='confirmed' and r.user_selected_taxon_id=t.taxon_id
              and r.user_confirmed_at is not null));
      if coalesce(v_niche.description,v_legacy_name) is not null
        and coalesce(v_niche.description,v_legacy_name) is distinct from v_proposal->>'nicheDescription'
        and exists(select 1 from public.account_landing_pages where account_id=p_account_id) then
        raise exception 'niche_product_exists' using errcode='23514';
      end if;
      if v_niche.description is distinct from v_proposal->>'nicheDescription' then
        insert into public.account_official_niches(account_id,description,revision,confirmed_by,confirmed_at)
          values(p_account_id,v_proposal->>'nicheDescription',coalesce(v_niche.revision,0)+1,p_user_id,v_now)
          on conflict(account_id) do update set description=excluded.description,revision=excluded.revision,
            confirmed_by=excluded.confirmed_by,confirmed_at=excluded.confirmed_at;
      end if;
    elsif v_proposal->>'kind'='operational_fallback' and v_primary is not null and not exists(select 1 from public.account_taxonomy t where t.account_id=p_account_id and t.is_primary and t.status='active'
 and (t.source_type in ('manual','user_confirmed_ai') or t.user_confirmed_at is not null or exists(
 select 1 from public.account_niche_resolutions r where r.account_id=p_account_id and r.user_resolution_status='confirmed'
 and r.user_selected_taxon_id=t.taxon_id and r.user_confirmed_at is not null))) then
      insert into public.account_niche_resolutions(account_id,raw_input,confidence,ai_escalation_mode,reason,resolution_status,user_resolution_status,user_rewrite_input,user_confirmed_at)
 values(p_account_id,c.business_context_text,'low','none','no_candidates','unclassified','confirmed',c.business_context_text,v_now)
 on conflict(account_id) do update set user_resolution_status='confirmed',user_selected_taxon_id=null,user_rewrite_input=excluded.user_rewrite_input,user_confirmed_at=excluded.user_confirmed_at;
    else
      perform public.effect_pending_setup_taxonomy_v1(p_account_id,v_proposal,true,c.business_context_text);
      if v_proposal->>'kind'='existing' then
        update public.account_taxonomy set user_confirmed_at=v_now
          where account_id=p_account_id and taxon_id=(v_proposal->>'taxonId')::uuid
            and is_primary and status='active' and source_type='taxonomy_match'
            and user_confirmed_at is null;
      end if;
    end if;
    v_proposal:=null;
  elsif v_proposal is not null then
    if jsonb_typeof(v_proposal) is distinct from 'object' or
      (v_proposal-array['kind','taxonId','taxonName','nicheDescription','expectedNicheRevision'])<>'{}'::jsonb or
      coalesce(v_proposal->>'kind','') not in ('existing','operational_fallback','semantic') or
      v_stage<>'niche_confirmation' or nullif(btrim(p_business_understanding),'') is null then
      raise exception 'pending_setup_proposal_invalid' using errcode='22023';
    end if;

    if v_proposal->>'kind'='semantic' then
      if jsonb_typeof(v_proposal->'expectedNicheRevision') is distinct from 'number' or
        (v_proposal->>'expectedNicheRevision')::bigint is distinct from p_observed_niche_revision or v_proposal->'taxonId' is distinct from 'null'::jsonb or v_proposal->'taxonName' is distinct from 'null'::jsonb or
        nullif(btrim(v_proposal->>'nicheDescription'),'') is null or
        v_proposal->>'nicheDescription'<>btrim(v_proposal->>'nicheDescription') or
        char_length(v_proposal->>'nicheDescription')>120 or v_proposal->>'nicheDescription' ~ '[[:cntrl:]<>]' then
        raise exception 'pending_setup_proposal_invalid' using errcode='23514';
      end if;
      v_confirm_kind:='official';
    elsif v_proposal->>'kind'='existing' then
      -- This validates the displayed proposal only. No official effect before confirmation.
      if not exists(select 1 from public.business_taxons where id=(v_proposal->>'taxonId')::uuid
        and is_active and name=v_proposal->>'taxonName') or
        (v_primary is not null and v_primary is distinct from (v_proposal->>'taxonId')::uuid) then
        raise exception 'pending_setup_proposal_invalid' using errcode='23514';
      end if;
      v_confirm_kind:='official';
    else
      if exists(select 1 from public.account_taxonomy t where t.account_id=p_account_id and t.is_primary and t.status='active'
 and (t.source_type in ('manual','user_confirmed_ai') or t.user_confirmed_at is not null or exists(
 select 1 from public.account_niche_resolutions r where r.account_id=p_account_id and r.user_resolution_status='confirmed'
 and r.user_selected_taxon_id=t.taxon_id and r.user_confirmed_at is not null))) or v_proposal->'taxonId' is distinct from 'null'::jsonb or
        v_proposal->'taxonName' is distinct from 'null'::jsonb then
        raise exception 'pending_setup_fallback_invalid' using errcode='23514';
      end if;
      v_confirm_kind:='operational_fallback';
    end if;
  elsif v_stage='niche_confirmation' then
    raise exception 'pending_setup_proposal_missing' using errcode='23514';
  end if;
  if v_stage='ready_to_complete' then
    if not exists(select 1 from public.account_official_niches where account_id=p_account_id) then
    select taxon_id into v_primary from public.account_taxonomy
      where account_id=p_account_id and is_primary and status='active';
    if exists(select 1 from public.account_taxonomy t where t.account_id=p_account_id and t.is_primary and t.status='active'
 and (t.source_type in ('manual','user_confirmed_ai') or t.user_confirmed_at is not null or exists(
 select 1 from public.account_niche_resolutions r where r.account_id=p_account_id and r.user_resolution_status='confirmed'
 and r.user_selected_taxon_id=t.taxon_id and r.user_confirmed_at is not null))) then
      perform public.effect_pending_setup_taxonomy_v1(p_account_id,
        jsonb_build_object('kind','existing','taxonId',v_primary),true,null);
    elsif not exists(select 1 from public.account_niche_resolutions where account_id=p_account_id
      and user_resolution_status='confirmed' and user_selected_taxon_id is null
      and nullif(btrim(raw_input),'') is not null and nullif(btrim(user_rewrite_input),'') is not null) then
      raise exception 'pending_setup_understanding_not_confirmed' using errcode='23514';
    end if;
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

create function public.complete_account_pending_setup_attendance_v2(
  p_conversation_id uuid,
  p_account_id uuid,
  p_user_id uuid,
  p_expected_version bigint,
  p_resolution_outcome text,
  p_passage_enabled boolean
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
  if p_passage_enabled is null or p_resolution_outcome is null or
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

  if p_passage_enabled and v_conversation.business_display_name is null then
    raise exception 'pending_setup_business_name_required' using errcode = '23514';
  end if;

  if v_conversation.pending_turn_token is not null then
    raise exception 'pending_setup_turn_in_progress' using errcode = '40001';
  end if;

  if p_resolution_outcome = 'official' and not exists(select 1 from public.account_official_niches where account_id=p_account_id) and not exists(select 1 from public.account_taxonomy t where t.account_id=p_account_id and t.is_primary and t.status='active'
 and (t.source_type in ('manual','user_confirmed_ai') or t.user_confirmed_at is not null or exists(
 select 1 from public.account_niche_resolutions r where r.account_id=p_account_id and r.user_resolution_status='confirmed'
 and r.user_selected_taxon_id=t.taxon_id and r.user_confirmed_at is not null))) then
    raise exception 'pending_setup_official_niche_missing' using errcode='23514';
  end if;

  if p_resolution_outcome = 'operational_fallback' then
    if exists(select 1 from public.account_official_niches where account_id=p_account_id) then
      raise exception 'pending_setup_fallback_official_niche_present' using errcode='23514';
    end if;
    if exists(select 1 from public.account_taxonomy t where t.account_id=p_account_id and t.is_primary and t.status='active'
 and (t.source_type in ('manual','user_confirmed_ai') or t.user_confirmed_at is not null or exists(
 select 1 from public.account_niche_resolutions r where r.account_id=p_account_id and r.user_resolution_status='confirmed'
 and r.user_selected_taxon_id=t.taxon_id and r.user_confirmed_at is not null))) then
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

  update public.account_dialogues set ended_at=coalesce(ended_at,v_now) where id=p_conversation_id and account_id=p_account_id and user_id=p_user_id;
  if not found then raise exception 'pending_setup_dialogue_missing' using errcode='23514'; end if;
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

revoke all on function public.commit_account_pending_setup_turn_v4(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid,bigint) from public,anon,authenticated;
grant execute on function public.commit_account_pending_setup_turn_v4(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid,bigint) to service_role;
revoke all on function public.complete_account_pending_setup_attendance_v2(uuid,uuid,uuid,bigint,text,boolean) from public,anon,authenticated;
grant execute on function public.complete_account_pending_setup_attendance_v2(uuid,uuid,uuid,bigint,text,boolean) to service_role;


-- Hosted default privileges grant future functions/tables to the inspection roles.
-- Revoke direct grants as well as PUBLIC inheritance before committing the migration.
do $acl$
declare v_role text; v_signature text;
begin
  foreach v_role in array array['ai_readonly','readonly'] loop
    if exists(select 1 from pg_roles where rolname=v_role) then
      execute format('revoke all on table public.account_official_niches from %I',v_role);
      foreach v_signature in array array[
        'public.confirm_account_official_niche_v1(uuid,uuid,text,bigint,uuid,timestamptz,boolean)',
        'public.commit_account_pending_setup_turn_v4(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid,bigint)',
        'public.complete_account_pending_setup_attendance_v2(uuid,uuid,uuid,bigint,text,boolean)'
      ] loop
        execute format('revoke all on function %s from %I',v_signature,v_role);
      end loop;
    end if;
  end loop;
end;
$acl$;

commit;
