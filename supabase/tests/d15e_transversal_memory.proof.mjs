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
  const migration = '20261119152000_d15e_conversational_turns.sql';
  const attendance = '../migrations/20261007153217_e10_12_account_context_attendance.sql';
  for (const name of ['start_account_pending_setup_v2', 'claim_account_pending_setup_turn_v2', 'release_account_pending_setup_turn_v2']) {
    await db.query(fn(attendance, name));
  }
  await db.query(fn('../migrations/20260928161504_e10_11_pending_setup_business_name.sql', 'set_account_pending_setup_business_name_v1'));
  await db.query('alter table account_pending_setup_conversations alter id set default gen_random_uuid()');
  await db.query('alter table account_pending_setup_conversations add created_at timestamptz not null default clock_timestamp()');
  await db.query('alter table account_pending_setup_conversations add unique(account_id,user_id)');
  await db.query(read('../migrations/' + migration));
  await db.query(read('../migrations/20261121123500_d15e_pending_setup_contact_in_claim.sql'));
  await db.query(read('../migrations/20261121163325_d15e_confirm_legacy_niche_in_dialogue.sql'));

  await test('versioned RPCs are restricted to the server role',async()=>{
    const {rows}=await db.query(`select proname,
      has_function_privilege('service_role',p.oid,'execute') as service,
      has_function_privilege('authenticated',p.oid,'execute') as member,
      has_function_privilege('anon',p.oid,'execute') as anon,
      has_function_privilege('ai_readonly',p.oid,'execute') as ai
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and proname=any($1)`,[[
      'claim_account_niche_turn_v2','commit_account_niche_turn_v2',
      'claim_account_pending_setup_turn_v3','commit_account_pending_setup_turn_v5',
    ]]);
    assert.equal(rows.length,4);
    assert.ok(rows.every(row=>row.service&&!row.member&&!row.anon&&!row.ai));
  });

  const proposal = 'Jardinagem para condomínios';
  const synthesisText = 'Atende condomínios com serviços de jardinagem.';
  const effect = (opts={}) => ({offer:null,accept:null,clear:false,partial:false,nicheReaction:'continue',...opts});
  const offer = (contact=null) => ({start:1,length:synthesisText.length,contact});
  const reserve = async (f, { dialogue = id(), request = id(), token = id(), version = 0, content = 'Atendemos condomínios.', client = db } = {}) => {
    const niche = await official(f.a);
    const {rows} = await client.query('select claim_account_niche_turn_v2($1,$2,$3,$4,$5,$6,$7,$8) result',
      [dialogue,f.a,f.u,version,request,token,content,niche ? 'text:' + niche.revision : null]);
    return { ...rows[0].result, d: dialogue, request, token, user: f.u, content };
  };
  const write = async (f,c,{next=null,accept=null,keep=false,summary=null,
    synthesis=effect(accept ? {accept:c.state?.synthesis?.messageId,nicheReaction:'accept'} : {})}={}) => {
    const reply = [synthesis.offer ? synthesisText : '',next ? 'Proponho ' + next : 'Entendido.'].filter(Boolean).join(' ');
    return (await db.query('select commit_account_niche_turn_v2($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) result',
      [c.d,f.a,f.u,c.version,c.token,reply,'',next,summary,c.summary,c.summaryUpdatedAt,accept,keep,synthesis])).rows[0].result;
  };
  const messages = async (c) => (await db.query('select role,content from account_pending_setup_messages where dialogue_id=$1 order by ordinal',[c.d])).rows;
  await test('D14D with product can confirm only its unconfirmed legacy description through chat', async () => {
    const legacy = 'Manutenção de jardins';
    const seed = async confirmed => {
      const f = await fixture(null);
      const taxon = id();
      await db.query('insert into business_taxons(id,level,is_active,name,slug) values($1,\'niche\',true,$2,$2)', [taxon,legacy]);
      await db.query("insert into account_taxonomy(account_id,taxon_id,is_primary,status,source_type,user_confirmed_at) values($1,$2,true,'active','taxonomy_match',case when $3 then clock_timestamp() end)", [f.a,taxon,confirmed]);
      await db.query('insert into account_landing_pages values($1,$2)', [id(),f.a]);
      return f;
    };
    await assert.rejects(reserve(await seed(true)), /niche_product_exists/);
    const f = await seed(false);
    const opened = await reserve(f, {content:'Quero conferir o nicho cadastrado.'});
    await assert.rejects(write(f,opened,{next:'Construção residencial',synthesis:effect({offer:offer()})}),/niche_product_exists/);
    const presented = await write(f,opened,{next:legacy,synthesis:effect({offer:offer()})});
    const yes = await reserve(f, {dialogue:opened.d,version:presented.version,content:'Sim.'});
    await assert.rejects(write(f,yes,{accept:'Construção residencial'}),/niche_changed/);
    assert.equal((await write(f,yes,{accept:legacy})).confirmed,true);
    assert.equal((await official(f.a)).description,legacy);
    assert.equal(JSON.parse((await memory(f.a)).summary).classification,legacy);
    assert.equal((await messages(yes)).filter(message=>message.role==='user'&&message.content==='Sim.').length,1);
  });
  async function propose(f) {
    const opened = await reserve(f);
    const written = await write(f, opened, { next: proposal, synthesis:effect({offer:offer()}) });
    return { dialogue: opened.d, version: written.version };
  }
  await test('v2 preserves the exact proposal across interruption; acceptance, reply and memory commit together',async()=>{
    const f = await fixture();
    const offered = await propose(f);
    const c = await reserve(f,{...offered,content:'Representa exatamente o que fazemos. Também atendemos empresas pequenas.'});
    assert.equal(c.state.proposal,proposal);
    await release(f,c);
    await assert.rejects(reserve(f,offered),/niche_turn_conflict/);
    const retried = await reserve(f,{...offered,request:c.request,content:c.content});
    assert.equal(retried.state.proposal,proposal);
    assert.equal((await messages(c)).length,3);
    const summary = {...JSON.parse(c.summary),contextualUnderstanding:'Atende também empresas pequenas.'};
    const result = await write(f,retried,{accept:proposal,summary:JSON.stringify(summary)});
    assert.deepEqual(result,{version:retried.version+2,confirmed:true});
    assert.equal((await official(f.a)).description,proposal);
    assert.equal(JSON.parse((await memory(f.a)).summary).classification,proposal);
    assert.equal(JSON.parse((await memory(f.a)).summary).contextualUnderstanding,summary.contextualUnderstanding);
    assert.equal((await messages(c)).length,4);
    assert.deepEqual(await write(f,retried,{accept:proposal}),result);
    assert.equal((await reserve(f,{...offered,request:c.request,content:c.content})).replay,true);
    await assert.rejects(reserve(f,{...offered,request:c.request,content:'Resposta diferente'}),/niche_request_conflict/);
  });
  await test('doubt can preserve a proposal; correction replaces it without an official write',async()=>{
    const f = await fixture();
    const offered = await propose(f);
    const doubt = await reserve(f,{...offered,content:'Condomínios residenciais?'});
    const clarified = await write(f,doubt,{keep:true});
    const c = await reserve(f,{dialogue:doubt.d,version:clarified.version,content:'Também atendemos hotéis.'});
    const next = 'Jardinagem para condomínios e hotéis';
    assert.equal(c.state.proposal,proposal);
    const corrected = await write(f,c,{next,synthesis:effect({offer:offer()})});
    await assert.rejects(reserve(f,{dialogue:c.d,version:corrected.version,request:doubt.request,content:doubt.content}),/niche_request_conflict/);
    const newTurn = await reserve(f,{dialogue:c.d,version:corrected.version,content:'Tudo certo.'});
    await assert.rejects(write(f,newTurn,{synthesis:effect({accept:c.state.synthesis.messageId})}),/niche_synthesis_required/);
    await assert.rejects(write(f,newTurn,{accept:proposal}),/niche_changed/);
    assert.equal((await official(f.a)).revision,'1');
    assert.equal(newTurn.state.proposal,next);
  });
  await test('separate concurrent sessions cannot reserve the same dialogue twice',async()=>{
    const f = await fixture();
    const offered = await propose(f);
    const other = new pg.Client({...settings,database});
    await other.connect();
    try {
      await db.query('begin');
      await reserve(f,offered);
      const racing = reserve(f,{...offered,client:other}).then(()=>null,error=>error);
      await db.query('commit');
      assert.match((await racing)?.message??'',/niche_turn_conflict/);
    } finally { await db.query('rollback'); await other.end(); }
  });
  await test('unconfirmed Summary writes fail; an accepted snapshot retries against newer Summary without overwriting it',async()=>{
    const f = await fixture();
    const offered = await propose(f);
    const c = await reserve(f,{...offered,content:'A síntese está certa.'});
    const latest = { ...JSON.parse(c.summary), contextualUnderstanding:'Novo contexto de outro participante.' };
    await db.query('update account_context_summaries set summary=$2,updated_at=clock_timestamp() where account_id=$1',[f.a,JSON.stringify(latest)]);
    await assert.rejects(write(f,c,{summary:JSON.stringify(latest)}),/niche_synthesis_required/);
    await assert.rejects(write(f,c,{summary:JSON.stringify(latest),
      synthesis:effect({accept:c.state.synthesis.messageId})}),/niche_summary_changed/);
    await release(f,c);
    const retry = await reserve(f,{...offered,request:c.request,content:c.content});
    const written = await write(f,retry,{keep:true,summary:JSON.stringify({...JSON.parse(retry.summary),confirmedUnderstanding:synthesisText}),
      synthesis:effect({accept:retry.state.synthesis.messageId})});
    assert.equal(written.confirmed,false);
    assert.equal((await messages(c)).length,4);
    assert.equal(JSON.parse((await memory(f.a)).summary).contextualUnderstanding,latest.contextualUnderstanding);
  });
  await test('partial niche assent and abandonment leave Summary intact until the same synthesis is accepted',async()=>{
    const f = await fixture();
    const before = await memory(f.a);
    const offered = await propose(f);
    const c = await reserve(f,{...offered,content:'O nicho sim, quero rever a síntese.'});
    const partial = await write(f,c,{keep:true,synthesis:effect({partial:true,nicheReaction:'accept'})});
    assert.deepEqual(await memory(f.a),before);
    assert.equal((await official(f.a)).revision,'1');
    const resumed = await reserve(f,{dialogue:c.d,version:partial.version,content:'A síntese também está certa.'});
    assert.equal(resumed.state.nicheAccepted,true);
    assert.equal(resumed.state.synthesisRequired,true);
    assert.equal(resumed.state.synthesisPartialId,c.request);
    assert.equal(resumed.state.synthesis.messageId,c.state.synthesis.messageId);
    const final = await write(f,resumed,{accept:proposal,summary:JSON.stringify({...JSON.parse(resumed.summary),confirmedUnderstanding:synthesisText}),
      synthesis:effect({accept:resumed.state.synthesis.messageId})});
    assert.equal(final.confirmed,true);
    assert.equal(JSON.parse((await memory(f.a)).summary).confirmedUnderstanding,synthesisText);
  });
  await test('a draft product added after reservation blocks confirmation without a reply or partial memory',async()=>{
    const f = await fixture();
    const offered = await propose(f);
    const c = await reserve(f,offered);
    await db.query("alter table account_landing_pages add column if not exists status text default 'draft'");
    await db.query("insert into account_landing_pages(id,account_id,status)values($1,$2,'draft')",[id(),f.a]);
    const before = await memory(f.a);
    await assert.rejects(write(f,c,{accept:proposal}),/niche_product_exists/);
    assert.equal((await official(f.a)).revision,'1');
    assert.equal((await messages(c)).length,3);
    assert.deepEqual(await memory(f.a),before);
  });
  await test('failed classification leaves the submitted acceptance available and rolls back the Base reply',async()=>{
    const f = await fixture('A');
    const opening = await reserve(f);
    const next = 'N'.repeat(120);
    const offered = await write(f,opening,{next,synthesis:effect({offer:offer()})});
    const j = {classification:'A',whatsapp:''};
    j.whatsapp = '9'.repeat(5990-JSON.stringify(j).length);
    await db.query('update account_context_summaries set summary=$2 where account_id=$1',[f.a,JSON.stringify(j)]);
    const c = await reserve(f,{dialogue:opening.d,version:offered.version,content:'É isso.'});
    await assert.rejects(write(f,c,{accept:next}),/niche_summary_capacity/);
    assert.equal((await official(f.a)).description,'A');
    assert.equal((await messages(c)).length,3);
  });

  async function pending() {
    const a=id(), u=id();
    await db.query("insert into accounts values($1,'pending_setup')",[a]);
    await db.query("insert into account_users values($1,$2,'owner','active')",[a,u]);
    const {rows}=await db.query('select start_account_pending_setup_v2($1,$2) d',[a,u]);
    return {a,u,d:rows[0].d,version:1};
  }
  async function reservePending(f,{version=f.version,content='Uma empresa de jardinagem.',request=id(),token=id()}={}) {
    const {rows}=await db.query('select claim_account_pending_setup_turn_v3($1,$2,$3,$4,$5,$6,$7) result',
      [f.d,f.a,f.u,version,request,token,content]);
    return {...rows[0].result,request,token,content};
  }
  async function writePending(f,c,{next=null,accept=false,stage='business_understanding',name=null,nameReaction='keep',
    understanding=synthesisText,summary=null,revision=0,synthesis=effect()}={}) {
    const prior=await memory(f.a);
    const reply = [synthesis.offer ? synthesisText : '',next?.nicheDescription ?? (next ? understanding : ''), name ?? ''].filter(Boolean).join(' ') || 'Entendido.';
    const {rows}=await db.query('select commit_account_pending_setup_turn_v5($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) result',
      [f.d,f.a,f.u,c.version,c.token,reply,summary,prior.summary,prior.updated_at,understanding,null,true,stage,
        next,accept,null,revision,name,nameReaction,true,false,synthesis]);
    return Number(rows[0].result);
  }
  await test('WhatsApp do campo grava no claim autorizado, sem síntese nem IA, com retry e correção',async()=>{
    const f = await pending();
    const content = 'Revenda de carros seminovos.\nWhatsApp para contato: (21) 99999-1111';
    const first = await reservePending(f,{content});
    const saved = await memory(f.a);
    assert.equal(JSON.parse(saved.summary).whatsapp,'(21) 99999-1111');
    assert.equal(JSON.parse(saved.summary).whatsappDeclined,false);
    assert.equal(saved.source_dialogue_id,f.d);
    assert.equal(saved.source_user_id,f.u);
    await db.query('select release_account_pending_setup_turn_v2($1,$2,$3,$4,$5)',
      [f.d,f.a,f.u,first.version,first.token]);
    const retry = await reservePending(f,{request:first.request,content});
    assert.equal((await memory(f.a)).updated_at,saved.updated_at);
    const version = await writePending(f,retry,{summary:null});
    assert.equal(JSON.parse((await memory(f.a)).summary).whatsapp,'(21) 99999-1111');
    const correction = await reservePending(f,{
      version,content:'Número corrigido.\nWhatsApp para contato: (21) 98888-2222',
    });
    assert.equal(JSON.parse((await memory(f.a)).summary).whatsapp,'(21) 98888-2222');
    const unchanged = (await memory(f.a)).summary;
    await db.query("update account_users set status='inactive' where account_id=$1 and user_id=$2",[f.a,f.u]);
    await assert.rejects(reservePending(f,{request:id(),version:correction.version,
      content:'WhatsApp para contato: (21) 97777-3333'}),/pending_setup_actor_not_allowed/);
    assert.equal((await memory(f.a)).summary,unchanged);
    const other = await pending();
    await reservePending(other,{content:'Número incompleto: WhatsApp para contato: (21) 99999'});
    assert.equal((await memory(other.a)).summary,null);
  });
  await test('Pending Setup reserves once, decides acceptance after the turn and reuses the public name RPC',async()=>{
    const f = await pending();
    const c = await reservePending(f,{content:'Oferecemos jardinagem. WhatsApp (21) 99999-1111.'});
    const next = {kind:'semantic',taxonId:null,taxonName:null,nicheDescription:proposal,expectedNicheRevision:0};
    const contact = {messageId:c.request,index:0};
    const offered = await writePending(f,c,{stage:'niche_confirmation',next,name:'Jardins do Vale',synthesis:effect({offer:offer(contact)})});
    const saved = async () => (await db.query('select niche_state from account_dialogues where id=$1',[f.d])).rows[0].niche_state;
    const snapshot = (await saved()).synthesis;
    assert.deepEqual(snapshot.contact,contact);
    const doubt = await reservePending(f,{version:offered,content:'Ainda não. Como ficaria?'});
    await assert.rejects(writePending(f,doubt,{stage:'niche_confirmation',next,summary:JSON.stringify({whatsapp:'(21) 99999-1111'})}),/pending_setup_synthesis_required/);
    const kept = await writePending(f,doubt,{stage:'niche_confirmation',next,nameReaction:'accept'});
    assert.equal((await memory(f.a)).summary,null);
    assert.equal((await saved()).synthesis.messageId,snapshot.messageId);
    assert.equal(await official(f.a),undefined);
    const reserved = await reservePending(f,{version:kept,content:'O nicho e o nome estão certos.'});
    await db.query('select release_account_pending_setup_turn_v2($1,$2,$3,$4,$5)',[f.d,f.a,f.u,reserved.version,reserved.token]);
    const retried = await reservePending(f,{version:kept,request:reserved.request,content:reserved.content});
    const ready=await writePending(f,retried,{stage:'ready_to_complete',accept:true,
      synthesis:effect({accept:snapshot.messageId,nicheReaction:'accept'}),
      summary:JSON.stringify({confirmedUnderstanding:synthesisText,classification:'Pendente',whatsapp:'(21) 99999-1111'})});
    assert.equal((await official(f.a)).description,proposal);
    assert.equal(JSON.parse((await memory(f.a)).summary).classification,proposal);
    assert.equal(JSON.parse((await memory(f.a)).summary).whatsapp,'(21) 99999-1111');
    assert.equal((await reservePending(f,{version:ready,request:reserved.request,content:reserved.content})).replay,true);
    assert.equal((await db.query('select count(*)::int n from account_pending_setup_messages where conversation_id=$1',[f.d])).rows[0].n,6);
    assert.equal((await db.query('select business_display_name from account_pending_setup_conversations where id=$1',[f.d])).rows[0].business_display_name,'Jardins do Vale');
    assert.equal((await db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,$4,'official',true) ok",[f.d,f.a,f.u,ready])).rows[0].ok,true);
  });
  await test('Pending Setup can finish without a niche after operational and name acceptance',async()=>{
    const f = await pending();
    const c = await reservePending(f);
    const next = {kind:'operational_fallback',taxonId:null,taxonName:null};
    const offered = await writePending(f,c,{stage:'niche_confirmation',next,name:'Jardins do Vale',synthesis:effect({offer:offer()})});
    const {rows}=await db.query('select niche_state from account_dialogues where id=$1',[f.d]);
    const reserved = await reservePending(f,{version:offered,content:'Podemos seguir com esse nome e esse entendimento.'});
    const ready = await writePending(f,reserved,{stage:'ready_to_complete',accept:true,nameReaction:'accept',
      synthesis:effect({accept:rows[0].niche_state.synthesis.messageId})});
    assert.equal(await official(f.a),undefined);
    assert.equal((await db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,$4,'operational_fallback',true) ok",[f.d,f.a,f.u,ready])).rows[0].ok,true);
  });
  console.log(JSON.stringify({database,postgres:'17',migration,cases:cases.length,result:'passed'}));
} finally {await db.end();await admin.query('drop database '+database+' with(force)');await admin.end();}
