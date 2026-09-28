import assert from "node:assert/strict";

import { communicationSections, getCommunicationSection } from "./registry";
import { resolveCommunicationBaseAccess, type CommunicationBaseAccessDependencies } from "./access-policy";
import { parseSectionValue, projectCommunicationBase, withSection } from "./policy";
import { selectPendingSetupBusinessContext } from "./pending-setup-import";
import { hasConfirmedStageOneInput, hasStageTwoContent, parseStageOneResponse, parseStageTwoResponse, stageOnePrompt, stageTwoPrompt } from "./ai-core";
import { selectStageTwoSectionPresentation, stageTwoBasisLabel } from "./stage-two-presentation";
import { sectionStateKey, stageOneStateKey } from "./ui-state-keys";
import { formatEditorValue, parseEditorValue } from "./editor-value";
import { requestOpenAiResponses } from "../conversion-content/adapters/openAiResponsesAdapter";
import { calculateOpenAiOperationCost, type OpenAiCostOperationTerminal, type OpenAiCostRecorder } from "../openai-costs";
import { resolveOpenAiProductWorkload } from "../openai-workloads";

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
const marketInsights = getCommunicationSection("market_insights");
assert.ok(marketInsights);
const itemEditorText = formatEditorValue(["Primeira linha\ncontinuação", "Segundo item"], "items");
assert.equal(itemEditorText, "Primeira linha continuação\nSegundo item");
assert.deepEqual(parseSectionValue(marketInsights, parseEditorValue("items", itemEditorText)),
  ["Primeira linha continuação", "Segundo item"], "one AI item must not become two editor items");
const faqEditorText = formatEditorValue([
  { question: "Pergunta\ncontinuação | detalhe?", answer: "Resposta\r\ncontinuação" },
  { question: "Outra pergunta?", answer: "Outra resposta." },
], "faq");
assert.equal(faqEditorText, "Pergunta continuação / detalhe? | Resposta continuação\nOutra pergunta? | Outra resposta.");
assert.deepEqual(parseSectionValue(faq, parseEditorValue("faq", faqEditorText)), [
  { question: "Pergunta continuação / detalhe?", answer: "Resposta continuação" },
  { question: "Outra pergunta?", answer: "Outra resposta." },
], "FAQ line breaks and a question delimiter must not create an incomplete row");
assert.equal(formatEditorValue("Texto\ncom parágrafo", "text"), "Texto\ncom parágrafo");

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
const stageOneKey = stageOneStateKey(projected);
const stageTwoFirstSave = { ...projected, version: projected.version + 1, sections: { ...projected.sections,
  about: { format: "text" as const, value: "Primeira seção salva", origin: "user_reviewed" as const },
} };
const stageTwoSecondSave = { ...stageTwoFirstSave, version: projected.version + 2, sections: {
  ...stageTwoFirstSave.sections,
  audience: { format: "text" as const, value: "Segunda seção salva", origin: "user_reviewed" as const },
} };
assert.equal(stageOneStateKey(stageTwoFirstSave), stageOneKey);
assert.equal(stageOneStateKey(stageTwoSecondSave), stageOneKey,
  "sequential stage 2 saves must preserve the general suggestion batch");
assert.equal(sectionStateKey(projected.sections.audience), sectionStateKey(stageTwoFirstSave.sections.audience),
  "saving another stage 2 section must preserve this editor's unsaved draft");
assert.notEqual(sectionStateKey(stageTwoFirstSave.sections.audience), sectionStateKey(stageTwoSecondSave.sections.audience),
  "the saved editor must refresh its own state");
const changedFacts = { ...projected, version: projected.version + 1, sections: { ...projected.sections,
  business_context: { format: "text" as const, value: "Atuação alterada", origin: "user_confirmed" as const },
} };
assert.notEqual(stageOneStateKey(changedFacts), stageOneKey,
  "a changed confirmed stage 1 fact must invalidate the suggestion batch");
assert.equal(stageOneStateKey({ ...projected, sections: { ...projected.sections,
  materials: { format: "items", value: ["Referência fora do alcance da Etapa 2"], origin: "user_confirmed" },
} }), stageOneKey, "unrelated stage 1 material must not discard paid stage 2 suggestions");
assert.notEqual(stageOneStateKey({ ...projected, accountId: "another-account" }), stageOneKey,
  "suggestions must not survive switching accounts");
