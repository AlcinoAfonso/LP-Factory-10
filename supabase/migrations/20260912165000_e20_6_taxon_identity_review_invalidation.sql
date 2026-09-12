begin;

create table public.business_taxon_input_catalog_review_invalidations (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null,
  root_taxon_id uuid not null,
  affected_taxon_id uuid not null,
  previous_reviewed_input_catalog_version integer not null,
  root_name_before text not null,
  root_slug_before text not null,
  root_name_after text not null,
  root_slug_after text not null,
  actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  constraint business_taxon_input_catalog_review_invalidations_version_chk
    check (previous_reviewed_input_catalog_version > 0),
  constraint business_taxon_input_catalog_review_invalidations_identity_chk
    check (
      btrim(root_name_before) <> ''
      and btrim(root_name_after) <> ''
      and root_slug_before ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      and root_slug_after ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      and (root_name_before, root_slug_before) is distinct from (root_name_after, root_slug_after)
    ),
  constraint business_taxon_input_catalog_review_invalidations_operation_taxon_key
    unique (operation_id, affected_taxon_id)
);

create index business_taxon_input_catalog_review_invalidations_root_idx
  on public.business_taxon_input_catalog_review_invalidations (root_taxon_id, created_at desc, id desc);

create index business_taxon_input_catalog_review_invalidations_affected_idx
  on public.business_taxon_input_catalog_review_invalidations (affected_taxon_id, created_at desc, id desc);

alter table public.business_taxon_input_catalog_review_invalidations enable row level security;

revoke all on table public.business_taxon_input_catalog_review_invalidations
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.business_taxon_input_catalog_review_invalidations from ai_readonly';
  end if;
end;
$$;

grant select, insert
  on table public.business_taxon_input_catalog_review_invalidations
  to service_role;

create or replace function public.reject_business_taxon_input_catalog_review_invalidation_mutation_v1()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  raise exception using errcode = '42501', message = 'taxon_review_invalidations_are_append_only';
end;
$$;

create trigger business_taxon_input_catalog_review_invalidations_append_only
before update or delete on public.business_taxon_input_catalog_review_invalidations
for each row execute function public.reject_business_taxon_input_catalog_review_invalidation_mutation_v1();

create or replace function public.update_business_taxon_identity_with_review_invalidation_v1(
  p_taxon_id uuid,
  p_expected_name text,
  p_expected_slug text,
  p_expected_is_active boolean,
  p_name text,
  p_slug text,
  p_next_is_active boolean,
  p_expected_reviewed_taxons jsonb,
  p_operation_id uuid,
  p_actor_user_id uuid
)
returns table(
  taxon_id uuid,
  invalidated_taxon_ids uuid[]
)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_current public.business_taxons%rowtype;
  v_subtree_taxon_ids uuid[];
  v_reviewed_taxon_ids uuid[];
  v_reviewed_taxons jsonb;
  v_replay_taxon_ids uuid[];
  v_replay_reviewed_taxons jsonb;
