-- 20260514__e10_5_6_ai_structured_outputs.rollback.sql
-- E10.5.6 / 20.8 — rollback das colunas IA / Structured Outputs
-- Escopo:
-- - remove apenas estruturas adicionadas pelo 20.8 em account_niche_resolutions
-- - não remove account_niche_resolutions
-- - não altera account_taxonomy
-- - não altera business_taxons
-- - não altera business_taxon_aliases
-- - não altera RLS/policies
-- - não usa CASCADE

begin;

drop index if exists public.account_niche_resolutions_ai_suggested_taxon_id_idx;

alter table public.account_niche_resolutions
  drop constraint if exists account_niche_resolutions_ai_suggested_taxon_id_fkey;

alter table public.account_niche_resolutions
  drop constraint if exists account_niche_resolutions_ai_ux_mode_chk;

alter table public.account_niche_resolutions
  drop constraint if exists account_niche_resolutions_ai_result_json_chk;

alter table public.account_niche_resolutions
  drop constraint if exists account_niche_resolutions_ai_status_chk;

alter table public.account_niche_resolutions
  drop column if exists ai_processed_at;

alter table public.account_niche_resolutions
  drop column if exists ai_reason;

alter table public.account_niche_resolutions
  drop column if exists ai_needs_admin_review;

alter table public.account_niche_resolutions
  drop column if exists ai_needs_user_confirmation;

alter table public.account_niche_resolutions
  drop column if exists ai_suggested_new_taxon_label;

alter table public.account_niche_resolutions
  drop column if exists ai_suggested_taxon_id;

alter table public.account_niche_resolutions
  drop column if exists ai_ux_mode;

alter table public.account_niche_resolutions
  drop column if exists ai_result_json;

alter table public.account_niche_resolutions
  drop column if exists ai_schema_version;

alter table public.account_niche_resolutions
  drop column if exists ai_model;

alter table public.account_niche_resolutions
  drop column if exists ai_error_code;

alter table public.account_niche_resolutions
  drop column if exists ai_status;

commit;
