begin;

alter table public.business_taxons
  alter column is_active set default false;

alter table public.landing_page_input_catalog_drafts
  add column factual_review_save_receipts jsonb not null default '{}'::jsonb,
  add constraint landing_page_input_catalog_drafts_factual_review_save_receipts_chk
    check (jsonb_typeof(factual_review_save_receipts) = 'object');

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
        event_kind = 'evaluation_inconclusive'
        and (content_fingerprint is null or content_fingerprint ~ '^[0-9a-f]{64}$')
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('e20_6_factual_review_open_authorize_v1', 0)
  );

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
  p_chain_snapshot jsonb,
  p_human_decision jsonb default null
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
  v_human_candidate_count integer;
  v_human_candidate jsonb;
  v_human_index integer;
  v_human_seen integer[] := '{}'::integer[];
  v_recommendation public.business_taxon_factual_review_events%rowtype;
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

  if p_human_decision is not null then
    if jsonb_typeof(p_human_decision) <> 'object'
       or not p_human_decision ?& array[
         'recommendationCandidateCount', 'recommendationSelection',
         'acceptedCandidates', 'rejectedCandidateIndexes', 'ownCandidate'
       ]
       or (select count(*) from jsonb_object_keys(p_human_decision)) not in (5, 8)
       or jsonb_typeof(p_human_decision -> 'recommendationCandidateCount') <> 'number'
       or (p_human_decision ->> 'recommendationCandidateCount') !~ '^[0-9]+$'
       or p_human_decision ->> 'recommendationSelection' <> 'zero'
       or p_human_decision -> 'acceptedCandidates' <> '[]'::jsonb
       or jsonb_typeof(p_human_decision -> 'rejectedCandidateIndexes') <> 'array'
       or jsonb_typeof(p_human_decision -> 'ownCandidate') <> 'null' then
      raise exception using errcode = '22023', message = 'factual_review_no_change_decision_invalid';
    end if;
    v_human_candidate_count :=
      (p_human_decision ->> 'recommendationCandidateCount')::integer;
    if v_human_candidate_count > 100 then
      raise exception using errcode = '22023', message = 'factual_review_no_change_decision_invalid';
    end if;
    if (v_human_candidate_count > 0 and (
         p_human_decision ->> 'recommendationEventId' is null
         or p_human_decision ->> 'recommendationOutputFingerprint' !~ '^[0-9a-f]{64}$'
         or p_human_decision ->> 'recommendationEvaluationContextFingerprint' !~ '^[0-9a-f]{64}$'
       ))
       or (v_human_candidate_count = 0 and (
         p_human_decision ? 'recommendationEventId'
         or p_human_decision ? 'recommendationOutputFingerprint'
         or p_human_decision ? 'recommendationEvaluationContextFingerprint'
       )) then
      raise exception using errcode = '22023', message = 'factual_review_recommendation_invalid';
    end if;
    for v_human_candidate in
      select value
      from jsonb_array_elements(p_human_decision -> 'rejectedCandidateIndexes')
    loop
      if jsonb_typeof(v_human_candidate) <> 'number'
         or trim(both '"' from v_human_candidate::text) !~ '^[0-9]+$' then
        raise exception using errcode = '22023', message = 'factual_review_no_change_decision_invalid';
      end if;
      v_human_index := trim(both '"' from v_human_candidate::text)::integer;
      if v_human_index >= v_human_candidate_count
         or v_human_index = any(v_human_seen) then
        raise exception using errcode = '22023', message = 'factual_review_no_change_decision_invalid';
      end if;
      v_human_seen := array_append(v_human_seen, v_human_index);
    end loop;
    if cardinality(v_human_seen) <> v_human_candidate_count then
      raise exception using errcode = '22023', message = 'factual_review_no_change_decision_invalid';
    end if;
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
       or v_existing_event.payload_json -> 'chain_snapshot' is distinct from p_chain_snapshot
       or v_existing_event.payload_json -> 'human_decision'
         is distinct from coalesce(p_human_decision, 'null'::jsonb) then
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
       and v_existing_event.payload_json -> 'chain_snapshot' is not distinct from p_chain_snapshot
       and v_existing_event.payload_json -> 'human_decision'
         is not distinct from coalesce(p_human_decision, 'null'::jsonb) then
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

  if p_human_decision is not null and v_human_candidate_count > 0 then
    begin
      select events.* into v_recommendation
      from public.business_taxon_factual_review_events events
      where events.id = (p_human_decision ->> 'recommendationEventId')::uuid
        and events.review_id = v_review.id;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'factual_review_recommendation_invalid';
    end;
    if not found
       or v_recommendation.event_kind <> 'evaluation_completed'
       or v_recommendation.context_fingerprint <> v_review.context_fingerprint
       or v_recommendation.content_fingerprint
         <> p_human_decision ->> 'recommendationOutputFingerprint'
       or v_recommendation.payload_json ->> 'outputFingerprint'
         <> p_human_decision ->> 'recommendationOutputFingerprint'
       or v_recommendation.payload_json ->> 'evaluationContextFingerprint'
         <> p_human_decision ->> 'recommendationEvaluationContextFingerprint'
       or v_recommendation.payload_json ->> 'reviewContextFingerprint'
         <> p_context_fingerprint
       or v_recommendation.payload_json ->> 'candidateCount'
         <> v_human_candidate_count::text
       or jsonb_typeof(v_recommendation.payload_json -> 'output' -> 'candidates') <> 'array'
       or jsonb_array_length(v_recommendation.payload_json -> 'output' -> 'candidates')
         <> v_human_candidate_count then
      raise exception using errcode = '22023', message = 'factual_review_recommendation_invalid';
    end if;
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
      'expected_revision', p_expected_revision,
      'human_decision', p_human_decision
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
      'chain_snapshot', p_chain_snapshot,
      'human_decision', p_human_decision
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

create or replace function public.guard_landing_page_input_catalog_draft_factual_projection_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  if tg_op = 'INSERT'
     and (
       new.taxon_review_evidence <> '{}'::jsonb
       or new.factual_review_save_receipts <> '{}'::jsonb
     ) then
    raise exception using errcode = '42501', message = 'factual_review_projection_is_rpc_derived';
  end if;
  if tg_op = 'UPDATE'
     and (
       new.taxon_review_evidence is distinct from old.taxon_review_evidence
       or new.factual_review_save_receipts is distinct from old.factual_review_save_receipts
     )
     and coalesce(current_setting('app.factual_review_projection_write', true), '') <> 'on' then
    raise exception using errcode = '42501', message = 'factual_review_projection_is_rpc_derived';
  end if;
  return new;
end;
$$;

create trigger landing_page_input_catalog_drafts_guard_factual_projection
before insert or update
on public.landing_page_input_catalog_drafts
for each row execute function public.guard_landing_page_input_catalog_draft_factual_projection_v1();

