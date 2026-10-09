begin;

-- Hosting grants EXECUTE on new public functions to the operational read role by default.
-- Preserve the established service_role-only boundary without changing global defaults.
do $acl$
begin
  if to_regrole('ai_readonly') is not null then
    revoke all on function public.commit_account_pending_setup_turn_v3(
      uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid
    ) from ai_readonly;
  end if;
end $acl$;

commit;
