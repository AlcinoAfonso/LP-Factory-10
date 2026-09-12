begin;

alter table public.business_taxons alter column is_active set default false;

create table public.business_taxon_factual_reviews (
  id uuid primary key default gen_random_uuid(),
  taxon_id uuid not null references public.business_taxons(id) on update cascade on delete restrict,
  kind text not null check (kind in ('release', 'revision')),
  status text not null default 'open' check (status in ('open', 'closed')),
  outcome text check (outcome in ('no_change', 'catalog_change', 'invalidated')),
  baseline_is_active boolean not null,
  baseline_selected_end_customer_research_version integer check (
    baseline_selected_end_customer_research_version is null
    or baseline_selected_end_customer_research_version > 0
  ),
  baseline_reviewed_input_catalog_version integer check (baseline_reviewed_input_catalog_version is null or baseline_reviewed_input_catalog_version > 0),
  context_fingerprint text not null check (context_fingerprint ~ '^[0-9a-f]{64}$'),
  chain_snapshot jsonb not null check (jsonb_typeof(chain_snapshot) = 'array' and jsonb_array_length(chain_snapshot) between 1 and 3),
  evaluation_mode text check (evaluation_mode in ('systematic', 'hypothesis')),
  evaluation_source text check (evaluation_source in ('published', 'draft')),
  evaluation_input_catalog_version integer check (evaluation_input_catalog_version is null or evaluation_input_catalog_version > 0),
  evaluation_draft_revision bigint check (evaluation_draft_revision is null or evaluation_draft_revision > 0),
  evaluation_context_fingerprint text check (evaluation_context_fingerprint is null or evaluation_context_fingerprint ~ '^[0-9a-f]{64}$'),
  evaluation_output jsonb,
  evaluation_by uuid references auth.users(id) on update cascade on delete restrict,
  evaluated_at timestamptz,
  decision_payload jsonb,
  revision bigint not null default 1 check (revision > 0),
  opened_by uuid not null references auth.users(id) on update cascade on delete restrict,
  closed_by uuid references auth.users(id) on update cascade on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_taxon_factual_reviews_kind_baseline_chk check (
    (kind = 'release' and not baseline_is_active) or (kind = 'revision' and baseline_is_active)
  ),
  constraint business_taxon_factual_reviews_evaluation_chk check (
    (
      evaluation_mode is null and evaluation_source is null
      and evaluation_input_catalog_version is null and evaluation_draft_revision is null
      and evaluation_context_fingerprint is null and evaluation_output is null
      and evaluation_by is null and evaluated_at is null
    ) or (
      evaluation_mode is not null and evaluation_source is not null
      and evaluation_input_catalog_version is not null
      and (evaluation_source = 'draft') = (evaluation_draft_revision is not null)
      and evaluation_context_fingerprint is not null
      and evaluation_output is not null and jsonb_typeof(evaluation_output) = 'object'
      and evaluation_by is not null and evaluated_at is not null
    )
  ),
  constraint business_taxon_factual_reviews_closure_chk check (
    (
      status = 'open' and outcome is null and decision_payload is null
      and closed_by is null and closed_at is null
    ) or (
      status = 'closed' and outcome is not null and closed_by is not null and closed_at is not null
      and ((outcome = 'invalidated' and decision_payload is null)
        or (outcome <> 'invalidated' and decision_payload is not null
          and jsonb_typeof(decision_payload) = 'object'))
    )
  )
);

create unique index business_taxon_factual_reviews_one_open_per_taxon_idx
  on public.business_taxon_factual_reviews (taxon_id) where status = 'open';
create index business_taxon_factual_reviews_taxon_history_idx
  on public.business_taxon_factual_reviews (taxon_id, opened_at desc, id desc);

alter table public.business_taxon_factual_reviews enable row level security;
revoke all on table public.business_taxon_factual_reviews from public, anon, authenticated;
do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.business_taxon_factual_reviews from ai_readonly';
  end if;
end;
$$;
grant select, insert, update on table public.business_taxon_factual_reviews to service_role;

