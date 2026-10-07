begin;
set local search_path=public,pg_catalog;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'E10.12 assertion: %',label; end if; end $$;
create function pg_temp.expect_error(command text,expected_state text) returns void language plpgsql as $$
declare actual_state text;
begin
  begin execute command; exception when others then get stacked diagnostics actual_state=returned_sqlstate; end;
  if actual_state is distinct from expected_state then
    raise exception 'E10.12 expected %, got %: %',expected_state,actual_state,command;
  end if;
end $$;

select pg_temp.assert_true(has_function_privilege('service_role',
  'public.commit_account_pending_setup_turn_v2(uuid,uuid,uuid,bigint,uuid,text,text,text,text,jsonb,boolean,boolean)','execute'),'service commit');
select pg_temp.assert_true(not has_function_privilege('service_role',
  'public.effect_pending_setup_taxonomy_v1(uuid,jsonb,boolean,text)','execute'),'helper cannot bypass fence');
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'public.claim_account_pending_setup_turn_v2(uuid,uuid,uuid,bigint,uuid,text,text)','execute'),'authenticated denied');
select pg_temp.assert_true(not has_function_privilege('anon',
  'public.start_account_pending_setup_v2(uuid,uuid,text)','execute'),'anon denied');
select pg_temp.assert_true((select bool_and(relrowsecurity) from pg_class
  where oid in ('public.account_pending_setup_conversations'::regclass,'public.account_pending_setup_messages'::regclass)),'RLS retained');
select pg_temp.assert_true(not exists(select 1 from pg_policy where polrelid in
  ('public.account_pending_setup_conversations'::regclass,'public.account_pending_setup_messages'::regclass)),'no client policies');
select pg_temp.assert_true((select count(*)=2 from public.openai_workload_operational_configurations
  where workload='pending_setup_conversation'),'two E21 units');
select pg_temp.assert_true((select count(*)=2 from public.openai_workload_configuration_revisions
  where workload='pending_setup_conversation' and model='gpt-6-luna' and reasoning_effort='xhigh'
  and proof_metadata->>'proof_kind'='bootstrap'),'candidate is not an empirical proof');

insert into auth.users(id,aud,role,email,created_at,updated_at) values
  ('e1012000-0000-4000-8000-000000000001','authenticated','authenticated','e1012-owner@example.com',now(),now()),
  ('e1012000-0000-4000-8000-000000000002','authenticated','authenticated','e1012-viewer@example.com',now(),now());
insert into public.accounts(id,name,subdomain,slug,status) values
  ('e1012000-0000-4000-8000-000000000011','E1012 A','e1012-a','e1012-a','pending_setup'),
  ('e1012000-0000-4000-8000-000000000012','E1012 B','e1012-b','e1012-b','pending_setup'),
  ('e1012000-0000-4000-8000-000000000013','E1012 C','e1012-c','e1012-c','pending_setup'),
  ('e1012000-0000-4000-8000-000000000014','E1012 D','e1012-d','e1012-d','pending_setup');
insert into public.account_users(account_id,user_id,role,status)
select id,'e1012000-0000-4000-8000-000000000001','owner','active' from public.accounts where subdomain like 'e1012-%';
insert into public.account_users(account_id,user_id,role,status)
values('e1012000-0000-4000-8000-000000000011','e1012000-0000-4000-8000-000000000002','viewer','active');

do $$
declare
 u uuid:='e1012000-0000-4000-8000-000000000001'; a uuid:='e1012000-0000-4000-8000-000000000011';
 b uuid:='e1012000-0000-4000-8000-000000000012'; d uuid:='e1012000-0000-4000-8000-000000000014';
 c uuid; cb uuid; cd uuid; v bigint; v2 bigint; token uuid:=gen_random_uuid(); old_token uuid;
 proposal jsonb; bad jsonb; saved_taxon uuid; before_count bigint; message_count bigint;
