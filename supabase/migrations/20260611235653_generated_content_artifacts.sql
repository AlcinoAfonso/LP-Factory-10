-- E18.5 - persisted generated content artifacts.
-- Canonical incremental migration. Apply only through the approved migration flow.

begin;

create table public.generated_content_artifacts (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null,
  input_fingerprint text not null,
  artifact_version integer not null,
  status text not null default 'draft',
  template_key text not null,
  template_version integer not null,
  content_schema_version text not null,
  audience_scope text not null,
  locale text not null,
  scope_type text not null,
  research_taxon_id uuid null,
  provenance_json jsonb not null,
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz null,
  archived_at timestamptz null,
  constraint generated_content_artifacts_scope_key_chk
    check (scope_key ~ '^[a-f0-9]{64}$'),
  constraint generated_content_artifacts_input_fingerprint_chk
    check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint generated_content_artifacts_artifact_version_chk
    check (artifact_version > 0),
  constraint generated_content_artifacts_status_chk
    check (status in ('draft', 'active', 'archived')),
  constraint generated_content_artifacts_template_version_chk
    check (template_version > 0),
  constraint generated_content_artifacts_scope_type_chk
    check (scope_type in ('generic', 'taxon')),
  constraint generated_content_artifacts_scope_taxon_chk
    check (
      (scope_type = 'generic' and research_taxon_id is null)
      or (scope_type = 'taxon' and research_taxon_id is not null)
    ),
  constraint generated_content_artifacts_provenance_json_chk
    check (jsonb_typeof(provenance_json) = 'object'),
  constraint generated_content_artifacts_content_json_chk
    check (jsonb_typeof(content_json) = 'object'),
  constraint generated_content_artifacts_scope_version_uidx
    unique (scope_key, artifact_version),
  constraint generated_content_artifacts_research_taxon_id_fkey
    foreign key (research_taxon_id)
    references public.business_taxons(id)
    on update cascade
    on delete restrict
);

create unique index generated_content_artifacts_one_active_uidx
  on public.generated_content_artifacts (scope_key)
  where status = 'active';

create index generated_content_artifacts_template_lookup_idx
  on public.generated_content_artifacts (
    template_key,
    audience_scope,
    locale,
    scope_type,
    status
  );

create index generated_content_artifacts_research_taxon_id_idx
  on public.generated_content_artifacts (research_taxon_id);

alter table public.generated_content_artifacts enable row level security;

create trigger generated_content_artifacts_set_updated_at
  before update on public.generated_content_artifacts
  for each row
  execute function public.tg_set_updated_at();

create function public.create_generated_content_artifact_draft(
  p_scope_key text,
  p_input_fingerprint text,
  p_template_key text,
  p_template_version integer,
  p_content_schema_version text,
  p_audience_scope text,
  p_locale text,
  p_scope_type text,
  p_research_taxon_id uuid,
  p_provenance_json jsonb,
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
  perform pg_advisory_xact_lock(hashtextextended(p_scope_key, 0));

  select coalesce(max(gca.artifact_version), 0) + 1
    into v_artifact_version
  from public.generated_content_artifacts gca
  where gca.scope_key = p_scope_key;

  insert into public.generated_content_artifacts (
    scope_key,
    input_fingerprint,
    artifact_version,
    status,
    template_key,
    template_version,
    content_schema_version,
    audience_scope,
    locale,
    scope_type,
    research_taxon_id,
    provenance_json,
    content_json
  )
  values (
    p_scope_key,
    p_input_fingerprint,
    v_artifact_version,
    'draft',
    p_template_key,
    p_template_version,
    p_content_schema_version,
    p_audience_scope,
    p_locale,
    p_scope_type,
    p_research_taxon_id,
    p_provenance_json,
    p_content_json
  )
  returning id into v_artifact_id;

  return query
  select v_artifact_id, v_artifact_version, 'draft'::text;
end;
$$;

create function public.activate_generated_content_artifact(
  p_artifact_id uuid
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_scope_key text;
  v_status text;
begin
  select gca.scope_key, gca.status
    into v_scope_key, v_status
  from public.generated_content_artifacts gca
  where gca.id = p_artifact_id
  for update;

  if v_scope_key is null then
    return false;
  end if;

  if v_status = 'active' then
    return true;
  end if;

  if v_status <> 'draft' then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_scope_key, 0));

  update public.generated_content_artifacts
  set
    status = 'archived',
    archived_at = now()
  where scope_key = v_scope_key
    and status = 'active'
    and id <> p_artifact_id;

  update public.generated_content_artifacts
  set
    status = 'active',
    activated_at = now(),
    archived_at = null
  where id = p_artifact_id
    and status = 'draft';

  return found;
end;
$$;

revoke all on table public.generated_content_artifacts from public;
revoke all on table public.generated_content_artifacts from anon;
revoke all on table public.generated_content_artifacts from authenticated;
revoke all on table public.generated_content_artifacts from ai_readonly;

grant usage on schema public to service_role;
grant select, insert, update
  on table public.generated_content_artifacts
  to service_role;

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
) from public;
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
) from anon;
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
) from authenticated;
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
) from ai_readonly;
grant execute on function public.create_generated_content_artifact_draft(
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
) to service_role;

revoke all on function public.activate_generated_content_artifact(uuid)
  from public;
revoke all on function public.activate_generated_content_artifact(uuid)
  from anon;
revoke all on function public.activate_generated_content_artifact(uuid)
  from authenticated;
revoke all on function public.activate_generated_content_artifact(uuid)
  from ai_readonly;
grant execute on function public.activate_generated_content_artifact(uuid)
  to service_role;

commit;
