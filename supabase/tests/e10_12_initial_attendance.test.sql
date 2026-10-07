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

-- Direct SQL retains 40001; a Data API domain conflict is PGRST with HTTP409 and body code40001.
do $proof$
declare v_state text; v_message text; v_detail text;
begin
  perform set_config('request.method','POST',true);
  begin
    perform public.raise_postgrest_safe_conflict_v1('pending_setup_version_conflict');
  exception when others then
    get stacked diagnostics v_state=returned_sqlstate,v_message=message_text,v_detail=pg_exception_detail;
  end;
  perform pg_temp.assert_true(v_state='PGRST' and (v_message::jsonb)->>'code'='40001'
    and (v_detail::jsonb)->>'status'='409','PostgREST conflict transported safely');
  perform set_config('request.method','',true);
end $proof$;

select pg_temp.assert_true(has_function_privilege('service_role',
  'public.commit_account_pending_setup_turn_v2(uuid,uuid,uuid,bigint,uuid,text,text,text,text,jsonb,boolean,boolean,uuid)','execute'),'service commit');
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

select pg_temp.assert_true((select bool_and(relrowsecurity) from pg_class where oid in
 ('public.account_dialogues'::regclass,'public.account_context_summaries'::regclass)),'context RLS enabled');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.account_context_summaries','select')
 and not has_table_privilege('anon','public.account_dialogues','insert'),'context inaccessible to client roles');
select pg_temp.assert_true(not exists(select 1 from information_schema.columns where table_schema='public'
 and table_name='account_context_summaries' and column_name='version'),'context has no revision/history');
select pg_temp.assert_true(not exists(select 1 from pg_constraint where conrelid in
 ('public.account_dialogues'::regclass,'public.account_context_summaries'::regclass)
 and confrelid='public.account_communication_bases'::regclass),'no context relationship to Base');
select pg_temp.assert_true(not exists(select 1 from public.account_dialogues)
 and not exists(select 1 from public.account_context_summaries),'apply copies no historical dialogue or summary');

select pg_temp.assert_true((select stage='completed' and preferred_name is null and version=7
 and created_at='2026-09-21T00:00:00Z'::timestamptz
 and updated_at='2026-09-22T00:00:00Z'::timestamptz and completed_at=updated_at
 from public.account_pending_setup_conversations where id='e1012bac-0000-4000-8000-000000000014'),
 'completed unnamed legacy conversation remains untouched by apply');

-- Apply does not infer old refusals; future legacy transitions still record them with the gate OFF.
select pg_temp.assert_true((select not preferred_name_declined and preferred_name is null and stage='business_understanding'
 from public.account_pending_setup_conversations where account_id='e1012bac-0000-4000-8000-000000000011'),'no historical refusal inference');
select pg_temp.assert_true((select not preferred_name_declined and stage='identity'
 from public.account_pending_setup_conversations where account_id='e1012bac-0000-4000-8000-000000000012'),'unknown identity is not refusal');
select pg_temp.assert_true((select not preferred_name_declined and preferred_name='Bia'
 from public.account_pending_setup_conversations where account_id='e1012bac-0000-4000-8000-000000000013'),'known name is not refusal');
do $$
declare c uuid; v bigint; u uuid:='e1012bac-0000-4000-8000-000000000001';
begin
 select id,version into c,v from public.account_pending_setup_conversations where account_id='e1012bac-0000-4000-8000-000000000012';
 perform public.set_account_pending_setup_preferred_name_v1(c,'e1012bac-0000-4000-8000-000000000012',u,null,v);
 perform pg_temp.assert_true((select preferred_name_declined from public.account_pending_setup_conversations where id=c),'post-apply gate OFF refusal preserved');
 -- A legacy valid-name transition writes false, even after a previously recorded refusal.
 update public.account_pending_setup_conversations set stage='identity',preferred_name_declined=true where id=c;
 select version into v from public.account_pending_setup_conversations where id=c;
 perform public.set_account_pending_setup_preferred_name_v1(c,'e1012bac-0000-4000-8000-000000000012',u,'Ana',v);
 perform pg_temp.assert_true((select not preferred_name_declined and preferred_name='Ana' from public.account_pending_setup_conversations where id=c),'post-apply valid name clears refusal');
 perform pg_temp.expect_error(format('select public.start_account_pending_setup_v2(%L,%L,null)',
  'e1012bac-0000-4000-8000-000000000011',u),'55000');
 perform pg_temp.assert_true(not exists(select 1 from public.account_dialogues)
  and not exists(select 1 from public.account_context_summaries),'legacy start creates no contextual copy');
