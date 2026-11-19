import assert from "node:assert/strict";
import { AGENT_BASE_PILOT_MODEL, agentBasePilotOrder, agentBasePilotCatalogState, buildAgentBasePilotPrompt, parseAgentBasePilotResponse, sanitizeAgentBasePilotFailureReason, selectAgentBasePilotInput } from "./pilot";
import { AGENT_BASE_PROMPT } from "./base-prompt";
import { AGENT_BASE_ABOUT_PROMPT } from "./about-prompt";
import { AGENT_BASE_AUDIENCE_PROMPT } from "./audience-prompt";
import { AGENT_BASE_MARKET_INSIGHTS_PROMPT } from "./market-insights-prompt";
import { parseStageTwoResponse, stageTwoSchema } from "../ai-core";
import { communicationSections } from "../registry";
import { parseStoredSections, withGeneratedIntelligence } from "../policy";
import type { CommunicationBase } from "../contracts";

const base: CommunicationBase = {
  accountId: "00000000-0000-4000-8000-000000000001", version: 1, createdAt: "t", updatedAt: "t",
  sections: {
    business_name: { format: "text", value: "Negócio QA", origin: "user_confirmed", facts: [{ label: "Identificação", value: "Cenário técnico" }] },
    business_context: { format: "text", value: "Dados confirmados", origin: "pending_setup_confirmed" },
    materials: { format: "text", value: "Referência institucional confirmada", origin: "user_confirmed" },
    audience: { format: "text", value: "Texto salvo não confirmado como fato", origin: "user_reviewed" },
  },
};
const niche = { taxonId: null, name: "Nicho oficial confirmado", confirmed: true, revision: "1" };
assert.equal(AGENT_BASE_PILOT_MODEL, "gpt-6.2-sol");
const definitions = communicationSections;
const order = agentBasePilotOrder(definitions);
const expectedKeys = definitions.filter(section => section.stage === 2).map(section => section.key);
assert.deepEqual(order?.map(section => section.key), expectedKeys);
assert.deepEqual(agentBasePilotOrder([...definitions].reverse())?.map(section => section.key),
  [...expectedKeys].reverse(), "catalog order determines the sequence");
assert.deepEqual(agentBasePilotOrder(definitions.filter(section => section.key !== "about"))?.map(section => section.key),
  expectedKeys.filter(key => key !== "about"), "catalog determines the available sections");
assert.equal(agentBasePilotOrder([...definitions, definitions[7]]), null);
assert.equal(agentBasePilotOrder(definitions.map(section => section.key === "about" ? { ...section, format: "items" } : section)), null);
const snapshot = agentBasePilotCatalogState(definitions);
assert.notEqual(agentBasePilotCatalogState(definitions.map(section => section.key === "business_context" ? { ...section, label: "Regiões não atendidas" } : section)), snapshot, "renaming a confirmed input invalidates results without a Base version change");
assert.notEqual(agentBasePilotCatalogState([...definitions].reverse()), snapshot, "catalog order changes invalidate the execution snapshot");
assert.equal(agentBasePilotCatalogState([...definitions, { key: "custom_material", label: "Referência", stage: 3, format: "material_items", group: "Materiais" }]), snapshot, "unconsumed Category 2 definitions do not invalidate the pilot");
const selected = selectAgentBasePilotInput(base, definitions)!;
assert.ok(selected.confirmed.materials, "confirmed institutional references remain available");
const customKey = "custom_00000000-0000-4000-8000-000000000002";
const customDefinitions = [...definitions, { key: customKey, label: "Regiões não atendidas", stage: 1 as const, format: "text" as const, group: "Negócio" }];
const customInput = selectAgentBasePilotInput({ ...base, sections: { ...base.sections,
  [customKey]: { format: "text", value: "São Paulo", origin: "user_confirmed" },
} }, customDefinitions)!;
assert.deepEqual(customInput.confirmed[customKey], { label: "Regiões não atendidas", value: "São Paulo", facts: [], origin: "user_confirmed" }, "opaque custom keys retain their confirmed semantic label");

