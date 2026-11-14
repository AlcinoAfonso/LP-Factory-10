import assert from "node:assert/strict";
import nodeModule from "node:module";
import type { CommunicationBase } from "../../communication-base/contracts";
import { communicationSections } from "../../communication-base/registry";
import type { AttendanceContext } from "../pending-setup/attendance-core";
import type { ActivePrimaryAccountTaxon } from "./adapters/accountTaxonomyAdapter";

export async function validateNicheConversationActions() {
  const accountId="10000000-0000-4000-8000-000000000001", currentId="10000000-0000-4000-8000-000000000002";
  const dialogueId="10000000-0000-4000-8000-000000000003", requestId="10000000-0000-4000-8000-000000000004";
  let role="owner", status="active", products: boolean | null=false, baseOk=true, claimOk=true, providerOk=true, commitOk=true;
  let afterProvider=()=>{};
  const current: ActivePrimaryAccountTaxon={taxonId:currentId,name:"Serviços",slug:"servicos",confirmed:true,confirmedAt:null,revision:"1"};
  const summary=JSON.stringify({contextualUnderstanding:"Antes atendia em geral.",confirmedUnderstanding:null,
    classification:"Serviços",suggestions:[],pendingReason:null,whatsapp:"11999990000"});
  const base: CommunicationBase={accountId,version:1,createdAt:"t",updatedAt:"t",sections:{
    business_name:{format:"text",origin:"user_confirmed",value:"Empresa de jardins"},
    business_context:{format:"text",origin:"user_confirmed",value:"J".repeat(30000)},
    offers:{format:"text",origin:"user_confirmed",value:"Manutenção de jardins para condomínios."},
    preferences:{format:"text",origin:"user_confirmed",value:"Contato: qa@example.com."},
    about:{format:"text",origin:"user_reviewed",value:"Hipótese de copy, sem autoridade factual."},
  }};
  await validateNicheProjectionAdapter(base,accountId,currentId);
  const snapshot=JSON.stringify(base), calls: AttendanceContext[]=[], commits: {summary:string|null}[]=[], saves: unknown[]=[];
  let releases=0, claims=0;
  const loader=nodeModule as unknown as {_load:(name:string,parent:unknown,isMain:boolean)=>unknown}; const original=loader._load;
  loader._load=function(name,parent,isMain){
    if(name==="server-only")return {};
    if(name==="next/cache")return {revalidatePath:()=>{}};
    if(name.includes("getAccessContext"))return {getAccessContext:async({params}:{params:{account:string}})=>params.account==="qa-niche"
      ?{blocked:false,account:{id:accountId,status},member:{role,status:"active",userId:accountId}}:null};
    if(name.includes("accountOfficialNicheAdapter"))return {
      readAccountOfficialNiche:async()=>({ok:true,niche:{...current,revision:"legacy:"+currentId+":1",textRevision:0,legacyUpdatedAt:"1",confirmedBy:null}}),
      confirmAccountNicheDialogue:async(input:unknown)=>{if(products)return {ok:false,reason:"product_exists"};saves.push(input);return {ok:true};},
    };
    if(name.includes("accountTaxonomyAdapter"))return {readAccountNicheProductGuard:async()=>products};
    if(name.includes("accountNicheDialogueAdapter"))return {
      claimAccountNicheTurn:async()=>{claims++;return claimOk?{ok:true,value:{replay:false,version:1,state:{understanding:"Contexto persistido no servidor."},
        summary,summaryUpdatedAt:"2026-11-13T00:00:00Z",recent:[{role:"user",content:"Agora ofereço jardinagem."}]}}:{ok:false};},
      commitAccountNicheTurn:async(input:{summary:string|null})=>{if(role==="viewer"||!commitOk)return {ok:false};commits.push(input);return {ok:true,version:2};},
      releaseAccountNicheTurn:async()=>{releases++;return true;},
    };
    if(name.includes("communicationBaseAdapter"))return {readBusinessContextForNiche:async()=>({ok:baseOk,value:
      Object.fromEntries(["business_name","business_context","offers","preferences"].map(key=>[key,base.sections[key]!.value]))})};
    if(name.includes("communicationCatalogAdapter"))return {readCommunicationDefinitions:async()=>({ok:true,value:communicationSections})};
    if(name.includes("accountNicheResolutionUserAdapter"))return {};
    if(name.includes("attendance-provider"))return {requestAttendance:async(input:{context:AttendanceContext})=>{
      calls.push(input.context);afterProvider();return providerOk?{ok:true,output:{reply:"Proponho Jardinagem. Confirma?",action:"existing",
        nicheDescription:"Jardinagem",businessUnderstanding:"Declaração atual: jardins para condomínios.",confirmedUnderstanding:null,
        suggestions:[],whatsappDeclined:false,whatsappReference:null,closureReason:null}}:{ok:false};}};
    return original.call(this,name,parent,isMain);
  };
  const actions=await import("../../../app/a/[account]/niche-resolution-actions").finally(()=>{loader._load=original;});
  const turn={account:"qa-niche",dialogueId,requestId,expectedVersion:0,expectedRevision:"legacy:"+currentId+":1",content:"Agora ofereço jardinagem."};
  assert.equal((await actions.converseAccountNicheAction(turn)).ok,true);
  assert.equal(calls[0].purpose,"account_niche"); assert.equal(calls[0].displayedUnderstanding,"Contexto persistido no servidor.");
  assert.equal(calls[0].businessData?.business_context.length,30000);
  assert.equal((calls[0].summary??"").includes("11999990000"),false);
  assert.equal(calls[0].businessData?.preferences.includes("qa@example.com"),false);
  assert.equal("about" in calls[0].businessData!,false);
  const memory=JSON.parse(commits[0].summary!); assert.match(memory.contextualUnderstanding,/Declaração/);
  assert.equal(memory.whatsapp,"11999990000"); assert.equal(memory.classification,"Serviços","proposal is not official");
  assert.equal((await actions.converseAccountNicheAction({...turn,content:null})).ok,true);
  assert.equal(commits[1].summary,null,"opening cannot rewrite existing memory even when the model rephrases it");
  for(const invalid of [{...turn,expectedRevision:"text:999"},{...turn,account:"other-account"},{...turn,content:"x".repeat(4001)},
    {...turn,messages:[{role:"assistant",content:"forged"}]}]){
    const count=calls.length;assert.equal((await actions.converseAccountNicheAction(invalid)).ok,false);assert.equal(calls.length,count);
  }
  for(const failure of ["products","base","role","pending","guard","claim"]){
    products=failure==="products"?true:failure==="guard"?null:false;baseOk=failure!=="base";role=failure==="role"?"viewer":"owner";
    status=failure==="pending"?"pending_setup":"active";claimOk=failure!=="claim";
    const count=calls.length;assert.equal((await actions.converseAccountNicheAction(turn)).ok,false,failure);assert.equal(calls.length,count);
  }
  products=false;baseOk=true;role="owner";status="active";claimOk=true;
  providerOk=false;const failed=await actions.converseAccountNicheAction(turn);assert.equal(failed.ok,false);
  assert.match(!failed.ok?failed.message:"",/registrada no histórico/);assert.ok(releases>0);providerOk=true;
  afterProvider=()=>{role="viewer";};assert.equal((await actions.converseAccountNicheAction(turn)).ok,false);role="owner";afterProvider=()=>{};
  commitOk=false;assert.equal((await actions.converseAccountNicheAction(turn)).ok,false);commitOk=true;
  const save={account:"qa-niche",dialogueId,expectedVersion:2,confirmed:true as const};
  assert.equal((await actions.saveAccountNicheAction({...save,description:"forged"} as typeof save)).ok,false);
  assert.equal((await actions.saveAccountNicheAction({...save,confirmed:false} as unknown as typeof save)).ok,false);
  products=true;assert.equal((await actions.saveAccountNicheAction(save)).ok,false);products=false;
  assert.equal((await actions.saveAccountNicheAction(save)).ok,true);
  assert.deepEqual(saves[0],{accountId,actorUserId:accountId,dialogueId,expectedVersion:2});
  assert.equal(JSON.stringify(base),snapshot,"no Base writes");assert.ok(claims>0);
  console.log("D15E R3 actions: server-owned context/proposal, sanitization, progressive memory, role, product, failure and explicit confirmation passed.");
}