end $$;
select pg_temp.assert_true(has_function_privilege('service_role',
 'public.discard_account_pending_setup_proposal_v2(uuid,uuid,uuid,bigint,uuid)','execute'),'service discard allowed');
select pg_temp.assert_true(not has_function_privilege('authenticated',
 'public.discard_account_pending_setup_proposal_v2(uuid,uuid,uuid,bigint,uuid)','execute'),'authenticated discard denied');

insert into auth.users(id,aud,role,email,created_at,updated_at) values
  ('e1012000-0000-4000-8000-000000000001','authenticated','authenticated','e1012-owner@example.com',now(),now()),
  ('e1012000-0000-4000-8000-000000000002','authenticated','authenticated','e1012-viewer@example.com',now(),now());
insert into public.accounts(id,name,subdomain,slug,status) values
  ('e1012000-0000-4000-8000-000000000011','E1012 A','e1012-a','e1012-a','pending_setup'),
  ('e1012000-0000-4000-8000-000000000012','E1012 B','e1012-b','e1012-b','pending_setup'),
  ('e1012000-0000-4000-8000-000000000013','E1012 C','e1012-c','e1012-c','pending_setup'),
  ('e1012000-0000-4000-8000-000000000014','E1012 D','e1012-d','e1012-d','pending_setup');
