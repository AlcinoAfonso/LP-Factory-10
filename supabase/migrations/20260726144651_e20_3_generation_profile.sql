begin;

create table public.landing_page_generation_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_taxon_id uuid not null,
  version integer not null,
  status text not null,
  generation_guidance text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_page_generation_profiles_owner_taxon_id_fkey
    foreign key (owner_taxon_id)
    references public.business_taxons(id)
    on update cascade
    on delete restrict,
  constraint landing_page_generation_profiles_version_chk
    check (version > 0),
  constraint landing_page_generation_profiles_status_chk
    check (status in ('draft', 'active', 'archived')),
  constraint landing_page_generation_profiles_guidance_chk
    check (length(btrim(generation_guidance)) > 0),
  constraint landing_page_generation_profiles_owner_version_uidx
    unique (owner_taxon_id, version)
);

create unique index landing_page_generation_profiles_one_active_owner_idx
  on public.landing_page_generation_profiles (owner_taxon_id)
  where status = 'active';

create table public.landing_page_generation_profile_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  module_key text not null,
  module_version integer not null,
  variant_key text,
  variant_version integer,
  priority text not null,
  recommended_order integer not null,
  item_guidance text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_page_generation_profile_items_profile_id_fkey
    foreign key (profile_id)
    references public.landing_page_generation_profiles(id)
    on update cascade
    on delete cascade,
  constraint landing_page_generation_profile_items_module_key_chk
    check (length(btrim(module_key)) > 0),
  constraint landing_page_generation_profile_items_module_version_chk
    check (module_version > 0),
  constraint landing_page_generation_profile_items_variant_pair_chk
    check ((variant_key is null) = (variant_version is null)),
  constraint landing_page_generation_profile_items_variant_key_chk
    check (variant_key is null or length(btrim(variant_key)) > 0),
  constraint landing_page_generation_profile_items_variant_version_chk
    check (variant_version is null or variant_version > 0),
  constraint landing_page_generation_profile_items_priority_chk
    check (priority in ('P1', 'P2', 'P3')),
  constraint landing_page_generation_profile_items_order_chk
    check (recommended_order > 0),
  constraint landing_page_generation_profile_items_guidance_chk
    check (item_guidance is null or length(btrim(item_guidance)) > 0),
  constraint landing_page_generation_profile_items_profile_order_uidx
    unique (profile_id, recommended_order),
  constraint landing_page_generation_profile_items_profile_module_uidx
    unique (profile_id, module_key)
);

drop trigger if exists landing_page_generation_profiles_set_updated_at
  on public.landing_page_generation_profiles;
create trigger landing_page_generation_profiles_set_updated_at
  before update on public.landing_page_generation_profiles
  for each row
  execute function public.tg_set_updated_at();

drop trigger if exists landing_page_generation_profile_items_set_updated_at
  on public.landing_page_generation_profile_items;
create trigger landing_page_generation_profile_items_set_updated_at
  before update on public.landing_page_generation_profile_items
  for each row
  execute function public.tg_set_updated_at();

alter table public.landing_page_generation_profiles enable row level security;
alter table public.landing_page_generation_profile_items enable row level security;

revoke all on table public.landing_page_generation_profiles
  from public, anon, authenticated;
revoke all on table public.landing_page_generation_profile_items
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all privileges on table public.landing_page_generation_profiles from ai_readonly';
    execute 'revoke all privileges on table public.landing_page_generation_profile_items from ai_readonly';
  end if;
end;
$$;

grant select on table public.landing_page_generation_profiles to service_role;
grant select on table public.landing_page_generation_profile_items to service_role;

comment on table public.landing_page_generation_profiles
  is 'Perfis versionados de orientacao para geracao por taxon; somente leitura na E20.3.';
comment on table public.landing_page_generation_profile_items
  is 'Recomendacoes ordenadas que integram uma versao do perfil de orientacao.';

commit;
