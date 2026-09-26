-- E10.10 candidate: account-owned factual answers. No E20.8 catalog cutover here.
alter table public.account_profiles
  add column business_display_name text,
  add column creci_registration text;

alter table public.account_profiles
  add constraint account_profiles_business_display_name_chk
    check (business_display_name is null or char_length(btrim(business_display_name)) between 1 and 120),
  add constraint account_profiles_creci_registration_chk
    check (creci_registration is null or char_length(btrim(creci_registration)) between 1 and 80);

comment on column public.account_profiles.business_display_name is
  'E10.10: factual public name supplied or confirmed by the account; the sole factual readiness gate.';
comment on column public.account_profiles.creci_registration is
  'E10.10: optional CRECI registration when the resolved factual coverage includes creci_registration.';
