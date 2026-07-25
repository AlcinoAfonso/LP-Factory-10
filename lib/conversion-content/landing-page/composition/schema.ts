import { z } from "zod";

import {
  landingPageCompositionGapDecisions,
  landingPageCompositionGapKinds,
  landingPageCompositionOrigins,
} from "./contracts";

const uuidSchema = z.string().uuid();
const positiveIntegerSchema = z.number().int().positive();
const boundedTextSchema = z.string().trim().min(3).max(1000);

const taxonSchema = z
  .object({
    id: uuidSchema,
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(200),
    level: z.enum(["segment", "niche", "ultra_niche"]),
    isActive: z.boolean(),
    parentId: uuidSchema.nullable(),
  })
  .strict();

const sourceSnapshotsSchema = z
  .object({
    root: z
      .object({
        rootVersion: positiveIntegerSchema,
        presetKey: z.string().trim().min(1).max(100),
      })
      .strict(),
    moduleCatalog: z
      .object({ moduleCatalogVersion: positiveIntegerSchema })
      .strict(),
    research: z
      .object({
        servedTaxonId: uuidSchema,
        versions: z
          .object({
            endCustomer: positiveIntegerSchema,
            businessBuyer: positiveIntegerSchema,
          })
          .strict(),
        sourceTaxonIds: z
          .object({
            endCustomer: uuidSchema,
            businessBuyer: uuidSchema,
          })
          .strict(),
      })
      .strict(),
    inputCatalog: z
      .object({ version: positiveIntegerSchema })
      .strict(),
  })
  .strict();

const itemSchema = z
  .object({
    moduleKey: z.string().trim().min(1).max(100),
    moduleVersion: positiveIntegerSchema,
    variantName: z.string().trim().min(1).max(100),
    variantVersion: positiveIntegerSchema,
    order: positiveIntegerSchema,
    required: z.boolean(),
    options: z
      .object({
        spacing: z.enum(["compact", "default", "spacious"]).optional(),
      })
      .strict()
      .optional(),
    justification: boundedTextSchema,
  })
  .strict();

const gapSchema = z
  .object({
    kind: z.enum(landingPageCompositionGapKinds),
    structuralFunction: boundedTextSchema,
    justification: boundedTextSchema,
    impact: boundedTextSchema,
    blocking: z.boolean(),
    humanDecision: z.enum(landingPageCompositionGapDecisions),
    deferralReason: boundedTextSchema.optional(),
    resumeCondition: boundedTextSchema.optional(),
  })
  .strict()
  .superRefine((gap, context) => {
    if (gap.blocking && gap.humanDecision !== "blocking") {
      context.addIssue({
        code: "custom",
        message: "Blocking gaps must keep the blocking human decision",
      });
    }
    if (
      gap.humanDecision === "deferred" &&
      (!gap.deferralReason || !gap.resumeCondition)
    ) {
      context.addIssue({
        code: "custom",
        message: "Deferred gaps require reason and resume condition",
      });
    }
    if (
      gap.humanDecision === "blocking" &&
      (gap.deferralReason || gap.resumeCondition)
    ) {
      context.addIssue({
        code: "custom",
        message: "Blocking gaps cannot include deferral metadata",
      });
    }
  });

const provenanceSchema = z
  .object({
    origin: z.enum(landingPageCompositionOrigins),
    proposalSchemaVersion: positiveIntegerSchema,
    model: z.string().trim().min(1).max(200).optional(),
    requestId: z.string().trim().min(8).max(200).optional(),
  })
  .strict()
  .superRefine((provenance, context) => {
    if (
      provenance.origin === "ai_proposal" &&
      (!provenance.model || !provenance.requestId)
    ) {
      context.addIssue({
        code: "custom",
        message: "AI proposals require model and requestId",
      });
    }
    if (
      provenance.origin !== "ai_proposal" &&
      (provenance.model || provenance.requestId)
    ) {
      context.addIssue({
        code: "custom",
        message: "Human provenance cannot claim AI metadata",
      });
    }
  });

export const landingPageCompositionDraftSchema = z
  .object({
    ownerTaxon: taxonSchema,
    version: positiveIntegerSchema,
    status: z.literal("draft"),
    sourceSnapshots: sourceSnapshotsSchema,
    items: z.array(itemSchema),
    gaps: z.array(gapSchema),
    provenance: provenanceSchema,
  })
  .strict();
