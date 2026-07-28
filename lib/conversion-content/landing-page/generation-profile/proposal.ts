import type { ResolvedLandingPageResearch } from "../research-resolution";
import type { LandingPageModuleIdentityCatalog } from "../module-catalog";
import {
  fingerprintGenerationProfileProposal,
  normalizeGenerationProfileProposal,
} from "./admin-schema";
import type {
  AdminGenerationProfile,
  GenerationProfileProposalErrorCode,
} from "./admin-contracts";

export const GENERATION_PROFILE_REQUEST_MAX_BYTES = 96 * 1024;
export const GENERATION_PROFILE_MAX_OUTPUT_TOKENS = 2000;
export const GENERATION_PROFILE_APPROVED_MODEL = "gpt-5.4-mini";
const GENERATION_PROFILE_INPUT_USD_PER_TOKEN = 0.0000005;
const GENERATION_PROFILE_OUTPUT_USD_PER_TOKEN = 0.000003;

export type GenerationProfileProviderInput = Readonly<{
  model: string;
  taxonId: string;
  research: ResolvedLandingPageResearch;
  moduleIdentities: LandingPageModuleIdentityCatalog;
  previousActiveProfile: AdminGenerationProfile | null;
  adminGuidance?: string;
}>;

export type GenerationProfileProviderResult =
  | Readonly<{
      ok: true;
      payload: unknown;
      responseId: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
    }>
  | Readonly<{
      ok: false;
      kind: "refusal" | "incomplete" | "http_error" | "timeout" | "invalid_response" | "request_too_large";
    }>;

export function buildGenerationProfileResponsesRequest(input: GenerationProfileProviderInput) {
  const body = {
    model: input.model,
    store: false,
    max_output_tokens: GENERATION_PROFILE_MAX_OUTPUT_TOKENS,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "Proponha apenas um perfil orientativo de landing page. Nao invente identidades: use apenas modulos e variantes que voce reconheca como pertencentes ao catalogo LP Factory. Prioridade e ordem sao orientativas. Nao gere copy, LP, dados de conta ou acoes.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              taxon_id: input.taxonId,
              research: input.research,
              module_identities: input.moduleIdentities,
              previous_active_profile: input.previousActiveProfile,
              admin_guidance: input.adminGuidance?.trim() || null,
            }),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "landing_page_generation_profile_proposal",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["generation_guidance", "recommendations"],
          properties: {
            generation_guidance: { type: "string", minLength: 1 },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "module_key",
                  "module_version",
                  "variant_key",
                  "variant_version",
                  "priority",
                  "recommended_order",
                  "item_guidance",
                ],
                properties: {
                  module_key: { type: "string", minLength: 1 },
                  module_version: { type: "integer", minimum: 1 },
                  variant_key: { type: ["string", "null"] },
                  variant_version: { type: ["integer", "null"], minimum: 1 },
                  priority: { type: "string", enum: ["P1", "P2", "P3"] },
                  recommended_order: { type: "integer", minimum: 1 },
                  item_guidance: { type: ["string", "null"] },
                },
              },
            },
          },
        },
      },
    },
  };
  const serialized = JSON.stringify(body);
  return {
    ok: Buffer.byteLength(serialized, "utf8") <= GENERATION_PROFILE_REQUEST_MAX_BYTES,
    body,
    serialized,
    bytes: Buffer.byteLength(serialized, "utf8"),
  } as const;
}

export function validateGenerationProfileProviderPayload(payload: unknown) {
  const normalized = normalizeGenerationProfileProposal(payload);
  if (!normalized.ok) return normalized;
  return {
    ok: true as const,
    value: {
      ...normalized.value,
      fingerprint: fingerprintGenerationProfileProposal(normalized.value),
    },
  };
}

export function mapResearchErrorToProposalError(code: string): GenerationProfileProposalErrorCode {
  if (["RESEARCH_MISSING", "RESEARCH_INCOMPLETE", "TAXON_NOT_FOUND", "TAXON_INACTIVE", "DIRECT_PARENT_NOT_FOUND", "DIRECT_PARENT_INACTIVE"].includes(code)) {
    return "missing_information";
  }
  if (["RESEARCH_INVALID", "RESEARCH_AMBIGUOUS", "INVALID_TAXON_ID"].includes(code)) {
    return "invalid_data";
  }
  return "technical_failure";
}

export function mapProviderFailureToProposalError(
  kind: Exclude<GenerationProfileProviderResult, { ok: true }>["kind"],
): GenerationProfileProposalErrorCode {
  return kind === "request_too_large" ? "invalid_data" : "technical_failure";
}

export function isGenerationProfileAssistanceConfigured(input: {
  apiKey?: string;
  model?: string;
}) {
  return Boolean(
    input.apiKey?.trim() &&
      input.model?.trim() === GENERATION_PROFILE_APPROVED_MODEL,
  );
}

export function estimateGenerationProfileCostUsd(
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
) {
  if (
    model !== GENERATION_PROFILE_APPROVED_MODEL ||
    inputTokens === null ||
    outputTokens === null
  ) {
    return null;
  }
  return Number(
    (
      inputTokens * GENERATION_PROFILE_INPUT_USD_PER_TOKEN +
      outputTokens * GENERATION_PROFILE_OUTPUT_USD_PER_TOKEN
    ).toFixed(6),
  );
}