const stageOne = stageOnePrompt("business_context", "Consultoria para pequenas empresas em Recife.");
assert.ok(stageOne);
assert.match(stageOne.instructions, /Nunca crie preço/);
assert.deepEqual(JSON.parse(stageOne.input), {
  section: { key: "business_context", label: "Atuação" },
  user_text: "Consultoria para pequenas empresas em Recife.",
});
assert.equal(stageOnePrompt("audience", "texto"), null);
assert.equal(stageOnePrompt("business_context", "OPENAI_API_KEY=placeholder-credential"), null,
  "credential-like text must fail before stage 1 egress");
for (const name of ["SUPABASE_SECRET_KEY", "SUPABASE_DB_PASSWORD", "STRIPE_WEBHOOK_SECRET", "GH_TOKEN"]) {
  assert.equal(stageOnePrompt("business_context", `${name}=placeholder-value`), null,
    `${name} must fail before stage 1 egress`);
}
assert.equal(stageOnePrompt("business_context", "SUPABASE_DB_URL_READONLY=postgresql://example.invalid/db"), null,
  "the authenticated read-only database URL must fail before stage 1 egress");
assert.ok(stageOnePrompt("business_context", "Produzimos molho secreto artesanal e atendimento humano."),
  "ordinary business language must remain eligible");
assert.equal(parseStageOneResponse({ output_text: JSON.stringify({
  suggestion: "Consultoria para pequenas empresas em Recife.", missing_question: "",
}) }).ok, true);
assert.equal(parseStageOneResponse({ output_text: JSON.stringify({
  suggestion: "Sugestão", missing_question: "",
}), output: [{ type: "web_search_call", status: "completed" }] }).ok, false,
"stage 1 must reject any web search call");

const generalTarget = { kind: "general" } as const;
const emptySections = withSection(withSection({}, "business_name", "   ", "user_confirmed")!,
  "offers", ["   "], "user_confirmed");
assert.ok(emptySections);
const emptyBase = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001", version: 3, sections_json: emptySections,
  created_at: "2026-09-27T00:00:00Z", updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(emptyBase);
for (const target of [generalTarget, { kind: "section", key: "about" } as const]) {
  assert.equal(hasConfirmedStageOneInput(emptyBase, target), false,
    "a saved empty stage 1 value must not unlock AI generation");
  assert.equal(stageTwoPrompt(emptyBase, target, false), null,
    "an empty confirmed value must not reach the provider");
}
const stageTwo = stageTwoPrompt(projected, generalTarget, true);
assert.ok(stageTwo);
const stageTwoInput = JSON.parse(stageTwo.input);
assert.deepEqual(stageTwoInput.target, { kind: "general", keys: communicationSections
  .filter((section) => section.stage === 2).map((section) => section.key) });
assert.deepEqual(stageTwo.schema.properties.sections.required, stageTwoInput.target.keys);
assert.deepEqual(Object.keys(stageTwoInput.confirmed_business_data), ["business_context"]);
assert.equal(stageTwoInput.confirmed_business_data.business_context, "Consultoria");
assert.deepEqual(stageTwoInput.existing_stage_two_draft, { audience: "Público em Recife" },
  "general update sends only existing stage 2 target drafts");
assert.equal(JSON.stringify(stageTwoInput.confirmed_business_data).includes("Público em Recife"), false,
"stage 2 must not send its own draft as a confirmed fact");
assert.equal(hasStageTwoContent(projected), true);
assert.equal(hasStageTwoContent({ ...projected, sections: { business_context: projected.sections.business_context } }), false);
const stageTwoSections = Object.fromEntries(communicationSections
  .filter((section) => section.stage === 2)
  .map((section) => [section.key, {
    value: section.format === "text" ? "Rascunho revisável" :
      section.format === "faq" ? [{ question: "Pergunta?", answer: "Resposta revisável." }] :
        ["Hipótese revisável"],
    basis: section.key === "about" ? "confirmed_business_fact" : "strategic_hypothesis",
  }]));