create trigger business_taxon_factual_reviews_set_updated_at
before update on public.business_taxon_factual_reviews
for each row execute function public.tg_set_updated_at();

create or replace function public.guard_business_taxon_factual_research_selection_v1()
returns trigger language plpgsql security invoker set search_path = public, pg_catalog as $$
begin
  if old.selected_end_customer_research_version is distinct from new.selected_end_customer_research_version then
    perform pg_advisory_xact_lock(hashtextextended('lpf10:e20.6:factual-review', 0));
  end if;
  return new;
end;
$$;

create trigger business_taxons_factual_research_selection_guard
before update of selected_end_customer_research_version on public.business_taxons
for each row execute function public.guard_business_taxon_factual_research_selection_v1();

create or replace function public.guard_open_business_taxon_factual_review_v1()
returns trigger language plpgsql security invoker set search_path = public, pg_catalog as $$
declare
  v_actual_chain jsonb;
  v_selected public.business_taxons%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('lpf10:e20.6:factual-review', 0));

  select * into v_selected
  from public.business_taxons
  where id = new.taxon_id
  for update;
  if not found then
    raise exception using errcode = '40001', message = 'factual_review_taxon_conflict';
  end if;

  perform 1
  from public.business_taxons taxons
  where taxons.id in (
    with recursive ancestor_ids as (
      select id, parent_id, 0 as depth
      from public.business_taxons
      where id = new.taxon_id
      union all
      select parent.id, parent.parent_id, child.depth + 1
      from public.business_taxons parent
      join ancestor_ids child on child.parent_id = parent.id
      where child.depth < 2
    )
    select id from ancestor_ids
  )
  order by taxons.id
  for update;

  with recursive ancestors as (
    select taxons.id, taxons.parent_id, taxons.level, taxons.name, taxons.slug,
           taxons.is_active, 0 as depth
    from public.business_taxons taxons
    where taxons.id = new.taxon_id
    union all
    select parent.id, parent.parent_id, parent.level, parent.name, parent.slug,
           parent.is_active, child.depth + 1
    from public.business_taxons parent
    join ancestors child on child.parent_id = parent.id
    where child.depth < 2
  )
  select jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'slug', slug,
      'level', level,
      'isActive', is_active,
      'parentId', parent_id
    ) order by depth desc
  ) into v_actual_chain
  from ancestors;

  if v_actual_chain is null
     or jsonb_array_length(v_actual_chain) not between 1 and 3
     or v_actual_chain is distinct from new.chain_snapshot
     or v_selected.is_active is distinct from new.baseline_is_active
     or v_selected.selected_end_customer_research_version is distinct from new.baseline_selected_end_customer_research_version
     or v_selected.reviewed_input_catalog_version is distinct from new.baseline_reviewed_input_catalog_version then
    raise exception using errcode = '40001', message = 'factual_review_context_conflict';
  end if;
  return new;
end;
$$;

create trigger business_taxon_factual_reviews_open_guard
before insert on public.business_taxon_factual_reviews
for each row execute function public.guard_open_business_taxon_factual_review_v1();

create or replace function public.guard_closed_business_taxon_factual_review_v1()
returns trigger language plpgsql security invoker set search_path = public, pg_catalog as $$
begin
  if tg_op = 'DELETE' or old.status = 'closed' then
    raise exception using errcode = '42501', message = 'closed_factual_review_is_immutable';
  end if;
  return new;
end;
$$;

create trigger business_taxon_factual_reviews_closed_immutable
before update or delete on public.business_taxon_factual_reviews
for each row execute function public.guard_closed_business_taxon_factual_review_v1();

create or replace function public.finalize_business_taxon_factual_review_v1(
  p_review_id uuid,
  p_expected_revision bigint,
  p_actor_user_id uuid,
  p_reviewed_version integer,
  p_decision_payload jsonb,
  p_expected_draft_revision bigint,
  p_expected_draft_content_fingerprint text,
  p_expected_draft_context_fingerprint text
)
returns table(review_id uuid, review_status text, review_revision bigint, reviewed_version integer, decision_kind text)
language plpgsql security invoker set search_path = public, pg_catalog as $$
declare
  v_review public.business_taxon_factual_reviews%rowtype;
  v_taxon public.business_taxons%rowtype;
  v_draft public.landing_page_input_catalog_drafts%rowtype;
  v_decision_kind text;
  v_candidate_count integer;
  v_actual_chain jsonb;
