import assert from "node:assert/strict";
import { agentBasePilotOrder, buildAgentBasePilotPrompt, parseAgentBasePilotResponse, selectAgentBasePilotInput } from "./pilot";
import { AGENT_BASE_PROMPT } from "./base-prompt";
import { AGENT_BASE_ABOUT_PROMPT } from "./about-prompt";
import { AGENT_BASE_AUDIENCE_PROMPT } from "./audience-prompt";
import { AGENT_BASE_MARKET_INSIGHTS_PROMPT } from "./market-insights-prompt";
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
const selected = selectAgentBasePilotInput(base, definitions)!;
assert.ok(selected.confirmed.materials, "confirmed institutional references remain available");
assert.ok(!Object.hasOwn(selected.confirmed, "audience"), "AI drafts never become confirmed business data");
const empty = selectAgentBasePilotInput({ ...base, sections: {} }, definitions)!;
assert.deepEqual(empty.confirmed, {});
const longBase = { ...base, sections: { ...base.sections, offers: { format: "text" as const, origin: "user_confirmed" as const, value: "o".repeat(10_001) } } };
const excluded = selectAgentBasePilotInput(longBase, definitions)!;
assert.equal(Object.hasOwn(excluded.confirmed, "offers"), false);
assert.match(excluded.notice, /Ofertas/);
assert.equal(selectAgentBasePilotInput({ ...base, sections: { business_name: { format: "text", value: "password=example-secret-value", origin: "user_confirmed" } } }, definitions), null);

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
console.log("D14F pilot: catalog identity/order, immutable prompts, provenance, progressive context and output boundaries passed (synthetic responses only).");