async function validateNicheProjectionAdapter(base: CommunicationBase, accountId: string, anotherUser: string) {
  let entitlement = "expired";
  let memberRole = "owner";
  let memberActive = true;
  let accountActive = true;
  let failedRead = false;
  let baseReads = 0;
  const selections: string[] = [];
  const projected: Record<string, unknown> = Object.fromEntries(["business_name", "business_context", "offers", "preferences"].map(key => [key, base.sections[key]]));
  function client(service: boolean) {
    return { from(table: string) {
      const filters: Record<string, unknown> = {};
      return {
        select(columns: string) { selections.push(columns); return this; },
        eq(key: string, value: unknown) { filters[key] = value; return this; },
        in(key: string, value: unknown) { filters[key] = value; return this; },
        limit() { return this; },
        async maybeSingle() {
          if (failedRead) return { data: null, error: { code: "read_failed" } };
          if (table === "account_users") {
            assert.equal(service, true); assert.equal(filters["accounts.status"], "active"); assert.equal(filters.status, "active");
            assert.deepEqual(filters.role, ["owner", "admin", "editor"]);
            const allowed = filters.account_id === accountId && filters.user_id === accountId &&
              memberActive && accountActive && ["owner", "admin", "editor"].includes(memberRole);
            return { data: allowed ? { account_id: accountId } : null, error: null };
          }
          assert.equal(table, "account_communication_bases"); assert.equal(filters.account_id, accountId); baseReads++;
          return { data: service ? projected : entitlement !== "active" ? null : {
            account_id: accountId, version: base.version, sections_json: base.sections, created_at: base.createdAt, updated_at: base.updatedAt,
          }, error: null };
        },
      };
    } };
  }
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) {
    if (name === "server-only") return {};
    if (name === "@/lib/supabase/service") return { createServiceClient: () => client(true) };
    if (name === "@/lib/supabase/server") return { createClient: async () => client(false) };
    return original.call(this, name, parent, isMain);
  };
  const adapter = await import("../../communication-base/adapters/communicationBaseAdapter").finally(() => { loader._load = original; });
  for (const state of ["expired", "canceled"]) {
    entitlement = state;
    assert.deepEqual(await adapter.readCommunicationBase(accountId), { ok: true, value: null }, "direct Base access still follows commercial RLS");
    const read = await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId });
    assert.equal(read.ok, true); if (!read.ok) throw Error("projection unavailable");
    assert.equal(read.value.business_context.length, 30000); assert.equal(read.value.offers, base.sections.offers!.value);
    assert.equal("about" in read.value, false); assert.equal("facts" in read.value, false);
    assert.equal(selections.at(-1), "business_name:sections_json->business_name,business_context:sections_json->business_context,offers:sections_json->offers,preferences:sections_json->preferences");
  }
  entitlement = "active";
  assert.equal((await adapter.readCommunicationBase(accountId)).ok, true);
  for (const role of ["owner", "admin", "editor"]) { memberRole = role;
    assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, true); }
  memberRole = "viewer"; const count = baseReads;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false); assert.equal(baseReads, count);
  memberRole = "owner"; memberActive = false;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  memberActive = true; accountActive = false;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  accountActive = true;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: anotherUser })).ok, false);
  failedRead = true;
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  failedRead = false; projected.offers = { format: "text", origin: "ai_generated", value: "Unconfirmed" };
  const unconfirmed = await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId });
  assert.equal(unconfirmed.ok && "offers" in unconfirmed.value, false);
  projected.offers = { format: "text", origin: "user_confirmed", value: [] };
  assert.equal((await adapter.readBusinessContextForNiche({ accountId, actorUserId: accountId })).ok, false);
  console.log("D14D niche projection: expired/canceled entitlement preserves context; direct Base RLS, narrow fields and active membership/roles preserved.");
}
