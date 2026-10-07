import assert from "node:assert/strict";
import { attendanceProjection, attendancePrompt, attendanceProposal, validateAttendanceOutput,
  validateStoredAttendanceProposal, type AttendanceContext, type AttendanceOutput } from "./attendance-core";

import type { AttendanceDependencies } from "./attendance-coordinator";
import nodeModule from "node:module";
import type { PendingSetupConversation } from "./contracts";

const accountId = "10000000-0000-4000-8000-000000000001";
const segmentId = "10000000-0000-4000-8000-000000000002";
const nicheId = "10000000-0000-4000-8000-000000000003";
const source = "https://example.com/gardens";
const context: AttendanceContext = {
  preferredName: "Ana", summary: "Manutenção de jardins para condomínios.", research: false,
  recent: [{ role: "user", content: "Faço manutenção de jardins para condomínios." }],
  catalog: [
    { id: segmentId, name: "Serviços", level: "segment", parentId: null, active: true, aliases: [] },
    { id: nicheId, name: "Jardinagem", level: "niche", parentId: segmentId, active: true, aliases: ["Manutenção de jardins"] },
  ],
};
const base: AttendanceOutput = { reply: "Entendi seu negócio.", preferredName: "Ana", preferredNameDeclined: false,
  summary: "Manutenção de jardins para condomínios.", sufficientUnderstanding: true,
  action: "existing", existingTaxonId: nicheId, chain: [], aliases: [], evidence: "", evidenceUrls: [] };
const market: AttendanceOutput = { ...base, action: "propose", existingTaxonId: null,
  reply: "Entendi: fisioterapia para adultos. Está correto?",
  chain: [{ level: "segment", name: "Serviços", existingId: segmentId },
    { level: "niche", name: "Fisioterapia", existingId: null }],
  evidence: "A fonte observada comprova a categoria real de mercado.", evidenceUrls: [source] };
