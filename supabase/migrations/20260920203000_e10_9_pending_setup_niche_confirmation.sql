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
    ai_status,
    ai_result_json,
    ai_ux_mode,
    ai_suggested_taxon_id,
    user_resolution_status
  into v_resolution
  from public.account_niche_resolutions
  where account_id = p_account_id
  for update;

  if not found
    or v_resolution.ai_status is distinct from 'resolved'
    or v_resolution.ai_ux_mode not in ('confirm_single', 'choose_from_options')
    or coalesce(v_resolution.user_resolution_status, 'pending_confirmation') <> 'pending_confirmation'
  then
    return 'resolution_not_actionable';
  end if;

  if v_resolution.ai_ux_mode = 'confirm_single' then
    v_selected_option_is_valid := v_resolution.ai_suggested_taxon_id = p_taxon_id;
  elsif jsonb_typeof(v_resolution.ai_result_json -> 'options') = 'array' then
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
    'user_confirmed_ai'
  )
  on conflict (account_id, taxon_id) do update
  set
    is_primary = true,
    status = 'active',
    source_type = 'user_confirmed_ai',
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
revoke all on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) from ai_readonly;
grant execute on function public.confirm_pending_setup_niche_resolution_taxon(uuid, uuid) to service_role;

commit;
