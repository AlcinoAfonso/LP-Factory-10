-- 20260511__e10_5_6_account_niche_resolutions.rollback.sql
-- E10.5.6 / 20.6 — rollback da persistência da resolução operacional atual
-- Escopo:
-- - remove a tabela operacional account_niche_resolutions
-- - remove trigger, policies, índice, constraints e grants ligados à tabela
-- Regra:
-- - não usa CASCADE
-- - não remove nem altera account_taxonomy
-- - não remove nem altera business_taxons ou business_taxon_aliases
-- - não revoga grants de service_role em business_taxons/business_taxon_aliases, pois eles suportam a RPC de matching determinístico já existente

begin;

drop trigger if exists account_niche_resolutions_set_updated_at
  on public.account_niche_resolutions;

drop policy if exists account_niche_resolutions_delete_admin_only
  on public.account_niche_resolutions;

drop policy if exists account_niche_resolutions_update_admin_only
  on public.account_niche_resolutions;

drop policy if exists account_niche_resolutions_insert_admin_only
  on public.account_niche_resolutions;

drop policy if exists account_niche_resolutions_select_admin_only
  on public.account_niche_resolutions;

revoke all on table public.account_niche_resolutions from service_role;
revoke all on table public.account_niche_resolutions from public;
revoke all on table public.account_niche_resolutions from anon;
revoke all on table public.account_niche_resolutions from authenticated;

drop index if exists public.account_niche_resolutions_selected_taxon_id_idx;

drop table if exists public.account_niche_resolutions;

commit;
