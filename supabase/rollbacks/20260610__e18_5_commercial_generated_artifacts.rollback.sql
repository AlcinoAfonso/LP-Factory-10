-- E18.5 - rollback da persistencia de artefatos comerciais gerados
-- Nao usa CASCADE e nao altera templates, taxonomia ou pesquisa.

begin;

revoke all on function public.activate_commercial_generated_artifact(uuid)
  from service_role;

revoke all on function public.create_commercial_generated_artifact_draft(
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  uuid,
  jsonb,
  jsonb,
  jsonb
) from service_role;

drop function if exists public.activate_commercial_generated_artifact(uuid);

drop function if exists public.create_commercial_generated_artifact_draft(
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  uuid,
  jsonb,
  jsonb,
  jsonb
);

drop trigger if exists commercial_generated_artifacts_set_updated_at
  on public.commercial_generated_artifacts;

drop policy if exists commercial_generated_artifacts_update_admin_only
  on public.commercial_generated_artifacts;
drop policy if exists commercial_generated_artifacts_insert_admin_only
  on public.commercial_generated_artifacts;
drop policy if exists commercial_generated_artifacts_select_admin_only
  on public.commercial_generated_artifacts;

revoke all on table public.commercial_generated_artifacts from service_role;
revoke all on table public.commercial_generated_artifacts from public;
revoke all on table public.commercial_generated_artifacts from anon;
revoke all on table public.commercial_generated_artifacts from authenticated;
revoke all on table public.commercial_generated_artifacts from ai_readonly;

drop index if exists public.commercial_generated_artifacts_research_taxon_id_idx;
drop index if exists public.commercial_generated_artifacts_template_lookup_idx;
drop index if exists public.commercial_generated_artifacts_one_active_uidx;

drop table if exists public.commercial_generated_artifacts;

commit;
