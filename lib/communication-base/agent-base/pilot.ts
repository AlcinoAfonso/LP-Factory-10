import { AGENT_BASE_PROMPT, AGENT_BASE_PROMPT_VERSION } from "./base-prompt";
import { AGENT_BASE_ABOUT_PROMPT, AGENT_BASE_ABOUT_PROMPT_VERSION, AGENT_BASE_ABOUT_SECTION_SCHEMA } from "./about-prompt";
import { AGENT_BASE_AUDIENCE_PROMPT, AGENT_BASE_AUDIENCE_PROMPT_VERSION, AGENT_BASE_AUDIENCE_SECTION_SCHEMA } from "./audience-prompt";
import { AGENT_BASE_MARKET_INSIGHTS_PROMPT, AGENT_BASE_MARKET_INSIGHTS_PROMPT_VERSION, AGENT_BASE_MARKET_INSIGHTS_SECTION_SCHEMA } from "./market-insights-prompt";
import { AGENT_BASE_VALUE_PROPOSITION_PROMPT, AGENT_BASE_VALUE_PROPOSITION_PROMPT_VERSION,
  AGENT_BASE_VALUE_PROPOSITION_SECTION_SCHEMA } from "./value-proposition-prompt";
import { AGENT_BASE_BENEFITS_PROMPT, AGENT_BASE_BENEFITS_PROMPT_VERSION, AGENT_BASE_BENEFITS_SECTION_SCHEMA } from "./benefits-prompt";
import { AGENT_BASE_DIFFERENTIATORS_PROMPT, AGENT_BASE_DIFFERENTIATORS_PROMPT_VERSION, AGENT_BASE_DIFFERENTIATORS_SECTION_SCHEMA } from "./differentiators-prompt";
import { AGENT_BASE_FAQ_PROMPT, AGENT_BASE_FAQ_PROMPT_VERSION, AGENT_BASE_FAQ_SECTION_SCHEMA } from "./faq-prompt";
import { CREDENTIAL_PATTERN, COMMUNICATION_ASSISTANCE_TEXT_MAX, parseStageTwoResponse, stageTwoSchema,
  type CommunicationSuggestion, type OfficialNicheContext, type WebSource } from "../ai-core";
import type { CommunicationBase } from "../contracts";
import { COMMUNICATION_FAQ_MAX, COMMUNICATION_ITEMS_MAX, parseCommunicationFacts, parseSectionValue } from "../policy";
import { getSectionGuidance } from "../section-guidance";
import type { CommunicationSectionDefinition, CommunicationSectionKey } from "../registry";

const prompts = {
  about: { text: AGENT_BASE_ABOUT_PROMPT, version: AGENT_BASE_ABOUT_PROMPT_VERSION, format: "text" },
  audience: { text: AGENT_BASE_AUDIENCE_PROMPT, version: AGENT_BASE_AUDIENCE_PROMPT_VERSION, format: "text" },
  market_insights: { text: AGENT_BASE_MARKET_INSIGHTS_PROMPT, version: AGENT_BASE_MARKET_INSIGHTS_PROMPT_VERSION, format: "items" },
  value_proposition: { text: AGENT_BASE_VALUE_PROPOSITION_PROMPT, version: AGENT_BASE_VALUE_PROPOSITION_PROMPT_VERSION, format: "text" },
  benefits: { text: AGENT_BASE_BENEFITS_PROMPT, version: AGENT_BASE_BENEFITS_PROMPT_VERSION, format: "items" },
  differentiators: { text: AGENT_BASE_DIFFERENTIATORS_PROMPT, version: AGENT_BASE_DIFFERENTIATORS_PROMPT_VERSION, format: "items" },
  faq: { text: AGENT_BASE_FAQ_PROMPT, version: AGENT_BASE_FAQ_PROMPT_VERSION, format: "faq" },
} as const;
const sectionSchemas = {
  about: AGENT_BASE_ABOUT_SECTION_SCHEMA,
  audience: AGENT_BASE_AUDIENCE_SECTION_SCHEMA,
  market_insights: AGENT_BASE_MARKET_INSIGHTS_SECTION_SCHEMA,
  value_proposition: AGENT_BASE_VALUE_PROPOSITION_SECTION_SCHEMA,
  benefits: AGENT_BASE_BENEFITS_SECTION_SCHEMA,
  differentiators: AGENT_BASE_DIFFERENTIATORS_SECTION_SCHEMA,
  faq: AGENT_BASE_FAQ_SECTION_SCHEMA,
} as const;
export type AgentBasePilotKey = string;
export type AgentBasePilotSection = Omit<CommunicationSuggestion, "key"> & Readonly<{
  key: string; sources: readonly WebSource[]; researched: boolean; proof?: string; costExecutionId?: string;
}>;

