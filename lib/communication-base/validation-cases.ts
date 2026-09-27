import assert from "node:assert/strict";

import { communicationSections, getCommunicationSection } from "./registry";
import { resolveCommunicationBaseAccess, type CommunicationBaseAccessDependencies } from "./access-policy";
import { parseSectionValue, projectCommunicationBase, withSection } from "./policy";
import { selectPendingSetupBusinessContext } from "./pending-setup-import";
import { parseStageOneResponse, parseStageTwoResponse, stageOnePrompt, stageTwoPrompt } from "./ai-core";

const keys = communicationSections.map((section) => section.key);
assert.equal(new Set(keys).size, keys.length, "section keys must be unique");
assert.equal(communicationSections.filter((section) => section.stage === 1).length, 7);
assert.equal(communicationSections.filter((section) => section.stage === 2).length, 7);

const business = getCommunicationSection("business_context");
const audience = getCommunicationSection("audience");
const faq = getCommunicationSection("faq");
assert.ok(business && audience && faq);
assert.equal(parseSectionValue(business, "  Atuo em Recife.  "), "Atuo em Recife.");
assert.equal(parseSectionValue(business, "x".repeat(4001)), null);
assert.equal(parseSectionValue(faq, [{ question: "Quem atende?", answer: "" }]), null);

const completedConversation = {
  stage: "completed",
  completed_at: "2026-09-27T12:00:00Z",
  business_context_text: "Atuo com consultoria em Recife.",
};
assert.equal(selectPendingSetupBusinessContext([completedConversation]), completedConversation.business_context_text);
assert.equal(selectPendingSetupBusinessContext([]), null);
assert.equal(selectPendingSetupBusinessContext([completedConversation, completedConversation]), null,
  "more than one completed conversation is ambiguous");
assert.equal(selectPendingSetupBusinessContext([{ ...completedConversation, stage: "in_progress" }]), null);
assert.equal(selectPendingSetupBusinessContext([{ ...completedConversation, completed_at: "invalid" }]), null);
assert.equal(selectPendingSetupBusinessContext([{ ...completedConversation, business_context_text: "  " }]), null);
assert.equal(selectPendingSetupBusinessContext([{ ...completedConversation, business_context_text: "x".repeat(4001) }]), null);
const future = { future_section: { format: "text", value: "Preservar", origin: "user_confirmed" } };
const initial = withSection(future, "business_context", "Consultoria", "pending_setup_confirmed");
assert.ok(initial);
assert.deepEqual(initial.future_section, future.future_section);
assert.equal(withSection(initial, "offers", ["Oferta"], "pending_setup_confirmed"), null);
assert.equal(withSection(initial, "audience", "Público", "user_confirmed"), null);

const evolved = withSection(initial, "audience", "Público em Recife", "user_reviewed");
assert.ok(evolved);
assert.deepEqual(evolved.future_section, future.future_section);
assert.deepEqual(evolved.business_context, initial.business_context);

const projected = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 3,
  sections_json: evolved,
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(projected);
assert.equal(projected.sections.business_context?.origin, "pending_setup_confirmed");
assert.equal(projected.sections.audience?.origin, "user_reviewed");
const stageOne = stageOnePrompt("business_context", "Consultoria para pequenas empresas em Recife.");
assert.ok(stageOne);
assert.match(stageOne.instructions, /Nunca crie preço/);
assert.deepEqual(JSON.parse(stageOne.input), {
  section: { key: "business_context", label: "Atuação" },
  user_text: "Consultoria para pequenas empresas em Recife.",
});
assert.equal(stageOnePrompt("audience", "texto"), null);
assert.equal(parseStageOneResponse({ output_text: JSON.stringify({
  suggestion: "Consultoria para pequenas empresas em Recife.", missing_question: "",
}) }).ok, true);
assert.equal(parseStageOneResponse({ output_text: JSON.stringify({
  suggestion: "Sugestão", missing_question: "",
}), output: [{ type: "web_search_call", status: "completed" }] }).ok, false,
"stage 1 must reject any web search call");

const stageTwo = stageTwoPrompt(projected, true);
const stageTwoInput = JSON.parse(stageTwo.input);
assert.deepEqual(Object.keys(stageTwoInput.confirmed_business_data), ["business_context"]);
assert.equal(stageTwoInput.confirmed_business_data.business_context, "Consultoria");
assert.equal(JSON.stringify(stageTwoInput).includes("Público em Recife"), false,
"stage 2 must not send its own unconfirmed content as a fact");
const stageTwoSections = Object.fromEntries(communicationSections
  .filter((section) => section.stage === 2)
  .map((section) => [section.key, {
    value: section.format === "text" ? "Rascunho revisável" :
      section.format === "faq" ? [{ question: "Pergunta?", answer: "Resposta revisável." }] :
        ["Hipótese revisável"],
    basis: section.key === "about" ? "confirmed_business_fact" : "strategic_hypothesis",
  }]));
