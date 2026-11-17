import assert from "node:assert/strict";
import nodeModule from "node:module";
import { buildDialogueCostDetail, parseCostDialogue, readDialoguePages, translateDialogueLedger } from "./dialogue-costs";
import { readDialogueCostActionCore } from "../../app/admin/(protected)/custos-openai/action-core";

const account = "10000000-0000-4000-8000-000000000001";
const otherAccount = "10000000-0000-4000-8000-000000000002";
const id = (value: number) => "20000000-0000-4000-8000-" + String(value).padStart(12, "0");
const stamp = "2026-11-17T12:00:00.000Z";
function metadata(value = 1, origin = "pending_setup") { return { id: id(value), account_id: account, origin,
  started_at: "2026-10-31T23:58:00.000Z", ended_at: stamp, user_id: "PRIVATE_USER", niche_state: { reply: "PRIVATE_REPLY" } }; }
function execution(value: number, dialogue = 1, started = stamp) { return { id: id(value), workload: "pending_setup_conversation", environment: "preview",
  execution_origin: "runtime", universe: "client", attribution_status: "attributed", account_id: account,
  economic_event_kind: "niche_resolution", economic_event_id: id(dialogue), landing_page_id: null, taxon_id: null,
  baseline_reference: "e10_12_attendance", baseline_version: null, started_at: started, finished_at: stamp,
  result: "success", failure_category: null }; }
function operation(value: number, executionId: number, cost = "0.01") { return { id: id(value), execution_id: id(executionId), sequence: 1,
  retry_of_operation_id: null as string | null, model: "gpt-6.1-terra", reasoning_effort: "low", configuration_source: "supabase_operational",
  configuration_revision: "1", prompt_version: "unchanged", contract_version: "16", started_at: stamp, finished_at: stamp as string | null,
  result: "success" as string | null, failure_category: null as string | null, input_tokens: 100, cached_input_tokens: 50,
  cache_write_tokens: 40, output_tokens: 10, reasoning_tokens: 0, total_tokens: 110, web_search_call_count: 1 as number | null,
  web_search_tool_version: "search-v1", web_search_price_per_call_usd: "0.01", pricing_version: "frozen-price", pricing_effective_at: stamp,
  pricing_snapshot: { requestedServiceTier: "fast", appliedServiceTier: "fast", appliedModel: "gpt-6.1-terra", modality: "responses_text", contextBand: "short", cacheWriteTokens30m: 40, cacheWriteTokens12h: 0 },
  cost_status: "calculated", cost_unavailable_reason: null as string | null, cost_usd: cost as string | null,
  request_id: "PRIVATE_REQUEST", payload: "PRIVATE_PAYLOAD" }; }