const stageTwoPayload = { output_text: JSON.stringify({ sections: stageTwoSections }), output: [] };
const general = parseStageTwoResponse(stageTwoPayload, generalTarget, false);
assert.equal(general.ok, true);
if (general.ok) assert.equal(general.value.suggestions.length, 7);
assert.equal(parseStageTwoResponse(stageTwoPayload, generalTarget, true).ok, false,
"current/local research requires an actual web call");
const searched = {
  ...stageTwoPayload,
  output: [{ type: "web_search_call", status: "completed", action: {
    sources: [{ title: "Fonte", url: "https://example.org/mercado" }],
  } }],
};
const researched = parseStageTwoResponse(searched, generalTarget, true);
assert.equal(researched.ok, true);
if (researched.ok) assert.equal(researched.value.sources.length, 1);
const generalSuggestion = { key: "audience" as const, value: "Geração geral", basis: "strategic_hypothesis" as const };
const localSuggestion = { key: "audience" as const, value: "Revisão local", basis: "strategic_hypothesis" as const };
const localPresentation = { generalRevision: 0, suggestion: localSuggestion,
  sources: [{ title: "Fonte local", url: "https://example.org/local" }] };
assert.deepEqual(selectStageTwoSectionPresentation(localPresentation, 0, generalSuggestion), {
  suggestion: localSuggestion, sources: localPresentation.sources,
});
assert.deepEqual(selectStageTwoSectionPresentation(localPresentation, 1, generalSuggestion), {
  suggestion: generalSuggestion, sources: [],
}, "a later general result must replace the local suggestion and its sources");
assert.equal(stageTwoBasisLabel(localSuggestion.basis), "Hipótese estratégica — não é fato confirmado da empresa.");
assert.equal(stageTwoBasisLabel("confirmed_business_fact"),
  "Baseado nos dados confirmados da Etapa 1; revise antes de usar.");
assert.equal(parseStageTwoResponse({ ...searched, output: [{
  type: "web_search_call", status: "completed", action: { sources: [{ url: "http://example.org" }] },
}] }, generalTarget, true).ok, false, "insecure sources must fail closed");
assert.equal(parseStageTwoResponse({ ...stageTwoPayload, output_text: JSON.stringify({
  sections: { ...stageTwoSections, audience: { value: "Público", basis: "confirmed_business_fact" } },
}) }, generalTarget, false).ok, false, "strategic hypotheses must remain distinct");
const sectionsBeforeLocalReview = structuredClone(projected.sections);
for (const section of communicationSections.filter((item) => item.stage === 2)) {
  const target = { kind: "section", key: section.key } as const;
  const prompt = stageTwoPrompt(projected, target, false);
  assert.ok(prompt);
  const input = JSON.parse(prompt.input);
  assert.deepEqual(input.target, { kind: "section", key: section.key });
  assert.deepEqual(prompt.schema.properties.sections.required, [section.key]);
  assert.deepEqual(Object.keys(prompt.schema.properties.sections.properties), [section.key]);
  assert.deepEqual(input.existing_stage_two_draft ?? {},
    section.key === "audience" ? { audience: "Público em Recife" } : {},
    `local ${section.key} must send only its own existing draft`);
  const localPayload = { output_text: JSON.stringify({ sections: { [section.key]: stageTwoSections[section.key] } }), output: [] };
  const local = parseStageTwoResponse(localPayload, target, false);
  assert.equal(local.ok, true, `local ${section.key} must be valid`);
  if (local.ok) assert.deepEqual(local.value.suggestions.map((item) => item.key), [section.key]);
  const researchedLocalPayload = { ...localPayload, output: searched.output };
  assert.equal(parseStageTwoResponse(researchedLocalPayload, target, false).ok, false,
    "web search must remain prohibited when not material, even for a local action");
  assert.equal(parseStageTwoResponse(researchedLocalPayload, target, true).ok, true,
    "web search may be required for a material local action");
  assert.equal(parseStageTwoResponse(stageTwoPayload, target, false).ok, false,
    `local ${section.key} must reject other stage 2 sections`);
  assert.equal(parseStageTwoResponse({ ...localPayload, output_text: JSON.stringify({ sections: {
    [section.key]: stageTwoSections[section.key], business_name: { value: "Invasão", basis: "confirmed_business_fact" },
  } }) }, target, false).ok, false, "stage 1 keys must be rejected");
  assert.equal(parseStageTwoResponse({ ...localPayload, output_text: JSON.stringify({ sections: {} }) },
    target, false).ok, false, "missing target key must be rejected");
}
assert.deepEqual(projected.sections, sectionsBeforeLocalReview,
  "a local suggestion must not silently mutate the current or other sections");
