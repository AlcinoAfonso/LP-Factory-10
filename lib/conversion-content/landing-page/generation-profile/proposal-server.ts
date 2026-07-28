import "server-only";

import { randomUUID } from "node:crypto";

import { resolveLandingPageResearchForTaxon } from "../../adapters/landingPageResearchAdapter";
import { readAdminGenerationProfileDetail, readLastActivatedOwnGenerationProfile } from "../../adapters/landingPageGenerationProfileAdminAdapter";
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
      researchVersions: research.value.versions,
      researchProvenance: getResearchProvenance(research.value),
    });
  }
  const historicalProfile = await readLastActivatedOwnGenerationProfile({ profiles: detail.profiles });
  if (!historicalProfile.ok) {
    return finishFailure(requestId, "technical_failure", "Previous active profile context could not be loaded.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      model,
      startedAt,
      researchVersions: research.value.versions,
      researchProvenance: getResearchProvenance(research.value),
    });
  }
  const previousActiveProfile = historicalProfile.profile;
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
      researchProvenance: getResearchProvenance(research.value),
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
      researchProvenance: getResearchProvenance(research.value),
      moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    });
  }

  console.info("generation_profile_proposal", {
    requestId,
    origin: "ai",
    platformAdminId: input.actorUserId,
    taxonId: input.taxonId,
    researchVersions: research.value.versions,
    researchProvenance: getResearchProvenance(research.value),
    moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    model,
    responseId: provider.responseId,
    latencyMs: Date.now() - startedAt,
    inputTokens: provider.inputTokens,
    outputTokens: provider.outputTokens,
    estimatedCostUsd: estimateGenerationProfileCostUsd(model, provider.inputTokens, provider.outputTokens),
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
    origin: "ai",
    ...safeLog,
    latencyMs: Date.now() - startedAt,
    result: code,
  });
  return { ok: false, requestId, error: { code, message } };
}

function getResearchProvenance(research: {
  endCustomer: { sourceTaxonId: string; sourceRelation: string; version: number };
  businessBuyer: { sourceTaxonId: string; sourceRelation: string; version: number };
}) {
  return {
    endCustomer: {
      sourceTaxonId: research.endCustomer.sourceTaxonId,
      sourceRelation: research.endCustomer.sourceRelation,
      version: research.endCustomer.version,
    },
    businessBuyer: {
      sourceTaxonId: research.businessBuyer.sourceTaxonId,
      sourceRelation: research.businessBuyer.sourceRelation,
      version: research.businessBuyer.version,
    },
  };
}
