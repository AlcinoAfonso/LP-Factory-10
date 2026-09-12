begin;

revoke insert, update, delete, truncate on table public.openai_lp_cost_events, public.openai_lp_cost_coverage
  from service_role;

revoke all on table public.openai_lp_cost_events, public.openai_lp_cost_coverage
  from public, anon, authenticated;

revoke all on function public.prevent_openai_lp_cost_mutation_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric, integer, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.register_openai_lp_cost_coverage_v1(timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.read_openai_lp_cost_events_v1(timestamptz, timestamptz)
  from public, anon, authenticated;

do $$
begin
  if to_regrole('ai_readonly') is not null then
    execute 'revoke all on table public.openai_lp_cost_events, public.openai_lp_cost_coverage from ai_readonly';
    execute 'revoke all on function public.prevent_openai_lp_cost_mutation_v1() from ai_readonly';
    execute 'revoke all on function public.append_openai_lp_cost_start_v1(uuid, uuid, uuid, text, text, text, text, text, text, text, text) from ai_readonly';
    execute 'revoke all on function public.append_openai_lp_cost_terminal_v1(uuid, text, text, jsonb, jsonb, numeric, integer, text, text) from ai_readonly';
    execute 'revoke all on function public.register_openai_lp_cost_coverage_v1(timestamptz) from ai_readonly';
    execute 'revoke all on function public.read_openai_lp_cost_events_v1(timestamptz, timestamptz) from ai_readonly';
  end if;
end;
$$;

grant select on table public.openai_lp_cost_events, public.openai_lp_cost_coverage
  to service_role;
grant execute on function public.read_openai_lp_cost_events_v1(timestamptz, timestamptz)
  to service_role;

commit;
