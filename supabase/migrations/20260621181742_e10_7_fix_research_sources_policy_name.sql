begin;

drop policy if exists "content_artifact_research_sources_insert_admin_business_buyer_only"
  on public.content_artifact_research_sources;

drop policy if exists "content_artifact_research_sources_insert_admin_business_buyer_o"
  on public.content_artifact_research_sources;

drop policy if exists "cars_insert_admin_business_buyer_only"
  on public.content_artifact_research_sources;

create policy "cars_insert_admin_business_buyer_only"
  on public.content_artifact_research_sources
  for insert
  to authenticated
  with check (
    (public.is_super_admin() or public.is_platform_admin())
    and audience_scope = 'business_buyer'
  );

commit;
