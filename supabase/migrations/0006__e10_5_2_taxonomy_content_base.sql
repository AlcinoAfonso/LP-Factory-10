-- 0006__e10_5_2_taxonomy_content_base.sql
-- E10.5.2 — Base estrutural de taxonomia, templates e guides
-- Idempotente: pode rodar em ambiente que já tenha as tabelas/policies.
-- Escopo desta migration:
-- - cria as 8 tabelas da etapa
-- - aplica constraints, índices e generated column
-- - habilita RLS
-- - cria policies CRUD admin-only
-- Fora do escopo desta migration:
-- - auditoria
-- - Trigger Hub
-- - exposição tenant/app
-- - snippets supabase/snippets (supa#40)

begin;

-- 1) Tabelas + constraints

create table if not exists public.business_taxons (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid null,
  level text not null,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  constraint business_taxons_level_chk
    check (level = any (array['segment'::text, 'niche'::text, 'ultra_niche'::text])),
  constraint business_taxons_parent_id_fkey
    foreign key (parent_id)
    references public.business_taxons (id)
    on update cascade
    on delete set null
);

create table if not exists public.business_taxon_aliases (
  id uuid primary key default gen_random_uuid(),
  taxon_id uuid not null,
  alias_text text not null,
  alias_text_normalized text generated always as (
    btrim(
      regexp_replace(
        translate(
          lower(alias_text),
          'áàãâäéèêëíìîïóòõôöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'
        ),
        '\s+',
        ' ',
        'g'
      )
    )
  ) stored,
  is_active boolean not null default true,
  constraint business_taxon_aliases_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons (id)
    on update cascade
    on delete restrict
);

create table if not exists public.account_taxonomy (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  taxon_id uuid not null,
  is_primary boolean not null default false,
  status text not null,
  source_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_taxonomy_status_chk
    check (status = any (array['active'::text, 'inactive'::text])),
  constraint account_taxonomy_source_type_chk
    check (source_type = any (array['manual'::text, 'taxonomy_match'::text])),
  constraint account_taxonomy_account_id_fkey
    foreign key (account_id)
    references public.accounts (id)
    on update cascade
    on delete cascade,
  constraint account_taxonomy_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons (id)
    on update cascade
    on delete restrict
);

create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  name text not null,
  slug text not null,
  template_family text not null,
  template_scope text not null,
  status text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  payload_json jsonb not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_templates_template_family_chk
    check (template_family = any (array['commercial_activation'::text, 'landing_page'::text])),
  constraint content_templates_template_scope_chk
    check (template_scope = any (array['page'::text, 'section'::text])),
  constraint content_templates_status_chk
    check (status = any (array['draft'::text, 'active'::text, 'archived'::text]))
);

create table if not exists public.content_template_taxons (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  taxon_id uuid not null,
  resolution_level text not null,
  priority integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_template_taxons_resolution_level_chk
    check (resolution_level = any (array['generic'::text, 'segment'::text, 'niche'::text, 'ultra_niche'::text])),
  constraint content_template_taxons_template_id_fkey
    foreign key (template_id)
    references public.content_templates (id)
    on update cascade
    on delete cascade,
  constraint content_template_taxons_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons (id)
    on update cascade
    on delete restrict
);

create table if not exists public.taxon_market_research (
  id uuid primary key default gen_random_uuid(),
  taxon_id uuid not null,
  version integer not null default 1,
  status text not null,
  base_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxon_market_research_status_chk
    check (status = any (array['draft'::text, 'active'::text, 'archived'::text])),
  constraint taxon_market_research_taxon_id_fkey
    foreign key (taxon_id)
    references public.business_taxons (id)
    on update cascade
    on delete restrict
);

create table if not exists public.taxon_market_research_items (
  id uuid primary key default gen_random_uuid(),
  research_id uuid not null,
  item_tag text not null,
  item_text text not null,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxon_market_research_items_research_id_fkey
    foreign key (research_id)
    references public.taxon_market_research (id)
    on update cascade
    on delete cascade
);