insert into public.account_users(account_id,user_id,role,status)
select id,'e1012000-0000-4000-8000-000000000001','owner','active' from public.accounts where id::text like 'e1012000-%';
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
   'aliases',jsonb_build_array(jsonb_build_object('text','E1012 Cuidado de jardins',
     'equivalentTo','E1012 Manutenção de jardins','equivalence','proven',
     'justification','Equivalência da manutenção e cuidado contínuo de jardins.',
     'evidenceUrls',jsonb_build_array('https://example.com/market-gardens'))),'evidence','Categoria real demonstrada pela referência pertinente.',
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
 perform pg_temp.assert_true((select count(*)=1 from public.business_taxon_aliases where taxon_id=saved_taxon
   and alias_text='E1012 Cuidado de jardins' and is_active),'proven alias committed once');
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
   'text','E1012 Oferta relacionada','equivalentTo','Outra categoria','equivalence','related','justification','Apenas relacionada.',
   'evidenceUrls',jsonb_build_array('https://example.com/market-gardens'))));
 update public.account_pending_setup_conversations set attendance_proposal=bad where id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Wrong','Atividade confirmada.','Dora','ready_to_complete'),'23514');
 perform pg_temp.assert_true(not exists(select 1 from public.business_taxon_aliases where alias_text='E1012 Oferta relacionada'),'related alias rejected');
 bad:=jsonb_set(jsonb_set(bad,'{aliases,0,equivalentTo}',to_jsonb('E1012 Manutenção de jardins'::text)),
   '{aliases,0,equivalence}',to_jsonb('ambiguous'::text));
 update public.account_pending_setup_conversations set attendance_proposal=bad where id=cd;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
   cd,d,u,v,token,'Wrong','Atividade confirmada.','Dora','ready_to_complete'),'23514');

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
 perform public.complete_account_pending_setup_attendance_v1(cd,d,u,v2,'operational_fallback',true);
 perform pg_temp.assert_true((select ended_at is not null from public.account_dialogues where id=cd),'dialogue ended atomically with attendance');
 perform pg_temp.assert_true((select stage='completed' and resolution_outcome='operational_fallback'
   and preferred_name='Dora' and business_display_name='Negócio Dora' from public.account_pending_setup_conversations where id=cd),'E10.11 preserved');

 -- Normalized null-parent uniqueness is global and cannot be bypassed with a new slug.
 perform pg_temp.expect_error('insert into public.business_taxons(level,name,slug,is_active)
   values(''segment'',''  e1012 serviços LOCAIS  '',''e1012-duplicate-slug'',true)','23505');
end $$;
-- A changed primary rejects the whole turn; obsolete proposal is discarded without automatic reevaluation.
do $primary$
declare u uuid:='e1012000-0000-4000-8000-000000000001';
 a uuid:='e1012000-0000-4000-8000-000000000013'; c uuid; v bigint; v2 bigint;
 token uuid:=gen_random_uuid(); primary_id uuid; target uuid; proposal jsonb; n bigint; prior_summary text;
begin
 select id into target from public.business_taxons where name='E1012 Manutenção de jardins';
 insert into public.business_taxons(level,name,slug,is_active)
 values('segment','E1012 Administrativo','e1012-admin-primary',true) returning id into primary_id;
 c:=public.start_account_pending_setup_v2(a,u,'Clara');
 proposal:=jsonb_build_object('kind','existing','taxonId',target,'chain','[]'::jsonb,'aliases','[]'::jsonb,'evidence','','sources','[]'::jsonb);
 update public.account_pending_setup_conversations set stage='niche_confirmation',attendance_proposal=proposal,
  business_context_text='Contexto apresentado original.',confirmation_kind='official' where id=c;
 update public.account_context_summaries set summary='Memória útil preservada.',source_dialogue_id=c,source_user_id=u where account_id=a;
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,1,token,'Sim original','confirm');
 select count(*) into n from public.account_pending_setup_messages where conversation_id=c;
 insert into public.account_taxonomy(account_id,taxon_id,is_primary,status,source_type)
 values(a,primary_id,true,'active','taxonomy_match');
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,%L,%L,null,true)',
  c,a,u,v,token,'Sucesso proibido','Resumo não deve ser gravado.','Clara','ready_to_complete'),'40001');
 perform pg_temp.assert_true((select summary='Memória útil preservada.' from public.account_context_summaries where account_id=a),'primary conflict rolls back memory');
 v2:=public.discard_account_pending_setup_proposal_v2(c,a,u,v,token);
 perform pg_temp.assert_true(public.discard_account_pending_setup_proposal_v2(c,a,u,v,token)=v2,'discard idempotent');
 perform pg_temp.assert_true((select attendance_proposal is null and confirmation_kind is null
  and stage='business_understanding' and business_context_text='Contexto apresentado original.'
  and pending_turn_intent is null and pending_turn_ordinal is null
  from public.account_pending_setup_conversations where id=c),'obsolete proposal discarded; useful context retained');
 perform pg_temp.assert_true((select count(*)=n+1 from public.account_pending_setup_messages where conversation_id=c),'one persisted warning without success');
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,''Sim antigo'',''confirm'')',
  c,a,u,v2,gen_random_uuid()),'22023');
 perform pg_temp.assert_true((select taxon_id=primary_id and source_type='taxonomy_match'
  from public.account_taxonomy where account_id=a),'administrative link untouched');
 -- Only a new user action resumes. Compatible current category is reused without another Sim.
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,'Minha atividade corresponde à categoria atual.','message');
 proposal:=jsonb_set(proposal,'{taxonId}',to_jsonb(primary_id));
 v2:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Podemos continuar.',
  'Entendimento atualizado pelo usuário.','Clara','ready_to_complete',proposal,false,false,primary_id);
 perform pg_temp.assert_true((select stage='ready_to_complete' and attendance_proposal is null from public.account_pending_setup_conversations where id=c),'ordinary reuse requires no new confirmation');
 perform pg_temp.assert_true((select taxon_id=primary_id and source_type='taxonomy_match'
  from public.account_taxonomy where account_id=a),'ordinary reuse preserves admin provenance');
 -- Expired and cross-user discard cannot append or change state.
 update public.account_pending_setup_conversations set stage='business_understanding' where id=c;
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v2,token,'Mais contexto','message');
 update public.account_pending_setup_conversations set pending_turn_started_at=clock_timestamp()-interval '7 minutes' where id=c;
 perform pg_temp.expect_error(format('select public.discard_account_pending_setup_proposal_v2(%L,%L,%L,%s,%L)',c,a,u,v,token),'40001');
 perform pg_temp.expect_error(format('select public.discard_account_pending_setup_proposal_v2(%L,%L,%L,%s,%L)',c,a,
  'e1012000-0000-4000-8000-000000000002',v,token),'P0002');
