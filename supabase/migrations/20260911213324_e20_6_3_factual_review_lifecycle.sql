begin;

alter table public.business_taxons
  alter column is_active set default false;

create table public.business_taxon_factual_reviews (
  id uuid primary key default gen_random_uuid(),
  taxon_id uuid not null references public.business_taxons(id) on update cascade on delete restrict,
  kind text not null,
  status text not null default 'open',
  baseline_is_active boolean not null,
  baseline_reviewed_input_catalog_version integer,
  target_input_catalog_version integer,
  draft_revision bigint,
  draft_content_fingerprint text,
  draft_context_fingerprint text,
  context_fingerprint text not null,
  chain_snapshot jsonb not null,
  revision bigint not null default 1,
  opened_operation_id uuid not null unique,
  opened_by uuid not null references auth.users(id) on update cascade on delete restrict,
  closed_by uuid references auth.users(id) on update cascade on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_taxon_factual_reviews_kind_chk
    check (kind in ('release', 'revision')),
  constraint business_taxon_factual_reviews_status_chk
    check (status in ('open', 'awaiting_catalog_publication', 'closed_without_change', 'closed_published')),
  constraint business_taxon_factual_reviews_kind_baseline_chk
    check ((kind = 'release' and not baseline_is_active) or (kind = 'revision' and baseline_is_active)),
  constraint business_taxon_factual_reviews_baseline_version_chk
    check (baseline_reviewed_input_catalog_version is null or baseline_reviewed_input_catalog_version > 0),
  constraint business_taxon_factual_reviews_target_version_chk
    check (target_input_catalog_version is null or target_input_catalog_version > 0),
  constraint business_taxon_factual_reviews_draft_revision_chk
    check (draft_revision is null or draft_revision > 0),
  constraint business_taxon_factual_reviews_context_fingerprint_chk
    check (context_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint business_taxon_factual_reviews_chain_snapshot_chk
    check (
      jsonb_typeof(chain_snapshot) = 'array'
      and jsonb_array_length(chain_snapshot) between 1 and 3
    ),
  constraint business_taxon_factual_reviews_draft_content_fingerprint_chk
    check (draft_content_fingerprint is null or draft_content_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint business_taxon_factual_reviews_draft_context_fingerprint_chk
    check (draft_context_fingerprint is null or draft_context_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint business_taxon_factual_reviews_revision_chk
    check (revision > 0),
  constraint business_taxon_factual_reviews_draft_reference_chk
    check (
      (
        status in ('open', 'closed_without_change')
        and target_input_catalog_version is null
        and draft_revision is null
        and draft_content_fingerprint is null
        and draft_context_fingerprint is null
      )
      or (
        status in ('awaiting_catalog_publication', 'closed_published')
        and target_input_catalog_version is not null
        and draft_revision is not null
        and draft_content_fingerprint is not null
        and draft_context_fingerprint is not null
      )
    ),
  constraint business_taxon_factual_reviews_closure_chk
    check (
      (
        status in ('open', 'awaiting_catalog_publication')
        and closed_by is null
        and closed_at is null
      )
      or (
        status in ('closed_without_change', 'closed_published')
        and closed_by is not null
        and closed_at is not null
      )
    )
);

create unique index business_taxon_factual_reviews_one_unclosed_per_taxon_idx
  on public.business_taxon_factual_reviews (taxon_id)
  where status in ('open', 'awaiting_catalog_publication');

create table public.business_taxon_factual_review_events (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.business_taxon_factual_reviews(id) on update cascade on delete restrict,
  operation_id uuid not null,
  sequence_number bigint not null,
  event_kind text not null,
  source_strategy text,
  decision_kind text,
  payload_json jsonb not null default '{}'::jsonb,
  context_fingerprint text not null,
  content_fingerprint text,
  actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  constraint business_taxon_factual_review_events_sequence_chk
    check (sequence_number > 0),
  constraint business_taxon_factual_review_events_kind_chk
    check (event_kind in (
      'opened',
      'evaluation_requested',
      'evaluation_completed',
      'evaluation_inconclusive',
      'decision_recorded',
      'draft_linked',
      'publication_authorized',
      'draft_invalidated',
      'closed_without_change',
      'reconciled_published'
    )),
  constraint business_taxon_factual_review_events_source_strategy_chk
    check (
      (
        event_kind in ('evaluation_requested', 'evaluation_completed', 'evaluation_inconclusive')
        and source_strategy is not null
        and source_strategy in ('e20_5', 'web_search_fallback', 'web_search_focal')
      )
      or (
        event_kind not in ('evaluation_requested', 'evaluation_completed', 'evaluation_inconclusive')
        and source_strategy is null
      )
    ),
  constraint business_taxon_factual_review_events_decision_kind_chk
    check (
      (
        event_kind in ('decision_recorded', 'publication_authorized')
        and decision_kind is not null
        and decision_kind in ('no_change', 'catalog_change')
      )
      or (
        event_kind not in ('decision_recorded', 'publication_authorized')
        and decision_kind is null
      )
    ),
  constraint business_taxon_factual_review_events_payload_chk
    check (jsonb_typeof(payload_json) = 'object'),
  constraint business_taxon_factual_review_events_context_fingerprint_chk
    check (context_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint business_taxon_factual_review_events_content_fingerprint_chk
    check (
      (
        event_kind in (
          'evaluation_completed',
          'evaluation_inconclusive',
          'decision_recorded',
          'draft_linked',
          'publication_authorized',
          'draft_invalidated',
          'reconciled_published'
        )
        and content_fingerprint is not null
        and content_fingerprint ~ '^[0-9a-f]{64}$'
      )
      or (
        event_kind not in (
          'evaluation_completed',
          'evaluation_inconclusive',
          'decision_recorded',
          'draft_linked',
          'publication_authorized',
          'draft_invalidated',
          'reconciled_published'
        )
        and content_fingerprint is null
      )
    ),
  constraint business_taxon_factual_review_events_review_sequence_key
    unique (review_id, sequence_number),
  constraint business_taxon_factual_review_events_review_operation_key
    unique (review_id, operation_id)
);

alter table public.business_taxon_factual_reviews enable row level security;
alter table public.business_taxon_factual_review_events enable row level security;

revoke all on table public.business_taxon_factual_reviews
  from public, anon, authenticated;
revoke all on table public.business_taxon_factual_review_events
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.business_taxon_factual_reviews from ai_readonly';
    execute 'revoke all on table public.business_taxon_factual_review_events from ai_readonly';
  end if;
end;
$$;

grant select, insert, update
  on table public.business_taxon_factual_reviews
  to service_role;
grant select, insert
  on table public.business_taxon_factual_review_events
  to service_role;

create trigger business_taxon_factual_reviews_set_updated_at
before update on public.business_taxon_factual_reviews
for each row execute function public.tg_set_updated_at();

create or replace function public.reject_business_taxon_factual_review_event_mutation_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  raise exception using errcode = '42501', message = 'factual_review_events_are_append_only';
end;
$$;

create trigger business_taxon_factual_review_events_append_only
before update or delete on public.business_taxon_factual_review_events
for each row execute function public.reject_business_taxon_factual_review_event_mutation_v1();

create or replace function public.open_business_taxon_factual_review_v1(
  p_taxon_id uuid,
  p_context_fingerprint text,
  p_chain_snapshot jsonb,
  p_opened_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_is_active boolean,
  p_expected_reviewed_input_catalog_version integer
)
returns table(
  review_id uuid,
  review_kind text,
  review_status text,
  review_revision bigint,
  review_baseline_is_active boolean,
  review_baseline_reviewed_input_catalog_version integer
)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_existing public.business_taxon_factual_reviews%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_kind text;
  v_review public.business_taxon_factual_reviews%rowtype;
  v_chain_size integer;
begin
  if p_taxon_id is null
     or p_actor_user_id is null
     or p_opened_operation_id is null
     or p_expected_is_active is null
     or p_context_fingerprint is null
     or p_context_fingerprint !~ '^[0-9a-f]{64}$'
     or p_chain_snapshot is null
     or jsonb_typeof(p_chain_snapshot) <> 'array'
     or (
       p_expected_reviewed_input_catalog_version is not null
       and p_expected_reviewed_input_catalog_version <= 0
     ) then
    raise exception using errcode = '22023', message = 'factual_review_open_input_invalid';
  end if;

  v_chain_size := jsonb_array_length(p_chain_snapshot);
  if v_chain_size not between 1 and 3
     or exists (
       select 1
       from jsonb_array_elements(p_chain_snapshot) snapshot(value)
       where jsonb_typeof(snapshot.value) <> 'object'
          or not snapshot.value ?& array['id', 'parentId', 'level', 'name', 'slug', 'isActive']
          or (select count(*) from jsonb_object_keys(snapshot.value)) <> 6
     ) then
    raise exception using errcode = '22023', message = 'factual_review_chain_snapshot_invalid';
  end if;

  select reviews.*
    into v_existing
  from public.business_taxon_factual_reviews reviews
  where reviews.opened_operation_id = p_opened_operation_id;

  if found then
    v_kind := case when p_expected_is_active then 'revision' else 'release' end;
    if v_existing.taxon_id is distinct from p_taxon_id
       or v_existing.kind is distinct from v_kind
       or v_existing.context_fingerprint is distinct from p_context_fingerprint
       or v_existing.chain_snapshot is distinct from p_chain_snapshot
       or v_existing.baseline_is_active is distinct from p_expected_is_active
       or v_existing.baseline_reviewed_input_catalog_version is distinct from p_expected_reviewed_input_catalog_version
       or v_existing.opened_by is distinct from p_actor_user_id then
      raise exception using errcode = '22023', message = 'factual_review_operation_reused';
    end if;
  end if;

  begin
    perform 1
    from public.business_taxons taxons
    join jsonb_array_elements(p_chain_snapshot) snapshot(value)
      on taxons.id = (snapshot.value ->> 'id')::uuid
    order by taxons.id
    for update of taxons;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'factual_review_chain_snapshot_invalid';
  end;

  if (
       select count(*) <> v_chain_size
          or count(distinct snapshot.value ->> 'id') <> v_chain_size
       from jsonb_array_elements(p_chain_snapshot) snapshot(value)
     )
     or exists (
       select 1
       from jsonb_array_elements(p_chain_snapshot) snapshot(value)
       left join public.business_taxons taxons
         on taxons.id = (snapshot.value ->> 'id')::uuid
       where taxons.id is null
          or jsonb_build_object(
            'id', taxons.id::text,
            'parentId', taxons.parent_id::text,
            'level', taxons.level,
            'name', taxons.name,
            'slug', taxons.slug,
            'isActive', taxons.is_active
          ) <> snapshot.value
     ) then
    raise exception using errcode = '40001', message = 'factual_review_taxon_identity_conflict';
  end if;

  select taxons.*
    into v_taxon
  from public.business_taxons taxons
  where taxons.id = p_taxon_id
  ;

  if not found then
    raise exception using errcode = 'P0001', message = 'factual_review_taxon_not_found';
  end if;
  if v_taxon.is_active is distinct from p_expected_is_active
     or v_taxon.reviewed_input_catalog_version is distinct from p_expected_reviewed_input_catalog_version then
    raise exception using errcode = '40001', message = 'factual_review_baseline_conflict';
  end if;

  if (p_chain_snapshot -> (v_chain_size - 1) ->> 'id') is distinct from p_taxon_id::text
     or (v_taxon.level = 'segment' and (
       v_chain_size <> 1
       or v_taxon.parent_id is not null
       or p_chain_snapshot -> 0 ->> 'level' <> 'segment'
     ))
     or (v_taxon.level = 'niche' and (
       v_chain_size <> 2
       or p_chain_snapshot -> 0 ->> 'level' <> 'segment'
       or p_chain_snapshot -> 1 ->> 'level' <> 'niche'
       or (p_chain_snapshot -> 0 ->> 'parentId') is not null
       or p_chain_snapshot -> 0 ->> 'id' is distinct from v_taxon.parent_id::text
     ))
     or (v_taxon.level = 'ultra_niche' and (
       v_chain_size <> 3
       or p_chain_snapshot -> 0 ->> 'level' <> 'segment'
       or p_chain_snapshot -> 1 ->> 'level' <> 'niche'
       or p_chain_snapshot -> 2 ->> 'level' <> 'ultra_niche'
       or (p_chain_snapshot -> 0 ->> 'parentId') is not null
       or p_chain_snapshot -> 1 ->> 'id' is distinct from v_taxon.parent_id::text
       or p_chain_snapshot -> 0 ->> 'id' is distinct from p_chain_snapshot -> 1 ->> 'parentId'
     )) then
    raise exception using errcode = '22023', message = 'factual_review_chain_snapshot_invalid';
  end if;

  v_kind := case when v_taxon.is_active then 'revision' else 'release' end;

  if v_existing.id is not null then
    return query select
      v_existing.id,
      v_existing.kind,
      v_existing.status,
      v_existing.revision,
      v_existing.baseline_is_active,
      v_existing.baseline_reviewed_input_catalog_version;
    return;
  end if;

  begin
    insert into public.business_taxon_factual_reviews (
      taxon_id,
      kind,
      baseline_is_active,
      baseline_reviewed_input_catalog_version,
      context_fingerprint,
      chain_snapshot,
      opened_operation_id,
      opened_by
    ) values (
      v_taxon.id,
      v_kind,
      v_taxon.is_active,
      v_taxon.reviewed_input_catalog_version,
      p_context_fingerprint,
      p_chain_snapshot,
      p_opened_operation_id,
      p_actor_user_id
    )
    returning * into v_review;
  exception when unique_violation then
    select reviews.*
      into v_existing
    from public.business_taxon_factual_reviews reviews
    where reviews.opened_operation_id = p_opened_operation_id;
    if found
       and v_existing.taxon_id is not distinct from p_taxon_id
       and v_existing.kind is not distinct from v_kind
       and v_existing.context_fingerprint is not distinct from p_context_fingerprint
       and v_existing.chain_snapshot is not distinct from p_chain_snapshot
       and v_existing.baseline_is_active is not distinct from p_expected_is_active
       and v_existing.baseline_reviewed_input_catalog_version is not distinct from p_expected_reviewed_input_catalog_version
       and v_existing.opened_by is not distinct from p_actor_user_id then
      return query select
        v_existing.id,
        v_existing.kind,
        v_existing.status,
        v_existing.revision,
        v_existing.baseline_is_active,
        v_existing.baseline_reviewed_input_catalog_version;
      return;
    end if;
    raise exception using errcode = '40001', message = 'factual_review_already_open';
  end;

  insert into public.business_taxon_factual_review_events (
    review_id,
    operation_id,
    sequence_number,
    event_kind,
    payload_json,
    context_fingerprint,
    actor_user_id
  ) values (
    v_review.id,
    p_opened_operation_id,
    1,
    'opened',
    jsonb_build_object(
      'kind', v_review.kind,
      'baseline_is_active', v_review.baseline_is_active,
      'baseline_reviewed_input_catalog_version', v_review.baseline_reviewed_input_catalog_version
    ),
    p_context_fingerprint,
    p_actor_user_id
  );

  return query select
    v_review.id,
    v_review.kind,
    v_review.status,
    v_review.revision,
    v_review.baseline_is_active,
    v_review.baseline_reviewed_input_catalog_version;
end;
$$;

create or replace function public.close_business_taxon_factual_review_without_change_v1(
  p_review_id uuid,
  p_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_revision bigint,
  p_input_catalog_version integer,
  p_context_fingerprint text,
  p_content_fingerprint text,
  p_chain_snapshot jsonb
)
returns table(
  review_id uuid,
  review_kind text,
  review_status text,
  review_revision bigint,
  review_baseline_is_active boolean,
  review_baseline_reviewed_input_catalog_version integer
)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_existing_event public.business_taxon_factual_review_events%rowtype;
  v_review public.business_taxon_factual_reviews%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_next_sequence bigint;
  v_chain_size integer;
  v_is_idempotent_replay boolean := false;
begin
  if p_review_id is null
     or p_operation_id is null
     or p_actor_user_id is null
     or p_expected_revision is null
     or p_expected_revision <= 0
     or p_input_catalog_version is null
     or p_input_catalog_version <= 0
     or p_context_fingerprint is null
     or p_context_fingerprint !~ '^[0-9a-f]{64}$'
     or p_content_fingerprint is null
     or p_content_fingerprint !~ '^[0-9a-f]{64}$'
     or p_chain_snapshot is null
     or jsonb_typeof(p_chain_snapshot) <> 'array' then
    raise exception using errcode = '22023', message = 'factual_review_close_input_invalid';
  end if;

  v_chain_size := jsonb_array_length(p_chain_snapshot);
  if v_chain_size not between 1 and 3
     or exists (
       select 1
       from jsonb_array_elements(p_chain_snapshot) snapshot(value)
       where jsonb_typeof(snapshot.value) <> 'object'
          or not snapshot.value ?& array['id', 'parentId', 'level', 'name', 'slug', 'isActive']
          or (select count(*) from jsonb_object_keys(snapshot.value)) <> 6
     ) then
    raise exception using errcode = '22023', message = 'factual_review_chain_snapshot_invalid';
  end if;

  select events.*
    into v_existing_event
  from public.business_taxon_factual_review_events events
  where events.review_id = p_review_id
    and events.operation_id = p_operation_id;

  if found then
    if v_existing_event.event_kind <> 'closed_without_change'
       or v_existing_event.actor_user_id is distinct from p_actor_user_id
       or v_existing_event.context_fingerprint is distinct from p_context_fingerprint
       or v_existing_event.payload_json ->> 'input_catalog_version' is distinct from p_input_catalog_version::text
       or v_existing_event.payload_json ->> 'content_fingerprint' is distinct from p_content_fingerprint
       or v_existing_event.payload_json ->> 'expected_revision' is distinct from p_expected_revision::text
       or v_existing_event.payload_json -> 'chain_snapshot' is distinct from p_chain_snapshot then
      raise exception using errcode = '22023', message = 'factual_review_operation_reused';
    end if;
  end if;

  begin
    perform 1
    from public.business_taxons taxons
    join jsonb_array_elements(p_chain_snapshot) snapshot(value)
      on taxons.id = (snapshot.value ->> 'id')::uuid
    order by taxons.id
    for update of taxons;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'factual_review_chain_snapshot_invalid';
  end;

  select reviews.*
    into v_review
  from public.business_taxon_factual_reviews reviews
  where reviews.id = p_review_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'factual_review_not_found';
  end if;
  if v_review.status = 'closed_without_change' then
    select events.*
      into v_existing_event
    from public.business_taxon_factual_review_events events
    where events.review_id = p_review_id
      and events.operation_id = p_operation_id;
    if found
       and v_existing_event.event_kind = 'closed_without_change'
       and v_existing_event.actor_user_id is not distinct from p_actor_user_id
       and v_existing_event.context_fingerprint is not distinct from p_context_fingerprint
       and v_existing_event.payload_json ->> 'input_catalog_version' is not distinct from p_input_catalog_version::text
       and v_existing_event.payload_json ->> 'content_fingerprint' is not distinct from p_content_fingerprint
       and v_existing_event.payload_json ->> 'expected_revision' is not distinct from p_expected_revision::text
       and v_existing_event.payload_json -> 'chain_snapshot' is not distinct from p_chain_snapshot then
      v_is_idempotent_replay := true;
    else
      raise exception using errcode = '40001', message = 'factual_review_state_conflict';
    end if;
  end if;
  if not v_is_idempotent_replay and (
       v_review.status <> 'open'
       or v_review.revision <> p_expected_revision
       or v_review.context_fingerprint is distinct from p_context_fingerprint
       or v_review.chain_snapshot is distinct from p_chain_snapshot
     ) then
    raise exception using errcode = '40001', message = 'factual_review_state_conflict';
  end if;

  if v_review.context_fingerprint is distinct from p_context_fingerprint
     or v_review.chain_snapshot is distinct from p_chain_snapshot
     or (p_chain_snapshot -> (v_chain_size - 1) ->> 'id') is distinct from v_review.taxon_id::text then
    raise exception using errcode = '40001', message = 'factual_review_context_conflict';
  end if;

  if (
       select count(*) <> v_chain_size
          or count(distinct snapshot.value ->> 'id') <> v_chain_size
       from jsonb_array_elements(p_chain_snapshot) snapshot(value)
     )
     or exists (
       select 1
       from jsonb_array_elements(p_chain_snapshot) snapshot(value)
       left join public.business_taxons taxons
         on taxons.id = (snapshot.value ->> 'id')::uuid
       where taxons.id is null
          or jsonb_build_object(
            'id', taxons.id::text,
            'parentId', taxons.parent_id::text,
            'level', taxons.level,
            'name', taxons.name,
            'slug', taxons.slug,
            'isActive', case
              when v_is_idempotent_replay
                and v_review.kind = 'release'
                and taxons.id = v_review.taxon_id
                then false
              else taxons.is_active
            end
          ) <> snapshot.value
     ) then
    raise exception using errcode = '40001', message = 'factual_review_taxon_identity_conflict';
  end if;

  select taxons.*
    into v_taxon
  from public.business_taxons taxons
  where taxons.id = v_review.taxon_id
  ;

  if not found then
    raise exception using errcode = '40001', message = 'factual_review_taxon_conflict';
  end if;

  if (v_taxon.level = 'segment' and (
       v_chain_size <> 1
       or v_taxon.parent_id is not null
       or p_chain_snapshot -> 0 ->> 'level' <> 'segment'
     ))
     or (v_taxon.level = 'niche' and (
       v_chain_size <> 2
       or p_chain_snapshot -> 0 ->> 'level' <> 'segment'
       or p_chain_snapshot -> 1 ->> 'level' <> 'niche'
       or (p_chain_snapshot -> 0 ->> 'parentId') is not null
       or p_chain_snapshot -> 0 ->> 'id' is distinct from v_taxon.parent_id::text
     ))
     or (v_taxon.level = 'ultra_niche' and (
       v_chain_size <> 3
       or p_chain_snapshot -> 0 ->> 'level' <> 'segment'
       or p_chain_snapshot -> 1 ->> 'level' <> 'niche'
       or p_chain_snapshot -> 2 ->> 'level' <> 'ultra_niche'
       or (p_chain_snapshot -> 0 ->> 'parentId') is not null
       or p_chain_snapshot -> 1 ->> 'id' is distinct from v_taxon.parent_id::text
       or p_chain_snapshot -> 0 ->> 'id' is distinct from p_chain_snapshot -> 1 ->> 'parentId'
     )) then
    raise exception using errcode = '22023', message = 'factual_review_chain_snapshot_invalid';
  end if;

  if v_is_idempotent_replay then
    if not v_taxon.is_active
       or v_taxon.reviewed_input_catalog_version is distinct from p_input_catalog_version then
      raise exception using errcode = '40001', message = 'factual_review_taxon_conflict';
    end if;
    return query select
      v_review.id,
      v_review.kind,
      v_review.status,
      v_review.revision,
      v_review.baseline_is_active,
      v_review.baseline_reviewed_input_catalog_version;
    return;
  end if;

  if v_taxon.is_active is distinct from v_review.baseline_is_active
     or v_taxon.reviewed_input_catalog_version is distinct from v_review.baseline_reviewed_input_catalog_version then
    raise exception using errcode = '40001', message = 'factual_review_taxon_conflict';
  end if;

  select coalesce(max(events.sequence_number), 0) + 1
    into v_next_sequence
  from public.business_taxon_factual_review_events events
  where events.review_id = v_review.id;

  insert into public.business_taxon_factual_review_events (
    review_id,
    operation_id,
    sequence_number,
    event_kind,
    decision_kind,
    payload_json,
    context_fingerprint,
    content_fingerprint,
    actor_user_id
  ) values (
    v_review.id,
    gen_random_uuid(),
    v_next_sequence,
    'decision_recorded',
    'no_change',
    jsonb_build_object(
      'input_catalog_version', p_input_catalog_version,
      'content_fingerprint', p_content_fingerprint,
      'expected_revision', p_expected_revision
    ),
    p_context_fingerprint,
    p_content_fingerprint,
    p_actor_user_id
  );

  update public.business_taxons
  set reviewed_input_catalog_version = p_input_catalog_version,
      is_active = case when v_review.kind = 'release' then true else is_active end
  where id = v_review.taxon_id;

  update public.business_taxon_factual_reviews
  set status = 'closed_without_change',
      revision = revision + 1,
      closed_by = p_actor_user_id,
      closed_at = now()
  where id = v_review.id
  returning * into v_review;

  insert into public.business_taxon_factual_review_events (
    review_id,
    operation_id,
    sequence_number,
    event_kind,
    payload_json,
    context_fingerprint,
    actor_user_id
  ) values (
    v_review.id,
    p_operation_id,
    v_next_sequence + 1,
    'closed_without_change',
    jsonb_build_object(
      'input_catalog_version', p_input_catalog_version,
      'content_fingerprint', p_content_fingerprint,
      'expected_revision', p_expected_revision,
      'chain_snapshot', p_chain_snapshot
    ),
    p_context_fingerprint,
    p_actor_user_id
  );

  return query select
    v_review.id,
    v_review.kind,
    v_review.status,
    v_review.revision,
    v_review.baseline_is_active,
    v_review.baseline_reviewed_input_catalog_version;
end;
$$;

revoke all on function public.reject_business_taxon_factual_review_event_mutation_v1()
  from public, anon, authenticated;
revoke all on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer)
  from public, anon, authenticated;
revoke all on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb)
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.reject_business_taxon_factual_review_event_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer) from ai_readonly';
    execute 'revoke all on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.reject_business_taxon_factual_review_event_mutation_v1()
  to service_role;
grant execute on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer)
  to service_role;
grant execute on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb)
  to service_role;

comment on table public.business_taxon_factual_reviews is
  'E20.6.3: autoridade service-only do estado de liberacao e revisao factual por taxon.';
comment on table public.business_taxon_factual_review_events is
  'E20.6.3: trilha factual append-only; payloads nao armazenam prompt, pesquisa integral, conteudo web, secrets, conta ou PII.';
comment on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer) is
  'E20.6.3: abre idempotentemente release ou revision sem alterar disponibilidade ou ultima versao valida.';
comment on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb) is
  'E20.6.3: confirma cobertura herdada e, atomicamente, ativa apenas uma release ou preserva uma revision ativa.';

commit;
