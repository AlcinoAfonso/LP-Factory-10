-- Run after the exact migration in an isolated PostgreSQL database. Does not emulate Supabase Auth/Storage services.
begin;
do $$
begin
  if (select count(*) from public.communication_base_sections)<>17 then raise exception 'Seeds'; end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='communication_base_sections') then raise exception 'Direct client policies'; end if;
  if has_table_privilege('authenticated','public.communication_base_sections','SELECT')
    or has_table_privilege('anon','public.communication_base_sections','INSERT')
    or has_table_privilege('ai_readonly','public.communication_base_sections','SELECT')
    or has_table_privilege('service_role','public.communication_base_sections','DELETE')
    or has_column_privilege('service_role','public.communication_base_sections','section_key','UPDATE')
    or has_column_privilege('service_role','public.communication_base_sections','category','UPDATE')
    or has_function_privilege('authenticated','public.save_communication_base_section(uuid,text,text,integer,timestamptz)','EXECUTE')
  then raise exception 'ACL violation'; end if;
  if not has_column_privilege('service_role','public.communication_base_sections','label','UPDATE') then raise exception 'Service label grant'; end if;
  if not (select public=false and file_size_limit=4194304 and allowed_mime_types=array['image/png','image/jpeg','image/webp'] from storage.buckets where id='communication-base-assets') then raise exception 'Private bucket limits'; end if;
end $$;
set local role service_role;
do $$
declare v_id uuid; v_key text; v_stamp timestamptz; v_current timestamptz; v_name text;
begin
  select id,updated_at,section_key into v_id,v_stamp,v_key from public.communication_base_sections where section_key='business_name';
  perform public.save_communication_base_section(v_id,'business','Cadastro do negócio',7,v_stamp);
  select updated_at into v_current from public.communication_base_sections where id=v_id;
  if (select section_key<>v_key or sort_order<>7 or label<>'Cadastro do negócio' from public.communication_base_sections where id=v_id) then raise exception 'Rename/reorder lost identity'; end if;
  begin
    perform public.save_communication_base_section(v_id,'business','Stale',1,v_stamp);
    raise exception 'Stale edit accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.save_communication_base_section(v_id,'materials','Move',1,v_current);
    raise exception 'Category move accepted';
  exception when serialization_failure then null; end;
  begin
    delete from public.communication_base_sections where id=v_id;
    raise exception 'Delete accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.communication_base_sections set section_key='changed' where id=v_id;
    raise exception 'Identity change accepted';
  exception when insufficient_privilege then null; end;
  v_id:=public.save_communication_base_section(null,'business','Nova seção',1,null);
  select section_key into v_name from public.communication_base_sections where id=v_id;
  if v_name not like 'custom_%' or (select format<>'text' from public.communication_base_sections where id=v_id) then raise exception 'Custom fixed shape'; end if;
  if (select count(distinct sort_order)<>8 or min(sort_order)<>1 or max(sort_order)<>8 from public.communication_base_sections where category='business') then raise exception 'Contiguous order'; end if;
  v_id:=public.save_communication_base_section(null,'materials','Acervo extra',4,null);
  if (select format<>'material_items' from public.communication_base_sections where id=v_id) then raise exception 'Material fixed shape'; end if;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform * from public.communication_base_sections;
    raise exception 'Client read accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_communication_base_section(null,'business','Forbidden',1,null);
    raise exception 'Client mutation accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
