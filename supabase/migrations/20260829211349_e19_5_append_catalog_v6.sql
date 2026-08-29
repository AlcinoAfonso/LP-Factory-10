begin;

create or replace function public.append_account_landing_page_materialization_v2(
  p_account_id uuid,
  p_landing_page_id uuid,
  p_attempt_id uuid,
  p_content_json jsonb,
  p_generation_context_snapshot_json jsonb,
  p_created_by uuid,
  p_expected_shared_revision bigint,
  p_expected_landing_page_revision bigint
)
returns table(materialization_id uuid, revision_number bigint)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_existing_id uuid;
  v_existing_revision bigint;
  v_existing_account_id uuid;
  v_existing_landing_page_id uuid;
  v_shared_revision bigint;
  v_landing_revision bigint;
  v_shared_catalog integer;
  v_landing_catalog integer;
begin
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

  perform 1
  from public.account_landing_pages
  where id = p_landing_page_id
    and account_id = p_account_id
    and status in ('draft', 'active')
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'landing_page_not_operational';
  end if;

  select revision, catalog_version
  into v_shared_revision, v_shared_catalog
  from public.account_landing_page_shared_configurations
  where account_id = p_account_id
  for update;
  if v_shared_revision is distinct from p_expected_shared_revision
     or (
       v_shared_revision is not null
       and v_shared_catalog is distinct from 5
       and v_shared_catalog is distinct from 6
     ) then
    perform public.raise_postgrest_safe_conflict_v1('shared_revision_conflict');
  end if;

  select revision, catalog_version
  into v_landing_revision, v_landing_catalog
  from public.account_landing_page_configurations
  where account_id = p_account_id
    and landing_page_id = p_landing_page_id
  for update;
  if v_landing_revision is distinct from p_expected_landing_page_revision
     or (
       v_landing_catalog is distinct from 5
       and v_landing_catalog is distinct from 6
     ) then
    perform public.raise_postgrest_safe_conflict_v1('landing_page_revision_conflict');
  end if;

  return query
  select appended.materialization_id, appended.revision_number
  from public.append_account_landing_page_materialization_v1(
    p_account_id,
    p_landing_page_id,
    p_attempt_id,
    p_content_json,
    p_generation_context_snapshot_json,
    p_created_by
  ) appended;
end;
$$;

commit;
