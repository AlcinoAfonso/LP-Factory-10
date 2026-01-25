begin;

-- F2 (manual) — RPC idempotente para auto-criar 1ª conta + membership owner/active.
-- Efeito líquido: cria/atualiza a função public.ensure_first_account_for_current_user().

create or replace function public.ensure_first_account_for_current_user()
returns table (account_id uuid, account_key text)
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $function$
declare
  v_uid uuid := auth.uid();
  v_account_id uuid;
  v_account_key text;
  v_attempt int;
begin
  if v_uid is null then
    raise exception using message = 'auth_required', errcode = 'P0001';
  end if;

  -- trava por usuário (evita duplicidade em concorrência: abas/reloads)
  perform pg_advisory_xact_lock(hashtextextended('f2.ensure_first_account:' || v_uid::text, 0));

  -- se já existe qualquer vínculo, retorna a primeira conta (no-op)
  select a.id, a.subdomain
    into v_account_id, v_account_key
  from public.account_users au
  join public.accounts a on a.id = au.account_id
  where au.user_id = v_uid
  order by au.created_at asc, a.created_at asc
  limit 1;

  if found then
    account_id := v_account_id;
    account_key := v_account_key;
    return next;
    return;
  end if;

  -- criar conta + vínculo (com tentativas para evitar colisão de subdomain)
  for v_attempt in 1..5 loop
    begin
      -- tenta usar gerador oficial (se existir); fallback determinístico se não existir
      begin
        v_account_key := public._gen_provisional_slug();
      exception
        when undefined_function then
          v_account_key := 'acc-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      end;

      insert into public.accounts (name, subdomain, status, owner_user_id)
      values ('Conta ' || v_account_key, v_account_key, 'pending_setup', v_uid)
      returning id into v_account_id;

      insert into public.account_users (account_id, user_id, role, status)
      values (v_account_id, v_uid, 'owner', 'active');

      account_id := v_account_id;
      account_key := v_account_key;
      return next;
      return;

    exception
      when unique_violation then
        -- colisão rara em subdomain/slug → tenta novamente
        null;
    end;
  end loop;

  raise exception using message = 'ensure_first_account_failed', errcode = 'P0001';
end;
$function$;

-- Ownership (idempotente)
alter function public.ensure_first_account_for_current_user() owner to postgres;

-- Permissões (fail-closed por padrão)
revoke all on function public.ensure_first_account_for_current_user() from public;
revoke all on function public.ensure_first_account_for_current_user() from anon;
revoke all on function public.ensure_first_account_for_current_user() from authenticated;

grant execute on function public.ensure_first_account_for_current_user() to authenticated;

comment on function public.ensure_first_account_for_current_user()
is 'F2: Idempotente. Se usuário não tem membership, cria 1ª account (pending_setup) e vincula como owner/active.';

commit;
