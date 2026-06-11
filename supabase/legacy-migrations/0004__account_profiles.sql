-- 0004__account_profiles.sql
-- E10.4.6 — account_profiles (baseline do estado atual do Supabase)
-- Idempotente: pode rodar em ambiente que já tenha a tabela/policies.

begin;

-- 1) Tabela + constraints (cria somente se não existir)
create table if not exists public.account_profiles (
  account_id uuid not null,
  niche text null,
  preferred_channel text not null default 'email'::text,
  whatsapp text null,
  site_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_profiles_pkey primary key (account_id),
  constraint account_profiles_account_id_fkey
    foreign key (account_id)
    references public.accounts (id)
    on delete cascade,
  constraint account_profiles_preferred_channel_chk
    check (preferred_channel = any (array['email'::text, 'whatsapp'::text]))
);

-- 2) RLS
alter table public.account_profiles enable row level security;

-- 3) Policies (idempotentes via pg_policies)

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_profiles'
      and policyname = 'account_profiles_select_member_or_platform'
  ) then
    create policy "account_profiles_select_member_or_platform"
      on public.account_profiles
      as permissive
      for select
      to public
      using (
        coalesce(is_platform_admin(), false)
        or exists (
          select 1
          from public.account_users au
          where au.account_id = account_profiles.account_id
            and au.user_id = auth.uid()
            and au.status = 'active'::text
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_profiles'
      and policyname = 'account_profiles_insert_owner_admin_or_platform'
  ) then
    create policy "account_profiles_insert_owner_admin_or_platform"
      on public.account_profiles
      as permissive
      for insert
      to public
      with check (
        coalesce(is_platform_admin(), false)
        or exists (
          select 1
          from public.account_users au
          where au.account_id = account_profiles.account_id
            and au.user_id = auth.uid()
            and au.status = 'active'::text
            and au.role = any (array['owner'::text, 'admin'::text])
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'account_profiles'
      and policyname = 'account_profiles_update_owner_admin_or_platform'
  ) then
    create policy "account_profiles_update_owner_admin_or_platform"
      on public.account_profiles
      as permissive
      for update
      to public
      using (
        coalesce(is_platform_admin(), false)
        or exists (
          select 1
          from public.account_users au
          where au.account_id = account_profiles.account_id
            and au.user_id = auth.uid()
            and au.status = 'active'::text
            and au.role = any (array['owner'::text, 'admin'::text])
        )
      )
      with check (
        coalesce(is_platform_admin(), false)
        or exists (
          select 1
          from public.account_users au
          where au.account_id = account_profiles.account_id
            and au.user_id = auth.uid()
            and au.status = 'active'::text
            and au.role = any (array['owner'::text, 'admin'::text])
        )
      );
  end if;
end $$;

commit;
