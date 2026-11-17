import assert from "node:assert/strict";
import { agentBasePilotOrder, agentBasePilotCatalogState, buildAgentBasePilotPrompt, parseAgentBasePilotResponse, selectAgentBasePilotInput } from "./pilot";
import { AGENT_BASE_PROMPT } from "./base-prompt";
import { AGENT_BASE_ABOUT_PROMPT } from "./about-prompt";
import { AGENT_BASE_AUDIENCE_PROMPT } from "./audience-prompt";
import { AGENT_BASE_MARKET_INSIGHTS_PROMPT } from "./market-insights-prompt";
import { parseStageTwoResponse } from "../ai-core";
import { communicationSections } from "../registry";
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
const definitions = communicationSections;
const order = agentBasePilotOrder(definitions);
assert.deepEqual(order?.map(section => section.key), ["about", "audience", "market_insights"]);
assert.deepEqual(agentBasePilotOrder([...definitions].reverse())?.map(section => section.key), ["market_insights", "audience", "about"], "catalog order determines the sequence");
assert.equal(agentBasePilotOrder(definitions.filter(section => section.key !== "about")), null);
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
console.log("D14F pilot: catalog identity/order, immutable prompts, provenance, progressive context and output boundaries passed (synthetic responses only).");