create or replace function public.append_business_taxon_factual_review_evaluation_event_v1(
  p_review_id uuid,
  p_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_review_revision bigint,
  p_review_context_fingerprint text,
  p_event_kind text,
  p_source_strategy text,
  p_content_fingerprint text,
  p_payload_json jsonb
)
returns table(event_id uuid, review_revision bigint)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_review public.business_taxon_factual_reviews%rowtype;
  v_existing public.business_taxon_factual_review_events%rowtype;
  v_next_sequence bigint;
  v_candidate jsonb;
  v_material_text text;
  v_material_texts text[] := array[]::text[];
  v_url_match text[];
  v_url_parts text[];
  v_raw_url text;
  v_canonical_url text;
  v_material_text_url_projection jsonb := '[]'::jsonb;
begin
  if p_review_id is null or p_operation_id is null or p_actor_user_id is null
     or p_expected_review_revision is null or p_expected_review_revision <= 0
     or p_review_context_fingerprint !~ '^[0-9a-f]{64}$'
     or p_event_kind not in ('evaluation_requested', 'evaluation_completed', 'evaluation_inconclusive')
     or p_source_strategy not in ('e20_5', 'web_search_fallback', 'web_search_focal')
     or jsonb_typeof(p_payload_json) is distinct from 'object'
     or p_payload_json ->> 'reviewContextFingerprint' is distinct from p_review_context_fingerprint
     or coalesce(p_payload_json ->> 'evaluationContextFingerprint', '') !~ '^[0-9a-f]{64}$'
     or jsonb_typeof(p_payload_json -> 'deadlineAtMs') is distinct from 'number'
     or coalesce(p_payload_json ->> 'deadlineAtMs', '') !~ '^[1-9][0-9]{11,15}$'
     or (p_event_kind = 'evaluation_requested' and p_content_fingerprint is not null)
     or (p_event_kind = 'evaluation_completed' and p_content_fingerprint !~ '^[0-9a-f]{64}$')
     or (p_event_kind = 'evaluation_inconclusive'
       and p_content_fingerprint is not null
       and p_content_fingerprint !~ '^[0-9a-f]{64}$')
     or (p_event_kind = 'evaluation_completed' and (
       p_payload_json ->> 'outputFingerprint' is distinct from p_content_fingerprint
       or jsonb_typeof(p_payload_json -> 'output') is distinct from 'object'
       or p_payload_json -> 'output' ->> 'schemaVersion' is distinct from '2'
       or jsonb_typeof(p_payload_json -> 'output' -> 'candidates') is distinct from 'array'
       or coalesce(p_payload_json ->> 'inputCatalogVersion', '') !~ '^[1-9][0-9]*$'
       or coalesce(p_payload_json ->> 'candidateCount', '') !~ '^[0-9]+$'
       or jsonb_array_length(p_payload_json -> 'output' -> 'candidates')
         <> (p_payload_json ->> 'candidateCount')::integer
       or coalesce(p_payload_json ->> 'webSearchCallCount', '') !~ '^[0-9]+$'
       or jsonb_typeof(p_payload_json -> 'webSearchSources') is distinct from 'array'
       or jsonb_typeof(p_payload_json -> 'materialTextUrlProjection') is distinct from 'array'
     ))
     or (p_event_kind = 'evaluation_inconclusive' and (
       (p_content_fingerprint is null and p_payload_json ? 'output')
       or (p_content_fingerprint is not null and (
         p_payload_json ->> 'outputFingerprint' is distinct from p_content_fingerprint
         or jsonb_typeof(p_payload_json -> 'output') is distinct from 'object'
       ))
     )) then
    raise exception using errcode = '22023', message = 'factual_review_evaluation_event_input_invalid';
  end if;

  if p_event_kind = 'evaluation_completed' then
    v_material_texts := array_append(v_material_texts, p_payload_json -> 'output' ->> 'summary');
    v_material_texts := array_append(v_material_texts, p_payload_json -> 'output' ->> 'followUpQuestion');
    for v_candidate in
      select value from jsonb_array_elements(p_payload_json -> 'output' -> 'candidates')
    loop
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'factualNeed');
      if jsonb_typeof(v_candidate -> 'relatedFields') = 'array' then
        select v_material_texts || coalesce(array_agg(value order by ordinal), array[]::text[])
          into v_material_texts
        from jsonb_array_elements_text(v_candidate -> 'relatedFields') with ordinality fields(value, ordinal);
      end if;
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'currentCoverage');
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'allegedInsufficiency');
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'evidence');
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'expectedOperationalSource');
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'realConsumer');
      v_material_texts := array_append(v_material_texts, v_candidate ->> 'concreteHarm');
      if jsonb_typeof(v_candidate -> 'uncertainties') = 'array' then
        select v_material_texts || coalesce(array_agg(value order by ordinal), array[]::text[])
          into v_material_texts
        from jsonb_array_elements_text(v_candidate -> 'uncertainties') with ordinality uncertainties(value, ordinal);
      end if;
    end loop;

    foreach v_material_text in array v_material_texts
    loop
      if v_material_text is null then continue; end if;
      for v_url_match in
        select regexp_matches(
          v_material_text,
          '(([a-z][a-z0-9+.-]*://|www\.)[^[:space:]<>"''`)\]}]+)',
          'gi'
        )
      loop
        v_raw_url := regexp_replace(v_url_match[1], '[.,;:!?]+$', '');
        v_canonical_url := null;
        if v_raw_url ~* '^https://' then
          v_url_parts := regexp_match(
            v_raw_url,
            '^https://([^/?#:@]+)(:([0-9]+))?([^#]*)?(#.*)?$',
            'i'
          );
          if v_url_parts is not null then
            v_canonical_url := 'https://' || lower(v_url_parts[1]) ||
              case when v_url_parts[3] is null or v_url_parts[3] = '443'
                then '' else ':' || v_url_parts[3] end ||
              case
                when coalesce(v_url_parts[4], '') = '' then '/'
                when left(v_url_parts[4], 1) = '?' then '/' || v_url_parts[4]
                else v_url_parts[4]
              end;
          end if;
        end if;
        if not exists (
          select 1
          from jsonb_array_elements(v_material_text_url_projection) projected(value)
          where projected.value ->> 'raw' = v_raw_url
        ) then
          v_material_text_url_projection := v_material_text_url_projection || jsonb_build_array(
            jsonb_build_object('raw', v_raw_url, 'canonical', v_canonical_url)
          );
        end if;
      end loop;
    end loop;

    if p_payload_json -> 'materialTextUrlProjection'
         is distinct from v_material_text_url_projection
       or exists (
         select 1
         from jsonb_array_elements(v_material_text_url_projection) projected(value)
         where jsonb_typeof(projected.value) is distinct from 'object'
            or (select count(*) from jsonb_object_keys(projected.value)) <> 2
            or jsonb_typeof(projected.value -> 'raw') is distinct from 'string'
            or jsonb_typeof(projected.value -> 'canonical') is distinct from 'string'
            or projected.value ->> 'canonical' !~ '^https://[^[:space:]]+$'
            or projected.value ->> 'canonical' not in (
              select value from jsonb_array_elements_text(p_payload_json -> 'webSearchSources')
            )
       ) then
      raise exception using errcode = '22023', message = 'factual_review_evaluation_text_sources_invalid';
    end if;
  end if;

  if p_event_kind = 'evaluation_completed' and (
       p_payload_json -> 'output' ->> 'sourceStrategy' is distinct from p_source_strategy
       or (p_source_strategy = 'e20_5' and (
         (p_payload_json ->> 'webSearchCallCount')::integer <> 0
         or p_payload_json -> 'webSearchSources' is distinct from '[]'::jsonb
         or p_payload_json -> 'output' -> 'summarySourceUrls' is distinct from '[]'::jsonb
       ))
       or (p_source_strategy <> 'e20_5' and (
         (p_payload_json ->> 'webSearchCallCount')::integer < 1
         or (p_source_strategy = 'web_search_focal'
           and (p_payload_json ->> 'webSearchCallCount')::integer > 1)
         or (p_source_strategy = 'web_search_fallback'
           and (p_payload_json ->> 'webSearchCallCount')::integer > 2)
         or jsonb_array_length(p_payload_json -> 'webSearchSources') = 0
         or exists (
           select 1
           from jsonb_array_elements(p_payload_json -> 'webSearchSources') source(value)
           where jsonb_typeof(source.value) is distinct from 'string'
              or length(source.value #>> '{}') > 2048
              or source.value #>> '{}' !~ '^https://[^[:space:]]+$'
         )
         or jsonb_array_length(p_payload_json -> 'webSearchSources') <> (
           select count(distinct source.value #>> '{}')
           from jsonb_array_elements(p_payload_json -> 'webSearchSources') source(value)
         )
         or jsonb_typeof(p_payload_json -> 'output' -> 'summarySourceUrls') is distinct from 'array'
         or jsonb_array_length(p_payload_json -> 'output' -> 'summarySourceUrls') = 0
         or exists (
           select 1
           from jsonb_array_elements(p_payload_json -> 'output' -> 'candidates') candidate(value)
           where (
               jsonb_typeof(candidate.value -> 'sourceUrls') is distinct from 'array'
               or jsonb_array_length(candidate.value -> 'sourceUrls') = 0
             )
         )
       ))
       or exists (
         select 1
         from jsonb_array_elements_text(
           coalesce(p_payload_json -> 'output' -> 'summarySourceUrls', '[]'::jsonb)
         ) cited(url)
         where cited.url not in (
           select value from jsonb_array_elements_text(p_payload_json -> 'webSearchSources')
         )
       )
       or exists (
         select 1
         from jsonb_array_elements(p_payload_json -> 'output' -> 'candidates') candidate(value),
              jsonb_array_elements_text(coalesce(candidate.value -> 'sourceUrls', '[]'::jsonb)) cited(url)
         where cited.url not in (
           select value from jsonb_array_elements_text(p_payload_json -> 'webSearchSources')
         )
       )
     ) then
    raise exception using errcode = '22023', message = 'factual_review_evaluation_sources_invalid';
  end if;

  select reviews.* into v_review
  from public.business_taxon_factual_reviews reviews
  where reviews.id = p_review_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'factual_review_not_found';
  end if;

  select events.* into v_existing
  from public.business_taxon_factual_review_events events
  where events.review_id = p_review_id and events.operation_id = p_operation_id;
  if found then
    if v_existing.event_kind <> p_event_kind
       or v_existing.source_strategy <> p_source_strategy
       or v_existing.actor_user_id <> p_actor_user_id
       or v_existing.context_fingerprint <> p_review_context_fingerprint
       or v_existing.content_fingerprint is distinct from p_content_fingerprint
       or v_existing.payload_json <> (
         p_payload_json || jsonb_build_object('expectedReviewRevision', p_expected_review_revision)
       )
       or v_existing.payload_json ->> 'expectedReviewRevision' <> p_expected_review_revision::text then
      raise exception using errcode = '22023', message = 'factual_review_operation_reused';
    end if;
    return query select v_existing.id, p_expected_review_revision;
    return;
  end if;

  if floor(extract(epoch from clock_timestamp()) * 1000)
       >= (p_payload_json ->> 'deadlineAtMs')::numeric then
    raise exception using errcode = '57014', message = 'factual_review_evaluation_deadline_exceeded';
  end if;

  if v_review.status <> 'open'
     or v_review.revision <> p_expected_review_revision
     or v_review.context_fingerprint <> p_review_context_fingerprint then
    raise exception using errcode = '40001', message = 'factual_review_state_conflict';
  end if;

  select coalesce(max(events.sequence_number), 0) + 1 into v_next_sequence
  from public.business_taxon_factual_review_events events
  where events.review_id = p_review_id;
  insert into public.business_taxon_factual_review_events (
    review_id, operation_id, sequence_number, event_kind, source_strategy,
    payload_json, context_fingerprint, content_fingerprint, actor_user_id
  ) values (
    p_review_id, p_operation_id, v_next_sequence, p_event_kind, p_source_strategy,
    p_payload_json || jsonb_build_object('expectedReviewRevision', p_expected_review_revision),
    p_review_context_fingerprint, p_content_fingerprint, p_actor_user_id
  ) returning id into event_id;
  review_revision := v_review.revision;
  return next;
end;
$$;

create or replace function public.record_business_taxon_factual_catalog_change_decision_v1(
  p_review_id uuid,
  p_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_review_revision bigint,
  p_review_context_fingerprint text,
  p_chain_snapshot jsonb,
  p_draft_revision bigint,
  p_target_input_catalog_version integer,
  p_draft_content_fingerprint text,
  p_draft_context_fingerprint text,
  p_decision_payload jsonb
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
  v_draft public.landing_page_input_catalog_drafts%rowtype;
  v_review public.business_taxon_factual_reviews%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_existing public.business_taxon_factual_review_events%rowtype;
  v_decision_event_id uuid;
  v_next_sequence bigint;
  v_candidate_count integer;
  v_accepted_count integer;
  v_candidate jsonb;
  v_index integer;
  v_seen integer[] := '{}'::integer[];
  v_expected_selection text;
  v_recommendation public.business_taxon_factual_review_events%rowtype;
begin
  if p_review_id is null
     or p_operation_id is null
     or p_actor_user_id is null
     or p_expected_review_revision is null
     or p_expected_review_revision <= 0
     or p_draft_revision is null
     or p_draft_revision <= 0
     or p_target_input_catalog_version is null
     or p_target_input_catalog_version <= 0
     or p_review_context_fingerprint !~ '^[0-9a-f]{64}$'
     or p_draft_content_fingerprint !~ '^[0-9a-f]{64}$'
     or p_draft_context_fingerprint !~ '^[0-9a-f]{64}$'
     or jsonb_typeof(p_chain_snapshot) <> 'array'
     or jsonb_typeof(p_decision_payload) <> 'object'
     or not p_decision_payload ?& array[
       'recommendationCandidateCount',
       'recommendationSelection',
       'acceptedCandidates',
       'rejectedCandidateIndexes',
       'ownCandidate'
     ]
     or (select count(*) from jsonb_object_keys(p_decision_payload)) not in (5, 8)
     or jsonb_typeof(p_decision_payload -> 'recommendationCandidateCount') <> 'number'
     or (p_decision_payload ->> 'recommendationCandidateCount') !~ '^[0-9]+$'
     or jsonb_typeof(p_decision_payload -> 'acceptedCandidates') <> 'array'
     or jsonb_typeof(p_decision_payload -> 'rejectedCandidateIndexes') <> 'array'
     or p_decision_payload ->> 'recommendationSelection' not in ('zero', 'partial', 'total')
     or jsonb_typeof(p_decision_payload -> 'ownCandidate') not in ('null', 'object') then
    raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
  end if;

  v_candidate_count := (p_decision_payload ->> 'recommendationCandidateCount')::integer;
  if v_candidate_count > 100 then
    raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
  end if;
  if (v_candidate_count > 0 and (
       p_decision_payload ->> 'recommendationEventId' is null
       or p_decision_payload ->> 'recommendationOutputFingerprint' !~ '^[0-9a-f]{64}$'
       or p_decision_payload ->> 'recommendationEvaluationContextFingerprint' !~ '^[0-9a-f]{64}$'
     ))
     or (v_candidate_count = 0 and (
       p_decision_payload ? 'recommendationEventId'
       or p_decision_payload ? 'recommendationOutputFingerprint'
       or p_decision_payload ? 'recommendationEvaluationContextFingerprint'
     )) then
    raise exception using errcode = '22023', message = 'factual_review_recommendation_invalid';
  end if;

  for v_candidate in
    select value from jsonb_array_elements(p_decision_payload -> 'acceptedCandidates')
  loop
    if jsonb_typeof(v_candidate) <> 'object'
       or not v_candidate ?& array['index', 'layer']
       or (select count(*) from jsonb_object_keys(v_candidate)) <> 2
       or jsonb_typeof(v_candidate -> 'index') <> 'number'
       or (v_candidate ->> 'index') !~ '^[0-9]+$'
       or v_candidate ->> 'layer' not in ('universal', 'segment', 'niche', 'ultra_niche') then
      raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
    end if;
    v_index := (v_candidate ->> 'index')::integer;
    if v_index >= v_candidate_count or v_index = any(v_seen) then
      raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
    end if;
    v_seen := array_append(v_seen, v_index);
  end loop;
  v_accepted_count := coalesce(jsonb_array_length(p_decision_payload -> 'acceptedCandidates'), 0);

  for v_candidate in
    select value from jsonb_array_elements(p_decision_payload -> 'rejectedCandidateIndexes')
  loop
    if jsonb_typeof(v_candidate) <> 'number'
       or trim(both '"' from v_candidate::text) !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
    end if;
    v_index := trim(both '"' from v_candidate::text)::integer;
    if v_index >= v_candidate_count or v_index = any(v_seen) then
      raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
    end if;
    v_seen := array_append(v_seen, v_index);
  end loop;

  if cardinality(v_seen) <> v_candidate_count then
    raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
  end if;
  v_expected_selection := case
    when v_accepted_count = 0 then 'zero'
    when v_accepted_count = v_candidate_count then 'total'
    else 'partial'
  end;
  if p_decision_payload ->> 'recommendationSelection' <> v_expected_selection then
    raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
  end if;
  if jsonb_typeof(p_decision_payload -> 'ownCandidate') = 'object'
     and (
       not (p_decision_payload -> 'ownCandidate') ?& array['factualNeed', 'layer']
       or (select count(*) from jsonb_object_keys(p_decision_payload -> 'ownCandidate')) <> 2
       or jsonb_typeof(p_decision_payload -> 'ownCandidate' -> 'factualNeed') <> 'string'
       or length(btrim(p_decision_payload -> 'ownCandidate' ->> 'factualNeed')) not between 1 and 1000
       or p_decision_payload -> 'ownCandidate' ->> 'layer'
         not in ('universal', 'segment', 'niche', 'ultra_niche')
     ) then
    raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
  end if;
  if v_accepted_count = 0
     and jsonb_typeof(p_decision_payload -> 'ownCandidate') = 'null' then
    raise exception using errcode = '22023', message = 'factual_review_catalog_change_decision_invalid';
  end if;

  select drafts.*
    into v_draft
  from public.landing_page_input_catalog_drafts drafts
  where drafts.singleton
  for update;
  if not found
     or v_draft.revision <> p_draft_revision
     or v_draft.target_version <> p_target_input_catalog_version
     or v_draft.content_fingerprint <> p_draft_content_fingerprint then
    raise exception using errcode = '40001', message = 'factual_review_draft_conflict';
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

  select events.*
    into v_existing
  from public.business_taxon_factual_review_events events
  where events.review_id = p_review_id
    and events.operation_id = p_operation_id;
  if found then
    if v_existing.event_kind <> 'decision_recorded'
       or v_existing.decision_kind <> 'catalog_change'
       or v_existing.actor_user_id <> p_actor_user_id
       or v_existing.context_fingerprint <> p_draft_context_fingerprint
       or v_existing.content_fingerprint <> p_draft_content_fingerprint
       or v_existing.payload_json -> 'decision' <> p_decision_payload
       or v_existing.payload_json ->> 'draft_revision' <> p_draft_revision::text
       or v_existing.payload_json ->> 'expected_review_revision'
         <> p_expected_review_revision::text
       or v_existing.payload_json ->> 'target_input_catalog_version'
         <> p_target_input_catalog_version::text
       or v_existing.payload_json ->> 'review_context_fingerprint'
         <> p_review_context_fingerprint
       or v_existing.payload_json -> 'chain_snapshot' <> p_chain_snapshot
       or v_review.chain_snapshot <> p_chain_snapshot then
      raise exception using errcode = '22023', message = 'factual_review_operation_reused';
    end if;
    return query select
      v_review.id, v_review.kind, v_review.status, v_review.revision,
      v_review.baseline_is_active, v_review.baseline_reviewed_input_catalog_version;
    return;
  end if;

  if v_review.status <> 'open'
     or v_review.revision <> p_expected_review_revision
     or v_review.context_fingerprint <> p_review_context_fingerprint
     or v_review.chain_snapshot <> p_chain_snapshot then
    raise exception using errcode = '40001', message = 'factual_review_state_conflict';
  end if;

  if v_candidate_count > 0 then
    begin
      select events.* into v_recommendation
      from public.business_taxon_factual_review_events events
      where events.id = (p_decision_payload ->> 'recommendationEventId')::uuid
        and events.review_id = v_review.id;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'factual_review_recommendation_invalid';
    end;
    if not found
       or v_recommendation.event_kind <> 'evaluation_completed'
       or v_recommendation.context_fingerprint <> v_review.context_fingerprint
       or v_recommendation.content_fingerprint
         <> p_decision_payload ->> 'recommendationOutputFingerprint'
       or v_recommendation.payload_json ->> 'outputFingerprint'
         <> p_decision_payload ->> 'recommendationOutputFingerprint'
       or v_recommendation.payload_json ->> 'evaluationContextFingerprint'
         <> p_decision_payload ->> 'recommendationEvaluationContextFingerprint'
       or v_recommendation.payload_json ->> 'reviewContextFingerprint'
         <> p_review_context_fingerprint
       or v_recommendation.payload_json ->> 'candidateCount' <> v_candidate_count::text
       or jsonb_typeof(v_recommendation.payload_json -> 'output' -> 'candidates') <> 'array'
       or jsonb_array_length(v_recommendation.payload_json -> 'output' -> 'candidates')
         <> v_candidate_count then
      raise exception using errcode = '22023', message = 'factual_review_recommendation_invalid';
    end if;
  end if;

  select taxons.*
    into v_taxon
  from public.business_taxons taxons
  where taxons.id = v_review.taxon_id;
  if not found
     or v_taxon.is_active is distinct from v_review.baseline_is_active
     or v_taxon.reviewed_input_catalog_version
       is distinct from v_review.baseline_reviewed_input_catalog_version
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

  select coalesce(max(events.sequence_number), 0) + 1
    into v_next_sequence
  from public.business_taxon_factual_review_events events
  where events.review_id = v_review.id;
  v_decision_event_id := gen_random_uuid();
  insert into public.business_taxon_factual_review_events (
    id, review_id, operation_id, sequence_number, event_kind, decision_kind,
    payload_json, context_fingerprint, content_fingerprint, actor_user_id
  ) values (
    v_decision_event_id, v_review.id, p_operation_id, v_next_sequence,
    'decision_recorded', 'catalog_change',
    jsonb_build_object(
      'decision', p_decision_payload,
      'draft_revision', p_draft_revision,
      'expected_review_revision', p_expected_review_revision,
      'target_input_catalog_version', p_target_input_catalog_version,
      'review_context_fingerprint', p_review_context_fingerprint,
      'chain_snapshot', p_chain_snapshot
    ),
    p_draft_context_fingerprint, p_draft_content_fingerprint, p_actor_user_id
  );

  insert into public.business_taxon_factual_review_events (
    review_id, operation_id, sequence_number, event_kind, payload_json,
    context_fingerprint, content_fingerprint, actor_user_id
  ) values (
    v_review.id, gen_random_uuid(), v_next_sequence + 1, 'draft_linked',
    jsonb_build_object(
      'decision_event_id', v_decision_event_id,
      'draft_revision', p_draft_revision,
      'target_input_catalog_version', p_target_input_catalog_version
    ),
    p_draft_context_fingerprint, p_draft_content_fingerprint, p_actor_user_id
  );

  update public.business_taxon_factual_reviews
  set status = 'awaiting_catalog_publication',
      target_input_catalog_version = p_target_input_catalog_version,
      draft_revision = p_draft_revision,
      draft_content_fingerprint = p_draft_content_fingerprint,
      draft_context_fingerprint = p_draft_context_fingerprint,
      revision = revision + 1
  where id = v_review.id
  returning * into v_review;

  perform set_config('app.factual_review_projection_write', 'on', true);
  update public.landing_page_input_catalog_drafts
  set taxon_review_evidence = jsonb_set(
        taxon_review_evidence,
        array[v_review.taxon_id::text],
        jsonb_build_object(
          'review_id', v_review.id,
          'decision_event_id', v_decision_event_id,
          'draft_revision', p_draft_revision,
          'content_fingerprint', p_draft_content_fingerprint,
          'context_fingerprint', p_draft_context_fingerprint
        ),
        true
      ),
      updated_by = p_actor_user_id
  where singleton;
  perform set_config('app.factual_review_projection_write', 'off', true);

  return query select
    v_review.id, v_review.kind, v_review.status, v_review.revision,
    v_review.baseline_is_active, v_review.baseline_reviewed_input_catalog_version;
end;
$$;

create or replace function public.save_business_taxon_factual_review_draft_v1(
  p_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_revision bigint,
  p_catalog_json jsonb,
  p_content_fingerprint text
)
returns table(draft_revision bigint)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_draft public.landing_page_input_catalog_drafts%rowtype;
  v_review public.business_taxon_factual_reviews%rowtype;
  v_projection jsonb;
  v_next_sequence bigint;
  v_save_receipt jsonb;
begin
  if p_operation_id is null
     or p_actor_user_id is null
     or p_expected_revision is null
     or p_expected_revision <= 0
     or jsonb_typeof(p_catalog_json) <> 'object'
     or p_content_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'factual_review_draft_input_invalid';
  end if;

  select drafts.*
    into v_draft
  from public.landing_page_input_catalog_drafts drafts
  where drafts.singleton
  for update;
  if not found then
    raise exception using errcode = '40001', message = 'factual_review_draft_conflict';
  end if;

  v_save_receipt := v_draft.factual_review_save_receipts -> p_operation_id::text;
  if v_save_receipt is not null then
    if jsonb_typeof(v_save_receipt) <> 'object'
       or not v_save_receipt ?& array[
         'actorUserId', 'expectedRevision', 'resultRevision',
         'catalogIdentity', 'contentFingerprint'
       ]
       or (select count(*) from jsonb_object_keys(v_save_receipt)) <> 5
       or v_save_receipt ->> 'actorUserId' <> p_actor_user_id::text
       or v_save_receipt ->> 'expectedRevision' <> p_expected_revision::text
       or v_save_receipt ->> 'resultRevision' <> (p_expected_revision + 1)::text
       or v_save_receipt ->> 'catalogIdentity' <> md5(p_catalog_json::text)
       or v_save_receipt ->> 'contentFingerprint' <> p_content_fingerprint then
      raise exception using errcode = '22023', message = 'factual_review_operation_reused';
    end if;
    return query select (v_save_receipt ->> 'resultRevision')::bigint;
    return;
  end if;

  if exists (
    select 1
    from public.business_taxon_factual_review_events events
    where events.operation_id = p_operation_id
  ) then
    raise exception using errcode = '22023', message = 'factual_review_operation_reused';
  end if;

  if v_draft.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'factual_review_draft_conflict';
  end if;
  v_projection := v_draft.taxon_review_evidence;

  perform 1
  from public.business_taxon_factual_reviews reviews
  join jsonb_each(v_draft.taxon_review_evidence) evidence
    on reviews.id = (evidence.value ->> 'review_id')::uuid
  order by reviews.id
  for update of reviews;

  if exists (
    select 1
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    left join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    where reviews.id is null
       or reviews.taxon_id::text <> evidence.key
       or reviews.status <> 'awaiting_catalog_publication'
       or reviews.draft_revision <> v_draft.revision
       or reviews.draft_content_fingerprint <> v_draft.content_fingerprint
       or evidence.value ->> 'draft_revision' <> v_draft.revision::text
       or evidence.value ->> 'content_fingerprint' <> v_draft.content_fingerprint
  ) then
    raise exception using errcode = '40001', message = 'factual_review_projection_conflict';
  end if;

  perform set_config('app.factual_review_projection_write', 'on', true);
  update public.landing_page_input_catalog_drafts
  set catalog_json = p_catalog_json,
      content_fingerprint = p_content_fingerprint,
      revision = revision + 1,
      validation_fingerprint = null,
      validation_context_fingerprint = null,
      validated_at = null,
      publication_fingerprint = null,
      publication_context_fingerprint = null,
      publication_prepared_at = null,
      taxon_review_evidence = '{}'::jsonb,
      factual_review_save_receipts = jsonb_set(
        factual_review_save_receipts,
        array[p_operation_id::text],
        jsonb_build_object(
          'actorUserId', p_actor_user_id,
          'expectedRevision', p_expected_revision,
          'resultRevision', p_expected_revision + 1,
          'catalogIdentity', md5(p_catalog_json::text),
          'contentFingerprint', p_content_fingerprint
        ),
        true
      ),
      updated_by = p_actor_user_id
  where singleton
  returning * into v_draft;
  perform set_config('app.factual_review_projection_write', 'off', true);

  for v_review in
    select reviews.*
    from public.business_taxon_factual_reviews reviews
    join jsonb_each(v_projection) evidence
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    order by reviews.id
  loop
    select coalesce(max(events.sequence_number), 0) + 1
      into v_next_sequence
    from public.business_taxon_factual_review_events events
    where events.review_id = v_review.id;
    insert into public.business_taxon_factual_review_events (
      review_id, operation_id, sequence_number, event_kind, payload_json,
      context_fingerprint, content_fingerprint, actor_user_id
    ) values (
      v_review.id, p_operation_id, v_next_sequence, 'draft_invalidated',
      jsonb_build_object(
        'invalidated_draft_revision', p_expected_revision,
        'next_draft_revision', v_draft.revision
      ),
      v_review.draft_context_fingerprint,
      v_review.draft_content_fingerprint,
      p_actor_user_id
    );
    update public.business_taxon_factual_reviews
    set status = 'open',
        target_input_catalog_version = null,
        draft_revision = null,
        draft_content_fingerprint = null,
        draft_context_fingerprint = null,
        revision = revision + 1
    where id = v_review.id;
  end loop;

  return query select v_draft.revision;
end;
$$;

create or replace function public.authorize_business_taxon_factual_review_publication_v1(
  p_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_draft_revision bigint,
  p_draft_content_fingerprint text,
  p_draft_context_fingerprint text,
  p_required_taxon_ids uuid[]
)
returns table(draft_revision bigint)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_draft public.landing_page_input_catalog_drafts%rowtype;
  v_review public.business_taxon_factual_reviews%rowtype;
  v_next_sequence bigint;
  v_required_count integer;
begin
  if p_operation_id is null
     or p_actor_user_id is null
     or p_expected_draft_revision is null
     or p_expected_draft_revision <= 0
     or p_draft_content_fingerprint !~ '^[0-9a-f]{64}$'
     or p_draft_context_fingerprint !~ '^[0-9a-f]{64}$'
     or p_required_taxon_ids is null then
    raise exception using errcode = '22023', message = 'factual_review_publication_authorization_input_invalid';
  end if;
  select count(distinct taxon_id)
    into v_required_count
  from unnest(p_required_taxon_ids) required(taxon_id);
  if v_required_count <> cardinality(p_required_taxon_ids)
     or exists (select 1 from unnest(p_required_taxon_ids) required(taxon_id) where taxon_id is null) then
    raise exception using errcode = '22023', message = 'factual_review_required_taxons_invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('e20_6_factual_review_open_authorize_v1', 0)
  );

  select drafts.*
    into v_draft
  from public.landing_page_input_catalog_drafts drafts
  where drafts.singleton
  for update;
  if not found
     or v_draft.revision <> p_expected_draft_revision
     or v_draft.content_fingerprint <> p_draft_content_fingerprint
     or v_draft.validation_fingerprint <> p_draft_content_fingerprint
     or v_draft.validation_context_fingerprint <> p_draft_context_fingerprint then
    raise exception using errcode = '40001', message = 'factual_review_draft_not_validated';
  end if;

  perform 1
  from public.business_taxons taxons
  where taxons.id = any(p_required_taxon_ids)
     or exists (
       select 1
       from public.business_taxon_factual_reviews reviews
       where reviews.taxon_id = taxons.id
         and reviews.kind = 'release'
         and reviews.status in ('open', 'awaiting_catalog_publication')
     )
  order by taxons.id
  for update of taxons;

  perform 1
  from public.business_taxon_factual_reviews reviews
  where reviews.taxon_id = any(p_required_taxon_ids)
     or (
       reviews.kind = 'release'
       and reviews.status in ('open', 'awaiting_catalog_publication')
     )
  order by reviews.id
  for update of reviews;

  if exists (
    select 1
    from public.business_taxon_factual_reviews reviews
    where reviews.kind = 'release'
      and reviews.status in ('open', 'awaiting_catalog_publication')
      and not (reviews.taxon_id = any(p_required_taxon_ids))
  ) then
    raise exception using errcode = '40001', message = 'factual_review_publication_coverage_incomplete';
  end if;

  if (select count(*) from jsonb_object_keys(v_draft.taxon_review_evidence)) <> v_required_count
     or exists (
       select 1
       from unnest(p_required_taxon_ids) required(taxon_id)
       where not v_draft.taxon_review_evidence ? required.taxon_id::text
     )
     or exists (
       select 1
       from jsonb_each(v_draft.taxon_review_evidence) evidence
       where jsonb_typeof(evidence.value) <> 'object'
          or not evidence.value ?& array[
            'review_id', 'decision_event_id', 'draft_revision',
            'content_fingerprint', 'context_fingerprint'
          ]
          or (select count(*) from jsonb_object_keys(evidence.value)) <> 5
          or evidence.value ->> 'draft_revision' <> p_expected_draft_revision::text
          or evidence.value ->> 'content_fingerprint' <> p_draft_content_fingerprint
     ) then
    raise exception using errcode = '40001', message = 'factual_review_publication_coverage_incomplete';
  end if;

  perform 1
  from public.business_taxon_factual_reviews reviews
  join jsonb_each(v_draft.taxon_review_evidence) evidence
    on reviews.id = (evidence.value ->> 'review_id')::uuid
  order by reviews.id
  for update of reviews;

  if exists (
    select 1
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    left join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    left join public.business_taxon_factual_review_events decision
      on decision.id = (evidence.value ->> 'decision_event_id')::uuid
    where reviews.id is null
       or reviews.taxon_id::text <> evidence.key
       or reviews.status <> 'awaiting_catalog_publication'
       or reviews.draft_revision <> p_expected_draft_revision
       or reviews.draft_content_fingerprint <> p_draft_content_fingerprint
       or reviews.draft_context_fingerprint <> (evidence.value ->> 'context_fingerprint')
       or decision.review_id <> reviews.id
       or decision.event_kind <> 'decision_recorded'
       or decision.decision_kind <> 'catalog_change'
       or decision.content_fingerprint <> p_draft_content_fingerprint
       or decision.context_fingerprint <> (evidence.value ->> 'context_fingerprint')
       or decision.payload_json ->> 'draft_revision' <> p_expected_draft_revision::text
       or decision.payload_json ->> 'target_input_catalog_version'
         <> v_draft.target_version::text
  ) then
    raise exception using errcode = '40001', message = 'factual_review_publication_evidence_invalid';
  end if;

  if v_draft.publication_fingerprint is not null then
    if v_draft.publication_fingerprint <> p_draft_content_fingerprint
       or v_draft.publication_context_fingerprint <> p_draft_context_fingerprint
       or exists (
         select 1
         from jsonb_each(v_draft.taxon_review_evidence) evidence
         join public.business_taxon_factual_reviews reviews
           on reviews.id = (evidence.value ->> 'review_id')::uuid
         where not exists (
           select 1
           from public.business_taxon_factual_review_events events
           where events.review_id = reviews.id
             and events.operation_id = p_operation_id
             and events.event_kind = 'publication_authorized'
             and events.decision_kind = 'catalog_change'
             and events.actor_user_id = p_actor_user_id
             and events.context_fingerprint = reviews.draft_context_fingerprint
             and events.content_fingerprint = p_draft_content_fingerprint
             and events.payload_json ->> 'draft_revision'
               = p_expected_draft_revision::text
             and events.payload_json ->> 'target_input_catalog_version'
               = v_draft.target_version::text
             and events.payload_json ->> 'publication_context_fingerprint'
               = p_draft_context_fingerprint
         )
       ) then
      raise exception using errcode = '40001', message = 'factual_review_publication_already_authorized';
    end if;
    return query select v_draft.revision;
    return;
  end if;

  if exists (
    select 1
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    join public.business_taxon_factual_review_events events
      on events.review_id = reviews.id
    where events.event_kind = 'publication_authorized'
  ) then
    raise exception using errcode = '40001', message = 'factual_review_publication_already_authorized';
  end if;

  for v_review in
    select reviews.*
    from public.business_taxon_factual_reviews reviews
    join jsonb_each(v_draft.taxon_review_evidence) evidence
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    order by reviews.id
  loop
    select coalesce(max(events.sequence_number), 0) + 1
      into v_next_sequence
    from public.business_taxon_factual_review_events events
    where events.review_id = v_review.id;
    insert into public.business_taxon_factual_review_events (
      review_id, operation_id, sequence_number, event_kind, decision_kind,
      payload_json, context_fingerprint, content_fingerprint, actor_user_id
    ) values (
      v_review.id, p_operation_id, v_next_sequence, 'publication_authorized',
      'catalog_change',
      jsonb_build_object(
        'draft_revision', p_expected_draft_revision,
        'target_input_catalog_version', v_draft.target_version,
        'publication_context_fingerprint', p_draft_context_fingerprint
      ),
      v_review.draft_context_fingerprint,
      p_draft_content_fingerprint,
      p_actor_user_id
    );
  end loop;

  update public.landing_page_input_catalog_drafts
  set publication_fingerprint = p_draft_content_fingerprint,
      publication_context_fingerprint = p_draft_context_fingerprint,
      publication_prepared_at = now(),
      updated_by = p_actor_user_id
  where singleton
  returning * into v_draft;

  return query select v_draft.revision;
end;
$$;

create or replace function public.reconcile_business_taxon_factual_review_publication_v1(
  p_operation_id uuid,
  p_actor_user_id uuid,
  p_expected_draft_revision bigint,
  p_deployed_version integer,
  p_deployed_content_fingerprint text,
  p_publication_context_fingerprint text
)
returns table(reconciled_taxon_count integer)
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_draft public.landing_page_input_catalog_drafts%rowtype;
  v_review public.business_taxon_factual_reviews%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_next_sequence bigint;
  v_count integer := 0;
  v_existing_count integer;
begin
  if p_operation_id is null
     or p_actor_user_id is null
     or p_expected_draft_revision is null
     or p_expected_draft_revision <= 0
     or p_deployed_version is null
     or p_deployed_version <= 0
     or p_deployed_content_fingerprint !~ '^[0-9a-f]{64}$'
     or p_publication_context_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'factual_review_reconciliation_input_invalid';
  end if;

  select count(*)
    into v_existing_count
  from public.business_taxon_factual_review_events events
  where events.operation_id = p_operation_id
    and events.event_kind = 'reconciled_published';
  if v_existing_count > 0 then
    if exists (
      select 1
      from public.business_taxon_factual_review_events events
      where events.operation_id = p_operation_id
        and (
          events.event_kind <> 'reconciled_published'
          or events.actor_user_id <> p_actor_user_id
          or events.content_fingerprint <> p_deployed_content_fingerprint
          or events.payload_json ->> 'deployed_version' <> p_deployed_version::text
          or events.payload_json ->> 'draft_revision' <> p_expected_draft_revision::text
          or events.payload_json ->> 'publication_context_fingerprint'
            <> p_publication_context_fingerprint
        )
    ) then
      raise exception using errcode = '22023', message = 'factual_review_operation_reused';
    end if;
    return query select v_existing_count;
    return;
  end if;

  select drafts.*
    into v_draft
  from public.landing_page_input_catalog_drafts drafts
  where drafts.singleton
  for update;
  if not found
     or v_draft.revision <> p_expected_draft_revision
     or v_draft.target_version <> p_deployed_version
     or v_draft.content_fingerprint <> p_deployed_content_fingerprint
     or v_draft.validation_fingerprint <> p_deployed_content_fingerprint
     or v_draft.publication_fingerprint <> p_deployed_content_fingerprint
     or v_draft.validation_context_fingerprint <> p_publication_context_fingerprint
     or v_draft.publication_context_fingerprint <> p_publication_context_fingerprint then
    raise exception using errcode = '40001', message = 'factual_review_deployed_publication_conflict';
  end if;

  perform 1
  from public.business_taxons taxons
  where taxons.id in (
    select (snapshot.value ->> 'id')::uuid
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    cross join lateral jsonb_array_elements(reviews.chain_snapshot) snapshot(value)
  )
  order by taxons.id
  for update;

  perform 1
  from public.business_taxon_factual_reviews reviews
  join jsonb_each(v_draft.taxon_review_evidence) evidence
    on reviews.id = (evidence.value ->> 'review_id')::uuid
  order by reviews.id
  for update of reviews;

  if exists (
    select 1
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    left join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    left join public.business_taxon_factual_review_events decision
      on decision.id = (evidence.value ->> 'decision_event_id')::uuid
    where reviews.id is null
       or reviews.taxon_id::text <> evidence.key
       or reviews.status <> 'awaiting_catalog_publication'
       or reviews.target_input_catalog_version <> p_deployed_version
       or reviews.draft_revision <> p_expected_draft_revision
       or reviews.draft_content_fingerprint <> p_deployed_content_fingerprint
       or reviews.draft_context_fingerprint <> (evidence.value ->> 'context_fingerprint')
       or decision.review_id <> reviews.id
       or decision.event_kind <> 'decision_recorded'
       or decision.decision_kind <> 'catalog_change'
       or decision.content_fingerprint <> p_deployed_content_fingerprint
       or decision.context_fingerprint <> (evidence.value ->> 'context_fingerprint')
       or decision.payload_json ->> 'draft_revision' <> p_expected_draft_revision::text
       or not exists (
         select 1
         from public.business_taxon_factual_review_events authorization
         where authorization.review_id = reviews.id
           and authorization.event_kind = 'publication_authorized'
           and authorization.decision_kind = 'catalog_change'
           and authorization.context_fingerprint = reviews.draft_context_fingerprint
           and authorization.content_fingerprint = p_deployed_content_fingerprint
           and authorization.payload_json ->> 'draft_revision'
             = p_expected_draft_revision::text
           and authorization.payload_json ->> 'publication_context_fingerprint'
             = p_publication_context_fingerprint
       )
  ) then
    raise exception using errcode = '40001', message = 'factual_review_reconciliation_evidence_invalid';
  end if;

  if exists (
    select 1
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    cross join lateral jsonb_array_elements(reviews.chain_snapshot) snapshot(value)
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
    raise exception using errcode = '40001', message = 'factual_review_reconciliation_taxon_conflict';
  end if;

  for v_review in
    select reviews.*
    from public.business_taxon_factual_reviews reviews
    join jsonb_each(v_draft.taxon_review_evidence) evidence
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    order by reviews.id
  loop
    select taxons.*
      into v_taxon
    from public.business_taxons taxons
    where taxons.id = v_review.taxon_id;
    if not found
       or v_taxon.is_active is distinct from v_review.baseline_is_active
       or v_taxon.reviewed_input_catalog_version
         is distinct from v_review.baseline_reviewed_input_catalog_version then
      raise exception using errcode = '40001', message = 'factual_review_reconciliation_baseline_conflict';
    end if;

    update public.business_taxons
    set reviewed_input_catalog_version = p_deployed_version,
        is_active = case when v_review.kind = 'release' then true else is_active end
    where id = v_review.taxon_id;

    select coalesce(max(events.sequence_number), 0) + 1
      into v_next_sequence
    from public.business_taxon_factual_review_events events
    where events.review_id = v_review.id;
    insert into public.business_taxon_factual_review_events (
      review_id, operation_id, sequence_number, event_kind, payload_json,
      context_fingerprint, content_fingerprint, actor_user_id
    ) values (
      v_review.id, p_operation_id, v_next_sequence, 'reconciled_published',
      jsonb_build_object(
        'draft_revision', p_expected_draft_revision,
        'deployed_version', p_deployed_version,
        'publication_context_fingerprint', p_publication_context_fingerprint
      ),
      v_review.draft_context_fingerprint,
      p_deployed_content_fingerprint,
      p_actor_user_id
    );

    update public.business_taxon_factual_reviews
    set status = 'closed_published',
        revision = revision + 1,
        closed_by = p_actor_user_id,
        closed_at = now()
    where id = v_review.id;
    v_count := v_count + 1;
  end loop;

  delete from public.landing_page_input_catalog_drafts
  where singleton
    and revision = p_expected_draft_revision
    and content_fingerprint = p_deployed_content_fingerprint;
  if not found then
    raise exception using errcode = '40001', message = 'factual_review_reconciliation_draft_conflict';
  end if;

  return query select v_count;
end;
$$;

revoke all on function public.reject_business_taxon_factual_review_event_mutation_v1()
  from public, anon, authenticated;
revoke all on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer)
  from public, anon, authenticated;
revoke all on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.guard_landing_page_input_catalog_draft_factual_projection_v1()
  from public, anon, authenticated;
revoke all on function public.append_business_taxon_factual_review_evaluation_event_v1(uuid, uuid, uuid, bigint, text, text, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.record_business_taxon_factual_catalog_change_decision_v1(uuid, uuid, uuid, bigint, text, jsonb, bigint, integer, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.save_business_taxon_factual_review_draft_v1(uuid, uuid, bigint, jsonb, text)
  from public, anon, authenticated;
revoke all on function public.authorize_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, text, text, uuid[])
  from public, anon, authenticated;
revoke all on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, integer, text, text)
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on function public.reject_business_taxon_factual_review_event_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer) from ai_readonly';
    execute 'revoke all on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb, jsonb) from ai_readonly';
    execute 'revoke all on function public.guard_landing_page_input_catalog_draft_factual_projection_v1() from ai_readonly';
    execute 'revoke all on function public.append_business_taxon_factual_review_evaluation_event_v1(uuid, uuid, uuid, bigint, text, text, text, text, jsonb) from ai_readonly';
    execute 'revoke all on function public.record_business_taxon_factual_catalog_change_decision_v1(uuid, uuid, uuid, bigint, text, jsonb, bigint, integer, text, text, jsonb) from ai_readonly';
    execute 'revoke all on function public.save_business_taxon_factual_review_draft_v1(uuid, uuid, bigint, jsonb, text) from ai_readonly';
    execute 'revoke all on function public.authorize_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, text, text, uuid[]) from ai_readonly';
    execute 'revoke all on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, integer, text, text) from ai_readonly';
  end if;
end;
$$;

grant execute on function public.reject_business_taxon_factual_review_event_mutation_v1()
  to service_role;
grant execute on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer)
  to service_role;
