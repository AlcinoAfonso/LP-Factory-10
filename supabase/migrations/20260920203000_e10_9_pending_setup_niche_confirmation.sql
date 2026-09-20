begin;

create or replace function public.confirm_pending_setup_niche_resolution_taxon(
  p_account_id uuid,
  p_taxon_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_account_status text;
  v_existing_primary_taxon_id uuid;
  v_link_source_type text;
  v_resolution record;
  v_selected_option_is_valid boolean := false;
  v_updated_count integer;
begin
  select status
  into v_account_status
  from public.accounts
  where id = p_account_id
  for update;

  if v_account_status is distinct from 'pending_setup' then
    return 'account_not_pending_setup';
  end if;

  select
    selected_taxon_id,
    confidence,
    should_use_deterministic_match,
    needs_admin_review,
    resolution_status,
    ai_status,
    ai_result_json,
    ai_ux_mode,
    ai_suggested_taxon_id,
    user_resolution_status
  into v_resolution
  from public.account_niche_resolutions
  where account_id = p_account_id
  for update;

  if not found or coalesce(v_resolution.user_resolution_status, 'pending_confirmation') <> 'pending_confirmation' then
    return 'resolution_not_actionable';
  end if;

  if v_resolution.resolution_status = 'deterministic_high_confidence'
    and v_resolution.confidence = 'high'
    and v_resolution.should_use_deterministic_match = true
    and v_resolution.needs_admin_review = false
    and v_resolution.selected_taxon_id = p_taxon_id
  then
    v_selected_option_is_valid := true;
    v_link_source_type := 'taxonomy_match';
  elsif v_resolution.ai_status = 'resolved'
    and v_resolution.ai_ux_mode in ('confirm_single', 'choose_from_options')
  then
    v_link_source_type := 'user_confirmed_ai';
  else
    return 'resolution_not_actionable';
  end if;

  if v_link_source_type = 'user_confirmed_ai' and v_resolution.ai_ux_mode = 'confirm_single' then
    v_selected_option_is_valid := v_resolution.ai_suggested_taxon_id = p_taxon_id;
  elsif v_link_source_type = 'user_confirmed_ai'
    and jsonb_typeof(v_resolution.ai_result_json -> 'options') = 'array'
  then
    select exists (
      select 1
      from jsonb_array_elements(v_resolution.ai_result_json -> 'options') as option_row
      where option_row ->> 'taxonId' = p_taxon_id::text
        and option_row ->> 'isOfficial' = 'true'
    )
    into v_selected_option_is_valid;
  end if;

  if v_selected_option_is_valid is distinct from true then
    return 'invalid_option';
  end if;

  if not exists (
    select 1
    from public.business_taxons
    where id = p_taxon_id
      and is_active = true
  ) then
    return 'taxon_not_active';
  end if;

  select taxon_id
  into v_existing_primary_taxon_id
  from public.account_taxonomy
  where account_id = p_account_id
    and is_primary = true
    and status = 'active'
  for update;

  if v_existing_primary_taxon_id is not null
    and v_existing_primary_taxon_id <> p_taxon_id
  then
    return 'conflicting_primary';
  end if;

  insert into public.account_taxonomy (
    account_id,
    taxon_id,
    is_primary,
    status,
    source_type
  )
  values (
    p_account_id,
    p_taxon_id,
    true,
    'active',
    v_link_source_type
  )
  on conflict (account_id, taxon_id) do update
  set
    is_primary = true,
    status = 'active',
    source_type = v_link_source_type,
    updated_at = now();

  update public.account_niche_resolutions
  set
    user_resolution_status = 'confirmed',
    user_selected_taxon_id = p_taxon_id,
    user_rewrite_input = null,
    user_confirmed_at = now()
  where account_id = p_account_id
    and coalesce(user_resolution_status, 'pending_confirmation') = 'pending_confirmation';

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> 1 then
    raise exception 'pending setup niche resolution changed concurrently';
  end if;

  return 'saved';
end;
$$;

alter function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) owner to postgres;
revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) from public;
revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) from anon;
revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) from authenticated;
grant execute on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) from ai_readonly';
  end if;
end
$$;

commit;
