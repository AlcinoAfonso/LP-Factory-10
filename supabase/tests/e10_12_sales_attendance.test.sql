-- Disposable PostgreSQL 17 only. Revised V1 behavior; all test data rolls back.
begin;
set local search_path=public,pg_catalog;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'E10.12 sales assertion: %',label; end if; end $$;
create function pg_temp.expect_error(command text,expected_state text) returns void language plpgsql as $$
declare actual text;
begin
 begin execute command; exception when others then get stacked diagnostics actual=returned_sqlstate; end;
 if actual is distinct from expected_state then raise exception 'Expected %, got %: %',expected_state,actual,command; end if;
end $$;
select pg_temp.assert_true(not has_function_privilege('service_role',
 'public.commit_account_pending_setup_turn_v2(uuid,uuid,uuid,bigint,uuid,text,text,text,text,jsonb,boolean,boolean,uuid)','execute'),'old commit is retired');
select pg_temp.assert_true(has_function_privilege('service_role',
 'public.commit_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid)','execute'),'new commit service only');
select pg_temp.assert_true(not has_function_privilege('authenticated',
 'public.commit_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid)','execute')
 and not has_function_privilege('anon',
 'public.commit_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid)','execute')
 and not has_function_privilege('service_role','public.effect_pending_setup_taxonomy_v1(uuid,jsonb,boolean,text)','execute'),'no fence bypass');
select pg_temp.assert_true(not exists(select 1 from public.account_dialogues)
 and not exists(select 1 from public.account_context_summaries),'no historical conversion');
select pg_temp.assert_true((select stage='completed' and version=7 and preferred_name is null
 and completed_at='2026-09-22T00:00:00Z' and updated_at=completed_at
 from public.account_pending_setup_conversations where id='e1012bac-0000-4000-8000-000000000014'),'completed historical record untouched');
select pg_temp.assert_true((select not preferred_name_declined from public.account_pending_setup_conversations
 where account_id='e1012bac-0000-4000-8000-000000000011'),'no historical refusal inference');

insert into auth.users(id,aud,role,email,created_at,updated_at) values
 ('e10125a1-0000-4000-8000-000000000001','authenticated','authenticated','sales-owner@example.com',now(),now()),
 ('e10125a1-0000-4000-8000-000000000002','authenticated','authenticated','sales-other@example.com',now(),now());
insert into public.accounts(id,name,subdomain,slug,status)
select ('e10125a1-0000-4000-8000-00000000001'||n)::uuid,'Sales '||n,'e1012-sales-'||n,'e1012-sales-'||n,'pending_setup'
 from generate_series(1,4)n;
insert into public.account_users(account_id,user_id,role,status)
select id,'e10125a1-0000-4000-8000-000000000001','owner','active'
 from public.accounts where subdomain like 'e1012-sales-%';
insert into public.business_taxons(id,level,name,slug,is_active,parent_id) values
 ('e10125a1-0000-4000-8000-000000000021','segment','Sales segmento','e1012-sales-segment',true,null),
 ('e10125a1-0000-4000-8000-000000000022','niche','Sales jardim','e1012-sales-garden',true,'e10125a1-0000-4000-8000-000000000021'),
 ('e10125a1-0000-4000-8000-000000000023','niche','Sales inativo','e1012-sales-inactive',false,'e10125a1-0000-4000-8000-000000000021');
select public.start_account_pending_setup_v2(id,'e10125a1-0000-4000-8000-000000000001','Ana')
 from public.accounts where subdomain like 'e1012-sales-%';

create function pg_temp.sales_turn(a uuid,intent text,proposal jsonb,confirmed boolean,stage text,
 observed uuid default null,facts text default 'Jardins para condomínios.',
 memory text default E'Fatos declarados pelo lead: Jardins para condomínios.\nSugestões: avaliar comunicação.')
