begin;

create table if not exists public.account_niche_resolutions (
  account_id uuid not null,
  raw_input text not null,
  selected_taxon_id uuid null,
  confidence text not null,
  should_use_deterministic_match boolean not null default false,
  should_escalate_to_ai boolean not null default false,
  ai_escalation_mode text not null,
  needs_admin_review boolean not null default false,
  reason text not null,
  resolution_status text not null,
  match_source text null,
  score numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_pkey'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_pkey
      primary key (account_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_account_id_fkey'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_account_id_fkey
      foreign key (account_id)
      references public.accounts(id)
      on update cascade
      on delete cascade;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_selected_taxon_id_fkey'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_selected_taxon_id_fkey
      foreign key (selected_taxon_id)
      references public.business_taxons(id)
      on update cascade
      on delete set null;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_raw_input_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_raw_input_chk
      check (btrim(raw_input) <> '');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_confidence_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_confidence_chk
      check (confidence in ('high', 'medium', 'low'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_ai_escalation_mode_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_ai_escalation_mode_chk
      check (
        ai_escalation_mode in (
          'none',
          'rerank_candidates',
          'infer_existing_segment',
          'suggest_alias_for_review',
          'suggest_new_taxon_for_review'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_reason_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_reason_chk
      check (
        reason in (
          'no_candidates',
          'high_confidence_strong_match',
          'medium_confidence_close_candidates',
          'medium_confidence_below_high_threshold',
          'medium_confidence_weak_match_source',
          'low_confidence_insufficient_score'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_resolution_status_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_resolution_status_chk
      check (
        resolution_status in (
          'deterministic_high_confidence',
          'review_required',
          'unclassified'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'account_niche_resolutions_score_chk'
      and conrelid = 'public.account_niche_resolutions'::regclass
  ) then
    alter table public.account_niche_resolutions
      add constraint account_niche_resolutions_score_chk
      check (score is null or (score >= 0 and score <= 1));
  end if;
end;
$$;

create index if not exists account_niche_resolutions_selected_taxon_id_idx
  on public.account_niche_resolutions using btree (selected_taxon_id);

alter table public.account_niche_resolutions enable row level security;

drop policy if exists account_niche_resolutions_select_admin_only
  on public.account_niche_resolutions;

create policy account_niche_resolutions_select_admin_only
  on public.account_niche_resolutions
  for select
  to public
  using (is_super_admin() or is_platform_admin());

drop policy if exists account_niche_resolutions_insert_admin_only
  on public.account_niche_resolutions;

create policy account_niche_resolutions_insert_admin_only
  on public.account_niche_resolutions
  for insert
  to public
  with check (is_super_admin() or is_platform_admin());

drop policy if exists account_niche_resolutions_update_admin_only
  on public.account_niche_resolutions;

create policy account_niche_resolutions_update_admin_only
  on public.account_niche_resolutions
  for update
  to public
  using (is_super_admin() or is_platform_admin())
  with check (is_super_admin() or is_platform_admin());

drop policy if exists account_niche_resolutions_delete_admin_only
  on public.account_niche_resolutions;

create policy account_niche_resolutions_delete_admin_only
  on public.account_niche_resolutions
  for delete
  to public
  using (is_super_admin() or is_platform_admin());

drop trigger if exists account_niche_resolutions_set_updated_at
  on public.account_niche_resolutions;

create trigger account_niche_resolutions_set_updated_at
  before update on public.account_niche_resolutions
  for each row
  execute function public.tg_set_updated_at();

grant usage on schema public to service_role;

grant execute on function public.match_business_taxons_deterministic(text, integer) to service_role;
grant execute on function public.normalize_taxon_match_text(text) to service_role;

grant select on table public.business_taxons to service_role;
grant select on table public.business_taxon_aliases to service_role;

revoke all on table public.account_niche_resolutions from public;
revoke all on table public.account_niche_resolutions from anon;
revoke all on table public.account_niche_resolutions from authenticated;

grant select, insert, update on table public.account_niche_resolutions to service_role;

commit;
