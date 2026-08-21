begin;

alter table public.account_landing_pages
  drop constraint account_landing_pages_status_chk,
  add constraint account_landing_pages_status_chk
    check (status in ('draft', 'active', 'archived'));

create or replace function public.append_account_landing_page_materialization_v1(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_attempt_id uuid,
  p_content_json jsonb,
  p_generation_context_snapshot_json jsonb,
  p_created_by uuid
)
returns table(materialization_id uuid, revision_number bigint)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_parent_id uuid;
  v_existing_id uuid;
  v_existing_revision bigint;
  v_existing_account_id uuid;
  v_existing_landing_page_id uuid;
  v_revision_number bigint;
  v_materialization_id uuid;
begin
  if p_account_id is null
     or p_landing_page_id is null
     or p_attempt_id is null
     or p_created_by is null then
    raise exception using errcode = '22004', message = 'required_identity_missing';
  end if;

  if p_content_json is null or jsonb_typeof(p_content_json) <> 'object' then
    raise exception using errcode = '22023', message = 'content_json_must_be_object';
  end if;

  if p_generation_context_snapshot_json is null
     or jsonb_typeof(p_generation_context_snapshot_json) <> 'object' then
    raise exception using errcode = '22023', message = 'snapshot_json_must_be_object';
  end if;

  select
    materialization.id,
    materialization.revision_number,
    materialization.account_id,
    materialization.landing_page_id
  into
    v_existing_id,
    v_existing_revision,
    v_existing_account_id,
    v_existing_landing_page_id
  from public.account_landing_page_materializations materialization
  where materialization.attempt_id = p_attempt_id;

  if v_existing_id is not null then
    if v_existing_account_id <> p_account_id
       or v_existing_landing_page_id <> p_landing_page_id then
      raise exception using errcode = '23505', message = 'attempt_id_already_used';
    end if;

    return query select v_existing_id, v_existing_revision;
    return;
  end if;

  select lp.id
  into v_parent_id
  from public.account_landing_pages lp
  where lp.id = p_landing_page_id
    and lp.account_id = p_account_id
    and lp.status in ('draft', 'active')
  for update;

  if v_parent_id is null then
    raise exception using errcode = 'P0001', message = 'landing_page_draft_not_found';
  end if;

  select
    materialization.id,
    materialization.revision_number,
    materialization.account_id,
    materialization.landing_page_id
  into
    v_existing_id,
    v_existing_revision,
    v_existing_account_id,
    v_existing_landing_page_id
  from public.account_landing_page_materializations materialization
  where materialization.attempt_id = p_attempt_id;

  if v_existing_id is not null then
    if v_existing_account_id <> p_account_id
       or v_existing_landing_page_id <> p_landing_page_id then
      raise exception using errcode = '23505', message = 'attempt_id_already_used';
    end if;

    return query select v_existing_id, v_existing_revision;
    return;
  end if;

  select coalesce(max(materialization.revision_number), 0) + 1
  into v_revision_number
  from public.account_landing_page_materializations materialization
  where materialization.account_id = p_account_id
    and materialization.landing_page_id = p_landing_page_id;

  insert into public.account_landing_page_materializations (
    account_id,
    landing_page_id,
    revision_number,
    attempt_id,
    content_json,
    generation_context_snapshot_json,
    created_by
  )
  values (
    p_account_id,
    p_landing_page_id,
    v_revision_number,
    p_attempt_id,
    p_content_json,
    p_generation_context_snapshot_json,
    p_created_by
  )
  returning id into v_materialization_id;

  return query select v_materialization_id, v_revision_number;
end;
$$;

alter function public.append_account_landing_page_materialization_v1(
  uuid, uuid, uuid, jsonb, jsonb, uuid
) owner to postgres;

revoke all on function public.append_account_landing_page_materialization_v1(
  uuid, uuid, uuid, jsonb, jsonb, uuid
) from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.append_account_landing_page_materialization_v1(uuid, uuid, uuid, jsonb, jsonb, uuid) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.append_account_landing_page_materialization_v1(
  uuid, uuid, uuid, jsonb, jsonb, uuid
) to service_role;

comment on table public.account_landing_pages
  is 'Identidades de landing page em rollout expand: criacao corrente permanece draft; active e archived ficam reservados ao runtime E19.5.';

comment on function public.append_account_landing_page_materialization_v1(
  uuid, uuid, uuid, jsonb, jsonb, uuid
)
  is 'Append transacional e tenant-safe de revisao completa para landing page operacional draft ou active; archived bloqueia novos appends, mas preserva retry idempotente de attempt ja materializado.';

commit;
