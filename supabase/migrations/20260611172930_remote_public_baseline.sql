-- LP Factory 10 official baseline.
-- Source: remote public schema captured on 2026-06-11.
-- Scope: project-owned objects in public plus the pg_trgm dependency.
-- Excludes managed schemas, data, platform configuration, secrets, and ai_readonly operational role ACLs.

begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
grant usage on schema extensions to service_role;




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."_gen_provisional_slug"() RETURNS "text"
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select 'acc-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;


ALTER FUNCTION "public"."_gen_provisional_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_account_invite"("p_account_id" "uuid", "p_ttl_days" integer DEFAULT 7) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_row public.account_users%rowtype;
begin
  select * into v_row
  from public.account_users
  where account_id = p_account_id
    and user_id    = auth.uid()
  for update;

  if not found then
    raise exception 'Convite não encontrado para este usuário/conta.';
  end if;

  if v_row.status <> 'pending' then
    raise exception 'Convite não está pendente.';
  end if;

  if public.invitation_is_expired(v_row.id, p_ttl_days) then
    -- marca como 'revoked' por expiração
    update public.account_users
       set status = 'revoked'
     where id = v_row.id;
    raise exception 'Convite expirado. Solicite um novo convite.';
  end if;

  -- Transição para 'active'
  update public.account_users
     set status = 'active'
   where id = v_row.id;

  return true;
end;
$$;


