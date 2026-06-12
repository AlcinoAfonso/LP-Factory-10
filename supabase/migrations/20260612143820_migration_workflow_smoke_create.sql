create table public.migration_workflow_smoke (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

alter table public.migration_workflow_smoke enable row level security;

revoke all on table public.migration_workflow_smoke
  from public, anon, authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_roles
    where rolname = 'ai_readonly'
  ) then
    execute 'revoke all on table public.migration_workflow_smoke from ai_readonly';
  end if;
end
$$;