begin
  if p_review_id is null or p_actor_user_id is null or p_expected_revision is null
     or p_expected_revision <= 0 or p_reviewed_version is null or p_reviewed_version <= 0
     or jsonb_typeof(p_decision_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'factual_review_decision_input_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('lpf10:e20.6:factual-review', 0));

  select * into v_review from public.business_taxon_factual_reviews
  where id = p_review_id for update;
  if not found or v_review.status <> 'open' or v_review.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'factual_review_decision_conflict';
  end if;

  select * into v_taxon
  from public.business_taxons
  where id = v_review.taxon_id
  for update;
  perform 1
  from public.business_taxons taxons
  where taxons.id in (
    with recursive ancestor_ids as (
      select id, parent_id, 0 as depth
      from public.business_taxons
      where id = v_review.taxon_id
      union all
      select parent.id, parent.parent_id, child.depth + 1
      from public.business_taxons parent
      join ancestor_ids child on child.parent_id = parent.id
      where child.depth < 2
    )
    select id from ancestor_ids
  )
  order by taxons.id
  for update;
  with recursive ancestors as (
    select taxons.id, taxons.parent_id, taxons.level, taxons.name, taxons.slug,
           taxons.is_active, 0 as depth
    from public.business_taxons taxons
    where taxons.id = v_review.taxon_id
    union all
    select parent.id, parent.parent_id, parent.level, parent.name, parent.slug,
           parent.is_active, child.depth + 1
    from public.business_taxons parent
    join ancestors child on child.parent_id = parent.id
    where child.depth < 2
  )
  select jsonb_agg(
    jsonb_build_object(
      'id', id, 'name', name, 'slug', slug, 'level', level,
      'isActive', is_active, 'parentId', parent_id
    ) order by depth desc
  ) into v_actual_chain
  from ancestors;
  if v_taxon.id is null
     or v_actual_chain is null
     or jsonb_array_length(v_actual_chain) not between 1 and 3
     or v_actual_chain is distinct from v_review.chain_snapshot
     or v_taxon.is_active is distinct from v_review.baseline_is_active
     or v_taxon.selected_end_customer_research_version is distinct from v_review.baseline_selected_end_customer_research_version
     or v_taxon.reviewed_input_catalog_version is distinct from v_review.baseline_reviewed_input_catalog_version then
    raise exception using errcode = '40001', message = 'factual_review_context_conflict';
  end if;

  v_decision_kind := p_decision_payload ->> 'decisionKind';
  v_candidate_count := jsonb_array_length(coalesce(v_review.evaluation_output -> 'candidates', '[]'::jsonb));
  if v_decision_kind not in ('no_change', 'catalog_change')
     or v_review.evaluation_output ->> 'status' = 'inconclusive'
     or jsonb_typeof(p_decision_payload -> 'recommendationCandidateCount') is distinct from 'number'
     or (p_decision_payload ->> 'recommendationCandidateCount')::integer <> v_candidate_count then
    raise exception using errcode = '22023', message = 'factual_review_decision_invalid';
  end if;

  if p_expected_draft_revision is null then
    if v_decision_kind <> 'no_change'
       or (v_review.evaluation_source is not null and v_review.evaluation_source <> 'published')
       or (v_review.evaluation_input_catalog_version is not null
           and v_review.evaluation_input_catalog_version <> p_reviewed_version) then
      raise exception using errcode = '22023', message = 'factual_review_published_decision_invalid';
    end if;
    update public.business_taxons
    set reviewed_input_catalog_version = p_reviewed_version,
        is_active = case when v_review.kind = 'release' then true else is_active end
    where id = v_review.taxon_id;
  else
    if v_review.evaluation_source <> 'draft' or v_review.evaluation_draft_revision <> p_expected_draft_revision
       or v_review.evaluation_input_catalog_version <> p_reviewed_version
       or v_review.evaluation_context_fingerprint <> p_expected_draft_context_fingerprint
       or p_expected_draft_content_fingerprint !~ '^[0-9a-f]{64}$'
       or p_expected_draft_context_fingerprint !~ '^[0-9a-f]{64}$' then
      raise exception using errcode = '22023', message = 'factual_review_draft_decision_invalid';
    end if;
    select * into v_draft from public.landing_page_input_catalog_drafts where singleton = true for update;
    if not found or v_draft.revision <> p_expected_draft_revision
       or v_draft.content_fingerprint <> p_expected_draft_content_fingerprint then
      raise exception using errcode = '40001', message = 'factual_review_draft_conflict';
    end if;
  end if;

  update public.business_taxon_factual_reviews
  set status = 'closed', outcome = v_decision_kind, decision_payload = p_decision_payload,
      revision = revision + 1, closed_by = p_actor_user_id, closed_at = now()
  where id = v_review.id and status = 'open' and revision = p_expected_revision
  returning revision into review_revision;
  if not found then
    raise exception using errcode = '40001', message = 'factual_review_decision_conflict';
  end if;

  if p_expected_draft_revision is not null then
    update public.landing_page_input_catalog_drafts
    set taxon_review_evidence = jsonb_set(
          taxon_review_evidence, array[v_review.taxon_id::text],
          jsonb_build_object(
            'review_id', v_review.id, 'review_revision', review_revision,
            'draft_revision', v_draft.revision, 'content_fingerprint', v_draft.content_fingerprint,
            'context_fingerprint', p_expected_draft_context_fingerprint
          ), true
        ), updated_by = p_actor_user_id
    where singleton = true and revision = v_draft.revision
      and content_fingerprint = v_draft.content_fingerprint;
    if not found then
      raise exception using errcode = '40001', message = 'factual_review_draft_conflict';
    end if;
  end if;

  review_id := v_review.id;
  review_status := 'closed';
  reviewed_version := p_reviewed_version;
  decision_kind := v_decision_kind;
  return next;
end;
$$;

create or replace function public.update_business_taxon_with_factual_review_invalidation_v1(
  p_taxon_id uuid, p_expected_name text, p_expected_slug text, p_expected_is_active boolean,
  p_name text, p_slug text, p_next_is_active boolean, p_actor_user_id uuid
)
returns table(taxon_id uuid, invalidated_review_count integer, cleared_marker_count integer)
language plpgsql security invoker set search_path = public, pg_catalog as $$
declare v_root public.business_taxons%rowtype;
begin
  if p_taxon_id is null or p_actor_user_id is null
     or p_expected_name is null or p_expected_slug is null or p_expected_is_active is null
     or nullif(btrim(p_name), '') is null or nullif(btrim(p_slug), '') is null
     or p_next_is_active is null then
    raise exception using errcode = '22023', message = 'taxon_factual_invalidation_input_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('lpf10:e20.6:factual-review', 0));
  select * into v_root from public.business_taxons where id = p_taxon_id for update;
  if not found or v_root.name <> p_expected_name or v_root.slug <> p_expected_slug
     or v_root.is_active <> p_expected_is_active then
    raise exception using errcode = '40001', message = 'taxon_factual_invalidation_conflict';
  end if;

  with recursive affected as (
    select id from public.business_taxons where id = p_taxon_id
    union all select child.id from public.business_taxons child join affected parent on child.parent_id = parent.id
  ), invalidated as (
    update public.business_taxon_factual_reviews reviews
    set status = 'closed', outcome = 'invalidated', revision = revision + 1,
        closed_by = p_actor_user_id, closed_at = now()
    where reviews.status = 'open' and reviews.taxon_id in (select id from affected)
    returning 1
  ) select count(*)::integer into invalidated_review_count from invalidated;

  with recursive affected as (
    select id from public.business_taxons where id = p_taxon_id
    union all select child.id from public.business_taxons child join affected parent on child.parent_id = parent.id
  ), cleared as (
    update public.business_taxons taxons set reviewed_input_catalog_version = null
    where taxons.id in (select id from affected) and taxons.reviewed_input_catalog_version is not null
    returning 1
  ) select count(*)::integer into cleared_marker_count from cleared;

  update public.business_taxons set name = p_name, slug = p_slug, is_active = p_next_is_active
  where id = p_taxon_id;
  taxon_id := p_taxon_id;
  return next;
end;
$$;

create or replace function public.reconcile_business_taxon_factual_review_publication_v1(
  p_actor_user_id uuid, p_expected_draft_revision bigint, p_deployed_version integer,
  p_deployed_content_fingerprint text, p_publication_context_fingerprint text
)
returns table(reconciled_taxon_count integer)
language plpgsql security invoker set search_path = public, pg_catalog as $$
declare
  v_draft public.landing_page_input_catalog_drafts%rowtype;
  v_evidence record;
  v_selected public.business_taxons%rowtype;
  v_actual_chain jsonb;
begin
  if p_actor_user_id is null or p_expected_draft_revision is null or p_expected_draft_revision <= 0
     or p_deployed_version is null or p_deployed_version <= 0 then
    raise exception using errcode = '22023', message = 'factual_review_reconciliation_input_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('lpf10:e20.6:factual-review', 0));
  select * into v_draft from public.landing_page_input_catalog_drafts where singleton = true for update;
  if not found or v_draft.revision <> p_expected_draft_revision
     or v_draft.target_version <> p_deployed_version
     or v_draft.content_fingerprint <> p_deployed_content_fingerprint
     or v_draft.publication_fingerprint <> p_deployed_content_fingerprint
     or v_draft.publication_context_fingerprint <> p_publication_context_fingerprint then
    raise exception using errcode = '40001', message = 'factual_review_reconciliation_conflict';
  end if;

  if exists (
    select 1 from jsonb_each(v_draft.taxon_review_evidence) evidence
    left join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
    where reviews.id is null or reviews.taxon_id::text <> evidence.key
       or reviews.status <> 'closed' or reviews.outcome not in ('no_change', 'catalog_change')
       or reviews.evaluation_source <> 'draft'
       or reviews.evaluation_input_catalog_version <> v_draft.target_version
       or reviews.evaluation_draft_revision <> v_draft.revision
       or reviews.evaluation_context_fingerprint <> (evidence.value ->> 'context_fingerprint')
       or reviews.revision <> (evidence.value ->> 'review_revision')::bigint
       or (evidence.value ->> 'draft_revision')::bigint <> v_draft.revision
       or evidence.value ->> 'content_fingerprint' <> v_draft.content_fingerprint
  ) then
    raise exception using errcode = '40001', message = 'factual_review_reconciliation_evidence_invalid';
  end if;

  for v_evidence in
    select evidence.key::uuid as taxon_id,
           reviews.baseline_is_active,
           reviews.baseline_selected_end_customer_research_version,
           reviews.baseline_reviewed_input_catalog_version,
           reviews.chain_snapshot
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    join public.business_taxon_factual_reviews reviews
      on reviews.id = (evidence.value ->> 'review_id')::uuid
  loop
    v_selected := null;
    select * into v_selected
    from public.business_taxons
    where id = v_evidence.taxon_id
    for update;

    perform 1
    from public.business_taxons taxons
    where taxons.id in (
      with recursive ancestor_ids as (
        select id, parent_id, 0 as depth
        from public.business_taxons
        where id = v_evidence.taxon_id
        union all
        select parent.id, parent.parent_id, child.depth + 1
        from public.business_taxons parent
        join ancestor_ids child on child.parent_id = parent.id
        where child.depth < 2
      )
      select id from ancestor_ids
    )
    order by taxons.id
    for update;

    with recursive ancestors as (
      select taxons.id, taxons.parent_id, taxons.level, taxons.name, taxons.slug,
             taxons.is_active, 0 as depth
      from public.business_taxons taxons
      where taxons.id = v_evidence.taxon_id
      union all
      select parent.id, parent.parent_id, parent.level, parent.name, parent.slug,
             parent.is_active, child.depth + 1
      from public.business_taxons parent
      join ancestors child on child.parent_id = parent.id
      where child.depth < 2
    )
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'level', level,
        'isActive', is_active,
        'parentId', parent_id
      ) order by depth desc
    ) into v_actual_chain
    from ancestors;

    if v_selected.id is null
       or v_actual_chain is null
       or jsonb_array_length(v_actual_chain) not between 1 and 3
       or v_actual_chain is distinct from v_evidence.chain_snapshot
       or v_selected.is_active is distinct from v_evidence.baseline_is_active
       or v_selected.selected_end_customer_research_version is distinct from v_evidence.baseline_selected_end_customer_research_version
       or v_selected.reviewed_input_catalog_version is distinct from v_evidence.baseline_reviewed_input_catalog_version then
      raise exception using errcode = '40001', message = 'factual_review_reconciliation_context_conflict';
    end if;
  end loop;

  with evidence as (
    select evidence.key::uuid as taxon_id, reviews.kind
    from jsonb_each(v_draft.taxon_review_evidence) evidence
    join public.business_taxon_factual_reviews reviews on reviews.id = (evidence.value ->> 'review_id')::uuid
  ), reconciled as (
    update public.business_taxons taxons
    set reviewed_input_catalog_version = p_deployed_version,
        is_active = case when evidence.kind = 'release' then true else taxons.is_active end
    from evidence where taxons.id = evidence.taxon_id returning 1
  ) select count(*)::integer into reconciled_taxon_count from reconciled;

  delete from public.landing_page_input_catalog_drafts
  where singleton = true and revision = v_draft.revision;
  if not found then
    raise exception using errcode = '40001', message = 'factual_review_reconciliation_conflict';
  end if;
  return next;
