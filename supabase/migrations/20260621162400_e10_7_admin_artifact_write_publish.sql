begin;

grant select, insert on table public.content_artifacts to authenticated;
grant update (content_json, provenance_json) on table public.content_artifacts to authenticated;
grant select, insert, update on table public.content_artifacts to service_role;

grant select, insert on table public.content_artifact_research_sources to authenticated;
grant select, insert on table public.content_artifact_research_sources to service_role;

drop policy if exists "content_artifacts_select_admin_only" on public.content_artifacts;
create policy "content_artifacts_select_admin_only"
  on public.content_artifacts
  for select
  to authenticated
  using (public.is_super_admin() or public.is_platform_admin());

drop policy if exists "content_artifacts_insert_admin_draft_only" on public.content_artifacts;
create policy "content_artifacts_insert_admin_draft_only"
  on public.content_artifacts
  for insert
  to authenticated
  with check (
    (public.is_super_admin() or public.is_platform_admin())
    and status = 'draft'
    and published_at is null
    and archived_at is null
  );

drop policy if exists "content_artifacts_update_admin_only" on public.content_artifacts;
create policy "content_artifacts_update_admin_only"
  on public.content_artifacts
  for update
  to authenticated
  using (public.is_super_admin() or public.is_platform_admin())
  with check (public.is_super_admin() or public.is_platform_admin());

drop policy if exists "content_artifact_research_sources_select_admin_only"
  on public.content_artifact_research_sources;
create policy "content_artifact_research_sources_select_admin_only"
  on public.content_artifact_research_sources
  for select
  to authenticated
  using (public.is_super_admin() or public.is_platform_admin());

drop policy if exists "content_artifact_research_sources_insert_admin_business_buyer_only"
  on public.content_artifact_research_sources;
create policy "content_artifact_research_sources_insert_admin_business_buyer_only"
  on public.content_artifact_research_sources
  for insert
  to authenticated
  with check (
    (public.is_super_admin() or public.is_platform_admin())
    and audience_scope = 'business_buyer'
  );

create or replace function public.publish_content_artifact_draft(
  p_artifact_id uuid
)
returns public.content_artifacts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_draft public.content_artifacts%rowtype;
  v_result public.content_artifacts%rowtype;
  v_now timestamptz := now();
begin
  if not (
    coalesce(public.is_super_admin(), false)
    or coalesce(public.is_platform_admin(), false)
  ) then
    raise exception 'publish_content_artifact_draft requires platform admin privileges'
      using errcode = '42501';
  end if;

  select *
    into v_draft
  from public.content_artifacts
  where id = p_artifact_id
  for update;

  if not found then
    raise exception 'content artifact % not found', p_artifact_id
      using errcode = 'P0002';
  end if;

  if v_draft.status <> 'draft' then
    raise exception 'content artifact % must be draft to publish', p_artifact_id
      using errcode = '23514';
  end if;

  perform 1
  from public.content_artifacts
  where template_id = v_draft.template_id
    and taxon_id = v_draft.taxon_id
    and audience_scope = v_draft.audience_scope
    and status = 'published'
  for update;

  update public.content_artifacts
  set status = 'archived',
      archived_at = v_now
  where template_id = v_draft.template_id
    and taxon_id = v_draft.taxon_id
    and audience_scope = v_draft.audience_scope
    and status = 'published';

  update public.content_artifacts
  set status = 'published',
      published_at = v_now,
      archived_at = null
  where id = p_artifact_id
    and status = 'draft'
  returning * into v_result;

  if not found then
    raise exception 'content artifact % was not published', p_artifact_id
      using errcode = '40001';
  end if;

  return v_result;
end;
$$;

revoke all on function public.publish_content_artifact_draft(uuid) from public;
revoke all on function public.publish_content_artifact_draft(uuid) from anon;
grant execute on function public.publish_content_artifact_draft(uuid) to authenticated;

comment on function public.publish_content_artifact_draft(uuid)
  is 'Publishes one draft content artifact transactionally, archiving the previous published artifact for the same template/taxon/audience scope.';

commit;
