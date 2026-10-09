begin;
select public.commit_account_pending_setup_turn_v3(
(select id from public.account_pending_setup_conversations where account_id='e1012ace-0000-4000-8000-000000000012'),
'e1012ace-0000-4000-8000-000000000012','e1012ace-0000-4000-8000-000000000001',
2,'e1012ace-0000-4000-8000-000000000042','Entendimento confirmado.','Fatos declarados: Jardinagem para condomínios.','Jardinagem para condomínios.',
null,'business_understanding',null,true);
select pg_sleep(2);
commit;