returns bigint language plpgsql as $$
declare c uuid; v bigint; token uuid:=gen_random_uuid();
begin
 select id,version into c,v from public.account_pending_setup_conversations where account_id=a;
 v:=public.claim_account_pending_setup_turn_v2(c,a,'e10125a1-0000-4000-8000-000000000001',v,token,
   case when intent='confirm' then 'Sim, confirmo.' else 'Minha resposta útil.' end,intent);
 return public.commit_account_pending_setup_turn_v3(c,a,'e10125a1-0000-4000-8000-000000000001',v,token,
   'Resposta só publicada depois do commit.',memory,facts,null,stage,proposal,confirmed,false,observed);
end $$;
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000011','message',
 '{"kind":"existing","taxonId":"e10125a1-0000-4000-8000-000000000022","taxonName":"Sales jardim"}',false,'niche_confirmation');
select pg_temp.assert_true(not exists(select 1 from public.account_taxonomy where account_id='e10125a1-0000-4000-8000-000000000011'),'proposal does not link');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000011','message',null,false,'ready_to_complete')$q$,'23514');
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000011','confirm',null,true,'business_understanding',null,'Não substituir descrição apresentada.');
select pg_temp.assert_true((select stage='business_understanding' and business_context_text='Jardins para condomínios.'
 and attendance_proposal is null and confirmation_kind is null from public.account_pending_setup_conversations
 where account_id='e10125a1-0000-4000-8000-000000000011'),'confirmation preserves displayed facts and continues sales');
select pg_temp.assert_true((select count(*)=1 and bool_and(source_type='user_confirmed_ai') from public.account_taxonomy
 where account_id='e10125a1-0000-4000-8000-000000000011'),'confirmed official link exactly once');
select pg_temp.assert_true((select s.source_dialogue_id=c.id and s.source_user_id=c.user_id
 and s.summary like '%Sugestões:%' and c.business_context_text not like '%Sugestões:%'
 from public.account_context_summaries s join public.account_pending_setup_conversations c on c.account_id=s.account_id
 where s.account_id='e10125a1-0000-4000-8000-000000000011'),'context provenance and suggestions are separate from facts');

-- Repeating the same committed token is idempotent even with its old expected version.
do $$
declare c public.account_pending_setup_conversations%rowtype; n bigint; v bigint;
begin
 select * into c from public.account_pending_setup_conversations where account_id='e10125a1-0000-4000-8000-000000000011';
 select count(*) into n from public.account_pending_setup_messages where conversation_id=c.id;
 v:=public.commit_account_pending_setup_turn_v3(c.id,c.account_id,c.user_id,1,c.last_attendance_turn_token,
 'Duplicate','Duplicate','Duplicate',null,'ready_to_complete',null,true,false,null);
 perform pg_temp.assert_true(v=c.version and (select count(*)=n from public.account_pending_setup_messages where conversation_id=c.id),'idempotent token no duplicate history');
end $$;
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000011','message',null,false,'ready_to_complete','e10125a1-0000-4000-8000-000000000022');
do $$
declare c public.account_pending_setup_conversations%rowtype; v bigint;
begin
 select * into c from public.account_pending_setup_conversations where account_id='e10125a1-0000-4000-8000-000000000011';
 perform pg_temp.expect_error(format('select public.complete_account_pending_setup_attendance_v1(%L,%L,%L,%s,%L,true)',c.id,c.account_id,c.user_id,c.version,'official'),'23514');
 v:=public.set_account_pending_setup_business_name_v1(c.id,c.account_id,c.user_id,'Jardins Ana',c.version);
 perform public.complete_account_pending_setup_attendance_v1(c.id,c.account_id,c.user_id,v,'official',true);
 perform pg_temp.assert_true((select status='active' from public.accounts where id=c.account_id),'E10.11 completion');
 perform pg_temp.assert_true((select ended_at is not null from public.account_dialogues where id=c.id),'dialogue ended');
end $$;

