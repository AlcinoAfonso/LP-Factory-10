begin;
select public.commit_account_pending_setup_turn_v2('e1012ace-0000-4000-8000-000000000032',
'e1012ace-0000-4000-8000-000000000012','e1012ace-0000-4000-8000-000000000001',
2,'e1012ace-0000-4000-8000-000000000042','Entendimento confirmado.','Jardinagem para condomínios.',
null,'ready_to_complete',null,true);
select pg_sleep(2);
commit;
