import "server-only";

import { randomUUID } from "node:crypto";

import { resolveLandingPageResearchForTaxon } from "../../adapters/landingPageResearchAdapter";
import { readAdminGenerationProfileDetail } from "../../adapters/landingPageGenerationProfileAdminAdapter";
import { requestGenerationProfileProposal } from "../../adapters/landingPageGenerationProfileOpenAiAdapter";
import type { GenerationProfileProposalResult } from "./admin-contracts";
import { listLandingPageModuleIdentities } from "../module-catalog";
import {
  estimateGenerationProfileCostUsd,
  isGenerationProfileAssistanceConfigured,
  mapProviderFailureToProposalError,
  mapResearchErrorToProposalError,
  validateGenerationProfileProviderPayload,
} from "./proposal";

export async function proposeLandingPageGenerationProfile(input: {
  taxonId: string;
  actorUserId: string;
  adminGuidance?: string;
}): Promise<GenerationProfileProposalResult> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const model = process.env.OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL?.trim();
  if (!model || !isGenerationProfileAssistanceConfigured({ apiKey: process.env.OPENAI_API_KEY, model })) {
    return finishFailure(requestId, "technical_failure", "AI assistance is unavailable.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      model: model ?? null,
      startedAt,
    });
  }

  const research = await resolveLandingPageResearchForTaxon({
    taxonId: input.taxonId,
    requestId,
  });
  if (!research.ok) {
    return finishFailure(
      requestId,
      mapResearchErrorToProposalError(research.error.code),
      "Required research is unavailable or invalid.",
      { taxonId: input.taxonId, platformAdminId: input.actorUserId, model, startedAt, researchCode: research.error.code },
    );
  }

  const detail = await readAdminGenerationProfileDetail({ taxonId: input.taxonId });
  if (!detail.ok) {
    return finishFailure(requestId, "technical_failure", "Generation profile context could not be loaded.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      model,
      startedAt,
    });
  }
  const previousActiveProfile = detail.lastActivatedOwnProfile;
  const moduleIdentities = listLandingPageModuleIdentities();
  const provider = await requestGenerationProfileProposal({
    model,
    taxonId: input.taxonId,
    research: research.value,
    moduleIdentities,
    previousActiveProfile,
    adminGuidance: input.adminGuidance,
  });
  if (!provider.ok) {
    return finishFailure(requestId, mapProviderFailureToProposalError(provider.kind), "AI proposal could not be produced.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      model,
      startedAt,
      providerKind: provider.kind,
      researchVersions: research.value.versions,
      moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    });
  }

  const validated = validateGenerationProfileProviderPayload(provider.payload);
  if (!validated.ok) {
    return finishFailure(requestId, "invalid_data", "AI proposal violated the generation profile contract.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      model,
      startedAt,
      responseId: provider.responseId,
      researchVersions: research.value.versions,
      moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    });
  }

  console.info("generation_profile_proposal", {
    requestId,
    platformAdminId: input.actorUserId,
    taxonId: input.taxonId,
    researchVersions: research.value.versions,
    moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    model,
    responseId: provider.responseId,
    latencyMs: Date.now() - startedAt,
    inputTokens: provider.inputTokens,
    outputTokens: provider.outputTokens,
    estimatedCostUsd: estimateGenerationProfileCostUsd(provider.inputTokens, provider.outputTokens),
    result: "success",
  });
  return {
    ok: true,
    value: {
      ...validated.value,
      requestId,
    },
  };
}

function finishFailure(
  requestId: string,
  code: "missing_information" | "invalid_data" | "technical_failure",
  message: string,
  log: Record<string, unknown> & { startedAt: number },
): GenerationProfileProposalResult {
  const { startedAt, ...safeLog } = log;
  console.warn("generation_profile_proposal", {
    requestId,
    ...safeLog,
    latencyMs: Date.now() - startedAt,
    result: code,
  });
  return { ok: false, requestId, error: { code, message } };
}
