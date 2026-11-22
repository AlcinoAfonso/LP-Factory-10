import assert from "node:assert/strict";
import nodeModule from "node:module";
import { buildDialogueCostDetail, parseCostDialogue, readDialoguePages, translateDialogueLedger } from "./dialogue-costs";
import { readDialogueCostActionCore, readOccurrenceCostActionCore } from "../../app/admin/(protected)/custos-openai/action-core";

const account = "10000000-0000-4000-8000-000000000001";
const otherAccount = "10000000-0000-4000-8000-000000000002";
const id = (value: number) => "20000000-0000-4000-8000-" + String(value).padStart(12, "0");
const stamp = "2026-11-17T12:00:00.000Z";
function metadata(value = 1, origin = "pending_setup") { return { id: id(value), account_id: account, origin,
  started_at: "2026-10-31T23:58:00.000Z", ended_at: stamp, user_id: "PRIVATE_USER", niche_state: { reply: "PRIVATE_REPLY" } }; }
function execution(value: number, dialogue = 1, started = stamp) { return { id: id(value), workload: "pending_setup_conversation", environment: "preview",
  execution_origin: "runtime", universe: "client", attribution_status: "attributed", account_id: account,
  occurrence_id: null,
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
  assert.throws(()=>translateDialogueLedger(execs,[...ops,ops[0]]),/cost_ledger_invalid/);
  assert.throws(()=>translateDialogueLedger(execs,[...ops,operation(103,999)]),/cost_operation_unlinked/);
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
  const tables: Record<string,Record<string,unknown>[]> = {
    accounts: [{ id: account, name: "Conta QA Principal", private_email: "PRIVATE_EMAIL" }, { id: otherAccount, name: "Conta QA Sem Operações" }],
    account_dialogues:[metadata(),metadata(2,"account_niche"), { ...metadata(3), account_id: otherAccount, started_at: stamp }, { ...metadata(4), started_at: stamp, ended_at: null }],
    openai_cost_executions:[...execs,execution(12,2),execution(13,900),{...execution(14),account_id:otherAccount},
      { ...execution(15,4,"2026-11-18T00:00:00.000Z"), workload:"niche_resolution", finished_at:"2026-11-18T00:01:00.000Z" }],
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
      async maybeSingle() {
        const { data, error } = await chain;
        assert.ok(data.length <= 1);
        return { data: data[0] ?? null, error };
      },
      then<T>(resolve:(value:{data:Record<string,unknown>[];error:unknown})=>T){
        const data=tables[table].filter(row=>predicates.every(test=>test(row))).sort((a,b)=>String(a.id).localeCompare(String(b.id))).slice(0,limit)
          .map(row=>Object.fromEntries(selected.split(",").map(key=>[key.replace("::text",""),row[key.replace("::text","")]])));
        return Promise.resolve(resolve({data,error:failOperations&&table==="openai_cost_operations"?"failed":null}));
      }};
    return chain;
  }};
  const loader=nodeModule as unknown as {_load:(name:string,parent:unknown,isMain:boolean)=>unknown}; const original=loader._load;
  loader._load=function(name,parent,isMain){if(name==="server-only")return {};if(name.endsWith("supabase/service"))return {createServiceClient:()=>client};return original.call(this,name,parent,isMain);};
  const [adapter, ledger] = await Promise.all([
    import("./adapters/dialogueCostReadAdapter"), import("./adapters/costLedgerReadAdapter"),
  ]).finally(()=>{loader._load=original;});
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
  const periodicExecutions=tables.openai_cost_executions.filter(e=>Date.parse(String(e.started_at))/1000<period.endTime);
  const active=translateDialogueLedger(periodicExecutions,tables.openai_cost_operations);
  const list=await adapter.listOpenAiCostDialogues(period,active);
  assert.ok(list.ok);
  if(list.ok) {
    assert.deepEqual(list.dialogues.map(row=>row.dialogueId),[id(3),id(4),id(1),id(2)],"unrelated events never become dialogues");
    assert.equal(list.dialogues.find(row=>row.dialogueId===id(3))?.accountName,"Conta QA Sem Operações");
    assert.deepEqual(list.dialogues.find(row=>row.dialogueId===id(3))?.workloads,[],"another account's event cannot establish a workload link");
    assert.deepEqual(list.dialogues.find(row=>row.dialogueId===id(1))?.workloads,["pending_setup_conversation"]);
    assert.deepEqual(list.dialogues.find(row=>row.dialogueId===id(4))?.workloads,["niche_resolution"],"workload membership is exact and independent of the selected financial period");
  }
  const withoutPeriodicActivity=await adapter.listOpenAiCostDialogues(period,translateDialogueLedger([],[]));
  assert.ok(withoutPeriodicActivity.ok);
  if(withoutPeriodicActivity.ok)assert.equal(withoutPeriodicActivity.dialogues.find(row=>row.dialogueId===id(3))?.accountName,"Conta QA Sem Operações");
  assert.ok(selections.includes("accounts:id,name"));
  assert.equal(JSON.stringify(list).includes("PRIVATE"),false);

  const firstGeneration = id(3000);
  const nextGeneration = id(3001);
  const nicheOccurrence = "dedf7e3f-de9a-865a-9c31-041e011e0932";
  const generationSections = Array.from({ length: 7 }, (_, index) => ({
    ...execution(300 + index, 1, index === 0 ? "2026-10-31T23:59:00.000Z" : stamp),
    occurrence_id: firstGeneration, workload: "communication_base_stage2_intelligence",
    economic_event_kind: null, economic_event_id: null,
  }));
  tables.openai_cost_occurrence_lifecycle = [
    { occurrence_id: firstGeneration, closed_at: stamp },
    { occurrence_id: nextGeneration, closed_at: null },
    { occurrence_id: nicheOccurrence, closed_at: stamp },
  ];
  tables.openai_cost_executions.push(...generationSections, {
    ...generationSections[0], id: id(307), occurrence_id: nextGeneration,
  });
  for (const row of execs) row.occurrence_id = nicheOccurrence;
  tables.openai_cost_operations.push(
    ...generationSections.map((section, index) => ({
      ...operation(500 + index, 300 + index, "0.1"), model: "gpt-6.2-sol", started_at: section.started_at,
    })),
    { ...operation(507, 300, "0.02"), sequence: 2, retry_of_operation_id: id(500), result: "failure", failure_category: "provider_error" },
    operation(508, 307, "0.11"),
  );
  const readOccurrence = (id: string) => ledger.readOpenAiCostOccurrence({ by: "occurrence", id });
  const from = selections.length;
  const completed = await readOccurrence(firstGeneration);
  assert.ok(completed.ok);
  assert.ok(selections[from].startsWith("openai_cost_occurrence_lifecycle:"), "read durable closure before operations");
  assert.equal(completed.value.occurrenceId, firstGeneration);
  assert.equal(completed.value.executions[0].accountName, "Conta QA Principal");
  assert.equal(completed.value.executions[0].operations[0].cacheWriteTokens30m, 40);
  assert.equal(completed.value.executions[0].operations[0].webSearchCallCount, 1);
  assert.equal(completed.value.executions[0].operations[1].result, "failure");
  assert.equal(completed.value.executions[0].operations[1].retryOfOperationId, id(500));
  assert.equal(completed.value.executions[0].operations[1].model, "gpt-6.1-terra");
  assert.equal(completed.value.executions[0].operations[0].startedAt.slice(0, 7), "2026-10");
  assert.equal(completed.value.executions.at(-1)?.operations[0].startedAt.slice(0, 7), "2026-11");
  assert.deepEqual([completed.value.status, completed.value.operationCount, completed.value.calculatedCostUsd], ["complete", 8, "0.72"]);
  assert.equal(JSON.stringify(completed).includes("PRIVATE"), false);
  assert.deepEqual(await ledger.readOpenAiCostOccurrence({ by: "execution", id: id(300) }), completed);
  assert.deepEqual(await ledger.readOpenAiCostOccurrence({ by: "execution", id: id(9999) }), { ok: false, code: "NOT_FOUND" });
  assert.deepEqual(await readOccurrence(id(9999)), { ok: false, code: "NOT_FOUND" });
  const next = await readOccurrence(nextGeneration);
  assert.ok(next.ok);
  assert.deepEqual([next.value.status, next.value.operationCount, next.value.calculatedCostUsd], ["accumulated", 1, "0.11"]);

  const anotherTurn = { ...execution(309), occurrence_id: nicheOccurrence, workload: "niche_resolution" };
  tables.openai_cost_executions.push(anotherTurn);
  tables.openai_cost_operations.push(operation(509, 309, "0.2"));
  let occurrenceReads = 0;
  const lookup = { by: "occurrence", id: nicheOccurrence.toUpperCase() };
  assert.deepEqual(await readOccurrenceCostActionCore(lookup, {
    authorize: async () => ({ allowed: false }),
    read: async () => { occurrenceReads++; return completed; },
  }), { ok: false, code: "UNAUTHORIZED" });
  assert.equal(occurrenceReads, 0);
  const authorize = async () => ({ allowed: true });
  assert.deepEqual(await readOccurrenceCostActionCore({ ...lookup, id: "invalid" }, {
    authorize, read: async () => { throw Error("invalid input must not read"); },
  }), { ok: false, code: "INVALID_ID" });
  const niche = await readOccurrenceCostActionCore(lookup, { authorize, read: ledger.readOpenAiCostOccurrence });
  assert.ok(niche.ok);
  assert.deepEqual([niche.value.occurrenceId, niche.value.status, niche.value.calculatedCostUsd], [nicheOccurrence, "complete", "0.33"]);
  assert.equal(new Set(niche.value.executions.map(row => row.workload)).size, 2);
  const dialogueWithOccurrence = await adapter.readOpenAiDialogueCost({ dialogueId: id(1), accountId: account });
  assert.ok(dialogueWithOccurrence.ok);
  assert.deepEqual(dialogueWithOccurrence.value.occurrenceIds, [nicheOccurrence]);

  const billed = tables.openai_cost_operations.find(row => row.id === id(506))!;
  Object.assign(billed, { cost_status: "unavailable", cost_usd: null, cost_unavailable_reason: "usage_missing" });
  const partial = await readOccurrence(firstGeneration);
  assert.ok(partial.ok);
  assert.deepEqual([partial.value.status, partial.value.calculatedCostUsd, partial.value.unavailableCount], ["partial", "0.62", 1]);
  Object.assign(billed, { finished_at: null, result: null, cost_unavailable_reason: "operation_pending" });
  const pending = await readOccurrence(firstGeneration);
  assert.ok(pending.ok);
  assert.deepEqual([pending.value.status, pending.value.pendingCount], ["partial", 1]);

  const nextOperation = tables.openai_cost_operations.find(row => row.id === id(508))!;
  Object.assign(nextOperation, { finished_at: null, result: null, cost_status: "unavailable", cost_usd: null, cost_unavailable_reason: "operation_pending" });
  const noAmount = await readOccurrence(nextGeneration);
  assert.ok(noAmount.ok);
  assert.deepEqual([noAmount.value.status, noAmount.value.calculatedCostUsd, noAmount.value.pendingCount], ["unavailable", null, 1]);
  tables.openai_cost_operations = tables.openai_cost_operations.filter(row => row !== nextOperation);
  const noAdmission = await readOccurrence(nextGeneration);
  assert.ok(noAdmission.ok);
  assert.deepEqual([noAdmission.value.status, noAdmission.value.calculatedCostUsd, noAdmission.value.operationCount], ["unavailable", null, 0]);

  for (const incompatible of [{ account_id: otherAccount }, { environment: "production" }, { execution_origin: "administrative_proof" }]) {
    const wrong = { ...generationSections[0], id: id(310), ...incompatible };
    tables.openai_cost_executions.push(wrong);
    assert.deepEqual(await readOccurrence(firstGeneration), { ok: false, code: "READ_FAILED" });
    tables.openai_cost_executions.pop();
  }
  failOperations = true;
  assert.deepEqual(await readOccurrence(firstGeneration), { ok: false, code: "READ_FAILED" });
  console.log("PASS D10D lifetime exact occurrence, scopes, Category 3, billed retries, multiple workloads and pending or unavailable costs");
}