assert.ok(!Object.hasOwn(selected.confirmed, "audience"), "AI drafts never become confirmed business data");
const empty = selectAgentBasePilotInput({ ...base, sections: {} }, definitions)!;
assert.deepEqual(empty.confirmed, {});
const longBase = { ...base, sections: { ...base.sections, offers: { format: "text" as const, origin: "user_confirmed" as const, value: "o".repeat(10_001) } } };
const excluded = selectAgentBasePilotInput(longBase, definitions)!;
assert.equal(Object.hasOwn(excluded.confirmed, "offers"), false);
assert.match(excluded.notice, /Ofertas/);
assert.equal(selectAgentBasePilotInput({ ...base, sections: { business_name: { format: "text", value: "password=example-secret-value", origin: "user_confirmed" } } }, definitions), null);

assert.equal(selectAgentBasePilotInput({ ...base, sections: { business_name: { format: "text", value: "Nome confirmado", origin: "user_confirmed", facts: [{ label: "senha", value: "secret-test-value" }] } } }, definitions), null, "separate fact labels and values must be checked before JSON serialization");
assert.equal(selectAgentBasePilotInput({ ...base, sections: { [customKey]: { format: "text", value: "secret-test-value", origin: "user_confirmed" } } }, customDefinitions.map(section => section.key === customKey ? { ...section, label: "Senha" } : section)), null, "custom section labels cannot separate credentials from their values");

const previous: Parameters<typeof buildAgentBasePilotPrompt>[0]["previous"][number][] = [];
for (const [key, specialized, value] of [
  ["about", AGENT_BASE_ABOUT_PROMPT, "Texto técnico"],
  ["audience", AGENT_BASE_AUDIENCE_PROMPT, "Contexto técnico"],
  ["market_insights", AGENT_BASE_MARKET_INSIGHTS_PROMPT, ["Dor: exemplo técnico"]],
] as const) {
  const prompt = buildAgentBasePilotPrompt({ base, niche, definitions, key, previous });
  assert.ok(prompt);
  assert.equal(prompt.instructions, AGENT_BASE_PROMPT + "\n\n" + specialized, "approved prompts are composed verbatim");
  const input = JSON.parse(prompt.input);
  assert.deepEqual(input.previous_sections, previous);
  assert.equal(input.confirmed_business_data.business_name.origin, "user_confirmed");
  assert.deepEqual(input.confirmed_business_data.business_name.facts, base.sections.business_name?.facts);
  assert.deepEqual(prompt.schema.properties.sections.required, [key]);
  const parsed = parseAgentBasePilotResponse({ output_text: JSON.stringify({ sections: { [key]: { value, basis: key === "about" ? "confirmed_business_fact" : "strategic_hypothesis" } } }) }, key);
  assert.equal(parsed.ok, true);
  if (parsed.ok) { assert.equal(parsed.value.researched, false); previous.push(parsed.value); }
}
const marketSchema = buildAgentBasePilotPrompt({
  base, niche, definitions, key: "market_insights", previous: previous.slice(0, 2),
})!.schema;
assert.equal(Reflect.get(marketSchema.properties.sections.properties.market_insights.properties.value, "maxItems"), 20,
  "pilot constrains the generated item count to the existing 20-item contract");
assert.equal(Reflect.get(stageTwoSchema(["market_insights"]).properties.sections.properties.market_insights.properties.value, "maxItems"),
  undefined, "shared schema remains unchanged");
