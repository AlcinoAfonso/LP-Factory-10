-- E18.5 - rollback da persistencia transversal de conteudo gerado
-- Nao usa CASCADE e nao altera templates, taxonomia ou pesquisa.

begin;

revoke all on function public.activate_generated_content_artifact(uuid)
  from service_role;

revoke all on function public.create_generated_content_artifact_draft(
  text,
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  uuid,
  jsonb,
  jsonb
) from service_role;

drop function if exists public.activate_generated_content_artifact(uuid);

drop function if exists public.create_generated_content_artifact_draft(
  text,
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  uuid,
  jsonb,
  jsonb
);

drop trigger if exists generated_content_artifacts_set_updated_at
  on public.generated_content_artifacts;

revoke all on table public.generated_content_artifacts from service_role;
revoke all on table public.generated_content_artifacts from public;
revoke all on table public.generated_content_artifacts from anon;
revoke all on table public.generated_content_artifacts from authenticated;
revoke all on table public.generated_content_artifacts from ai_readonly;

drop index if exists public.generated_content_artifacts_research_taxon_id_idx;
drop index if exists public.generated_content_artifacts_template_lookup_idx;
drop index if exists public.generated_content_artifacts_one_active_uidx;

drop table if exists public.generated_content_artifacts;

commit;