begin
  if p_taxon_id is null
     or p_expected_name is null
     or btrim(p_expected_name) = ''
     or p_expected_slug is null
     or p_expected_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or p_expected_is_active is null
     or p_name is null
     or btrim(p_name) = ''
     or p_slug is null
     or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or p_next_is_active is null
     or p_expected_reviewed_taxons is null
     or jsonb_typeof(p_expected_reviewed_taxons) <> 'array'
     or p_operation_id is null
     or p_actor_user_id is null then
    raise exception using errcode = '22023', message = 'taxon_review_invalidation_input_invalid';
  end if;
  if jsonb_array_length(p_expected_reviewed_taxons) = 0 then
    raise exception using errcode = '22023', message = 'taxon_review_invalidation_input_invalid';
  end if;

  perform 1
  from public.business_taxons taxons
  order by taxons.id
  for update;

  select taxons.*
    into v_current
  from public.business_taxons taxons
  where taxons.id = p_taxon_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'taxon_review_invalidation_taxon_not_found';
  end if;

  select
    coalesce(array_agg(events.affected_taxon_id order by events.affected_taxon_id), array[]::uuid[]),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'taxonId', events.affected_taxon_id,
          'reviewedVersion', events.previous_reviewed_input_catalog_version
        )
        order by events.affected_taxon_id
      ),
      '[]'::jsonb
    )
    into v_replay_taxon_ids, v_replay_reviewed_taxons
  from public.business_taxon_input_catalog_review_invalidations events
  where events.operation_id = p_operation_id;

  if cardinality(v_replay_taxon_ids) > 0 then
    if v_current.name is distinct from p_name
       or v_current.slug is distinct from p_slug
       or v_current.is_active is distinct from p_next_is_active
       or v_replay_reviewed_taxons is distinct from p_expected_reviewed_taxons
       or exists (
         select 1
         from public.business_taxon_input_catalog_review_invalidations events
         where events.operation_id = p_operation_id
           and (
             events.root_taxon_id is distinct from p_taxon_id
             or events.root_name_before is distinct from p_expected_name
             or events.root_slug_before is distinct from p_expected_slug
             or events.root_name_after is distinct from p_name
             or events.root_slug_after is distinct from p_slug
             or events.actor_user_id is distinct from p_actor_user_id
           )
       ) then
      raise exception using errcode = '22023', message = 'taxon_review_invalidation_operation_reused';
    end if;
    return query select p_taxon_id, v_replay_taxon_ids;
    return;
  end if;

  if v_current.name is distinct from p_expected_name
     or v_current.slug is distinct from p_expected_slug
     or v_current.is_active is distinct from p_expected_is_active then
    raise exception using errcode = '40001', message = 'taxon_review_invalidation_identity_conflict';
  end if;
  if v_current.name is not distinct from p_name
     and v_current.slug is not distinct from p_slug then
    raise exception using errcode = '22023', message = 'taxon_review_invalidation_identity_unchanged';
  end if;
  if not v_current.is_active and p_next_is_active then
    raise exception using errcode = '42501', message = 'taxon_generic_activation_forbidden';
  end if;
  if not exists (select 1 from auth.users users where users.id = p_actor_user_id) then
    raise exception using errcode = '22023', message = 'taxon_review_invalidation_actor_invalid';
  end if;
  if exists (
    select 1
    from public.business_taxons taxons
    where taxons.slug = p_slug
      and taxons.id <> p_taxon_id
  ) then
    raise exception using errcode = '23505', message = 'taxon_slug_conflict';
  end if;

  with recursive subtree as (
    select taxons.id, taxons.parent_id, taxons.reviewed_input_catalog_version
    from public.business_taxons taxons
    where taxons.id = p_taxon_id
    union all
    select child.id, child.parent_id, child.reviewed_input_catalog_version
    from public.business_taxons child
    join subtree parent on child.parent_id = parent.id
  )
  select
    coalesce(array_agg(subtree.id order by subtree.id), array[]::uuid[]),
    coalesce(
      array_agg(subtree.id order by subtree.id)
        filter (where subtree.reviewed_input_catalog_version is not null),
      array[]::uuid[]
    ),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'taxonId', subtree.id,
          'reviewedVersion', subtree.reviewed_input_catalog_version
        )
        order by subtree.id
      ) filter (where subtree.reviewed_input_catalog_version is not null),
      '[]'::jsonb
    )
    into v_subtree_taxon_ids, v_reviewed_taxon_ids, v_reviewed_taxons
  from subtree;

  if cardinality(v_reviewed_taxon_ids) = 0 then
    raise exception using errcode = '40001', message = 'taxon_review_invalidation_no_reviewed_coverage';
  end if;
  if v_reviewed_taxons is distinct from p_expected_reviewed_taxons then
    raise exception using errcode = '40001', message = 'taxon_review_invalidation_coverage_conflict';
  end if;
  if exists (
    select 1
    from public.business_taxon_factual_reviews reviews
    where reviews.taxon_id = any(v_subtree_taxon_ids)
      and reviews.status in ('open', 'awaiting_catalog_publication')
  ) then
    raise exception using errcode = '40001', message = 'taxon_factual_review_unclosed';
  end if;

  insert into public.business_taxon_input_catalog_review_invalidations (
    operation_id,
    root_taxon_id,
    affected_taxon_id,
    previous_reviewed_input_catalog_version,
    root_name_before,
    root_slug_before,
    root_name_after,
    root_slug_after,
    actor_user_id
  )
  select
    p_operation_id,
    p_taxon_id,
    taxons.id,
    taxons.reviewed_input_catalog_version,
    v_current.name,
    v_current.slug,
    p_name,
    p_slug,
    p_actor_user_id
  from public.business_taxons taxons
  where taxons.id = any(v_reviewed_taxon_ids)
  order by taxons.id;

  update public.business_taxons taxons
  set reviewed_input_catalog_version = null
  where taxons.id = any(v_reviewed_taxon_ids);

  update public.business_taxons taxons
  set name = p_name,
      slug = p_slug,
      is_active = p_next_is_active
  where taxons.id = p_taxon_id
    and taxons.name = p_expected_name
    and taxons.slug = p_expected_slug
    and taxons.is_active = p_expected_is_active;
  if not found then
    raise exception using errcode = '40001', message = 'taxon_review_invalidation_identity_conflict';
  end if;

  return query select p_taxon_id, v_reviewed_taxon_ids;
end;
$$;

revoke all on function public.reject_business_taxon_input_catalog_review_invalidation_mutation_v1()
  from public, anon, authenticated;
revoke all on function public.update_business_taxon_identity_with_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, jsonb, uuid, uuid)
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.reject_business_taxon_input_catalog_review_invalidation_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.update_business_taxon_identity_with_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, jsonb, uuid, uuid) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.reject_business_taxon_input_catalog_review_invalidation_mutation_v1()
  to service_role;
grant execute on function public.update_business_taxon_identity_with_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, jsonb, uuid, uuid)
  to service_role;

comment on table public.business_taxon_input_catalog_review_invalidations is
  'E20.6: recibos append-only da invalidacao explicita de coberturas antes de mutacao de identidade taxonomica.';
comment on function public.update_business_taxon_identity_with_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, jsonb, uuid, uuid) is
  'E20.6: invalida atomicamente coberturas do taxon e descendentes sem sessao aberta e entao atualiza a identidade autorizada.';

commit;
