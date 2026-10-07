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
  confirmedUnderstanding: "Manutenção de jardins para condomínios.",
  preferredName: "Ana", summary: "Manutenção de jardins para condomínios.", research: false,
  recent: [{ role: "user", content: "Faço manutenção de jardins para condomínios." }],
  catalog: [
    { id: segmentId, name: "Serviços", level: "segment", parentId: null, active: true, inactiveAliases: [], aliases: [] },
    { id: nicheId, name: "Jardinagem", level: "niche", parentId: segmentId, active: true, inactiveAliases: [], aliases: ["Manutenção de jardins"] },
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
  accountContext: { summary: "Memória corrente da conta, compartilhada.", updatedAt: "2026-10-06T00:00:00Z" },
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
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, context, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: false }, context, [])?.preferredName, null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true },
    { ...context, preferredName: null }, [])?.preferredNameDeclined, true);
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
  const aliasSource = "https://example.com/physical-therapy";
  const aliasOnly: AttendanceOutput = { ...market, chain: [
    { level: "segment", name: "Serviços", existingId: segmentId },
    { level: "niche", name: "Jardinagem", existingId: nicheId }],
    aliases: [{ text: "Cuidados contínuos de jardins", equivalentTo: "Jardinagem",
      equivalence: "proven", justification: "Equivalência comprovada.", evidenceUrls: [source] }] };
  assert.equal(validateAttendanceOutput(aliasOnly, { ...context, research: true }, [source])?.action, "propose");
  assert.equal(validateAttendanceOutput({ ...aliasOnly, aliases: [] }, { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput(aliasOnly, { ...context, research: true }, []), null);
  const separateAliasEvidence = { ...market, aliases: [{ ...equivalent, evidenceUrls: [aliasSource] }] };
  assert.equal(validateAttendanceOutput(separateAliasEvidence, { ...context, research: true }, [source, aliasSource])?.action, "propose");
  const sourcedProposal = attendanceProposal(separateAliasEvidence, [source, aliasSource, source]);
  assert.deepEqual(sourcedProposal?.sources, [source, aliasSource]);
  assert.ok(validateStoredAttendanceProposal(sourcedProposal));
  assert.equal(sourcedProposal?.aliases[0].evidenceUrls.every(url => sourcedProposal.sources.includes(url)), true);
  const topSources = Array.from({ length: 8 }, (_, i) => "https://example.com/source-" + i);
  assert.equal(validateAttendanceOutput({ ...separateAliasEvidence, evidenceUrls: topSources },
    { ...context, research: true }, [...topSources, aliasSource]), null);
  assert.equal(validateAttendanceOutput(separateAliasEvidence, { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, aliases: [{ ...equivalent, equivalence: "related" }] }, { ...context, research: true }, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, aliases: [{ ...equivalent, equivalence: "ambiguous" }] }, { ...context, research: true }, [source]), null);
  const inactiveCanonical = { ...context, research: true, catalog: [...context.catalog,
    { id: accountId, name: "Fisioterapia", level: "niche" as const, parentId: segmentId,
      active: false, aliases: [], inactiveAliases: [] }] };
  assert.equal(validateAttendanceOutput(market, inactiveCanonical, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, chain: [{ ...market.chain[0], existingId: null },
    market.chain[1]] }, inactiveCanonical, [source]), null); // Requery resolves an existing parent by name.
  assert.equal(validateAttendanceOutput({ ...market, chain: [{ level: "segment", name: "Novo segmento",
    existingId: null }, market.chain[1]] }, inactiveCanonical, [source])?.action, "propose");
  assert.equal(validateAttendanceOutput(market, { ...inactiveCanonical, catalog: inactiveCanonical.catalog.map(taxon =>
    taxon.id === accountId ? { ...taxon, parentId: nicheId } : taxon) }, [source])?.action, "propose");
  assert.equal(validateAttendanceOutput({ ...market, chain: [{ level: "segment", name: "Serviços",
    existingId: null }, market.chain[1]] }, { ...context, research: true,
    catalog: context.catalog.map(taxon => taxon.id === segmentId ? { ...taxon, active: false } : taxon) }, [source]), null);
  const inactiveCollision = { ...context, research: true, catalog: context.catalog.map(taxon =>
    taxon.id === nicheId ? { ...taxon, inactiveAliases: ["Fisioterapia", "Terapia física"] } : taxon) };
  assert.equal(validateAttendanceOutput(market, inactiveCollision, [source]), null);
  assert.equal(validateAttendanceOutput({ ...market, aliases: [equivalent] }, {
    ...inactiveCollision, catalog: inactiveCollision.catalog.map(taxon =>
      ({ ...taxon, inactiveAliases: ["Terapia física"] })) }, [source]), null);
  assert.equal(validateAttendanceOutput(base, { ...context, currentPrimaryTaxonId: segmentId }, []), null);
  assert.equal(validateAttendanceOutput(market, { ...context, research: true, currentPrimaryTaxonId: nicheId }, [source]), null);
  assert.equal(validateAttendanceOutput(base, { ...context, currentPrimaryTaxonId: nicheId,
    }, [])?.action, "existing");
  const proposal = attendanceProposal(market, [source]);
  assert.ok(validateStoredAttendanceProposal(proposal));
  assert.equal(validateStoredAttendanceProposal({ ...proposal, sources: ["javascript:alert(1)"] }), null);
  assert.equal(validateStoredAttendanceProposal({ ...proposal, sources: ["malformed"] }), null);
  assert.ok(proposal);
  assert.equal(validateAttendanceOutput({ ...base, action: "confirm", existingTaxonId: null },
    { ...context, confirmedProposal: proposal }, [])?.action, "confirm");
  assert.equal(validateAttendanceOutput({ ...base, action: "confirm", existingTaxonId: null,
    preferredName: null, preferredNameDeclined: true }, { ...context, confirmedProposal: proposal }, []), null);
  const unknownName = { ...context, preferredName: null, preferredNameDeclined: false };
  assert.equal(validateAttendanceOutput(base, unknownName, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...unknownName,
    recent: [{ role: "user", content: "Minha cliente Bia precisa de jardins." }] }, []), null);
  assert.equal(validateAttendanceOutput(base, { ...unknownName,
    recent: [{ role: "user", content: "Me chame de Ana." }] }, [])?.preferredName, "Ana");
  const nameQuestion = { role: "assistant" as const, content: "Olá! Como você prefere ser chamado?" };
  assert.equal(validateAttendanceOutput(base, { ...unknownName,
    recent: [nameQuestion, { role: "user", content: "Ana." }] }, [])?.preferredName, "Ana");
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...unknownName,
    recent: [nameQuestion, { role: "user", content: "Minha cliente Bia precisa de jardins." }] }, []), null);
  assert.equal(validateAttendanceOutput({ ...base, action: "confirm", existingTaxonId: null },
    { ...unknownName, confirmedProposal: proposal,
      recent: [nameQuestion, { role: "user", content: "Ana." }] }, []), null);
  const declinedContext = { ...context, preferredName: null, preferredNameDeclined: true };
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null }, declinedContext, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: null, preferredNameDeclined: true }, declinedContext, [])?.preferredNameDeclined, true);
  assert.equal(validateAttendanceOutput(base, declinedContext, []), null);
  assert.equal(validateAttendanceOutput(base, { ...declinedContext,
    recent: [{ role: "user", content: "Me chame de Ana." }] }, [])?.preferredName, "Ana");
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, context, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...context,
    recent: [{ role: "user", content: "Me chame de Bia." }] }, [])?.preferredName, "Bia");
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia" }, { ...context,
    recent: [{ role: "user", content: "Minha cliente Bia precisa de jardins." }] }, []), null);
  assert.equal(validateAttendanceOutput({ ...base, preferredName: "Bia", action: "confirm", existingTaxonId: null },
    { ...context, confirmedProposal: proposal, recent: [{ role: "user", content: "Me chame de Bia." }] }, []), null);
  const fallbackConfirmation: AttendanceContext = { ...context, confirmedProposal: { kind: "operational_fallback",
    taxonId: null, chain: [], aliases: [], evidence: "", sources: [] } };
  const confirmWithoutSummary = { ...base, action: "confirm" as const, existingTaxonId: null, summary: "" };
  assert.equal(validateAttendanceOutput(confirmWithoutSummary, fallbackConfirmation, [])?.summary, context.summary);
  assert.equal(validateAttendanceOutput(confirmWithoutSummary, { ...fallbackConfirmation, confirmedUnderstanding: null }, []), null);
  const parsedFallback = parseAttendanceResponse(response(confirmWithoutSummary), fallbackConfirmation);
  assert.equal(parsedFallback.ok, true);
  if (parsedFallback.ok) assert.equal(parsedFallback.value.output.summary, context.summary);
  assert.equal(validateAttendanceOutput(confirmWithoutSummary, { ...context, confirmedProposal: proposal }, [])?.summary, context.summary);
  for (const confirmedProposal of [proposal, attendanceProposal(base, [])]) {
    assert.equal(validateAttendanceOutput({ ...confirmWithoutSummary, summary: "Fatos não confirmados pelo lead." },
      { ...context, confirmedProposal }, [])?.summary, context.summary);
    assert.equal(validateAttendanceOutput(confirmWithoutSummary, { ...context, confirmedUnderstanding: null, confirmedProposal }, []), null);
  }
  const projection = attendanceProjection(conversation, context.catalog);
  assert.equal(projection.recent.length, 8);
  assert.equal(projection.preferredNameDeclined, true);
  assert.equal(projection.summary, conversation.accountContext?.summary);
  assert.equal("legacyContext" in projection, false);
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
    primary: async () => null,
    discard: async () => { effects.push("discard"); return { ok: true, version: 3 }; },
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
    request: async ({ context: currentContext }) => {
      assert.equal(currentContext.summary, current.accountContext?.summary);
      assert.equal("legacyContext" in currentContext, false);
      assert.equal(currentContext.confirmedProposal, null);
      return { ok: true, output: { ...base, action: "pending", existingTaxonId: null },
        sources: [], responseId: "resp_current_dialogue", latencyMs: 1 };
    },
    commit: async (write) => {
      assert.equal(write.confirm, false);
      assert.equal(write.proposal?.kind, "operational_fallback");
      effects.push("commit");
      return { ok: true, version: 3 };
    },
  })).ok, true);
  assert.deepEqual(effects, ["claim", "commit"]);

  current = { ...current, version: 1, attendanceProposal: proposal };
  effects.length = 0;
  assert.equal((await conductAttendanceTurn({ ...input, intent: "confirm" }, {
    ...dependencies,
    request: async () => ({ ok: true, output: { ...base, action: "confirm", existingTaxonId: null },
      sources: [], responseId: "resp_conflict", latencyMs: 1 }),
    commit: async () => { effects.push("commit"); return { ok: false, reason: "primary_conflict" }; },
  })).ok, true);
  assert.deepEqual(effects, ["claim", "commit", "discard"]);
  // A primary changed externally is handled by a later ordinary user turn, without a special Sim.
  current = { ...current, version: 1, stage: "business_understanding", attendanceProposal: null, attendanceTurnIntent: null };
  effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, {
    ...dependencies, primary: async () => nicheId,
    request: async ({ context: next }) => {
      assert.equal(next.currentPrimaryTaxonId, nicheId);
      assert.equal(next.confirmedProposal, null);
      assert.equal(next.summary, current.accountContext?.summary);
      return { ok: true, output: base, sources: [], responseId: "resp_ordinary", latencyMs: 1 };
    },
    commit: async write => {
      assert.equal(write.confirm, false);
      assert.equal(write.observedPrimaryTaxonId, nicheId);
      effects.push("commit"); return { ok: true, version: 3 };
    },
  })).ok, true);
  assert.deepEqual(effects, ["claim", "commit"]);
  current = { ...current, version: 1 }; effects.length = 0;
  assert.equal((await conductAttendanceTurn(input, { ...dependencies,
    commit: async () => { effects.push("commit"); return { ok: false, reason: "conflict" }; },
  })).ok, false);
  assert.deepEqual(effects, ["claim", "commit", "release"]); // CAS conflict retains the user entry, no success.
  const newer = "Memória mais recente confirmada por outro usuário da conta.";
  assert.equal(validateAttendanceOutput(confirmWithoutSummary,
    { ...fallbackConfirmation, summary: newer }, [])?.summary, newer);
  console.log("ok - E10.12 prompt/transport, selective Web, memory, fencing and no false success");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
