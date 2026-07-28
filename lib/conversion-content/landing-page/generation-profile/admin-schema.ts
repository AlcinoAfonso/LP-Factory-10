import { createHash } from "node:crypto";
import { z } from "zod";

import { validateLandingPageModuleIdentity } from "../module-catalog";
import { landingPageGenerationProfilePriorities } from "./contracts";
import type {
  GenerationProfileDraftInput,
  GenerationProfileRecommendationInput,
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
    generationGuidance: z.string().trim().min(1),
    recommendations: z.array(generationProfileRecommendationInputSchema),
    origin: z.enum(["manual", "ai"]),
    requestId: z.uuid().optional(),
    proposalFingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
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
    if ((input.requestId === undefined) !== (input.proposalFingerprint === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["proposalFingerprint"],
        message: "proposal request id and fingerprint must be provided together",
      });
    }
    if ((input.origin === "ai") !== (input.requestId !== undefined)) {
      context.addIssue({
        code: "custom",
        path: ["origin"],
        message: "AI origin requires proposal correlation and manual origin forbids it",
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
  });

export const generationProfileProposalPayloadSchema = z
  .object({
    generation_guidance: z.string().trim().min(1),
    recommendations: z.array(
      z
        .object({
          module_key: z.string().trim().min(1),
          module_version: z.number().int().positive(),
          variant_key: z.string().trim().min(1).nullable(),
          variant_version: z.number().int().positive().nullable(),
          priority: z.enum(landingPageGenerationProfilePriorities),
          recommended_order: z.number().int().positive(),
          item_guidance: z.string().trim().min(1).nullable(),
        })
        .strict(),
    ),
  })
  .strict();

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
  return { ok: true, value: parsed.data };
}

export function normalizeGenerationProfileProposal(input: unknown):
  | Readonly<{
      ok: true;
      value: Readonly<{
        generationGuidance: string;
        recommendations: readonly GenerationProfileRecommendationInput[];
      }>;
    }>
  | Readonly<{ ok: false; message: string }> {
  const parsed = generationProfileProposalPayloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Proposal payload is invalid." };

  const recommendations = parsed.data.recommendations.map((item) => ({
    moduleKey: item.module_key,
    moduleVersion: item.module_version,
    ...(item.variant_key === null
      ? {}
      : { variantKey: item.variant_key, variantVersion: item.variant_version ?? undefined }),
    priority: item.priority,
    recommendedOrder: item.recommended_order,
    ...(item.item_guidance === null ? {} : { itemGuidance: item.item_guidance }),
  }));
  const draft = validateGenerationProfileDraft({
    ownerTaxonId: "00000000-0000-4000-8000-000000000001",
    generationGuidance: parsed.data.generation_guidance,
    recommendations,
    origin: "manual",
  });
  if (!draft.ok) return draft;

  return {
    ok: true,
    value: {
      generationGuidance: draft.value.generationGuidance,
      recommendations: draft.value.recommendations,
    },
  };
}

export function fingerprintGenerationProfileProposal(input: {
  generationGuidance: string;
  recommendations: readonly GenerationProfileRecommendationInput[];
}) {
  const canonical = JSON.stringify({
    generationGuidance: input.generationGuidance.trim(),
    recommendations: [...input.recommendations]
      .map((item) => ({ ...item, moduleKey: item.moduleKey.trim() }))
      .sort((left, right) => left.recommendedOrder - right.recommendedOrder),
  });
  return createHash("sha256").update(canonical).digest("hex");
}