grant execute on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb, jsonb)
  to service_role;
grant execute on function public.append_business_taxon_factual_review_evaluation_event_v1(uuid, uuid, uuid, bigint, text, text, text, text, jsonb)
  to service_role;
grant execute on function public.record_business_taxon_factual_catalog_change_decision_v1(uuid, uuid, uuid, bigint, text, jsonb, bigint, integer, text, text, jsonb)
  to service_role;
grant execute on function public.save_business_taxon_factual_review_draft_v1(uuid, uuid, bigint, jsonb, text)
  to service_role;
grant execute on function public.authorize_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, text, text, uuid[])
  to service_role;
grant execute on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, integer, text, text)
  to service_role;

comment on table public.business_taxon_factual_reviews is
  'E20.6.3: autoridade service-only do estado de liberacao e revisao factual por taxon.';
comment on table public.business_taxon_factual_review_events is
  'E20.6.3: trilha factual append-only; payloads nao armazenam prompt, pesquisa integral, conteudo web, secrets, conta ou PII.';
comment on function public.open_business_taxon_factual_review_v1(uuid, text, jsonb, uuid, uuid, boolean, integer) is
  'E20.6.3: abre idempotentemente release ou revision sem alterar disponibilidade ou ultima versao valida.';
comment on function public.close_business_taxon_factual_review_without_change_v1(uuid, uuid, uuid, bigint, integer, text, text, jsonb, jsonb) is
  'E20.6.3: confirma cobertura herdada e, atomicamente, ativa apenas uma release ou preserva uma revision ativa.';
comment on function public.append_business_taxon_factual_review_evaluation_event_v1(uuid, uuid, uuid, bigint, text, text, text, text, jsonb) is
  'E20.6.5: anexa evento idempotente de avaliacao a sessao aberta exata sem mutar sessao ou taxon.';
comment on function public.record_business_taxon_factual_catalog_change_decision_v1(uuid, uuid, uuid, bigint, text, jsonb, bigint, integer, text, text, jsonb) is
  'E20.6.4: persiste decisao humana autoritativa e sua projecao para o draft exato, sem criar ou alterar fields.';
comment on function public.save_business_taxon_factual_review_draft_v1(uuid, uuid, bigint, jsonb, text) is
  'E20.6.4: salva edicao validada do draft e invalida globalmente todas as decisoes e sessoes vinculadas.';
comment on function public.authorize_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, text, text, uuid[]) is
  'E20.6.4: autoriza uma unica publicacao somente quando todas as decisoes requeridas cobrem o draft exato.';
comment on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, uuid, bigint, integer, text, text) is
  'E20.6.4: reconcilia atomicamente a publicacao implantada, todos os taxons e todas as sessoes cobertas.';

commit;