create table if not exists public.taxon_message_guides (
  id uuid primary key default gen_random_uuid(),
  research_id uuid not null,
  context_type text not null,
  guide_payload_json jsonb not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxon_message_guides_context_type_chk
    check (context_type = any (array['e10_5'::text, 'landing_page'::text, 'email'::text, 'whatsapp'::text])),
  constraint taxon_message_guides_research_id_fkey
    foreign key (research_id)
    references public.taxon_market_research (id)
    on update cascade
    on delete cascade
);

-- 2) Índices e unicidades

create unique index if not exists business_taxons_slug_uidx
  on public.business_taxons (slug);

create index if not exists business_taxons_parent_id_idx
  on public.business_taxons (parent_id);

create index if not exists business_taxons_level_idx
  on public.business_taxons (level);

create index if not exists business_taxon_aliases_taxon_id_idx
  on public.business_taxon_aliases (taxon_id);

create unique index if not exists business_taxon_aliases_taxon_alias_norm_uidx
  on public.business_taxon_aliases (taxon_id, alias_text_normalized);

create index if not exists account_taxonomy_account_id_idx
  on public.account_taxonomy (account_id);

create index if not exists account_taxonomy_taxon_id_idx
  on public.account_taxonomy (taxon_id);

create unique index if not exists account_taxonomy_account_taxon_uidx
  on public.account_taxonomy (account_id, taxon_id);

create unique index if not exists content_templates_template_key_uidx
  on public.content_templates (template_key);

create unique index if not exists content_templates_slug_uidx
  on public.content_templates (slug);

create index if not exists content_template_taxons_template_id_idx
  on public.content_template_taxons (template_id);

create index if not exists content_template_taxons_taxon_id_idx
  on public.content_template_taxons (taxon_id);

create index if not exists taxon_market_research_taxon_id_idx
  on public.taxon_market_research (taxon_id);

create index if not exists taxon_market_research_items_research_id_idx
  on public.taxon_market_research_items (research_id);

create index if not exists taxon_message_guides_research_id_idx
  on public.taxon_message_guides (research_id);

-- 3) RLS

alter table public.business_taxons enable row level security;
alter table public.business_taxon_aliases enable row level security;
alter table public.account_taxonomy enable row level security;
alter table public.content_templates enable row level security;
alter table public.content_template_taxons enable row level security;
alter table public.taxon_market_research enable row level security;
alter table public.taxon_market_research_items enable row level security;
alter table public.taxon_message_guides enable row level security;

