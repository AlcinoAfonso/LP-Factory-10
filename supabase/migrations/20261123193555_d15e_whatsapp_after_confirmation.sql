-- D15E: optional WhatsApp after confirmed business synthesis, in the existing completion transaction.
-- Preserve v2 for existing consumers. No new table, state or privilege.
begin;

create function public.complete_account_pending_setup_attendance_v3(
  p_conversation_id uuid, p_account_id uuid, p_user_id uuid, p_expected_version bigint,
  p_resolution_outcome text, p_passage_enabled boolean, p_whatsapp text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare s public.account_context_summaries%rowtype; v_summary jsonb; v_was_completed boolean;
  v_phone text := nullif(btrim(p_whatsapp), '');
begin
  if v_phone is not null and v_phone !~ '^[(][0-9]{2}[)] 9[0-9]{4}-[0-9]{4}$' then
    raise exception 'pending_setup_whatsapp_invalid' using errcode='22023';
  end if;

  -- Serialize completion calls; v2 still enforces actor authorization and idempotency.
  select c.stage='completed' into strict v_was_completed
    from public.account_pending_setup_conversations c
    where c.id=p_conversation_id and c.account_id=p_account_id and c.user_id=p_user_id for update;
  if not public.complete_account_pending_setup_attendance_v2(
    p_conversation_id,p_account_id,p_user_id,p_expected_version,p_resolution_outcome,p_passage_enabled
  ) then return false; end if;
  if v_was_completed or v_phone is null then return true; end if;

  select * into strict s from public.account_context_summaries where account_id=p_account_id for update;
  v_summary:=coalesce(s.summary,'{}')::jsonb;
  if jsonb_typeof(v_summary) is distinct from 'object' then
    raise exception 'pending_setup_summary_invalid' using errcode='22023';
  end if;
  if coalesce(v_summary->>'whatsapp',v_summary->>'w') is distinct from v_phone
    or coalesce((v_summary->>'whatsappDeclined')::boolean,(v_summary->>'d')::boolean,false)
    or v_summary ? 'w' or v_summary ? 'd' then
    v_summary:=(v_summary-'w'-'d')||jsonb_build_object('whatsapp',v_phone,'whatsappDeclined',false);
    if char_length(v_summary::text)>6000 then
      raise exception 'pending_setup_summary_capacity' using errcode='23514';
    end if;
    update public.account_context_summaries set summary=v_summary::text,
      source_dialogue_id=p_conversation_id,source_user_id=p_user_id,updated_at=clock_timestamp()
      where account_id=p_account_id;
  end if;
  return true;
end $$;

revoke all on function public.complete_account_pending_setup_attendance_v3(uuid,uuid,uuid,bigint,text,boolean,text)
  from public,anon,authenticated;
grant execute on function public.complete_account_pending_setup_attendance_v3(uuid,uuid,uuid,bigint,text,boolean,text)
  to service_role;
do $acl$
declare v_role text;
begin
  foreach v_role in array array['ai_readonly','readonly'] loop
    if exists(select 1 from pg_roles where rolname=v_role) then
      execute format('revoke all on function public.complete_account_pending_setup_attendance_v3(uuid,uuid,uuid,bigint,text,boolean,text) from %I',v_role);
    end if;
  end loop;
end;
$acl$;
commit;
