begin;
set transaction read only;
set local search_path = public, pg_catalog;

select
  to_regclass('public.business_taxon_factual_reviews') is not null as single_review_residence,
  to_regclass('public.business_taxon_factual_review_events') is null as no_event_ledger,
  to_regclass('public.business_taxon_input_catalog_review_invalidations') is null as no_invalidation_ledger,
  (select relrowsecurity from pg_class where oid = 'public.business_taxon_factual_reviews'::regclass) as rls_enabled,
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'business_taxon_factual_reviews'
  ) as service_only,
  (select count(*) from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in (
        'finalize_business_taxon_factual_review_v1',
        'update_business_taxon_with_factual_review_invalidation_v1',
        'reconcile_business_taxon_factual_review_publication_v1'
      )) = 3 as three_focused_business_rpcs,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'landing_page_input_catalog_drafts'
      and column_name = 'publication_context_snapshot'
  ) as publication_context_snapshot_present,
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.business_taxon_aliases'::regclass
      and conname = 'business_taxon_aliases_taxon_id_fkey'
      and confdeltype = 'c'
  ) as alias_delete_is_atomic_with_taxon,
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.business_taxon_factual_reviews'::regclass
      and tgname = 'business_taxon_factual_reviews_open_guard'
      and not tgisinternal
  ) as opening_serializes_with_taxonomy_mutation,
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.business_taxons'::regclass
      and tgname = 'business_taxons_factual_research_selection_guard'
      and not tgisinternal
  ) as research_selection_serializes_with_factual_review,
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.business_taxons'::regclass
      and tgname = 'business_taxons_factual_context_lock'
      and not tgisinternal
  ) as taxonomy_context_mutations_share_lock,
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'guard_open_business_taxon_factual_review_v1'
      and prosrc like '%pg_advisory_xact_lock%'
      and prosrc like '%v_actual_chain is distinct from new.chain_snapshot%'
      and prosrc like '%selected_end_customer_research_version is distinct from new.baseline_selected_end_customer_research_version%'
  ) as opening_revalidates_exact_snapshot,
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'finalize_business_taxon_factual_review_v1'
      and prosrc like '%v_actual_chain is distinct from v_review.chain_snapshot%'
      and prosrc like '%selected_end_customer_research_version is distinct from v_review.baseline_selected_end_customer_research_version%'
  ) as finalization_revalidates_exact_snapshot,
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'reconcile_business_taxon_factual_review_publication_v1'
      and prosrc like '%v_actual_chain is distinct from v_evidence.chain_snapshot%'
      and prosrc like '%v_selected.is_active is distinct from v_evidence.baseline_is_active%'
      and prosrc like '%selected_end_customer_research_version is distinct from v_evidence.baseline_selected_end_customer_research_version%'
      and prosrc like '%v_selected.reviewed_input_catalog_version is distinct from v_evidence.baseline_reviewed_input_catalog_version%'
      and prosrc like '%v_current_context is distinct from v_draft.publication_context_snapshot%'
      and prosrc like '%v_evidence_taxon_ids is distinct from v_draft.publication_required_taxon_ids%'
  ) as reconciliation_revalidates_exact_snapshot,
  not exists (
    select 1 from public.business_taxon_factual_reviews
    where (status = 'open' and (outcome is not null or closed_at is not null))
       or (status = 'closed' and (outcome is null or closed_at is null))
  ) as lifecycle_consistent,
  not exists (
    select taxon_id from public.business_taxon_factual_reviews
    where status = 'open' group by taxon_id having count(*) > 1
  ) as one_open_review_per_taxon;

rollback;
