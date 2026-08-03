import "server-only";

import { randomUUID } from "node:crypto";

import { resolveLandingPageResearchForTaxon } from "../../adapters/landingPageResearchAdapter";
import { readAdminGenerationProfileDetail } from "../../adapters/landingPageGenerationProfileAdminAdapter";
import { requestGenerationProfileProposal } from "../../adapters/landingPageGenerationProfileOpenAiAdapter";
import type {
  GenerationProfileEditorContent,
  GenerationProfileProposal,
  GenerationProfileProposalResult,
} from "./admin-contracts";
import { validateGenerationProfileDraft } from "./admin-schema";
import {
  listLandingPageModuleIdentities,
  listLandingPageModuleSelectionCatalog,
} from "../module-catalog";
import {
  buildGenerationProfileInvalidDataMetadata,
  estimateGenerationProfileCostUsd,
  GENERATION_PROFILE_INVALID_PROPOSAL_MESSAGE,
  isGenerationProfileAssistanceConfigured,
  mapProviderFailureToProposalError,
  mapResearchErrorToProposalError,
  normalizeGenerationProfileCandidate,
  validateGenerationProfileResearchPriorities,
  validateGenerationProfileProviderPayload,
} from "./proposal";

export async function proposeLandingPageGenerationProfile(input: {
  taxonId: string;
  actorUserId: string;
  currentEditor: GenerationProfileEditorContent;
  currentCandidate?: GenerationProfileProposal;
  humanFeedback?: string;
}): Promise<GenerationProfileProposalResult> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const interactionKind = input.currentCandidate ? "refinement" : "initial";
  const model = process.env.OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL?.trim();
  if (!model || !isGenerationProfileAssistanceConfigured({ apiKey: process.env.OPENAI_API_KEY, model })) {
    return finishFailure(requestId, "technical_failure", "AI assistance is unavailable.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      model: model ?? null,
      startedAt,
    });
  }

  const validatedEditor = validateGenerationProfileDraft({
    ownerTaxonId: input.taxonId,
    ...(input.currentEditor.generationGuidance.trim() ? { generationGuidance: input.currentEditor.generationGuidance } : {}),
    recommendations: input.currentEditor.recommendations,
    origin: "manual",
  });
  if (!validatedEditor.ok) {
    return finishFailure(requestId, "invalid_data", "Current editor content is invalid.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      model,
      startedAt,
    });
  }
  const currentEditor = {
    generationGuidance: input.currentEditor.generationGuidance.trim(),
    recommendations: validatedEditor.value.recommendations,
  };
  const currentCandidate = input.currentCandidate
    ? normalizeGenerationProfileCandidate(input.currentCandidate)
    : null;
  if (currentCandidate && !currentCandidate.ok) {
    return finishFailure(requestId, "invalid_data", currentCandidate.message, {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      model,
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
      { taxonId: input.taxonId, platformAdminId: input.actorUserId, interactionKind, model, startedAt, researchCode: research.error.code },
    );
  }
  if (!validateGenerationProfileResearchPriorities(research.value)) {
    return finishFailure(requestId, "invalid_data", "Required research contains an unsupported lp_sections priority.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      model,
      startedAt,
      researchVersions: research.value.versions,
      researchProvenance: getResearchProvenance(research.value),
    });
  }

  const detail = await readAdminGenerationProfileDetail({ taxonId: input.taxonId });
  if (!detail.ok) {
    return finishFailure(requestId, "technical_failure", "Generation profile context could not be loaded.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      model,
      startedAt,
      researchVersions: research.value.versions,
      researchProvenance: getResearchProvenance(research.value),
    });
  }
  const previousActiveProfile = detail.profiles.find((profile) => profile.status === "active") ?? null;
  const proposalMode = previousActiveProfile ? "evolution" : "creation";
  const moduleIdentities = listLandingPageModuleIdentities();
  const moduleSelectionCatalog = listLandingPageModuleSelectionCatalog();
  const provider = await requestGenerationProfileProposal({
    model,
    research: research.value,
    moduleIdentities,
    moduleSelectionCatalog,
    requestKind: proposalMode,
    activeBaseline: previousActiveProfile?.recommendations ?? null,
    currentCandidate: currentCandidate?.value ?? null,
    humanFeedback: input.humanFeedback,
  });
  if (!provider.ok) {
    return finishFailure(requestId, mapProviderFailureToProposalError(provider.kind), "AI proposal could not be produced.", {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      proposalMode,
      model,
      startedAt,
      providerKind: provider.kind,
      ...(provider.kind === "incomplete" ? {
        incompleteReason: provider.incompleteReason,
        responseId: provider.responseId,
        inputTokens: provider.inputTokens,
        outputTokens: provider.outputTokens,
        estimatedCostUsd: estimateGenerationProfileCostUsd(model, provider.inputTokens, provider.outputTokens),
      } : {}),
      researchVersions: research.value.versions,
      researchProvenance: getResearchProvenance(research.value),
      moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    });
  }

  const validated = validateGenerationProfileProviderPayload({
    payload: provider.payload,
    research: research.value,
    moduleIdentities,
    currentEditor,
    previousCandidate: currentCandidate?.value ?? null,
  });
  if (!validated.ok) {
    return finishFailure(requestId, "invalid_data", GENERATION_PROFILE_INVALID_PROPOSAL_MESSAGE, {
      taxonId: input.taxonId,
      platformAdminId: input.actorUserId,
      interactionKind,
      proposalMode,
      model,
      startedAt,
      ...buildGenerationProfileInvalidDataMetadata({
        model,
        validationReason: validated.reason,
        responseId: provider.responseId,
        inputTokens: provider.inputTokens,
        outputTokens: provider.outputTokens,
        ...(validated.coverageDiagnostic ? { coverageDiagnostic: validated.coverageDiagnostic } : {}),
      }),
      researchVersions: research.value.versions,
      researchProvenance: getResearchProvenance(research.value),
      moduleCatalogVersion: moduleIdentities.moduleCatalogVersion,
    });
  }

  console.info("generation_profile_proposal", {
    requestId,
    origin: "ai",
    interactionKind,
    proposalMode,
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
      researchVersions: research.value.versions,
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
