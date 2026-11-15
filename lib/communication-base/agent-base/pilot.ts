import { AGENT_BASE_PROMPT, AGENT_BASE_PROMPT_VERSION } from "./base-prompt";
import { AGENT_BASE_ABOUT_PROMPT, AGENT_BASE_ABOUT_PROMPT_VERSION } from "./about-prompt";
import { AGENT_BASE_AUDIENCE_PROMPT, AGENT_BASE_AUDIENCE_PROMPT_VERSION } from "./audience-prompt";
import { AGENT_BASE_MARKET_INSIGHTS_PROMPT, AGENT_BASE_MARKET_INSIGHTS_PROMPT_VERSION } from "./market-insights-prompt";
import { CREDENTIAL_PATTERN, COMMUNICATION_ASSISTANCE_TEXT_MAX, parseStageTwoResponse, stageTwoSchema,
  type CommunicationSuggestion, type OfficialNicheContext, type WebSource } from "../ai-core";
import type { CommunicationBase } from "../contracts";
import { parseCommunicationFacts, parseSectionValue } from "../policy";
import type { CommunicationSectionDefinition } from "../registry";

const prompts = {
  about: { text: AGENT_BASE_ABOUT_PROMPT, version: AGENT_BASE_ABOUT_PROMPT_VERSION, format: "text" },
  audience: { text: AGENT_BASE_AUDIENCE_PROMPT, version: AGENT_BASE_AUDIENCE_PROMPT_VERSION, format: "text" },
  market_insights: { text: AGENT_BASE_MARKET_INSIGHTS_PROMPT, version: AGENT_BASE_MARKET_INSIGHTS_PROMPT_VERSION, format: "items" },
} as const;
export type AgentBasePilotKey = keyof typeof prompts;
export type AgentBasePilotSection = CommunicationSuggestion & Readonly<{
  sources: readonly WebSource[]; researched: boolean;
}>;

export function agentBasePilotOrder(definitions: readonly CommunicationSectionDefinition[]) {
  const ordered = definitions.filter(section => Object.hasOwn(prompts, section.key));
  if (ordered.length !== 3 || new Set(ordered.map(section => section.key)).size !== 3 ||
      ordered.some(section => section.stage !== 2 || section.format !== prompts[section.key as AgentBasePilotKey].format)) return null;
  return ordered;
}

export function agentBasePilotCatalogState(definitions: readonly CommunicationSectionDefinition[]) {
  return JSON.stringify(agentBasePilotOrder(definitions)?.map(({ key, label, format }) => ({ key, label, format })) ?? null);
}

export function selectAgentBasePilotInput(base: CommunicationBase, definitions: readonly CommunicationSectionDefinition[]) {
  const confirmed: Record<string, unknown> = {};
  const excluded: string[] = [];
  for (const definition of definitions) {
    if (definition.stage !== 1) continue;
    const stored = base.sections[definition.key];
    if (!stored || (stored.origin !== "user_confirmed" && stored.origin !== "pending_setup_confirmed")) continue;
    const value = parseSectionValue(definition, stored.value);
    const facts = parseCommunicationFacts(stored.facts ?? []);
    if (value === null || facts === null) return null;
    if (typeof value === "string" && value.length > COMMUNICATION_ASSISTANCE_TEXT_MAX) { excluded.push(definition.label); continue; }
    if ((typeof value === "string" ? value.trim() : value.length) || facts.length) {
      confirmed[definition.key] = { label: definition.label, value, facts, origin: stored.origin };
    }
  }
  if (CREDENTIAL_PATTERN.test(JSON.stringify(confirmed))) return null;
  return { confirmed, notice: excluded.length
    ? "Não consideradas nesta geração por excederem a capacidade da assistência: " + excluded.join("; ") + ". Os conteúdos completos continuam salvos, sem truncamento."
    : "" };
}

export function buildAgentBasePilotPrompt(input: Readonly<{
  base: CommunicationBase; niche: OfficialNicheContext; definitions: readonly CommunicationSectionDefinition[];
  key: AgentBasePilotKey; previous: readonly AgentBasePilotSection[];
}>) {
  const order = agentBasePilotOrder(input.definitions);
  const selected = selectAgentBasePilotInput(input.base, input.definitions);
  const target = order?.[input.previous.length];
  if (!target || target.key !== input.key || !selected || !Object.keys(selected.confirmed).length ||
      !input.niche.confirmed || !input.niche.name.trim() ||
      input.previous.some((section, index) => section.key !== order?.[index]?.key) ||
      CREDENTIAL_PATTERN.test(JSON.stringify([input.niche, input.previous]))) return null;
  const specialized = prompts[input.key];
  return {
    instructions: AGENT_BASE_PROMPT + "\n\n" + specialized.text,
    promptVersion: AGENT_BASE_PROMPT_VERSION + ":" + specialized.version,
    input: JSON.stringify({
      target_section: { key: target.key, label: target.label, format: target.format },
      section_order: order!.map(({ key, label }) => ({ key, label })),
      confirmed_business_data: selected.confirmed,
      official_niche: { taxon_id: input.niche.taxonId, name: input.niche.name },
      previous_sections: input.previous,
    }),
    schema: stageTwoSchema([input.key]),
  };
}

export function parseAgentBasePilotResponse(payload: unknown, key: AgentBasePilotKey) {
  const output = payload && typeof payload === "object" && "output" in payload ? payload.output : null;
  const researched = Array.isArray(output) && output.some(item => item?.type === "web_search_call");
  const parsed = parseStageTwoResponse(payload, { kind: "section", key }, researched);
  if (!parsed.ok) return parsed;
  return { ok: true as const, value: {
    ...parsed.value.suggestions[0], sources: parsed.value.sources, researched: parsed.value.researched,
  } satisfies AgentBasePilotSection, telemetry: parsed.telemetry };
}