for (const count of [20, 21]) {
  const result = parseAgentBasePilotResponse({ output_text: JSON.stringify({
    sections: { market_insights: { basis: "strategic_hypothesis",
      value: Array.from({ length: count }, (_, index) => "Item " + index) } },
  }) }, "market_insights");
  assert.equal(result.ok, count === 20, "20 items are accepted; 21 fail without truncation");
}
assert.equal(buildAgentBasePilotPrompt({ base, niche, definitions, key: "audience", previous: [] }), null, "cannot skip the current catalog section");
assert.equal(buildAgentBasePilotPrompt({ base, niche: { ...niche, confirmed: false }, definitions, key: "about", previous: [] }), null);
assert.equal(parseAgentBasePilotResponse({ output_text: JSON.stringify({ sections: { about: { value: "x".repeat(30_001), basis: "confirmed_business_fact" } } }) }, "about").ok, false);
const webOutput = { output_text: JSON.stringify({ sections: { audience: { value: "Resposta sintética", basis: "strategic_hypothesis" } } }), output: [
  { type: "web_search_call", status: "completed", action: { type: "search", sources: [{ url: "https://example.org/source", title: "Fixture" }] } },
] };
const withWeb = parseAgentBasePilotResponse(webOutput, "audience");
assert.equal(withWeb.ok, true);
if (withWeb.ok) { assert.equal(withWeb.value.researched, true); assert.equal(withWeb.value.sources.length, 1); }
assert.equal(parseAgentBasePilotResponse({ ...webOutput, output: [{ type: "web_search_call", status: "failed", action: { type: "search" } }] }, "audience").ok, false);
// D14F regression: autonomous research can return more than two web output items.
const autonomousOutput = (count: number) => ({ ...webOutput, output: Array.from({ length: count }, (_, index) => ({
  type: "web_search_call", status: "completed",
  action: { type: "search", sources: [{ url: "https://example.org/source/" + index, title: "Fixture " + index }] },
})) });
for (const count of [1, 2, 3, 6]) {
  const result = parseAgentBasePilotResponse(autonomousOutput(count), "audience");
  assert.equal(result.ok, true, "pilot accepts completed autonomous research with " + count + " calls");
  if (result.ok) {
    assert.equal(result.value.researched, true);
    assert.equal(result.value.sources.length, count);
    assert.equal(result.telemetry.webSearchCallCount, count);
    assert.equal(result.telemetry.webSearchSourceCount, count);
  }
  assert.equal(parseStageTwoResponse(autonomousOutput(count), { kind: "section", key: "audience" }, true).ok,
    count <= 2, "legacy generation retains its two-call ceiling");
}
const multiStepOutput = { ...webOutput, output: [webOutput.output[0],
  { type: "web_search_call", status: "completed", action: { type: "open_page", url: "https://example.org/page#part" } },
  { type: "web_search_call", status: "completed", action: { type: "find_in_page", url: "https://example.org/page" } },
] };
const multiStep = parseAgentBasePilotResponse(multiStepOutput, "audience");
assert.equal(multiStep.ok, true);
if (multiStep.ok) { assert.equal(multiStep.value.sources.length, 2); assert.equal(multiStep.telemetry.webSearchCallCount, 3); }
const { output_text: nativeText, ...nativeOutput } = autonomousOutput(3);
assert.equal(parseAgentBasePilotResponse({ ...nativeOutput, output: [...nativeOutput.output,
  { type: "message", content: [{ type: "output_text", text: nativeText }] },
] }, "audience").ok, true, "native Responses message extraction also accepts autonomous research");
const rejectPilot = (payload: unknown, reason: string) => {
  const result = parseAgentBasePilotResponse(payload, "audience");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, reason);
};
for (const call of [
  { type: "web_search_call", status: "failed", action: { type: "search" } },
  { type: "web_search_call", status: "in_progress", action: { type: "search" } },
  { type: "web_search_call", status: "completed", action: { type: "unknown" } },
]) rejectPilot({ ...autonomousOutput(3), output: [...autonomousOutput(3).output, call] }, "web_sources_missing");
for (const action of [
  { type: "search", sources: {} },
  { type: "search", sources: [{ url: "http://example.org/unsafe" }] },
  { type: "open_page", url: "https://user:password@example.org/unsafe" },
  { type: "find_in_page", url: "javascript:alert(1)" },
]) rejectPilot({ ...autonomousOutput(3), output: [...autonomousOutput(3).output,
  { type: "web_search_call", status: "completed", action },
] }, "web_sources_invalid");
rejectPilot({ ...webOutput, output: Array.from({ length: 3 }, () => ({
  type: "web_search_call", status: "completed", action: { type: "search", sources: [] },
})) }, "web_sources_missing");
assert.equal(parseAgentBasePilotResponse(autonomousOutput(50), "audience").ok, true, "source ceiling remains inclusive");
rejectPilot(autonomousOutput(51), "web_sources_invalid");
for (const [sections, reason] of [
  [{ audience: { value: "x".repeat(30_001), basis: "strategic_hypothesis" } }, "invalid_stage_two_value"],
  [{ audience: { value: [], basis: "strategic_hypothesis" } }, "invalid_stage_two_value"],
  [{ audience: { value: "Fixture", basis: "confirmed_business_fact" } }, "invalid_stage_two_basis"],
  [{ about: { value: "Fixture", basis: "confirmed_business_fact" } }, "invalid_stage_two_output"],
] as const) rejectPilot({ ...autonomousOutput(3), output_text: JSON.stringify({ sections }) }, reason);
rejectPilot({ ...autonomousOutput(3), output_text: "invalid json" }, "invalid_stage_two_output");
// Native Responses regression: commentary is not the structured final answer.
const commentaryMessage = { type: "message", role: "assistant", status: "completed", phase: "commentary",
  content: [{ type: "output_text", text: "Vou pesquisar antes de concluir." }] };