-- 4) Policies admin-only (idempotentes via pg_policies)

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxons'
      and policyname = 'business_taxons_select_admin_only'
  ) then
    create policy "business_taxons_select_admin_only"
      on public.business_taxons
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxons'
      and policyname = 'business_taxons_insert_admin_only'
  ) then
    create policy "business_taxons_insert_admin_only"
      on public.business_taxons
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxons'
      and policyname = 'business_taxons_update_admin_only'
  ) then
    create policy "business_taxons_update_admin_only"
      on public.business_taxons
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxons'
      and policyname = 'business_taxons_delete_admin_only'
  ) then
    create policy "business_taxons_delete_admin_only"
      on public.business_taxons
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxon_aliases'
      and policyname = 'business_taxon_aliases_select_admin_only'
  ) then
    create policy "business_taxon_aliases_select_admin_only"
      on public.business_taxon_aliases
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxon_aliases'
      and policyname = 'business_taxon_aliases_insert_admin_only'
  ) then
    create policy "business_taxon_aliases_insert_admin_only"
      on public.business_taxon_aliases
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxon_aliases'
      and policyname = 'business_taxon_aliases_update_admin_only'
  ) then
    create policy "business_taxon_aliases_update_admin_only"
      on public.business_taxon_aliases
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'business_taxon_aliases'
      and policyname = 'business_taxon_aliases_delete_admin_only'
  ) then
    create policy "business_taxon_aliases_delete_admin_only"
      on public.business_taxon_aliases
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_taxonomy'
      and policyname = 'account_taxonomy_select_admin_only'
  ) then
    create policy "account_taxonomy_select_admin_only"
      on public.account_taxonomy
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_taxonomy'
      and policyname = 'account_taxonomy_insert_admin_only'
  ) then
    create policy "account_taxonomy_insert_admin_only"
      on public.account_taxonomy
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_taxonomy'
      and policyname = 'account_taxonomy_update_admin_only'
  ) then
    create policy "account_taxonomy_update_admin_only"
      on public.account_taxonomy
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_taxonomy'
      and policyname = 'account_taxonomy_delete_admin_only'
  ) then
    create policy "account_taxonomy_delete_admin_only"
      on public.account_taxonomy
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_templates'
      and policyname = 'content_templates_select_admin_only'
  ) then
    create policy "content_templates_select_admin_only"
      on public.content_templates
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_templates'
      and policyname = 'content_templates_insert_admin_only'
  ) then
    create policy "content_templates_insert_admin_only"
      on public.content_templates
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_templates'
      and policyname = 'content_templates_update_admin_only'
  ) then
    create policy "content_templates_update_admin_only"
      on public.content_templates
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_templates'
      and policyname = 'content_templates_delete_admin_only'
  ) then
    create policy "content_templates_delete_admin_only"
      on public.content_templates
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_template_taxons'
      and policyname = 'content_template_taxons_select_admin_only'
  ) then
    create policy "content_template_taxons_select_admin_only"
      on public.content_template_taxons
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_template_taxons'
      and policyname = 'content_template_taxons_insert_admin_only'
  ) then
    create policy "content_template_taxons_insert_admin_only"
      on public.content_template_taxons
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_template_taxons'
      and policyname = 'content_template_taxons_update_admin_only'
  ) then
    create policy "content_template_taxons_update_admin_only"
      on public.content_template_taxons
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'content_template_taxons'
      and policyname = 'content_template_taxons_delete_admin_only'
  ) then
    create policy "content_template_taxons_delete_admin_only"
      on public.content_template_taxons
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research'
      and policyname = 'taxon_market_research_select_admin_only'
  ) then
    create policy "taxon_market_research_select_admin_only"
      on public.taxon_market_research
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research'
      and policyname = 'taxon_market_research_insert_admin_only'
  ) then
    create policy "taxon_market_research_insert_admin_only"
      on public.taxon_market_research
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research'
      and policyname = 'taxon_market_research_update_admin_only'
  ) then
    create policy "taxon_market_research_update_admin_only"
      on public.taxon_market_research
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research'
      and policyname = 'taxon_market_research_delete_admin_only'
  ) then
    create policy "taxon_market_research_delete_admin_only"
      on public.taxon_market_research
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research_items'
      and policyname = 'taxon_market_research_items_select_admin_only'
  ) then
    create policy "taxon_market_research_items_select_admin_only"
      on public.taxon_market_research_items
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research_items'
      and policyname = 'taxon_market_research_items_insert_admin_only'
  ) then
    create policy "taxon_market_research_items_insert_admin_only"
      on public.taxon_market_research_items
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research_items'
      and policyname = 'taxon_market_research_items_update_admin_only'
  ) then
    create policy "taxon_market_research_items_update_admin_only"
      on public.taxon_market_research_items
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_market_research_items'
      and policyname = 'taxon_market_research_items_delete_admin_only'
  ) then
    create policy "taxon_market_research_items_delete_admin_only"
      on public.taxon_market_research_items
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_message_guides'
      and policyname = 'taxon_message_guides_select_admin_only'
  ) then
    create policy "taxon_message_guides_select_admin_only"
      on public.taxon_message_guides
      as permissive
      for select
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_message_guides'
      and policyname = 'taxon_message_guides_insert_admin_only'
  ) then
    create policy "taxon_message_guides_insert_admin_only"
      on public.taxon_message_guides
      as permissive
      for insert
      to public
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_message_guides'
      and policyname = 'taxon_message_guides_update_admin_only'
  ) then
    create policy "taxon_message_guides_update_admin_only"
      on public.taxon_message_guides
      as permissive
      for update
      to public
      using (is_super_admin() or is_platform_admin())
      with check (is_super_admin() or is_platform_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'taxon_message_guides'
      and policyname = 'taxon_message_guides_delete_admin_only'
  ) then
    create policy "taxon_message_guides_delete_admin_only"
      on public.taxon_message_guides
      as permissive
      for delete
      to public
      using (is_super_admin() or is_platform_admin());
  end if;
end $$;

commit;
