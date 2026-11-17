const DDL="\ncreate table accounts(id uuid primary key,status text not null);\ncreate table account_users(account_id uuid references accounts(id),user_id uuid,role text,status text,primary key(account_id,user_id));\ncreate table account_landing_pages(id uuid primary key,account_id uuid references accounts(id));\ncreate table business_taxons(id uuid primary key,parent_id uuid references business_taxons(id),level text,is_active boolean,name text,slug text);\ncreate table business_taxon_aliases(id uuid primary key);\ncreate table account_taxonomy(id uuid default gen_random_uuid(),account_id uuid references accounts(id),taxon_id uuid references business_taxons(id),is_primary boolean,status text,source_type text,updated_at timestamptz default now(),user_confirmed_at timestamptz,unique(account_id,taxon_id));\ncreate unique index active_primary on account_taxonomy(account_id) where is_primary and status='active';\ncreate table account_niche_resolutions(account_id uuid primary key,raw_input text,confidence text,ai_escalation_mode text,reason text,resolution_status text,user_resolution_status text,user_selected_taxon_id uuid,user_rewrite_input text,user_confirmed_at timestamptz);\ncreate table account_pending_setup_conversations(id uuid primary key,account_id uuid references accounts(id),user_id uuid,preferred_name text,business_context_text text,business_display_name text,stage text,confirmation_kind text,resolution_outcome text,pending_turn_token uuid,pending_turn_started_at timestamptz,version bigint default 1,updated_at timestamptz default now(),completed_at timestamptz,attendance_proposal jsonb,preferred_name_declined boolean default false,pending_turn_ordinal int,pending_turn_intent text,last_attendance_turn_token uuid);\ncreate table account_pending_setup_messages(id uuid default gen_random_uuid(),conversation_id uuid references account_pending_setup_conversations(id),ordinal int,role text,content text check(char_length(content) between 1 and 4000),unique(conversation_id,ordinal));\ncreate table account_context_summaries(account_id uuid primary key,summary text check(char_length(summary)<=6000),source_dialogue_id uuid,source_user_id uuid,updated_at timestamptz);\ncreate table account_dialogues(id uuid primary key,account_id uuid,user_id uuid,ended_at timestamptz);\ncreate function raise_postgrest_safe_conflict_v1(text) returns void language plpgsql as $$begin raise exception '%',$1 using errcode='40001';end;$$;\ncreate function audit_context_event(text,text,uuid,jsonb,uuid) returns void language plpgsql as $$begin return;end;$$;\ngrant usage on schema public to service_role,authenticated,anon;\ngrant all on all tables in schema public to service_role;\n";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const port=Number(process.argv[3]);assert.ok(Number.isInteger(port)&&port>1024);
assert.ok(process.argv[2],"Pass the existing pg module directory and isolated port");
const { default: pg } = await import(pathToFileURL(resolve(process.argv[2],"pg/lib/index.js")).href);
const admin = new pg.Client({host:"127.0.0.1",port,user:"postgres",database:"postgres"});
await admin.connect();
const name="d15e_r2_proof_"+Date.now();
await admin.query("create database "+name);
const settings={host:"127.0.0.1",port,user:"postgres",database:name};
const db=new pg.Client(settings);await db.connect();
const id=n=>"10000000-0000-4000-8000-"+String(n).padStart(12,"0");
const account=id(1), owner=id(2), outsider=id(3), taxon=id(4);
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const fn=(p,n)=>{let s=read(p).replace(/\r\n/g,"\n");let i=s.indexOf("function public."+n+"(");assert.ok(i>=0,n);let start=s.lastIndexOf("create",i);return s.slice(start,s.indexOf("$$;",i)+3);};
try {
  assert.match((await db.query("show server_version")).rows[0].server_version,/^17\./);
  for(const role of ["anon","authenticated","service_role","ai_readonly"]) {
    if(!(await admin.query("select 1 from pg_roles where rolname=$1",[role])).rowCount)
      await admin.query("create role "+role+(role==="service_role"?" bypassrls":""));
  }
  await db.query("alter default privileges in schema public grant execute on functions to ai_readonly; alter default privileges in schema public grant select on tables to ai_readonly;");
  await db.query(DDL);
  await db.query(fn("../migrations/20261007153217_e10_12_account_context_attendance.sql","assert_pending_setup_actor_v2"));
  await db.query(fn("../migrations/20261009171607_e10_12_sales_attendance.sql","effect_pending_setup_taxonomy_v1"));
  await db.query(read("../migrations/20261112162500_d15e_official_text_niche.sql"));
  assert.equal((await db.query("select has_table_privilege(\'ai_readonly\',\'account_official_niches\',\'select\') allowed")).rows[0].allowed,false);
  assert.equal((await db.query("select has_function_privilege(\'ai_readonly\',\'commit_account_pending_setup_turn_v4(uuid,uuid,uuid,bigint,uuid,text,text,text,text,text,jsonb,boolean,boolean,uuid,bigint)\',\'execute\') allowed")).rows[0].allowed,false);
  const confirm=(actor,description,revision=0,legacy=null,time=null)=>db.query("select confirm_account_official_niche_v1($1,$2,$3,$4,$5,$6,true) revision",[account,actor,description,revision,legacy,time]);
  await db.query("insert into accounts values($1,'active');",[account]);
  await db.query("insert into account_users values($1,$2,'owner','active'),($1,$3,'viewer','active')",[account,owner,outsider]);
  await assert.rejects(confirm(outsider,"Jardinagem"),/niche_access_denied/);
  assert.equal((await confirm(owner,"Jardinagem para condomínios")).rows[0].revision,"1");
  await assert.rejects(confirm(owner,"Outro nicho"),/niche_changed/);
  await db.query("insert into account_landing_pages values($1,$2)",[id(5),account]);
  await assert.rejects(confirm(owner,"Outro nicho",1),/niche_product_exists/);
  assert.equal((await confirm(owner,"Jardinagem para condomínios",1)).rows[0].revision,"1");
  await db.query("delete from account_landing_pages");
  assert.equal((await confirm(owner,"Recuperação de jardins",1)).rows[0].revision,"2");
  const before=await db.query("select * from account_official_niches");
  await db.query("begin");await confirm(owner,"Paisagismo",2);await db.query("rollback");
  assert.deepEqual((await db.query("select * from account_official_niches")).rows,before.rows);
  await db.query("set role authenticated");
  await assert.rejects(db.query("select * from account_official_niches"),/permission denied/);
  await assert.rejects(db.query("select confirm_account_official_niche_v1($1,$2,'X',2,null,null,true)",[account,owner]),/permission denied/);
  await db.query("reset role");
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='account_official_niches'::regclass")).rows[0].relrowsecurity,true);
  const other=new pg.Client(settings);await other.connect();
  await db.query("begin");await confirm(owner,"Paisagismo de condomínios",2);
  await other.query("set lock_timeout='150ms'");
  await assert.rejects(other.query("insert into account_landing_pages values($1,$2)",[id(6),account]),/lock timeout/);
  await db.query("rollback");await other.end();

  async function preparePending(n) {
    const a=id(n), c=id(n+1), token=id(n+2);
    await db.query("insert into accounts values($1,'pending_setup')",[a]);
    await db.query("insert into account_users values($1,$2,'owner','active')",[a,owner]);
    await db.query("insert into account_pending_setup_conversations(id,account_id,user_id,stage,version,pending_turn_token,pending_turn_started_at,pending_turn_intent) values($1,$2,$3,'business_understanding',2,$4,clock_timestamp(),'message')",[c,a,owner,token]);
    await db.query("insert into account_dialogues(id,account_id,user_id) values($1,$2,$3)",[c,a,owner]);
    await db.query("insert into account_context_summaries(account_id) values($1)",[a]);
    return { a,c,token,n };
  }
  async function turn(f, token,version,stage,proposal,confirm=false,summary="{}") {
    return db.query("select commit_account_pending_setup_turn_v4($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) version",
      [f.c,f.a,owner,version,token,"Resposta comercial",summary,"Entendimento exibido",null,stage,proposal,confirm,false,f.legacyTaxonId ?? null,f.observedRevision ?? 0]);
  }
  async function reserveConfirm(f) {
    const token=id(f.n+3);
    await db.query("update account_pending_setup_conversations set pending_turn_token=$2,pending_turn_started_at=clock_timestamp(),pending_turn_intent='confirm',version=version+1 where id=$1",[f.c,token]);
    return token;
  }
  const semantic={kind:"semantic",taxonId:null,taxonName:null,nicheDescription:"Jardinagem para condomínios",expectedNicheRevision:0};
  const pending=await preparePending(10);
  assert.equal((await turn(pending,pending.token,2,"niche_confirmation",semantic)).rows[0].version,"3");
  assert.equal((await db.query("select count(*) from account_official_niches where account_id=$1",[pending.a])).rows[0].count,"0");
  await assert.rejects(turn(pending,id(99),2,"niche_confirmation",semantic),/pending_setup_version_conflict/);
  const confirmedToken=await reserveConfirm(pending);
  assert.equal((await turn(pending,confirmedToken,4,"ready_to_complete",null,true)).rows[0].version,"5");
  const saved=(await db.query("select * from account_official_niches where account_id=$1",[pending.a])).rows[0];
  assert.equal(saved.description,semantic.nicheDescription);assert.equal(saved.confirmed_by,owner);assert.equal(saved.revision,"1");
  assert.equal((await turn(pending,confirmedToken,4,"ready_to_complete",null,true)).rows[0].version,"5");
  assert.equal((await db.query("select count(*) from account_pending_setup_messages where conversation_id=$1",[pending.c])).rows[0].count,"2");
  await assert.rejects(db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,5,'official',true)",[pending.c,pending.a,owner]),/business_name_required/);
  await db.query("update account_pending_setup_conversations set business_display_name='Jardins QA' where id=$1",[pending.c]);
  assert.equal((await db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,5,'official',true) done",[pending.c,pending.a,owner])).rows[0].done,true);
  assert.equal((await db.query("select status from accounts where id=$1",[pending.a])).rows[0].status,"active");
  assert.ok((await db.query("select ended_at from account_dialogues where id=$1",[pending.c])).rows[0].ended_at);
  const fallback=await preparePending(20);
  await turn(fallback,fallback.token,2,"niche_confirmation",{kind:"operational_fallback",taxonId:null,taxonName:null});
  await turn(fallback,await reserveConfirm(fallback),4,"ready_to_complete",null,true);
  assert.equal((await db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,5,'operational_fallback',false) done",[fallback.c,fallback.a,owner])).rows[0].done,true);
  const atomic=await preparePending(30);
  await turn(atomic,atomic.token,2,"niche_confirmation",semantic);
  const atomicToken=await reserveConfirm(atomic);
  await db.query("alter table account_context_summaries add constraint proof_late_failure check(summary<>'rollback-me')");
  await assert.rejects(turn(atomic,atomicToken,4,"ready_to_complete",null,true,"rollback-me"),/proof_late_failure/);
  assert.equal((await db.query("select count(*) from account_official_niches where account_id=$1",[atomic.a])).rows[0].count,"0");
  assert.equal((await db.query("select version from account_pending_setup_conversations where id=$1",[atomic.c])).rows[0].version,"4");
  assert.equal((await db.query("select count(*) from account_pending_setup_messages where conversation_id=$1",[atomic.c])).rows[0].count,"1");
  await db.query("insert into business_taxons(id,level,is_active,name,slug) values($1,'segment',true,'Serviços','servicos')",[taxon]);
  const legacy=await preparePending(40);
  await turn(legacy,legacy.token,2,"niche_confirmation",{kind:"existing",taxonId:taxon,taxonName:"Serviços"});
  await turn(legacy,await reserveConfirm(legacy),4,"ready_to_complete",null,true);
  assert.equal((await db.query("select taxon_id from account_taxonomy where account_id=$1",[legacy.a])).rows[0].taxon_id,taxon);

  const auto=await preparePending(50); auto.legacyTaxonId=taxon;
  await db.query("insert into account_taxonomy(account_id,taxon_id,is_primary,status,source_type) values($1,$2,true,'active','taxonomy_match')",[auto.a,taxon]);
  await turn(auto,auto.token,2,"niche_confirmation",{kind:"operational_fallback",taxonId:null,taxonName:null});
  await turn(auto,await reserveConfirm(auto),4,"ready_to_complete",null,true);
  assert.equal((await db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,5,'operational_fallback',false) done",[auto.c,auto.a,owner])).rows[0].done,true);
  assert.equal((await db.query("select source_type from account_taxonomy where account_id=$1",[auto.a])).rows[0].source_type,"taxonomy_match");
  const legacyAccount=id(60);
  await db.query("insert into accounts values($1,'active')",[legacyAccount]);
  await db.query("insert into account_users values($1,$2,'owner','active')",[legacyAccount,owner]);
  await db.query("insert into account_taxonomy(account_id,taxon_id,is_primary,status,source_type) values($1,$2,true,'active','manual')",[legacyAccount,taxon]);
  const legacyStamp=(await db.query("select updated_at::text stamp from account_taxonomy where account_id=$1",[legacyAccount])).rows[0].stamp;
  await assert.rejects(db.query("select confirm_account_official_niche_v1($1,$2,'Serviços',0,$3,'2000-01-01'::timestamptz,true)",[legacyAccount,owner,taxon]),/niche_changed/);
  assert.equal((await db.query("select confirm_account_official_niche_v1($1,$2,'Serviços',0,$3,$4,true) revision",[legacyAccount,owner,taxon,legacyStamp])).rows[0].revision,"1");
  console.log("PASS unconfirmed legacy primary does not invent official niche or block operational fallback; confirmed legacy CAS preserved");


  for (const [n,source,confirmation] of [[80,"manual",null],[90,"user_confirmed_ai",null],[100,"taxonomy_match","timestamp"],[110,"taxonomy_match","resolution"]]) {
    const productLegacy=await preparePending(n); productLegacy.legacyTaxonId=taxon;
    await db.query("insert into account_taxonomy(account_id,taxon_id,is_primary,status,source_type,user_confirmed_at) values($1,$2,true,'active',$3,case when $4::boolean then clock_timestamp() else null end)",[productLegacy.a,taxon,source,confirmation==="timestamp"]);
    if(confirmation==="resolution") await db.query("insert into account_niche_resolutions(account_id,user_resolution_status,user_selected_taxon_id,user_confirmed_at) values($1,'confirmed',$2,clock_timestamp())",[productLegacy.a,taxon]);
    await db.query("insert into account_landing_pages values($1,$2)",[id(n+5),productLegacy.a]);
    await turn(productLegacy,productLegacy.token,2,"niche_confirmation",semantic);
    const token=await reserveConfirm(productLegacy);
    const snapshot=await db.query("select version,attendance_proposal from account_pending_setup_conversations where id=$1",[productLegacy.c]);
    await assert.rejects(turn(productLegacy,token,4,"ready_to_complete",null,true),/niche_product_exists/);
    assert.deepEqual((await db.query("select version,attendance_proposal from account_pending_setup_conversations where id=$1",[productLegacy.c])).rows,snapshot.rows);
    assert.equal((await db.query("select count(*) from account_official_niches where account_id=$1",[productLegacy.a])).rows[0].count,"0");
    assert.equal((await db.query("select count(*) from account_pending_setup_messages where conversation_id=$1",[productLegacy.c])).rows[0].count,"1");
    await db.query("update account_pending_setup_conversations set attendance_proposal=jsonb_set(attendance_proposal,'{nicheDescription}',to_jsonb('Serviços'::text)) where id=$1",[productLegacy.c]);
    assert.equal((await turn(productLegacy,token,4,"ready_to_complete",null,true)).rows[0].version,"5");
    assert.equal((await db.query("select description from account_official_niches where account_id=$1",[productLegacy.a])).rows[0].description,"Serviços");
  }
  const initialProduct=await preparePending(120);
  await db.query("insert into account_landing_pages values($1,$2)",[id(125),initialProduct.a]);
  await turn(initialProduct,initialProduct.token,2,"niche_confirmation",semantic);
  assert.equal((await turn(initialProduct,await reserveConfirm(initialProduct),4,"ready_to_complete",null,true)).rows[0].version,"5");
  console.log("PASS product guard covers every confirmed legacy provenance without partial effects; identical legacy description and initial niche remain allowed");

  const stale=await preparePending(70);
  await turn(stale,stale.token,2,"niche_confirmation",semantic);
  await db.query("insert into account_official_niches values($1,'Nicho confirmado em outra conversa',1,$2,clock_timestamp())",[stale.a,owner]);
  stale.observedRevision=1;
  await assert.rejects(turn(stale,await reserveConfirm(stale),4,"ready_to_complete",null,true),/pending_setup_primary_conflict/);
  assert.equal((await db.query("select description from account_official_niches where account_id=$1",[stale.a])).rows[0].description,"Nicho confirmado em outra conversa");

  for (const [n,nextStage] of [[130,"ready_to_complete"],[140,"business_understanding"]]) {
    const acceptedLegacy=await preparePending(n); acceptedLegacy.legacyTaxonId=taxon;
    await db.query("insert into account_taxonomy(account_id,taxon_id,is_primary,status,source_type) values($1,$2,true,'active','taxonomy_match')",[acceptedLegacy.a,taxon]);
    await turn(acceptedLegacy,acceptedLegacy.token,2,"niche_confirmation",{kind:"existing",taxonId:taxon,taxonName:"Serviços"});
    assert.equal((await turn(acceptedLegacy,await reserveConfirm(acceptedLegacy),4,nextStage,null,true)).rows[0].version,"5");
    const recorded=(await db.query("select source_type,user_confirmed_at from account_taxonomy where account_id=$1",[acceptedLegacy.a])).rows[0];
    assert.equal(recorded.source_type,"taxonomy_match"); assert.ok(recorded.user_confirmed_at);
    let completionVersion=5;
    if(nextStage==="business_understanding"){
      const token=id(n+4);
      await db.query("update account_pending_setup_conversations set version=6,pending_turn_token=$2,pending_turn_started_at=clock_timestamp(),pending_turn_intent='message' where id=$1",[acceptedLegacy.c,token]);
      assert.equal((await turn(acceptedLegacy,token,6,"ready_to_complete",null)).rows[0].version,"7");
      completionVersion=7;
    }
    assert.equal((await db.query("select complete_account_pending_setup_attendance_v2($1,$2,$3,$4,'official',false) done",[acceptedLegacy.c,acceptedLegacy.a,owner,completionVersion])).rows[0].done,true);
  }
  console.log("PASS legacy taxonomy_match proposal acceptance persists confirmation, preserves provenance and permits immediate or later completion");

  console.log("PASS Pending Setup exact persisted proposal, stale fence, idempotence, atomic rollback, operational fallback, legacy proposal, named completion and dialogue closure");

  console.log("PASS PostgreSQL17 integral migration, auth/ACL/RLS/CAS/product guard/idempotent same description/rollback/concurrent product fencing");
} finally {
  await db.end();
  await admin.query("drop database "+name+" with (force)");
  await admin.end();
}
