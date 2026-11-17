import { requestOpenAiResponses, type OpenAiResponsesDependencies } from "@/openai-responses/openAiResponsesAdapter";
import { lpFactoryOpenAiCostContext } from "@/openai-costs";
import { openAiServiceTierWasApplied, type OpenAiManagedWorkloadEnvironment, type ResolvedOpenAiProductWorkload } from "@/openai-workloads";
import { parseCommercialProof } from "./commercialProof";
import type { OpenAiCandidateProofMetadata } from "./proofCore";

// Technical transport proof for model, effort and optional service tier.
// Product prompts, scenarios and business persistence are untouched.
export async function runOpenAiTechnicalConfigurationProof(
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
  dependencies: OpenAiResponsesDependencies = {},
): Promise<{ ok: true; metadata: OpenAiCandidateProofMetadata } | { ok: false; code: "configuration" | "provider" | "contract" }> {
  const result = await requestOpenAiResponses({
    apiKey, configuration: workload, environment, requestId,
    executionOrigin: "administrative_proof",
    financialContext: lpFactoryOpenAiCostContext,
    request: {
      store: false, background: false, tools: [],
      max_output_tokens: 1024,
      input: [
        { role: "system", content: "Retorne apenas o objeto JSON solicitado para validar o transporte técnico." },
        { role: "user", content: "Confirme a prova técnica segura." },
      ],
      text: { format: {
        type: "json_schema", name: "service_tier_operational_proof_v1", strict: true,
        schema: { type: "object", additionalProperties: false,
          properties: { proof: { type: "string", const: "approved" } }, required: ["proof"] },
      } },
    },
    parseResponse: (payload) => {
      const record = payload as { status?: unknown } | null;
      if (record?.status !== "completed") return { ok: false, kind: "invalid_response", reason: "tier_proof_not_completed" };
      return parseCommercialProof(payload);
    },
  }, dependencies);
  if (!result.ok) return { ok: false, code: "provider" };
  if (workload.serviceTier != null &&
    !openAiServiceTierWasApplied(workload.serviceTier, result.appliedServiceTier)) {
    return { ok: false, code: "contract" };
  }
  return { ok: true, metadata: {
    schema_version: 1, proof_kind: "operational", proof_result: "approved",
    request_id: requestId, provider_request_id: result.providerRequestId,
    latency_ms: Math.round(result.latencyMs), contract_version: 1, source: "openai_api",
    ...(workload.serviceTier == null ? {} : {
      requested_service_tier: workload.serviceTier,
      applied_service_tier: result.appliedServiceTier,
    }),
  } };
}