end;
$$;

revoke all on function public.guard_closed_business_taxon_factual_review_v1() from public, anon, authenticated;
revoke all on function public.guard_open_business_taxon_factual_review_v1() from public, anon, authenticated;
revoke all on function public.guard_business_taxon_factual_research_selection_v1() from public, anon, authenticated;
revoke all on function public.finalize_business_taxon_factual_review_v1(uuid, bigint, uuid, integer, jsonb, bigint, text, text) from public, anon, authenticated;
revoke all on function public.update_business_taxon_with_factual_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, uuid) from public, anon, authenticated;
revoke all on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, bigint, integer, text, text) from public, anon, authenticated;
grant execute on function public.finalize_business_taxon_factual_review_v1(uuid, bigint, uuid, integer, jsonb, bigint, text, text) to service_role;
grant execute on function public.update_business_taxon_with_factual_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, uuid) to service_role;
grant execute on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, bigint, integer, text, text) to service_role;

comment on table public.business_taxon_factual_reviews is
  'E20.6: residencia factual unica por revisao, com baseline, ultima recomendacao e decisao humana final imutavel.';
comment on function public.guard_open_business_taxon_factual_review_v1() is
  'Serializa abertura com mutacoes taxonomicas e revalida o snapshot integral antes do insert.';
comment on function public.finalize_business_taxon_factual_review_v1(uuid, bigint, uuid, integer, jsonb, bigint, text, text) is
  'Fecha uma revisao e aplica atomicamente a decisao ao taxon publicado ou a evidencia do draft exato.';
comment on function public.update_business_taxon_with_factual_review_invalidation_v1(uuid, text, text, boolean, text, text, boolean, uuid) is
  'Atualiza identidade ou atividade e fecha revisoes abertas afetadas sem ledger paralelo.';
comment on function public.reconcile_business_taxon_factual_review_publication_v1(uuid, bigint, integer, text, text) is
  'Reconcilia evidencias fechadas do draft implantado, avanca marcadores e encerra a residencia temporaria.';

commit;
