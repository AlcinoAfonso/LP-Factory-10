import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {default:pg}=await import(pathToFileURL(resolve(process.argv[2],'pg/lib/index.js')).href);
const port=Number(process.argv[3]); assert.ok(Number.isInteger(port)&&port>1024);
const settings={host:'127.0.0.1',port,user:'postgres',database:'postgres'};
const admin=new pg.Client(settings);await admin.connect();
const database='d15e_r3_proof_'+Date.now();await admin.query('create database '+database);
const db=new pg.Client({...settings,database});await db.connect();
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const id=()=>crypto.randomUUID(); const cases=[];
const test=async(name,fn)=>{await fn();cases.push(name);console.log('PASS '+name);};
const fn=(file,name)=>{const s=read(file),i=s.indexOf('function public.'+name+'(');assert.ok(i>=0);return s.slice(s.lastIndexOf('create',i),s.indexOf('$$;',i)+3);};
const official=async a=>(await db.query('select * from account_official_niches where account_id=$1',[a])).rows[0];
const memory=async a=>(await db.query('select summary,updated_at::text as updated_at,source_dialogue_id,source_user_id from account_context_summaries where account_id=$1',[a])).rows[0];
async function fixture(description='Serviços'){
  const a=id(),u=id(),editor=id(),viewer=id(),legacy=id();
  await db.query("insert into accounts values($1,'active')",[a]);
  await db.query("insert into account_users values($1,$2,'owner','active'),($1,$3,'editor','active'),($1,$4,'viewer','active')",[a,u,editor,viewer]);
  await db.query("insert into account_dialogues(id,account_id,user_id,origin) values($1,$2,$3,'pending_setup')",[legacy,a,u]);
  const summary=JSON.stringify({contextualUnderstanding:'Empresa oferece serviços; interesse em melhorar comunicação.',confirmedUnderstanding:'Empresa oferece serviços.',classification:description??'Não identificada.',suggestions:['Hipótese: apresentar diferenciais.'],pendingReason:null,whatsapp:'11999990000'});
  await db.query('insert into account_context_summaries(account_id,summary,source_dialogue_id,source_user_id) values($1,$2,$3,$4)',[a,summary,legacy,u]);
  if(description)await db.query('insert into account_official_niches values($1,$2,1,$3,clock_timestamp())',[a,description,u]);
  return {a,u,editor,viewer,legacy};
}
async function claim(f,{d=id(),request=id(),token=id(),version=0,content='Agora atendemos condomínios.',user=f.u,revision}={}){
  if(revision===undefined){const n=await official(f.a);revision=n?'text:'+n.revision:null;}
  const r=await db.query('select claim_account_niche_turn_v1($1,$2,$3,$4,$5,$6,$7,$8) result',[d,f.a,user,version,request,token,content,revision]);
  return {...r.rows[0].result,d,request,token,user,content};
}
async function commit(f,c,{proposal='Jardinagem para condomínios',summary=c.summary,understanding='Declaração atual: manutenção de jardins para condomínios.'}={}){
  return (await db.query('select commit_account_niche_turn_v1($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) version',
    [c.d,f.a,c.user,c.version,c.token,proposal?'Proponho '+proposal+'. Confirma?':'Vamos esclarecer a oferta.',understanding,proposal,summary,c.summary,c.summaryUpdatedAt])).rows[0].version;
}
const release=(f,c)=>db.query('select release_account_niche_turn_v1($1,$2,$3,$4,$5)',[c.d,f.a,c.user,c.version,c.token]);
const confirm=(f,c,v,confirmed=true)=>db.query('select confirm_account_niche_dialogue_v1($1,$2,$3,$4,$5) revision',[c.d,f.a,c.user,v,confirmed]);
try{
  assert.match((await db.query('show server_version')).rows[0].server_version,/^17\./);
  for(const role of ['anon','authenticated','service_role','ai_readonly','readonly'])if(!(await admin.query('select 1 from pg_roles where rolname=$1',[role])).rowCount)await admin.query('create role '+role+(role==='service_role'?' bypassrls':''));
  await db.query('alter default privileges in schema public grant execute on functions to ai_readonly,readonly; alter default privileges in schema public grant select on tables to ai_readonly;');
  // Reuse the reviewed R2 compatibility fixture; replace its reduced context tables with the actual E10.12 DDL.
  const r2=read('./d15e_official_niche.proof.mjs');let ddl=JSON.parse(r2.slice(r2.indexOf('=')+1,r2.indexOf(';\n')));
  ddl=ddl.replace(/create table account_context_summaries\([^;]+;\n/,'').replace(/create table account_dialogues\([^;]+;\n/,'');
  await db.query(ddl);
  const e10=read('../migrations/20261007153217_e10_12_account_context_attendance.sql');
  await db.query(e10.slice(e10.indexOf('create table public.account_dialogues'),e10.indexOf('do $$ begin')).replace('between 1 and 4000','between 1 and 6000'));
  await db.query("alter table account_pending_setup_messages alter column conversation_id set not null;alter table account_pending_setup_messages add column created_at timestamptz not null default now();");
  await db.query(fn('../migrations/20261007153217_e10_12_account_context_attendance.sql','assert_pending_setup_actor_v2'));
  await db.query(fn('../migrations/20261009171607_e10_12_sales_attendance.sql','effect_pending_setup_taxonomy_v1'));
  await db.query(read('../migrations/20261112162500_d15e_official_text_niche.sql'));
  await db.query(read('../migrations/20261113111515_d15e_transversal_memory.sql'));
  await test('integral migration, invoker ACLs and private RLS',async()=>{
    const functions=(await db.query("select p.oid::regprocedure::text signature,p.prosecdef,p.proconfig from pg_proc p where pronamespace='public'::regnamespace and proname in ('assert_account_niche_actor_v1','account_niche_snapshot_v1','claim_account_niche_turn_v1','commit_account_niche_turn_v1','release_account_niche_turn_v1','confirm_account_niche_dialogue_v1')")).rows;
    assert.equal(functions.length,6);
    for(const f of functions){assert.equal(f.prosecdef,false);assert.ok(f.proconfig.includes('search_path=""'));for(const role of ['anon','authenticated','ai_readonly','readonly'])assert.equal((await db.query('select has_function_privilege($1,$2,\'execute\') allowed',[role,f.signature])).rows[0].allowed,false);}
    for(const table of ['account_dialogues','account_context_summaries']){assert.equal((await db.query('select relrowsecurity from pg_class where oid=$1::regclass',[table])).rows[0].relrowsecurity,true);assert.equal((await db.query("select count(*)::int count from pg_policies where tablename=$1",[table])).rows[0].count,0);}
  });
  const f=await fixture();
  await test('message survives provider failure/abandonment; stable request retry and replay',async()=>{
    const c=await claim(f);assert.equal((await db.query('select count(*)::int count from account_pending_setup_messages where dialogue_id=$1',[c.d])).rows[0].count,1);
    await release(f,c);const retried=await claim(f,{d:c.d,request:c.request,version:0,content:c.content});
    const v=await commit(f,retried);const replay=await claim(f,{d:c.d,request:c.request,version:0,content:c.content});assert.equal(replay.replay,true);
    assert.equal((await db.query('select count(*)::int count from account_pending_setup_messages where dialogue_id=$1',[c.d])).rows[0].count,2);
    assert.equal((await official(f.a)).revision,'1');assert.equal((await memory(f.a)).source_dialogue_id,f.legacy);
    await assert.rejects(confirm(f,c,v,false),/niche_confirmation_required/);
    const revision=(await confirm(f,c,v)).rows[0].revision;assert.equal(revision,'2');assert.equal((await confirm(f,c,v)).rows[0].revision,'2');
    const m=await memory(f.a),j=JSON.parse(m.summary);assert.equal(j.classification,'Jardinagem para condomínios');assert.equal((await official(f.a)).description,j.classification);
    assert.equal(j.whatsapp,'11999990000');assert.match(j.contextualUnderstanding,/interesse/);assert.equal(m.source_user_id,f.u);assert.equal(m.source_dialogue_id,c.d);
  });
  await test('no material change leaves Summary and provenance untouched',async()=>{
    const before=await memory(f.a),c=await claim(f,{content:'Obrigado.'});await commit(f,c,{summary:null,proposal:null,understanding:''});assert.deepEqual(await memory(f.a),before);
    const c2=await claim(f,{content:'Pode esclarecer?'});await commit(f,c2,{summary:JSON.stringify(JSON.parse(c2.summary)),proposal:null,understanding:''});assert.deepEqual(await memory(f.a),before);
  });
  await test('two participants: shared company memory, separate history, CAS prevents lost updates',async()=>{
    const a=await claim(f),b=await claim(f,{user:f.editor});
    const first={...JSON.parse(a.summary),contextualUnderstanding:'Declaração: jardins e contratos mensais.'};await commit(f,a,{summary:JSON.stringify(first)});
    await assert.rejects(commit(f,b),/niche_summary_changed/);assert.equal((await db.query("select count(*)::int count from account_pending_setup_messages where dialogue_id=$1 and role='assistant'",[b.d])).rows[0].count,0);
    await release(f,b);const retry=await claim(f,{d:b.d,request:b.request,user:f.editor,version:0,content:b.content});assert.match(retry.summary,/contratos mensais/);
    await commit(f,retry,{summary:JSON.stringify({...JSON.parse(retry.summary),contextualUnderstanding:'Declaração: jardins, contratos mensais e condomínios.'})});
    assert.equal((await memory(f.a)).source_user_id,f.editor);assert.equal((await db.query('select user_id from account_dialogues where id=$1',[a.d])).rows[0].user_id,f.u);
  });
  await test('authorization, actor status, account status, cross-tenant and drafts',async()=>{
    await assert.rejects(claim(f,{user:f.viewer}),/niche_access_denied/);
    const c=await claim(f);const other=await fixture();await assert.rejects(claim(other,{d:c.d,version:1}),/no rows|niche_changed/);
    await db.query("update account_users set status='inactive' where account_id=$1 and user_id=$2",[f.a,f.u]);await assert.rejects(commit(f,c),/niche_access_denied/);
    await db.query("update account_users set status='active' where account_id=$1 and user_id=$2",[f.a,f.u]);
    await db.query("update accounts set status='suspended' where id=$1",[f.a]);await assert.rejects(commit(f,c),/niche_access_denied/);await db.query("update accounts set status='active' where id=$1",[f.a]);
    await db.query('insert into account_landing_pages values($1,$2)',[id(),f.a]);await assert.rejects(commit(f,c,{proposal:'Outra atividade'}),/niche_product_exists/);
    const initial=await fixture(null);await db.query('insert into account_landing_pages values($1,$2)',[id(),initial.a]);const x=await claim(initial);const v=await commit(initial,x);assert.equal((await confirm(initial,x,v)).rows[0].revision,'1');
  });
  await test('official concurrency and wrong fence cannot partially publish',async()=>{
    const x=await fixture(),c=await claim(x),v=await commit(x,c),d=await claim(x),w=await commit(x,d);
    await confirm(x,c,v);const before=await memory(x.a);await assert.rejects(confirm(x,d,w),/niche_changed/);assert.deepEqual(await memory(x.a),before);
    const y=await fixture(),pending=await claim(y);await assert.rejects(commit(y,{...pending,token:id()}),/niche_turn_conflict/);
    await assert.rejects(confirm(y,pending,null),/niche_changed/);
    assert.equal((await official(y.a)).revision,'1');
  });
  await test('capacity failure after official effect rolls back both authorities',async()=>{
    const x=await fixture('A'),c=await claim(x),v=await commit(x,c,{proposal:'N'.repeat(120),summary:null});
    const j={contextualUnderstanding:'C'.repeat(4000),confirmedUnderstanding:'F'.repeat(1000),classification:'A',suggestions:[],pendingReason:null,whatsapp:''};
    j.whatsapp='9'.repeat(5990-JSON.stringify(j).length);const raw=JSON.stringify(j);assert.equal(raw.length,5990);
    await db.query('update account_context_summaries set summary=$2 where account_id=$1',[x.a,raw]);const before=await memory(x.a);
    await assert.rejects(confirm(x,c,v),/niche_summary_capacity/);assert.equal((await official(x.a)).description,'A');assert.equal((await official(x.a)).revision,'1');assert.deepEqual(await memory(x.a),before);
  });
  await test('legacy Pending Setup key and exclusive message linkage preserved; no draft persisted',async()=>{
    const x=await fixture(),c=await claim(x,{content:null});
    assert.equal((await db.query('select count(*)::int count from account_pending_setup_messages where dialogue_id=$1',[c.d])).rows[0].count,0);
    const conv=id();await db.query("insert into account_pending_setup_conversations(id,account_id,user_id,stage)values($1,$2,$3,'completed')",[conv,x.a,x.u]);
    await db.query("insert into account_pending_setup_messages(conversation_id,ordinal,role,content)values($1,1,'user','Legacy preserved')",[conv]);
    await assert.rejects(db.query("insert into account_pending_setup_messages(conversation_id,dialogue_id,ordinal,role,content)values($1,$2,2,'user','invalid')",[conv,c.d]),/account_messages_one_journey_check/);
    await assert.rejects(db.query("insert into account_pending_setup_messages(ordinal,role,content)values(1,'user','invalid')"),/account_messages_one_journey_check/);
    await assert.rejects(claim(x,{d:x.legacy}),/no rows/);
    assert.equal((await db.query('select content from account_pending_setup_messages where conversation_id=$1',[conv])).rows[0].content,'Legacy preserved');
  });
  console.log(JSON.stringify({database,postgres:'17',migration:'20261113111515_d15e_transversal_memory.sql',cases:cases.length,result:'passed'}));
} finally {await db.end();await admin.query('drop database '+database+' with(force)');await admin.end();}