const finalMessage = { type: "message", role: "assistant", status: "completed", phase: "final_answer",
  content: [{ type: "output_text", text: webOutput.output_text }] };
const phasedOutput = { output: [commentaryMessage, ...autonomousOutput(3).output, finalMessage] };
const legacyPhased = parseStageTwoResponse(phasedOutput, { kind: "section", key: "audience" }, true, "autonomous");
assert.equal(legacyPhased.ok, false, "old extraction reads commentary as the JSON result");
if (!legacyPhased.ok) assert.equal(legacyPhased.reason, "invalid_stage_two_output");
const phased = parseAgentBasePilotResponse(phasedOutput, "audience");
assert.equal(phased.ok, true, "pilot reads final_answer after commentary and three Web calls");
if (phased.ok) {
  assert.equal(phased.value.value, "Resposta sintética");
  assert.equal(phased.value.sources.length, 3);
  assert.equal(phased.telemetry.webSearchCallCount, 3);
}
assert.equal(parseAgentBasePilotResponse({ ...phasedOutput,
  output_text: commentaryMessage.content[0].text + finalMessage.content[0].text,
}, "audience").ok, true, "native final message takes precedence over SDK aggregated output_text");
const citedFinal = { ...finalMessage, content: [{ type: "output_text", text: webOutput.output_text,
  annotations: [{ type: "url_citation", url: "https://example.org/cited#section", title: "Fonte citada" }] }] };
const sourceFreeCall = { type: "web_search_call", status: "completed", action: { type: "search" } };
const citedOnly = { output: [sourceFreeCall, citedFinal] };
const cited = parseAgentBasePilotResponse(citedOnly, "audience");
assert.equal(cited.ok, true, "pilot accepts native final-answer citations as verifiable sources");
if (cited.ok) {
  assert.deepEqual(cited.value.sources, [{ url: "https://example.org/cited", title: "Fonte citada" }]);
  assert.equal(cited.telemetry.webSearchCallCount, 1, "citations do not invent tool calls");
}
assert.equal(parseStageTwoResponse(citedOnly, { kind: "section", key: "audience" }, true, "autonomous").ok,
  false, "legacy parser remains unchanged");
const alreadySourced = parseAgentBasePilotResponse({ output: [webOutput.output[0], citedFinal] }, "audience");
assert.equal(alreadySourced.ok, true, "citations supplement nonempty action.sources");
if (alreadySourced.ok) {
  assert.equal(alreadySourced.value.sources.length, 2);
  assert.equal(alreadySourced.telemetry.webSearchCallCount, 1);
}
const manyCitations = Array.from({ length: 50 }, (_, i) => ({
  type: "url_citation", url: `https://example.org/extra/${i}`, title: "Fonte adicional",
}));
const citedWithCount = (count: number) => ({ output: [webOutput.output[0], {
  ...citedFinal, content: [{ ...citedFinal.content[0], annotations: manyCitations.slice(0, count) }],
}] });
const capped = parseAgentBasePilotResponse(citedWithCount(49), "audience");
assert.equal(capped.ok, true, "50 distinct sources total remain valid");
if (capped.ok) assert.equal(capped.telemetry.webSearchSourceCount, 50);
rejectPilot(citedWithCount(50), "web_sources_invalid");
rejectPilot({ output: [webOutput.output[0], { ...citedFinal, content: [{
  ...citedFinal.content[0], annotations: [{ type: "url_citation", url: "http://example.org/unsafe" }],
}] }] }, "web_sources_invalid");

