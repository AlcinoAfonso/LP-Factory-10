begin;

create table if not exists public.account_landing_pages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  name text not null,
  slug text not null,
  status text not null default 'draft',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_landing_pages_account_id_fkey
    foreign key (account_id)
    references public.accounts(id)
    on update cascade
    on delete cascade,
  constraint account_landing_pages_created_by_fkey
    foreign key (created_by)
    references auth.users(id)
    on update cascade
    on delete restrict,
  constraint account_landing_pages_status_chk
    check (status in ('draft')),
  constraint account_landing_pages_slug_chk
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint account_landing_pages_name_chk
    check (length(btrim(name)) > 0),
  constraint account_landing_pages_account_slug_uidx
    unique (account_id, slug)
);

create index if not exists account_landing_pages_account_id_idx
  on public.account_landing_pages (account_id);

create index if not exists account_landing_pages_created_by_idx
  on public.account_landing_pages (created_by);

create index if not exists account_landing_pages_status_idx
  on public.account_landing_pages (status);

drop trigger if exists account_landing_pages_set_updated_at
  on public.account_landing_pages;
create trigger account_landing_pages_set_updated_at
  before update on public.account_landing_pages
  for each row
  execute function public.tg_set_updated_at();

alter table public.account_landing_pages enable row level security;

revoke all on table public.account_landing_pages
  from public, anon, authenticated;
grant select, insert on table public.account_landing_pages
  to authenticated;
grant select, insert, update, delete on table public.account_landing_pages
  to service_role;

drop policy if exists account_landing_pages_select_member_or_platform
  on public.account_landing_pages;
create policy account_landing_pages_select_member_or_platform
  on public.account_landing_pages
  for select
  to authenticated
  using (
    coalesce(public.is_platform_admin(), false)
    or exists (
      select 1
      from public.account_users au
      where au.account_id = account_landing_pages.account_id
        and au.user_id = (select auth.uid())
        and au.status = 'active'
    )
  );

drop policy if exists account_landing_pages_insert_owner_admin_or_platform
  on public.account_landing_pages;
create policy account_landing_pages_insert_owner_admin_or_platform
  on public.account_landing_pages
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'draft'
    and (
      coalesce(public.is_platform_admin(), false)
      or exists (
        select 1
        from public.account_users au
        where au.account_id = account_landing_pages.account_id
          and au.user_id = (select auth.uid())
          and au.status = 'active'
          and au.role in ('owner', 'admin')
      )
    )
  );

comment on table public.account_landing_pages
  is 'Persistencia minima de landing pages produtivas por conta na E19. Criacao inicial apenas como draft.';

commit;
