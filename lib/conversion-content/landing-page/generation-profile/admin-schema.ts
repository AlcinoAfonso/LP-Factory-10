import { z } from "zod";

import { validateLandingPageModuleIdentity } from "../module-catalog";
import { landingPageGenerationProfilePriorities } from "./contracts";
import type {
  GenerationProfileDraftInput,
  GenerationProfileLifecycleReadiness,
} from "./admin-contracts";

const optionalNonEmptyText = z.string().trim().min(1).optional();

export const generationProfileRecommendationInputSchema = z
  .object({
    moduleKey: z.string().trim().min(1),
    moduleVersion: z.number().int().positive(),
    variantKey: optionalNonEmptyText,
    variantVersion: z.number().int().positive().optional(),
    priority: z.enum(landingPageGenerationProfilePriorities),
    recommendedOrder: z.number().int().positive(),
    itemGuidance: optionalNonEmptyText,
  })
  .strict()
  .superRefine((item, context) => {
    if ((item.variantKey === undefined) !== (item.variantVersion === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["variantKey"],
        message: "variant key and version must be provided together",
      });
    }
  });

export const generationProfileDraftInputSchema = z
  .object({
    ownerTaxonId: z.uuid(),
    profileId: z.uuid().optional(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
    generationGuidance: optionalNonEmptyText,
    recommendations: z.array(generationProfileRecommendationInputSchema),
    origin: z.enum(["manual", "ai"]),
    requestId: z.unknown().optional(),
    proposalFingerprint: z.unknown().optional(),
    gapAnalysisCompleted: z.literal(true).optional(),
    gapDecision: z.enum(["wait_for_modules", "proceed_with_available"]).optional(),
    gapItemKeys: z.array(z.string().trim().min(1)).optional(),
    gapImpactSummary: optionalNonEmptyText,
    researchVersions: z.object({
      endCustomer: z.number().int().positive(),
      businessBuyer: z.number().int().positive(),
    }).strict().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.profileId === undefined) !== (input.expectedUpdatedAt === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["expectedUpdatedAt"],
        message: "existing drafts require their expected updated_at snapshot",
      });
    }
    const moduleKeys = input.recommendations.map((item) => item.moduleKey);
    if (new Set(moduleKeys).size !== moduleKeys.length) {
      context.addIssue({ code: "custom", path: ["recommendations"], message: "modules must be unique" });
    }
    const orders = input.recommendations.map((item) => item.recommendedOrder);
    if (new Set(orders).size !== orders.length) {
      context.addIssue({ code: "custom", path: ["recommendations"], message: "recommended orders must be unique" });
    }
    if (input.gapDecision !== undefined && (!input.gapAnalysisCompleted || !input.gapItemKeys || input.gapItemKeys.length === 0 || !input.gapImpactSummary || !input.researchVersions)) {
      context.addIssue({ code: "custom", path: ["gapDecision"], message: "gap decisions require affected items, impact and source versions" });
    }
    if (input.gapAnalysisCompleted && input.gapDecision === undefined && ((input.gapItemKeys?.length ?? 0) !== 0 || input.gapImpactSummary !== undefined || !input.researchVersions)) {
      context.addIssue({ code: "custom", path: ["gapAnalysisCompleted"], message: "completed analysis without gaps requires an empty item list and source versions" });
    }
    if (!input.gapAnalysisCompleted && (input.gapDecision !== undefined || input.gapItemKeys !== undefined || input.gapImpactSummary !== undefined || input.researchVersions !== undefined)) {
      context.addIssue({ code: "custom", path: ["gapAnalysisCompleted"], message: "gap metadata requires a completed analysis" });
    }
  });

export function validateGenerationProfileDraft(input: unknown):
  | Readonly<{ ok: true; value: GenerationProfileDraftInput }>
  | Readonly<{ ok: false; message: string }> {
  const parsed = generationProfileDraftInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Generation profile draft is invalid." };

  for (const recommendation of parsed.data.recommendations) {
    const identity = validateLandingPageModuleIdentity({
      moduleKey: recommendation.moduleKey,
      moduleVersion: recommendation.moduleVersion,
      ...(recommendation.variantKey === undefined
        ? {}
        : {
            variantKey: recommendation.variantKey,
            variantVersion: recommendation.variantVersion,
          }),
    });
    if (!identity.ok) {
      return {
        ok: false,
        message: `Generation profile contains an invalid module identity: ${identity.error.code}.`,
      };
    }
  }
  const { requestId: _requestId, proposalFingerprint: _proposalFingerprint, ...aggregate } = parsed.data;
  const correlation = getGenerationProfileProposalCorrelation(parsed.data);
  return {
    ok: true,
    value: {
      ...aggregate,
      ...(correlation ?? {}),
    },
  };
}

export function getGenerationProfileProposalCorrelation(input: {
  origin: "manual" | "ai";
  requestId?: unknown;
  proposalFingerprint?: unknown;
}): Readonly<{ requestId: string; proposalFingerprint: string }> | null {
  if (input.origin !== "ai") return null;
  const requestId = z.uuid().safeParse(input.requestId);
  const fingerprint = z.string().regex(/^[a-f0-9]{64}$/).safeParse(input.proposalFingerprint);
  if (!requestId.success || !fingerprint.success) return null;
  return { requestId: requestId.data, proposalFingerprint: fingerprint.data };
}

export function normalizeGenerationProfileLifecycleReadiness(input: unknown): GenerationProfileLifecycleReadiness {
  if (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    (input as Record<string, unknown>).ready === true &&
    (input as Record<string, unknown>).contract_version === 2
  ) {
    return { ready: true, reason: "Lifecycle verificado e disponivel." };
  }
  return {
    ready: false,
    reason: "Lifecycle indisponivel ate a migration e o verificador read-only serem aprovados.",
  };
}
