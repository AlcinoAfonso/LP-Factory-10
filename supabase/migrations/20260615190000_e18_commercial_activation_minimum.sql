begin;

drop index if exists public.content_templates_template_key_uidx;
drop index if exists public.content_templates_slug_uidx;

create unique index content_templates_template_key_version_uidx
  on public.content_templates (template_key, version);

create unique index content_templates_slug_version_uidx
  on public.content_templates (slug, version);

create unique index content_templates_id_version_uidx
  on public.content_templates (id, version);

create unique index content_templates_one_active_page_family_uidx
  on public.content_templates (template_family)
  where template_scope = 'page'
    and status = 'active'
    and is_active = true;

create unique index taxon_market_research_identity_version_uidx
  on public.taxon_market_research (id, taxon_id, audience_scope, version);

create table public.content_template_compositions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  taxon_id uuid not null,
  version integer not null default 1,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_template_compositions_template_id_fkey
    foreign key (template_id)
    references public.content_templates(id)
    on update cascade
    on delete restrict,
  constraint content_template_compositions_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons(id)
    on update cascade
    on delete restrict,
  constraint content_template_compositions_version_chk
    check (version > 0),
  constraint content_template_compositions_status_chk
    check (status in ('draft', 'active', 'archived')),
  constraint content_template_compositions_identity_uidx
    unique (template_id, taxon_id, version),
  constraint content_template_compositions_trace_uidx
    unique (id, template_id, taxon_id, version)
);

create unique index content_template_compositions_one_active_uidx
  on public.content_template_compositions (template_id, taxon_id)
  where status = 'active';

create index content_template_compositions_taxon_id_idx
  on public.content_template_compositions (taxon_id);

create table public.content_template_composition_items (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid not null,
  module_template_id uuid not null,
  variant_key text not null,
  sort_order integer not null,
  is_required boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_template_composition_items_composition_id_fkey
    foreign key (composition_id)
    references public.content_template_compositions(id)
    on update cascade
    on delete cascade,
  constraint content_template_composition_items_module_template_id_fkey
    foreign key (module_template_id)
    references public.content_templates(id)
    on update cascade
    on delete restrict,
  constraint content_template_composition_items_variant_key_chk
    check (variant_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint content_template_composition_items_sort_order_chk
    check (sort_order >= 0),
  constraint content_template_composition_items_config_json_chk
    check (jsonb_typeof(config_json) = 'object'),
  constraint content_template_composition_items_order_uidx
    unique (composition_id, sort_order)
);

create index content_template_composition_items_module_template_id_idx
  on public.content_template_composition_items (module_template_id);

create table public.content_artifacts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  composition_id uuid not null,
  taxon_id uuid not null,
  audience_scope text not null,
  template_version integer not null,
  composition_version integer not null,
  research_version integer not null,
  artifact_version integer not null default 1,
  status text not null default 'draft',
  content_json jsonb not null,
  provenance_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  archived_at timestamptz null,
  constraint content_artifacts_template_id_fkey
    foreign key (template_id, template_version)
    references public.content_templates(id, version)
    on update cascade
    on delete restrict,
  constraint content_artifacts_composition_id_fkey
    foreign key (
      composition_id,
      template_id,
      taxon_id,
      composition_version
    )
    references public.content_template_compositions(
      id,
      template_id,
      taxon_id,
      version
    )
    on update cascade
    on delete restrict,
  constraint content_artifacts_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons(id)
    on update cascade
    on delete restrict,
  constraint content_artifacts_audience_scope_chk
    check (audience_scope in ('end_customer', 'business_buyer')),
  constraint content_artifacts_versions_chk
    check (
      template_version > 0
      and composition_version > 0
      and research_version > 0
      and artifact_version > 0
    ),
  constraint content_artifacts_status_chk
    check (status in ('draft', 'published', 'archived')),
  constraint content_artifacts_lifecycle_chk
    check (
      (status = 'draft' and published_at is null and archived_at is null)
      or (status = 'published' and published_at is not null and archived_at is null)
      or (status = 'archived' and archived_at is not null)
    ),
  constraint content_artifacts_content_json_chk
    check (jsonb_typeof(content_json) = 'object'),
  constraint content_artifacts_provenance_json_chk
    check (jsonb_typeof(provenance_json) = 'object'),
  constraint content_artifacts_identity_uidx
    unique (
      template_id,
      composition_id,
      taxon_id,
      audience_scope,
      research_version,
      artifact_version
    ),
  constraint content_artifacts_research_trace_uidx
    unique (id, taxon_id, audience_scope, research_version)
);

create unique index content_artifacts_one_published_uidx
  on public.content_artifacts (template_id, taxon_id, audience_scope)
  where status = 'published';

create index content_artifacts_composition_id_idx
  on public.content_artifacts (composition_id);

create index content_artifacts_taxon_id_idx
  on public.content_artifacts (taxon_id);

create table public.content_artifact_research_sources (
  artifact_id uuid not null,
  research_id uuid not null,
  taxon_id uuid not null,
  audience_scope text not null,
  research_version integer not null,
  created_at timestamptz not null default now(),
  constraint content_artifact_research_sources_pkey
    primary key (artifact_id, research_id),
  constraint content_artifact_research_sources_artifact_id_fkey
    foreign key (artifact_id, taxon_id, audience_scope, research_version)
    references public.content_artifacts(
      id,
      taxon_id,
      audience_scope,
      research_version
    )
    on update cascade
    on delete cascade,
  constraint content_artifact_research_sources_research_id_fkey
    foreign key (research_id, taxon_id, audience_scope, research_version)
    references public.taxon_market_research(
      id,
      taxon_id,
      audience_scope,
      version
    )
    on update cascade
    on delete restrict
);

create index content_artifact_research_sources_research_id_idx
  on public.content_artifact_research_sources (research_id);

create trigger content_template_compositions_set_updated_at
  before update on public.content_template_compositions
  for each row
  execute function public.tg_set_updated_at();

create trigger content_template_composition_items_set_updated_at
  before update on public.content_template_composition_items
  for each row
  execute function public.tg_set_updated_at();

create trigger content_artifacts_set_updated_at
  before update on public.content_artifacts
  for each row
  execute function public.tg_set_updated_at();

alter table public.content_template_compositions enable row level security;
alter table public.content_template_composition_items enable row level security;
alter table public.content_artifacts enable row level security;
alter table public.content_artifact_research_sources enable row level security;

revoke all on table public.content_templates from anon, authenticated;
revoke all on table public.content_template_taxons from anon, authenticated;
revoke all on table public.content_template_compositions from public, anon, authenticated;
revoke all on table public.content_template_composition_items from public, anon, authenticated;
revoke all on table public.content_artifacts from public, anon, authenticated;
revoke all on table public.content_artifact_research_sources from public, anon, authenticated;

grant select on table public.content_templates to service_role;
grant select on table public.content_template_taxons to service_role;
grant select on table public.content_template_compositions to service_role;
grant select on table public.content_template_composition_items to service_role;
grant select on table public.content_artifacts to service_role;
grant select on table public.content_artifact_research_sources to service_role;

commit;