const stageTwoPayload = { output_text: JSON.stringify({ sections: stageTwoSections }), output: [] };
assert.equal(parseStageTwoResponse(stageTwoPayload, false).ok, true);
assert.equal(parseStageTwoResponse(stageTwoPayload, true).ok, false,
"current/local research requires an actual web call");
const searched = {
  ...stageTwoPayload,
  output: [{ type: "web_search_call", status: "completed", action: {
    sources: [{ title: "Fonte", url: "https://example.org/mercado" }],
  } }],
};
const researched = parseStageTwoResponse(searched, true);
assert.equal(researched.ok, true);
if (researched.ok) assert.equal(researched.value.sources.length, 1);
assert.equal(parseStageTwoResponse({ ...searched, output: [{
  type: "web_search_call", status: "completed", action: { sources: [{ url: "http://example.org" }] },
}] }, true).ok, false, "insecure sources must fail closed");
assert.equal(parseStageTwoResponse({ ...stageTwoPayload, output_text: JSON.stringify({
  sections: { ...stageTwoSections, audience: { value: "Público", basis: "confirmed_business_fact" } },
}) }, false).ok, false, "strategic hypotheses must remain distinct");
assert.equal("future_section" in projected.sections, false);
assert.equal(projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 3,
  sections_json: { ...evolved, audience: { format: "text", value: "Público", origin: "user_confirmed" } },
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
}), null, "stored stage 2 provenance must be rejected");
assert.equal(projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 3,
  sections_json: { ...evolved, offers: { format: "items", value: ["Oferta"], origin: "pending_setup_confirmed" } },
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
}), null, "Pending Setup provenance applies only to business context");
assert.equal(projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001",
  version: 0,
  sections_json: evolved,
  created_at: "2026-09-27T00:00:00Z",
  updated_at: "2026-09-27T00:00:00Z",
}), null);

async function runAccessCases() {
  const validAccess = {
    blocked: false,
    account: { id: "00000000-0000-4000-8000-000000000001", status: "active" },
    member: { role: "owner", status: "active" },
  };
  type AccessSnapshot = Awaited<ReturnType<CommunicationBaseAccessDependencies["loadAccess"]>>;
  type EntitlementSnapshot = Awaited<ReturnType<CommunicationBaseAccessDependencies["readEntitlement"]>>;
  const eligible: EntitlementSnapshot = { ok: true, signal: { isCommerciallyEligible: true } };
  async function decideAccess(
    access: AccessSnapshot,
    entitlement: EntitlementSnapshot = eligible,
    requireEdit = false,
  ) {
    return resolveCommunicationBaseAccess("  EMPRESA  ", requireEdit, {
      enabled: true,
      loadAccess: async () => access,
      readEntitlement: async () => entitlement,
    });
  }

  let accessReads = 0;
  let entitlementReads = 0;
  const countingDependencies: CommunicationBaseAccessDependencies = {
    enabled: false,
    loadAccess: async () => { accessReads++; return validAccess; },
    readEntitlement: async () => { entitlementReads++; return eligible; },
  };
  assert.deepEqual(await resolveCommunicationBaseAccess("empresa", true, countingDependencies),
    { ok: false, error: "unavailable" });
  assert.equal(accessReads, 0, "disabled gate must not read account data");
  assert.equal(entitlementReads, 0, "disabled gate must not read entitlement");
  assert.deepEqual(await resolveCommunicationBaseAccess("../other", true,
    { ...countingDependencies, enabled: true }), { ok: false, error: "forbidden" });
  assert.equal(accessReads, 0, "invalid account path must not load access");

  assert.deepEqual(await decideAccess(validAccess, eligible, true), { ok: true, value: {
    accountId: validAccess.account.id,
    accountSubdomain: "empresa",
    role: "owner",
    canEdit: true,
  } });
  for (const role of ["admin", "editor"] as const) {
    const result = await decideAccess({ ...validAccess, member: { role, status: "active" } }, eligible, true);
    assert.equal(result.ok, true, `${role} should edit`);
  }
  const viewer = { ...validAccess, member: { role: "viewer", status: "active" } };
  assert.equal((await decideAccess(viewer)).ok, true, "viewer should read");
  assert.deepEqual(await decideAccess(viewer, eligible, true), { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess(null), { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, blocked: true }), { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, account: { ...validAccess.account, status: "inactive" } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, member: { role: "owner", status: "inactive" } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess({ ...validAccess, member: { role: "unknown", status: "active" } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess(validAccess, { ok: true, signal: { isCommerciallyEligible: false } }),
    { ok: false, error: "forbidden" });
  assert.deepEqual(await decideAccess(validAccess, { ok: false }), { ok: false, error: "read_failed" });
  assert.deepEqual(await resolveCommunicationBaseAccess("empresa", true, {
    enabled: true,
    loadAccess: async () => { throw new Error("access read failed"); },
    readEntitlement: async () => eligible,
  }), { ok: false, error: "read_failed" });
  assert.deepEqual(await resolveCommunicationBaseAccess("empresa", true, {
    enabled: true,
    loadAccess: async () => validAccess,
    readEntitlement: async () => { throw new Error("entitlement read failed"); },
  }), { ok: false, error: "read_failed" });
}

runAccessCases().then(
  () => console.log("communication-base validation cases: ok"),
  (error: unknown) => { console.error(error); process.exitCode = 1; },
);