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
insert into public.business_taxons(id,level,name,slug,is_active,parent_id) values
 ('e1012ace-0000-4000-8000-000000000021','segment','E1012 Race Serviços','e1012-race-services',true,null),
 ('e1012ace-0000-4000-8000-000000000022','niche','E1012 Race Jardinagem','e1012-race-gardens',true,'e1012ace-0000-4000-8000-000000000021');
-- Prepare a proposal in newly initialized E10.12 dialogues, without adopting legacy rows.
update public.account_pending_setup_conversations set stage='niche_confirmation',confirmation_kind='official',
business_context_text='Jardinagem para condomínios.',attendance_proposal=
'{"kind":"existing","taxonId":"e1012ace-0000-4000-8000-000000000022","taxonName":"E1012 Race Jardinagem"}'::jsonb
where account_id::text like 'e1012ace-%';
select public.claim_account_pending_setup_turn_v2(
(select id from public.account_pending_setup_conversations where account_id=('e1012ace-0000-4000-8000-00000000001'||n)::uuid),
('e1012ace-0000-4000-8000-00000000001'||n)::uuid,
'e1012ace-0000-4000-8000-000000000001',1,('e1012ace-0000-4000-8000-00000000004'||n)::uuid,'Sim, correto.','confirm')
from generate_series(1,2) n;