for (const url of [undefined, null]) {
  const result = parseAgentBasePilotResponse({ ...webOutput, output: [webOutput.output[0],
    { type: "web_search_call", status: "completed", action: { type: "open_page", url } },
  ] }, "audience");
  assert.equal(result.ok, true, "open_page may omit its URL without inventing evidence");
  if (result.ok) assert.equal(result.telemetry.webSearchCallCount, 2);
}
rejectPilot({ output: [sourceFreeCall, finalMessage] }, "web_sources_missing");
rejectPilot({ output: [sourceFreeCall, { ...citedFinal, content: [{
  ...citedFinal.content[0], annotations: [{ type: "url_citation", url: "http://example.org/unsafe" }],
}] }] }, "web_sources_invalid");
rejectPilot({ output: [{ ...sourceFreeCall, action: { type: "search", sources: [{ url: "http://example.org/unsafe" }] } },
  citedFinal] }, "web_sources_invalid");
rejectPilot({ ...webOutput, output: [...webOutput.output,
  { type: "web_search_call", status: "completed", action: { type: "find_in_page", url: null } },
] }, "web_sources_invalid");

for (const phase of [undefined, null]) {
  assert.equal(parseAgentBasePilotResponse({ output: [commentaryMessage, ...autonomousOutput(3).output,
    { ...finalMessage, phase },
  ] }, "audience").ok, true, "phase is optional in the Responses contract");
}
const finalText = finalMessage.content[0].text;
assert.equal(parseAgentBasePilotResponse({ output: [commentaryMessage, ...autonomousOutput(3).output,
  { ...finalMessage, content: [
    { type: "output_text", text: finalText.slice(0, 20) }, { type: "output_text", text: finalText.slice(20) },
  ] },
] }, "audience").ok, true, "all text parts of the selected final message are assembled");
rejectPilot({ output_text: webOutput.output_text, output: [commentaryMessage, ...autonomousOutput(3).output] }, "pilot_final_output_missing");
rejectPilot({ output: [...phasedOutput.output, finalMessage] }, "pilot_final_output_ambiguous");
for (const status of ["incomplete", "in_progress", "failed"]) {
  rejectPilot({ output_text: webOutput.output_text, output: [commentaryMessage, ...autonomousOutput(3).output,
    { ...finalMessage, status },
  ] }, "pilot_final_output_incomplete");
}
rejectPilot({ output: [...autonomousOutput(3).output, { ...finalMessage, content: [] }] }, "pilot_final_output_missing");
rejectPilot({ output: [...autonomousOutput(3).output,
  { ...finalMessage, role: "user" },
] }, "pilot_final_output_missing");
rejectPilot({ output: [commentaryMessage, ...autonomousOutput(3).output,
  { ...finalMessage, content: [{ type: "output_text", text: "not JSON" }] },
], output_text: webOutput.output_text }, "invalid_stage_two_output");
const refused = parseAgentBasePilotResponse({ output_text: webOutput.output_text, output: [commentaryMessage,
  ...autonomousOutput(3).output, { ...finalMessage, content: [{ type: "refusal", refusal: "Synthetic refusal" }] },
] }, "audience");
assert.equal(refused.ok, false, "refusal cannot be hidden by aggregate text");
if (!refused.ok) { assert.equal(refused.kind, "refusal"); assert.equal(refused.reason, "openai_refusal"); }
rejectPilot({ output: [...phasedOutput.output,
  { type: "web_search_call", status: "failed", action: { type: "search" } },
] }, "web_sources_missing");
rejectPilot({ output: [commentaryMessage, ...autonomousOutput(51).output, finalMessage] }, "web_sources_invalid");
rejectPilot({ output: [commentaryMessage, ...autonomousOutput(3).output,
  { ...finalMessage, content: [{ type: "output_text", text: JSON.stringify({ sections: {
    audience: { value: "x".repeat(30_001), basis: "strategic_hypothesis" },
  } }) }] },
] }, "invalid_stage_two_value");
for (const reason of ["invalid_stage_two_output", "web_sources_invalid", "invalid_stage_two_value",
  "pilot_final_output_missing", "pilot_final_output_incomplete", "pilot_final_output_ambiguous", "openai_refusal"]) {
  assert.equal(sanitizeAgentBasePilotFailureReason(reason), reason, "local rejection code remains diagnosable");
}
for (const reason of ["", "provider error with private content", "invalid_stage_two_output\nprivate content",
  "https://example.org/private?token=fixture", JSON.stringify(phasedOutput)]) {
  assert.equal(sanitizeAgentBasePilotFailureReason(reason), "unclassified_failure", "arbitrary response/provider strings never reach logs");
}
const generated = definitions.filter(section => section.stage === 2).map(section => ({
  key: section.key, value: section.format === "faq" ? [{ question: "Pergunta?", answer: "Resposta confirmada." }]
    : section.format === "items" ? ["Descoberta pertinente"] : "Texto estratégico",
}));
const originals = { ...base.sections, custom_future: { format: "text", value: "Preservar" } };
const replaced = withGeneratedIntelligence(originals, generated, definitions);
assert.ok(replaced);
assert.deepEqual(replaced.business_name, originals.business_name, "confirmed business data remains intact");
assert.deepEqual(replaced.custom_future, originals.custom_future, "future unrelated categories remain intact");
assert.equal((replaced.about as { origin: string }).origin, "agent_generated");
assert.ok(parseStoredSections(replaced, definitions), "auto-generated provenance is readable");
assert.equal(withGeneratedIntelligence(originals, generated.slice(0, -1), definitions), null,
  "partial generation never creates a replacement");