begin
 c:=public.start_account_pending_setup_v2(a,u,null);
 perform pg_temp.assert_true(c=public.start_account_pending_setup_v2(a,u,null),'start idempotent');
 perform pg_temp.assert_true(not exists(select 1 from public.account_pending_setup_messages where conversation_id=c),'no fixed greeting');
 perform pg_temp.expect_error(format('select public.start_account_pending_setup_v2(%L,%L,null)',a,
   'e1012000-0000-4000-8000-000000000002'),'42501');
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,1,token,null,'initialize');
 perform pg_temp.assert_true(v=2,'initial reservation');
 v2:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Olá! Como prefere ser chamado?',
   '',null,'identity',null,false);
 perform pg_temp.assert_true(v2=3,'initial AI reply committed');
 perform pg_temp.assert_true(public.commit_account_pending_setup_turn_v2(c,a,u,v,token,
   'Replay ignored','',null,'identity',null,false)=v2,'commit retry idempotent');
 perform pg_temp.assert_true((select count(*)=1 from public.account_pending_setup_messages where conversation_id=c),'single greeting');
 token:=gen_random_uuid();
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,'Pode me chamar de Ana.','message');
 perform pg_temp.assert_true(public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,
   'Pode me chamar de Ana.','message')=v,'claim retry idempotent');
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L)',
   c,a,u,v,gen_random_uuid(),'Outra aba','message'),'40001');
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L)',
   c,b,u,v,gen_random_uuid(),'Outra conta','message'),'P0002');
 old_token:=token;
 v2:=public.release_account_pending_setup_turn_v2(c,a,u,v,token);
 token:=gen_random_uuid();
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,null,'message');
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,null,%L,null,false)',
   c,a,u,v,old_token,'Resposta atrasada','Atividade informada','business_understanding'),'40001');
 v2:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Ana, com o que você trabalha e para quem?',
   '', 'Ana','business_understanding',null,false);
 perform pg_temp.assert_true((select count(*)=1 from public.account_pending_setup_messages
   where conversation_id=c and role='user'),'release/retry preserved a single user entry');
 perform pg_temp.assert_true((select preferred_name='Ana' and openai_call_count=0 from public.account_pending_setup_conversations
   where id=c),'name separate and legacy call count unused');

 -- Proposed chain is not written until persisted understanding is confirmed.
 proposal:=jsonb_build_object('kind','new','taxonId',null,'chain',jsonb_build_array(
   jsonb_build_object('level','segment','name','E1012 Serviços locais','existingId',null),
   jsonb_build_object('level','niche','name','E1012 Manutenção de jardins','existingId',null)),
   'aliases','[]'::jsonb,'evidence','Categoria real demonstrada pela referência pertinente.',
   'sources',jsonb_build_array('https://example.com/market-gardens'));
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,
   'Faço manutenção de jardins para condomínios.','message');
 v2:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Entendi: manutenção de jardins para condomínios. Está correto?',
   'Faço manutenção de jardins para condomínios.','Ana','niche_confirmation',proposal,false);
 perform pg_temp.assert_true(not exists(select 1 from public.business_taxons where name like 'E1012 %'),'proposal did not create');
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,'Sim, está correto.','confirm');
 v2:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Entendimento confirmado. Vamos organizar sua comunicação.',
   'Faço manutenção de jardins para condomínios.','Ana','ready_to_complete',null,true);
 select taxon_id into saved_taxon from public.account_taxonomy where account_id=a and is_primary and status='active';
 perform pg_temp.assert_true(saved_taxon is not null,'official link committed');
 perform pg_temp.assert_true((select count(*)=2 and bool_and(is_active) from public.business_taxons where name like 'E1012 %'),'minimal hierarchy active');
 perform pg_temp.assert_true((select parent.level='segment' from public.business_taxons leaf
   join public.business_taxons parent on parent.id=leaf.parent_id where leaf.id=saved_taxon),'parent-first hierarchy');
 perform pg_temp.assert_true((select status='pending_setup' from public.accounts where id=a),'taxonomy grants no account promotion');
 perform pg_temp.assert_true(not exists(select 1 from public.account_communication_bases where account_id=a),'no Base write');
 perform pg_temp.assert_true(public.commit_account_pending_setup_turn_v2(c,a,u,v,token,
   'Replay ignored','Faço manutenção de jardins para condomínios.','Ana','ready_to_complete',null,true)=v2,'confirmed retry no duplicate');
 perform pg_temp.assert_true((select count(*)=1 from public.account_taxonomy where account_id=a),'single primary');

 -- Second conversation carries stale "new" proposal; requery reuses the category already created.
 cb:=public.start_account_pending_setup_v2(b,u,'Bia');
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(cb,b,u,1,token,null,'initialize');
 v2:=public.commit_account_pending_setup_turn_v2(cb,b,u,v,token,'Entendi seu negócio. Confirma?',
   'Manutenção de jardins para condomínios.','Bia','niche_confirmation',proposal,false);
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(cb,b,u,v2,token,'Sim','confirm');
 v2:=public.commit_account_pending_setup_turn_v2(cb,b,u,v,token,'Vamos continuar.',
   'Manutenção de jardins para condomínios.','Bia','ready_to_complete',null,true);
 perform pg_temp.assert_true((select taxon_id=saved_taxon from public.account_taxonomy where account_id=b and is_primary),'concurrent proposal requery reused');
 perform pg_temp.assert_true((select count(*)=2 from public.business_taxons where name like 'E1012 %'),'no duplicate by second slug');

 -- Inactive leaf, wrong hierarchy, related alias and no evidence all roll back the complete turn.
 cd:=public.start_account_pending_setup_v2(d,u,'Dora');
 insert into public.business_taxons(parent_id,level,name,slug,is_active)
 values(null,'segment','E1012 Categoria inativa','e1012-inactive',false);
 bad:=jsonb_set(proposal,'{chain}',jsonb_build_array(jsonb_build_object(
   'level','segment','name','E1012 Categoria inativa','existingId',null)));
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(cd,d,u,1,token,null,'initialize');
 v2:=public.commit_account_pending_setup_turn_v2(cd,d,u,v,token,'Confirma seu entendimento?',
   'Atividade confirmada.','Dora','niche_confirmation',bad,false);
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(cd,d,u,v2,token,'Sim','confirm');
 select count(*) into message_count from public.account_pending_setup_messages where conversation_id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Sucesso não deve aparecer','Atividade confirmada.','Dora','ready_to_complete'),'23514');
 perform pg_temp.assert_true((select count(*)=message_count from public.account_pending_setup_messages where conversation_id=cd),'failed taxonomy no success reply');
 perform pg_temp.assert_true(not exists(select 1 from public.account_taxonomy where account_id=d),'failed taxonomy no link');
 perform pg_temp.assert_true((select not is_active from public.business_taxons where slug='e1012-inactive'),'inactive not reactivated');

 -- Privileged fixture replaces persisted proposal only to probe RPC defense; clients have no such permission.
 bad:=jsonb_set(proposal,'{chain}',jsonb_build_array(jsonb_build_object(
   'level','niche','name','E1012 Wrong level','existingId',null)));
 update public.account_pending_setup_conversations set attendance_proposal=bad where id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Wrong','Atividade confirmada.','Dora','ready_to_complete'),'23514');
 bad:=jsonb_set(proposal,'{sources}','[]'::jsonb);
 update public.account_pending_setup_conversations set attendance_proposal=bad where id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Wrong','Atividade confirmada.','Dora','ready_to_complete'),'23514');
 bad:=jsonb_set(proposal,'{aliases}',jsonb_build_array(jsonb_build_object(
   'text','E1012 Oferta relacionada','equivalentTo','Outra categoria','justification','Apenas relacionada.',
   'evidenceUrls',jsonb_build_array('https://example.com/market-gardens'))));
 update public.account_pending_setup_conversations set attendance_proposal=bad where id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Wrong','Atividade confirmada.','Dora','ready_to_complete'),'23514');
 perform pg_temp.assert_true(not exists(select 1 from public.business_taxon_aliases where alias_text='E1012 Oferta relacionada'),'related alias rejected');

 -- Expired provider is fenced even with the old token; recovered claim does not duplicate input.
 update public.account_pending_setup_conversations set pending_turn_started_at=clock_timestamp()-interval '7 minutes' where id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Too late','Atividade confirmada.','Dora','ready_to_complete'),'40001');
 old_token:=token; token:=gen_random_uuid();
 v2:=public.claim_account_pending_setup_turn_v2(cd,d,u,v,token,null,'message');
 perform pg_temp.assert_true((select count(*)=message_count from public.account_pending_setup_messages where conversation_id=cd),'lease recovery append once');
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v2,old_token,'Too late','Atividade confirmada.','Dora','ready_to_complete'),'40001');

 -- Operational fallback remains explicitly confirmed and can conclude via E10.11.
 update public.account_pending_setup_conversations set attendance_proposal=jsonb_build_object(
   'kind','operational_fallback','taxonId',null,'chain','[]'::jsonb,'aliases','[]'::jsonb,'evidence','','sources','[]'::jsonb),
   confirmation_kind='operational_fallback' where id=cd;
 v:=public.commit_account_pending_setup_turn_v2(cd,d,u,v2,token,'Sua descrição fica como referência; classificação oficial pendente.',
   'Atividade confirmada para público informado.','Dora','ready_to_complete',null,true);
 perform pg_temp.assert_true((select user_resolution_status='confirmed' and user_selected_taxon_id is null
   from public.account_niche_resolutions where account_id=d),'operational confirmation persisted');
 v2:=public.set_account_pending_setup_business_name_v1(cd,d,u,'Negócio Dora',v);
 perform public.complete_account_pending_setup_v2(cd,d,u,v2,'operational_fallback');
 perform pg_temp.assert_true((select stage='completed' and resolution_outcome='operational_fallback'
   and preferred_name='Dora' and business_display_name='Negócio Dora' from public.account_pending_setup_conversations where id=cd),'E10.11 preserved');

 -- Normalized null-parent uniqueness is global and cannot be bypassed with a new slug.
 perform pg_temp.expect_error('insert into public.business_taxons(level,name,slug,is_active)
   values(''segment'',''  e1012 serviços LOCAIS  '',''e1012-duplicate-slug'',true)','23505');
end $$;
rollback;

