begin;

alter table public.landing_page_generation_profiles
  alter column generation_guidance drop not null;

alter table public.landing_page_generation_profiles
  drop constraint landing_page_generation_profiles_guidance_chk,
  add constraint landing_page_generation_profiles_guidance_chk
    check (
      generation_guidance is null
      or length(btrim(generation_guidance)) > 0
    );

comment on column public.landing_page_generation_profiles.generation_guidance
  is 'Optional human-authored guidance for future landing-page generation.';

commit;
