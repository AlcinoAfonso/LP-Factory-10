import assert from "node:assert/strict";
import nodeModule from "node:module";
import { attendanceProjection, attendancePrompt, attendanceProposal, attendanceSummary, validateAttendanceOutput,
  validateStoredAttendanceProposal, type AttendanceContext, type AttendanceOutput } from "./attendance-core";
import type { AttendanceDependencies } from "./attendance-coordinator";
import type { PendingSetupConversation } from "./contracts";
const accountId = "10000000-0000-4000-8000-000000000001";
const segmentId = "10000000-0000-4000-8000-000000000002";
const nicheId = "10000000-0000-4000-8000-000000000003";
const context: AttendanceContext = {
  preferredName: "Ana", summary: "Fatos declarados pelo lead: Jardins.\nClassificação confirmada: Não identificada.\nSugestões: validar comunicação.",
  confirmedUnderstanding: "Manutenção de jardins para condomínios.",
  recent: [{ role: "user", content: "Faço manutenção de jardins para condomínios e quero explicar meu serviço." }],
  catalog: [
    { id: segmentId, name: "Serviços", level: "segment", parentId: null, active: true, aliases: [] },
    { id: nicheId, name: "Jardinagem", level: "niche", parentId: segmentId, active: true, aliases: ["Manutenção de jardins"] },
  ],
};
const base: AttendanceOutput = {
  reply: "Jardinagem corresponde ao seu negócio?", preferredName: "Ana", preferredNameDeclined: false,
  businessUnderstanding: "Manutenção de jardins para condomínios.", declaredFacts: ["Atende condomínios."],
  suggestions: ["Pode ser útil explicar a frequência do serviço."], sufficientUnderstanding: true,
  readyToComplete: false, action: "existing", existingTaxonId: nicheId,
};
const conversation: PendingSetupConversation = {
  id: accountId, accountId, userId: accountId, preferredName: "Ana", preferredNameDeclined: false,
  businessDisplayName: null, businessContextText: base.businessUnderstanding, stage: "business_understanding",
  confirmationKind: null, resolutionOutcome: null, openAiCallCount: 3, version: 1,
  createdAt: "2026-10-09T00:00:00Z", updatedAt: "2026-10-09T00:00:00Z", completedAt: null,
  attendanceEnabled: true, attendanceProposal: null, attendanceTurnIntent: null,
  accountContext: { summary: context.summary, updatedAt: "2026-10-09T00:00:00Z" },
  messages: [{ id: "1", ordinal: 1, role: "user", content: "Faço jardins. Contato ana@example.com.", createdAt: "2026-10-09T00:00:00Z" }],
};
function response(output: unknown, extra: unknown[] = []) {
  return { id: "resp_attendance_test", status: "completed", usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 },
    output: [...extra, { type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] };
}
async function main() {
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) { return name === "server-only" ? {} : original.call(this, name, parent, isMain); };
  const [provider, coordinator, catalogAdapter] = await Promise.all([
    import("./attendance-provider"), import("./attendance-coordinator"), import("./adapters/pendingSetupCatalogContextAdapter"),
  ]).finally(() => { loader._load = original; });
  const { parseAttendanceResponse, requestAttendance } = provider;
  const { conductAttendanceTurn } = coordinator;
  assert.equal("$schema" in attendancePrompt(context).schema, false);
  assert.equal(validateAttendanceOutput(base, context)?.action, "existing");
  assert.equal(validateAttendanceOutput({ ...base, readyToComplete: true }, context), null); // proposal never completes.
  assert.equal(validateAttendanceOutput({ ...base, existingTaxonId: accountId }, context), null);
  assert.equal(validateAttendanceOutput(base, { ...context, currentPrimaryTaxonId: segmentId }), null);
  assert.equal(validateAttendanceOutput(base, { ...context, catalog: context.catalog.map(t => t.id === segmentId ? { ...t, active: false } : t) }), null);
  for (const action of ["research", "propose", "new"]) assert.equal(validateAttendanceOutput({ ...base, action }, context), null);
  for (const extra of [{ chain: [] }, { aliases: [] }, { grantTrial: true }]) assert.equal(validateAttendanceOutput({ ...base, ...extra }, context), null);
  const proposal = attendanceProposal(base, context.catalog);
  assert.deepEqual(proposal, { kind: "existing", taxonId: nicheId, taxonName: "Jardinagem" });
  assert.ok(validateStoredAttendanceProposal(proposal));
  assert.equal(validateStoredAttendanceProposal({ kind: "new", taxonId: null, chain: [] }), null);
  const pending = { ...base, action: "pending" as const, existingTaxonId: null };
  const fallback = attendanceProposal(pending, context.catalog);
  assert.ok(fallback);
  assert.equal(validateAttendanceOutput(pending, { ...context, currentPrimaryTaxonId: nicheId }), null);
  assert.equal(validateAttendanceOutput(pending, { ...context, confirmedOperationalUnderstanding: true }), null);
  const confirm = { ...base, action: "confirm" as const, existingTaxonId: null, businessUnderstanding: "Inventado pelo modelo." };
  assert.equal(validateAttendanceOutput(confirm, context), null);
  for (const confirmedProposal of [proposal, fallback]) {
    const confirmation = { ...context, confirmedProposal };
    const accepted = validateAttendanceOutput(confirm, confirmation);
    assert.equal(accepted?.businessUnderstanding, context.confirmedUnderstanding);
    assert.equal(accepted?.readyToComplete, false); // confirmation may continue useful sales.
    assert.equal(validateAttendanceOutput({ ...confirm, readyToComplete: true }, confirmation)?.readyToComplete, true);
    assert.equal(validateAttendanceOutput(base, confirmation), null);
    assert.equal(validateAttendanceOutput(confirm, { ...confirmation, confirmedUnderstanding: null }), null);
  }
  const finishing = { ...base, action: "ask" as const, existingTaxonId: null, readyToComplete: true };
  assert.equal(validateAttendanceOutput(finishing, context), null);
  assert.ok(validateAttendanceOutput(finishing, { ...context, currentPrimaryTaxonId: nicheId }));
  assert.ok(validateAttendanceOutput(finishing, { ...context, confirmedOperationalUnderstanding: true }));
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "ana@example.com" }, context), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, context), null);
  assert.ok(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...context, recent: [{ role: "user", content: "Me chame de Bia." }] }));
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, context), null);
  assert.ok(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, { ...context, preferredName: null }));
  const summary = attendanceSummary(base, null, null);
  assert.match(summary, /Fatos declarados pelo lead: Atende condomínios/);
  assert.match(summary, /Sugestões e oportunidades \(não são fatos do negócio\): Pode ser útil/);
  assert.equal(base.businessUnderstanding.includes(base.suggestions[0]), false);
  assert.match(attendanceSummary(confirm, null, proposal), /Classificação confirmada: Jardinagem/);
  assert.equal(JSON.stringify(attendanceProjection(conversation, context.catalog)).includes("ana@example.com"), false);
  assert.deepEqual(catalogAdapter.projectAttendanceMarketContext([], []), []);
  const market = catalogAdapter.projectAttendanceMarketContext([{ id: accountId, taxon_id: nicheId, updated_at: "2026-06-01" }],
    [{ research_id: accountId, item_key: "limitation", item_text: "Pesquisa histórica; validar aplicabilidade.", notes: "Período 2024." }]);
  assert.equal(market[0].version, 1); assert.match(market[0].items[0].notes ?? "", /2024/);
  assert.match(market[0].items[0].text, /histórica/);
  assert.equal(parseAttendanceResponse(response(base), context).ok, true);
  assert.equal(parseAttendanceResponse(response(base, [{ type: "web_search_call", status: "completed" }]), context).ok, false);
  assert.equal(parseAttendanceResponse({ ...response(base), status: "incomplete" }, context).ok, false);
  assert.equal(parseAttendanceResponse({ output: [{ type: "message", content: [{ type: "refusal" }] }] }, context).ok, false);
  const wires: Record<string, unknown>[] = [];
  const events: unknown[] = [];
  assert.equal((await requestAttendance({ accountId, context, environment: "development", apiKey: "test-key" }, {
    fetchImpl: async (_url, init) => { wires.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify(response(base)), { status: 200 }); },
    emitEvent: event => events.push(event),
  })).ok, true);
  assert.equal(wires[0].model, "gpt-6-luna");
  assert.equal("tools" in wires[0], false); assert.equal("tool_choice" in wires[0], false); assert.equal(events.length, 1);
  const effects: string[] = [];
  let current = { ...conversation };
  const deps: AttendanceDependencies = {
    load: async () => current, catalog: async () => context.catalog, market: async () => [], operational: async () => null,
    primary: async () => null,
    discard: async () => { effects.push("discard"); return { ok: true, version: 3 }; },
    claim: async () => { effects.push("claim"); current = { ...current, version: 2 }; return { ok: true, version: 2 }; },
    request: async () => ({ ok: true, output: base, responseId: "fixture", latencyMs: 1 }),
    commit: async input => { effects.push("commit"); assert.equal(input.proposal?.kind, "existing"); return { ok: true, version: 3 }; },
    release: async () => { effects.push("release"); return { ok: true, version: 3 }; },
  };
  const input = { accountId, userId: accountId, conversationId: accountId, expectedVersion: 1, content: "Jardins", intent: "message" as const };
  assert.equal((await conductAttendanceTurn(input, deps)).ok, true);
  assert.deepEqual(effects, ["claim", "commit"]); // old lifetime call counter is irrelevant.
  for (const overrides of [
    { request: async () => ({ ok: false as const }) },
    { commit: async () => ({ ok: false as const, reason: "write_failed" as const }) },
    { catalog: async () => null },
    { market: async () => null },
  ]) {
    current = { ...conversation }; effects.length = 0;
    assert.equal((await conductAttendanceTurn(input, { ...deps, ...overrides })).ok, false);
    assert.deepEqual(effects, ["claim", "release"]);
  }
  current = { ...conversation, attendanceTurnIntent: "message" }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, deps)).ok, false); assert.deepEqual(effects, []);
  assert.equal((await conductAttendanceTurn({ ...input, intent: "resume", content: null }, deps)).ok, true);
  current = { ...conversation }; effects.length = 0;
  assert.equal((await conductAttendanceTurn({ ...input, expectedVersion: 10 }, deps)).ok, false); assert.deepEqual(effects, []);
  console.log("E10.12 seller attendance: confirmation, context, no Web/catalog write, provider and fenced retry cases passed.");
}
void main();
