create table public.user_identity_preferences (
  user_id uuid primary key
    references auth.users(id) on update cascade on delete cascade,
  preferred_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_identity_preferences_preferred_name_chk
    check (
      preferred_name = btrim(preferred_name)
      and char_length(preferred_name) between 1 and 80
    )
);

comment on table public.user_identity_preferences is
  'E10.9 preferred user identity; account-independent and server-side only.';

alter table public.user_identity_preferences enable row level security;

revoke all on table public.user_identity_preferences
  from public, anon, authenticated;
grant select, insert, update on table public.user_identity_preferences
  to service_role;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.user_identity_preferences from ai_readonly';
  end if;
end
$$;

drop trigger if exists user_identity_preferences_set_updated_at
  on public.user_identity_preferences;
create trigger user_identity_preferences_set_updated_at
before update on public.user_identity_preferences
for each row execute function public.tg_set_updated_at();

comment on trigger user_identity_preferences_set_updated_at
  on public.user_identity_preferences is
  'Maintains updated_at; no audit or Trigger Hub event is emitted for preferred-name changes.';
