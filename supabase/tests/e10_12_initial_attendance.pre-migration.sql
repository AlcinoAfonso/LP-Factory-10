-- Disposable isolated database only: materialize legacy cases before the candidate migration.
begin;
insert into auth.users(id,aud,role,email,created_at,updated_at)
values('e1012bac-0000-4000-8000-000000000001','authenticated','authenticated','e1012-legacy@example.com',now(),now());
insert into public.accounts(id,name,subdomain,slug,status) values
 ('e1012bac-0000-4000-8000-000000000011','Legacy refused','e1012-legacy-refused','e1012-legacy-refused','pending_setup'),
 ('e1012bac-0000-4000-8000-000000000012','Legacy unknown','e1012-legacy-unknown','e1012-legacy-unknown','pending_setup'),
 ('e1012bac-0000-4000-8000-000000000013','Legacy named','e1012-legacy-named','e1012-legacy-named','pending_setup');
insert into public.account_users(account_id,user_id,role,status)
select id,'e1012bac-0000-4000-8000-000000000001','owner','active' from public.accounts where subdomain like 'e1012-legacy-%';
do $$
declare c uuid; v bigint; u uuid:='e1012bac-0000-4000-8000-000000000001';
begin
 c:=public.start_account_pending_setup_v1('e1012bac-0000-4000-8000-000000000011',u,null);
 select version into v from public.account_pending_setup_conversations where id=c;
 perform public.set_account_pending_setup_preferred_name_v1(c,'e1012bac-0000-4000-8000-000000000011',u,null,v);
 perform public.start_account_pending_setup_v1('e1012bac-0000-4000-8000-000000000012',u,null);
 perform public.start_account_pending_setup_v1('e1012bac-0000-4000-8000-000000000013',u,'Bia');
end $$;
commit;
