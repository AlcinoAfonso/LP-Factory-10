create or replace function public.audit_context_event(
  p_event text,
  p_entity text,
  p_entity_id uuid,
  p_diff jsonb,
  p_account_id uuid
)
returns void
language plpgsql
set search_path to 'public', 'extensions'
as $function$
declare
  v_ip inet := inet_client_addr();
  v_event text := lower(p_event);
begin
  insert into public.audit_logs(
    table_name,
    record_id,
    action,
    user_id,
    actor_user_id,
    changes_json,
    ip_address,
    created_at,
    account_id,
    event
  )
  values (
    p_entity,
    coalesce(p_entity_id, gen_random_uuid()),
    'insert',
    coalesce(auth.uid(), null),
    coalesce(auth.uid(), null),
    coalesce(p_diff, '{}'::jsonb),
    v_ip,
    now(),
    p_account_id,
    v_event
  );
end
$function$;