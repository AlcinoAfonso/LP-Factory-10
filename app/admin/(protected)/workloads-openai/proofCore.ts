import type {
  OpenAiManagedWorkloadEnvironment,
  ResolvedOpenAiImageWorkload,
  ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";

export type OpenAiCandidateProofMetadata = Readonly<{
  schema_version: 1;
  proof_kind: "operational";
  proof_result: "approved";
  request_id: string;
  provider_request_id: string | null;
  latency_ms: number | null;
  contract_version: 1;
  source: "openai_api";
}>;

export type OpenAiCandidateProofAttempt =
  | Readonly<{
      ok: true;
      providerRequestId: string | null;
      latencyMs: number | null;
    }>
  | Readonly<{ ok: false; code: "configuration" | "provider" | "contract" }>;

type ProductProof = (
  workload: ResolvedOpenAiProductWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
) => Promise<OpenAiCandidateProofAttempt>;

type ImageProof = (
  workload: ResolvedOpenAiImageWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
) => Promise<OpenAiCandidateProofAttempt>;

export type OpenAiCandidateProofDependencies = Readonly<{
  niche: ProductProof;
  commercial: ProductProof;
  landingPageText: ProductProof;
  inputCatalogEvaluation: ProductProof;
  landingPageImage: ImageProof;
}>;

export async function runOpenAiCandidateProofCore(
  workload: ResolvedOpenAiProductWorkload | ResolvedOpenAiImageWorkload,
  environment: OpenAiManagedWorkloadEnvironment,
  apiKey: string,
  requestId: string,
  dependencies: OpenAiCandidateProofDependencies,
): Promise<
  | Readonly<{ ok: true; metadata: OpenAiCandidateProofMetadata }>
  | Readonly<{ ok: false; code: "configuration" | "provider" | "contract" }>
> {
  const normalizedKey = apiKey.trim();
  const normalizedRequestId = technicalId(requestId);
  if (!normalizedKey || !normalizedRequestId) {
    return { ok: false, code: "configuration" };
  }

  let attempt: OpenAiCandidateProofAttempt;
  switch (workload.id) {
    case "niche_resolution":
      attempt = await dependencies.niche(
        workload,
        environment,
        normalizedKey,
        normalizedRequestId,
      );
      break;
    case "commercial_activation_draft_generation":
      attempt = await dependencies.commercial(
        workload,
        environment,
        normalizedKey,
        normalizedRequestId,
      );
      break;
    case "landing_page_draft_generation":
      attempt = await dependencies.landingPageText(
        workload,
        environment,
        normalizedKey,
        normalizedRequestId,
      );
      break;
    case "taxon_input_catalog_sufficiency_evaluation":
      attempt = await dependencies.inputCatalogEvaluation(
        workload,
        environment,
        normalizedKey,
        normalizedRequestId,
      );
      break;
    case "landing_page_draft_image_generation":
      attempt = await dependencies.landingPageImage(
        workload,
        environment,
        normalizedKey,
        normalizedRequestId,
      );
      break;
    default:
      return { ok: false, code: "configuration" };
  }

  if (!attempt.ok) return attempt;
  return {
    ok: true,
    metadata: {
      schema_version: 1,
      proof_kind: "operational",
      proof_result: "approved",
      request_id: normalizedRequestId,
      provider_request_id: technicalId(attempt.providerRequestId),
      latency_ms: boundedLatency(attempt.latencyMs),
      contract_version: 1,
      source: "openai_api",
    },
  };
}

function technicalId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= 1 &&
    normalized.length <= 128 &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(normalized)
    ? normalized
    : null;
}

function boundedLatency(value: unknown) {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 900_000
    ? value
    : null;
}