end $primary$;

-- Context is singleton, attributed and service-only; historical authors never become authorized writers.
do $context$
declare a uuid:='e1012000-0000-4000-8000-000000000011';
 u uuid:='e1012000-0000-4000-8000-000000000001'; viewer uuid:='e1012000-0000-4000-8000-000000000002';
 c uuid; historical uuid:=gen_random_uuid(); v bigint; token uuid:=gen_random_uuid(); prior_summary text; prior_messages bigint;
begin
 perform pg_temp.expect_error(format('update public.account_users set role=''owner'' where account_id=%L and user_id=%L',a,viewer),'23505');
 select id,version into c,v from public.account_pending_setup_conversations where account_id=a and user_id=u;
 select summary into prior_summary from public.account_context_summaries where account_id=a;
 insert into public.account_pending_setup_conversations(id,account_id,user_id,stage,business_context_text)
 values(historical,a,viewer,'business_understanding','Contexto histórico de outro participante.');
 insert into public.account_dialogues(id,account_id,user_id,origin) values(historical,a,viewer,'pending_setup');
 perform pg_temp.assert_true((select count(*)=2 and count(distinct user_id)=2 from public.account_dialogues where account_id=a),'dialogues retain distinct participant identity');
 perform pg_temp.assert_true((select count(*)=1 from public.account_context_summaries where account_id=a),'summary unique per account, not per user');
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v2(%L,%L,%L,1,%L,''Tentativa'',''message'')',
 historical,a,viewer,gen_random_uuid()),'42501');
 perform pg_temp.assert_true((select summary=prior_summary from public.account_context_summaries where account_id=a),'historical actor cannot change account summary');
 -- Valid account status change after claim invalidates authority without modifying context or posting success.
 update public.account_pending_setup_conversations set stage='business_understanding' where id=c;
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,v,token,'Contexto adicional.','message');
 select count(*) into prior_messages from public.account_pending_setup_messages where conversation_id=c;
 update public.accounts set status='active' where id=a;
 perform pg_temp.expect_error(format('select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,null,''business_understanding'',null,false)',
 c,a,u,v,token,'Não publicar','Não substituir resumo'),'42501');
 perform pg_temp.assert_true((select summary=prior_summary from public.account_context_summaries where account_id=a),'revoked attendance status cannot overwrite memory');
 perform pg_temp.assert_true((select count(*)=prior_messages from public.account_pending_setup_messages where conversation_id=c),'revoked attendance status cannot post success');
 update public.accounts set status='pending_setup' where id=a;
 -- Ended attendance remains contextual after later official changes.
 select summary into prior_summary from public.account_context_summaries where account_id='e1012000-0000-4000-8000-000000000014';
 update public.accounts set name='Nome posterior oficial' where id='e1012000-0000-4000-8000-000000000014';
 perform pg_temp.assert_true((select summary=prior_summary from public.account_context_summaries
  where account_id='e1012000-0000-4000-8000-000000000014'),'official changes do not synchronize contextual memory');