export async function validateDialogueCosts() {
  const dialogue = parseCostDialogue(metadata())!;
  assert.ok(dialogue);
  assert.equal(JSON.stringify(dialogue).includes("PRIVATE"), false);
  assert.equal(parseCostDialogue({ ...metadata(), ended_at: "2020-01-01T00:00:00Z" }), null);
  const execs = [execution(10, 1, "2026-10-31T23:59:00.000Z"), execution(11)];
  const ops = [operation(100,10), { ...operation(101,10,"0.02"), sequence: 2, retry_of_operation_id: id(100), result: "failure", failure_category: "provider_error" }, operation(102,11,"0.1")];
  const model = translateDialogueLedger(execs,ops);
  const detail = buildDialogueCostDetail(dialogue, model);
  assert.equal(detail.calculatedCostUsd, "0.13", "all turns, billed failure, cache and search snapshots are summed once across month boundary");
  assert.equal(detail.status, "final");
  assert.deepEqual([detail.callCount,detail.attemptCount,detail.retryCount,detail.webSearchCallCount],[2,3,1,3]);
  assert.equal(detail.executions[0].operations[0].appliedServiceTier, "fast");
  assert.equal(detail.executions[0].operations[0].cacheWriteTokens30m, 40);
  assert.equal(JSON.stringify(detail).includes("PRIVATE"), false, "financial DTO drops provider identifiers and arbitrary payloads");
  assert.equal(buildDialogueCostDetail({...dialogue, endedAt:null},model).status,"accumulated");
  assert.equal(buildDialogueCostDetail({...dialogue, origin:"account_niche"},model).calculatedCostUsd,"0.13");
  const unavailable = {...ops[2], cost_status:"unavailable", cost_usd:null, cost_unavailable_reason:"usage_missing", web_search_call_count:null};
  const partial = buildDialogueCostDetail(dialogue,translateDialogueLedger(execs,[ops[0],ops[1],unavailable]));
  assert.equal(partial.status,"partial"); assert.equal(partial.calculatedCostUsd,"0.03");
  assert.equal(partial.unavailableCount,1); assert.equal(partial.unknownSearchCount,1);
  assert.equal(partial.executions[1].operations[0].costUnavailableReason,"usage_missing");
  const pending = {...unavailable,finished_at:null,result:null,failure_category:null,cost_unavailable_reason:"operation_pending"};
  assert.equal(buildDialogueCostDetail(dialogue,translateDialogueLedger(execs,[ops[0],ops[1],pending])).pendingCount,1);
  assert.equal(buildDialogueCostDetail(dialogue,translateDialogueLedger(execs,[ops[0],ops[1]])).missingOperationCount,1);
  const empty=buildDialogueCostDetail(dialogue,translateDialogueLedger([],[]));
  assert.equal(empty.status,"unrecorded"); assert.equal(empty.calculatedCostUsd,null,"no evidence is not zero");
  for(const wrong of [{...execs[0],account_id:otherAccount},{...execs[0],economic_event_id:id(2)}])
    assert.throws(()=>buildDialogueCostDetail(dialogue,translateDialogueLedger([wrong],[ops[0]])),/dialogue_link_invalid/);
  assert.throws(()=>buildDialogueCostDetail(dialogue,{...model,executions:[...model.executions,model.executions[0]]}),/dialogue_link_invalid/);
  assert.throws(()=>translateDialogueLedger(execs,[...ops,ops[0]]),/dialogue_ledger_invalid/);
  assert.throws(()=>translateDialogueLedger(execs,[...ops,operation(103,999)]),/dialogue_operation_unlinked/);
  const pages = [Array.from({length:500},(_,i)=>({id:id(1000+i)})),[{id:id(1500)}],[]]; let page=0;
  assert.equal((await readDialoguePages(async()=>({data:pages[page++],error:null}))).length,501);
  await assert.rejects(()=>readDialoguePages(async()=>({data:[{id:id(1)}],error:null})),/pagination_incomplete/);
  await assert.rejects(()=>readDialoguePages(async()=>({data:null,error:"network"})),/read_failed/);
  await assert.rejects(()=>readDialoguePages(async()=>({data:Array.from({length:501},(_,i)=>({id:id(i)})),error:null})),/read_failed/);
  let reads=0;
  const denied=await readDialogueCostActionCore({dialogueId:id(1),accountId:account},{authorize:async()=>({allowed:false}),read:async()=>{reads++;return {ok:true,value:detail};}});
  assert.deepEqual(denied,{ok:false,code:"UNAUTHORIZED"}); assert.equal(reads,0);
  assert.deepEqual(await readDialogueCostActionCore({dialogueId:id(1),accountId:account,messages:"PRIVATE"},{authorize:async()=>({allowed:true}),read:async()=>{throw Error("invalid input must not read");}}),{ok:false,code:"INVALID_DIALOGUE"});
  await validateAdapter(execs,ops);
  console.log("PASS D10 dialogue multi-turn lifetime total, exact identity/account, retries, search, pending/unavailable and admin boundary");
}

