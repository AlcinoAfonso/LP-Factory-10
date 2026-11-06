begin;

alter table public.account_taxonomy add column user_confirmed_at timestamptz;

-- Called only by the authenticated server boundary. No taxon/catalog creation.
create function public.confirm_account_niche_v1(
  p_account_id uuid, p_actor_user_id uuid, p_taxon_id uuid,
  p_expected_taxon_id uuid, p_confirmed boolean
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_current uuid;
  v_id uuid := p_taxon_id;
  v_parent uuid;
  v_level text;
  v_expected_level text;
  v_active boolean;
begin
  if p_confirmed is distinct from true or p_taxon_id is null then
    raise exception using errcode='22023', message='niche_confirmation_required';
  end if;
  -- The product FK takes KEY SHARE on this row, serializing concurrent inserts.
  perform 1 from public.accounts where id=p_account_id and status='active' for update;
  if not found or not exists (
    select 1 from public.account_users where account_id=p_account_id
      and user_id=p_actor_user_id and status='active' and role in ('owner','admin','editor')
  ) then
    raise exception using errcode='42501', message='niche_access_denied';
  end if;
  select taxon_id into v_current from public.account_taxonomy
    where account_id=p_account_id and is_primary and status='active' for update;
  if v_current is distinct from p_expected_taxon_id then
    raise exception using errcode='40001', message='niche_changed';
  end if;
  if v_current is not null and v_current is distinct from p_taxon_id and exists (
    select 1 from public.account_landing_pages where account_id=p_account_id
  ) then
    raise exception using errcode='23514', message='niche_product_exists';
  end if;
  -- Preserve all three official E10.5 levels and validate each active ancestor.
  for i in 1..3 loop
    select level,parent_id,is_active into v_level,v_parent,v_active
      from public.business_taxons where id=v_id for share;
    if not found or not v_active or
       (v_expected_level is not null and v_level is distinct from v_expected_level) then
      raise exception using errcode='23514', message='niche_taxon_invalid';
    end if;
    if v_level='segment' and v_parent is null then exit; end if;
    if v_parent is null or v_level not in ('niche','ultra_niche') or i=3 then
      raise exception using errcode='23514', message='niche_taxon_invalid';
    end if;
    v_expected_level := case v_level when 'niche' then 'segment' else 'niche' end;
    v_id := v_parent;
  end loop;
  if v_current = p_taxon_id then
    update public.account_taxonomy set user_confirmed_at=clock_timestamp(), updated_at=clock_timestamp()
      where account_id=p_account_id and taxon_id=p_taxon_id and user_confirmed_at is null;
    return p_taxon_id;
  end if;
  update public.account_taxonomy set is_primary=false,status='inactive',updated_at=clock_timestamp()
    where account_id=p_account_id and is_primary and status='active';
  insert into public.account_taxonomy(account_id,taxon_id,is_primary,status,source_type,user_confirmed_at)
    values(p_account_id,p_taxon_id,true,'active','manual',clock_timestamp())
    on conflict(account_id,taxon_id) do update set
      is_primary=true,status='active',user_confirmed_at=clock_timestamp(),updated_at=clock_timestamp();
  return p_taxon_id;
end;
$$;
revoke all on function public.confirm_account_niche_v1(uuid,uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.confirm_account_niche_v1(uuid,uuid,uuid,uuid,boolean) to service_role;

commit;