ALTER FUNCTION "public"."accept_account_invite"("p_account_id" "uuid", "p_ttl_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activate_user_from_auth_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_user_id uuid := (event->>'user_id')::uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', jsonb_build_object('http_code', 400, 'message', 'user_id ausente no evento'));
  END IF;

  -- Idempotente: só altera se estiver pending
  UPDATE public.account_users
     SET status = 'active'
   WHERE user_id = v_user_id
     AND status = 'pending';

  -- Retorna o event (sem modificar claims)
  RETURN event;
END;
$$;


ALTER FUNCTION "public"."activate_user_from_auth_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_account_users"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_ip inet := inet_client_addr();
  v_diff jsonb; v_entity text := 'account_users'; v_entity_id uuid; v_account_id uuid;
  v_subject_user uuid; v_actor uuid; v_action text := lower(TG_OP);
BEGIN
  IF TG_OP='INSERT' THEN v_diff:=jsonb_build_object('new',to_jsonb(NEW)); v_entity_id:=NEW.id; v_account_id:=NEW.account_id; v_subject_user:=NEW.user_id;
  ELSIF TG_OP='DELETE' THEN v_diff:=jsonb_build_object('old',to_jsonb(OLD)); v_entity_id:=OLD.id; v_account_id:=OLD.account_id; v_subject_user:=OLD.user_id;
  ELSE v_diff:=public.jsonb_diff_val(to_jsonb(OLD),to_jsonb(NEW)); v_entity_id:=NEW.id; v_account_id:=NEW.account_id; v_subject_user:=NEW.user_id;
  END IF;
  v_actor := COALESCE(auth.uid(), v_subject_user);
  INSERT INTO public.audit_logs(table_name,record_id,action,user_id,actor_user_id,changes_json,ip_address,created_at,account_id)
  VALUES (v_entity,v_entity_id,v_action,v_subject_user,v_actor,v_diff,v_ip,now(),v_account_id);
  RETURN NULL;
END $$;


ALTER FUNCTION "public"."audit_account_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_ip inet := inet_client_addr();
  v_diff jsonb; v_entity text := 'accounts'; v_entity_id uuid; v_account_id uuid;
  v_subject_user uuid; v_actor uuid; v_action text := lower(TG_OP);
BEGIN
  IF TG_OP='INSERT' THEN v_diff:=jsonb_build_object('new',to_jsonb(NEW)); v_entity_id:=NEW.id; v_account_id:=NEW.id; v_subject_user:=NEW.owner_user_id;
  ELSIF TG_OP='DELETE' THEN v_diff:=jsonb_build_object('old',to_jsonb(OLD)); v_entity_id:=OLD.id; v_account_id:=OLD.id; v_subject_user:=OLD.owner_user_id;
  ELSE v_diff:=public.jsonb_diff_val(to_jsonb(OLD),to_jsonb(NEW)); v_entity_id:=NEW.id; v_account_id:=NEW.id; v_subject_user:=NEW.owner_user_id;
  END IF;
  v_actor := COALESCE(auth.uid(), v_subject_user);
  INSERT INTO public.audit_logs(table_name,record_id,action,user_id,actor_user_id,changes_json,ip_address,created_at,account_id)
  VALUES (v_entity,v_entity_id,v_action,v_subject_user,v_actor,v_diff,v_ip,now(),v_account_id);
  RETURN NULL;
END $$;


ALTER FUNCTION "public"."audit_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_context_event"("p_event" "text", "p_entity" "text", "p_entity_id" "uuid", "p_diff" "jsonb", "p_account_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE v_ip inet := inet_client_addr(); v_event text := lower(p_event);
BEGIN
  INSERT INTO public.audit_logs(table_name,record_id,action,user_id,actor_user_id,changes_json,ip_address,created_at,account_id)
  VALUES (p_entity,COALESCE(p_entity_id,gen_random_uuid()),v_event,COALESCE(auth.uid(),NULL),COALESCE(auth.uid(),NULL),
          COALESCE(p_diff,'{}'::jsonb),v_ip,now(),p_account_id);
END $$;


ALTER FUNCTION "public"."audit_context_event"("p_event" "text", "p_entity" "text", "p_entity_id" "uuid", "p_diff" "jsonb", "p_account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_partner_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_ip inet := inet_client_addr();
  v_diff jsonb; v_entity text := 'partner_accounts'; v_entity_id uuid := gen_random_uuid();
  v_account_id uuid; v_subject_user uuid; v_actor uuid; v_action text := lower(TG_OP);
BEGIN
  IF TG_OP='INSERT' THEN v_diff:=jsonb_build_object('new',to_jsonb(NEW)); v_account_id:=NEW.account_id;
  ELSIF TG_OP='DELETE' THEN v_diff:=jsonb_build_object('old',to_jsonb(OLD)); v_account_id:=OLD.account_id;
  ELSE v_diff:=public.jsonb_diff_val(to_jsonb(OLD),to_jsonb(NEW)); v_account_id:=NEW.account_id;
  END IF;
  SELECT owner_user_id INTO v_subject_user FROM public.accounts WHERE id=v_account_id LIMIT 1;
  v_actor := COALESCE(auth.uid(), v_subject_user);
  INSERT INTO public.audit_logs(table_name,record_id,action,user_id,actor_user_id,changes_json,ip_address,created_at,account_id)
  VALUES (v_entity,v_entity_id,v_action,v_subject_user,v_actor,v_diff,v_ip,now(),v_account_id);
  RETURN NULL;
END $$;


ALTER FUNCTION "public"."audit_partner_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_first_account_for_current_user"() RETURNS TABLE("account_id" "uuid", "account_key" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
      v_account_key := public._gen_provisional_slug();

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
$$;


ALTER FUNCTION "public"."ensure_first_account_for_current_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_audit_dispatch"("p_table" "text", "p_kind" "text", "p_payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public, auth, pg_catalog'
    AS $$DECLARE
  v_ip inet := inet_client_addr();
  v_actor uuid := auth.uid();
  v_record uuid := COALESCE(
    (p_payload->>'id')::uuid,
    (p_payload->'new'->>'id')::uuid,
    (p_payload->'old'->>'id')::uuid,
    gen_random_uuid()
  );
  v_acc uuid := COALESCE(
    (p_payload->>'account_id')::uuid,
    (p_payload->'new'->>'account_id')::uuid,
    (p_payload->'old'->>'account_id')::uuid,
    CASE WHEN p_table='accounts' THEN v_record END
  );
  v_subject uuid := COALESCE(
    (p_payload->>'user_id')::uuid,
    (p_payload->'new'->>'user_id')::uuid,
    (p_payload->'old'->>'user_id')::uuid
  );
  v_payload jsonb := CASE
    WHEN p_payload IS NULL OR p_payload IN ('{}','[]'::jsonb,'null'::jsonb) THEN jsonb_build_object('no_diff',true)
    ELSE p_payload
  END;
BEGIN

    PERFORM set_config('search_path', 'public, auth, pg_catalog', false);
  INSERT INTO public.audit_logs(table_name,record_id,action,user_id,actor_user_id,changes_json,ip_address,created_at,account_id,event)
  VALUES (p_table, v_record, lower(p_kind), v_subject, v_actor, v_payload, v_ip, now(), v_acc, 'hub_dispatch');
END$$;


ALTER FUNCTION "public"."fn_audit_dispatch"("p_table" "text", "p_kind" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_guard_last_owner"("p_kind" "text", "p_new" "jsonb", "p_old" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public, auth, pg_catalog'
    AS $$
DECLARE
  v_acc uuid := COALESCE((p_old->>'account_id')::uuid,(p_new->>'account_id')::uuid);
  v_user uuid := (p_old->>'user_id')::uuid;
  v_old_role text := lower(COALESCE(p_old->>'role',''));
  v_old_status text := COALESCE(p_old->>'status','');
  v_new_role text := lower(COALESCE(p_new->>'role',''));
  v_new_status text := COALESCE(p_new->>'status','');
  v_count int;
BEGIN
  IF p_kind='DELETE' AND v_old_role='owner' AND v_old_status='active' THEN
    SELECT COUNT(*) INTO v_count FROM public.account_users
    WHERE account_id=v_acc AND user_id<>v_user AND status='active' AND lower(role)='owner';
    IF v_count=0 THEN RAISE EXCEPTION 'Não é permitido remover o último owner ativo.'; END IF;
  ELSIF p_kind='UPDATE'
    AND v_old_role='owner' AND v_old_status='active'
    AND (v_new_role<>'owner' OR v_new_status<>'active') THEN
    SELECT COUNT(*) INTO v_count FROM public.account_users
    WHERE account_id=v_acc AND user_id<>v_user AND status='active' AND lower(role)='owner';
    IF v_count=0 THEN RAISE EXCEPTION 'Não é permitido remover/downgradear o último owner ativo.'; END IF;
  END IF;
END $$;


ALTER FUNCTION "public"."fn_guard_last_owner"("p_kind" "text", "p_new" "jsonb", "p_old" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_owner_transfer_rules"("p_kind" "text", "p_new" "jsonb", "p_old" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public, auth, pg_catalog'
    AS $$
DECLARE
  v_prev uuid := (p_old->>'owner_user_id')::uuid;
  v_next uuid := (p_new->>'owner_user_id')::uuid;
  v_acc  uuid := COALESCE((p_new->>'id')::uuid,(p_old->>'id')::uuid);
  ok boolean;
BEGIN
  IF p_kind='UPDATE' AND v_next IS DISTINCT FROM v_prev THEN
    IF v_next IS NULL THEN RAISE EXCEPTION 'owner_user_id não pode ser nulo.'; END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id=v_acc AND au.user_id=v_next
        AND au.status='active' AND lower(au.role)='owner'
    ) INTO ok;
    IF NOT ok THEN
      RAISE EXCEPTION 'Transferência inválida: novo owner deve estar como owner ativo em account_users.';
    END IF;
  END IF;
END $$;


ALTER FUNCTION "public"."fn_owner_transfer_rules"("p_kind" "text", "p_new" "jsonb", "p_old" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_write_audit_log"("p_table_name" "text", "p_record_id" "uuid", "p_action" "text", "p_account_id" "uuid", "p_changes" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  INSERT INTO public.audit_logs (id, table_name, record_id, action, user_id, actor_user_id, account_id, changes_json, created_at)
  VALUES (gen_random_uuid(), p_table_name, p_record_id, p_action, auth.uid(), auth.uid(), p_account_id, p_changes, now());
END;
$$;


ALTER FUNCTION "public"."fn_write_audit_log"("p_table_name" "text", "p_record_id" "uuid", "p_action" "text", "p_account_id" "uuid", "p_changes" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_effective_limits"("p_account_id" "uuid") RETURNS TABLE("account_id" "uuid", "account_name" "text", "account_status" "text", "subdomain" "text", "domain" "text", "plan_id" "uuid", "plan_name" "text", "price_monthly" numeric, "plan_features" "jsonb", "max_lps" integer, "max_conversions" integer, "max_lps_unlimited" boolean, "max_lps_effective" bigint, "max_conversions_unlimited" boolean, "max_conversions_effective" bigint, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT
    v.account_id,
    v.account_name,
    v.account_status,
    v.subdomain,
    v.domain,
    v.plan_id,
    v.plan_name,
    v.price_monthly,
    v.plan_features,
    v.max_lps,
    v.max_conversions,
    v.max_lps_unlimited,
    v.max_lps_effective,
    v.max_conversions_unlimited,
    v.max_conversions_effective,
    v.created_at,
    v.updated_at
  FROM public.v_account_effective_limits v
  WHERE v.account_id = p_account_id
    AND (
      public.is_platform_admin()
      OR public.is_member_active(v.account_id, auth.uid())
    )
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_account_effective_limits"("p_account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_account_min_role"("p_account_id" "uuid", "p_min_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select exists (
    select 1
    from public.account_users au
    where au.account_id = p_account_id
      and au.user_id    = auth.uid()
      and au.status     = 'active'
      and public.role_rank(au.role) >= public.role_rank(p_min_role)
  );
$$;


ALTER FUNCTION "public"."has_account_min_role"("p_account_id" "uuid", "p_min_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hub_router"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public, auth, pg_catalog'
    AS $$
DECLARE
  v_kind text := TG_OP;
  j_old jsonb := to_jsonb(OLD);
  j_new jsonb := to_jsonb(NEW);
  j_payload jsonb;
BEGIN
  IF TG_TABLE_NAME='accounts' AND v_kind='UPDATE' THEN
    NEW.updated_at := now(); j_new := to_jsonb(NEW);
  ELSIF TG_TABLE_NAME='account_users' AND v_kind IN ('INSERT','UPDATE') THEN
    IF NEW.role IS NOT NULL THEN NEW.role := lower(NEW.role); IF NEW.role='member' THEN NEW.role := 'viewer'; END IF; END IF;
    IF NEW.status IS NOT NULL THEN NEW.status := lower(NEW.status); END IF;
    j_new := to_jsonb(NEW);
  END IF;

  j_payload := CASE v_kind
    WHEN 'INSERT' THEN jsonb_build_object('new',j_new)||j_new
    WHEN 'DELETE' THEN jsonb_build_object('old',j_old)||j_old
    ELSE COALESCE(public.jsonb_diff_val(j_old,j_new),'{}'::jsonb)
         || jsonb_build_object('id',COALESCE((j_new->>'id')::uuid,(j_old->>'id')::uuid))
  END;

  PERFORM public.fn_audit_dispatch(TG_TABLE_NAME, v_kind, j_payload);

  IF TG_TABLE_NAME='account_users' THEN
    PERFORM public.fn_guard_last_owner(v_kind, j_new, j_old);
  ELSIF TG_TABLE_NAME='accounts' THEN
    PERFORM public.fn_owner_transfer_rules(v_kind, j_new, j_old);
  END IF;

  RETURN CASE WHEN v_kind='DELETE' THEN OLD ELSE NEW END;
END $$;


ALTER FUNCTION "public"."hub_router"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invitation_expires_at"("p_account_user_id" "uuid", "p_ttl_days" integer DEFAULT 7) RETURNS timestamp with time zone
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select au.created_at + make_interval(days => p_ttl_days)
  from public.account_users au
  where au.id = p_account_user_id
$$;


ALTER FUNCTION "public"."invitation_expires_at"("p_account_user_id" "uuid", "p_ttl_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invitation_is_expired"("p_account_user_id" "uuid", "p_ttl_days" integer DEFAULT 7) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select coalesce( now() > public.invitation_expires_at(p_account_user_id, p_ttl_days), true )
$$;


ALTER FUNCTION "public"."invitation_is_expired"("p_account_user_id" "uuid", "p_ttl_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_active"("p_account_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_users au
    WHERE au.account_id = p_account_id
      AND au.user_id    = p_user_id
      AND au.role       IN ('owner', 'admin')
      AND au.status     = 'active'
  );
$$;


ALTER FUNCTION "public"."is_admin_active"("p_account_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_active"("p_account_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_users au
    WHERE au.account_id = p_account_id
      AND au.user_id    = p_user_id
      AND au.status     = 'active'
  );
$$;


ALTER FUNCTION "public"."is_member_active"("p_account_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT (
    COALESCE((auth.jwt()->>'platform_admin')::boolean, false)
    OR auth.uid() = 'ce899cd2-5360-478e-817e-ee3690aabecd'::uuid
    OR is_super_admin()
  );
$$;


ALTER FUNCTION "public"."is_platform_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_service_role"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select coalesce((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role', false)
$$;


ALTER FUNCTION "public"."is_service_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  with claims as (select current_setting('request.jwt.claims', true)::json j)
  select  lower(coalesce(j->>'role','')) = 'super_admin'
     or  exists (select 1
                   from json_array_elements(coalesce(j->'app_metadata'->'roles','[]'::json)) x
                  where lower(coalesce(x::text,'')) in ('"super_admin"','super_admin'))
  from claims
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jsonb_diff_val"("j_old" "jsonb", "j_new" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_k text;
  v_out jsonb := '[]'::jsonb;
begin
  for v_k in
    with all_keys as (
      select jsonb_object_keys(coalesce(j_old, '{}'::jsonb)) as k
      union
      select jsonb_object_keys(coalesce(j_new, '{}'::jsonb)) as k
    )
    select k from all_keys
  loop
    if j_old->>v_k is distinct from j_new->>v_k then
      v_out := v_out || jsonb_build_object(
        v_k, jsonb_build_object('old', j_old->>v_k, 'new', j_new->>v_k)
      );
    end if;
  end loop;
  return v_out;
end
$$;


ALTER FUNCTION "public"."jsonb_diff_val"("j_old" "jsonb", "j_new" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"("p_account_id" "uuid", "p_table_name" "text", "p_record_id" "uuid", "p_action" "text", "p_user_id" "uuid", "p_changes_json" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  insert into public.audit_logs (
    account_id, table_name, record_id, action,
    user_id, actor_user_id, changes_json, ip_address, created_at
  )
  values (
    p_account_id,
    p_table_name,
    p_record_id,
    p_action,
    p_user_id,
    auth.uid(),
    p_changes_json,
    inet_client_addr(),
    now()
  );
exception when others then
  -- Não quebra a transação do app se a auditoria falhar
  raise notice 'audit log skipped: %', sqlerrm;
end;
$$;


ALTER FUNCTION "public"."log_audit"("p_account_id" "uuid", "p_table_name" "text", "p_record_id" "uuid", "p_action" "text", "p_user_id" "uuid", "p_changes_json" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_business_taxons_deterministic"("p_query" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("taxon_id" "uuid", "name" "text", "slug" "text", "level" "text", "parent_id" "uuid", "parent_name" "text", "matched_aliases" "text"[], "match_source" "text", "score" numeric)
    LANGUAGE "sql" STABLE PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  with params as (
    select
      p_query as q,
      public.normalize_taxon_match_text(p_query) as q_norm,
      greatest(1, least(coalesce(p_limit, 10), 50)) as limit_n
    where public.normalize_taxon_match_text(p_query) is not null
      and public.normalize_taxon_match_text(p_query) <> ''
  ),

  query_terms as (
    select
      q,
      q_norm,
      limit_n,
      websearch_to_tsquery('portuguese'::regconfig, q_norm) as tsq
    from params
  ),

  taxons as (
    select
      bt.id as taxon_id,
      bt.name,
      bt.slug,
      bt.level,
      bt.parent_id,
      parent.name as parent_name,
      public.normalize_taxon_match_text(bt.name) as name_norm,
      public.normalize_taxon_match_text(replace(bt.slug, '-', ' ')) as slug_norm,
      to_tsvector(
        'portuguese'::regconfig,
        public.normalize_taxon_match_text(bt.name) || ' ' || public.normalize_taxon_match_text(replace(bt.slug, '-', ' '))
      ) as search_vector
    from public.business_taxons bt
    left join public.business_taxons parent
      on parent.id = bt.parent_id
    where bt.is_active = true
  ),

  aliases as (
    select
      bta.id as alias_id,
      bta.taxon_id,
      bta.alias_text,
      bta.alias_text_normalized,
      to_tsvector('portuguese'::regconfig, bta.alias_text_normalized) as search_vector
    from public.business_taxon_aliases bta
    join public.business_taxons bt
      on bt.id = bta.taxon_id
    where bta.is_active = true
      and bt.is_active = true
  ),

  matches as (
    select
      a.taxon_id,
      'alias_exact'::text as match_source,
      1.00::numeric as score,
      10::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on btrim(a.alias_text) = btrim(q.q)

    union all

    select
      a.taxon_id,
      'alias_normalized'::text as match_source,
      0.98::numeric as score,
      20::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on a.alias_text_normalized = q.q_norm

    union all

    select
      t.taxon_id,
      'taxon_name_exact'::text as match_source,
      0.96::numeric as score,
      30::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on btrim(t.name) = btrim(q.q)

    union all

    select
      t.taxon_id,
      'taxon_name_normalized'::text as match_source,
      0.94::numeric as score,
      40::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on t.name_norm = q.q_norm

    union all

    select
      t.taxon_id,
      'taxon_slug_normalized'::text as match_source,
      0.92::numeric as score,
      50::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on t.slug_norm = q.q_norm

    union all

    select
      t.taxon_id,
      'fts'::text as match_source,
      round((0.70 + least(ts_rank_cd(t.search_vector, q.tsq)::numeric, 0.20))::numeric, 4) as score,
      60::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on t.search_vector @@ q.tsq

    union all

    select
      a.taxon_id,
      'fts'::text as match_source,
      round((0.70 + least(ts_rank_cd(a.search_vector, q.tsq)::numeric, 0.20))::numeric, 4) as score,
      60::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on a.search_vector @@ q.tsq

    union all

    select
      t.taxon_id,
      'trgm'::text as match_source,
      round(
        (
          0.50 + (
            greatest(
              similarity(t.name_norm, q.q_norm),
              similarity(t.slug_norm, q.q_norm)
            )::numeric * 0.30
          )
        )::numeric,
        4
      ) as score,
      70::integer as priority,
      null::text as matched_alias
    from query_terms q
    join taxons t
      on greatest(
        similarity(t.name_norm, q.q_norm),
        similarity(t.slug_norm, q.q_norm)
      ) >= 0.35

    union all

    select
      a.taxon_id,
      'trgm'::text as match_source,
      round((0.50 + (similarity(a.alias_text_normalized, q.q_norm)::numeric * 0.30))::numeric, 4) as score,
      70::integer as priority,
      a.alias_text as matched_alias
    from query_terms q
    join aliases a
      on similarity(a.alias_text_normalized, q.q_norm) >= 0.35
  ),

  candidate_scores as (
    select
      taxon_id,
      max(score) as score,
      min(priority) as best_priority,
      coalesce(
        array_remove(array_agg(distinct matched_alias), null),
        array[]::text[]
      ) as matched_aliases
    from matches
    group by taxon_id
  ),

  candidate_sources as (
    select
      taxon_id,
      string_agg(match_source, '+' order by priority) as match_source
    from (
      select
        taxon_id,
        match_source,
        min(priority) as priority
      from matches
      group by taxon_id, match_source
    ) s
    group by taxon_id
  )

  select
    t.taxon_id,
    t.name,
    t.slug,
    t.level,
    t.parent_id,
    t.parent_name,
    cs.matched_aliases,
    src.match_source,
    cs.score
  from candidate_scores cs
  join taxons t
    on t.taxon_id = cs.taxon_id
  join candidate_sources src
    on src.taxon_id = cs.taxon_id
  order by
    cs.best_priority asc,
    cs.score desc,
    case t.level
      when 'ultra_niche' then 1
      when 'niche' then 2
      when 'segment' then 3
      else 9
    end,
    t.name asc
  limit (select coalesce(max(limit_n), 0) from params);
$$;


ALTER FUNCTION "public"."match_business_taxons_deterministic"("p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_taxon_match_text"("input" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select btrim(
    regexp_replace(
      translate(
        lower(input),
        'áàãâäéèêëíìîïóòõôöúùûüçñ',
        'aaaaaeeeeiiiiooooouuuucn'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;


ALTER FUNCTION "public"."normalize_taxon_match_text"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."plan_limit_is_unlimited"("p_value" integer) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select coalesce(p_value = -1, false)
$$;


ALTER FUNCTION "public"."plan_limit_is_unlimited"("p_value" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."plan_limit_value"("p_value" integer) RETURNS bigint
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  -- retorna um número alto quando for ilimitado (-1), senão o próprio valor
  select case when p_value = -1 then 9223372036854775807 else p_value end
$$;


ALTER FUNCTION "public"."plan_limit_value"("p_value" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_last_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_count int;
  v_account uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND OLD.status = 'active' THEN
      v_account := OLD.account_id;
      SELECT COUNT(*) INTO v_count
      FROM public.account_users
      WHERE account_id = v_account
        AND user_id <> OLD.user_id
        AND role = 'owner'
        AND status = 'active';
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Operation blocked: cannot remove the last active owner of this account.';
      END IF;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_account := OLD.account_id;
    -- Vai deixar de ser owner ativo?
    IF (OLD.role = 'owner' AND OLD.status = 'active') AND
       (NEW.role IS DISTINCT FROM OLD.role AND NEW.role <> 'owner'
        OR NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'active') THEN
      SELECT COUNT(*) INTO v_count
      FROM public.account_users
      WHERE account_id = v_account
        AND user_id <> OLD.user_id
        AND role = 'owner'
        AND status = 'active';
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Operation blocked: cannot demote or deactivate the last active owner of this account.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END
$$;


ALTER FUNCTION "public"."protect_last_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_account_invite"("p_account_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_can boolean;
  v_row public.account_users%rowtype;
begin
  -- Autorização: admin/owner da account OU super_admin
  v_can := public.is_platform_admin() or public.has_account_min_role(p_account_id, 'admin');
  if not v_can then
    raise exception 'Sem permissão para revogar convites nesta conta.';
  end if;

  select * into v_row
  from public.account_users
  where account_id = p_account_id
    and user_id    = p_user_id
  for update;

  if not found then
    raise exception 'Vínculo/convite não encontrado.';
  end if;

  -- Se estava pendente, marca como 'revoked'; se ativo, marca como 'inactive'
  update public.account_users
     set status = case when v_row.status = 'pending' then 'revoked' else 'inactive' end
   where id = v_row.id;

  return true;
end;
$$;


ALTER FUNCTION "public"."revoke_account_invite"("p_account_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."role_rank"("p_role" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select case lower(trim(p_role))
           when 'owner'  then 4
           when 'admin'  then 3
           when 'editor' then 2
           when 'viewer' then 1
           else 0
         end;
$$;


ALTER FUNCTION "public"."role_rank"("p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_account_users_normalize_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  if new.role is not null then
    new.role := lower(new.role);
    if new.role = 'member' then
      new.role := 'viewer';
    end if;
  end if;
  if new.status is not null then
    new.status := lower(new.status);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."tg_account_users_normalize_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_guard_accounts_transfer_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  ok boolean;
begin
  if (tg_op = 'UPDATE') then
    if new.owner_user_id is distinct from old.owner_user_id then
      if new.owner_user_id is null then
        raise exception 'owner_user_id não pode ser nulo.';
      end if;

      -- O novo owner precisa já ser owner ativo na account (fluxo explícito)
      select exists (
        select 1
        from public.account_users au
        where au.account_id = new.id
          and au.user_id    = new.owner_user_id
          and au.status     = 'active'
          and lower(au.role)= 'owner'
      ) into ok;

      if not ok then
        raise exception 'Transferência inválida: o novo owner precisa estar como owner ativo em account_users.';
      end if;
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_guard_accounts_transfer_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_guard_last_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  other_owners int;
begin
  -- Caso DELETE de um vínculo owner ativo
  if (tg_op = 'DELETE') then
    if lower(coalesce(old.role,'')) = 'owner' and coalesce(old.status,'') = 'active' then
      select count(*) into other_owners
      from public.account_users au
      where au.account_id = old.account_id
        and au.user_id   <> old.user_id
        and au.status     = 'active'
        and lower(au.role)= 'owner';

      if other_owners = 0 then
        raise exception 'Não é permitido remover o último owner ativo. Transfira a propriedade antes.';
      end if;
    end if;
    return old;
  end if;

  -- Caso UPDATE que remova condição de owner ativo
  if (tg_op = 'UPDATE') then
    if lower(coalesce(old.role,'')) = 'owner' and coalesce(old.status,'') = 'active'
       and (
         lower(coalesce(new.role,'')) <> 'owner'
         or coalesce(new.status,'')   <> 'active'
       )
    then
      select count(*) into other_owners
      from public.account_users au
      where au.account_id = old.account_id
        and au.user_id   <> old.user_id
        and au.status     = 'active'
        and lower(au.role)= 'owner';

      if other_owners = 0 then
        raise exception 'Não é permitido remover/downgradear o último owner ativo. Transfira a propriedade antes.';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_guard_last_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_partner_accounts_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  if (tg_op = 'INSERT') then
    perform public.log_audit(
      new.account_id, 'partner_accounts', new.account_id, 'link_partner', null,
      jsonb_build_object('new', to_jsonb(new))
    );
    return new;
  elsif (tg_op = 'UPDATE') then
    perform public.log_audit(
      new.account_id, 'partner_accounts', new.account_id, 'update_link', null,
      jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
    );
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.log_audit(
      old.account_id, 'partner_accounts', old.account_id, 'unlink_partner', null,
      jsonb_build_object('old', to_jsonb(old))
    );
    return old;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."tg_partner_accounts_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_log_account_users"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_action text;
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb := to_jsonb(OLD);
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'insert';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  PERFORM public.fn_write_audit_log(
    'account_users',
    COALESCE(NEW.id, OLD.id),
    v_action,
    COALESCE(NEW.account_id, OLD.account_id),
    jsonb_build_object('new', v_new, 'old', v_old)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trg_log_account_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_log_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_action text;
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb := to_jsonb(OLD);
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'insert';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  PERFORM public.fn_write_audit_log(
    'accounts',
    COALESCE(NEW.id, OLD.id),
    v_action,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('new', v_new, 'old', v_old)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trg_log_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_log_partner_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_action text;
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb := to_jsonb(OLD);
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'insert';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'delete';
  END IF;

  PERFORM public.fn_write_audit_log(
    'partner_accounts',
    COALESCE(NEW.partner_id, OLD.partner_id),  -- PK composta; registramos o partner_id como referência principal
    v_action,
    COALESCE(NEW.account_id, OLD.account_id),
    jsonb_build_object('new', v_new, 'old', v_old)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trg_log_partner_accounts"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_niche_resolutions" (
    "account_id" "uuid" NOT NULL,
    "raw_input" "text" NOT NULL,
    "selected_taxon_id" "uuid",
    "confidence" "text" NOT NULL,
    "should_use_deterministic_match" boolean DEFAULT false NOT NULL,
    "should_escalate_to_ai" boolean DEFAULT false NOT NULL,
    "ai_escalation_mode" "text" NOT NULL,
    "needs_admin_review" boolean DEFAULT false NOT NULL,
    "reason" "text" NOT NULL,
    "resolution_status" "text" NOT NULL,
    "match_source" "text",
    "score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ai_status" "text",
    "ai_error_code" "text",
    "ai_model" "text",
    "ai_schema_version" "text",
    "ai_result_json" "jsonb",
    "ai_ux_mode" "text",
    "ai_suggested_taxon_id" "uuid",
    "ai_suggested_new_taxon_label" "text",
    "ai_needs_user_confirmation" boolean DEFAULT false NOT NULL,
    "ai_needs_admin_review" boolean DEFAULT false NOT NULL,
    "ai_reason" "text",
    "ai_processed_at" timestamp with time zone,
    "user_resolution_status" "text",
    "user_selected_taxon_id" "uuid",
    "user_confirmed_at" timestamp with time zone,
    "user_rejected_at" timestamp with time zone,
    "user_rewrite_input" "text",
    "user_dismissed_at" timestamp with time zone,
    CONSTRAINT "account_niche_resolutions_ai_escalation_mode_chk" CHECK (("ai_escalation_mode" = ANY (ARRAY['none'::"text", 'rerank_candidates'::"text", 'infer_existing_segment'::"text", 'suggest_alias_for_review'::"text", 'suggest_new_taxon_for_review'::"text"]))),
    CONSTRAINT "account_niche_resolutions_ai_result_json_chk" CHECK ((("ai_result_json" IS NULL) OR ("jsonb_typeof"("ai_result_json") = 'object'::"text"))),
    CONSTRAINT "account_niche_resolutions_ai_status_chk" CHECK ((("ai_status" IS NULL) OR ("ai_status" = ANY (ARRAY['skipped'::"text", 'resolved'::"text", 'failed'::"text"])))),
    CONSTRAINT "account_niche_resolutions_ai_ux_mode_chk" CHECK ((("ai_ux_mode" IS NULL) OR ("ai_ux_mode" = ANY (ARRAY['none'::"text", 'confirm_single'::"text", 'choose_from_options'::"text", 'fallback_review'::"text"])))),
    CONSTRAINT "account_niche_resolutions_confidence_chk" CHECK (("confidence" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "account_niche_resolutions_raw_input_chk" CHECK (("btrim"("raw_input") <> ''::"text")),
    CONSTRAINT "account_niche_resolutions_reason_chk" CHECK (("reason" = ANY (ARRAY['no_candidates'::"text", 'high_confidence_strong_match'::"text", 'medium_confidence_close_candidates'::"text", 'medium_confidence_below_high_threshold'::"text", 'medium_confidence_weak_match_source'::"text", 'low_confidence_insufficient_score'::"text"]))),
    CONSTRAINT "account_niche_resolutions_resolution_status_chk" CHECK (("resolution_status" = ANY (ARRAY['deterministic_high_confidence'::"text", 'review_required'::"text", 'unclassified'::"text"]))),
    CONSTRAINT "account_niche_resolutions_score_chk" CHECK ((("score" IS NULL) OR (("score" >= (0)::numeric) AND ("score" <= (1)::numeric)))),
    CONSTRAINT "account_niche_resolutions_user_resolution_status_chk" CHECK ((("user_resolution_status" IS NULL) OR ("user_resolution_status" = ANY (ARRAY['pending_confirmation'::"text", 'confirmed'::"text", 'rejected'::"text", 'rewritten'::"text", 'dismissed'::"text"])))),
    CONSTRAINT "account_niche_resolutions_user_rewrite_input_chk" CHECK ((("user_rewrite_input" IS NULL) OR ("btrim"("user_rewrite_input") <> ''::"text")))
);


ALTER TABLE "public"."account_niche_resolutions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_profiles" (
    "account_id" "uuid" NOT NULL,
    "niche" "text",
    "preferred_channel" "text" DEFAULT 'email'::"text" NOT NULL,
    "whatsapp" "text",
    "site_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "account_profiles_preferred_channel_chk" CHECK (("preferred_channel" = ANY (ARRAY['email'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."account_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_taxonomy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "taxon_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "status" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "account_taxonomy_source_type_chk" CHECK (("source_type" = ANY (ARRAY['manual'::"text", 'taxonomy_match'::"text", 'user_confirmed_ai'::"text"]))),
    CONSTRAINT "account_taxonomy_status_chk" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."account_taxonomy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text",
    "invited_by" "uuid",
    CONSTRAINT "account_users_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text", 'viewer'::"text"]))),
    CONSTRAINT "account_users_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."account_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "plan_id" "uuid",
    "subdomain" "text",
    "domain" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_user_id" "uuid",
    "status" "text" DEFAULT 'pending_setup'::"text" NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "branding_config" "jsonb" DEFAULT '{}'::"jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "slug" "text",
    "setup_completed_at" timestamp with time zone,
    CONSTRAINT "accounts_domain_no_vercel_preview" CHECK ((("domain" IS NULL) OR ("domain" !~* '\.vercel\.app$'::"text"))),
    CONSTRAINT "accounts_status_chk" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'pending_setup'::"text"]))),
    CONSTRAINT "accounts_subdomain_format_chk" CHECK (("subdomain" ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'::"text")),
    CONSTRAINT "accounts_subdomain_lower_chk" CHECK (("subdomain" = "lower"("subdomain")))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" character varying NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" character varying NOT NULL,
    "user_id" "uuid",
    "changes_json" "jsonb",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_id" "uuid",
    "actor_user_id" "uuid",
    "event" "text",
    CONSTRAINT "audit_logs_action_check" CHECK ((("action")::"text" = ANY (ARRAY[('insert'::character varying)::"text", ('update'::character varying)::"text", ('delete'::character varying)::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_taxon_aliases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "taxon_id" "uuid" NOT NULL,
    "alias_text" "text" NOT NULL,
    "alias_text_normalized" "text" GENERATED ALWAYS AS ("btrim"("regexp_replace"("translate"("lower"("alias_text"), 'áàãâäéèêëíìîïóòõôöúùûüçñ'::"text", 'aaaaaeeeeiiiiooooouuuucn'::"text"), '\s+'::"text", ' '::"text", 'g'::"text"))) STORED,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."business_taxon_aliases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_taxons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "level" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "business_taxons_level_chk" CHECK (("level" = ANY (ARRAY['segment'::"text", 'niche'::"text", 'ultra_niche'::"text"])))
);


ALTER TABLE "public"."business_taxons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_template_taxons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "taxon_id" "uuid" NOT NULL,
    "resolution_level" "text" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_template_taxons_resolution_level_chk" CHECK (("resolution_level" = ANY (ARRAY['generic'::"text", 'segment'::"text", 'niche'::"text", 'ultra_niche'::"text"])))
);


ALTER TABLE "public"."content_template_taxons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "template_family" "text" NOT NULL,
    "template_scope" "text" NOT NULL,
    "status" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "payload_json" "jsonb" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_templates_status_chk" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"]))),
    CONSTRAINT "content_templates_template_family_chk" CHECK (("template_family" = ANY (ARRAY['commercial_activation'::"text", 'landing_page'::"text"]))),
    CONSTRAINT "content_templates_template_scope_chk" CHECK (("template_scope" = ANY (ARRAY['page'::"text", 'section'::"text"])))
);


ALTER TABLE "public"."content_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_accounts" (
    "partner_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "commission_percent" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_partner_accounts_role" CHECK (("role" = ANY (ARRAY['client'::"text", 'reseller'::"text", 'affiliate'::"text"])))
);


ALTER TABLE "public"."partner_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "parent_id" "uuid",
    "client_id" "uuid",
    "email" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_domain" "text",
    "branding_config" "jsonb" DEFAULT '{}'::"jsonb",
    "commission_percent" numeric(5,2) DEFAULT 0.00,
    CONSTRAINT "check_partners_status" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"]))),
    CONSTRAINT "check_partners_type" CHECK (("type" = ANY (ARRAY['agency'::"text", 'reseller'::"text", 'affiliate'::"text"])))
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_lps" integer DEFAULT 0,
    "max_conversions" integer DEFAULT 0,
    "price_monthly" numeric(10,2) DEFAULT 0.00,
    "features" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."taxon_market_research" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "taxon_id" "uuid" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "research_block" "text" NOT NULL,
    "audience_scope" "text" NOT NULL,
    CONSTRAINT "taxon_market_research_audience_scope_chk" CHECK (("audience_scope" = ANY (ARRAY['end_customer'::"text", 'business_buyer'::"text"]))),
    CONSTRAINT "taxon_market_research_status_chk" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."taxon_market_research" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."taxon_market_research_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "research_id" "uuid" NOT NULL,
    "item_text" "text" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "item_key" "text" NOT NULL,
    "sort_order" integer DEFAULT 999 NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."taxon_market_research_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."taxon_message_guides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "research_id" "uuid" NOT NULL,
    "context_type" "text" NOT NULL,
    "guide_payload_json" "jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "taxon_message_guides_context_type_chk" CHECK (("context_type" = ANY (ARRAY['e10_5'::"text", 'landing_page'::"text", 'email'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."taxon_message_guides" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_access_context_v2" WITH ("security_invoker"='true') AS
 SELECT "a"."id" AS "account_id",
    "a"."subdomain" AS "account_key",
    "a"."status" AS "account_status",
    "au"."user_id",
    "au"."role" AS "member_role",
    "au"."status" AS "member_status",
    COALESCE((("a"."status" = ANY (ARRAY['active'::"text", 'pending_setup'::"text"])) AND ("au"."status" = 'active'::"text")), false) AS "allow",
        CASE
            WHEN (NOT ("a"."status" = ANY (ARRAY['active'::"text", 'pending_setup'::"text"]))) THEN 'account_blocked'::"text"
            WHEN ("au"."user_id" IS NULL) THEN 'no_membership'::"text"
            WHEN ("au"."status" <> 'active'::"text") THEN 'member_inactive'::"text"
            ELSE NULL::"text"
        END AS "reason",
    "a"."name" AS "account_name",
    "a"."setup_completed_at" AS "account_setup_completed_at"
   FROM ("public"."accounts" "a"
     LEFT JOIN "public"."account_users" "au" ON ((("au"."account_id" = "a"."id") AND ("au"."user_id" = "auth"."uid"()))));


ALTER VIEW "public"."v_access_context_v2" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_account_effective_limits" WITH ("security_invoker"='true') AS
 SELECT "a"."id" AS "account_id",
    "a"."name" AS "account_name",
    "a"."status" AS "account_status",
    "a"."subdomain",
    "a"."domain",
    "a"."plan_id",
    "p"."name" AS "plan_name",
    "p"."price_monthly",
    "p"."features" AS "plan_features",
    "p"."max_lps",
    "p"."max_conversions",
    "public"."plan_limit_is_unlimited"("p"."max_lps") AS "max_lps_unlimited",
    "public"."plan_limit_value"("p"."max_lps") AS "max_lps_effective",
    "public"."plan_limit_is_unlimited"("p"."max_conversions") AS "max_conversions_unlimited",
    "public"."plan_limit_value"("p"."max_conversions") AS "max_conversions_effective",
    "a"."created_at",
    "a"."updated_at"
   FROM ("public"."accounts" "a"
     JOIN "public"."plans" "p" ON (("p"."id" = "a"."plan_id")));


ALTER VIEW "public"."v_account_effective_limits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_account_effective_limits_secure" WITH ("security_invoker"='true') AS
 SELECT "account_id",
    "account_name",
    "account_status",
    "subdomain",
    "domain",
    "plan_id",
    "plan_name",
    "price_monthly",
    "plan_features",
    "max_lps",
    "max_conversions",
    "max_lps_unlimited",
    "max_lps_effective",
    "max_conversions_unlimited",
    "max_conversions_effective",
    "created_at",
    "updated_at"
   FROM "public"."v_account_effective_limits" "v"
  WHERE ("public"."is_platform_admin"() OR "public"."is_member_active"("account_id", "auth"."uid"()));


ALTER VIEW "public"."v_account_effective_limits_secure" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_audit_logs_norm" WITH ("security_invoker"='true') AS
 SELECT "id",
    "table_name" AS "entity",
    "record_id" AS "entity_id",
    "action",
    "changes_json" AS "diff",
    "account_id",
    "actor_user_id",
    "ip_address",
    "created_at"
   FROM "public"."audit_logs" "al";


ALTER VIEW "public"."v_audit_logs_norm" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_user_accounts_list" WITH ("security_invoker"='true') AS
 SELECT "v"."account_id",
    "v"."account_name",
    "v"."account_key" AS "account_subdomain",
    "v"."account_status",
    "v"."member_role",
    "v"."member_status",
    "a"."created_at"
   FROM ("public"."v_access_context_v2" "v"
     JOIN "public"."accounts" "a" ON (("a"."id" = "v"."account_id")))
  WHERE (("v"."allow" = true) AND ("v"."user_id" = "auth"."uid"()));


ALTER VIEW "public"."v_user_accounts_list" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_user_accounts_list" IS 'Lista de contas acessíveis ao usuário autenticado (derivada de v_access_context_v2; executa com security_invoker).';



ALTER TABLE ONLY "public"."account_niche_resolutions"
    ADD CONSTRAINT "account_niche_resolutions_pkey" PRIMARY KEY ("account_id");



ALTER TABLE ONLY "public"."account_profiles"
    ADD CONSTRAINT "account_profiles_pkey" PRIMARY KEY ("account_id");



ALTER TABLE ONLY "public"."account_taxonomy"
    ADD CONSTRAINT "account_taxonomy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_account_user_unique" UNIQUE ("account_id", "user_id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_domain_unique" UNIQUE ("domain");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_subdomain_unique" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_taxon_aliases"
    ADD CONSTRAINT "business_taxon_aliases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_taxons"
    ADD CONSTRAINT "business_taxons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_template_taxons"
    ADD CONSTRAINT "content_template_taxons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_templates"
    ADD CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_accounts"
    ADD CONSTRAINT "partner_accounts_pkey" PRIMARY KEY ("partner_id", "account_id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taxon_market_research_items"
    ADD CONSTRAINT "taxon_market_research_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taxon_market_research"
    ADD CONSTRAINT "taxon_market_research_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taxon_message_guides"
    ADD CONSTRAINT "taxon_message_guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "unique_plans_name" UNIQUE ("name");



CREATE INDEX "account_niche_resolutions_ai_suggested_taxon_id_idx" ON "public"."account_niche_resolutions" USING "btree" ("ai_suggested_taxon_id");



CREATE INDEX "account_niche_resolutions_selected_taxon_id_idx" ON "public"."account_niche_resolutions" USING "btree" ("selected_taxon_id");



CREATE INDEX "account_niche_resolutions_user_selected_taxon_id_idx" ON "public"."account_niche_resolutions" USING "btree" ("user_selected_taxon_id");



CREATE INDEX "account_taxonomy_account_id_idx" ON "public"."account_taxonomy" USING "btree" ("account_id");



CREATE UNIQUE INDEX "account_taxonomy_account_taxon_uidx" ON "public"."account_taxonomy" USING "btree" ("account_id", "taxon_id");



CREATE INDEX "account_taxonomy_taxon_id_idx" ON "public"."account_taxonomy" USING "btree" ("taxon_id");



CREATE INDEX "accounts_name_gin_idx" ON "public"."accounts" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", "name"));



CREATE INDEX "business_taxon_aliases_alias_text_normalized_fts_gin_idx" ON "public"."business_taxon_aliases" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", "alias_text_normalized"));



CREATE INDEX "business_taxon_aliases_alias_text_normalized_idx" ON "public"."business_taxon_aliases" USING "btree" ("alias_text_normalized");



CREATE INDEX "business_taxon_aliases_alias_text_normalized_trgm_gin_idx" ON "public"."business_taxon_aliases" USING "gin" ("alias_text_normalized" "extensions"."gin_trgm_ops");



CREATE UNIQUE INDEX "business_taxon_aliases_taxon_alias_norm_uidx" ON "public"."business_taxon_aliases" USING "btree" ("taxon_id", "alias_text_normalized");



CREATE INDEX "business_taxon_aliases_taxon_id_idx" ON "public"."business_taxon_aliases" USING "btree" ("taxon_id");



CREATE INDEX "business_taxons_level_idx" ON "public"."business_taxons" USING "btree" ("level");



CREATE INDEX "business_taxons_name_normalized_idx" ON "public"."business_taxons" USING "btree" ("public"."normalize_taxon_match_text"("name"));



CREATE INDEX "business_taxons_name_normalized_trgm_gin_idx" ON "public"."business_taxons" USING "gin" ("public"."normalize_taxon_match_text"("name") "extensions"."gin_trgm_ops");



CREATE INDEX "business_taxons_name_slug_fts_gin_idx" ON "public"."business_taxons" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", (("public"."normalize_taxon_match_text"("name") || ' '::"text") || "public"."normalize_taxon_match_text"("replace"("slug", '-'::"text", ' '::"text")))));



CREATE INDEX "business_taxons_parent_id_idx" ON "public"."business_taxons" USING "btree" ("parent_id");



CREATE INDEX "business_taxons_slug_normalized_idx" ON "public"."business_taxons" USING "btree" ("public"."normalize_taxon_match_text"("replace"("slug", '-'::"text", ' '::"text")));



CREATE INDEX "business_taxons_slug_normalized_trgm_gin_idx" ON "public"."business_taxons" USING "gin" ("public"."normalize_taxon_match_text"("replace"("slug", '-'::"text", ' '::"text")) "extensions"."gin_trgm_ops");



CREATE UNIQUE INDEX "business_taxons_slug_uidx" ON "public"."business_taxons" USING "btree" ("slug");



CREATE INDEX "content_template_taxons_taxon_id_idx" ON "public"."content_template_taxons" USING "btree" ("taxon_id");



CREATE INDEX "content_template_taxons_template_id_idx" ON "public"."content_template_taxons" USING "btree" ("template_id");



CREATE UNIQUE INDEX "content_templates_slug_uidx" ON "public"."content_templates" USING "btree" ("slug");



CREATE UNIQUE INDEX "content_templates_template_key_uidx" ON "public"."content_templates" USING "btree" ("template_key");



CREATE INDEX "idx_account_users_active_user_account" ON "public"."account_users" USING "btree" ("user_id", "account_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_accounts_plan_id" ON "public"."accounts" USING "btree" ("plan_id");



CREATE INDEX "idx_accounts_status" ON "public"."accounts" USING "btree" ("status");



CREATE INDEX "idx_audit_logs_account_created" ON "public"."audit_logs" USING "btree" ("account_id", "created_at" DESC);



CREATE UNIQUE INDEX "idx_one_owner_per_account" ON "public"."account_users" USING "btree" ("account_id") WHERE (("lower"("role") = 'owner'::"text") AND ("status" = 'active'::"text"));



CREATE INDEX "idx_partner_accounts_account_partner" ON "public"."partner_accounts" USING "btree" ("account_id", "partner_id");



CREATE UNIQUE INDEX "idx_partner_accounts_account_partner_unique" ON "public"."partner_accounts" USING "btree" ("account_id", "partner_id");



CREATE INDEX "taxon_market_research_items_research_id_idx" ON "public"."taxon_market_research_items" USING "btree" ("research_id");



CREATE UNIQUE INDEX "taxon_market_research_one_active_per_block_audience_uidx" ON "public"."taxon_market_research" USING "btree" ("taxon_id", "research_block", "audience_scope") WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "taxon_market_research_taxon_block_audience_version_uidx" ON "public"."taxon_market_research" USING "btree" ("taxon_id", "research_block", "audience_scope", "version");



CREATE INDEX "taxon_market_research_taxon_id_idx" ON "public"."taxon_market_research" USING "btree" ("taxon_id");



CREATE INDEX "taxon_message_guides_research_id_idx" ON "public"."taxon_message_guides" USING "btree" ("research_id");



CREATE UNIQUE INDEX "uq_accounts_slug_ci" ON "public"."accounts" USING "btree" ("lower"("slug")) WHERE ("slug" IS NOT NULL);



CREATE OR REPLACE TRIGGER "account_niche_resolutions_set_updated_at" BEFORE UPDATE ON "public"."account_niche_resolutions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "tg_account_users_hub" BEFORE INSERT OR DELETE OR UPDATE ON "public"."account_users" FOR EACH ROW EXECUTE FUNCTION "public"."hub_router"();



CREATE OR REPLACE TRIGGER "tg_accounts_hub" BEFORE INSERT OR DELETE OR UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."hub_router"();



CREATE OR REPLACE TRIGGER "tg_partner_accounts_hub" BEFORE INSERT OR DELETE OR UPDATE ON "public"."partner_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."hub_router"();



CREATE OR REPLACE TRIGGER "trg_account_users_guard_last_owner" BEFORE DELETE OR UPDATE ON "public"."account_users" FOR EACH ROW EXECUTE FUNCTION "public"."tg_guard_last_owner"();

ALTER TABLE "public"."account_users" DISABLE TRIGGER "trg_account_users_guard_last_owner";



CREATE OR REPLACE TRIGGER "trg_account_users_normalize_role" BEFORE INSERT OR UPDATE ON "public"."account_users" FOR EACH ROW EXECUTE FUNCTION "public"."tg_account_users_normalize_role"();

ALTER TABLE "public"."account_users" DISABLE TRIGGER "trg_account_users_normalize_role";



CREATE OR REPLACE TRIGGER "trg_accounts_guard_transfer_owner" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_guard_accounts_transfer_owner"();

ALTER TABLE "public"."accounts" DISABLE TRIGGER "trg_accounts_guard_transfer_owner";



CREATE OR REPLACE TRIGGER "trg_accounts_set_updated_at" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

ALTER TABLE "public"."accounts" DISABLE TRIGGER "trg_accounts_set_updated_at";



CREATE OR REPLACE TRIGGER "trg_audit_account_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."account_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_account_users"();

ALTER TABLE "public"."account_users" DISABLE TRIGGER "trg_audit_account_users";



CREATE OR REPLACE TRIGGER "trg_audit_accounts" AFTER INSERT OR DELETE OR UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_accounts"();

ALTER TABLE "public"."accounts" DISABLE TRIGGER "trg_audit_accounts";



CREATE OR REPLACE TRIGGER "trg_audit_partner_accounts" AFTER INSERT OR DELETE OR UPDATE ON "public"."partner_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_partner_accounts"();

ALTER TABLE "public"."partner_accounts" DISABLE TRIGGER "trg_audit_partner_accounts";



CREATE OR REPLACE TRIGGER "trg_partner_accounts_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."partner_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_partner_accounts_audit"();

ALTER TABLE "public"."partner_accounts" DISABLE TRIGGER "trg_partner_accounts_audit";



CREATE OR REPLACE TRIGGER "trg_protect_last_owner" BEFORE DELETE OR UPDATE ON "public"."account_users" FOR EACH ROW EXECUTE FUNCTION "public"."protect_last_owner"();

ALTER TABLE "public"."account_users" DISABLE TRIGGER "trg_protect_last_owner";



ALTER TABLE ONLY "public"."account_niche_resolutions"
    ADD CONSTRAINT "account_niche_resolutions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_niche_resolutions"
    ADD CONSTRAINT "account_niche_resolutions_ai_suggested_taxon_id_fkey" FOREIGN KEY ("ai_suggested_taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."account_niche_resolutions"
    ADD CONSTRAINT "account_niche_resolutions_selected_taxon_id_fkey" FOREIGN KEY ("selected_taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."account_niche_resolutions"
    ADD CONSTRAINT "account_niche_resolutions_user_selected_taxon_id_fkey" FOREIGN KEY ("user_selected_taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."account_profiles"
    ADD CONSTRAINT "account_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_taxonomy"
    ADD CONSTRAINT "account_taxonomy_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_taxonomy"
    ADD CONSTRAINT "account_taxonomy_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."account_users"
    ADD CONSTRAINT "account_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."business_taxon_aliases"
    ADD CONSTRAINT "business_taxon_aliases_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."business_taxons"
    ADD CONSTRAINT "business_taxons_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_template_taxons"
    ADD CONSTRAINT "content_template_taxons_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."content_template_taxons"
    ADD CONSTRAINT "content_template_taxons_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."content_templates"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_accounts"
    ADD CONSTRAINT "partner_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."partner_accounts"
    ADD CONSTRAINT "partner_accounts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."taxon_market_research_items"
    ADD CONSTRAINT "taxon_market_research_items_research_id_fkey" FOREIGN KEY ("research_id") REFERENCES "public"."taxon_market_research"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."taxon_market_research"
    ADD CONSTRAINT "taxon_market_research_taxon_id_fkey" FOREIGN KEY ("taxon_id") REFERENCES "public"."business_taxons"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."taxon_message_guides"
    ADD CONSTRAINT "taxon_message_guides_research_id_fkey" FOREIGN KEY ("research_id") REFERENCES "public"."taxon_market_research"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."account_niche_resolutions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_niche_resolutions_delete_admin_only" ON "public"."account_niche_resolutions" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "account_niche_resolutions_insert_admin_only" ON "public"."account_niche_resolutions" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "account_niche_resolutions_select_admin_only" ON "public"."account_niche_resolutions" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "account_niche_resolutions_update_admin_only" ON "public"."account_niche_resolutions" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."account_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_profiles_insert_owner_admin_or_platform" ON "public"."account_profiles" FOR INSERT WITH CHECK ((COALESCE("public"."is_platform_admin"(), false) OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "account_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()) AND ("au"."status" = 'active'::"text") AND ("au"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "account_profiles_select_member_or_platform" ON "public"."account_profiles" FOR SELECT USING ((COALESCE("public"."is_platform_admin"(), false) OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "account_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()) AND ("au"."status" = 'active'::"text"))))));



CREATE POLICY "account_profiles_update_owner_admin_or_platform" ON "public"."account_profiles" FOR UPDATE USING ((COALESCE("public"."is_platform_admin"(), false) OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "account_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()) AND ("au"."status" = 'active'::"text") AND ("au"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))))) WITH CHECK ((COALESCE("public"."is_platform_admin"(), false) OR (EXISTS ( SELECT 1
   FROM "public"."account_users" "au"
  WHERE (("au"."account_id" = "account_profiles"."account_id") AND ("au"."user_id" = "auth"."uid"()) AND ("au"."status" = 'active'::"text") AND ("au"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



ALTER TABLE "public"."account_taxonomy" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_taxonomy_delete_admin_only" ON "public"."account_taxonomy" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "account_taxonomy_insert_admin_only" ON "public"."account_taxonomy" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "account_taxonomy_select_admin_only" ON "public"."account_taxonomy" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "account_taxonomy_update_admin_only" ON "public"."account_taxonomy" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."account_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_users_delete_by_admins" ON "public"."account_users" FOR DELETE USING (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "account_users_insert_by_admins" ON "public"."account_users" FOR INSERT WITH CHECK (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "account_users_select_self_or_admin" ON "public"."account_users" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "account_users_update_by_admins" ON "public"."account_users" FOR UPDATE USING (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_delete_by_admins" ON "public"."accounts" FOR DELETE USING (("public"."is_admin_active"("id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "accounts_insert_owner_only" ON "public"."accounts" FOR INSERT WITH CHECK ((("owner_user_id" = "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "accounts_select_active_members" ON "public"."accounts" FOR SELECT USING (("public"."is_member_active"("id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "accounts_update_by_admins" ON "public"."accounts" FOR UPDATE USING (("public"."is_admin_active"("id", "auth"."uid"()) OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_admin_active"("id", "auth"."uid"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_taxon_aliases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_taxon_aliases_delete_admin_only" ON "public"."business_taxon_aliases" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "business_taxon_aliases_insert_admin_only" ON "public"."business_taxon_aliases" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "business_taxon_aliases_select_admin_only" ON "public"."business_taxon_aliases" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "business_taxon_aliases_update_admin_only" ON "public"."business_taxon_aliases" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."business_taxons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_taxons_delete_admin_only" ON "public"."business_taxons" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "business_taxons_insert_admin_only" ON "public"."business_taxons" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "business_taxons_select_admin_only" ON "public"."business_taxons" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "business_taxons_update_admin_only" ON "public"."business_taxons" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."content_template_taxons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_template_taxons_delete_admin_only" ON "public"."content_template_taxons" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "content_template_taxons_insert_admin_only" ON "public"."content_template_taxons" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "content_template_taxons_select_admin_only" ON "public"."content_template_taxons" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "content_template_taxons_update_admin_only" ON "public"."content_template_taxons" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."content_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_templates_delete_admin_only" ON "public"."content_templates" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "content_templates_insert_admin_only" ON "public"."content_templates" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "content_templates_select_admin_only" ON "public"."content_templates" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "content_templates_update_admin_only" ON "public"."content_templates" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "pa_delete_admin_or_platform" ON "public"."partner_accounts" FOR DELETE USING (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "pa_insert_admin_or_platform" ON "public"."partner_accounts" FOR INSERT WITH CHECK (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "pa_select_admin_or_platform" ON "public"."partner_accounts" FOR SELECT USING (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



CREATE POLICY "pa_update_admin_or_platform" ON "public"."partner_accounts" FOR UPDATE USING (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_admin_active"("account_id", "auth"."uid"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."partner_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partners: readable by linked accounts" ON "public"."partners" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."partner_accounts" "pa"
     JOIN "public"."account_users" "au" ON (("pa"."account_id" = "au"."account_id")))
  WHERE (("pa"."partner_id" = "partners"."id") AND ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "partners_modify_super_admin_only" ON "public"."partners" USING ("public"."is_platform_admin"()) WITH CHECK ("public"."is_platform_admin"());



CREATE POLICY "partners_select_super_admin_only" ON "public"."partners" FOR SELECT USING ("public"."is_platform_admin"());



ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_select_auth" ON "public"."plans" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") OR "public"."is_platform_admin"()));



CREATE POLICY "read_own_account_or_platform_admin" ON "public"."audit_logs" FOR SELECT USING (("public"."is_platform_admin"() OR ("account_id" IN ( SELECT "account_users"."account_id"
   FROM "public"."account_users"
  WHERE (("account_users"."user_id" = "auth"."uid"()) AND ("account_users"."status" = 'active'::"text"))))));



ALTER TABLE "public"."taxon_market_research" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "taxon_market_research_delete_admin_only" ON "public"."taxon_market_research" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_market_research_insert_admin_only" ON "public"."taxon_market_research" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."taxon_market_research_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "taxon_market_research_items_delete_admin_only" ON "public"."taxon_market_research_items" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_market_research_items_insert_admin_only" ON "public"."taxon_market_research_items" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_market_research_items_select_admin_only" ON "public"."taxon_market_research_items" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_market_research_items_update_admin_only" ON "public"."taxon_market_research_items" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_market_research_select_admin_only" ON "public"."taxon_market_research" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_market_research_update_admin_only" ON "public"."taxon_market_research" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



ALTER TABLE "public"."taxon_message_guides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "taxon_message_guides_delete_admin_only" ON "public"."taxon_message_guides" FOR DELETE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_message_guides_insert_admin_only" ON "public"."taxon_message_guides" FOR INSERT WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_message_guides_select_admin_only" ON "public"."taxon_message_guides" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



CREATE POLICY "taxon_message_guides_update_admin_only" ON "public"."taxon_message_guides" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."is_platform_admin"())) WITH CHECK (("public"."is_super_admin"() OR "public"."is_platform_admin"()));



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";
GRANT USAGE ON SCHEMA "public" TO "service_role";






GRANT ALL ON FUNCTION "public"."accept_account_invite"("p_account_id" "uuid", "p_ttl_days" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."activate_user_from_auth_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."activate_user_from_auth_hook"("event" "jsonb") TO "supabase_auth_admin";









GRANT ALL ON FUNCTION "public"."audit_context_event"("p_event" "text", "p_entity" "text", "p_entity_id" "uuid", "p_diff" "jsonb", "p_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_context_event"("p_event" "text", "p_entity" "text", "p_entity_id" "uuid", "p_diff" "jsonb", "p_account_id" "uuid") TO "service_role";






REVOKE ALL ON FUNCTION "public"."ensure_first_account_for_current_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_first_account_for_current_user"() TO "authenticated";















GRANT ALL ON FUNCTION "public"."get_account_effective_limits"("p_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_effective_limits"("p_account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_account_min_role"("p_account_id" "uuid", "p_min_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_account_min_role"("p_account_id" "uuid", "p_min_role" "text") TO "anon";






GRANT ALL ON FUNCTION "public"."invitation_expires_at"("p_account_user_id" "uuid", "p_ttl_days" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."invitation_is_expired"("p_account_user_id" "uuid", "p_ttl_days" integer) TO "authenticated";









GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "service_role";









GRANT ALL ON FUNCTION "public"."jsonb_diff_val"("j_old" "jsonb", "j_new" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."jsonb_diff_val"("j_old" "jsonb", "j_new" "jsonb") TO "service_role";






REVOKE ALL ON FUNCTION "public"."match_business_taxons_deterministic"("p_query" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."match_business_taxons_deterministic"("p_query" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."normalize_taxon_match_text"("input" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."normalize_taxon_match_text"("input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."plan_limit_is_unlimited"("p_value" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."plan_limit_value"("p_value" integer) TO "authenticated";






GRANT ALL ON FUNCTION "public"."revoke_account_invite"("p_account_id" "uuid", "p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."role_rank"("p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."role_rank"("p_role" "text") TO "anon";



























GRANT SELECT,INSERT,UPDATE ON TABLE "public"."account_niche_resolutions" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."account_profiles" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."account_profiles" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."account_taxonomy" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."account_users" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."accounts" TO "authenticated";
GRANT SELECT,UPDATE ON TABLE "public"."accounts" TO "service_role";



GRANT SELECT ON TABLE "public"."audit_logs" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."business_taxon_aliases" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."business_taxons" TO "service_role";









GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."partner_accounts" TO "authenticated";






GRANT SELECT ON TABLE "public"."plans" TO "authenticated";



GRANT SELECT ON TABLE "public"."taxon_market_research" TO "service_role";



GRANT SELECT ON TABLE "public"."taxon_market_research_items" TO "service_role";






GRANT SELECT ON TABLE "public"."v_access_context_v2" TO "authenticated";
GRANT SELECT ON TABLE "public"."v_access_context_v2" TO "service_role";



GRANT SELECT ON TABLE "public"."v_account_effective_limits" TO "authenticated";



GRANT SELECT ON TABLE "public"."v_account_effective_limits_secure" TO "authenticated";
GRANT SELECT ON TABLE "public"."v_account_effective_limits_secure" TO "service_role";






GRANT SELECT ON TABLE "public"."v_user_accounts_list" TO "authenticated";











commit;