function response(output: AttendanceOutput, web = false) {
  return { id: "resp_attendance_test", status: "completed", usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 },
    output: [
      ...(web ? [{ type: "web_search_call", status: "completed", action: { sources: [{ url: source }] } }] : []),
      { type: "message", content: [{ type: "output_text", text: JSON.stringify(output), annotations: [] }] },
    ] };
}
const conversation: PendingSetupConversation = {
  id: accountId, accountId, userId: accountId, preferredName: "Ana", preferredNameDeclined: true,
  businessDisplayName: null, businessContextText: "Ofertas confirmadas para condomínios.",
  stage: "business_understanding", confirmationKind: null, resolutionOutcome: null, openAiCallCount: 3,
  version: 1, createdAt: "2026-10-07T00:00:00Z", updatedAt: "2026-10-07T00:00:00Z", completedAt: null,
  attendanceEnabled: true, attendanceProposal: null, attendanceTurnIntent: null,
  messages: Array.from({ length: 30 }, (_, index) => ({ id: String(index), ordinal: index + 1,
    role: index % 2 ? "user" as const : "assistant" as const,
    content: index === 29 ? "Meu e-mail é ana@example.com." : "Contexto " + index, createdAt: "2026-10-07T00:00:00Z" })),
};
async function main() {
  // The marker is a Next bundler contract, not installed as a standalone Node package.
  // Mock only during test imports; production source and its markers remain unchanged.
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const originalLoad = loader._load;
  loader._load = function (name, parent, isMain) {
    return name === "server-only" ? {} : originalLoad.call(this, name, parent, isMain);
  };
  const modules = await Promise.all([
    import("./attendance-provider"), import("./attendance-coordinator"),
  ]).finally(() => { loader._load = originalLoad; });
  const { parseAttendanceResponse, requestAttendance } = modules[0];
  const { conductAttendanceTurn } = modules[1];
  const prompt = attendancePrompt(context);
  assert.equal(JSON.stringify(prompt.schema).includes('"format":"uri"'), false);
  assert.equal("$schema" in prompt.schema, false);
  assert.equal(validateAttendanceOutput(base, context, [])?.action, "existing");
  assert.equal(validateAttendanceOutput({ ...base, existingTaxonId: accountId }, context, []), null);
  assert.equal(validateAttendanceOutput(base, { ...context, catalog: context.catalog.map(taxon =>
    taxon.id === segmentId ? { ...taxon, active: false } : taxon) }, []), null);
  assert.equal(validateAttendanceOutput({ ...base, summary: "" }, context, []), null);
  assert.equal(validateAttendanceOutput({ ...base, grantTrial: true }, context, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "ana@example.com" }, context, []), null);
  assert.equal(validateAttendanceOutput(market, context, [source]), null);
  assert.equal(validateAttendanceOutput(market, { ...context, research: true }, []) , null);
  assert.equal(validateAttendanceOutput(market, { ...context, research: true }, [source])?.action, "propose");
  assert.equal(validateAttendanceOutput({ ...market, chain: [{ level: "ultra_niche", name: "Serviço ocasional",
    existingId: null }] }, { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, aliases: [{ text: "Ofertas relacionadas",
    equivalentTo: "Jardinagem", equivalence: "related", justification: "Tem relação", evidenceUrls: [source] }] },
    { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, evidenceUrls: ["https://invented.example.com"] },
    { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput({ ...base, action: "confirm", existingTaxonId: null }, context, []), null);
  const equivalent = { text: "Terapia física", equivalentTo: "Fisioterapia", equivalence: "proven" as const,
    justification: "Equivalência comprovada pela fonte observada.", evidenceUrls: [source] };
  assert.equal(validateAttendanceOutput({ ...market, aliases: [equivalent] }, { ...context, research: true }, [source])?.action, "propose");
  assert.equal(validateAttendanceOutput({ ...market, aliases: [{ ...equivalent, equivalence: "related" }] }, { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, aliases: [{ ...equivalent, equivalence: "ambiguous" }] }, { ...context, research: true }, [source]), null);
  const proposal = attendanceProposal(market, [source]);
  assert.ok(validateStoredAttendanceProposal(proposal));
  assert.equal(validateStoredAttendanceProposal({ ...proposal, sources: ["javascript:alert(1)"] }), null);
  assert.equal(validateStoredAttendanceProposal({ ...proposal, sources: ["malformed"] }), null);
  assert.ok(proposal);
  assert.equal(validateAttendanceOutput({ ...base, action: "confirm", existingTaxonId: null },
    { ...context, confirmedProposal: proposal }, [])?.action, "confirm");
  const declinedContext = { ...context, preferredName: null, preferredNameDeclined: true };
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null }, declinedContext, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, declinedContext, [])?.preferredNameDeclined, true);
  assert.equal(validateAttendanceOutput(base, declinedContext, [])?.preferredName, "Ana");
  const fallbackConfirmation: AttendanceContext = { ...context, confirmedProposal: { kind: "operational_fallback",
    taxonId: null, chain: [], aliases: [], evidence: "", sources: [] } };
  const confirmWithoutSummary = { ...base, action: "confirm" as const, existingTaxonId: null, summary: "" };
  assert.equal(validateAttendanceOutput(confirmWithoutSummary, fallbackConfirmation, [])?.summary, context.summary);
  assert.equal(validateAttendanceOutput(confirmWithoutSummary, { ...fallbackConfirmation, summary: null }, []), null);
  const parsedFallback = parseAttendanceResponse(response(confirmWithoutSummary), fallbackConfirmation);
  assert.equal(parsedFallback.ok, true);
  if (parsedFallback.ok) assert.equal(parsedFallback.value.output.summary, context.summary);
  assert.equal(validateAttendanceOutput(confirmWithoutSummary, { ...context, confirmedProposal: proposal }, [])?.summary, "");
  const projection = attendanceProjection(conversation, context.catalog);
  assert.equal(projection.recent.length, 8);
  assert.equal(projection.preferredNameDeclined, true);
  assert.equal(projection.summary, conversation.businessContextText);
  assert.equal(JSON.stringify(projection).includes("ana@example.com"), false);
  assert.equal(parseAttendanceResponse(response(base), context).ok, true);
  assert.equal(parseAttendanceResponse(response(market), { ...context, research: true }).ok, false);
  assert.equal(parseAttendanceResponse(response(market, true), { ...context, research: true }).ok, true);
  assert.equal(parseAttendanceResponse({ ...response(base), status: "incomplete" }, context).ok, false);
  const wires: Record<string, unknown>[] = [];
  const events: unknown[] = [];
  const generated = await requestAttendance({ accountId, context, environment: "development", apiKey: "test-key" }, {
    fetchImpl: async (_url, init) => {
      wires.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify(response(base)), { status: 200, headers: { "Content-Type": "application/json" } });
    },
    emitEvent: event => events.push(event),
  });
  assert.equal(generated.ok, true);
  assert.equal(wires[0].model, "gpt-6-luna");
  assert.deepEqual(wires[0].reasoning, { effort: "xhigh" });
  assert.equal("tools" in wires[0], false);
  assert.equal(events.length, 1);
  const effects: string[] = [];
  let current = { ...conversation, preferredNameDeclined: false };
  const dependencies: AttendanceDependencies = {
    load: async () => current,
    catalog: async () => context.catalog,
    claim: async () => { effects.push("claim"); current = { ...current, version: 2 }; return { ok: true, version: 2 }; },
    request: async () => ({ ok: true, output: base, sources: [], responseId: "resp_fixture", latencyMs: 1 }),
    commit: async () => { effects.push("commit"); return { ok: true, version: 3 }; },
    release: async () => { effects.push("release"); return { ok: true, version: 3 }; },
  };
  const input = { accountId, userId: accountId, conversationId: conversation.id, expectedVersion: 1,
    content: "Faço manutenção de jardins para condomínios.", intent: "message" as const };
  assert.equal((await conductAttendanceTurn(input, dependencies)).ok, true);
  assert.deepEqual(effects, ["claim", "commit"]); // legacy count=3 is irrelevant.
  current = { ...current, version: 1 }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, { ...dependencies, request: async () => ({ ok: false }) })).ok, false);
  assert.deepEqual(effects, ["claim", "release"]);
  current = { ...current, version: 1 }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, { ...dependencies, commit: async () => ({ ok: false, reason: "write_failed" }) })).ok, false);
  assert.deepEqual(effects, ["claim", "release"]);
  current = { ...current, version: 1 }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, { ...dependencies, catalog: async () => null })).ok, false);
  assert.deepEqual(effects, ["claim", "release"]);
  let researched = false;
  current = { ...current, version: 1 }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, { ...dependencies, request: async ({ context: ctx }) => {
    researched = ctx.research;
    return { ok: true, output: ctx.research ? market : { ...base, existingTaxonId: null, action: "research" },
      sources: ctx.research ? [source] : [], responseId: "resp_fixture", latencyMs: 1 };
  } })).ok, true);
  assert.equal(researched, true);
  assert.deepEqual(effects, ["claim", "commit"]);
  current = { ...current, version: 1, stage: "niche_confirmation", confirmationKind: "operational_fallback",
    attendanceProposal: null }; effects.length = 0;
  assert.equal((await conductAttendanceTurn({ ...input, intent: "clarify",
    content: "Vamos retomar o atendimento a partir do contexto já informado." }, {
    ...dependencies,
    request: async ({ context: legacyContext }) => {
      assert.equal(legacyContext.summary, current.businessContextText);
      assert.equal(legacyContext.confirmedProposal, null);
      return { ok: true, output: { ...base, action: "pending", existingTaxonId: null },
        sources: [], responseId: "resp_legacy_adoption", latencyMs: 1 };
    },
    commit: async (write) => {
      assert.equal(write.confirm, false);
      assert.equal(write.proposal?.kind, "operational_fallback");
      effects.push("commit");
      return { ok: true, version: 3 };
    },
  })).ok, true);
  assert.deepEqual(effects, ["claim", "commit"]);

  console.log("ok - E10.12 prompt/transport, selective Web, memory, fencing and no false success");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
