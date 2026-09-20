do $$
declare
  target_table regclass := to_regclass('public.user_identity_preferences');
begin
  if target_table is null then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_MISSING';
  end if;

  if not (select relrowsecurity from pg_class where oid = target_table)
     or exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'user_identity_preferences'
     ) then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_RLS_INVALID';
  end if;

  if exists (
    select 1
    from pg_class table_object
    left join lateral (
      select
        array_agg(distinct privilege.privilege_type order by privilege.privilege_type) as privileges,
        bool_or(privilege.is_grantable) as has_grant_option
      from aclexplode(
        coalesce(table_object.relacl, acldefault('r', table_object.relowner))
      ) privilege
      where privilege.grantee = to_regrole('service_role')
    ) service_acl on true
    where table_object.oid = target_table
      and (
        service_acl.privileges is distinct from array['INSERT', 'SELECT', 'UPDATE']::text[]
        or coalesce(service_acl.has_grant_option, false)
      )
  ) then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_SERVICE_ROLE_ACL_INVALID';
  end if;

  if exists (
    select 1
    from pg_class table_object
    cross join lateral aclexplode(
      coalesce(table_object.relacl, acldefault('r', table_object.relowner))
    ) privilege
    where table_object.oid = target_table
      and (
        privilege.grantee = 0
        or privilege.grantee in (
          select role_object.oid
          from pg_roles role_object
          where role_object.rolname in ('anon', 'authenticated', 'ai_readonly')
        )
      )
  ) then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_EXTERNAL_ACL_INVALID';
  end if;

  if not (
    select
      array_agg(attribute.attname::text order by attribute.attnum) =
        array['user_id', 'preferred_name', 'created_at', 'updated_at']::text[]
      and bool_and(
        case attribute.attname
          when 'user_id' then
            format_type(attribute.atttypid, attribute.atttypmod) = 'uuid'
            and attribute.attnotnull
            and default_value.adbin is null
          when 'preferred_name' then
            format_type(attribute.atttypid, attribute.atttypmod) = 'text'
            and attribute.attnotnull
            and default_value.adbin is null
          when 'created_at' then
            format_type(attribute.atttypid, attribute.atttypmod) = 'timestamp with time zone'
            and attribute.attnotnull
            and pg_get_expr(default_value.adbin, default_value.adrelid) = 'now()'
          when 'updated_at' then
            format_type(attribute.atttypid, attribute.atttypmod) = 'timestamp with time zone'
            and attribute.attnotnull
            and pg_get_expr(default_value.adbin, default_value.adrelid) = 'now()'
          else false
        end
      )
    from pg_attribute attribute
    left join pg_attrdef default_value
      on default_value.adrelid = attribute.attrelid
     and default_value.adnum = attribute.attnum
    where attribute.attrelid = target_table
      and attribute.attnum > 0
      and not attribute.attisdropped
  ) then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_COLUMNS_INVALID';
  end if;

  if not exists (
       select 1
       from pg_constraint constraint_object
       where constraint_object.conrelid = target_table
         and constraint_object.contype = 'p'
         and pg_get_constraintdef(constraint_object.oid) = 'PRIMARY KEY (user_id)'
     )
     or not exists (
       select 1
       from pg_constraint constraint_object
       join pg_attribute source_attribute
         on source_attribute.attrelid = constraint_object.conrelid
        and source_attribute.attnum = constraint_object.conkey[1]
       join pg_attribute target_attribute
         on target_attribute.attrelid = constraint_object.confrelid
        and target_attribute.attnum = constraint_object.confkey[1]
       where constraint_object.conrelid = target_table
         and constraint_object.contype = 'f'
         and array_length(constraint_object.conkey, 1) = 1
         and source_attribute.attname = 'user_id'
         and constraint_object.confrelid = 'auth.users'::regclass
         and target_attribute.attname = 'id'
         and constraint_object.confupdtype = 'c'
         and constraint_object.confdeltype = 'c'
     )
     or not exists (
       select 1
       from pg_constraint constraint_object
       where constraint_object.conrelid = target_table
         and constraint_object.contype = 'c'
         and constraint_object.conname = 'user_identity_preferences_preferred_name_chk'
         and pg_get_constraintdef(constraint_object.oid) like '%btrim(preferred_name)%'
         and pg_get_constraintdef(constraint_object.oid) like '%char_length(preferred_name)%'
     ) then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_CONSTRAINTS_INVALID';
  end if;

  if not exists (
    select 1
    from pg_trigger trigger_object
    where trigger_object.tgrelid = target_table
      and trigger_object.tgname = 'user_identity_preferences_set_updated_at'
      and not trigger_object.tgisinternal
      and trigger_object.tgfoid = 'public.tg_set_updated_at()'::regprocedure
      and pg_get_triggerdef(trigger_object.oid) like
        'CREATE TRIGGER user_identity_preferences_set_updated_at BEFORE UPDATE ON public.user_identity_preferences FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at()'
  ) then
    raise exception 'E10_9_USER_IDENTITY_PREFERENCES_TRIGGER_INVALID';
  end if;
end
$$;
