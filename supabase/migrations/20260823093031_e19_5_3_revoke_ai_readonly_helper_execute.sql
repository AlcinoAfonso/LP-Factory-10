begin;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke execute on function public.e19_5_actor_can_manage(uuid, uuid) from ai_readonly';
    execute 'revoke execute on function public.e19_5_configuration_values_have_scopes(jsonb, text[]) from ai_readonly';
  end if;
end;
$$;

commit;
