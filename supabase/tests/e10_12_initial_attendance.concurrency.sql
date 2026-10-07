-- Disposable local CI database only; concurrent commits below share the same proposal.
insert into auth.users(id,aud,role,email,created_at,updated_at)
values('e1012ace-0000-4000-8000-000000000001','authenticated','authenticated','e1012-race@example.com',now(),now());
insert into public.accounts(id,name,subdomain,slug,status) values
('e1012ace-0000-4000-8000-000000000011','Race A','e1012-race-a','e1012-race-a','pending_setup'),
('e1012ace-0000-4000-8000-000000000012','Race B','e1012-race-b','e1012-race-b','pending_setup');
insert into public.account_users(account_id,user_id,role,status)
select id,'e1012ace-0000-4000-8000-000000000001','owner','active' from public.accounts where subdomain like 'e1012-race-%';
select public.start_account_pending_setup_v2(
 ('e1012ace-0000-4000-8000-00000000001'||n)::uuid,
 'e1012ace-0000-4000-8000-000000000001',null) from generate_series(1,2) n;
-- Prepare a proposal in newly initialized E10.12 dialogues, without adopting legacy rows.
update public.account_pending_setup_conversations set stage='niche_confirmation',confirmation_kind='official',
business_context_text='Jardinagem para condomínios.',attendance_proposal=
'{"kind":"new","taxonId":null,"chain":[{"level":"segment","name":"E1012 Race Serviços","existingId":null},{"level":"niche","name":"E1012 Race Jardinagem","existingId":null}],"aliases":[],"evidence":"Categoria real de mercado comprovada na fixture.","sources":["https://example.com/race"]}'::jsonb
where account_id::text like 'e1012ace-%';
select public.claim_account_pending_setup_turn_v2(
(select id from public.account_pending_setup_conversations where account_id=('e1012ace-0000-4000-8000-00000000001'||n)::uuid),
('e1012ace-0000-4000-8000-00000000001'||n)::uuid,
'e1012ace-0000-4000-8000-000000000001',1,('e1012ace-0000-4000-8000-00000000004'||n)::uuid,'Sim, correto.','confirm')
from generate_series(1,2) n;