const initialBase = { ...projected, sections: { business_context: projected.sections.business_context } };
const firstGeneration = stageTwoPrompt(initialBase, generalTarget, false);
assert.ok(firstGeneration);
assert.equal("existing_stage_two_draft" in JSON.parse(firstGeneration.input), false,
  "first generation sends only confirmed stage 1 data");
const privateInput = withSection(withSection(initial, "service", "Contato privado 11 99999-9999", "user_confirmed")!,
  "materials", ["Referência interna"], "user_confirmed");
assert.ok(privateInput);
const privateBase = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001", version: 3, sections_json: privateInput,
  created_at: "2026-09-27T00:00:00Z", updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(privateBase);
const aboutPayload = stageTwoPrompt(privateBase, { kind: "section", key: "about" }, false);
assert.ok(aboutPayload);
assert.deepEqual(JSON.parse(aboutPayload.input).confirmed_business_data, { business_context: "Consultoria" },
  "about must not send unrelated contact or material fields");
const faqPayload = stageTwoPrompt(privateBase, { kind: "section", key: "faq" }, false);
assert.ok(faqPayload);
assert.deepEqual(Object.keys(JSON.parse(faqPayload.input).confirmed_business_data), ["business_context", "service"],
  "FAQ may receive the confirmed service field when pertinent");
const secretSections = withSection(initial, "preferences", "OPENAI_API_KEY=placeholder-credential", "user_confirmed");
assert.ok(secretSections);
const secretBase = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001", version: 3, sections_json: secretSections,
  created_at: "2026-09-27T00:00:00Z", updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(secretBase);
assert.equal(stageTwoPrompt(secretBase, generalTarget, false), null,
  "credential-like confirmed input must fail before stage 2 egress");
const namedSecretSections = withSection(initial, "preferences", "SUPABASE_SECRET_KEY=placeholder-value", "user_confirmed");
assert.ok(namedSecretSections);
const namedSecretBase = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001", version: 3, sections_json: namedSecretSections,
  created_at: "2026-09-27T00:00:00Z", updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(namedSecretBase);
assert.equal(stageTwoPrompt(namedSecretBase, generalTarget, false), null,
  "repository secret labels in confirmed stage 1 data must fail before stage 2 egress");
const databaseUrlSections = withSection(initial, "preferences",
  "SUPABASE_DB_URL_READONLY=postgresql://example.invalid/db", "user_confirmed");
assert.ok(databaseUrlSections);
const databaseUrlBase = projectCommunicationBase({
  account_id: "00000000-0000-4000-8000-000000000001", version: 3, sections_json: databaseUrlSections,
  created_at: "2026-09-27T00:00:00Z", updated_at: "2026-09-27T00:00:00Z",
});
assert.ok(databaseUrlBase);
assert.equal(stageTwoPrompt(databaseUrlBase, generalTarget, false), null,
  "the authenticated read-only database URL must fail before stage 2 egress");
const secretDraftBase = { ...projected, sections: { ...projected.sections,
  about: { format: "text" as const, value: "SUPABASE_DB_URL_READONLY=postgresql://example.invalid/db",
    origin: "user_reviewed" as const },
} };
assert.equal(stageTwoPrompt(secretDraftBase, { kind: "section", key: "about" }, false), null,
  "a secret label in the current target draft must fail before stage 2 egress");
assert.ok(stageTwoPrompt(secretDraftBase, { kind: "section", key: "audience" }, false),
  "a draft outside the local target must not enter its payload");