export function agentBasePilotOrder(definitions: readonly CommunicationSectionDefinition[]) {
  const ordered = definitions.filter(section => section.stage === 2);
  if (!ordered.length || new Set(ordered.map(section => section.key)).size !== ordered.length ||
      ordered.some(section => !["text", "items", "faq"].includes(section.format) ||
        (Object.hasOwn(prompts, section.key) && section.format !== prompts[section.key as keyof typeof prompts].format))) return null;
  return ordered;
}

export function agentBasePilotCatalogState(definitions: readonly CommunicationSectionDefinition[]) {
  return JSON.stringify({
    business: definitions.filter(section => section.stage === 1).map(({ key, label, format }) => ({ key, label, format })),
    targets: agentBasePilotOrder(definitions)?.map(({ key, label, format }) => ({ key, label, format })) ?? null,
  });
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
    const factualText = [definition.label + ": " + (typeof value === "string" ? value : JSON.stringify(value)),
      ...facts.map(fact => fact.label + ": " + fact.value)].join("\n");
    if (CREDENTIAL_PATTERN.test(factualText)) return null;
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
  const specialized = Object.hasOwn(prompts, input.key) ? prompts[input.key as keyof typeof prompts] : null;
  const guidance = getSectionGuidance(input.key);
  const instructions = specialized?.text ?? [
    "# Seção — " + target.label,
    guidance?.description ?? "Desenvolva esta seção conforme sua finalidade comercial.",
    guidance?.help ?? "",
    "Produza somente esta seção, com clareza, sem redundâncias, sem inventar fatos ou promessas.",
    "Respeite o formato " + target.format + " e o contrato de saída.",
  ].filter(Boolean).join("\n");
  const schema = stageTwoSchema([input.key as CommunicationSectionKey], input.definitions);
  const sectionSchema = Object.hasOwn(sectionSchemas, input.key)
    ? sectionSchemas[input.key as keyof typeof sectionSchemas] : null;
  if (sectionSchema) {
    schema.properties.sections.properties[input.key] = sectionSchema;
  } else if (target.format === "items" || target.format === "faq") {
    const section = schema.properties.sections.properties[input.key];
    schema.properties.sections.properties[input.key] = { ...section,
      properties: { ...section.properties, value: Object.assign({}, section.properties.value,
        { maxItems: target.format === "faq" ? COMMUNICATION_FAQ_MAX : COMMUNICATION_ITEMS_MAX }) },
    };
  }
  return {
    instructions: AGENT_BASE_PROMPT + "\n\n" + instructions,
    promptVersion: AGENT_BASE_PROMPT_VERSION + ":" + (specialized?.version ?? "d14f_catalog_section_v1"),
    input: JSON.stringify({
      target_section: { key: target.key, label: target.label, format: target.format },
      section_order: order!.map(({ key, label }) => ({ key, label })),
      confirmed_business_data: selected.confirmed,
      official_niche: { taxon_id: input.niche.taxonId, name: input.niche.name },
      previous_sections: input.previous.map(({ key, value, basis, sources, researched }) =>
        ({ key, value, basis, sources, researched })),
    }),
    schema,
  };
}

export function parseAgentBasePilotResponse(payload: unknown, key: AgentBasePilotKey,
  definitions: readonly CommunicationSectionDefinition[] = []) {
  const selected = selectPilotFinalOutput(payload);
  if (!selected.ok) return selected;
  payload = selected.value;
  const output = payload && typeof payload === "object" && "output" in payload ? payload.output : null;
  const researched = Array.isArray(output) && output.some(item => item?.type === "web_search_call");
  const parsed = parseStageTwoResponse(payload, { kind: "section", key: key as CommunicationSectionKey }, researched, "autonomous",
    definitions.length ? definitions : undefined);
  if (!parsed.ok) return parsed;
  return { ok: true as const, value: {
    ...parsed.value.suggestions[0], sources: parsed.value.sources, researched: parsed.value.researched,
  } satisfies AgentBasePilotSection, telemetry: parsed.telemetry };
}

