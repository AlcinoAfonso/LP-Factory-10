-- Compare structural metadata only, never product rows or secrets.
with namespaces as (
  select oid from pg_namespace where nspname in ('public','auth','storage','extensions')
)
select md5(jsonb_build_object(
  'namespaces',(select jsonb_agg(to_jsonb(n) order by n.oid)
    from pg_namespace n where n.oid in(select oid from namespaces)),
  'relations',(select jsonb_agg(jsonb_build_array(c.oid,c.relname,c.relkind,
      c.relrowsecurity,c.relforcerowsecurity,c.relacl,c.reloptions) order by c.oid)
    from pg_class c where c.relnamespace in(select oid from namespaces)),
  'columns',(select jsonb_agg(to_jsonb(a) order by a.attrelid,a.attnum)
    from pg_attribute a join pg_class c on c.oid=a.attrelid
    where c.relnamespace in(select oid from namespaces) and a.attnum>0),
  'constraints',(select jsonb_agg(to_jsonb(c) order by c.oid)
    from pg_constraint c where c.connamespace in(select oid from namespaces)),
  'policies',(select jsonb_agg(to_jsonb(p) order by p.oid)
    from pg_policy p join pg_class c on c.oid=p.polrelid
    where c.relnamespace in(select oid from namespaces)),
  'functions',(select jsonb_agg(jsonb_build_array(to_jsonb(p),pg_get_functiondef(p.oid)) order by p.oid)
    from pg_proc p where p.prokind in('f','p') and p.pronamespace in(select oid from namespaces)),
  'default_acls',(select jsonb_agg(to_jsonb(d) order by d.oid)
    from pg_default_acl d where d.defaclnamespace in(select oid from namespaces))
)::text);
