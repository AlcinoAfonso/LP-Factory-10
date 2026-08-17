begin;

alter table public.account_landing_page_materializations
  add column id uuid,
  add column revision_number bigint,
  add column attempt_id uuid;

update public.account_landing_page_materializations
set
  id = gen_random_uuid(),
  revision_number = 1
where id is null
   or revision_number is null;

alter table public.account_landing_page_materializations
  alter column id set default gen_random_uuid(),
  alter column id set not null,
  alter column revision_number set not null,
  drop constraint account_landing_page_materializations_pkey,
  add constraint account_landing_page_materializations_pkey primary key (id),
  add constraint account_landing_page_materializations_revision_number_chk
    check (revision_number > 0),
  add constraint account_landing_page_materializations_landing_page_revision_key
    unique (landing_page_id, revision_number);

create unique index account_landing_page_materializations_attempt_id_uidx
  on public.account_landing_page_materializations (attempt_id)
  where attempt_id is not null;

create index account_landing_page_materializations_current_idx
  on public.account_landing_page_materializations (
    account_id,
    landing_page_id,
    revision_number desc
  );

revoke insert, update, delete, truncate
  on table public.account_landing_page_materializations
  from public, anon, authenticated, service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke insert, update, delete, truncate on table public.account_landing_page_materializations from ai_readonly';
  end if;
end;
$$;

grant select
  on table public.account_landing_page_materializations
  to service_role;

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

  select lp.id
  into v_parent_id
  from public.account_landing_pages lp
  where lp.id = p_landing_page_id
    and lp.account_id = p_account_id
    and lp.status = 'draft'
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

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'landing-page-revision-assets',
  'landing-page-revision-assets',
  false,
  5242880,
  array['image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.e19_4_landing_page_revision_readiness()
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_catalog
as $$
declare
  v_ready boolean;
begin
  select
    to_regclass('public.account_landing_page_materializations') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'account_landing_page_materializations'
        and column_name = 'id'
        and is_nullable = 'NO'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'account_landing_page_materializations'
        and column_name = 'revision_number'
        and is_nullable = 'NO'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'account_landing_page_materializations'
        and column_name = 'attempt_id'
        and is_nullable = 'YES'
    )
    and exists (
      select 1
      from pg_constraint
      where conrelid = 'public.account_landing_page_materializations'::regclass
        and conname = 'account_landing_page_materializations_landing_page_revision_key'
    )
    and exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'account_landing_page_materializations'
        and indexname = 'account_landing_page_materializations_attempt_id_uidx'
    )
    and exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'account_landing_page_materializations'
        and indexname = 'account_landing_page_materializations_current_idx'
    )
    and (
      select target.relrowsecurity
      from pg_class target
      where target.oid = 'public.account_landing_page_materializations'::regclass
    )
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'account_landing_page_materializations'
    )
    and has_table_privilege(
      'service_role',
      'public.account_landing_page_materializations',
      'SELECT'
    )
    and not has_table_privilege(
      'service_role',
      'public.account_landing_page_materializations',
      'INSERT,UPDATE,DELETE,TRUNCATE'
    )
    and has_function_privilege(
      'service_role',
      'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
      'EXECUTE'
    )
    and not has_function_privilege(
      'anon',
      'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
      'EXECUTE'
    )
    and not has_function_privilege(
      'authenticated',
      'public.append_account_landing_page_materialization_v1(uuid,uuid,uuid,jsonb,jsonb,uuid)',
      'EXECUTE'
    )
    and exists (
      select 1
      from storage.buckets bucket
      where bucket.id = 'landing-page-revision-assets'
        and bucket.name = 'landing-page-revision-assets'
        and bucket.public = false
        and bucket.file_size_limit = 5242880
        and bucket.allowed_mime_types = array['image/webp']::text[]
    )
    and not exists (
      select 1
      from pg_policies policy
      where policy.schemaname = 'storage'
        and policy.tablename = 'objects'
        and (
          coalesce(policy.qual, '') ilike '%landing-page-revision-assets%'
          or coalesce(policy.with_check, '') ilike '%landing-page-revision-assets%'
        )
    )
  into v_ready;

  return jsonb_build_object(
    'ready', coalesce(v_ready, false),
    'schema_version', case when v_ready then 1 else null end
  );
end;
$$;

alter function public.e19_4_landing_page_revision_readiness()
  owner to postgres;

revoke all on function public.e19_4_landing_page_revision_readiness()
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.e19_4_landing_page_revision_readiness() from ai_readonly';
  end if;
end;
$$;

grant execute on function public.e19_4_landing_page_revision_readiness()
  to service_role;

comment on table public.account_landing_page_materializations
  is 'Revisoes append-only 1:N de landing pages em draft; a revisao corrente e a maior revision_number por landing_page_id.';

comment on function public.append_account_landing_page_materialization_v1(
  uuid, uuid, uuid, jsonb, jsonb, uuid
)
  is 'Append transacional e tenant-safe de uma revisao completa de landing page em draft.';

commit;