// Native Responses can emit commentary before tool calls. Only the final message is structured output.
function selectPilotFinalOutput(payload: unknown) {
  const response = pilotRecord(payload);
  if (!response || !Array.isArray(response.output)) return { ok: true as const, value: payload };
  const messages = response.output.map(pilotRecord).filter((item): item is Record<string, unknown> => item?.type === "message");
  if (!messages.length) {
    const output = pilotWebSources(response.output);
    return output ? { ok: true as const, value: { ...response, output } } : pilotOutputInvalid("web_sources_invalid");
  }
  if (messages.some(message => Array.isArray(message.content) &&
      message.content.some(part => pilotRecord(part)?.type === "refusal"))) {
    return { ok: false as const, kind: "refusal" as const, reason: "openai_refusal" };
  }
  const candidates = messages.filter(message => (message.role === undefined || message.role === "assistant") &&
    (message.phase === undefined || message.phase === null || message.phase === "final_answer"));
  const explicitFinals = candidates.filter(message => message.phase === "final_answer");
  if (explicitFinals.length > 1) return pilotOutputInvalid("pilot_final_output_ambiguous");
  const final = (explicitFinals.length ? explicitFinals : candidates).at(-1);
  if (!final) return pilotOutputInvalid("pilot_final_output_missing");
  if (final.status !== undefined && final.status !== "completed") return pilotOutputInvalid("pilot_final_output_incomplete");
  const text = Array.isArray(final.content) ? final.content.map(pilotRecord)
    .filter(part => part?.type === "output_text" && typeof part.text === "string")
    .map(part => part!.text as string).join("") : "";
  if (!text.trim()) return pilotOutputInvalid("pilot_final_output_missing");
  // Keep every web call for the existing source/content checks; never parse aggregated commentary.
  const normalized = pilotWebSources(response.output, final);
  return normalized
    ? { ok: true as const, value: { ...response, output_text: text, output: normalized } }
    : pilotOutputInvalid("web_sources_invalid");
}

// Adapta apenas a representação das fontes para o validador existente, sem criar URLs.
function pilotWebSources(output: unknown[], final?: Record<string, unknown>) {
  const citations = Array.isArray(final?.content) ? final.content.flatMap(part => {
    const annotations = pilotRecord(part)?.annotations;
    return Array.isArray(annotations) ? annotations.filter(entry => pilotRecord(entry)?.type === "url_citation") : [];
  }) : [];
  if (citations.some(citation => !pilotSafeSource(citation))) return null;
  let attached = false;
  return output.map(item => {
    const call = pilotRecord(item);
    const action = pilotRecord(call?.action);
    if (call?.type !== "web_search_call" || !action) return item;
    // open_page sem URL é permitido pela API, mas não representa uma fonte visitada.
    const missingOpenedUrl = action.type === "open_page" && action.url == null;
    const sources = action.sources;
    const useCitations = !attached && citations.length > 0 &&
      (sources === undefined || (Array.isArray(sources) && (!sources.length || sources.some(pilotSafeSource))));
    if (useCitations) attached = true;
    return missingOpenedUrl || useCitations
      ? { ...call, action: { ...action, ...(missingOpenedUrl ? { type: "search" } : {}),
        ...(useCitations ? { sources: [...(Array.isArray(sources) ? sources : []), ...citations] } : {}) } } : item;
  });
}

function pilotSafeSource(source: unknown) {
  const value = pilotRecord(source)?.url;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

function pilotRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function pilotOutputInvalid(reason: string) {
  return { ok: false as const, kind: "invalid_response" as const, reason };
}

const pilotFailureReasons = new Set([
  "invalid_response", "invalid_stage_two_target", "unexpected_web_search", "required_web_search_missing",
  "web_sources_missing", "web_sources_invalid", "invalid_stage_two_output", "invalid_stage_two_basis",
  "invalid_stage_two_value", "output_missing", "openai_refusal", "pilot_final_output_missing",
  "pilot_final_output_incomplete", "pilot_final_output_ambiguous",
]);
export function sanitizeAgentBasePilotFailureReason(reason: string) {
  // Provider errors can contain arbitrary strings. Only local, fixed diagnostic codes reach logs.
  return pilotFailureReasons.has(reason) ? reason : "unclassified_failure";
}