assert.equal(withGeneratedIntelligence(originals, [...generated].reverse(), definitions), null,
  "out-of-order generation never creates a replacement");
assert.equal(withGeneratedIntelligence(originals, generated.map(section => section.key === "benefits"
  ? { key: section.key, value: Array.from({ length: 21 }, () => "Item") } : section), definitions), null,
  "invalid section blocks the entire replacement");
const dynamicDefinition = { key: "custom_intelligence", label: "Posicionamento adicional",
  format: "text" as const, stage: 2 as const, group: "Inteligência" };
const dynamicDefinitions = [...definitions, dynamicDefinition];
assert.deepEqual(agentBasePilotOrder(dynamicDefinitions)?.map(section => section.key),
  [...expectedKeys, dynamicDefinition.key], "a future section is generated without a fixed total");
const completed = generated.map(section => ({
  key: section.key, value: section.value, basis: section.key === "about"
    ? "confirmed_business_fact" as const : "strategic_hypothesis" as const,
  sources: [], researched: false,
}));
const dynamicPrompt = buildAgentBasePilotPrompt({
  base, niche, definitions: dynamicDefinitions, key: dynamicDefinition.key, previous: completed,
});
assert.ok(dynamicPrompt);
assert.match(dynamicPrompt.instructions, /Posicionamento adicional/);
assert.ok(parseAgentBasePilotResponse({ output_text: JSON.stringify({
  sections: { [dynamicDefinition.key]: { value: "Posicionamento claro", basis: "strategic_hypothesis" } },
}) }, dynamicDefinition.key, dynamicDefinitions).ok, "dynamic output uses shared source and content validation");
assert.equal(withGeneratedIntelligence(originals, [...generated, { key: dynamicDefinition.key, value: "Novo" }], dynamicDefinitions)
  ?.custom_intelligence && (withGeneratedIntelligence(originals,
    [...generated, { key: dynamicDefinition.key, value: "Novo" }], dynamicDefinitions)?.custom_intelligence as { origin: string }).origin,
  "agent_generated");
assert.equal(Reflect.get(buildAgentBasePilotPrompt({ base, niche, definitions, key: "faq",
  previous: completed.slice(0, -1) })!.schema.properties.sections.properties.faq.properties.value, "maxItems"), 15,
  "FAQ output observes the 15-pair existing limit");

console.log("D14F pilot: catalog identity/order, immutable prompts, provenance, progressive context and output boundaries passed (synthetic responses only).");
