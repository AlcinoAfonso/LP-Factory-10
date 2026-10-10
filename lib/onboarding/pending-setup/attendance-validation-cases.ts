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
  preferredName: "Ana", summary: null,
  displayedUnderstanding: "Manutenção de jardins para condomínios.",
  recent: [{ role: "user", content: "Faço manutenção de jardins para condomínios e quero explicar meu serviço." }],
  catalog: [
    { id: segmentId, name: "Serviços", level: "segment", parentId: null, active: true, aliases: [] },
    { id: nicheId, name: "Jardinagem", level: "niche", parentId: segmentId, active: true, aliases: ["Manutenção de jardins"] },
  ],
};
const base: AttendanceOutput = {
  reply: "Jardinagem corresponde ao seu negócio?", preferredName: "Ana", preferredNameDeclined: false,
  businessUnderstanding: "Manutenção de jardins para condomínios.",
  suggestions: ["Pode ser útil explicar a frequência do serviço."], sufficientUnderstanding: true,
  readyToComplete: false, closureReason: null, action: "existing", existingTaxonId: nicheId,
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
  for (const proposed of [base, pending]) {
    assert.equal(validateAttendanceOutput({ ...proposed, businessUnderstanding: "" }, context)?.businessUnderstanding, context.displayedUnderstanding);
    assert.equal(validateAttendanceOutput({ ...proposed, businessUnderstanding: "" }, { ...context, displayedUnderstanding: null }), null);
  }
  const confirm = { ...base, action: "confirm" as const, existingTaxonId: null, businessUnderstanding: "Inventado pelo modelo." };
  assert.equal(validateAttendanceOutput(confirm, context), null);
  for (const confirmedProposal of [proposal, fallback]) {
    const confirmation = { ...context, confirmedProposal };
    const accepted = validateAttendanceOutput(confirm, confirmation);
    assert.equal(accepted?.businessUnderstanding, context.displayedUnderstanding);
    assert.equal(accepted?.readyToComplete, false); // confirmation may continue useful sales.
    assert.equal(validateAttendanceOutput({ ...confirm, readyToComplete: true }, confirmation)?.readyToComplete, true);
    assert.equal(validateAttendanceOutput(base, confirmation), null);
    assert.equal(validateAttendanceOutput({ ...confirm, existingTaxonId: nicheId }, confirmation), null);
    assert.equal(validateAttendanceOutput(confirm, { ...confirmation, displayedUnderstanding: null }), null);
  }
  const finishing = { ...base, action: "ask" as const, existingTaxonId: null, readyToComplete: true };
  assert.equal(validateAttendanceOutput(finishing, context), null);
  assert.ok(validateAttendanceOutput(finishing, { ...context, currentPrimaryTaxonId: nicheId }));
  assert.ok(validateAttendanceOutput(finishing, { ...context, confirmedOperationalUnderstanding: true }));
  for (const authority of [{ currentPrimaryTaxonId: nicheId }, { confirmedOperationalUnderstanding: true }]) {
    assert.equal(validateAttendanceOutput({ ...finishing, businessUnderstanding: "" }, { ...context, ...authority })?.businessUnderstanding, context.displayedUnderstanding);
    assert.equal(validateAttendanceOutput({ ...finishing, businessUnderstanding: "" }, { ...context, ...authority, displayedUnderstanding: null }), null);
  }
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "ana@example.com" }, context), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, context), null);
  assert.ok(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...context, recent: [{ role: "user", content: "Me chame de Bia." }] }));
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, context), null);
  assert.ok(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, { ...context, preferredName: null }));
  // Interpretations remain proposals until the existing explicit confirmation.
  assert.equal(validateAttendanceOutput({ ...base, declaredFacts: [] }, context), null);
  const draft = JSON.parse(attendanceSummary(base, null, null));
  assert.equal(draft.contextualUnderstanding, base.businessUnderstanding);
  assert.equal(draft.confirmedUnderstanding, null);
  assert.equal(draft.classification, "Não identificada.");
  assert.deepEqual(draft.suggestions, base.suggestions);
  const accepted = validateAttendanceOutput(confirm, { ...context, confirmedProposal: proposal })!;
  const remembered = attendanceSummary(accepted, null, proposal);
  assert.equal(JSON.parse(remembered).confirmedUnderstanding, context.displayedUnderstanding);
  assert.equal(JSON.parse(remembered).classification, "Jardinagem");
  const later = { ...base, action: "ask" as const, existingTaxonId: null, businessUnderstanding: "Também quer comunicar planos mensais." };
  const evolving = JSON.parse(attendanceSummary(later, "Jardinagem", null, remembered));
  assert.equal(evolving.contextualUnderstanding, later.businessUnderstanding);
  assert.equal(evolving.confirmedUnderstanding, context.displayedUnderstanding);
  assert.deepEqual(evolving.suggestions, base.suggestions);
  const socialContext: AttendanceContext = { ...context, summary: remembered, recent: [{ role: "user", content: "Eu sou flamenguista." }] };
  const noBusinessNews = validateAttendanceOutput({ ...later, businessUnderstanding: "", suggestions: [], readyToComplete: false }, socialContext)!;
  assert.equal(noBusinessNews.businessUnderstanding, "");
  const retained = attendanceSummary(noBusinessNews, "Jardinagem", null, remembered);
  assert.equal(retained, remembered); // The literal social message is never automatically imported.
  assert.equal(retained.includes("flamenguista"), false);
  const closing = { ...noBusinessNews, reply: "Sem avanço neste momento, encerro por aqui. Obrigado pela conversa.",
    closureReason: "Não houve avanço útil para esclarecer a necessidade comercial." };
  assert.ok(validateAttendanceOutput(closing, socialContext));
  for (const invalid of [{ ...closing, readyToComplete: true }, { ...base, closureReason: closing.closureReason },
    { ...confirm, closureReason: closing.closureReason }]) assert.equal(validateAttendanceOutput(invalid, socialContext), null);
  const closedSummary = attendanceSummary(closing, "Jardinagem", null, remembered);
  assert.equal(JSON.parse(closedSummary).pendingReason, closing.closureReason);
  assert.equal(JSON.parse(closedSummary).confirmedUnderstanding, context.displayedUnderstanding);
  assert.equal(closedSummary.includes("flamenguista"), false);
  assert.equal(JSON.parse(attendanceSummary(later, "Jardinagem", null, closedSummary)).pendingReason, null);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, "Jardinagem", null, closedSummary)).pendingReason, null);
  const closedProjection = attendanceProjection({ ...conversation, accountContext: {
    summary: closedSummary, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  assert.equal(JSON.parse(closedProjection.summary!).pendingReason, closing.closureReason);
  for (const malformed of ["not JSON", '{"contextualUnderstanding":"unaccepted"}']) {
    assert.equal(JSON.parse(attendanceSummary(later, null, null, malformed)).confirmedUnderstanding, null);
  }
  // Whole-field budgeting keeps accepted wording exact, including escaping overhead.
  const lengthyAccepted = { ...accepted, businessUnderstanding: "a".repeat(3000), suggestions: ["b".repeat(300), "c".repeat(300)] };
  const bounded = attendanceSummary(lengthyAccepted, "Jardinagem", proposal);
  assert.ok(bounded.length <= 4000);
  assert.equal(JSON.parse(bounded).confirmedUnderstanding, lengthyAccepted.businessUnderstanding);
  assert.equal(JSON.parse(bounded).contextualUnderstanding, null);
  const nearLimit = JSON.stringify({ contextualUnderstanding: null, confirmedUnderstanding: "a".repeat(3800), classification: "Curta", suggestions: [] });
  assert.ok(nearLimit.length <= 4000);
  assert.equal(attendanceSummary(noBusinessNews, "c".repeat(120), null, nearLimit), nearLimit);
  const fullMemory = JSON.stringify({ contextualUnderstanding: null, confirmedUnderstanding: "a".repeat(3865),
    classification: "Curta", suggestions: [] });
  assert.ok(fullMemory.length <= 4000);
  const boundedClosure = attendanceSummary({ ...closing, closureReason: "p".repeat(160) }, "c".repeat(120), null, fullMemory);
  assert.ok(boundedClosure.length <= 4000);
  assert.equal(JSON.parse(boundedClosure).confirmedUnderstanding, JSON.parse(fullMemory).confirmedUnderstanding);
  assert.equal(JSON.parse(boundedClosure).classification, "Curta");
  assert.equal(JSON.parse(boundedClosure).pendingReason, "Sem avanço útil.");
  const resumedProjection = attendanceProjection({ ...conversation, accountContext: {
    summary: boundedClosure, updatedAt: conversation.updatedAt,
  } }, context.catalog);
  assert.equal(JSON.parse(resumedProjection.summary!).pendingReason, "Sem avanço útil.");
  for (const escaped of [false, true]) {
    const minimal = { confirmedUnderstanding: "", classification: "Curta", pendingReason: "Sem avanço útil." };
    const budget = 4000 - JSON.stringify(minimal).length;
    minimal.confirmedUnderstanding = escaped ? '"\n'.repeat(Math.floor(budget / 4)) + "a".repeat(budget % 4) : "a".repeat(budget);
    const atLimit = JSON.stringify(minimal);
    assert.equal(atLimit.length, 4000);
    const closedAgain = attendanceSummary({ ...closing, closureReason: "p".repeat(160) }, "c".repeat(120), null, atLimit);
    assert.equal(closedAgain, atLimit);
    assert.equal(JSON.parse(attendanceProjection({ ...conversation, accountContext: {
      summary: closedAgain, updatedAt: conversation.updatedAt,
    } }, context.catalog).summary!).pendingReason, minimal.pendingReason);
    for (const resumption of [later, noBusinessNews]) {
      const usefulResumption = attendanceSummary(resumption, "c".repeat(120), null, atLimit);
      assert.ok(usefulResumption.length <= 4000);
      assert.equal(JSON.parse(usefulResumption).confirmedUnderstanding, minimal.confirmedUnderstanding);
      assert.equal(JSON.parse(usefulResumption).classification, minimal.classification);
      assert.equal(JSON.parse(usefulResumption).pendingReason, null);
      assert.equal(JSON.parse(attendanceProjection({ ...conversation, accountContext: {
        summary: usefulResumption, updatedAt: conversation.updatedAt,
      } }, context.catalog).summary!).pendingReason, null);
      assert.equal(attendanceSummary(noBusinessNews, "c".repeat(120), null, usefulResumption), usefulResumption);
      assert.equal(attendanceSummary(closing, "c".repeat(120), null, usefulResumption), atLimit);
    }
    const partial = JSON.stringify({ ...minimal, pendingReason: "outro motivo" });
    assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, partial)).confirmedUnderstanding, null);
  }
  for (const oversized of ["a".repeat(4000), '"'.repeat(2000)]) {
    const result = attendanceSummary({ ...accepted, businessUnderstanding: oversized }, "Jardinagem", proposal);
    assert.ok(result.length <= 4000);
    assert.equal(JSON.parse(result).confirmedUnderstanding, null); // Full text remains in the dialogue/conversation.
  }
  assert.equal(attendanceProjection(conversation, context.catalog).displayedUnderstanding, conversation.businessContextText);
  assert.equal(JSON.stringify(attendanceProjection(conversation, context.catalog)).includes("ana@example.com"), false);
  const urlSummary = JSON.stringify({ ...draft, confirmedUnderstanding: "Atendo em https://example.com", suggestions: ["Conheça https://example.com"] });
  const projected = attendanceProjection({ ...conversation, accountContext: { summary: urlSummary, updatedAt: conversation.updatedAt } }, context.catalog);
  assert.equal(projected.summary?.includes("https://"), false);
  assert.equal(JSON.parse(projected.summary!).classification, draft.classification);
  assert.equal(JSON.parse(projected.summary!).suggestions.length, 1);
  assert.equal(JSON.parse(attendanceSummary(noBusinessNews, null, null, urlSummary)).confirmedUnderstanding, JSON.parse(urlSummary).confirmedUnderstanding);
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
  current = { ...conversation, accountContext: { summary: closedSummary, updatedAt: conversation.updatedAt } };
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    request: async ({ context: resumed }) => {
      assert.equal(JSON.parse(resumed.summary!).pendingReason, closing.closureReason);
      return { ok: true, output: base, responseId: "resumed", latencyMs: 1 };
    },
  })).ok, true); // Cordial closure creates no operational stop or reset.
  current = { ...conversation, preferredName: null, preferredNameDeclined: false };
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    request: async () => ({ ok: true, output: { ...closing, preferredName: null, preferredNameDeclined: false }, responseId: "closed", latencyMs: 1 }),
    commit: async input => {
      assert.equal(input.output.businessUnderstanding, conversation.businessContextText);
      assert.equal(input.confirm, false); assert.equal(input.proposal, null);
      assert.equal(input.output.readyToComplete, false);
      assert.equal(JSON.parse(input.summary).pendingReason, closing.closureReason);
      assert.equal(JSON.parse(input.summary).confirmedUnderstanding, null);
      return { ok: true, version: 3 };
    },
  })).ok, true);
  const exactDisplayed = "Manutenção  de jardins.\n\nReferência: https://example.com";
  for (const proposed of [base, pending, finishing]) {
    current = { ...conversation, businessContextText: exactDisplayed };
    assert.equal((await conductAttendanceTurn({ ...input, content: proposed.readyToComplete ? "Podemos seguir." : "Ana" }, {
      ...deps, primary: async () => proposed.readyToComplete ? nicheId : null,
      request: async ({ context: shown }) => ({ ok: true,
        output: validateAttendanceOutput({ ...proposed, businessUnderstanding: "" }, shown)!, responseId: "reused", latencyMs: 1 }),
      commit: async input => {
        assert.equal(input.confirm, false);
        assert.equal(input.output.businessUnderstanding, exactDisplayed);
        assert.equal(input.proposal?.kind ?? null, proposed.readyToComplete ? null : proposed.action === "existing" ? "existing" : "operational_fallback");
        assert.equal(JSON.parse(input.summary).confirmedUnderstanding, null);
        return { ok: true, version: 3 };
      },
    })).ok, true);
  }
  for (const acceptedProposal of [proposal, fallback]) {
    current = { ...conversation, businessContextText: exactDisplayed, attendanceProposal: acceptedProposal, stage: "niche_confirmation" };
    assert.equal((await conductAttendanceTurn({ ...input, intent: "confirm", content: "Sim, confirmo o entendimento exibido." }, {
      ...deps,
      request: async ({ context: shown }) => {
        assert.equal(shown.displayedUnderstanding?.includes("\n"), false);
        assert.equal(shown.displayedUnderstanding?.includes("https://"), false);
        return { ok: true, output: validateAttendanceOutput(confirm, shown)!, responseId: "accepted", latencyMs: 1 };
      },
      commit: async input => {
        assert.equal(input.confirm, true); assert.equal(input.proposal, null);
        assert.equal(input.output.businessUnderstanding, exactDisplayed);
        assert.equal(JSON.parse(input.summary).confirmedUnderstanding, exactDisplayed);
        return { ok: true, version: 3 };
      },
    })).ok, true);
  }
  for (const resume of [false, true]) {
    current = { ...conversation, businessContextText: "Serviços para condomínios.",
      attendanceTurnIntent: resume ? "message" : null,
      messages: [{ ...conversation.messages[0], content: "Agora esclareço: manutenção de jardins." }] };
    const result = await conductAttendanceTurn({ ...input, content: resume ? null : "Agora esclareço: manutenção de jardins.",
      intent: resume ? "resume" : "message" }, { ...deps, market: async query => {
        assert.match(query, /^Agora esclareço: manutenção de jardins\./);
        assert.match(query, /Serviços para condomínios\./);
        return [];
      } });
    assert.equal(result.ok, true);
  }
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
  current = { ...conversation }; effects.length = 0;
  let providerCallsAfterReadFailure = 0;
  assert.equal((await conductAttendanceTurn(input, { ...deps,
    operational: async options => {
      assert.equal(options.throwOnReadError, true);
      throw new Error("operational_resolution_read_failed");
    },
    request: async () => { providerCallsAfterReadFailure++; return { ok: true, output: base, responseId: "unexpected", latencyMs: 1 }; },
  })).ok, false);
  assert.equal(providerCallsAfterReadFailure, 0);
  assert.deepEqual(effects, ["claim", "release"]);
  current = { ...conversation, attendanceTurnIntent: "message" }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, deps)).ok, false); assert.deepEqual(effects, []);
  assert.equal((await conductAttendanceTurn({ ...input, intent: "resume", content: null }, deps)).ok, true);
  current = { ...conversation }; effects.length = 0;
  assert.equal((await conductAttendanceTurn({ ...input, expectedVersion: 10 }, deps)).ok, false); assert.deepEqual(effects, []);
  console.log("E10.12 seller attendance: confirmation, context, no Web/catalog write, provider and fenced retry cases passed.");
}
void main();