async function validateAdapter(execs: Record<string,unknown>[],ops: Record<string,unknown>[]) {
  const tables: Record<string,Record<string,unknown>[]> = { account_dialogues:[metadata(),metadata(2,"account_niche")],
    openai_cost_executions:[...execs,execution(12,2),execution(13,900),{...execution(14),account_id:otherAccount}],
    openai_cost_operations:[...ops,operation(103,12,"100"),operation(104,13,"200"),operation(105,14,"300")] };
  const selections: string[]=[]; const filters: string[]=[]; let failOperations=false;
  const client={from(table:string){
    let selected=Object.keys(tables[table][0]??{}).join(","), predicates: ((row:Record<string,unknown>)=>boolean)[]=[], limit=500;
    const chain={select(columns:string){selected=columns;selections.push(table+":"+columns);return chain;},
      eq(key:string,value:unknown){filters.push(table+":"+key+"="+value);predicates.push(row=>row[key]===value);return chain;},
      in(key:string,values:unknown[]){predicates.push(row=>values.includes(row[key]));return chain;},
      gt(key:string,value:string){predicates.push(row=>String(row[key])>value);return chain;},
      gte(key:string,value:string){predicates.push(row=>String(row[key])>=value);return chain;},
      lt(key:string,value:string){predicates.push(row=>String(row[key])<value);return chain;},order(){return chain;},limit(value:number){limit=value;return chain;},
      then(resolve:(value:{data:unknown;error:unknown})=>unknown){
        const data=tables[table].filter(row=>predicates.every(test=>test(row))).sort((a,b)=>String(a.id).localeCompare(String(b.id))).slice(0,limit)
          .map(row=>Object.fromEntries(selected.split(",").map(key=>[key.replace("::text",""),row[key.replace("::text","")]])));
        return Promise.resolve(resolve({data,error:failOperations&&table==="openai_cost_operations"?"failed":null}));
      }};
    return chain;
  }};
  const loader=nodeModule as unknown as {_load:(name:string,parent:unknown,isMain:boolean)=>unknown}; const original=loader._load;
  loader._load=function(name,parent,isMain){if(name==="server-only")return {};if(name.endsWith("supabase/service"))return {createServiceClient:()=>client};return original.call(this,name,parent,isMain);};
  const adapter=await import("./adapters/dialogueCostReadAdapter").finally(()=>{loader._load=original;});
  const read=await adapter.readOpenAiDialogueCost({dialogueId:id(1),accountId:account});
  assert.ok(read.ok); if(read.ok)assert.equal(read.value.calculatedCostUsd,"0.13");
  const other=await adapter.readOpenAiDialogueCost({dialogueId:id(2),accountId:account});
  assert.ok(other.ok);if(other.ok)assert.equal(other.value.calculatedCostUsd,"100");
  assert.equal((await adapter.readOpenAiDialogueCost({dialogueId:id(1),accountId:otherAccount})).ok,false);
  assert.ok(filters.includes("openai_cost_executions:economic_event_id="+id(1)));
  assert.ok(filters.includes("openai_cost_executions:account_id="+account));
  assert.equal(selections.some(selection=>/user_id|niche_state|request_id|payload/.test(selection)),false);
  failOperations=true;
  assert.deepEqual(await adapter.readOpenAiDialogueCost({dialogueId:id(1),accountId:account}),{ok:false,code:"DIALOGUE_COST_UNAVAILABLE"});
  failOperations=false;
  const period={startTime:Date.parse("2026-11-01T00:00:00Z")/1000,endTime:Date.parse("2026-11-18T00:00:00Z")/1000};
  const active=translateDialogueLedger(tables.openai_cost_executions,tables.openai_cost_operations);
  const list=await adapter.listOpenAiCostDialogues(period,active);
  assert.ok(list.ok);if(list.ok)assert.deepEqual(list.dialogues.map(row=>row.dialogueId),[id(1),id(2)],"old unrelated economic event never creates a dialogue association");
  assert.equal(JSON.stringify(list).includes("PRIVATE"),false);
}
