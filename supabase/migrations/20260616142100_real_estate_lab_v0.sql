create table if not exists public.real_estate_lab_contents (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, title text not null, topic text not null, channel text not null, format text null, hook text null, body text null, cta text null, status text not null, scheduled_for timestamptz null, published_at timestamptz null, result_notes text null, learning_notes text null, created_by uuid not null, updated_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint real_estate_lab_contents_account_id_fkey foreign key (account_id) references public.accounts(id) on update cascade on delete cascade,
  constraint real_estate_lab_contents_created_by_fkey foreign key (created_by) references auth.users(id) on update cascade on delete restrict,
  constraint real_estate_lab_contents_updated_by_fkey foreign key (updated_by) references auth.users(id) on update cascade on delete restrict,
  constraint real_estate_lab_contents_status_chk check (status in ('idea','draft','review','approved','published','archived')),
  constraint real_estate_lab_contents_channel_chk check (channel in ('instagram','tiktok','whatsapp','multi_channel','other')),
  constraint real_estate_lab_contents_title_nonempty_chk check (length(btrim(title)) > 0),
  constraint real_estate_lab_contents_topic_nonempty_chk check (length(btrim(topic)) > 0),
  constraint real_estate_lab_contents_body_plain_chk check (body is null or (position('<' in body) = 0 and position('>' in body) = 0))
);
create table if not exists public.real_estate_lab_items (
  id uuid primary key default gen_random_uuid(), account_id uuid not null, item_type text not null, title text not null, description text null, status text not null, priority text null, responsible_user_id uuid null, due_at timestamptz null, occurred_at timestamptz null, result_notes text null, created_by uuid not null, updated_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint real_estate_lab_items_account_id_fkey foreign key (account_id) references public.accounts(id) on update cascade on delete cascade,
  constraint real_estate_lab_items_responsible_user_id_fkey foreign key (responsible_user_id) references auth.users(id) on update cascade on delete set null,
  constraint real_estate_lab_items_created_by_fkey foreign key (created_by) references auth.users(id) on update cascade on delete restrict,
  constraint real_estate_lab_items_updated_by_fkey foreign key (updated_by) references auth.users(id) on update cascade on delete restrict,
  constraint real_estate_lab_items_item_type_chk check (item_type in ('agenda','task','decision','question','objection','learning','opportunity','field_note')),
  constraint real_estate_lab_items_status_chk check (status in ('open','in_progress','done','discarded')),
  constraint real_estate_lab_items_priority_chk check (priority is null or priority in ('low','medium','high')),
  constraint real_estate_lab_items_title_nonempty_chk check (length(btrim(title)) > 0),
  constraint real_estate_lab_items_description_plain_chk check (description is null or (position('<' in description) = 0 and position('>' in description) = 0))
);
create index if not exists real_estate_lab_contents_account_status_idx on public.real_estate_lab_contents(account_id, status);
create index if not exists real_estate_lab_contents_account_created_at_idx on public.real_estate_lab_contents(account_id, created_at desc);
create index if not exists real_estate_lab_contents_account_scheduled_for_idx on public.real_estate_lab_contents(account_id, scheduled_for);
create index if not exists real_estate_lab_items_account_item_type_idx on public.real_estate_lab_items(account_id, item_type);
create index if not exists real_estate_lab_items_account_status_idx on public.real_estate_lab_items(account_id, status);
create index if not exists real_estate_lab_items_account_due_at_idx on public.real_estate_lab_items(account_id, due_at);
create index if not exists real_estate_lab_items_account_created_at_idx on public.real_estate_lab_items(account_id, created_at desc);
alter table public.real_estate_lab_contents enable row level security;
alter table public.real_estate_lab_items enable row level security;
create trigger real_estate_lab_contents_set_updated_at before update on public.real_estate_lab_contents for each row execute function public.tg_set_updated_at();
create trigger real_estate_lab_items_set_updated_at before update on public.real_estate_lab_items for each row execute function public.tg_set_updated_at();
grant select, insert, update, delete on public.real_estate_lab_contents to authenticated;
grant select, insert, update, delete on public.real_estate_lab_items to authenticated;
create policy real_estate_lab_contents_select_member_or_platform on public.real_estate_lab_contents for select using (coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_contents.account_id and au.user_id = auth.uid() and au.status = 'active'));
create policy real_estate_lab_contents_insert_editor_or_platform on public.real_estate_lab_contents for insert with check ((coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_contents.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin','editor'))) and created_by = auth.uid() and updated_by = auth.uid());
create policy real_estate_lab_contents_update_editor_or_platform on public.real_estate_lab_contents for update using (coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_contents.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin','editor'))) with check ((coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_contents.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin','editor'))) and updated_by = auth.uid());
create policy real_estate_lab_contents_delete_admin_or_platform on public.real_estate_lab_contents for delete using (coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_contents.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin')));
create policy real_estate_lab_items_select_member_or_platform on public.real_estate_lab_items for select using (coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_items.account_id and au.user_id = auth.uid() and au.status = 'active'));
create policy real_estate_lab_items_insert_editor_or_platform on public.real_estate_lab_items for insert with check ((coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_items.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin','editor'))) and created_by = auth.uid() and updated_by = auth.uid());
create policy real_estate_lab_items_update_editor_or_platform on public.real_estate_lab_items for update using (coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_items.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin','editor'))) with check ((coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_items.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin','editor'))) and updated_by = auth.uid());
create policy real_estate_lab_items_delete_admin_or_platform on public.real_estate_lab_items for delete using (coalesce(public.is_platform_admin(), false) or exists (select 1 from public.account_users au where au.account_id = real_estate_lab_items.account_id and au.user_id = auth.uid() and au.status = 'active' and au.role in ('owner','admin')));