end $context$;

-- Same-named niches in distinct hierarchies retain scoped identity and unique global slugs.
do $homonym$
declare u uuid:='e1012000-0000-4000-8000-000000000001'; a uuid; c uuid; v bigint; token uuid; proposal jsonb; i integer;
begin
 for i in 1..2 loop
  a:=(case when i=1 then 'e10125a0-0000-4000-8000-000000000021' else 'e10125a0-0000-4000-8000-000000000022' end)::uuid;
  insert into public.accounts(id,name,subdomain,slug,status)
   values(a,'E1012 Homonym '||i,'e1012-homonym-'||i,'e1012-homonym-'||i,'pending_setup');
  insert into public.account_users(account_id,user_id,role,status) values(a,u,'owner','active');
  c:=public.start_account_pending_setup_v2(a,u,null);
  select version into v from public.account_pending_setup_conversations where id=c;
  token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v,token,'Atividade confirmada com hierarquia própria.','message');
  proposal:=jsonb_build_object('kind','new','taxonId',null,'chain',jsonb_build_array(
   jsonb_build_object('level','segment','name','E1012 Homonym Parent '||i,'existingId',null),
   jsonb_build_object('level','niche','name','E1012 Scoped Homonym','existingId',null)),
   'aliases','[]'::jsonb,'evidence','Categoria comprovada.','sources',jsonb_build_array('https://example.com/market'));
  v:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Confirma entendimento?','Contexto confirmado.',null,'niche_confirmation',proposal,false);
  token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v,token,'Sim.','confirm');
  v:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Entendimento confirmado.','Contexto confirmado.',null,'ready_to_complete',null,true);
  perform pg_temp.assert_true(v=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Replay.','Contexto confirmado.',null,'ready_to_complete',null,true),'homonym confirmation replay idempotent');
 end loop;
 perform pg_temp.assert_true((select count(*)=2 and count(distinct parent_id)=2 and count(distinct slug)=2 and bool_and(is_active)
  from public.business_taxons where name='E1012 Scoped Homonym'),'homonyms retain distinct parents and unique slugs');
 perform pg_temp.assert_true((select count(*)=2 and count(distinct taxon_id)=2 from public.account_taxonomy
  where account_id in ('e10125a0-0000-4000-8000-000000000021','e10125a0-0000-4000-8000-000000000022') and is_primary and status='active'),'homonyms bind the respective hierarchy');
end $homonym$;

-- An evidenced new alias reuses an entirely existing hierarchy without creating another taxon.
do $alias_only$
declare a uuid:='e10125a0-0000-4000-8000-000000000024';
 u uuid:='e1012000-0000-4000-8000-000000000001'; parent uuid; leaf uuid; c uuid; v bigint;
 token uuid:=gen_random_uuid(); proposal jsonb; before_count bigint;
begin
 select id into parent from public.business_taxons where name='E1012 Homonym Parent 1';
 select id into leaf from public.business_taxons where name='E1012 Scoped Homonym' and parent_id=parent;
 select count(*) into before_count from public.business_taxons;
 insert into public.accounts(id,name,subdomain,slug,status)
 values(a,'Alias only','e1012-alias-only','e1012-alias-only','pending_setup');
 insert into public.account_users(account_id,user_id,role,status) values(a,u,'owner','active');
 c:=public.start_account_pending_setup_v2(a,u,null);
 proposal:=jsonb_build_object('kind','new','taxonId',null,'chain',jsonb_build_array(
  jsonb_build_object('level','segment','name','E1012 Homonym Parent 1','existingId',parent),
  jsonb_build_object('level','niche','name','E1012 Scoped Homonym','existingId',leaf)),
  'aliases',jsonb_build_array(jsonb_build_object('text','E1012 Expressão equivalente',
   'equivalentTo','E1012 Scoped Homonym','equivalence','proven','justification','Equivalência comprovada.',
   'evidenceUrls',jsonb_build_array('https://example.com/equivalence'))),
  'evidence','Equivalência real comprovada.','sources',jsonb_build_array('https://example.com/equivalence'));
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,1,token,'Expresso minha atividade por um termo equivalente.','message');
 v:=public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Confirma o entendimento?',
  'Atividade equivalente à categoria existente.',null,'niche_confirmation',proposal,false);
 token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v2(c,a,u,v,token,'Sim','confirm');
 perform public.commit_account_pending_setup_turn_v2(c,a,u,v,token,'Entendimento confirmado.',
  'Atividade equivalente à categoria existente.',null,'ready_to_complete',null,true);
 perform pg_temp.assert_true((select count(*)=before_count from public.business_taxons),'alias-only creates no taxon');
 perform pg_temp.assert_true((select taxon_id=leaf from public.account_taxonomy where account_id=a),'alias-only uses existing leaf');
 perform pg_temp.assert_true((select count(*)=1 from public.business_taxon_aliases
  where taxon_id=leaf and alias_text='E1012 Expressão equivalente' and is_active),'equivalent alias created once');
