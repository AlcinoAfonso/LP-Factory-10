-- E18.5 - persistencia de artefatos comerciais gerados
-- Tipo: operacional / execucao manual controlada
-- Escopo:
-- - cria artefatos versionados por identidade
-- - cria draft de forma concorrente segura
-- - ativa uma versao e arquiva a ativa anterior na mesma transacao
-- - restringe Data API a service_role

begin;

create table if not exists public.commercial_generated_artifacts (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null,
  artifact_version integer not null,
  status text not null default 'draft',
  template_key text not null,
  template_version integer not null,
  content_schema_version text not null,
  audience_scope text not null,
  locale text not null,
  resolution_source text not null,
  research_taxon_id uuid null,
  identity_json jsonb not null,
  research_sources_json jsonb not null default '[]'::jsonb,
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz null,
  archived_at timestamptz null,
  constraint commercial_generated_artifacts_identity_key_chk
    check (btrim(identity_key) <> ''),
  constraint commercial_generated_artifacts_artifact_version_chk
    check (artifact_version > 0),
  constraint commercial_generated_artifacts_status_chk
    check (status in ('draft', 'active', 'archived')),
  constraint commercial_generated_artifacts_template_version_chk
    check (template_version > 0),
  constraint commercial_generated_artifacts_resolution_source_chk
    check (resolution_source in ('resolved_taxon', 'parent', 'ancestor', 'generic')),
  constraint commercial_generated_artifacts_identity_json_chk
    check (jsonb_typeof(identity_json) = 'object'),
  constraint commercial_generated_artifacts_research_sources_json_chk
    check (jsonb_typeof(research_sources_json) = 'array'),
  constraint commercial_generated_artifacts_content_json_chk
    check (jsonb_typeof(content_json) = 'object'),
  constraint commercial_generated_artifacts_identity_version_uidx
    unique (identity_key, artifact_version),
  constraint commercial_generated_artifacts_research_taxon_id_fkey
    foreign key (research_taxon_id)
    references public.business_taxons(id)
    on update cascade
    on delete set null
);

create unique index if not exists commercial_generated_artifacts_one_active_uidx
  on public.commercial_generated_artifacts (identity_key)
  where status = 'active';

create index if not exists commercial_generated_artifacts_template_lookup_idx
  on public.commercial_generated_artifacts (
    template_key,
    template_version,
    audience_scope,
    locale,
    status
  );

create index if not exists commercial_generated_artifacts_research_taxon_id_idx
  on public.commercial_generated_artifacts (research_taxon_id);

alter table public.commercial_generated_artifacts enable row level security;

drop policy if exists commercial_generated_artifacts_select_admin_only
  on public.commercial_generated_artifacts;

create policy commercial_generated_artifacts_select_admin_only
  on public.commercial_generated_artifacts
  for select
  to public
  using (is_super_admin() or is_platform_admin());

drop policy if exists commercial_generated_artifacts_insert_admin_only
  on public.commercial_generated_artifacts;

create policy commercial_generated_artifacts_insert_admin_only
  on public.commercial_generated_artifacts
  for insert
  to public
  with check (is_super_admin() or is_platform_admin());

drop policy if exists commercial_generated_artifacts_update_admin_only
  on public.commercial_generated_artifacts;

create policy commercial_generated_artifacts_update_admin_only
  on public.commercial_generated_artifacts
  for update
  to public
  using (is_super_admin() or is_platform_admin())
  with check (is_super_admin() or is_platform_admin());

drop trigger if exists commercial_generated_artifacts_set_updated_at
  on public.commercial_generated_artifacts;

create trigger commercial_generated_artifacts_set_updated_at
  before update on public.commercial_generated_artifacts
  for each row
  execute function public.tg_set_updated_at();

create or replace function public.create_commercial_generated_artifact_draft(
  p_identity_key text,
  p_template_key text,
  p_template_version integer,
  p_content_schema_version text,
  p_audience_scope text,
  p_locale text,
  p_resolution_source text,
  p_research_taxon_id uuid,
  p_identity_json jsonb,
  p_research_sources_json jsonb,
  p_content_json jsonb
)
returns table (
  artifact_id uuid,
  artifact_version integer,
  artifact_status text
)
language plpgsql
set search_path = public
as $$
declare
  v_artifact_id uuid;
  v_artifact_version integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_identity_key, 0));

  select coalesce(max(cga.artifact_version), 0) + 1
    into v_artifact_version
  from public.commercial_generated_artifacts cga
  where cga.identity_key = p_identity_key;

  insert into public.commercial_generated_artifacts (
    identity_key,
    artifact_version,
    status,
    template_key,
    template_version,
    content_schema_version,
    audience_scope,
    locale,
    resolution_source,
    research_taxon_id,
    identity_json,
    research_sources_json,
    content_json
  )
  values (
    p_identity_key,
    v_artifact_version,
    'draft',
    p_template_key,
    p_template_version,
    p_content_schema_version,
    p_audience_scope,
    p_locale,
    p_resolution_source,
    p_research_taxon_id,
    p_identity_json,
    p_research_sources_json,
    p_content_json
  )
  returning id into v_artifact_id;

  return query
  select v_artifact_id, v_artifact_version, 'draft'::text;
end;
$$;

create or replace function public.activate_commercial_generated_artifact(
  p_artifact_id uuid
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_identity_key text;
  v_status text;
begin
  select cga.identity_key, cga.status
    into v_identity_key, v_status
  from public.commercial_generated_artifacts cga
  where cga.id = p_artifact_id
  for update;

  if v_identity_key is null then
    return false;
  end if;

  if v_status = 'active' then
    return true;
  end if;

  if v_status <> 'draft' then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_identity_key, 0));

  update public.commercial_generated_artifacts
  set
    status = 'archived',
    archived_at = now()
  where identity_key = v_identity_key
    and status = 'active'
    and id <> p_artifact_id;

  update public.commercial_generated_artifacts
  set
    status = 'active',
    activated_at = now(),
    archived_at = null
  where id = p_artifact_id
    and status = 'draft';

  return found;
end;
$$;

revoke all on table public.commercial_generated_artifacts from public;
revoke all on table public.commercial_generated_artifacts from anon;
revoke all on table public.commercial_generated_artifacts from authenticated;
revoke all on table public.commercial_generated_artifacts from ai_readonly;

grant usage on schema public to service_role;
grant select, insert, update
  on table public.commercial_generated_artifacts
  to service_role;

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
) from public;
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
) from anon;
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
) from authenticated;
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
) from ai_readonly;
grant execute on function public.create_commercial_generated_artifact_draft(
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
) to service_role;

revoke all on function public.activate_commercial_generated_artifact(uuid)
  from public;
revoke all on function public.activate_commercial_generated_artifact(uuid)
  from anon;
revoke all on function public.activate_commercial_generated_artifact(uuid)
  from authenticated;
revoke all on function public.activate_commercial_generated_artifact(uuid)
  from ai_readonly;
grant execute on function public.activate_commercial_generated_artifact(uuid)
  to service_role;

commit;
