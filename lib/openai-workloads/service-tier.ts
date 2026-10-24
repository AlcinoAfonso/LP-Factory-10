import type { OpenAiServiceTier } from "./contracts";

// E21.2 policy only; the model/effort catalog retains its existing authority.
export function listOpenAiServiceTiers(model: string): readonly OpenAiServiceTier[] {
  if (model === "gpt-6-luna") return ["default", "fast"];
  if (model === "gpt-6.1-sol") return ["default", "fast", "ultrafast"];
  return [];
}

export function isEligibleOpenAiServiceTier(model: string, value: unknown): value is OpenAiServiceTier {
  return listOpenAiServiceTiers(model).includes(value as OpenAiServiceTier);
}

export function isValidOpenAiServiceTierSnapshot(model: string, value: unknown): boolean {
  return value === null || value === undefined || isEligibleOpenAiServiceTier(model, value);
}

export function normalizeOpenAiAppliedServiceTier(value: unknown): string | null {
  return typeof value === "string" && ["default", "fast", "priority", "ultrafast", "auto", "flex", "scale"].includes(value)
    ? value : null;
}

export function openAiServiceTierWasApplied(requested: OpenAiServiceTier, applied: unknown): boolean {
  return applied === requested || (requested === "fast" && applied === "priority");
}

export function openAiServiceTierLabel(value: OpenAiServiceTier | null | undefined): string {
  return value === "default" ? "Standard" : value === "fast" ? "Fast" : value === "ultrafast" ? "Ultrafast" : "Legado — sem nível explícito";
}

// A dated provider snapshot is compatible with its requested model alias.
export function openAiResponseMatchesConfiguration(
  configuration: { model: string; reasoningEffort: string; serviceTier?: OpenAiServiceTier | null },
  response: { model?: unknown; reasoning?: unknown; service_tier?: unknown } | null,
): boolean {
  if (configuration.serviceTier != null && !openAiServiceTierWasApplied(configuration.serviceTier, response?.service_tier)) return false;
  if (typeof response?.model === "string" && response.model !== configuration.model &&
    !(response.model.startsWith(configuration.model + "-") &&
      /^\d{4}-\d{2}-\d{2}$/.test(response.model.slice(configuration.model.length + 1)))) return false;
  const reasoning = response?.reasoning;
  return !reasoning || typeof reasoning !== "object" || !("effort" in reasoning) ||
    reasoning.effort === configuration.reasoningEffort;
}
