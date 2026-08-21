import { extractCommercialActivationOpenAiOutputText } from "@/conversion-content/adapters/commercialActivationOpenAiAdapter";

export function parseCommercialProof(payload: unknown) {
  const outputText = extractCommercialActivationOpenAiOutputText(payload);
  if (!outputText) {
    return {
      ok: false as const,
      kind: "invalid_response" as const,
      reason: "proof_output_missing",
    };
  }

  try {
    const parsed: unknown = JSON.parse(outputText);
    return isRecord(parsed) && parsed.proof === "approved"
      ? { ok: true as const, value: true }
      : {
          ok: false as const,
          kind: "invalid_response" as const,
          reason: "proof_output_invalid",
        };
  } catch {
    return {
      ok: false as const,
      kind: "invalid_response" as const,
      reason: "proof_output_invalid",
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
