import "server-only";

import {
  buildGenerationProfileResponsesRequest,
  type GenerationProfileProviderInput,
  type GenerationProfileProviderResult,
} from "../landing-page/generation-profile/proposal";

export async function requestGenerationProfileProposal(
  input: GenerationProfileProviderInput,
): Promise<GenerationProfileProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false, kind: "http_error" };

  const request = buildGenerationProfileResponsesRequest(input);
  if (!request.ok) return { ok: false, kind: "request_too_large" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: request.serialized,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, kind: "http_error" };
    const payload: unknown = await response.json();
    if (!isRecord(payload)) return { ok: false, kind: "invalid_response" };
    if (payload.status === "incomplete") return { ok: false, kind: "incomplete" };

    const outputText = readOutputText(payload.output);
    if (outputText.kind !== "text") return { ok: false, kind: outputText.kind };
    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText.value);
    } catch {
      return { ok: false, kind: "invalid_response" };
    }
    const usage = isRecord(payload.usage) ? payload.usage : null;
    return {
      ok: true,
      payload: parsed,
      responseId: typeof payload.id === "string" ? payload.id : null,
      inputTokens: usage && Number.isInteger(usage.input_tokens) ? usage.input_tokens as number : null,
      outputTokens: usage && Number.isInteger(usage.output_tokens) ? usage.output_tokens as number : null,
      rawResearchReferences: request.rawResearchReferences,
      notices: request.notices,
    };
  } catch (error) {
    return { ok: false, kind: error instanceof Error && error.name === "AbortError" ? "timeout" : "http_error" };
  } finally {
    clearTimeout(timeout);
  }
}

function readOutputText(output: unknown):
  | Readonly<{ kind: "text"; value: string }>
  | Readonly<{ kind: "refusal" | "invalid_response" }> {
  if (!Array.isArray(output)) return { kind: "invalid_response" };
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (content.type === "refusal") return { kind: "refusal" };
      if (content.type === "output_text" && typeof content.text === "string") {
        return { kind: "text", value: content.text };
      }
    }
  }
  return { kind: "invalid_response" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