end $alias_only$;

-- Gate OFF suspends an initiated attendance instead of switching to the legacy motor.
do $gate_boundary$
declare a uuid:='e10125a0-0000-4000-8000-000000000025';
 u uuid:='e1012000-0000-4000-8000-000000000001'; c uuid; v bigint; old_version bigint; before_state jsonb; message_count integer;
 old_token uuid:=gen_random_uuid(); legacy_token uuid:=gen_random_uuid(); fresh_token uuid:=gen_random_uuid();
 proposal jsonb:='{"kind":"operational_fallback","taxonId":null,"chain":[],"aliases":[],"evidence":"","sources":[]}';
begin
 insert into public.accounts(id,name,subdomain,slug,status)
 values(a,'Gate takeover','e1012-gate-takeover','e1012-gate-takeover','pending_setup');
 insert into public.account_users(account_id,user_id,role,status) values(a,u,'owner','active');
 c:=public.start_account_pending_setup_v2(a,u,'Ana');
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,1,old_token,'Descrição inicial.','message');
 v:=public.commit_account_pending_setup_turn_v2(c,a,u,v,old_token,'Confirma entendimento?',
  'Descrição inicial.',null,'niche_confirmation',proposal,false);
 perform pg_temp.expect_error(format('select public.start_account_pending_setup_v1(%L,%L,null)',a,u),'55000');
 old_token:=gen_random_uuid();
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,v,old_token,'Sim antigo.','confirm');
 old_version:=v;
 v:=public.release_account_pending_setup_turn_v2(c,a,u,v,old_token);
 select to_jsonb(s) into before_state from public.account_pending_setup_conversations s where id=c;
 select count(*) into message_count from public.account_pending_setup_messages where conversation_id=c;
 perform pg_temp.expect_error(format('select public.claim_account_pending_setup_turn_v1(%L,%L,%L,%s,%L)',c,a,u,v,legacy_token),'55000');
 perform pg_temp.expect_error(format(
  'select public.append_account_pending_setup_turn_v1(%L,%L,%L,%s,%L,%L,%L,%L,null,%L)',
  c,a,u,v,legacy_token,'Entrada do legado.','Resposta do legado.','business_understanding','Descrição do legado.'),'55000');
 perform pg_temp.assert_true((select to_jsonb(s)=before_state from public.account_pending_setup_conversations s where id=c)
  and (select count(*)=message_count from public.account_pending_setup_messages where conversation_id=c),
  'legacy cannot alter attendance state, proposal, intention or transcript');
 perform public.start_account_pending_setup_v2(a,u,null);
 perform pg_temp.expect_error(format(
  'select public.commit_account_pending_setup_turn_v2(%L,%L,%L,%s,%L,%L,%L,null,%L,null,true)',
  c,a,u,old_version,old_token,'Confirmação antiga.','Descrição inicial.','ready_to_complete'),'40001');
 perform pg_temp.assert_true(not exists(select 1 from public.account_taxonomy where account_id=a),'suspension produces no classification or false success');
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,v,fresh_token,null,'confirm');
 perform pg_temp.assert_true((select count(*)=message_count from public.account_pending_setup_messages where conversation_id=c),
  'same attendance motor resumes the persisted entry without replay or new confirmation');
 perform public.commit_account_pending_setup_turn_v2(c,a,u,v,fresh_token,'Entendimento confirmado.',
  'Descrição inicial.',null,'ready_to_complete',null,true);

 -- A failed initial greeting also remains suspended; legacy identity cannot take over.
 a:='e10125a0-0000-4000-8000-000000000026';
 insert into public.accounts(id,name,subdomain,slug,status)
 values(a,'Identity takeover','e1012-identity-takeover','e1012-identity-takeover','pending_setup');
 insert into public.account_users(account_id,user_id,role,status) values(a,u,'owner','active');
 c:=public.start_account_pending_setup_v2(a,u,null);
 fresh_token:=gen_random_uuid();
 v:=public.claim_account_pending_setup_turn_v2(c,a,u,1,fresh_token,null,'initialize');
 v:=public.release_account_pending_setup_turn_v2(c,a,u,v,fresh_token);
 select to_jsonb(s) into before_state from public.account_pending_setup_conversations s where id=c;
 perform pg_temp.expect_error(format('select public.start_account_pending_setup_v1(%L,%L,null)',a,u),'55000');
 perform pg_temp.expect_error(format('select public.set_account_pending_setup_preferred_name_v1(%L,%L,%L,%L,%s)',c,a,u,'Ana',v),'55000');
 perform pg_temp.assert_true((select to_jsonb(s)=before_state from public.account_pending_setup_conversations s where id=c)
  and not exists(select 1 from public.account_pending_setup_messages where conversation_id=c),
  'failed initialization stays intact without a legacy greeting or metadata reset');

 -- The gate still preserves legacy conversations that have not started an attendance turn.
 a:='e10125a0-0000-4000-8000-000000000027';
 insert into public.accounts(id,name,subdomain,slug,status)
 values(a,'Legacy retained','e1012-legacy-retained','e1012-legacy-retained','pending_setup');
 insert into public.account_users(account_id,user_id,role,status) values(a,u,'owner','active');
 c:=public.start_account_pending_setup_v1(a,u,'Ana');
 legacy_token:=gen_random_uuid(); v:=public.claim_account_pending_setup_turn_v1(c,a,u,1,legacy_token);
 v:=public.append_account_pending_setup_turn_v1(c,a,u,v,legacy_token,'Descrição do legado.',
  'Seguimos no legado.','business_understanding',null,'Descrição do legado.');
 perform pg_temp.assert_true((select last_attendance_turn_token is null and pending_turn_intent is null
  from public.account_pending_setup_conversations where id=c),'ordinary legacy stays usable');
 select to_jsonb(s) into before_state from public.account_pending_setup_conversations s where id=c;
 select count(*) into message_count from public.account_pending_setup_messages where conversation_id=c;
 perform pg_temp.expect_error(format('select public.start_account_pending_setup_v2(%L,%L,null)',a,u),'55000');
 perform pg_temp.assert_true((select to_jsonb(s)=before_state from public.account_pending_setup_conversations s where id=c)
  and (select count(*)=message_count from public.account_pending_setup_messages where conversation_id=c)
  and not exists(select 1 from public.account_dialogues where account_id=a)
  and not exists(select 1 from public.account_context_summaries where account_id=a),
  'legacy conversation is neither converted nor reconstructed');
end $gate_boundary$;

rollback;
