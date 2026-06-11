begin;

create schema if not exists extensions;

create extension if not exists pg_trgm with schema extensions;

grant usage on schema extensions to service_role;

set local search_path = public, extensions;

create or replace function public.normalize_taxon_match_text(input text)
returns text
language sql
immutable
parallel safe
returns null on null input
set search_path = public, extensions
as $$
  select btrim(
    regexp_replace(
      translate(
        lower(input),
        'áàãâäéèêëíìîïóòõôöúùûüçñ',
        'aaaaaeeeeiiiiooooouuuucn'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

revoke all on function public.normalize_taxon_match_text(text) from public;
grant execute on function public.normalize_taxon_match_text(text) to service_role;

create index if not exists business_taxons_name_normalized_idx
  on public.business_taxons (public.normalize_taxon_match_text(name));

create index if not exists business_taxons_slug_normalized_idx
  on public.business_taxons (public.normalize_taxon_match_text(replace(slug, '-', ' ')));

create index if not exists business_taxon_aliases_alias_text_normalized_idx
  on public.business_taxon_aliases (alias_text_normalized);

create index if not exists business_taxons_name_slug_fts_gin_idx
  on public.business_taxons
  using gin (
    to_tsvector(
      'portuguese'::regconfig,
      public.normalize_taxon_match_text(name) || ' ' || public.normalize_taxon_match_text(replace(slug, '-', ' '))
    )
  );

create index if not exists business_taxon_aliases_alias_text_normalized_fts_gin_idx
  on public.business_taxon_aliases
  using gin (
    to_tsvector(
      'portuguese'::regconfig,
      alias_text_normalized
    )
  );

create index if not exists business_taxons_name_normalized_trgm_gin_idx
  on public.business_taxons
  using gin ((public.normalize_taxon_match_text(name)) gin_trgm_ops);

create index if not exists business_taxons_slug_normalized_trgm_gin_idx
  on public.business_taxons
  using gin ((public.normalize_taxon_match_text(replace(slug, '-', ' '))) gin_trgm_ops);

create index if not exists business_taxon_aliases_alias_text_normalized_trgm_gin_idx
  on public.business_taxon_aliases
  using gin (alias_text_normalized gin_trgm_ops);

create or replace function public.match_business_taxons_deterministic(
  p_query text,
  p_limit integer default 10
)
returns table (
  taxon_id uuid,
  name text,
  slug text,
  level text,
  parent_id uuid,
  parent_name text,
  matched_aliases text[],
  match_source text,
  score numeric
)
language sql
stable
parallel safe
set search_path = public, extensions
as $$
  with params as (
    select
      p_query as q,
      public.normalize_taxon_match_text(p_query) as q_norm,
      greatest(1, least(coalesce(p_limit, 10), 50)) as limit_n
    where public.normalize_taxon_match_text(p_query) is not null
      and public.normalize_taxon_match_text(p_query) <> ''
  ),

  query_terms as (
    select
      q,
      q_norm,
      limit_n,
      websearch_to_tsquery('portuguese'::regconfig, q_norm) as tsq
    from params
  ),

  taxons as (
    select
      bt.id as taxon_id,
      bt.name,
      bt.slug,
      bt.level,
      bt.parent_id,
      parent.name as parent_name,
      public.normalize_taxon_match_text(bt.name) as name_norm,
      public.normalize_taxon_match_text(replace(bt.slug, '-', ' ')) as slug_norm,
      to_tsvector(
        'portuguese'::regconfig,
        public.normalize_taxon_match_text(bt.name) || ' ' || public.normalize_taxon_match_text(replace(bt.slug, '-', ' '))
      ) as search_vector
    from public.business_taxons bt
    left join public.business_taxons parent
      on parent.id = bt.parent_id
    where bt.is_active = true
  ),

  aliases as (
    select
      bta.id as alias_id,
      bta.taxon_id,
      bta.alias_text,
      bta.alias_text_normalized,
      to_tsvector('portuguese'::regconfig, bta.alias_text_normalized) as search_vector
    from public.business_taxon_aliases bta
    join public.business_taxons bt
      on bt.id = bta.taxon_id
    where bta.is_active = true
      and bt.is_active = true
  ),

  matches as (
    select
      a.taxon_id,
      'alias_exact'::text as match_source,
      1.00::numeric as score,
      10::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on btrim(a.alias_text) = btrim(q.q)

    union all

    select
      a.taxon_id,
      'alias_normalized'::text as match_source,
      0.98::numeric as score,
      20::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on a.alias_text_normalized = q.q_norm

    union all

    select
      t.taxon_id,
      'taxon_name_exact'::text as match_source,
      0.96::numeric as score,
      30::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on btrim(t.name) = btrim(q.q)

    union all

    select
      t.taxon_id,
      'taxon_name_normalized'::text as match_source,
      0.94::numeric as score,
      40::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on t.name_norm = q.q_norm

    union all

    select
      t.taxon_id,
      'taxon_slug_normalized'::text as match_source,
      0.92::numeric as score,
      50::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on t.slug_norm = q.q_norm

    union all

    select
      t.taxon_id,
      'fts'::text as match_source,
      round((0.70 + least(ts_rank_cd(t.search_vector, q.tsq)::numeric, 0.20))::numeric, 4) as score,
      60::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on t.search_vector @@ q.tsq

    union all

    select
      a.taxon_id,
      'fts'::text as match_source,
      round((0.70 + least(ts_rank_cd(a.search_vector, q.tsq)::numeric, 0.20))::numeric, 4) as score,
      60::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on a.search_vector @@ q.tsq

    union all

    select
      t.taxon_id,
      'trgm'::text as match_source,
      round(
        (
          0.50 + (
            greatest(
              similarity(t.name_norm, q.q_norm),
              similarity(t.slug_norm, q.q_norm)
            )::numeric * 0.30
          )
        )::numeric,
        4
      ) as score,
      70::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on greatest(
        similarity(t.name_norm, q.q_norm),
        similarity(t.slug_norm, q.q_norm)
      ) >= 0.35

    union all

    select
      a.taxon_id,
      'trgm'::text as match_source,
      round((0.50 + (similarity(a.alias_text_normalized, q.q_norm)::numeric * 0.30))::numeric, 4) as score,
      70::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on similarity(a.alias_text_normalized, q.q_norm) >= 0.35
  ),

  candidate_scores as (
    select
      taxon_id,
      max(score) as score,
      min(priority) as best_priority,
      coalesce(
        array_remove(array_agg(distinct matched_alias), null),
        array[]::text[]
      ) as matched_aliases
    from matches
    group by taxon_id
  ),

  candidate_sources as (
    select
      taxon_id,
      string_agg(match_source, '+' order by priority) as match_source
    from (
      select
        taxon_id,
        match_source,
        min(priority) as priority
      from matches
      group by taxon_id, match_source
    ) s
    group by taxon_id
  )

  select
    t.taxon_id,
    t.name,
    t.slug,
    t.level,
    t.parent_id,
    t.parent_name,
    cs.matched_aliases,
    src.match_source,
    cs.score
  from candidate_scores cs
  join taxons t
    on t.taxon_id = cs.taxon_id
  join candidate_sources src
    on src.taxon_id = cs.taxon_id
  order by
    cs.best_priority asc,
    cs.score desc,
    case t.level
      when 'ultra_niche' then 1
      when 'niche' then 2
      when 'segment' then 3
      else 9
    end,
    t.name asc
  limit (select coalesce(max(limit_n), 0) from params);
$$;

revoke all on function public.match_business_taxons_deterministic(text, integer) from public;
grant execute on function public.match_business_taxons_deterministic(text, integer) to service_role;

commit;
