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
select pg_temp.assert_true(not has_function_privilege('ai_readonly',
 'public.commit_account_pending_setup_turn_v3(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid)','execute'),
 'operational read role cannot commit even with hosted default EXECUTE grants');
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

-- Capacity fixture is a boundary proof, not an instruction to fill production memory.
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000014','message',null,false,'business_understanding',null,
 'Clínica Sorriso: clareamento e implantes.',repeat('s',4001));
select pg_temp.assert_true((select char_length(summary)=4001 from public.account_context_summaries
 where account_id='e10125a1-0000-4000-8000-000000000014'),'4001 persists and reloads');
select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000014','message',null,false,'business_understanding',null,
 'Clínica Sorriso: clareamento e implantes.',repeat('s',6000));
select pg_temp.assert_true((select char_length(summary)=6000 from public.account_context_summaries
 where account_id='e10125a1-0000-4000-8000-000000000014'),'6000 persists and reloads');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000014','message',null,false,
 'business_understanding',null,'Entendimento.',repeat('s',6001))$q$,'22023');
select pg_temp.expect_error($q$select pg_temp.sales_turn('e10125a1-0000-4000-8000-000000000014','message',null,false,
 'business_understanding',null,repeat('u',4001),'Resumo')$q$,'22023');
select pg_temp.expect_error($q$update public.account_context_summaries set summary=repeat('s',6001)
 where account_id='e10125a1-0000-4000-8000-000000000014'$q$,'23514');
select pg_temp.assert_true((select char_length(summary)=6000 from public.account_context_summaries
 where account_id='e10125a1-0000-4000-8000-000000000014') and
 (select version=5 and pending_turn_token is null from public.account_pending_setup_conversations
 where account_id='e10125a1-0000-4000-8000-000000000014') and
 (select count(*)=4 from public.account_pending_setup_messages m join public.account_pending_setup_conversations c
 on c.id=m.conversation_id where c.account_id='e10125a1-0000-4000-8000-000000000014'),
 'over-limit failure rolls back claim/message/state/summary; no false success');
select pg_temp.assert_true(not exists(select 1 from public.account_taxonomy where account_id='e10125a1-0000-4000-8000-000000000014'),
 'context does not classify or promote official fields');
-- Include the exact rollback guard from its canonical artifact in an isolated subtransaction.
select pg_temp.expect_error($rollback$do $$ begin
 if exists(select 1 from public.account_context_summaries where char_length(summary)>4000) then
  raise exception 'e10_12_summary_rollback_blocked_above_4000';
 end if;
end $$;
$rollback$,'P0001');
rollback;