select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000012','message',
 '{"kind":"operational_fallback","taxonId":null,"taxonName":null}',false,'niche_confirmation',null,'Fisioterapia de adultos.');
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000012','confirm',null,true,'business_understanding',null,'Inventado.');
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000012','message',null,false,'ready_to_complete',null,'Fisioterapia de adultos.');
select pg_temp.assert_true(not exists(select 1 from public.account_taxonomy where account_id='e10125a1-0000-4000-8000-000000000012')
 and (select user_rewrite_input='Fisioterapia de adultos.' from public.account_niche_resolutions where account_id='e10125a1-0000-4000-8000-000000000012'),'no category fallback preserves confirmed factual understanding');
do $$
declare c public.account_pending_setup_conversations%rowtype;
begin
 select * into c from public.account_pending_setup_conversations where account_id='e10125a1-0000-4000-8000-000000000012';
 perform public.complete_account_pending_setup_attendance_v1(c.id,c.account_id,c.user_id,c.version,'operational_fallback',false);
 perform pg_temp.assert_true((select status='active' from public.accounts where id=c.account_id),'fallback allows commercial continuation');
end $$;

-- Invalid or external changes roll back the whole call, including claim/message/summary.
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','message',
 '{"kind":"new","chain":[],"aliases":[]}',false,'niche_confirmation')$q$,'22023');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','message',
 '{"kind":"existing","taxonId":"e10125a1-0000-4000-8000-000000000022","taxonName":"Sales jardim","aliases":[]}',false,'niche_confirmation')$q$,'22023');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','message',
 '{"kind":"existing","taxonId":"e10125a1-0000-4000-8000-000000000023","taxonName":"Sales inativo"}',false,'niche_confirmation')$q$,'23514');
select pg_temp.assert_true((select version=1 and pending_turn_token is null from public.account_pending_setup_conversations
 where account_id='e10125a1-0000-4000-8000-000000000013') and not exists(select 1 from public.account_pending_setup_messages m
 join public.account_pending_setup_conversations c on c.id=m.conversation_id where c.account_id='e10125a1-0000-4000-8000-000000000013'),'no partial claim or false success');

select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','message',
 '{"kind":"existing","taxonId":"e10125a1-0000-4000-8000-000000000022","taxonName":"Sales jardim"}',false,'niche_confirmation');
update public.business_taxons set is_active=false where id='e10125a1-0000-4000-8000-000000000021';
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','confirm',null,true,'business_understanding')$q$,'23514');
update public.business_taxons set is_active=true where id='e10125a1-0000-4000-8000-000000000021';
insert into public.account_taxonomy(account_id,taxon_id,is_primary,status,source_type)
 values('e10125a1-0000-4000-8000-000000000013','e10125a1-0000-4000-8000-000000000021',true,'active','manual');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','confirm',null,true,'business_understanding')$q$,'40001');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000013','confirm',null,true,'business_understanding','e10125a1-0000-4000-8000-000000000021')$q$,'40001');
select pg_temp.assert_true((select taxon_id='e10125a1-0000-4000-8000-000000000021' from public.account_taxonomy
 where account_id='e10125a1-0000-4000-8000-000000000013'),'different primary never overwritten');
do $$
declare c public.account_pending_setup_conversations%rowtype;
begin
 select * into c from public.account_pending_setup_conversations where account_id='e10125a1-0000-4000-8000-000000000014';
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L)',
  c.id,c.account_id,'e10125a1-0000-4000-8000-000000000002',c.version,gen_random_uuid(),'Olá','message'),'P0002');
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L)',
  c.id,'e10125a1-0000-4000-8000-000000000013',c.user_id,c.version,gen_random_uuid(),'Olá','message'),'P0002');
end $$;
select pg_temp.assert_true((select count(*)=3 from public.business_taxons where id::text like 'e10125a1-%')
 and not exists(select 1 from public.business_taxon_aliases where taxon_id::text like 'e10125a1-%')
 and (select not is_active from public.business_taxons where id='e10125a1-0000-4000-8000-000000000023'),'no catalog creation aliases or reactivation');
rollback;