assert.equal(parseStageTwoResponse({ ...stageTwoPayload, output_text: JSON.stringify({ sections: {
  ...stageTwoSections, business_context: { value: "Invasão", basis: "confirmed_business_fact" },
} }) }, generalTarget, false).ok, false, "general output must reject stage 1 keys");
assert.equal(parseStageTwoResponse({ ...stageTwoPayload, output_text: JSON.stringify({ sections: {
  ...stageTwoSections, faq: undefined,
} }) }, generalTarget, false).ok, false, "general output must reject missing keys");
assert.equal(stageTwoPrompt(projected, { kind: "section", key: "business_context" }, false), null);
assert.equal(parseStageTwoResponse(stageTwoPayload, { kind: "section", key: "business_context" }, false).ok, false);
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
  runProviderFailureAccountingCase,
).then(
  () => console.log("communication-base validation cases: ok"),
  (error: unknown) => { console.error(error); process.exitCode = 1; },
);

async function runProviderFailureAccountingCase() {
  const resolved = await resolveOpenAiProductWorkload("communication_base_stage2_intelligence", "development");
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const terminals: OpenAiCostOperationTerminal[] = [];
  const executionEnvironments: string[] = [];
  const eventEnvironments: string[] = [];
  const recorder: OpenAiCostRecorder = {
    startExecution: async (execution) => { executionEnvironments.push(execution.environment); },
    startOperation: async () => {},
    finishOperation: async (terminal) => { terminals.push(terminal); },
    finishExecution: async () => {},
  };
  const input = {
    apiKey: "test-key",
    configuration: resolved.value,
    environment: "production" as const,
    request: { tools: [{ type: "web_search" }] },
    parseResponse: (payload: unknown) => parseStageTwoResponse(payload, { kind: "section", key: "audience" }, true),
    financialContext: { universe: "client" as const, attributionStatus: "attributed" as const,
      accountId: "00000000-0000-4000-8000-000000000001" },
    executionOrigin: "administrative_proof" as const,
  };
  const usage = { input_tokens: 1000, output_tokens: 500, total_tokens: 1500 };
  const withSearch = await requestOpenAiResponses(input, {
    costRecorder: recorder,
    emitEvent: (event) => { eventEnvironments.push(event.environment); },
    nowIso: () => "2026-09-27T23:00:00.000Z",
    fetchImpl: async () => new Response(JSON.stringify({
      id: "resp_failed_after_search", usage,
      output_text: JSON.stringify({ sections: { audience: { value: "Rascunho", basis: "confirmed_business_fact" } } }),
      output: [{ type: "web_search_call", status: "completed", action: {
        sources: [{ title: "Fonte", url: "https://example.org/mercado" }],
      } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }),
  });
  assert.equal(withSearch.ok, false);
  assert.deepEqual(executionEnvironments, ["production"],
    "the selected proof environment must reach the cost execution");
  assert.deepEqual(eventEnvironments, ["production"],
    "the selected proof environment must reach workload telemetry");
  assert.equal(terminals[0]?.webSearchCallCount, 1, "a failed response must retain the observed Web Search call");
  assert.equal(terminals[0]?.webSearchRequested, true);
  assert.deepEqual(calculateOpenAiOperationCost({
    model: resolved.value.model, startedAt: "2026-09-27T23:00:00.000Z",
    usage: terminals[0]?.usage, webSearchCallCount: terminals[0]?.webSearchCallCount,
    webSearchRequested: terminals[0]?.webSearchRequested,
  }).pricingSnapshot?.webSearch, {
    toolVersion: "web-search-2026-09-11-v1", unit: "per_call", pricePerCallUsd: "0.01", callCount: 1,
  });
  const withoutObservableOutput = await requestOpenAiResponses(input, {
    costRecorder: recorder,
    emitEvent: () => {},
    nowIso: () => "2026-09-27T23:00:00.000Z",
    fetchImpl: async () => new Response(JSON.stringify({ id: "resp_failed_without_output", usage, output_text: "{}" }),
      { status: 200, headers: { "Content-Type": "application/json" } }),
  });
  assert.equal(withoutObservableOutput.ok, false);
  assert.equal(terminals[1]?.webSearchCallCount, null);
  assert.equal(calculateOpenAiOperationCost({
    model: resolved.value.model, startedAt: "2026-09-27T23:00:00.000Z",
    usage: terminals[1]?.usage, webSearchCallCount: terminals[1]?.webSearchCallCount,
    webSearchRequested: terminals[1]?.webSearchRequested,
  }).costUnavailableReason, "web_search_usage_missing");
}
